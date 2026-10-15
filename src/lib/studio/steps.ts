/**
 * The review conversation as data: the fixed sequence of steps, the state the
 * owner builds up, and the validation of what the model returns. Pure
 * functions, shared by the server routes, the browser and the tests.
 */
import { cleanForDisplay, neutralizeUserText, stripControlChars } from '@/lib/sanitize';
import { isObject } from '@/lib/validate';
import type { StudioConfig } from './config';

export const STUDIO_LIMITS = {
  maxUserChars: 2000,
  maxAssistantChars: 3000,
  /** Messages the browser may send back with one chat request. */
  maxMessages: 80,
  /** Messages in a submitted transcript. */
  maxTranscript: 160,
  maxChips: 6,
  maxChipChars: 90,
  maxEdits: 30,
  maxEditChars: 600,
  maxComments: 40,
  maxCommentChars: 1000,
  maxLineChars: 200,
  maxWaTextChars: 300,
  maxTokens: 900,
} as const;

export const STEP_COUNT = 7;

export interface StudioStep {
  step: number;
  id: string;
  title: string;
  /** What the gauge says under the bar. */
  gauge: string;
}

export const STUDIO_STEPS: readonly StudioStep[] = [
  { step: 1, id: 'hero', title: 'הפתיחה', gauge: 'המשפט שפותח את האתר' },
  { step: 2, id: 'lines', title: 'המשפטים', gauge: 'משפטים שמרגישים לא שלך' },
  { step: 3, id: 'whatsapp', title: 'הוואטסאפ', gauge: 'המספר וההודעה שמגיעה אליו' },
  { step: 4, id: 'lines-under-button', title: 'שתי שורות מתחת לכפתור', gauge: 'זמן תגובה ושיחה ראשונה' },
  { step: 5, id: 'photo', title: 'התמונה', gauge: 'תמונת פורטרט' },
  { step: 6, id: 'more', title: 'עוד משהו?', gauge: 'הערות חופשיות, מקטע מקטע' },
  { step: 7, id: 'publish', title: 'להעלות?', gauge: 'סיום הסבב' },
];

export const CHIPS = {
  /** Available at every step. Handled by the browser: sets goLive and submits. */
  goLive: 'זה טוב, אפשר להעלות',
  step1: ['כן, זה אני', 'לא בדיוק, אני אנסח', 'תציע לי ניסוח אחר'],
  waTest: 'לשלוח לעצמי הודעת בדיקה',
  waEdit: 'לשנות את הנוסח',
  waOk: 'הנוסח טוב, ממשיכים',
  step7: ['כן, להעלות', 'עוד לא, קודם הסבב הזה'],
  /** Handled by the browser: posts the round. */
  submit: 'לשלוח את הסבב',
} as const;

/** Optional picks the model may offer in step 6 only. Names only; no picker widgets. */
export const PALETTE_OPTIONS = ['חול, מרווה וטרקוטה', 'אדמה חמה וחימר', 'פשתן ומים עמוקים'] as const;
export const FONT_OPTIONS = ['Assistant', 'Heebo', 'David Libre'] as const;

export interface StudioEdit {
  section: string;
  from: string;
  to: string;
}

export interface StudioComment {
  section: string;
  comment: string;
}

export interface StudioState {
  step: number;
  edits: StudioEdit[];
  comments: StudioComment[];
  /** Normalized digits, international form without "+": 9725XXXXXXXX. */
  whatsapp: string | null;
  waText: string | null;
  reply: string | null;
  first: string | null;
  photoSent: boolean | null;
  goLive: boolean | null;
  palette: string | null;
  font: string | null;
}

export function initialState(): StudioState {
  return {
    step: 1,
    edits: [],
    comments: [],
    whatsapp: null,
    waText: null,
    reply: null,
    first: null,
    photoSent: null,
    goLive: null,
    palette: null,
    font: null,
  };
}

