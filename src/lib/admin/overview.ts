/**
 * One read of the store, one JSON for the dashboard.
 *
 * Sources (all under the same private Blob store):
 *   interviews/<id>.json        name, createdAt, expiresAt, whether an email was left
 *                               (document and transcript are read but never projected)
 *   tombstones/<id>.json        the record was deleted
 *   pipeline/_slugs.json        slug -> id
 *   pipeline/<slug>/state.json  steps, mail, urls, comment_inbox, payment
 *   pipeline/_count.json        founding_count, paid, open_locks
 *   pipeline/_digest.md         the runner's digest (may not exist)
 *   pipeline/_commands/*.json   commands this dashboard wrote that the runner has not consumed
 */
import { BLOB_PREFIX, type BlobApi } from '@/lib/storage/blob';
import { isRecordId } from '@/lib/storage/types';
import { parseCommandPathname, type CommandAction } from './commands';
import { PIPELINE, defaultSlug } from './paths';

export const STAGES = [
  'intake',
  'content',
  'illustrate',
  'structure',
  'build',
  'deploy_preview',
  'email_preview',
  'comments',
  'fix',
  'go_live',
] as const;
export type Stage = (typeof STAGES)[number];

const HELD_STATUSES = new Set(['held', 'failed', 'blocked']);
const DIGEST_TAIL_LINES = 40;
const READ_CONCURRENCY = 8;

export interface MailView {
  status: string;
  at: string | null;
}

export interface StructureView {
  round: number;
  passed: string[];
  warned: string[];
  failed: string[];
}

export interface PendingCommand {
  action: CommandAction;
  requestedAt: string;
  file: string;
}

export interface PersonView {
  slug: string;
  id: string | null;
  name: string;
  createdAt: string | null;
  expiresAt: string | null;
  hasEmail: boolean;
  stage: Stage | null;
  stageNote: string;
  held: boolean;
  heldNote: string;
  urls: { preview?: string; owner?: string };
  mail: { preview: MailView | null; reminder: MailView | null; end: MailView | null };
  comments: number;
  paid: boolean;
  structure?: StructureView | null;
  tombstoned: boolean;
  pendingCommands: PendingCommand[];
}

export interface Overview {
  people: PersonView[];
  counts: { interviews: number; held: number; previewsLive: number; mailed: number; paid: number; tombstoned: number };
  founding: { count: number | null; paid: number | null; open_locks: number | null };
  digestTail: string[];
  generatedAt: string;
}

type Json = Record<string, unknown>;

function parseJson(text: string | null): Json | null {
  if (!text) return null;
  try {
    const v = JSON.parse(text) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : null;
  } catch {
    return null;
  }
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const httpsUrl = (v: unknown): string | undefined => (typeof v === 'string' && /^https:\/\//.test(v) ? v : undefined);

async function listAll(api: BlobApi, prefix: string): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await api.list(prefix, cursor);
    out.push(...page.pathnames);
    cursor = page.cursor;
  } while (cursor);
  return out;
}

/** Reads many blobs with a small concurrency cap. Returns pathname -> text (missing ones omitted). */
async function readMany(api: BlobApi, pathnames: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const queue = [...pathnames];
  async function worker() {
    for (let p = queue.shift(); p !== undefined; p = queue.shift()) {
      const text = await api.getText(p);
      if (text !== null) out.set(p, text);
    }
  }
  await Promise.all(Array.from({ length: Math.min(READ_CONCURRENCY, queue.length) }, worker));
  return out;
}

function mailView(m: unknown): MailView | null {
  if (!m || typeof m !== 'object') return null;
  const o = m as Json;
  const status = str(o.status);
  if (!status) return null;
  return { status, at: str(o.sent_at) ?? str(o.due_at) ?? null };
}

interface StageInfo {
  stage: Stage | null;
  stageNote: string;
  held: boolean;
  heldNote: string;
}

function readStages(steps: unknown): StageInfo {
  const info: StageInfo = { stage: null, stageNote: '', held: false, heldNote: '' };
  if (!steps || typeof steps !== 'object') return info;
  const s = steps as Record<string, unknown>;
  for (const name of STAGES) {
    const step = s[name];
    if (!step || typeof step !== 'object') continue;
    const { status, note } = step as Json;
    if (status === 'done') {
      info.stage = name;
      info.stageNote = str(note) ?? '';
    }
    if (typeof status === 'string' && HELD_STATUSES.has(status) && !info.held) {
      info.held = true;
      info.heldNote = str(note) ?? status;
    }
  }
  return info;
}

function emptyPerson(slug: string, id: string | null): PersonView {
  return {
    slug,
    id,
    name: '',
    createdAt: null,
    expiresAt: null,
    hasEmail: false,
    stage: null,
    stageNote: '',
    held: false,
    heldNote: '',
    urls: {},
    mail: { preview: null, reminder: null, end: null },
    comments: 0,
    paid: false,
    structure: null,
    tombstoned: false,
    pendingCommands: [],
  };
}

