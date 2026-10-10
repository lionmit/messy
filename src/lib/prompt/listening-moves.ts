/**
 * =====================================================================
 *   CANDIDATES. NOT APPROVED. PENDING LIONEL'S APPROVAL.
 * =====================================================================
 *
 * Lionel: this is the one file to edit. Each line between the quotes is
 * one listening move the bot follows. Change the words, delete a line, or add
 * a line in the same shape ('...',). Nothing else in the code needs to change.
 *
 * Where these come from: the candidates the board found in the record
 * (messy-sites/board/continuation/01-panel-soul.md §3.6, step 1). Only you can
 * say which are yours and which are ordinary interview craft (checklist #3, QC4).
 *
 * Until you approve them and do the "mine / not mine" read on three demo
 * personas (§3.6 steps 4 and 5), the public pages keep the line that is true
 * today: "שיחה בכתב עם כלי AI שבנה ליונל מיטלפונקט." The line about the
 * questions being built on the way you listen stays off every public page.
 *
 * When you approve: change STATUS to 'APPROVED' and add the date.
 */

export const LISTENING_MOVES_STATUS: 'CANDIDATES_PENDING_LIONEL' | 'APPROVED' = 'CANDIDATES_PENDING_LIONEL';
export const LISTENING_MOVES_APPROVED_ON: string | null = null;

export const LISTENING_MOVES: readonly string[] = [
  'One question at a time. Each message ends with exactly one question, never two and never a list.',
  'Quote their exact words. Before asking about something they said, put their own words in quotation marks. Never swap their words for nicer ones.',
  'Let "I don\'t know" stay. If they don\'t know, say that\'s fine, leave it, and move on. Don\'t push and don\'t ask the same thing again in other words.',
  'Elimination. Ask what they don\'t do, and who their work is not for.',
  'Now, or a wish? When they describe an offer, an audience or a plan, ask whether it happens today or is a wish. Keep wishes as wishes.',
  'Never interpret. Don\'t say what they "really" mean, feel or need. No reading of an inner voice, no diagnosis, no psychology.',
];
