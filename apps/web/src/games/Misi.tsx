/**
 * Misi (story quest) prototype. A short point-and-tap adventure: characters speak BM lines,
 * the child fills a blank with the right chapter word or taps the right object in the scene.
 * 🌐 shows the line in EN/中文 (the blank stays blank). No timer, no failing: a wrong choice
 * is crossed out and the character gives a hint (the word's BM meaning).
 * Rules live in `engine/quest.ts`; content in `content/<track>/unit-XX/quest.json`.
 * Lazy-loaded. Lab only for now: progress and the collectible are not saved yet.
 */
import { m } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
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
import { questLineAudioFile } from '../content/audioPlan';
import {
  allQuests,
  findQuest,
  questAudioUrl,
  questImageUrl,
  type QuestEntry,
} from '../content/loader';
import type { QuestStep } from '../content/schema';
import {
  answerStep,
  currentStep,
  nextStep,
  optionsFor,
  questSummary,
  startQuest,
  visibleProps,
  type QuestRun,
  type Stars as StarCount,
} from '../engine';
import { playSfx } from '../audio/sfx';
import { answerMotion, StarBurst } from '../components/celebrate';
import { Icon } from '../components/Icon';

export default function Misi({
  chapterId,
  seed,
  onComplete,
}: {
  chapterId?: string;
  seed?: number;
  /** Saves the result (stars + reward picture). Absent in pure lab play: nothing is saved. */
  onComplete?: (stars: StarCount) => void;
}) {
  const { t } = useTranslation();
  // A unit without a quest says so; only a bare lab link falls back to the first quest.
  const found = chapterId ? findQuest(chapterId) : allQuests()[0];
  const [run, setRunState] = useState<QuestRun | null>(null);
  const setRun = (next: QuestRun) => {
    // Save once, at the moment the adventure is finished (not on every re-render).
    if (found && next.done && run && !run.done) onComplete?.(questSummary(found.quest, next).stars);
    setRunState(next);
  };
  const backHref = chapterId ? hrefFor({ name: 'chapter', chapterId }) : hrefFor({ name: 'home' });

  if (!found)
    return (
      <>
        <Header title={t('misi.label')} backHref={backHref} />
        <Page>
          <p className="my-8 text-center">{t('misi.none')}</p>
        </Page>
      </>
    );

  const { quest } = found;
  if (!run)
    return <Intro q={found} backHref={backHref} onStart={() => setRun(startQuest(quest, seed))} />;
  if (run.done)
    return (
      <Done
        q={found}
        run={run}
        saved={!!onComplete}
        backHref={backHref}
        onAgain={() => setRun(startQuest(quest, (seed ?? Date.now()) + 1))}
      />
    );
  return <Play q={found} run={run} setRun={setRun} backHref={backHref} />;
}

/** The 🌐 toggle is remembered for this browser (a per-viewer convenience). */
function useTranslationToggle(): [boolean, () => void] {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem('jk.misi.translate') === '1';
    } catch {
      return false;
    }
  });
  return [
    on,
    () =>
      setOn((v) => {
        try {
          localStorage.setItem('jk.misi.translate', v ? '0' : '1');
        } catch {
          /* ignore */
        }
        return !v;
      }),
  ];
}

function TranslateButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label={on ? t('misi.hideTranslation') : t('misi.translate')}
      className={`inline-flex shrink-0 items-center justify-center rounded-full px-3 ${on ? 'bg-sky-500 text-white' : 'bg-sky-100 text-sky-700'}`}
    >
      <Icon name="translate" size={22} />
    </button>
  );
}

function Intro({ q, backHref, onStart }: { q: QuestEntry; backHref: string; onStart: () => void }) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const [translated, toggle] = useTranslationToggle();
  const { quest, entry } = q;
  const cover = questImageUrl(entry, quest.scenes.at(-1)!.background);
  return (
    <>
      <Header title={t('misi.label')} backHref={backHref} />
      <Page>
        <p className="mb-1 text-center text-xs font-semibold tracking-wide text-emerald-700 uppercase">
          {t('misi.prototype')} · {t('misi.optional')}
        </p>
        <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-3xl bg-emerald-200 shadow">
          {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
          <h2
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-3xl font-extrabold text-white"
            lang="ms"
          >
            {quest.title.bm}
          </h2>
        </div>
        <div className="flex items-start gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex-1">
            <p className="text-lg" lang="ms">
              {quest.intro.bm}
            </p>
            {translated && (
              <p className="mt-1 text-slate-500" lang={lang}>
                {quest.intro[lang]}
              </p>
            )}
          </div>
          <TranslateButton on={translated} onToggle={toggle} />
        </div>
        <div className="mt-6 text-center">
          <PrimaryButton onClick={onStart}>
            {t('misi.start')} <Icon name="map" weight="fill" />
          </PrimaryButton>
        </div>
      </Page>
    </>
  );
}

