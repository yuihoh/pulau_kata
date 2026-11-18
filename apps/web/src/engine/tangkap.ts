/**
 * Tangkap Buah (catch the fruit): a mini-game skin over the Uji question engine.
 *
 * A prompt (picture, meaning or audio) stays on screen while rambutans, each carrying a BM
 * word, fall from the tree. The child moves a basket to catch the one with the right word.
 * A wrong catch is a gentle boop (the combo resets, the question stays, a hint glow appears
 * after two); a missed right fruit simply falls away and another one comes. No dying.
 *
 * Questions come from the same `buildQuestion` as Uji and Sampan Kata, so every unit works
 * with no extra content, and a word caught only after a wrong catch comes back later (the
 * shared retry queue). Pure and seeded: the UI only calls `advance` with elapsed time and
 * `moveBasket` with the basket position.
 */
import type { Chapter } from '../content/schema';
import { buildQuestion, type McqQuestion } from './questions';
import { answer, createQueue, current, isFinished, type QueueState } from './queue';
import { createRng, pick, shuffle, type Rng } from './rng';
import type { PromptKind } from './sampan';
import { challengeStars, type Stars } from './scoring';

export const TANGKAP = {
  /** Length of a round (relaxed mode has slower fruit, so more time). The question on screen
   * when time runs out is left unanswered. */
  roundMs: { normal: 90_000, relaxed: 150_000 },
  /** Time for a fruit to fall from the tree to the basket. */
  fallMs: { start: 4600, min: 3200, max: 6200, relaxed: 6200 },
  speedUp: 0.93,
  slowDown: 1.2,
  /** A new fruit leaves the tree this often (while fewer than `maxFruits` are falling). */
  spawnEveryMs: 1100,
  maxFruits: 4,
  /** The right fruit is sure to fall at least once in this many fruits. */
  rightWithin: 3,
  /** Basket and fruit half-widths as a fraction of the field width. */
  basketHalf: 0.15,
  fruitHalf: 0.07,
  /** Where (0 = top, 1 = bottom) the fruit meets the basket. */
  catchY: 0.8,
  /** Pause after the right catch / how long the "not that one" boop shows. */
  resolveMs: 700,
  wrongFlashMs: 1200,
  /** Wrong catches on one question after which the right fruit glows. */
  hintAfter: 2,
  gap: 3,
  maxRetries: 2,
} as const;

export interface Fruit {
  id: number;
  /** Horizontal centre, 0..1. */
  x: number;
  /** 0 = at the tree, 1 = bottom of the field. */
  y: number;
  /** Chapter word id, or `x:<text>` for a distractor that is not a chapter word. */
  optionId: string;
  text: string;
}

export interface TangkapState {
  elapsedMs: number;
  basketX: number;
  queue: QueueState<McqQuestion>;
  promptKind: PromptKind;
  fruits: Fruit[];
  nextFruitId: number;
  spawnLeftMs: number;
  /** Fruits that have fallen since the right one last did. */
  sinceRight: number;
  /** Wrong catches on the current question. */
  wrongCatches: number;
  /** Time left to show the "not that one" boop. */
  wrongFlashMs: number;
  phase: 'playing' | 'resolving' | 'finished';
  resolveLeftMs: number;
  /** Set while resolving: the word just caught and whether it was clean (no wrong catch first). */
  last: { wordId: string; clean: boolean } | null;
  /** Right fruits caught so far (a key for per-catch feedback in the UI). */
  answered: number;
  score: number;
  combo: number;
  bestCombo: number;
  fallMs: number;
  relaxed: boolean;
  kinds: readonly PromptKind[];
  wordCount: number;
  /** Words caught right on the first try. */
  firstTry: string[];
  /** Plain number, not a live RNG, so `step` stays pure even if React replays an updater. */
  seed: number;
}

export interface TangkapOptions {
  seed?: number;
  relaxed?: boolean;
  kinds?: readonly PromptKind[];
}

const nextSeed = (rng: Rng) => Math.floor(rng() * 2 ** 32);

export function createTangkap(chapter: Chapter, opts: TangkapOptions = {}): TangkapState {
  const rng = createRng(opts.seed ?? Date.now());
  const questions = shuffle(chapter.words, rng).map(
    (w) => buildQuestion(w, chapter, 'picture-word', rng) as McqQuestion,
  );
  const relaxed = opts.relaxed ?? false;
  const s: TangkapState = {
    elapsedMs: 0,
    basketX: 0.5,
    queue: createQueue(questions),
    promptKind: 'meaning',
    fruits: [],
    nextFruitId: 1,
    spawnLeftMs: 0,
    sinceRight: 0,
    wrongCatches: 0,
    wrongFlashMs: 0,
    phase: 'playing',
    resolveLeftMs: 0,
    last: null,
    answered: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    fallMs: relaxed ? TANGKAP.fallMs.relaxed : TANGKAP.fallMs.start,
    relaxed,
    kinds: opts.kinds?.length ? opts.kinds : ['meaning'],
    wordCount: questions.length,
    firstTry: [],
    seed: nextSeed(rng),
  };
  return startQuestion(s);
}

