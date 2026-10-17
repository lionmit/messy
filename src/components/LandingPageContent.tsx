'use client';

/**
 * The home page, in the respondent sites' family (messy-sites/v3 template, "sand" preset):
 * paper ground, Assistant, terracotta button, the same section rhythm.
 *
 * Section order (2026-10-17, after three persona walks: Dana the phone reader suspicious of AI,
 * Noa who built her own Wix site, Yoav who asks who reads what): what is this · is it for me ·
 * why, in Lionel's voice · what you get (the demo) · how long and what it asks · what it costs
 * and when · who reads what and how to delete · the five questions left (technical, the catch, when live, editing, domain) · close.
 * The FAQ holds only questions the page does not answer on its own.
 *
 * Copy sources, line by line, are marked in the `t` object:
 *   deck:<key>   word for word from messy-sites/board/copy-deck.md (accepted lines; RETIRED lines are not used)
 *   copy.ts      strings the interview already shows (Hebrew panel 2026-10-11, legal cover v1.1)
 *   legal        the privacy page (messy-sites/board/legal/01-texts.md via legal.generated.ts)
 *   NEW          a new line or a splice of approved fragments, for Lionel's approval before production
 * The gated sentence about the questions being built on the way Lionel listens is not here (not allowed yet).
 * Every line is gender-neutral (infinitives, "מי ש", past tense); no dashes, no dot-forms, no superlatives.
 *
 * Images: MESSY's own illustrations, set 2 (2026-10-17): the product from the user's side, her chat becoming a
 * document, the document becoming her page, editing by chat, the link being sent, a client finding her site.
 * Lionel's sticker figure appears once, in a small portrait frame beside the maker line in the WHY block.
 */
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AI_LINE_TRUE_TODAY, CONSENT, FINISH, READING_LINE, priceLine } from '@/content/copy';
import { PRICES, goLivePrice } from '@/content/prices';
import './landing.css';

type Lang = 'he' | 'en';

const MAIL = 'lionmit@gmail.com';
const mailto = (subject: string) => `mailto:${MAIL}?subject=${encodeURIComponent(subject)}`;

