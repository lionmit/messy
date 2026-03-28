import { describe, it, expect } from 'vitest';
import { extractMetadata } from '@/lib/scraper';

describe('extractMetadata', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lionel Mitelpunkt — Creative GYM</title>
      <meta name="description" content="Turning noise into clarity through creative workshops.">
      <meta property="og:image" content="https://example.com/og.jpg">
    </head>
    <body>
      <h1>Welcome to the Creative GYM</h1>
      <h2>About Lionel</h2>
      <p>Some body text about the Creative GYM and how it works.</p>
      <h3>Services</h3>
      <p>More text here about services and offerings.</p>
    </body>
    </html>
  `;

  it('extracts the title from <title> tag', () => {
    const meta = extractMetadata(sampleHtml);
    expect(meta.title).toBe('Lionel Mitelpunkt — Creative GYM');
  });

  it('extracts the meta description', () => {
    const meta = extractMetadata(sampleHtml);
    expect(meta.description).toBe('Turning noise into clarity through creative workshops.');
  });

  it('extracts the og:image', () => {
    const meta = extractMetadata(sampleHtml);
    expect(meta.ogImage).toBe('https://example.com/og.jpg');
  });

  it('extracts headings (h1-h3)', () => {
    const meta = extractMetadata(sampleHtml);
    expect(meta.headings).toContain('Welcome to the Creative GYM');
    expect(meta.headings).toContain('About Lionel');
    expect(meta.headings).toContain('Services');
    expect(meta.headings.length).toBe(3);
  });

  it('extracts body text as plain text', () => {
    const meta = extractMetadata(sampleHtml);
    expect(meta.bodyText).toContain('Creative GYM');
    expect(meta.bodyText).toContain('services and offerings');
    // Should not contain HTML tags
    expect(meta.bodyText).not.toContain('<h1>');
    expect(meta.bodyText).not.toContain('<p>');
  });

  it('handles HTML with no meta description', () => {
    const html = '<html><head><title>No Meta</title></head><body>Hello</body></html>';
    const meta = extractMetadata(html);
    expect(meta.title).toBe('No Meta');
    expect(meta.description).toBe('');
  });

  it('handles HTML with no title', () => {
    const html = '<html><head></head><body>Hello</body></html>';
    const meta = extractMetadata(html);
    expect(meta.title).toBe('');
  });

  it('handles HTML with no og:image', () => {
    const html = '<html><head><title>Test</title></head><body>Hello</body></html>';
    const meta = extractMetadata(html);
    expect(meta.ogImage).toBeNull();
  });

  it('handles empty HTML', () => {
    const meta = extractMetadata('');
    expect(meta.title).toBe('');
    expect(meta.description).toBe('');
    expect(meta.headings).toEqual([]);
    expect(meta.ogImage).toBeNull();
  });

  it('strips script and style tags from body text', () => {
    const html = `
      <html><body>
        <script>var x = 1;</script>
        <style>.foo { color: red; }</style>
        <p>Visible content</p>
      </body></html>
    `;
    const meta = extractMetadata(html);
    expect(meta.bodyText).toContain('Visible content');
    expect(meta.bodyText).not.toContain('var x = 1');
    expect(meta.bodyText).not.toContain('.foo');
  });

  it('handles meta description with reversed attribute order', () => {
    const html = `
      <html><head>
        <meta content="Reversed order description" name="description">
      </head><body></body></html>
    `;
    const meta = extractMetadata(html);
    expect(meta.description).toBe('Reversed order description');
  });

  it('handles og:image with reversed attribute order', () => {
    const html = `
      <html><head>
        <meta content="https://example.com/reversed.jpg" property="og:image">
      </head><body></body></html>
    `;
    const meta = extractMetadata(html);
    expect(meta.ogImage).toBe('https://example.com/reversed.jpg');
  });
});
