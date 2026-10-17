import type { NextRequest } from 'next/server';
import { handle } from '@/lib/http';
import { purgeRecord } from '@/lib/interview';

/**
 * Operator / pipeline purge: POST {id} with header x-messy-purge-secret.
 * 404 while MESSY_PURGE_SECRET is unset, 403 on a wrong secret.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-messy-purge-secret');
  return handle(request, (body, ip) => purgeRecord(body, ip, secret), 'purge');
}
