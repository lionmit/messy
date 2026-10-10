/**
 * The only logger the server uses.
 *
 * Privacy rule: nothing a person wrote, nothing the model wrote, no name and no
 * email ever reaches the logs. Fields are limited to numbers, booleans and short
 * fixed labels. Strings longer than 40 characters are dropped, and errors are
 * reduced to their class name and HTTP status (some runtime error messages, such
 * as JSON.parse errors, quote the input they failed on).
 */

type Safe = number | boolean | null | undefined;
type Fields = Record<string, Safe | string>;

const LABEL = /^[a-z0-9_.:-]{1,40}$/i;

function clean(fields: Fields = {}): Record<string, Safe | string> {
  const out: Record<string, Safe | string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string') {
      out[k] = LABEL.test(v) ? v : '[dropped]';
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function logEvent(event: string, fields?: Fields): void {
  console.info(`[messy] ${event}`, clean(fields));
}

export function logError(event: string, err: unknown, fields?: Fields): void {
  const e = err as { name?: unknown; status?: unknown } | null;
  console.error(`[messy] ${event}`, {
    ...clean(fields),
    error: typeof e?.name === 'string' && LABEL.test(e.name) ? e.name : 'Error',
    status: typeof e?.status === 'number' ? e.status : undefined,
  });
}
