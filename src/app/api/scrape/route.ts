import { NextRequest, NextResponse } from 'next/server';
import { extractMetadata } from '@/lib/scraper';

/**
 * POST /api/scrape
 * Accepts { url }, fetches the page, extracts metadata.
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // Validate URL shape
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only HTTP/HTTPS URLs are supported' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Messy-Bot/1.0 (identity extraction)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${response.status})` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const metadata = extractMetadata(html);

    return NextResponse.json(metadata);
  } catch (err) {
    console.error('Scrape API error:', err);
    return NextResponse.json({ error: 'Failed to scrape URL' }, { status: 500 });
  }
}
