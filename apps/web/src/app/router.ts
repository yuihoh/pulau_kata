/**
 * Tiny hash router: works on static hosting, supports the phone's back button, no dependency.
 *   #/                       home
 *   #/c/<chapterId>          chapter overview
 *   #/c/<chapterId>/<stage>  a stage
 *   #/lab/sampan[/<chapterId>]  prototype games (not linked in production)
 *   #/lab/misi[/<chapterId>]
 *   #/koleksi                collectibles (postcards, Misi pictures)
 */
import { useSyncExternalStore } from 'react';
import { STAGES, type StageId } from '../engine';

export const LAB_GAMES = ['sampan', 'misi', 'audio'] as const;
export type LabGame = (typeof LAB_GAMES)[number];

export type Route =
  | { name: 'home' }
  | { name: 'chapter'; chapterId: string }
  | { name: 'stage'; chapterId: string; stage: StageId }
  | { name: 'lab'; game: LabGame; chapterId?: string }
  | { name: 'koleksi' };

export function parseRoute(hash: string): Route {
  let parts: string[];
  try {
    parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return { name: 'home' }; // malformed %-encoding, e.g. "#/c/%"
  }
  if (parts[0] === 'c' && parts[1]) {
    const stage = parts[2] as StageId | undefined;
    if (stage && STAGES.includes(stage)) return { name: 'stage', chapterId: parts[1], stage };
    return { name: 'chapter', chapterId: parts[1] };
  }
  if (parts[0] === 'koleksi') return { name: 'koleksi' };
  if (parts[0] === 'lab' && LAB_GAMES.includes(parts[1] as LabGame)) {
    const game = parts[1] as LabGame;
    return parts[2] ? { name: 'lab', game, chapterId: parts[2] } : { name: 'lab', game };
  }
  return { name: 'home' };
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'chapter':
      return `#/c/${encodeURIComponent(route.chapterId)}`;
    case 'stage':
      return `#/c/${encodeURIComponent(route.chapterId)}/${route.stage}`;
    case 'koleksi':
      return '#/koleksi';
    case 'lab':
      return route.chapterId
        ? `#/lab/${route.game}/${encodeURIComponent(route.chapterId)}`
        : `#/lab/${route.game}`;
  }
}

export function navigate(route: Route): void {
  window.location.hash = hrefFor(route);
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parseRoute(hash);
}
