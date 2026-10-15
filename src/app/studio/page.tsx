'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// --- Color Palettes ---
const PALETTES = [
  {
    id: 'sand-sage-terracotta',
    name: 'חול, מרווה וטרקוטה',
    mood: 'נוכחות רגועה, מקרקעת ועוטפת (נוכחי)',
    bg: '#F9F6F0',
    sage: '#5B6E58',
    terracotta: '#B55B3B',
    stone: '#EDE8DF',
  },
  {
    id: 'warm-clay',
    name: 'אדמה חמה וחימר',
    mood: 'חום אימהי, שורשיות ויציבות',
    bg: '#F5EBE1',
    sage: '#4A5B4C',
    terracotta: '#8D5B4C',
    stone: '#E5DACD',
  },
  {
    id: 'linen-water',
    name: 'פשתן ומים עמוקים',
    mood: 'מרחב פתוח, שקט צלול ואוויר לנשימה',
    bg: '#FAF7F2',
    sage: '#4A6B82',
    terracotta: '#D8A47F',
    stone: '#EAE5DC',
  },
];

// --- Font Options ---
const FONTS = [
  {
    id: 'assistant',
    name: 'Assistant',
    tag: 'קריא, נגיש ופתוח',
    desc: 'טיפוגרפיה ישראלית מודרנית עם מרווחי נשימה מעולים',
    sample: 'מרחב שקט ומאט לקשר, להורות ולמשפחה',
  },
  {
    id: 'heebo',
    name: 'Heebo',
    tag: 'ישיר, יציב ומדויק',
    desc: 'נוכחות סמכותית רגועה ובהירה מאוד בנייד',
    sample: 'להחזיר את מה שלא שלך למי שזה שייך',
  },
  {
    id: 'david-libre',
    name: 'David Libre',
    tag: 'קלאסי, עמוק וחם',
    desc: 'נופך ספרותי ורגשי המעניק תחושת עומק ואינטימיות',
    sample: 'ללכת בתוך חוסר הוודאות, בלי להיבהל',
  },
];

// --- Clarity Stages ---
const CLARITY_STAGES = [
  { step: 1, label: 'אנחנו ממש בהתחלה' },
  { step: 2, label: 'אני מתחיל להבין' },
  { step: 3, label: 'יש לי את הכיוון והסיפור שלך' },
  { step: 4, label: 'אני מחבר את המילים והשירותים' },
  { step: 5, label: 'יש לי את מה שאני צריך, אני יוצא לעבודה' },
];

interface ChatMsg {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  type?: 'text' | 'palette-picker' | 'font-picker';
}

