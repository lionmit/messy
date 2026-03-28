import { createServiceClient } from '@/lib/supabase';
import GalleryGrid from '@/components/GalleryGrid';
import Link from 'next/link';
import type { GalleryEntry } from '@/types';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export const metadata = {
  title: 'Gallery — Messy',
  description: 'See who has found their clarity.',
};

async function getGalleryEntries(): Promise<GalleryEntry[]> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('gallery')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Gallery fetch error:', error);
      return [];
    }

    return (data ?? []) as GalleryEntry[];
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const entries = await getGalleryEntries();

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="px-6 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter text-white">
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

      {/* Content */}
      <main className="px-6 pb-16 max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            From Noise to <span className="text-amber-400">Clarity</span>
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            People who went through the Messy conversation and found their voice.
          </p>
        </div>

        <GalleryGrid entries={entries} />
      </main>

      {/* Footer */}
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
