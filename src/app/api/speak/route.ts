import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/speak
 * Accepts { text }, returns { audio_url } via Captions API TTS.
 * Falls back to null if Captions API is not configured or fails.
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const captionsKey = process.env.CAPTIONS_API_KEY;
    if (!captionsKey) {
      // TTS not configured — graceful fallback
      return NextResponse.json({ audio_url: null });
    }

    const ttsResponse = await fetch('https://api.captions.ai/api/tts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': captionsKey,
      },
      body: JSON.stringify({
        text,
        voice_id: 'default',
        output_format: 'mp3',
      }),
    });

    if (!ttsResponse.ok) {
      console.error('Captions API error:', await ttsResponse.text());
      // Graceful fallback — no audio
      return NextResponse.json({ audio_url: null });
    }

    const result = await ttsResponse.json();
    return NextResponse.json({ audio_url: result.audio_url ?? null });
  } catch (err) {
    console.error('Speak API error:', err);
    // Always return a valid shape — audio is optional
    return NextResponse.json({ audio_url: null });
  }
}