export const DEFAULT_REPLY_LINE = 'בדרך כלל אני עונה תוך יום';
export const DEFAULT_FIRST_LINE = 'שיחת היכרות של 15-20 דקות, בלי עלות';

export function defaultWaText(name: string): string {
  return `היי ${name}, הגעתי מהאתר שלך ואשמח לשיחת היכרות קצרה.`;
}

// ---------------------------------------------------------------- phone

/**
 * Israeli mobile numbers only: 05X-XXXXXXX (with or without separators) or
 * +972 5X XXXXXXX / 972… Returns the digits WhatsApp wants (9725XXXXXXXX) or null.
 */
export function normalizeIsraeliPhone(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 40) return null;
  const digits = input.replace(/[^\d+]/g, '');
  let m = /^(?:\+?972|0)(5\d{8})$/.exec(digits);
  if (!m) {
    // "+972-05..." (a leading zero kept after the country code) is a common slip.
    m = /^\+?9720(5\d{8})$/.exec(digits);
  }
  return m ? `972${m[1]}` : null;
}

/** Finds the first phone-shaped run in free text and normalizes it. */
export function findIsraeliPhone(text: string): string | null {
  const runs = text.match(/\+?[\d][\d\s().-]{7,20}\d/g) ?? [];
  for (const run of runs) {
    const n = normalizeIsraeliPhone(run);
    if (n) return n;
  }
  return null;
}

/** Local display form: 05X-XXXXXXX. */
export function displayIsraeliPhone(digits: string): string {
  const m = /^972(5\d)(\d{7})$/.exec(digits);
  return m ? `0${m[1]}-${m[2]}` : digits;
}

export function buildWaLink(digits: string, text: string): string {
  const clean = digits.replace(/\D/g, '');
  const q = text.trim() ? `?text=${encodeURIComponent(text.trim())}` : '';
  return `https://wa.me/${clean}${q}`;
}

// ---------------------------------------------------------------- state

function cleanLine(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = cleanForDisplay(neutralizeUserText(v)).replace(/\s+/g, ' ').trim();
  if (!s || s.length > max) return null;
  return s;
}

function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = cleanForDisplay(neutralizeUserText(v));
  if (!s || s.length > max) return null;
  return s;
}

export type StateProblem = { ok: false; field: string };

/**
 * Validates a state object as the browser sends it back. Unknown fields are
 * dropped. Bad entries in lists are dropped; a bad scalar fails the whole state
 * (a wrong phone must never reach the payload).
 */
export function validateStudioState(
  v: unknown,
  sectionIds: readonly string[]
): { ok: true; value: StudioState } | StateProblem {
  const base = initialState();
  if (v === undefined || v === null) return { ok: true, value: base };
  if (!isObject(v)) return { ok: false, field: 'state' };
  const out = base;
  if (v.step !== undefined) {
    if (typeof v.step !== 'number' || !Number.isInteger(v.step) || v.step < 1 || v.step > STEP_COUNT) {
      return { ok: false, field: 'state.step' };
    }
    out.step = v.step;
  }
  const sections = new Set(sectionIds);
  if (v.edits !== undefined) {
    if (!Array.isArray(v.edits) || v.edits.length > STUDIO_LIMITS.maxEdits) return { ok: false, field: 'state.edits' };
    for (const e of v.edits) {
      const edit = cleanEdit(e, sections);
      if (edit) out.edits.push(edit);
    }
  }
  if (v.comments !== undefined) {
    if (!Array.isArray(v.comments) || v.comments.length > STUDIO_LIMITS.maxComments) {
      return { ok: false, field: 'state.comments' };
    }
    for (const c of v.comments) {
      const comment = cleanComment(c, sections);
      if (comment) out.comments.push(comment);
    }
  }
  if (v.whatsapp !== undefined && v.whatsapp !== null) {
    const n = normalizeIsraeliPhone(v.whatsapp);
    if (!n) return { ok: false, field: 'state.whatsapp' };
    out.whatsapp = n;
  }
  for (const [key, max] of [
    ['waText', STUDIO_LIMITS.maxWaTextChars],
    ['reply', STUDIO_LIMITS.maxLineChars],
    ['first', STUDIO_LIMITS.maxLineChars],
  ] as const) {
    const raw = v[key];
    if (raw === undefined || raw === null) continue;
    const s = cleanLine(raw, max);
    if (!s) return { ok: false, field: `state.${key}` };
    out[key] = s;
  }
  for (const key of ['photoSent', 'goLive'] as const) {
    const raw = v[key];
    if (raw === undefined || raw === null) continue;
    if (typeof raw !== 'boolean') return { ok: false, field: `state.${key}` };
    out[key] = raw;
  }
  if (v.palette !== undefined && v.palette !== null) {
    if (!(PALETTE_OPTIONS as readonly string[]).includes(v.palette as string)) return { ok: false, field: 'state.palette' };
    out.palette = v.palette as string;
  }
  if (v.font !== undefined && v.font !== null) {
    if (!(FONT_OPTIONS as readonly string[]).includes(v.font as string)) return { ok: false, field: 'state.font' };
    out.font = v.font as string;
  }
  return { ok: true, value: out };
}

