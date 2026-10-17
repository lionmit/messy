import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, requireStore } from '@/lib/admin/guard';
import { hitCommandLimit, isCommandAction, isSlug, writeCommand } from '@/lib/admin/commands';
import { clientIp, readJsonBody, respond } from '@/lib/http';
import { logError, logEvent } from '@/lib/log';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

/**
 * POST /api/admin/command {action: "release" | "purge" | "paid", slug}
 * Writes pipeline/_commands/<time>-<action>-<slug>.json for the runner. 20 per IP per 10 minutes.
 * The slug is never logged.
 */
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const rl = hitCommandLimit(clientIp(request));
  if (!rl.ok) return respond({ status: 429, body: { error: 'rate_limited', retry_after_ms: rl.retryAfterMs } });
  const store = requireStore();
  if ('fail' in store) return store.fail;
  try {
    const parsed = await readJsonBody(request);
    if ('fail' in parsed) return respond(parsed.fail);
    const body = parsed.body as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') return respond({ status: 400, body: { error: 'invalid', field: 'body' } });
    if (!isCommandAction(body.action)) return respond({ status: 400, body: { error: 'invalid', field: 'action' } });
    if (!isSlug(body.slug)) return respond({ status: 400, body: { error: 'invalid', field: 'slug' } });
    const { file } = await writeCommand(store.api, body.action, body.slug);
    logEvent('admin.command', { action: body.action });
    return NextResponse.json({ ok: true, file }, { headers: noStore });
  } catch (err) {
    logError('admin.command_failed', err);
    return NextResponse.json({ error: 'internal' }, { status: 500, headers: noStore });
  }
}
