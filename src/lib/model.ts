/**
 * The one place that talks to the Anthropic API. The key stays on the server.
 *
 * Model: claude-sonnet-4-6 (what production already used; still active, not retired).
 * Prompt caching (Q17):
 * - breakpoint 1: the static system prompt (shared by every conversation);
 * - breakpoint 2: top-level automatic caching, which moves the breakpoint to the
 *   end of the conversation, so each turn re-reads earlier turns from cache.
 * Sonnet 4.6 caches prefixes of 1024 tokens or more. `model.usage` logs show
 * cache_read / cache_write per call (numbers only).
 */
import Anthropic from '@anthropic-ai/sdk';
import { LIMITS, MODEL_ID } from './config';
import { logEvent } from './log';
import type { Gender, TranscriptMessage } from './session';
import {
  CONVERSATION_START_STUB,
  FINISH_NOTE,
  STATIC_SYSTEM_PROMPT,
  personBlock,
  wrapUpNote,
} from './prompt/system';

export interface ModelRequest {
  system: Anthropic.TextBlockParam[];
  messages: Anthropic.MessageParam[];
  maxTokens: number;
}

export interface ModelResult {
  text: string;
  stopReason: string | null;
}

export type ModelCaller = (req: ModelRequest) => Promise<ModelResult>;

export class ModelNotConfiguredError extends Error {
  name = 'ModelNotConfiguredError';
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new ModelNotConfiguredError('ANTHROPIC_API_KEY missing');
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 55_000 });
  return client;
}

export const callAnthropic: ModelCaller = async (req) => {
  const res = await getClient().messages.create({
    model: MODEL_ID,
    max_tokens: req.maxTokens,
    // Below the default 1.0 to make rare cross-script tokens (the Arabic letters
    // found in the first interview) less likely. The server also checks every reply.
    temperature: 0.7,
    cache_control: { type: 'ephemeral' },
    system: req.system,
    messages: req.messages,
  });
  logEvent('model.usage', {
    input: res.usage.input_tokens,
    output: res.usage.output_tokens,
    cache_read: res.usage.cache_read_input_tokens ?? 0,
    cache_write: res.usage.cache_creation_input_tokens ?? 0,
    stop: res.stop_reason ?? 'none',
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return { text, stopReason: res.stop_reason };
};

/**
 * Builds the API request from the signed history. Deterministic: the same
 * history always gives the same bytes, so the cached prefix stays valid.
 */
export function buildModelRequest(
  person: { name: string; gender: Gender },
  history: TranscriptMessage[],
  mode: 'chat' | 'finish'
): ModelRequest {
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: STATIC_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: personBlock(person.name, person.gender) },
  ];
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: CONVERSATION_START_STUB }];
  let userTurn = 0;
  for (const m of history) {
    if (m.role === 'user') {
      userTurn++;
      if (userTurn >= LIMITS.wrapUpFromTurn) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: m.content },
            { type: 'text', text: wrapUpNote(Math.max(0, LIMITS.maxUserTurns - userTurn)) },
          ],
        });
        continue;
      }
    }
    messages.push({ role: m.role, content: m.content });
  }
  if (mode === 'finish') messages.push({ role: 'user', content: FINISH_NOTE });
  return {
    system,
    messages,
    maxTokens: mode === 'finish' ? LIMITS.finishMaxTokens : LIMITS.chatMaxTokens,
  };
}
