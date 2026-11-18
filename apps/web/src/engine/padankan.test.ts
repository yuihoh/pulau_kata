import { describe, expect, it } from 'vitest';
import {
  createPadankan,
  createRng,
  flip,
  isComplete,
  isWaiting,
  pairCount,
  padankanStars,
  resolveMismatch,
  type PadState,
} from '.';

const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const cardOf = (s: PadState, wordId: string, face: 'image' | 'word') =>
  s.cards.find((c) => c.wordId === wordId && c.face === face)!.id;

describe('padankan', () => {
  it('deals two cards per chosen word, capped at the word count', () => {
    const s = createPadankan(ids, createRng(1), 6);
    expect(s.cards).toHaveLength(12);
    expect(pairCount(s)).toBe(6);
    expect(createPadankan(['a', 'b'], createRng(1), 6).cards).toHaveLength(4);
  });

  it('matches a picture with its word', () => {
    let s = createPadankan(ids, createRng(2), 3);
    const w = s.cards[0]!.wordId;
    s = flip(s, cardOf(s, w, 'image'));
    s = flip(s, cardOf(s, w, 'word'));
    expect(s.matched).toEqual([w]);
    expect(s.flipped).toEqual([]);
  });

  it('counts a mismatch and waits until resolved', () => {
    let s = createPadankan(ids, createRng(3), 3);
    const [x, y] = [...new Set(s.cards.map((c) => c.wordId))];
    s = flip(s, cardOf(s, x!, 'image'));
    s = flip(s, cardOf(s, y!, 'word'));
    expect(s.mismatches).toBe(1);
    expect(isWaiting(s)).toBe(true);
    // A third flip is ignored while waiting.
    expect(flip(s, cardOf(s, x!, 'word'))).toBe(s);
    s = resolveMismatch(s);
    expect(s.flipped).toEqual([]);
  });

  it('ignores flipping the same card twice or a matched card', () => {
    let s = createPadankan(ids, createRng(4), 2);
    const w = s.cards[0]!.wordId;
    const img = cardOf(s, w, 'image');
    s = flip(s, img);
    expect(flip(s, img)).toBe(s);
    s = flip(s, cardOf(s, w, 'word'));
    expect(flip(s, img)).toBe(s);
  });

  it('completes when every pair is matched, and scores stars', () => {
    let s = createPadankan(ids, createRng(5), 6);
    for (const w of new Set(s.cards.map((c) => c.wordId))) {
      s = flip(s, cardOf(s, w, 'word'));
      s = flip(s, cardOf(s, w, 'image'));
    }
    expect(isComplete(s)).toBe(true);
    expect(padankanStars(pairCount(s), s.mismatches)).toBe(3);
  });
});
