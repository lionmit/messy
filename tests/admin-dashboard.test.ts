// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { ADMIN } from '@/content/admin';
import type { Overview, PersonView } from '@/lib/admin/overview';

/**
 * The dashboard's "התקבל תשלום" button (2026-10-17): one per person next to "לשחרר", it POSTs
 * {action: "paid", slug} to /api/admin/command, shows as pending like the other commands, and is
 * disabled once the slug shows a payment (or was already requested, or the person was deleted).
 */
function person(over: Partial<PersonView>): PersonView {
  return {
    slug: 'i-aaaaaaaaaaaa',
    id: 'aaaaaaaaaaaa000000000001',
    name: 'דנה',
    createdAt: '2026-10-16T08:00:00.000Z',
    expiresAt: null,
    hasEmail: true,
    stage: 'email_preview',
    stageNote: '',
    held: false,
    heldNote: '',
    urls: {},
    mail: { preview: null, reminder: null, end: null },
    comments: 0,
    paid: false,
    tombstoned: false,
    pendingCommands: [],
    ...over,
  };
}

function overview(people: PersonView[]): Overview {
  return {
    people,
    counts: { interviews: people.length, held: 0, previewsLive: 0, mailed: 0, paid: 0, tombstoned: 0 },
    founding: { count: null, paid: null, open_locks: null },
    digestTail: [],
    generatedAt: '2026-10-17T09:30:00.000Z',
  };
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

let posts: { url: string; body: unknown }[] = [];

function mockFetch(data: Overview, commandStatus = 200) {
  posts = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url === '/api/admin/overview') return json(data);
      if (url === '/api/admin/command') {
        posts.push({ url, body: JSON.parse(String(init?.body)) });
        return json({ ok: true, file: 'x' }, commandStatus);
      }
      throw new Error(`unexpected fetch ${url}`);
    })
  );
}

const paidButton = (slug: string) =>
  screen
    .getAllByRole('button', { name: ADMIN.people.markPaid })
    .find((b) => b.closest('article')?.textContent?.includes(slug)) as HTMLButtonElement;

beforeEach(() => {
  posts = [];
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('admin dashboard: התקבל תשלום', () => {
  it('sits next to "לשחרר", POSTs {action: "paid", slug}, then shows the pending tag and disables itself', async () => {
    mockFetch(overview([person({})]));
    render(createElement(AdminDashboard));
    await screen.findByText('דנה');

    const actions = screen.getByRole('button', { name: ADMIN.people.release }).parentElement!;
    const labels = Array.from(actions.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels).toEqual([ADMIN.people.release, ADMIN.people.markPaid, ADMIN.people.purge]);

    const btn = paidButton('i-aaaaaaaaaaaa');
    expect(btn.disabled).toBe(false);
    fireEvent.click(btn);
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toEqual({ url: '/api/admin/command', body: { action: 'paid', slug: 'i-aaaaaaaaaaaa' } });
    await screen.findByText(ADMIN.people.pendingTag.paid);
    expect(screen.getByText(ADMIN.people.commandSent)).toBeTruthy();
    expect(paidButton('i-aaaaaaaaaaaa').disabled).toBe(true);
  });

  it('is disabled once the slug shows a payment, when the command is already pending, and for a deleted person', async () => {
    mockFetch(
      overview([
        person({ slug: 'i-paid00000000', name: 'רון', paid: true }),
        person({
          slug: 'i-pending000000',
          name: 'נועה',
          pendingCommands: [{ action: 'paid', requestedAt: '2026-10-17T09:00:00.000Z', file: 'f' }],
        }),
        person({ slug: 'i-gone000000000', name: 'יואב', tombstoned: true }),
        person({ slug: 'i-open000000000', name: 'דנה' }),
      ])
    );
    render(createElement(AdminDashboard));
    await screen.findByText('רון');
    expect(paidButton('i-paid00000000').disabled).toBe(true);
    expect(paidButton('i-pending000000').disabled).toBe(true);
    expect(screen.getAllByText(ADMIN.people.pendingTag.paid)).toHaveLength(1);
    expect(paidButton('i-gone000000000').disabled).toBe(true);
    expect(paidButton('i-open000000000').disabled).toBe(false);
    expect(posts).toHaveLength(0);
  });

  it('shows the failure line and stays enabled when the command is refused', async () => {
    mockFetch(overview([person({})]), 500);
    render(createElement(AdminDashboard));
    await screen.findByText('דנה');
    fireEvent.click(paidButton('i-aaaaaaaaaaaa'));
    await screen.findByText(ADMIN.people.commandFailed);
    expect(screen.queryByText(ADMIN.people.pendingTag.paid)).toBeNull();
    expect(paidButton('i-aaaaaaaaaaaa').disabled).toBe(false);
  });
});
