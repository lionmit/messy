import { NextResponse, type NextRequest } from 'next/server';
import { LIMITS } from './config';
import { logError } from './log';
import type { Result } from './interview';

/** Reads a JSON body with a size cap. Never logs or echoes the body. */
export async function readJsonBody(request: NextRequest): Promise<{ body: unknown } | { fail: Result }> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > LIMITS.maxBodyBytes) return { fail: { status: 413, body: { error: 'too_large' } } };
  const ct = request.headers.get('content-type') ?? '';
  if (!ct.toLowerCase().startsWith('application/json')) {
    return { fail: { status: 415, body: { error: 'json_only' } } };
  }
  const text = await request.text();
  if (Buffer.byteLength(text, 'utf8') > LIMITS.maxBodyBytes) return { fail: { status: 413, body: { error: 'too_large' } } };
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { fail: { status: 400, body: { error: 'bad_json' } } };
  }
}

export function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim().slice(0, 64);
  return (request.headers.get('x-real-ip') ?? 'unknown').slice(0, 64);
}

export function respond(result: Result): NextResponse {
  return NextResponse.json(result.body, {
    status: result.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function handle(
  request: NextRequest,
  fn: (body: unknown, ip: string) => Promise<Result>,
  event: string
): Promise<NextResponse> {
  try {
    const parsed = await readJsonBody(request);
    if ('fail' in parsed) return respond(parsed.fail);
    return respond(await fn(parsed.body, clientIp(request)));
  } catch (err) {
    logError(`${event}.unhandled`, err);
    return respond({ status: 500, body: { error: 'internal' } });
  }
}
