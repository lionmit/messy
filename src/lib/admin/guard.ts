/**
 * Route-level repeat of the middleware check, so /api/admin/* stays closed even
 * if the middleware matcher ever misses it. Returns a response to send, or null
 * when the request may proceed.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { challengeHeaders, checkBasicAuth } from './auth';
import { getAdminBlobApi } from './store';
import type { BlobApi } from '@/lib/storage/blob';

const noStore = { 'Cache-Control': 'no-store' };

export function requireAdmin(request: NextRequest): NextResponse | null {
  const verdict = checkBasicAuth(request.headers.get('authorization'), {
    ADMIN_USER: process.env.ADMIN_USER,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  });
  if (verdict === 'not_configured') return NextResponse.json({ error: 'not_found' }, { status: 404, headers: noStore });
  if (verdict === 'unauthorized') return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: challengeHeaders() });
  return null;
}

/** The store api, or the 503 to send when there is no token. */
export function requireStore(): { api: BlobApi } | { fail: NextResponse } {
  const api = getAdminBlobApi();
  if (!api) return { fail: NextResponse.json({ error: 'no_store' }, { status: 503, headers: noStore }) };
  return { api };
}
