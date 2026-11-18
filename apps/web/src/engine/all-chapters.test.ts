import { describe, expect, it } from 'vitest';
import u1 from '../../../../content/tahun-3/unit-01/chapter.json';
import u2 from '../../../../content/tahun-3/unit-02/chapter.json';
import u3 from '../../../../content/tahun-3/unit-03/chapter.json';
import { ChapterSchema } from '../content/schema';
import { BASIC_TYPES, buildQuestion, buildUjiSession, checkAnswer, createRng } from '.';

const chapters = [u1, u2, u3].map((c) => ChapterSchema.parse(c));

describe.each(chapters.map((c) => [c.id, c] as const))('real content %s', (_id, chapter) => {
  it('every word builds every basic question type with 4 unique options', () => {
    for (let seed = 0; seed < 20; seed++)
      for (const w of chapter.words)
        for (const type of BASIC_TYPES) {
          const q = buildQuestion(w, chapter, type, createRng(seed))!;
          if (q.kind === 'mcq') {
            expect(new Set(q.options.map((o) => o.id)).size).toBe(4);
            expect(checkAnswer(q, q.answerId, chapter)).toBe(true);
          } else {
            expect(checkAnswer(q, w.word, chapter)).toBe(true);
          }
        }
  });

  it('a full session covers every word', () => {
    const qs = buildUjiSession(chapter, createRng(1), { perWord: 2 });
    expect(new Set(qs.map((q) => q.wordId)).size).toBe(chapter.words.length);
  });
});
