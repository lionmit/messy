'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { InterviewDocument } from '@/types';

/**
 * Shows the document from this browser tab only (sessionStorage).
 * Interim page: the S4 result page from the board replaces it. Labels stay as
 * they were; every value is rendered as text, never as HTML.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2
        className="font-[family-name:var(--font-space)] text-xs font-semibold uppercase tracking-widest mb-3"
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
    <p dir="auto" className="leading-relaxed" style={{ color: 'var(--text)' }}>
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
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--navy)' }}>No results yet</h1>
        <Link href="/interview" className="btn-cta">Start your session</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="px-4 py-6 max-w-3xl mx-auto">
        <Link href="/" className="font-[family-name:var(--font-space)] text-2xl font-bold tracking-tighter" style={{ color: 'var(--navy)' }}>
          m<span style={{ color: 'var(--yellow)' }}>e</span>ssy
        </Link>
      </header>

      <main className="px-4 pb-16 max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 dir="auto" className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: 'var(--navy)' }}>
            {doc.name}
          </h1>
          {doc.positioning_statement && (
            <p dir="auto" className="text-xl mt-4 leading-relaxed font-semibold" style={{ color: 'var(--yellow-dark)' }}>
              {doc.positioning_statement}
            </p>
          )}
        </div>

        {doc.before_sentence && (
          <Section title="In your words">
            <P>{doc.before_sentence}</P>
          </Section>
        )}

        {doc.through_line && (
          <Section title="Through-line">
            <P>{doc.through_line}</P>
          </Section>
        )}

        {(doc.audience.ideal || doc.audience.not_for) && (
          <Section title="Audience">
            {doc.audience.ideal && <P>{doc.audience.ideal}</P>}
            {doc.audience.not_for && <P>{doc.audience.not_for}</P>}
          </Section>
        )}

        {(doc.client_journey?.before || doc.client_journey?.after) && (
          <Section title="What changes for people">
            {doc.client_journey.before && <P>{doc.client_journey.before}</P>}
            {doc.client_journey.after && (
              <P>
                {doc.client_journey.after}
                {doc.client_journey.after_tense === 'wish' ? ' (wish)' : ''}
              </P>
            )}
          </Section>
        )}

        {doc.services.length > 0 && (
          <Section title="Services">
            <div className="space-y-3">
              {doc.services.map((s, i) => (
                <div key={i} className="card">
                  <h3 dir="auto" className="font-semibold" style={{ color: 'var(--navy)' }}>
                    {s.name}
                    {s.tense === 'wish' ? ' (wish)' : ''}
                  </h3>
                  {s.description && <P>{s.description}</P>}
                  {(s.audience || s.format) && (
                    <p dir="auto" className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                      {[s.audience, s.format].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {doc.does_not_do.length > 0 && (
          <Section title="Does not do">
            <ul className="space-y-1">
              {doc.does_not_do.map((x, i) => (
                <li key={i} dir="auto">{x}</li>
              ))}
            </ul>
          </Section>
        )}

        {doc.their_words.length > 0 && (
          <Section title="Words worth keeping">
            <ul className="space-y-1">
              {doc.their_words.map((x, i) => (
                <li key={i} dir="auto">“{x}”</li>
              ))}
            </ul>
          </Section>
        )}

        {(doc.room.description || doc.room.color) && (
          <Section title="The room">
            {doc.room.description && <P>{doc.room.description}</P>}
            {doc.room.color && <P>{doc.room.color}</P>}
          </Section>
        )}

        {(doc.contact_cta || doc.links.length > 0) && (
          <Section title="Contact">
            {doc.contact_cta && <P>{doc.contact_cta}</P>}
            {doc.links.map((l, i) => (
              <p key={i} dir="ltr" className="text-sm break-all" style={{ color: 'var(--text-muted)' }}>
                {l}
              </p>
            ))}
          </Section>
        )}
      </main>
    </div>
  );
}
