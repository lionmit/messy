/**
 * Storage for finished interviews (launch checklist #8).
 *
 * Two adapters:
 * - BlobStore (./blob.ts): a PRIVATE Vercel Blob store, durable. Used whenever
 *   BLOB_READ_WRITE_TOKEN is set (production, preview, development on Vercel, or
 *   a local .env.local). Deleting there is real: the record is removed and a
 *   tombstone is written so the pipeline takes the person's site down too.
 * - MemoryStore (below): one serverless instance, gone after a cold start. Local
 *   dev without a token, and tests. Not durable, so the delete link the person
 *   gets is labelled as a demo (see finishInterview).
 *
 * Lionel's Google Sheet, fed by the Make webhook in production, is a separate
 * copy that neither adapter touches; the /delete page says so.
 */
import { BlobStore, vercelBlobApi } from './blob';
import { expiryFrom, isExpired, newRecordId, type InterviewRecord, type InterviewStore } from './types';

export { expiryFrom, isExpired, isRecordId, newRecordId } from './types';
export type { DeletionReason, InterviewRecord, InterviewStore } from './types';
export { BlobStore } from './blob';

export class MemoryStore implements InterviewStore {
  readonly durable = false;
  private records = new Map<string, InterviewRecord>();
  private stopped = new Map<string, string>();

  async save(input: Omit<InterviewRecord, 'id' | 'createdAt' | 'expiresAt'>, now: Date = new Date()) {
    const record: InterviewRecord = {
      ...input,
      id: newRecordId(),
      createdAt: now.toISOString(),
      expiresAt: expiryFrom(now).toISOString(),
    };
    this.records.set(record.id, record);
    return record;
  }

  async get(id: string, now: Date = new Date()) {
    const r = this.records.get(id);
    if (!r) return null;
    if (isExpired(r, now)) {
      this.records.delete(id);
      return null;
    }
    return r;
  }

  async delete(id: string) {
    return this.records.delete(id);
  }

  async purgeExpired(now: Date = new Date()) {
    let n = 0;
    for (const [id, r] of this.records) {
      if (isExpired(r, now)) {
        this.records.delete(id);
        n++;
      }
    }
    return n;
  }

  async stopSession(sessionId: string, now: Date = new Date()) {
    this.stopped.set(sessionId, now.toISOString());
  }

  async isStopped(sessionId: string) {
    return this.stopped.has(sessionId);
  }
}

let store: InterviewStore | null = null;

/** BlobStore when BLOB_READ_WRITE_TOKEN is set, MemoryStore otherwise. */
export function getStore(): InterviewStore {
  if (!store) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    store = token ? new BlobStore(vercelBlobApi(token)) : new MemoryStore();
  }
  return store;
}

/** Tests only. */
export function setStoreForTests(s: InterviewStore | null): void {
  store = s;
}
