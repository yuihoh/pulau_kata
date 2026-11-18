/**
 * Pecah Belon (pop the balloons): a mini-game skin that practises WORD CLASS, a KSSR grammar
 * point the other stages do not cover.
 *
 * Each round names a class ("Pop every kata kerja!") and balloons, each carrying one of the
 * unit's words, float up the screen. The child taps the balloons of that class. A wrong pop
 * is a gentle boop (it costs a point of that round, never below zero); a target balloon that
 * floats away is a missed word. There is no timer and no dying; a round ends when its balloons
 * are all gone, and the game after three rounds (fewer if the unit has fewer usable classes).
 *
 * Needs no extra content: it uses `word.class`. Idioms (`lain-lain`) and prepositions are left
 * out, because "which class is an idiom?" has no clean answer for a child. A unit with fewer
 * than two usable classes cannot play this game (`canPlayBelon`).
 *
 * Pure and seeded: the UI calls `advance` with elapsed time and `pop` with a balloon id.
 */
import type { Chapter, Word } from '../content/schema';
import { createRng, shuffle, type Rng } from './rng';
import { starsFromRatio, type Stars } from './scoring';

export type WordClass = Word['class'];

/** The classes a balloon round can be about (and that wrong balloons can come from). */
export const BELON_CLASSES: readonly WordClass[] = [
  'kata nama',
  'kata kerja',
  'kata adjektif',
  'kata adverba',
];

export const BELON = {
  rounds: 3,
  /** Balloons per round, and at most this many of them are the target class. */
  perRound: 8,
  maxTargets: 4,
  /** A class needs this many words (and this many other usable words must exist). */
  minTargets: 2,
  minOthers: 2,
  riseMs: { normal: 6500, relaxed: 8500 },
  spawnEveryMs: { normal: 950, relaxed: 1300 },
  /** The round banner ("Pop every kata kerja!") shows this long before balloons float up. */
  introMs: 2000,
  /** How long the kind "that one is not a …" note stays after a wrong pop. */
  noteMs: 1600,
} as const;

export interface PlannedBalloon {
  id: string;
  wordId: string;
  text: string;
  isTarget: boolean;
}

export interface BelonRound {
  target: WordClass;
  balloons: PlannedBalloon[];
}

export interface Balloon extends PlannedBalloon {
  /** Horizontal centre, 0..1. */
  x: number;
  /** 1 = completely below the field, 0 = completely above it (the screen maps it that way). */
  y: number;
}

const usable = (chapter: Chapter) => chapter.words.filter((w) => BELON_CLASSES.includes(w.class));

/** The rounds for a chapter: up to `BELON.rounds` classes, each with a mix of right/wrong words. */
export function planBelon(chapter: Chapter, rng: Rng): BelonRound[] {
  const words = usable(chapter);
  const classes = BELON_CLASSES.filter((c) => {
    const n = words.filter((w) => w.class === c).length;
    return n >= BELON.minTargets && words.length - n >= BELON.minOthers;
  });
  return shuffle(classes, rng)
    .slice(0, BELON.rounds)
    .map((target, i) => {
      const targets = shuffle(
        words.filter((w) => w.class === target),
        rng,
      ).slice(0, BELON.maxTargets);
      const others = shuffle(
        words.filter((w) => w.class !== target),
        rng,
      ).slice(0, BELON.perRound - targets.length);
      const balloons = shuffle(
        [
          ...targets.map((w) => ({ w, isTarget: true })),
          ...others.map((w) => ({ w, isTarget: false })),
        ],
        rng,
      ).map(({ w, isTarget }) => ({ id: `${i}:${w.id}`, wordId: w.id, text: w.word, isTarget }));
      return { target, balloons };
    });
}

export const canPlayBelon = (chapter: Chapter) => planBelon(chapter, createRng(1)).length > 0;

