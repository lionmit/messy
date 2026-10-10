/**
 * Server-side validation of every request body. Hand-written to avoid a new
 * dependency. Unknown fields are ignored; only the fields read here are used.
 */
import { LIMITS } from './config';
import { neutralizeUserText, stripControlChars } from './sanitize';
import type { Gender, TranscriptMessage } from './session';

export type Invalid = { ok: false; field: string };
export type Valid<T> = { ok: true; value: T };

export function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} '’׳״".-]*$/u;

export function validateName(v: unknown): Valid<string> | Invalid {
  if (typeof v !== 'string') return { ok: false, field: 'name' };
  const name = stripControlChars(v).replace(/\s+/g, ' ').trim();
  if (name.length < 1 || name.length > LIMITS.maxNameChars || !NAME_RE.test(name)) {
    return { ok: false, field: 'name' };
  }
  return { ok: true, value: name };
}

export function validateGender(v: unknown): Valid<Gender> | Invalid {
  return v === 'f' || v === 'm' ? { ok: true, value: v } : { ok: false, field: 'gender' };
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:".]+(\.[^\s@<>()[\]\\,;:".]+)+$/;

/** Optional email: missing or empty means "no preview". */
export function validateOptionalEmail(v: unknown): Valid<string | null> | Invalid {
  if (v === undefined || v === null || v === '') return { ok: true, value: null };
  if (typeof v !== 'string') return { ok: false, field: 'email' };
  const email = v.trim();
  if (email.length > LIMITS.maxEmailChars || !EMAIL_RE.test(email)) return { ok: false, field: 'email' };
  return { ok: true, value: email };
}

/**
 * The conversation as the browser sends it back: starts with the bot's opening,
 * alternates, and ends with a user message (chat) or a bot message (finish).
 * The last user message is cleaned of control tags before anything else sees it.
 */
export function validateHistory(
  v: unknown,
  endsWith: 'user' | 'assistant'
): Valid<TranscriptMessage[]> | (Invalid & { reason?: 'too_long' | 'turn_cap' }) {
  if (!Array.isArray(v) || v.length < 2 || v.length > LIMITS.maxUserTurns * 2 + 1) {
    const turnCap = Array.isArray(v) && v.length > LIMITS.maxUserTurns * 2 + 1;
    return { ok: false, field: 'messages', reason: turnCap ? 'turn_cap' : undefined };
  }
  const out: TranscriptMessage[] = [];
  let userTurns = 0;
  for (let i = 0; i < v.length; i++) {
    const m = v[i];
    const expected: TranscriptMessage['role'] = i % 2 === 0 ? 'assistant' : 'user';
    if (!isObject(m) || m.role !== expected || typeof m.content !== 'string') {
      return { ok: false, field: 'messages' };
    }
    if (expected === 'user') {
      userTurns++;
      if (m.content.length > LIMITS.maxUserMessageChars) {
        return { ok: false, field: 'messages', reason: 'too_long' };
      }
      const isLast = i === v.length - 1;
      const content = isLast ? neutralizeUserText(m.content) : m.content;
      if (!content.trim()) return { ok: false, field: 'messages' };
      out.push({ role: 'user', content });
    } else {
      if (m.content.length > LIMITS.maxAssistantMessageChars || !m.content.trim()) {
        return { ok: false, field: 'messages' };
      }
      out.push({ role: 'assistant', content: m.content });
    }
  }
  if (out[out.length - 1].role !== endsWith) return { ok: false, field: 'messages' };
  if (userTurns > LIMITS.maxUserTurns) return { ok: false, field: 'messages', reason: 'turn_cap' };
  return { ok: true, value: out };
}
