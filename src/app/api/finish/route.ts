import type { NextRequest } from 'next/server';
import { handle } from '@/lib/http';
import { finishInterview } from '@/lib/interview';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return handle(request, (body, ip) => finishInterview(body, ip), 'finish');
}
