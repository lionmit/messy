'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PRICES } from '@/content/prices';

type Lang = 'he' | 'en';

export default function LandingPageContent() {
  const [lang, setLang] = useState<Lang>('he');
  const [journeyTab, setJourneyTab] = useState<'before' | 'during' | 'after'>('during');

  const isHe = lang === 'he';

  const t = {
    he: {
      nav: {
        pain: 'הפער המשתק',
        journey: 'לפני ואחרי',
        howItWorks: 'איך זה עובד',
        aboutLionel: 'על ליונל',
        cta: 'להתחיל',
      },
      hero: {
        badge: '🌿 למי שיודע בדיוק מה לעשות בתוך החדר — אבל קופא מול עולם השיווק',
        titlePart1: 'בתוך החדר יש לך קסם וביטחון.',
        titlePart2: 'למה כשצריך להסביר את זה בחוץ — הכל נתקע?',
        desc: 'הפער בין העומק של התהליך שאתה מעביר לבין הניסיון "לשווק את עצמך" הוא הדבר הכי מתסכל בעסק שלך. שיחה בכתב של 20 עד 40 דקות מחזיקה לך מראה צלולה — ומחלצת מתוך העשייה האמיתית שלך דף אינטרנט חי, סטוריטלינג אותנטי ומילים שאפשר להעביר הלאה בלי להתבייש.',
        primaryCta: 'להתחיל את השיחה (20 עד 40 דקות)',
        secondaryCta: 'לגעת בפער ↓',
        subnote: '🎙️ הקלטה קולית או כתיבה · ללא שאלונים יבשים · מבוסס כולו על המילים שלך',
        /** Board 2026-10-17: the WHY in three lines, Lionel's voice, from his own words. The stages keep their names: שיחה · אתר · דיוק. */
        why: [
          'אני יודע מה זה להיות עצמאי: הרבה שעות לבד, לעשות הכל לבד. ואפשר אחרת.',
          'אנשים לא קונים פה אתר. הם קונים פחות בדידות בדרך להסביר מי הם.',
          'הדרך כאן: שיחה · אתר · דיוק.',
        ],
        /** Eitan's line, agreed by the board. The link goes to the privacy page, which lists what remains. */
        privacy: { before: 'אפשר למחוק הכל בלחיצה, וכתוב ', link: 'מה כן נשאר', after: '.' },
      },
      painSection: {
        eyebrow: 'הכאב האמיתי שאיש לא מדבר עליו',
        title: 'אתה לא צריך ללמוד שיווק. אתה צריך מישהו שיקשיב לך.',
        subtitle: 'רוב אנשי המקצוע המעולים מרגישים בחילה כשאומרים להם "לבנות משפך", "לייצר לידים" או לתת ל-AI לפלוט טקסטים חסרי נשמה. הנה מה שבאמת עוצר אותך:',
        cards: [
          {
            icon: '🏔️',
            title: 'זה כמו לטפס על הר — ואתה מלווה אותם צעד-אחר-צעד',
            desc: 'בעבודה שלך בחדר, אתה לא מוכר קופסה מוכנה. אתה הולך ליד האדם בסבך, עוזר לו לראות את הצעד הבא. אבל ברגע שצריך להכניס את זה לדף אינטרנט, כולם דוחפים אותך לדבר כמו איש מכירות חלקלק.',
          },
          {
            icon: '🪞',
            title: 'חסרה לך מראה, לא חסר לך ידע',
            desc: 'כשאתה מנסה לכתוב על עצמך, אתה טובע בפרטים ובספקות. אתה צריך מראה מדויקת שיושבת מולך, מקשיבה לניואנסים, ומחזירה לך את הדברים שאמרת במילים חדות שגורמות לך להגיד: "וואו, זה בדיוק אני".',
          },
          {
            icon: '🛑',
            title: 'טקסטים של AI רגיל גורמים לך להרגיש זיוף',
            desc: 'ניסית לבקש מ-ChatGPT לכתוב עליך? התוצאה מלאה בסופרלטיבים חלולים, הבטחות מופרזות ומילים אמריקאיות שאף מטפל, יועץ או איש מקצוע הגון לא היה מעז להוציא מהפה.',
          },
          {
            icon: '⏳',
            title: 'אתרים שנתקעים חודשים ועולים אלפי שקלים',
            desc: 'שבועות מול מסמך Word ריק. מחשבות בלתי נגמרות על "מה להציע" ו"מי קהל היעד". פרויקטים של מיתוג שנמרחים ונמרחים רק כי אף אחד לא עצר להקשיב לקול האמיתי שלך.',
          },
        ],
      },
      journey: {
        eyebrow: 'המראה של התהליך',
        title: 'מה קורה כשמפסיקים לנסות "לשווק" ופשוט מדברים?',
        subtitle: 'המסע מהתסכול והעומס — אל דף חי, אותנטי ונושם שאפשר להעביר בגאווה לכל אדם.',
        tabBefore: '1. לפני השיחה (השיתוק וההר)',
        tabDuring: '2. בשיחה של 20 עד 40 דקות (הליווי והמראה)',
        tabAfter: '3. בסיום (דברור עצמי ודף חי)',
        before: {
          badge: 'לפני: תסכול, עומס וניכור שיווקי',
          title: 'לדעת שאתה מעולה בחדר, אבל לא מסוגל להסביר את זה בחוץ',
          points: [
            'יושב שעות מול מסמך ריק ולא מסוגל לכתוב פסקה אחת על מה שאתה עושה בלי להרגיש מאולץ',
            'תחושה שאתה צריך "להתחפש" למישהו אחר כדי שיבינו את הערך שלך',
            'עצות שיווקיות אגרסיביות שגורמות לך לרצות לברוח ולוותר על נוכחות ברשת',
            'אף אחד מחוץ למעגל הממליצים הקרוב לא באמת מבין מה הייחוד שלך ואיך אתה עוזר',
          ],
        },
        during: {
          badge: 'במהלך השיחה: הליווי בטיפוס',
          title: 'שיחה אינטימית ואחת-על-אחת שמחלצת את מה שכבר חי בך',
          points: [
            'שיחה קשובה ואנושית (בקול או בכתיבה): מספרים על העשייה בטבעיות, בדיוק כמו שמספרים לקולגה',
            'פירוק הבלבול והבלאגן: שאלות חכמות שמזהות את השליחות, את שפת הגוף ואת שמות השירותים',
            'מד בהירות חי בראש המסך: מראה לך איך צעד אחר צעד הכל מתחבר למבנה ברור',
            'אפס המצאות: שום מילה לא משודרגת או מומצאת — הכל מבוסס 100% על האמת שלך',
          ],
        },
        after: {
          badge: 'אחרי: דף אישי שמעביר את זה הלאה',
          title: 'דברור עצמי מושלם: דף אתר מעוצב ומסמך שפה שאפשר לחלוק מיד',
          points: [
            'אתר אישי שקט ומעוצב ברמה בינלאומית (נורדי-יפני עדין) שמרגיש כמו המשך ישיר של הקליניקה שלך',
            'טקסטים חדים ומדויקים שגורמים לאדם הנכון לקרוא ולהגיד: "בדיוק למישהו כמוך חיכיתי"',
            'דף עריכה וניהול פרטי (Owner) שמאפשר לך לעדכן מילים, להחליף פלטות צבעים ולשלוט בכל פרט',
            'קישור אישי שאפשר לשלוח בווטסאפ לכל לקוח או קולגה בלי להתנצל ובלי להסמיק',
          ],
        },
      },
      about: {
        eyebrow: 'המניפסט מאחורי המערכת',
        title: 'נעים להכיר, אני ליונל',
        role: 'יוצר MESSY & מייסד Lionel’s Creative GYM',
        bio1: 'במשך שנים פגשתי את האנשים הכי טובים שאני מכיר — מטפלים, יועצים, מנחים, אמנים ואנשי מקצוע חדים — מרגישים חסרי אונים ומשותקים ברגע שהם צריכים "לשווק את עצמם".',
        bio2: 'עולם השיווק המסורתי אומר להם שהם צריכים להפוך לאנשי מכירות אגרסיביים, לבנות "משפכים" ולדבר על "נקודות כאב" של אנשים. זה שובר את הלב, וזה גורם לאנשים הכי רגישים ומשמעותיים להישאר בלתי נראים.',
        bio3: 'בניתי את MESSY כדי להחזיק לך מראה. בחדר, כשאתה עם הלקוח שלך, אתה יודע בדיוק מה אתה עושה. יש שם ביטחון, עדינות ועוצמה. כל מה שצריך זה לחלץ את מה שקורה שם — בלי תיווך, בלי זיוף ובלי גרם של שיווקיות ריקה — ולהפוך את זה לדף אינטרנט חי שתוכל להעביר הלאה בגאווה.',
        signature: 'ליונל מיטלפונקט',
      },
      steps: {
        title: 'איך זה עובד בפועל?',
        s1Title: '1. שיחה קשובה (20 עד 40 דקות)',
        s1Desc: 'אתה יושב במקום שקט, לוחץ על המיקרופון (🎙️) ומדבר או מקליד בקצב שלך. השיחה שואלת, מקשיבה ומפרקת את הסבך.',
        s2Title: '2. החזקת המראה והזיקוק',
        s2Desc: 'המערכת אוספת את המילים המקוריות שלך, מחברת את הסיפור, מאתרת את הקהל ומבנה את השירותים בלי שום קלישאה.',
        s3Title: '3. האתר שלך באוויר',
        s3Desc: 'אתה מקבל אתר אישי מעוצב ונושם, כולל דף עריכה פרטי (Owner) המאפשר לשנות טקסטים וצבעים בלחיצה אחת.',
      },
      quoteSection: {
        quote: '"זה הפעם הראשונה שמישהו פשוט הקשיב למה שאני עושה בחדר, ותרגם את זה לדף שנשמע בדיוק כמוני. בלי שאצטרך להתחפש לאשת שיווק."',
        author: 'מעין דוידסון',
        role: 'מנחת קונסטלציה משפחתית ומדריכת הורים',
      },
      ctaBox: {
        title: 'מוכן להוציא את מה שקורה בחדר — אל העולם?',
        desc: 'בלי שאלונים, בלי מאמץ מוקדם ובלי זיוף. 20 עד 40 דקות של שיחה, ואתה מקבל אתר אישי חי שנשמע בדיוק כמוך.',
        btn: 'להתחלת השיחה עכשיו 🎙️',
      },
      /** Board C5: the optional session is one quiet text link at the bottom, nothing more. */
      session: { text: `אפשר גם פגישת דיוק איתי, ${PRICES.session_price} ₪.`, link: 'לשאול במייל', subject: 'פגישת דיוק' },
    },
    en: {
      nav: {
        pain: 'The Paralysis',
        journey: 'Before & After',
        howItWorks: 'How it works',
        aboutLionel: 'About Lionel',
        cta: 'Start',
      },
      hero: {
        badge: '🌿 For those who know exactly what they do inside the room — but freeze outside it',
        titlePart1: 'Inside the room, you are brilliant and confident.',
        titlePart2: 'Why does it all freeze the moment you have to explain it outside?',
        desc: 'The gap between the deep, transformative work you do inside the room and the agonizing effort to "market yourself" is the most exhausting part of your work. A calm 20 to 40 minute written conversation holds up a clear mirror — extracting your genuine voice and turning it into a living, serene personal website you can finally share with pride.',
        primaryCta: 'Start your clarity session (20 to 40 min)',
        secondaryCta: 'Feel the gap ↓',
        subnote: '🎙️ Speak with your voice or type · Zero dry forms · 100% grounded in your real words',
        why: [
          'I know what being independent means: many hours alone, doing everything alone. And it can be different.',
          'People are not buying a website here. They are buying less loneliness on the way to explaining who they are.',
          'The way here: conversation · website · precision.',
        ],
        privacy: { before: 'One click deletes everything, and ', link: 'what remains', after: ' is written down.' },
      },
      painSection: {
        eyebrow: 'The unspoken tension',
        title: 'You don’t need to learn marketing. You just need someone to truly listen.',
        subtitle: 'Most exceptional practitioners, consultants, and therapists feel alienated when told to "build a sales funnel" or let generic AI vomit soulless copy. Here is what is actually in the way:',
        cards: [
          {
            icon: '🏔️',
            title: 'It is like climbing a mountain — and you accompany them step by step',
            desc: 'Inside the room, you don’t sell a packaged product. You walk alongside someone through the thicket. But the moment you need a website, the industry forces you to sound like an aggressive salesperson.',
          },
          {
            icon: '🪞',
            title: 'You lack a mirror, not knowledge',
            desc: 'When you try to write about yourself, you drown in self-doubt and overthinking. You need a perceptive mirror sitting across from you, catching your nuances and reflecting them back with unmistakable clarity.',
          },
          {
            icon: '🛑',
            title: 'Standard AI tools make you feel like a fraud',
            desc: 'Ever ask ChatGPT to write your bio? It spits out exaggerated superlatives, hollow buzzwords, and Americanized marketing hype that no decent human would ever say aloud to a client.',
          },
          {
            icon: '⏳',
            title: 'Web projects that drag on for months and cost thousands',
            desc: 'Weeks staring at a blank cursor. Endless agonizing over "offerings" and "target audiences". Branding projects that stall forever simply because nobody took the time to listen to your authentic voice.',
          },
        ],
      },
      journey: {
        eyebrow: 'The Mirroring Process',
        title: 'What happens when you stop trying to "market" and just speak?',
        subtitle: 'The journey from paralysis and dread — to a living, beautiful personal site you can send to anyone with genuine confidence.',
        tabBefore: '1. Before (The Mountain & The Silence)',
        tabDuring: '2. The 20 to 40 Minutes (The Mirror & Attentiveness)',
        tabAfter: '3. After (Self-Articulation & Living Site)',
        before: {
          badge: 'Before: Paralysis, overthinking & marketing fatigue',
          title: 'Knowing you are extraordinary inside the room, but unable to articulate it outside',
          points: [
            'Staring for hours at an empty page, unable to write a single sentence about your work without feeling fake',
            'Feeling like you have to put on a costume and pretend to be an aggressive marketer',
            'Advice about "conversion funnels" that makes you want to close your practice and walk away',
            'Nobody outside your tight referral network truly grasps the depth and beauty of what you offer',
          ],
        },
        during: {
          badge: 'During: Accompanied through the climb',
          title: 'An intimate 1:1 conversation that extracts what is already alive in you',
          points: [
            'A calm, human dialogue (voice or text): describe what you do just like sharing with a trusted colleague',
            'Untangling the noise: perceptive prompts that locate your calling, your cadence, and your true offerings',
            'A live clarity gauge in the top bar: watching the dots connect into structured coherence in real time',
            'Zero invention: not a single claim is inflated or fabricated — everything is anchored in your truth',
          ],
        },
        after: {
          badge: 'After: Self-articulation you can pass forward',
          title: 'Complete self-clarity: an editorial site and a voice document ready to share',
          points: [
            'A world-class minimalist site (Nordic-Japanese calm) that feels like a natural extension of your room',
            'Sharp, honest text that makes the exact right client say: "You are the person I have been searching for"',
            'A private Owner drawer for effortless text edits, curated color palettes, and finishing touches',
            'A link you can send on WhatsApp to any client or colleague with zero apologies and zero cringe',
          ],
        },
      },
      about: {
        eyebrow: 'The Manifesto Behind the Engine',
        title: 'Hi, I’m Lionel',
        role: 'Creator of MESSY & Founder of Lionel’s Creative GYM',
        bio1: 'For years I have watched the most gifted people I know — therapists, guides, consultants, artists, and deep thinkers — feel utterly paralyzed the moment they have to "market themselves".',
        bio2: 'The traditional marketing world tells them they need to become aggressive hype-machines, build "funnels", and manipulate people’s "pain points". It is heartbreaking, and it forces the most sensitive and essential practitioners to remain invisible.',
        bio3: 'I built MESSY to hold up a mirror. Inside the room, with your client, you know exactly what you are doing. There is confidence, subtlety, and power. All we need to do is extract what already happens there — without filters, without fake polish, and without a drop of corporate fluff — and turn it into a living personal site you can stand behind with wholehearted pride.',
        signature: 'Lionel Mitelpunkt',
      },
      steps: {
        title: 'How does it actually work?',
        s1Title: '1. Attentive Dialogue (20 to 40 min)',
        s1Desc: 'You sit in a quiet place, tap the microphone (🎙️), and speak or type at your pace. The system listens, unpacks the knots, and follows your flow.',
        s2Title: '2. Mirroring & Distillation',
        s2Desc: 'The engine gathers your exact spoken words, mapping your story, identifying your audience, and structuring your services without clichés.',
        s3Title: '3. Your Living Site',
        s3Desc: 'You receive a serene personal website, complete with a private Owner drawer to adjust text and color palettes with a single tap.',
      },
      quoteSection: {
        quote: '"This is the first time someone actually listened to what I do inside the room, and translated it into a page that sounds exactly like me. Without having to pretend to be a marketer."',
        author: 'Maayan Davidson',
        role: 'Family Constellation Facilitator & Parental Counselor',
      },
      ctaBox: {
        title: 'Ready to bring what happens in the room — out to the world?',
        desc: 'No forms, no preparation, and no pretension. 20 to 40 minutes of dialogue, and you have an authentic living website.',
        btn: 'Start your conversation now 🎙️',
      },
      session: { text: `A one-to-one precision session with me is also available, ${PRICES.session_price} ₪.`, link: 'Ask by email', subject: 'Precision session' },
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
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo-messy.png"
              alt="lionelmitelpunkt /messy"
              width={249}
              height={227}
              priority
              className="h-11 w-auto"
            />
            <span className="hidden sm:inline text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAE3D9] text-[#5B6E58] font-medium">
              In The Room · 2026
            </span>
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#555E57]">
            <a href="#pain" className="hover:text-[#2C332D] transition-colors">
              {curr.nav.pain}
            </a>
            <a href="#journey" className="hover:text-[#2C332D] transition-colors">
              {curr.nav.journey}
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
              className="bg-[#2C332D] text-[#F9F6F0] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#3D473F] transition-all shadow-sm whitespace-nowrap"
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
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#2C332D] leading-[1.15] mb-6">
          <span>{curr.hero.titlePart1}</span>
          <br />
          <span className="text-[#C26747]">{curr.hero.titlePart2}</span>
        </h1>

        {/* The WHY, three lines in Lionel's voice (board 2026-10-17) */}
        <div className="max-w-2xl mx-auto mb-8 space-y-1.5 text-base sm:text-lg text-[#2C332D] leading-relaxed">
          {curr.hero.why.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

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
            href="#pain"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 rounded-full bg-[#EAE3D9] text-[#2C332D] text-base font-medium hover:bg-[#DFD6CA] transition-all border border-[#D5CBBE]"
          >
            {curr.hero.secondaryCta}
          </a>
        </div>

        <p className="text-xs text-[#7A877E]">{curr.hero.subnote}</p>

        {/* Editorial Illustration Frame */}
        <div className="mt-14 rounded-3xl overflow-hidden border border-[#E0D7CA] shadow-xl bg-[#F0EAE1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/before_after_journey.jpg"
            alt="MESSY Emotional Journey - The Mountain, The Thicket, and The Living Room"
            className="w-full h-auto object-cover max-h-[500px]"
          />
          <div className="p-4 bg-[#EAE2D7] text-xs sm:text-sm text-[#5B685F] text-center border-t border-[#DFD6C9] font-medium">
            {isHe
              ? '״לטפס על ההר יחד איתם, בסבך ובקושי — עד שהשביל הפנימי נפתח״ (מתוך השיחה של מעין). ככה בדיוק MESSY מלווה אותך בפיצוח.'
              : '“Climbing the mountain alongside them, through the thicket — until the inner path opens.” How MESSY mirrors your work.'}
          </div>
        </div>

        {/* One quiet privacy line (board 2026-10-17, Eitan's wording) */}
        <p className="mt-6 text-sm text-[#7A877E]">
          {curr.hero.privacy.before}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-[#2C332D]">
            {curr.hero.privacy.link}
          </Link>
          {curr.hero.privacy.after}
        </p>
      </section>

      {/* ─── Pain & The Gap Section (#pain) ─── */}
      <section id="pain" className="py-20 bg-[#F4EFEA] border-y border-[#E5DED5]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-wider text-[#C26747] font-bold">
              {curr.painSection.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-[#2C332D] mt-2 mb-5 leading-tight">
              {curr.painSection.title}
            </h2>
            <p className="text-[#555E57] text-base sm:text-lg leading-relaxed">
              {curr.painSection.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {curr.painSection.cards.map((c, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 border border-[#E2DBD1] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">{c.icon}</div>
                <h3 className="text-xl font-bold text-[#2C332D] mb-3 leading-snug">
                  {c.title}
                </h3>
                <p className="text-sm sm:text-base text-[#525E55] leading-relaxed">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Real Quote from Maayan */}
          <div className="mt-12 bg-[#EAE3DA] rounded-2xl p-8 border border-[#DCD3C6] text-center max-w-3xl mx-auto">
            <p className="text-lg sm:text-xl font-semibold text-[#2C332D] italic leading-relaxed mb-3">
              {curr.quoteSection.quote}
            </p>
            <p className="text-sm text-[#6C7A70] font-bold">
              {curr.quoteSection.author} · <span className="font-normal">{curr.quoteSection.role}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ─── Before & After Process Section (#journey) ─── */}
      <section id="journey" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-wider text-[#5B6E58] font-bold">
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
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E2DBD1] shadow-md transition-all duration-300 max-w-3xl mx-auto">
          {journeyTab === 'before' && (
            <div className="space-y-4 animate-fade-up">
              <span className="inline-block px-3 py-1 rounded-full bg-[#EAE2D8] text-[#555E57] text-xs font-semibold">
                {curr.journey.before.badge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#2C332D]">
                {curr.journey.before.title}
              </h3>
              <ul className="space-y-3.5 pt-3">
                {curr.journey.before.points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[#4A554D] text-base leading-relaxed">
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
              <h3 className="text-2xl sm:text-3xl font-bold text-[#2C332D]">
                {curr.journey.during.title}
              </h3>
              <ul className="space-y-3.5 pt-3">
                {curr.journey.during.points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[#4A554D] text-base leading-relaxed">
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
              <h3 className="text-2xl sm:text-3xl font-bold text-[#2C332D]">
                {curr.journey.after.title}
              </h3>
              <ul className="space-y-3.5 pt-3">
                {curr.journey.after.points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[#4A554D] text-base leading-relaxed">
                    <span className="text-[#5B6E58] text-lg font-bold">★</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-8 mt-6 border-t border-[#EAE3DA] flex items-center justify-between">
            <span className="text-xs text-[#7F8B82]">
              {isHe ? 'ללא שום שיווק אגרסיבי' : 'Zero aggressive marketing'}
            </span>
            <Link
              href="/interview"
              className="text-sm font-bold text-[#C26747] hover:text-[#9F482B] inline-flex items-center gap-1.5"
            >
              <span>{isHe ? 'להתנסות בשיחה עכשיו ←' : 'Experience the conversation now →'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 3 Simple Steps (#how) ─── */}
      <section id="how" className="py-20 bg-[#F4EFEA] border-y border-[#E5DED5]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2C332D]">{curr.steps.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-white border border-[#E5DDD2] shadow-sm">
              <span className="text-xs font-bold text-[#5B6E58] uppercase tracking-wider block mb-2">
                שלב 01
              </span>
              <h3 className="text-xl font-bold text-[#2C332D] mb-3">{curr.steps.s1Title}</h3>
              <p className="text-sm text-[#5C675F] leading-relaxed">{curr.steps.s1Desc}</p>
            </div>
            <div className="p-8 rounded-3xl bg-white border border-[#E5DDD2] shadow-sm">
              <span className="text-xs font-bold text-[#5B6E58] uppercase tracking-wider block mb-2">
                שלב 02
              </span>
              <h3 className="text-xl font-bold text-[#2C332D] mb-3">{curr.steps.s2Title}</h3>
              <p className="text-sm text-[#5C675F] leading-relaxed">{curr.steps.s2Desc}</p>
            </div>
            <div className="p-8 rounded-3xl bg-white border border-[#E5DDD2] shadow-sm">
              <span className="text-xs font-bold text-[#C26747] uppercase tracking-wider block mb-2">
                שלב 03
              </span>
              <h3 className="text-xl font-bold text-[#2C332D] mb-3">{curr.steps.s3Title}</h3>
              <p className="text-sm text-[#5C675F] leading-relaxed">{curr.steps.s3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── About Lionel (#about) ─── */}
      <section id="about" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-[#E0D7CC] shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C26747]">
            {curr.about.eyebrow}
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#2C332D] mt-2 mb-2">
            {curr.about.title}
          </h2>
          <p className="text-base font-semibold text-[#667368] mb-8">{curr.about.role}</p>

          <div className="space-y-5 text-base sm:text-lg text-[#4C5850] leading-relaxed font-normal">
            <p>{curr.about.bio1}</p>
            <p>{curr.about.bio2}</p>
            <p className="font-medium text-[#2C332D] bg-[#F7F3EE] p-6 rounded-2xl border border-[#E7DFD4] leading-relaxed">
              {curr.about.bio3}
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-[#EAE3D9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#808D83]">
                {isHe ? 'יוצר ומפתח המערכת' : 'Creator & Developer'}
              </p>
              <p className="font-bold text-[#2C332D] text-xl">{curr.about.signature}</p>
            </div>
            <a
              href="https://lionelmitelpunkt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-[#5B6E58] hover:text-[#2C332D] underline underline-offset-4"
            >
              Lionel’s Creative GYM ↗
            </a>
          </div>
        </div>
      </section>

      {/* ─── Final CTA Box ─── */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <div className="bg-[#2C332D] text-[#F9F6F0] rounded-3xl p-10 sm:p-16 shadow-2xl">
          <h2 className="text-3xl sm:text-5xl font-bold mb-5 tracking-tight leading-tight">
            {curr.ctaBox.title}
          </h2>
          <p className="text-base sm:text-lg text-[#BAC3BB] max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            {curr.ctaBox.desc}
          </p>
          <Link
            href="/interview"
            className="inline-flex items-center justify-center px-10 py-5 rounded-full bg-[#C26747] text-white text-lg font-bold shadow-xl hover:bg-[#B05B3D] transition-all hover:scale-[1.02]"
          >
            {curr.ctaBox.btn}
          </Link>
        </div>

        {/* The optional session: one quiet text link, nothing more (board C5) */}
        <p className="mt-8 text-sm text-[#7A877E]">
          {curr.session.text}{' '}
          <a
            href={`mailto:lionmit@gmail.com?subject=${encodeURIComponent(curr.session.subject)}`}
            className="underline underline-offset-2 hover:text-[#2C332D]"
          >
            {curr.session.link}
          </a>
        </p>
      </section>
    </div>
  );
}
