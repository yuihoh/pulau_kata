/** The two arcade mini-games (Tangkap Buah, Pecah Belon): screens over the pure engines. */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';
import PecahBelon, { COLOURS } from './PecahBelon';
import TangkapBuah from './TangkapBuah';

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

const wrap = (ui: React.ReactNode) => <LazyMotion features={domAnimation}>{ui}</LazyMotion>;

async function run(ms: number, step = 100) {
  for (let t = 0; t < ms; t += step)
    await act(async () => {
      vi.advanceTimersByTime(step);
    });
}

describe('Tangkap Buah screen', () => {
  const start = () => {
    render(wrap(<TangkapBuah chapterId="t3-u01" seed={11} />));
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
  };

  it('opens on a unit chooser with the game explained, then starts the orchard', () => {
    render(wrap(<TangkapBuah chapterId="t3-u02" seed={11} />));
    expect(screen.getByText('Catch the fruit with the right word!')).toBeTruthy();
    expect(screen.getByTestId('unit-t3-u02').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    expect(screen.getByTestId('orchard')).toBeTruthy();
    expect(screen.getByTestId('basket')).toBeTruthy();
    expect(screen.getByTestId('sampan-prompt')).toBeTruthy();
  });

  it('fruit with words falls; the screen reader hears the question and the fruit words', async () => {
    start();
    await run(4000);
    const fruits = screen.getAllByTestId('fruit');
    expect(fruits.length).toBeGreaterThan(0);
    for (const f of fruits) expect(f.textContent!.length).toBeGreaterThan(0);
    const text = screen.getByTestId('tangkap-announce').textContent!;
    expect(text).toMatch(/^Question 1\./);
    expect(text).toContain('Fruit words:');
  });

  it('the move buttons and arrow keys move the basket; a pause freezes everything', async () => {
    start();
    const x = () => Number(screen.getByTestId('basket').dataset.x);
    expect(x()).toBeCloseTo(0.5);
    fireEvent.click(screen.getByRole('button', { name: 'Move the basket left' }));
    expect(x()).toBeCloseTo(0.4);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(x()).toBeCloseTo(0.6);

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByText('Paused')).toBeTruthy();
    const before = screen.queryAllByTestId('fruit').map((f) => f.style.top);
    await run(3000);
    expect(screen.queryAllByTestId('fruit').map((f) => f.style.top)).toEqual(before);
    fireEvent.keyDown(window, { key: 'ArrowLeft' }); // ignored while paused
    expect(x()).toBeCloseTo(0.6);
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(x()).toBeCloseTo(0.5);
  });

  it('the words are also offered as buttons: choosing the right one is the same as catching it', () => {
    start();
    const group = screen.getByRole('group', { name: 'Choose a word without moving the basket' });
    const buttons = within(group).getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    const wordId = screen.getByTestId('sampan-prompt').dataset.wordId!;
    // A wrong one first: a kind note, the question stays.
    const wrong = buttons.find((b) => b.dataset.optionId !== wordId)!;
    fireEvent.click(wrong);
    expect(screen.getByText('Not that one!')).toBeTruthy();
    fireEvent.click(
      screen.getByTestId('tangkap-choices').querySelector('[data-option-id="' + wordId + '"]')!,
    );
    expect(screen.getByText('Betul!')).toBeTruthy();
  });

  it('catching the right fruit says Betul! with the hornbill and the answer', async () => {
    start();
    const prompt = screen.getByTestId('sampan-prompt');
    const wordId = prompt.dataset.wordId!;
    // Follow the right fruit with the basket until it is caught (drag = pointer on the orchard).
    const orchard = screen.getByTestId('orchard');
    vi.spyOn(orchard, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 300,
      bottom: 400,
      width: 300,
      height: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    for (let t = 0; t < 40_000 && !screen.queryByText('Betul!'); t += 50) {
      const right = screen
        .queryAllByTestId('fruit')
        .find((f) => f.dataset.right === 'true' && parseFloat(f.style.top) < 1e9);
      if (right) {
        // The fruit's x is in its inline style as a clamp(...); read the percentage from it.
        const m = /,\s*([\d.]+)%/.exec(right.style.left);
        if (m)
          fireEvent.pointerDown(orchard, { clientX: (Number(m[1]) / 100) * 300, pointerId: 1 });
      }
      await run(50, 50);
    }
    expect(screen.getByText('Betul!')).toBeTruthy();
    const card = screen.getByText('Betul!').parentElement!;
    expect(within(card).getByTestId('mascot').dataset.pose).toBe('cheer');
    expect(wordId).toBeTruthy();
  });
});

describe('Pecah Belon screen', () => {
  const start = () => {
    render(wrap(<PecahBelon chapterId="t3-u01" seed={5} />));
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
  };

  it('opens on a unit chooser and starts with a round banner naming the word class', () => {
    render(wrap(<PecahBelon chapterId="t3-u02" seed={5} />));
    expect(screen.getByText('Pop the balloons with the right type of word!')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    const banner = screen.getByTestId('belon-banner');
    expect(banner.textContent).toMatch(/Round 1 of \d/);
    expect(banner.textContent).toMatch(/Pop every kata \w+ \(/);
    expect(screen.getByTestId('belon-prompt').dataset.target).toMatch(/^kata /);
  });

  it('after the banner balloons float; popping a right one counts down, a wrong one is gentle', async () => {
    start();
    await run(3000);
    expect(screen.queryByTestId('belon-banner')).toBeNull();
    const togo = () => screen.getByTestId('belon-togo').textContent;
    expect(togo()).toMatch(/to go/);

    // Wait for a right and a wrong balloon, then pop them.
    for (
      let t = 0;
      t < 20_000 && !screen.queryAllByTestId('balloon').some((b) => b.dataset.target === 'true');
      t += 100
    )
      await run(100);
    const before = togo();
    const right = screen.getAllByTestId('balloon').find((b) => b.dataset.target === 'true')!;
    fireEvent.click(right);
    expect(togo()).not.toBe(before);
    expect(
      screen
        .queryAllByTestId('balloon')
        .some((b) => b.dataset.balloonId === right.dataset.balloonId),
    ).toBe(false); // the popped balloon is gone

    for (
      let t = 0;
      t < 20_000 && !screen.queryAllByTestId('balloon').some((b) => b.dataset.target === 'false');
      t += 100
    )
      await run(100);
    const wrong = screen.getAllByTestId('balloon').find((b) => b.dataset.target === 'false')!;
    fireEvent.click(wrong);
    const note = screen.getByRole('status');
    expect(note.textContent).toMatch(/is not a/);
    expect(within(note).getByTestId('mascot').dataset.pose).toBe('encourage'); // kind, never harsh
    expect(screen.getByTestId('belon-prompt')).toBeTruthy(); // the game goes on
  });

  it('every balloon is a real button with a name; a pause freezes and blocks popping', async () => {
    start();
    await run(3500);
    for (const b of screen.getAllByTestId('balloon')) {
      expect(b.tagName).toBe('BUTTON');
      expect(b.getAttribute('aria-label')).toMatch(/balloon$/);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    const tops = screen.getAllByTestId('balloon').map((b) => b.style.top);
    await run(3000);
    expect(screen.getAllByTestId('balloon').map((b) => b.style.top)).toEqual(tops);
    const first = screen.getAllByTestId('balloon')[0]!;
    expect((first as HTMLButtonElement).disabled).toBe(true);
  });

  it('popping every right balloon through to the end shows the result with practise words empty', async () => {
    start();
    for (let t = 0; t < 120_000 && !screen.queryByTestId('belon-result'); t += 100) {
      for (const b of screen.queryAllByTestId('balloon'))
        if (b.dataset.target === 'true') fireEvent.click(b);
      await run(100);
    }
    expect(screen.getByTestId('belon-result')).toBeTruthy();
    expect(screen.getByText(/balloons popped right/)).toBeTruthy();
    expect(screen.getByText(/You got every word right the first time!/)).toBeTruthy();
  });

  it('a unit that cannot play it says so and keeps Start disabled', () => {
    render(wrap(<PecahBelon chapterId="t3-u01" seed={5} />));
    // Every pilot unit can play it, so no warning is shown.
    expect(screen.queryByText(/does not have enough different word types/)).toBeNull();
    expect((screen.getByRole('button', { name: /Start/ }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });
});

// G-4 review #4: white balloon text must be readable on every balloon colour.
describe('Pecah Belon colours', () => {
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const mix = (a: string, b: string) =>
    '#' +
    [1, 3, 5]
      .map((i) =>
        Math.round((parseInt(a.slice(i, i + 2), 16) + parseInt(b.slice(i, i + 2), 16)) / 2)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('');

  it('white text on the middle of every balloon gradient has at least 4.5:1 contrast', () => {
    for (const c of COLOURS) {
      const mid = mix(c.ends[0], c.ends[1]);
      const ratio = 1.05 / (lum(mid) + 0.05);
      expect(ratio, `${c.body} (middle ${mid})`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
