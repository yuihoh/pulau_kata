/**
 * Sampan Kata: the boat game (prototype for Cabaran Akhir).
 *
 * A row of word buoys drifts down a 3-lane river toward the child's boat. The prompt is a
 * picture, a meaning (EN/中文) or audio; the child steers into the buoy with the right BM
 * word. Every wave is exactly one answer: whichever buoy is in the boat's lane when the row
 * reaches the boat is the child's choice.
 *
 * Gentle by design: no dying. The round ends when every word is cleared or the time is up
 * (the wave on screen still finishes). The river speeds up with a combo and slows after a
 * miss; relaxed mode keeps one slow speed. Pure and seeded: the UI only calls `step` with
 * elapsed time and `steer` with the chosen lane.
 */
import type { Chapter } from '../content/schema';
import { buildQuestion, type McqQuestion } from './questions';
import { answer, createQueue, current, isFinished, type QueueState } from './queue';
import { createRng, pick, shuffle, type Rng } from './rng';
import { challengeStars, type Stars } from './scoring';

export const LANES = 3;

export const SAMPAN_DEFAULTS = {
  /** Length of a round. The wave on screen when time runs out still finishes. */
  roundMs: 90_000,
  /** Time for a row of buoys to reach the boat. */
  travelMs: { start: 6000, min: 3200, max: 7500, relaxed: 7000 },
  /** Travel time multiplier after a right answer (faster) and a wrong one (slower). */
  speedUp: 0.9,
  slowDown: 1.25,
  /** Pause after each answer to show feedback. Longer after a miss so the answer can be read. */
  resolveMs: { correct: 700, wrong: 1800 },
  /** A missed word comes back after `gap` waves, at most `maxRetries` times. */
  gap: 3,
  maxRetries: 2,
} as const;

export type PromptKind = 'picture' | 'meaning' | 'listen';

export interface Buoy {
  lane: number;
  /** Chapter word id, or `x:<text>` for a distractor that is not a chapter word. */
  optionId: string;
  text: string;
}

export interface Wave {
  question: McqQuestion;
  promptKind: PromptKind;
  buoys: Buoy[];
  /** 0 = just appeared at the top, 1 = reached the boat. */
  y: number;
  travelMs: number;
}

export interface Outcome {
  correct: boolean;
  wordId: string;
  chosenId: string;
  answerId: string;
}

export interface SampanState {
  elapsedMs: number;
  lane: number;
  queue: QueueState<McqQuestion>;
  wave: Wave | null;
  phase: 'sailing' | 'resolving' | 'finished';
  /** Feedback time left while resolving. */
  resolveLeftMs: number;
  last: Outcome | null;
  /** Waves answered so far (a key for per-answer feedback in the UI). */
  answered: number;
  score: number;
  combo: number;
  bestCombo: number;
  travelMs: number;
  relaxed: boolean;
  /** Prompt kinds the chapter supports (picture only if every word has an image, etc.). */
  kinds: readonly PromptKind[];
  wordCount: number;
  /** Words answered right on the first try. */
  firstTry: string[];
  /**
   * Seed for the next wave's randomness. A plain number (not a live RNG), so `step` stays
   * pure: the same state and time always give the same next state, even if React replays
   * an updater in StrictMode.
   */
  waveSeed: number;
}

export interface SampanOptions {
  seed?: number;
  relaxed?: boolean;
  kinds?: readonly PromptKind[];
}

export function createSampan(chapter: Chapter, opts: SampanOptions = {}): SampanState {
  const rng = createRng(opts.seed ?? Date.now());
  const questions = shuffle(chapter.words, rng).map(
    (w) => buildQuestion(w, chapter, 'picture-word', rng) as McqQuestion,
  );
  const relaxed = opts.relaxed ?? false;
  const travelMs = relaxed ? SAMPAN_DEFAULTS.travelMs.relaxed : SAMPAN_DEFAULTS.travelMs.start;
  const s: SampanState = {
    elapsedMs: 0,
    lane: 1,
    queue: createQueue(questions),
    wave: null,
    phase: 'sailing',
    resolveLeftMs: 0,
    last: null,
    answered: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    travelMs,
    relaxed,
    kinds: opts.kinds?.length ? opts.kinds : ['meaning'],
    wordCount: questions.length,
    firstTry: [],
    waveSeed: nextSeed(rng),
  };
  return withNextWave(s);
}

const nextSeed = (rng: Rng) => Math.floor(rng() * 2 ** 32);

/**
 * Puts up the next row of buoys for the queue's current question (the answer plus 2 wrong
 * words), or no wave when the queue is empty. Derives its randomness from `waveSeed` and
 * stores the following seed, without mutating anything.
 */
