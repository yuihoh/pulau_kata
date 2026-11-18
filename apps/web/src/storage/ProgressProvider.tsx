import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { emptyProgress, mergeProgress, type ChapterProgress } from '../engine';
import type { ProgressStore } from './ProgressStore';

interface ProgressContextValue {
  ready: boolean;
  get(chapterId: string): ChapterProgress;
  save(p: ChapterProgress): void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({
  store,
  children,
}: {
  store: ProgressStore;
  children: ReactNode;
}) {
  const [byId, setById] = useState<Record<string, ChapterProgress>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void store.loadAll().then((all) => {
      if (!alive) return;
      setById(Object.fromEntries(all.map((p) => [p.chapterId, p])));
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [store]);

  const get = useCallback(
    (chapterId: string) => byId[chapterId] ?? emptyProgress(chapterId),
    [byId],
  );

  const save = useCallback(
    (p: ChapterProgress) => {
      // Optimistic update, then adopt the store's merged result (which may include progress
      // saved by another tab). Merging never lowers stars or forgets opened cards.
      const mergeIn = (next: ChapterProgress) =>
        setById((prev) => {
          const old = prev[next.chapterId];
          return { ...prev, [next.chapterId]: old ? mergeProgress(old, next) : next };
        });
      mergeIn(p);
      void store.saveChapter(p).then(mergeIn);
    },
    [store],
  );

  const value = useMemo(() => ({ ready, get, save }), [ready, get, save]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
