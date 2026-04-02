import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        {/* Logo */}
        <div className="mb-10">
          <h1
            className="font-[family-name:var(--font-space)] text-7xl sm:text-9xl font-bold tracking-tighter"
            style={{ color: 'var(--navy)' }}
          >
            m<span style={{ color: 'var(--yellow)' }}>e</span>ssy
          </h1>
        </div>

        {/* Headline */}
        <p
          className="text-2xl sm:text-4xl font-semibold max-w-2xl leading-tight"
          style={{ color: 'var(--navy)' }}
        >
          You come in messy.
          <br />
          <span style={{ color: 'var(--yellow-hover)' }}>You leave with clarity.</span>
        </p>

        {/* Subheadline */}
        <p
          className="mt-5 text-lg max-w-lg leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          A conversation that extracts who you really are, what you actually do,
          and how to say it — so your brand finally sounds like you.
        </p>

        {/* CTA */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/interview"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full
              font-semibold text-lg transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'var(--yellow)',
              color: 'var(--navy)',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.25)',
            }}
          >
            Start your session
          </Link>
          <Link
            href="/gallery"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full
              font-medium text-lg transition-all duration-200"
            style={{
              border: '1.5px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            See the gallery
          </Link>
        </div>

        {/* How it works */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
          {[
            {
              step: '01',
              title: 'Talk to Messy',
              desc: 'A guided conversation that goes deep — not a form.',
            },
            {
              step: '02',
              title: 'Get mirrored',
              desc: 'Messy synthesizes your through-line and positioning.',
            },
            {
              step: '03',
              title: 'Own your clarity',
              desc: 'Walk away with a structured identity document.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="text-left p-5 rounded-2xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}
            >
              <span
                className="font-[family-name:var(--font-space)] text-sm font-medium"
                style={{ color: 'var(--teal)' }}
              >
                {item.step}
              </span>
              <h3 className="font-semibold mt-1 text-base" style={{ color: 'var(--navy)' }}>
                {item.title}
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center" style={{ borderTop: '1px solid var(--border-light)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Built by{' '}
          <a
            href="https://lionelmitelpunkt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Lionel&apos;s Creative GYM
          </a>
        </p>
      </footer>
    </div>
  );
}
