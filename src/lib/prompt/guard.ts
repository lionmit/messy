/**
 * Server-side check that a reply doesn't leak the system prompt.
 * The prompt already forbids it; this catches the model failing anyway.
 *
 * It flags the canary marker, or two or more 6-word runs copied from the
 * prompt's English instructions. A translated paraphrase can slip past this
 * check; the prompt rule is the first line of defence for that case.
 */
import { PROMPT_CANARY, STATIC_SYSTEM_PROMPT } from './system';

const N = 6;

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function shingles(text: string): Set<string> {
  const w = words(text);
  const out = new Set<string>();
  for (let i = 0; i + N <= w.length; i++) {
    const s = w.slice(i, i + N).join(' ');
    // Hebrew runs are skipped: the bot is meant to say some Hebrew phrases from the prompt.
    if (!/[֐-׿]/.test(s)) out.add(s);
  }
  return out;
}

const PROMPT_SHINGLES = shingles(STATIC_SYSTEM_PROMPT);

export function leaksSystemPrompt(output: string): boolean {
  if (output.includes(PROMPT_CANARY) || /<\s*person\s*>/i.test(output)) return true;
  let hits = 0;
  for (const s of shingles(output)) {
    if (PROMPT_SHINGLES.has(s) && ++hits >= 2) return true;
  }
  return false;
}
