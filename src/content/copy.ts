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
import { PRICES, goLivePrice } from './prices';

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
  privacyLinkSlot: '[ממתין: קישור לעמוד הפרטיות]',
  nameLabel: 'איך קוראים לך?',
  genderLegend: 'באיזו לשון נוח לך שאפנה?',
  genderF: 'נקבה',
  genderM: 'זכר',
  /** NEW: the active agreement. Past tense + "רוצה" work for any gender. */
  agree: 'קראתי את מה שכתוב כאן, ואני רוצה להתחיל.',
  start: 'להתחיל',
  errors: {
    name: 'צריך לכתוב שם, עד 40 אותיות.',
    gender: 'צריך לבחור לשון פנייה.',
    agree: 'כדי להתחיל, צריך לסמן את התיבה.',
    generic: 'משהו לא עבד. אפשר לנסות שוב בעוד רגע.',
    rate: 'יותר מדי ניסיונות. אפשר לנסות שוב מאוחר יותר.',
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
};

export const DONE = {
  /** NEW */
  ready: 'המסמך מוכן.',
  view: 'לצפייה במסמך',
  /** s4_stop_line */
  stop: 'אפשר לעצור כאן. המסמך שלם ושלך.',
  deleteLink: 'למחיקת השיחה והמסמך',
  deleteDemoMarker: '[תצוגה בלבד: המחיקה עוד לא מחוברת לאחסון קבוע]',
};

export const DELETE_PAGE = {
  /** NEW */
  title: 'מחיקת השיחה והמסמך',
  confirm: 'למחוק',
  done: 'נמחק.',
  notFound: 'לא נמצא מה למחוק. ייתכן שכבר נמחק.',
  invalid: 'הקישור לא תקין.',
};
