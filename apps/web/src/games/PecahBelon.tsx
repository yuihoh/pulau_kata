/**
 * Pecah Belon (pop the balloons), a mini-game that practises WORD CLASS (Yang's decision,
 * 18 Nov 2026). A round names a class ("Pop every kata kerja!") and balloons carrying the
 * unit's words float up; the child taps the right ones. The rules live in `engine/belon.ts`;
 * this file draws the balloons and runs the animation loop. Lab prototype at `#/lab/belon`;
 * loaded lazily.
 */
import { m } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { hrefFor } from '../app/router';
import { playSfx } from '../audio/sfx';
import { StarBurst } from '../components/celebrate';
import { Icon } from '../components/Icon';
import { Mascot } from '../components/Mascot';
import { Header } from '../components/ui';
import { tracks, type ChapterEntry } from '../content/loader';
import {
  advance,
  balloonColour,
  canPlayBelon,
  createBelon,
  pop,
  summarise,
  targetsLeft,
  type BelonState,
  type WordClass,
} from '../engine/belon';
import {
  GameHud,
  GameIntro,
  GameResult,
  SceneDecor,
  prefersReducedMotion,
  sceneArt,
  useAnimationFrame,
} from './miniGameParts';

/**
 * Balloon colours: the Tailwind gradient and knot, plus the two hex ends of that gradient (a
 * test checks that white text on the middle of each gradient has at least 4.5 : 1 contrast).
 */
export const COLOURS = [
  { body: 'from-rose-500 to-rose-700', knot: 'border-b-rose-700', ends: ['#f43f5e', '#be123c'] },
  { body: 'from-sky-600 to-sky-800', knot: 'border-b-sky-800', ends: ['#0284c7', '#075985'] },
  {
    body: 'from-orange-600 to-orange-800',
    knot: 'border-b-orange-800',
    ends: ['#ea580c', '#9a3412'],
  },
  {
    body: 'from-emerald-600 to-emerald-800',
    knot: 'border-b-emerald-800',
    ends: ['#059669', '#065f46'],
  },
  {
    body: 'from-violet-500 to-violet-700',
    knot: 'border-b-violet-700',
    ends: ['#8b5cf6', '#6d28d9'],
  },
] as const;

/** A balloon with its knot and string: 112 px of body, a 9 px knot and a 36 px string. */
const BALLOON_W = 112;
const BALLOON_H = 157;

const balloonText = (text: string) => {
  const longest = Math.max(...text.split(/\s+/).map((w) => w.length));
  return longest <= 7 ? 'text-lg' : longest <= 10 ? 'text-base' : 'text-[14px]';
};

const allChapters = () => tracks.flatMap((t) => t.chapters);

type Screen =
  { name: 'intro' } | { name: 'play'; entry: ChapterEntry; relaxed: boolean; seed: number };

export default function PecahBelon({ chapterId, seed }: { chapterId?: string; seed?: number }) {
  const { t } = useTranslation();
  const chapters = allChapters();
  const [chosen, setChosen] = useState(
    () => chapters.find((c) => c.chapter.id === chapterId) ?? chapters[0],
  );
  const [relaxed, setRelaxed] = useState(prefersReducedMotion);
  const [screen, setScreen] = useState<Screen>({ name: 'intro' });

  if (screen.name === 'play')
    return (
      <BelonGame
        key={screen.seed}
        entry={screen.entry}
        relaxed={screen.relaxed}
        seed={screen.seed}
        title={t('belon.title')}
        backHref={hrefFor({ name: 'home' })}
        renderDone={(s) => (
          <BelonDone
            entry={screen.entry}
            s={s}
            onAgain={() => setScreen({ ...screen, seed: screen.seed + 1 })}
            onChangeUnit={() => setScreen({ name: 'intro' })}
          />
        )}
      />
    );

  return (
    <GameIntro
      title={t('belon.title')}
      icon="balloon"
      intro={t('belon.intro')}
      howTo={t('belon.howTo')}
      relaxedLabel={t('belon.relaxed')}
      chapters={chapters}
      chosen={chosen}
      onChoose={setChosen}
      relaxed={relaxed}
      onRelaxed={setRelaxed}
      canPlay={(c) => canPlayBelon(c.chapter)}
      cannotPlayText={t('belon.none')}
      onStart={() =>
        chosen && setScreen({ name: 'play', entry: chosen, relaxed, seed: seed ?? Date.now() })
      }
    />
  );
}

/** "kata kerja (verb)" in the child's language. */
function useClassLabel() {
  const { t } = useTranslation();
  return (c: WordClass) => `${c} (${t(`wordClass.${c}`)})`;
}

