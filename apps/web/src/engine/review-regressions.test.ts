/** Regression tests for findings in docs/handoffs/task-03-engine.review.md (Codex). */
import { describe, expect, it } from 'vitest';
import raw from '../../../../content/tahun-3/unit-01/chapter.json';
import { ChapterSchema, type Chapter, type Word } from '../content/schema';
import {
  answer,
  buildQuestion,
  buildUjiSession,
  completeStage,
  createQueue,
  createRng,
  emptyProgress,
  isFinished,
  openCard,
  type McqQuestion,
  type ScrambleQuestion,
} from '.';

const unit1 = ChapterSchema.parse(raw);

function w(id: string, over: Partial<Word> = {}): Word {
  return {
    ...unit1.words[0]!,
    id,
    word: id,
    image: `${id}.webp`,
    audio: `${id}.mp3`,
    synonym: null,
    antonym: null,
    ...over,
  };
}
const chapterOf = (words: Word[]): Chapter => ({ ...unit1, words });

describe('Kenali cannot be completed before every card is opened', () => {
  const ids = unit1.words.map((x) => x.id);

  it('throws without word ids or with unopened cards', () => {
    const p = emptyProgress(unit1.id);
    expect(() => completeStage(p, 'kenali', 3)).toThrow();
    expect(() => completeStage(p, 'kenali', 3, { wordIds: ids })).toThrow();
    expect(() => completeStage(openCard(p, ids[0]!), 'kenali', 3, { wordIds: ids })).toThrow();
    expect(() => completeStage(p, 'kenali', 3, { wordIds: [] })).toThrow();
  });
});

describe('relation distractors are never valid answers', () => {
  it('skips words that share the relation with the prompt or the answer', () => {
    const chapter = chapterOf([
      w('gembira', { synonym: 'riang' }),
      w('riang'),
      w('ceria', { synonym: 'gembira' }), // reciprocal: also a synonym of gembira
      w('suka', { synonym: 'riang' }), // shares the answer: also a synonym
      w('meja'),
      w('kerusi'),
      w('pintu'),
    ]);
    for (let seed = 0; seed < 50; seed++) {
      const q = buildQuestion(
        chapter.words[0]!,
        chapter,
        'synonym',
        createRng(seed),
      ) as McqQuestion;
      const ids = q.options.map((o) => o.id);
      expect(ids).toContain('riang');
      expect(ids).not.toContain('ceria');
      expect(ids).not.toContain('suka');
    }
  });
});

describe('queue ids that collide with Object.prototype', () => {
  it('still retires "constructor" after maxRetries', () => {
    let s = createQueue([{ id: 'constructor' }, { id: 'toString' }]);
    for (let i = 0; i < 10 && !isFinished(s); i++) s = answer(s, false, { maxRetries: 2 });
    expect(isFinished(s)).toBe(true);
    const key: string = 'constructor';
    expect(s.results[key]!.attempts).toBe(3);
  });
});

describe('unscramble never starts solved', () => {
  it('holds for a 2-letter word over many seeds', () => {
    const chapter = chapterOf([w('di'), w('ke'), w('ya'), w('ini')]);
    for (let seed = 0; seed < 5000; seed++) {
      const q = buildQuestion(
        chapter.words[0]!,
        chapter,
        'unscramble',
        createRng(seed),
      ) as ScrambleQuestion;
      expect(q.tiles.map((t) => t.letter).join('')).toBe('id');
    }
  });
});

describe('no back-to-back questions for the same word', () => {
  it('holds across round boundaries', () => {
    for (let seed = 0; seed < 300; seed++)
      for (const perWord of [2, 3]) {
        const qs = buildUjiSession(unit1, createRng(seed), { perWord });
        for (let i = 1; i < qs.length; i++) expect(qs[i]!.wordId).not.toBe(qs[i - 1]!.wordId);
      }
  });
});
