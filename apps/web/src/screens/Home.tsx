/**
 * Home (G-3): each school year is a map. Every Tema is an illustrated landscape with its units
 * as stops on a winding path; the hornbill stands at the next unit to play. Units are never
 * locked: the path shows the suggested order, a child may start anywhere.
 */
import { useTranslation } from 'react-i18next';
import { temaMapUrl, tracks, unitIconUrl } from '../content/loader';
import { chapterStars, nextStage, STAGES } from '../engine';
import { LAB_MODE } from '../app/flags';
import { useCollection } from './Koleksi';
import { hrefFor } from '../app/router';
import { Header, Page, useUiLang } from '../components/ui';
import { Icon } from '../components/Icon';
import { temaColour } from '../components/tema';
import { TrailMap, type TrailStop } from '../components/TrailMap';
import { Ribbon, UnitCard, UnitMarker, WoodSign } from '../components/HomeParts';
import { useProgress } from '../storage/ProgressProvider';

const SHOW_LAB = LAB_MODE;

export function Home() {
  const { t } = useTranslation();
  const lang = useUiLang();
  const { get } = useProgress();
  const collected = useCollection();
  const maxStars = STAGES.length * 3;

  return (
    <>
      <Header title={t('app.title')} />
      <Page>
        <p className="mb-3 text-center text-slate-600">{t('app.tagline')}</p>
        <a
          href={hrefFor({ name: 'koleksi' })}
          className="mb-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 font-semibold text-amber-800 shadow-sm active:scale-[0.98]"
          data-testid="koleksi-link"
        >
          <Icon name="bag" weight="fill" className="text-rose-500" size={24} />
          {t('koleksi.home', {
            earned: collected.filter((c) => c.earned).length,
            total: collected.length,
          })}
        </a>

        {tracks.map(({ name, track, chapters }) => {
          // The guide stands at the first unit (in path order) that is not finished yet.
          const nextId = chapters.find((c) => nextStage(get(c.chapter.id)) !== null)?.chapter.id;
          return (
            <section key={name} className="mb-8" data-testid={`map-${name}`}>
              {track.tema.map((tema) => {
                const inTema = chapters.filter((c) => c.chapter.tema === tema.tema);
                if (inTema.length === 0) return null;
                const colour = temaColour(tema.tema);
                const bg = temaMapUrl(name, tema.tema);
                const stops: TrailStop[] = inTema.map((entry, idx) => {
                  const { chapter } = entry;
                  const p = get(chapter.id);
                  const done = nextStage(p) === null;
                  const href = hrefFor({ name: 'chapter', chapterId: chapter.id });
                  return {
                    key: chapter.id,
                    wrap: (children) => (
                      <a
                        href={href}
                        className="block w-full active:scale-[0.98]"
                        data-testid={`unit-stop-${chapter.id}`}
                      >
                        {children}
                      </a>
                    ),
                    marker: (
                      <UnitMarker
                        n={chapter.unit}
                        done={done}
                        current={chapter.id === nextId}
                        doneLabel={t('home.unitDone')}
                      />
                    ),
                    label: (
                      <UnitCard
                        index={idx}
                        icon={unitIconUrl(entry)}
                        unitLabel={t('home.unit', { n: chapter.unit })}
                        title={chapter.title.bm}
                        subtitle={chapter.title[lang]}
                        starsId={`chapter-stars-${chapter.id}`}
                        stars={
                          <>
                            <Icon name="star" weight="fill" className="text-amber-400" />
                            {chapterStars(p)} / {maxStars}
                          </>
                        }
                      />
                    ),
                  };
                });
                const current = inTema.findIndex((c) => c.chapter.id === nextId);
                return (
                  <div
                    key={tema.tema}
                    className={`relative mb-4 overflow-hidden rounded-3xl bg-cover bg-center shadow-sm ${colour.soft}`}
                    style={bg ? { backgroundImage: `url(${bg})` } : undefined}
                    data-testid={`tema-${name}-${tema.tema}`}
                  >
                    <div className="flex flex-col items-center gap-2 px-3 pt-3">
                      {/* The year sign hangs once, over the first Tema of the year. */}
                      {tema.tema === track.tema[0]?.tema && (
                        <div className="w-full">
                          <WoodSign title={track.title.bm} />
                        </div>
                      )}
                      <Ribbon>
                        {t('home.tema', { n: tema.tema })} · {tema.title.bm}
                      </Ribbon>
                    </div>
                    <TrailMap
                      stops={stops}
                      current={current}
                      left={24}
                      right={76}
                      marker={76}
                      spacing={136}
                    />
                  </div>
                );
              })}
            </section>
          );
        })}

        {SHOW_LAB && (
          <nav
            className="mt-2 flex flex-wrap justify-center gap-2 border-t border-dashed border-slate-300 pt-4"
            aria-label={t('home.labTitle')}
          >
            <a
              href={hrefFor({ name: 'lab', game: 'sampan' })}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border-2 border-dashed border-sky-400 bg-sky-50 px-3 text-sm font-semibold text-sky-800"
              data-testid="lab-sampan"
            >
              <Icon name="lab" /> {t('home.lab')}
            </a>
            <a
              href={hrefFor({ name: 'lab', game: 'tangkap' })}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border-2 border-dashed border-lime-500 bg-lime-50 px-3 text-sm font-semibold text-lime-800"
              data-testid="lab-tangkap"
            >
              <Icon name="lab" /> {t('home.labTangkap')}
            </a>
            <a
              href={hrefFor({ name: 'lab', game: 'belon' })}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border-2 border-dashed border-rose-400 bg-rose-50 px-3 text-sm font-semibold text-rose-800"
              data-testid="lab-belon"
            >
              <Icon name="lab" /> {t('home.labBelon')}
            </a>
            <a
              href={hrefFor({ name: 'lab', game: 'misi', chapterId: 't3-u02' })}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border-2 border-dashed border-emerald-400 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800"
              data-testid="lab-misi"
            >
              <Icon name="lab" /> {t('home.labMisi')}
            </a>
            <a
              href={hrefFor({ name: 'lab', game: 'audio' })}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border-2 border-dashed border-violet-400 bg-violet-50 px-3 text-sm font-semibold text-violet-800"
              data-testid="lab-audio"
            >
              <Icon name="lab" /> {t('home.labAudio')}
            </a>
          </nav>
        )}
      </Page>
    </>
  );
}
