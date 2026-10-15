/**
 * Studio case config: one owner, one site, one review round.
 * Loaded server-side from src/data/studio/<slug>.json via the registry.
 * Nothing owner-specific is hard-coded in components; it all comes from here.
 */
import { STUDIO_CASES } from '@/data/studio';
import { isObject } from '@/lib/validate';
import type { Gender } from '@/lib/session';

export interface StudioSection {
  id: string;
  title: string;
}

export interface StudioConfig {
  slug: string;
  name: string;
  gender: Gender;
  publicUrl: string;
  ownerUrl: string;
  round: number;
  roundsIncluded: number;
  heroLine: string;
  sections: StudioSection[];
  /** Lionel's number for the thank-you link. Empty in git; env LIONEL_WHATSAPP fills it at runtime. */
  lionelWhatsapp: string;
}

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const SECTION_ID_RE = /^[a-z][a-z0-9_-]{0,29}$/;

function isHttpsUrl(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 300) return false;
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
}

function isSmallInt(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}

/** Validates a raw JSON object. Returns null on any missing or malformed field. */
export function parseStudioConfig(raw: unknown): StudioConfig | null {
  if (!isObject(raw)) return null;
  const { slug, name, gender, publicUrl, ownerUrl, round, roundsIncluded, heroLine, sections, lionelWhatsapp } = raw;
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return null;
  if (typeof name !== 'string' || !name.trim() || name.length > 40) return null;
  if (gender !== 'f' && gender !== 'm') return null;
  if (!isHttpsUrl(publicUrl) || !isHttpsUrl(ownerUrl)) return null;
  if (!isSmallInt(round, 1, 20) || !isSmallInt(roundsIncluded, 1, 20)) return null;
  if (typeof heroLine !== 'string' || !heroLine.trim() || heroLine.length > 300) return null;
  if (!Array.isArray(sections) || sections.length < 1 || sections.length > 12) return null;
  const parsedSections: StudioSection[] = [];
  const seen = new Set<string>();
  for (const s of sections) {
    if (!isObject(s) || typeof s.id !== 'string' || typeof s.title !== 'string') return null;
    if (!SECTION_ID_RE.test(s.id) || seen.has(s.id) || !s.title.trim() || s.title.length > 40) return null;
    seen.add(s.id);
    parsedSections.push({ id: s.id, title: s.title.trim() });
  }
  const wa = lionelWhatsapp === undefined ? '' : lionelWhatsapp;
  if (typeof wa !== 'string' || wa.length > 20) return null;
  return {
    slug,
    name: name.trim(),
    gender,
    publicUrl,
    ownerUrl,
    round,
    roundsIncluded,
    heroLine: heroLine.trim(),
    sections: parsedSections,
    lionelWhatsapp: wa,
  };
}

/** The config for one slug, or null when the slug is unknown or its file is malformed. */
export function getStudioConfig(slug: unknown, cases: Record<string, unknown> = STUDIO_CASES): StudioConfig | null {
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return null;
  if (!Object.prototype.hasOwnProperty.call(cases, slug)) return null;
  const parsed = parseStudioConfig(cases[slug]);
  // The file name is the slug; a file whose own slug differs is a mistake.
  if (!parsed || parsed.slug !== slug) return null;
  return parsed;
}

/** What the browser needs: the config, with Lionel's number filled from the environment when the file leaves it empty. */
export function publicStudioConfig(config: StudioConfig, env: NodeJS.ProcessEnv = process.env): StudioConfig {
  const fromEnv = (env.LIONEL_WHATSAPP ?? '').replace(/\D/g, '');
  return { ...config, lionelWhatsapp: config.lionelWhatsapp || fromEnv };
}
