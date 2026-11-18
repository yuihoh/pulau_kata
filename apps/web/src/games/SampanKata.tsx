/**
 * Sampan Kata, the boat game. It is the Cabaran Akhir stage (`stages/CabaranAkhir.tsx`
 * saves its stars) and also stays in the lab (`#/lab/sampan`, any unit, nothing saved).
 * The rules live in `engine/sampan.ts`; this file draws the river, runs the animation loop
 * and turns taps, swipes and keys into `steer`. Loaded lazily.
 */
import { m } from 'framer-motion';
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { playSfx } from '../audio/sfx';
import { useTranslation } from 'react-i18next';
import { hrefFor } from '../app/router';
import {
  AudioButton,
  Header,
  Page,
  PrimaryButton,
  Stars,
  WordImage,
  useUiLang,
} from '../components/ui';
import { Confetti } from '../components/celebrate';
import { Icon } from '../components/Icon';
import { Mascot } from '../components/Mascot';
import { audioUrl, imageUrl, tracks, type ChapterEntry } from '../content/loader';
import {
  LANES,
  SAMPAN_DEFAULTS,
  advance,
  createSampan,
  nudge,
  steer,
  summarise,
  timeLeftMs,
  type PromptKind,
  type SampanState,
} from '../engine';

const art = import.meta.glob<string>('../assets/sampan/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const boatUrl = art['../assets/sampan/boat.webp'];
const cloudUrl = art['../assets/sampan/cloud.webp'];
const foliageUrl = art['../assets/sampan/foliage.webp'];

/** The three lanes' buoy colours, as in the mockup: pink, yellow, green. */
const BUOY_TONES = [
  'border-pink-400 bg-gradient-to-b from-pink-100 to-pink-300',
  'border-amber-400 bg-gradient-to-b from-yellow-100 to-yellow-300',
  'border-lime-500 bg-gradient-to-b from-lime-100 to-lime-300',
] as const;

/** Soft waves along the bottom of the river (decoration only). */
function Waves() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full"
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 9 C8 3, 16 3, 25 9 S42 15, 50 9 S67 3, 75 9 S92 15, 100 9 V20 H0 Z"
        fill="white"
        fillOpacity=".35"
      />
      <path
        d="M0 14 C10 9, 18 9, 28 14 S46 19, 55 14 S72 9, 82 14 S94 18, 100 14 V20 H0 Z"
        fill="white"
        fillOpacity=".3"
      />
    </svg>
  );
}

/** Clouds at the top and leaves in the bottom corners of the game page (decoration only). */
function SceneDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {cloudUrl && (
        <>
          <img src={cloudUrl} alt="" className="absolute top-2 -left-4 w-24 opacity-90" />
          <img src={cloudUrl} alt="" className="absolute top-14 -right-5 w-20 opacity-80" />
        </>
      )}
      {foliageUrl && (
        <>
          <img src={foliageUrl} alt="" className="absolute -bottom-3 -left-4 w-32" />
          <img src={foliageUrl} alt="" className="absolute -right-4 -bottom-3 w-32 -scale-x-100" />
        </>
      )}
    </div>
  );
}

const allChapters = () => tracks.flatMap((t) => t.chapters);