export interface BelonState {
  plan: BelonRound[];
  /** Index of the current round. */
  round: number;
  /** `intro`: the round banner; `playing`: balloons float; `finished`. */
  phase: 'intro' | 'playing' | 'finished';
  introLeftMs: number;
  /** Balloons of this round not yet released. */
  queue: PlannedBalloon[];
  spawnLeftMs: number;
  balloons: Balloon[];
  /** Per round: right pops and wrong pops. */
  right: number[];
  wrong: number[];
  combo: number;
  bestCombo: number;
  /** The latest pop, for feedback (`n` counts pops so the UI can key an effect to each). */
  last: { n: number; ok: boolean; wordId: string; text: string; x: number; y: number } | null;
  pops: number;
  /** Time left to show the note after a wrong pop (0 = no note). */
  noteLeftMs: number;
  /** Words popped by mistake or left floating away (to practise). */
  trouble: string[];
  riseMs: number;
  spawnEveryMs: number;
  relaxed: boolean;
  /** Plain number, not a live RNG, so `step` stays pure even if React replays an updater. */
  seed: number;
}

export interface BelonOptions {
  seed?: number;
  relaxed?: boolean;
}

const nextSeed = (rng: Rng) => Math.floor(rng() * 2 ** 32);

export function createBelon(chapter: Chapter, opts: BelonOptions = {}): BelonState {
  const rng = createRng(opts.seed ?? Date.now());
  const plan = planBelon(chapter, rng);
  const relaxed = opts.relaxed ?? false;
  return {
    plan,
    round: 0,
    phase: plan.length > 0 ? 'intro' : 'finished',
    introLeftMs: BELON.introMs,
    queue: plan[0]?.balloons ?? [],
    spawnLeftMs: 0,
    balloons: [],
    right: plan.map(() => 0),
    wrong: plan.map(() => 0),
    combo: 0,
    bestCombo: 0,
    last: null,
    pops: 0,
    noteLeftMs: 0,
    trouble: [],
    riseMs: relaxed ? BELON.riseMs.relaxed : BELON.riseMs.normal,
    spawnEveryMs: relaxed ? BELON.spawnEveryMs.relaxed : BELON.spawnEveryMs.normal,
    relaxed,
    seed: nextSeed(rng),
  };
}

export const targetsInRound = (r: BelonRound) => r.balloons.filter((b) => b.isTarget).length;
export const totalTargets = (s: BelonState) => s.plan.reduce((n, r) => n + targetsInRound(r), 0);

/** Right pops left in the current round (shown to the child as "3 to go"). */
export function targetsLeft(s: BelonState): number {
  const r = s.plan[s.round];
  return r ? Math.max(0, targetsInRound(r) - (s.right[s.round] ?? 0)) : 0;
}

/**
 * A balloon travels from y = 1 (completely below the field) to y = 0 (completely above it):
 * the screen maps y so that both ends are off-screen whatever the field height, and the
 * balloon is removed only once it can no longer be seen (or tapped).
 */
const TRAVEL = 1;
const LEAVE_Y = 0;
const MAX_STEP_MS = 50;
const MAX_FRAME_MS = 250;

/** Advances by one animation frame of real time, in small steps (frame-rate independent). */
export function advance(s: BelonState, frameMs: number): BelonState {
  let left = Math.min(frameMs, MAX_FRAME_MS);
  let next = s;
  while (left > 0 && next.phase !== 'finished') {
    const dt = Math.min(MAX_STEP_MS, left);
    next = step(next, dt);
    left -= dt;
  }
  return next;
}

function release(s: BelonState): BelonState {
  const [b, ...rest] = s.queue;
  if (!b) return s;
  const rng = createRng(s.seed);
  // Keep a new balloon away from one that has only just been released.
  let x = 0.12 + rng() * 0.76;
  for (let i = 0; i < 6; i++) {
    if (s.balloons.every((o) => o.y < 0.8 || Math.abs(o.x - x) > 0.24)) break;
    x = 0.12 + rng() * 0.76;
  }
  return {
    ...s,
    queue: rest,
    balloons: [...s.balloons, { ...b, x, y: 1 }],
    seed: nextSeed(rng),
  };
}

