import { m } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { imageUrl, type ChapterEntry } from '../content/loader';
import {
  createPadankan,
  createRng,
  flip,
  isComplete,
  isFaceUp,
  isWaiting,
  pairCount,
  resolveMismatch,
} from '../engine';
import { WordImage, useUiLang } from '../components/ui';
import { playSfx } from '../audio/sfx';
import { StarBurst } from '../components/celebrate';
import { Icon } from '../components/Icon';

const MISMATCH_PAUSE_MS = 900;
const FINISH_PAUSE_MS = 700;

export function Padankan({
  entry,
  onDone,
}: {
  entry: ChapterEntry;
  onDone: (pairs: number, mismatches: number) => void;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  const { chapter } = entry;
  const [state, setState] = useState(() =>
    createPadankan(
      chapter.words.map((w) => w.id),
      createRng(Date.now()),
    ),
  );
  const waiting = isWaiting(state);
  const complete = isComplete(state);

  // A chime for each pair found, a soft boop for a mismatch.
  const matchedCount = state.matched.length;
  useEffect(() => {
    if (matchedCount > 0) playSfx('correct');
  }, [matchedCount]);
  useEffect(() => {
    if (waiting) playSfx('wrong');
  }, [waiting]);

  useEffect(() => {
    if (!waiting) return;
    const id = setTimeout(() => setState(resolveMismatch), MISMATCH_PAUSE_MS);
    return () => clearTimeout(id);
  }, [waiting]);

  // Keep the latest callback without restarting the finish timer when the parent re-renders.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (!complete) return;
    const id = setTimeout(
      () => onDoneRef.current(pairCount(state), state.mismatches),
      FINISH_PAUSE_MS,
    );
    return () => clearTimeout(id);
  }, [complete, state]);

  return (
    <div>
      <p className="text-center text-slate-600">{t('padankan.intro')}</p>
      <p className="mb-3 text-center text-sm text-slate-500" aria-live="polite">
        {t('padankan.wrongTries', { count: state.mismatches })}
      </p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {state.cards.map((card) => {
          const word = chapter.words.find((w) => w.id === card.wordId)!;
          const up = isFaceUp(state, card);
          const matched = state.matched.includes(card.wordId);
          const label = !up
            ? t('padankan.hiddenCard')
            : card.face === 'word'
              ? word.word
              : t('padankan.pictureOf', { word: word.word });
          return (
            <li key={card.id}>
              <button
                type="button"
                aria-label={label}
                data-testid="pad-card"
                data-word-id={card.wordId}
                data-face={card.face}
                data-up={up}
                className="block aspect-square w-full"
                onClick={() => setState((s) => flip(s, card.id))}
              >
                <m.div
                  key={up ? 'up' : 'down'}
                  initial={{ rotateY: 90 }}
                  animate={{ rotateY: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`relative flex h-full w-full items-center justify-center rounded-2xl p-1 shadow-sm ${
                    !up
                      ? 'border-b-4 border-amber-600 bg-gradient-to-br from-amber-300 to-orange-400'
                      : matched
                        ? 'bg-emerald-50 ring-2 ring-emerald-400'
                        : 'bg-white ring-2 ring-sky-300'
                  }`}
                >
                  {matched && <StarBurst />}
                  {!up ? (
                    <Icon name="star" weight="fill" size="45%" className="text-amber-100" />
                  ) : card.face === 'image' ? (
                    imageUrl(entry, word.image) ? (
                      <WordImage
                        src={imageUrl(entry, word.image)}
                        alt=""
                        className="h-full w-full"
                      />
                    ) : (
                      // No picture yet: show the meaning so every pair stays distinct.
                      <span
                        className="text-center text-sm leading-tight text-sky-800"
                        data-testid="pad-meaning"
                      >
                        {word.meaning[lang]}
                      </span>
                    )
                  ) : (
                    <span
                      className="text-center text-base leading-tight font-bold break-words sm:text-lg"
                      lang="ms"
                    >
                      {word.word}
                    </span>
                  )}
                </m.div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
