import { m } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { playSfx } from '../audio/sfx';
import { hrefFor } from '../app/router';
import { STAGES, type StageId, type Stars as StarCount } from '../engine';
import { Header, Page, PrimaryButton, Stars, WordImage, useUiLang } from '../components/ui';
import { findChapter, postcardUrl } from '../content/loader';
import { Confetti } from '../components/celebrate';
import { Icon } from '../components/Icon';
import { Mascot } from '../components/Mascot';
import { PLAYABLE, stageName } from '../screens/ChapterScreen';

export function StageResult({
  chapterId,
  stage,
  stars,
  onReplay,
  unitComplete = false,
  children,
}: {
  chapterId: string;
  stage: StageId;
  stars: StarCount;
  onReplay: () => void;
  /** This result finished the whole unit for the first time: celebrate + show the postcard. */
  unitComplete?: boolean;
  /** Extra content under the stars (e.g. words to practise). */
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const next = STAGES[STAGES.indexOf(stage) + 1];

  useEffect(() => {
    playSfx(unitComplete ? 'complete' : 'star');
  }, [unitComplete]);

  return (
    <>
      <Header title={stageName(stage)} backHref={hrefFor({ name: 'chapter', chapterId })} />
      {stars > 0 && <Confetti />}
      <Page>
        <m.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-8 flex flex-col items-center gap-4 text-center"
          data-testid="stage-result"
        >
          <Mascot pose={unitComplete ? 'star' : 'clap'} size={128} />
          <p className="text-4xl font-extrabold text-amber-600">{t('result.great')}</p>
          <Stars count={stars} size="lg" animate />
          <p className="text-lg">{t('result.stars', { count: stars })}</p>
        </m.div>

        {unitComplete && <UnitComplete chapterId={chapterId} />}
        {children}

        <div className="mt-6 flex flex-col items-center gap-3">
          {next && PLAYABLE.includes(next) && (
            <PrimaryButton href={hrefFor({ name: 'stage', chapterId, stage: next })}>
              {t('result.nextStage', { stage: stageName(next) })}
            </PrimaryButton>
          )}
          {unitComplete && (
            <PrimaryButton href={hrefFor({ name: 'koleksi' })}>{t('koleksi.open')}</PrimaryButton>
          )}
          <PrimaryButton href={hrefFor({ name: 'chapter', chapterId })}>
            {t('result.backToChapter')}
          </PrimaryButton>
          <button type="button" className="min-h-11 text-amber-700 underline" onClick={onReplay}>
            {t('common.playAgain')}
          </button>
        </div>
      </Page>
    </>
  );
}

/** "Unit complete!" with the postcard the child just earned. */
function UnitComplete({ chapterId }: { chapterId: string }) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const entry = findChapter(chapterId);
  if (!entry) return null;
  return (
    <m.section
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="mt-6 flex flex-col items-center gap-2 rounded-3xl bg-emerald-50 p-4 text-center ring-2 ring-emerald-300"
      data-testid="unit-complete"
      role="status"
    >
      <p className="flex items-center gap-2 text-2xl font-extrabold text-emerald-700">
        <Icon name="party" className="text-amber-500" /> {t('result.unitComplete')}
      </p>
      <p>{t('result.postcardEarned')}</p>
      <m.div
        initial={{ rotate: -10, scale: 0.7 }}
        animate={{ rotate: -3, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        className="w-56"
      >
        <WordImage
          src={postcardUrl(entry)}
          alt={t('koleksi.postcardOf', { title: entry.chapter.title[lang] })}
          className="w-full shadow-lg"
        />
      </m.div>
      <p className="font-bold" lang="ms">
        {entry.chapter.title.bm}
      </p>
    </m.section>
  );
}