export default function StudioPage() {
  // Mobile active tab: 'site' | 'notes' | 'copilot'
  const [mobileTab, setMobileTab] = useState<'site' | 'notes' | 'copilot'>('site');

  // Desktop viewport & tabs
  const [desktopViewport, setDesktopViewport] = useState<'mobile' | 'desktop'>('mobile');
  const [desktopTab, setDesktopTab] = useState<'notes' | 'copilot'>('notes');

  const [siteUrl, setSiteUrl] = useState('https://messy-site-maayan.vercel.app/owner-6c43925ca8a7bb26630d67fc.html');
  const [viewMode, setViewMode] = useState<'owner' | 'public'>('owner');

  // Notes state & localStorage auto-save
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [roundCounter] = useState('סבב 1 מתוך 2 כלולים');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Copilot Chat state
  const [clarityStep, setClarityStep] = useState(3);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'שלום מעין! אני ה-AI Copilot של האתר שלך. עברתי על העיצוב, הפלטה והניסוחים של הקונסטלציה וההדרכה ההורית. מה תרצי לדייק יחד?',
      time: 'עכשיו',
      type: 'text',
    },
    {
      id: '2',
      sender: 'ai',
      text: 'אפשר למשל לבחור גווני צבע חדשים, לבדוק פונט אחר, או לנסח מחדש מקטע ספציפי:',
      time: 'עכשיו',
      type: 'palette-picker',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [selectedPalette, setSelectedPalette] = useState('sand-sage-terracotta');
  const [selectedFont, setSelectedFont] = useState('assistant');

  // Speech recognition
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-load notes from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('messy_studio_notes');
      if (saved) {
        setNotes(saved);
        setSaveStatus('saved');
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-save notes to localStorage on change (debounced)
  useEffect(() => {
    if (!notes) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('messy_studio_notes', notes);
        setSaveStatus('saved');
      } catch {
        // ignore
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [notes]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mobileTab, desktopTab]);

  // Voice Recognition
  const toggleListening = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('זיהוי קולי אינו נתמך בדפדפן זה. מומלץ להשתמש ב-Chrome.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'he-IL';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        if (text) {
          setInputMsg((prev) => (prev ? `${prev} ${text}` : text));
        }
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    const newMsg: ChatMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      time: 'עכשיו',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMsg('');
    setClarityStep((prev) => Math.min(5, prev + 1));

    setTimeout(() => {
      let replyText = 'קלטתי את הבקשה שלך. אני מעדכן את האתר בהתאם ורושם את זה בסבב התיקונים.';
      if (userText.includes('צבע') || userText.includes('פלטה') || userText.includes('גוון')) {
        replyText = 'הנה פלטות הצבעים המתאימות ביותר לעולם הרגשי וההורי שלך. בחרי את זו שמרגישה לך הכי מדויקת:';
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: replyText,
            time: 'עכשיו',
            type: 'palette-picker',
          },
        ]);
        return;
      }
      if (userText.includes('פונט') || userText.includes('כתב') || userText.includes('אותיות')) {
        replyText = 'הנה סגנונות הפונטים בעברית לבחירה:';
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: replyText,
            time: 'עכשיו',
            type: 'font-picker',
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyText,
          time: 'עכשיו',
          type: 'text',
        },
      ]);
    }, 700);
  };

  const handleSelectPalette = (pal: (typeof PALETTES)[0]) => {
    setSelectedPalette(pal.id);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: `בחרתי בפלטת הצבעים: ${pal.name}`,
        time: 'עכשיו',
      },
      {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `מעולה! עדכנתי את השפה הצבעונית ל-${pal.name}. הרקע עבר ל-${pal.bg} עם הדגשות של ${pal.sage} ו-${pal.terracotta}.`,
        time: 'עכשיו',
      },
    ]);
  };

  const handleSelectFont = (f: (typeof FONTS)[0]) => {
    setSelectedFont(f.id);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: `בחרתי בפונט: ${f.name}`,
        time: 'עכשיו',
      },
      {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `מצוין, פונט ${f.name} הוגדר כפונט הראשי של האתר. הטקסטים מוצגים כעת בסגנון ${f.tag}.`,
        time: 'עכשיו',
      },
    ]);
  };

  const handleSubmitRound = () => {
    if (!notes.trim()) {
      alert('נא לכתוב לפחות הערה או דיוק אחד לפני השליחה.');
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage(null);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage('ההערות נשלחו בהצלחה! המערכת החלה בג\'ינרוט הגרסה המעודכנת. תוך רגעים ספורים הגרסה תהיה זמינה.');
      try {
        localStorage.removeItem('messy_studio_notes');
      } catch {
        // ignore
      }
    }, 1500);
  };

  const switchTargetView = (mode: 'owner' | 'public') => {
    setViewMode(mode);
    if (mode === 'owner') {
      setSiteUrl('https://messy-site-maayan.vercel.app/owner-6c43925ca8a7bb26630d67fc.html');
    } else {
      setSiteUrl('https://messy-site-maayan.vercel.app/');
    }
  };

  // Reusable Notes Panel Content
  const renderNotesPanel = () => (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto gap-4">
      {/* Notice Card */}
      <div className="bg-[#F0EBE1] border border-[#DDD5C7] rounded-xl p-3 text-xs text-[#524F48] leading-relaxed">
        <p className="font-semibold text-[#2C332D] mb-1 flex items-center gap-1.5">
          <span>💡</span> איך עובד סבב התיקונים?
        </p>
        כל מה שנכתב כאן נשמר אוטומטית במכשיר. בסיום כתיבת ההערות, לוחצים על{' '}
        <strong className="text-[#2C332D]">שליחה וג&apos;ינרוט גרסה</strong>, והמערכת מעדכנת את האתר.
      </div>

      {/* Main Notes Textarea with Auto-Save */}
      <div className="flex-1 flex flex-col gap-1.5 min-h-[200px]">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="notes-input" className="font-semibold text-[#2C332D]">
            ההערות והדיוקים שלך לגרסה זו:
          </label>
          <span className="text-[11px] text-[#5B6E58] font-medium flex items-center gap-1">
            {saveStatus === 'saving' && 'שומר...'}
            {saveStatus === 'saved' && '✓ נשמר במכשיר'}
          </span>
        </div>
        <textarea
          id="notes-input"
          rows={8}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="כתבו כאן את כל ההערות והדגשים שלכם...
לדוגמה:
1. בפסקה של הקונסטלציה – להדגיש את המעבר מאי-וודאות לרוגע.
2. בשירותים – לחדד שגם הדרכת הורים אישית וגם זוגית אפשריות.
3. להוסיף בשאלות הנפוצות הסבר קצר על מפגש מקוון בזום."
          className="flex-1 w-full bg-white border border-[#D5CDC0] focus:border-[#5B6E58] focus:ring-1 focus:ring-[#5B6E58] rounded-xl p-3 text-sm leading-relaxed text-[#2C332D] resize-none outline-none shadow-sm transition"
        />
      </div>

      {/* Quick Section Checklist */}
      <div className="bg-white border border-[#E0D8CB] rounded-xl p-3 text-xs">
        <p className="font-semibold text-[#2C332D] mb-2">מקטעים מרכזיים לבדיקה:</p>
        <div className="grid grid-cols-2 gap-2 text-[#524F48]">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#5B6E58]" />
            <span>פתיחה (Hero)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#5B6E58]" />
            <span>הסבר הקונסטלציה</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#5B6E58]" />
            <span>מהלך התהליך והעבודה</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#5B6E58]" />
            <span>שתי הדלתות (שירותים)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#5B6E58]" />
            <span>נעים להכיר (אודות)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#5B6E58]" />
            <span>שאלות נפוצות וקשר</span>
          </label>
        </div>
      </div>

      {/* Submit Feedback Notification */}
      {submitMessage && (
        <div className="bg-[#EAF3EA] border border-[#B5D7B5] text-[#2F5E2F] rounded-xl p-3 text-xs leading-relaxed">
          ✓ {submitMessage}
        </div>
      )}

      {/* Submit Action Button */}
      <button
        onClick={handleSubmitRound}
        disabled={isSubmitting}
        className="w-full bg-[#5B6E58] hover:bg-[#4D5E4A] active:scale-[0.99] text-white font-medium py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin">🔄</span> מעבד הערות ומג&apos;נרט גרסה...
          </>
        ) : (
          <>
            <span>🚀</span> שליחה וג&apos;ינרוט גרסה מעודכנת (סבב 1)
          </>
        )}
      </button>
    </div>
  );

  // Reusable Copilot Chat Panel Content
  const renderCopilotPanel = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Epistemic Clarity Gauge */}
      <div className="bg-[#F0EBE1] border-b border-[#DDD5C7] p-2.5 text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-[#2C332D]">מד הבהירות של ה-AI</span>
          <span className="text-[11px] text-[#5B6E58] font-bold">שלב {clarityStep} מתוך 5</span>
        </div>
        <div className="flex gap-1 mb-1">
          {CLARITY_STAGES.map((s) => (
            <div
              key={s.step}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s.step <= clarityStep ? 'bg-[#5B6E58]' : 'bg-[#DCD5C7]'
              }`}
            />
          ))}
        </div>
        <p className="text-[10px] text-[#6A665E] italic">
          &ldquo;{CLARITY_STAGES[clarityStep - 1]?.label}&rdquo;
        </p>
      </div>

      {/* Chat Messages Flow */}
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[92%] text-xs leading-relaxed ${
              m.sender === 'user' ? 'self-start items-start' : 'self-end items-end'
            }`}
          >
            <div
              className={`p-3 rounded-2xl ${
                m.sender === 'user'
                  ? 'bg-[#5B6E58] text-white rounded-br-none'
                  : 'bg-white border border-[#DDD5C7] text-[#2C332D] shadow-sm rounded-bl-none'
              }`}
            >
              <p>{m.text}</p>

              {/* In-Chat Color Palette Picker */}
              {m.type === 'palette-picker' && (
                <div className="mt-2.5 flex flex-col gap-1.5">
                  <p className="font-semibold text-[#2C332D] border-b border-[#EAE3D6] pb-1">
                    בחירת פלטת גוונים:
                  </p>
                  {PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      onClick={() => handleSelectPalette(pal)}
                      className={`p-2 rounded-xl border text-right transition flex items-center justify-between cursor-pointer ${
                        selectedPalette === pal.id
                          ? 'border-[#5B6E58] bg-[#F3EFE7] ring-1 ring-[#5B6E58]'
                          : 'border-[#E0D8CB] bg-white hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs text-[#2C332D]">{pal.name}</p>
                        <p className="text-[10px] text-[#6E6A62]">{pal.mood}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ background: pal.bg }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ background: pal.sage }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ background: pal.terracotta }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* In-Chat Font Picker */}
              {m.type === 'font-picker' && (
                <div className="mt-2.5 flex flex-col gap-1.5">
                  <p className="font-semibold text-[#2C332D] border-b border-[#EAE3D6] pb-1">
                    בחירת פונט מוביל:
                  </p>
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleSelectFont(f)}
                      className={`p-2 rounded-xl border text-right transition cursor-pointer ${
                        selectedFont === f.id
                          ? 'border-[#5B6E58] bg-[#F3EFE7] ring-1 ring-[#5B6E58]'
                          : 'border-[#E0D8CB] bg-white hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-[#2C332D]">{f.name}</span>
                        <span className="text-[10px] text-[#5B6E58] font-medium">{f.tag}</span>
                      </div>
                      <p className="text-[10px] text-[#504C44] italic">&ldquo;{f.sample}&rdquo;</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[9px] text-[#9A968E] mt-0.5 px-1">{m.time}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Bar with Web Speech Mic */}
      <div className="p-2.5 bg-white border-t border-[#E5DFD5]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-xl border transition flex items-center justify-center shrink-0 cursor-pointer ${
              isListening
                ? 'bg-[#E54848] text-white border-[#E54848] animate-pulse'
                : 'bg-[#F4EFE6] text-[#2C332D] border-[#DDD5C7] hover:bg-[#EAE3D6]'
            }`}
            title={isListening ? 'מקליט... לחצו לסיום' : 'דיבור קולי (Web Speech)'}
          >
            <span className="text-sm">🎙️</span>
          </button>

          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder={isListening ? 'מקשיב... דברו חופשי...' : 'כתבו שאלה או דיוק ל-AI...'}
            className="flex-1 bg-[#FAF8F5] border border-[#DDD5C7] focus:border-[#5B6E58] focus:ring-1 focus:ring-[#5B6E58] rounded-xl px-3 py-2 text-xs text-[#2C332D] outline-none transition"
          />

          <button
            type="submit"
            className="bg-[#5B6E58] hover:bg-[#4D5E4A] text-white p-2 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
            title="שלח"
          >
            <span className="text-xs">➤</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="h-[100dvh] w-screen flex flex-col bg-[#F9F6F0] text-[#2C332D] overflow-hidden font-sans">
      {/* ─── Top Global Header ─── */}
      <header className="h-12 border-b border-[#E5DFD5] bg-[#F9F6F0]/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="font-bold tracking-tight text-base sm:text-lg text-[#2C332D]">
            m<span className="text-[#B55B3B]">e</span>ssy <span className="font-normal text-[10px] text-[#5B6E58] border border-[#5B6E58]/30 rounded-full px-1.5 py-0.2 mr-1">Studio</span>
          </Link>
          <span className="text-[#8A8880] text-xs hidden md:inline">| מעין</span>
        </div>

        {/* Top Controls: Compact for Mobile, Extended for Desktop */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Owner vs Public toggle */}
          <div className="flex bg-[#EFE9DF] rounded-lg p-0.5 text-[11px] font-medium">
            <button
              onClick={() => switchTargetView('owner')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                viewMode === 'owner' ? 'bg-white text-[#2C332D] shadow-sm font-semibold' : 'text-[#6E6C65]'
              }`}
            >
              בעלים (✏️)
            </button>
            <button
              onClick={() => switchTargetView('public')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                viewMode === 'public' ? 'bg-white text-[#2C332D] shadow-sm font-semibold' : 'text-[#6E6C65]'
              }`}
            >
              גולשים
            </button>
          </div>

          {/* Desktop Only Viewport Switcher */}
          <div className="hidden lg:flex bg-[#EFE9DF] rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setDesktopViewport('mobile')}
              className={`px-2.5 py-1 flex items-center gap-1 rounded-md transition cursor-pointer ${
                desktopViewport === 'mobile' ? 'bg-[#5B6E58] text-white shadow-sm' : 'text-[#6E6C65]'
              }`}
            >
              <span>📱</span> מובייל
            </button>
            <button
              onClick={() => setDesktopViewport('desktop')}
              className={`px-2.5 py-1 flex items-center gap-1 rounded-md transition cursor-pointer ${
                desktopViewport === 'desktop' ? 'bg-[#5B6E58] text-white shadow-sm' : 'text-[#6E6C65]'
              }`}
            >
              <span>💻</span> דסקטופ
            </button>
          </div>

          {/* Direct Link */}
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] bg-[#EDE8DF] hover:bg-[#E5DFD5] text-[#2C332D] border border-[#DDD5C7] rounded-lg px-2 py-1 transition flex items-center gap-1"
          >
            <span>פתח ↗</span>
          </a>
        </div>
      </header>

      {/* ─── MOBILE VIEW (< lg): Full Screen Tab Bar + Full Screen Panels ─── */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden">
        {/* Mobile Segmented Control Bar */}
        <div className="h-10 bg-[#EDE8DF] border-b border-[#DDD5C7] px-2 flex items-center shrink-0">
          <div className="grid grid-cols-3 w-full bg-[#E2DBD0] p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setMobileTab('site')}
              className={`py-1 rounded-md transition text-center flex items-center justify-center gap-1 cursor-pointer ${
                mobileTab === 'site' ? 'bg-white text-[#2C332D] shadow-sm font-semibold' : 'text-[#6E6C65]'
              }`}
            >
              <span>👁️</span> האתר
            </button>
            <button
              onClick={() => setMobileTab('notes')}
              className={`py-1 rounded-md transition text-center flex items-center justify-center gap-1 cursor-pointer ${
                mobileTab === 'notes' ? 'bg-white text-[#2C332D] shadow-sm font-semibold' : 'text-[#6E6C65]'
              }`}
            >
              <span>📝</span> הערות
            </button>
            <button
              onClick={() => setMobileTab('copilot')}
              className={`py-1 rounded-md transition text-center flex items-center justify-center gap-1 cursor-pointer ${
                mobileTab === 'copilot' ? 'bg-white text-[#2C332D] shadow-sm font-semibold' : 'text-[#6E6C65]'
              }`}
            >
              <span>💬</span> צ&apos;אט AI
            </button>
          </div>
        </div>

        {/* Mobile View Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F9F6F0]">
          {/* TAB 1: SITE (100% full-screen native feel on mobile) */}
          {mobileTab === 'site' && (
            <div className="w-full h-full flex flex-col bg-white">
              <iframe
                ref={iframeRef}
                src={siteUrl}
                title="Website Mobile Preview"
                className="w-full flex-1 border-0"
              />
            </div>
          )}

          {/* TAB 2: NOTES (spacious mobile notes form) */}
          {mobileTab === 'notes' && (
            <div className="w-full h-full flex flex-col bg-[#FAF8F5]">
              <div className="bg-[#F4EFE6] px-4 py-2 border-b border-[#E5DFD5] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#2C332D]">סבב תיקונים והערות</span>
                <span className="text-[11px] text-[#5B6E58] font-bold bg-[#5B6E58]/10 px-2 py-0.5 rounded-full">
                  {roundCounter}
                </span>
              </div>
              {renderNotesPanel()}
            </div>
          )}

          {/* TAB 3: COPILOT (full-screen mobile chat) */}
          {mobileTab === 'copilot' && (
            <div className="w-full h-full flex flex-col bg-[#FAF8F5]">
              {renderCopilotPanel()}
            </div>
          )}
        </div>
      </div>

      {/* ─── DESKTOP VIEW (>= lg): True Side-by-Side Split Screen ─── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Right Canvas: Live Website Preview */}
        <main className="flex-1 bg-[#F2EDE4] p-5 flex flex-col items-center justify-center overflow-hidden relative">
          {desktopViewport === 'mobile' ? (
            /* Mobile iPhone-Style Frame */
            <div className="w-[390px] h-full max-h-[844px] bg-white rounded-[38px] shadow-2xl border-[8px] border-[#34322D] flex flex-col overflow-hidden relative transition-all duration-300">
              <div className="h-6 bg-[#34322D] w-full shrink-0 flex items-center justify-center relative">
                <div className="w-24 h-4 bg-black rounded-full" />
              </div>
              <div className="h-7 bg-[#FAF8F5] border-b border-[#E8E2D6] px-3 flex items-center justify-between text-[11px] text-[#7A7870] shrink-0">
                <span className="flex items-center gap-1">
                  <span className="text-[#5B6E58]">🔒</span> messy-site-maayan.vercel.app
                </span>
                <span className="text-[10px] text-[#A09D94]">{viewMode === 'owner' ? 'Owner Link' : 'Public'}</span>
              </div>
              <iframe
                src={siteUrl}
                title="Website Desktop-in-Mobile Preview"
                className="w-full flex-1 border-0 bg-[#F9F6F0]"
              />
            </div>
          ) : (
            /* Desktop Full-Width Frame */
            <div className="w-full h-full bg-white rounded-xl shadow-xl border border-[#DCD5C7] flex flex-col overflow-hidden transition-all duration-300">
              <div className="h-8 bg-[#EFE9DF] border-b border-[#DCD5C7] px-3 flex items-center gap-2 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#E06A55]" />
                  <div className="w-3 h-3 rounded-full bg-[#E5B54F]" />
                  <div className="w-3 h-3 rounded-full bg-[#6BBF72]" />
                </div>
                <div className="flex-1 max-w-md mx-auto bg-white rounded-md px-3 py-0.5 text-xs text-[#5B6E58] flex items-center gap-1 border border-[#DCD5C7]">
                  <span>🔒</span> {siteUrl}
                </div>
              </div>
              <iframe
                src={siteUrl}
                title="Website Full-Width Preview"
                className="w-full flex-1 border-0 bg-[#F9F6F0]"
              />
            </div>
          )}
        </main>

        {/* Left Aside: Studio Notes & Copilot Panel */}
        <aside className="w-[440px] bg-[#FAF8F5] border-r border-[#E5DFD5] flex flex-col shrink-0 z-20 shadow-lg">
          {/* Header Switcher */}
          <div className="h-12 border-b border-[#E5DFD5] bg-[#F4EFE6] px-4 flex items-center justify-between shrink-0">
            <div className="flex bg-[#E8E2D6] rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setDesktopTab('notes')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                  desktopTab === 'notes' ? 'bg-white text-[#2C332D] shadow-sm font-semibold' : 'text-[#6E6C65]'
                }`}
              >
                <span>📝</span> הערות וסבב תיקונים
              </button>
              <button
                onClick={() => setDesktopTab('copilot')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                  desktopTab === 'copilot' ? 'bg-white text-[#2C332D] shadow-sm font-semibold' : 'text-[#6E6C65]'
                }`}
              >
                <span>💬</span> שיחת דיוק עם AI
              </button>
            </div>
            <span className="text-[11px] text-[#5B6E58] font-semibold bg-[#5B6E58]/10 px-2 py-0.5 rounded-full">
              {roundCounter}
            </span>
          </div>

          {desktopTab === 'notes' ? renderNotesPanel() : renderCopilotPanel()}
        </aside>
      </div>
    </div>
  );
}
