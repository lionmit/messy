import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * POST /api/upload
 * Accepts FormData with file + interview_id.
 * Uploads to Supabase Storage, saves media record, returns { url }.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const interviewId = formData.get('interview_id') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!interviewId) {
      return NextResponse.json({ error: 'No interview_id provided' }, { status: 400 });
    }

    const sb = createServiceClient();

    // Determine media type from MIME
    let mediaType: 'image' | 'audio' | 'document' = 'document';
    if (file.type.startsWith('image/')) mediaType = 'image';
    else if (file.type.startsWith('audio/')) mediaType = 'audio';

    // Generate a safe file path
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${interviewId}/${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await sb.storage
      .from('uploads')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = sb.storage.from('uploads').getPublicUrl(filename);
    const publicUrl = urlData.publicUrl;

    // Save media record
    await sb.from('media').insert({
      interview_id: interviewId,
      url: publicUrl,
      media_type: mediaType,
      label: file.name,
    });

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('Upload API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
