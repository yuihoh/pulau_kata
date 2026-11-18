/** G-3: Home is a map (a trail of unit stops per Tema) and the unit screen is a trail of stages. */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '../i18n';
import { App } from '../App';
import { findChapter, temaMapUrl, tracks } from '../content/loader';
import { completeStage, emptyProgress, openCard, type ChapterProgress } from '../engine';
import { MemoryProgressStore } from '../storage/ProgressStore';
import { TrailMap } from '../components/TrailMap';
import { ProgressProvider } from '../storage/ProgressProvider';

function renderApp(store = new MemoryProgressStore()) {
  return render(
    <ProgressProvider store={store}>
      <App />
    </ProgressProvider>,
  );
}

function finished(id: string): ChapterProgress {
  const ids = findChapter(id)!.chapter.words.map((w) => w.id);
  let p = emptyProgress(id);
  for (const w of ids) p = openCard(p, w);
  p = completeStage(p, 'kenali', 3, { wordIds: ids });
  for (const s of ['uji', 'bina', 'cabaran'] as const) p = completeStage(p, s, 2);
  return p;
}

describe('Home map', () => {
  it('has an illustrated landscape for Tema 1 of both years', () => {
    expect(temaMapUrl('tahun-3', 1)).toBeTruthy();
    expect(temaMapUrl('tahun-5', 1)).toBeTruthy();
    expect(temaMapUrl('tahun-3', 2)).toBeUndefined(); // falls back to the Tema colour
  });

  it('shows every unit as a stop on its Tema trail, linking to the unit', async () => {
    window.location.hash = '#/';
    renderApp();
    for (const t of tracks)
      for (const { chapter } of t.chapters) {
        const stop = await screen.findByTestId(`unit-stop-${chapter.id}`);
        expect(stop.getAttribute('href')).toBe(`#/c/${chapter.id}`);
        expect(within(stop).getByText(chapter.title.bm)).toBeTruthy();
      }
  });

  it('the hornbill stands at the first unfinished unit; finished units say so', async () => {
    const store = new MemoryProgressStore();
    await store.saveChapter(finished('t3-u01'));
    window.location.hash = '#/';
    renderApp(store);
    const t3 = await screen.findByTestId('map-tahun-3');
    const current = t3.querySelector('[data-current="true"]')!;
    expect(within(current as HTMLElement).getByTestId('unit-stop-t3-u02')).toBeTruthy();
    expect(within(current as HTMLElement).getByTestId('mascot')).toBeTruthy();
    expect(within(screen.getByTestId('unit-stop-t3-u01')).getByText('Finished')).toBeTruthy();
    // Tahun 5 has its own trail, so its guide waits at its first unit.
    const t5 = screen.getByTestId('map-tahun-5');
    expect(
      within(t5.querySelector('[data-current="true"]') as HTMLElement).getByTestId(
        'unit-stop-t5-u01',
      ),
    ).toBeTruthy();
  });
});

describe('Unit trail', () => {
  it('the hornbill waits at the next stage (Uji after Kenali)', async () => {
    const id = 't3-u01';
    const ids = findChapter(id)!.chapter.words.map((w) => w.id);
    let p = emptyProgress(id);
    for (const w of ids) p = openCard(p, w);
    const store = new MemoryProgressStore();
    await store.saveChapter(completeStage(p, 'kenali', 3, { wordIds: ids }));
    window.location.hash = `#/c/${id}`;
    renderApp(store);
    const uji = await screen.findByTestId('stage-uji');
    const li = uji.closest('li')!;
    expect(li.dataset.current).toBe('true');
    expect(within(li).getByTestId('mascot')).toBeTruthy();
    expect(screen.getAllByTestId('mascot')).toHaveLength(1);
  });
});

describe('TrailMap edge cases (G-3 review #3)', () => {
  it('when every unit of a year is finished, no guide is shown on that map', async () => {
    const store = new MemoryProgressStore();
    for (const { chapter } of tracks.find((t) => t.name === 'tahun-3')!.chapters)
      await store.saveChapter(finished(chapter.id));
    window.location.hash = '#/';
    renderApp(store);
    const t3 = await screen.findByTestId('map-tahun-3');
    expect(t3.querySelector('[data-current="true"]')).toBeNull();
    expect(within(t3).queryByTestId('trail-guide')).toBeNull();
    expect(within(t3).getAllByText('Finished')).toHaveLength(3);
  });

  it('a single stop renders without a path and still links', () => {
    render(
      <TrailMap
        current={0}
        stops={[
          {
            key: 'only',
            marker: <span>1</span>,
            label: <span>Only unit</span>,
            wrap: (c) => <a href="#/x">{c}</a>,
          },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: /Only unit/ })).toBeTruthy();
    expect(screen.getByTestId('trail').querySelector('svg')).toBeNull();
    expect(screen.getByTestId('trail-guide')).toBeTruthy();
  });
});
