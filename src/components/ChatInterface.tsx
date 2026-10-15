'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CHAT, DONE, FINISH } from '@/content/copy';
import type { ChatMessage, ChatResponse, FinishResponse, Gender, SessionResponse } from '@/types';
import ConsentScreen from './ConsentScreen';
import DistressScreen from './DistressScreen';
import MessageBubble from './MessageBubble';

type Stage = 'consent' | 'chat' | 'finish' | 'done' | 'distress';

// ─── Web Speech API Types ───
interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

// ─── Epistemic Clarity Gauge ("מד הבהירות") ───
interface ClarityStage {
  step: number;
  label: string;
}

export function getClarityStage(userTurns: number, isFinishing: boolean): ClarityStage {
  if (isFinishing || userTurns >= 16) {
    return {
      step: 5,
      label: 'יש לי את מה שאני צריך כדי להביא גרסה ראשונה, אני יוצא לעבודה. יש עוד משהו שחשוב שאני אדע?',
    };
  }
  if (userTurns >= 12) {
    return {
      step: 4,
      label: 'אני מחבר את המילים והשירותים',
    };
  }
  if (userTurns >= 7) {
    return {
      step: 3,
      label: 'יש לי את הכיוון והסיפור שלך',
    };
  }
  if (userTurns >= 3) {
    return {
      step: 2,
      label: 'אני מתחיל להבין',
    };
  }
  return {
    step: 1,
    label: 'אנחנו ממש בהתחלה',
  };
}

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

  // Voice transcription state & refs
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isListeningRef = useRef(false);
  const baseTextRef = useRef('');

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep isListeningRef in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Clean up recognition if switching away from chat or unmounting
  useEffect(() => {
    if (stage !== 'chat' && isListeningRef.current) {
      stopListening();
    }
  }, [stage]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  function stopListening() {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  }

  function startListening() {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionConstructor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setNotice('זיהוי קולי אינו נתמך בדפדפן זה. מומלץ להשתמש ב-Chrome או Edge.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognitionConstructor();
      recognition.lang = 'he-IL';
      recognition.continuous = true;
      recognition.interimResults = true;

      // Base input text already in field
      const currentVal = inputRef.current ? inputRef.current.value : input;
      baseTextRef.current = currentVal.trim() ? `${currentVal.trim()} ` : '';

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setNotice('');
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const spoken = (finalTranscript + interimTranscript).trim();
        const updated = baseTextRef.current ? `${baseTextRef.current}${spoken}` : spoken;
        setInput(updated.slice(0, maxChars));
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === 'no-speech') {
          return;
        }
        isListeningRef.current = false;
        setIsListening(false);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setNotice('הגישה למיקרופון לא אושרה. אנא אפשר גישה למיקרופון בהגדרות הדפדפן כדי לדבר.');
        } else if (event.error === 'audio-capture') {
          setNotice('לא נמצא מיקרופון זמין במכשיר שלך.');
        } else if (event.error === 'network') {
          setNotice('שגיאת תקשורת בשירות התמלול הקולי.');
        } else {
          setNotice('התמלול הקולי הופסק. ניתן להמשיך בהקלדה כרגיל.');
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          // If stopped due to silence, smoothly update baseText and continue
          const currentText = inputRef.current ? inputRef.current.value : '';
          baseTextRef.current = currentText.trim() ? `${currentText.trim()} ` : '';
          try {
            recognition.start();
            return;
          } catch {
            isListeningRef.current = false;
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      isListeningRef.current = false;
      setIsListening(false);
      setNotice('לא ניתן היה להפעיל את המיקרופון. אנא נסה שוב או הקלד את תשובתך.');
    }
  }

  function toggleListening() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

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
    stopListening();
    // Drop everything from memory; the distress screen shows none of it.
    setMessages([]);
    setMac('');
    setStage('distress');
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (isListeningRef.current) {
      stopListening();
    }
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

  const userTurnCount = messages.filter((m) => m.role === 'user').length;
  const clarity = getClarityStage(userTurnCount, stage === 'finish' || stage === 'done');
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

      {/* Epistemic Clarity Gauge ("מד הבהירות") */}
      {(stage === 'chat' || stage === 'finish') && (
        <section
          aria-label="מד הבהירות"
          className="px-5 py-3 transition-all duration-300"
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div className="max-w-2xl mx-auto flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--yellow)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--yellow-dark)]" />
                </span>
                <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--navy)' }}>
                  מד הבהירות
                </span>
                <span
                  className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--yellow-light)', color: 'var(--yellow-dark)' }}
                >
                  שלב {clarity.step} מתוך 5
                </span>
              </div>
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((s) => {
                  const isCurrent = s === clarity.step;
                  const isPast = s < clarity.step;
                  return (
                    <span
                      key={s}
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: isCurrent ? '1.75rem' : isPast ? '0.75rem' : '0.5rem',
                        background: isCurrent
                          ? 'var(--yellow)'
                          : isPast
                          ? 'var(--navy)'
                          : 'var(--border)',
                        opacity: isPast ? 0.75 : 1,
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <p
              className="text-xs sm:text-sm font-medium transition-all duration-300 leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {clarity.label}
            </p>
          </div>
        </section>
      )}

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

          {/* Active Voice Recording Status Badge */}
          {isListening && (
            <div className="max-w-2xl mx-auto mb-2.5 flex items-center justify-between px-3.5 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-700 text-xs animate-fade-up">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                </span>
                <span className="font-medium">הקלטה פעילה (עברית) — דבר/י בחופשיות, המילים מופיעות בתיבה</span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="text-xs font-bold underline text-red-800 hover:text-red-950 px-1"
              >
                סיום הקלטה
              </button>
            </div>
          )}

          <form onSubmit={send} className="flex items-end gap-2 max-w-2xl mx-auto">
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
              placeholder={isListening ? 'מקשיב לך עכשיו...' : CHAT.placeholder}
              aria-label={CHAT.placeholder}
              rows={1}
              maxLength={maxChars}
              disabled={loading}
              className="chat-input flex-1 resize-none px-4 py-3 text-[0.95rem] max-h-32"
            />
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={loading}
              className={`mic-btn ${isListening ? 'mic-btn-active' : ''}`}
              aria-label={isListening ? 'עצור הקלטה קולית' : 'הפעל הקלטה קולית'}
              title={isListening ? 'עצור הקלטה קולית' : 'הפעל הקלטה קולית בעברית'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {/* Send Button */}
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
