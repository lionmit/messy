import Link from 'next/link';
import { FOOTER } from '@/content/copy';

/** On every page (legal cover v1.1): privacy, terms, accessibility and "ביטול עסקה". Links hold 44 px. */
export default function LegalFooter() {
  const link = 'inline-flex items-center min-h-[44px] underline';
  return (
    <footer lang="he" dir="rtl" className="px-5 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
      <div className="max-w-xl mx-auto flex flex-wrap gap-x-5">
        <Link href="/privacy" className={link}>{FOOTER.privacy}</Link>
        <Link href="/terms" className={link}>{FOOTER.terms}</Link>
        <Link href="/accessibility" className={link}>{FOOTER.accessibility}</Link>
        <a href={FOOTER.cancelHref} className={link}>{FOOTER.cancel}</a>
      </div>
    </footer>
  );
}
