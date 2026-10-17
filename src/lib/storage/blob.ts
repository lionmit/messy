/**
 * BlobStore: finished interviews in a PRIVATE Vercel Blob store ("messy-interviews").
 *
 * The object layout is a contract with the pipeline (a separate Python system
 * that reads the same store). Keep it exactly:
 *
 *   interviews/<id>.json        the InterviewRecord as JSON
 *                               (id, sessionId, name, gender, email, document, transcript, createdAt, expiresAt)
 *   stopped/<sessionId>.json    distress stop marker {at}
 *   tombstones/<id>.json        written on deletion: {id, deletedAt, reason: "person"|"expiry"|"operator"}
 *                               (the pipeline reads these to take the person's site down, then deletes them)
 *   pipeline/<slug>/...         the pipeline's own files; this code never touches them
 *
 * Blob rules: exact pathnames (addRandomSuffix: false, allowOverwrite: true),
 * access 'private', contentType application/json, cacheControlMaxAge 0. Reading
 * a private blob goes through the SDK's get() with the token, never a URL.
 *
 * The SDK functions are injected (BlobApi) so unit tests run with an in-memory
 * fake and no network. Errors are logged as event name + class + status only;
 * never a pathname, an id or record content.
 */
import { del, get, head, list, put, BlobNotFoundError } from '@vercel/blob';
import { logError } from '../log';
import {
  expiryFrom,
  isExpired,
  isRecordId,
  newRecordId,
  type DeletionReason,
  type InterviewRecord,
  type InterviewStore,
} from './types';

export const BLOB_PREFIX = {
  interviews: 'interviews/',
  stopped: 'stopped/',
  tombstones: 'tombstones/',
} as const;

export const recordPath = (id: string) => `${BLOB_PREFIX.interviews}${id}.json`;
export const stoppedPath = (sessionId: string) => `${BLOB_PREFIX.stopped}${sessionId}.json`;
export const tombstonePath = (id: string) => `${BLOB_PREFIX.tombstones}${id}.json`;

export interface Tombstone {
  id: string;
  deletedAt: string;
  reason: DeletionReason;
  /**
   * The address the person left, when the record had one. The pipeline needs it to delete the person's row in
   * Lionel's sheet (the one copy outside this store); it deletes the tombstone right after, so the address outlives
   * the record by one runner cycle at most.
   */
  email?: string;
}

/** The slice of the Vercel Blob SDK the store uses. Pathnames are exact. */
export interface BlobApi {
  /** Writes JSON text at the exact pathname, overwriting. */
  putJson(pathname: string, json: string): Promise<void>;
  /** The blob's text, or null when there is no such blob. */
  getText(pathname: string): Promise<string | null>;
  exists(pathname: string): Promise<boolean>;
  /** One page of pathnames under a prefix. */
  list(prefix: string, cursor?: string): Promise<{ pathnames: string[]; cursor?: string }>;
  del(pathnames: string[]): Promise<void>;
}

/** The real SDK, bound to one read-write token. */
export function vercelBlobApi(token: string): BlobApi {
  const common = { token } as const;
  return {
    async putJson(pathname, json) {
      await put(pathname, json, {
        ...common,
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 0,
      });
    },
    async getText(pathname) {
      // The SDK resolves null when there is no such blob.
      const result = await get(pathname, { ...common, access: 'private' });
      if (!result || result.statusCode !== 200) return null;
      return new Response(result.stream).text();
    },
    async exists(pathname) {
      try {
        await head(pathname, common);
        return true;
      } catch (err) {
        if (err instanceof BlobNotFoundError) return false;
        throw err;
      }
    },
    async list(prefix, cursor) {
      const page = await list({ ...common, prefix, cursor, limit: 1000 });
      return { pathnames: page.blobs.map((b) => b.pathname), cursor: page.hasMore ? page.cursor : undefined };
    },
    async del(pathnames) {
      if (pathnames.length > 0) await del(pathnames, common);
    },
  };
}

function parseRecord(text: string): InterviewRecord | null {
  try {
    const r = JSON.parse(text) as Partial<InterviewRecord> | null;
    if (!r || typeof r !== 'object' || !isRecordId(r.id) || typeof r.expiresAt !== 'string') return null;
    return r as InterviewRecord;
  } catch {
    return null;
  }
}

export class BlobStore implements InterviewStore {
  readonly durable = true;

  constructor(private readonly api: BlobApi) {}

  private async run<T>(event: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      logError(`blob.${event}`, err);
      throw err;
    }
  }

  async save(input: Omit<InterviewRecord, 'id' | 'createdAt' | 'expiresAt'>, now: Date = new Date()) {
    const record: InterviewRecord = {
      ...input,
      id: newRecordId(),
      createdAt: now.toISOString(),
      expiresAt: expiryFrom(now).toISOString(),
    };
    await this.run('save_failed', () => this.api.putJson(recordPath(record.id), JSON.stringify(record)));
    return record;
  }

  async get(id: string, now: Date = new Date()) {
    if (!isRecordId(id)) return null;
    const text = await this.run('get_failed', () => this.api.getText(recordPath(id)));
    if (text === null) return null;
    const record = parseRecord(text);
    if (!record) return null;
    if (isExpired(record, now)) {
      await this.remove(id, 'expiry', now);
      return null;
    }
    return record;
  }

  async delete(id: string, reason: DeletionReason = 'person') {
    if (!isRecordId(id)) return false;
    const existed = await this.run('head_failed', () => this.api.exists(recordPath(id)));
    if (!existed) return false;
    const text = await this.run('get_failed', () => this.api.getText(recordPath(id)));
    const record = text === null ? null : parseRecord(text);
    await this.remove(id, reason, new Date(), record?.email ?? null);
    return true;
  }

  /** Tombstone first, then the record: if the delete fails, a retry still finds the record. */
  private async remove(id: string, reason: DeletionReason, now: Date, email: string | null = null): Promise<void> {
    const tombstone: Tombstone = { id, deletedAt: now.toISOString(), reason, ...(email ? { email } : {}) };
    await this.run('tombstone_failed', () => this.api.putJson(tombstonePath(id), JSON.stringify(tombstone)));
    await this.run('delete_failed', () => this.api.del([recordPath(id)]));
  }

  async purgeExpired(now: Date = new Date()) {
    let n = 0;
    let cursor: string | undefined;
    do {
      const page = await this.run('list_failed', () => this.api.list(BLOB_PREFIX.interviews, cursor));
      for (const pathname of page.pathnames) {
        const id = pathname.slice(BLOB_PREFIX.interviews.length).replace(/\.json$/, '');
        if (!isRecordId(id)) continue;
        const text = await this.run('get_failed', () => this.api.getText(pathname));
        if (text === null) continue;
        const record = parseRecord(text);
        // Unreadable records expire too: nothing else could ever read them.
        if (record === null || isExpired(record, now)) {
          await this.remove(id, 'expiry', now, record?.email ?? null);
          n++;
        }
      }
      cursor = page.cursor;
    } while (cursor);
    return n;
  }

  async stopSession(sessionId: string, now: Date = new Date()) {
    await this.run('stop_failed', () =>
      this.api.putJson(stoppedPath(sessionId), JSON.stringify({ at: now.toISOString() }))
    );
  }

  async isStopped(sessionId: string) {
    return this.run('stopped_check_failed', () => this.api.exists(stoppedPath(sessionId)));
  }
}
