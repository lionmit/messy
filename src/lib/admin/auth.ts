/**
 * HTTP Basic auth for /admin and /api/admin/*.
 *
 * Runs in the middleware (edge or node) and again in the route handlers, so it
 * uses only web APIs: TextEncoder and atob, no node:crypto. The compare is
 * constant time over the bytes (length differences short-circuit nothing).
 *
 * Both ADMIN_USER and ADMIN_PASSWORD must be set; otherwise the caller answers
 * 404, so a deployment without them exposes nothing.
 */

export const ADMIN_REALM = 'MESSY admin';

export type AuthVerdict = 'not_configured' | 'unauthorized' | 'ok';

export interface AdminEnv {
  ADMIN_USER?: string;
  ADMIN_PASSWORD?: string;
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

function decodeBasic(header: string | null): string | null {
  if (!header) return null;
  const m = /^Basic\s+([A-Za-z0-9+/=]+)\s*$/i.exec(header);
  if (!m) return null;
  try {
    const bin = atob(m[1]);
    // atob gives one char per byte; rebuild the UTF-8 text.
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return null;
  }
}

/** Verdict for one Authorization header against the environment. */
export function checkBasicAuth(header: string | null, env: AdminEnv): AuthVerdict {
  const user = env.ADMIN_USER;
  const password = env.ADMIN_PASSWORD;
  if (!user || !password) return 'not_configured';
  const given = decodeBasic(header);
  if (given === null) return 'unauthorized';
  const enc = new TextEncoder();
  return equalBytes(enc.encode(given), enc.encode(`${user}:${password}`)) ? 'ok' : 'unauthorized';
}

/** The headers a 401 carries so the browser asks for credentials. */
export function challengeHeaders(): Record<string, string> {
  return {
    'WWW-Authenticate': `Basic realm="${ADMIN_REALM}", charset="UTF-8"`,
    'Cache-Control': 'no-store',
  };
}
