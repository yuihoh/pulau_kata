/**
 * Jelajah Kata API Worker.
 *   POST /api/check-sentence   AI check of a child's sentence (CLAUDE.md §7)
 *
 * Secrets (ANTHROPIC_API_KEY) come from `wrangler secret` / `.dev.vars`, never from code.
 * With AI_MODE unset or "mock", a deterministic mock checker runs and no key is needed.
 */
import { AnthropicChecker, CheckerUnavailableError } from './checkers/anthropic';
import type { SentenceChecker } from './checkers/checker';
import { MockChecker } from './checkers/mock';
import { containsPersonalData, PERSONAL_DATA_TIP } from './personal';
import {
  DurableRateLimiter,
  MemoryRateLimiter,
  type DurableObjectNamespaceLike,
  type RateLimiter,
} from './rateLimit';
import { DEVICE_HEADER, type CheckError, type CheckResponse } from './types';
import { parseCheckRequest, sanitiseResponse } from './validate';

export { RateLimitCounter } from './rateLimit';

export interface Env {
  /** "mock" (default) or "anthropic". */
  AI_MODE?: string;
  ANTHROPIC_API_KEY?: string;
  /** Override the model id (default claude-haiku-5-5). */
  AI_MODEL?: string;
  /** Comma-separated origins allowed to call the API cross-origin. Same-origin always works. */
  ALLOWED_ORIGINS?: string;
  /** Checks per device per day (default 20) and per IP per day (default 300). */
  DEVICE_DAILY_LIMIT?: string;
  IP_DAILY_LIMIT?: string;
  /** Durable Object namespace (class RateLimitCounter). Optional: falls back to memory. */
  RATE_LIMITER?: DurableObjectNamespaceLike;
}

export interface Deps {
  checker?: SentenceChecker;
  limiter?: RateLimiter;
  log?: (entry: Record<string, unknown>) => void;
}

const DEVICE_ID = /^[A-Za-z0-9-]{16,64}$/;
const MAX_BODY_BYTES = 2_000;

/**
 * Reads at most `max` bytes of the body, cancelling the stream as soon as it is exceeded,
 * so an oversized request is never buffered in full. Returns null if too large.
 */
async function readLimited(req: Request, max: number): Promise<string | null> {
  const declared = Number(req.headers.get('Content-Length') ?? 0);
  if (declared > max) return null;
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

/** One limiter per isolate when there is no Durable Object binding (dev/tests). */
const memoryLimiter = new MemoryRateLimiter();

export function checkerFor(env: Env): SentenceChecker | null {
  const mode = (env.AI_MODE ?? 'mock').toLowerCase();
  if (mode === 'mock') return new MockChecker();
  if (mode === 'anthropic' && env.ANTHROPIC_API_KEY)
    return new AnthropicChecker({ apiKey: env.ANTHROPIC_API_KEY, model: env.AI_MODEL });
  return null; // misconfigured: fail closed rather than silently using the mock
}

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': `Content-Type, ${DEVICE_HEADER}`,
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: CheckResponse | CheckError, status: number, extra: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extra,
    },
  });
}

export async function handleRequest(req: Request, env: Env, deps: Deps = {}): Promise<Response> {
  const url = new URL(req.url);
  const cors = corsHeaders(req, env);
  const log = deps.log ?? ((e) => console.log(JSON.stringify(e)));

  if (url.pathname !== '/api/check-sentence') return json({ error: 'not_found' }, 404, cors);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);

  const device = req.headers.get(DEVICE_HEADER) ?? '';
  if (!DEVICE_ID.test(device)) return json({ error: 'bad_request' }, 400, cors);

  const raw = await readLimited(req, MAX_BODY_BYTES);
  if (raw === null) return json({ error: 'bad_request' }, 413, cors);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'bad_request' }, 400, cors);
  }
  const check = parseCheckRequest(body);
  if (!check) return json({ error: 'bad_request' }, 400, cors);

  // Personal data never reaches the AI (the app screens it too; this covers modified clients).
  if (containsPersonalData(check.sentence)) {
    log({ event: 'personal_data_blocked', word: check.word });
    return json(
      {
        result: 'try_again',
        uses_target_word: false,
        tip: PERSONAL_DATA_TIP[check.lang],
        suggested_sentence: null,
      },
      200,
      cors,
    );
  }

  const checker = deps.checker ?? checkerFor(env);
  if (!checker) {
    log({ event: 'check_misconfigured', mode: env.AI_MODE ?? null });
    return json({ error: 'unavailable' }, 503, cors);
  }

  const limiter =
    deps.limiter ?? (env.RATE_LIMITER ? new DurableRateLimiter(env.RATE_LIMITER) : memoryLimiter);
  const ip = req.headers.get('CF-Connecting-IP') ?? 'local';
  const deviceLimit = Number(env.DEVICE_DAILY_LIMIT ?? 20);
  const ipLimit = Number(env.IP_DAILY_LIMIT ?? 300);
  try {
    if (
      !(await limiter.take(`ip:${ip}`, ipLimit)) ||
      !(await limiter.take(`dev:${device}`, deviceLimit))
    )
      return json({ error: 'rate_limited' }, 429, cors);
  } catch (err) {
    // Fail closed: without a working limit we don't spend on the AI. The app then shows the
    // example sentence and the child carries on (never blocked).
    log({ event: 'rate_limit_error', reason: err instanceof Error ? err.message : 'error' });
    return json({ error: 'unavailable' }, 503, cors);
  }

  try {
    const result = sanitiseResponse(await checker.check(check));
    // For quality review: the outcome only. Never the sentence (a child may type a name) or ids.
    log({
      event: 'check',
      result: result.result,
      uses_target_word: result.uses_target_word,
      word: check.word,
      year: check.year,
      length: check.sentence.length,
    });
    return json(result, 200, cors);
  } catch (err) {
    log({
      event: 'check_failed',
      reason: err instanceof CheckerUnavailableError ? err.message : 'error',
    });
    return json({ error: 'unavailable' }, 503, cors);
  }
}

export default {
  fetch: (req: Request, env: Env) => handleRequest(req, env),
};
