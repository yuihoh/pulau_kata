import { describe, expect, it } from 'vitest';
import type { Chapter } from '../content/schema';
import unit1 from '../../../../content/tahun-3/unit-01/chapter.json';
import {
  LANES,
  MAX_FRAME_MS,
  SAMPAN_DEFAULTS,
  advance,
  createSampan,
  nudge,
  steer,
  step,
  summarise,
  timeLeftMs,
  type SampanState,
} from './sampan';

const chapter = unit1 as Chapter;

const answerLane = (s: SampanState) =>
  s.wave!.buoys.find((b) => b.optionId === s.wave!.question.answerId)!.lane;
const wrongLane = (s: SampanState) =>
  s.wave!.buoys.find((b) => b.optionId !== s.wave!.question.answerId)!.lane;

/** Steers to the right (or a wrong) lane and sails until the row reaches the boat. */
function playWave(s: SampanState, correct: boolean): SampanState {
  s = steer(s, correct ? answerLane(s) : wrongLane(s));
  while (s.phase === 'sailing') s = step(s, 50);
  return s;
}

/** Sails through the feedback pause to the next wave (or the end). */
function settle(s: SampanState): SampanState {
  while (s.phase === 'resolving') s = step(s, 50);
  return s;
}

describe('Sampan Kata engine', () => {
  it('is deterministic for a seed', () => {
    const a = createSampan(chapter, { seed: 7 });
    const b = createSampan(chapter, { seed: 7 });
    expect(a.wave!.buoys).toEqual(b.wave!.buoys);
    expect(a.queue.pending.map((q) => q.id)).toEqual(b.queue.pending.map((q) => q.id));
  });

  it('every wave has one buoy per lane and exactly one right answer', () => {
    let s = createSampan(chapter, { seed: 1 });
    for (let i = 0; i < chapter.words.length; i++) {
      const w = s.wave!;
      expect(w.buoys.map((b) => b.lane).sort()).toEqual([0, 1, 2]);
      expect(w.buoys.filter((b) => b.optionId === w.question.answerId)).toHaveLength(1);
      expect(new Set(w.buoys.map((b) => b.text)).size).toBe(LANES);
      s = settle(playWave(s, true));
    }
  });

  it('the buoy in the boat lane is the answer when the row arrives', () => {
    let s = createSampan(chapter, { seed: 3 });
    s = playWave(s, true);
    expect(s.phase).toBe('resolving');
    expect(s.last).toMatchObject({ correct: true });
    expect(s.score).toBe(10);
  });

  it('steering is clamped to the river and ignored after the end', () => {
    let s = createSampan(chapter, { seed: 3 });
    s = steer(s, 9);
    expect(s.lane).toBe(LANES - 1);
    s = nudge(nudge(nudge(s, -1), -1), -1);
    expect(s.lane).toBe(0);
  });

  it('a perfect run clears every word, speeds up, and gives 3 stars', () => {
    let s = createSampan(chapter, { seed: 5 });
    const startTravel = s.travelMs;
    while (s.phase !== 'finished') s = settle(playWave(s, true));
    expect(s.travelMs).toBeLessThan(startTravel);
    expect(s.travelMs).toBeGreaterThanOrEqual(SAMPAN_DEFAULTS.travelMs.min);
    const sum = summarise(s, chapter);
    expect(sum).toMatchObject({ stars: 3, correctFirstTry: 12, total: 12, practise: [] });
    expect(sum.bestCombo).toBe(12);
  });

  it('a miss slows the river, resets the combo, and the word comes back after 3 waves', () => {
    let s = createSampan(chapter, { seed: 5 });
    s = settle(playWave(s, true));
    const before = s.travelMs;
    const missed = s.wave!.question.wordId;
    s = playWave(s, false);
    expect(s.last).toMatchObject({ correct: false, wordId: missed });
    expect(s.combo).toBe(0);
    expect(s.travelMs).toBeGreaterThan(before);
    expect(s.resolveLeftMs).toBe(SAMPAN_DEFAULTS.resolveMs.wrong);
    s = settle(s);
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      seen.push(s.wave!.question.wordId);
      s = settle(playWave(s, true));
    }
    expect(seen.indexOf(missed)).toBe(3);
    // Right on the retry, but not on the first try: still a word to practise.
    while (s.phase !== 'finished') s = settle(playWave(s, true));
    expect(summarise(s, chapter).practise).toEqual([missed]);
  });

  it('relaxed mode keeps one speed', () => {
    let s = createSampan(chapter, { seed: 5, relaxed: true });
    s = settle(playWave(s, true));
    s = settle(playWave(s, false));
    expect(s.travelMs).toBe(SAMPAN_DEFAULTS.travelMs.relaxed);
  });

  it('time up: the wave on screen finishes, then the round ends; unreached words count as practise', () => {
    let s = createSampan(chapter, { seed: 5, relaxed: true });
    s = settle(playWave(s, true));
    s = { ...s, elapsedMs: SAMPAN_DEFAULTS.roundMs - 10 };
    s = step(s, 100);
    expect(timeLeftMs(s)).toBe(0);
    expect(s.phase).toBe('sailing'); // the current row still arrives
    s = settle(playWave(s, true));
    expect(s.phase).toBe('finished');
    const sum = summarise(s, chapter);
    expect(sum.correctFirstTry).toBe(2);
    expect(sum.stars).toBe(1); // never 0 stars
    expect(sum.practise).toHaveLength(10);
  });

  it('missing every word still ends (retries retire) with 1 star', () => {
    let s = createSampan(chapter, { seed: 9, relaxed: true });
    s = { ...s, elapsedMs: -1e9 }; // ignore the clock for this test
    let waves = 0;
    while (s.phase !== 'finished' && waves < 100) {
      s = settle(playWave(s, false));
      waves++;
    }
    expect(s.phase).toBe('finished');
    expect(waves).toBe(chapter.words.length * (SAMPAN_DEFAULTS.maxRetries + 1));
    expect(summarise(s, chapter).stars).toBe(1);
  });

  it('step is pure: replaying the same update gives the same next wave (review #5)', () => {
    let s = createSampan(chapter, { seed: 4 });
    s = playWave(steer(s, answerLane(s)), true);
    while (s.resolveLeftMs > 60) s = step(s, 50);
    const a = step(s, 100);
    const b = step(s, 100);
    expect(a.wave).toEqual(b.wave);
    expect(a.waveSeed).toBe(b.waveSeed);
    expect(a.wave!.question.id).not.toBe(s.wave!.question.id);
  });

  it('advance keeps real time on slow devices, but skips long stalls (review #1)', () => {
    const s = createSampan(chapter, { seed: 4 });
    // 10 FPS: ten 100 ms frames = one real second of play.
    let slow = s;
    for (let i = 0; i < 10; i++) slow = advance(slow, 100);
    expect(slow.elapsedMs).toBe(1000);
    expect(slow.wave!.y).toBeCloseTo(1000 / s.travelMs);
    // A 5-second freeze counts as at most MAX_FRAME_MS.
    expect(advance(s, 5000).elapsedMs).toBe(MAX_FRAME_MS);
  });

  it('uses only the prompt kinds the chapter supports', () => {
    let s = createSampan(chapter, { seed: 2, kinds: ['picture', 'meaning'] });
    const kinds = new Set<string>();
    while (s.phase !== 'finished') {
      kinds.add(s.wave!.promptKind);
      s = settle(playWave(s, true));
    }
    expect([...kinds].sort()).toEqual(['meaning', 'picture']);
  });
});
