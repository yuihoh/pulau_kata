import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';
import { findChapter } from '../content/loader';
import AudioReview, { clipsFor } from './AudioReview';

const played: string[] = [];
const paused: string[] = [];
let created = 0;
/** What the next clips do: 'ends' (default), 'stalls' (never ends) or 'refused' (play() rejects). */
const behaviour = new Map<string, 'stalls' | 'refused'>();

/** A fake <audio>: one shared element plays whatever src it is given. */
class FakeAudio {
  currentTime = 0;
  volume = 1;
  src = '';
  private listeners = new Map<string, Set<() => void>>();
  constructor() {
    created++;
  }
  addEventListener(type: string, fn: () => void) {
    (this.listeners.get(type) ?? this.listeners.set(type, new Set()).get(type)!).add(fn);
  }
  removeEventListener(type: string, fn: () => void) {
    this.listeners.get(type)?.delete(fn);
  }
  private fire(type: string) {
    for (const fn of [...(this.listeners.get(type) ?? [])]) fn();
  }
  play() {
    played.push(this.src);
    const how = [...behaviour].find(([key]) => this.src.includes(key))?.[1];
    if (how === 'refused') return Promise.reject(new Error('NotAllowedError'));
    if (how !== 'stalls') setTimeout(() => this.fire('ended'), 10);
    return Promise.resolve();
  }
  pause() {
    paused.push(this.src);
  }
}

beforeEach(() => {
  // Reset here too: the previous test's unmount (cleanup) runs after our afterEach.
  played.length = 0;
  paused.length = 0;
  created = 0;
  behaviour.clear();
  vi.stubGlobal('Audio', FakeAudio);
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  played.length = 0;
  paused.length = 0;
  created = 0;
  behaviour.clear();
  localStorage.clear();
});

describe('clipsFor', () => {
  it('lists every word, example and Misi line with the audio file it points to', () => {
    const u2 = findChapter('t3-u02')!;
    const clips = clipsFor(u2, 'en');
    expect(clips.filter((c) => c.section === 'words')).toHaveLength(24);
    const lines = clips.filter((c) => c.section === 'lines');
    expect(lines.length).toBeGreaterThan(10);
    // Every clip has its generated MP3 (nothing missing).
    expect(clips.filter((c) => !c.src)).toEqual([]);
    const sepupu = clips.find((c) => c.item.path === 'audio/sepupu.mp3')!;
    expect(sepupu.note).toBe('cousin');
    expect(clips.find((c) => c.item.path === 'audio/sepupu-example.mp3')!.note).toMatch(/cousin/i);
    expect(lines.find((c) => c.item.path === 'quest/audio/hutan-1.mp3')!.note).toBe('Aina');
  });
});

describe('Audio review page', () => {
  it('▶ plays that clip', async () => {
    render(<AudioReview chapterId="t3-u02" />);
    fireEvent.click(screen.getByRole('button', { name: /^Play: sepupu$/ }));
    await act(async () => undefined);
    expect(played).toHaveLength(1);
    expect(played[0]).toMatch(/sepupu\.mp3/);
  });

  it('Play all plays a unit’s words in order, then stops', async () => {
    render(<AudioReview chapterId="t3-u02" />);
    fireEvent.click(screen.getByTestId('play-all-t3-u02-words'));
    for (let i = 0; i < 60; i++)
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
    expect(played).toHaveLength(24);
    // Word, then its example, for each word in chapter order.
    expect(played[0]).toMatch(/anak-sulung|sepupu/);
    expect(played[0]).not.toMatch(/example/);
    expect(played[1]).toMatch(/-example/);
    expect(screen.queryByRole('button', { name: /Stop/ })).toBeNull();
  });

  it('flags are remembered and the flagged list can be copied', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const { unmount } = render(<AudioReview chapterId="t3-u02" />);
    expect(screen.getByText('Nothing flagged yet.')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /Needs fixing: sepupu$/ }));
    expect(screen.getByTestId('flagged-title').textContent).toBe('Needs fixing (1)');
    expect((screen.getByTestId('flagged-text') as HTMLTextAreaElement).value).toContain(
      't3-u02 · audio/sepupu.mp3 · ms-MY-YasminNeural · "sepupu"',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy the list' }));
    await act(async () => undefined);
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('audio/sepupu.mp3'));

    unmount(); // reload: the flag is still there
    render(<AudioReview chapterId="t3-u02" />);
    expect(screen.getByTestId('flagged-title').textContent).toBe('Needs fixing (1)');
    fireEvent.click(screen.getByRole('checkbox', { name: /Needs fixing: sepupu$/ }));
    expect(screen.getByText('Nothing flagged yet.')).toBeTruthy();
  });

  it('survives corrupt saved flags', () => {
    localStorage.setItem('jk.audioReview', '[1,2');
    render(<AudioReview chapterId="t3-u02" />);
    expect(screen.getByText('Nothing flagged yet.')).toBeTruthy();
  });
});

