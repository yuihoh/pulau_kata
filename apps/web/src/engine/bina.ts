/**
 * Stage 3 Bina (build sentences). Two parts:
 *   1. Susun ayat: put a word's example sentence back in order (tiles from `jumbled_sentence`).
 *   2. Tulis sendiri: the child picks a word and writes their own sentence (AI-checked).
 * Pure and seeded, like the rest of the engine.
 */
import type { Chapter } from '../content/schema';
import type { ItemResult } from './queue';
import { shuffle, type Rng } from './rng';
import { pointsFor, starsFromRatio, type Stars } from './scoring';

export const BINA = {
  /** Sentences to unjumble per session. */
  susunCount: 5,
  /** Own sentences to write per session. */
  writeCount: 2,
  /** Tries per own sentence before moving on. */
  maxWriteAttempts: 3,
} as const;

/**
 * Sentence starters offered as tap-to-insert chips in Tulis sendiri (the "Siapa?" part of the
 * sentence frame). Generic subjects, not chapter content.
 */
export const STARTERS = ['Saya', 'Kami', 'Ibu', 'Ayah', 'Adik', 'Kakak', 'Abang'] as const;

export interface SusunQuestion {
  id: string;
  wordId: string;
  /**
   * Shuffled tiles, spelled exactly as in the content. The first word keeps its capital
   * letter: some sentences start with a name ("Ali", "Hari Raya"), and lowercasing those
   * would teach the wrong spelling. The capital is a small, fair clue ("a sentence starts
   * with a capital letter").
   */
  tiles: { id: string; text: string }[];
  /** Tile texts in the right order (as in the content). */
  answer: string[];
}

/** The finished sentence for display: capital first letter, full stop at the end. */
export function formatSentence(words: readonly string[]): string {
  const s = words.join(' ');
  const capped = s.charAt(0).toUpperCase() + s.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
}

export function buildSusunSession(
  chapter: Chapter,
  rng: Rng,
  count: number = BINA.susunCount,
): SusunQuestion[] {
  return shuffle(chapter.words, rng)
    .slice(0, count)
    .map((w) => {
      const answer = w.jumbled_sentence;
      const labelled = answer.map((text, i) => ({ id: `t${i}`, text }));
      let tiles = shuffle(labelled, rng);
      // Never start already solved.
      for (let k = 0; k < 10 && isInOrder(tiles, answer); k++) tiles = shuffle(labelled, rng);
      if (isInOrder(tiles, answer) && tiles.length > 1) tiles = [...tiles.slice(1), tiles[0]!];
      return { id: `susun:${w.id}`, wordId: w.id, tiles, answer };
    });
}

const norm = (s: string) => s.toLowerCase();
const isInOrder = (tiles: { text: string }[], answer: readonly string[]) =>
  tiles.every((t, i) => norm(t.text) === norm(answer[i] ?? ''));

/**
 * True if the placed tile texts make the sentence. Compares text, not tile ids, so two
 * identical tiles (e.g. "adik" twice) can go in either slot. Case does not matter.
 */
export function checkSusun(q: SusunQuestion, placed: readonly string[]): boolean {
  return (
    placed.length === q.answer.length &&
    isInOrder(
      placed.map((text) => ({ text })),
      q.answer,
    )
  );
}

/** Hint: the tile that goes first. */
export function susunHint(q: SusunQuestion): string {
  const first = norm(q.answer[0]!);
  return q.tiles.find((t) => norm(t.text) === first)!.id;
}

/**
 * Bina stars: Susun ayat items score like quiz items (1, 0.5 with hint, 0 if not first try);
 * each own sentence scores by its best AI result (1 correct, 0.5 almost, 0 try again).
 */
export function binaStars(
  susun: readonly Pick<ItemResult, 'firstTryCorrect' | 'hintUsed'>[],
  writePoints: readonly number[],
): Stars {
  const n = susun.length + writePoints.length;
  if (n === 0) return 1;
  const total =
    susun.reduce((sum, r) => sum + pointsFor(r), 0) + writePoints.reduce((a, b) => a + b, 0);
  return starsFromRatio(total / n);
}
