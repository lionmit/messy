'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The browser half of the invisible "verify you are human" check (see src/lib/pow.ts).
 *
 * On mount it fetches GET /api/challenge and solves it in an inline Web Worker:
 * find a counter such that sha256(nonce + ":" + counter) starts with
 * `difficulty` zero bits. The solution goes into the session POST as
 * `pow: { token, counter }`. Difficulty 0 means the server has the check off,
 * and the solution is immediate.
 *
 * `refresh()` throws the current solution away and starts over (after a
 * `pow_*` or `human_check_*` answer, or before the 10-minute challenge expires).
 * Nothing here is logged.
 */

export interface PowSolution {
  token: string;
  counter: number;
}

interface ChallengeBody {
  token?: unknown;
  difficulty?: unknown;
}

/** Refetch a little before the server-side 10-minute expiry. */
const REFRESH_MS = 8 * 60 * 1000;
const RETRY_BASE_MS = 1500;
const RETRY_MAX_MS = 10_000;

const WORKER_SOURCE = `
const enc = new TextEncoder();
function lz(d) { let b = 0; for (const x of d) { if (x === 0) { b += 8; continue; } b += Math.clz32(x) - 24; break; } return b; }
self.onmessage = async (e) => {
  const { nonce, difficulty } = e.data;
  const t0 = performance.now();
  for (let counter = 0; ; counter++) {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(nonce + ':' + counter)));
    if (lz(digest) >= difficulty) { self.postMessage({ counter, ms: performance.now() - t0 }); return; }
  }
};
`;

function leadingZeroBits(digest: Uint8Array): number {
  let bits = 0;
  for (const byte of digest) {
    if (byte === 0) {
      bits += 8;
      continue;
    }
    bits += Math.clz32(byte) - 24;
    break;
  }
  return bits;
}

function decodeNonce(token: string): string | null {
  try {
    const body = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(body)) as { nonce?: unknown };
    return typeof payload.nonce === 'string' ? payload.nonce : null;
  } catch {
    return null;
  }
}

/** Fallback when a worker cannot be created: solve on the main thread, yielding on every hash. */
async function solveInline(nonce: string, difficulty: number, alive: () => boolean): Promise<number | null> {
  const enc = new TextEncoder();
  for (let counter = 0; alive(); counter++) {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`${nonce}:${counter}`)));
    if (leadingZeroBits(digest) >= difficulty) return counter;
  }
  return null;
}

function solveInWorker(nonce: string, difficulty: number): Promise<number> & { cancel: () => void } {
  let worker: Worker | null = null;
  let url: string | null = null;
  const promise = new Promise<number>((resolve, reject) => {
    try {
      url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }));
      worker = new Worker(url);
    } catch (err) {
      reject(err);
      return;
    }
    worker.onmessage = (e: MessageEvent<{ counter?: unknown }>) => {
      if (typeof e.data?.counter === 'number') resolve(e.data.counter);
      else reject(new Error('bad worker reply'));
    };
    worker.onerror = () => reject(new Error('worker failed'));
    worker.postMessage({ nonce, difficulty });
  }) as Promise<number> & { cancel: () => void };
  promise.cancel = () => {
    worker?.terminate();
    if (url) URL.revokeObjectURL(url);
  };
  promise.finally(promise.cancel).catch(() => undefined);
  return promise;
}

export function usePowChallenge(): { solution: PowSolution | null; solving: boolean; refresh: () => void } {
  const [solution, setSolution] = useState<PowSolution | null>(null);
  const [solving, setSolving] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => {
    setSolution(null);
    setSolving(true);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let job: { cancel: () => void } | null = null;
    let retries = 0;

    const retryLater = () => {
      const wait = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** retries++);
      timer = setTimeout(run, wait);
    };

    async function run() {
      if (!alive) return;
      let data: ChallengeBody;
      try {
        const res = await fetch('/api/challenge', { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        data = (await res.json()) as ChallengeBody;
      } catch {
        if (alive) retryLater();
        return;
      }
      if (!alive) return;
      const { token, difficulty } = data;
      if (typeof token !== 'string' || typeof difficulty !== 'number') {
        retryLater();
        return;
      }
      const nonce = decodeNonce(token);
      if (nonce === null) {
        retryLater();
        return;
      }

      let counter: number | null = 0;
      if (difficulty > 0) {
        try {
          const w = solveInWorker(nonce, difficulty);
          job = w;
          counter = await w;
        } catch {
          job = null;
          counter = alive ? await solveInline(nonce, difficulty, () => alive) : null;
        }
      }
      if (!alive || counter === null) return;
      setSolution({ token, counter });
      setSolving(false);
      // A challenge is good for 10 minutes; fetch a new one before it expires.
      timer = setTimeout(() => {
        if (alive) refresh();
      }, REFRESH_MS);
    }

    run();
    return () => {
      alive = false;
      if (timer !== undefined) clearTimeout(timer);
      job?.cancel();
    };
  }, [attempt, refresh]);

  return { solution, solving, refresh };
}
