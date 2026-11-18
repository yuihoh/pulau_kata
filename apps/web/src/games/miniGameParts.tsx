/**
 * Pieces shared by the arcade-style games (Sampan Kata, Tangkap Buah, Pecah Belon): the
 * animation-frame loop, the decorated page scene, the question card, the unit chooser and the
 * result screen with "words to practise".
 */
import { m } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { hrefFor } from '../app/router';
import { Confetti } from '../components/celebrate';
import { Icon, type IconName } from '../components/Icon';
import { Mascot } from '../components/Mascot';
import {
  AudioButton,
  Header,
  Page,
  PrimaryButton,
  Stars,
  WordImage,
  useUiLang,
} from '../components/ui';
import { audioUrl, imageUrl, type ChapterEntry } from '../content/loader';
import type { Word } from '../content/schema';
import type { PromptKind, Stars as StarCount } from '../engine';

/** Prompt kinds the chapter supports: pictures/audio only when every word has them. */
export function promptKinds(entry: ChapterEntry): PromptKind[] {
  const words = entry.chapter.words;
  const kinds: PromptKind[] = ['meaning'];
  if (words.every((w) => imageUrl(entry, w.image))) kinds.push('picture');
  if (words.every((w) => audioUrl(entry, w.audio))) kinds.push('listen');
  return kinds;
}

