/**
 * The interview API, as plain functions (the route files are thin wrappers).
 * Dependencies are injectable so tests run with a mocked model, store and webhook.
 *
 * Flow:
 *   POST /api/session  consent + name + form of address (+ turnstile token) -> session token + opening message
 *   POST /api/chat     signed history + one new message  -> reply (or distress stop)
 *   POST /api/finish   signed history + optional email   -> document, saved server-side
 *   POST /api/delete   delete token                      -> record removed
 */
import { CHAT, openingMessage } from '@/content/copy';
import { LIMITS, RATE, isProduction } from './config';
import { buildDistressPayload, detectDistress, modelSignalledDistress } from './distress';
import { buildInterviewPayload, extractDocumentJson, normalizeDocument } from './doc';
import { deliver as realDeliver } from './delivery';
import { verifyHuman, type FetchLike } from './human';
import { logError, logEvent } from './log';
import { ModelNotConfiguredError, buildModelRequest, callAnthropic, callModel, type ModelCaller } from './model';
import { leaksSystemPrompt } from './prompt/guard';
import { MinIntervalLimiter, SlidingWindowLimiter } from './rate-limit';
import {
  cleanForDisplay,
  hasGenderSlip,
  hasPraise,
  hasScriptGlitch,
  stripForeignScript,
} from './sanitize';
import {
  issueDeleteToken,
  issueSessionToken,
  transcriptMac,
  verifyDeleteToken,
  verifySessionToken,
  verifyTranscriptMac,
  type SessionClaims,
  type TranscriptMessage,
} from './session';
import { getStore, type InterviewStore } from './storage';
import { isObject, validateGender, validateHistory, validateName, validateOptionalEmail } from './validate';

export interface Result {
  status: number;
  body: Record<string, unknown>;
}

export interface Deps {
  callModel: ModelCaller;
  store: InterviewStore;
  deliver: typeof realDeliver;
}

function defaultDeps(): Deps {
  return { callModel, store: getStore(), deliver: realDeliver };
}

const limiters = {
  sessionPerIp: new SlidingWindowLimiter(RATE.sessionPerIp.limit, RATE.sessionPerIp.windowMs),
  chatPerIp: new SlidingWindowLimiter(RATE.chatPerIp.limit, RATE.chatPerIp.windowMs),
  chatPerSession: new SlidingWindowLimiter(RATE.chatPerSession.limit, RATE.chatPerSession.windowMs),
  chatInterval: new MinIntervalLimiter(RATE.chatMinIntervalMs),
  finishPerSession: new SlidingWindowLimiter(RATE.finishPerSession.limit, RATE.finishPerSession.windowMs),
  deletePerIp: new SlidingWindowLimiter(RATE.deletePerIp.limit, RATE.deletePerIp.windowMs),
};

/** Sessions that already produced a document on this instance (best-effort double-submit guard). */
const finished = new Set<string>();

export function resetForTests(): void {
  Object.values(limiters).forEach((l) => l.reset());
  finished.clear();
}

const tooMany = (retryAfterMs: number): Result => ({
  status: 429,
  body: { error: 'rate_limited', retry_after_ms: retryAfterMs },
});
const invalid = (field: string, reason?: string): Result => ({
  status: reason === 'turn_cap' ? 409 : 400,
  body: { error: reason ?? 'invalid', field },
});

// ---------------------------------------------------------------- session

export interface SessionOptions {
  /** Injectable for tests: the fetch used to reach Cloudflare's siteverify. */
  fetch?: FetchLike;
}

export async function startSession(body: unknown, ip: string, opts: SessionOptions = {}): Promise<Result> {
  const rl = limiters.sessionPerIp.hit(ip);
  if (!rl.ok) return tooMany(rl.retryAfterMs);
  if (!isObject(body)) return invalid('body');
  // Consent checkpoint: nothing starts without an explicit `true`.
  if (body.consent !== true) return { status: 403, body: { error: 'consent_required' } };
  const name = validateName(body.name);
  if (!name.ok) return invalid(name.field);
  const gender = validateGender(body.gender);
  if (!gender.ok) return invalid(gender.field);

  // Human check (Cloudflare Turnstile). A no-op unless TURNSTILE_SECRET_KEY is set.
  const human = await verifyHuman(body.turnstile, ip, opts.fetch);
  if (!human.ok) {
    if (human.reason === 'unavailable') return { status: 503, body: { error: 'human_check_unavailable' } };
    return { status: 403, body: { error: human.reason === 'required' ? 'human_check_required' : 'human_check_failed' } };
  }

  const { token, claims } = issueSessionToken({ name: name.value, gender: gender.value });
  const messages: TranscriptMessage[] = [{ role: 'assistant', content: openingMessage(claims.name, claims.gender) }];
  logEvent('session.start');
  return {
    status: 200,
    body: {
      token,
      messages,
      mac: transcriptMac(claims.sid, messages),
      limits: { max_user_message_chars: LIMITS.maxUserMessageChars, max_user_turns: LIMITS.maxUserTurns },
    },
  };
}

