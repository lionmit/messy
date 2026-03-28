'use client';

import type { MessageRole } from '@/types';
import AudioPlayer from './AudioPlayer';

interface MessageBubbleProps {
  role: MessageRole;
  content: string;
  audioUrl?: string | null;
}

export default function MessageBubble({ role, content, audioUrl }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
          max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-amber-400 text-gray-900 rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }
        `}
      >
        {/* Render content with line breaks preserved */}
        {content.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>
            {line}
          </p>
        ))}

        {audioUrl && <AudioPlayer src={audioUrl} />}
      </div>
    </div>
  );
}
