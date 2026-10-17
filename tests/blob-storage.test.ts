import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { deleteRecord, finishInterview, purgeRecord, resetForTests } from '@/lib/interview';
import { normalizeDocument } from '@/lib/doc';
import { transcriptMac, type TranscriptMessage } from '@/lib/session';
import { BlobStore, MemoryStore, getStore, setStoreForTests } from '@/lib/storage';
import { recordPath, stoppedPath, tombstonePath, type BlobApi, type Tombstone } from '@/lib/storage/blob';
import { DELETE_PAGE } from '@/content/copy';
import { POST as purgePost } from '@/app/api/purge/route';
import { GET as cronGet } from '@/app/api/cron/purge-expired/route';
import { freshIp, makeDeps, newSession } from './helpers';

/** In-memory stand-in for the Vercel Blob SDK slice the store uses. No network. */
function fakeBlobApi() {
  const objects = new Map<string, string>();
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
      calls.push(`head ${pathname}`);
      return objects.has(pathname);
    },
    async list(prefix, cursor) {
      calls.push(`list ${prefix}`);
      // Two-item pages with a keyset cursor (the last pathname), to exercise the cursor loop
      // while the caller deletes what it has already seen.
      const all = [...objects.keys()]
        .filter((p) => p.startsWith(prefix) && (!cursor || p > cursor))
        .sort();
      const pathnames = all.slice(0, 2);
      return { pathnames, cursor: all.length > 2 ? pathnames[pathnames.length - 1] : undefined };
    },
    async del(pathnames) {
      for (const p of pathnames) {
        calls.push(`del ${p}`);
        objects.delete(p);
      }
    },
  };
  return { api, objects, calls };
}

const person = { name: 'דנה', gender: 'f' as const };
const input = () => ({
  sessionId: 'sid-1',
  name: 'דנה',
  gender: 'f' as const,
  email: 'dana@example.com',
  document: normalizeDocument({ before_sentence: 'מעצבת' }, person),
  transcript: [{ role: 'user' as const, content: 'מעצבת פנים' }],
});
const T0 = new Date('2026-10-10T08:00:00Z');
const T_EXPIRED = new Date('2027-01-08T08:00:01Z');

const tombstoneOf = (objects: Map<string, string>, id: string): Tombstone | null => {
  const t = objects.get(tombstonePath(id));
  return t ? (JSON.parse(t) as Tombstone) : null;
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  resetForTests();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  setStoreForTests(null);
});

