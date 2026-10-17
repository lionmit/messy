/**
 * Limits and environment switches for the interview API.
 * Every limit here is enforced on the server. The browser only mirrors them for UX.
 */

export const MODEL_ID = 'claude-sonnet-4-6';

export const LIMITS = {
  /** Characters in one message the person writes. */
  maxUserMessageChars: 2000,
  /** Characters in one assistant message inside the history we accept back. */
  maxAssistantMessageChars: 3000,
  /** Messages the person can send in one interview. */
  maxUserTurns: 30,
  /** From this many user turns on, the server asks the model to wrap up. */
  wrapUpFromTurn: 26,
  /** Name field. */
  maxNameChars: 40,
  /** Email field (RFC 5321 path limit). */
  maxEmailChars: 254,
  /** Whole request body, in bytes. 30 turns of capped messages fit well under this. */
  maxBodyBytes: 200_000,
  /** Session token lifetime. */
  sessionTtlMs: 3 * 60 * 60 * 1000,
  /** Output tokens for one interview turn (one short message and one question). */
  chatMaxTokens: 700,
  /** Output tokens for the final document (Hebrew JSON is token-heavy). */
  finishMaxTokens: 6000,
} as const;

export const RATE = {
  sessionPerIp: { limit: 6, windowMs: 60 * 60 * 1000 },
  /** GET /api/challenge (proof-of-work challenges for the start form). */
  challengePerIp: { limit: 30, windowMs: 10 * 60 * 1000 },
  chatPerIp: { limit: 60, windowMs: 10 * 60 * 1000 },
  chatPerSession: { limit: 45, windowMs: 60 * 60 * 1000 },
  chatMinIntervalMs: 1500,
  finishPerSession: { limit: 3, windowMs: 60 * 60 * 1000 },
  deletePerIp: { limit: 10, windowMs: 60 * 60 * 1000 },
} as const;

/** Raw transcripts expire after this many days (prices.json lane1.transcript_retention_days). */
export const RETENTION_DAYS = 90;

export function isProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

/**
 * Deliveries to Lionel's Make webhook (and so his Google Sheet) happen ONLY in
 * production. Preview, development and tests always dry-run.
 * MESSY_DRY_RUN=1 forces a dry run in production too.
 */
export function deliveryEnabled(): boolean {
  return isProduction() && process.env.MESSY_DRY_RUN !== '1';
}
