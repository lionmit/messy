/**
 * Human support shown when the distress protocol fires (D14 item 7, Q27).
 *
 * Sources:
 * - ער"ן lines: copy-deck keys s4_distress_title / s4_distress_ai / s4_distress_eran.
 * - סה"ר: messy-sites/board/verified/sahar-2026-10-10.md, verbatim from
 *   https://sahar.org.il on 2026-10-10. The official name's hyphen is shown as a
 *   middle dot (house rule against dashes in Hebrew). Re-check the hours before launch.
 * - Lionel's line: Q27 ("I'll get back to you within a business day"). How people
 *   reach him is still open, so it stays a visible slot.
 */
import type { Gender } from '@/lib/session';

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
 * Lionel's own line (Q27: "חוזר תוך יום עבודה"). Hebrew panel 2026-10-11: identical to the deck's
 * s4_distress_lionel, so S4 and the bot make the same promise in the same words, signed.
 */
export const LIONEL_LINE = {
  text: (gender: Gender) =>
    gender === 'f'
      ? 'אפשר גם לכתוב לי. אחזור אלייך תוך יום עבודה אחד. ליונל'
      : 'אפשר גם לכתוב לי. אחזור אליך תוך יום עבודה אחד. ליונל',
  /** Visible slot until Lionel decides the channel. */
  contactSlot: '[ממתין להחלטת ליונל: איך כותבים לו, קישור]',
};
