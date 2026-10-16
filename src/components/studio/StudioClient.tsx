'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { StudioConfig } from '@/lib/studio/config';
import {
  CHIPS,
  STEP_COUNT,
  STUDIO_STEPS,
  initialState,
  openingMessage,
  stepTitle,
  thankYouMessage,
  type StudioState,
} from '@/lib/studio/steps';
import SiteFrame from './SiteFrame';
import {
  getStudioStore,
  storageKey,
  type ChatMsg,
  type Persisted,
} from './store';

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

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export default function StudioClient({ config }: { config: StudioConfig }) {
  const storeKey = storageKey(config.slug);
  const store = getStudioStore(storeKey);
  const persisted = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const [activeTab, setActiveTab] = useState<'site' | 'chat'>('site');
  const [frame, setFrame] = useState<'phone' | 'desktop'>('phone');
  const [view, setView] = useState<'owner' | 'public'>('owner');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Initialize store if empty on client
  useEffect(() => {
    if (!persisted) {
      const initial = openingMessage(config);
      const firstMsg: ChatMsg = {
        id: `msg-${Date.now()}-1`,
        role: 'assistant',
        text: initial.text,
        chips: initial.chips,
      };
      const fresh: Persisted = {
        v: 1,
        slug: config.slug,
        round: config.round,
        messages: [firstMsg],
        state: initialState(),
        submitted: null,
      };
      store.set(fresh);
    }
  }, [persisted, config, store]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [persisted?.messages, loading]);

  const messages = persisted?.messages ?? [];
  const state: StudioState = persisted?.state ?? initialState();
  const currentStep = Math.min(Math.max(state.step, 1), STEP_COUNT);
  const currentUrl = view === 'owner' ? config.ownerUrl : config.publicUrl;
  const isSubmitted = Boolean(persisted?.submitted);

  const updateSession = (newMessages: ChatMsg[], newState: StudioState, submitted = persisted?.submitted ?? null) => {
    store.set({
      v: 1,
      slug: config.slug,
      round: config.round,
      messages: newMessages,
      state: newState,
      submitted,
    });
  };

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading || isSubmitted) return;
    setErrorMsg('');

    // If user selected "זה טוב, אפשר להעלות", mark goLive and submit
    if (trimmed === CHIPS.goLive) {
      const userMsg: ChatMsg = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        text: trimmed,
      };
      const updatedState = { ...state, goLive: true };
      const nextMsgs = [...messages, userMsg];
      updateSession(nextMsgs, updatedState);
      setInput('');
      await handleSubmitRound(updatedState, nextMsgs);
      return;
    }

    // If user clicked "לשלוח את הסבב", submit
    if (trimmed === CHIPS.submit) {
      const userMsg: ChatMsg = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        text: trimmed,
      };
      const nextMsgs = [...messages, userMsg];
      updateSession(nextMsgs, state);
      setInput('');
      await handleSubmitRound(state, nextMsgs);
      return;
    }

    const userMsg: ChatMsg = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: trimmed,
    };
    const nextMsgs = [...messages, userMsg];
    updateSession(nextMsgs, state);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: config.slug,
          messages: nextMsgs.map((m) => ({ role: m.role, text: m.text })),
          state,
        }),
      });

      if (!res.ok) {
        throw new Error(`שגיאת שרת (${res.status})`);
      }

      const data = (await res.json()) as {
        reply: string;
        chips?: string[];
        step: number;
        state: StudioState;
        done?: boolean;
        waPreview?: { number: string; text: string; link: string } | null;
      };

      const assistantMsg: ChatMsg = {
        id: `msg-${Date.now()}-asst`,
        role: 'assistant',
        text: data.reply,
        chips: data.chips,
        waPreview: data.waPreview,
      };

      const finalMsgs = [...nextMsgs, assistantMsg];
      updateSession(finalMsgs, data.state);

      if (data.done) {
        // Step 7 complete: ready to submit
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'חלה שגיאה בתקשורת';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRound = async (submitState: StudioState, currentMsgs: ChatMsg[]) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/studio/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: config.slug,
          round: config.round,
          state: submitState,
          transcript: currentMsgs.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: string };
        if (errJson.error === 'already_sent') {
          setErrorMsg('סבב זה כבר נשלח בעבר.');
        } else {
          throw new Error('שגיאה בשליחת הסבב');
        }
        return;
      }

      const thanksText = thankYouMessage(submitState.goLive === true);
      const thanksMsg: ChatMsg = {
        id: `msg-${Date.now()}-thanks`,
        role: 'assistant',
        text: thanksText,
        kind: 'thanks',
      };
      const finalMsgs = [...currentMsgs, thanksMsg];
      updateSession(finalMsgs, submitState, {
        at: new Date().toISOString(),
        goLive: submitState.goLive === true,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה בשליחת הסבב';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  // Voice recording toggle
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setErrorMsg('הדפדפן אינו תומך בהקלטה קולית');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'he-IL';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setInput((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
        }
      };
      recognition.onerror = () => {
        setIsRecording(false);
      };
      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
      setErrorMsg('לא ניתן להפעיל את המיקרופון');
    }
  };

  const lionelWaLink = config.lionelWhatsapp
    ? `https://wa.me/${config.lionelWhatsapp}?text=${encodeURIComponent(`היי ליונל, אני אחרי סבב הבדיקה של האתר שלי (${config.name}).`)}`
    : null;

  return (
    <div className="flex flex-col h-screen w-full bg-[#FAF8F5] text-[#2C332D] overflow-hidden" dir="rtl">
      {/* ─── Top Bar ─── */}
      <header className="h-14 border-b border-[#E8E2D6] bg-white px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm tracking-tight text-[#2C332D]">MESSY Studio</span>
          <span className="text-[#C4BDB2]">·</span>
          <span className="text-xs text-[#7A7870] font-medium">
            שלב {currentStep} מתוך {STEP_COUNT}: {stepTitle(currentStep)}
          </span>
          {store.isPersistent() && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF2EB] text-[#4A5D47]">
              ✓ נשמר במכשיר
            </span>
          )}
        </div>

        {/* Desktop Controls (≥1024px) */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center bg-[#F4F1EA] p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFrame('phone')}
              className={`px-3 py-1 rounded-md transition-all ${frame === 'phone' ? 'bg-white shadow-xs font-semibold text-[#2C332D]' : 'text-[#7A7870]'}`}
            >
              📱 נייד
            </button>
            <button
              type="button"
              onClick={() => setFrame('desktop')}
              className={`px-3 py-1 rounded-md transition-all ${frame === 'desktop' ? 'bg-white shadow-xs font-semibold text-[#2C332D]' : 'text-[#7A7870]'}`}
            >
              💻 מחשב
            </button>
          </div>

          <div className="flex items-center bg-[#F4F1EA] p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setView('owner')}
              className={`px-3 py-1 rounded-md transition-all ${view === 'owner' ? 'bg-white shadow-xs font-semibold text-[#2C332D]' : 'text-[#7A7870]'}`}
            >
              ✏️ תצוגת בעלים
            </button>
            <button
              type="button"
              onClick={() => setView('public')}
              className={`px-3 py-1 rounded-md transition-all ${view === 'public' ? 'bg-white shadow-xs font-semibold text-[#2C332D]' : 'text-[#7A7870]'}`}
            >
              👁️ תצוגת גולשים
            </button>
          </div>
        </div>

        {/* Mobile Tabs (<1024px) */}
        <div className="flex lg:hidden items-center bg-[#F4F1EA] p-1 rounded-xl text-xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('site')}
            className={`px-3.5 py-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg transition-all ${activeTab === 'site' ? 'bg-white shadow-xs font-semibold text-[#2C332D]' : 'text-[#7A7870]'}`}
          >
            👁️ האתר
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg transition-all ${activeTab === 'chat' ? 'bg-white shadow-xs font-semibold text-[#2C332D]' : 'text-[#7A7870]'}`}
          >
            💬 שיחה
          </button>
        </div>
      </header>

      {/* ─── Main Content Split ─── */}
      <main className="flex-1 flex min-h-0 relative">
        {/* Chat Panel: Desktop left ~40% (order-1 in RTL is right, but flex-row keeps natural order) */}
        <div
          className={`flex flex-col h-full bg-white border-l border-[#E8E2D6] w-full lg:w-[420px] xl:w-[460px] shrink-0 z-10 ${
            activeTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Step Progress Gauge */}
          <div className="px-4 py-2 bg-[#FAF8F5] border-b border-[#E8E2D6] shrink-0">
            <div className="flex justify-between items-center text-xs text-[#7A7870] mb-1.5">
              <span>{STUDIO_STEPS[currentStep - 1].gauge}</span>
              <span className="font-medium text-[#5B6E58]">שלב {currentStep}/7</span>
            </div>
            <div className="w-full bg-[#E8E2D6] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#5B6E58] h-full transition-all duration-300"
                style={{ width: `${(currentStep / STEP_COUNT) * 100}%` }}
              />
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-[#EFE9DF] text-[#2C332D] rounded-bl-xs'
                      : 'bg-[#5B6E58] text-white rounded-br-xs shadow-xs'
                  }`}
                >
                  {m.text}
                </div>

                {/* WhatsApp Visitor Message Preview Card */}
                {m.waPreview && (
                  <div className="mt-2 w-full max-w-[85%] bg-white border border-[#DCD5C7] rounded-xl p-3 shadow-xs text-xs space-y-2">
                    <div className="flex items-center justify-between text-[#7A7870] font-medium border-b border-[#F4F1EA] pb-1.5">
                      <span>ההודעה שתישלח למספר:</span>
                      <span dir="ltr" className="font-semibold text-[#2C332D]">
                        {m.waPreview.number}
                      </span>
                    </div>
                    <div className="bg-[#FAF8F5] p-2.5 rounded-lg text-[#2C332D] italic">
                      &quot;{m.waPreview.text}&quot;
                    </div>
                    <a
                      href={m.waPreview.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#5B6E58] hover:text-[#4A5D47] font-semibold pt-0.5"
                    >
                      <span>📲 בדיקה: פתיחת ההודעה בוואטסאפ שלך</span>
                    </a>
                  </div>
                )}

                {/* Post-submit direct WhatsApp link to Lionel */}
                {m.kind === 'thanks' && lionelWaLink && (
                  <div className="mt-3">
                    <a
                      href={lionelWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-[#20BE5A] transition-all"
                    >
                      <span>💬 פתיחת שיחה עם ליאונל בוואטסאפ</span>
                    </a>
                  </div>
                )}

                {/* Chips */}
                {m.chips && m.chips.length > 0 && !isSubmitted && (
                  <div className="flex flex-wrap gap-2 mt-2.5 max-w-[90%]">
                    {m.chips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleSend(chip)}
                        disabled={loading}
                        className={`text-xs px-3.5 py-2.5 min-h-[44px] inline-flex items-center justify-center rounded-full border transition-all ${
                          chip === CHIPS.goLive
                            ? 'bg-[#C26747] text-white border-[#C26747] hover:bg-[#A9583B] font-medium'
                            : 'bg-white text-[#2C332D] border-[#DCD5C7] hover:border-[#5B6E58] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-end">
                <div className="bg-[#FAF8F5] border border-[#E8E2D6] text-[#7A7870] text-xs px-4 py-2.5 rounded-2xl rounded-br-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#5B6E58] rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-[#5B6E58] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-[#5B6E58] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="px-4 py-2 bg-[#FDF2F0] border-t border-[#F7D8D3] text-xs text-[#B93822] flex items-center justify-between">
              <span>{errorMsg}</span>
              <button type="button" onClick={() => setErrorMsg('')} className="font-bold px-1">
                ✕
              </button>
            </div>
          )}

          {/* Input Controls */}
          {!isSubmitted && (
            <div className="p-3 border-t border-[#E8E2D6] bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-end gap-2"
              >
                <div className="flex-1 relative bg-[#FAF8F5] border border-[#DCD5C7] rounded-xl focus-within:border-[#5B6E58] transition-all">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(input);
                      }
                    }}
                    placeholder="כתבי כאן..."
                    rows={2}
                    className="w-full bg-transparent p-2.5 text-sm resize-none focus:outline-none"
                    disabled={loading}
                  />
                </div>

                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  title={isRecording ? 'הפסקת הקלטה' : 'הקלטה קולית'}
                  className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white border-red-500 animate-pulse'
                      : 'bg-[#FAF8F5] text-[#5B6E58] border-[#DCD5C7] hover:border-[#5B6E58]'
                  }`}
                >
                  🎙️
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-4 py-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-[#5B6E58] text-white rounded-xl text-sm font-semibold hover:bg-[#4A5D47] disabled:opacity-40 transition-all shrink-0"
                >
                  שליחה
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Site Preview Area: Desktop right flex-1 */}
        <div
          className={`flex-1 h-full bg-[#EFE9DF] p-0 sm:p-2 lg:p-6 flex items-center justify-center min-h-0 min-w-0 ${
            activeTab === 'site' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="w-full h-full flex items-center justify-center min-h-0 min-w-[320px]">
            <SiteFrame url={currentUrl} frame={frame} view={view} />
          </div>
        </div>
      </main>
    </div>
  );
}
