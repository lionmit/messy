/**
 * "Verify you are human" check for the start of an interview (Cloudflare Turnstile).
 *
 * Enabled only when TURNSTILE_SECRET_KEY is set. Without it the check is skipped
 * entirely, so previews, local dev and tests behave exactly as before.
 *
 * With the secret set, the browser sends the widget token as `turnstile` and the
 * server verifies it with Cloudflare. A missing token, a failed verification and
 * an unreachable Cloudflare are three different answers; none of them lets an
 * interview start unverified.
 *
 * Logs carry only event names, HTTP status codes and Cloudflare's short error
 * labels (e.g. "timeout-or-duplicate"). The token itself is never logged.
 */
import { logError, logEvent } from './log';

export const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Cloudflare's documented maximum token length. */
export const MAX_TOKEN_CHARS = 2048;
const TIMEOUT_MS = 8000;

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type HumanCheck = { ok: true } | { ok: false; reason: 'required' | 'failed' | 'unavailable' };

export function humanCheckEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.TURNSTILE_SECRET_KEY?.trim());
}

/**
 * Verifies a Turnstile token for the given client IP.
 * `fetchImpl` is injectable so tests never reach the network.
 */
export async function verifyHuman(
  token: unknown,
  ip: string,
  fetchImpl: FetchLike = fetch,
  env: NodeJS.ProcessEnv = process.env
): Promise<HumanCheck> {
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true };

  if (typeof token !== 'string' || token.length === 0) {
    logEvent('human_check.required');
    return { ok: false, reason: 'required' };
  }
  if (token.length > MAX_TOKEN_CHARS) {
    logEvent('human_check.failed', { code: 'token_too_long' });
    return { ok: false, reason: 'failed' };
  }

  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  if (ip && ip !== 'unknown') form.set('remoteip', ip);

  let res: Response;
  try {
    const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(TIMEOUT_MS) : undefined;
    res = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal,
    });
  } catch (err) {
    logError('human_check.unavailable', err);
    return { ok: false, reason: 'unavailable' };
  }

  if (!res.ok) {
    logEvent('human_check.unavailable', { status: res.status });
    return { ok: false, reason: 'unavailable' };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch (err) {
    logError('human_check.unavailable', err, { status: res.status });
    return { ok: false, reason: 'unavailable' };
  }

  const d = (data ?? {}) as { success?: unknown; 'error-codes'?: unknown };
  if (d.success === true) {
    logEvent('human_check.ok');
    return { ok: true };
  }
  const codes = Array.isArray(d['error-codes']) ? d['error-codes'] : [];
  const code = typeof codes[0] === 'string' ? codes[0] : 'none';
  logEvent('human_check.failed', { code });
  return { ok: false, reason: 'failed' };
}