export async function buildOverview(api: BlobApi, now: Date = new Date()): Promise<Overview> {
  const [interviewPaths, tombstonePaths, pipelinePaths] = await Promise.all([
    listAll(api, BLOB_PREFIX.interviews),
    listAll(api, BLOB_PREFIX.tombstones),
    listAll(api, PIPELINE.prefix),
  ]);

  const statePaths = pipelinePaths.filter((p) => /^pipeline\/[a-z0-9][a-z0-9-]{0,60}\/state\.json$/.test(p));
  const commandPaths = pipelinePaths.filter((p) => p.startsWith(PIPELINE.commands));
  const shared = [PIPELINE.slugs, PIPELINE.count, PIPELINE.digest].filter((p) => pipelinePaths.includes(p));

  const texts = await readMany(api, [...interviewPaths, ...tombstonePaths, ...statePaths, ...shared]);

  // slug <-> id
  const slugToId = new Map<string, string>();
  const idToSlug = new Map<string, string>();
  const slugs = parseJson(texts.get(PIPELINE.slugs) ?? null);
  if (slugs) {
    for (const [slug, id] of Object.entries(slugs)) {
      if (typeof id === 'string' && isRecordId(id)) {
        slugToId.set(slug, id);
        idToSlug.set(id, slug);
      }
    }
  }

  const people = new Map<string, PersonView>(); // keyed by slug
  const personFor = (slug: string, id: string | null): PersonView => {
    let p = people.get(slug);
    if (!p) {
      p = emptyPerson(slug, id);
      people.set(slug, p);
    } else if (!p.id && id) {
      p.id = id;
    }
    return p;
  };
  const slugOf = (id: string) => idToSlug.get(id) ?? defaultSlug(id);

  // interviews
  let interviews = 0;
  for (const path of interviewPaths) {
    const id = path.slice(BLOB_PREFIX.interviews.length).replace(/\.json$/, '');
    if (!isRecordId(id)) continue;
    const rec = parseJson(texts.get(path) ?? null);
    if (!rec) continue;
    interviews++;
    const p = personFor(slugOf(id), id);
    p.name = str(rec.name) ?? '';
    p.createdAt = str(rec.createdAt);
    p.expiresAt = str(rec.expiresAt);
    p.hasEmail = typeof rec.email === 'string' && rec.email.length > 0;
  }

  // pipeline states
  for (const path of statePaths) {
    const slug = path.slice(PIPELINE.prefix.length, -'/state.json'.length);
    const st = parseJson(texts.get(path) ?? null);
    if (!st) continue;
    const p = personFor(slug, slugToId.get(slug) ?? null);
    const stages = readStages(st.steps);
    p.stage = stages.stage;
    p.stageNote = stages.stageNote;
    p.held = stages.held;
    p.heldNote = stages.heldNote;
    const urls = (st.urls && typeof st.urls === 'object' ? st.urls : {}) as Json;
    p.urls = {};
    const preview = httpsUrl(urls.preview);
    const owner = httpsUrl(urls.owner);
    if (preview) p.urls.preview = preview;
    if (owner) p.urls.owner = owner;
    const mail = (st.mail && typeof st.mail === 'object' ? st.mail : {}) as Json;
    p.mail = {
      preview: mailView(mail.preview),
      reminder: mailView(mail.reminder),
      end: mailView(mail.golive ?? mail.end),
    };
    p.comments = Array.isArray(st.comment_inbox) ? st.comment_inbox.length : 0;
    p.paid = !!st.payment && typeof st.payment === 'object';
    if (st.structure && typeof st.structure === 'object') {
      const s = st.structure as Json;
      p.structure = {
        round: typeof s.round === 'number' ? s.round : 1,
        passed: Array.isArray(s.passed) ? s.passed.filter((x): x is string => typeof x === 'string') : [],
        warned: Array.isArray(s.warned) ? s.warned.filter((x): x is string => typeof x === 'string') : [],
        failed: Array.isArray(s.failed) ? s.failed.filter((x): x is string => typeof x === 'string') : [],
      };
    }
    if (!p.createdAt) p.createdAt = str(st.created);
  }

  // tombstones
  for (const path of tombstonePaths) {
    const id = path.slice(BLOB_PREFIX.tombstones.length).replace(/\.json$/, '');
    if (!isRecordId(id)) continue;
    const t = parseJson(texts.get(path) ?? null);
    const p = personFor(slugOf(id), id);
    p.tombstoned = true;
    if (!p.createdAt && t) p.createdAt = str(t.deletedAt);
  }

  // pending commands
  for (const path of commandPaths) {
    const c = parseCommandPathname(path);
    if (!c) continue;
    const p = personFor(c.slug, slugToId.get(c.slug) ?? null);
    p.pendingCommands.push({ action: c.action, requestedAt: c.requestedAt, file: path });
  }

  const list = [...people.values()].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  const counts = {
    interviews,
    held: list.filter((p) => p.held && !p.tombstoned).length,
    previewsLive: list.filter((p) => !!p.urls.preview && !p.tombstoned).length,
    mailed: list.filter((p) => p.mail.preview?.status === 'sent').length,
    paid: list.filter((p) => p.paid).length,
    tombstoned: list.filter((p) => p.tombstoned).length,
  };

  const count = parseJson(texts.get(PIPELINE.count) ?? null);
  const founding = {
    count: num(count?.founding_count),
    paid: num(count?.paid),
    open_locks: num(count?.open_locks),
  };

  const digest = texts.get(PIPELINE.digest) ?? '';
  const digestTail = digest
    .split(/\r?\n/)
    .filter((line, i, arr) => !(i === arr.length - 1 && line === ''))
    .slice(-DIGEST_TAIL_LINES);

  return { people: list, counts, founding, digestTail, generatedAt: now.toISOString() };
}
