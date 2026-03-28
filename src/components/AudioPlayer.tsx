'use client';

import { useRef, useState } from 'react';

interface AudioPlayerProps {
  src: string;
}

export default function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setIsPlaying(false)}
        preload="none"
      />
      <button
        onClick={togglePlayback}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-400/20 hover:bg-amber-400/30 transition-colors"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isPlaying ? (
          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <span className="text-xs text-gray-400">Audio message</span>
    </div>
  );
}
