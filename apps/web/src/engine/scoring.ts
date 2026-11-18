/**
 * Stars per stage (1–3). Finishing a stage always earns at least 1 star: no fail screens.
 */
import type { ItemResult } from './queue';

export type Stars = 1 | 2 | 3;
export type AiResult = 'correct' | 'almost' | 'try_again';

export const STAR_THRESHOLDS = { three: 0.9, two: 0.6 } as const;

export function starsFromRatio(ratio: number): Stars {
  if (ratio >= STAR_THRESHOLDS.three) return 3;
  if (ratio >= STAR_THRESHOLDS.two) return 2;
  return 1;
}

/** 1 point: right first try without hint; 0.5: right first try with hint; 0 otherwise. */
export function pointsFor(r: Pick<ItemResult, 'firstTryCorrect' | 'hintUsed'>): number {
  if (!r.firstTryCorrect) return 0;
  return r.hintUsed ? 0.5 : 1;
}

/** Stars for a quiz-like stage (Uji, Susun ayat, Cabaran Akhir) from queue results. */
export function quizStars(
  results: readonly Pick<ItemResult, 'firstTryCorrect' | 'hintUsed'>[],
): Stars {
  if (results.length === 0) return 1;
  const total = results.reduce((sum, r) => sum + pointsFor(r), 0);
  return starsFromRatio(total / results.length);
}

/** Padankan (memory match): fewer mismatched flips → more stars. */
export function padankanStars(pairs: number, mismatches: number): Stars {
  if (pairs <= 0) return 1;
  if (mismatches <= Math.ceil(pairs / 2)) return 3;
  if (mismatches <= pairs * 1.5) return 2;
  return 1;
}

/** Points for one AI-checked free sentence (Tulis sendiri). */
export function aiPoints(result: AiResult): number {
  return result === 'correct' ? 1 : result === 'almost' ? 0.5 : 0;
}

/** Cabaran Akhir: correct answers within the time limit, out of questions shown. */
export function challengeStars(correct: number, total: number): Stars {
  return total > 0 ? starsFromRatio(correct / total) : 1;
}
