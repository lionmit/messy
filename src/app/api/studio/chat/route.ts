import type { NextRequest } from 'next/server';
import { handle } from '@/lib/http';
import { studioChatTurn } from '@/lib/studio/chat';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return handle(request, (body, ip) => studioChatTurn(body, ip), 'studio.chat');
}