describe('task-07b review regressions', () => {
  const tick = (ms: number) =>
    act(async () => {
      vi.advanceTimersByTime(ms);
    });

  it('#1 Play all reuses ONE audio element (Safari unlocks an element, not each new one)', async () => {
    render(<AudioReview chapterId="t3-u02" />);
    fireEvent.click(screen.getByTestId('play-all-t3-u02-words'));
    for (let i = 0; i < 12; i++) await tick(600);
    expect(played.length).toBeGreaterThan(5);
    expect(created).toBe(1);
  });

  it('#1 a refused clip does not stall the list: the next clip plays at once, not after 20 s', async () => {
    behaviour.set('anak-sulung.mp3', 'refused');
    render(<AudioReview chapterId="t3-u01" />);
    fireEvent.click(screen.getByTestId('play-all-t3-u01-words'));
    // Small steps: the gap before the next clip only starts once the refusal has been handled.
    for (let i = 0; i < 4; i++) await tick(400);
    expect(played.some((p) => p.includes('anak-sulung-example.mp3'))).toBe(true);
  });

  it('#2 a stalled clip is paused when it times out, so it cannot keep playing', async () => {
    behaviour.set('sepupu.mp3', 'stalls');
    render(<AudioReview chapterId="t3-u02" />);
    fireEvent.click(screen.getByRole('button', { name: /^Play: sepupu$/ }));
    await tick(1000);
    expect(paused).toHaveLength(0);
    await tick(20_500);
    expect(paused.filter((p) => p.includes('sepupu.mp3'))).toHaveLength(1);
    await tick(600); // the short gap after the clip, then the list is over
    expect(screen.queryByRole('button', { name: /Stop/ })).toBeNull();
  });

  it('#3 leaving the page stops playback; starting another list replaces the first cleanly', async () => {
    behaviour.set('sepupu.mp3', 'stalls');
    const { unmount } = render(<AudioReview chapterId="t3-u02" />);
    fireEvent.click(screen.getByRole('button', { name: /^Play: sepupu$/ }));
    await tick(500);
    // A second list starts while the first clip is stalled: the old timer must not fire later.
    behaviour.delete('sepupu.mp3');
    fireEvent.click(screen.getByRole('button', { name: /^Play: bercuti$/ }));
    await tick(25_000);
    expect(paused.filter((p) => p.includes('bercuti.mp3'))).toHaveLength(0);
    // Unmounting (leaving the page, or switching unit) pauses the element.
    paused.length = 0;
    unmount();
    expect(paused).toHaveLength(1);
  });

  it('#4 the flagged list has an accessible name', () => {
    render(<AudioReview chapterId="t3-u02" />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Needs fixing: sepupu$/ }));
    expect(screen.getByRole('textbox', { name: 'Needs fixing (1)' })).toBeTruthy();
  });
});

describe('Tahun 5 on the review page', () => {
  it('has a link for every unit of every year, and the current one is marked', () => {
    render(<AudioReview chapterId="t5-u01" />);
    const nav = screen.getByRole('navigation', { name: 'Jump to a unit' });
    const links = nav.querySelectorAll('a');
    expect([...links].map((a) => a.textContent)).toEqual([
      'All units',
      'T3 · U1',
      'T3 · U2',
      'T3 · U3',
      'T5 · U1',
      'T5 · U2',
      'T5 · U3',
    ]);
    expect(screen.getByTestId('review-jump-t5-u01').getAttribute('aria-current')).toBe('page');
    expect(screen.getByTestId('review-jump-t5-u01').getAttribute('href')).toBe(
      '#/lab/audio/t5-u01',
    );
    expect(screen.getByTestId('review-jump-all').getAttribute('href')).toBe('#/lab/audio');
  });

  it('lists the Tahun 5 clips with the year in the heading', () => {
    render(<AudioReview chapterId="t5-u02" />);
    expect(screen.getByText('(Tahun 5)')).toBeTruthy();
    expect(screen.getAllByTestId('clip')).toHaveLength(24);
    expect(screen.getByRole('button', { name: /^Play: cemerlang$/ })).toBeTruthy();
  });

  it('the page with no unit chosen lists both years', () => {
    render(<AudioReview />);
    expect(screen.getAllByText('(Tahun 3)')).toHaveLength(3);
    expect(screen.getAllByText('(Tahun 5)')).toHaveLength(3);
  });
});
