import { m } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hrefFor } from '../app/router';
import { audioUrl, imageUrl, type ChapterEntry } from '../content/loader';
import type { Chapter } from '../content/schema';
import {
  BASIC_TYPES,
  answer,
  buildUjiSession,
  checkAnswer,
  completeStage,
  createQueue,
  createRng,
  current,
  hintFor,
  isFinished,
  markHintUsed,
  quizStars,
  type Hint,
  type McqQuestion,
  type Question,
  type QuestionType,
  type ScrambleQuestion,
  type Stars as StarCount,
} from '../engine';
import {
  Ask,
  AudioButton,
  Header,
  Page,
  PrimaryButton,
  ProgressBar,
  WordImage,
  useUiLang,
} from '../components/ui';
import { answerMotion, StarBurst } from '../components/celebrate';
import { Icon } from '../components/Icon';
import { Mascot } from '../components/Mascot';
import { useProgress } from '../storage/ProgressProvider';
import { playSpeech, stopSpeech } from '../audio/speech';
import { playSfx } from '../audio/sfx';
import { StageResult } from './StageResult';

const CORRECT_PAUSE_MS = 900;
/** Times a missed word is asked again (must match the queue option below). */
const MAX_RETRIES = 2;

/** Question types this chapter can support right now (no picture/listen questions without media). */
export function availableTypes(entry: ChapterEntry): QuestionType[] {
  const words = entry.chapter.words;
  return BASIC_TYPES.filter((t) => {
    if (t === 'picture-word') return words.every((w) => imageUrl(entry, w.image));
    if (t === 'listen-word') return words.every((w) => audioUrl(entry, w.audio));
    return true;
  });
}

type Feedback = { kind: 'answering' } | { kind: 'correct' } | { kind: 'wrong'; chosen: string };

export function Uji({ entry, seed }: { entry: ChapterEntry; seed?: number }) {
  const { chapter } = entry;
  const { get, save } = useProgress();
  const [session, setSession] = useState(() => newSession(entry, seed));
  const [queue, setQueue] = useState(() => createQueue(session.questions));
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'answering' });
  const [hint, setHint] = useState<Hint | null>(null);
  const [stars, setStars] = useState<StarCount | null>(null);

  const q = current(queue);
  const attempt = q ? (queue.results[q.id]?.attempts ?? 0) : 0;
  const remaining = new Set(queue.pending.map((x) => x.id)).size;
  const total = session.questions.length;

  function submit(choice: string) {
    if (!q || feedback.kind !== 'answering') return;
    const ok = checkAnswer(q, choice, chapter);
    playSfx(ok ? 'correct' : 'wrong');
    setFeedback(ok ? { kind: 'correct' } : { kind: 'wrong', chosen: choice });
  }

  function advance() {
    if (feedback.kind === 'answering') return;
    const next = answer(queue, feedback.kind === 'correct', { maxRetries: MAX_RETRIES });
    setQueue(next);
    setHint(null);
    setFeedback({ kind: 'answering' });
    if (isFinished(next)) {
      const s = quizStars(Object.values(next.results));
      save(completeStage(get(chapter.id), 'uji', s));
      setStars(s);
    }
  }

  // Correct answers move on by themselves after a short celebration.
  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  });
  useEffect(() => {
    if (feedback.kind !== 'correct') return;
    const id = setTimeout(() => advanceRef.current(), CORRECT_PAUSE_MS);
    return () => clearTimeout(id);
  }, [feedback.kind]);

  if (stars !== null)
    return (
      <StageResult
        chapterId={chapter.id}
        stage="uji"
        stars={stars}
        onReplay={() => {
          const s = newSession(entry);
          setSession(s);
          setQueue(createQueue(s.questions));
          setStars(null);
        }}
      />
    );
  if (!q) return null;

  return (
    <>
      <Header title="Uji" backHref={hrefFor({ name: 'chapter', chapterId: chapter.id })} />
      <Page>
        <ProgressBar done={total - remaining} total={total} />
        <div data-testid="question" data-type={q.type} data-word-id={q.wordId}>
          {q.kind === 'mcq' ? (
            <McqView
              key={`${q.id}:${attempt}`}
              entry={entry}
              q={q}
              feedback={feedback}
              hint={hint}
              onChoose={submit}
            />
          ) : (
            <ScrambleView
              key={`${q.id}:${attempt}`}
              entry={entry}
              q={q}
              feedback={feedback}
              hint={hint}
              onSubmit={submit}
            />
          )}
        </div>
        <Footer
          feedback={feedback}
          q={q}
          chapter={chapter}
          hintAvailable={!hint && attempt === 0}
          willReturn={attempt < MAX_RETRIES}
          onHint={() => {
            setHint(hintFor(q, chapter, session.rng));
            setQueue((s) => markHintUsed(s));
          }}
          onContinue={advance}
        />
      </Page>
    </>
  );
}

