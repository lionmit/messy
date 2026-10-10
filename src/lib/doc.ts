/**
 * The interview document: parsing, normalising and the Sheet payload.
 *
 * Bug fixed here: the old save route counted `doc.services`, but the model
 * often named that list `offerings`, so services_count was always 0 and the
 * result page hid the section. normalizeDocument() accepts either name (and
 * the old ServiceCard shape) and always returns `services`.
 */
import { cleanForDisplay, stripForeignScript } from './sanitize';
import type { Gender, TranscriptMessage } from './session';

export interface ServiceItem {
  name: string;
  description: string;
  audience: string;
  format: string;
  tense: 'now' | 'wish' | '';
}

export interface InterviewDocument {
  schema_version: 2;
  name: string;
  gender: Gender;
  before_sentence: string;
  positioning_statement: string;
  through_line: string;
  audience: { ideal: string; not_for: string };
  services: ServiceItem[];
  does_not_do: string[];
  their_words: string[];
  room: { description: string; color: string };
  contact_cta: string;
  links: string[];
}

const MAX_FIELD = 1500;
const MAX_LIST = 20;

function str(v: unknown): string {
  if (typeof v !== 'string') return '';
  return stripForeignScript(cleanForDisplay(v)).slice(0, MAX_FIELD);
}

function list(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(str).filter(Boolean).slice(0, MAX_LIST);
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function service(v: unknown): ServiceItem | null {
  if (typeof v === 'string') {
    const name = str(v);
    return name ? { name, description: '', audience: '', format: '', tense: '' } : null;
  }
  const o = obj(v);
  const item: ServiceItem = {
    name: str(o.name ?? o.title),
    description: str(o.description),
    audience: str(o.audience ?? o.for),
    format: str(o.format),
    tense: o.tense === 'now' || o.tense === 'wish' ? o.tense : '',
  };
  return item.name || item.description ? item : null;
}

export function normalizeDocument(raw: unknown, person: { name: string; gender: Gender }): InterviewDocument {
  const o = obj(raw);
  const rawServices = Array.isArray(o.services) && o.services.length > 0 ? o.services : o.offerings;
  const audience = obj(o.audience);
  const room = obj(o.room);
  const assets = obj(o.assets);
  return {
    schema_version: 2,
    name: person.name,
    gender: person.gender,
    before_sentence: str(o.before_sentence),
    positioning_statement: str(o.positioning_statement),
    through_line: str(o.through_line),
    audience: { ideal: str(audience.ideal), not_for: str(audience.not_for) },
    services: (Array.isArray(rawServices) ? rawServices : [])
      .map(service)
      .filter((s): s is ServiceItem => s !== null)
      .slice(0, MAX_LIST),
    does_not_do: list(o.does_not_do),
    their_words: list(o.their_words),
    room: { description: str(room.description), color: str(room.color ?? room.colour) },
    contact_cta: str(o.contact_cta ?? assets.contact_cta),
    links: list(o.links ?? assets.links),
  };
}

/** Pulls the JSON out of <identity>...</identity>. Null when missing or broken. */
export function extractDocumentJson(output: string): unknown | null {
  const m = output.match(/<identity>([\s\S]*?)<\/identity>/);
  if (!m) return null;
  const body = m[1].trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/**
 * Payload for the Make webhook (scenario S14 -> Google Sheet). The first eight
 * fields keep the columns S14 already maps. The rest are new and are ignored by
 * Make until Lionel approves mapping them.
 */
export function buildInterviewPayload(input: {
  document: InterviewDocument;
  transcript: TranscriptMessage[];
  email: string | null;
  expiresAt: string;
  now?: Date;
}) {
  const { document: doc, transcript } = input;
  return {
    timestamp: (input.now ?? new Date()).toISOString(),
    name: doc.name || 'Unknown',
    positioning: doc.positioning_statement,
    through_line: doc.through_line,
    services_count: doc.services.length,
    message_count: transcript.length,
    identity_document_json: JSON.stringify(doc),
    conversation: transcript.map((m) => `[${m.role}] ${m.content}`).join('\n---\n'),
    gender: doc.gender,
    email: input.email ?? '',
    expires_at: input.expiresAt,
    schema_version: 2,
    distress: false,
  };
}
