/**
 * Cross-session spaced repetition (Leitner boxes). Feeds word ordering now and the
 * Ulang Kaji revision mode later (P3). Mirrors the planned `word_stats` table.
 */
export interface WordStat {
  wordId: string;
  seen: number;
  correct: number;
  wrong: number;
  /** Leitner box 0–4. Correct moves up one box; wrong drops to box 0. */
  box: number;
  lastSeen?: string;
  dueAt?: string;
}

/** Days until a word in each box is due again. */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14] as const;
export const MASTERED_BOX = 3;
const MAX_BOX = BOX_INTERVAL_DAYS.length - 1;
const DAY_MS = 24 * 60 * 60 * 1000;

export const newStat = (wordId: string): WordStat => ({
  wordId,
  seen: 0,
  correct: 0,
  wrong: 0,
  box: 0,
});

export function recordAnswer(stat: WordStat, correct: boolean, now: Date = new Date()): WordStat {
  const box = correct ? Math.min(stat.box + 1, MAX_BOX) : 0;
  return {
    ...stat,
    seen: stat.seen + 1,
    correct: stat.correct + (correct ? 1 : 0),
    wrong: stat.wrong + (correct ? 0 : 1),
    box,
    lastSeen: now.toISOString(),
    dueAt: new Date(now.getTime() + BOX_INTERVAL_DAYS[box]! * DAY_MS).toISOString(),
  };
}

export const isMastered = (s: WordStat) => s.box >= MASTERED_BOX;

export function isDue(s: WordStat, now: Date = new Date()): boolean {
  return !s.dueAt || new Date(s.dueAt).getTime() <= now.getTime();
}

/** Weakest first: lower box, then more wrong answers, then least recently seen. */
export function byWeakness(a: WordStat, b: WordStat): number {
  return a.box - b.box || b.wrong - a.wrong || (a.lastSeen ?? '').localeCompare(b.lastSeen ?? '');
}
