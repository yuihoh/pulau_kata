import { describe, expect, it } from 'vitest';
import type { Chapter } from '../content/schema';
import unit1 from '../../../../content/tahun-3/unit-01/chapter.json';
import { current } from './queue';
import {
  TANGKAP,
  advance,
  chooseOption,
  createTangkap,
  moveBasket,
  nudgeBasket,
  showHint,
  step,
  summarise,
  timeLeftMs,
  type TangkapState,
} from './tangkap';

const chapter = unit1 as Chapter;
const answerId = (s: TangkapState) => current(s.queue)!.answerId;

/** A perfect player dodges every wrong fruit: they are removed as soon as they appear. */
const dodge = (s: TangkapState): TangkapState => ({
  ...s,
  fruits: s.fruits.filter((f) => f.optionId === answerId(s)),
});

/** Plays until a fruit of the wanted kind (right or wrong word) is falling, or gives up. */
function untilFruit(s: TangkapState, right: boolean, perfect = false, maxMs = 15000): TangkapState {
  for (let t = 0; t < maxMs && s.phase === 'playing'; t += 50) {
    if (perfect) s = dodge(s);
    if (s.fruits.some((f) => (f.optionId === answerId(s)) === right && f.y < 0.7)) return s;
    s = step(s, 50);
  }
  return s;
}

/** Moves the basket under a fruit of that kind and plays on until it has been caught. */
function catchFruit(s: TangkapState, right: boolean, perfect = false): TangkapState {
  s = untilFruit(s, right, perfect);
  const f = s.fruits.find((o) => (o.optionId === answerId(s)) === right && o.y < 0.7)!;
  s = moveBasket(s, f.x);
  const wrongBefore = s.wrongCatches;
  for (let i = 0; i < 200 && s.phase === 'playing'; i++) {
    s = step(perfect ? dodge(s) : s, 50);
    if (!right && s.wrongCatches > wrongBefore) break;
  }
  return s;
}

const settle = (s: TangkapState) => {
  while (s.phase === 'resolving') s = step(s, 50);
  return s;
};

