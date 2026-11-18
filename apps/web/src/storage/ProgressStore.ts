/**
 * Where progress lives. P1: on the device (IndexedDB). P2 adds a Supabase-syncing
 * implementation behind the same interface, so screens never change.
 */
import { mergeProgress, type ChapterProgress } from '../engine';

export interface ProgressStore {
  loadAll(): Promise<ChapterProgress[]>;
  /**
   * Saves by merging with what is already stored (progress is never lost) and returns the
   * merged result, which callers should treat as the new truth.
   */
  saveChapter(progress: ChapterProgress): Promise<ChapterProgress>;
}

/** Stored records carry a schema version so later phases can migrate them. */
export const RECORD_VERSION = 1;
export interface StoredRecord<T> {
  v: number;
  data: T;
}

export class MemoryProgressStore implements ProgressStore {
  private readonly chapters = new Map<string, ChapterProgress>();

  async loadAll() {
    return [...this.chapters.values()];
  }

  async saveChapter(p: ChapterProgress) {
    const old = this.chapters.get(p.chapterId);
    const merged = old ? mergeProgress(old, p) : p;
    this.chapters.set(p.chapterId, merged);
    return merged;
  }
}
