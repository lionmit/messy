import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetForTests, startSession } from '@/lib/interview';
import { MAX_TOKEN_CHARS, SITEVERIFY_URL, humanCheckEnabled, type FetchLike } from '@/lib/human';
import type { TranscriptMessage } from '@/lib/session';
import { freshIp } from './helpers';
import nextConfig from '../next.config';

const BODY = { consent: true, name: 'נועה', gender: 'f' };
const TOKEN = 'tok_' + 'a'.repeat(40);

function fakeFetch(reply: { status?: number; json?: unknown } | Error) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f: FetchLike = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (reply instanceof Error) throw reply;
    return new Response(reply.json === undefined ? 'oops' : JSON.stringify(reply.json), {
      status: reply.status ?? 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  return { f, calls };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  resetForTests();
  vi.unstubAllEnvs();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('human check (Cloudflare Turnstile) at session start', () => {
  it('is off when TURNSTILE_SECRET_KEY is unset: the session starts without a token and Cloudflare is never called', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    expect(humanCheckEnabled()).toBe(false);
    const { f } = fakeFetch(new Error('must not be called'));
    const r = await startSession(BODY, freshIp(), { fetch: f });
    expect(r.status).toBe(200);
    expect(f).not.toHaveBeenCalled();
  });

  it('secret set, no token -> 403 human_check_required (no network call)', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    const { f } = fakeFetch({ json: { success: true } });
    for (const turnstile of [undefined, '', 42, null]) {
      const r = await startSession({ ...BODY, turnstile }, freshIp(), { fetch: f });
      expect(r.status, String(turnstile)).toBe(403);
      expect(r.body).toEqual({ error: 'human_check_required' });
    }
    expect(f).not.toHaveBeenCalled();
  });

  it('secret set, Cloudflare says success:false -> 403 human_check_failed', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    const { f, calls } = fakeFetch({ json: { success: false, 'error-codes': ['invalid-input-response'] } });
    const ip = freshIp();
    const r = await startSession({ ...BODY, turnstile: TOKEN }, ip, { fetch: f });
    expect(r.status).toBe(403);
    expect(r.body).toEqual({ error: 'human_check_failed' });

    // The verification request: form-encoded secret + response + remoteip, to siteverify.
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SITEVERIFY_URL);
    expect(calls[0].init?.method).toBe('POST');
    const form = new URLSearchParams(String(calls[0].init?.body));
    expect(form.get('secret')).toBe('test-secret');
    expect(form.get('response')).toBe(TOKEN);
    expect(form.get('remoteip')).toBe(ip);
  });

  it('an over-long token is refused without asking Cloudflare', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    const { f } = fakeFetch({ json: { success: true } });
    const r = await startSession({ ...BODY, turnstile: 'a'.repeat(MAX_TOKEN_CHARS + 1) }, freshIp(), { fetch: f });
    expect(r.status).toBe(403);
    expect(r.body).toEqual({ error: 'human_check_failed' });
    expect(f).not.toHaveBeenCalled();
  });

  it('secret set, Cloudflare unreachable or 5xx -> 503 human_check_unavailable (never starts unverified)', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    for (const reply of [new Error('ECONNRESET'), { status: 500, json: { success: true } }, { status: 502 }]) {
      const { f } = fakeFetch(reply);
      const r = await startSession({ ...BODY, turnstile: TOKEN }, freshIp(), { fetch: f });
      expect(r.status).toBe(503);
      expect(r.body).toEqual({ error: 'human_check_unavailable' });
    }
  });

  it('secret set, success:true -> 200 with the usual opening message', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    const { f } = fakeFetch({ json: { success: true, hostname: 'messy.example' } });
    const r = await startSession({ ...BODY, turnstile: TOKEN }, freshIp(), { fetch: f });
    expect(r.status).toBe(200);
    expect(typeof r.body.token).toBe('string');
    const opening = (r.body.messages as TranscriptMessage[])[0].content;
    expect(opening).toContain('נועה');
    expect(opening).toContain('במה את עובדת');
  });

  it('runs after the rate limit and consent checks', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    const { f } = fakeFetch({ json: { success: true } });
    const noConsent = await startSession({ ...BODY, consent: false, turnstile: TOKEN }, freshIp(), { fetch: f });
    expect(noConsent.status).toBe(403);
    expect(noConsent.body).toEqual({ error: 'consent_required' });
    expect(f).not.toHaveBeenCalled();
  });

  it('logs event names and codes only, never the token or the secret', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'super-secret-value');
    const logged: unknown[] = [];
    for (const m of ['log', 'info', 'warn', 'error', 'debug'] as const) {
      vi.spyOn(console, m).mockImplementation((...a: unknown[]) => void logged.push(a));
    }
    const SECRET_TOKEN = 'TOKEN-SECRET-ZZZ-' + 'b'.repeat(30);
    for (const reply of [
      { json: { success: false, 'error-codes': ['timeout-or-duplicate'] } },
      new Error(`boom ${SECRET_TOKEN}`),
      { json: { success: true } },
    ]) {
      const { f } = fakeFetch(reply);
      await startSession({ ...BODY, turnstile: SECRET_TOKEN }, freshIp(), { fetch: f });
    }
    const text = JSON.stringify(logged);
    expect(logged.length).toBeGreaterThan(0);
    expect(text).not.toContain('ZZZ');
    expect(text).not.toContain('super-secret-value');
    expect(text).toContain('human_check.failed');
    expect(text).toContain('human_check.ok');
  });

  it('CSP allows the Turnstile script, iframe and verification calls', async () => {
    if (typeof nextConfig.headers !== 'function') throw new Error('no headers()');
    const headers = await nextConfig.headers();
    const csp = headers.find((h) => h.source === '/(.*)')?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
    const directive = (name: string) => csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(name + ' ')) ?? '';
    for (const name of ['script-src', 'frame-src', 'connect-src']) {
      expect(directive(name), name).toContain('https://challenges.cloudflare.com');
    }
  });
});