interface FaqItem {
  q: string;
  a: readonly string[];
  list?: readonly string[];
  link?: { label: string; href: string; before?: string };
  img?: { src: string; width: number; height: number };
}
interface Copy {
  header: { maker: string; cta: string; langHe: string; langEn: string };
  hero: {
    prehead: string; situation: string; h1Start: string; h1Mark: string; mechanism: string; aiLine: string; cta: string;
    priceLine: string; timeLine: string; privacy: { before: string; link: string; after: string };
  };
  fit: { limit: string; forH: string; forT: string; notforH: string; notfor: readonly string[] };
  why: { prov: string; lines: readonly string[]; stages: string; beat: readonly string[]; figAlt: string };
  demo: {
    heading: string; tag: string; intro: string; beforeLabel: string; before: string; afterLabel: string; after: string; trace: string;
    whySentence: string;
  };
  how: { heading: string; steps: readonly { t: string; b: string }[] };
  offer: {
    heading: string; freeHeading: string; free: readonly string[]; paidHeading: string; outcome: string; includedTitle: string;
    paid: readonly string[]; priceHeading: string; amount: string; golive: string; liveWhen: string; renewal: string; founding: string | null; cta: string;
    refund: string; money: { before: string; link: string; after: string }; invoice: string;
  };
  privacy: { heading: string; lines: readonly string[]; link: { label: string; href: string } };
  faq: { heading: string; items: readonly FaqItem[]; qLink: { before: string; label: string; href: string } };
  close: { cta: string; priceLine: string; lane2: { label: string; tail: string } };
  foot: string;
  art: { hero: string; roomOutside: string; stages: string; editing: string; whatYouGet: string; sending: string; client: string };
}

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
      privacy: { before: 'אפשר למחוק הכל בלחיצה, וכתוב ', link: 'מה כן נשאר', after: '.' }, // Eitan's line, agreed by the board
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
    why: {
      prov: 'נבנה על ידי ליונל מיטלפונקט', // deck:maker_line (gives the first person below its owner on the phone)
      lines: [
        'אני יודע מה זה להיות עצמאי: הרבה שעות לבד, לעשות הכל לבד. ואפשר אחרת.', // NEW (from Lionel's words)
        'אנשים לא קונים פה אתר. הם קונים פחות בדידות בדרך להסביר מי הם.', // NEW (from Lionel's words)
      ],
      stages: 'הדרך כאן: שיחה · אתר · דיוק.', // NEW
      beat: [
        'אפשר לבקש מצ\'אט לכתוב טקסט לאתר. יוצא טקסט יפה, שיכול להיות של כל אחד.', // deck:s1_why_not_chatgpt line 1
        'ואפשר לבנות אתר לבד בוויקס. את המילים עדיין צריך להביא מאיפשהו.', // deck:s1_why_not_chatgpt line 2 (copy-deck.md:233)
        'בעברית, עצמאי זה שני דברים. מי שעובד לעצמו. ומי שעומד בפני עצמו. אף אחד מהם לא אומר לבד.', // deck:bridge_atzmai (copy-deck.md:29)
      ],
      figAlt: 'ליונל, איור', // NEW (alt text)
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
      whySentence: 'לראות את האדם שמולך, זה המקצוע. שיראו אותך ככה, זה כבר נדיר.', // deck:why_sentence (S1: after the before/after card)
    },
    how: {
      heading: 'איך זה עובד', // deck:s1_how_heading
      steps: [
        { t: 'שיחה בכתב עם כלי AI', b: 'שאלה אחת בכל פעם. עונים במילים שלך, בקצב שלך. אפשר לעצור מתי שרוצים.' }, // deck:how1
        { t: 'מסמך שנשאר שלך', b: 'בסוף מקבלים את המשפטים שלך, מסודרים, במסמך אחד. נשאר שלך גם אם לא ממשיכים.' }, // deck:how2_t; body NEW splice of deck:s1_mechanism_line + deck:free2
        { t: 'אתר של עמוד אחד', b: 'האתר נבנה מאותם משפטים. רואים אותו קודם בתצוגה מקדימה פרטית. משלמים רק אם רוצים שיעלה לאוויר.' }, // deck:how3_t + how3_b + how3_c
      ],
    },
    offer: {
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
      ],
      priceHeading: 'כמה זה עולה?', // deck:s1_price_heading
      amount: `${goLivePrice()} ₪`,
      golive: `להעלות את האתר לאוויר, רק אם רוצים: ${goLivePrice()} ₪ כולל מע"מ בתשלום אחד, עם שנה של אחסון.`, // deck:s4_golive_line
      liveWhen: 'אחרי התשלום ליונל מאשר, ובדרך כלל האתר באוויר תוך שעות. לכל היותר 48 שעות.', // Lionel 2026-10-17, approved
      renewal: 'אחר כך 49 ₪ לשנה כולל מע"מ, או לקחת את הקבצים.', // deck:s1_hosting_line (r5b), without its first sentence
      founding: PRICES.founding_open
        ? `מחיר השקה ל־20 האתרים הראשונים, בתמורה למשוב כתוב. אחר כך ${PRICES.golive_list_price} ₪ כולל מע"מ.` // deck:s1_founding_line (r5b)
        : null,
      cta: 'להתחיל את השיחה', // deck:lane1_cta_start
      refund: 'עד 14 יום מהתשלום, מבקשים והכסף חוזר. אם רוצים, קודם סבב תיקונים. זה לא תנאי. המסמך נשאר שלך בכל מקרה.', // deck:refund_line
      money: { before: 'כסף לא יעמוד בדרך: אפשר ', link: 'לכתוב לי', after: ' שורה אחת.' }, // deck:money_line
      invoice: 'חשבונית נשלחת למייל.', // deck:s1_invoice_line
    },
    privacy: {
      heading: 'מי קורא את מה שכתבתי? ואיך מוחקים?', // deck:s1_faq_q 1, as the section heading
      lines: [
        `${READING_LINE}.`, // copy.ts (Q28, verbatim)
        CONSENT.providerLine, // copy.ts (Hebrew panel 2026-10-11)
        CONSENT.abroadLine, // copy.ts (legal cover v1.1 §ב)
        CONSENT.sensitiveLine, // copy.ts (legal cover v1.1 §ב)
        'השיחה והמסמך נשמרים באחסון פרטי של Vercel. השיחה המלאה נמחקת אוטומטית אחרי 90 יום.', // legal §א.1, first two clauses of the approved sentence (splice: NEW)
      ],
      link: { label: 'למחיקה ולפרטים', href: '/privacy' }, // deck:a_delete_link
    },
    faq: {
      heading: 'שאלות נפוצות', // deck:s1_faq_heading
      items: [
        {
          q: 'אין לי שום ידע טכני. זה מתאים לי?', // deck:s1_faq_q 3
          a: ['כן. כל מה שצריך לעשות זה לענות על שאלות בכתב. את האתר בונים בשבילך.'], // deck:a_tech
          link: { label: 'לכתוב לי כאן', href: mailto('שאלה על MESSY'), before: 'נתקעת באמצע? ' }, // deck:a_stuck + deck:write_here
        },
        {
          q: 'למה זה כל כך זול? איפה הקאץ\'?', // deck:s1_faq_q 4
          a: [
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
          q: 'שילמתי. מתי האתר באוויר?', // deck:s1_faq_q 5
          a: ['אחרי התשלום ליונל מאשר, ובדרך כלל האתר באוויר תוך שעות. לכל היותר 48 שעות.'], // Lionel 2026-10-17, approved
        },
        {
          q: 'אפשר לשנות טקסטים אחרי שהאתר עלה?', // deck:s1_faq_q 7
          // Lionel 2026-10-17: deck:a_edit (11.10) is no longer true. The owner page takes comments beside each part or in
          // the chat, two rounds are included, also after go-live; a third round is the דיוק session.
          a: [
            'כן. השינויים נעשים בדף האישי של האתר: אם משהו לא נכון או לא נשמע כמוך, כותבים אותו שם, בתיבה שליד אותו חלק או בצ\'אט.', // NEW: hebrew.py preview mail line, neutral form, plus the chat
            'יש שני סבבי הערות. אחרי כל סבב תעלה גרסה מתוקנת, גם אחרי שהאתר כבר באוויר. סבב שלישי לא כלול.', // hebrew.py rounds + no_more lines, with "גם אחרי שהאתר כבר באוויר" NEW
            'אם רוצים עוד שינויים אחרי זה, אפשר לעבוד על זה יחד עם ליונל בפגישת דיוק, אחד על אחד.', // NEW: hebrew.py "fixed" mail line, neutral form, with the session's name
          ],
          img: { src: '/editing-by-chat.webp', width: 1200, height: 896 },
        },
        {
          q: 'יש לי כבר דומיין. אפשר לחבר אותו?', // Lionel 2026-10-17, approved
          a: ['כן. מפנים אותו לכתובת של האתר לפי מדריך קצר, ואם מסתבכים כותבים לליונל והוא מחבר.'], // Lionel 2026-10-17, approved
        },
      ],
      qLink: { before: 'יש שאלה לפני? ', label: 'לכתוב לי כאן', href: mailto('שאלה על MESSY') }, // deck:s1_question_link
    },
    close: {
      cta: 'להתחיל את השיחה', // deck:lane1_cta_start
      priceLine: priceLine(), // copy.ts (the deck's closing block: button, price line, lane-2 link)
      lane2: { label: 'ולמי שרוצה לעבוד עם בן אדם: פגישת דיוק עם ליונל', tail: `, ${PRICES.session_price} ₪.` }, // deck:lane2_text_link + the price (NEW tail)
    },
    foot: 'נבנה על ידי ליונל מיטלפונקט', // deck:maker_line
    art: {
      // NEW (alt texts, short, the product moment from the user's side). MESSY's own illustrations, set 2 (2026-10-17).
      hero: 'אישה ליד שולחן עם טלפון ביד: בועות השיחה שלה זורמות אל דף אתר אחד במחשב.',
      roomOutside: 'שני צדדים: בחדר, שיחה פתוחה עם מטופלת. בבית בלילה, לבד מול מסך ריק.',
      stages: 'מימין לשמאל: שיחה בטלפון, דף מסמך, ואתר במחשב ובטלפון.',
      editing: 'על הספה עם טאבלט: סימוני עיפרון על דף האתר ובועת צ\'אט לידו.',
      whatYouGet: 'מלמעלה: המסמך על השולחן, ולידו טלפון עם האתר.',
      sending: 'שתי נשים בבית קפה, אחת מראה לשנייה את האתר שלה בטלפון.',
      client: 'באוטובוס: לקוחה מביטה באתר בטלפון, אצבע מעל הכפתור, ודלת הקליניקה נראית מהחלון.',
    },
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
      privacy: { before: 'One click deletes everything, and ', link: 'what remains', after: ' is written down.' },
    },
    fit: {
      limit: 'MESSY is an AI tool, not accompaniment and not therapy.',
      forH: 'Who is it for?',
      forT: 'People who work with people, know what happens in the room and are looking for a way to say it outside too.',
      notforH: 'Who is it less for?',
      notfor: ['Anyone looking for accompaniment or therapy.', 'Anyone who needs a multi-page site, a shop or appointment booking.', 'Anyone who already knows exactly what to say and wants only design.'],
    },
    why: {
      prov: 'Built by Lionel Mitelpunkt',
      lines: [
        'I know what being independent means: many hours alone, doing everything alone. And it can be different.',
        'People are not buying a website here. They are buying less loneliness on the way to explaining who they are.',
      ],
      stages: 'The way here: conversation · website · precision.',
      beat: [
        'You can ask a chatbot to write text for a site. It comes out nice, and it could be anyone\'s.',
        'You can also build a site alone on Wix. The words still have to come from somewhere.',
        'In Hebrew, "independent" means two things: someone who works for themselves, and someone who stands on their own. Neither of them says alone.',
      ],
      figAlt: 'Lionel, illustrated',
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
      whySentence: 'Seeing the person in front of you is the profession. Being seen like that yourself is rare.',
    },
    how: {
      heading: 'How it works',
      steps: [
        { t: 'A written conversation with an AI tool', b: 'One question at a time. You answer in your words, at your pace. Stop whenever you like.' },
        { t: 'A document that stays yours', b: 'At the end you get your sentences, in order, in one document. It stays yours even if you go no further.' },
        { t: 'A one-page site', b: 'The site is built from those same sentences. You see it first in a private preview. You pay only if you want it live.' },
      ],
    },
    offer: {
      heading: 'What you get',
      freeHeading: 'Free',
      free: ['The written conversation.', 'The document. Yours even if you go no further.', 'A private preview of the site, ready within two business days.'],
      paidHeading: 'When the site goes live',
      outcome: 'Whoever gets the link can write to you on WhatsApp in one tap.',
      includedTitle: 'Included',
      paid: ['The site live and visible to Google, without the preview strip.', 'A WhatsApp button with a ready message, for whoever wants to write to you.', `${PRICES.hosting_months_included} months of hosting. Your files, downloadable any time.`],
      priceHeading: 'How much does it cost?',
      amount: `${goLivePrice()} ₪`,
      golive: `Putting the site live, only if you want to: ${goLivePrice()} ₪ incl. VAT, one payment, with a year of hosting.`,
      liveWhen: 'After payment Lionel approves, and the site is usually live within hours. At most 48 hours.',
      renewal: 'After that 49 ₪ a year incl. VAT, or take your files.',
      founding: PRICES.founding_open ? `Launch price for the first 20 sites, in return for written feedback. After that ${PRICES.golive_list_price} ₪ incl. VAT.` : null,
      cta: 'Start the conversation',
      refund: 'Up to 14 days after payment, ask and the money comes back. A round of fixes first, if you like. Not a condition. The document stays yours either way.',
      money: { before: 'Money will not stand in the way: you can ', link: 'write me', after: ' one line.' },
      invoice: 'The invoice is sent by email.',
    },
    privacy: {
      heading: 'Who reads what I wrote? And how do I delete it?',
      lines: [
        'Lionel reads every finished conversation, to improve the tool.',
        'What is written here is processed by Anthropic, the company behind the AI.',
        'The services the tool relies on run outside Israel.',
        'There is no need to write sensitive personal information. Please do not write names of clients or of other people.',
        'The conversation and the document are kept in private Vercel storage. The full conversation is deleted automatically after 90 days.',
      ],
      link: { label: 'Deletion and details', href: '/privacy' },
    },
    faq: {
      heading: 'Questions',
      items: [
        { q: 'I have no technical knowledge. Is this for me?', a: ['Yes. All you do is answer written questions. The site is built for you.'], link: { label: 'write me', href: mailto('A question about MESSY'), before: 'Stuck halfway? ' } },
        {
          q: 'Why so cheap? Where is the catch?',
          a: ['The conversation, the document and the preview are free. You pay only if you want the site live.', 'Worth knowing before you start:'],
          list: [`Includes ${PRICES.hosting_months_included} months of hosting. After that 49 ₪ a year incl. VAT, or take your files.`, 'An email address is needed to send you the link to the site.', 'The line "Built with MESSY" sits at the bottom of the site from the start. Once live, you can ask to remove it any time.'],
        },
        { q: 'I paid. When is the site live?', a: ['After payment Lionel approves, and the site is usually live within hours. At most 48 hours.'] },
        {
          q: 'Can I change texts after the site is live?',
          a: [
            'Yes. Changes happen on your personal site page: if something is wrong or does not sound like you, write it there, in the box beside that part or in the chat.',
            'Two comment rounds are included. After each round a corrected version goes up, also once the site is live. A third round is not included.',
            'If you want more changes after that, you can work on it with Lionel in a one-to-one precision session.',
          ],
          img: { src: '/editing-by-chat.webp', width: 1200, height: 896 },
        },
        { q: 'I already have a domain. Can I connect it?', a: ['Yes. You point it at the site\'s address with a short guide, and if it gets complicated you write to Lionel and he connects it.'] },
      ],
      qLink: { before: 'A question first? ', label: 'Write me here', href: mailto('A question about MESSY') },
    },
    close: {
      cta: 'Start the conversation',
      priceLine: `The conversation and the document cost nothing. You see the site before you pay. Putting it live: ${goLivePrice()} ₪ incl. VAT, one payment, with a year of hosting.`,
      lane2: { label: 'And for anyone who wants to work with a human: a precision session with Lionel', tail: `, ${PRICES.session_price} ₪.` },
    },
    foot: 'Built by Lionel Mitelpunkt',
    art: {
      hero: 'A woman at her table, phone in hand: her chat bubbles flow into a one-page site on the laptop.',
      roomOutside: 'Two sides: in the room, an easy conversation with a client. At home at night, alone in front of a blank screen.',
      stages: 'Right to left: the chat on the phone, the document, the site on laptop and phone.',
      editing: 'On the sofa with a tablet: pencil marks on the site page and a chat bubble beside it.',
      whatYouGet: 'From above: the document on the table, and beside it a phone with the site.',
      sending: 'Two women at a cafe, one showing the other her site on the phone.',
      client: 'On the bus: a client looking at the site on her phone, a finger over the button, the clinic door through the window.',
    },
  },
};