function cleanEdit(e: unknown, sections: Set<string>): StudioEdit | null {
  if (!isObject(e) || typeof e.section !== 'string' || !sections.has(e.section)) return null;
  const from = cleanText(e.from ?? '', STUDIO_LIMITS.maxEditChars) ?? '';
  const to = cleanText(e.to, STUDIO_LIMITS.maxEditChars);
  if (!to) return null;
  return { section: e.section, from, to };
}

function cleanComment(c: unknown, sections: Set<string>): StudioComment | null {
  if (!isObject(c) || typeof c.section !== 'string') return null;
  if (!sections.has(c.section) && c.section !== 'general') return null;
  const comment = cleanText(c.comment, STUDIO_LIMITS.maxCommentChars);
  if (!comment) return null;
  return { section: c.section, comment };
}

// ---------------------------------------------------------------- model reply

export interface ParsedReply {
  reply: string;
  chips: string[];
  step: number;
  /** The patch, already validated and merged into a copy of the state. */
  state: StudioState;
  /** Step 7 answered: the browser may submit. */
  done: boolean;
}

/** Pulls one JSON object out of model text (raw, or inside a code fence, or with prose around it). */
export function extractJsonObject(raw: string): Record<string, unknown> | null {
  const text = raw.trim();
  const candidates: string[] = [];
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  if (fenced) candidates.push(fenced[1]);
  candidates.push(text);
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) candidates.push(text.slice(first, last + 1));
  for (const c of candidates) {
    try {
      const v = JSON.parse(c);
      if (isObject(v)) return v;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

function cleanChip(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = cleanForDisplay(stripControlChars(v)).replace(/\s+/g, ' ').trim();
  if (!s || s.length > STUDIO_LIMITS.maxChipChars) return null;
  return s;
}

/**
 * Validates the model's JSON against the fixed sequence:
 * - the step may stay or move forward by one, never jump or go back;
 * - the patch may only touch known fields, lists append, scalars replace;
 * - the chip "זה טוב, אפשר להעלות" is always there;
 * - `done` counts only at step 7.
 * Returns null when there is no usable reply text.
 */
export function parseStudioReply(
  raw: string,
  current: StudioState,
  config: Pick<StudioConfig, 'sections'>
): ParsedReply | null {
  const obj = extractJsonObject(raw);
  if (!obj) return null;
  const reply = typeof obj.reply === 'string' ? cleanForDisplay(obj.reply) : '';
  if (!reply || reply.length > STUDIO_LIMITS.maxAssistantChars) return null;

  let step = current.step;
  if (typeof obj.step === 'number' && Number.isInteger(obj.step)) {
    if (obj.step === current.step + 1 && obj.step <= STEP_COUNT) step = obj.step;
  }

  const sectionIds = config.sections.map((s) => s.id);
  const state = applyPatch(current, obj.statePatch, sectionIds);
  state.step = step;

  const chips: string[] = [];
  if (Array.isArray(obj.chips)) {
    for (const c of obj.chips) {
      const chip = cleanChip(c);
      if (chip && !chips.includes(chip) && chips.length < STUDIO_LIMITS.maxChips) chips.push(chip);
    }
  }
  if (!chips.includes(CHIPS.goLive)) chips.push(CHIPS.goLive);

  const done = step === STEP_COUNT && obj.done === true;
  return { reply, chips, step, state, done };
}

/** Merges a model patch into a copy of the state. Invalid entries are ignored, never fatal. */
export function applyPatch(current: StudioState, patch: unknown, sectionIds: readonly string[]): StudioState {
  const next: StudioState = { ...current, edits: [...current.edits], comments: [...current.comments] };
  if (!isObject(patch)) return next;
  const sections = new Set(sectionIds);
  if (Array.isArray(patch.edits)) {
    for (const e of patch.edits) {
      const edit = cleanEdit(e, sections);
      if (edit && next.edits.length < STUDIO_LIMITS.maxEdits) next.edits.push(edit);
    }
  }
  if (Array.isArray(patch.comments)) {
    for (const c of patch.comments) {
      const comment = cleanComment(c, sections);
      if (comment && next.comments.length < STUDIO_LIMITS.maxComments) next.comments.push(comment);
    }
  }
  if (typeof patch.whatsapp === 'string') {
    const n = normalizeIsraeliPhone(patch.whatsapp);
    if (n) next.whatsapp = n;
  }
  const waText = cleanLine(patch.waText, STUDIO_LIMITS.maxWaTextChars);
  if (waText) next.waText = waText;
  const reply = cleanLine(patch.reply, STUDIO_LIMITS.maxLineChars);
  if (reply) next.reply = reply;
  const first = cleanLine(patch.first, STUDIO_LIMITS.maxLineChars);
  if (first) next.first = first;
  if (typeof patch.photoSent === 'boolean') next.photoSent = patch.photoSent;
  if (typeof patch.goLive === 'boolean') next.goLive = patch.goLive;
  if (typeof patch.palette === 'string' && (PALETTE_OPTIONS as readonly string[]).includes(patch.palette)) {
    next.palette = patch.palette;
  }
  if (typeof patch.font === 'string' && (FONT_OPTIONS as readonly string[]).includes(patch.font)) {
    next.font = patch.font;
  }
  return next;
}

// ---------------------------------------------------------------- fixed turns

/** The first turn is fixed, built from the config; no model call. */
export function openingMessage(config: Pick<StudioConfig, 'name' | 'heroLine'>): { text: string; chips: string[] } {
  return {
    text:
      `היי ${config.name}. נעבור על האתר יחד, החלטה אחת בכל פעם, ובכל שלב אפשר להגיד שזה טוב ולהעלות. ` +
      `נתחיל מהפתיחה. המשפט שפותח את האתר הוא: "${config.heroLine}" זה נשמע כמוך?`,
    chips: [...CHIPS.step1, CHIPS.goLive],
  };
}

/** After a successful submit. The verbs read the same for both forms of address. */
export function thankYouMessage(goLive: boolean): string {
  const live = goLive ? ' גם הבקשה להעלות את האתר רשומה.' : '';
  return (
    `תודה, הסבב נשלח. ליאונל מקבל עכשיו את כל מה שכתבת, והגרסה המעודכנת תגיע תוך יומיים.${live} ` +
    'אם משהו דחוף, אפשר לכתוב לו בוואטסאפ.'
  );
}

export function stepTitle(step: number): string {
  return STUDIO_STEPS[Math.min(Math.max(step, 1), STEP_COUNT) - 1].title;
}
