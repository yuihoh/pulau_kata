import { act, fireEvent, render, screen } from '@testing-library/react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';
import { checkSentence, type CheckOutcome, type CheckRequest } from '../api/checkSentence';
import { findChapter } from '../content/loader';
import { completeStage, emptyProgress, openCard } from '../engine';
import { MemoryProgressStore } from '../storage/ProgressStore';
import { ProgressProvider } from '../storage/ProgressProvider';
import { Bina } from './Bina';

const entry = findChapter('t3-u01')!;
const sentenceOf = (id: string) => entry.chapter.words.find((w) => w.id === id)!.jumbled_sentence;

/** Kenali and Uji done, so Bina is unlocked (as in the real flow). */
function unlockedStore() {
  const store = new MemoryProgressStore();
  const ids = entry.chapter.words.map((w) => w.id);
  let p = emptyProgress(entry.chapter.id);
  for (const id of ids) p = openCard(p, id);
  p = completeStage(p, 'kenali', 3, { wordIds: ids });
  void store.saveChapter(completeStage(p, 'uji', 3));
  return store;
}

function renderBina(check: (r: CheckRequest) => Promise<CheckOutcome>) {
  const store = unlockedStore();
  render(
    <ProgressProvider store={store}>
      <LazyMotion features={domAnimation}>
        <Bina entry={entry} seed={5} check={check} />
      </LazyMotion>
    </ProgressProvider>,
  );
  return store;
}

const ok = (result: 'correct' | 'almost' | 'try_again'): CheckOutcome => ({
  kind: 'ok',
  response: {
    result,
    uses_target_word: true,
    tip: `tip-${result}`,
    suggested_sentence: result === 'correct' ? null : 'Adik membela kucing.',
  },
});

/** Places the current sentence's tiles in order (or reversed = wrong). */
function solveSusun(correct = true) {
  const wordId = screen.getByTestId('susun').dataset.wordId!;
  const words = [...sentenceOf(wordId)];
  if (!correct) words.reverse();
  for (const w of words) {
    const tile = screen
      .getAllByTestId('word-tile')
      .find((t) => t.dataset.text === w && !(t as HTMLButtonElement).disabled)!;
    fireEvent.click(tile);
  }
  return wordId;
}

async function tick(ms = 1300) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

async function finishSusun() {
  for (let i = 0; i < 5; i++) {
    solveSusun(true);
    await tick();
  }
}

