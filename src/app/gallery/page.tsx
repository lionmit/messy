import Link from 'next/link';

export const metadata = {
  title: 'Gallery — Messy',
  description: 'See who has found their clarity.',
};

export default function GalleryPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="px-4 py-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="font-[family-name:var(--font-space)] text-2xl font-bold tracking-tighter"
            style={{ color: 'var(--navy)' }}
          >
            m<span style={{ color: 'var(--yellow)' }}>e</span>ssy
          </Link>
          <Link
            href="/interview"
            className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
            style={{ background: 'var(--yellow)', color: 'var(--navy)' }}
          >
            Get yours
          </Link>
        </div>
      </header>

      <main className="px-4 pb-16 max-w-6xl mx-auto text-center py-20">
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight"
          style={{ color: 'var(--navy)' }}
        >
          Gallery{' '}
          <span style={{ color: 'var(--yellow)' }}>Coming Soon</span>
        </h1>
        <p className="mt-4 text-lg max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
          People who went through the Messy conversation and found their voice.
          The first entries are being built now.
        </p>
        <Link
          href="/interview"
          className="inline-block mt-8 px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-[1.02]"
          style={{
            background: 'var(--yellow)',
            color: 'var(--navy)',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.25)',
          }}
        >
          Be the first
        </Link>
      </main>

      <footer className="py-6 text-center" style={{ borderTop: '1px solid var(--border-light)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Built by{' '}
          <a
            href="https://lionelmitelpunkt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            Lionel&apos;s Creative GYM
          </a>
        </p>
      </footer>
    </div>
  );
}