function withNextWave(s: SampanState): SampanState {
  const q = current(s.queue);
  if (!q) return { ...s, wave: null };
  const rng = createRng(s.waveSeed);
  const wrong = shuffle(
    q.options.filter((o) => o.id !== q.answerId),
    rng,
  ).slice(0, LANES - 1);
  const answerOpt = q.options.find((o) => o.id === q.answerId)!;
  const buoys = shuffle([answerOpt, ...wrong], rng).map((o, lane) => ({
    lane,
    optionId: o.id,
    text: o.text,
  }));
  const wave = { question: q, promptKind: pick(s.kinds, rng), buoys, y: 0, travelMs: s.travelMs };
  return { ...s, wave, waveSeed: nextSeed(rng) };
}

export function steer(s: SampanState, lane: number): SampanState {
  if (s.phase === 'finished') return s;
  const clamped = Math.max(0, Math.min(LANES - 1, Math.round(lane)));
  return clamped === s.lane ? s : { ...s, lane: clamped };
}

export const nudge = (s: SampanState, dir: -1 | 1) => steer(s, s.lane + dir);

export const timeLeftMs = (s: SampanState) => Math.max(0, SAMPAN_DEFAULTS.roundMs - s.elapsedMs);

/** Largest single simulation step; longer frames are split so nothing is skipped. */
export const MAX_STEP_MS = 50;
/**
 * Longest frame gap we play through. A slow phone (10 FPS = 100 ms frames) keeps real time;
 * only a stall longer than this (the app froze) is not counted, so a buoy can't jump onto
 * the boat. Leaving the app pauses the game anyway.
 */
export const MAX_FRAME_MS = 250;

/** Advances by one animation frame of real time, in small steps (frame-rate independent). */
export function advance(s: SampanState, frameMs: number): SampanState {
  let left = Math.min(frameMs, MAX_FRAME_MS);
  let next = s;
  while (left > 0 && next.phase !== 'finished') {
    const dt = Math.min(MAX_STEP_MS, left);
    next = step(next, dt);
    left -= dt;
  }
  return next;
}

/** Advances the game by `dtMs` of play time (one small step; see `advance`). */
export function step(s: SampanState, dtMs: number): SampanState {
  if (s.phase === 'finished' || dtMs <= 0) return s;
  let next: SampanState = { ...s, elapsedMs: s.elapsedMs + dtMs };

  if (next.phase === 'resolving') {
    const left = next.resolveLeftMs - dtMs;
    if (left > 0) return { ...next, resolveLeftMs: left };
    if (isFinished(next.queue) || timeLeftMs(next) === 0)
      return { ...next, phase: 'finished', resolveLeftMs: 0, wave: null };
    return withNextWave({ ...next, phase: 'sailing', resolveLeftMs: 0 });
  }

  const wave = next.wave;
  if (!wave) return { ...next, phase: 'finished' };
  const y = wave.y + dtMs / wave.travelMs;
  if (y < 1) return { ...next, wave: { ...wave, y } };

  // The row reached the boat: the buoy in the boat's lane is the answer.
  next = { ...next, wave: { ...wave, y: 1 } };
  const chosen = wave.buoys.find((b) => b.lane === next.lane)!;
  const q = wave.question;
  const correct = chosen.optionId === q.answerId;
  const firstAttempt = !Object.hasOwn(next.queue.results, q.id);
  const combo = correct ? next.combo + 1 : 0;
  const { travelMs: tm, speedUp, slowDown, resolveMs, gap, maxRetries } = SAMPAN_DEFAULTS;
  const travelMs = next.relaxed
    ? next.travelMs
    : correct
      ? Math.max(tm.min, next.travelMs * speedUp)
      : Math.min(tm.max, next.travelMs * slowDown);

  return {
    ...next,
    phase: 'resolving',
    resolveLeftMs: correct ? resolveMs.correct : resolveMs.wrong,
    queue: answer(next.queue, correct, { gap, maxRetries }),
    last: { correct, wordId: q.wordId, chosenId: chosen.optionId, answerId: q.answerId },
    answered: next.answered + 1,
    score: next.score + (correct ? 10 * Math.min(combo, 5) : 0),
    combo,
    bestCombo: Math.max(next.bestCombo, combo),
    travelMs,
    firstTry: correct && firstAttempt ? [...next.firstTry, q.wordId] : next.firstTry,
  };
}

export interface SampanSummary {
  stars: Stars;
  correctFirstTry: number;
  total: number;
  /** Words to practise: not right on the first try (or never reached). */
  practise: string[];
  score: number;
  bestCombo: number;
}

export function summarise(s: SampanState, chapter: Chapter): SampanSummary {
  return {
    stars: challengeStars(s.firstTry.length, s.wordCount),
    correctFirstTry: s.firstTry.length,
    total: s.wordCount,
    practise: chapter.words.map((w) => w.id).filter((id) => !s.firstTry.includes(id)),
    score: s.score,
    bestCombo: s.bestCombo,
  };
}