/** Clears the tree and begins the queue's current question (or finishes when there is none). */
function startQuestion(s: TangkapState): TangkapState {
  if (!current(s.queue)) return { ...s, phase: 'finished', fruits: [], last: null };
  const rng = createRng(s.seed);
  return {
    ...s,
    phase: 'playing',
    promptKind: pick(s.kinds, rng),
    fruits: [],
    spawnLeftMs: 450,
    sinceRight: 0,
    wrongCatches: 0,
    wrongFlashMs: 0,
    last: null,
    seed: nextSeed(rng),
  };
}

export function moveBasket(s: TangkapState, x: number): TangkapState {
  if (s.phase === 'finished') return s;
  // The basket is drawn TANGKAP.basketHalf wide on each side of its centre, so its centre stays
  // that far from the edges: what the child sees is exactly what is hit-tested.
  const nx = Math.max(TANGKAP.basketHalf, Math.min(1 - TANGKAP.basketHalf, x));
  return nx === s.basketX ? s : { ...s, basketX: nx };
}

export const nudgeBasket = (s: TangkapState, dx: number) => moveBasket(s, s.basketX + dx);

export const roundMsOf = (s: Pick<TangkapState, 'relaxed'>) =>
  s.relaxed ? TANGKAP.roundMs.relaxed : TANGKAP.roundMs.normal;

export const timeLeftMs = (s: TangkapState) => Math.max(0, roundMsOf(s) - s.elapsedMs);

/** Largest single simulation step; longer frames are split so a fruit never skips the basket. */
export const MAX_STEP_MS = 50;
/** Longest frame gap we play through (a longer stall is the app freezing, not play time). */
export const MAX_FRAME_MS = 250;

/** Advances by one animation frame of real time, in small steps (frame-rate independent). */
export function advance(s: TangkapState, frameMs: number): TangkapState {
  let left = Math.min(frameMs, MAX_FRAME_MS);
  let next = s;
  while (left > 0 && next.phase !== 'finished') {
    const dt = Math.min(MAX_STEP_MS, left);
    next = step(next, dt);
    left -= dt;
  }
  return next;
}

/** True while the right fruit is already on its way down (so another one is not needed yet). */
const rightFruitFalling = (s: TangkapState, answerId: string) =>
  s.fruits.some((f) => f.optionId === answerId && f.y < TANGKAP.catchY);

function spawn(s: TangkapState, q: McqQuestion): TangkapState {
  const rng = createRng(s.seed);
  const right = q.options.find((o) => o.id === q.answerId)!;
  const wrong = q.options.filter((o) => o.id !== q.answerId);
  const falling = rightFruitFalling(s, q.answerId);
  const isRight = !falling && (s.sinceRight >= TANGKAP.rightWithin - 1 || rng() < 0.34);
  const opt = isRight ? right : pick(wrong, rng);
  // Keep new fruit away from the ones still near the tree, so words stay readable.
  let x = 0.18 + rng() * 0.64;
  for (let i = 0; i < 6; i++) {
    if (s.fruits.every((f) => f.y > 0.25 || Math.abs(f.x - x) > 0.22)) break;
    x = 0.18 + rng() * 0.64;
  }
  const fruit: Fruit = { id: s.nextFruitId, x, y: 0, optionId: opt.id, text: opt.text };
  return {
    ...s,
    fruits: [...s.fruits, fruit],
    nextFruitId: s.nextFruitId + 1,
    sinceRight: isRight ? 0 : s.sinceRight + 1,
    seed: nextSeed(rng),
  };
}

/** The child caught some wrong fruit: the combo resets, the fall slows, the note shows. */
function applyWrongCatch(n: TangkapState, count: number): TangkapState {
  return {
    ...n,
    wrongCatches: n.wrongCatches + count,
    wrongFlashMs: TANGKAP.wrongFlashMs,
    combo: 0,
    fallMs: n.relaxed ? n.fallMs : Math.min(TANGKAP.fallMs.max, n.fallMs * TANGKAP.slowDown),
  };
}

