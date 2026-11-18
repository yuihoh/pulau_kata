/**
 * Stage 3 Bina: Susun ayat (put a sentence in order) → Pilih perkataan (choose a word) →
 * Tulis sendiri (write your own sentence, with a Siapa + Buat apa + Di mana/Bila frame,
 * checked by the AI Worker). Rules live in `engine/bina.ts`.
 */
import { m } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { checkSentence, type CheckOutcome } from '../api/checkSentence';
import { playSfx } from '../audio/sfx';
import { hrefFor } from '../app/router';
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
import { audioUrl, imageUrl, type ChapterEntry } from '../content/loader';
import type { Word } from '../content/schema';
import {
  BINA,
  STARTERS,
  aiPoints,
  answer,
  binaStars,
  buildSusunSession,
  checkSusun,
  completeStage,
  createQueue,
  createRng,
  current,
  formatSentence,
  isFinished,
  markHintUsed,
  susunHint,
  type QueueState,
  type Stars as StarCount,
  type SusunQuestion,
} from '../engine';
import { useProgress } from '../storage/ProgressProvider';
import { answerMotion, StarBurst } from '../components/celebrate';
import { Icon } from '../components/Icon';
import { Mascot } from '../components/Mascot';
import { StageResult } from './StageResult';

const CORRECT_PAUSE_MS = 1200;
const MAX_RETRIES = 2;
/** Points for a sentence we could not check (offline, limit, server down): never block. */
const UNCHECKED_POINTS = 0.5;

type Check = typeof checkSentence;
type Phase = 'susun' | 'pick' | 'write';

export function Bina({
  entry,
  seed,
  check = checkSentence,
}: {
  entry: ChapterEntry;
  seed?: number;
  check?: Check;
}) {
  const { chapter } = entry;
  const { get, save } = useProgress();
  const [queue, setQueue] = useState<QueueState<SusunQuestion>>(() => newQueue(entry, seed));
  const [phase, setPhase] = useState<Phase>('susun');
  const [writing, setWriting] = useState<Word | null>(null);
  const [written, setWritten] = useState<{ wordId: string; points: number }[]>([]);
  const [stars, setStars] = useState<StarCount | null>(null);

  function finishWriting(wordId: string, points: number) {
    const next = [...written, { wordId, points }];
    setWritten(next);
    setWriting(null);
    if (next.length >= Math.min(BINA.writeCount, chapter.words.length)) {
      const s = binaStars(
        Object.values(queue.results),
        next.map((w) => w.points),
      );
      save(completeStage(get(chapter.id), 'bina', s));
      setStars(s);
    } else setPhase('pick');
  }

  if (stars !== null)
    return (
      <StageResult
        chapterId={chapter.id}
        stage="bina"
        stars={stars}
        onReplay={() => {
          setQueue(newQueue(entry));
          setPhase('susun');
          setWritten([]);
          setStars(null);
        }}
      />
    );

  return (
    <>
      <Header title="Bina" backHref={hrefFor({ name: 'chapter', chapterId: chapter.id })} />
      <Page>
        {phase === 'susun' && (
          <Susun entry={entry} queue={queue} setQueue={setQueue} onDone={() => setPhase('pick')} />
        )}
        {phase === 'pick' && (
          <Pick
            entry={entry}
            done={written.map((w) => w.wordId)}
            onPick={(w) => {
              setWriting(w);
              setPhase('write');
            }}
          />
        )}
        {phase === 'write' && writing && (
          <Write
            key={writing.id}
            entry={entry}
            word={writing}
            n={written.length + 1}
            check={check}
            last={written.length + 1 >= Math.min(BINA.writeCount, chapter.words.length)}
            onDone={(points) => finishWriting(writing.id, points)}
          />
        )}
      </Page>
    </>
  );
}

function newQueue(entry: ChapterEntry, seed?: number) {
  return createQueue(buildSusunSession(entry.chapter, createRng(seed ?? Date.now())));
}

// ---------------------------------------------------------------- Susun ayat

type Feedback = { kind: 'answering' } | { kind: 'correct' } | { kind: 'wrong' };

