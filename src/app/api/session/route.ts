import type { NextRequest } from 'next/server';
import { handle } from '@/lib/http';
import { startSession } from '@/lib/interview';

export async function POST(request: NextRequest) {
  return handle(request, (body, ip) => startSession(body, ip), 'session');
}
