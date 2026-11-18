import { useTranslation } from 'react-i18next';
import { hrefFor } from '../app/router';
import { findQuest, type ChapterEntry } from '../content/loader';
import { isCompleted, isUnlocked, nextStage, STAGES, type StageId } from '../engine';
import { Header, Page, Stars, useUiLang } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { temaColour } from '../components/tema';
import { TrailMap } from '../components/TrailMap';
import { useProgress } from '../storage/ProgressProvider';

/** Stages that have a playable screen so far. The rest show "coming soon". */
export const PLAYABLE: readonly StageId[] = ['kenali', 'uji', 'bina', 'cabaran'];

const STAGE_NAME: Record<StageId, string> = {
  kenali: 'Kenali',
  uji: 'Uji',
  bina: 'Bina',
  cabaran: 'Cabaran Akhir',
};
const STAGE_ICON: Record<StageId, IconName> = {
  kenali: 'book',
  uji: 'pencil',
  bina: 'blocks',
  cabaran: 'trophy',
};
export const stageName = (s: StageId) => STAGE_NAME[s];

/** A round badge with the stage's icon, or a padlock while it is locked. */
function StageBadge({
  icon,
  unlocked,
  tone,
  className = 'h-14 w-14',
}: {
  icon: IconName;
  unlocked: boolean;
  tone: string;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${className} ${unlocked ? `${tone} text-white shadow` : 'bg-slate-200 text-slate-400'}`}
      data-locked={unlocked ? undefined : 'true'}
    >
      <Icon name={unlocked ? icon : 'lock'} weight={unlocked ? 'fill' : 'bold'} size={28} />
    </span>
  );
}

/** The unit's optional story adventure (if it has one), unlocked after Uji. */
function MisiCard({ chapterId, unlocked }: { chapterId: string; unlocked: boolean }) {
  const { t } = useTranslation();
  const q = findQuest(chapterId);
  if (!q) return null;
  const body = (
    <>
      <StageBadge icon="map" unlocked={unlocked} tone="bg-emerald-500" />
      <span className="flex flex-1 flex-col">
        <span className="text-lg font-bold">
          {t('misi.label')}: <span lang="ms">{q.quest.title.bm}</span>
        </span>
        <span className="text-sm text-slate-500">
          {unlocked ? t('misi.optional') : t('misi.locked')}
        </span>
      </span>
    </>
  );
  const cls =
    'mt-3 flex min-h-20 items-center gap-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-4';
  return unlocked ? (
    <a
      href={hrefFor({ name: 'lab', game: 'misi', chapterId })}
      className={`${cls} active:scale-[0.98]`}
      data-testid="misi-card"
    >
      {body}
    </a>
  ) : (
    <div className={`${cls} opacity-60`} aria-disabled="true" data-testid="misi-card">
      {body}
    </div>
  );
}

export function ChapterScreen({ entry }: { entry: ChapterEntry }) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const { get } = useProgress();
  const { chapter } = entry;
  const progress = get(chapter.id);
  const colour = temaColour(chapter.tema);

  return (
    <>
      <Header title={chapter.title.bm} backHref={hrefFor({ name: 'home' })} />
      <Page>
        <p className="mb-4 text-center">
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${colour.soft} ${colour.text}`}
          >
            {t('home.unit', { n: chapter.unit })} · {chapter.title[lang]}
          </span>
        </p>
        {/* The four stages as stepping stones; the hornbill waits at the next one. */}
        <div className={`overflow-hidden rounded-3xl ${colour.soft}`}>
          <TrailMap
            spacing={118}
            current={(() => {
              const next = nextStage(progress);
              return next && isUnlocked(progress, next) ? STAGES.indexOf(next) : -1;
            })()}
            stops={STAGES.map((stage, i) => {
              const unlocked = isUnlocked(progress, stage);
              const playable = PLAYABLE.includes(stage);
              const stars = progress.stages[stage].stars;
              return {
                key: stage,
                marker: (
                  <StageBadge
                    icon={STAGE_ICON[stage]}
                    unlocked={unlocked}
                    tone={colour.solid}
                    className="h-full w-full border-4 border-white shadow-lg"
                  />
                ),
                label: (
                  <span
                    className={`flex flex-col rounded-2xl bg-white/95 px-3 py-2 shadow ${unlocked ? '' : 'opacity-70'}`}
                  >
                    <span className="leading-tight font-bold">
                      {i < 3 ? `${i + 1}. ` : ''}
                      {stageName(stage)}
                    </span>
                    <span className="text-sm leading-tight text-slate-500">
                      {!unlocked
                        ? t('stage.locked')
                        : !playable
                          ? t('stage.comingSoon')
                          : t(`stage.${stage}`)}
                    </span>
                    <Stars count={stars} size="sm" />
                  </span>
                ),
                wrap: (children) =>
                  unlocked && playable ? (
                    <a
                      href={hrefFor({ name: 'stage', chapterId: chapter.id, stage })}
                      className="block w-full active:scale-[0.98]"
                      data-testid={`stage-${stage}`}
                    >
                      {children}
                    </a>
                  ) : (
                    <div
                      className="block w-full"
                      aria-disabled="true"
                      data-testid={`stage-${stage}`}
                    >
                      {children}
                    </div>
                  ),
              };
            })}
          />
        </div>
        <MisiCard chapterId={chapter.id} unlocked={isCompleted(progress, 'uji')} />
      </Page>
    </>
  );
}
