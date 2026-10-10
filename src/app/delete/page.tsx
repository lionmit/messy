'use client';

import { useState } from 'react';
import { DELETE_PAGE } from '@/content/copy';

/**
 * The delete link lands here. The token travels in the URL fragment (#t=...),
 * which browsers never send to a server or in a Referer header. Deleting needs
 * a click (a POST), so link previewers can't delete anything by opening the link.
 */
export default function DeletePage() {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'missing' | 'invalid'>('idle');

  async function confirmDelete() {
    const token = window.location.hash.match(/t=([A-Za-z0-9._-]+)/)?.[1];
    if (!token) return setState('invalid');
    setState('busy');
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) return setState('invalid');
      setState(data.deleted ? 'done' : 'missing');
    } catch {
      setState('invalid');
    }
  }

  return (
    <main dir="rtl" lang="he" className="min-h-screen px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>{DELETE_PAGE.title}</h1>
        {state === 'idle' && (
          <button type="button" className="btn-cta" onClick={confirmDelete}>
            {DELETE_PAGE.confirm}
          </button>
        )}
        {state === 'done' && <p role="status">{DELETE_PAGE.done}</p>}
        {state === 'missing' && <p role="status">{DELETE_PAGE.notFound}</p>}
        {state === 'invalid' && <p role="alert">{DELETE_PAGE.invalid}</p>}
      </div>
    </main>
  );
}
