/**
 * One turn of the studio review conversation, as a plain function (the route
 * file is a thin wrapper). The model is always Anthropic, called directly:
 * interview material never goes through callModel's provider routing.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { RATE } from '@/lib/config';
import type { Result } from '@/lib/interview';
import { logError, logEvent } from '@/lib/log';
import { ModelNotConfiguredError, callAnthropic, type ModelCaller, type ModelRequest } from '@/lib/model';
import { STUDIO_START_STUB, STUDIO_STATIC_PROMPT, ownerBlock, studioServerNote } from '@/lib/prompt/studio';
import { MinIntervalLimiter, SlidingWindowLimiter } from '@/lib/rate-limit';
import { hasGenderSlip, hasPraise, hasScriptGlitch, neutralizeUserText, stripForeignScript } from '@/lib/sanitize';
import { isObject } from '@/lib/validate';
import { getStudioConfig, type StudioConfig } from './config';
import {
  CHIPS,
  STUDIO_LIMITS,
  buildWaLink,
  defaultWaText,
  displayIsraeliPhone,
  findIsraeliPhone,
  parseStudioReply,
  validateStudioState,
  type StudioState,
} from './steps';

export interface StudioChatDeps {
  callModel: ModelCaller;
}

export interface StudioMessage {
  role: 'assistant' | 'user';
  text: string;
}

export interface WaPreview {
  number: string;
  text: string;
  link: string;
}

const limiters = {
  perIp: new SlidingWindowLimiter(RATE.chatPerIp.limit, RATE.chatPerIp.windowMs),
  interval: new MinIntervalLimiter(RATE.chatMinIntervalMs),
};

export function resetStudioChatForTests(): void {
  Object.values(limiters).forEach((l) => l.reset());
}

const tooMany = (retryAfterMs: number): Result => ({
  status: 429,
  body: { error: 'rate_limited', retry_after_ms: retryAfterMs },
});
const invalid = (field: string): Result => ({ status: 400, body: { error: 'invalid', field } });

/** Messages as the browser sends them. The last one must be the owner's. */
export function validateStudioMessages(v: unknown): { ok: true; value: StudioMessage[] } | { ok: false; field: string } {
  if (!Array.isArray(v) || v.length < 1 || v.length > STUDIO_LIMITS.maxMessages) return { ok: false, field: 'messages' };
  const out: StudioMessage[] = [];
  for (let i = 0; i < v.length; i++) {
    const m = v[i];
    if (!isObject(m) || (m.role !== 'assistant' && m.role !== 'user') || typeof m.text !== 'string') {
      return { ok: false, field: 'messages' };
    }
    const max = m.role === 'user' ? STUDIO_LIMITS.maxUserChars : STUDIO_LIMITS.maxAssistantChars;
    if (m.text.length > max) return { ok: false, field: 'messages' };
    const text = m.role === 'user' ? neutralizeUserText(m.text) : m.text.trim();
    if (!text) return { ok: false, field: 'messages' };
    out.push({ role: m.role, text });
  }
  if (out[out.length - 1].role !== 'user') return { ok: false, field: 'messages' };
  return { ok: true, value: out };
}

/** Builds the API request: static prompt (cached), owner block, alternating turns, server note in the last turn. */
export function buildStudioRequest(config: StudioConfig, messages: StudioMessage[], note: string): ModelRequest {
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: STUDIO_STATIC_PROMPT, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: ownerBlock(config) },
  ];
  const turns: Anthropic.MessageParam[] = [];
  if (messages[0].role === 'assistant') turns.push({ role: 'user', content: STUDIO_START_STUB });
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const last = turns[turns.length - 1];
    const isFinal = i === messages.length - 1;
    const content = isFinal ? `${m.text}\n\n${note}` : m.text;
    if (last && last.role === m.role && typeof last.content === 'string') {
      last.content = `${last.content}\n\n${content}`;
    } else {
      turns.push({ role: m.role, content });
    }
  }
  return { system, messages: turns, maxTokens: STUDIO_LIMITS.maxTokens, mode: 'chat' };
}

