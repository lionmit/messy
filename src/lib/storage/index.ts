/**
 * Storage interface for finished interviews (launch checklist #8 plugs in here).
 *
 * Today the app ships only the in-memory adapter below. On Vercel it lives in
 * one serverless instance and is gone after a cold start, so it is NOT a real
 * store: it exists so the flow (save, expiry, delete link, distress stop) can be
 * built and tested now. Lionel's Google Sheet, fed by the Make webhook in
 * production, is still the only lasting copy, and deleting here does not delete
 * the Sheet row. That is why the delete link is only shown when the adapter is
 * `durable`, or outside production with a "demo" marker.
 *
 * To plug in the real store (#8): implement InterviewStore in a new adapter
 * (see RemoteStoreAdapter below), set `durable = true`, and return it from
 * getStore(). No route code changes.
 */
import { randomBytes } from 'node:crypto';
import { RETENTION_DAYS } from '../config';
import type { Gender, TranscriptMessage } from '../session';
import type { InterviewDocument } from '../doc';

export interface InterviewRecord {
  id: string;
  sessionId: string;
  name: string;
  gender: Gender;
  /** Only when the person asked for a preview. */
  email: string | null;
  document: InterviewDocument;
  transcript: TranscriptMessage[];
  createdAt: string;
  /** Raw transcript expiry: createdAt + 90 days (prices.json transcript_retention_days). */
  expiresAt: string;
}

export interface InterviewStore {
  /** True only when records survive restarts and deletion is real. */
  readonly durable: boolean;
  save(input: Omit<InterviewRecord, 'id' | 'createdAt' | 'expiresAt'>, now?: Date): Promise<InterviewRecord>;
  get(id: string, now?: Date): Promise<InterviewRecord | null>;
  /** Called with an id taken from a verified delete token. */
  delete(id: string): Promise<boolean>;
  /** Removes expired records. Returns how many. */
  purgeExpired(now?: Date): Promise<number>;
  /** Distress: blocks the session. Stores the session id and the time only. */
  stopSession(sessionId: string, now?: Date): Promise<void>;
  isStopped(sessionId: string): Promise<boolean>;
}

export function expiryFrom(now: Date): Date {
  return new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

export class MemoryStore implements InterviewStore {
  readonly durable = false;
  private records = new Map<string, InterviewRecord>();
  private stopped = new Map<string, string>();

  async save(input: Omit<InterviewRecord, 'id' | 'createdAt' | 'expiresAt'>, now: Date = new Date()) {
    const record: InterviewRecord = {
      ...input,
      id: randomBytes(12).toString('hex'),
      createdAt: now.toISOString(),
      expiresAt: expiryFrom(now).toISOString(),
    };
    this.records.set(record.id, record);
    return record;
  }

  async get(id: string, now: Date = new Date()) {
    const r = this.records.get(id);
    if (!r) return null;
    if (new Date(r.expiresAt) <= now) {
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
      if (new Date(r.expiresAt) <= now) {
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

/**
 * STUB for the real store (#8). Not wired in. Requirements for whoever builds it:
 * - durable = true; records encrypted at rest by the provider.
 * - save(): write the record with expires_at; transcript and document may live
 *   in separate columns so the transcript can expire while the document stays
 *   (D15: the document is kept until the person asks to delete it).
 * - purgeExpired(): run daily (cron), deleting transcripts past expires_at.
 * - delete(): remove the record and everything derived from it, and tell the
 *   Sheet/Make side to remove its copy too (needs Lionel's yes on the Make change).
 * - stopSession()/isStopped(): a small table of { session_id, stopped_at } only.
 * - No transcript text in any log, metric or error message.
 */
export class RemoteStoreAdapter implements InterviewStore {
  readonly durable = true;
  private fail(): never {
    throw new Error('RemoteStoreAdapter is a stub until checklist #8');
  }
  async save(): Promise<InterviewRecord> {
    return this.fail();
  }
  async get(): Promise<InterviewRecord | null> {
    return this.fail();
  }
  async delete(): Promise<boolean> {
    return this.fail();
  }
  async purgeExpired(): Promise<number> {
    return this.fail();
  }
  async stopSession(): Promise<void> {
    return this.fail();
  }
  async isStopped(): Promise<boolean> {
    return this.fail();
  }
}

let store: InterviewStore | null = null;

export function getStore(): InterviewStore {
  if (!store) store = new MemoryStore();
  return store;
}

/** Tests only. */
export function setStoreForTests(s: InterviewStore | null): void {
  store = s;
}
