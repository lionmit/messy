import { parseLegal, type Inline } from '@/lib/legal-md';

/** A missing detail stays visible, in the same form as every other slot in the app. */
function Inl({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) => {
        if (p.t === 'strong') return <strong key={i}>{p.v}</strong>;
        if (p.t === 'slot')
          return (
            <span key={i} style={{ color: 'var(--text-muted)' }}>
              [ממתין: {p.v}]
            </span>
          );
        if (p.t === 'mail')
          return (
            <a key={i} href={`mailto:${p.v}`} dir="ltr" className="underline">
              {p.v}
            </a>
          );
        return <span key={i}>{p.v}</span>;
      })}
    </>
  );
}

/** One legal page (privacy, terms, accessibility), rendered from the synced text. */
export default function LegalPage({ md }: { md: string }) {
  return (
    <main className="flex-1 px-5 py-8">
      <article className="max-w-xl mx-auto" style={{ color: 'var(--text)' }}>
        {parseLegal(md).map((b, i) => {
          if (b.k === 'h1')
            return (
              <h1 key={i} className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
                {b.text}
              </h1>
            );
          if (b.k === 'h2')
            return (
              <h2 key={i} id={b.id} className="mt-6 font-semibold" style={{ color: 'var(--navy)' }}>
                {b.text}
              </h2>
            );
          if (b.k === 'ul')
            return (
              <ul key={i} className="mt-2 list-disc pr-5 space-y-1">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inl parts={it} />
                  </li>
                ))}
              </ul>
            );
          return (
            <p key={i} className="mt-2">
              <Inl parts={b.inl} />
            </p>
          );
        })}
      </article>
    </main>
  );
}
