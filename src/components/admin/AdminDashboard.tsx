'use client';

import { useCallback, useEffect, useState } from 'react';
import { ADMIN } from '@/content/admin';
import type { Overview, PersonView, MailView, Stage } from '@/lib/admin/overview';
import type { CommandAction } from '@/lib/admin/commands';

type Load = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: Overview };

const israelTime = new Intl.DateTimeFormat('he-IL', {
  timeZone: 'Asia/Jerusalem',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function fmt(iso: string | null): string {
  if (!iso) return '';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '';
  return israelTime.format(t);
}

function stageLabel(stage: Stage | null): string {
  return stage ? ADMIN.stages[stage] : ADMIN.stages.none;
}

function mailLabel(m: MailView | null): string {
  if (!m) return ADMIN.people.mailStatus.none;
  const s = ADMIN.people.mailStatus;
  const label = m.status === 'sent' ? s.sent : m.status === 'scheduled' ? s.scheduled : m.status === 'cancelled' ? s.cancelled : m.status;
  const when = fmt(m.at);
  return when ? `${label}, ${when}` : label;
}

function canRelease(p: PersonView): boolean {
  if (p.tombstoned) return false;
  if (p.stage !== 'deploy_preview') return false;
  if (p.mail.preview?.status === 'sent') return false;
  return !p.pendingCommands.some((c) => c.action === 'release');
}

/** "התקבל תשלום": once per person, never for a deleted one, disabled once the slug shows a payment. */
function canMarkPaid(p: PersonView): boolean {
  if (p.tombstoned || p.paid) return false;
  return !p.pendingCommands.some((c) => c.action === 'paid');
}

async function readError(res: Response): Promise<string> {
  if (res.status === 401) return ADMIN.unauthorized;
  if (res.status === 503) return ADMIN.noStore;
  return ADMIN.loadFailed;
}

export default function AdminDashboard() {
  const [load, setLoad] = useState<Load>({ kind: 'loading' });

  // Fetches and sets state only once the response is in (nothing synchronous in the effect).
  const fetchOverview = useCallback(() => {
    fetch('/api/admin/overview', { cache: 'no-store', credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) return { kind: 'error', message: await readError(res) } as Load;
        return { kind: 'ready', data: (await res.json()) as Overview } as Load;
      })
      .catch(() => ({ kind: 'error', message: ADMIN.loadFailed }) as Load)
      .then((next) => setLoad(next));
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const refresh = () => {
    setLoad({ kind: 'loading' });
    fetchOverview();
  };

  if (load.kind === 'loading') return <p className="admin-status">{ADMIN.loading}</p>;
  if (load.kind === 'error') {
    return (
      <div className="admin-status">
        <p>{load.message}</p>
        <button type="button" className="admin-btn mt-3" onClick={refresh}>
          {ADMIN.retry}
        </button>
      </div>
    );
  }

  const { data } = load;
  const c = ADMIN.counters;
  const counters: [string, number][] = [
    [c.interviews, data.counts.interviews],
    [c.held, data.counts.held],
    [c.previewsLive, data.counts.previewsLive],
    [c.mailed, data.counts.mailed],
    [c.paid, data.counts.paid],
    [c.tombstoned, data.counts.tombstoned],
  ];

  return (
    <div className="admin-wrap pb-6">
      <section className="admin-section" aria-label={ADMIN.title}>
        <div className="admin-counters">
          {counters.map(([label, n]) => (
            <div key={label} className="admin-counter">
              <div className="admin-counter-n">{n}</div>
              <div className="admin-counter-l">{label}</div>
            </div>
          ))}
        </div>
        {data.founding.count !== null && (
          <p className="admin-meta mt-2">
            {ADMIN.founding.heading}: {ADMIN.founding.count} {data.founding.count}, {ADMIN.founding.paid} {data.founding.paid ?? 0},{' '}
            {ADMIN.founding.openLocks} {data.founding.open_locks ?? 0}
          </p>
        )}
      </section>

      <section className="admin-section">
        <h2 className="admin-h2">{ADMIN.people.heading}</h2>
        {data.people.length === 0 ? (
          <p className="admin-meta">{ADMIN.people.empty}</p>
        ) : (
          <div className="admin-people">
            {data.people.map((p) => (
              <PersonCard key={p.slug} person={p} />
            ))}
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2 className="admin-h2">{ADMIN.digest.heading}</h2>
        {data.digestTail.length === 0 ? (
          <p className="admin-meta">{ADMIN.digest.empty}</p>
        ) : (
          <pre className="admin-digest">{data.digestTail.join('\n')}</pre>
        )}
      </section>

      <footer className="admin-footer">
        <span>
          {ADMIN.generatedAt} {fmt(data.generatedAt)}
        </span>
        <button type="button" className="admin-btn" onClick={refresh}>
          {ADMIN.refresh}
        </button>
      </footer>
    </div>
  );
}

type RowState =
  | { kind: 'idle' }
  | { kind: 'confirm' }
  | { kind: 'busy'; action: CommandAction }
  | { kind: 'sent'; action: CommandAction }
  | { kind: 'failed' };

function PersonCard({ person }: { person: PersonView }) {
  const [row, setRow] = useState<RowState>({ kind: 'idle' });
  const [pending, setPending] = useState(person.pendingCommands.map((x) => x.action));
  const t = ADMIN.people;
  const name = person.name || t.unnamed;

  async function send(action: CommandAction) {
    setRow({ kind: 'busy', action });
    try {
      const res = await fetch('/api/admin/command', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, slug: person.slug }),
      });
      if (!res.ok) return setRow({ kind: 'failed' });
      setPending((xs) => [...xs, action]);
      setRow({ kind: 'sent', action });
    } catch {
      setRow({ kind: 'failed' });
    }
  }

  const busy = row.kind === 'busy';
  const releaseOk = canRelease(person) && !pending.includes('release');
  const paidOk = canMarkPaid(person) && !pending.includes('paid');
  const classes = ['admin-card', person.tombstoned ? 'is-tombstoned' : '', person.held ? 'is-held' : ''].filter(Boolean).join(' ');

  return (
    <article className={classes}>
      <div className="admin-card-top">
        <span className="admin-name">{name}</span>
        <span className="admin-slug">{person.slug}</span>
        <span className="admin-tag admin-tag-accent">{stageLabel(person.stage)}</span>
        {person.held && (
          <span className="admin-tag admin-tag-red">
            {t.heldTag} <code>{person.heldNote}</code>
          </span>
        )}
        {person.tombstoned && <span className="admin-tag">{t.tombstoned}</span>}
        {person.paid && <span className="admin-tag admin-tag-green">{t.paid}</span>}
        {pending.map((a, i) => (
          <span key={`${a}-${i}`} className="admin-tag admin-tag-amber">
            {t.pendingTag[a]}
          </span>
        ))}
      </div>

      <div className="admin-grid">
        <div className="admin-kv">
          <b>{t.createdAt}</b>
          {fmt(person.createdAt)}
          <span className="admin-meta"> · {person.hasEmail ? t.emailYes : t.emailNo}</span>
          {person.expiresAt && (
            <div className="admin-meta">
              {t.expiresAt} {fmt(person.expiresAt)}
            </div>
          )}
        </div>
        <div className="admin-kv">
          <div>
            <b>{t.mail.preview}</b>
            {mailLabel(person.mail.preview)}
          </div>
          <div>
            <b>{t.mail.reminder}</b>
            {mailLabel(person.mail.reminder)}
          </div>
          <div>
            <b>{t.mail.end}</b>
            {mailLabel(person.mail.end)}
          </div>
        </div>
        <div className="admin-kv">
          <div className="admin-links">
            {person.urls.preview && (
              <a className="admin-link" href={person.urls.preview} target="_blank" rel="noopener noreferrer">
                {t.previewLink}
              </a>
            )}
            {person.urls.owner && (
              <a className="admin-link" href={person.urls.owner} target="_blank" rel="noopener noreferrer">
                {t.ownerLink}
              </a>
            )}
          </div>
          <div>
            <b>{t.comments}</b>
            {person.comments}
            {person.stageNote && (
              <span className="admin-meta">
                {' '}
                · <code className="admin-slug">{person.stageNote}</code>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="admin-actions">
        <button type="button" className="admin-btn admin-btn-primary" disabled={!releaseOk || busy} onClick={() => void send('release')}>
          {busy && row.action === 'release' ? t.busy : t.release}
        </button>
        <button type="button" className="admin-btn" disabled={!paidOk || busy} onClick={() => void send('paid')}>
          {busy && row.action === 'paid' ? t.busy : t.markPaid}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-danger"
          disabled={busy}
          onClick={() => setRow(row.kind === 'confirm' ? { kind: 'idle' } : { kind: 'confirm' })}
        >
          {busy && row.action === 'purge' ? t.busy : t.purge}
        </button>
      </div>

      {row.kind === 'confirm' && (
        <div className="admin-confirm" role="alert">
          <span>{t.confirmPurge(name)}</span>
          <button type="button" className="admin-btn admin-btn-danger-solid" onClick={() => void send('purge')}>
            {t.confirmYes}
          </button>
          <button type="button" className="admin-btn" onClick={() => setRow({ kind: 'idle' })}>
            {t.confirmNo}
          </button>
        </div>
      )}
      {row.kind === 'sent' && <p className="admin-note">{t.commandSent}</p>}
      {row.kind === 'failed' && <p className="admin-note is-error">{t.commandFailed}</p>}
    </article>
  );
}
