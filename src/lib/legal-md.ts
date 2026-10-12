/**
 * Reads the small Markdown of the legal texts (src/content/legal.generated.ts) into blocks a page
 * renders. Only what those texts use:
 * - `**כותרת:** X` is the page title;
 * - a bold label ending in a colon (`**פתיחה:**`) is a note for the editor, dropped;
 * - a bold line on its own is a section heading;
 * - `- ` lines are a list, `> ` lines and any other line are paragraphs;
 * - inline: `**bold**`, `⟦a missing detail⟧`, `code` (shown as plain text) and email addresses.
 */
export type Inline = { t: 'text' | 'strong' | 'slot' | 'mail'; v: string };

export type Block =
  | { k: 'h1'; text: string }
  | { k: 'h2'; text: string; id?: string }
  | { k: 'p'; inl: Inline[] }
  | { k: 'ul'; items: Inline[][] };

/** Anchors other pages link to: the footer's "ביטול עסקה" names the cancellation section. */
const IDS: Record<string, string> = { 'ביטול והחזר': 'cancel' };

const TOKEN = /\*\*([^*]+)\*\*|⟦([^⟧]+)⟧|`([^`]+)`|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

export function inline(s: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of s.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ t: 'text', v: s.slice(last, at) });
    if (m[1]) out.push({ t: 'strong', v: m[1] });
    else if (m[2]) out.push({ t: 'slot', v: m[2] });
    else if (m[3]) out.push({ t: 'text', v: m[3] });
    else out.push({ t: 'mail', v: m[4] });
    last = at + m[0].length;
  }
  if (last < s.length) out.push({ t: 'text', v: s.slice(last) });
  return out;
}

export function parseLegal(md: string): Block[] {
  const out: Block[] = [];
  let items: Inline[][] = [];
  const flush = () => {
    if (items.length) out.push({ k: 'ul', items });
    items = [];
  };
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    let m: RegExpMatchArray | null;
    if (!line) {
      flush();
    } else if ((m = line.match(/^\*\*כותרת:\*\*\s*(.+)$/))) {
      flush();
      out.push({ k: 'h1', text: m[1] });
    } else if (/^\*\*[^*]+:\*\*$/.test(line)) {
      flush();
    } else if ((m = line.match(/^\*\*([^*]+)\*\*$/))) {
      flush();
      out.push({ k: 'h2', text: m[1], id: IDS[m[1]] });
    } else if ((m = line.match(/^-\s+(.+)$/))) {
      items.push(inline(m[1]));
    } else {
      flush();
      out.push({ k: 'p', inl: inline(line.replace(/^>\s*/, '')) });
    }
  }
  flush();
  return out;
}
