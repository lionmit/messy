import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chatTurn, finishInterview, resetForTests } from '@/lib/interview';
import { buildDistressPayload, detectDistress } from '@/lib/distress';
import { freshIp, makeDeps, newSession, tick } from './helpers';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  resetForTests();
});
afterEach(() => vi.useRealTimers());

const TRIGGER = 'האמת שאני לא רוצה לחיות יותר';

describe('distress protocol', () => {
  it('keyword hit: the model is never called, the person gets the stop, and the payload holds only a flag and a timestamp', async () => {
    const s = await newSession('f', 'מיכל');
    const { deps, callModel, delivered, store } = makeDeps(['should not be used']);
    const r = await chatTurn(
      { token: s.token, mac: s.mac, messages: [...s.messages, { role: 'user', content: TRIGGER }] },
      freshIp(),
      deps
    );
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ distress: true });
    expect(callModel).not.toHaveBeenCalled();

    expect(delivered).toHaveLength(1);
    expect(delivered[0].kind).toBe('distress');
    expect(Object.keys(delivered[0].payload).sort()).toEqual(['distress', 'timestamp']);
    const wire = JSON.stringify(delivered[0].payload);
    expect(wire).not.toContain('לחיות');
    expect(wire).not.toContain('מיכל');
    expect(wire).not.toContain('במה את עובדת');

    // Automation stops: the same session can't chat or produce a document.
    const sid = JSON.parse(Buffer.from(s.token.split('.')[1], 'base64url').toString()).sid;
    expect(await store.isStopped(sid)).toBe(true);
    tick();
    const again = await chatTurn(
      { token: s.token, mac: s.mac, messages: [...s.messages, { role: 'user', content: 'אפשר להמשיך?' }] },
      freshIp(),
      deps
    );
    expect(again.status).toBe(410);
    expect(callModel).not.toHaveBeenCalled();
    const fin = await finishInterview({ token: s.token, mac: s.mac, messages: s.messages }, freshIp(), deps);
    expect(fin.status).toBe(410);
    expect(delivered.filter((d) => d.kind === 'interview')).toHaveLength(0);
  });

  it('model hit: the model answers <distress/>, its text is discarded, same stop and same minimal payload', async () => {
    const s = await newSession('m', 'יואב');
    const { deps, delivered, callModel } = makeDeps(['<distress/>']);
    const r = await chatTurn(
      { token: s.token, mac: s.mac, messages: [...s.messages, { role: 'user', content: 'הכל נראה לי חסר טעם לאחרונה' }] },
      freshIp(),
      deps
    );
    expect(callModel).toHaveBeenCalledTimes(1);
    expect(r.body).toEqual({ distress: true });
    expect(delivered).toHaveLength(1);
    expect(Object.keys(delivered[0].payload).sort()).toEqual(['distress', 'timestamp']);
  });

  it('a distress message over the length cap still stops the conversation', async () => {
    const s = await newSession();
    const { deps, callModel } = makeDeps();
    const long = 'א'.repeat(3000) + ' אני רוצה למות';
    const r = await chatTurn({ token: s.token, mac: s.mac, messages: [...s.messages, { role: 'user', content: long }] }, freshIp(), deps);
    expect(r.body).toEqual({ distress: true });
    expect(callModel).not.toHaveBeenCalled();
  });

  it('buildDistressPayload has exactly two fields', () => {
    const p = buildDistressPayload(new Date('2026-10-10T10:00:00Z'));
    expect(p).toEqual({ distress: true, timestamp: '2026-10-10T10:00:00.000Z' });
  });

  it('detects clear Hebrew and English signals', () => {
    for (const t of [
      'אני חושבת להתאבד',
      'אין לי סיבה לחיות',
      'בא לי לפגוע בעצמי',
      'לפעמים אני חותכת את עצמי',
      // P1-C1 test run 2026-10-12: layer 1 missed the first one
      'לפעמים אני חושבת שלכולם יהיה יותר קל אם פשוט לא אהיה פה.',
      'לכולם יהיה יותר טוב בלעדיי',
      'אני לא רוצה להיות פה יותר.',
      'אני לא רוצה להיות בחיים',
      'I want to die',
      "I don't want to live anymore",
      'thinking about suicide',
    ]) {
      expect(detectDistress(t), t).toBe(true);
    }
  });

  it('does not fire on everyday Hebrew idioms or work discouragement', () => {
    for (const t of [
      'אני מתה על העבודה שלי',
      'אם לא אענה מהר, תאבד את הלקוח',
      'אני אף פעם לא אמצא לקוחות',
      'נמאס לי מהשיווק',
      'אם לא אהיה פה מחר, אחזור אלייך בערב',
      'אני לא רוצה להיות פה יותר, בהייטק. רוצה לעבור לטיפול',
      'זה מוצר בלעדי שלי',
      // left to layer 2 on purpose: on its own it is usually about the work
      'אין טעם להמשיך עם הקמפיין הזה',
    ]) {
      expect(detectDistress(t), t).toBe(false);
    }
  });
});
