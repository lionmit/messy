/**
 * Invisible "verify you are human" check with no third-party account:
 * a proof-of-work challenge the browser solves in a Web Worker.
 *
 *   GET  /api/challenge        -> { token, difficulty }
 *   POST /api/session          ... pow: { token, counter } ...
 *
 * The token is `base64url(payload).signature`; the payload holds a random
 * nonce, the issue time (ms) and the difficulty, signed with the same server
 * key the session tokens use. The browser finds a counter such that
 * sha256(nonce + ":" + counter) starts with `difficulty` zero bits.
 *
 * Difficulty comes from MESSY_POW_BITS (default 16; 0 disables the check).
 * A challenge is valid for 10 minutes and is accepted once: used nonces are
 * kept in memory until they expire. On Vercel that set is per instance, so a
 * replay can land on another warm instance; the 10-minute window and the
 * per-IP limits on /api/challenge and /api/session bound what that buys.
 *
 * A submission less than MIN_AGE_MS after the challenge was issued is treated
 * as a bot (a person needs longer than that to read and fill the form).
 *
 * Logs carry event names and short codes only. Tokens are never logged.
 */
import { createHash, randomBytes } from 'node:crypto';
import { logEvent } from './log';
import { safeEqual, sign } from './session';

export const DEFAULT_BITS = 16;
export const MAX_BITS = 32;
export const CHALLENGE_TTL_MS = 10 * 60 * 1000;
/** A form submitted sooner than this after the challenge was issued is a bot. */
export const MIN_AGE_MS = 3000;
export const MAX_POW_TOKEN_CHARS = 600;
const MAX_USED = 50_000;

export interface ChallengePayload {
  nonce: string;
  iat: number;
  difficulty: number;
}

export interface Challenge {
  token: string;
  difficulty: number;
}

export type PowCheck =
  | { ok: true }
  | { ok: false; reason: 'required' | 'failed' | 'too_fast' };

/** process.env or a plain object in tests; only MESSY_POW_BITS is read. */
export type PowEnv = Record<string, string | undefined>;

export interface PowOptions {
  now?: () => number;
  env?: PowEnv;
}

/** Difficulty in bits from the environment. Unset or unparsable -> DEFAULT_BITS, clamped to 0..MAX_BITS. */
export function powBits(env: PowEnv = process.env): number {
  const raw = env.MESSY_POW_BITS?.trim();
  if (raw === undefined || raw === '') return DEFAULT_BITS;
  const n = Number(raw);
  if (!Number.isInteger(n)) return DEFAULT_BITS;
  return Math.min(MAX_BITS, Math.max(0, n));
}

export function powEnabled(env: PowEnv = process.env): boolean {
  return powBits(env) > 0;
}

/** Nonces already accepted on this instance, each with its expiry time. */
const used = new Map<string, number>();

export function resetPowForTests(): void {
  used.clear();
}

function pruneUsed(now: number): void {
  if (used.size < MAX_USED) return;
  for (const [nonce, exp] of used) {
    if (exp <= now) used.delete(nonce);
  }
  while (used.size >= MAX_USED) {
    const oldest = used.keys().next().value;
    if (oldest === undefined) break;
    used.delete(oldest);
  }
}

export function issueChallenge(opts: PowOptions = {}): Challenge {
  const now = opts.now ?? Date.now;
  const payload: ChallengePayload = {
    nonce: randomBytes(16).toString('hex'),
    iat: now(),
    difficulty: powBits(opts.env),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { token: `${body}.${sign('pow', body)}`, difficulty: payload.difficulty };
}

/** Number of leading zero bits in a digest. */
export function leadingZeroBits(digest: Uint8Array): number {
  let bits = 0;
  for (const byte of digest) {
    if (byte === 0) {
      bits += 8;
      continue;
    }
    bits += Math.clz32(byte) - 24;
    break;
  }
  return bits;
}

export function solves(nonce: string, counter: number, difficulty: number): boolean {
  const digest = createHash('sha256').update(`${nonce}:${counter}`).digest();
  return leadingZeroBits(digest) >= difficulty;
}

/** Solves a challenge in Node (tests and tooling; the browser uses a worker). */
export function solveChallenge(nonce: string, difficulty: number): number {
  for (let counter = 0; ; counter++) {
    if (solves(nonce, counter, difficulty)) return counter;
  }
}

function parseToken(token: unknown): ChallengePayload | null {
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_POW_TOKEN_CHARS) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, mac] = parts;
  if (!safeEqual(mac, sign('pow', body))) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  const p = payload as Partial<ChallengePayload> | null;
  if (!p || typeof p !== 'object') return null;
  if (typeof p.nonce !== 'string' || !/^[0-9a-f]{32}$/.test(p.nonce)) return null;
  if (typeof p.iat !== 'number' || !Number.isFinite(p.iat)) return null;
  if (typeof p.difficulty !== 'number' || !Number.isInteger(p.difficulty)) return null;
  return { nonce: p.nonce, iat: p.iat, difficulty: p.difficulty };
}

/**
 * Verifies the `pow` field of a session request. A no-op while MESSY_POW_BITS is 0.
 * Accepts a nonce once; marks it used only when the solution is valid.
 */
export function verifyPow(pow: unknown, opts: PowOptions = {}): PowCheck {
  const env = opts.env ?? process.env;
  const bits = powBits(env);
  if (bits === 0) return { ok: true };
  const now = (opts.now ?? Date.now)();

  if (pow === undefined || pow === null) {
    logEvent('pow.required');
    return { ok: false, reason: 'required' };
  }
  const fail = (code: string): PowCheck => {
    logEvent('pow.failed', { code });
    return { ok: false, reason: 'failed' };
  };
  if (typeof pow !== 'object') return fail('shape');
  const { token, counter } = pow as { token?: unknown; counter?: unknown };
  const payload = parseToken(token);
  if (!payload) return fail('bad_token');
  if (payload.difficulty < bits) return fail('too_easy');
  if (payload.iat > now + 60_000 || now - payload.iat > CHALLENGE_TTL_MS) return fail('expired');
  if (typeof counter !== 'number' || !Number.isInteger(counter) || counter < 0 || counter > Number.MAX_SAFE_INTEGER) {
    return fail('bad_counter');
  }
  if (used.has(payload.nonce)) return fail('used');
  if (!solves(payload.nonce, counter, payload.difficulty)) return fail('wrong');

  pruneUsed(now);
  used.set(payload.nonce, payload.iat + CHALLENGE_TTL_MS);

  if (now - payload.iat < MIN_AGE_MS) {
    logEvent('pow.too_fast');
    return { ok: false, reason: 'too_fast' };
  }
  logEvent('pow.ok');
  return { ok: true };
}