// ---------------------------------------------------------------- shared checks

type Authed = { claims: SessionClaims } | { fail: Result };

function authenticate(body: unknown): Authed {
  if (!isObject(body)) return { fail: invalid('body') };
  const claims = verifySessionToken(body.token);
  if (!claims) return { fail: { status: 401, body: { error: 'no_session' } } };
  return { claims };
}

async function stopForDistress(claims: SessionClaims, source: 'keyword' | 'model', deps: Deps): Promise<Result> {
  await deps.store.stopSession(claims.sid);
  await deps.deliver('distress', { ...buildDistressPayload() });
  logEvent('distress.stop', { source });
  return { status: 200, body: { distress: true } };
}

// ---------------------------------------------------------------- chat

function qualityIssue(text: string, claims: SessionClaims): boolean {
  return hasScriptGlitch(text) || hasGenderSlip(text, claims.gender) || hasPraise(text);
}

export async function chatTurn(body: unknown, ip: string, deps: Deps = defaultDeps()): Promise<Result> {
  const ipRl = limiters.chatPerIp.hit(ip);
  if (!ipRl.ok) return tooMany(ipRl.retryAfterMs);
  const auth = authenticate(body);
  if ('fail' in auth) return auth.fail;
  const { claims } = auth;
  const b = body as Record<string, unknown>;

  const gap = limiters.chatInterval.hit(claims.sid);
  if (!gap.ok) return tooMany(gap.retryAfterMs);
  const sessRl = limiters.chatPerSession.hit(claims.sid);
  if (!sessRl.ok) return tooMany(sessRl.retryAfterMs);

  if (await deps.store.isStopped(claims.sid)) return { status: 410, body: { error: 'stopped', distress: true } };

  // Distress layer 1, checked before any other validation (so an over-long or
  // malformed message still stops the conversation). The model never sees it.
  if (Array.isArray(b.messages) && b.messages.length > 0) {
    const last = b.messages[b.messages.length - 1];
    if (isObject(last) && last.role === 'user' && typeof last.content === 'string') {
      if (detectDistress(last.content.slice(0, 20_000))) return stopForDistress(claims, 'keyword', deps);
    }
  }

  const hist = validateHistory(b.messages, 'user');
  if (!hist.ok) return invalid(hist.field, 'reason' in hist ? hist.reason : undefined);
  const history = hist.value;
  if (!verifyTranscriptMac(claims.sid, history.slice(0, -1), b.mac)) {
    return { status: 403, body: { error: 'bad_history' } };
  }

  const userText = history[history.length - 1].content;

  const req = buildModelRequest(claims, history, 'chat');
  let raw: string;
  try {
    raw = (await deps.callModel(req)).text;
    if (!modelSignalledDistress(raw) && !leaksSystemPrompt(raw) && qualityIssue(raw, claims)) {
      logEvent('chat.retry_quality');
      raw = (await deps.callModel(req)).text;
    }
  } catch (err) {
    if (err instanceof ModelNotConfiguredError) {
      logEvent('chat.model_not_configured');
      return { status: 503, body: { error: 'unavailable' } };
    }
    logError('chat.model_error', err);
    return { status: 502, body: { error: 'model_error' } };
  }

  // A leaked prompt contains the literal distress tag, so the leak check comes first.
  const leaked = leaksSystemPrompt(raw);
  // Distress layer 2: the model flagged it. Its text is discarded.
  if (!leaked && modelSignalledDistress(raw)) return stopForDistress(claims, 'model', deps);

  let reply: string;
  let ready = false;
  if (leaked) {
    logEvent('chat.prompt_leak_blocked');
    reply = CHAT.deflection;
  } else {
    ready = /<\s*ready\s*\/?\s*>/i.test(raw);
    const withoutTags = raw
      .replace(/<\s*ready\s*\/?\s*>/gi, '')
      .replace(/<identity>[\s\S]*?(<\/identity>|$)/g, '')
      .replace(/<server_note>[\s\S]*?(<\/server_note>|$)/g, '');
    reply = stripForeignScript(cleanForDisplay(withoutTags));
  }
  if (!reply) return { status: 502, body: { error: 'empty_reply' } };

  const newHistory = [...history, { role: 'assistant' as const, content: reply }];
  const userTurns = newHistory.filter((m) => m.role === 'user').length;
  return {
    status: 200,
    body: {
      message: reply,
      user_message: userText,
      mac: transcriptMac(claims.sid, newHistory),
      ready: ready || userTurns >= LIMITS.maxUserTurns,
      turns_left: Math.max(0, LIMITS.maxUserTurns - userTurns),
    },
  };
}

