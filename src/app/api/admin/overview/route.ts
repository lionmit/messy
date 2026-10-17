import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, requireStore } from '@/lib/admin/guard';
import { buildOverview } from '@/lib/admin/overview';
import { logError } from '@/lib/log';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

/** GET /api/admin/overview: everyone in the store and where they stand. Behind Basic auth. */
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const store = requireStore();
  if ('fail' in store) return store.fail;
  try {
    const overview = await buildOverview(store.api);
    return NextResponse.json(overview, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    logError('admin.overview_failed', err);
    return NextResponse.json({ error: 'internal' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
