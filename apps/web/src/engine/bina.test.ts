import { describe, expect, it } from 'vitest';
import type { Chapter } from '../content/schema';
import { tracks } from '../content/loader';
import {
  BINA,
  binaStars,
  buildSusunSession,
  checkSusun,
  formatSentence,
  susunHint,
  type SusunQuestion,
} from './bina';
import { createRng } from './rng';

const chapters: Chapter[] = tracks.flatMap((t) => t.chapters.map((c) => c.chapter));
const unit1 = chapters.find((c) => c.id === 't3-u01')!;

describe('Bina: Susun ayat', () => {
  it('builds a seeded session of distinct words', () => {
    const a = buildSusunSession(unit1, createRng(3));
    const b = buildSusunSession(unit1, createRng(3));
    expect(a).toEqual(b);
    expect(a).toHaveLength(BINA.susunCount);
    expect(new Set(a.map((q) => q.wordId)).size).toBe(BINA.susunCount);
  });

  it('every word in every chapter: tiles are the sentence, never already in order', () => {
    for (const chapter of chapters)
      for (let seed = 0; seed < 20; seed++)
        for (const q of buildSusunSession(chapter, createRng(seed), chapter.words.length)) {
          expect(q.tiles.map((t) => t.text).sort()).toEqual([...q.answer].sort());
          expect(
            checkSusun(
              q,
              q.tiles.map((t) => t.text),
            ),
          ).toBe(false);
          expect(checkSusun(q, q.answer)).toBe(true);
        }
  });

  it('checks text, not tile ids, and ignores case; needs every tile', () => {
    const q: SusunQuestion = {
      id: 'x',
      wordId: 'x',
      answer: ['Adik', 'suka', 'adik', 'kecil'],
      tiles: [],
    };
    expect(checkSusun(q, ['adik', 'suka', 'Adik', 'kecil'])).toBe(true);
    expect(checkSusun(q, ['Adik', 'suka', 'adik'])).toBe(false);
    expect(checkSusun(q, ['suka', 'Adik', 'adik', 'kecil'])).toBe(false);
  });

  it('the hint is the tile that goes first', () => {
    const [q] = buildSusunSession(unit1, createRng(8), 1);
    const id = susunHint(q!);
    expect(q!.tiles.find((t) => t.id === id)!.text).toBe(q!.answer[0]);
  });

  it('formats the finished sentence', () => {
    expect(formatSentence(['kakak', 'ialah', 'anak', 'sulung'])).toBe('Kakak ialah anak sulung.');
    expect(formatSentence(['Siapa', 'itu?'])).toBe('Siapa itu?');
  });
});

describe('binaStars', () => {
  const r = (firstTryCorrect: boolean, hintUsed = false) => ({ firstTryCorrect, hintUsed });

  it('mixes Susun ayat results with own-sentence points', () => {
    expect(binaStars([r(true), r(true), r(true), r(true), r(true)], [1, 1])).toBe(3);
    // 4 + 0.5 hint + 0.5 almost + 1 = 6 / 7 ≈ 0.86 → 2 stars
    expect(binaStars([r(true), r(true), r(true), r(true), r(true, true)], [0.5, 1])).toBe(2);
    expect(binaStars([r(false), r(false)], [0, 0])).toBe(1);
  });

  it('never gives 0 stars', () => {
    expect(binaStars([], [])).toBe(1);
  });
});
