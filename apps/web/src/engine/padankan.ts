/**
 * Padankan (memory match): each chosen word has two cards, a picture and the BM word.
 * Flip two cards; a picture + its word is a match. Pure state machine: the UI owns timing
 * (call `resolveMismatch` after a short pause so the child can see both cards).
 */
import { shuffle, type Rng } from './rng';

export interface PadCard {
  id: string;
  wordId: string;
  face: 'image' | 'word';
}

export interface PadState {
  cards: PadCard[];
  /** Face-up, not-yet-matched card ids (0–2). Two means a mismatch is waiting to be resolved. */
  flipped: string[];
  /** Word ids matched so far. */
  matched: string[];
  mismatches: number;
}

export const DEFAULT_PAIRS = 6;

export function createPadankan(
  wordIds: readonly string[],
  rng: Rng,
  pairs: number = DEFAULT_PAIRS,
): PadState {
  const chosen = shuffle(wordIds, rng).slice(0, Math.max(1, Math.min(pairs, wordIds.length)));
  const cards = chosen.flatMap((wordId) => [
    { id: `${wordId}:image`, wordId, face: 'image' as const },
    { id: `${wordId}:word`, wordId, face: 'word' as const },
  ]);
  return { cards: shuffle(cards, rng), flipped: [], matched: [], mismatches: 0 };
}

export const pairCount = (s: PadState) => s.cards.length / 2;
export const isComplete = (s: PadState) => s.matched.length === pairCount(s);
export const isWaiting = (s: PadState) => s.flipped.length === 2;
export const isFaceUp = (s: PadState, card: PadCard) =>
  s.flipped.includes(card.id) || s.matched.includes(card.wordId);

export function flip(s: PadState, cardId: string): PadState {
  const card = s.cards.find((c) => c.id === cardId);
  if (!card || isWaiting(s) || isFaceUp(s, card)) return s;

  const flipped = [...s.flipped, cardId];
  if (flipped.length < 2) return { ...s, flipped };

  const other = s.cards.find((c) => c.id === flipped[0])!;
  if (other.wordId === card.wordId) {
    return { ...s, flipped: [], matched: [...s.matched, card.wordId] };
  }
  return { ...s, flipped, mismatches: s.mismatches + 1 };
}

/** Turns a mismatched pair face-down again. No-op if nothing is waiting. */
export function resolveMismatch(s: PadState): PadState {
  return isWaiting(s) ? { ...s, flipped: [] } : s;
}
