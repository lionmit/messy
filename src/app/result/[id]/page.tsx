'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { IdentityDocument } from '@/types';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2
        className="font-[family-name:var(--font-space)] text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: 'var(--teal)' }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function ResultPage() {
  const [doc, setDoc] = useState<IdentityDocument | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('messy-result');
    if (stored) {
      try {
        setDoc(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'var(--bg)' }}
      >
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
          No results yet
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
          Complete an interview to see your identity document.
        </p>
        <Link
          href="/interview"
          className="px-8 py-4 rounded-full font-semibold transition-all"
          style={{ background: 'var(--yellow)', color: 'var(--navy)' }}
        >
          Start your session
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="px-4 py-6 max-w-3xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-space)] text-2xl font-bold tracking-tighter"
          style={{ color: 'var(--navy)' }}
        >
          m<span style={{ color: 'var(--yellow)' }}>e</span>ssy
        </Link>
        <Link
          href="/interview"
          className="px-5 py-2 rounded-full text-sm font-medium transition-all"
          style={{
            border: '1.5px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          Start a new one
        </Link>
      </header>

      <main className="px-4 pb-16 max-w-3xl mx-auto">
        {/* Name & positioning */}
        <div className="mb-10">
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight"
            style={{ color: 'var(--navy)' }}
          >
            {doc.name || 'Your Identity'}
          </h1>
          {doc.positioning_statement && (
            <p
              className="text-xl mt-4 leading-relaxed font-semibold"
              style={{ color: 'var(--yellow-hover)' }}
            >
              {doc.positioning_statement}
            </p>
          )}
        </div>

        {doc.through_line && (
          <Section title="Through-line">
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text)' }}>
              {doc.through_line}
            </p>
          </Section>
        )}

        {doc.origin_story && (
          <Section title="Origin Story">
            <p className="leading-relaxed" style={{ color: 'var(--text)' }}>
              {doc.origin_story}
            </p>
          </Section>
        )}

        {doc.trigger && (
          <Section title="What Brought You Here">
            <p className="leading-relaxed" style={{ color: 'var(--text)' }}>
              {doc.trigger}
            </p>
          </Section>
        )}

        {doc.best_moment && (
          <Section title="Best Moment">
            <p className="leading-relaxed" style={{ color: 'var(--text)' }}>
              {doc.best_moment}
            </p>
          </Section>
        )}

        {(doc.audience?.ideal || doc.audience?.not_for) && (
          <Section title="Audience">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doc.audience.ideal && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}
                >
                  <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--navy)' }}>
                    Ideal for
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {doc.audience.ideal}
                  </p>
                </div>
              )}
              {doc.audience.not_for && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}
                >
                  <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--navy)' }}>
                    Not for
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {doc.audience.not_for}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {doc.services?.length > 0 && (
          <Section title="Services">
            <div className="space-y-3">
              {doc.services.map((service, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}
                >
                  <h3 className="font-semibold" style={{ color: 'var(--navy)' }}>
                    {service.name}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {service.description}
                  </p>
                  <div className="flex gap-3 mt-3">
                    {service.audience && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        For: {service.audience}
                      </span>
                    )}
                    {service.format && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Format: {service.format}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {doc.does_not_do?.length > 0 && (
          <Section title="Does Not Do">
            <ul className="space-y-2">
              {doc.does_not_do.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span className="mt-0.5 font-bold" style={{ color: 'var(--yellow-hover)' }}>
                    x
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {doc.brand && (
          <Section title="Brand Energy">
            <div
              className="rounded-2xl p-6 space-y-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}
            >
              {doc.brand.emojis?.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--text-muted)' }}>
                    Emojis
                  </span>
                  <p className="text-2xl mt-1">{doc.brand.emojis.join(' ')}</p>
                </div>
              )}
              {doc.brand.energy && (
                <div>
                  <span className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--text-muted)' }}>
                    Energy
                  </span>
                  <p className="mt-1" style={{ color: 'var(--text)' }}>{doc.brand.energy}</p>
                </div>
              )}
              {doc.brand.tone && (
                <div>
                  <span className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--text-muted)' }}>
                    Tone
                  </span>
                  <p className="mt-1" style={{ color: 'var(--text)' }}>{doc.brand.tone}</p>
                </div>
              )}
              {doc.brand.colors?.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--text-muted)' }}>
                    Colors
                  </span>
                  <div className="flex gap-2 mt-2">
                    {doc.brand.colors.map((color, idx) => (
                      <span key={idx} className="text-sm" style={{ color: 'var(--text)' }}>
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {doc.brand.reference_sites?.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--text-muted)' }}>
                    Reference Sites
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {doc.brand.reference_sites.map((site, idx) => (
                      <a
                        key={idx}
                        href={site.startsWith('http') ? site : `https://${site}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                        style={{ color: 'var(--teal)' }}
                      >
                        {site}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {doc.assets?.contact_cta && (
          <div
            className="mt-6 p-5 rounded-2xl text-center"
            style={{
              background: 'var(--yellow-light)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <p className="font-semibold" style={{ color: 'var(--yellow-hover)' }}>
              {doc.assets.contact_cta}
            </p>
          </div>
        )}
      </main>

      <footer className="py-6 text-center" style={{ borderTop: '1px solid var(--border-light)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Generated by{' '}
          <Link
            href="/"
            className="transition-colors hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            Messy
          </Link>
          {' '}&mdash; Built by{' '}
          <a
            href="https://lionelmitelpunkt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            Lionel&apos;s Creative GYM
          </a>
        </p>
      </footer>
    </div>
  );
}
