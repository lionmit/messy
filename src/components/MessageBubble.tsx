'use client';

import { cleanForDisplay } from '@/lib/sanitize';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';
  // The server already strips HTML from model output; this is the second layer.
  // React renders it as text either way (never as HTML).
  const text = isUser ? content : cleanForDisplay(content);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 ${isUser ? 'msg-user' : 'msg-assistant'}`}>
      {!isUser && (
        <div
          aria-hidden="true"
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center me-2 mt-1 font-[family-name:var(--font-space)] text-xs font-bold"
          style={{ background: 'var(--yellow-light)', color: 'var(--yellow-dark)' }}
        >
          M
        </div>
      )}
      <div
        dir="auto"
        className="max-w-[78%] px-4 py-3 text-[0.95rem] leading-relaxed"
        style={
          isUser
            ? {
                background: 'var(--yellow)',
                color: 'var(--navy)',
                borderRadius: 20,
                borderEndEndRadius: 6,
                boxShadow: '0 2px 8px rgba(245, 166, 35, 0.2)',
              }
            : {
                background: 'var(--surface)',
                color: 'var(--text)',
                borderRadius: 20,
                borderEndStartRadius: 6,
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-light)',
              }
        }
      >
        {text.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
