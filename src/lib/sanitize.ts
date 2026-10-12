/**
 * Output and input hygiene. Pure functions, shared by server and browser.
 */

/** Removes HTML: script/style blocks with their content, comments, then every tag. */
export function stripHtml(input: string): string {
  return input
    .replace(/<\s*(script|style|iframe|object|embed|template)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    // An opener with no closing tag: drop it and everything after it.
    .replace(/<\s*(script|style|iframe|object|embed|template)\b[\s\S]*$/gi, '')
    .replace(/<!--[\s\S]*?(-->|$)/g, '')
    .replace(/<\/?[a-z!][^<>]*>/gi, '');
}

/** Control characters except tab and newline. Keeps RLM/LRM (U+200E/U+200F), which Hebrew text uses. */
export function stripControlChars(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g, '');
}

/** The bot never sends emoji (D14 disclosure protocol). */
export function stripEmoji(input: string): string {
  return input.replace(/\p{Extended_Pictographic}️?/gu, '').replace(/[ \t]{2,}/g, ' ');
}

/**
 * Letters from scripts that never belong in a Hebrew/English interview.
 * The first real interview had Arabic ZAIN (U+0632) mixed into a Hebrew word.
 * U+FFFD (replacement char) would point to a decoding bug instead.
 */
const FOREIGN_SCRIPT =
  /[Ͱ-ϿЀ-ԯ؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿ऀ-෿฀-๿぀-ヿ㐀-䶿一-鿿가-힯�]/u;
const FOREIGN_SCRIPT_G = new RegExp(FOREIGN_SCRIPT.source, 'gu');

export function hasScriptGlitch(text: string): boolean {
  return FOREIGN_SCRIPT.test(text);
}

export function stripForeignScript(text: string): string {
  return text.replace(FOREIGN_SCRIPT_G, '');
}

/**
 * The bot's own words, without what it quotes back from the person. A quoted
 * line keeps the person's words as written (a client's "אתה", their own "מרגש"),
 * so the quality checks below must not count it: in the P1-C1 test run of
 * 2026-10-12 a quoted "אתה" sent two good turns back to the model.
 */
export function withoutQuotes(text: string): string {
  return text.replace(/"[^"\n]*"|“[^”\n]*”|„[^“”\n]*[“”]|«[^»\n]*»/g, ' ');
}

/** A masculine "you" sent to a person who chose feminine forms. */
export function hasGenderSlip(text: string, gender: 'f' | 'm'): boolean {
  if (gender !== 'f') return false;
  return /(^|[\s"'(,.:;!?\-])אתה($|[\s"'),.:;!?\-])/u.test(withoutQuotes(text));
}

/** Praise ban list (D14 item 4). The tool doesn't gush. */
export const PRAISE_BANNED = [
  'מדהים',
  'מדהימה',
  'וואו',
  'איזה יופי',
  'מרגש',
  'מרגשת',
  'מעורר השראה',
  'מעוררת השראה',
  'כל הכבוד',
  'נהדר',
  'נפלא',
  'מקסים',
  'מקסימה',
  'amazing',
  'wonderful',
  'inspiring',
];

export function hasPraise(text: string): boolean {
  const lower = withoutQuotes(text).toLowerCase();
  return PRAISE_BANNED.some((w) => lower.includes(w));
}

/**
 * Text the person writes can't pose as a server note or a control tag.
 * We drop only these exact markers; everything else they wrote stays as written.
 */
export function neutralizeUserText(input: string): string {
  return stripControlChars(input)
    .replace(/<\s*\/?\s*(server_note|person|distress|ready|identity|system)[^<>]*>/gi, '')
    .trim();
}

/** Final pass for anything rendered as text to a person. */
export function cleanForDisplay(text: string): string {
  return stripEmoji(stripControlChars(stripHtml(text))).replace(/\n{3,}/g, '\n\n').trim();
}
