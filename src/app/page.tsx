import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg-warm) 100%)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-[1100px] mx-auto w-full">
        <div
          className="font-[family-name:var(--font-space)] text-xl font-bold tracking-tight"
          style={{ color: 'var(--navy)' }}
        >
          m<span style={{ color: 'var(--yellow)' }}>e</span>ssy
        </div>
        <Link href="/interview" className="btn-cta" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
          Start
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center"
        style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <h1
          className="font-[family-name:var(--font-space)] font-bold tracking-tighter animate-fade-up"
          style={{ color: 'var(--navy)', fontSize: 'clamp(4rem, 12vw, 9rem)', lineHeight: 0.9 }}
        >
          m<span style={{ color: 'var(--yellow)' }}>e</span>ssy
        </h1>

        <p
          className="font-semibold leading-tight"
          style={{
            color: 'var(--navy)',
            fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
            marginTop: '1.25rem',
            maxWidth: '580px',
          }}
        >
          You come in messy.
          <br />
          <span style={{ color: 'var(--yellow-dark)' }}>You leave with clarity.</span>
        </p>

        <p
          className=""
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            lineHeight: 1.65,
            marginTop: '1rem',
            maxWidth: '460px',
          }}
        >
          A conversation that extracts who you really are, what you actually do,
          and how to say it — so your brand finally sounds like you.
        </p>

        <div className="flex flex-col sm:flex-row gap-3" style={{ marginTop: '2rem' }}>
          <Link href="/interview" className="btn-cta">
            Start your session
          </Link>
          <Link href="/gallery" className="btn-outline">
            See the gallery
          </Link>
        </div>
      </main>

      {/* Steps */}
      <section className="px-6 max-w-[900px] mx-auto w-full" style={{ paddingBottom: '3rem' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Talk to Messy', desc: 'A guided conversation that goes deep — not a form.' },
            { step: '02', title: 'Get mirrored', desc: 'Messy synthesizes your through-line and positioning.' },
            { step: '03', title: 'Own your clarity', desc: 'Walk away with a structured identity document.' },
          ].map((item, i) => (
            <div key={item.step} className="card">
              <span
                className="font-[family-name:var(--font-space)] text-xs font-semibold"
                style={{ color: 'var(--teal)' }}
              >
                {item.step}
              </span>
              <h3 className="font-semibold mt-1" style={{ color: 'var(--navy)', fontSize: '1.1rem' }}>
                {item.title}
              </h3>
              <p className="mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
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