/** True when the phone asks for less motion (games then start in relaxed mode). */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const art = import.meta.glob<string>('../assets/sampan/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
/** Scenery pictures shared by the games (made for Sampan Kata). */
export const sceneArt = {
  cloud: art['../assets/sampan/cloud.webp'],
  foliage: art['../assets/sampan/foliage.webp'],
};

/** Calls `onFrame(ms since last frame)` every animation frame while `active`. */
export function useAnimationFrame(active: boolean, onFrame: (dtMs: number) => void) {
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

/** Clouds at the top and leaves in the bottom corners of a game page (decoration only). */
export function SceneDecor() {
  const { cloud, foliage } = sceneArt;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {cloud && (
        <>
          <img src={cloud} alt="" className="absolute top-2 -left-4 w-24 opacity-90" />
          <img src={cloud} alt="" className="absolute top-14 -right-5 w-20 opacity-80" />
        </>
      )}
      {foliage && (
        <>
          <img src={foliage} alt="" className="absolute -bottom-3 -left-4 w-32" />
          <img src={foliage} alt="" className="absolute -right-4 -bottom-3 w-32 -scale-x-100" />
        </>
      )}
    </div>
  );
}

/** The card above the play field: a picture, a meaning or a voice to answer. */
export function PromptCard({
  entry,
  word,
  kind,
  audioKey,
}: {
  entry: ChapterEntry;
  word: Word;
  kind: PromptKind;
  /** Changes with each question so the audio button plays the new word. */
  audioKey: string | number;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const ask = t(`sampan.ask.${kind}`);
  return (
    <div
      className="flex h-28 items-center justify-center gap-3 rounded-3xl border-2 border-white bg-white/95 px-3 shadow-md ring-1 ring-sky-200"
      data-testid="sampan-prompt"
      data-word-id={word.id}
      data-kind={kind}
    >
      {kind === 'picture' && (
        <>
          <WordImage
            src={imageUrl(entry, word.image)}
            alt={word.meaning[lang]}
            className="h-24 w-24"
          />
          <p className="text-slate-600">{ask}</p>
        </>
      )}
      {kind === 'meaning' && (
        <p className="text-center">
          <span className="block text-sm text-slate-500">{ask}</span>
          <span className="text-2xl font-extrabold text-sky-800" lang={lang}>
            {word.meaning[lang]}
          </span>
        </p>
      )}
      {kind === 'listen' && (
        <>
          <AudioButton
            key={`${word.id}:${audioKey}`}
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

/** The unit chooser and Start button of a lab game. */
export function GameIntro({
  title,
  icon,
  intro,
  howTo,
  relaxedLabel,
  chapters,
  chosen,
  onChoose,
  relaxed,
  onRelaxed,
  onStart,
  canPlay = () => true,
  cannotPlayText,
}: {
  title: string;
  icon: IconName;
  intro: string;
  howTo: string;
  relaxedLabel: string;
  chapters: ChapterEntry[];
  chosen?: ChapterEntry;
  onChoose: (c: ChapterEntry) => void;
  relaxed: boolean;
  onRelaxed: (v: boolean) => void;
  onStart: () => void;
  /** A unit this returns false for is shown but cannot be started (with `cannotPlayText`). */
  canPlay?: (c: ChapterEntry) => boolean;
  cannotPlayText?: string;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const ok = !!chosen && canPlay(chosen);
  return (
    <>
      <Header title={title} backHref={hrefFor({ name: 'home' })} />
      <Page>
        <p className="mb-1 text-center text-xs font-semibold tracking-wide text-sky-700 uppercase">
          {t('sampan.prototype')}
        </p>
        <div className="mb-4 flex justify-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <Icon name={icon} weight="duotone" size={60} />
          </span>
        </div>
        <p className="text-center text-lg font-semibold">{intro}</p>
        <p className="mb-5 text-center text-slate-600">{howTo}</p>

        <h2 className="mb-2 font-bold">{t('sampan.chooseUnit')}</h2>
        <ul className="mb-4 grid gap-2">
          {chapters.map((c) => {
            const on = c.chapter.id === chosen?.chapter.id;
            const playable = canPlay(c);
            return (
              <li key={c.chapter.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  data-testid={`unit-${c.chapter.id}`}
                  onClick={() => onChoose(c)}
                  className={`flex w-full flex-col rounded-2xl p-3 text-left shadow-sm ${on ? 'bg-sky-100 ring-4 ring-sky-400' : 'bg-white'} ${playable ? '' : 'opacity-60'}`}
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
        {!ok && chosen && cannotPlayText && (
          <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-center text-amber-800" role="status">
            {cannotPlayText}
          </p>
        )}

        <label className="mb-6 flex min-h-11 items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <input
            type="checkbox"
            className="h-6 w-6 accent-sky-500"
            checked={relaxed}
            onChange={(e) => onRelaxed(e.target.checked)}
          />
          <span>{relaxedLabel}</span>
        </label>

        <div className="text-center">
          <PrimaryButton onClick={onStart} disabled={!ok}>
            {t('common.start')} <Icon name={icon} weight="fill" />
          </PrimaryButton>
        </div>
      </Page>
    </>
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

/** A lab game's result screen: stars, the hornbill, the score lines and the words to practise. */
export function GameResult({
  title,
  icon,
  stars,
  entry,
  lines,
  practise,
  onAgain,
  onChangeUnit,
  testId,
}: {
  title: string;
  icon: IconName;
  stars: StarCount;
  entry: ChapterEntry;
  lines: ReactNode;
  practise: string[];
  onAgain: () => void;
  onChangeUnit: () => void;
  testId: string;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Header title={title} backHref={hrefFor({ name: 'home' })} />
      <Page>
        <m.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-4 flex flex-col items-center gap-3 text-center"
          data-testid={testId}
        >
          <Mascot pose="clap" size={112} />
          <p className="text-4xl font-extrabold text-amber-600">{t('result.great')}</p>
          <Stars count={stars} size="lg" animate />
          <p className="text-lg">{t('result.stars', { count: stars })}</p>
          {lines}
        </m.div>
        <Confetti />

        <PractiseList entry={entry} wordIds={practise} />

        <div className="mt-6 flex flex-col items-center gap-3">
          <PrimaryButton onClick={onAgain}>
            {t('common.playAgain')} <Icon name={icon} weight="fill" />
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

/** The top row of a game: score pill, a combo badge, the middle slot (time bar or round), pause. */
export function GameHud({
  score,
  combo,
  paused,
  onPause,
  children,
}: {
  score: number;
  combo: number;
  paused: boolean;
  onPause: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex h-12 items-center gap-1 rounded-full bg-white px-3 text-2xl font-extrabold text-amber-600 shadow-md ring-2 ring-amber-200"
        aria-label={t('sampan.score')}
      >
        <Icon name="star" weight="fill" size={30} className="text-amber-400" />{' '}
        <span data-testid="score">{score}</span>
      </span>
      {combo >= 2 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 text-sm font-bold text-orange-600">
          <Icon name="fire" weight="fill" /> {t('sampan.combo', { count: combo })}
        </span>
      )}
      {children}
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

/** The striped time bar that fills the middle of the HUD. */
export function TimeBar({ leftMs, totalMs }: { leftMs: number; totalMs: number }) {
  const { t } = useTranslation();
  return (
    <div
      className="h-5 flex-1 overflow-hidden rounded-full border-2 border-white bg-sky-100 shadow-inner ring-1 ring-sky-300"
      role="progressbar"
      aria-label={t('sampan.timeLeft')}
      aria-valuemin={0}
      aria-valuemax={totalMs / 1000}
      aria-valuenow={Math.ceil(leftMs / 1000)}
    >
      <div
        className="bar-stripes h-full rounded-full"
        style={{ width: `${(leftMs / totalMs) * 100}%` }}
      />
    </div>
  );
}
