'use client';

/**
 * The home page, in the respondent sites' family (messy-sites/v3 template, "sand" preset):
 * paper ground, Assistant, terracotta button, the same section rhythm. Section order follows the
 * S1 prototype the board approved (prototypes/s1-loop3), with the WHY moved up to right after the hero
 * (Lionel, 2026-10-17: the WHY is what the site must talk about).
 *
 * Copy sources, line by line, are marked in the `t` object:
 *   deck:<key>   word for word from messy-sites/board/copy-deck.md (accepted lines; RETIRED lines are not used)
 *   copy.ts      strings the interview already shows (Hebrew panel 2026-10-11)
 *   NEW          a new line or a splice of approved fragments, for Lionel's approval before production
 * The gated sentence about the questions being built on the way Lionel listens is not here (not allowed yet).
 * Every line is gender-neutral (infinitives, "מי ש", past tense); no dashes, no dot-forms, no superlatives.
 */
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Assistant } from 'next/font/google';
import { AI_LINE_TRUE_TODAY, CONSENT, FINISH, READING_LINE, priceLine } from '@/content/copy';
import { PRICES, goLivePrice } from '@/content/prices';
import './landing.css';

const assistant = Assistant({ subsets: ['hebrew', 'latin'], weight: ['400', '600', '700'], variable: '--font-assistant' });

type Lang = 'he' | 'en';

interface FaqItem {
  q: string;
  a: readonly string[];
  list?: readonly string[];
  link?: { label: string; href: string; before?: string };
}
interface Copy {
  header: { maker: string; cta: string; langHe: string; langEn: string };
  hero: {
    prehead: string; situation: string; h1Start: string; h1Mark: string; mechanism: string; aiLine: string; cta: string;
    priceLine: string; timeLine: string; artAlt: string; privacy: { before: string; link: string; after: string };
  };
  why: { lines: readonly string[]; stages: string; beat1: string; beat2: string; artAlt: string };
  demo: {
    heading: string; tag: string; intro: string; beforeLabel: string; before: string; afterLabel: string; after: string; trace: string;
    beforeAlt: string; afterAlt: string;
  };
  how: { heading: string; steps: readonly { t: string; b: string }[] };
  spec: { heading: string; freeHeading: string; free: readonly string[]; paidHeading: string; outcome: string; includedTitle: string; paid: readonly string[] };
  price: {
    heading: string; amount: string; golive: string; renewal: string; founding: string | null; cta: string; refund: string;
    money: { before: string; link: string; after: string }; invoice: string;
  };
  fit: { limit: string; forH: string; forT: string; notforH: string; notfor: readonly string[] };
  about: { prov: string; quote: string; reason: string; help: string; figAlt: string };
  faq: { heading: string; items: readonly FaqItem[]; qLink: { before: string; label: string; href: string } };
  close: { cta: string; priceLine: string; lane2: { label: string; tail: string }; figAlt: string };
  foot: string;
}

const MAIL = 'lionmit@gmail.com';
const mailto = (subject: string) => `mailto:${MAIL}?subject=${encodeURIComponent(subject)}`;