/** One game: a few rounds of balloons. `onFinish` lets a stage save the result. */
export function BelonGame({
  entry,
  relaxed,
  seed,
  title,
  backHref,
  onFinish,
  renderDone,
}: {
  entry: ChapterEntry;
  relaxed: boolean;
  seed: number;
  title: string;
  backHref: string;
  onFinish?: (s: BelonState) => void;
  renderDone: (s: BelonState) => ReactNode;
}) {
  const { t } = useTranslation();
  const classLabel = useClassLabel();
  const [s, setS] = useState<BelonState>(() => createBelon(entry.chapter, { seed, relaxed }));
  const [paused, setPaused] = useState(false);
  const playing = s.phase === 'playing' && !paused;
  // The banner between rounds also counts down, so only a pause stops the loop.
  useAnimationFrame(s.phase !== 'finished' && !paused, (dt) => setS((p) => advance(p, dt)));

  // A chime for a right pop, a soft boop for a wrong one (once per pop).
  const lastN = s.last?.n;
  useEffect(() => {
    if (s.last) playSfx(s.last.ok ? 'correct' : 'wrong');
    // Runs once per pop (keyed by the pop counter).
  }, [lastN]); // eslint-disable-line react-hooks/exhaustive-deps

  // Report the finished game exactly once.
  const finished = useRef(false);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });
  useEffect(() => {
    if (s.phase !== 'finished' || finished.current) return;
    finished.current = true;
    onFinishRef.current?.(s);
  }, [s]);

  // Leaving the app pauses the game.
  useEffect(() => {
    const onHide = () => document.hidden && setPaused(true);
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  if (s.phase === 'finished') return <>{renderDone(s)}</>;

  const round = s.plan[s.round]!;
  const rightPops = s.right.reduce((a, b) => a + b, 0);
  const left = targetsLeft(s);
  const type = classLabel(round.target);

  return (
    <div className="sampan-scene relative flex min-h-dvh flex-col" data-testid="belon-scene">
      <SceneDecor />
      <Header title={title} backHref={backHref} sign />
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-2 px-3 pb-6">
        <GameHud
          score={rightPops}
          combo={s.combo}
          paused={paused}
          onPause={() => setPaused((p) => !p)}
        >
          <div className="flex min-w-0 flex-1 flex-col items-center rounded-2xl bg-white/90 px-2 py-0.5 text-center shadow-sm ring-1 ring-sky-200">
            <span className="text-xs leading-tight text-slate-500" data-testid="belon-round">
              {t('belon.round', { n: s.round + 1, total: s.plan.length })}
            </span>
            <span className="leading-tight font-bold text-sky-800" data-testid="belon-togo">
              {left > 0 ? t('belon.toGo', { count: left }) : t('belon.allPopped')}
            </span>
          </div>
        </GameHud>

        <div
          className="flex h-28 items-center gap-3 rounded-3xl border-2 border-white bg-white/95 px-3 shadow-md ring-1 ring-sky-200"
          data-testid="belon-prompt"
          data-target={round.target}
        >
          <Mascot pose="point" size={84} />
          <p className="flex-1 text-xl leading-tight font-extrabold text-sky-900" lang="ms">
            {t('belon.popEvery', { type })}
          </p>
        </div>

        <Sky
          s={s}
          type={type}
          paused={paused}
          note={
            s.noteLeftMs > 0 && s.last && !s.last.ok ? t('belon.wrongPop', { type }) : undefined
          }
          onPop={(id) => playing && setS((p) => pop(p, id))}
        />
      </main>
    </div>
  );
}

function Sky({
  s,
  type,
  paused,
  note,
  onPop,
}: {
  s: BelonState;
  type: string;
  paused: boolean;
  note?: string;
  onPop: (id: string) => void;
}) {
  const { t } = useTranslation();
  const last = s.last;
  const place = (x: number) =>
    `clamp(${BALLOON_W / 2}px, ${x * 100}%, calc(100% - ${BALLOON_W / 2}px))`;
  // y = 1 puts the balloon completely below the field and y = 0 completely above it.
  const top = (y: number) => `calc(${y} * (100% + ${BALLOON_H}px) - ${BALLOON_H}px)`;

  return (
    <div
      className="relative max-h-[640px] min-h-52 flex-1 overflow-hidden rounded-3xl border-4 border-sky-200 bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100 shadow-lg ring-2 ring-sky-400/70 select-none"
      data-testid="sky"
    >
      {sceneArt.cloud && (
        <>
          <img
            src={sceneArt.cloud}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute top-4 left-3 w-20 opacity-90"
          />
          <img
            src={sceneArt.cloud}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute right-2 bottom-10 w-24 opacity-80"
          />
        </>
      )}

      {/* Always mounted so screen readers hear each new round. */}
      <p className="sr-only" aria-live="polite" data-testid="belon-announce">
        {s.phase === 'intro'
          ? `${t('belon.round', { n: s.round + 1, total: s.plan.length })} ${t('belon.popEvery', { type })}`
          : ''}
      </p>

      {s.balloons.map((b) => {
        const c = COLOURS[balloonColour(b.id, COLOURS.length)]!;
        return (
          <button
            key={b.id}
            type="button"
            data-testid="balloon"
            data-balloon-id={b.id}
            data-word-id={b.wordId}
            data-target={b.isTarget ? 'true' : 'false'}
            aria-label={t('belon.balloonOf', { word: b.text })}
            disabled={paused}
            onClick={() => onPop(b.id)}
            lang="ms"
            className="absolute flex flex-col items-center active:scale-95"
            style={{
              width: BALLOON_W,
              left: place(b.x),
              top: top(b.y),
              transform: 'translateX(-50%)',
            }}
          >
            <span
              className={`relative flex h-[112px] w-[96px] items-center justify-center rounded-[50%_50%_46%_46%/58%_58%_42%_42%] bg-gradient-to-b px-1 text-center leading-tight font-extrabold text-white shadow-lg [text-shadow:0_1px_2px_rgb(0_0_0/0.55)] ${c.body} ${balloonText(b.text)}`}
            >
              <span
                className="absolute top-3 left-3 h-5 w-3 -rotate-[25deg] rounded-full bg-white/50"
                aria-hidden
              />
              {b.text}
            </span>
            <span
              className={`h-0 w-0 border-x-[7px] border-b-[9px] border-x-transparent ${c.knot}`}
              aria-hidden
            />
            <span className="h-9 w-px bg-slate-500/60" aria-hidden />
          </button>
        );
      })}

      {/* A burst where a balloon was just popped. */}
      {last && (
        <span
          key={`burst-${last.n}`}
          className="pointer-events-none absolute"
          style={{ left: place(last.x), top: `calc(${top(last.y)} + 52px)` }}
          aria-hidden
        >
          <span className="relative block h-0 w-0">{last.ok ? <StarBurst /> : null}</span>
        </span>
      )}

      {s.phase === 'intro' && (
        <m.div
          key={`banner-${s.round}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-x-4 top-1/4 z-10 flex flex-col items-center gap-1 rounded-3xl bg-white/95 p-4 text-center shadow-xl"
          data-testid="belon-banner"
        >
          <Mascot pose="wave" size={72} />
          <p className="text-sm font-semibold text-slate-500">
            {t('belon.round', { n: s.round + 1, total: s.plan.length })}
          </p>
          <p className="text-2xl font-extrabold text-sky-900" lang="ms">
            {t('belon.popEvery', { type })}
          </p>
        </m.div>
      )}

      {note && s.phase === 'playing' && (
        <m.div
          key={`note-${last?.n}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute inset-x-4 top-3 z-10 flex items-center justify-center gap-2 rounded-full bg-white/95 p-1 pr-4 shadow-lg"
          role="status"
        >
          <Mascot pose="encourage" size={48} />
          <span className="text-base font-extrabold text-orange-500">{note}</span>
        </m.div>
      )}

      {paused && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-sky-900/50">
          <p className="rounded-2xl bg-white px-6 py-3 text-2xl font-bold">{t('sampan.paused')}</p>
        </div>
      )}
    </div>
  );
}

function BelonDone({
  entry,
  s,
  onAgain,
  onChangeUnit,
}: {
  entry: ChapterEntry;
  s: BelonState;
  onAgain: () => void;
  onChangeUnit: () => void;
}) {
  const { t } = useTranslation();
  const sum = summarise(s);
  return (
    <GameResult
      title={t('belon.title')}
      icon="balloon"
      stars={sum.stars}
      entry={entry}
      testId="belon-result"
      practise={sum.practise}
      onAgain={onAgain}
      onChangeUnit={onChangeUnit}
      lines={
        <>
          <p>{t('belon.result', { points: sum.points, total: sum.total })}</p>
          <p className="inline-flex items-center gap-1 text-slate-600">
            <Icon name="fire" weight="fill" className="text-orange-500" />{' '}
            {t('sampan.bestCombo', { count: sum.bestCombo })}
          </p>
        </>
      }
    />
  );
}