describe('BlobStore (private Vercel Blob, mocked SDK)', () => {
  it('is durable and saves the record at interviews/<id>.json with the contract fields', async () => {
    const { api, objects } = fakeBlobApi();
    const store = new BlobStore(api);
    expect(store.durable).toBe(true);

    const rec = await store.save(input(), T0);
    expect(rec.id).toMatch(/^[0-9a-f]{24}$/);
    expect(rec.createdAt).toBe('2026-10-10T08:00:00.000Z');
    expect(rec.expiresAt).toBe('2027-01-08T08:00:00.000Z');

    expect([...objects.keys()]).toEqual([`interviews/${rec.id}.json`]);
    const stored = JSON.parse(objects.get(recordPath(rec.id))!);
    expect(Object.keys(stored).sort()).toEqual(
      ['id', 'sessionId', 'name', 'gender', 'email', 'document', 'transcript', 'createdAt', 'expiresAt'].sort()
    );
    expect(stored).toEqual(rec);
    expect(await store.get(rec.id)).toEqual(rec);
  });

  it('delete removes the record, writes a "person" tombstone, and is true only when the record existed', async () => {
    const { api, objects } = fakeBlobApi();
    const store = new BlobStore(api);
    const rec = await store.save(input(), T0);

    expect(await store.delete(rec.id)).toBe(true);
    expect(objects.has(recordPath(rec.id))).toBe(false);
    expect(tombstoneOf(objects, rec.id)).toEqual({ id: rec.id, deletedAt: T0.toISOString(), reason: 'person', email: 'dana@example.com' });

    expect(await store.delete(rec.id)).toBe(false);
    expect(await store.delete('not-an-id')).toBe(false);
    expect(await store.get(rec.id)).toBeNull();
  });

  it('operator deletion writes an "operator" tombstone', async () => {
    const { api, objects } = fakeBlobApi();
    const store = new BlobStore(api);
    const rec = await store.save(input(), T0);
    expect(await store.delete(rec.id, 'operator')).toBe(true);
    expect(tombstoneOf(objects, rec.id)?.reason).toBe('operator');
  });

  it('an expired record is null on read, deleted, and tombstoned with reason "expiry"', async () => {
    const { api, objects } = fakeBlobApi();
    const store = new BlobStore(api);
    const rec = await store.save(input(), T0);
    expect(await store.get(rec.id, new Date('2027-01-07T00:00:00Z'))).not.toBeNull();
    expect(await store.get(rec.id, T_EXPIRED)).toBeNull();
    expect(objects.has(recordPath(rec.id))).toBe(false);
    expect(tombstoneOf(objects, rec.id)).toEqual({ id: rec.id, deletedAt: T_EXPIRED.toISOString(), reason: 'expiry', email: 'dana@example.com' });
  });

  it('purgeExpired walks every page, removes only expired records and tombstones each one', async () => {
    const { api, objects } = fakeBlobApi();
    const store = new BlobStore(api);
    const old1 = await store.save(input(), T0);
    const old2 = await store.save(input(), new Date('2026-09-01T00:00:00Z'));
    const old3 = await store.save(input(), new Date('2026-08-01T00:00:00Z'));
    const fresh = await store.save(input(), new Date('2026-12-01T00:00:00Z'));
    objects.set('pipeline/dana/site.json', '{}');
    objects.set('stopped/other.json', '{"at":"x"}');

    expect(await store.purgeExpired(T_EXPIRED)).toBe(3);
    for (const r of [old1, old2, old3]) {
      expect(objects.has(recordPath(r.id))).toBe(false);
      expect(tombstoneOf(objects, r.id)?.reason).toBe('expiry');
    }
    expect(objects.has(recordPath(fresh.id))).toBe(true);
    expect(tombstoneOf(objects, fresh.id)).toBeNull();
    expect(objects.has('pipeline/dana/site.json')).toBe(true);
    expect(objects.has('stopped/other.json')).toBe(true);
    expect(await store.purgeExpired(T_EXPIRED)).toBe(0);
  });

  it('stopSession writes stopped/<sid>.json with {at} only, and isStopped reads it', async () => {
    const { api, objects } = fakeBlobApi();
    const store = new BlobStore(api);
    expect(await store.isStopped('abc')).toBe(false);
    await store.stopSession('abc', T0);
    expect(JSON.parse(objects.get(stoppedPath('abc'))!)).toEqual({ at: T0.toISOString() });
    expect(await store.isStopped('abc')).toBe(true);
  });

  it('logs only the event name and error class on failure, never content or pathnames', async () => {
    const errors: unknown[] = [];
    vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => void errors.push(a));
    const { api } = fakeBlobApi();
    api.putJson = async () => {
      throw Object.assign(new Error('boom interviews/secret.json'), { name: 'BlobServiceNotAvailable', status: 503 });
    };
    const store = new BlobStore(api);
    await expect(store.save(input(), T0)).rejects.toThrow();
    const text = JSON.stringify(errors);
    expect(text).toContain('blob.save_failed');
    expect(text).toContain('BlobServiceNotAvailable');
    expect(text).toContain('503');
    expect(text).not.toContain('secret');
    expect(text).not.toContain('דנה');
    expect(text).not.toContain('interviews/');
  });
});