function Play({
  q,
  run,
  setRun,
  backHref,
}: {
  q: QuestEntry;
  run: QuestRun;
  setRun: (r: QuestRun) => void;
  backHref: string;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const { quest, entry } = q;
  const chapter = entry.chapter;
  const scene = quest.scenes[run.scene]!;
  const step = currentStep(quest, run)!;
  const [translated, toggle] = useTranslationToggle();
  const finding = step.kind === 'find' && !run.solved;
  const bg = questImageUrl(entry, scene.background);

  function answer(choice: string) {
    const next = answerStep(quest, chapter, run, choice);
    if (next !== run) playSfx(next.solved ? 'correct' : 'wrong');
    setRun(next);
  }

  return (
    <>
      <Header title={quest.title.bm} backHref={backHref} />
      <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-3 pb-6">
        <p className="order-first text-center text-sm font-semibold text-slate-500">
          {t('misi.part', { n: run.scene + 1, total: quest.scenes.length })} ·{' '}
          <span lang="ms">{scene.title.bm}</span>
        </p>

        {/*
          DOM order is line → answers (options or scene props) → Next, so screen readers and
          keyboard focus reach the instruction before the things to tap. CSS `order` keeps the
          picture visually above the dialogue.
        */}
        <Dialog
          key={`${run.scene}/${run.step}`}
          q={q}
          run={run}
          step={step}
          translated={translated}
          onToggle={toggle}
          onChoose={answer}
        />

        <div
          className="relative order-first aspect-square w-full overflow-hidden rounded-3xl bg-gradient-to-b from-sky-200 to-emerald-300 shadow"
          data-testid="scene"
          data-scene={scene.id}
        >
          {bg && <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          {visibleProps(quest, run).map((p) => {
            const tried = run.wrong.includes(p.id);
            const isRight = run.solved && step.kind === 'find' && step.answer === p.id;
            return (
              <m.button
                key={p.id}
                type="button"
                data-testid="prop"
                data-prop-id={p.id}
                aria-label={p.label[lang]}
                disabled={!finding || tried}
                onClick={() => answer(p.id)}
                initial={p.hidden ? { scale: 0 } : false}
                animate={tried ? { x: [0, -6, 6, -3, 0] } : { scale: isRight ? 1.12 : 1 }}
                transition={{ duration: 0.35 }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-1 shadow-lg disabled:cursor-default ${
                  isRight ? 'ring-4 ring-emerald-400' : finding ? 'ring-2 ring-amber-300' : ''
                } ${tried ? 'opacity-40 grayscale' : ''}`}
                style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}%` }}
              >
                <WordImage src={questImageUrl(entry, p.image)} alt="" className="w-full" />
              </m.button>
            );
          })}
        </div>

        {(step.kind === 'say' || run.solved) && (
          <div className="text-center">
            <PrimaryButton onClick={() => setRun(nextStep(quest, run))}>
              {t('misi.next')} <Icon name="right" weight="bold" />
            </PrimaryButton>
          </div>
        )}
      </main>
    </>
  );
}

function Dialog({
  q,
  run,
  step,
  translated,
  onToggle,
  onChoose,
}: {
  q: QuestEntry;
  run: QuestRun;
  step: QuestStep;
  translated: boolean;
  onToggle: () => void;
  onChoose: (option: string) => void;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const { quest, entry } = q;
  const speaker = quest.characters.find((c) => c.id === step.speaker);
  const word =
    step.kind === 'say' ? undefined : entry.chapter.words.find((w) => w.id === step.word);
  const ref = useRef<HTMLParagraphElement>(null);
  // Each new line takes focus so screen readers read it and keyboard focus is never lost.
  useEffect(() => ref.current?.focus(), []);

  const [before, after] = step.line.bm.split('___');
  const blank = step.kind === 'choose';
  const portrait = speaker && questImageUrl(entry, speaker.portrait);

  return (
    <section
      className="rounded-2xl bg-white p-3 shadow-sm"
      data-testid="dialog"
      data-kind={step.kind}
    >
      <div className="flex items-start gap-3">
        <div className="flex w-16 shrink-0 flex-col items-center">
          {speaker ? (
            portrait ? (
              <img
                src={portrait}
                alt=""
                className="h-16 w-16 rounded-full border-2 border-amber-300 object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                <Icon name="smile" size={34} />
              </span>
            )
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <Icon name="book" size={34} />
            </span>
          )}
          <span className="mt-1 text-xs font-bold text-slate-600">
            {speaker?.name ?? t('misi.story')}
          </span>
        </div>
        <div className="flex-1">
          <p
            ref={ref}
            tabIndex={-1}
            className="text-xl leading-snug outline-none"
            lang="ms"
            data-testid="line"
          >
            {blank ? (
              <>
                {before}
                <span
                  className={`mx-1 inline-block min-w-16 rounded-lg border-b-4 px-1 text-center font-bold ${
                    run.solved
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-amber-400'
                  }`}
                >
                  {run.solved ? word?.word : ' '}
                </span>
                {after}
              </>
            ) : (
              step.line.bm
            )}
          </p>
          {translated && (
            <p className="mt-1 text-slate-500" lang={lang} data-testid="translation">
              {step.line[lang]}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          <TranslateButton on={translated} onToggle={onToggle} />
          <AudioButton
            src={questAudioUrl(entry, questLineAudioFile(quest.scenes[run.scene]!.id, run.step))}
            label={t('common.listen')}
            size="sm"
          />
        </div>
      </div>

      {/*
        Each option is at least as wide as its word (never cut off or overflowing), and the
        row wraps when long words like "menghadiahkan" don't fit side by side.
      */}
      {step.kind === 'choose' && (
        <ul className="mt-3 flex flex-wrap gap-2" lang="ms">
          {optionsFor(run).map((o) => {
            const tried = run.wrong.includes(o);
            const isRight = run.solved && o.toLowerCase() === word?.word.toLowerCase();
            return (
              <li key={o} className="flex-auto">
                <m.button
                  type="button"
                  data-testid="misi-option"
                  data-option={o}
                  disabled={tried || run.solved}
                  onClick={() => onChoose(o)}
                  animate={answerMotion(isRight ? 'right' : tried ? 'wrong' : 'idle')}
                  whileTap={tried || run.solved ? undefined : { scale: 0.95 }}
                  className={`relative min-h-12 w-full rounded-2xl border-b-4 px-4 text-lg font-bold whitespace-nowrap shadow-sm ${
                    isRight
                      ? 'border-emerald-500 bg-emerald-100 ring-4 ring-emerald-400'
                      : tried
                        ? 'border-slate-200 bg-slate-100 text-slate-400 line-through'
                        : 'border-amber-300 bg-amber-100'
                  }`}
                >
                  {o}
                  {isRight && <StarBurst />}
                </m.button>
              </li>
            );
          })}
        </ul>
      )}

      {step.kind === 'find' && !run.solved && (
        <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
          <Icon name="tap" /> {t('misi.tapPicture')}
        </p>
      )}

      <div role="status" aria-live="polite">
        {run.solved && (
          <p className="mt-2 flex items-center justify-center gap-2 text-xl font-extrabold text-emerald-600">
            {t('uji.correct')} <Icon name="party" className="text-amber-500" />
          </p>
        )}
        {!run.solved && run.wrong.length > 0 && word && (
          <div className="mt-2 rounded-xl bg-amber-50 p-2 text-center" data-testid="hint">
            <p className="font-bold text-amber-700" lang="ms">
              {t('misi.notThat')} {t('misi.hintLabel')} {word.meaning.bm}
            </p>
            {translated && (
              <p className="text-sm text-slate-500" lang={lang}>
                {t('misi.hintTranslation', { meaning: word.meaning[lang] })}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Done({
  q,
  run,
  saved,
  backHref,
  onAgain,
}: {
  q: QuestEntry;
  run: QuestRun;
  /** The reward was saved to the child's Koleksi. */
  saved: boolean;
  backHref: string;
  onAgain: () => void;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const { quest, entry } = q;
  const sum = questSummary(quest, run);
  useEffect(() => playSfx('complete'), []);
  const practise = sum.practise
    .map((id) => entry.chapter.words.find((w) => w.id === id))
    .filter((w) => w !== undefined);
  return (
    <>
      <Header title={quest.title.bm} backHref={backHref} />
      <Page>
        <m.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-4 flex flex-col items-center gap-3 text-center"
          data-testid="misi-result"
        >
          <p className="text-4xl font-extrabold text-amber-600">{t('result.great')}</p>
          <p className="text-slate-600">{t('misi.reward')}</p>
          <m.div
            initial={{ rotate: -8, scale: 0.8 }}
            animate={{ rotate: -2, scale: 1 }}
            className="w-64 rounded-xl bg-white p-2 pb-3 shadow-xl"
          >
            <WordImage
              src={questImageUrl(entry, quest.reward.image)}
              alt={quest.reward.title[lang]}
              className="w-full"
            />
            <p className="mt-2 font-bold" lang="ms">
              {quest.reward.title.bm}
            </p>
          </m.div>
          <Stars count={sum.stars} size="lg" />
          <p className="text-lg">{t('result.stars', { count: sum.stars })}</p>
          <p>{t('misi.result', { correct: sum.firstTry, total: sum.total })}</p>
        </m.div>

        <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          {practise.length === 0 ? (
            <p className="text-center font-semibold text-emerald-700">{t('misi.allRight')}</p>
          ) : (
            <>
              <h2 className="mb-2 font-bold">{t('misi.practise')}</h2>
              <ul className="grid gap-1" data-testid="misi-practise">
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

        <div className="mt-6 flex flex-col items-center gap-3">
          {saved && (
            <PrimaryButton href={hrefFor({ name: 'koleksi' })}>{t('koleksi.open')}</PrimaryButton>
          )}
          <PrimaryButton onClick={onAgain}>{t('common.playAgain')}</PrimaryButton>
          <a href={backHref} className="min-h-11 py-2 text-slate-600 underline">
            {t('misi.back')}
          </a>
        </div>
      </Page>
    </>
  );
}