function newSession(entry: ChapterEntry, seed?: number) {
  const rng = createRng(seed ?? Date.now());
  return { rng, questions: buildUjiSession(entry.chapter, rng, { types: availableTypes(entry) }) };
}

function Prompt({ entry, q }: { entry: ChapterEntry; q: Question }) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const word = entry.chapter.words.find((w) => w.id === q.wordId)!;
  const audio = audioUrl(entry, word.audio);

  switch (q.type) {
    case 'picture-word':
      return (
        <>
          <Ask>{t('uji.ask.pictureWord')}</Ask>
          <WordImage
            src={imageUrl(entry, word.image)}
            alt={word.meaning[lang]}
            className="mx-auto w-56"
          />
        </>
      );
    case 'listen-word':
      return (
        <>
          <Ask>{t('uji.ask.listenWord')}</Ask>
          <AutoPlay src={audio} />
          <div className="flex justify-center">
            <AudioButton src={audio} label={t('common.listen')} />
          </div>
        </>
      );
    case 'word-meaning':
    case 'synonym':
    case 'antonym':
      return (
        <>
          <Ask>{t(`uji.ask.${q.type}`)}</Ask>
          <div className="flex items-center justify-center gap-3">
            <p className="text-4xl font-extrabold text-amber-700" lang="ms">
              {word.word}
            </p>
            <AudioButton src={audio} label={t('common.listen')} />
          </div>
        </>
      );
    case 'fill-blank': {
      const sentence = (q as McqQuestion).prompt.sentence ?? '';
      const [before, after] = sentence.split('___');
      return (
        <>
          <Ask>{t('uji.ask.fillBlank')}</Ask>
          <p className="rounded-2xl bg-white p-4 text-center text-2xl leading-relaxed" lang="ms">
            {before}
            <span className="mx-1 inline-block min-w-20 border-b-4 border-amber-400">&nbsp;</span>
            {after}
          </p>
        </>
      );
    }
    case 'unscramble':
      return (
        <>
          <Ask>{t('uji.ask.unscramble')}</Ask>
          <WordImage
            src={imageUrl(entry, word.image)}
            alt={word.meaning[lang]}
            className="mx-auto w-40"
          />
          <p className="mt-2 text-center text-lg font-semibold">{word.meaning[lang]}</p>
        </>
      );
  }
}

/** Tries to play the audio once when the question appears (browsers may block it; the button stays). */
function AutoPlay({ src }: { src?: string }) {
  useEffect(() => {
    if (!src) return;
    playSpeech(src);
    return () => stopSpeech();
  }, [src]);
  return null;
}

