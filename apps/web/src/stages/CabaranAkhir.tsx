/**
 * ★ Cabaran Akhir (final challenge) = Sampan Kata on this unit's words (Yang's decision,
 * 17 Nov 2026). Unlocked after Bina. Saves its stars; the first time it completes the whole
 * unit, the result celebrates and shows the postcard the child earned. Lazy-loaded with the
 * boat game.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hrefFor } from '../app/router';
import { Header, Page, PrimaryButton } from '../components/ui';
import { Icon } from '../components/Icon';
import type { ChapterEntry } from '../content/loader';
import { completeStage, justCompletedUnit, summarise, type Stars } from '../engine';
import { PractiseList, SampanGame, prefersReducedMotion } from '../games/SampanKata';
import { useProgress } from '../storage/ProgressProvider';
import { StageResult } from './StageResult';

type Screen =
  | { name: 'intro' }
  | { name: 'play'; seed: number }
  | { name: 'done'; stars: Stars; practise: string[]; unitComplete: boolean };

export default function CabaranAkhir({ entry, seed }: { entry: ChapterEntry; seed?: number }) {
  const { t } = useTranslation();
  const { get, save } = useProgress();
  const { chapter } = entry;
  const [relaxed, setRelaxed] = useState(prefersReducedMotion);
  const [screen, setScreen] = useState<Screen>({ name: 'intro' });
  const chapterHref = hrefFor({ name: 'chapter', chapterId: chapter.id });
  const title = t('cabaran.title');

  if (screen.name === 'play')
    return (
      <SampanGame
        key={screen.seed}
        entry={entry}
        relaxed={relaxed}
        seed={screen.seed}
        title={title}
        backHref={chapterHref}
        onFinish={(s) => {
          const sum = summarise(s, chapter);
          const before = get(chapter.id);
          const after = completeStage(before, 'cabaran', sum.stars);
          save(after);
          setScreen({
            name: 'done',
            stars: sum.stars,
            practise: sum.practise,
            unitComplete: justCompletedUnit(before, after),
          });
        }}
        renderDone={() => null}
      />
    );

  if (screen.name === 'done')
    return (
      <StageResult
        chapterId={chapter.id}
        stage="cabaran"
        stars={screen.stars}
        unitComplete={screen.unitComplete}
        onReplay={() => setScreen({ name: 'play', seed: (seed ?? Date.now()) + 1 })}
      >
        <PractiseList entry={entry} wordIds={screen.practise} />
      </StageResult>
    );

  return (
    <>
      <Header title={title} backHref={chapterHref} />
      <Page>
        <div className="mt-4 mb-4 flex justify-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <Icon name="boat" size={60} />
          </span>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-amber-700">{title}</h2>
        <p className="mt-2 text-center text-lg font-semibold">{t('sampan.intro')}</p>
        <p className="mb-5 text-center text-slate-600">{t('sampan.howTo')}</p>
        <label className="mb-6 flex min-h-11 items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <input
            type="checkbox"
            className="h-6 w-6 accent-sky-500"
            checked={relaxed}
            onChange={(e) => setRelaxed(e.target.checked)}
          />
          <span>{t('sampan.relaxed')}</span>
        </label>
        <div className="text-center">
          <PrimaryButton onClick={() => setScreen({ name: 'play', seed: seed ?? Date.now() })}>
            {t('common.start')} <Icon name="boat" weight="fill" />
          </PrimaryButton>
        </div>
      </Page>
    </>
  );
}
