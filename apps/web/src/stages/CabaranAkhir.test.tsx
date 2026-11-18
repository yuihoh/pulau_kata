import { act, fireEvent, render, screen } from '@testing-library/react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';
import { findChapter } from '../content/loader';
import { completeStage, emptyProgress, openCard, type ChapterProgress } from '../engine';
import { Koleksi } from '../screens/Koleksi';
import { MemoryProgressStore } from '../storage/ProgressStore';
import { ProgressProvider } from '../storage/ProgressProvider';
import CabaranAkhir from './CabaranAkhir';

const entry = findChapter('t3-u01')!;

function storeUpTo(withCabaran: boolean) {
  const store = new MemoryProgressStore();
  const ids = entry.chapter.words.map((w) => w.id);
  let p: ChapterProgress = emptyProgress(entry.chapter.id);
  for (const id of ids) p = openCard(p, id);
  p = completeStage(p, 'kenali', 3, { wordIds: ids });
  p = completeStage(p, 'uji', 3);
  p = completeStage(p, 'bina', 3);
  if (withCabaran) p = completeStage(p, 'cabaran', 1);
  void store.saveChapter(p);
  return store;
}

beforeEach(() =>
  vi.useFakeTimers({
    toFake: [
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
      'setTimeout',
      'clearTimeout',
      'Date',
    ],
  }),
);
afterEach(() => vi.useRealTimers());

/** Plays a full round, always steering into the right buoy. */
async function playPerfectRound() {
  fireEvent.click(screen.getByRole('button', { name: /Start/ }));
  for (let guard = 0; guard < 400 && !screen.queryByTestId('stage-result'); guard++) {
    const prompt = screen.queryByTestId('sampan-prompt');
    const id = prompt?.dataset.wordId;
    const target = id && screen.queryAllByTestId('buoy').find((b) => b.dataset.optionId === id);
    const boat = screen.queryByTestId('boat');
    if (target && boat && boat.dataset.lane !== target.dataset.lane)
      fireEvent.click(
        screen.getByRole('button', {
          name:
            Number(boat.dataset.lane) < Number(target.dataset.lane) ? 'Steer right' : 'Steer left',
        }),
      );
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
  }
}

function renderCabaran(store: MemoryProgressStore) {
  render(
    <ProgressProvider store={store}>
      <LazyMotion features={domAnimation}>
        <CabaranAkhir entry={entry} seed={21} />
      </LazyMotion>
    </ProgressProvider>,
  );
}

describe('Cabaran Akhir', () => {
  it('a perfect round saves 3 stars and, the first time, completes the unit with a postcard', async () => {
    const store = storeUpTo(false);
    renderCabaran(store);
    await act(async () => undefined); // progress loaded
    await playPerfectRound();
    expect(screen.getByText('You got 3 stars!')).toBeTruthy();
    expect(screen.getByTestId('unit-complete').textContent).toContain('Unit complete!');
    expect(screen.getByRole('link', { name: /See my Koleksi/ })).toBeTruthy();
    expect(screen.getByText('You got every word right the first time!')).toBeTruthy();
    const saved = (await store.loadAll())[0]!;
    expect(saved.stages.cabaran.stars).toBe(3);
  });

  it('replaying an already-finished unit keeps the best stars and does not celebrate again', async () => {
    const store = storeUpTo(true);
    renderCabaran(store);
    await act(async () => undefined);
    await playPerfectRound();
    expect(screen.getByTestId('stage-result')).toBeTruthy();
    expect(screen.queryByTestId('unit-complete')).toBeNull();
    expect((await store.loadAll())[0]!.stages.cabaran.stars).toBe(3);
  });
});

describe('Koleksi', () => {
  it('shows the postcard once the unit is complete, the rest locked with how to earn them', async () => {
    vi.useRealTimers();
    const store = storeUpTo(true);
    render(
      <ProgressProvider store={store}>
        <Koleksi />
      </ProgressProvider>,
    );
    // Progress loads asynchronously; wait for the card to show as earned.
    await vi.waitFor(() =>
      expect(screen.getByTestId('koleksi-postcard:t3-u01').dataset.earned).toBe('true'),
    );
    const earnedCard = screen.getByTestId('koleksi-postcard:t3-u01');
    expect(screen.getByTestId('koleksi-postcard:t3-u02').dataset.earned).toBe('false');
    expect(screen.getByTestId('koleksi-misi:t3-u02').textContent).toContain(
      'Finish the Misi of Unit 2',
    );
    expect(screen.getByTestId('koleksi-count').textContent).toContain('1 of');
    fireEvent.click(earnedCard);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
