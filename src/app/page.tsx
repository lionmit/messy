import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        {/* Logo / wordmark */}
        <div className="mb-12">
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-white">
            m<span className="text-amber-400">e</span>ssy
          </h1>
        </div>

        {/* Headline */}
        <p className="text-2xl sm:text-4xl font-semibold text-white max-w-2xl leading-tight">
          You come in messy.
          <br />
          <span className="text-amber-400">You leave with clarity.</span>
        </p>

        {/* Subheadline */}
        <p className="mt-6 text-gray-400 text-lg max-w-lg leading-relaxed">
          A conversation that extracts who you really are, what you actually do,
          and how to say it — so your brand finally sounds like you.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/interview"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full
              bg-amber-400 hover:bg-amber-300 text-gray-950 font-semibold text-lg
              transition-all duration-200 shadow-lg shadow-amber-400/20
              hover:shadow-amber-300/30 hover:scale-[1.02]"
          >
            Start your session
          </Link>
          <Link
            href="/gallery"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full
              border border-gray-700 hover:border-gray-500 text-gray-300
              font-medium text-lg transition-all duration-200"
          >
            See the gallery
          </Link>
        </div>

        {/* How it works */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl w-full">
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
            <div key={item.step} className="text-left">
              <span className="text-amber-400 text-sm font-mono">{item.step}</span>
              <h3 className="text-white font-semibold mt-1">{item.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-gray-600 text-sm">
          Built by{' '}
          <a
            href="https://lionelmitelpunkt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-amber-400 transition-colors"
          >
            Lionel&apos;s Creative GYM
          </a>
        </p>
      </footer>
    </div>
  );
}