function Susun({
  entry,
  queue,
  setQueue,
  onDone,
}: {
  entry: ChapterEntry;
  queue: QueueState<SusunQuestion>;
  setQueue: (q: QueueState<SusunQuestion>) => void;
  onDone: () => void;
}) {
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'answering' });
  const [hinted, setHinted] = useState(false);
  const q = current(queue);
  const attempt = q ? (queue.results[q.id]?.attempts ?? 0) : 0;
  const total = Object.keys(queue.results).length + new Set(queue.pending.map((x) => x.id)).size;
  const remaining = new Set(queue.pending.map((x) => x.id)).size;

  function advance() {
    if (feedback.kind === 'answering') return;
    const next = answer(queue, feedback.kind === 'correct', { maxRetries: MAX_RETRIES });
    setQueue(next);
    setFeedback({ kind: 'answering' });
    setHinted(false);
    if (isFinished(next)) onDone();
  }
  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  });
  useEffect(() => {
    if (feedback.kind !== 'correct') return;
    const id = setTimeout(() => advanceRef.current(), CORRECT_PAUSE_MS);
    return () => clearTimeout(id);
  }, [feedback.kind]);

  if (!q) return null;
  return (
    <>
      <ProgressBar done={total - remaining} total={total} />
      <SusunView
        key={`${q.id}:${attempt}`}
        entry={entry}
        q={q}
        feedback={feedback}
        hinted={hinted}
        onSubmit={(placed) => {
          const ok = checkSusun(q, placed);
          playSfx(ok ? 'correct' : 'wrong');
          setFeedback(ok ? { kind: 'correct' } : { kind: 'wrong' });
        }}
      />
      <SusunFooter
        q={q}
        feedback={feedback}
        hintAvailable={!hinted && attempt === 0}
        willReturn={attempt < MAX_RETRIES}
        onHint={() => {
          setHinted(true);
          setQueue(markHintUsed(queue));
        }}
        onContinue={advance}
      />
    </>
  );
}

