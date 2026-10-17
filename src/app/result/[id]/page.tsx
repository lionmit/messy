'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { InterviewDocument } from '@/types';

/**
 * Shows the document from this browser tab only (sessionStorage).
 * Interim page: every label is clear, authentic Hebrew; values are rendered as text.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2
        className="text-xs font-semibold uppercase tracking-wider mb-3 text-stone-500 font-sans"
        style={{ color: 'var(--teal)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p dir="auto" className="leading-relaxed text-stone-800" style={{ color: 'var(--text)' }}>
      {children}
    </p>
  );
}

export default function ResultPage() {
  // Reads this tab's sessionStorage without an effect; the server render sees null.
  const stored = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return sessionStorage.getItem('messy-result');
      } catch {
        return null;
      }
    },
    () => null
  );
  const doc = useMemo<InterviewDocument | null>(() => {
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, [stored]);

  if (!doc || doc.schema_version !== 2) {
    return (
      <div dir="rtl" lang="he" className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--navy)' }}>עדיין אין תוצאות</h1>
        <p className="text-sm text-stone-600 mb-6">כדי לבנות את האתר שלך, נתחיל בשיחה קצרה וקשובה.</p>
        <Link href="/interview" className="btn-cta">להתחיל שיחה</Link>
      </div>
    );
  }

  return (
    <div dir="rtl" lang="he" className="min-h-screen font-sans" style={{ background: 'var(--bg)' }}>
      <header className="px-4 py-6 max-w-3xl mx-auto flex items-center justify-between border-b border-stone-200/60 mb-8">
        <Link href="/" className="font-[family-name:var(--font-space)] text-2xl font-bold tracking-tighter" style={{ color: 'var(--navy)' }}>
          m<span style={{ color: 'var(--yellow)' }}>e</span>ssy
        </Link>
        <span className="text-xs px-3 py-1 rounded-full border border-stone-200 bg-stone-50 text-stone-600 font-medium">
          סיכום מילות השיחה שלך
        </span>
      </header>

      <main className="px-4 pb-16 max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 dir="auto" className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ color: 'var(--navy)' }}>
            {doc.name}
          </h1>
          {doc.positioning_statement && (
            <p dir="auto" className="text-lg sm:text-xl leading-relaxed font-medium" style={{ color: 'var(--yellow-dark)' }}>
              {doc.positioning_statement}
            </p>
          )}
        </div>

        {doc.before_sentence && (
          <Section title="במילים שלך">
            <P>{doc.before_sentence}</P>
          </Section>
        )}

        {doc.through_line && (
          <Section title="החוט המקשר והסיפור שלך">
            <P>{doc.through_line}</P>
          </Section>
        )}

        {(doc.audience.ideal || doc.audience.not_for) && (
          <Section title="למי זה מתאים (ולמי לא)">
            {doc.audience.ideal && <P>{doc.audience.ideal}</P>}
            {doc.audience.not_for && (
              <p dir="auto" className="text-sm text-stone-600 mt-2">
                <span className="font-semibold text-stone-700">פחות מתאים ל: </span>
                {doc.audience.not_for}
              </p>
            )}
          </Section>
        )}

        {(doc.client_journey?.before || doc.client_journey?.after) && (
          <Section title="מה משתנה אצל אנשים בתהליך">
            {doc.client_journey.before && (
              <div className="mb-3">
                <span className="text-xs font-semibold text-stone-500 block mb-1">כשמגיעים:</span>
                <P>{doc.client_journey.before}</P>
              </div>
            )}
            {doc.client_journey.after && (
              <div>
                <span className="text-xs font-semibold text-stone-500 block mb-1">
                  מה שמשתנה {doc.client_journey.after_tense === 'wish' ? '(כוונה / משאלה)' : '(נראה בפועל)'}:
                </span>
                <P>{doc.client_journey.after}</P>
              </div>
            )}
          </Section>
        )}

        {doc.services.length > 0 && (
          <Section title="שירותים ואפשרויות עבודה">
            <div className="space-y-4">
              {doc.services.map((s, i) => (
                <div key={i} className="card p-4 rounded-xl border border-stone-200 bg-white shadow-sm">
                  <h3 dir="auto" className="font-semibold text-base mb-1" style={{ color: 'var(--navy)' }}>
                    {s.name}
                    {s.tense === 'wish' && (
                      <span className="text-xs font-normal text-stone-500 mr-2">(במשאלה / בפיתוח)</span>
                    )}
                  </h3>
                  {s.description && <P>{s.description}</P>}
                  {(s.audience || s.format) && (
                    <p dir="auto" className="text-xs mt-2.5 text-stone-500 border-t border-stone-100 pt-2">
                      {[s.audience, s.format].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {doc.does_not_do.length > 0 && (
          <Section title="מה לא בתחום העבודה">
            <ul className="space-y-1.5 list-disc list-inside text-stone-700">
              {doc.does_not_do.map((x, i) => (
                <li key={i} dir="auto">{x}</li>
              ))}
            </ul>
          </Section>
        )}

        {doc.their_words.length > 0 && (
          <Section title="מילים ומשפטים שנאמרו וכדאי לשמור">
            <div className="space-y-2">
              {doc.their_words.map((x, i) => (
                <blockquote key={i} dir="auto" className="p-3 bg-stone-50 rounded-lg border-r-4 border-amber-300 text-stone-800 italic text-sm">
                  “{x}”
                </blockquote>
              ))}
            </div>
          </Section>
        )}

        {(doc.room.description || doc.room.color) && (
          <Section title="המרחב, החדר והצבעים">
            {doc.room.description && <P>{doc.room.description}</P>}
            {doc.room.color && (
              <p dir="auto" className="text-sm text-stone-600 mt-1">
                <span className="font-medium">גוונים וצבעים:</span> {doc.room.color}
              </p>
            )}
          </Section>
        )}

        {(doc.contact_cta || doc.links.length > 0) && (
          <Section title="יצירת קשר ופרטים">
            {doc.contact_cta && <P>{doc.contact_cta}</P>}
            {doc.links.map((l, i) => (
              <p key={i} dir="ltr" className="text-sm break-all text-stone-500 mt-1">
                {l}
              </p>
            ))}
          </Section>
        )}
      </main>
    </div>
  );
}
