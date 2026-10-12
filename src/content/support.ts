/**
 * Human support shown when the distress protocol fires (D14 item 7, Q27).
 *
 * Sources:
 * - ער"ן lines: copy-deck keys s4_distress_title / s4_distress_ai / s4_distress_eran.
 * - סה"ר: messy-sites/board/verified/sahar-2026-10-10.md, verbatim from
 *   https://sahar.org.il on 2026-10-10. The official name's hyphen is shown as a
 *   middle dot (house rule against dashes in Hebrew). Re-check the hours before launch.
 * - Lionel's line: legal cover v1.1 §ז (it replaced Q27's business-day promise). How
 *   people reach him is still open, so it stays a visible slot.
 */

export const ERAN = {
  title: (name: string) => `${name}, השיחה נעצרה כאן.`,
  aiLine: 'זה כלי AI. על מה שעלה בשיחה כדאי לדבר עם בן אדם.',
  line: 'אפשר להתקשר עכשיו לער"ן בטלפון 1201. זמין בכל שעה, בלי תשלום ובעברית.',
  phone: '1201',
};

export const SAHAR = {
  name: 'סה"ר · סיוע והקשבה ברשת',
  description: 'צ׳אט אנונימי וחינמי לתמיכה נפשית עם אדם אמיתי.',
  hours: ['א׳-ה׳ 16:00-03:00', 'שישי, שבת וערבי חג 18:00-00:00'],
  chat: { label: 'צ׳אט אנונימי', href: 'https://sahar.org.il' },
  whatsapp: { label: 'לוואטסאפ', href: 'https://wa.me/972559571399' },
};

/**
 * Lionel's own line. Legal cover v1.1 (messy-sites/board/legal/01-texts.md §ז), verbatim: it replaces
 * Q27's "אחזור אלייך תוך יום עבודה אחד", says it is not an emergency line, and reads the same for any
 * gender. S4's deck key s4_distress_lionel should follow it.
 */
export const LIONEL_LINE = {
  text: 'אפשר לכתוב לי. אני קורא פניות מכאן פעמיים ביום ועונה בעצמי. זה לא קו חירום: במצב דחוף, ער"ן 1201 זמין עכשיו.',
  /**
   * Visible slot until Lionel decides the channel. §ז's technical side (a message from here is
   * tagged `distress`, gets no AI draft, and reaches him in a separate email) needs that channel
   * and a Make route he approves, so it is not wired yet.
   */
  contactSlot: '[ממתין להחלטת ליונל: איך כותבים לו, קישור]',
};
