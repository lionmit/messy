import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteRecord, finishInterview, resetForTests } from '@/lib/interview';
import { buildInterviewPayload, extractDocumentJson, normalizeDocument } from '@/lib/doc';
import { deliver } from '@/lib/delivery';
import { MemoryStore } from '@/lib/storage';
import { PROMPT_VERSION } from '@/lib/prompt/system';
import { transcriptMac, type TranscriptMessage } from '@/lib/session';
import { freshIp, makeDeps, newSession } from './helpers';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  resetForTests();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

const person = { name: 'דנה', gender: 'f' as const };

describe('document', () => {
  it('accepts documents with and without client_journey', () => {
    const old = normalizeDocument({ before_sentence: 'אני מעצבת' }, person);
    expect(old.client_journey).toEqual({ before: '', after: '', after_tense: '' });
    const withJourney = normalizeDocument(
      { client_journey: { before: 'מגיעים תקועים', after: '<b>מדברים</b> אחרת', after_tense: 'seen' } },
      person
    );
    expect(withJourney.client_journey).toEqual({ before: 'מגיעים תקועים', after: 'מדברים אחרת', after_tense: 'seen' });
    expect(normalizeDocument({ client_journey: 'junk' }, person).client_journey.after_tense).toBe('');
    expect(normalizeDocument({ client_journey: { after_tense: 'bogus' } }, person).client_journey.after_tense).toBe('');
  });

  it('counts offerings when the model names the list "offerings" (the services_count = 0 bug)', () => {
    const doc = normalizeDocument({ offerings: [{ name: 'סדנה' }, 'ליווי עסקי'] }, person);
    expect(doc.services.map((s) => s.name)).toEqual(['סדנה', 'ליווי עסקי']);
    const payload = buildInterviewPayload({ document: doc, transcript: [], email: null, expiresAt: 'x' });
    expect(payload.services_count).toBe(2);
  });

  it('prefers "services" when present and strips HTML and foreign script from every field', () => {
    const doc = normalizeDocument(
      {
        services: [{ name: '<b>ייעוץ</b>', tense: 'wish' }],
        offerings: [{ name: 'ignored' }],
        before_sentence: 'אני <script>x()</script>מעצבת שزזז',
        room: { description: 'חדר קטן', colour: 'ירוק' },
      },
      person
    );
    expect(doc.services).toEqual([{ name: 'ייעוץ', description: '', audience: '', format: '', tense: 'wish' }]);
    expect(doc.before_sentence).toBe('אני מעצבת שזז');
    expect(doc.room).toEqual({ description: 'חדר קטן', color: 'ירוק' });
    expect(doc.name).toBe('דנה');
  });

  it('reads JSON from <identity> tags, also inside a code fence, and returns null when broken', () => {
    expect(extractDocumentJson('<identity>{"a":1}</identity>')).toEqual({ a: 1 });
    expect(extractDocumentJson('<identity>```json\n{"a":1}\n```</identity>')).toEqual({ a: 1 });
    expect(extractDocumentJson('<identity>{"a":</identity>')).toBeNull();
    expect(extractDocumentJson('no tags')).toBeNull();
  });
});

