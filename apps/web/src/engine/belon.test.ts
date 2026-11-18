import { describe, expect, it } from 'vitest';
import type { Chapter } from '../content/schema';
import unit1 from '../../../../content/tahun-3/unit-01/chapter.json';
import unit2 from '../../../../content/tahun-3/unit-02/chapter.json';
import t5u2 from '../../../../content/tahun-5/unit-02/chapter.json';
import { createRng } from './rng';
import {
  BELON,
  BELON_CLASSES,
  advance,
  balloonColour,
  canPlayBelon,
  createBelon,
  planBelon,
  pop,
  step,
  summarise,
  targetsLeft,
  totalTargets,
  type BelonState,
} from './belon';

const chapter = unit1 as Chapter;

/** Plays through the round banner so balloons start to float. */
function start(s: BelonState): BelonState {
  while (s.phase === 'intro') s = step(s, 50);
  return s;
}

/** Floats balloons until one of the wanted kind is on screen. */
function untilBalloon(s: BelonState, target: boolean): BelonState {
  for (let i = 0; i < 400 && s.phase !== 'finished'; i++) {
    if (s.phase === 'playing' && s.balloons.some((b) => b.isTarget === target)) return s;
    s = step(s, 50);
  }
  return s;
}

describe('Pecah Belon plan', () => {
  it('uses real classes only: no idioms, one target class per round, no repeats', () => {
    for (const ch of [chapter, unit2 as Chapter, t5u2 as Chapter]) {
      const plan = planBelon(ch, createRng(5));
      expect(plan.length).toBeGreaterThan(0);
      expect(plan.length).toBeLessThanOrEqual(BELON.rounds);
      expect(new Set(plan.map((r) => r.target)).size).toBe(plan.length);
      for (const r of plan) {
        expect(BELON_CLASSES).toContain(r.target);
        for (const b of r.balloons) {
          const w = ch.words.find((x) => x.id === b.wordId)!;
          expect(BELON_CLASSES).toContain(w.class); // an idiom (lain-lain) is never a balloon
          expect(b.isTarget).toBe(w.class === r.target); // the flag is the word's real class
        }
        const targets = r.balloons.filter((b) => b.isTarget).length;
        expect(targets).toBeGreaterThanOrEqual(BELON.minTargets);
        expect(targets).toBeLessThanOrEqual(BELON.maxTargets);
        expect(r.balloons.length).toBeLessThanOrEqual(BELON.perRound);
        expect(new Set(r.balloons.map((b) => b.wordId)).size).toBe(r.balloons.length);
      }
    }
  });

  it('a unit with one usable class cannot play it, and that is not a crash', () => {
    expect(canPlayBelon(chapter)).toBe(true);
    const oneClass = {
      ...chapter,
      words: chapter.words.map((w) => ({ ...w, class: 'kata kerja' as const })),
    } as Chapter;
    expect(canPlayBelon(oneClass)).toBe(false);
    const s = createBelon(oneClass, { seed: 1 });
    expect(s.phase).toBe('finished');
    expect(summarise(s).stars).toBe(1);
  });

  it('is deterministic for a seed', () => {
    const run = (seed: number) => {
      let s = createBelon(chapter, { seed });
      for (let i = 0; i < 100; i++) s = step(s, 50);
      return JSON.stringify(s);
    };
    expect(run(3)).toBe(run(3));
    expect(run(3)).not.toBe(run(4));
  });
});