describe('getStore', () => {
  it('returns BlobStore only when BLOB_READ_WRITE_TOKEN is set', () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    setStoreForTests(null);
    expect(getStore()).toBeInstanceOf(MemoryStore);
    expect(getStore().durable).toBe(false);

    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_test_token');
    setStoreForTests(null);
    expect(getStore()).toBeInstanceOf(BlobStore);
    expect(getStore().durable).toBe(true);
  });
});

describe('finish and delete with the durable store', () => {
  async function finishWith(store: BlobStore) {
    const s = await newSession();
    const history: TranscriptMessage[] = [...s.messages, { role: 'user', content: 'מעצבת' }, { role: 'assistant', content: 'עוד?' }];
    const sid = JSON.parse(Buffer.from(s.token.split('.')[1], 'base64url').toString()).sid;
    const env = makeDeps(['<identity>{"before_sentence":"מעצבת"}</identity>']);
    const deps = { ...env.deps, store };
    const r = await finishInterview({ token: s.token, mac: transcriptMac(sid, history), messages: history }, freshIp(), deps);
    return { r, deps };
  }

  it('the delete link is real (not a demo) and the token deletes the blob with a "person" tombstone', async () => {
    const { api, objects } = fakeBlobApi();
    const store = new BlobStore(api);
    const { r, deps } = await finishWith(store);
    expect(r.status).toBe(200);
    expect(r.body.delete_is_demo).toBe(false);
    expect(String(r.body.delete_url)).toMatch(/^\/delete#t=d1\./);
    const id = [...objects.keys()][0].replace(/^interviews\/|\.json$/g, '');

    const token = String(r.body.delete_url).split('#t=')[1];
    expect((await deleteRecord({ token }, freshIp(), deps)).body).toEqual({ deleted: true });
    expect(objects.has(recordPath(id))).toBe(false);
    expect(tombstoneOf(objects, id)?.reason).toBe('person');
    expect((await deleteRecord({ token }, freshIp(), deps)).body).toEqual({ deleted: false });
  });
});

describe('/delete page copy (DELETE_PAGE)', () => {
  it('declares what is held, what is removed, what is not and why, and that it cannot be undone', () => {
    expect(DELETE_PAGE.held).toBe('השיחה המלאה, המסמך שנבנה ממנה, וכתובת המייל אם השארת אותה.');
    expect(DELETE_PAGE.removes).toBe(
      'כל אלה נמחקים מהאחסון של MESSY. אם נבנתה מהשיחה תצוגה מקדימה של אתר, גם היא יורדת מהרשת, יחד עם כל הקבצים שלה, בתוך שעה.'
    );
    expect(DELETE_PAGE.kept).toBe(
      'העותק שליונל מקבל על כל שיחה (גיליון שמור אצלו) ומיילים שכבר נשלחו לא נמחקים אוטומטית. אפשר לבקש גם את מחיקתם במייל lionmit@gmail.com, והם יימחקו ידנית בתוך 7 ימים.'
    );
    expect(DELETE_PAGE.irreversible).toContain('אי אפשר לבטל');
    expect(DELETE_PAGE.acknowledge).toBe('הבנתי, ואני רוצה למחוק');
    expect(DELETE_PAGE.confirm).toBe('למחוק את הנתונים שלי');
    expect(DELETE_PAGE.done('17.10.2026, 13:05')).toBe(
      'הנתונים נמחקו. תאריך ושעה: 17.10.2026, 13:05. אפשר לצלם את המסך הזה כאישור.'
    );
    expect(DELETE_PAGE.doneNote).toContain('בתוך שעה');
    expect(DELETE_PAGE.failed).toBeTruthy();
    expect(DELETE_PAGE.retry).toBeTruthy();
  });

  it('keeps the copy register: no dashes, no dot-forms, gender-invariant', () => {
    const strings = Object.values(DELETE_PAGE).map((v) => (typeof v === 'function' ? v('x') : v));
    for (const s of strings) {
      expect(s).not.toMatch(/[—–-]/);
      expect(s).not.toMatch(/[א-ת]\.[א-ת]/);
    }
  });
});

describe('POST /api/purge (operator)', () => {
  const purgeReq = (secret: string | null, body: unknown) =>
    new NextRequest('http://localhost/api/purge', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(secret ? { 'x-messy-purge-secret': secret } : {}) },
      body: JSON.stringify(body),
    });

  it('is 404 while MESSY_PURGE_SECRET is unset', async () => {
    vi.stubEnv('MESSY_PURGE_SECRET', '');
    const r = await purgeRecord({ id: 'a'.repeat(24) }, freshIp(), 'anything', makeDeps().deps);
    expect(r.status).toBe(404);
    expect((await purgePost(purgeReq('anything', { id: 'a'.repeat(24) }))).status).toBe(404);
  });

  it('is 403 on a wrong or missing secret', async () => {
    vi.stubEnv('MESSY_PURGE_SECRET', 'right-secret');
    expect((await purgeRecord({ id: 'a'.repeat(24) }, freshIp(), 'wrong', makeDeps().deps)).status).toBe(403);
    expect((await purgeRecord({ id: 'a'.repeat(24) }, freshIp(), null, makeDeps().deps)).status).toBe(403);
    expect((await purgePost(purgeReq('wrong', { id: 'a'.repeat(24) }))).status).toBe(403);
  });

  it('deletes with an "operator" tombstone on the right secret, validates the id, and never logs it', async () => {
    vi.stubEnv('MESSY_PURGE_SECRET', 'right-secret');
    const logged: unknown[] = [];
    vi.spyOn(console, 'info').mockImplementation((...a: unknown[]) => void logged.push(a));
    const { api, objects } = fakeBlobApi();
    const store = new BlobStore(api);
    const rec = await store.save(input(), T0);
    const deps = { ...makeDeps().deps, store };

    expect((await purgeRecord({ id: 'nope' }, freshIp(), 'right-secret', deps)).status).toBe(400);
    const r = await purgeRecord({ id: rec.id }, freshIp(), 'right-secret', deps);
    expect(r).toEqual({ status: 200, body: { deleted: true } });
    expect(tombstoneOf(objects, rec.id)?.reason).toBe('operator');
    expect((await purgeRecord({ id: rec.id }, freshIp(), 'right-secret', deps)).body).toEqual({ deleted: false });
    expect(JSON.stringify(logged)).not.toContain(rec.id);

    // Through the route handler, with the default store.
    setStoreForTests(store);
    const rec2 = await store.save(input(), T0);
    const res = await purgePost(purgeReq('right-secret', { id: rec2.id }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
  });

  it('is rate-limited like /api/delete', async () => {
    vi.stubEnv('MESSY_PURGE_SECRET', 'right-secret');
    const ip = freshIp();
    let last = 0;
    for (let i = 0; i < 12; i++) last = (await purgeRecord({ id: 'nope' }, ip, 'right-secret', makeDeps().deps)).status;
    expect(last).toBe(429);
  });
});

describe('GET /api/cron/purge-expired', () => {
  const cronReq = (auth?: string) =>
    new NextRequest('http://localhost/api/cron/purge-expired', { headers: auth ? { authorization: auth } : {} });

  it('is 401 without the CRON_SECRET bearer, or when CRON_SECRET is unset', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    expect((await cronGet(cronReq())).status).toBe(401);
    expect((await cronGet(cronReq('Bearer wrong'))).status).toBe(401);
    vi.stubEnv('CRON_SECRET', '');
    expect((await cronGet(cronReq('Bearer '))).status).toBe(401);
  });

  it('purges expired records and returns {purged}', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    const store = new MemoryStore();
    await store.save(input(), new Date('2026-01-01T00:00:00Z'));
    await store.save(input(), new Date('2026-01-02T00:00:00Z'));
    await store.save(input(), T0);
    setStoreForTests(store);
    const res = await cronGet(cronReq('Bearer cron-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ purged: 2 });
  });
});