const t: Record<Lang, Copy> = {
  he: {
    header: {
      maker: 'נבנה על ידי ליונל מיטלפונקט', // deck:maker_line
      cta: CONSENT.start, // copy.ts: להתחיל
      langHe: 'עב',
      langEn: 'EN',
    },
    hero: {
      prehead: 'לאנשי מקצוע שעובדים עם אנשים', // deck:s1_prehead
      situation: 'בחדר יודעים בדיוק מה עושים. מחוץ לחדר, המילים נעלמות.', // deck:s1_situation_line
      h1Start: 'המילים שלך, גם ', // deck:h1_a
      h1Mark: 'מחוץ לחדר.',
      mechanism: 'שאלות בכתב. בסוף מקבלים את המשפטים שלך, מסודרים, במסמך אחד. אחר כך גם דף אתר שבנוי מהם.', // deck:s1_mechanism_line
      aiLine: AI_LINE_TRUE_TODAY, // copy.ts (deck:s4_ai_line)
      cta: 'להתחיל את השיחה', // deck:lane1_cta_start
      priceLine: priceLine(), // copy.ts (deck:s1_price_line, numbers from prices.ts)
      timeLine: 'השיחה לוקחת 20 עד 40 דקות. אפשר לעצור מתי שרוצים.', // NEW: deck:a_minutes + Lionel's 20 עד 40 + deck:a_stop
      artAlt: 'איור בצבעי מים: דמות בתוך סבך של קווים, ושביל שמוביל לדמות ליד גלעדי אבנים.', // NEW (alt text)
      privacy: { before: 'אפשר למחוק הכל בלחיצה, וכתוב ', link: 'מה כן נשאר', after: '.' }, // Eitan's line, agreed by the board
    },
    why: {
      lines: [
        'אני יודע מה זה להיות עצמאי: הרבה שעות לבד, לעשות הכל לבד. ואפשר אחרת.', // NEW (from Lionel's words)
        'אנשים לא קונים פה אתר. הם קונים פחות בדידות בדרך להסביר מי הם.', // NEW (from Lionel's words)
      ],
      stages: 'הדרך כאן: שיחה · אתר · דיוק.', // NEW
      beat1: 'ואפשר לבנות אתר לבד בוויקס. את המילים עדיין צריך להביא מאיפשהו.', // deck:s1_why_not_chatgpt line 2 (copy-deck.md:233)
      beat2: 'בעברית, עצמאי זה שני דברים. מי שעובד לעצמו. ומי שעומד בפני עצמו. אף אחד מהם לא אומר לבד.', // deck:bridge_atzmai (copy-deck.md:29)
      artAlt: 'איור בצבעי מים: דמות מחבקת ילד, ומסביב צלליות של אנשים ועלים.', // NEW (alt text)
    },
    demo: {
      heading: 'משפט אחד, לפני ואחרי', // deck:s1_proof_heading
      tag: 'דוגמה', // deck:s1_demo_tag
      intro: 'נועה היא דמות בדויה. השיחה והתוצאה נכתבו כדי להדגים, הן לא יצאו מ־MESSY. ככה זה נראה אצלה:', // deck:s1_demo_intro
      beforeLabel: 'בתחילת השיחה כתבת:', // deck:s4_before_label
      before: 'אני נגרית. מלמדת נגרות בבית ספר.', // S1 persona (content.json)
      afterLabel: 'הצעה למשפט, רק מהמילים שלך:', // deck:s4_after_label
      after: 'בני נוער שלא מצליחים לשבת בכיתה, אצלי בנגרייה עומדים שעתיים על חתיכת עץ אחת. הם יוצאים עם משהו ביד שהם עשו לבד.', // S1 persona
      trace: 'המשפט הזה בנוי משני דברים שנועה כתבה בהמשך השיחה.', // deck:s1_demo_trace
      beforeAlt: 'החצי הראשון של האיור: דמות בתוך סבך של קווים.', // NEW (alt text)
      afterAlt: 'החצי השני של האיור: שביל, גלעדי אבנים ודמות שעומדת זקופה.', // NEW (alt text)
    },
    how: {
      heading: 'איך זה עובד', // deck:s1_how_heading
      steps: [
        { t: 'שיחה בכתב עם כלי AI', b: 'שאלה אחת בכל פעם. עונים במילים שלך, בקצב שלך. אפשר לעצור מתי שרוצים.' }, // deck:how1
        { t: 'מסמך שנשאר שלך', b: 'בסוף מקבלים את המשפטים שלך, מסודרים, במסמך אחד. נשאר שלך גם אם לא ממשיכים.' }, // deck:how2_t; body NEW splice of deck:s1_mechanism_line + deck:free2
        { t: 'אתר של עמוד אחד', b: 'האתר נבנה מאותם משפטים. רואים אותו קודם בתצוגה מקדימה פרטית. משלמים רק אם רוצים שיעלה לאוויר.' }, // deck:how3_t + how3_b + how3_c
      ],
    },
    spec: {
      heading: 'מה מקבלים', // deck:s1_spec_heading
      freeHeading: 'בלי עלות', // deck:s1_free_heading
      free: [
        'השיחה בכתב.', // deck:free1
        'המסמך. נשאר שלך גם אם לא ממשיכים.', // deck:free2
        'תצוגה מקדימה פרטית של האתר, מוכנה לצפייה תוך יומיים, לא כולל שישי ושבת.', // deck:free4_nw
      ],
      paidHeading: 'כשהאתר עולה לאוויר', // deck:s1_paid_heading
      outcome: 'מי שמקבל את הקישור יכול לכתוב לך בוואטסאפ בלחיצה אחת.', // deck:s1_activation_outcome
      includedTitle: 'מה כלול', // deck:s1_activation_included_title
      paid: [
        'האתר באוויר וגלוי לגוגל, בלי הפס של התצוגה המקדימה.', // deck:activation_spec 1
        'כפתור וואטסאפ עם הודעה מוכנה, למי שרוצה לכתוב לך.', // deck:activation_spec 3
        `${PRICES.hosting_months_included} חודשי אחסון. הקבצים שלך להורדה בכל זמן.`, // deck:activation_spec 8
        'החזר כספי מלא עד 14 יום.', // deck:activation_spec 10
      ],
    },
    price: {
      heading: 'כמה זה עולה?', // deck:s1_price_heading
      amount: `${goLivePrice()} ₪`,
      golive: `להעלות את האתר לאוויר, רק אם רוצים: ${goLivePrice()} ₪ כולל מע"מ בתשלום אחד, עם שנה של אחסון.`, // deck:s4_golive_line
      renewal: 'אחר כך 49 ₪ לשנה כולל מע"מ, או לקחת את הקבצים.', // deck:s1_hosting_line (r5b), without its first sentence
      founding: PRICES.founding_open
        ? `מחיר השקה ל־20 האתרים הראשונים, בתמורה למשוב כתוב. אחר כך ${PRICES.golive_list_price} ₪ כולל מע"מ.` // deck:s1_founding_line (r5b)
        : null,
      cta: 'להתחיל את השיחה', // deck:lane1_cta_start
      refund: 'עד 14 יום מהתשלום, מבקשים והכסף חוזר. אם רוצים, קודם סבב תיקונים. זה לא תנאי. המסמך נשאר שלך בכל מקרה.', // deck:refund_line
      money: { before: 'כסף לא יעמוד בדרך: אפשר ', link: 'לכתוב לי', after: ' שורה אחת.' }, // deck:money_line
      invoice: 'חשבונית נשלחת למייל.', // deck:s1_invoice_line
    },
    fit: {
      limit: 'MESSY זה כלי AI, לא ליווי ולא טיפול.', // deck:s1_limit_line
      forH: 'למי זה מתאים?', // deck:s1_for_line
      forT: 'מי שעובד עם אנשים, יודע מה קורה בחדר ומחפש איך להגיד את זה גם בחוץ.', // deck:s1_for_line
      notforH: 'למי זה פחות מתאים?', // deck:s1_not_for
      notfor: [
        'מי שמחפש ליווי או טיפול.',
        'מי שצריך אתר עם כמה עמודים, חנות או זימון תורים.',
        'מי שכבר יודע בדיוק מה להגיד ומחפש רק עיצוב.',
      ], // deck:s1_not_for
    },
    about: {
      prov: 'נבנה על ידי ליונל מיטלפונקט', // deck:maker_line
      quote: 'לראות את האדם שמולך, זה המקצוע. שיראו אותך ככה, זה כבר נדיר.', // deck:why_sentence
      reason: 'בשביל זה בניתי את MESSY: שגם מי שעוד לא פגש אותך יכיר אותך מהמילים שלך.', // deck:s1_why_reason (deck marks it pending Lionel's approval)
      help: 'עשית לבד את מה שאפשר לבד. מכאן אני עוזר לך לדייק.', // deck:s2_hero_h1 (copy-deck.md:469)
      figAlt: 'ליונל, איור', // NEW (alt text)
    },
    faq: {
      heading: 'שאלות נפוצות', // deck:s1_faq_heading
      items: [
        {
          q: 'מי קורא את מה שכתבתי? ואיך מוחקים?', // deck:s1_faq_q 1
          a: [`${READING_LINE}.`, CONSENT.providerLine], // copy.ts (Q28 verbatim; Hebrew panel 2026-10-11)
          link: { label: 'למחיקה ולפרטים', href: '/privacy' }, // deck:s1_faq_a
        },
        {
          q: 'כמה זמן זה לוקח?', // deck:s1_faq_q 2
          a: [
            'השיחה לוקחת 20 עד 40 דקות.', // NEW: deck:a_minutes + Lionel's number
            'אפשר לעצור מתי שרוצים.', // deck:a_stop
            'התצוגה המקדימה של האתר מוכנה לצפייה תוך יומיים, לא כולל שישי ושבת.', // deck:s1_faq_a_no_weekend
          ],
        },
        {
          q: 'אין לי שום ידע טכני. זה מתאים לי?', // deck:s1_faq_q 3
          a: ['כן. כל מה שצריך לעשות זה לענות על שאלות בכתב. את האתר בונים בשבילך.'], // deck:a_tech
          link: { label: 'לכתוב לי כאן', href: mailto('שאלה על MESSY'), before: 'נתקעת באמצע? ' }, // deck:a_stuck + deck:write_here
        },
        {
          q: 'למה לא לבנות לבד ב־AI או בוויקס?', // NEW (the question; its answer is the deck's why-not lines)
          a: [
            'אפשר לבקש מצ\'אט לכתוב טקסט לאתר. יוצא טקסט יפה, שיכול להיות של כל אחד.', // deck:s1_why_not_chatgpt line 1
            'ואפשר לבנות אתר לבד בוויקס. את המילים עדיין צריך להביא מאיפשהו.', // deck:s1_why_not_chatgpt line 2
            'ב־MESSY האתר מתחיל בשיחה ונבנה מהמשפטים שלך.', // deck:s1_why_not_chatgpt line 3, first sentence (loop 3)
            'רואים את האתר לפני שמשלמים. משלמים רק אם רוצים שיעלה לאוויר.', // deck:s1_price_line fragment + deck:how3_c
          ],
        },
        {
          q: 'למה זה כל כך זול? איפה הקאץ\'?', // deck:s1_faq_q 4
          a: [
            ...(PRICES.founding_open ? [`מחיר השקה ל־20 האתרים הראשונים, בתמורה למשוב כתוב. אחר כך ${PRICES.golive_list_price} ₪ כולל מע"מ.`] : []), // deck:s1_founding_line
            'השיחה, המסמך והתצוגה המקדימה בלי עלות. משלמים רק אם רוצים שהאתר יעלה לאוויר.', // deck:a_free
            'מה עוד כדאי לדעת לפני שמתחילים:', // deck:a_more
          ],
          list: [
            `כולל ${PRICES.hosting_months_included} חודשי אחסון. אחר כך 49 ₪ לשנה כולל מע"מ, או לקחת את הקבצים.`, // deck:s1_hosting_line (r5b)
            FINISH.emailReason, // copy.ts (deck:s4_email_reason, first sentence)
            'בתחתית האתר מופיעה השורה "האתר נבנה עם MESSY". היא שם מההתחלה. אחרי העלייה לאוויר אפשר להוריד אותה בכל זמן.', // deck:s1_credit_note
          ],
        },
        {
          q: 'אפשר לשנות טקסטים אחרי שהאתר עלה?', // deck:s1_faq_q 7
          a: [
            'עוד אי אפשר לערוך את הטקסטים לבד. זה בהכנה ועדיין לא חלק ממה שמשלמים עליו.', // deck:a_edit
            'מה שכן: רואים את האתר בתצוגה מקדימה פרטית לפני שמשלמים, ואפשר לבקש סבב תיקונים.', // NEW (from deck:how3_b + deck:refund_line)
          ],
        },
      ],
      qLink: { before: 'יש שאלה לפני? ', label: 'לכתוב לי כאן', href: mailto('שאלה על MESSY') }, // deck:s1_question_link
    },
    close: {
      cta: 'להתחיל את השיחה', // deck:lane1_cta_start
      priceLine: priceLine(), // copy.ts
      lane2: { label: 'ולמי שרוצה לעבוד עם בן אדם: פגישת דיוק עם ליונל', tail: `, ${PRICES.session_price} ₪.` }, // deck:lane2_text_link + the price (NEW tail)
      figAlt: 'ליונל, איור', // NEW (alt text)
    },
    foot: 'נבנה על ידי ליונל מיטלפונקט', // deck:maker_line
  },
  en: {
    header: { maker: 'Built by Lionel Mitelpunkt', cta: 'Start', langHe: 'עב', langEn: 'EN' },
    hero: {
      prehead: 'For professionals who work with people',
      situation: 'Inside the room you know exactly what you do. Outside it, the words go missing.',
      h1Start: 'Your words, also ',
      h1Mark: 'outside the room.',
      mechanism: 'Written questions. At the end you get your own sentences, in order, in one document. Then a one-page site built from them.',
      aiLine: 'A written conversation with an AI tool built by Lionel Mitelpunkt.',
      cta: 'Start the conversation',
      priceLine: `The conversation and the document cost nothing. You see the site before you pay. Putting it live: ${goLivePrice()} ₪ incl. VAT, one payment, with a year of hosting.`,
      timeLine: 'The conversation takes 20 to 40 minutes. You can stop whenever you like.',
      artAlt: 'Watercolour: a figure inside a tangle of lines, and a path leading to a figure beside stone cairns.',
      privacy: { before: 'One click deletes everything, and ', link: 'what remains', after: ' is written down.' },
    },
    why: {
      lines: [
        'I know what being independent means: many hours alone, doing everything alone. And it can be different.',
        'People are not buying a website here. They are buying less loneliness on the way to explaining who they are.',
      ],
      stages: 'The way here: conversation · website · precision.',
      beat1: 'You can also build a site alone on Wix. The words still have to come from somewhere.',
      beat2: 'In Hebrew, "independent" means two things: someone who works for themselves, and someone who stands on their own. Neither of them says alone.',
      artAlt: 'Watercolour: a figure holding a child, with silhouettes of people and leaves around.',
    },
    demo: {
      heading: 'One sentence, before and after',
      tag: 'Example',
      intro: 'Noa is a fictional character. The conversation and the result were written to show the idea; they did not come out of MESSY. This is what it looked like for her:',
      beforeLabel: 'At the start of the conversation you wrote:',
      before: 'I am a carpenter. I teach woodwork at a school.',
      afterLabel: 'A suggested sentence, only from your words:',
      after: 'Teenagers who cannot sit still in class stand two hours over one piece of wood in my workshop. They leave with something in their hands they made themselves.',
      trace: 'This sentence is built from two things Noa wrote later in the conversation.',
      beforeAlt: 'First half of the watercolour: a figure inside a tangle of lines.',
      afterAlt: 'Second half of the watercolour: a path, stone cairns and a figure standing upright.',
    },
    how: {
      heading: 'How it works',
      steps: [
        { t: 'A written conversation with an AI tool', b: 'One question at a time. You answer in your words, at your pace. Stop whenever you like.' },
        { t: 'A document that stays yours', b: 'At the end you get your sentences, in order, in one document. It stays yours even if you go no further.' },
        { t: 'A one-page site', b: 'The site is built from those same sentences. You see it first in a private preview. You pay only if you want it live.' },
      ],
    },
    spec: {
      heading: 'What you get',
      freeHeading: 'Free',
      free: ['The written conversation.', 'The document. Yours even if you go no further.', 'A private preview of the site, ready within two business days.'],
      paidHeading: 'When the site goes live',
      outcome: 'Whoever gets the link can write to you on WhatsApp in one tap.',
      includedTitle: 'Included',
      paid: [
        'The site live and visible to Google, without the preview strip.',
        'A WhatsApp button with a ready message, for whoever wants to write to you.',
        `${PRICES.hosting_months_included} months of hosting. Your files, downloadable any time.`,
        'A full refund within 14 days.',
      ],
    },
    price: {
      heading: 'How much does it cost?',
      amount: `${goLivePrice()} ₪`,
      golive: `Putting the site live, only if you want to: ${goLivePrice()} ₪ incl. VAT, one payment, with a year of hosting.`,
      renewal: 'After that 49 ₪ a year incl. VAT, or take your files.',
      founding: PRICES.founding_open ? `Launch price for the first 20 sites, in return for written feedback. After that ${PRICES.golive_list_price} ₪ incl. VAT.` : null,
      cta: 'Start the conversation',
      refund: 'Up to 14 days after payment, ask and the money comes back. A round of fixes first, if you like. Not a condition. The document stays yours either way.',
      money: { before: 'Money will not stand in the way: you can ', link: 'write me', after: ' one line.' },
      invoice: 'The invoice is sent by email.',
    },
    fit: {
      limit: 'MESSY is an AI tool, not accompaniment and not therapy.',
      forH: 'Who is it for?',
      forT: 'People who work with people, know what happens in the room and are looking for a way to say it outside too.',
      notforH: 'Who is it less for?',
      notfor: ['Anyone looking for accompaniment or therapy.', 'Anyone who needs a multi-page site, a shop or appointment booking.', 'Anyone who already knows exactly what to say and wants only design.'],
    },
    about: {
      prov: 'Built by Lionel Mitelpunkt',
      quote: 'Seeing the person in front of you is the profession. Being seen like that yourself is rare.',
      reason: 'That is why I built MESSY: so that people who have not met you yet get to know you from your own words.',
      help: 'You did alone what can be done alone. From here I help you be precise.',
      figAlt: 'Lionel, illustrated',
    },
    faq: {
      heading: 'Questions',
      items: [
        { q: 'Who reads what I wrote? And how do I delete it?', a: ['Lionel reads every finished conversation, to improve the tool.', 'What is written here is processed by Anthropic, the company behind the AI.'], link: { label: 'Deletion and details', href: '/privacy' } },
        { q: 'How long does it take?', a: ['The conversation takes 20 to 40 minutes.', 'You can stop whenever you like.', 'The site preview is ready within two business days.'] },
        { q: 'I have no technical knowledge. Is this for me?', a: ['Yes. All you do is answer written questions. The site is built for you.'], link: { label: 'write me', href: mailto('A question about MESSY'), before: 'Stuck halfway? ' } },
        {
          q: 'Why not build it alone with AI or Wix?',
          a: ['You can ask a chatbot to write text for a site. It comes out nice, and it could be anyone\'s.', 'You can also build a site alone on Wix. The words still have to come from somewhere.', 'At MESSY the site starts with a conversation and is built from your sentences.', 'You see the site before you pay. You pay only if you want it live.'],
        },
        {
          q: 'Why so cheap? Where is the catch?',
          a: [...(PRICES.founding_open ? [`Launch price for the first 20 sites, in return for written feedback. After that ${PRICES.golive_list_price} ₪ incl. VAT.`] : []), 'The conversation, the document and the preview are free. You pay only if you want the site live.', 'Worth knowing before you start:'],
          list: [`Includes ${PRICES.hosting_months_included} months of hosting. After that 49 ₪ a year incl. VAT, or take your files.`, 'An email address is needed to send you the link to the site.', 'The line "Built with MESSY" sits at the bottom of the site from the start. Once live, you can ask to remove it any time.'],
        },
        { q: 'Can I change texts after the site is live?', a: ['Editing the texts yourself is not possible yet. It is in preparation and not part of what you pay for.', 'What you do get: you see the site in a private preview before paying, and you can ask for a round of fixes.'] },
      ],
      qLink: { before: 'A question first? ', label: 'Write me here', href: mailto('A question about MESSY') },
    },
    close: {
      cta: 'Start the conversation',
      priceLine: `The conversation and the document cost nothing. You see the site before you pay. Putting it live: ${goLivePrice()} ₪ incl. VAT, one payment, with a year of hosting.`,
      lane2: { label: 'And for anyone who wants to work with a human: a precision session with Lionel', tail: `, ${PRICES.session_price} ₪.` },
      figAlt: 'Lionel, illustrated',
    },
    foot: 'Built by Lionel Mitelpunkt',
  },
};

