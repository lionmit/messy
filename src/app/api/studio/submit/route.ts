import type { NextRequest } from 'next/server';
import { handle } from '@/lib/http';
import { studioSubmit } from '@/lib/studio/submit';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  return handle(request, (body, ip) => studioSubmit(body, ip), 'studio.submit');
}
