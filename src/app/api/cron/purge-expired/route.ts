import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { logError, logEvent } from '@/lib/log';
import { getStore } from '@/lib/storage';

export const maxDuration = 60;

const noStore = { 'Cache-Control': 'no-store' };

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get('authorization') ?? '');
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/**
 * Daily cleanup (vercel.json crons, 03:00 UTC). Vercel calls it with
 * `Authorization: Bearer <CRON_SECRET>`; anything else is 401.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: noStore });
  }
  try {
    const purged = await getStore().purgeExpired();
    logEvent('cron.purge_expired', { purged });
    return NextResponse.json({ purged }, { headers: noStore });
  } catch (err) {
    logError('cron.purge_expired_failed', err);
    return NextResponse.json({ error: 'internal' }, { status: 500, headers: noStore });
  }
}