async function write(sentence: string) {
  fireEvent.change(screen.getByTestId('sentence-input'), { target: { value: sentence } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Check my sentence' }));
  });
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe('Bina', () => {
  it('perfect run: 5 sentences in order, 2 own sentences correct → 3 stars saved', async () => {
    const calls: CheckRequest[] = [];
    const store = renderBina(async (r) => {
      calls.push(r);
      return ok('correct');
    });
    await finishSusun();
    expect(screen.getByTestId('pick')).toBeTruthy();

    fireEvent.click(screen.getByTestId('pick-membela'));
    await write('Adik membela seekor kucing.');
    expect(screen.getByTestId('verdict').dataset.result).toBe('correct');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // The written word is not offered again.
    expect(screen.queryByTestId('pick-membela')).toBeNull();
    fireEvent.click(screen.getByTestId('pick-menjaga'));
    await write('Kakak menjaga adik di rumah.');
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(await screen.findByTestId('stage-result')).toBeTruthy();
    expect(screen.getByText('You got 3 stars!')).toBeTruthy();
    expect((await store.loadAll())[0]!.stages.bina.stars).toBe(3);
    // Only the contract fields go to the API (no personal data).
    expect(Object.keys(calls[0]!).sort()).toEqual([
      'lang',
      'sentence',
      'word',
      'wordClass',
      'year',
    ]);
    expect(calls[0]).toMatchObject({
      word: 'membela',
      wordClass: 'kata kerja',
      year: 3,
      lang: 'en',
    });
  });

  it('a wrong order shows the right sentence gently and waits for Continue', () => {
    renderBina(async () => ok('correct'));
    const wordId = solveSusun(false);
    expect(screen.getByText('Cuba lagi!')).toBeTruthy();
    expect(screen.getByTestId('right-sentence').textContent).toBe(
      `${sentenceOf(wordId).join(' ')}.`,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.queryByText('Cuba lagi!')).toBeNull();
  });

  it('the hint puts the first word in place and locks it', () => {
    renderBina(async () => ok('correct'));
    const wordId = screen.getByTestId('susun').dataset.wordId!;
    fireEvent.click(screen.getByRole('button', { name: /Hint/ }));
    const placed = screen.getAllByTestId('placed');
    expect(placed).toHaveLength(1);
    expect(placed[0]!.textContent).toBe(sentenceOf(wordId)[0]);
    expect((placed[0] as HTMLButtonElement).disabled).toBe(true);
  });

  it('try again: tips, tries left, no re-check of the same text, best result counts', async () => {
    const results = [ok('try_again'), ok('almost'), ok('try_again')];
    renderBina(async () => results.shift()!);
    await finishSusun();
    fireEvent.click(screen.getByTestId('pick-membela'));
    await write('Kucing.');
    expect(screen.getByText('tip-try_again')).toBeTruthy();
    expect(screen.getByText('Adik membela kucing.')).toBeTruthy();
    expect(screen.getByText('2 tries left')).toBeTruthy();
    // Same text again: the button stays disabled.
    expect(
      (screen.getByRole('button', { name: 'Check my sentence' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    await write('Adik membela kucing');
    expect(screen.getByTestId('verdict').dataset.result).toBe('almost');
    await write('Adik membela kucing itu');
    // Out of tries: no check button; Next moves on.
    expect(screen.queryByRole('button', { name: 'Check my sentence' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
  });

  it('when the check is unavailable, shows the example sentence and never blocks', async () => {
    renderBina(async () => ({ kind: 'unavailable' }));
    await finishSusun();
    fireEvent.click(screen.getByTestId('pick-membela'));
    await write('Adik membela kucing.');
    const card = screen.getByTestId('verdict');
    expect(card.dataset.result).toBe('unavailable');
    const example = entry.chapter.words.find((w) => w.id === 'membela')!.example.bm;
    expect(card.textContent).toContain(example);
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
  });

  it('the sentence is locked while a check is pending (task-06 review #4)', async () => {
    let resolve!: (o: CheckOutcome) => void;
    renderBina(() => new Promise((r) => (resolve = r)));
    await finishSusun();
    fireEvent.click(screen.getByTestId('pick-membela'));
    const input = screen.getByTestId('sentence-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Adik membela kucing.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check my sentence' }));
    expect(input.readOnly).toBe(true);
    expect((screen.getByRole('button', { name: 'Adik' }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => resolve(ok('correct')));
    expect(input.value).toBe('Adik membela kucing.');
    expect(screen.getByTestId('verdict').dataset.result).toBe('correct');
  });

  it('a phone number or email is never sent and does not use up a try (task-06 review #1)', async () => {
    const fetchSpy = vi.fn(async () => new Response('{}'));
    renderBina((r) => checkSentence(r, fetchSpy));
    await finishSusun();
    fireEvent.click(screen.getByTestId('pick-membela'));
    await write('Adik membela kucing, call 012-3456789');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('verdict').dataset.result).toBe('personal_data');
    expect(screen.queryByText(/tries left/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    // After editing, the child can check again.
    fireEvent.change(screen.getByTestId('sentence-input'), {
      target: { value: 'Adik membela kucing.' },
    });
    expect(
      (screen.getByRole('button', { name: 'Check my sentence' }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it('starter chips insert words into the sentence', async () => {
    renderBina(async () => ok('correct'));
    await finishSusun();
    fireEvent.click(screen.getByTestId('pick-membela'));
    fireEvent.click(screen.getByRole('button', { name: 'Adik' }));
    fireEvent.click(screen.getByRole('button', { name: 'membela' }));
    expect((screen.getByTestId('sentence-input') as HTMLTextAreaElement).value).toBe(
      'Adik membela',
    );
  });
});