describe('finish, storage and delete', () => {
  async function finishedSession(email?: string) {
    const s = await newSession();
    const history: TranscriptMessage[] = [
      ...s.messages,
      { role: 'user', content: 'מעצבת פנים' },
      { role: 'assistant', content: 'משהו לא להכניס?' },
    ];
    const sid = JSON.parse(Buffer.from(s.token.split('.')[1], 'base64url').toString()).sid;
    const mac = transcriptMac(sid, history);
    const env = makeDeps([
      '<identity>{"before_sentence":"מעצבת פנים","offerings":[{"name":"תכנון"}],"room":{"description":"סטודיו","color":"לבן"}}</identity>',
    ]);
    const r = await finishInterview({ token: s.token, mac, messages: history, email }, freshIp(), env.deps);
    return { r, ...env };
  }

  it('saves server-side with a 90-day expiry and sends the Sheet payload', async () => {
    vi.setSystemTime(new Date('2026-10-10T08:00:00Z'));
    const { r, delivered, store } = await finishedSession('dana@example.com');
    expect(r.status).toBe(200);
    expect(r.body.expires_at).toBe('2027-01-08T08:00:00.000Z');
    const doc = r.body.document as { services: unknown[]; room: { color: string } };
    expect(doc.services).toHaveLength(1);
    expect(doc.room.color).toBe('לבן');

    expect(delivered).toHaveLength(1);
    expect(delivered[0].kind).toBe('interview');
    expect(delivered[0].payload.services_count).toBe(1);
    expect(delivered[0].payload.email).toBe('dana@example.com');
    expect(delivered[0].payload.distress).toBe(false);
    expect(String(delivered[0].payload.conversation)).not.toContain('server_note');

    // Delete link works with the in-memory adapter and is marked as a demo.
    expect(r.body.delete_is_demo).toBe(true);
    const token = String(r.body.delete_url).split('#t=')[1];
    const del = await deleteRecord({ token }, freshIp(), { ...makeDeps().deps, store });
    expect(del.body).toEqual({ deleted: true });
    const again = await deleteRecord({ token }, freshIp(), { ...makeDeps().deps, store });
    expect(again.body).toEqual({ deleted: false });
    expect((await deleteRecord({ token: token + 'x' }, freshIp(), makeDeps().deps)).status).toBe(400);
  });

  it('no email unless the person gives one', async () => {
    const { delivered } = await finishedSession();
    expect(delivered[0].payload.email).toBe('');
  });

  it('a second finish for the same session is refused (no duplicate Sheet row)', async () => {
    const s = await newSession();
    const history: TranscriptMessage[] = [...s.messages, { role: 'user', content: 'א' }, { role: 'assistant', content: 'ב' }];
    const sid = JSON.parse(Buffer.from(s.token.split('.')[1], 'base64url').toString()).sid;
    const mac = transcriptMac(sid, history);
    const { deps } = makeDeps(['<identity>{}</identity>', '<identity>{}</identity>']);
    expect((await finishInterview({ token: s.token, mac, messages: history }, freshIp(), deps)).status).toBe(200);
    expect((await finishInterview({ token: s.token, mac, messages: history }, freshIp(), deps)).status).toBe(409);
  });

  it('memory store expires records after 90 days', async () => {
    const store = new MemoryStore();
    const t0 = new Date('2026-10-10T00:00:00Z');
    const rec = await store.save(
      { sessionId: 's', name: 'א', gender: 'f', email: null, document: normalizeDocument({}, person), transcript: [], promptVersion: PROMPT_VERSION },
      t0
    );
    expect(await store.get(rec.id, new Date('2027-01-07T00:00:00Z'))).not.toBeNull();
    expect(await store.get(rec.id, new Date('2027-01-08T00:00:01Z'))).toBeNull();
  });
});

describe('delivery gate (preview must never reach the production webhook)', () => {
  it('dry-runs outside production and logs no content', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, status: 200 }));
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    for (const env of [undefined, 'preview', 'development']) {
      vi.stubEnv('VERCEL_ENV', env as string);
      vi.stubEnv('MAKE_WEBHOOK_URL', 'https://hook.example/abc');
      expect(await deliver('interview', { conversation: 'SECRET TEXT', name: 'דנה' }, fetcher)).toBe('dry-run');
    }
    expect(fetcher).not.toHaveBeenCalled();
    const logged = JSON.stringify(info.mock.calls);
    expect(logged).not.toContain('SECRET');
    expect(logged).not.toContain('דנה');
    expect(logged).not.toContain('hook.example');
    info.mockRestore();
  });

  it('sends only in production, and MESSY_DRY_RUN=1 still blocks it', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('MAKE_WEBHOOK_URL', 'https://hook.example/abc');
    vi.stubEnv('MESSY_DRY_RUN', '1');
    expect(await deliver('distress', { distress: true, timestamp: 't' }, fetcher)).toBe('dry-run');
    vi.stubEnv('MESSY_DRY_RUN', '');
    expect(await deliver('distress', { distress: true, timestamp: 't' }, fetcher)).toBe('sent');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
