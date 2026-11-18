/**
 * Koleksi: the child's collection. One postcard per unit (all four stages done) and the
 * Misi reward picture (adventure finished). Locked items show how to earn them.
 * Derived from progress (`engine/collection.ts`), so it is always in sync.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hrefFor } from '../app/router';
import { Dialog, Header, Page, WordImage, useUiLang } from '../components/ui';
import { Icon } from '../components/Icon';
import { MascotSays } from '../components/Mascot';
import {
  findChapter,
  findQuest,
  postcardUrl,
  questImageUrl,
  tracks,
  type ChapterEntry,
} from '../content/loader';
import { collection, type Collectible } from '../engine';
import { useProgress } from '../storage/ProgressProvider';

interface Shown {
  item: Collectible;
  image?: string;
  title: string;
}

export function useCollection(): Collectible[] {
  const { get } = useProgress();
  const units = tracks.flatMap((t) =>
    t.chapters.map((c) => ({ chapterId: c.chapter.id, hasMisi: !!findQuest(c.chapter.id) })),
  );
  return collection(units, get);
}

export function Koleksi() {
  const { t } = useTranslation();
  const lang = useUiLang();
  const items = useCollection();
  const [open, setOpen] = useState<Shown | null>(null);
  const earned = items.filter((i) => i.earned).length;

  function describe(item: Collectible, entry: ChapterEntry): Shown {
    if (item.kind === 'postcard')
      return {
        item,
        image: postcardUrl(entry),
        title: t('koleksi.postcardOf', { title: entry.chapter.title[lang] }),
      };
    const q = findQuest(item.chapterId)!;
    return {
      item,
      image: questImageUrl(entry, q.quest.reward.image),
      title: q.quest.reward.title[lang],
    };
  }

  return (
    <>
      <Header title={t('koleksi.title')} backHref={hrefFor({ name: 'home' })} />
      <Page>
        <MascotSays pose="star" className="mb-4">
          <p className="text-slate-700" data-testid="koleksi-count">
            {t('koleksi.count', { earned, total: items.length })}
          </p>
        </MascotSays>
        {/* One section per school year, so "Unit 1" is never ambiguous. */}
        {tracks.map(({ name, track, chapters }) => {
          const ids = new Set(chapters.map((c) => c.chapter.id));
          const inTrack = items.filter((i) => ids.has(i.chapterId));
          if (inTrack.length === 0) return null;
          return (
            <section key={name} className="mb-6" data-testid={`koleksi-track-${name}`}>
              <h2 className="mb-2 text-lg font-bold">{track.title.bm}</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {inTrack.map((item) => {
                  const entry = findChapter(item.chapterId);
                  if (!entry) return null;
                  const shown = describe(item, entry);
                  const how =
                    item.kind === 'postcard'
                      ? t('koleksi.howPostcard', { n: entry.chapter.unit })
                      : t('koleksi.howMisi', { n: entry.chapter.unit });
                  return (
                    <li key={item.id}>
                      {item.earned ? (
                        <button
                          type="button"
                          data-testid={`koleksi-${item.id}`}
                          data-earned="true"
                          onClick={() => setOpen(shown)}
                          className="flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-2 shadow-sm active:scale-95"
                        >
                          <WordImage src={shown.image} alt={shown.title} className="w-full" />
                          <span className="text-sm font-semibold">{shown.title}</span>
                        </button>
                      ) : (
                        <div
                          data-testid={`koleksi-${item.id}`}
                          data-earned="false"
                          className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-3 text-center"
                        >
                          <Icon
                            name={item.kind === 'postcard' ? 'picture' : 'map'}
                            size={44}
                            className="text-amber-300"
                          />
                          <span className="inline-flex items-start gap-1 text-xs text-slate-500">
                            <Icon name="lock" weight="bold" size={14} className="mt-px" /> {how}
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </Page>
      {open && (
        <Dialog label={open.title} onClose={() => setOpen(null)}>
          <WordImage src={open.image} alt={open.title} className="w-full" />
          <p className="mt-3 text-center text-lg font-bold">{open.title}</p>
        </Dialog>
      )}
    </>
  );
}
