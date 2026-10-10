'use client';

import { ERAN, LIONEL_LINE, SAHAR } from '@/content/support';
import type { Gender } from '@/types';

/**
 * Replaces the whole conversation when the distress protocol fires.
 * Shows human support first. No price, no document, no share, no link to anything
 * Lionel sells, and nothing the model wrote. The trigger text is never shown.
 */
export default function DistressScreen({ name, gender }: { name: string; gender: Gender }) {
  return (
    <main className="flex-1 overflow-y-auto px-5 py-8" data-testid="distress-screen">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
          {ERAN.title(name)}
        </h1>
        <p>{ERAN.aiLine}</p>

        <section className="card">
          <p>
            {ERAN.line.split(ERAN.phone)[0]}
            <a href={`tel:${ERAN.phone}`} className="font-bold underline">
              {ERAN.phone}
            </a>
            {ERAN.line.split(ERAN.phone)[1]}
          </p>
        </section>

        <section className="card">
          <h2 className="font-semibold" style={{ color: 'var(--navy)' }}>{SAHAR.name}</h2>
          <p className="mt-1">{SAHAR.description}</p>
          <ul className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {SAHAR.hours.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <div className="flex gap-4 mt-2">
            <a href={SAHAR.chat.href} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
              {SAHAR.chat.label}
            </a>
            <a href={SAHAR.whatsapp.href} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
              {SAHAR.whatsapp.label}
            </a>
          </div>
        </section>

        <section className="card">
          <p>{LIONEL_LINE.text(gender)}</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{LIONEL_LINE.contactSlot}</p>
        </section>
      </div>
    </main>
  );
}
