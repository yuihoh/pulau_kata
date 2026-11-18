/**
 * Tangkap Buah (catch the fruit), a mini-game over the Uji questions (Yang's decision,
 * 18 Nov 2026). A prompt stays on top while rambutans carrying BM words fall; the child moves
 * the basket (drag, arrow keys or the two buttons) under the right one. The rules live in
 * `engine/tangkap.ts`; this file draws the orchard and runs the animation loop. Lab prototype
 * at `#/lab/tangkap`; loaded lazily.
 */
import { m } from 'framer-motion';
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { hrefFor } from '../app/router';
import { playSfx } from '../audio/sfx';
import { Icon } from '../components/Icon';
import { Mascot } from '../components/Mascot';
import { Header, useUiLang } from '../components/ui';
import { tracks, type ChapterEntry } from '../content/loader';
import { current } from '../engine';
import {
  TANGKAP,
  advance,
  createTangkap,
  chooseOption,
  moveBasket,
  nudgeBasket,
  roundMsOf,
  showHint,
  summarise,
  timeLeftMs,
  type TangkapState,
} from '../engine/tangkap';
import {
  GameHud,
  GameIntro,
  GameResult,
  PromptCard,
  SceneDecor,
  TimeBar,
  prefersReducedMotion,
  promptKinds,
  sceneArt,
  useAnimationFrame,
} from './miniGameParts';

const art = import.meta.glob<string>('../assets/minigames/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const fruitUrl = art['../assets/minigames/rambutan.webp'];
const basketUrl = art['../assets/minigames/basket.webp'];

/** Sizes in px: the word label hangs under a 56 px fruit; the basket sits on the ground. */
const FRUIT_W = 92;
const FRUIT_H = 88;
/**
 * The basket is drawn 2 × basketHalf of the field width wide (so the picture and the engine's
 * hit-test agree at any width), with the picture's own proportions. `cqw` is 1 % of the
 * orchard's width.
 */
const BASKET_W_CQW = TANGKAP.basketHalf * 2 * 100;
const BASKET_H_CQW = BASKET_W_CQW * (184 / 320);
const BASKET_BOTTOM = 6;
/** Space the basket takes under the fruit's landing point (CSS length). */
const BASKET_AREA = `${BASKET_H_CQW}cqw + ${BASKET_BOTTOM}px`;
/** How far the arrow buttons / keys move the basket (fraction of the field width). */
const NUDGE = 0.1;

const fruitTextSize = (text: string) => {
  const longest = Math.max(...text.split(/\s+/).map((w) => w.length));
  return longest <= 8 ? 'text-base' : longest <= 11 ? 'text-sm' : 'text-xs';
};

const allChapters = () => tracks.flatMap((t) => t.chapters);

type Screen =
  { name: 'intro' } | { name: 'play'; entry: ChapterEntry; relaxed: boolean; seed: number };

export default function TangkapBuah({ chapterId, seed }: { chapterId?: string; seed?: number }) {
  const { t } = useTranslation();
  const chapters = allChapters();
  const [chosen, setChosen] = useState(
    () => chapters.find((c) => c.chapter.id === chapterId) ?? chapters[0],
  );
  const [relaxed, setRelaxed] = useState(prefersReducedMotion);
  const [screen, setScreen] = useState<Screen>({ name: 'intro' });

  if (screen.name === 'play')
    return (
      <TangkapGame
        key={screen.seed}
        entry={screen.entry}
        relaxed={screen.relaxed}
        seed={screen.seed}
        title={t('tangkap.title')}
        backHref={hrefFor({ name: 'home' })}
        renderDone={(s) => (
          <TangkapDone
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
      title={t('tangkap.title')}
      icon="basket"
      intro={t('tangkap.intro')}
      howTo={t('tangkap.howTo')}
      relaxedLabel={t('tangkap.relaxed')}
      chapters={chapters}
      chosen={chosen}
      onChoose={setChosen}
      relaxed={relaxed}
      onRelaxed={setRelaxed}
      onStart={() =>
        chosen && setScreen({ name: 'play', entry: chosen, relaxed, seed: seed ?? Date.now() })
      }
    />
  );
}

/** One round in the orchard. `onFinish` lets a stage save the result; `renderDone` draws it. */
export function TangkapGame({
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
  onFinish?: (s: TangkapState) => void;
  renderDone: (s: TangkapState) => ReactNode;
}) {
  const { t } = useTranslation();
  const [s, setS] = useState<TangkapState>(() =>
    createTangkap(entry.chapter, { seed, relaxed, kinds: promptKinds(entry) }),
  );
  const [paused, setPaused] = useState(false);
  const playing = s.phase !== 'finished' && !paused;

  useAnimationFrame(playing, (dt) => setS((prev) => advance(prev, dt)));

  // A chime for the right fruit, a soft boop for a wrong one.
  useEffect(() => {
    if (s.answered > 0) playSfx('correct');
  }, [s.answered]);
  useEffect(() => {
    if (s.wrongCatches > 0) playSfx('wrong');
  }, [s.wrongCatches]);

  // Report the finished round exactly once.
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

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') setS((p) => nudgeBasket(p, -NUDGE));
      else if (e.key === 'ArrowRight' || e.key === 'd') setS((p) => nudgeBasket(p, NUDGE));
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing]);

  if (s.phase === 'finished') return <>{renderDone(s)}</>;

  const q = current(s.queue);
  // While the answer card shows, the prompt stays on the word just caught (the queue has moved on).
  const shownId = s.phase === 'resolving' && s.last ? s.last.wordId : q?.wordId;
  const word = shownId && entry.chapter.words.find((w) => w.id === shownId);

  return (
    <div className="sampan-scene relative flex min-h-dvh flex-col" data-testid="tangkap-scene">
      <SceneDecor />
      <Header title={title} backHref={backHref} sign />
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-2 px-3 pb-4">
        <GameHud
          score={s.score}
          combo={s.combo}
          paused={paused}
          onPause={() => setPaused((p) => !p)}
        >
          <TimeBar leftMs={timeLeftMs(s)} totalMs={roundMsOf(s)} />
        </GameHud>
        {word ? (
          <PromptCard entry={entry} word={word} kind={s.promptKind} audioKey={shownId!} />
        ) : (
          <div className="h-28" />
        )}
        {q && s.phase === 'playing' && (
          <div
            className="sr-only focus-within:not-sr-only focus-within:flex focus-within:flex-wrap focus-within:justify-center focus-within:gap-2 focus-within:rounded-2xl focus-within:bg-white/95 focus-within:p-2 focus-within:shadow"
            role="group"
            aria-label={t('tangkap.chooseWord')}
            data-testid="tangkap-choices"
          >
            {q.options.map((o) => (
              <button
                key={o.id}
                type="button"
                lang="ms"
                data-option-id={o.id}
                onClick={() => playing && setS((p) => chooseOption(p, o.id))}
                className="min-h-11 rounded-full border-b-4 border-blue-800 bg-blue-600 px-4 font-bold text-white"
              >
                {o.text}
              </button>
            ))}
          </div>
        )}
        <Orchard
          entry={entry}
          s={s}
          paused={paused}
          onMove={(x) => playing && setS((p) => moveBasket(p, x))}
        />
        <div className="flex justify-between gap-3">
          <MoveButton
            label={t('tangkap.moveLeft')}
            onClick={() => playing && setS((p) => nudgeBasket(p, -NUDGE))}
          >
            <Icon name="left" weight="bold" size={32} />
          </MoveButton>
          <MoveButton
            label={t('tangkap.moveRight')}
            onClick={() => playing && setS((p) => nudgeBasket(p, NUDGE))}
          >
            <Icon name="right" weight="bold" size={32} />
          </MoveButton>
        </div>
      </main>
    </div>
  );
}

function MoveButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex h-14 flex-1 items-center justify-center overflow-hidden rounded-full border-b-4 border-blue-800 bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-md ring-2 ring-white active:translate-y-0.5 active:border-b-2"
    >
      <span className="absolute inset-x-6 top-1 h-3 rounded-full bg-white/35" aria-hidden />
      <span className="relative">{children}</span>
    </button>
  );
}

