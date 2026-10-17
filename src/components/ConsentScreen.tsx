'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { CONSENT, priceLine } from '@/content/copy';
import Turnstile, { TURNSTILE_SITE_KEY, type TurnstileHandle } from '@/components/Turnstile';
import type { Gender, SessionResponse } from '@/types';

interface Props {
  onStarted: (session: SessionResponse, person: { name: string; gender: Gender }) => void;
}

/**
 * The first screen. Nothing is sent to the AI before the person actively agrees.
 * The server enforces the same rule: /api/session refuses without consent, and
 * /api/chat refuses without the token that only /api/session issues.
 */
export default function ConsentScreen({ onStarted }: Props) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Cloudflare Turnstile ("verify you are human"): only when the public site key is set.
  const [human, setHuman] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const humanOk = !TURNSTILE_SITE_KEY || human !== null;

  const nameOk = name.trim().length > 0 && name.trim().length <= 40;
  const canStart = nameOk && gender !== '' && agree && humanOk && !busy;

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!nameOk) return setError(CONSENT.errors.name);
    if (!gender) return setError(CONSENT.errors.gender);
    if (!agree) return setError(CONSENT.errors.agree);
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: true, name: name.trim(), gender, ...(human ? { turnstile: human } : {}) }),
      });
      const data = await res.json();
      if (res.status === 429) return setError(CONSENT.errors.rate);
      if (typeof data?.error === 'string' && data.error.startsWith('human_check_')) {
        // The token is single-use: ask the widget for a fresh one before the next try.
        turnstileRef.current?.reset();
        return setError(res.status === 503 ? CONSENT.errors.humanUnavailable : CONSENT.errors.humanFailed);
      }
      if (!res.ok) {
        return setError(data?.field === 'name' ? CONSENT.errors.name : CONSENT.errors.generic);
      }
      onStarted(data as SessionResponse, { name: name.trim(), gender });
    } catch {
      setError(CONSENT.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto px-5 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
          {CONSENT.title}
        </h1>
        <p className="mt-3" style={{ color: 'var(--text)' }}>{CONSENT.aiLine}</p>
        <p className="mt-3 font-semibold" style={{ color: 'var(--navy)' }} data-testid="price-line">
          {priceLine()}
        </p>
        <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>{CONSENT.skipLine}</p>

        <section className="card mt-6" aria-labelledby="privacy-heading">
          <h2 id="privacy-heading" className="font-semibold" style={{ color: 'var(--navy)' }}>
            {CONSENT.privacyHeading}
          </h2>
          <p className="mt-2" data-testid="reading-line">{CONSENT.readingLine}</p>
          <p className="mt-2">{CONSENT.providerLine}</p>
          <p className="mt-2" data-testid="age-line">{CONSENT.ageLine}</p>
          <p className="mt-2">{CONSENT.sensitiveLine}</p>
          <p className="mt-2">
            {CONSENT.abroadLine}{' '}
            <Link href={CONSENT.privacyLink.href} className="underline font-semibold" target="_blank">
              {CONSENT.privacyLink.label}
            </Link>
          </p>
        </section>

        <form onSubmit={start} className="mt-6 space-y-5" noValidate>
          <div>
            <label htmlFor="name" className="block font-semibold" style={{ color: 'var(--navy)' }}>
              {CONSENT.nameLabel}
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoComplete="given-name"
              className="chat-input w-full mt-2 px-4 py-3"
            />
          </div>

          <fieldset>
            <legend className="font-semibold" style={{ color: 'var(--navy)' }}>{CONSENT.genderLegend}</legend>
            <div className="flex gap-6 mt-2">
              {(['f', 'm'] as const).map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gender" value={g} checked={gender === g} onChange={() => setGender(g)} />
                  {g === 'f' ? CONSENT.genderF : CONSENT.genderM}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1.5" />
            <span>{CONSENT.agree}</span>
          </label>

          <Turnstile ref={turnstileRef} onToken={setHuman} />

          <button type="submit" className="btn-cta" disabled={!canStart} aria-disabled={!canStart}>
            {CONSENT.start}
          </button>

          {error && (
            <p role="alert" style={{ color: '#B42318' }}>
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
