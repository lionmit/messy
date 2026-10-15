/**
 * Submitting one review round: validation, the payload for Lionel's webhook,
 * and a best-effort double-submit guard. Plain function; the route wraps it.
 */
import type { Result } from '@/lib/interview';
import { deliver as realDeliver } from '@/lib/delivery';
import { logEvent } from '@/lib/log';
import { SlidingWindowLimiter } from '@/lib/rate-limit';
import { isObject } from '@/lib/validate';
import { getStudioConfig, type StudioConfig } from './config';
import { validateStudioMessages, type StudioMessage } from './chat';
import { STUDIO_LIMITS, buildWaLink, defaultWaText, displayIsraeliPhone, validateStudioState, type StudioState } from './steps';

export interface StudioSubmitDeps {
  deliver: typeof realDeliver;
  now: () => Date;
}

const submitPerIp = new SlidingWindowLimiter(10, 60 * 60 * 1000);
/** Rounds already delivered from this instance. */
const delivered = new Set<string>();

export function resetStudioSubmitForTests(): void {
  submitPerIp.reset();
  delivered.clear();
}

export interface SubmitInput {
  config: StudioConfig;
  round: number;
  state: StudioState;
  transcript: StudioMessage[];
}

/** Validates the body: known slug, the current round, a clean state, a bounded transcript. */
export function validateSubmitBody(body: unknown): { ok: true; value: SubmitInput } | { ok: false; status: number; field: string } {
  if (!isObject(body)) return { ok: false, status: 400, field: 'body' };
  const config = getStudioConfig(body.slug);
  if (!config) return { ok: false, status: 404, field: 'slug' };
  if (body.round !== config.round) return { ok: false, status: 400, field: 'round' };
  const st = validateStudioState(body.state, config.sections.map((s) => s.id));
  if (!st.ok) return { ok: false, status: 400, field: st.field };
  let transcript: StudioMessage[] = [];
  if (body.transcript !== undefined) {
    if (!Array.isArray(body.transcript) || body.transcript.length > STUDIO_LIMITS.maxTranscript) {
      return { ok: false, status: 400, field: 'transcript' };
    }
    if (body.transcript.length > 0) {
      // Same shape as chat messages, but the transcript may end with the bot's turn.
      const withTail = [...body.transcript, { role: 'user', text: '.' }];
      const msgs = validateStudioMessages(withTail);
      if (!msgs.ok || msgs.value.length > STUDIO_LIMITS.maxTranscript) return { ok: false, status: 400, field: 'transcript' };
      transcript = msgs.value.slice(0, -1);
    }
  }
  return { ok: true, value: { config, round: config.round, state: st.value, transcript } };
}

export function buildStudioPayload(input: SubmitInput, now: Date): Record<string, unknown> {
  const { config, state, transcript } = input;
  const waText = state.waText ?? defaultWaText(config.name);
  return {
    kind: 'studio_round',
    slug: config.slug,
    owner_name: config.name,
    round: input.round,
    rounds_included: config.roundsIncluded,
    go_live: state.goLive === true,
    whatsapp: state.whatsapp ?? '',
    whatsapp_display: state.whatsapp ? displayIsraeliPhone(state.whatsapp) : '',
    wa_text: waText,
    wa_link: state.whatsapp ? buildWaLink(state.whatsapp, waText) : '',
    reply_line: state.reply ?? '',
    first_line: state.first ?? '',
    photo_sent: state.photoSent,
    palette: state.palette ?? '',
    font: state.font ?? '',
    edits: state.edits,
    edits_count: state.edits.length,
    comments: state.comments,
    comments_count: state.comments.length,
    reached_step: state.step,
    transcript,
    transcript_messages: transcript.length,
    submitted_at: now.toISOString(),
  };
}

export async function studioSubmit(
  body: unknown,
  ip: string,
  deps: StudioSubmitDeps = { deliver: realDeliver, now: () => new Date() }
): Promise<Result> {
  const rl = submitPerIp.hit(ip);
  if (!rl.ok) return { status: 429, body: { error: 'rate_limited', retry_after_ms: rl.retryAfterMs } };
  const v = validateSubmitBody(body);
  if (!v.ok) return { status: v.status, body: { error: v.status === 404 ? 'unknown_case' : 'invalid', field: v.field } };
  const key = `${v.value.config.slug}:${v.value.round}`;
  if (delivered.has(key)) return { status: 409, body: { error: 'already_sent' } };

  const payload = buildStudioPayload(v.value, deps.now());
  const result = await deps.deliver('studio_round', payload);
  logEvent('studio.submit', {
    result,
    round: v.value.round,
    go_live: v.value.state.goLive === true,
    edits: v.value.state.edits.length,
    comments: v.value.state.comments.length,
  });
  if (result === 'failed') return { status: 502, body: { error: 'delivery_failed' } };
  if (result === 'not-configured') return { status: 503, body: { error: 'unavailable' } };
  delivered.add(key);
  return { status: 200, body: { ok: true, delivery: result } };
}
