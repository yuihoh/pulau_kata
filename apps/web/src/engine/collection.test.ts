import { describe, expect, it } from 'vitest';
import { collection, justCompletedUnit } from './collection';
import {
  completeMisi,
  completeStage,
  emptyProgress,
  mergeProgress,
  misiOf,
  openCard,
  type ChapterProgress,
} from './progress';

const ids = ['a', 'b'];
const t = (s: string) => ({ now: new Date(s) });

function upTo(stage: 'kenali' | 'uji' | 'bina' | 'cabaran'): ChapterProgress {
  let p = openCard(openCard(emptyProgress('c1'), 'a'), 'b');
  p = completeStage(p, 'kenali', 3, { wordIds: ids, now: new Date('2026-11-01') });
  if (stage === 'kenali') return p;
  p = completeStage(p, 'uji', 2, t('2026-11-02'));
  if (stage === 'uji') return p;
  p = completeStage(p, 'bina', 2, t('2026-11-03'));
  if (stage === 'bina') return p;
  return completeStage(p, 'cabaran', 1, t('2026-11-04'));
}

describe('Misi progress', () => {
  it('is locked until Uji, keeps best stars and first completion time', () => {
    expect(() => completeMisi(upTo('kenali'), 3)).toThrow(/locked/);
    let p = completeMisi(upTo('uji'), 2, t('2026-11-05'));
    p = completeMisi(p, 1, t('2026-11-06'));
    expect(misiOf(p)).toEqual({ stars: 2, completedAt: '2026-11-05T00:00:00.000Z' });
  });

  it('old records without a misi field still work and merge', () => {
    const old = upTo('uji');
    expect(misiOf(old)).toEqual({ stars: 0 });
    const withMisi = completeMisi(old, 3, t('2026-11-05'));
    expect(misiOf(mergeProgress(old, withMisi)).stars).toBe(3);
    expect(misiOf(mergeProgress(withMisi, old)).stars).toBe(3);
    expect(mergeProgress(old, old)).not.toHaveProperty('misi');
  });
});

describe('collection', () => {
  const units = [
    { chapterId: 'c1', hasMisi: true },
    { chapterId: 'c2', hasMisi: false },
  ];

  it('postcards need all four stages; the Misi picture needs the Misi', () => {
    const byId: Record<string, ChapterProgress> = { c1: upTo('bina') };
    const get = (id: string) => byId[id] ?? emptyProgress(id);
    expect(collection(units, get).map((c) => [c.id, c.earned])).toEqual([
      ['postcard:c1', false],
      ['misi:c1', false],
      ['postcard:c2', false],
    ]);
    byId.c1 = completeMisi(upTo('cabaran'), 3, t('2026-11-05'));
    const items = collection(units, get);
    expect(items[0]).toMatchObject({ earned: true, earnedAt: '2026-11-04T00:00:00.000Z' });
    expect(items[1]).toMatchObject({ earned: true, earnedAt: '2026-11-05T00:00:00.000Z' });
  });

  it('knows the save that completed the unit (for the celebration)', () => {
    const bina = upTo('bina');
    const done = upTo('cabaran');
    expect(justCompletedUnit(bina, done)).toBe(true);
    expect(justCompletedUnit(done, completeStage(done, 'cabaran', 3))).toBe(false);
  });
});