function Orchard({
  entry,
  s,
  paused,
  onMove,
}: {
  entry: ChapterEntry;
  s: TangkapState;
  paused: boolean;
  onMove: (x: number) => void;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const q = current(s.queue);
  const answerWord = s.last && entry.chapter.words.find((w) => w.id === s.last!.wordId);
  const hint = showHint(s);

  /** The basket follows a finger or the mouse: where the pointer is, in field widths. */
  function follow(e: ReactPointerEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width > 0) onMove((e.clientX - box.left) / box.width);
  }

  return (
    <div
      className="@container relative max-h-[640px] min-h-52 flex-1 touch-none overflow-hidden rounded-3xl border-4 border-lime-200 bg-gradient-to-b from-sky-200 via-lime-100 to-lime-300 shadow-lg ring-2 ring-lime-500/60 select-none"
      data-testid="orchard"
      onPointerDown={(e) => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* a synthetic pointer: nothing to capture */
        }
        follow(e);
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || e.buttons > 0) follow(e);
      }}
    >
      {/* Leaves of the rambutan tree overhead. */}
      {sceneArt.foliage && (
        <>
          <img
            src={sceneArt.foliage}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute -top-6 -right-6 w-28 rotate-180 select-none"
          />
          <img
            src={sceneArt.foliage}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute -top-6 -left-6 w-28 -scale-100 select-none"
          />
        </>
      )}

      {/* Always mounted so screen readers announce each new question and its fruit words. */}
      <p className="sr-only" aria-live="polite" data-testid="tangkap-announce">
        {q && s.phase === 'playing'
          ? [
              t('sampan.question', { n: s.answered + 1 }),
              t(`sampan.ask.${s.promptKind}`),
              t('tangkap.words', { list: q.options.map((o) => o.text).join(', ') }),
            ].join(' ')
          : ''}
      </p>

      {(s.phase === 'playing' ? s.fruits : []).map((f) => {
        const isRight = q && f.optionId === q.answerId;
        return (
          <div
            key={f.id}
            data-testid="fruit"
            data-option-id={f.optionId}
            data-right={isRight ? 'true' : 'false'}
            lang="ms"
            className="pointer-events-none absolute flex flex-col items-center"
            style={{
              width: FRUIT_W,
              height: FRUIT_H,
              left: `${f.x * 100}%`,
              top: `calc(${f.y / TANGKAP.catchY} * (100% - ${FRUIT_H}px - ${BASKET_AREA}))`,
              transform: 'translateX(-50%)',
            }}
          >
            {fruitUrl ? (
              <img
                src={fruitUrl}
                alt=""
                aria-hidden
                draggable={false}
                className={`h-14 w-auto select-none ${hint && isRight ? 'rounded-full bg-yellow-200/80 ring-4 ring-yellow-300 motion-safe:animate-pulse' : ''}`}
              />
            ) : (
              <Icon name="star" weight="fill" size={48} className="text-red-500" />
            )}
            <span
              className={`-mt-1 rounded-full border-2 border-white bg-white/95 px-2 py-0.5 text-center leading-tight font-extrabold whitespace-nowrap text-slate-900 shadow ${fruitTextSize(f.text)} ${hint && isRight ? 'ring-2 ring-yellow-300' : ''}`}
            >
              {f.text}
            </span>
          </div>
        );
      })}

      {/* The basket. */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: `${BASKET_W_CQW}%`,
          aspectRatio: '320 / 184',
          bottom: BASKET_BOTTOM,
          left: `${s.basketX * 100}%`,
          transform: 'translateX(-50%)',
        }}
        data-testid="basket"
        data-x={s.basketX.toFixed(3)}
        role="img"
        aria-label={t('tangkap.basket')}
      >
        {basketUrl ? (
          <img
            src={basketUrl}
            alt=""
            aria-hidden
            draggable={false}
            className="h-full w-full select-none"
          />
        ) : (
          <Icon name="basket" weight="fill" size={56} className="text-amber-700" />
        )}
      </div>

      {s.wrongFlashMs > 0 && s.phase === 'playing' && (
        <m.div
          key={`wrong-${s.wrongCatches}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute inset-x-4 top-3 z-10 flex items-center justify-center gap-2 rounded-full bg-white/95 p-1 pr-4 shadow-lg"
          role="status"
        >
          <Mascot pose="encourage" size={48} />
          <span className="text-lg font-extrabold text-orange-500">
            {t('tangkap.notThat')}
            {hint && (
              <span className="block text-xs font-semibold text-slate-600">
                {t('tangkap.hint')}
              </span>
            )}
          </span>
        </m.div>
      )}

      {s.phase === 'resolving' && s.last && (
        <m.div
          key={`caught-${s.answered}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-2 top-[10%] z-10 text-center"
          role="status"
        >
          <p className="text-4xl font-extrabold text-emerald-500 [text-shadow:0_3px_0_#fff,0_0_10px_#fff]">
            {t('uji.correct')}
          </p>
          <div className="mt-1 flex items-center gap-2 rounded-3xl border-2 border-amber-200 bg-white/95 p-2 pr-3 text-left shadow-lg">
            <Mascot pose="cheer" size={68} />
            <div className="flex-1 text-center">
              <strong
                lang="ms"
                className="inline-block rounded-full bg-emerald-100 px-3 text-xl text-emerald-700"
              >
                {answerWord?.word}
              </strong>
              <p className="text-xs leading-tight text-slate-500" lang={lang}>
                {answerWord?.meaning[lang]}
              </p>
              {s.last.clean && (
                <p className="text-xl font-extrabold text-amber-700">
                  +{10 * Math.min(s.combo, 5)}
                </p>
              )}
            </div>
          </div>
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

function TangkapDone({
  entry,
  s,
  onAgain,
  onChangeUnit,
}: {
  entry: ChapterEntry;
  s: TangkapState;
  onAgain: () => void;
  onChangeUnit: () => void;
}) {
  const { t } = useTranslation();
  const sum = summarise(s, entry.chapter);
  return (
    <GameResult
      title={t('tangkap.title')}
      icon="basket"
      stars={sum.stars}
      entry={entry}
      testId="tangkap-result"
      practise={sum.practise}
      onAgain={onAgain}
      onChangeUnit={onChangeUnit}
      lines={
        <>
          <p>{t('tangkap.result', { correct: sum.correctFirstTry, total: sum.total })}</p>
          <p className="inline-flex items-center gap-1 text-slate-600">
            <Icon name="star" weight="fill" className="text-amber-400" /> {sum.score} ·{' '}
            {t('sampan.bestCombo', { count: sum.bestCombo })}
          </p>
        </>
      }
    />
  );
}
