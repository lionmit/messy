import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/transcribe
 * Accepts audio FormData, sends to OpenAI Whisper, returns { text }.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: 'Transcription not configured' }, { status: 503 });
    }

    // Build form data for OpenAI Whisper API
    const whisperForm = new FormData();
    whisperForm.append('file', audioFile, audioFile.name || 'recording.webm');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('response_format', 'json');

    const whisperResponse = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: whisperForm,
      }
    );

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Whisper API error:', errorText);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 502 });
    }

    const result = await whisperResponse.json();
    return NextResponse.json({ text: result.text });
  } catch (err) {
    console.error('Transcribe API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
