import Link from 'next/link';

export const metadata = {
  title: 'Gallery — Messy',
  description: 'See who has found their clarity.',
};

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="px-6 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter text-white"
          >
            m<span className="text-amber-400">e</span>ssy
          </Link>
          <Link
            href="/interview"
            className="px-5 py-2 rounded-full bg-amber-400 hover:bg-amber-300
              text-gray-950 text-sm font-semibold transition-colors"
          >
            Get yours
          </Link>
        </div>
      </header>

      <main className="px-6 pb-16 max-w-6xl mx-auto text-center py-24">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          Gallery <span className="text-amber-400">Coming Soon</span>
        </h1>
        <p className="text-gray-400 mt-4 text-lg max-w-md mx-auto">
          People who went through the Messy conversation and found their voice.
          The first entries are being built now.
        </p>
        <Link
          href="/interview"
          className="inline-block mt-8 px-8 py-4 rounded-full bg-amber-400 hover:bg-amber-300
            text-gray-950 font-semibold text-lg transition-colors"
        >
          Be the first
        </Link>
      </main>

      <footer className="py-8 text-center border-t border-gray-800/50">
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
