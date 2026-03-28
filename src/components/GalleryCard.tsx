import type { GalleryEntry } from '@/types';

interface GalleryCardProps {
  entry: GalleryEntry;
}

export default function GalleryCard({ entry }: GalleryCardProps) {
  return (
    <a
      href={entry.site_url || '#'}
      target={entry.site_url ? '_blank' : undefined}
      rel={entry.site_url ? 'noopener noreferrer' : undefined}
      className="group block bg-gray-900 rounded-2xl overflow-hidden border border-gray-800
        hover:border-amber-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/10"
    >
      {/* Avatar / placeholder */}
      <div className="aspect-square bg-gray-800 flex items-center justify-center">
        {entry.avatar_url ? (
          <img
            src={entry.avatar_url}
            alt={entry.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl text-gray-600">
            {entry.display_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">
          {entry.display_name}
        </h3>
        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{entry.tagline}</p>
        {entry.profession && (
          <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium
            bg-amber-400/10 text-amber-400 border border-amber-400/20">
            {entry.profession}
          </span>
        )}
      </div>
    </a>
  );
}
