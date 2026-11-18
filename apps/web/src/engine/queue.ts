/**
 * In-session retry queue: a wrong item comes back a few questions later, up to `maxRetries`
 * times, then retires so a child is never stuck. Immutable: every call returns a new state.
 */
export interface ItemResult {
  attempts: number;
  firstTryCorrect: boolean;
  hintUsed: boolean;
  solved: boolean;
}

export interface QueueState<T extends { id: string }> {
  pending: T[];
  results: Record<string, ItemResult>;
}

export interface QueueOptions {
  /** How many questions later a wrong item returns. Default 3. */
  gap?: number;
  /** Times a wrong item is re-asked before it retires. Default 2. */
  maxRetries?: number;
}

export function createQueue<T extends { id: string }>(items: readonly T[]): QueueState<T> {
  const ids = new Set(items.map((i) => i.id));
  if (ids.size !== items.length) throw new Error('queue items need unique ids');
  return { pending: [...items], results: {} };
}

export const current = <T extends { id: string }>(s: QueueState<T>): T | undefined => s.pending[0];
export const isFinished = <T extends { id: string }>(s: QueueState<T>) => s.pending.length === 0;

function resultOf<T extends { id: string }>(s: QueueState<T>, id: string): ItemResult {
  // Own-property check: an id like "constructor" must not read Object.prototype.
  return Object.hasOwn(s.results, id)
    ? s.results[id]!
    : { attempts: 0, firstTryCorrect: false, hintUsed: false, solved: false };
}

/** Marks that the hint was used on the current item (only counts on the first attempt). */
export function markHintUsed<T extends { id: string }>(s: QueueState<T>): QueueState<T> {
  const item = current(s);
  if (!item) return s;
  const r = resultOf(s, item.id);
  if (r.attempts > 0) return s;
  return { ...s, results: { ...s.results, [item.id]: { ...r, hintUsed: true } } };
}

export function answer<T extends { id: string }>(
  s: QueueState<T>,
  correct: boolean,
  opts: QueueOptions = {},
): QueueState<T> {
  const { gap = 3, maxRetries = 2 } = opts;
  const [item, ...rest] = s.pending;
  if (!item) return s;

  const prev = resultOf(s, item.id);
  const r: ItemResult = {
    attempts: prev.attempts + 1,
    firstTryCorrect: prev.attempts === 0 ? correct : prev.firstTryCorrect,
    hintUsed: prev.hintUsed,
    solved: correct,
  };
  const results = { ...s.results, [item.id]: r };

  if (correct || r.attempts > maxRetries) return { pending: rest, results };
  const at = Math.min(gap, rest.length);
  return { pending: [...rest.slice(0, at), item, ...rest.slice(at)], results };
}