describe('Pecah Belon play', () => {
  it('a round starts with a banner, then balloons rise from the bottom', () => {
    let s = createBelon(chapter, { seed: 2 });
    expect(s.phase).toBe('intro');
    expect(s.balloons).toHaveLength(0);
    s = start(s);
    s = step(s, 50);
    s = step(s, 1000);
    expect(s.phase).toBe('playing');
    expect(s.balloons.length).toBeGreaterThan(0);
    const before = s.balloons[0]!.y;
    expect(before).toBeLessThan(1);
    s = step(s, 500);
    expect(s.balloons[0]!.y).toBeLessThan(before);
  });

  it('popping a target scores; popping a wrong balloon is gentle', () => {
    let s = start(createBelon(chapter, { seed: 3 }));
    s = untilBalloon(s, true);
    const t = s.balloons.find((b) => b.isTarget)!;
    s = pop(s, t.id);
    expect(s.right[0]).toBe(1);
    expect(s.combo).toBe(1);
    expect(s.last).toMatchObject({ ok: true, wordId: t.wordId });
    expect(s.balloons.some((b) => b.id === t.id)).toBe(false);
    s = untilBalloon(s, false);
    const w = s.balloons.find((b) => !b.isTarget)!;
    s = pop(s, w.id);
    expect(s.wrong[0]).toBe(1);
    expect(s.combo).toBe(0);
    expect(s.trouble).toContain(w.wordId);
    expect(s.phase).toBe('playing'); // never a fail screen
  });

  it('popping something that is not there, or during the banner, does nothing', () => {
    const s = createBelon(chapter, { seed: 4 });
    expect(pop(s, '0:nothing')).toBe(s);
    const p = start(s);
    expect(pop(p, 'nope')).toBe(p);
  });

  it('a target that floats away is a word to practise; a wrong one floating away is fine', () => {
    let s = start(createBelon(chapter, { seed: 5 }));
    const targetIds = new Set(s.plan[0]!.balloons.filter((b) => b.isTarget).map((b) => b.wordId));
    for (let i = 0; i < 20000 && s.phase !== 'finished'; i++) s = step(s, 50); // never pop
    expect(s.phase).toBe('finished');
    expect(s.right.every((n) => n === 0)).toBe(true);
    expect(s.wrong.every((n) => n === 0)).toBe(true);
    for (const id of targetIds) expect(s.trouble).toContain(id);
    for (const w of s.trouble)
      expect(s.plan.some((r) => r.balloons.some((b) => b.wordId === w && b.isTarget))).toBe(true);
    expect(summarise(s).stars).toBe(1);
  });

  it('popping every target and nothing else gives 3 stars and nothing to practise', () => {
    let s = start(createBelon(chapter, { seed: 6 }));
    for (let i = 0; i < 40000 && s.phase !== 'finished'; i++) {
      const t = s.phase === 'playing' ? s.balloons.find((b) => b.isTarget) : undefined;
      s = t ? pop(s, t.id) : step(s, 50);
    }
    expect(s.phase).toBe('finished');
    const sum = summarise(s);
    expect(sum.points).toBe(totalTargets(s));
    expect(sum.stars).toBe(3);
    expect(sum.practise).toEqual([]);
    expect(sum.wrongPops).toBe(0);
  });

  it('a wrong pop shows a kind note for a short while, a right pop clears it', () => {
    let s = start(createBelon(chapter, { seed: 11 }));
    s = untilBalloon(s, false);
    s = pop(s, s.balloons.find((b) => !b.isTarget)!.id);
    expect(s.noteLeftMs).toBe(BELON.noteMs);
    s = step(s, 1000);
    expect(s.noteLeftMs).toBe(BELON.noteMs - 1000);
    s = step(s, 2000);
    expect(s.noteLeftMs).toBe(0);
    s = untilBalloon(s, false);
    s = pop(s, s.balloons.find((b) => !b.isTarget)!.id);
    s = untilBalloon(s, true);
    s = pop(s, s.balloons.find((b) => b.isTarget)!.id);
    expect(s.noteLeftMs).toBe(0);
  });

  it('wrong pops cost points but a round never goes below zero', () => {
    let s = start(createBelon(chapter, { seed: 7 }));
    for (let i = 0; i < 40000 && s.round === 0 && s.phase !== 'finished'; i++) {
      const w = s.phase === 'playing' ? s.balloons.find((b) => !b.isTarget) : undefined;
      s = w ? pop(s, w.id) : step(s, 50);
    }
    const sum = summarise({ ...s, right: s.right.map(() => 0) });
    expect(sum.points).toBe(0);
    expect(sum.stars).toBe(1);
  });

  it('targetsLeft counts down as targets are popped', () => {
    let s = start(createBelon(chapter, { seed: 8 }));
    const total = targetsLeft(s);
    expect(total).toBeGreaterThanOrEqual(BELON.minTargets);
    s = untilBalloon(s, true);
    s = pop(s, s.balloons.find((b) => b.isTarget)!.id);
    expect(targetsLeft(s)).toBe(total - 1);
  });

  it('every round gets its own banner and the game ends after the last', () => {
    let s = start(createBelon(chapter, { seed: 9 }));
    const rounds = s.plan.length;
    const seen = new Set<number>();
    for (let i = 0; i < 80000 && s.phase !== 'finished'; i++) {
      seen.add(s.round);
      const b = s.phase === 'playing' ? s.balloons[0] : undefined;
      s = b ? pop(s, b.id) : step(s, 50);
    }
    expect(s.phase).toBe('finished');
    expect(seen.size).toBe(rounds);
  });

  it('a long frame is capped like the other games', () => {
    const s = start(createBelon(chapter, { seed: 10 }));
    const a = advance(s, 9000);
    expect(a.balloons.every((b) => b.y > -0.2)).toBe(true);
  });

  it('balloon colours are stable per id and within range', () => {
    expect(balloonColour('0:menjaga', 5)).toBe(balloonColour('0:menjaga', 5));
    for (const id of ['a', 'b', '1:menanam', '2:bangga'])
      expect(balloonColour(id, 5)).toBeLessThan(5);
  });
});
