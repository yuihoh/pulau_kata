/**
 * Browser client for POST /api/check-sentence. Sends only the target word, its class, the
 * school year, the child's sentence and the tip language (no personal data), plus a random
 * install id used only for the daily limit. Never throws: the Bina screen shows a friendly
 * fallback when the check is unavailable (offline, limit reached, server down).
 */
import { containsPersonalData } from '../../../../workers/api/src/personal';
import type { CheckRequest, CheckResponse } from '../../../../workers/api/src/types';

export type { CheckRequest, CheckResponse };

export type CheckOutcome =
  | { kind: 'ok'; response: CheckResponse }
  /** The sentence looks like it has a phone number, email, IC number or link: not sent. */
  | { kind: 'personal_data' }
  | { kind: 'offline' | 'rate_limited' | 'unavailable' };

const DEVICE_KEY = 'jk.device';
const TIMEOUT_MS = 20_000;

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/** A random id for this install, kept in localStorage. Not linked to the child in any way. */
export function deviceId(): string {
  try {
    const saved = localStorage.getItem(DEVICE_KEY);
    if (saved && /^[A-Za-z0-9-]{16,64}$/.test(saved)) return saved;
    const id = randomId();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return randomId(); // storage blocked: a fresh id per call still works
  }
}

const apiBase = () => (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

function isCheckResponse(x: unknown): x is CheckResponse {
  const r = x as CheckResponse;
  return (
    !!r &&
    ['correct', 'almost', 'try_again'].includes(r.result) &&
    typeof r.uses_target_word === 'boolean' &&
    typeof r.tip === 'string' &&
    (r.suggested_sentence === null || typeof r.suggested_sentence === 'string')
  );
}

export async function checkSentence(
  req: CheckRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<CheckOutcome> {
  // Screened on the device, so personal data never leaves it (the Worker screens again).
  if (containsPersonalData(req.sentence)) return { kind: 'personal_data' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { kind: 'offline' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${apiBase()}/api/check-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Id': deviceId() },
      body: JSON.stringify(req),
      signal: ctrl.signal,
    });
    if (res.status === 429) return { kind: 'rate_limited' };
    if (!res.ok) return { kind: 'unavailable' };
    const body: unknown = await res.json();
    return isCheckResponse(body) ? { kind: 'ok', response: body } : { kind: 'unavailable' };
  } catch {
    return {
      kind: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'unavailable',
    };
  } finally {
    clearTimeout(timer);
  }
}
