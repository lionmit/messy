'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CHAT, DONE, FINISH } from '@/content/copy';
import type { ChatMessage, ChatResponse, FinishResponse, Gender, SessionResponse } from '@/types';
import ConsentScreen from './ConsentScreen';
import DistressScreen from './DistressScreen';
import MessageBubble from './MessageBubble';

type Stage = 'consent' | 'chat' | 'finish' | 'done' | 'distress';

export default function ChatInterface() {
  const [stage, setStage] = useState<Stage>('consent');
  const [person, setPerson] = useState<{ name: string; gender: Gender } | null>(null);
  const [token, setToken] = useState('');
  const [mac, setMac] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [maxChars, setMaxChars] = useState(2000);
  const [maxTurns, setMaxTurns] = useState(30);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [deleteUrl, setDeleteUrl] = useState<string | null>(null);
  const [deleteDemo, setDeleteDemo] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function onStarted(session: SessionResponse, p: { name: string; gender: Gender }) {
    setPerson(p);
    setToken(session.token);
    setMac(session.mac);
    setMessages(session.messages);
    setMaxChars(session.limits.max_user_message_chars);
    setMaxTurns(session.limits.max_user_turns);
    setStage('chat');
  }

  function toDistress() {
    // Drop everything from memory; the distress screen shows none of it.
    setMessages([]);
    setMac('');
    setStage('distress');
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    if (text.length > maxChars) return setNotice(CHAT.tooLong(maxChars));
    const pending: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(pending);
    setInput('');
    setNotice('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, messages: pending, mac }),
      });
      const data = (await res.json()) as ChatResponse;
      if (data.distress) return toDistress();
      if (res.ok && data.message && data.mac) {
        const confirmed: ChatMessage[] = [
          ...messages,
          { role: 'user', content: data.user_message ?? text },
          { role: 'assistant', content: data.message },
        ];
        setMessages(confirmed);
        setMac(data.mac);
        if (data.ready) setStage('finish');
        return;
      }
      // Not accepted: take the message back so it can be sent again.
      setMessages(messages);
      setInput(text);
      if (res.status === 409) setStage('finish');
      else if (res.status === 429) setNotice(CHAT.slowDown);
      else if (data.error === 'too_long') setNotice(CHAT.tooLong(maxChars));
      else setNotice(CHAT.error);
    } catch {
      setMessages(messages);
      setInput(text);
      setNotice(CHAT.error);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function finish(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setNotice('');
    try {
      const res = await fetch('/api/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, messages, mac, email: email.trim() || undefined }),
      });
      const data = (await res.json()) as FinishResponse;
      if (data.distress) return toDistress();
      if (res.ok && data.document) {
        try {
          sessionStorage.setItem('messy-result', JSON.stringify(data.document));
        } catch {
          /* storage unavailable: the page still shows the done state */
        }
        setDeleteUrl(data.delete_url ?? null);
        setDeleteDemo(!!data.delete_is_demo);
        setStage('done');
        return;
      }
      setNotice(data.field === 'email' ? FINISH.emailInvalid : CHAT.error);
    } catch {
      setNotice(CHAT.error);
    } finally {
      setLoading(false);
    }
  }

  const canFinishEarly = messages.some((m) => m.role === 'user') && messages[messages.length - 1]?.role === 'assistant';

  return (
    <div dir="rtl" lang="he" className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
      <header
        className="flex items-center justify-between px-5 py-3"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}
      >
        <Link
          href="/"
          dir="ltr"
          className="font-[family-name:var(--font-space)] text-lg font-bold tracking-tight"
          style={{ color: 'var(--navy)', textDecoration: 'none' }}
        >
          m<span style={{ color: 'var(--yellow)' }}>e</span>ssy
        </Link>
      </header>

      {stage === 'consent' && <ConsentScreen onStarted={onStarted} />}

      {stage === 'distress' && person && <DistressScreen name={person.name} gender={person.gender} />}

      {(stage === 'chat' || stage === 'finish' || stage === 'done') && (
        <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full" aria-live="polite">
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && stage === 'chat' && (
            <div className="flex justify-start mb-3" aria-label="...">
              <div className="px-5 py-3.5 card">
                <div className="flex gap-2">
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {stage === 'chat' && (
        <div className="px-4 py-3" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border-light)' }}>
          {notice && (
            <p role="alert" className="max-w-2xl mx-auto mb-2 text-sm" style={{ color: '#B42318' }}>
              {notice}
            </p>
          )}
          <form onSubmit={send} className="flex items-end gap-2.5 max-w-2xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={CHAT.placeholder}
              aria-label={CHAT.placeholder}
              rows={1}
              maxLength={maxChars}
              disabled={loading}
              className="chat-input flex-1 resize-none px-4 py-3 text-[0.95rem] max-h-32"
            />
            <button type="submit" disabled={loading || !input.trim()} className="send-btn" aria-label={CHAT.send}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </form>
          {canFinishEarly && (
            <div className="max-w-2xl mx-auto mt-2">
              <button type="button" className="text-sm underline" onClick={() => setStage('finish')} disabled={loading}>
                {CHAT.finishNow}
              </button>
            </div>
          )}
        </div>
      )}

      {stage === 'finish' && (
        <form
          onSubmit={finish}
          className="px-5 py-4 space-y-2"
          style={{ background: 'var(--yellow-light)', borderTop: '2px solid var(--yellow)' }}
        >
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="font-semibold" style={{ color: 'var(--navy)' }}>{FINISH.heading}</h2>
            <p>{FINISH.previewQuestion}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{FINISH.emailReason}</p>
            <label htmlFor="email" className="block text-sm font-semibold">{FINISH.emailLabel}</label>
            <input
              id="email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              autoComplete="email"
              className="chat-input w-full px-4 py-2"
            />
            {notice && (
              <p role="alert" className="text-sm" style={{ color: '#B42318' }}>
                {notice}
              </p>
            )}
            <div className="flex items-center gap-4">
              <button type="submit" className="btn-cta" disabled={loading}>
                {loading ? FINISH.working : FINISH.create}
              </button>
              {!loading && messages.filter((m) => m.role === 'user').length < maxTurns && (
                <button type="button" className="text-sm underline" onClick={() => setStage('chat')}>
                  {CHAT.backToChat}
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {stage === 'done' && (
        <div className="px-5 py-4 text-center" style={{ background: 'var(--yellow-light)', borderTop: '2px solid var(--yellow)' }}>
          <p className="font-semibold text-base" style={{ color: 'var(--navy)' }}>{DONE.ready}</p>
          <Link href="/result/view" className="btn-cta" style={{ marginTop: '0.75rem', padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}>
            {DONE.view}
          </Link>
          <p className="mt-3">{DONE.stop}</p>
          {deleteUrl && (
            <p className="mt-2 text-sm">
              <a href={deleteUrl} className="underline">{DONE.deleteLink}</a>
              {deleteDemo && <span style={{ color: 'var(--text-muted)' }}> {DONE.deleteDemoMarker}</span>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
