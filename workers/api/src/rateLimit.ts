/**
 * Daily check limits: per device (about 20, CLAUDE.md §7) and a looser per-IP cap so a
 * changed device id cannot get unlimited checks (schools share an IP, so it is generous).
 *
 * Production uses a Durable Object per counter: a Durable Object handles one request at a
 * time, so read-increment-write is atomic and concurrent pupils on one school IP are counted
 * correctly. (Workers KV was tried first and rejected: it allows one write per key per
 * second and loses increments under concurrency.) Without the binding (local dev, tests) an
 * in-memory counter is used.
 */

export interface RateLimiter {
  /** Counts one use of `key` today; false if the limit was already reached. */
  take(key: string, limit: number, now?: Date): Promise<boolean>;
}

const day = (now: Date) => now.toISOString().slice(0, 10);

export class MemoryRateLimiter implements RateLimiter {
  private readonly counts = new Map<string, number>();
  async take(key: string, limit: number, now = new Date()): Promise<boolean> {
    const k = `${day(now)}:${key}`;
    const used = this.counts.get(k) ?? 0;
    if (used >= limit) return false;
    this.counts.set(k, used + 1);
    return true;
  }
}

// Minimal shapes of the Cloudflare APIs we use, so no Cloudflare type package is needed.
export interface DurableObjectStub {
  fetch(input: string, init?: RequestInit): Promise<Response>;
}
export interface DurableObjectNamespaceLike {
  idFromName(name: string): unknown;
  get(id: unknown): DurableObjectStub;
}
export interface DurableObjectStateLike {
  storage: {
    get<T>(key: string): Promise<T | undefined>;
    put(key: string, value: unknown): Promise<void>;
    deleteAll(): Promise<void>;
    setAlarm(when: number): Promise<void>;
  };
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

/** One counter per (day, key). Deletes itself two days later. */
export class RateLimitCounter {
  constructor(private readonly state: DurableObjectStateLike) {}

  async fetch(req: Request): Promise<Response> {
    const { limit } = (await req.json()) as { limit: number };
    const used = (await this.state.storage.get<number>('used')) ?? 0;
    if (used >= limit) return Response.json({ ok: false });
    if (used === 0) await this.state.storage.setAlarm(Date.now() + TWO_DAYS_MS);
    await this.state.storage.put('used', used + 1);
    return Response.json({ ok: true });
  }

  async alarm(): Promise<void> {
    await this.state.storage.deleteAll();
  }
}

export class DurableRateLimiter implements RateLimiter {
  constructor(private readonly ns: DurableObjectNamespaceLike) {}
  async take(key: string, limit: number, now = new Date()): Promise<boolean> {
    const stub = this.ns.get(this.ns.idFromName(`${day(now)}:${key}`));
    const res = await stub.fetch('https://rate-limit/take', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
    if (!res.ok) throw new Error(`rate limiter ${res.status}`);
    return ((await res.json()) as { ok: boolean }).ok;
  }
}
