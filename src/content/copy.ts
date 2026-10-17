/**
 * Hebrew strings the interview shows. Deck keys are named where a string comes
 * from messy-sites/board/copy-deck.md. The NEW strings were read by the Hebrew
 * panel on 2026-10-11 (messy-sites/board/v3/06-hebrew-panel.md).
 *
 * Launch gate: the "questions are built on the way I listen" line (decision AI,
 * panel-soul §3.6) must NOT appear anywhere public until Lionel approves his
 * listening moves. A test fails if its Hebrew text shows up anywhere in src/.
 */
import type { Gender } from '@/lib/session';
import { PRICES, goLivePrice, previewReadyWords } from './prices';

/** Q28, verbatim. */
export const READING_LINE = 'ליונל קורא כל שיחה שהסתיימה, כדי לשפר את הכלי';

/** s4_ai_line: the AI line that is true today. */
export const AI_LINE_TRUE_TODAY = 'שיחה בכתב עם כלי AI שבנה ליונל מיטלפונקט.';

/** s1_price_line, numbers from prices.json. */
export function priceLine(): string {
  const free = PRICES.interview_price === 0 && PRICES.document_price === 0;
  const year = PRICES.hosting_months_included === 12 ? 'שנה' : `${PRICES.hosting_months_included} חודשים`;
  return `${free ? 'השיחה והמסמך בלי עלות. ' : ''}רואים את האתר לפני שמשלמים. להעלות אותו לאוויר: ${goLivePrice()} ₪ כולל מע"מ בתשלום אחד, עם ${year} של אחסון.`;
}

export const CONSENT = {
  /** s1_start_stub H1 */
  title: 'שיחה בכתב עם כלי AI',
  aiLine: AI_LINE_TRUE_TODAY,
  /** D14 item 1 direction */
  skipLine: 'אפשר לדלג על כל שאלה או לעצור מתי שרוצים.',
  privacyHeading: 'לפני שמתחילים',
  readingLine: `${READING_LINE}.`,
  /** D15: say the conversation is processed by an AI provider. Hebrew panel 2026-10-11 (Anthropic builds the model, it does not "operate" it here). */
  providerLine: 'מה שנכתב כאן נשלח לעיבוד אצל Anthropic, החברה שמאחורי ה־AI.',
  /** Legal cover v1.1 (messy-sites/board/legal/01-texts.md §ב), verbatim. */
  ageLine: 'השיחה מיועדת לגיל 18 ומעלה.',
  sensitiveLine: 'אין חובה לכתוב מידע אישי רגיש. בבקשה לא לכתוב שמות של לקוחות או של אנשים אחרים.',
  abroadLine: 'השירותים שהכלי נשען עליהם פועלים מחוץ לישראל.',
  /** §ב: the link to the privacy page, in place of the old slot. */
  privacyLink: { label: 'מה נשמר ולכמה זמן', href: '/privacy' },
  nameLabel: 'איך קוראים לך?',
  genderLegend: 'באיזו לשון נוח לך שאפנה?',
  genderF: 'נקבה',
  genderM: 'זכר',
  /** §ב: one box for the age and the transfer abroad (the legal cover's recommendation). Any gender. */
  agree: 'קראתי את מה שכתוב כאן, כולל ההעברה לשירותים מחוץ לישראל. מלאו לי 18, ואני רוצה להתחיל.',
  start: 'להתחיל',
  /** Shown in a muted line while the browser solves the invisible proof-of-work challenge. */
  solving: 'רגע, בודקים שזה לא רובוט',
  /** The honeypot field. People never see it (hidden from view and from screen readers); bots fill it. */
  honeypotLabel: 'אל תמלאו שדה זה',
  errors: {
    name: 'צריך לכתוב שם, עד 40 אותיות.',
    gender: 'צריך לבחור לשון פנייה.',
    agree: 'כדי להתחיל, צריך לסמן את התיבה.',
    generic: 'משהו לא עבד. אפשר לנסות שוב בעוד רגע.',
    rate: 'יותר מדי ניסיונות. אפשר לנסות שוב מאוחר יותר.',
    /** Cloudflare Turnstile ("verify you are human") on the start form. */
    humanFailed: 'האימות לא הצליח, אפשר לנסות שוב',
    humanUnavailable: 'האימות לא זמין כרגע, נסו שוב בעוד רגע',
  },
};

/** The bot's first message: fixed text, no model call, captures before_sentence (D14 item 2). */
export function openingMessage(name: string, gender: Gender): string {
  const q =
    gender === 'f'
      ? 'נתחיל: במה את עובדת? במילים שלך, כמו שהיית מספרת למישהו שפגשת עכשיו.'
      : 'נתחיל: במה אתה עובד? במילים שלך, כמו שהיית מספר למישהו שפגשת עכשיו.';
  return `היי ${name}, טוב שהגעת. ${CONSENT.skipLine}\n${q}`;
}

/** The room-and-colour question (template v3), exact wording per form of address. */
export function roomQuestion(gender: Gender): string {
  return gender === 'f'
    ? 'מה יש בחדר שבו את עובדת, ואיזה צבע יש בו?'
    : 'מה יש בחדר שבו אתה עובד, ואיזה צבע יש בו?';
}

