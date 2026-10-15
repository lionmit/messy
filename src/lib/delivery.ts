/**
 * Sends a payload to Lionel's Make webhook, and so to his Google Sheet.
 *
 * Gate: only when VERCEL_ENV === 'production' (and MESSY_DRY_RUN isn't '1').
 * Everywhere else (preview, local, tests) it logs one dry-run line with the
 * payload kind and field count, never the content.
 */
import { deliveryEnabled } from './config';
import { logError, logEvent } from './log';

export type Fetcher = (url: string, init: RequestInit) => Promise<{ ok: boolean; status: number }>;

/** What the webhook receives: an interview document, a distress stop, or a studio review round. */
export type DeliveryKind = 'interview' | 'distress' | 'studio_round';

export async function deliver(
  kind: DeliveryKind,
  payload: Record<string, unknown>,
  fetcher: Fetcher = fetch
): Promise<'sent' | 'dry-run' | 'failed' | 'not-configured'> {
  if (!deliveryEnabled()) {
    logEvent('delivery.dry_run', { kind, fields: Object.keys(payload).length, env: process.env.VERCEL_ENV ?? 'local' });
    return 'dry-run';
  }
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) {
    logEvent('delivery.not_configured', { kind });
    return 'not-configured';
  }
  try {
    const res = await fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // The response body is not logged: it could echo the payload back.
      logEvent('delivery.failed', { kind, status: res.status });
      return 'failed';
    }
    logEvent('delivery.sent', { kind });
    return 'sent';
  } catch (err) {
    logError('delivery.error', err, { kind });
    return 'failed';
  }
}
