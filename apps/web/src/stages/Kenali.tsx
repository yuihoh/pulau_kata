import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hrefFor } from '../app/router';
import { audioUrl, imageUrl, type ChapterEntry } from '../content/loader';
import { exampleAudioFile } from '../content/audioPlan';
import type { Word } from '../content/schema';
import {
  allCardsOpened,
  completeStage,
  openCard,
  padankanStars,
  type Stars as StarCount,
} from '../engine';
import {
  AudioButton,
  Dialog,
  Header,
  Page,
  PrimaryButton,
  WordImage,
  useUiLang,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { MascotSays } from '../components/Mascot';
import { Padankan } from '../games/Padankan';
import { StageResult } from './StageResult';
import { useProgress } from '../storage/ProgressProvider';

type Phase = { name: 'cards' } | { name: 'padankan' } | { name: 'result'; stars: StarCount };

export function Kenali({ entry }: { entry: ChapterEntry }) {
  const { t } = useTranslation();
  const { get, save } = useProgress();
  const { chapter } = entry;
  const progress = get(chapter.id);
  const wordIds = chapter.words.map((w) => w.id);
  const [phase, setPhase] = useState<Phase>({ name: 'cards' });
  const [openWord, setOpenWord] = useState<Word | null>(null);
  const chapterHref = hrefFor({ name: 'chapter', chapterId: chapter.id });

  if (phase.name === 'padankan')
    return (
      <>
        <Header title="Padankan" backHref={chapterHref} />
        <Page>
          <Padankan
            entry={entry}
            onDone={(pairs, mismatches) => {
              const stars = padankanStars(pairs, mismatches);
              save(completeStage(get(chapter.id), 'kenali', stars, { wordIds }));
              setPhase({ name: 'result', stars });
            }}
          />
        </Page>
      </>
    );

  if (phase.name === 'result')
    return (
      <StageResult
        chapterId={chapter.id}
        stage="kenali"
        stars={phase.stars}
        onReplay={() => setPhase({ name: 'padankan' })}
      />
    );

  const openedCount = wordIds.filter((id) => progress.cardsOpened.includes(id)).length;
  const done = allCardsOpened(progress, wordIds);

  return (
    <>
      <Header title="Kenali" backHref={chapterHref} />
      <Page>
        <MascotSays pose={done ? 'clap' : 'point'} size={72} className="mb-3">
          <p className="text-slate-700">{t('kenali.intro')}</p>
          <p className="font-semibold text-amber-700" aria-live="polite">
            {t('kenali.opened', { count: openedCount, total: wordIds.length })}
          </p>
        </MascotSays>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {chapter.words.map((w) => {
            const opened = progress.cardsOpened.includes(w.id);
            return (
              <li key={w.id}>
                <button
                  type="button"
                  data-testid={`card-${w.id}`}
                  className={`relative flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-2 shadow-sm active:scale-95 ${opened ? 'ring-2 ring-emerald-400' : ''}`}
                  onClick={() => {
                    save(openCard(get(chapter.id), w.id));
                    setOpenWord(w);
                  }}
                >
                  <WordImage src={imageUrl(entry, w.image)} alt="" className="w-full" />
                  <span className="text-base font-bold">{w.word}</span>
                  {opened && (
                    <span
                      className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow"
                      data-testid="opened-badge"
                    >
                      <Icon name="check" weight="bold" size={16} />
                      {/* The tick is visual only; screen readers hear "anak sulung, opened". */}
                      <span className="sr-only">, {t('kenali.cardOpened')}</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          {done && <p className="text-emerald-700">{t('kenali.allOpened')}</p>}
          <PrimaryButton disabled={!done} onClick={() => setPhase({ name: 'padankan' })}>
            <Icon name="puzzle" weight="fill" /> {t('kenali.playPadankan')}
          </PrimaryButton>
        </div>
      </Page>
      {openWord && <WordDetail entry={entry} word={openWord} onClose={() => setOpenWord(null)} />}
    </>
  );
}

function WordDetail({
  entry,
  word,
  onClose,
}: {
  entry: ChapterEntry;
  word: Word;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const lang = useUiLang();
  return (
    <Dialog label={word.word} onClose={onClose}>
      <WordImage
        src={imageUrl(entry, word.image)}
        alt={word.meaning[lang]}
        className="mx-auto w-56"
      />
      <div className="mt-3 flex items-center justify-center gap-3">
        <h2 className="text-3xl font-extrabold text-amber-700">{word.word}</h2>
        <AudioButton src={audioUrl(entry, word.audio)} label={t('common.listen')} />
      </div>
      <p className="text-center text-sm text-slate-500">
        {t('kenali.wordClass')}: {word.class} ({t(`wordClass.${word.class}`)})
      </p>
      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-sm font-semibold text-slate-500">{t('kenali.meaning')}</dt>
          <dd className="text-xl font-bold">{word.meaning[lang]}</dd>
          <dd className="text-slate-600" lang="ms">
            {word.meaning.bm}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-slate-500">{t('kenali.example')}</dt>
          <dd className="flex items-start gap-2 text-lg">
            <span className="flex-1" lang="ms">
              {word.example.bm}
            </span>
            <AudioButton
              src={audioUrl(entry, exampleAudioFile(word.id))}
              label={t('kenali.listenExample')}
              size="sm"
            />
          </dd>
          <dd className="text-slate-600">{word.example[lang]}</dd>
        </div>
        {word.synonym && (
          <div>
            <dt className="text-sm font-semibold text-slate-500">{t('kenali.synonym')}</dt>
            <dd lang="ms">{word.synonym}</dd>
          </div>
        )}
        {word.antonym && (
          <div>
            <dt className="text-sm font-semibold text-slate-500">{t('kenali.antonym')}</dt>
            <dd lang="ms">{word.antonym}</dd>
          </div>
        )}
      </dl>
    </Dialog>
  );
}
