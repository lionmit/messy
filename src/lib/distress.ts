/**
 * Distress protocol (D14 item 7, Q28+).
 *
 * Two layers:
 * 1. This keyword check runs on the server BEFORE the model sees the message.
 *    A hit means the model is never called with that text.
 * 2. The system prompt tells the model to answer only `<distress/>` when it
 *    sees acute distress the keywords missed. The server then discards the
 *    model's text.
 *
 * Either way: the conversation stops, the person sees human support, and the
 * only thing saved is { distress: true, timestamp }. No trigger text, no
 * transcript, no name.
 *
 * Discouragement is not distress ("I'll never get clients" goes to the
 * disclosure protocol in the prompt, not here).
 */

const PATTERNS: RegExp[] = [
  // Hebrew
  /(?:^|[^א-ת])(?:ל|ש|ו|כש)?ה?התאבד/u, // להתאבד, התאבדתי
  /(?:^|[^א-ת])(?:ו|ש|כש)?(?:א|י|ת|נ|מ)תאבד/u, // אתאבד, יתאבד, מתאבדת (not תאבד = "will lose")
  /התאבדות/u,
  /לשים\s+קץ\s+ל?(?:חיי|חיים|לחיים)/u,
  /לא\s+(?:רוצה|רוצים|רוצות|מסוגל|מסוגלת)\s+(?:יותר\s+)?לחיות/u,
  /אין\s+(?:לי\s+)?(?:טעם|סיבה)\s+(?:יותר\s+)?(?:לחיות|לחיים)/u,
  /(?:רוצה|רוצים|רוצות)\s+למות/u,
  /לפגוע\s+בעצמי/u,
  /(?:פוגע|פוגעת)\s+בעצמי/u,
  /(?:לחתוך|חותך|חותכת)\s+(?:את\s+)?עצמי/u,
  /לגמור\s+(?:עם\s+)?(?:החיים|הכל)\s+(?:שלי)?/u,
  // English
  /\bsuicid(?:e|al)\b/i,
  /\bkill(?:ing)?\s+myself\b/i,
  /\bend(?:ing)?\s+my\s+life\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(?:live|be\s+alive)\b/i,
  /\bself[\s-]?harm/i,
  /\b(?:hurt|cut)(?:ting)?\s+myself\b/i,
];

function normalize(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[֑-ׇ]/g, '') // niqqud and cantillation
    .replace(/\s+/g, ' ');
}

export function detectDistress(text: string): boolean {
  const t = normalize(text);
  return PATTERNS.some((p) => p.test(t));
}

export const DISTRESS_TAG = /<\s*distress\s*\/?\s*>/i;

export function modelSignalledDistress(output: string): boolean {
  return DISTRESS_TAG.test(output);
}

export interface DistressPayload {
  distress: true;
  timestamp: string;
}

/** The ONLY thing that leaves the server about a distress conversation. */
export function buildDistressPayload(now: Date = new Date()): DistressPayload {
  return { distress: true, timestamp: now.toISOString() };
}
