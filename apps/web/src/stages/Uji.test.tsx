import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';
import { findChapter } from '../content/loader';
import { LazyMotion, domAnimation } from 'framer-motion';
import { completeStage, emptyProgress, openCard } from '../engine';
import { MemoryProgressStore } from '../storage/ProgressStore';
import { ProgressProvider } from '../storage/ProgressProvider';
import { Uji, availableTypes } from './Uji';

const entry = findChapter('t3-u01')!;
const wordText = (id: string) => entry.chapter.words.find((w) => w.id === id)!.word;

/** A store where Kenali is already done, so Uji is unlocked (as in the real flow). */
function storeWithKenaliDone() {
  const store = new MemoryProgressStore();
  const ids = entry.chapter.words.map((w) => w.id);
  let p = emptyProgress(entry.chapter.id);
  for (const id of ids) p = openCard(p, id);
  void store.saveChapter(completeStage(p, 'kenali', 2, { wordIds: ids }));
  return store;
}

function renderUji(store = storeWithKenaliDone()) {
  render(
    <ProgressProvider store={store}>
      <LazyMotion features={domAnimation}>
        <Uji entry={entry} seed={42} />
      </LazyMotion>
    </ProgressProvider>,
  );
  return store;
}

/** Answers the current question correctly (MCQ answer id is always the word id). */
function answerCurrent(correct = true) {
  const q = screen.getByTestId('question');
  const wordId = q.dataset.wordId!;
  if (q.dataset.type === 'unscramble') {
    const letters = [...wordText(wordId).replace(/[\s-]/g, '')];
    if (!correct) letters.reverse();
    for (const letter of letters) {
      const tile = screen
        .getAllByTestId('tile')
        .find((t) => t.dataset.letter === letter && !(t as HTMLButtonElement).disabled)!;
      fireEvent.click(tile);
    }
  } else {
    const options = screen.getAllByTestId('option');
    const pick = options.find((o) => (o.dataset.optionId === wordId) === correct)!;
    fireEvent.click(pick);
  }
  return wordId;
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe('Uji', () => {
  it('offers listen questions only when every word has audio', () => {
    // The real unit has its Azure read-aloud files now…
    expect(availableTypes(entry)).toContain('listen-word');
    // …a unit whose audio hasn't been generated never gets them.
    const noAudio = { chapter: entry.chapter, dir: 'none/unit-99' };
    expect(availableTypes(noAudio)).not.toContain('listen-word');
  });

  it('a perfect session gives 3 stars and saves them', async () => {
    const store = renderUji();
    for (let i = 0; i < entry.chapter.words.length; i++) {
      answerCurrent(true);
      expect(screen.getByText('Betul!')).toBeTruthy();
      // G-2: the hornbill cheers a right answer.
      expect(screen.getByTestId('mascot').dataset.pose).toBe('cheer');
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }
    expect(await screen.findByTestId('stage-result')).toBeTruthy();
    expect(screen.getByTestId('mascot').dataset.pose).toBe('clap');
    expect(screen.getByText('You got 3 stars!')).toBeTruthy();
    const saved = (await store.loadAll())[0]!;
    expect(saved.stages.uji.stars).toBe(3);
  });

  it('a wrong answer shows the answer gently and the word comes back', async () => {
    renderUji();
    const missed = answerCurrent(false);
    expect(screen.getByText('Cuba lagi!')).toBeTruthy();
    // G-2: a kind thumbs-up, never a sad face.
    expect(screen.getByTestId('mascot').dataset.pose).toBe('encourage');
    expect(screen.getByText(/This word will come back soon/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    const seen: string[] = [];
    for (let i = 0; i < 6 && !seen.includes(missed); i++) {
      seen.push(screen.getByTestId('question').dataset.wordId!);
      if (seen.at(-1) === missed) break;
      answerCurrent(true);
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }
    expect(seen).toContain(missed);
    expect(seen.indexOf(missed)).toBe(3); // returns after `gap` = 3 questions
  });

  it('the hint removes one wrong option and can be used once', () => {
    renderUji();
    const q = screen.getByTestId('question');
    const hintBtn = screen.getByRole('button', { name: /Hint/ });
    fireEvent.click(hintBtn);
    expect((hintBtn as HTMLButtonElement).disabled).toBe(true);
    if (q.dataset.type !== 'unscramble') {
      const disabled = screen
        .getAllByTestId('option')
        .filter((o) => (o as HTMLButtonElement).disabled);
      expect(disabled).toHaveLength(1);
      expect(disabled[0]!.dataset.optionId).not.toBe(q.dataset.wordId);
    }
  });
});

describe('Uji review regressions (task-05-uji.review.md)', () => {
  /** Plays correct answers until a question of `type` is current. */
  async function goToType(type: string) {
    for (let i = 0; i < 12; i++) {
      if (screen.getByTestId('question').dataset.type === type) return true;
      answerCurrent(true);
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }
    return false;
  }

  it('a hint that fills the last slot submits the scramble', async () => {
    renderUji();
    expect(await goToType('unscramble')).toBe(true);
    const wordId = screen.getByTestId('question').dataset.wordId!;
    const letters = [...wordText(wordId).replace(/[\s-]/g, '')];
    // The hint uses the first tile (in tile order) carrying the first letter. Place every
    // other tile, leaving exactly that one, then ask for the hint.
    const tiles = screen.getAllByTestId('tile');
    const hintTile = tiles.find((t) => t.dataset.letter === letters[0])!;
    for (const tile of tiles) if (tile !== hintTile) fireEvent.click(tile);
    expect(screen.queryByText('Betul!') ?? screen.queryByText('Cuba lagi!')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Hint/ }));
    // Placement order was wrong apart from the hinted first letter, but either way the
    // question must be judged rather than left stuck.
    expect(screen.queryByText('Betul!') ?? screen.queryByText('Cuba lagi!')).toBeTruthy();
  });

  it('does not promise the word comes back on the last allowed miss', () => {
    renderUji();
    const first = screen.getByTestId('question').dataset.wordId!;
    // Miss the same word three times (initial + 2 retries), answering others correctly.
    let misses = 0;
    for (let guard = 0; guard < 30 && misses < 3; guard++) {
      if (screen.getByTestId('question').dataset.wordId === first) {
        answerCurrent(false);
        misses++;
        const promise = screen.queryByText(/This word will come back soon/);
        if (misses < 3) expect(promise).toBeTruthy();
        else expect(promise).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      } else {
        answerCurrent(false);
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      }
    }
    expect(misses).toBe(3);
  });

  it('focuses the question heading when a new question appears', async () => {
    renderUji();
    expect(document.activeElement?.tagName).toBe('H2');
    answerCurrent(true);
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(document.activeElement?.tagName).toBe('H2');
  });
});
