import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { BlobApi } from '@/lib/storage/blob';
import { buildOverview } from '@/lib/admin/overview';
import { commandPathname, parseCommandPathname, resetCommandLimiterForTests, COMMAND_RATE } from '@/lib/admin/commands';
import { setAdminBlobApiForTests } from '@/lib/admin/store';
import { checkBasicAuth } from '@/lib/admin/auth';
import { middleware, config as middlewareConfig } from '@/middleware';
import { GET as overviewGet } from '@/app/api/admin/overview/route';
import { POST as commandPost } from '@/app/api/admin/command/route';

/** In-memory stand-in for the Blob SDK slice. Two-item pages to exercise the cursor loop. */
function fakeBlobApi(seed: Record<string, string> = {}) {
  const objects = new Map<string, string>(Object.entries(seed));
  const calls: string[] = [];
  const api: BlobApi = {
    async putJson(pathname, json) {
      calls.push(`put ${pathname}`);
      objects.set(pathname, json);
    },
    async getText(pathname) {
      calls.push(`get ${pathname}`);
      return objects.get(pathname) ?? null;
    },
    async exists(pathname) {
      return objects.has(pathname);
    },
    async list(prefix, cursor) {
      calls.push(`list ${prefix}`);
      const all = [...objects.keys()].filter((p) => p.startsWith(prefix) && (!cursor || p > cursor)).sort();
      const pathnames = all.slice(0, 2);
      return { pathnames, cursor: all.length > 2 ? pathnames[pathnames.length - 1] : undefined };
    },
    async del(pathnames) {
      for (const p of pathnames) objects.delete(p);
    },
  };
  return { api, objects, calls };
}

const ID_A = 'aaaaaaaaaaaa000000000001'; // held at build
const ID_B = 'bbbbbbbbbbbb000000000002'; // mailed
const ID_C = 'cccccccccccc000000000003'; // tombstoned
const SLUG_A = 'i-aaaaaaaaaaaa';
const SLUG_B = 'i-bbbbbbbbbbbb';

const record = (id: string, name: string, createdAt: string, email: string | null) =>
  JSON.stringify({
    id,
    sessionId: `s-${id}`,
    name,
    gender: 'f',
    email,
    document: { secret: 'never shown' },
    transcript: [{ role: 'user', content: 'secret transcript' }],
    createdAt,
    expiresAt: '2027-01-10T08:00:00.000Z',
  });

const T0 = new Date('2026-10-17T09:30:00.000Z');

function fixtureStore() {
  return fakeBlobApi({
    [`interviews/${ID_A}.json`]: record(ID_A, 'דנה', '2026-10-16T08:00:00.000Z', null),
    [`interviews/${ID_B}.json`]: record(ID_B, 'רון', '2026-10-12T08:00:00.000Z', 'ron@example.com'),
    [`tombstones/${ID_C}.json`]: JSON.stringify({ id: ID_C, deletedAt: '2026-10-14T08:00:00.000Z', reason: 'person' }),
    'pipeline/_slugs.json': JSON.stringify({ [SLUG_A]: ID_A, [SLUG_B]: ID_B }),
    'pipeline/_count.json': JSON.stringify({ founding_count: 2, paid: 1, open_locks: 1, updated: '2026-10-17T09:00:00Z' }),
    'pipeline/_digest.md': Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n') + '\n',
    [`pipeline/${SLUG_A}/state.json`]: JSON.stringify({
      slug: SLUG_A,
      created: '2026-10-16T08:05:00+00:00',
      steps: {
        intake: { status: 'done', note: 'ok', at: '2026-10-16T08:05:00+00:00' },
        content: { status: 'done', note: 'ok', at: '2026-10-16T08:06:00+00:00' },
        illustrate: { status: 'done', note: 'ok', at: '2026-10-16T08:07:00+00:00' },
        build: { status: 'held', note: 'board_check_failed', at: '2026-10-16T08:08:00+00:00' },
      },
      mail: {},
      comment_inbox: [],
      payment: null,
    }),
    [`pipeline/${SLUG_A}/work/intake.json`]: '{"name":"never read"}',
    [`pipeline/${SLUG_B}/state.json`]: JSON.stringify({
      slug: SLUG_B,
      created: '2026-10-12T08:05:00+00:00',
      steps: {
        intake: { status: 'done', note: 'ok' },
        content: { status: 'done', note: 'ok' },
        illustrate: { status: 'done', note: 'ok' },
        build: { status: 'done', note: 'built_preview' },
        deploy_preview: { status: 'done', note: 'deployed' },
        email_preview: { status: 'done', note: 'sent' },
        comments: { status: 'waiting', note: 'no_reply' },
      },
      urls: { preview: 'https://pv-x.example.pages.dev/', owner: 'https://pv-x.example.pages.dev/owner-abc.html' },
      mail: {
        preview: { status: 'sent', sent_at: '2026-10-12T09:00:00+00:00', kind: 'preview', ref: 'r1' },
        reminder: { status: 'scheduled', due_at: '2026-10-19T07:00:00+00:00', kind: 'reminder' },
      },
      comment_inbox: [{ status: 'new' }, { status: 'accepted' }],
      payment: { ref: 'p1', paid_at: '2026-10-13T10:00:00+00:00', amount: 390 },
    }),
    [`pipeline/_commands/2026-10-17T09-00-00.000Z-release-${SLUG_A}.json`]: JSON.stringify({
      action: 'release',
      slug: SLUG_A,
      id: ID_A,
      requestedAt: '2026-10-17T09:00:00.000Z',
      by: 'admin',
    }),
  });
}

