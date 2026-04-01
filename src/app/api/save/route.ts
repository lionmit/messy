import { NextRequest, NextResponse } from 'next/server';
import type { IdentityDocument, ChatMessage } from '@/types';

interface SaveRequest {
  identity_document: IdentityDocument;
  messages: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('MAKE_WEBHOOK_URL not set — skipping Sheets backup');
      return NextResponse.json({ saved: false, reason: 'no webhook configured' });
    }

    const body: SaveRequest = await request.json();
    const doc = body.identity_document;

    const payload = {
      timestamp: new Date().toISOString(),
      name: doc.name || 'Unknown',
      positioning: doc.positioning_statement || '',
      through_line: doc.through_line || '',
      services_count: doc.services?.length ?? 0,
      message_count: body.messages.length,
      identity_document_json: JSON.stringify(doc),
      conversation: body.messages
        .map((m) => `[${m.role}] ${m.content}`)
        .join('\n---\n'),
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error('Make webhook error:', res.status, await res.text());
      return NextResponse.json({ saved: false, reason: 'webhook failed' });
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error('Save API error:', err);
    return NextResponse.json(
      { saved: false, reason: 'internal error' },
      { status: 500 }
    );
  }
}
