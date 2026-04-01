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
    <div className="mb-10">
      <h2 className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3">
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
        <h1 className="text-3xl font-bold text-white mb-4">No results yet</h1>
        <p className="text-gray-400 mb-8">
          Complete an interview to see your identity document.
        </p>
        <Link
          href="/interview"
          className="px-8 py-4 rounded-full bg-amber-400 hover:bg-amber-300
            text-gray-950 font-semibold transition-colors"
        >
          Start your session
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="px-6 py-8 max-w-3xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-black tracking-tighter text-white"
        >
          m<span className="text-amber-400">e</span>ssy
        </Link>
        <Link
          href="/interview"
          className="px-5 py-2 rounded-full border border-gray-700 hover:border-amber-400
            text-gray-300 text-sm font-medium transition-colors"
        >
          Start a new one
        </Link>
      </header>

      <main className="px-6 pb-20 max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            {doc.name || 'Your Identity'}
          </h1>
          {doc.positioning_statement && (
            <p className="text-xl text-amber-400 mt-4 leading-relaxed font-medium">
              {doc.positioning_statement}
            </p>
          )}
        </div>

        {doc.through_line && (
          <Section title="Through-line">
            <p className="text-gray-300 text-lg leading-relaxed">
              {doc.through_line}
            </p>
          </Section>
        )}

        {doc.origin_story && (
          <Section title="Origin Story">
            <p className="text-gray-300 leading-relaxed">{doc.origin_story}</p>
          </Section>
        )}

        {doc.trigger && (
          <Section title="What Brought You Here">
            <p className="text-gray-300 leading-relaxed">{doc.trigger}</p>
          </Section>
        )}

        {doc.best_moment && (
          <Section title="Best Moment">
            <p className="text-gray-300 leading-relaxed">{doc.best_moment}</p>
          </Section>
        )}

        {(doc.audience?.ideal || doc.audience?.not_for) && (
          <Section title="Audience">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {doc.audience.ideal && (
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <h3 className="text-white font-semibold text-sm mb-2">
                    Ideal for
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {doc.audience.ideal}
                  </p>
                </div>
              )}
              {doc.audience.not_for && (
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <h3 className="text-white font-semibold text-sm mb-2">
                    Not for
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {doc.audience.not_for}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {doc.services?.length > 0 && (
          <Section title="Services">
            <div className="space-y-4">
              {doc.services.map((service, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900 rounded-xl p-5 border border-gray-800"
                >
                  <h3 className="text-white font-semibold">{service.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {service.description}
                  </p>
                  <div className="flex gap-3 mt-3">
                    {service.audience && (
                      <span className="text-xs text-gray-500">
                        For: {service.audience}
                      </span>
                    )}
                    {service.format && (
                      <span className="text-xs text-gray-500">
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
                  className="flex items-start gap-2 text-gray-400 text-sm"
                >
                  <span className="text-red-400 mt-0.5">x</span>
                  {item}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {doc.brand && (
          <Section title="Brand Energy">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
              {doc.brand.emojis?.length > 0 && (
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">
                    Emojis
                  </span>
                  <p className="text-2xl mt-1">{doc.brand.emojis.join(' ')}</p>
                </div>
              )}
              {doc.brand.energy && (
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">
                    Energy
                  </span>
                  <p className="text-gray-300 mt-1">{doc.brand.energy}</p>
                </div>
              )}
              {doc.brand.tone && (
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">
                    Tone
                  </span>
                  <p className="text-gray-300 mt-1">{doc.brand.tone}</p>
                </div>
              )}
              {doc.brand.colors?.length > 0 && (
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">
                    Colors
                  </span>
                  <div className="flex gap-2 mt-2">
                    {doc.brand.colors.map((color, idx) => (
                      <span key={idx} className="text-gray-300 text-sm">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {doc.brand.reference_sites?.length > 0 && (
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">
                    Reference Sites
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {doc.brand.reference_sites.map((site, idx) => (
                      <a
                        key={idx}
                        href={
                          site.startsWith('http') ? site : `https://${site}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 text-sm hover:underline"
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
          <div className="mt-6 p-5 bg-amber-400/10 rounded-xl border border-amber-400/20 text-center">
            <p className="text-amber-400 font-medium">
              {doc.assets.contact_cta}
            </p>
          </div>
        )}
      </main>

      <footer className="py-8 text-center border-t border-gray-800/50">
        <p className="text-gray-600 text-sm">
          Generated by{' '}
          <Link
            href="/"
            className="text-gray-500 hover:text-amber-400 transition-colors"
          >
            Messy
          </Link>
          {' '}&mdash; Built by{' '}
          <a
            href="https://lionelmitelpunkt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-amber-400 transition-colors"
          >
            Lionel&apos;s Creative GYM
          </a>
        </p>
      </footer>
    </div>
  );
}
