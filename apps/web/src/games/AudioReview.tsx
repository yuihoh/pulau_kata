/**
 * Voice review (lab): every generated read-aloud clip in one place, so Yang (or a BM teacher)
 * can listen through a unit in minutes. Each clip has ▶, a "Needs fixing" flag (remembered on
 * this device), and the flagged list can be copied and sent back. "Play all" plays a unit's
 * clips in order, on one reused audio element (Safari's autoplay rule).
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hrefFor } from '../app/router';
import { Header, Page, useUiLang } from '../components/ui';
import { audioPlan, type AudioItem } from '../content/audioPlan';
import { audioUrl, findQuest, questAudioUrl, tracks, type ChapterEntry } from '../content/loader';

const FLAGS_KEY = 'jk.audioReview';
/** Safety net: a clip that never reports an end must not freeze "Play all". */
const MAX_CLIP_MS = 20_000;
const GAP_MS = 500;

interface Clip {
  /** `<chapterId>:<path>`, unique across units. */
  id: string;
  unit: string;
  item: AudioItem;
  src?: string;
  /** Meaning (words) or speaker name (Misi lines), shown under the text. */
  note?: string;
  section: 'words' | 'lines';
}

export function clipsFor(entry: ChapterEntry, lang: 'en' | 'zh'): Clip[] {
  const { chapter } = entry;
  const quest = findQuest(chapter.id)?.quest;
  return audioPlan(chapter, quest).map((item) => {
    const isLine = item.path.startsWith('quest/');
    const src = isLine
      ? questAudioUrl(entry, item.path.slice('quest/audio/'.length))
      : audioUrl(entry, item.path.slice('audio/'.length));
    let note: string | undefined;
    if (!isLine) {
      const w = chapter.words.find(
        (x) => item.path === `audio/${x.audio}` || item.path === `audio/${x.id}-example.mp3`,
      );
      note = item.path.endsWith('-example.mp3') ? w?.example[lang] : w?.meaning[lang];
    } else {
      const m = /^quest\/audio\/(.+)-(\d+)\.mp3$/.exec(item.path);
      const scene = quest?.scenes.find((s) => s.id === m?.[1]);
      const speaker = scene?.steps[Number(m?.[2])]?.speaker;
      note = quest?.characters.find((c) => c.id === speaker)?.name ?? speaker;
    }
    return {
      id: `${chapter.id}:${item.path}`,
      unit: chapter.id,
      item,
      src,
      note,
      section: isLine ? 'lines' : 'words',
    };
  });
}

function loadFlags(): Record<string, true> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(FLAGS_KEY) ?? '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, true>)
      : {};
  } catch {
    return {};
  }
}

function useFlags() {
  const [flags, setFlags] = useState(loadFlags);
  const toggle = (id: string) =>
    setFlags((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      try {
        localStorage.setItem(FLAGS_KEY, JSON.stringify(next));
      } catch {
        /* storage blocked: the flags last for this visit */
      }
      return next;
    });
  return { flags, toggle };
}

/**
 * Plays one clip on the shared element and resolves when it ends, errors, is rejected by the
 * browser, times out, or is cancelled. `finish` is where the caller can find the way to cancel
 * it: cancelling clears the timer and listeners, so a stale clip can never touch the next one.
 * On a timeout the element is paused, so nothing keeps (or resumes) playing.
 */
function playClip(
  audio: HTMLAudioElement,
  src: string,
  finish: { current: (() => void) | null },
): Promise<void> {
  return new Promise((resolve) => {
    const events = ['ended', 'error'] as const;
    const timer = setTimeout(() => {
      audio.pause();
      done();
    }, MAX_CLIP_MS);
    const done = () => {
      clearTimeout(timer);
      for (const e of events) audio.removeEventListener(e, done);
      if (finish.current === done) finish.current = null;
      resolve();
    };
    finish.current = done;
    for (const e of events) audio.addEventListener(e, done);
    audio.src = src;
    audio.currentTime = 0;
    try {
      // A refused play() (autoplay policy) ends the clip at once instead of waiting.
      void Promise.resolve(audio.play()).catch(done);
    } catch {
      done();
    }
  });
}

