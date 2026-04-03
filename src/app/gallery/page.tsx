import Link from 'next/link';

export const metadata = {
  title: 'Gallery — Messy',
  description: 'See who has found their clarity.',
};

export default function GalleryPage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg-warm) 100%)' }}>
      <nav className="flex items-center justify-between px-6 py-4 max-w-[1100px] mx-auto w-full">
        <Link
          href="/"
          className="font-[family-name:var(--font-space)] text-xl font-bold tracking-tight"
          style={{ color: 'var(--navy)', textDecoration: 'none' }}
        >
          m<span style={{ color: 'var(--yellow)' }}>e</span>ssy
        </Link>
        <Link href="/interview" className="btn-cta" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
          Get yours
        </Link>
      </nav>

      <main className="px-6 max-w-[1100px] mx-auto text-center" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
        <h1 className="font-bold tracking-tight" style={{ color: 'var(--navy)', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
          Gallery <span style={{ color: 'var(--yellow)' }}>Coming Soon</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', marginTop: '1rem', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
          People who went through the Messy conversation and found their voice.
          The first entries are being built now.
        </p>
        <Link href="/interview" className="btn-cta" style={{ marginTop: '2rem', display: 'inline-flex' }}>
          Be the first
        </Link>
      </main>

      <footer className="py-5 text-center" style={{ borderTop: '1px solid var(--border-light)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Built by{' '}
          <a href="https://lionelmitelpunkt.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--text-muted)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
            Lionel&apos;s Creative GYM
          </a>
        </p>
      </footer>
    </div>
  );
}
