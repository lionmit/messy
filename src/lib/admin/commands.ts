/**
 * Dashboard commands for the pipeline runner.
 *
 * The dashboard never touches the pipeline itself (no GitHub token here). It
 * writes one small file per request under pipeline/_commands/ and the runner
 * picks it up on its next cycle (every 10 minutes):
 *
 *   pipeline/_commands/<ISO time, ':' -> '-'>-<action>-<slug>.json
 *   {"action": "release" | "purge" | "paid", "slug", "id", "requestedAt", "by": "admin"}
 *
 * "paid" (2026-10-17): Lionel pressed "התקבל תשלום" for a slug; the runner records the payment and goes live.
 *
 * The slug is never logged.
 */
import type { BlobApi } from '@/lib/storage/blob';
import { SlidingWindowLimiter } from '@/lib/rate-limit';
import { PIPELINE } from './paths';

export const COMMAND_ACTIONS = ['release', 'purge', 'paid'] as const;
export type CommandAction = (typeof COMMAND_ACTIONS)[number];

/** Same shape the pipeline accepts (config.SLUG_RE). */
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;

export const COMMAND_RATE = { limit: 20, windowMs: 10 * 60 * 1000 } as const;

const commandPerIp = new SlidingWindowLimiter(COMMAND_RATE.limit, COMMAND_RATE.windowMs);

export function resetCommandLimiterForTests(): void {
  commandPerIp.reset();
}

export function hitCommandLimit(ip: string): { ok: boolean; retryAfterMs: number } {
  return commandPerIp.hit(ip);
}

export interface CommandFile {
  action: CommandAction;
  slug: string;
  id: string | null;
  requestedAt: string;
  by: 'admin';
}

export function isCommandAction(v: unknown): v is CommandAction {
  return typeof v === 'string' && (COMMAND_ACTIONS as readonly string[]).includes(v);
}

export function isSlug(v: unknown): v is string {
  return typeof v === 'string' && SLUG_RE.test(v);
}

export function commandPathname(now: Date, action: CommandAction, slug: string): string {
  return `${PIPELINE.commands}${now.toISOString().replace(/:/g, '-')}-${action}-${slug}.json`;
}

/** Parses a command pathname back into its parts, or null for a foreign file. */
export function parseCommandPathname(pathname: string): { requestedAt: string; action: CommandAction; slug: string } | null {
  if (!pathname.startsWith(PIPELINE.commands)) return null;
  const name = pathname.slice(PIPELINE.commands.length);
  const m = /^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(?:\.\d+)?Z)-(release|purge|paid)-([a-z0-9][a-z0-9-]{0,60})\.json$/.exec(name);
  if (!m) return null;
  const [, stamp, action, slug] = m;
  const iso = stamp.replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})/, '$1:$2:$3');
  return { requestedAt: iso, action: action as CommandAction, slug };
}

/** The id behind a slug from pipeline/_slugs.json, or null when unknown. */
async function lookupId(api: BlobApi, slug: string): Promise<string | null> {
  const text = await api.getText(PIPELINE.slugs);
  if (!text) return null;
  try {
    const map = JSON.parse(text) as Record<string, unknown>;
    const id = map?.[slug];
    return typeof id === 'string' ? id : null;
  } catch {
    return null;
  }
}

/** Writes the command file. Validation happens before this is called. */
export async function writeCommand(
  api: BlobApi,
  action: CommandAction,
  slug: string,
  now: Date = new Date()
): Promise<{ file: string; command: CommandFile }> {
  const command: CommandFile = {
    action,
    slug,
    id: await lookupId(api, slug),
    requestedAt: now.toISOString(),
    by: 'admin',
  };
  const file = commandPathname(now, action, slug);
  await api.putJson(file, JSON.stringify(command));
  return { file, command };
}
