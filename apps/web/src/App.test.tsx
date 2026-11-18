import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import './i18n';
import { App } from './App';
import { tracks, findChapter } from './content/loader';
import { completeStage, emptyProgress, openCard } from './engine';
import { MemoryProgressStore } from './storage/ProgressStore';
import { ProgressProvider } from './storage/ProgressProvider';

function renderApp(store = new MemoryProgressStore()) {
  return render(
    <ProgressProvider store={store}>
      <App />
    </ProgressProvider>,
  );
}

describe('content loader', () => {
  it('loads the Tahun 3 track with its three chapters in order', () => {
    const t3 = tracks.find((t) => t.name === 'tahun-3')!;
    expect(t3.chapters.map((c) => c.chapter.id)).toEqual(['t3-u01', 't3-u02', 't3-u03']);
    expect(findChapter('t3-u02')!.dir).toBe('tahun-3/unit-02');
    expect(findChapter('nope')).toBeUndefined();
  });
});

describe('App', () => {
  it('shows the chapter list on the home screen', async () => {
    window.location.hash = '#/';
    renderApp();
    expect(await screen.findByText('Keluarga Tersayang')).toBeTruthy();
    expect(screen.getByText('Hubungan Erat')).toBeTruthy();
  });

  it('shows saved stars and unlocks Uji after Kenali', async () => {
    const store = new MemoryProgressStore();
    const chapter = findChapter('t3-u01')!.chapter;
    const ids = chapter.words.map((w) => w.id);
    let p = emptyProgress(chapter.id);
    for (const id of ids) p = openCard(p, id);
    await store.saveChapter(completeStage(p, 'kenali', 3, { wordIds: ids }));

    window.location.hash = '#/c/t3-u01';
    renderApp(store);
    const uji = await screen.findByTestId('stage-uji');
    expect(uji.querySelector('[data-locked]')).toBeNull();
    expect(screen.getByTestId('stage-bina').querySelector('[data-locked]')).not.toBeNull();
  });

  // G-1 review: the "opened" tick badge must not share the card-* test id prefix (it broke
  // the e2e "open every card" loop, which counts [data-testid^="card-"]).
  it('Kenali: only the word cards match card-*, even after cards are opened', async () => {
    const store = new MemoryProgressStore();
    const chapter = findChapter('t3-u01')!.chapter;
    let p = emptyProgress(chapter.id);
    for (const w of chapter.words.slice(0, 5)) p = openCard(p, w.id);
    await store.saveChapter(p);
    window.location.hash = '#/c/t3-u01/kenali';
    const { container } = renderApp(store);
    await screen.findByTestId(`card-${chapter.words[0]!.id}`);
    expect(container.querySelectorAll('[data-testid^="card-"]')).toHaveLength(12);
    expect(screen.getAllByTestId('opened-badge')).toHaveLength(5);
    // G-1 review #2: screen readers hear which cards are already opened.
    const first = chapter.words[0]!;
    const last = chapter.words[11]!;
    expect(screen.getByTestId(`card-${first.id}`).textContent).toMatch(/opened$/);
    expect(screen.getByTestId(`card-${last.id}`).textContent).not.toMatch(/opened/);
  });

  it('redirects a locked stage URL to the chapter overview', async () => {
    window.location.hash = '#/c/t3-u01/bina';
    renderApp();
    expect(await screen.findByTestId('stage-kenali')).toBeTruthy();
    await act(async () => {
      window.location.hash = '#/';
    });
  });
});