// ---------------------------------------------------------------- finish

export async function finishInterview(body: unknown, ip: string, deps: Deps = defaultDeps()): Promise<Result> {
  const ipRl = limiters.chatPerIp.hit(ip);
  if (!ipRl.ok) return tooMany(ipRl.retryAfterMs);
  const auth = authenticate(body);
  if ('fail' in auth) return auth.fail;
  const { claims } = auth;
  const b = body as Record<string, unknown>;

  const rl = limiters.finishPerSession.hit(claims.sid);
  if (!rl.ok) return tooMany(rl.retryAfterMs);
  if (await deps.store.isStopped(claims.sid)) return { status: 410, body: { error: 'stopped', distress: true } };
  if (finished.has(claims.sid)) return { status: 409, body: { error: 'already_finished' } };

  const hist = validateHistory(b.messages, 'assistant');
  if (!hist.ok) return invalid(hist.field, 'reason' in hist ? hist.reason : undefined);
  const history = hist.value;
  if (!verifyTranscriptMac(claims.sid, history, b.mac)) return { status: 403, body: { error: 'bad_history' } };
  const email = validateOptionalEmail(b.email);
  if (!email.ok) return invalid(email.field);

  const req = buildModelRequest(claims, history, 'finish');
  let parsed: unknown | null = null;
  try {
    for (let attempt = 0; attempt < 2 && parsed === null; attempt++) {
      const out = await deps.callModel(req);
      if (!leaksSystemPrompt(out.text) && modelSignalledDistress(out.text)) {
        return stopForDistress(claims, 'model', deps);
      }
      parsed = extractDocumentJson(out.text);
      if (parsed === null) logEvent('finish.unparsable', { attempt, stop: out.stopReason ?? 'none' });
    }
  } catch (err) {
    if (err instanceof ModelNotConfiguredError) return { status: 503, body: { error: 'unavailable' } };
    logError('finish.model_error', err);
    return { status: 502, body: { error: 'model_error' } };
  }
  if (parsed === null) return { status: 502, body: { error: 'doc_failed' } };

  const document = normalizeDocument(parsed, claims);
  const record = await deps.store.save({
    sessionId: claims.sid,
    name: claims.name,
    gender: claims.gender,
    email: email.value,
    document,
    transcript: history,
  });
  finished.add(claims.sid);
  await deps.deliver(
    'interview',
    buildInterviewPayload({ document, transcript: history, email: email.value, expiresAt: record.expiresAt })
  );
  logEvent('finish.saved', { services: document.services.length, turns: history.length, email: email.value !== null });

  // A delete link is a promise. Only make it where deleting is real, or in a
  // non-production build where it is labelled as a demo.
  const showDelete = deps.store.durable || !isProduction();
  return {
    status: 200,
    body: {
      document,
      expires_at: record.expiresAt,
      delete_url: showDelete ? `/delete#t=${issueDeleteToken(record.id)}` : null,
      delete_is_demo: !deps.store.durable,
    },
  };
}

// ---------------------------------------------------------------- delete

export async function deleteRecord(body: unknown, ip: string, deps: Deps = defaultDeps()): Promise<Result> {
  const rl = limiters.deletePerIp.hit(ip);
  if (!rl.ok) return tooMany(rl.retryAfterMs);
  if (!isObject(body)) return invalid('body');
  const id = verifyDeleteToken(body.token);
  if (!id) return { status: 400, body: { error: 'invalid_token' } };
  const deleted = await deps.store.delete(id);
  logEvent('record.delete', { deleted });
  return { status: 200, body: { deleted } };
}
