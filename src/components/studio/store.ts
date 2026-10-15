/**
 * The review session in the browser: conversation + state, kept in
 * localStorage under messy_studio_<slug>. Exposed as an external store so the
 * page reads it with useSyncExternalStore (no setState inside effects, and a
 * clean server snapshot for hydration).
 */
import type { WaPreview } from '@/lib/studio/chat';
import { STEP_COUNT, type StudioState, initialState } from '@/lib/studio/steps';
import { isObject } from '@/lib/validate';

export interface ChatMsg {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  chips?: string[];
  waPreview?: WaPreview | null;
  /** 'thanks': the closing turn after a successful submit. */
  kind?: 'thanks';
}

export interface Persisted {
  v: 1;
  slug: string;
  round: number;
  messages: ChatMsg[];
  state: StudioState;
  submitted: { at: string; goLive: boolean } | null;
}

export interface StudioStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => Persisted | null;
  getServerSnapshot: () => null;
  set: (next: Persisted) => void;
  clear: () => void;
  /** False when localStorage refused (private mode, quota): the session lives in memory only. */
  isPersistent: () => boolean;
}

export function storageKey(slug: string): string {
  return `messy_studio_${slug}`;
}

/** Light validation of what came back from storage. Anything odd means "start fresh". */
export function parsePersisted(raw: string | null): Persisted | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!isObject(v) || v.v !== 1 || typeof v.slug !== 'string' || typeof v.round !== 'number') return null;
    if (!Array.isArray(v.messages) || !isObject(v.state)) return null;
    const messages: ChatMsg[] = [];
    for (const m of v.messages) {
      if (!isObject(m) || typeof m.id !== 'string' || typeof m.text !== 'string') return null;
      if (m.role !== 'assistant' && m.role !== 'user') return null;
      const msg: ChatMsg = { id: m.id, role: m.role, text: m.text };
      if (Array.isArray(m.chips)) msg.chips = m.chips.filter((c): c is string => typeof c === 'string');
      if (isObject(m.waPreview) && typeof m.waPreview.link === 'string' && typeof m.waPreview.text === 'string') {
        msg.waPreview = { number: String(m.waPreview.number ?? ''), text: m.waPreview.text, link: m.waPreview.link };
      }
      if (m.kind === 'thanks') msg.kind = 'thanks';
      messages.push(msg);
    }
    const s = v.state;
    const state: StudioState = {
      ...initialState(),
      step: typeof s.step === 'number' && s.step >= 1 && s.step <= STEP_COUNT ? s.step : 1,
      edits: Array.isArray(s.edits) ? (s.edits as StudioState['edits']) : [],
      comments: Array.isArray(s.comments) ? (s.comments as StudioState['comments']) : [],
      whatsapp: typeof s.whatsapp === 'string' ? s.whatsapp : null,
      waText: typeof s.waText === 'string' ? s.waText : null,
      reply: typeof s.reply === 'string' ? s.reply : null,
      first: typeof s.first === 'string' ? s.first : null,
      photoSent: typeof s.photoSent === 'boolean' ? s.photoSent : null,
      goLive: typeof s.goLive === 'boolean' ? s.goLive : null,
      palette: typeof s.palette === 'string' ? s.palette : null,
      font: typeof s.font === 'string' ? s.font : null,
    };
    const sub = v.submitted;
    const submitted =
      isObject(sub) && typeof sub.at === 'string' ? { at: sub.at, goLive: sub.goLive === true } : null;
    return { v: 1, slug: v.slug, round: v.round, messages, state, submitted };
  } catch {
    return null;
  }
}

const stores = new Map<string, StudioStore>();

/** One store per key for the life of the page. */
export function getStudioStore(key: string): StudioStore {
  const existing = stores.get(key);
  if (existing) return existing;
  const store = createStudioStore(key);
  stores.set(key, store);
  return store;
}

export function createStudioStore(key: string): StudioStore {
  const listeners = new Set<() => void>();
  let memory: string | null = null;
  let persistent = true;
  let cachedRaw: string | null | undefined;
  let cachedValue: Persisted | null = null;

  const read = (): string | null => {
    try {
      return window.localStorage.getItem(key) ?? memory;
    } catch {
      persistent = false;
      return memory;
    }
  };
  const write = (raw: string | null) => {
    memory = raw;
    try {
      if (raw === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, raw);
      persistent = true;
    } catch {
      persistent = false;
    }
    listeners.forEach((l) => l());
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) listener();
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
    getSnapshot() {
      const raw = read();
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedValue = parsePersisted(raw);
      }
      return cachedValue;
    },
    getServerSnapshot: () => null,
    set: (next) => write(JSON.stringify(next)),
    clear: () => write(null),
    isPersistent: () => persistent,
  };
}
