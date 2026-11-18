/**
 * Loads content/ at build time. Chapters are validated in CI (scripts/validate-content.ts),
 * so the app does not ship Zod or re-validate at runtime.
 *
 * Media: the chapter names `<id>.webp` / `<id>.mp3`. Until the build pipeline converts
 * images (task 9), the loader falls back to the source `<id>.png`, then to no media (the UI
 * shows a placeholder).
 */
import type { Chapter, Quest, Track } from './schema';

const trackFiles = import.meta.glob<Track>('../../../../content/*/track.json', {
  eager: true,
  import: 'default',
});
const chapterFiles = import.meta.glob<Chapter>('../../../../content/*/unit-*/chapter.json', {
  eager: true,
  import: 'default',
});
const mediaFiles = import.meta.glob<string>(
  '../../../../content/*/unit-*/{images,audio}/*.{webp,png,mp3}',
  { eager: true, query: '?url', import: 'default' },
);

const ROOT = '../../../../content/';
/** Staging can opt in to unreviewed chapters; production never shows them. */
const showUnreviewed = !import.meta.env.PROD || import.meta.env.VITE_SHOW_UNREVIEWED === 'true';

export interface ChapterEntry {
  chapter: Chapter;
  /** e.g. `tahun-3/unit-01` */
  dir: string;
}

export interface TrackEntry {
  name: string;
  track: Track;
  chapters: ChapterEntry[];
}

function buildTracks(): TrackEntry[] {
  const chapters = new Map<string, ChapterEntry>();
  for (const [path, chapter] of Object.entries(chapterFiles)) {
    const dir = path.slice(ROOT.length, -'/chapter.json'.length);
    if (chapter.reviewed || showUnreviewed) chapters.set(dir, { chapter, dir });
  }
  return Object.entries(trackFiles)
    .map(([path, track]) => {
      const name = path.slice(ROOT.length, -'/track.json'.length);
      const listed = track.tema
        .flatMap((t) => t.units)
        .map((u) => chapters.get(`${name}/${u.dir}`))
        .filter((e): e is ChapterEntry => !!e);
      return { name, track, chapters: listed };
    })
    .sort((a, b) => a.track.year - b.track.year);
}

export const tracks: TrackEntry[] = buildTracks();

export function findChapter(chapterId: string): ChapterEntry | undefined {
  for (const t of tracks) {
    const hit = t.chapters.find((c) => c.chapter.id === chapterId);
    if (hit) return hit;
  }
  return undefined;
}

export function imageUrl(entry: ChapterEntry, file: string): string | undefined {
  const base = `${ROOT}${entry.dir}/images/`;
  return mediaFiles[base + file] ?? mediaFiles[base + file.replace(/\.webp$/, '.png')];
}

export function audioUrl(entry: ChapterEntry, file: string): string | undefined {
  return mediaFiles[`${ROOT}${entry.dir}/audio/${file}`];
}

const postcards = import.meta.glob<string>('../../../../content/*/unit-*/postcard.{webp,png}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** The unit's postcard collectible (earned when all four stages are done). */
export function postcardUrl(entry: ChapterEntry): string | undefined {
  const base = `${ROOT}${entry.dir}/postcard`;
  return postcards[`${base}.webp`] ?? postcards[`${base}.png`];
}

const temaMaps = import.meta.glob<string>('../../../../content/*/tema-*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

/**
 * The illustrated landscape behind a Tema on the Home map (`content/<track>/tema-01.webp`),
 * if one has been made. Without it the map shows a plain Tema colour.
 */
export function temaMapUrl(trackName: string, tema: number): string | undefined {
  return temaMaps[`${ROOT}${trackName}/tema-${String(tema).padStart(2, '0')}.webp`];
}

const unitIcons = import.meta.glob<string>('../../../../content/*/unit-*/icon.{webp,png}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** The small illustration on a unit's card on the Home map (`unit-NN/icon.webp`), if made. */
export function unitIconUrl(entry: ChapterEntry): string | undefined {
  const base = `${ROOT}${entry.dir}/icon`;
  return unitIcons[`${base}.webp`] ?? unitIcons[`${base}.png`];
}

// ---------------------------------------------------------------- Misi (story quests)

const questFiles = import.meta.glob<Quest>('../../../../content/*/unit-*/quest.json', {
  eager: true,
  import: 'default',
});
const questMedia = import.meta.glob<string>('../../../../content/*/unit-*/quest/*.{webp,png}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export interface QuestEntry {
  quest: Quest;
  entry: ChapterEntry;
}

/** The unit's Misi, if it has one (unreviewed ones are hidden in production, like chapters). */
export function findQuest(chapterId: string): QuestEntry | undefined {
  const entry = findChapter(chapterId);
  if (!entry) return undefined;
  const quest = questFiles[`${ROOT}${entry.dir}/quest.json`];
  if (!quest || !(quest.reviewed || showUnreviewed)) return undefined;
  return { quest, entry };
}

export const allQuests = (): QuestEntry[] =>
  tracks
    .flatMap((t) => t.chapters)
    .map((c) => findQuest(c.chapter.id))
    .filter((q): q is QuestEntry => !!q);

const questAudio = import.meta.glob<string>('../../../../content/*/unit-*/quest/audio/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** A Misi line's read-aloud MP3 (see content/audioPlan.ts), once generated. */
export function questAudioUrl(entry: ChapterEntry, file: string): string | undefined {
  return questAudio[`${ROOT}${entry.dir}/quest/audio/${file}`];
}

export function questImageUrl(entry: ChapterEntry, file: string): string | undefined {
  const base = `${ROOT}${entry.dir}/quest/`;
  return questMedia[base + file] ?? questMedia[base + file.replace(/\.webp$/, '.png')];
}