function SusunView({
  entry,
  q,
  feedback,
  hinted,
  onSubmit,
}: {
  entry: ChapterEntry;
  q: SusunQuestion;
  feedback: Feedback;
  hinted: boolean;
  onSubmit: (placedTexts: string[]) => void;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const word = entry.chapter.words.find((w) => w.id === q.wordId)!;
  const [placed, setPlaced] = useState<string[]>([]);
  const locked = hinted ? susunHint(q) : null;
  const shown =
    locked && placed[0] !== locked ? [locked, ...placed.filter((id) => id !== locked)] : placed;
  const textOf = (id: string) => q.tiles.find((x) => x.id === id)!.text;
  const answering = feedback.kind === 'answering';

  function place(id: string) {
    if (!answering || shown.includes(id)) return;
    const next = [...shown, id];
    setPlaced(next);
    if (next.length === q.tiles.length) onSubmit(next.map(textOf));
  }

  // The hint can complete the sentence (child placed every other tile first): judge it then.
  const hintFilled =
    locked && answering && shown.length === q.tiles.length ? shown.map(textOf) : null;
  const key = hintFilled?.join(' ') ?? null;
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  });
  useEffect(() => {
    if (key !== null) onSubmitRef.current(key.split(' '));
  }, [key]);

  const tone =
    feedback.kind === 'correct'
      ? 'bg-emerald-100 ring-emerald-400'
      : feedback.kind === 'wrong'
        ? 'bg-rose-100 ring-rose-300'
        : 'bg-white ring-amber-300';

  return (
    <div data-testid="susun" data-word-id={q.wordId}>
      <Ask>{t('bina.susun.ask')}</Ask>
      <div className="mb-3 flex items-center justify-center gap-3">
        <WordImage src={imageUrl(entry, word.image)} alt={word.meaning[lang]} className="w-20" />
        <p>
          <span className="block text-sm text-slate-500">{t('bina.susun.word')}</span>
          <strong className="text-2xl text-amber-700" lang="ms">
            {word.word}
          </strong>
        </p>
      </div>
      <m.div
        className={`relative flex min-h-16 flex-wrap items-center gap-2 rounded-2xl p-3 ring-2 ${tone}`}
        data-testid="sentence"
        lang="ms"
        animate={answerMotion(
          feedback.kind === 'correct' ? 'right' : feedback.kind === 'wrong' ? 'wrong' : 'idle',
        )}
      >
        {feedback.kind === 'correct' && <StarBurst />}
        {shown.map((id) => (
          <button
            key={id}
            type="button"
            data-testid="placed"
            aria-label={t('bina.susun.remove', { word: textOf(id) })}
            disabled={!answering || id === locked}
            onClick={() => setPlaced(shown.filter((x) => x !== id))}
            className="rounded-xl bg-amber-100 px-3 text-lg font-bold disabled:opacity-100"
          >
            {textOf(id)}
          </button>
        ))}
        {Array.from({ length: q.tiles.length - shown.length }, (_, i) => (
          <span
            key={`gap${i}`}
            className="h-9 w-12 rounded-xl border-2 border-dashed border-amber-200"
            aria-hidden
          />
        ))}
      </m.div>
      <div className="mt-5 flex flex-wrap justify-center gap-2" lang="ms">
        {q.tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            data-testid="word-tile"
            data-text={tile.text}
            disabled={shown.includes(tile.id) || !answering}
            onClick={() => place(tile.id)}
            className="rounded-xl border-b-4 border-amber-600 bg-amber-400 px-4 text-lg font-bold text-white shadow active:translate-y-0.5 active:border-b-2 disabled:border-amber-100 disabled:bg-amber-100 disabled:text-amber-100 disabled:shadow-none"
          >
            {tile.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function SusunFooter({
  q,
  feedback,
  hintAvailable,
  willReturn,
  onHint,
  onContinue,
}: {
  q: SusunQuestion;
  feedback: Feedback;
  hintAvailable: boolean;
  willReturn: boolean;
  onHint: () => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  if (feedback.kind === 'correct')
    return (
      <m.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mt-4 text-center"
        role="status"
      >
        <div className="flex items-center justify-center gap-2">
          <Mascot pose="cheer" size={72} />
          <p className="flex items-center gap-2 text-3xl font-extrabold text-emerald-600">
            {t('uji.correct')} <Icon name="party" className="text-amber-500" />
          </p>
        </div>
        <p className="mt-1 text-lg" lang="ms">
          {formatSentence(q.answer)}
        </p>
      </m.div>
    );
  if (feedback.kind === 'wrong')
    return (
      <div className="mt-4 flex flex-col items-center gap-2 text-center" role="status">
        <div className="flex items-center gap-2">
          <Mascot pose="encourage" size={72} />
          <p className="text-2xl font-extrabold text-amber-600">{t('uji.tryAgain')}</p>
        </div>
        <p className="text-lg">
          {t('uji.answerIs')}{' '}
          <strong lang="ms" data-testid="right-sentence">
            {formatSentence(q.answer)}
          </strong>
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

// ---------------------------------------------------------------- Pilih perkataan

function Pick({
  entry,
  done,
  onPick,
}: {
  entry: ChapterEntry;
  done: string[];
  onPick: (w: Word) => void;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const total = Math.min(BINA.writeCount, entry.chapter.words.length);
  return (
    <div data-testid="pick">
      <p className="text-center text-sm font-semibold text-slate-500">
        {t('bina.pick.progress', { n: done.length + 1, total })}
      </p>
      <h2 className="text-center text-2xl font-extrabold text-amber-700">{t('bina.pick.title')}</h2>
      <Ask>{t('bina.pick.ask')}</Ask>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {entry.chapter.words
          .filter((w) => !done.includes(w.id))
          .map((w) => (
            <li key={w.id}>
              <button
                type="button"
                data-testid={`pick-${w.id}`}
                onClick={() => onPick(w)}
                className="flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-2 shadow-sm active:scale-95"
              >
                <WordImage src={imageUrl(entry, w.image)} alt="" className="w-20" />
                <strong lang="ms">{w.word}</strong>
                <span className="text-xs text-slate-500" lang={lang}>
                  {w.meaning[lang]}
                </span>
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- Tulis sendiri

type Verdict = CheckOutcome | { kind: 'checking' };

function Write({
  entry,
  word,
  n,
  check,
  last,
  onDone,
}: {
  entry: ChapterEntry;
  word: Word;
  n: number;
  check: Check;
  last: boolean;
  onDone: (points: number) => void;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const [text, setText] = useState('');
  const [checkedText, setCheckedText] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [best, setBest] = useState(0);
  const input = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // On a phone the verdict appears below the keyboard/fold: bring it into view.
  useEffect(() => {
    if (verdict && verdict.kind !== 'checking')
      resultRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }, [verdict]);
  const total = Math.min(BINA.writeCount, entry.chapter.words.length);

  const isCorrect = verdict?.kind === 'ok' && verdict.response.result === 'correct';
  // While a check is pending the sentence is locked, so a verdict always matches the text shown.
  const checking = verdict?.kind === 'checking';
  const unchecked =
    verdict?.kind === 'offline' ||
    verdict?.kind === 'unavailable' ||
    verdict?.kind === 'rate_limited';
  const canCheck =
    text.trim().length > 0 &&
    verdict?.kind !== 'checking' &&
    !isCorrect &&
    !unchecked &&
    attempts < BINA.maxWriteAttempts &&
    text.trim() !== checkedText;

  async function onCheck() {
    if (!canCheck) return;
    const sentence = text.trim();
    setVerdict({ kind: 'checking' });
    setCheckedText(sentence);
    const out = await check({
      word: word.word,
      wordClass: word.class,
      year: entry.chapter.year,
      sentence,
      lang,
    });
    // Personal data was caught on the device and nothing was sent: not a try, no points.
    if (out.kind === 'personal_data') {
      setVerdict(out);
      return;
    }
    setAttempts((a) => a + 1);
    const points = out.kind === 'ok' ? aiPoints(out.response.result) : UNCHECKED_POINTS;
    setBest((b) => Math.max(b, points));
    setVerdict(out);
  }

  function insert(s: string) {
    if (checking || isCorrect) return;
    setText((prev) => {
      const sep = prev && !/\s$/.test(prev) ? ' ' : '';
      return `${prev}${sep}${s}`.slice(0, 200);
    });
    input.current?.focus();
  }

  return (
    <div data-testid="write" data-word-id={word.id}>
      <p className="text-center text-sm font-semibold text-slate-500">
        {t('bina.pick.progress', { n, total })}
      </p>
      <Ask>{t('bina.write.ask')}</Ask>
      <div className="mb-3 flex items-center justify-center gap-3">
        <WordImage src={imageUrl(entry, word.image)} alt={word.meaning[lang]} className="w-20" />
        <div>
          <p className="flex items-center gap-2">
            <strong className="text-3xl text-amber-700" lang="ms">
              {word.word}
            </strong>
            <AudioButton src={audioUrl(entry, word.audio)} label={t('common.listen')} />
          </p>
          <p className="text-slate-600" lang={lang}>
            {word.meaning[lang]} · {t(`wordClass.${word.class}`)}
          </p>
        </div>
      </div>

      <section className="mb-3 rounded-2xl bg-sky-50 p-3" aria-label={t('bina.write.frame')}>
        <p className="mb-2 text-sm font-semibold text-sky-800">{t('bina.write.frame')}</p>
        <ol className="grid grid-cols-3 gap-2 text-center text-sm">
          {(
            [
              ['Siapa?', 'who'],
              ['Buat apa?', 'doesWhat'],
              ['Di mana? / Bila?', 'whereWhen'],
            ] as const
          ).map(([bm, key]) => (
            <li key={key} className="rounded-xl bg-white p-2 shadow-sm">
              <span className="block font-bold" lang="ms">
                {bm}
              </span>
              <span className="text-xs text-slate-500">{t(`bina.write.${key}`)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 mb-1 text-sm text-slate-600">{t('bina.write.starters')}</p>
        <div className="flex flex-wrap gap-2" lang="ms">
          {[...STARTERS, word.word].map((s, i) => (
            <button
              key={s + i}
              type="button"
              onClick={() => insert(s)}
              disabled={isCorrect || checking}
              className={`rounded-full px-3 text-sm font-semibold shadow-sm ${s === word.word ? 'bg-amber-400 text-white' : 'bg-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t('bina.write.label')}</span>
        <textarea
          ref={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          rows={3}
          lang="ms"
          spellCheck={false}
          autoCapitalize="sentences"
          readOnly={isCorrect || checking}
          placeholder={t('bina.write.placeholder')}
          className="w-full rounded-2xl border-2 border-amber-300 bg-white p-3 text-xl"
          data-testid="sentence-input"
        />
      </label>
      <p className="text-right text-xs text-slate-400">{text.length}/200</p>

      <div className="mt-2 flex flex-col items-center gap-2">
        {!isCorrect && !unchecked && attempts < BINA.maxWriteAttempts && (
          <PrimaryButton onClick={() => void onCheck()} disabled={!canCheck}>
            {verdict?.kind === 'checking' ? t('bina.write.checking') : t('bina.write.check')}
          </PrimaryButton>
        )}
        {attempts > 0 && !isCorrect && !unchecked && attempts < BINA.maxWriteAttempts && (
          <p className="text-sm text-slate-500">
            {t('bina.write.triesLeft', { count: BINA.maxWriteAttempts - attempts })}
          </p>
        )}
      </div>

      <div ref={resultRef}>
        <VerdictCard verdict={verdict} word={word} />
        {attempts > 0 && !checking && (
          <div className="mt-4 text-center">
            <PrimaryButton onClick={() => onDone(best)}>
              {last ? t('bina.write.finish') : t('bina.write.next')}
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

function VerdictCard({ verdict, word }: { verdict: Verdict | null; word: Word }) {
  const { t } = useTranslation();
  if (!verdict || verdict.kind === 'checking') return <div role="status" aria-live="polite" />;

  if (verdict.kind === 'personal_data')
    return (
      <div
        className="mt-4 rounded-2xl bg-amber-50 p-4 text-center ring-2 ring-amber-300"
        role="status"
        data-testid="verdict"
        data-result="personal_data"
      >
        <p className="font-semibold">{t('bina.write.personal')}</p>
      </div>
    );

  if (verdict.kind !== 'ok')
    return (
      <div
        className="mt-4 rounded-2xl bg-sky-50 p-4 text-center"
        role="status"
        data-testid="verdict"
        data-result={verdict.kind}
      >
        <p>{t(`bina.write.${verdict.kind === 'rate_limited' ? 'rateLimited' : verdict.kind}`)}</p>
        <p className="mt-2 text-lg font-semibold" lang="ms">
          {word.example.bm}
        </p>
      </div>
    );

  const r = verdict.response;
  const title =
    r.result === 'correct'
      ? t('uji.correct')
      : r.result === 'almost'
        ? t('bina.write.almost')
        : t('uji.tryAgain');
  const color = r.result === 'correct' ? 'text-emerald-600' : 'text-amber-600';
  return (
    <m.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative mt-4 rounded-2xl bg-white p-4 text-center shadow-sm"
      role="status"
      data-testid="verdict"
      data-result={r.result}
    >
      {r.result === 'correct' && <StarBurst />}
      <p className={`flex items-center justify-center gap-2 text-2xl font-extrabold ${color}`}>
        <Mascot pose={r.result === 'correct' ? 'cheer' : 'encourage'} size={56} />
        {title}
        {r.result === 'correct' && <Icon name="party" className="text-amber-500" />}
      </p>
      <p className="mt-1">{r.tip}</p>
      {r.suggested_sentence && (
        <p className="mt-2">
          <span className="block text-sm text-slate-500">{t('bina.write.example')}</span>
          <strong lang="ms">{r.suggested_sentence}</strong>
        </p>
      )}
    </m.div>
  );
}
