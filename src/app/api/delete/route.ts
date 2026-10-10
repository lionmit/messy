import type { NextRequest } from 'next/server';
import { handle } from '@/lib/http';
import { deleteRecord } from '@/lib/interview';

export async function POST(request: NextRequest) {
  return handle(request, (body, ip) => deleteRecord(body, ip), 'delete');
}