function waPreviewFor(config: StudioConfig, state: StudioState): WaPreview | null {
  if (!state.whatsapp) return null;
  const text = state.waText ?? defaultWaText(config.name);
  return { number: displayIsraeliPhone(state.whatsapp), text, link: buildWaLink(state.whatsapp, text) };
}

function qualityIssue(text: string, config: StudioConfig): boolean {
  return hasScriptGlitch(text) || hasGenderSlip(text, config.gender) || hasPraise(text);
}

export async function studioChatTurn(
  body: unknown,
  ip: string,
  deps: StudioChatDeps = { callModel: callAnthropic }
): Promise<Result> {
  const ipRl = limiters.perIp.hit(ip);
  if (!ipRl.ok) return tooMany(ipRl.retryAfterMs);
  if (!isObject(body)) return invalid('body');
  const config = getStudioConfig(body.slug);
  if (!config) return { status: 404, body: { error: 'unknown_case' } };
  const gap = limiters.interval.hit(`${ip}:${config.slug}`);
  if (!gap.ok) return tooMany(gap.retryAfterMs);

  const msgs = validateStudioMessages(body.messages);
  if (!msgs.ok) return invalid(msgs.field);
  const sectionIds = config.sections.map((s) => s.id);
  const st = validateStudioState(body.state, sectionIds);
  if (!st.ok) return invalid(st.field);
  const state = st.value;
  const messages = msgs.value;
  const userText = messages[messages.length - 1].text;

  // Step 3: the number she typed is validated here, deterministically. The
  // model only learns whether it was accepted; it never invents one.
  let phoneCheck: 'ok' | 'invalid' | null = null;
  if (state.step === 3) {
    const found = findIsraeliPhone(userText);
    if (found) {
      state.whatsapp = found;
      if (!state.waText) state.waText = defaultWaText(config.name);
      phoneCheck = 'ok';
    } else if (!state.whatsapp && /\d{7,}/.test(userText.replace(/[\s().+-]/g, ''))) {
      phoneCheck = 'invalid';
    }
  }
  const note = studioServerNote(state, phoneCheck, state.whatsapp ? displayIsraeliPhone(state.whatsapp) : null);
  const req = buildStudioRequest(config, messages, note);

  let parsed = null;
  try {
    for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
      const raw = (await deps.callModel(req)).text;
      const candidate = parseStudioReply(raw, state, config);
      if (!candidate) {
        logEvent('studio.chat.unparsed', { attempt });
        continue;
      }
      if (attempt === 0 && qualityIssue(candidate.reply, config)) {
        logEvent('studio.chat.retry_quality');
        continue;
      }
      parsed = candidate;
    }
  } catch (err) {
    if (err instanceof ModelNotConfiguredError) {
      logEvent('studio.chat.model_not_configured');
      return { status: 503, body: { error: 'unavailable' } };
    }
    logError('studio.chat.model_error', err);
    return { status: 502, body: { error: 'model_error' } };
  }

  if (!parsed) {
    // Keep the conversation alive with a neutral turn; nothing moves.
    return {
      status: 200,
      body: {
        reply: 'לא הצלחתי לנסח תשובה הפעם. אפשר לכתוב את זה שוב, במילים אחרות?',
        chips: [CHIPS.goLive],
        step: state.step,
        state,
        done: false,
        waPreview: waPreviewFor(config, state),
      },
    };
  }

  const reply = stripForeignScript(parsed.reply);
  logEvent('studio.chat.turn', { step: parsed.step, done: parsed.done, chips: parsed.chips.length });
  return {
    status: 200,
    body: {
      reply,
      chips: parsed.chips,
      step: parsed.step,
      state: parsed.state,
      done: parsed.done,
      waPreview: parsed.state.step === 3 ? waPreviewFor(config, parsed.state) : null,
    },
  };
}