function McqView({
  entry,
  q,
  feedback,
  hint,
  onChoose,
}: {
  entry: ChapterEntry;
  q: McqQuestion;
  feedback: Feedback;
  hint: Hint | null;
  onChoose: (id: string) => void;
}) {
  const lang = useUiLang();
  const removed = hint?.kind === 'eliminate' ? hint.optionId : null;
  const label = (id: string, text: string) =>
    q.type === 'word-meaning'
      ? (entry.chapter.words.find((w) => w.id === id)?.meaning[lang] ?? text)
      : text;

  return (
    <>
      <Prompt entry={entry} q={q} />
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {q.options.map((o) => {
          const isAnswer = o.id === q.answerId;
          const state =
            feedback.kind === 'correct' && isAnswer
              ? 'right'
              : feedback.kind === 'wrong' && isAnswer
                ? 'right'
                : feedback.kind === 'wrong' && feedback.chosen === o.id
                  ? 'wrong'
                  : 'idle';
          const cls = {
            idle: 'border-slate-200 bg-white',
            right: 'border-emerald-500 bg-emerald-100 ring-4 ring-emerald-400',
            wrong: 'border-rose-400 bg-rose-100 ring-4 ring-rose-300',
          }[state];
          const disabled = o.id === removed || feedback.kind !== 'answering';
          return (
            <li key={o.id}>
              <m.button
                type="button"
                data-testid="option"
                data-option-id={o.id}
                disabled={disabled}
                onClick={() => onChoose(o.id)}
                animate={answerMotion(state)}
                whileTap={disabled ? undefined : { scale: 0.95 }}
                className={`relative min-h-14 w-full rounded-2xl border-b-4 px-4 py-3 text-xl font-bold shadow-sm ${cls} ${o.id === removed ? 'opacity-30' : ''}`}
                lang={q.type === 'word-meaning' ? lang : 'ms'}
              >
                {label(o.id, o.text)}
                {feedback.kind === 'correct' && isAnswer && <StarBurst />}
              </m.button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function ScrambleView({
  entry,
  q,
  feedback,
  hint,
  onSubmit,
}: {
  entry: ChapterEntry;
  q: ScrambleQuestion;
  feedback: Feedback;
  hint: Hint | null;
  onSubmit: (letters: string) => void;
}) {
  const slots = useMemo(
    () => [...q.pattern].map((c, i) => ({ i, fixed: c === '_' ? null : c })),
    [q.pattern],
  );
  const letterSlots = slots.filter((s) => s.fixed === null).length;
  const [placed, setPlaced] = useState<string[]>([]);
  const locked = hint?.kind === 'first-letter' ? hint.tileId : null;
  const shown =
    locked && placed[0] !== locked ? [locked, ...placed.filter((id) => id !== locked)] : placed;
  const letterOf = (id: string) => q.tiles.find((t) => t.id === id)!.letter;

  function place(tileId: string) {
    if (feedback.kind !== 'answering' || shown.includes(tileId)) return;
    const next = [...shown, tileId];
    setPlaced(next);
    if (next.length === letterSlots) onSubmit(next.map(letterOf).join(''));
  }

  // The hint can fill the last empty slot (child placed every other letter first): submit then too.
  const hintFilledAnswer =
    locked && feedback.kind === 'answering' && shown.length === letterSlots
      ? shown.map(letterOf).join('')
      : null;
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  });
  useEffect(() => {
    if (hintFilledAnswer !== null) onSubmitRef.current(hintFilledAnswer);
  }, [hintFilledAnswer]);

  let k = 0;
  const areaState =
    feedback.kind === 'correct' ? 'right' : feedback.kind === 'wrong' ? 'wrong' : 'idle';
  return (
    <>
      <Prompt entry={entry} q={q} />
      <m.div
        className="relative mt-5 flex flex-wrap justify-center gap-1"
        data-testid="slots"
        lang="ms"
        animate={answerMotion(areaState)}
      >
        {feedback.kind === 'correct' && <StarBurst />}
        {slots.map((s) => {
          if (s.fixed) return <span key={s.i} className="w-3" aria-hidden />;
          const id = shown[k++];
          const tone =
            feedback.kind === 'correct'
              ? 'bg-emerald-100 ring-emerald-400'
              : feedback.kind === 'wrong'
                ? 'bg-rose-100 ring-rose-300'
                : 'bg-white ring-amber-300';
          return (
            <button
              key={s.i}
              type="button"
              aria-label={id ? letterOf(id) : '_'}
              disabled={!id || id === locked || feedback.kind !== 'answering'}
              onClick={() => id && setPlaced(shown.filter((x) => x !== id))}
              className={`flex h-12 w-11 items-center justify-center rounded-xl text-2xl font-bold ring-2 ${tone}`}
            >
              {id ? letterOf(id) : ''}
            </button>
          );
        })}
      </m.div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {q.tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            data-testid="tile"
            data-letter={tile.letter}
            disabled={shown.includes(tile.id) || feedback.kind !== 'answering'}
            onClick={() => place(tile.id)}
            className="flex h-12 w-12 items-center justify-center rounded-xl border-b-4 border-amber-600 bg-amber-400 text-2xl font-bold text-white shadow active:translate-y-0.5 active:border-b-2 disabled:border-amber-100 disabled:bg-amber-100 disabled:text-amber-100 disabled:shadow-none"
          >
            {tile.letter}
          </button>
        ))}
      </div>
    </>
  );
}

function Footer({
  feedback,
  q,
  chapter,
  hintAvailable,
  willReturn,
  onHint,
  onContinue,
}: {
  feedback: Feedback;
  q: Question;
  chapter: Chapter;
  hintAvailable: boolean;
  /** False on the last allowed miss: the word retires, so don't promise it comes back. */
  willReturn: boolean;
  onHint: () => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const word = chapter.words.find((w) => w.id === q.wordId)!;
  const isMeaning = q.type === 'word-meaning';
  const answerText = isMeaning ? word.meaning[lang] : word.word;

  if (feedback.kind === 'correct')
    return (
      <div className="mt-4 flex items-center justify-center gap-2">
        <Mascot pose="cheer" size={80} />
        <m.p
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 text-3xl font-extrabold text-emerald-600"
          role="status"
        >
          {t('uji.correct')} <Icon name="party" className="text-amber-500" />
        </m.p>
      </div>
    );

  if (feedback.kind === 'wrong')
    return (
      <div className="mt-4 flex flex-col items-center gap-2 text-center" role="status">
        <div className="flex items-center gap-2">
          <Mascot pose="encourage" size={72} />
          <p className="text-2xl font-extrabold text-amber-600">{t('uji.tryAgain')}</p>
        </div>
        <p className="text-lg">
          {t('uji.answerIs')} <strong lang={isMeaning ? lang : 'ms'}>{answerText}</strong>
        </p>
        {willReturn && <p className="text-sm text-slate-500">{t('uji.comesBack')}</p>}
        <PrimaryButton onClick={onContinue}>{t('common.continue')}</PrimaryButton>
      </div>
    );

  return (
    <div className="mt-6 text-center">
      <button
        type="button"
        onClick={onHint}
        disabled={!hintAvailable}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-amber-300 bg-white px-5 font-semibold text-amber-700 disabled:opacity-40"
      >
        <Icon name="hint" /> {t('uji.hint')}
      </button>
    </div>
  );
}