/**
 * Plays clips one after another; Stop (or leaving the page) cancels cleanly. One audio
 * element is created at the first tap and reused for every clip: Safari lets a tap unlock an
 * element, not each new one, so a fresh element per clip would stall "Play all" on iPhones.
 */
function usePlayer() {
  const [playing, setPlaying] = useState<string | null>(null);
  const run = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const finish = useRef<(() => void) | null>(null);

  /** Ends whatever is playing: the waiting loop is released and the element is paused. */
  const cancel = () => {
    run.current++;
    finish.current?.();
    audio.current?.pause();
  };
  const stop = () => {
    cancel();
    setPlaying(null);
  };
  useEffect(() => cancel, []);

  const playList = async (list: { id: string; src: string }[]) => {
    cancel(); // a list already playing is replaced, never left running
    const token = run.current;
    audio.current ??= new Audio();
    const el = audio.current;
    for (const clip of list) {
      if (run.current !== token) return;
      setPlaying(clip.id);
      await playClip(el, clip.src, finish);
      if (run.current !== token) return;
      await new Promise((r) => setTimeout(r, GAP_MS));
    }
    if (run.current === token) setPlaying(null);
  };
  return { playing, playList, stop };
}

export default function AudioReview({ chapterId }: { chapterId?: string }) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const { flags, toggle } = useFlags();
  const player = usePlayer();
  const [copied, setCopied] = useState(false);
  const chapters = tracks
    .flatMap((tr) => tr.chapters)
    .filter((c) => !chapterId || c.chapter.id === chapterId);
  const all = chapters.flatMap((c) => clipsFor(c, lang));
  const flagged = all.filter((c) => flags[c.id]);
  const flaggedText = flagged
    .map((c) => `${c.unit} · ${c.item.path} · ${c.item.voice.name} · "${c.item.text}"`)
    .join('\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(flaggedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the text stays selectable in the box below */
    }
  }

  return (
    <>
      <Header title={t('audioReview.title')} backHref={hrefFor({ name: 'home' })} />
      <Page>
        <p className="mb-4 text-center text-slate-600">{t('audioReview.intro')}</p>
        {/* Jump straight to one unit (a year's units are far down the page otherwise). */}
        <nav aria-label={t('audioReview.jump')} className="mb-5 flex flex-wrap gap-2">
          {[
            { id: undefined, label: t('audioReview.all') },
            ...tracks
              .flatMap((tr) => tr.chapters)
              .map((c) => ({
                id: c.chapter.id,
                label: `T${c.chapter.year} · U${c.chapter.unit}`,
              })),
          ].map((link) => (
            <a
              key={link.id ?? 'all'}
              href={hrefFor({ name: 'lab', game: 'audio', chapterId: link.id })}
              aria-current={link.id === chapterId ? 'page' : undefined}
              data-testid={`review-jump-${link.id ?? 'all'}`}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                link.id === chapterId ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-800'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>
        {chapters.map((entry) => {
          const clips = all.filter((c) => c.unit === entry.chapter.id);
          return (
            <section
              key={entry.chapter.id}
              className="mb-8"
              data-testid={`review-${entry.chapter.id}`}
            >
              <h2 className="mb-2 text-xl font-bold">
                {t('home.unit', { n: entry.chapter.unit })} · {entry.chapter.title.bm}{' '}
                <span className="text-sm font-normal text-slate-500">
                  (Tahun {entry.chapter.year})
                </span>
              </h2>
              {(['words', 'lines'] as const).map((section) => {
                const rows = clips.filter((c) => c.section === section);
                if (rows.length === 0) return null;
                const playable = rows.filter((c) => c.src).map((c) => ({ id: c.id, src: c.src! }));
                return (
                  <div key={section} className="mb-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-600">
                        {t(`audioReview.${section}`)} ({rows.length})
                      </h3>
                      {player.playing && playable.some((p) => p.id === player.playing) ? (
                        <button
                          type="button"
                          onClick={player.stop}
                          className="rounded-full bg-rose-100 px-3 text-sm font-semibold text-rose-700"
                        >
                          ■ {t('audioReview.stop')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          data-testid={`play-all-${entry.chapter.id}-${section}`}
                          onClick={() => void player.playList(playable)}
                          disabled={playable.length === 0}
                          className="rounded-full bg-sky-500 px-3 text-sm font-semibold text-white disabled:opacity-40"
                        >
                          ▶ {t('audioReview.playAll')}
                        </button>
                      )}
                    </div>
                    {/* grid-cols-1 = minmax(0,1fr): long notes can't stretch rows off-screen */}
                    <ul className="grid grid-cols-1 gap-2">
                      {rows.map((c) => (
                        <ClipRow
                          key={c.id}
                          clip={c}
                          active={player.playing === c.id}
                          flagged={!!flags[c.id]}
                          onPlay={() =>
                            void player.playList(c.src ? [{ id: c.id, src: c.src }] : [])
                          }
                          onFlag={() => toggle(c.id)}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>
          );
        })}

        <section className="rounded-2xl bg-white p-4 shadow-sm" aria-live="polite">
          <h2 className="mb-2 font-bold" id="flagged-heading" data-testid="flagged-title">
            {t('audioReview.flagged', { n: flagged.length })}
          </h2>
          {flagged.length === 0 ? (
            <p className="text-slate-500">{t('audioReview.none')}</p>
          ) : (
            <>
              <textarea
                readOnly
                value={flaggedText}
                rows={Math.min(10, flagged.length + 1)}
                className="w-full rounded-xl border border-slate-200 p-2 text-sm"
                aria-labelledby="flagged-heading"
                data-testid="flagged-text"
              />
              <button
                type="button"
                onClick={() => void copy()}
                className="mt-2 rounded-full bg-amber-500 px-4 font-semibold text-white"
              >
                {copied ? t('audioReview.copied') : t('audioReview.copy')}
              </button>
            </>
          )}
        </section>
      </Page>
    </>
  );
}

function ClipRow({
  clip,
  active,
  flagged,
  onPlay,
  onFlag,
}: {
  clip: Clip;
  active: boolean;
  flagged: boolean;
  onPlay: () => void;
  onFlag: () => void;
}) {
  const { t } = useTranslation();
  return (
    <li
      className={`flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm ${active ? 'ring-4 ring-sky-300' : ''} ${flagged ? 'bg-amber-50' : ''}`}
      data-testid="clip"
      data-clip={clip.id}
    >
      <button
        type="button"
        onClick={onPlay}
        disabled={!clip.src}
        aria-label={`${t('audioReview.play')}: ${clip.item.text}`}
        className="shrink-0 rounded-full bg-sky-500 px-3 py-1 text-lg text-white disabled:bg-slate-300"
      >
        ▶
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-lg leading-snug" lang="ms">
          {clip.item.text}
        </p>
        <p className="truncate text-sm text-slate-500">
          {clip.src ? clip.note : <span className="text-rose-600">{t('audioReview.missing')}</span>}
          {clip.note && !clip.src ? ` · ${clip.note}` : ''}
        </p>
      </div>
      <label className="flex shrink-0 flex-col items-center text-xs text-slate-600">
        <input
          type="checkbox"
          checked={flagged}
          onChange={onFlag}
          className="h-6 w-6 accent-amber-500"
          aria-label={`${t('audioReview.flag')}: ${clip.item.text}`}
        />
        {t('audioReview.flag')}
      </label>
    </li>
  );
}
