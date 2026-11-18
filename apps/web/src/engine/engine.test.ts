import { describe, expect, it } from 'vitest';
import raw from '../../../../content/tahun-3/unit-01/chapter.json';
import { ChapterSchema } from '../content/schema';
import {
  BASIC_TYPES,
  answer,
  buildQuestion,
  buildUjiSession,
  byWeakness,
  challengeStars,
  chapterStars,
  checkAnswer,
  completeStage,
  createQueue,
  createRng,
  current,
  emptyProgress,
  hintFor,
  isDue,
  isFinished,
  isMastered,
  isUnlocked,
  markHintUsed,
  newStat,
  nextStage,
  openCard,
  canCompleteKenali,
  padankanStars,
  quizStars,
  recordAnswer,
  shuffle,
  type McqQuestion,
  type ScrambleQuestion,
} from '.';

const chapter = ChapterSchema.parse(raw);
const word = (id: string) => chapter.words.find((w) => w.id === id)!;

describe('rng', () => {
  it('is deterministic per seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('shuffle keeps the same items', () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(shuffle(items, createRng(1)).sort()).toEqual(items);
  });
});

describe('questions', () => {
  it('builds every basic type for every word', () => {
    for (const w of chapter.words)
      for (const type of BASIC_TYPES)
        expect(buildQuestion(w, chapter, type, createRng(7))).not.toBeNull();
  });

  it('MCQ options contain the answer exactly once and have 4 unique options', () => {
    for (const w of chapter.words) {
      for (const type of ['picture-word', 'listen-word', 'fill-blank', 'word-meaning'] as const) {
        const q = buildQuestion(w, chapter, type, createRng(3)) as McqQuestion;
        const ids = q.options.map((o) => o.id);
        expect(ids).toHaveLength(4);
        expect(new Set(ids).size).toBe(4);
        expect(ids.filter((id) => id === q.answerId)).toHaveLength(1);
      }
    }
  });

  it('fill-blank uses one of the blank sentences', () => {
    const q = buildQuestion(word('menjaga'), chapter, 'fill-blank', createRng(1)) as McqQuestion;
    expect(word('menjaga').blank_sentences).toContain(q.prompt.sentence);
  });

  it('unscramble keeps spaces as fixed and never shows the solved word', () => {
    for (let seed = 0; seed < 50; seed++) {
      const q = buildQuestion(
        word('anak-sulung'),
        chapter,
        'unscramble',
        createRng(seed),
      ) as ScrambleQuestion;
      expect(q.pattern).toBe('____ ______');
      expect(q.tiles.map((t) => t.letter).join('')).not.toBe('anaksulung');
    }
  });

  it('checkAnswer accepts the right option and the right letters (any case/spacing)', () => {
    const mcq = buildQuestion(word('bangga'), chapter, 'picture-word', createRng(1)) as McqQuestion;
    expect(checkAnswer(mcq, 'bangga', chapter)).toBe(true);
    expect(checkAnswer(mcq, mcq.options.find((o) => o.id !== 'bangga')!.id, chapter)).toBe(false);

    const sc = buildQuestion(word('anak-sulung'), chapter, 'unscramble', createRng(1));
    expect(checkAnswer(sc!, 'Anak Sulung', chapter)).toBe(true);
    expect(checkAnswer(sc!, 'anaksulung', chapter)).toBe(true);
    expect(checkAnswer(sc!, 'anak bongsu', chapter)).toBe(false);
  });

  it('synonym/antonym questions exist only when the word has one', () => {
    expect(buildQuestion(word('bangga'), chapter, 'antonym', createRng(1))).toBeNull();
    const q = buildQuestion(word('anak-sulung'), chapter, 'antonym', createRng(1)) as McqQuestion;
    expect(q.answerId).toBe('anak-bongsu');
    expect(q.options.map((o) => o.id)).not.toContain('anak-sulung');
  });

  it('hint removes a wrong option, or reveals the first letter tile', () => {
    const mcq = buildQuestion(word('menanam'), chapter, 'fill-blank', createRng(2)) as McqQuestion;
    const h = hintFor(mcq, chapter, createRng(2));
    expect(h.kind === 'eliminate' && h.optionId !== mcq.answerId).toBe(true);

    const sc = buildQuestion(
      word('menanam'),
      chapter,
      'unscramble',
      createRng(2),
    ) as ScrambleQuestion;
    const h2 = hintFor(sc, chapter, createRng(2));
    expect(h2).toMatchObject({ kind: 'first-letter', letter: 'm' });
  });
});