/** Prompt kinds the chapter supports: pictures/audio only when every word has them. */
export function promptKinds(entry: ChapterEntry): PromptKind[] {
  const words = entry.chapter.words;
  const kinds: PromptKind[] = ['meaning'];
  if (words.every((w) => imageUrl(entry, w.image))) kinds.push('picture');
  if (words.every((w) => audioUrl(entry, w.audio))) kinds.push('listen');
  return kinds;
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Screen =
  { name: 'intro' } | { name: 'play'; entry: ChapterEntry; relaxed: boolean; seed: number };

export default function SampanKata({
  chapterId,
  seed,
}: {
  chapterId?: string;
  /** Fixed seed for tests. */
  seed?: number;
}) {
  const { t } = useTranslation();
  const chapters = allChapters();
  const [chosen, setChosen] = useState(
    () => chapters.find((c) => c.chapter.id === chapterId) ?? chapters[0],
  );
  const [relaxed, setRelaxed] = useState(prefersReducedMotion);
  const [screen, setScreen] = useState<Screen>({ name: 'intro' });

  if (screen.name === 'play')
    return (
      <SampanGame
        key={screen.seed}
        entry={screen.entry}
        relaxed={screen.relaxed}
        seed={screen.seed}
        title={t('sampan.title')}
        backHref={hrefFor({ name: 'home' })}
        renderDone={(s) => (
          <Done
            entry={screen.entry}
            s={s}
            onAgain={() => setScreen({ ...screen, seed: screen.seed + 1 })}
            onChangeUnit={() => setScreen({ name: 'intro' })}
          />
        )}
      />
    );

  return (
    <Intro
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

function Intro({
  chapters,
  chosen,
  onChoose,
  relaxed,
  onRelaxed,
  onStart,
}: {
  chapters: ChapterEntry[];
  chosen?: ChapterEntry;
  onChoose: (c: ChapterEntry) => void;
  relaxed: boolean;
  onRelaxed: (v: boolean) => void;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  return (
    <>
      <Header title={t('sampan.title')} backHref={hrefFor({ name: 'home' })} />
      <Page>
        <p className="mb-1 text-center text-xs font-semibold tracking-wide text-sky-700 uppercase">
          {t('sampan.prototype')}
        </p>
        <div className="mb-4 flex justify-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <Icon name="boat" weight="duotone" size={60} />
          </span>
        </div>
        <p className="text-center text-lg font-semibold">{t('sampan.intro')}</p>
        <p className="mb-5 text-center text-slate-600">{t('sampan.howTo')}</p>

        <h2 className="mb-2 font-bold">{t('sampan.chooseUnit')}</h2>
        <ul className="mb-4 grid gap-2">
          {chapters.map((c) => {
            const on = c.chapter.id === chosen?.chapter.id;
            return (
              <li key={c.chapter.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  data-testid={`unit-${c.chapter.id}`}
                  onClick={() => onChoose(c)}
                  className={`flex w-full flex-col rounded-2xl p-3 text-left shadow-sm ${on ? 'bg-sky-100 ring-4 ring-sky-400' : 'bg-white'}`}
                >
                  <span className="font-bold">
                    {t('home.unit', { n: c.chapter.unit })} · {c.chapter.title.bm}
                  </span>
                  <span className="text-sm text-slate-500">{c.chapter.title[lang]}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <label className="mb-6 flex min-h-11 items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <input
            type="checkbox"
            className="h-6 w-6 accent-sky-500"
            checked={relaxed}
            onChange={(e) => onRelaxed(e.target.checked)}
          />
          <span>{t('sampan.relaxed')}</span>
        </label>

        <div className="text-center">
          <PrimaryButton onClick={onStart} disabled={!chosen}>
            {t('common.start')} <Icon name="boat" weight="fill" />
          </PrimaryButton>
        </div>
      </Page>
    </>
  );
}

/** Calls `onFrame(ms since last frame)` every animation frame while `active`. */
function useAnimationFrame(active: boolean, onFrame: (dtMs: number) => void) {
  const cb = useRef(onFrame);
  useEffect(() => {
    cb.current = onFrame;
  });
  useEffect(() => {
    if (!active) return;
    let id = 0;
    let last: number | null = null;
    const loop = (now: number) => {
      if (last !== null) cb.current(now - last);
      last = now;
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

/**
 * One round on the river. Used by the lab prototype and by the Cabaran Akhir stage, which
 * passes `onFinish` (to save stars) and `renderDone` (its own result screen).
 */
export function SampanGame({
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
  onFinish?: (s: SampanState) => void;
  renderDone: (s: SampanState) => ReactNode;
}) {
  const { t } = useTranslation();
  const [s, setS] = useState<SampanState>(() =>
    createSampan(entry.chapter, { seed, relaxed, kinds: promptKinds(entry) }),
  );
  const [paused, setPaused] = useState(false);
  const playing = s.phase !== 'finished' && !paused;

  useAnimationFrame(playing, (dt) => setS((prev) => advance(prev, dt)));

  // A splash for a right buoy, a soft boop for a wrong one (once per answer).
  useEffect(() => {
    if (s.answered === 0 || !s.last) return;
    playSfx(s.last.correct ? 'splash' : 'wrong');
  }, [s.answered]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Leaving the app pauses the game; the child taps Resume when back.
  useEffect(() => {
    const onHide = () => document.hidden && setPaused(true);
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') setS((p) => nudge(p, -1));
      else if (e.key === 'ArrowRight' || e.key === 'd') setS((p) => nudge(p, 1));
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing]);

  if (s.phase === 'finished') return <>{renderDone(s)}</>;

  return (
    <div className="sampan-scene relative flex min-h-dvh flex-col" data-testid="sampan-scene">
      <SceneDecor />
      <Header title={title} backHref={backHref} sign />
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-2 px-3 pb-4">
        <Hud s={s} paused={paused} onPause={() => setPaused((p) => !p)} />
        <PromptPanel entry={entry} s={s} />
        <River
          entry={entry}
          s={s}
          paused={paused}
          onSteer={(lane) => playing && setS((p) => steer(p, lane))}
          onNudge={(dir) => playing && setS((p) => nudge(p, dir))}
        />
        <div className="flex justify-between gap-3">
          <SteerButton
            label={t('sampan.left')}
            onClick={() => playing && setS((p) => nudge(p, -1))}
          >
            <Icon name="left" weight="bold" size={32} />
          </SteerButton>
          <SteerButton
            label={t('sampan.right')}
            onClick={() => playing && setS((p) => nudge(p, 1))}
          >
            <Icon name="right" weight="bold" size={32} />
          </SteerButton>
        </div>
      </main>
    </div>
  );
}

function SteerButton({
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

function Hud({ s, paused, onPause }: { s: SampanState; paused: boolean; onPause: () => void }) {
  const { t } = useTranslation();
  const left = timeLeftMs(s);
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex h-12 items-center gap-1 rounded-full bg-white px-3 text-2xl font-extrabold text-amber-600 shadow-md ring-2 ring-amber-200"
        aria-label={t('sampan.score')}
      >
        <Icon name="star" weight="fill" size={30} className="text-amber-400" />{' '}
        <span data-testid="score">{s.score}</span>
      </span>
      {s.combo >= 2 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 text-sm font-bold text-orange-600">
          <Icon name="fire" weight="fill" /> {t('sampan.combo', { count: s.combo })}
        </span>
      )}
      <div
        className="h-5 flex-1 overflow-hidden rounded-full border-2 border-white bg-sky-100 shadow-inner ring-1 ring-sky-300"
        role="progressbar"
        aria-label={t('sampan.timeLeft')}
        aria-valuemin={0}
        aria-valuemax={SAMPAN_DEFAULTS.roundMs / 1000}
        aria-valuenow={Math.ceil(left / 1000)}
      >
        <div
          className="bar-stripes h-full rounded-full"
          style={{ width: `${(left / SAMPAN_DEFAULTS.roundMs) * 100}%` }}
        />
      </div>
      <button
        type="button"
        onClick={onPause}
        aria-label={paused ? t('sampan.resume') : t('sampan.pause')}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border-b-4 border-blue-800 bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-md ring-2 ring-white"
      >
        <Icon name={paused ? 'play' : 'pause'} weight="fill" size={24} />
      </button>
    </div>
  );
}

function PromptPanel({ entry, s }: { entry: ChapterEntry; s: SampanState }) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const wave = s.wave;
  if (!wave) return <div className="h-28" />;
  const word = entry.chapter.words.find((w) => w.id === wave.question.wordId)!;
  const ask = t(`sampan.ask.${wave.promptKind}`);
  return (
    <div
      className="flex h-28 items-center justify-center gap-3 rounded-3xl border-2 border-white bg-white/95 px-3 shadow-md ring-1 ring-sky-200"
      data-testid="sampan-prompt"
      data-word-id={word.id}
      data-kind={wave.promptKind}
    >
      {wave.promptKind === 'picture' && (
        <>
          <WordImage
            src={imageUrl(entry, word.image)}
            alt={word.meaning[lang]}
            className="h-24 w-24"
          />
          <p className="text-slate-600">{ask}</p>
        </>
      )}
      {wave.promptKind === 'meaning' && (
        <p className="text-center">
          <span className="block text-sm text-slate-500">{ask}</span>
          <span className="text-2xl font-extrabold text-sky-800" lang={lang}>
            {word.meaning[lang]}
          </span>
        </p>
      )}
      {wave.promptKind === 'listen' && (
        <>
          <AudioButton
            key={`${word.id}:${s.answered}`}
            src={audioUrl(entry, word.audio)}
            label={t('common.listen')}
            size="lg"
          />
          <span className="h-14 w-px bg-sky-200" aria-hidden />
          <p className="flex-1 text-lg leading-tight font-bold text-sky-900">{ask}</p>
        </>
      )}
    </div>
  );
}

/**
 * Smaller text for long words so a BM word is never broken mid-word (that teaches the wrong
 * spelling). Phrases wrap at their spaces.
 */
function buoyTextSize(text: string): string {
  const longest = Math.max(...text.split(/\s+/).map((w) => w.length));
  if (longest <= 8) return 'text-lg';
  if (longest <= 10) return 'text-base';
  return longest <= 12 ? 'text-sm' : 'text-[13px]';
}

const laneCenter = (lane: number) => `${((lane + 0.5) / LANES) * 100}%`;
/** The boat sits on the bottom of the river: its size and gap (px), and a buoy's height. */
const BOAT_H = 59;
const BOAT_BOTTOM = 10;
const BUOY_H = '3.25rem';

function River({
  entry,
  s,
  paused,
  onSteer,
  onNudge,
}: {
  entry: ChapterEntry;
  s: SampanState;
  paused: boolean;
  onSteer: (lane: number) => void;
  onNudge: (dir: -1 | 1) => void;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const down = useRef<{ x: number; y: number } | null>(null);
  const wave = s.wave;
  const last = s.phase === 'resolving' ? s.last : null;
  const answerWord = last && entry.chapter.words.find((w) => w.id === last.wordId);

  function announce(w: NonNullable<SampanState['wave']>): string {
    const word = entry.chapter.words.find((x) => x.id === w.question.wordId);
    const prompt = w.promptKind === 'listen' ? '' : ` ${word?.meaning[lang] ?? ''}.`;
    return [
      t('sampan.question', { n: s.answered + 1 }),
      `${t(`sampan.ask.${w.promptKind}`)}${prompt}`,
      t('sampan.buoys', { list: w.buoys.map((b) => b.text).join(', ') }),
    ].join(' ');
  }

  // A short move is a tap on a lane; a longer sideways move is a swipe.
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    down.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const start = down.current;
    down.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(e.clientY - start.y)) {
      onNudge(dx > 0 ? 1 : -1);
      return;
    }
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width > 0) onSteer(Math.floor(((e.clientX - box.left) / box.width) * LANES));
  }

  return (
    <div
      className={`river-water relative max-h-[640px] min-h-52 flex-1 touch-none overflow-hidden rounded-3xl border-4 border-sky-200 shadow-lg ring-2 ring-sky-400/70 select-none ${paused ? '' : 'flowing'}`}
      data-testid="river"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (down.current = null)}
    >
      {/* Lane dividers */}
      {Array.from({ length: LANES - 1 }, (_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 border-l-2 border-dashed border-white/30"
          style={{ left: `${((i + 1) / LANES) * 100}%` }}
          aria-hidden
        />
      ))}

      {/* A cloud and sparkles on the water, and waves along the bottom (decoration only). */}
      {cloudUrl && (
        <img
          src={cloudUrl}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute top-1 right-2 w-20 opacity-90 select-none"
        />
      )}
      <Icon
        name="sparkle"
        weight="fill"
        size={22}
        className="pointer-events-none absolute top-3 left-3 text-white/90"
      />
      <Waves />

      {/* Always mounted so screen readers announce each new wave: number, prompt, buoys. */}
      <p className="sr-only" aria-live="polite" data-testid="sampan-announce">
        {wave && !last ? announce(wave) : ''}
      </p>

      {wave?.buoys.map((b) => {
        const isAnswer = b.optionId === wave.question.answerId;
        // The child's recorded answer, not wherever the boat has moved since.
        const hit = last && b.optionId === last.chosenId;
        // Each lane has its own sweet colour (pink, yellow, green); a result overrides it.
        const tone = !last
          ? BUOY_TONES[b.lane % BUOY_TONES.length]
          : isAnswer
            ? 'border-emerald-600 bg-gradient-to-b from-emerald-200 to-emerald-400 ring-4 ring-emerald-300'
            : hit
              ? 'border-amber-500 bg-gradient-to-b from-amber-100 to-amber-300'
              : 'border-slate-300 bg-white/70 opacity-70';
        return (
          <div
            key={`${wave.question.id}:${b.lane}`}
            data-testid="buoy"
            data-lane={b.lane}
            data-option-id={b.optionId}
            data-state={!last ? 'idle' : isAnswer ? 'answer' : hit ? 'chosen' : 'other'}
            lang="ms"
            className={`absolute w-[32%] -translate-x-1/2 flex h-[3.25rem] items-center justify-center rounded-full border-2 px-1 text-center leading-tight font-extrabold text-slate-900 shadow-lg ring-2 ring-white/80 ${buoyTextSize(b.text)} ${tone}`}
            // A buoy ends exactly on the boat's top edge when y = 1, whatever the river's height.
            style={{
              left: laneCenter(b.lane),
              top: `calc(${Math.min(wave.y, 1)} * (100% - ${BOAT_H + BOAT_BOTTOM}px - ${BUOY_H}))`,
            }}
          >
            {b.text}
          </div>
        );
      })}

      {/* The boat */}
      <m.div
        className="absolute w-[100px] transition-[left] duration-150 ease-out"
        style={{ left: laneCenter(s.lane), bottom: BOAT_BOTTOM, height: BOAT_H, x: '-50%' }}
        animate={last && !last.correct ? { rotate: [0, -12, 10, -6, 0] } : { rotate: 0 }}
        transition={{ duration: 0.6 }}
        data-testid="boat"
        data-lane={s.lane}
        aria-label={t('sampan.boatIn', { lane: s.lane + 1 })}
        role="img"
      >
        {/* Foam around the hull, and a splash of stars after a right answer. */}
        <span
          className="absolute inset-x-0 bottom-0 h-3 rounded-full bg-white/70 blur-[2px]"
          aria-hidden
        />
        {boatUrl ? (
          <img
            src={boatUrl}
            alt=""
            aria-hidden
            draggable={false}
            className="relative block w-full select-none"
          />
        ) : (
          <Icon name="boat" weight="fill" size={64} className="relative text-amber-800" />
        )}
        {last?.correct && (
          <>
            <Icon
              name="sparkle"
              weight="fill"
              size={22}
              className="absolute -top-2 -left-3 text-yellow-300 motion-safe:animate-ping"
            />
            <Icon
              name="sparkle"
              weight="fill"
              size={18}
              className="absolute -top-3 -right-3 text-white motion-safe:animate-ping"
            />
          </>
        )}
      </m.div>

      {last && (
        <m.div
          key={s.answered}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-2 top-[10%] z-10 text-center"
          role="status"
        >
          <p
            className={`text-4xl font-extrabold [text-shadow:0_3px_0_#fff,0_0_10px_#fff] ${last.correct ? 'text-emerald-500' : 'text-orange-500'}`}
          >
            {last.correct ? t('uji.correct') : t('uji.tryAgain')}
          </p>
          <div className="mt-1 flex items-center gap-2 rounded-3xl border-2 border-amber-200 bg-white/95 p-2 pr-3 text-left shadow-lg">
            <Mascot pose={last.correct ? 'cheer' : 'encourage'} size={68} />
            {last.correct ? (
              <p className="flex-1 text-center text-2xl font-extrabold text-amber-700">
                +{10 * Math.min(s.combo, 5)}
              </p>
            ) : (
              <div className="flex-1 text-center">
                <p className="text-sm font-semibold text-slate-700">{t('uji.answerIs')}</p>
                <strong
                  lang="ms"
                  className="inline-block rounded-full bg-emerald-100 px-3 text-xl text-emerald-700"
                >
                  {answerWord?.word}
                </strong>
                <p className="text-xs leading-tight text-slate-500" lang={lang}>
                  {answerWord?.meaning[lang]}
                </p>
              </div>
            )}
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

/** "Words to practise" (with meanings), or praise when there are none. */
export function PractiseList({ entry, wordIds }: { entry: ChapterEntry; wordIds: string[] }) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const practise = wordIds
    .map((id) => entry.chapter.words.find((w) => w.id === id))
    .filter((w) => w !== undefined);
  return (
    <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
      {practise.length === 0 ? (
        <p className="text-center font-semibold text-emerald-700">{t('sampan.allRight')}</p>
      ) : (
        <>
          <h2 className="mb-2 font-bold">{t('sampan.practise')}</h2>
          <ul className="grid gap-1" data-testid="practise">
            {practise.map((w) => (
              <li key={w.id} className="flex justify-between gap-3">
                <strong lang="ms">{w.word}</strong>
                <span className="text-right text-slate-600" lang={lang}>
                  {w.meaning[lang]}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Done({
  entry,
  s,
  onAgain,
  onChangeUnit,
}: {
  entry: ChapterEntry;
  s: SampanState;
  onAgain: () => void;
  onChangeUnit: () => void;
}) {
  const { t } = useTranslation();
  const sum = summarise(s, entry.chapter);
  return (
    <>
      <Header title={t('sampan.title')} backHref={hrefFor({ name: 'home' })} />
      <Page>
        <m.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-6 flex flex-col items-center gap-3 text-center"
          data-testid="sampan-result"
        >
          <p className="text-4xl font-extrabold text-amber-600">{t('result.great')}</p>
          <Stars count={sum.stars} size="lg" animate />
          <p className="text-lg">{t('result.stars', { count: sum.stars })}</p>
          <p>{t('sampan.result', { correct: sum.correctFirstTry, total: sum.total })}</p>
          <p className="inline-flex items-center gap-1 text-slate-600">
            <Icon name="star" weight="fill" className="text-amber-400" /> {sum.score} ·{' '}
            {t('sampan.bestCombo', { count: sum.bestCombo })}
          </p>
        </m.div>
        {sum.stars > 0 && <Confetti />}

        <PractiseList entry={entry} wordIds={sum.practise} />

        <div className="mt-6 flex flex-col items-center gap-3">
          <PrimaryButton onClick={onAgain}>
            {t('common.playAgain')} <Icon name="boat" weight="fill" />
          </PrimaryButton>
          <button type="button" className="text-sky-700 underline" onClick={onChangeUnit}>
            {t('sampan.changeUnit')}
          </button>
          <a href={hrefFor({ name: 'home' })} className="min-h-11 py-2 text-slate-600 underline">
            {t('sampan.home')}
          </a>
        </div>
      </Page>
    </>
  );
}
