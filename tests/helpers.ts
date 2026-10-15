import { vi } from 'vitest';
import { startSession, type Deps } from '@/lib/interview';
import type { DeliveryKind } from '@/lib/delivery';
import type { ModelRequest } from '@/lib/model';
import { MemoryStore } from '@/lib/storage';
import type { TranscriptMessage } from '@/lib/session';

let ipN = 0;
export const freshIp = () => `10.0.${Math.floor(++ipN / 250)}.${ipN % 250}`;

/** Moves the fake clock past the per-session minimum interval. */
export function tick(ms = 2000) {
  vi.setSystemTime(Date.now() + ms);
}

export function makeDeps(outputs: (string | Error)[] = []) {
  const calls: ModelRequest[] = [];
  const delivered: { kind: string; payload: Record<string, unknown> }[] = [];
  const store = new MemoryStore();
  const callModel = vi.fn(async (req: ModelRequest) => {
    calls.push(req);
    const next = outputs.shift();
    if (next instanceof Error) throw next;
    return { text: next ?? '', stopReason: 'end_turn' };
  });
  const deliver = vi.fn(async (kind: DeliveryKind, payload: Record<string, unknown>) => {
    delivered.push({ kind, payload });
    return 'dry-run' as const;
  });
  const deps: Deps = { callModel, store, deliver };
  return { deps, calls, delivered, store, callModel, deliver, outputs };
}

export interface Started {
  token: string;
  messages: TranscriptMessage[];
  mac: string;
}

export async function newSession(gender: 'f' | 'm' = 'f', name = 'דנה'): Promise<Started> {
  const r = await startSession({ consent: true, name, gender }, freshIp());
  if (r.status !== 200) throw new Error(`session failed ${r.status}`);
  return r.body as unknown as Started;
}

/** The text the person sees in a model request's last user turn. */
export function lastUserText(req: ModelRequest): string {
  const last = req.messages[req.messages.length - 1];
  if (typeof last.content === 'string') return last.content;
  return last.content.map((b) => ('text' in b ? b.text : '')).join('\n');
}
