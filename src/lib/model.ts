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
  mode?: 'chat' | 'finish';
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
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new ModelNotConfiguredError('ANTHROPIC_API_KEY missing');
  if (!client) client = new Anthropic({ apiKey, maxRetries: 2, timeout: 55_000 });
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
    provider: 'anthropic',
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

function extractMessageText(content: string | Anthropic.ContentBlockParam[]): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === 'string') return block;
        if ('text' in block && typeof block.text === 'string') return block.text;
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

export const callGemini: ModelCaller = async (req) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new ModelNotConfiguredError('GEMINI_API_KEY missing');

  const candidateModels = [
    process.env.GEMINI_MODEL?.trim(),
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
  ].filter(Boolean) as string[];

  const systemInstruction = req.system
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n\n');

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const m of req.messages) {
    const role: 'user' | 'model' = m.role === 'assistant' ? 'model' : 'user';
    const text = extractMessageText(m.content);
    if (!text) continue;
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts.push({ text });
    } else {
      contents.push({ role, parts: [{ text }] });
    }
  }

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: req.maxTokens,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  if (systemInstruction) {
    payload.system_instruction = { parts: [{ text: systemInstruction }] };
  }

  let lastErrText = '';
  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45_000),
      });

      if (!res.ok) {
        lastErrText = await res.text();
        // If model unavailable / temporary spike / deprecated, try next model
        if (res.status === 404 || res.status === 503 || res.status === 429) {
          continue;
        }
        throw new Error(`Gemini API error (${res.status}): ${lastErrText}`);
      }

      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
        };
      };

      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      const stopReason = data.candidates?.[0]?.finishReason ?? null;

      logEvent('model.usage', {
        provider: 'gemini',
        model,
        input: data.usageMetadata?.promptTokenCount ?? 0,
        output: data.usageMetadata?.candidatesTokenCount ?? 0,
        cache_read: 0,
        cache_write: 0,
        stop: stopReason ?? 'none',
      });

      return { text, stopReason };
    } catch (err: unknown) {
      if (err instanceof Error && err.message.startsWith('Gemini API error')) {
        throw err;
      }
      lastErrText = err instanceof Error ? err.message : String(err);
      // Timeout or network glitch: try next model in loop
    }
  }

  throw new Error(`Gemini API all candidate models failed. Last error: ${lastErrText}`);
};

export function getActiveProvider(mode?: 'chat' | 'finish'): 'anthropic' | 'gemini' {
  if (mode === 'chat' && process.env.MODEL_PROVIDER_CHAT) {
    const explicit = process.env.MODEL_PROVIDER_CHAT.trim().toLowerCase();
    if (explicit === 'anthropic' || explicit === 'gemini') return explicit;
  }
  if (mode === 'finish' && process.env.MODEL_PROVIDER_FINISH) {
    const explicit = process.env.MODEL_PROVIDER_FINISH.trim().toLowerCase();
    if (explicit === 'anthropic' || explicit === 'gemini') return explicit;
  }
  const explicit = process.env.MODEL_PROVIDER?.trim().toLowerCase();
  if (explicit === 'anthropic' || explicit === 'gemini') return explicit;

  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());

  // Smart Hybrid Routing:
  // When both keys exist:
  // - Finish (identity document synthesis) uses Claude Sonnet (Anthropic) for supreme creative quality / "Maayan" level
  // - Chat (interview dialogue turns) uses Gemini Flash for fast (~1.5s), free conversational turns
  if (hasAnthropic && hasGemini) {
    return mode === 'finish' ? 'anthropic' : 'gemini';
  }
  if (hasAnthropic) return 'anthropic';
  if (hasGemini) return 'gemini';
  return 'gemini';
}

export const callModel: ModelCaller = async (req) => {
  const provider = getActiveProvider(req.mode);
  if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY?.trim()) {
      if (process.env.ANTHROPIC_API_KEY?.trim()) return callAnthropic(req);
      throw new ModelNotConfiguredError('GEMINI_API_KEY missing (or set ANTHROPIC_API_KEY)');
    }
    return callGemini(req);
  } else {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      if (process.env.GEMINI_API_KEY?.trim()) return callGemini(req);
      throw new ModelNotConfiguredError('ANTHROPIC_API_KEY missing (or set GEMINI_API_KEY)');
    }
    return callAnthropic(req);
  }
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
    mode,
  };
}