export default function LandingPageContent() {
  const [lang, setLang] = useState<Lang>('he');
  const c = t[lang];
  const isHe = lang === 'he';

  return (
    <div className="lp" dir={isHe ? 'rtl' : 'ltr'} lang={lang}>
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
        {/* 1 · what is this: who, what, what next, free, how long, on the first phone screen */}
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
              <Image src="/hero-words-to-page.webp" alt={c.art.hero} width={1376} height={768} priority sizes="(min-width: 900px) 50vw, 100vw" />
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

        {/* 2 · is it for me: the plain limit, then for whom and for whom less */}
        <section className="sec g-surface2" id="fit" aria-labelledby="limit-line">
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

        {/* 3 · why, in Lionel's voice, with his figure so the "אני" has an owner on the phone too */}
        <section className="sec g-room" id="why" aria-labelledby="why-prov">
          <div className="wrap why-grid">
            <div>
              <div className="who">
                <div className="ph-frame">
                  <Image src="/lionel-mug.webp" alt={c.why.figAlt} width={582} height={740} sizes="124px" />
                </div>
                <p className="prov" id="why-prov">
                  {c.why.prov}
                </p>
              </div>
              <div className="why-lines">
                {c.why.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p className="stages">{c.why.stages}</p>
              </div>
              <div className="why-beat">
                {c.why.beat.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
            <figure className="art why-art">
              <Image src="/sending-the-link.webp" alt={c.art.sending} width={1200} height={896} sizes="(min-width: 900px) 40vw, 100vw" />
            </figure>
          </div>
        </section>

        {/* 4 · what you get, shown: the fictional demo, then the WHY sentence (S1 ruling 1) */}
        <section className="sec g-surface2" id="proof" aria-labelledby="proof-h">
          <div className="wrap">
            <div className="sec-head narrow">
              <h2 id="proof-h">
                {c.demo.heading} <span className="tag">{c.demo.tag}</span>
              </h2>
              <p className="muted">{c.demo.intro}</p>
            </div>
            <div className="proof-grid">
              <figure className="art proof-art">
                <Image src="/in-the-room-vs-outside.webp" alt={c.art.roomOutside} width={1200} height={896} sizes="(min-width: 900px) 40vw, 100vw" />
              </figure>
              <div className="ba">
                <div className="ba-half">
                  <div className="ba-txt">
                    <p className="ba-label">{c.demo.beforeLabel}</p>
                    <p className="ba-before">&quot;{c.demo.before}&quot;</p>
                  </div>
                </div>
                <div className="ba-half">
                  <div className="ba-txt">
                    <p className="ba-label">{c.demo.afterLabel}</p>
                    <p className="ba-after">{c.demo.after}</p>
                    <p className="ba-trace">{c.demo.trace}</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="why-sentence">{c.demo.whySentence}</p>
          </div>
        </section>

        {/* 5 · how long and what it asks: the three steps, with the three-stages strip above them */}
        <section className="sec g-room" id="how" aria-labelledby="how-h">
          <div className="wrap">
            <div className="sec-head">
              <h2 id="how-h">{c.how.heading}</h2>
            </div>
            <figure className="art stages-art">
              <Image src="/three-stages.webp" alt={c.art.stages} width={1296} height={470} sizes="(min-width: 900px) 1120px, 100vw" />
            </figure>
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

        {/* 6 · what it costs and when: free card, then the paid card with the price inside it */}
        <section className="sec g-surface2" id="offer" aria-labelledby="offer-h">
          <div className="wrap">
            <div className="offer-head">
              <div className="sec-head">
                <h2 id="offer-h">{c.offer.heading}</h2>
              </div>
              <figure className="art offer-art">
                <Image src="/what-you-get.webp" alt={c.art.whatYouGet} width={1200} height={896} sizes="(min-width: 900px) 40vw, 100vw" />
              </figure>
            </div>
            <div className="doors">
              <div className="door">
                <h3>{c.offer.freeHeading}</h3>
                <ul className="list">
                  {c.offer.free.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="door">
                <h3>{c.offer.paidHeading}</h3>
                <p className="lead">{c.offer.outcome}</p>
                <p className="prov">{c.offer.includedTitle}</p>
                <ul className="list">
                  {c.offer.paid.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <div className="price-in">
                  <p className="prov">{c.offer.priceHeading}</p>
                  <p className="amount">{c.offer.amount}</p>
                  <p className="lead">{c.offer.golive}</p>
                  <p className="note">{c.offer.liveWhen}</p>
                  <p className="note">{c.offer.renewal}</p>
                  {c.offer.founding && <p className="note">{c.offer.founding}</p>}
                  <Link href="/interview" className="btn">
                    {c.offer.cta}
                  </Link>
                  <p className="note muted">{c.offer.refund}</p>
                  <p className="note">
                    {c.offer.money.before}
                    <a href={mailto(isHe ? 'שורה אחת' : 'One line')} className="inl">
                      {c.offer.money.link}
                    </a>
                    {c.offer.money.after}
                  </p>
                  <p className="note muted">{c.offer.invoice}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7 · who reads what, and how to delete: on the page, not in a drawer */}
        <section className="sec g-room" id="privacy" aria-labelledby="privacy-h">
          <div className="wrap fit-grid">
            <div className="sec-head">
              <h2 id="privacy-h">{c.privacy.heading}</h2>
            </div>
            <div className="privacy-lines">
              {c.privacy.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>
                <Link href={c.privacy.link.href} className="inl">
                  {c.privacy.link.label}
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* 8 · the questions the page does not answer on its own, in the order they come up */}
        <section className="sec g-surface2" id="faq" aria-labelledby="faq-h">
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
                    {item.img && (
                      <figure className="art faq-art">
                        <Image src={item.img.src} alt={c.art.editing} width={item.img.width} height={item.img.height} sizes="420px" />
                      </figure>
                    )}
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

        {/* 9 · close: the deck's closing block (button, price line, the one quiet lane-2 link) */}
        <section className="sec g-deep close" id="close" aria-labelledby="close-cta">
          <div className="wrap close-grid">
            <figure className="art close-art">
              <Image src="/client-finds-her.webp" alt={c.art.client} width={1200} height={896} sizes="(min-width: 900px) 33vw, 90vw" />
            </figure>
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