export const CHAT = {
  placeholder: 'לכתוב כאן',
  send: 'לשלוח',
  finishNow: 'לסיים וליצור את המסמך',
  backToChat: 'חזרה לשיחה',
  tooLong: (max: number) => `אפשר עד ${max} תווים בהודעה.`,
  error: 'משהו לא עבד. אפשר לנסות שוב.',
  slowDown: 'רגע, אפשר לשלוח שוב בעוד כמה שניות.',
  /** Shown instead of any reply that leaks the instructions. Gender-invariant. Hebrew panel 2026-10-11: משתף -> חושף. */
  deflection: 'את זה הכלי לא חושף. נחזור לשאלה האחרונה, ואפשר לענות עליה במילים שלך.',
};

export const FINISH = {
  /** NEW */
  heading: 'לפני המסמך',
  /** Gender-invariant ("רוצה" is both forms). */
  previewQuestion: 'רוצה לקבל במייל תצוגה מקדימה של האתר שייבנה מהמסמך? אפשר להשאיר כתובת. לא חובה.',
  /** s4_email_reason, first sentence only (the reminders it mentions aren't built yet) */
  emailReason: 'צריך כתובת מייל כדי לשלוח את הקישור לאתר.',
  emailLabel: 'מייל (לא חובה)',
  emailInvalid: 'הכתובת לא נראית תקינה.',
  create: 'ליצור את המסמך',
  working: 'המסמך בהכנה. זה לוקח עד דקה.',
  /** Lionel 2026-10-17: say how long each thing takes, before the person decides. Numbers from prices.ts. Any gender. */
  timing: `המסמך מוכן כאן תוך דקה. תצוגת האתר נשלחת למייל בתוך ${previewReadyWords()}, עם קישור אישי לצפייה ולהערות.`,
};

export const DONE = {
  /** NEW */
  ready: 'המסמך מוכן.',
  view: 'לצפייה במסמך',
  /** s4_stop_line */
  stop: 'אפשר לעצור כאן. המסמך שלם ושלך.',
  /** Shown only when an address was left. "השארת" reads the same in both forms. */
  timing: `השארת מייל, אז תצוגת האתר תגיע אליו בתוך ${previewReadyWords()}. אם היא לא הגיעה, שווה לבדוק גם בתיקיית הספאם.`,
  deleteLink: 'למחיקת השיחה והמסמך',
  deleteDemoMarker: '[תצוגה בלבד: המחיקה עוד לא מחוברת לאחסון קבוע]',
};

/**
 * The footer on every page (legal cover v1.1, review decision 12). The labels are the pages' own
 * titles; "ביטול עסקה" opens an email, which the terms (§ג "ביטול והחזר") name as a way to ask.
 */
export const FOOTER = {
  privacy: 'פרטיות',
  terms: 'תנאים והחזרים',
  accessibility: 'הצהרת נגישות',
  cancel: 'ביטול עסקה',
  cancelHref: `mailto:lionmit@gmail.com?subject=${encodeURIComponent('ביטול עסקה')}`,
};

/**
 * The self-service "delete my data" page (/delete). Before any button it declares
 * what is held, what deletion removes, what it does not remove and why, and that
 * it cannot be undone. Every form is gender-invariant.
 */
export const DELETE_PAGE = {
  title: 'מחיקת הנתונים שלי',
  heldHeading: 'מה שמור',
  held: 'השיחה המלאה, המסמך שנבנה ממנה, וכתובת המייל אם השארת אותה.',
  removesHeading: 'מה המחיקה מוחקת',
  removes:
    'כל אלה נמחקים מהאחסון של MESSY. אם נבנתה מהשיחה תצוגה מקדימה של אתר, גם היא יורדת מהרשת, יחד עם כל הקבצים שלה, בתוך שעה.',
  keptHeading: 'מה לא נמחק, ולמה',
  kept: 'העותק שליונל מקבל על כל שיחה (גיליון שמור אצלו) ומיילים שכבר נשלחו לא נמחקים אוטומטית. אפשר לבקש גם את מחיקתם במייל lionmit@gmail.com, והם יימחקו ידנית בתוך 7 ימים.',
  keptMail: 'lionmit@gmail.com',
  keptMailHref: `mailto:lionmit@gmail.com?subject=${encodeURIComponent('בקשת מחיקה')}`,
  irreversible: 'אי אפשר לבטל את המחיקה.',
  acknowledge: 'הבנתי, ואני רוצה למחוק',
  confirm: 'למחוק את הנתונים שלי',
  working: 'המחיקה מתבצעת.',
  /** The receipt line. `when` is the person's local date and time. */
  done: (when: string) => `הנתונים נמחקו. תאריך ושעה: ${when}. אפשר לצלם את המסך הזה כאישור.`,
  /** Shown under the receipt: the same note about what comes down within the hour. */
  doneNote: 'אם נבנתה מהשיחה תצוגה מקדימה של אתר, גם היא יורדת מהרשת, יחד עם כל הקבצים שלה, בתוך שעה.',
  notFound: 'לא נמצא מה למחוק. ייתכן שכבר נמחק.',
  failed: 'המחיקה לא הצליחה.',
  retry: 'לנסות שוב',
  invalid: 'הקישור לא תקין.',
};