export default function LandingPageContent() {
  const [lang, setLang] = useState<Lang>('he');
  const c = t[lang];
  const isHe = lang === 'he';

  return (
    <div className={`lp ${assistant.variable}`} dir={isHe ? 'rtl' : 'ltr'} lang={lang}>
      <header className="hdr">
        <div className="wrap hdr-in">
          <Link href="/" className="brand" aria-label="MESSY">
            <Image src="/logo-messy.png" alt="MESSY" width={249} height={227} priority />
            <span className="maker">{c.header.maker}</span>
          </Link>
          <div className="hdr-act">
            <div className="lang" role="group" aria-label="Language">
              <button type="button" onClick={() => setLang('he')} aria-pressed={isHe} lang="he">
                {c.header.langHe}
              </button>
              <button type="button" onClick={() => setLang('en')} aria-pressed={!isHe} lang="en">
                {c.header.langEn}
              </button>
            </div>
            <Link href="/interview" className="btn btn-sm">
              {c.header.cta}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 1 · hero: who, what, what next, on the first phone screen (S1 order) */}
        <section className="hero g-room" aria-labelledby="h1">
          <div className="wrap hero-grid">
            <div className="hero-txt">
              <p className="prehead">{c.hero.prehead}</p>
              <p className="situation">{c.hero.situation}</p>
              <h1 id="h1">
                {c.hero.h1Start}
                <span className="mk">{c.hero.h1Mark}</span>
              </h1>
              <p className="lead">{c.hero.mechanism}</p>
              <p className="muted">{c.hero.aiLine}</p>
              <div className="hero-act">
                <Link href="/interview" className="btn">
                  {c.hero.cta}
                </Link>
                <p className="under">{c.hero.priceLine}</p>
                <p className="under">{c.hero.timeLine}</p>
              </div>
            </div>
            <figure className="art hero-art">
              <Image src="/journey_field.webp" alt={c.hero.artAlt} width={1376} height={768} priority sizes="(min-width: 900px) 50vw, 100vw" />
            </figure>
          </div>
          <div className="wrap">
            <p className="privacy-line">
              {c.hero.privacy.before}
              <Link href="/privacy" className="inl">
                {c.hero.privacy.link}
              </Link>
              {c.hero.privacy.after}
            </p>
          </div>
        </section>

        {/* 2 · the WHY, moved up (Lionel 2026-10-17), with the Wix beat under it */}
        <section className="sec g-surface2" id="why" aria-label={isHe ? 'למה' : 'Why'}>
          <div className="wrap why-grid">
            <div>
              <div className="why-lines">
                {c.why.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p className="stages">{c.why.stages}</p>
              </div>
              <div className="why-beat">
                <p>{c.why.beat1}</p>
                <p>{c.why.beat2}</p>
              </div>
            </div>
            <figure className="art why-art">
              <Image src="/constellation_field.webp" alt={c.why.artAlt} width={1200} height={670} sizes="(min-width: 900px) 40vw, 100vw" />
            </figure>
          </div>
        </section>

        {/* 3 · one sentence, before and after (the fictional demo, S1 ruling 1) */}
        <section className="sec g-room" id="proof" aria-labelledby="proof-h">
          <div className="wrap">
            <div className="sec-head narrow">
              <h2 id="proof-h">
                {c.demo.heading} <span className="tag">{c.demo.tag}</span>
              </h2>
              <p className="muted">{c.demo.intro}</p>
            </div>
            <div className="ba">
              <div className="ba-half">
                <div className="ba-pic">
                  <Image src="/journey_before.webp" alt={c.demo.beforeAlt} width={900} height={930} sizes="(min-width: 900px) 50vw, 100vw" />
                </div>
                <div className="ba-txt">
                  <p className="ba-label">{c.demo.beforeLabel}</p>
                  <p className="ba-before">&quot;{c.demo.before}&quot;</p>
                </div>
              </div>
              <div className="ba-half">
                <div className="ba-pic">
                  <Image src="/journey_after.webp" alt={c.demo.afterAlt} width={900} height={930} sizes="(min-width: 900px) 50vw, 100vw" />
                </div>
                <div className="ba-txt">
                  <p className="ba-label">{c.demo.afterLabel}</p>
                  <p className="ba-after">{c.demo.after}</p>
                  <p className="ba-trace">{c.demo.trace}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 · how it works */}
        <section className="sec g-surface2" id="how" aria-labelledby="how-h">
          <div className="wrap">
            <div className="sec-head">
              <h2 id="how-h">{c.how.heading}</h2>
            </div>
            <ol className="steps">
              {c.how.steps.map((s) => (
                <li key={s.t}>
                  <h3>{s.t}</h3>
                  <p>{s.b}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 5 · what you get */}
        <section className="sec g-room" id="spec" aria-labelledby="spec-h">
          <div className="wrap">
            <div className="sec-head">
              <h2 id="spec-h">{c.spec.heading}</h2>
            </div>
            <div className="doors">
              <div className="door g-surface2">
                <h3>{c.spec.freeHeading}</h3>
                <ul className="list">
                  {c.spec.free.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="door g-surface2">
                <h3>{c.spec.paidHeading}</h3>
                <p className="lead">{c.spec.outcome}</p>
                <p className="prov">{c.spec.includedTitle}</p>
                <ul className="list">
                  {c.spec.paid.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 6 · price */}
        <section className="sec g-surface2" id="price" aria-labelledby="price-h">
          <div className="wrap">
            <div className="sec-head">
              <h2 id="price-h">{c.price.heading}</h2>
            </div>
            <div className="board">
              <p className="amount">{c.price.amount}</p>
              <p className="lead">{c.price.golive}</p>
              <p className="note">{c.price.renewal}</p>
              {c.price.founding && <p className="note">{c.price.founding}</p>}
              <Link href="/interview" className="btn">
                {c.price.cta}
              </Link>
              <p className="note muted">{c.price.refund}</p>
              <p className="note">
                {c.price.money.before}
                <a href={mailto(isHe ? 'שורה אחת' : 'One line')} className="inl">
                  {c.price.money.link}
                </a>
                {c.price.money.after}
              </p>
              <p className="note muted">{c.price.invoice}</p>
            </div>
          </div>
        </section>

        {/* 7 · for whom, with the plain limit above it */}
        <section className="sec g-room" id="fit" aria-labelledby="limit-line">
          <div className="wrap fit-grid">
            <div className="sec-head">
              <p className="limit" id="limit-line">
                {c.fit.limit}
              </p>
              <h2>{c.fit.forH}</h2>
            </div>
            <div>
              <ul className="fit-list">
                <li>{c.fit.forT}</li>
              </ul>
              <div className="notfit" style={{ marginTop: 26 }}>
                <h3>{c.fit.notforH}</h3>
                <ul>
                  {c.fit.notfor.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 8 · who is behind this: Lionel's figure, his three lines */}
        <section className="sec g-surface2" id="about" aria-labelledby="about-h">
          <div className="wrap about-grid">
            <div className="fig">
              <Image src="/lionel-mug.webp" alt={c.about.figAlt} width={582} height={740} sizes="280px" />
            </div>
            <div className="about-txt">
              <p className="prov" id="about-h">
                {c.about.prov}
              </p>
              <p className="quote">{c.about.quote}</p>
              <p className="lead">{c.about.reason}</p>
              <p className="lead">{c.about.help}</p>
            </div>
          </div>
        </section>

        {/* 9 · questions */}
        <section className="sec g-room" id="faq" aria-labelledby="faq-h">
          <div className="wrap">
            <div className="sec-head">
              <h2 id="faq-h">{c.faq.heading}</h2>
            </div>
            <div className="drawers narrow">
              {c.faq.items.map((item) => (
                <details key={item.q} className="drawer">
                  <summary>
                    <span>{item.q}</span>
                    <span className="dx" aria-hidden="true" />
                  </summary>
                  <div className="drawer-in">
                    {item.a.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                    {item.list && (
                      <ul className="list">
                        {item.list.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    )}
                    {item.link && (
                      <p>
                        {item.link.before}
                        {item.link.href.startsWith('/') ? (
                          <Link href={item.link.href} className="inl">
                            {item.link.label}
                          </Link>
                        ) : (
                          <a href={item.link.href} className="inl">
                            {item.link.label}
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
            <p className="q-link">
              {c.faq.qLink.before}
              <a href={c.faq.qLink.href} className="inl">
                {c.faq.qLink.label}
              </a>
            </p>
          </div>
        </section>

        {/* 10 · close: the button, the price line, and the one quiet lane-2 link */}
        <section className="sec g-deep close" id="close" aria-labelledby="close-cta">
          <div className="wrap close-grid">
            <div className="fig">
              <Image src="/lionel-open-hands.webp" alt={c.close.figAlt} width={600} height={740} sizes="280px" />
            </div>
            <div>
              <Link href="/interview" className="btn" id="close-cta">
                {c.close.cta}
              </Link>
              <p className="under">{c.close.priceLine}</p>
              <p className="lane2">
                <a href={mailto(isHe ? 'פגישת דיוק' : 'Precision session')} className="inl">
                  {c.close.lane2.label}
                </a>
                {c.close.lane2.tail}
              </p>
            </div>
          </div>
        </section>
      </main>

      <div className="wrap foot">
        <div className="foot-in">
          <span>{c.foot}</span>
        </div>
      </div>
    </div>
  );
}
