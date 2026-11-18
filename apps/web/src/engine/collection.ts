/**
 * Collectibles ("Koleksi"). Derived from progress, never stored separately, so they can't
 * drift out of sync and P2 cloud sync gets them for free:
 *  - a postcard per unit, earned when all four stages are done;
 *  - the Misi reward picture, earned when the unit's Misi is finished.
 */
import { STAGES, isChapterComplete, misiOf, type ChapterProgress } from './progress';

export type CollectibleKind = 'postcard' | 'misi';

export interface Collectible {
  id: string;
  kind: CollectibleKind;
  chapterId: string;
  earned: boolean;
  /** When it was earned (ISO), if known. */
  earnedAt?: string;
}

export interface UnitInfo {
  chapterId: string;
  hasMisi: boolean;
}

/** When the last of the four stages was first completed. */
function completedAt(p: ChapterProgress): string | undefined {
  const times = STAGES.map((s) => p.stages[s].completedAt).filter((t): t is string => !!t);
  return times.length === STAGES.length ? times.sort().at(-1) : undefined;
}

export function collection(
  units: readonly UnitInfo[],
  get: (chapterId: string) => ChapterProgress,
): Collectible[] {
  return units.flatMap(({ chapterId, hasMisi }) => {
    const p = get(chapterId);
    const done = isChapterComplete(p);
    const items: Collectible[] = [
      {
        id: `postcard:${chapterId}`,
        kind: 'postcard',
        chapterId,
        earned: done,
        ...(done && completedAt(p) ? { earnedAt: completedAt(p) } : {}),
      },
    ];
    if (hasMisi) {
      const m = misiOf(p);
      items.push({
        id: `misi:${chapterId}`,
        kind: 'misi',
        chapterId,
        earned: m.stars > 0,
        ...(m.completedAt ? { earnedAt: m.completedAt } : {}),
      });
    }
    return items;
  });
}

/** True when this save is the one that completed the unit (for the celebration). */
export const justCompletedUnit = (before: ChapterProgress, after: ChapterProgress) =>
  !isChapterComplete(before) && isChapterComplete(after);
