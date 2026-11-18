/**
 * Chapter progress and stage unlocking. Plain data, so the ProgressStore (IndexedDB in P1,
 * Supabase sync in P2) can persist it as-is.
 */
import type { Stars } from './scoring';

export const STAGES = ['kenali', 'uji', 'bina', 'cabaran'] as const;
export type StageId = (typeof STAGES)[number];

export interface StageProgress {
  /** Best stars so far (retries can only raise it). 0 = not completed yet. */
  stars: 0 | Stars;
  completedAt?: string;
}

export interface ChapterProgress {
  chapterId: string;
  stages: Record<StageId, StageProgress>;
  /** Kenali: word cards the child has opened. All must be opened to unlock Uji. */
  cardsOpened: string[];
  /**
   * The optional Misi story adventure (unlocked after Uji). Optional so records saved before
   * task 7 stay valid; read it with `misiOf`.
   */
  misi?: StageProgress;
}

export const misiOf = (p: ChapterProgress): StageProgress => p.misi ?? { stars: 0 };

/** Records a finished Misi, keeping the best stars. Throws before Uji is done. */
export function completeMisi(
  p: ChapterProgress,
  stars: Stars,
  { now = new Date() }: { now?: Date } = {},
): ChapterProgress {
  if (!isCompleted(p, 'uji')) throw new Error('misi is locked until uji is done');
  const prev = misiOf(p);
  return {
    ...p,
    misi: {
      stars: Math.max(prev.stars, stars) as Stars,
      completedAt: prev.completedAt ?? now.toISOString(),
    },
  };
}

export function emptyProgress(chapterId: string): ChapterProgress {
  return {
    chapterId,
    stages: { kenali: { stars: 0 }, uji: { stars: 0 }, bina: { stars: 0 }, cabaran: { stars: 0 } },
    cardsOpened: [],
  };
}

export function openCard(p: ChapterProgress, wordId: string): ChapterProgress {
  return p.cardsOpened.includes(wordId) ? p : { ...p, cardsOpened: [...p.cardsOpened, wordId] };
}

export function allCardsOpened(p: ChapterProgress, wordIds: readonly string[]): boolean {
  return wordIds.every((id) => p.cardsOpened.includes(id));
}

export const isCompleted = (p: ChapterProgress, stage: StageId) => p.stages[stage].stars > 0;

/** A stage is open when the previous one is completed. Kenali is always open. */
export function isUnlocked(p: ChapterProgress, stage: StageId): boolean {
  const i = STAGES.indexOf(stage);
  return i === 0 || isCompleted(p, STAGES[i - 1]!);
}

/** Kenali completes only when every card is opened (and Padankan gave its stars). */
export function canCompleteKenali(p: ChapterProgress, wordIds: readonly string[]): boolean {
  return wordIds.length > 0 && allCardsOpened(p, wordIds);
}

export interface CompleteOptions {
  /** Required for Kenali: the chapter's word ids, all of which must have been opened. */
  wordIds?: readonly string[];
  now?: Date;
}

/**
 * Records a finished stage, keeping the best stars. Throws if the stage is locked, or if
 * Kenali is completed before every card was opened.
 */
export function completeStage(
  p: ChapterProgress,
  stage: StageId,
  stars: Stars,
  { wordIds, now = new Date() }: CompleteOptions = {},
): ChapterProgress {
  if (!isUnlocked(p, stage)) throw new Error(`stage ${stage} is locked`);
  if (stage === 'kenali' && !(wordIds && canCompleteKenali(p, wordIds)))
    throw new Error('kenali needs every card opened');
  const prev = p.stages[stage];
  const best = Math.max(prev.stars, stars) as Stars;
  return {
    ...p,
    stages: {
      ...p.stages,
      [stage]: { stars: best, completedAt: prev.completedAt ?? now.toISOString() },
    },
  };
}

export const chapterStars = (p: ChapterProgress) =>
  STAGES.reduce((sum, s) => sum + p.stages[s].stars, 0);

export const isChapterComplete = (p: ChapterProgress) => STAGES.every((s) => isCompleted(p, s));

/** The stage to suggest next: the first not-completed stage, or null when all are done. */
export function nextStage(p: ChapterProgress): StageId | null {
  return STAGES.find((s) => !isCompleted(p, s)) ?? null;
}

/** Best stars, earliest completion time. */
function mergeStage(x: StageProgress, y: StageProgress): StageProgress {
  const times = [x.completedAt, y.completedAt].filter((t): t is string => !!t).sort();
  return {
    stars: Math.max(x.stars, y.stars) as StageProgress['stars'],
    ...(times[0] ? { completedAt: times[0] } : {}),
  };
}

/**
 * Combines two snapshots of the same chapter without ever losing progress: union of opened
 * cards, best stars per stage, earliest completion time. Used when saving (a stale tab must
 * not overwrite newer progress) and later for P2 cloud sync.
 */
export function mergeProgress(a: ChapterProgress, b: ChapterProgress): ChapterProgress {
  if (a.chapterId !== b.chapterId) throw new Error('cannot merge different chapters');
  const stages = {} as Record<StageId, StageProgress>;
  for (const s of STAGES) stages[s] = mergeStage(a.stages[s], b.stages[s]);
  const misi = a.misi || b.misi ? mergeStage(misiOf(a), misiOf(b)) : undefined;
  return {
    chapterId: a.chapterId,
    stages,
    cardsOpened: [...new Set([...a.cardsOpened, ...b.cardsOpened])],
    ...(misi ? { misi } : {}),
  };
}
