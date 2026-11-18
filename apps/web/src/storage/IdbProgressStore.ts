import { createStore, entries, update, type UseStore } from 'idb-keyval';
import { mergeProgress, type ChapterProgress } from '../engine';
import {
  MemoryProgressStore,
  RECORD_VERSION,
  type ProgressStore,
  type StoredRecord,
} from './ProgressStore';

const KEY_PREFIX = 'chapter:';

/**
 * IndexedDB-backed progress (P1). If IndexedDB is unavailable (some private-browsing modes),
 * it falls back to memory for the session instead of breaking the game.
 */
export class IdbProgressStore implements ProgressStore {
  private readonly db: UseStore | null;
  private readonly fallback = new MemoryProgressStore();
  private failed = false;

  constructor() {
    this.db = typeof indexedDB === 'undefined' ? null : createStore('jelajah-kata', 'progress');
  }

  private useFallback(err: unknown) {
    if (!this.failed) console.warn('Progress storage unavailable; using memory only.', err);
    this.failed = true;
  }

  async loadAll(): Promise<ChapterProgress[]> {
    if (!this.db || this.failed) return this.fallback.loadAll();
    try {
      const rows = await entries<string, StoredRecord<ChapterProgress>>(this.db);
      return rows
        .filter(([k, r]) => k.startsWith(KEY_PREFIX) && r?.v === RECORD_VERSION)
        .map(([, r]) => r.data);
    } catch (err) {
      this.useFallback(err);
      return this.fallback.loadAll();
    }
  }

  /**
   * Merges with the stored record inside one readwrite transaction, so a stale snapshot
   * (e.g. from a second tab) can never remove opened cards or lower stars.
   */
  async saveChapter(p: ChapterProgress): Promise<ChapterProgress> {
    const local = await this.fallback.saveChapter(p);
    if (!this.db || this.failed) return local;
    try {
      let merged = local;
      await update<StoredRecord<ChapterProgress>>(
        KEY_PREFIX + p.chapterId,
        (old) => {
          merged = old?.v === RECORD_VERSION ? mergeProgress(old.data, local) : local;
          return { v: RECORD_VERSION, data: merged };
        },
        this.db,
      );
      await this.fallback.saveChapter(merged);
      return merged;
    } catch (err) {
      this.useFallback(err);
      return local;
    }
  }
}
