import { NextResponse, type NextRequest } from 'next/server';
import { challengeHeaders, checkBasicAuth } from '@/lib/admin/auth';

/**
 * Gate for the admin dashboard: HTTP Basic auth (ADMIN_USER / ADMIN_PASSWORD).
 * 404 while either variable is unset, 401 with a challenge otherwise. No cookies,
 * no session; the browser resends the header on every request.
 */
export function middleware(request: NextRequest) {
  const verdict = checkBasicAuth(request.headers.get('authorization'), {
    ADMIN_USER: process.env.ADMIN_USER,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  });
  if (verdict === 'not_configured') {
    return NextResponse.json({ error: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  if (verdict === 'unauthorized') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: challengeHeaders() });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
