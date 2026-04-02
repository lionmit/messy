'use client';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={
          isUser
            ? {
                background: 'var(--yellow)',
                color: 'var(--navy)',
                borderBottomRightRadius: '6px',
              }
            : {
                background: 'var(--cream)',
                color: 'var(--text)',
                borderBottomLeftRadius: '6px',
              }
        }
      >
        {content.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
