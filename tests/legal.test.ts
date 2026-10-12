import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONSENT, FOOTER } from '@/content/copy';
import { LEGAL } from '@/content/legal.generated';
import { LIONEL_LINE } from '@/content/support';
import { inline, parseLegal } from '@/lib/legal-md';

const root = resolve(__dirname, '..');
const legalSource = resolve(root, '..', 'messy-sites', 'board', 'legal', '01-texts.md');

describe('legal pages (legal cover v1.1)', () => {
  it('privacy: its title, the §א.1 interim wording, and no promise of deletion that is not built yet', () => {
    const blocks = parseLegal(LEGAL.privacy);
    expect(blocks[0]).toEqual({ k: 'h1', text: 'פרטיות' });
    expect(LEGAL.privacy).toContain('בשלב ההשקה, השיחה והמסמך נשמרים בגיליון פרטי שרק אני ניגש אליו.');
    expect(LEGAL.privacy).not.toContain('השיחה המלאה נמחקת אחרי 90 יום');
    expect(LEGAL.privacy).not.toContain('המסמך נשמר כדי שיהיה זמין בקישור');
    // editor notes and the next section stay out
    expect(LEGAL.privacy).not.toContain('א.1');
    expect(blocks.some((b) => b.k === 'h1' && b.text !== 'פרטיות')).toBe(false);
  });

  it('terms carry the cancellation section the footer points to; accessibility has its title', () => {
    expect(parseLegal(LEGAL.terms)).toContainEqual({ k: 'h2', text: 'ביטול והחזר', id: 'cancel' });
    expect(parseLegal(LEGAL.accessibility)[0]).toEqual({ k: 'h1', text: 'הצהרת נגישות' });
    expect(LEGAL.accessibility).not.toContain('ד.1');
  });

  it('inline: bold, a missing detail, code as plain text, and an email as a link', () => {
    expect(inline('**Anthropic** דרך ⟦פרטי המוכר⟧, `שורה`, lionmit@gmail.com.')).toEqual([
      { t: 'strong', v: 'Anthropic' },
      { t: 'text', v: ' דרך ' },
      { t: 'slot', v: 'פרטי המוכר' },
      { t: 'text', v: ', ' },
      { t: 'text', v: 'שורה' },
      { t: 'text', v: ', ' },
      { t: 'mail', v: 'lionmit@gmail.com' },
      { t: 'text', v: '.' },
    ]);
    // an editor's label line is dropped
    expect(parseLegal('**פתיחה:**\nשורה')).toEqual([{ k: 'p', inl: [{ t: 'text', v: 'שורה' }] }]);
  });

  it('the footer: four links, and "ביטול עסקה" opens an email with that subject', () => {
    expect([FOOTER.privacy, FOOTER.terms, FOOTER.accessibility, FOOTER.cancel]).toEqual([
      'פרטיות',
      'תנאים והחזרים',
      'הצהרת נגישות',
      'ביטול עסקה',
    ]);
    expect(decodeURIComponent(FOOTER.cancelHref)).toBe('mailto:lionmit@gmail.com?subject=ביטול עסקה');
    const layout = readFileSync(resolve(root, 'src/app/layout.tsx'), 'utf8');
    expect(layout).toContain('<html lang="he" dir="rtl"');
    expect(layout).toContain('<LegalFooter />');
  });

  it('reduced motion turns the animations off', () => {
    const css = readFileSync(resolve(root, 'src/app/globals.css'), 'utf8');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration: 0\.01ms/);
  });

  it('the consent screen links to the privacy page instead of a slot', () => {
    expect(CONSENT.privacyLink).toEqual({ label: 'מה נשמר ולכמה זמן', href: '/privacy' });
    expect(CONSENT).not.toHaveProperty('privacyLinkSlot');
  });

  // Runs only where messy-sites sits beside this repo (the PC), so the copies never drift from the legal cover.
  it.skipIf(!existsSync(legalSource))('every legal line here is word for word from 01-texts.md, and the pages are in sync', async () => {
    const src = readFileSync(legalSource, 'utf8').replace(/\r\n/g, '\n');
    for (const line of [CONSENT.ageLine, CONSENT.sensitiveLine, CONSENT.abroadLine, CONSENT.agree, CONSENT.privacyLink.label, LIONEL_LINE.text]) {
      expect(src, line).toContain(line);
    }
    const { buildPages } = await import('../scripts/sync-legal.mjs');
    expect(buildPages(src), 'out of date: run node scripts/sync-legal.mjs').toEqual(LEGAL);
  });
});
