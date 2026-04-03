'use client';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 ${isUser ? 'msg-user' : 'msg-assistant'}`}>
      {!isUser && (
        <div
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-1 font-[family-name:var(--font-space)] text-xs font-bold"
          style={{ background: 'var(--yellow-light)', color: 'var(--yellow-dark)' }}
        >
          M
        </div>
      )}
      <div
        className="max-w-[78%] px-4 py-3 text-[0.95rem] leading-relaxed"
        style={
          isUser
            ? {
                background: 'var(--yellow)',
                color: 'var(--navy)',
                borderRadius: '20px 20px 6px 20px',
                boxShadow: '0 2px 8px rgba(245, 166, 35, 0.2)',
              }
            : {
                background: 'var(--surface)',
                color: 'var(--text)',
                borderRadius: '20px 20px 20px 6px',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-light)',
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