/** The child caught the right fruit: the question is answered (clean = no wrong catch first). */
function applyRightCatch(n: TangkapState, q: McqQuestion): TangkapState {
  const clean = n.wrongCatches === 0;
  const firstAttempt = !Object.hasOwn(n.queue.results, q.id);
  const combo = clean ? n.combo + 1 : 0;
  return {
    ...n,
    phase: 'resolving',
    resolveLeftMs: TANGKAP.resolveMs,
    queue: answer(n.queue, clean, { gap: TANGKAP.gap, maxRetries: TANGKAP.maxRetries }),
    last: { wordId: q.wordId, clean },
    answered: n.answered + 1,
    score: n.score + (clean ? 10 * Math.min(combo, 5) : 0),
    combo,
    bestCombo: Math.max(n.bestCombo, combo),
    fallMs:
      n.relaxed || !clean ? n.fallMs : Math.max(TANGKAP.fallMs.min, n.fallMs * TANGKAP.speedUp),
    firstTry: clean && firstAttempt ? [...n.firstTry, q.wordId] : n.firstTry,
  };
}

/**
 * Choose a word without moving the basket: the same as catching that word's fruit, with the
 * same scoring. This is how keyboard and screen-reader players play (the words are offered
 * as buttons), so the game does not depend on aiming a basket.
 */
export function chooseOption(s: TangkapState, optionId: string): TangkapState {
  if (s.phase !== 'playing') return s;
  const q = current(s.queue);
  if (!q || !q.options.some((o) => o.id === optionId)) return s;
  return optionId === q.answerId ? applyRightCatch(s, q) : applyWrongCatch(s, 1);
}

/** Advances the game by dtMs of play time (one small step; see advance). */
export function step(s: TangkapState, dtMs: number): TangkapState {
  if (s.phase === 'finished' || dtMs <= 0) return s;
  let n: TangkapState = {
    ...s,
    elapsedMs: s.elapsedMs + dtMs,
    wrongFlashMs: Math.max(0, s.wrongFlashMs - dtMs),
  };

  if (n.phase === 'resolving') {
    const left = n.resolveLeftMs - dtMs;
    if (left > 0) return { ...n, resolveLeftMs: left };
    if (isFinished(n.queue) || timeLeftMs(n) === 0)
      return { ...n, phase: 'finished', fruits: [], resolveLeftMs: 0 };
    return startQuestion({ ...n, resolveLeftMs: 0 });
  }

  const q = current(n.queue);
  if (!q || timeLeftMs(n) === 0) return { ...n, phase: 'finished', fruits: [] };

  // Fall, and see which fruits meet the basket this step.
  const fall = dtMs / n.fallMs;
  const reach = TANGKAP.basketHalf + TANGKAP.fruitHalf * 0.5;
  let caughtRight = false;
  let wrongNow = 0;
  const kept: Fruit[] = [];
  for (const f of n.fruits) {
    const y = f.y + fall;
    const crossing = f.y < TANGKAP.catchY && y >= TANGKAP.catchY;
    if (crossing && Math.abs(f.x - n.basketX) <= reach) {
      if (f.optionId === q.answerId) caughtRight = true;
      else wrongNow++;
      continue; // caught: leaves the field
    }
    if (y <= 1.15) kept.push({ ...f, y });
  }
  n = { ...n, fruits: kept };

  if (wrongNow > 0) n = applyWrongCatch(n, wrongNow);
  if (caughtRight) return applyRightCatch(n, q);

  // Release the next fruit when it is time.
  n = { ...n, spawnLeftMs: n.spawnLeftMs - dtMs };
  if (n.spawnLeftMs <= 0 && n.fruits.length < TANGKAP.maxFruits)
    n = { ...spawn(n, q), spawnLeftMs: TANGKAP.spawnEveryMs };
  return n;
}

/** Whether the right fruit should glow (the child has caught wrong ones a couple of times). */
export const showHint = (s: TangkapState) => s.wrongCatches >= TANGKAP.hintAfter;

export interface TangkapSummary {
  stars: Stars;
  correctFirstTry: number;
  total: number;
  /** Words to practise: not caught right on the first try (or never reached). */
  practise: string[];
  score: number;
  bestCombo: number;
}

export function summarise(s: TangkapState, chapter: Chapter): TangkapSummary {
  return {
    stars: challengeStars(s.firstTry.length, s.wordCount),
    correctFirstTry: s.firstTry.length,
    total: s.wordCount,
    practise: chapter.words.map((w) => w.id).filter((id) => !s.firstTry.includes(id)),
    score: s.score,
    bestCombo: s.bestCombo,
  };
}
