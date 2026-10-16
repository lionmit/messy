'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type Lang = 'he' | 'en';

export default function LandingPageContent() {
  const [lang, setLang] = useState<Lang>('he');
  const [journeyTab, setJourneyTab] = useState<'before' | 'during' | 'after'>('during');

  const isHe = lang === 'he';

  const t = {
    he: {
      nav: {
        howItWorks: 'איך זה עובד',
        beforeAfter: 'לפני ואחרי',
        aboutLionel: 'על ליונל',
        cta: 'התחלת שיחה',
      },
      hero: {
        badge: '🌿 שיחה קשובה בת 15 דקות · בלי שאלונים יבשים · אתר אישי משלך',
        titlePart1: 'אתה מגיע מבולגן.',
        titlePart2: 'אתה יוצא עם בהירות.',
        desc: 'שיחה אישית וקשובה שמחלצת מתוכך את מה שאתה באמת עושה, את הקול הייחודי שלך ואת הקהל שמחכה לך — והופכת אותם לדף אינטרנט חי, רגוע ונושם שנשמע בדיוק כמוך.',
        primaryCta: 'להתחיל את השיחה (חינם)',
        secondaryCta: 'לראות את התהליך ↓',
        subnote: '🎙️ תמיכה מלאה בהקלטה קולית או בהקלדה · ללא צורך בהכנה מוקדמת',
      },
      journey: {
        eyebrow: 'השינוי שקורה ברבע שעה',
        title: 'מה קורה כשמפסיקים להיאבק במסך ריק?',
        subtitle: 'ההבדל בין הניסיון "לשווק את עצמך" לבין שיחה שמקשיבה לך ומוציאה את מה שכבר קיים בתוכך.',
        tabBefore: '1. לפני השיחה (הבלאגן)',
        tabDuring: '2. במהלך ה-15 דקות (ההקשבה)',
        tabAfter: '3. בסיום התהליך (הבהירות)',
        before: {
          badge: 'לפני: תסכול, עומס ומחסום כתיבה',
          title: 'לשבת שעות מול מסך ריק ולא לדעת מאיפה להתחיל',
          points: [
            'תחושה שקשה להסביר במילים פשוטות את העומק של מה שאתה עושה',
            'טקסטים שיווקיים מנופחים מ-AI שנשמעים כמו כולם ומעוררים רתיעה',
            'פרויקטים של בניית אתר שנגררים חודשים ארוכים ועולים אלפי שקלים',
            'התלבטות בלתי נגמרת לגבי הגדרת שירותים, מחירים וקהל יעד',
          ],
        },
        during: {
          badge: 'התהליך: שיחה אישית וקשובה',
          title: 'רבע שעה של שיחה נעימה בקצב שלך, בקול או בכתיבה',
          points: [
            'בלי שאלונים מנוכרים: שיחה אינטליגנטית אחת על אחת שמתקדמת איתך',
            'דיבור חופשי: פשוט לוחצים על המיקרופון ומספרים על העשייה כמו לחבר',
            'מד בהירות חי: רואים בזמן אמת איך הנקודות מתחברות שלב אחר שלב',
            'אפס מאמץ טכני: המערכת מחברת את הסיפור, השירותים והניואנסים',
          ],
        },
        after: {
          badge: 'אחרי: אתר אישי ודף עריכה חי',
          title: 'דף אינטרנט רגוע ואותנטי, ומסמך זהות מדויק',
          points: [
            'דף נחיתה מעוצב ברמה הגבוהה ביותר (סגנון נורדי-יפני שקט ונושם)',
            'טקסטים שמבוססים 100% על המילים המקוריות שלך — בלי קלישאות',
            'דף בעלים פרטי (Owner) המאפשר עריכה ישירה, החלפת צבעים ושיחה משלימה',
            'מילים שמדברות ישירות לאנשים הנכונים שרוצים לעבוד דווקא איתך',
          ],
        },
      },
      about: {
        eyebrow: 'מאחורי המערכת',
        title: 'נעים להכיר, אני ליונל',
        role: 'יוצר MESSY & מייסד Lionel’s Creative GYM',
        bio1: 'במשך שנים פגשתי עצמאיים, מטפלים, יוצרים ואנשי מקצוע מעולים שנתקעו באותו המקום בדיוק: ברגע שהם צריכים לכתוב אתר או "לשווק את עצמם", הכל הופך למאולץ, מלאכותי ומעיק.',
        bio2: 'רוב פתרונות ה-AI הקיימים רק מחמירים את הבעיה — הם ממלאים את המסך בקלישאות שיווקיות וטקסטים גנריים שאף אדם אמיתי לא היה אומר בקול רם.',
        bio3: 'בניתי את MESSY מתוך אמונה פשוטה: אתה לא צריך להמציא את עצמך מחדש, צריך רק להקשיב לך באמת. כשנותנים לאדם מרחב בטוח ושקט לדבר בו — בלי לחץ ובלי מילים גבוהות — המילים הנכונות כבר נמצאות שם.',
        signature: 'ליונל מיטלפונקט',
      },
      steps: {
        title: 'שלושה צעדים פשוטים',
        s1Title: '1. שיחה אישית',
        s1Desc: 'כ-15 דקות של שיחה חמה. אפשר להקליט בקול או להקליד, בכל מקום ובכל מכשיר.',
        s2Title: '2. זיקוק וסדר',
        s2Desc: 'המערכת מחלצת את המהות, הקהל והשירותים שלך מתוך המילים שלך בלבד.',
        s3Title: '3. האתר שלך באוויר',
        s3Desc: 'אתה מקבל אתר אישי מעוצב וקישור סודי לעריכה וסקירה בנחת.',
      },
      ctaBox: {
        title: 'מוכן לראות איך העשייה שלך נשמעת כשהיא מדויקת?',
        desc: 'זה לוקח כ-15 דקות, לא דורש שום הכנה, ואפשר להתחיל עכשיו.',
        btn: 'להתחלת השיחה עכשיו 🎙️',
      },
    },
    en: {
      nav: {
        howItWorks: 'How it works',
        beforeAfter: 'Before & After',
        aboutLionel: 'About Lionel',
        cta: 'Start Conversation',
      },
      hero: {
        badge: '🌿 A calm 15-minute conversation · No dry forms · A living personal site',
        titlePart1: 'You come in messy.',
        titlePart2: 'You leave with clarity.',
        desc: 'A calm, attentive conversation that extracts who you truly are, your authentic voice, and the people waiting for your work — turning it into a living, serene personal website that finally sounds like you.',
        primaryCta: 'Start your session (Free)',
        secondaryCta: 'See the process ↓',
        subnote: '🎙️ Full voice recording or typing support · No preparation needed',
      },
      journey: {
        eyebrow: 'The 15-minute transformation',
        title: 'What happens when you stop fighting the blank screen?',
        subtitle: 'The shift from struggling to "market yourself" to a gentle conversation that extracts what already exists inside you.',
        tabBefore: '1. Before (The Noise)',
        tabDuring: '2. During (The Conversation)',
        tabAfter: '3. After (The Clarity)',
        before: {
          badge: 'Before: Overwhelm and writer’s block',
          title: 'Staring at a blank screen, not knowing where to begin',
          points: [
            'Struggling to put the true depth of what you do into clear words',
            'Overly polished, generic AI text that feels phony and disconnected',
            'Website projects dragging on for months costing thousands of dollars',
            'Endless paralysis over packages, pricing, and positioning',
          ],
        },
        during: {
          badge: 'The Process: Attentive 1:1 conversation',
          title: '15 minutes of calm dialogue at your own natural pace',
          points: [
            'Zero cold forms: an intelligent, gentle conversation that follows your flow',
            'Speak freely: simply tap the microphone and speak as if chatting with a peer',
            'Live clarity gauge: watch the pieces come together step by step',
            'Zero technical friction: story, services, and nuances organized seamlessly',
          ],
        },
        after: {
          badge: 'After: A personal site & live editor',
          title: 'A serene, authentic website and a structured identity document',
          points: [
            'A high-end editorial site (calm Nordic-Japanese minimalist design)',
            '100% grounded in your original words — no corporate jargon or fake urgency',
            'A private Owner page for live text edits, custom color palettes, and finishing touches',
            'Copy that speaks directly to the right clients who want to work with you',
          ],
        },
      },
      about: {
        eyebrow: 'Behind the system',
        title: 'Hi, I’m Lionel',
        role: 'Creator of MESSY & Founder of Lionel’s Creative GYM',
        bio1: 'For years I’ve met exceptional practitioners, therapists, creators, and professionals stuck in the exact same spot: the moment they need to write a website or "market themselves", everything feels forced, artificial, and exhausting.',
        bio2: 'Most existing AI tools only make it worse — flooding the page with generic clichés and bloated marketing speak that no genuine human would ever say aloud.',
        bio3: 'I built MESSY on a simple conviction: You don’t need to reinvent yourself; someone just needs to truly listen to you. When you give a person a calm, safe space to talk — without pressure or buzzwords — the exact right words are already there.',
        signature: 'Lionel Mitelpunkt',
      },
      steps: {
        title: 'Three simple steps',
        s1Title: '1. Attentive Chat',
        s1Desc: 'A ~15-minute dialogue. Speak with your voice or type, on any phone or laptop.',
        s2Title: '2. Pure Extraction',
        s2Desc: 'The system distills your essence, audience, and offerings strictly from your words.',
        s3Title: '3. Your Living Site',
        s3Desc: 'You receive a designed personal website and a private link to review and refine in peace.',
      },
      ctaBox: {
        title: 'Ready to hear what your work sounds like with pure clarity?',
        desc: 'Takes about 15 minutes, requires no preparation, and you can start right now.',
        btn: 'Start your conversation now 🎙️',
      },
    },
  };

  const curr = t[lang];

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      lang={lang}
      className="min-h-screen text-[#2C332D] selection:bg-[#E2EBE0] selection:text-[#2C332D]"
      style={{
        backgroundColor: '#F9F6F0',
        fontFamily: isHe ? 'var(--font-heebo), sans-serif' : 'var(--font-space), sans-serif',
      }}
    >
      {/* ─── Top Navigation Bar ─── */}
      <header className="sticky top-0 z-40 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#E5DED5]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-bold text-2xl tracking-tight text-[#2C332D]">
              m<span className="text-[#C26747]">e</span>ssy
            </span>
            <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAE3D9] text-[#5B6E58] font-medium">
              2026 Calm
            </span>
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#555E57]">
            <a href="#journey" className="hover:text-[#2C332D] transition-colors">
              {curr.nav.beforeAfter}
            </a>
            <a href="#how" className="hover:text-[#2C332D] transition-colors">
              {curr.nav.howItWorks}
            </a>
            <a href="#about" className="hover:text-[#2C332D] transition-colors">
              {curr.nav.aboutLionel}
            </a>
          </nav>

          {/* Language Toggle & Primary CTA */}
          <div className="flex items-center gap-3">
            {/* Lang switch pill */}
            <div className="flex items-center bg-[#EFE9DF] rounded-full p-1 border border-[#E0D7CB] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLang('he')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  isHe ? 'bg-white text-[#2C332D] shadow-sm' : 'text-[#7D8880] hover:text-[#2C332D]'
                }`}
                aria-label="עברית"
              >
                עב
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  !isHe ? 'bg-white text-[#2C332D] shadow-sm' : 'text-[#7D8880] hover:text-[#2C332D]'
                }`}
                aria-label="English"
              >
                EN
              </button>
            </div>

            <Link
              href="/interview"
              className="bg-[#2C332D] text-[#F9F6F0] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#3D473F] transition-all shadow-sm"
            >
              {curr.nav.cta}
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-16 pb-20 px-6 max-w-4xl mx-auto text-center">
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EFE9DF] border border-[#DFD6CA] text-xs md:text-sm text-[#4E5B50] font-medium mb-6">
          <span>{curr.hero.badge}</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#2C332D] leading-[1.12] mb-6">
          <span>{curr.hero.titlePart1}</span>
          <br />
          <span className="text-[#C26747]">{curr.hero.titlePart2}</span>
        </h1>

        {/* Lead description */}
        <p className="text-lg sm:text-xl text-[#525E54] leading-relaxed max-w-2xl mx-auto mb-10 font-normal">
          {curr.hero.desc}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <Link
            href="/interview"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#C26747] text-white text-base font-semibold shadow-md hover:bg-[#B05B3D] transition-all hover:-translate-y-0.5"
          >
            {curr.hero.primaryCta}
          </Link>
          <a
            href="#journey"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 rounded-full bg-[#EAE3D9] text-[#2C332D] text-base font-medium hover:bg-[#DFD6CA] transition-all border border-[#D5CBBE]"
          >
            {curr.hero.secondaryCta}
          </a>
        </div>

        <p className="text-xs text-[#7A877E]">{curr.hero.subnote}</p>

        {/* Editorial Illustration Frame */}
        <div className="mt-12 rounded-2xl overflow-hidden border border-[#E0D7CA] shadow-lg bg-[#F0EAE1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/before_after_journey.jpg"
            alt="MESSY Emotional Journey - Before and After"
            className="w-full h-auto object-cover max-h-[480px]"
          />
          <div className="p-3 bg-[#EAE2D7] text-xs text-[#6B786F] text-center border-t border-[#DFD6C9]">
            {isHe
              ? 'איור נורדי-יפני מקורי מתוך מנוע האתרים של MESSY: מהסבך והכובד — אל השקט, הבהירות והנתיב המדויק.'
              : 'Original Japanese-Nordic editorial illustration: from tangle and burden — to quiet clarity and direction.'}
          </div>
        </div>
      </section>

      {/* ─── Before & After Process Section (#journey) ─── */}
      <section id="journey" className="py-20 bg-[#F4EFEA] border-y border-[#E5DED5]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-wider text-[#C26747] font-bold">
              {curr.journey.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2C332D] mt-2 mb-4 leading-tight">
              {curr.journey.title}
            </h2>
            <p className="text-[#555E57] text-base leading-relaxed">{curr.journey.subtitle}</p>
          </div>

          {/* Interactive 3-way Tab Selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-[#E7DFD4] p-1.5 rounded-full border border-[#D7CEBF] max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => setJourneyTab('before')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  journeyTab === 'before'
                    ? 'bg-[#535D55] text-white shadow'
                    : 'text-[#647067] hover:text-[#2C332D]'
                }`}
              >
                {curr.journey.tabBefore}
              </button>
              <button
                type="button"
                onClick={() => setJourneyTab('during')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  journeyTab === 'during'
                    ? 'bg-[#5B6E58] text-white shadow'
                    : 'text-[#647067] hover:text-[#2C332D]'
                }`}
              >
                {curr.journey.tabDuring}
              </button>
              <button
                type="button"
                onClick={() => setJourneyTab('after')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  journeyTab === 'after'
                    ? 'bg-[#C26747] text-white shadow'
                    : 'text-[#647067] hover:text-[#2C332D]'
                }`}
              >
                {curr.journey.tabAfter}
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E2DBD1] shadow-sm transition-all duration-300">
            {journeyTab === 'before' && (
              <div className="space-y-4 animate-fade-up">
                <span className="inline-block px-3 py-1 rounded-full bg-[#EAE2D8] text-[#555E57] text-xs font-semibold">
                  {curr.journey.before.badge}
                </span>
                <h3 className="text-2xl font-bold text-[#2C332D]">
                  {curr.journey.before.title}
                </h3>
                <ul className="space-y-3 pt-2">
                  {curr.journey.before.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[#4A554D]">
                      <span className="text-[#C26747] text-lg font-bold">×</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {journeyTab === 'during' && (
              <div className="space-y-4 animate-fade-up">
                <span className="inline-block px-3 py-1 rounded-full bg-[#E3EBE1] text-[#455B42] text-xs font-semibold">
                  {curr.journey.during.badge}
                </span>
                <h3 className="text-2xl font-bold text-[#2C332D]">
                  {curr.journey.during.title}
                </h3>
                <ul className="space-y-3 pt-2">
                  {curr.journey.during.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[#4A554D]">
                      <span className="text-[#5B6E58] text-lg font-bold">✓</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {journeyTab === 'after' && (
              <div className="space-y-4 animate-fade-up">
                <span className="inline-block px-3 py-1 rounded-full bg-[#F5E8E2] text-[#A64F30] text-xs font-semibold">
                  {curr.journey.after.badge}
                </span>
                <h3 className="text-2xl font-bold text-[#2C332D]">
                  {curr.journey.after.title}
                </h3>
                <ul className="space-y-3 pt-2">
                  {curr.journey.after.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[#4A554D]">
                      <span className="text-[#5B6E58] text-lg font-bold">★</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-8 mt-6 border-t border-[#EAE3DA] flex justify-end">
              <Link
                href="/interview"
                className="text-sm font-semibold text-[#C26747] hover:text-[#9F482B] inline-flex items-center gap-1.5"
              >
                <span>{isHe ? 'לנסות את השיחה עכשיו ←' : 'Try the conversation now →'}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works: 3 Steps (#how) ─── */}
      <section id="how" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-[#2C332D]">{curr.steps.title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E5DDD2] shadow-sm">
            <span className="text-xs font-bold text-[#5B6E58] uppercase tracking-wider block mb-2">
              Step 01
            </span>
            <h3 className="text-lg font-bold text-[#2C332D] mb-2">{curr.steps.s1Title}</h3>
            <p className="text-sm text-[#5C675F] leading-relaxed">{curr.steps.s1Desc}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#E5DDD2] shadow-sm">
            <span className="text-xs font-bold text-[#5B6E58] uppercase tracking-wider block mb-2">
              Step 02
            </span>
            <h3 className="text-lg font-bold text-[#2C332D] mb-2">{curr.steps.s2Title}</h3>
            <p className="text-sm text-[#5C675F] leading-relaxed">{curr.steps.s2Desc}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#E5DDD2] shadow-sm">
            <span className="text-xs font-bold text-[#C26747] uppercase tracking-wider block mb-2">
              Step 03
            </span>
            <h3 className="text-lg font-bold text-[#2C332D] mb-2">{curr.steps.s3Title}</h3>
            <p className="text-sm text-[#5C675F] leading-relaxed">{curr.steps.s3Desc}</p>
          </div>
        </div>
      </section>

      {/* ─── About Lionel (#about) ─── */}
      <section id="about" className="py-20 bg-[#F2ECE4] border-t border-[#E5DED5]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E0D7CC] shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C26747]">
              {curr.about.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2C332D] mt-2 mb-1">
              {curr.about.title}
            </h2>
            <p className="text-sm font-semibold text-[#667368] mb-6">{curr.about.role}</p>

            <div className="space-y-4 text-base text-[#4C5850] leading-relaxed">
              <p>{curr.about.bio1}</p>
              <p>{curr.about.bio2}</p>
              <p className="font-medium text-[#2C332D] bg-[#F7F3EE] p-4 rounded-xl border border-[#E7DFD4]">
                {curr.about.bio3}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#EAE3D9] flex items-center justify-between">
              <div>
                <p className="text-xs text-[#808D83]">
                  {isHe ? 'יוצר ומפתח המערכת' : 'Creator & Developer'}
                </p>
                <p className="font-bold text-[#2C332D] text-lg">{curr.about.signature}</p>
              </div>
              <a
                href="https://lionelmitelpunkt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#5B6E58] hover:text-[#2C332D] underline underline-offset-4"
              >
                Lionel’s Creative GYM ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA Box ─── */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <div className="bg-[#2C332D] text-[#F9F6F0] rounded-3xl p-10 sm:p-14 shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4 tracking-tight">
            {curr.ctaBox.title}
          </h2>
          <p className="text-base text-[#BAC3BB] max-w-xl mx-auto mb-8 font-normal">
            {curr.ctaBox.desc}
          </p>
          <Link
            href="/interview"
            className="inline-flex items-center justify-center px-9 py-4 rounded-full bg-[#C26747] text-white text-base font-bold shadow-lg hover:bg-[#B05B3D] transition-all hover:scale-[1.02]"
          >
            {curr.ctaBox.btn}
          </Link>
        </div>
      </section>
    </div>
  );
}
