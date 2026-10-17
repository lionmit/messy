import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { issuePowChallenge, resetForTests, startSession } from '@/lib/interview';
import { CHALLENGE_TTL_MS, MIN_AGE_MS, issueChallenge, powBits, solveChallenge, solves, verifyPow } from '@/lib/pow';
import { RATE } from '@/lib/config';
import { CONSENT } from '@/content/copy';
import { freshIp, tick } from './helpers';
import nextConfig from '../next.config';

const BODY = { consent: true, name: 'נועה', gender: 'f' };
/** Small difficulty so the tests solve in a blink; the default (16) is the production setting. */
const BITS = '8';

function decode(token: string): { nonce: string; iat: number; difficulty: number } {
  return JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'));
}

/** Issues a challenge, solves it and moves the clock past the "too fast" window. */
function solved(): { token: string; counter: number } {
  const { token, difficulty } = issueChallenge();
  const counter = solveChallenge(decode(token).nonce, difficulty);
  tick(MIN_AGE_MS);
  return { token, counter };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-17T10:00:00Z'));
  resetForTests();
  vi.unstubAllEnvs();
  vi.stubEnv('MESSY_POW_BITS', BITS);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('proof-of-work challenge', () => {
  it('reads the difficulty from MESSY_POW_BITS (default 16, 0 off, junk -> default, clamped)', () => {
    expect(powBits({})).toBe(16);
    expect(powBits({ MESSY_POW_BITS: '0' })).toBe(0);
    expect(powBits({ MESSY_POW_BITS: '12' })).toBe(12);
    expect(powBits({ MESSY_POW_BITS: 'abc' })).toBe(16);
    expect(powBits({ MESSY_POW_BITS: '99' })).toBe(32);
    expect(powBits({ MESSY_POW_BITS: '-4' })).toBe(0);
  });

  it('issues a signed token with a 16-byte nonce, the issue time and the difficulty', () => {
    const { token, difficulty } = issueChallenge();
    expect(difficulty).toBe(8);
    const [body, sig] = token.split('.');
    expect(sig).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const payload = decode(body);
    expect(payload.nonce).toMatch(/^[0-9a-f]{32}$/);
    expect(payload.iat).toBe(Date.now());
    expect(payload.difficulty).toBe(8);
  });

  it('issue + solve + verify round trip, and the session starts', async () => {
    const pow = solved();
    expect(solves(decode(pow.token).nonce, pow.counter, 8)).toBe(true);
    const r = await startSession({ ...BODY, pow }, freshIp());
    expect(r.status).toBe(200);
    expect(typeof r.body.token).toBe('string');
  });

  it('missing solution -> 403 pow_required', async () => {
    for (const pow of [undefined, null]) {
      const r = await startSession({ ...BODY, pow }, freshIp());
      expect(r.status, String(pow)).toBe(403);
      expect(r.body).toEqual({ error: 'pow_required' });
    }
  });

  it('expired challenge -> 403 pow_failed', async () => {
    const { token, difficulty } = issueChallenge();
    const counter = solveChallenge(decode(token).nonce, difficulty);
    tick(CHALLENGE_TTL_MS + 1);
    const r = await startSession({ ...BODY, pow: { token, counter } }, freshIp());
    expect(r.status).toBe(403);
    expect(r.body).toEqual({ error: 'pow_failed' });
  });

  it('a solution is accepted once: the second use -> 403 pow_failed', async () => {
    const pow = solved();
    expect((await startSession({ ...BODY, pow }, freshIp())).status).toBe(200);
    const again = await startSession({ ...BODY, pow }, freshIp());
    expect(again.status).toBe(403);
    expect(again.body).toEqual({ error: 'pow_failed' });
  });

  it('wrong counter -> 403 pow_failed, and the nonce stays usable', async () => {
    const pow = solved();
    const { nonce } = decode(pow.token);
    let wrong = pow.counter + 1;
    while (solves(nonce, wrong, 8)) wrong++;
    for (const counter of [wrong, -1, 1.5, '7', null]) {
      const r = await startSession({ ...BODY, pow: { token: pow.token, counter } }, freshIp());
      expect(r.status, String(counter)).toBe(403);
      expect(r.body).toEqual({ error: 'pow_failed' });
    }
    expect((await startSession({ ...BODY, pow }, freshIp())).status).toBe(200);
  });

  it('bad signature or tampered payload -> 403 pow_failed', async () => {
    const pow = solved();
    const [body, sig] = pow.token.split('.');
    const flipped = sig[0] === 'A' ? 'B' : 'A';
    const tamperedBody = Buffer.from(
      JSON.stringify({ ...decode(pow.token), difficulty: 1 }),
      'utf8'
    ).toString('base64url');
    for (const token of [
      `${body}.${flipped}${sig.slice(1)}`,
      `${tamperedBody}.${sig}`,
      body,
      '',
      'x'.repeat(5000),
      42,
    ]) {
      const r = await startSession({ ...BODY, pow: { token, counter: pow.counter } }, freshIp());
      expect(r.status, String(token).slice(0, 20)).toBe(403);
      expect(r.body).toEqual({ error: 'pow_failed' });
    }
  });

  it('a challenge issued at a lower difficulty than the current setting is refused', () => {
    const { token } = issueChallenge({ env: { MESSY_POW_BITS: '4' } });
    const counter = solveChallenge(decode(token).nonce, 4);
    tick(MIN_AGE_MS);
    const check = verifyPow({ token, counter }, { env: { MESSY_POW_BITS: '8' } });
    expect(check).toEqual({ ok: false, reason: 'failed' });
  });

  it('MESSY_POW_BITS=0 disables the check: the session starts without a solution', async () => {
    vi.stubEnv('MESSY_POW_BITS', '0');
    expect(issueChallenge().difficulty).toBe(0);
    const r = await startSession(BODY, freshIp());
    expect(r.status).toBe(200);
  });

  it('runs after the rate limit, consent, name and gender checks', async () => {
    const noConsent = await startSession({ ...BODY, consent: false }, freshIp());
    expect(noConsent.body).toEqual({ error: 'consent_required' });
    const badName = await startSession({ ...BODY, name: '' }, freshIp());
    expect(badName.status).toBe(400);
    expect(badName.body).toMatchObject({ field: 'name' });
    const badGender = await startSession({ ...BODY, gender: 'x' }, freshIp());
    expect(badGender.status).toBe(400);
    expect(badGender.body).toMatchObject({ field: 'gender' });
  });

  it('runs before Turnstile: no Cloudflare call without a solution', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    const f = vi.fn(async () => new Response('{}', { status: 200 }));
    const r = await startSession({ ...BODY, turnstile: 'tok' }, freshIp(), { fetch: f });
    expect(r.body).toEqual({ error: 'pow_required' });
    expect(f).not.toHaveBeenCalled();
  });

  it('GET /api/challenge is rate-limited per IP', () => {
    const ip = freshIp();
    for (let i = 0; i < RATE.challengePerIp.limit; i++) {
      const r = issuePowChallenge(ip);
      expect(r.status).toBe(200);
      expect(r.body).toMatchObject({ difficulty: 8 });
      expect(typeof r.body.token).toBe('string');
    }
    const over = issuePowChallenge(ip);
    expect(over.status).toBe(429);
    expect(over.body).toMatchObject({ error: 'rate_limited' });
    expect(issuePowChallenge(freshIp()).status).toBe(200);
  });

  it('logs event names and codes only, never the token', async () => {
    const logged: unknown[] = [];
    for (const m of ['log', 'info', 'warn', 'error', 'debug'] as const) {
      vi.spyOn(console, m).mockImplementation((...a: unknown[]) => void logged.push(a));
    }
    const pow = solved();
    await startSession({ ...BODY, pow }, freshIp());
    await startSession({ ...BODY, pow }, freshIp());
    await startSession({ ...BODY, pow: { token: pow.token, counter: -1 } }, freshIp());
    const text = JSON.stringify(logged);
    expect(text).toContain('pow.ok');
    expect(text).toContain('pow.failed');
    expect(text).not.toContain(pow.token.slice(0, 20));
    expect(text).not.toContain(decode(pow.token).nonce);
  });
});

