'use client';

import { useState } from 'react';
import { DELETE_PAGE } from '@/content/copy';

type State = 'idle' | 'busy' | 'done' | 'missing' | 'failed' | 'invalid';

function readToken(): string | null {
  return window.location.hash.match(/t=([A-Za-z0-9._-]+)/)?.[1] ?? null;
}

function localTime(d: Date): string {
  try {
    return d.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return d.toISOString();
  }
}

/** The "what is not deleted" paragraph, with the address as a mailto link. */
function KeptLine() {
  const parts = DELETE_PAGE.kept.split(DELETE_PAGE.keptMail);
  return (
    <p>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <a href={DELETE_PAGE.keptMailHref} className="underline" dir="ltr">
              {DELETE_PAGE.keptMail}
            </a>
          )}
        </span>
      ))}
    </p>
  );
}

/**
 * The delete link lands here. The token travels in the URL fragment (#t=...),
 * which browsers never send to a server or in a Referer header. Deleting needs
 * a click (a POST), so link previewers can't delete anything by opening the link.
 *
 * Before the button the page declares what is held, what deletion removes, what
 * it does not remove and why, and that it cannot be undone. One checkbox, one
 * button. After success: a receipt with the person's local time.
 */
export default function DeletePage() {
  const [state, setState] = useState<State>('idle');
  const [agreed, setAgreed] = useState(false);
  const [deletedAt, setDeletedAt] = useState('');

  // The token is read at click time (the hash exists only in the browser, and a
  // mount-time check would mean a setState inside an effect).
  async function confirmDelete() {
    const token = readToken();
    if (!token) return setState('invalid');
    setState('busy');
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.status === 400) return setState('invalid');
      if (!res.ok) return setState('failed');
      const data = (await res.json()) as { deleted?: boolean };
      if (data.deleted) {
        setDeletedAt(localTime(new Date()));
        return setState('done');
      }
      setState('missing');
    } catch {
      setState('failed');
    }
  }

  const declaring = state === 'idle' || state === 'busy' || state === 'failed';

  return (
    <main dir="rtl" lang="he" className="min-h-screen px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>{DELETE_PAGE.title}</h1>

        {declaring && (
          <>
            <section className="space-y-1">
              <h2 className="font-semibold">{DELETE_PAGE.heldHeading}</h2>
              <p>{DELETE_PAGE.held}</p>
            </section>
            <section className="space-y-1">
              <h2 className="font-semibold">{DELETE_PAGE.removesHeading}</h2>
              <p>{DELETE_PAGE.removes}</p>
            </section>
            <section className="space-y-1">
              <h2 className="font-semibold">{DELETE_PAGE.keptHeading}</h2>
              <KeptLine />
            </section>
            <p className="font-semibold">{DELETE_PAGE.irreversible}</p>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={agreed}
                disabled={state === 'busy'}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>{DELETE_PAGE.acknowledge}</span>
            </label>

            {state === 'failed' && <p role="alert">{DELETE_PAGE.failed}</p>}

            <button type="button" className="btn-cta" disabled={!agreed || state === 'busy'} onClick={confirmDelete}>
              {state === 'failed' ? DELETE_PAGE.retry : DELETE_PAGE.confirm}
            </button>
            {state === 'busy' && <p role="status">{DELETE_PAGE.working}</p>}
          </>
        )}

        {state === 'done' && (
          <div role="status" className="space-y-2">
            <p className="font-semibold">{DELETE_PAGE.done(deletedAt)}</p>
            <p>{DELETE_PAGE.doneNote}</p>
          </div>
        )}
        {state === 'missing' && <p role="status">{DELETE_PAGE.notFound}</p>}
        {state === 'invalid' && <p role="alert">{DELETE_PAGE.invalid}</p>}
      </div>
    </main>
  );
}