describe('buildUjiSession', () => {
  it('asks every word once and spreads the types evenly', () => {
    const qs = buildUjiSession(chapter, createRng(11));
    expect(qs).toHaveLength(chapter.words.length);
    expect(new Set(qs.map((q) => q.wordId)).size).toBe(chapter.words.length);
    const counts = BASIC_TYPES.map((t) => qs.filter((q) => q.type === t).length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it('perWord=2 gives each word two different types and unique question ids', () => {
    const qs = buildUjiSession(chapter, createRng(5), { perWord: 2 });
    expect(qs).toHaveLength(chapter.words.length * 2);
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
  });

  it('is reproducible for the same seed', () => {
    expect(buildUjiSession(chapter, createRng(9))).toEqual(buildUjiSession(chapter, createRng(9)));
  });
});

describe('queue', () => {
  const items = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));

  it('brings a wrong item back after `gap` questions', () => {
    let s = createQueue(items);
    s = answer(s, false, { gap: 2 });
    expect(s.pending.map((i) => i.id)).toEqual(['b', 'c', 'a', 'd', 'e']);
    expect(s.results.a).toMatchObject({ attempts: 1, firstTryCorrect: false, solved: false });
  });

  it('retires an item after maxRetries wrong re-asks', () => {
    let s = createQueue([{ id: 'a' }]);
    for (let i = 0; i < 3; i++) s = answer(s, false, { maxRetries: 2 });
    expect(isFinished(s)).toBe(true);
    expect(s.results.a!.attempts).toBe(3);
  });

  it('keeps firstTryCorrect false after a later correct answer', () => {
    let s = createQueue([{ id: 'a' }]);
    s = answer(s, false);
    s = answer(s, true);
    expect(s.results.a).toMatchObject({ firstTryCorrect: false, solved: true, attempts: 2 });
  });

  it('records a hint only before the first attempt', () => {
    let s = markHintUsed(createQueue(items));
    expect(s.results.a!.hintUsed).toBe(true);
    s = answer(s, true);
    expect(current(s)!.id).toBe('b');
  });

  it('rejects duplicate ids', () => {
    expect(() => createQueue([{ id: 'a' }, { id: 'a' }])).toThrow();
  });
});

describe('scoring', () => {
  const r = (firstTryCorrect: boolean, hintUsed = false) => ({ firstTryCorrect, hintUsed });

  it('gives 3/2/1 stars by first-try accuracy, never 0', () => {
    expect(quizStars(Array(10).fill(r(true)))).toBe(3);
    expect(quizStars([...Array(7).fill(r(true)), ...Array(3).fill(r(false))])).toBe(2);
    expect(quizStars(Array(10).fill(r(false)))).toBe(1);
    expect(quizStars([])).toBe(1);
  });

  it('counts a hinted correct answer as half', () => {
    expect(quizStars(Array(10).fill(r(true, true)))).toBe(1);
  });

  it('padankan and challenge stars', () => {
    expect(padankanStars(6, 2)).toBe(3);
    expect(padankanStars(6, 8)).toBe(2);
    expect(padankanStars(6, 20)).toBe(1);
    expect(challengeStars(9, 10)).toBe(3);
    expect(challengeStars(0, 0)).toBe(1);
  });
});

describe('progress', () => {
  const ids = chapter.words.map((w) => w.id);

  it('unlocks stages in order', () => {
    let p = emptyProgress(chapter.id);
    expect(isUnlocked(p, 'kenali')).toBe(true);
    expect(isUnlocked(p, 'uji')).toBe(false);
    expect(() => completeStage(p, 'uji', 3)).toThrow();
    for (const id of ids) p = openCard(p, id);
    p = completeStage(p, 'kenali', 2, { wordIds: ids });
    expect(isUnlocked(p, 'uji')).toBe(true);
    expect(nextStage(p)).toBe('uji');
  });

  it('Kenali needs every card opened', () => {
    let p = emptyProgress(chapter.id);
    for (const id of ids.slice(1)) p = openCard(p, id);
    expect(canCompleteKenali(p, ids)).toBe(false);
    p = openCard(openCard(p, ids[0]!), ids[0]!);
    expect(canCompleteKenali(p, ids)).toBe(true);
    expect(p.cardsOpened).toHaveLength(ids.length);
  });

  it('keeps the best stars and the first completion time', () => {
    const t1 = new Date('2026-11-16T10:00:00Z');
    const opened = openCard(emptyProgress('c'), 'w');
    let p = completeStage(opened, 'kenali', 3, { wordIds: ['w'], now: t1 });
    p = completeStage(p, 'kenali', 1, { wordIds: ['w'], now: new Date('2026-11-17T10:00:00Z') });
    expect(p.stages.kenali).toEqual({ stars: 3, completedAt: t1.toISOString() });
    expect(chapterStars(p)).toBe(3);
  });
});

describe('mastery', () => {
  const now = new Date('2026-11-16T00:00:00Z');

  it('moves up on correct, drops to box 0 on wrong', () => {
    let s = newStat('menjaga');
    for (let i = 0; i < 3; i++) s = recordAnswer(s, true, now);
    expect(s.box).toBe(3);
    expect(isMastered(s)).toBe(true);
    s = recordAnswer(s, false, now);
    expect(s).toMatchObject({ box: 0, seen: 4, correct: 3, wrong: 1 });
  });

  it('schedules the next review by box', () => {
    const s = recordAnswer(newStat('x'), true, now); // box 1 → 1 day
    expect(isDue(s, now)).toBe(false);
    expect(isDue(s, new Date('2026-11-17T00:00:00Z'))).toBe(true);
  });

  it('sorts weakest words first', () => {
    const a = { ...newStat('a'), box: 2 };
    const b = { ...newStat('b'), box: 0, wrong: 1 };
    const c = { ...newStat('c'), box: 0, wrong: 3 };
    expect([a, b, c].sort(byWeakness).map((s) => s.wordId)).toEqual(['c', 'b', 'a']);
  });
});