describe('honeypot and timing', () => {
  it('a filled `website` field -> 403 human_check_failed, before the PoW check', async () => {
    for (const website of ['https://spam.example', 'x', 0, 1, {}]) {
      const r = await startSession({ ...BODY, website, pow: solved() }, freshIp());
      expect(r.status, String(website)).toBe(403);
      expect(r.body).toEqual({ error: 'human_check_failed' });
    }
    const noPow = await startSession({ ...BODY, website: 'x' }, freshIp());
    expect(noPow.body).toEqual({ error: 'human_check_failed' });
  });

  it('an empty, null or absent `website` field passes', async () => {
    for (const website of ['', null, undefined]) {
      const r = await startSession({ ...BODY, website, pow: solved() }, freshIp());
      expect(r.status, String(website)).toBe(200);
    }
  });

  it('a submission under 3 seconds after the challenge was issued -> 403 human_check_failed', async () => {
    const { token, difficulty } = issueChallenge();
    const counter = solveChallenge(decode(token).nonce, difficulty);
    tick(MIN_AGE_MS - 1);
    const fast = await startSession({ ...BODY, pow: { token, counter } }, freshIp());
    expect(fast.status).toBe(403);
    expect(fast.body).toEqual({ error: 'human_check_failed' });
    // The challenge was consumed; the browser fetches a new one.
    tick(10);
    const retry = await startSession({ ...BODY, pow: { token, counter } }, freshIp());
    expect(retry.body).toEqual({ error: 'pow_failed' });
  });

  it('the copy exists and uses no dashes or dot-forms', () => {
    expect(CONSENT.solving).toBe('רגע, בודקים שזה לא רובוט');
    expect(CONSENT.honeypotLabel).toBe('אל תמלאו שדה זה');
    for (const s of [CONSENT.solving, CONSENT.honeypotLabel]) {
      expect(s).not.toMatch(/[-–—]/);
      expect(s).not.toMatch(/\.[א-ת]/);
    }
  });

  it('CSP lets the start form run its blob: worker', async () => {
    if (typeof nextConfig.headers !== 'function') throw new Error('no headers()');
    const headers = await nextConfig.headers();
    const csp = headers.find((h) => h.source === '/(.*)')?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
    const worker = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('worker-src ')) ?? '';
    expect(worker).toContain('blob:');
  });
});
