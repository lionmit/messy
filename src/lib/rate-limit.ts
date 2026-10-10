/**
 * Best-effort, in-memory sliding-window rate limiter (no dependency).
 *
 * What it protects: bursts from one IP or one session that land on the same warm
 * serverless instance (a script hammering the chat, a stuck retry loop).
 *
 * What it does NOT protect on serverless (Vercel): every instance has its own
 * memory, a cold start empties it, and parallel instances each count separately.
 * A determined attacker spreading requests across instances or IPs is not stopped
 * here. The hard per-conversation cost cap is the signed transcript (turn and
 * length caps can't be reset by the browser). For a real global limit, use a
 * shared store (part of checklist #8) or a platform firewall rule, and keep a
 * monthly spend limit on the Anthropic account.
 */

const MAX_KEYS = 10_000;

export class SlidingWindowLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = () => Date.now()
  ) {}

  /** Records a hit. Returns ok=false (and does not record) when over the limit. */
  hit(key: string): { ok: boolean; retryAfterMs: number } {
    const t = this.now();
    const from = t - this.windowMs;
    const list = (this.hits.get(key) ?? []).filter((x) => x > from);
    if (list.length >= this.limit) {
      this.hits.set(key, list);
      return { ok: false, retryAfterMs: Math.max(0, list[0] + this.windowMs - t) };
    }
    list.push(t);
    this.hits.delete(key);
    this.hits.set(key, list);
    if (this.hits.size > MAX_KEYS) {
      const oldest = this.hits.keys().next().value;
      if (oldest !== undefined) this.hits.delete(oldest);
    }
    return { ok: true, retryAfterMs: 0 };
  }

  reset(): void {
    this.hits.clear();
  }
}

/** Minimum gap between two requests with the same key. */
export class MinIntervalLimiter {
  private last = new Map<string, number>();

  constructor(
    private readonly intervalMs: number,
    private readonly now: () => number = () => Date.now()
  ) {}

  hit(key: string): { ok: boolean; retryAfterMs: number } {
    const t = this.now();
    const prev = this.last.get(key);
    if (prev !== undefined && t - prev < this.intervalMs) {
      return { ok: false, retryAfterMs: this.intervalMs - (t - prev) };
    }
    this.last.delete(key);
    this.last.set(key, t);
    if (this.last.size > MAX_KEYS) {
      const oldest = this.last.keys().next().value;
      if (oldest !== undefined) this.last.delete(oldest);
    }
    return { ok: true, retryAfterMs: 0 };
  }

  reset(): void {
    this.last.clear();
  }
}
