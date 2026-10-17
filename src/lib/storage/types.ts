/**
 * Shared shapes for the interview stores (index.ts re-exports them).
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
  /**
   * PROMPT_VERSION of the system prompt that ran this conversation (src/lib/prompt/system.ts),
   * so every stored conversation says which prompt produced it. Records saved before
   * 2026-10-17 have no such field.
   */
  promptVersion: string;
  createdAt: string;
  /** Raw transcript expiry: createdAt + 90 days (prices.json transcript_retention_days). */
  expiresAt: string;
}

/** Who or what removed a record. Written into the tombstone the pipeline reads. */
export type DeletionReason = 'person' | 'expiry' | 'operator';

export interface InterviewStore {
  /** True only when records survive restarts and deletion is real. */
  readonly durable: boolean;
  save(input: Omit<InterviewRecord, 'id' | 'createdAt' | 'expiresAt'>, now?: Date): Promise<InterviewRecord>;
  get(id: string, now?: Date): Promise<InterviewRecord | null>;
  /** Called with an id taken from a verified delete token (person) or the operator route. */
  delete(id: string, reason?: DeletionReason): Promise<boolean>;
  /** Removes expired records. Returns how many. */
  purgeExpired(now?: Date): Promise<number>;
  /** Distress: blocks the session. Stores the session id and the time only. */
  stopSession(sessionId: string, now?: Date): Promise<void>;
  isStopped(sessionId: string): Promise<boolean>;
}

export function expiryFrom(now: Date): Date {
  return new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

/** Record ids are 24 hex characters (12 random bytes). Also the only shape accepted in a pathname. */
export function newRecordId(): string {
  return randomBytes(12).toString('hex');
}

export function isRecordId(id: unknown): id is string {
  return typeof id === 'string' && /^[0-9a-f]{24}$/.test(id);
}

export function isExpired(record: Pick<InterviewRecord, 'expiresAt'>, now: Date): boolean {
  const t = new Date(record.expiresAt).getTime();
  return Number.isNaN(t) || t <= now.getTime();
}
