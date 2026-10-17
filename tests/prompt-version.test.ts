import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { PROMPT_SHA256, PROMPT_VERSION, STATIC_SYSTEM_PROMPT, promptTextForVersion } from '@/lib/prompt/system';
import { LISTENING_MOVES } from '@/lib/prompt/listening-moves';

/**
 * The bot's prompt is frozen in a version (board decision, 2026-10-17). This test is the
 * freeze: it hashes the full prompt text and compares it to the hash stored next to
 * PROMPT_VERSION in src/lib/prompt/system.ts. Editing the prompt (or the listening moves,
 * or the room question) without bumping both fails the suite.
 */
describe('the system prompt is frozen in a version', () => {
  it('PROMPT_VERSION has the date.n shape', () => {
    expect(PROMPT_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
  });

  it('the stored sha256 matches the prompt text', () => {
    const actual = createHash('sha256').update(promptTextForVersion(), 'utf8').digest('hex');
    expect(
      actual,
      `the prompt text changed but PROMPT_VERSION is still ${PROMPT_VERSION}. ` +
        'bump PROMPT_VERSION and the hash together; prompt changes are Lionel\'s decision. ' +
        `(sha256 of the current text: ${actual})`
    ).toBe(PROMPT_SHA256);
  });

  it('the versioned text covers the static prompt, the listening moves and both person blocks', () => {
    const text = promptTextForVersion();
    expect(text).toContain(STATIC_SYSTEM_PROMPT);
    for (const move of LISTENING_MOVES) expect(text).toContain(move);
    expect(text).toContain('form_of_address: feminine (את)');
    expect(text).toContain('form_of_address: masculine (אתה)');
  });
});
