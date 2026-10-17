import type { NextRequest } from 'next/server';
import { clientIp, respond } from '@/lib/http';
import { issuePowChallenge } from '@/lib/interview';
import { logError } from '@/lib/log';

export const dynamic = 'force-dynamic';

/** GET /api/challenge: a signed proof-of-work challenge for the start form. */
export async function GET(request: NextRequest) {
  try {
    return respond(issuePowChallenge(clientIp(request)));
  } catch (err) {
    logError('challenge.unhandled', err);
    return respond({ status: 500, body: { error: 'internal' } });
  }
}
