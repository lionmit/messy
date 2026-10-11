import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { chatTurn, finishInterview, resetForTests, startSession } from '@/lib/interview';
import { AI_LINE_TRUE_TODAY, CONSENT, READING_LINE, priceLine, roomQuestion } from '@/content/copy';
import { SAHAR, ERAN } from '@/content/support';
import { STATIC_SYSTEM_PROMPT, personBlock } from '@/lib/prompt/system';
import { LISTENING_MOVES_STATUS } from '@/lib/prompt/listening-moves';
import { transcriptMac, type TranscriptMessage } from '@/lib/session';
import { freshIp, makeDeps, tick } from './helpers';

const SRC = join(__dirname, '..', 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  resetForTests();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('first screen copy', () => {
  it('shows Q28 verbatim and the AI line that is true today', () => {
    expect(READING_LINE).toBe('ליונל קורא כל שיחה שהסתיימה, כדי לשפר את הכלי');
    expect(CONSENT.readingLine).toContain(READING_LINE);
    expect(CONSENT.aiLine).toBe('שיחה בכתב עם כלי AI שבנה ליונל מיטלפונקט.');
    expect(AI_LINE_TRUE_TODAY).toBe(CONSENT.aiLine);
  });

  it('shows the price from prices.json', () => {
    expect(priceLine()).toBe('השיחה והמסמך בלי עלות. רואים את האתר לפני שמשלמים. להעלות אותו לאוויר: 99 ₪ כולל מע"מ בתשלום אחד, עם שנה של אחסון.');
  });

  it('the launch-gated listening line appears nowhere in src while the moves are candidates', () => {
    expect(LISTENING_MOVES_STATUS).toBe('CANDIDATES_PENDING_LIONEL');
    const gated = 'השאלות בנויות על הדרך שבה אני מקשיב';
    const hits = walk(SRC).filter((f) => readFileSync(f, 'utf8').includes(gated));
    expect(hits).toEqual([]);
    expect(readFileSync(join(SRC, 'lib', 'prompt', 'listening-moves.ts'), 'utf8')).toContain('CANDIDATES. NOT APPROVED.');
  });

  it('room-and-colour question, exact wording per gender, reaches the model', () => {
    expect(roomQuestion('f')).toBe('מה יש בחדר שבו את עובדת, ואיזה צבע יש בו?');
    expect(roomQuestion('m')).toBe('מה יש בחדר שבו אתה עובד, ואיזה צבע יש בו?');
    expect(personBlock('דנה', 'f')).toContain(roomQuestion('f'));
    expect(STATIC_SYSTEM_PROMPT).toContain('room_question');
    expect(STATIC_SYSTEM_PROMPT).toContain('3. What changes for someone after working with them');
    expect(STATIC_SYSTEM_PROMPT).toContain('"client_journey"');
    expect(STATIC_SYSTEM_PROMPT).toContain('8. Consent before the document');
    expect(STATIC_SYSTEM_PROMPT).not.toContain('step 7');
  });

  it('support: ער"ן 1201 first, then the verified סה"ר details', () => {
    expect(ERAN.line).toContain('1201');
    expect(SAHAR.name).toBe('סה"ר · סיוע והקשבה ברשת');
    expect(SAHAR.whatsapp.href).toBe('https://wa.me/972559571399');
    expect(SAHAR.chat.href).toBe('https://sahar.org.il');
  });
});

describe('transcripts stay out of logs', () => {
  it('no console.* call in src outside the logger', () => {
    const offenders = walk(SRC)
      .filter((f) => !f.endsWith(join('lib', 'log.ts')))
      .filter((f) => /console\.(log|info|warn|error|debug)\s*\(/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('a full run (start, chat, retry, model error, finish, distress) logs nothing a person or the model wrote', async () => {
    const logged: unknown[] = [];
    for (const m of ['log', 'info', 'warn', 'error', 'debug'] as const) {
      vi.spyOn(console, m).mockImplementation((...a: unknown[]) => void logged.push(a));
    }
    const NAME = 'זיוה';
    const USER = 'סוד-של-משתמש-XYZ מעצבת';
    const MODEL = 'תשובה-של-מודל-QQQ במה עוד?';
    const EMAIL = 'ziva@example.com';

    const s = await startSession({ consent: true, name: NAME, gender: 'f' }, freshIp());
    const opening = s.body.messages as TranscriptMessage[];
    const token = String(s.body.token);
    const sid = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sid;

    const err = Object.assign(new SyntaxError(`Unexpected token in JSON: "${USER}"`), { status: 500 });
    const { deps } = makeDeps([err]);
    const failed = await chatTurn({ token, mac: s.body.mac, messages: [...opening, { role: 'user', content: USER }] }, freshIp(), deps);
    expect(failed.status).toBe(502);

    tick();
    const ok = makeDeps(['תשובה עם שز תקלה', MODEL]);
    const r = await chatTurn({ token, mac: s.body.mac, messages: [...opening, { role: 'user', content: USER }] }, freshIp(), ok.deps);
    expect(r.status).toBe(200);

    const history: TranscriptMessage[] = [...opening, { role: 'user', content: USER }, { role: 'assistant', content: String(r.body.message) }];
    const fin = makeDeps(['<identity>{"before_sentence":"סוד-של-משתמש-XYZ"}</identity>']);
    const f = await finishInterview({ token, mac: transcriptMac(sid, history), messages: history, email: EMAIL }, freshIp(), fin.deps);
    expect(f.status).toBe(200);

    const s2 = await startSession({ consent: true, name: NAME, gender: 'f' }, freshIp());
    const d = makeDeps();
    await chatTurn(
      { token: s2.body.token, mac: s2.body.mac, messages: [...(s2.body.messages as TranscriptMessage[]), { role: 'user', content: 'אני רוצה למות' }] },
      freshIp(),
      d.deps
    );

    const text = JSON.stringify(logged);
    expect(logged.length).toBeGreaterThan(0);
    for (const secret of [NAME, 'סוד-של-משתמש', 'XYZ', 'QQQ', EMAIL, 'רוצה למות', 'במה את עובדת']) {
      expect(text, secret).not.toContain(secret);
    }
  });
});
