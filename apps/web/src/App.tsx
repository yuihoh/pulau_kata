import { domAnimation, LazyMotion, m, MotionConfig } from 'framer-motion';
import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { music, type MusicTrack } from './audio/music';
import { LAB_MODE } from './app/flags';
import { hrefFor, useRoute, type Route } from './app/router';
import { Header, Page, PrimaryButton } from './components/ui';
import { Mascot } from './components/Mascot';
import { findChapter } from './content/loader';
import { canOpenMisi, completeMisi, isCompleted, isUnlocked } from './engine';
import { ChapterScreen, PLAYABLE } from './screens/ChapterScreen';
import { Home } from './screens/Home';
import { Koleksi } from './screens/Koleksi';
import { Bina } from './stages/Bina';
import { Kenali } from './stages/Kenali';
import { Uji } from './stages/Uji';
import { useProgress } from './storage/ProgressProvider';

// Games load on demand so the main bundle stays small.
const SampanKata = lazy(() => import('./games/SampanKata'));
const CabaranAkhir = lazy(() => import('./stages/CabaranAkhir'));
const Misi = lazy(() => import('./games/Misi'));
const TangkapBuah = lazy(() => import('./games/TangkapBuah'));
const PecahBelon = lazy(() => import('./games/PecahBelon'));
const AudioReview = lazy(() => import('./games/AudioReview'));

/**
 * Background music per screen. Uji and Bina are concentration tasks (and Bina has typing),
 * so they stay quiet (docs/music-brief.md).
 */
export function musicFor(route: Route): MusicTrack | null {
  switch (route.name) {
    case 'home':
    case 'chapter':
    case 'koleksi':
      return 'home';
    case 'lab':
      // The voice review page stays quiet so the clips can be heard clearly.
      return route.game === 'misi' ? 'misi' : route.game === 'audio' ? null : 'sampan';
    case 'stage':
      return route.stage === 'kenali' ? 'home' : route.stage === 'cabaran' ? 'sampan' : null;
  }
}

export function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      {/* Movement follows the phone's "reduce motion" setting. */}
      <MotionConfig reducedMotion="user">
        <ScreenFade />
      </MotionConfig>
    </LazyMotion>
  );
}

/**
 * Each new screen fades in. Opacity only: a transform on this wrapper would move the
 * position:fixed game overlays while it runs.
 */
function ScreenFade() {
  const route = useRoute();
  return (
    <m.div
      key={JSON.stringify(route)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      <Routes />
    </m.div>
  );
}

function Routes() {
  const route = useRoute();
  const { ready, get, save } = useProgress();
  const { t } = useTranslation();
  const track = musicFor(route);
  useEffect(() => music.setTrack(track), [track]);

  const loading = <p className="p-8 text-center text-slate-500">{t('common.loading')}</p>;
  if (!ready) return loading;
  if (route.name === 'home') return <Home />;
  if (route.name === 'koleksi') return <Koleksi />;

  if (route.name === 'lab' && route.game === 'misi' && route.chapterId) {
    // A unit's Misi opens only after its Uji (lab mode skips this for prototype testing).
    const unit = findChapter(route.chapterId);
    if (unit) {
      const ujiDone = isCompleted(get(unit.chapter.id), 'uji');
      if (!canOpenMisi(ujiDone, LAB_MODE)) return <ChapterScreen entry={unit} />;
      return (
        <Suspense fallback={loading}>
          <Misi
            key={unit.chapter.id}
            chapterId={unit.chapter.id}
            // Saved only once it counts (Uji done); lab play before that is just practice.
            onComplete={
              ujiDone ? (stars) => save(completeMisi(get(unit.chapter.id), stars)) : undefined
            }
          />
        </Suspense>
      );
    }
  }
  if (route.name === 'lab' && route.game === 'audio')
    return (
      <Suspense fallback={loading}>
        {/* Keyed by unit: switching units must not leave the old playlist running. */}
        <AudioReview key={route.chapterId ?? ''} chapterId={route.chapterId} />
      </Suspense>
    );
  if (route.name === 'lab')
    return (
      <Suspense fallback={loading}>
        {route.game === 'misi' ? (
          <Misi key={route.chapterId ?? ''} chapterId={route.chapterId} />
        ) : route.game === 'tangkap' ? (
          <TangkapBuah chapterId={route.chapterId} />
        ) : route.game === 'belon' ? (
          <PecahBelon chapterId={route.chapterId} />
        ) : (
          <SampanKata chapterId={route.chapterId} />
        )}
      </Suspense>
    );

  const entry = findChapter(route.chapterId);
  if (!entry) return <NotFound />;
  if (route.name === 'chapter') return <ChapterScreen entry={entry} />;

  // Locked or not-yet-built stages fall back to the chapter overview.
  const progress = get(entry.chapter.id);
  if (!isUnlocked(progress, route.stage) || !PLAYABLE.includes(route.stage))
    return <ChapterScreen entry={entry} />;

  switch (route.stage) {
    case 'kenali':
      return <Kenali key={entry.chapter.id} entry={entry} />;
    case 'uji':
      return <Uji key={entry.chapter.id} entry={entry} />;
    case 'bina':
      return <Bina key={entry.chapter.id} entry={entry} />;
    case 'cabaran':
      return (
        <Suspense fallback={loading}>
          <CabaranAkhir key={entry.chapter.id} entry={entry} />
        </Suspense>
      );
  }
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <>
      <Header title={t('app.title')} backHref={hrefFor({ name: 'home' })} />
      <Page>
        <div className="my-6 flex flex-col items-center gap-2 text-center">
          <Mascot pose="sleep" size={120} />
          <p>{t('home.notFound')}</p>
        </div>
        <div className="text-center">
          <PrimaryButton href={hrefFor({ name: 'home' })}>{t('common.back')}</PrimaryButton>
        </div>
      </Page>
    </>
  );
}
