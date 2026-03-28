export interface SiteMetadata {
  title: string;
  description: string;
  headings: string[];
  bodyText: string;
  ogImage: string | null;
}

/**
 * Extracts useful metadata from raw HTML.
 * Runs server-side only — no DOM required, uses regex.
 */
export function extractMetadata(html: string): SiteMetadata {
  // Title: <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Meta description
  const descMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );
  const descMatchAlt = html.match(
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i
  );
  const description = (descMatch?.[1] || descMatchAlt?.[1] || '').trim();

  // OG image
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i
  );
  const ogMatchAlt = html.match(
    /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["']/i
  );
  const ogImage = ogMatch?.[1] || ogMatchAlt?.[1] || null;

  // Headings (h1-h3)
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  const headings: string[] = [];
  let hMatch;
  while ((hMatch = headingRegex.exec(html)) !== null) {
    const clean = hMatch[1].replace(/<[^>]+>/g, '').trim();
    if (clean) headings.push(clean);
  }

  // Body text (strip tags, collapse whitespace)
  const bodyHtml = html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Take first 2000 chars for relevance
  const bodyText = bodyHtml.slice(0, 2000);

  return { title, description, headings, bodyText, ogImage };
}