/** Moves on when a round has no balloons left (to the next round's banner, or the end). */
function endRoundIfDone(s: BelonState): BelonState {
  if (s.queue.length > 0 || s.balloons.length > 0) return s;
  const next = s.round + 1;
  if (next >= s.plan.length) return { ...s, phase: 'finished' };
  return {
    ...s,
    round: next,
    phase: 'intro',
    introLeftMs: BELON.introMs,
    queue: s.plan[next]!.balloons,
    spawnLeftMs: 0,
  };
}

/** Advances the game by `dtMs` of play time (one small step; see `advance`). */
export function step(s0: BelonState, dtMs: number): BelonState {
  if (s0.phase === 'finished' || dtMs <= 0) return s0;
  const s = s0.noteLeftMs > 0 ? { ...s0, noteLeftMs: Math.max(0, s0.noteLeftMs - dtMs) } : s0;
  if (s.phase === 'intro') {
    const left = s.introLeftMs - dtMs;
    return left > 0 ? { ...s, introLeftMs: left } : { ...s, phase: 'playing', introLeftMs: 0 };
  }

  const rise = (dtMs / s.riseMs) * TRAVEL;
  let n = s;
  const gone: Balloon[] = [];
  const kept: Balloon[] = [];
  for (const b of n.balloons) {
    const y = b.y - rise;
    if (y <= LEAVE_Y) gone.push(b);
    else kept.push({ ...b, y });
  }
  // A target that floats away is a missed word (to practise); a wrong balloon floating away is fine.
  const missed = gone.filter((b) => b.isTarget).map((b) => b.wordId);
  n = {
    ...n,
    balloons: kept,
    trouble: missed.length ? [...new Set([...n.trouble, ...missed])] : n.trouble,
  };

  n = { ...n, spawnLeftMs: n.spawnLeftMs - dtMs };
  if (n.spawnLeftMs <= 0 && n.queue.length > 0) n = { ...release(n), spawnLeftMs: n.spawnEveryMs };
  return endRoundIfDone(n);
}

/** The child taps a balloon. A right pop scores; a wrong one is a gentle miss. */
export function pop(s: BelonState, balloonId: string): BelonState {
  if (s.phase !== 'playing') return s;
  const b = s.balloons.find((o) => o.id === balloonId);
  if (!b) return s;
  const ok = b.isTarget;
  const right = [...s.right];
  const wrong = [...s.wrong];
  if (ok) right[s.round] = (right[s.round] ?? 0) + 1;
  else wrong[s.round] = (wrong[s.round] ?? 0) + 1;
  const combo = ok ? s.combo + 1 : 0;
  const next: BelonState = {
    ...s,
    balloons: s.balloons.filter((o) => o.id !== balloonId),
    right,
    wrong,
    combo,
    bestCombo: Math.max(s.bestCombo, combo),
    pops: s.pops + 1,
    noteLeftMs: ok ? 0 : BELON.noteMs,
    last: { n: s.pops + 1, ok, wordId: b.wordId, text: b.text, x: b.x, y: b.y },
    trouble: ok ? s.trouble : [...new Set([...s.trouble, b.wordId])],
  };
  return endRoundIfDone(next);
}

export interface BelonSummary {
  stars: Stars;
  /** Right pops minus wrong pops (never below 0 in a round), out of all target balloons. */
  points: number;
  total: number;
  rightPops: number;
  wrongPops: number;
  /** Words popped by mistake or missed, to practise. */
  practise: string[];
  bestCombo: number;
}

export function summarise(s: BelonState): BelonSummary {
  const points = s.plan.reduce(
    (n, _, i) => n + Math.max(0, (s.right[i] ?? 0) - (s.wrong[i] ?? 0)),
    0,
  );
  const total = totalTargets(s);
  return {
    stars: total > 0 ? starsFromRatio(points / total) : 1,
    points,
    total,
    rightPops: s.right.reduce((a, b) => a + b, 0),
    wrongPops: s.wrong.reduce((a, b) => a + b, 0),
    practise: s.trouble,
    bestCombo: s.bestCombo,
  };
}

/** A random balloon colour index for a balloon id (stable across renders). */
export function balloonColour(id: string, colours: number): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % colours;
}
