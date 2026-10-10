/**
 * Stateless, HMAC-signed tokens (Node `crypto`, no dependency).
 *
 * 1. Session token: proves the person agreed to the consent checkpoint and fixes
 *    their name and form of address for the whole conversation.
 * 2. Transcript MAC: the server signs the conversation after every reply. The
 *    next request must carry that signature, so a browser can't invent assistant
 *    turns (a prompt-injection route) or reset the turn counter.
 * 3. Delete token: lets the person delete their stored record later.
 *
 * Signing key: SESSION_SECRET if set (32+ chars). Otherwise a key derived from
 * ANTHROPIC_API_KEY with HMAC (the API key itself is never exposed). Otherwise a
 * random per-process key, outside production only.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { LIMITS, isProduction } from './config';

export type Gender = 'f' | 'm';

export interface SessionClaims {
  v: 1;
  sid: string;
  name: string;
  gender: Gender;
  /** Consent version the person agreed to. */
  consent: string;
  iat: number;
  exp: number;
}

export const CONSENT_VERSION = 'c1-2026-10-10';

let devKey: Buffer | null = null;

export function getSigningKey(): Buffer {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return Buffer.from(s, 'utf8');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return createHmac('sha256', apiKey).update('messy-signing-key-v1').digest();
  }
  if (isProduction()) {
    throw new Error('No signing key configured');
  }
  if (!devKey) devKey = randomBytes(32);
  return devKey;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url');
}

function sign(purpose: string, data: string): string {
  return createHmac('sha256', getSigningKey()).update(`${purpose}|${data}`).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function newSessionId(): string {
  return randomBytes(16).toString('hex');
}

export function issueSessionToken(
  input: { name: string; gender: Gender },
  now: number = Date.now()
): { token: string; claims: SessionClaims } {
  const claims: SessionClaims = {
    v: 1,
    sid: newSessionId(),
    name: input.name,
    gender: input.gender,
    consent: CONSENT_VERSION,
    iat: now,
    exp: now + LIMITS.sessionTtlMs,
  };
  const body = b64url(JSON.stringify(claims));
  return { token: `s1.${body}.${sign('session', body)}`, claims };
}

export function verifySessionToken(token: unknown, now: number = Date.now()): SessionClaims | null {
  if (typeof token !== 'string' || token.length > 2000) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 's1') return null;
  const [, body, mac] = parts;
  if (!safeEqual(mac, sign('session', body))) return null;
  let claims: SessionClaims;
  try {
    claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (claims?.v !== 1 || claims.consent !== CONSENT_VERSION) return null;
  if (typeof claims.exp !== 'number' || claims.exp < now) return null;
  if (claims.gender !== 'f' && claims.gender !== 'm') return null;
  if (typeof claims.sid !== 'string' || typeof claims.name !== 'string') return null;
  return claims;
}

export interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function transcriptMac(sid: string, messages: TranscriptMessage[]): string {
  const canonical = JSON.stringify(messages.map((m) => [m.role, m.content]));
  return sign(`transcript:${sid}`, canonical);
}

export function verifyTranscriptMac(sid: string, messages: TranscriptMessage[], mac: unknown): boolean {
  if (typeof mac !== 'string' || mac.length > 200) return false;
  return safeEqual(mac, transcriptMac(sid, messages));
}

export function issueDeleteToken(recordId: string): string {
  const body = b64url(recordId);
  return `d1.${body}.${sign('delete', body)}`;
}

export function verifyDeleteToken(token: unknown): string | null {
  if (typeof token !== 'string' || token.length > 500) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'd1') return null;
  if (!safeEqual(parts[2], sign('delete', parts[1]))) return null;
  return Buffer.from(parts[1], 'base64url').toString('utf8');
}