describe('Tangkap Buah engine', () => {
  it('is deterministic for a seed', () => {
    const run = (seed: number) => {
      let s = createTangkap(chapter, { seed });
      for (let i = 0; i < 80; i++) s = step(s, 50);
      return JSON.stringify(s);
    };
    expect(run(7)).toBe(run(7));
    expect(run(7)).not.toBe(run(8));
  });

  it('starts with the first question, a centred basket and an empty tree', () => {
    const s = createTangkap(chapter, { seed: 1 });
    expect(s.phase).toBe('playing');
    expect(s.basketX).toBe(0.5);
    expect(s.fruits).toHaveLength(0);
    expect(s.wordCount).toBe(chapter.words.length);
  });

  it('releases fruit with one word each, never more than maxFruits at once', () => {
    let s = createTangkap(chapter, { seed: 2 });
    let most = 0;
    for (let i = 0; i < 400; i++) {
      s = moveBasket(step(s, 50), 0); // never catches, so the question stays
      if (s.phase !== 'playing') break;
      most = Math.max(most, s.fruits.length);
      for (const f of s.fruits) expect(f.text.length).toBeGreaterThan(0);
    }
    expect(most).toBeGreaterThan(1);
    expect(most).toBeLessThanOrEqual(TANGKAP.maxFruits);
  });

  it('the right fruit falls at least once in every few fruits', () => {
    let s = createTangkap(chapter, { seed: 3 });
    const right = answerId(s);
    let sinceRight = 0;
    let seen = 0;
    const ids = new Set<number>();
    for (let i = 0; i < 600 && s.phase === 'playing'; i++) {
      s = moveBasket(step(s, 50), 0); // nothing is caught
      for (const f of s.fruits)
        if (!ids.has(f.id)) {
          ids.add(f.id);
          seen++;
          sinceRight = f.optionId === right ? 0 : sinceRight + 1;
          expect(sinceRight).toBeLessThanOrEqual(TANGKAP.rightWithin);
        }
    }
    expect(seen).toBeGreaterThan(6);
  });

  it('catching the right fruit resolves the question: score, queue and combo move on', () => {
    let s = createTangkap(chapter, { seed: 4 });
    const q = current(s.queue)!;
    s = catchFruit(s, true);
    expect(s.phase).toBe('resolving');
    expect(s.last).toEqual({ wordId: q.wordId, clean: true });
    expect(s.score).toBe(10);
    expect(s.combo).toBe(1);
    expect(s.firstTry).toEqual([q.wordId]);
    expect(current(s.queue)?.id).not.toBe(q.id);
    s = settle(s);
    expect(s.phase).toBe('playing');
    expect(s.fruits).toHaveLength(0); // a fresh tree for the next question
  });

  it('a wrong catch is gentle: the question stays, the combo resets, the fall slows', () => {
    let s = createTangkap(chapter, { seed: 5 });
    const q = current(s.queue)!;
    const before = s.fallMs;
    s = catchFruit(s, false);
    expect(s.wrongCatches).toBe(1);
    expect(s.wrongFlashMs).toBeGreaterThan(0);
    expect(s.combo).toBe(0);
    expect(s.phase).toBe('playing');
    expect(current(s.queue)!.id).toBe(q.id);
    expect(s.fallMs).toBeGreaterThan(before);
    expect(showHint(s)).toBe(false);
  });

  it('after two wrong catches the right fruit is hinted', () => {
    let s = createTangkap(chapter, { seed: 6 });
    s = catchFruit(s, false);
    s = catchFruit(s, false);
    expect(s.wrongCatches).toBeGreaterThanOrEqual(2);
    expect(showHint(s)).toBe(true);
  });

  it('a word caught only after a wrong catch is not first-try and comes back later', () => {
    let s = createTangkap(chapter, { seed: 7 });
    const q = current(s.queue)!;
    s = catchFruit(s, false);
    s = catchFruit(s, true);
    expect(s.last).toEqual({ wordId: q.wordId, clean: false });
    expect(s.firstTry).not.toContain(q.wordId);
    expect(s.score).toBe(0);
    expect(s.queue.pending.some((p) => p.id === q.id)).toBe(true);
  });

  it('a missed right fruit just falls away; another one comes', () => {
    let s = createTangkap(chapter, { seed: 8 });
    s = untilFruit(moveBasket(s, 0), true);
    const first = s.fruits.find((f) => f.optionId === answerId(s))!;
    // Keep the basket on the far side until that fruit has fallen past the basket.
    const away = first.x > 0.5 ? 0 : 1;
    for (let i = 0; i < 300 && s.fruits.some((f) => f.id === first.id); i++)
      s = moveBasket(step(s, 50), away);
    expect(s.phase).toBe('playing');
    expect(s.fruits.some((f) => f.id === first.id)).toBe(false);
    s = untilFruit(s, true, false);
    expect(s.fruits.some((f) => f.optionId === answerId(s))).toBe(true);
  });

  it('choosing a word (keyboard / screen reader) scores exactly like catching its fruit', () => {
    let s = createTangkap(chapter, { seed: 21 });
    const q = current(s.queue)!;
    s = chooseOption(s, q.answerId);
    expect(s.phase).toBe('resolving');
    expect(s.last).toEqual({ wordId: q.wordId, clean: true });
    expect(s.score).toBe(10);
    expect(s.firstTry).toEqual([q.wordId]);
  });

  it('choosing a wrong word is gentle and the right word afterwards is not first-try', () => {
    let s = createTangkap(chapter, { seed: 22 });
    const q = current(s.queue)!;
    const wrong = q.options.find((o) => o.id !== q.answerId)!;
    s = chooseOption(s, wrong.id);
    expect(s.phase).toBe('playing');
    expect(s.wrongCatches).toBe(1);
    expect(s.combo).toBe(0);
    s = chooseOption(s, q.answerId);
    expect(s.last).toEqual({ wordId: q.wordId, clean: false });
    expect(s.queue.pending.some((p) => p.id === q.id)).toBe(true); // comes back later
  });

  it('choosing something that is not on offer, or when not playing, does nothing', () => {
    const s = createTangkap(chapter, { seed: 23 });
    expect(chooseOption(s, 'x:nonsense')).toBe(s);
    const done = chooseOption(s, current(s.queue)!.answerId); // now resolving
    expect(chooseOption(done, current(done.queue)?.answerId ?? 'x')).toBe(done);
  });

  it('fruit is released inside the field, where a basket centred there can reach it', () => {
    let s = createTangkap(chapter, { seed: 24 });
    for (let i = 0; i < 300 && s.phase === 'playing'; i++) {
      s = moveBasket(step(s, 50), 0);
      for (const f of s.fruits) {
        expect(f.x).toBeGreaterThanOrEqual(0.18);
        expect(f.x).toBeLessThanOrEqual(0.82);
      }
    }
  });

  it('the basket is clamped to the field and nudges move it', () => {
    let s = createTangkap(chapter, { seed: 9 });
    // The basket is drawn basketHalf wide each side of its centre, so it never leaves the field.
    expect(moveBasket(s, -3).basketX).toBe(TANGKAP.basketHalf);
    expect(moveBasket(s, 7).basketX).toBe(1 - TANGKAP.basketHalf);
    s = nudgeBasket(s, -0.1);
    expect(s.basketX).toBeCloseTo(0.4);
  });

  it('a long frame is capped (a stall is not play time)', () => {
    const s = createTangkap(chapter, { seed: 10 });
    expect(advance(s, 5000).elapsedMs).toBeLessThanOrEqual(250);
  });

  it('a perfect game gives 3 stars and nothing to practise', () => {
    let s = createTangkap(chapter, { seed: 11, relaxed: true });
    for (let i = 0; i < chapter.words.length && s.phase !== 'finished'; i++) {
      s = settle(catchFruit(s, true, true));
    }
    expect(s.phase).toBe('finished');
    const sum = summarise(s, chapter);
    expect(sum.stars).toBe(3);
    expect(sum.practise).toEqual([]);
    expect(sum.correctFirstTry).toBe(chapter.words.length);
  });

  it('relaxed mode gets a longer round, so a calm game does not run out of time', () => {
    expect(TANGKAP.roundMs.relaxed).toBeGreaterThan(TANGKAP.roundMs.normal);
    expect(timeLeftMs(createTangkap(chapter, { seed: 1, relaxed: true }))).toBe(
      TANGKAP.roundMs.relaxed,
    );
  });

  it('time running out ends the round; unreached words are to practise', () => {
    let s = createTangkap(chapter, { seed: 12 });
    s = { ...s, elapsedMs: TANGKAP.roundMs.normal - 100 };
    for (let i = 0; i < 10 && s.phase !== 'finished'; i++) s = step(s, 50);
    expect(timeLeftMs(s)).toBe(0);
    expect(s.phase).toBe('finished');
    const sum = summarise(s, chapter);
    expect(sum.stars).toBe(1); // finishing always earns a star
    expect(sum.practise).toHaveLength(chapter.words.length);
  });
});