const basic = (user: string, password: string) => `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
const GOOD = basic('lionel', 'correct horse');

function req(url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) {
  return new NextRequest(`http://localhost${url}`, {
    method: init?.method ?? 'GET',
    headers: init?.headers,
    body: init?.body,
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  resetCommandLimiterForTests();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  setAdminBlobApiForTests(undefined);
});

describe('admin overview aggregation', () => {
  it('builds one view per person, newest first, with stage, hold, mail, urls, payment, tombstone and pending commands', async () => {
    const { api } = fixtureStore();
    const o = await buildOverview(api, T0);

    expect(o.generatedAt).toBe(T0.toISOString());
    expect(o.people.map((p) => p.slug)).toEqual([SLUG_A, 'i-cccccccccccc', SLUG_B]);

    const a = o.people[0];
    expect(a).toMatchObject({
      id: ID_A,
      name: 'דנה',
      createdAt: '2026-10-16T08:00:00.000Z',
      expiresAt: '2027-01-10T08:00:00.000Z',
      hasEmail: false,
      stage: 'illustrate',
      held: true,
      heldNote: 'board_check_failed',
      urls: {},
      comments: 0,
      paid: false,
      tombstoned: false,
    });
    expect(a.mail).toEqual({ preview: null, reminder: null, end: null });
    expect(a.pendingCommands).toEqual([
      {
        action: 'release',
        requestedAt: '2026-10-17T09:00:00.000Z',
        file: `pipeline/_commands/2026-10-17T09-00-00.000Z-release-${SLUG_A}.json`,
      },
    ]);

    const c = o.people[1];
    expect(c).toMatchObject({ id: ID_C, tombstoned: true, name: '', stage: null, held: false });

    const b = o.people[2];
    expect(b).toMatchObject({
      id: ID_B,
      name: 'רון',
      hasEmail: true,
      stage: 'email_preview',
      stageNote: 'sent',
      held: false,
      comments: 2,
      paid: true,
      tombstoned: false,
      pendingCommands: [],
    });
    expect(b.urls).toEqual({ preview: 'https://pv-x.example.pages.dev/', owner: 'https://pv-x.example.pages.dev/owner-abc.html' });
    expect(b.mail.preview).toEqual({ status: 'sent', at: '2026-10-12T09:00:00+00:00' });
    expect(b.mail.reminder).toEqual({ status: 'scheduled', at: '2026-10-19T07:00:00+00:00' });
    expect(b.mail.end).toBeNull();

    expect(o.counts).toEqual({ interviews: 2, held: 1, previewsLive: 1, mailed: 1, paid: 1, tombstoned: 1 });
    expect(o.founding).toEqual({ count: 2, paid: 1, open_locks: 1 });
    expect(o.digestTail).toHaveLength(40);
    expect(o.digestTail[0]).toBe('line 11');
    expect(o.digestTail[39]).toBe('line 50');
  });

  it('never projects document, transcript or email text, and does not read work files', async () => {
    const { api, calls } = fixtureStore();
    const o = await buildOverview(api, T0);
    const json = JSON.stringify(o);
    expect(json).not.toContain('never shown');
    expect(json).not.toContain('secret transcript');
    expect(json).not.toContain('ron@example.com');
    expect(calls.some((c) => c.includes('work/intake.json') && c.startsWith('get'))).toBe(false);
  });

  it('copes with an empty store and a missing digest', async () => {
    const { api } = fakeBlobApi();
    const o = await buildOverview(api, T0);
    expect(o.people).toEqual([]);
    expect(o.counts).toEqual({ interviews: 0, held: 0, previewsLive: 0, mailed: 0, paid: 0, tombstoned: 0 });
    expect(o.founding).toEqual({ count: null, paid: null, open_locks: null });
    expect(o.digestTail).toEqual([]);
  });

  it('GET /api/admin/overview answers with no-store and the same shape', async () => {
    vi.stubEnv('ADMIN_USER', 'lionel');
    vi.stubEnv('ADMIN_PASSWORD', 'correct horse');
    const { api } = fixtureStore();
    setAdminBlobApiForTests(api);
    const res = await overviewGet(req('/api/admin/overview', { headers: { authorization: GOOD } }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { people: unknown[]; counts: { interviews: number } };
    expect(body.people).toHaveLength(3);
    expect(body.counts.interviews).toBe(2);
  });

  it('GET /api/admin/overview is 503 without a store token', async () => {
    vi.stubEnv('ADMIN_USER', 'lionel');
    vi.stubEnv('ADMIN_PASSWORD', 'correct horse');
    setAdminBlobApiForTests(null);
    const res = await overviewGet(req('/api/admin/overview', { headers: { authorization: GOOD } }));
    expect(res.status).toBe(503);
  });
});

describe('POST /api/admin/command', () => {
  const post = (body: unknown, headers: Record<string, string> = { authorization: GOOD }) =>
    commandPost(
      req('/api/admin/command', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7', ...headers },
        body: JSON.stringify(body),
      })
    );

  beforeEach(() => {
    vi.stubEnv('ADMIN_USER', 'lionel');
    vi.stubEnv('ADMIN_PASSWORD', 'correct horse');
  });

  it('writes pipeline/_commands/<time>-<action>-<slug>.json with the contract fields', async () => {
    const { api, objects } = fixtureStore();
    setAdminBlobApiForTests(api);
    const res = await post({ action: 'release', slug: SLUG_A });
    expect(res.status).toBe(200);
    const file = `pipeline/_commands/2026-10-17T09-30-00.000Z-release-${SLUG_A}.json`;
    expect(await res.json()).toEqual({ ok: true, file });
    expect(JSON.parse(objects.get(file)!)).toEqual({
      action: 'release',
      slug: SLUG_A,
      id: ID_A,
      requestedAt: '2026-10-17T09:30:00.000Z',
      by: 'admin',
    });
  });

  it('writes id: null for a slug the pipeline has not mapped, and round-trips the file name', async () => {
    const { api, objects } = fixtureStore();
    setAdminBlobApiForTests(api);
    const res = await post({ action: 'purge', slug: 'i-ffffffffffff' });
    expect(res.status).toBe(200);
    const { file } = (await res.json()) as { file: string };
    expect(JSON.parse(objects.get(file)!).id).toBeNull();
    expect(parseCommandPathname(file)).toEqual({ requestedAt: '2026-10-17T09:30:00.000Z', action: 'purge', slug: 'i-ffffffffffff' });
    expect(commandPathname(T0, 'purge', 'i-ffffffffffff')).toBe(file);
    expect(file).not.toContain(':');
  });

  it('"paid" (התקבל תשלום) writes the same file shape as release, and the overview lists it as pending', async () => {
    const { api, objects } = fixtureStore();
    setAdminBlobApiForTests(api);
    const res = await post({ action: 'paid', slug: SLUG_A });
    expect(res.status).toBe(200);
    const file = `pipeline/_commands/2026-10-17T09-30-00.000Z-paid-${SLUG_A}.json`;
    expect(await res.json()).toEqual({ ok: true, file });
    expect(JSON.parse(objects.get(file)!)).toEqual({ action: 'paid', slug: SLUG_A, id: ID_A, requestedAt: '2026-10-17T09:30:00.000Z', by: 'admin' });
    expect(parseCommandPathname(file)).toEqual({ requestedAt: '2026-10-17T09:30:00.000Z', action: 'paid', slug: SLUG_A });
    const o = await buildOverview(api, T0);
    expect(o.people[0].pendingCommands.map((c) => c.action)).toEqual(['release', 'paid']);
  });

  it('"cancel_reminder" writes the command file and overview marks it as pending', async () => {
    const { api, objects } = fixtureStore();
    setAdminBlobApiForTests(api);
    const res = await post({ action: 'cancel_reminder', slug: SLUG_A });
    expect(res.status).toBe(200);
    const file = `pipeline/_commands/2026-10-17T09-30-00.000Z-cancel_reminder-${SLUG_A}.json`;
    expect(await res.json()).toEqual({ ok: true, file });
    expect(JSON.parse(objects.get(file)!)).toEqual({
      action: 'cancel_reminder',
      slug: SLUG_A,
      id: ID_A,
      requestedAt: '2026-10-17T09:30:00.000Z',
      by: 'admin',
    });
    expect(parseCommandPathname(file)).toEqual({ requestedAt: '2026-10-17T09:30:00.000Z', action: 'cancel_reminder', slug: SLUG_A });
  });

  it('rejects a bad action, a bad slug and a non-object body', async () => {
    const { api, objects } = fixtureStore();
    setAdminBlobApiForTests(api);
    const before = objects.size;
    expect((await post({ action: 'deploy', slug: SLUG_A })).status).toBe(400);
    expect((await post({ action: 'purge', slug: '../etc' })).status).toBe(400);
    expect((await post({ action: 'purge', slug: 'A-Upper' })).status).toBe(400);
    expect((await post({ action: 'purge', slug: 'a'.repeat(62) })).status).toBe(400);
    expect((await post({ action: 'purge' })).status).toBe(400);
    expect((await post([1, 2])).status).toBe(400);
    expect(objects.size).toBe(before);
  });

  it('never logs the slug', async () => {
    const { api } = fixtureStore();
    setAdminBlobApiForTests(api);
    const info = console.info as unknown as ReturnType<typeof vi.fn>;
    await post({ action: 'release', slug: SLUG_B });
    const logged = JSON.stringify(info.mock.calls);
    expect(logged).toContain('admin.command');
    expect(logged).not.toContain(SLUG_B);
  });

  it(`rate limits to ${COMMAND_RATE.limit} per IP per window`, async () => {
    const { api } = fixtureStore();
    setAdminBlobApiForTests(api);
    for (let i = 0; i < COMMAND_RATE.limit; i++) {
      vi.setSystemTime(T0.getTime() + i); // distinct file names
      expect((await post({ action: 'release', slug: SLUG_A })).status).toBe(200);
    }
    const over = await post({ action: 'release', slug: SLUG_A });
    expect(over.status).toBe(429);
    expect(((await over.json()) as { error: string }).error).toBe('rate_limited');
    // another IP is not affected
    const other = await post({ action: 'release', slug: SLUG_A }, { authorization: GOOD, 'x-forwarded-for': '198.51.100.9' });
    expect(other.status).toBe(200);
  });

  it('is closed on its own: 404 without env, 401 without a header', async () => {
    const { api } = fixtureStore();
    setAdminBlobApiForTests(api);
    expect((await post({ action: 'release', slug: SLUG_A }, {})).status).toBe(401);
    vi.stubEnv('ADMIN_PASSWORD', '');
    expect((await post({ action: 'release', slug: SLUG_A })).status).toBe(404);
  });
});

describe('admin middleware (HTTP Basic)', () => {
  it('matches /admin and /api/admin/*', () => {
    expect(middlewareConfig.matcher).toEqual(['/admin', '/admin/:path*', '/api/admin/:path*']);
  });

  it('is 404 while ADMIN_USER or ADMIN_PASSWORD is unset', async () => {
    vi.stubEnv('ADMIN_USER', '');
    vi.stubEnv('ADMIN_PASSWORD', '');
    expect(middleware(req('/admin')).status).toBe(404);
    vi.stubEnv('ADMIN_USER', 'lionel');
    expect(middleware(req('/admin', { headers: { authorization: GOOD } })).status).toBe(404);
  });

  it('is 401 with a realm challenge without a header or with a wrong password', () => {
    vi.stubEnv('ADMIN_USER', 'lionel');
    vi.stubEnv('ADMIN_PASSWORD', 'correct horse');
    const res = middleware(req('/admin'));
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toBe('Basic realm="MESSY admin", charset="UTF-8"');
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(middleware(req('/admin', { headers: { authorization: basic('lionel', 'wrong') } })).status).toBe(401);
    expect(middleware(req('/admin', { headers: { authorization: basic('someone', 'correct horse') } })).status).toBe(401);
    expect(middleware(req('/admin', { headers: { authorization: 'Bearer abc' } })).status).toBe(401);
    expect(middleware(req('/admin', { headers: { authorization: 'Basic !!!not-base64' } })).status).toBe(401);
  });

  it('lets a correct Basic header through (200, no cookie)', () => {
    vi.stubEnv('ADMIN_USER', 'lionel');
    vi.stubEnv('ADMIN_PASSWORD', 'correct horse');
    const res = middleware(req('/api/admin/overview', { headers: { authorization: GOOD } }));
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('checkBasicAuth handles UTF-8 passwords and ignores a prefix match', () => {
    const env = { ADMIN_USER: 'ליונל', ADMIN_PASSWORD: 'סיסמה-חזקה' };
    expect(checkBasicAuth(basic('ליונל', 'סיסמה-חזקה'), env)).toBe('ok');
    expect(checkBasicAuth(basic('ליונל', 'סיסמה-חזק'), env)).toBe('unauthorized');
    expect(checkBasicAuth(basic('ליונל', 'סיסמה-חזקה!'), env)).toBe('unauthorized');
    expect(checkBasicAuth(null, env)).toBe('unauthorized');
    expect(checkBasicAuth(GOOD, {})).toBe('not_configured');
  });
});
