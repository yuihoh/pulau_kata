import { act, fireEvent, render, screen } from '@testing-library/react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import SampanKata from './SampanKata';

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

function renderGame() {
  render(
    <LazyMotion features={domAnimation}>
      <SampanKata chapterId="t3-u01" seed={11} />
    </LazyMotion>,
  );
  fireEvent.click(screen.getByRole('button', { name: /Start/ }));
}

const lane = (el: HTMLElement) => Number(el.dataset.lane);

/** Steers with the ◀ ▶ buttons to the answer buoy (or away from it). */
function steerTo(correct: boolean) {
  const answerId = screen.getByTestId('sampan-prompt').dataset.wordId!;
  const buoys = screen.getAllByTestId('buoy');
  const target = buoys.find((b) => (b.dataset.optionId === answerId) === correct)!;
  let boat = lane(screen.getByTestId('boat'));
  while (boat !== lane(target)) {
    fireEvent.click(
      screen.getByRole('button', { name: boat < lane(target) ? 'Steer right' : 'Steer left' }),
    );
    boat = lane(screen.getByTestId('boat'));
  }
}

async function sail(ms: number) {
  for (let t = 0; t < ms; t += 500)
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
}

/** Sails until the row reaches the boat and the feedback appears. */
async function sailToFeedback() {
  for (let t = 0; t < 10_000 && !screen.queryByRole('status'); t += 100)
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
}

describe('Sampan Kata screen', () => {
  it('steering into the right buoy says Betul and scores', async () => {
    renderGame();
    steerTo(true);
    await sailToFeedback();
    expect(screen.getByText(/Betul!/)).toBeTruthy();
    expect(Number(screen.getByTestId('score').textContent)).toBeGreaterThan(0);
  });

  it('a wrong buoy shows Cuba lagi! and the right word', async () => {
    renderGame();
    const word = screen.getByTestId('sampan-prompt').dataset.wordId!;
    steerTo(false);
    await sailToFeedback();
    expect(screen.getByText('Cuba lagi!')).toBeTruthy();
    const answer = screen.getAllByTestId('buoy').find((b) => b.dataset.optionId === word)!;
    expect(screen.getByRole('status').textContent).toContain(answer.textContent);
  });

  it('pause stops the river; arrow keys steer', async () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    const before = screen.getAllByTestId('buoy')[0]!.style.top;
    await sail(3000);
    expect(screen.getAllByTestId('buoy')[0]!.style.top).toBe(before);
    expect(screen.getByText('Paused')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'ArrowLeft' }); // ignored while paused
    expect(lane(screen.getByTestId('boat'))).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(lane(screen.getByTestId('boat'))).toBe(0);
  });

  it('announces the question number, the prompt and the buoys (review #3)', () => {
    renderGame();
    const text = screen.getByTestId('sampan-announce').textContent!;
    expect(text).toMatch(/^Question 1\./);
    expect(text).toContain('Which word');
    for (const b of screen.getAllByTestId('buoy')) expect(text).toContain(b.textContent!);
  });

  it('steering after a miss does not move the "your answer" highlight (review #4)', async () => {
    renderGame();
    steerTo(false);
    const chosenLane = lane(screen.getByTestId('boat'));
    await sailToFeedback();
    const chosen = () => screen.getAllByTestId('buoy').find((b) => lane(b) === chosenLane)!;
    expect(chosen().dataset.state).toBe('chosen');
    fireEvent.click(
      screen.getByRole('button', { name: chosenLane === 0 ? 'Steer right' : 'Steer left' }),
    );
    expect(chosen().dataset.state).toBe('chosen');
    expect(screen.getAllByTestId('buoy').filter((b) => b.dataset.state === 'chosen')).toHaveLength(
      1,
    );
  });

  it('a full perfect round ends with 3 stars and nothing to practise', async () => {
    renderGame();
    for (let i = 0; i < 12; i++) {
      steerTo(true);
      // Sail until the next wave (or the result) appears.
      const id = screen.getByTestId('sampan-prompt').dataset.wordId;
      for (let k = 0; k < 40; k++) {
        await sail(500);
        if (screen.queryByTestId('sampan-result')) break;
        const p = screen.queryByTestId('sampan-prompt');
        if (p && p.dataset.wordId !== id && !screen.queryByRole('status')) break;
      }
    }
    expect(screen.getByTestId('sampan-result')).toBeTruthy();
    expect(screen.getByText('You got 3 stars!')).toBeTruthy();
    expect(screen.getByText('You got every word right the first time!')).toBeTruthy();
  });
});

// G-6 review #6: the feedback card in 中文. (The buoy/boat geometry is checked in the browser:
// jsdom has no layout, see the 320x568 e2e test.)
describe('Sampan Kata UI (G-6 review)', () => {
  it('the feedback card shows the answer and its 中文 meaning', async () => {
    try {
      renderGame();
      const word = screen.getByTestId('sampan-prompt').dataset.wordId!;
      steerTo(false); // steering buttons are labelled in English here
      await act(async () => {
        await i18n.changeLanguage('zh');
      });
      await sailToFeedback();
      const card = screen.getByRole('status');
      const answer = screen.getAllByTestId('buoy').find((b) => b.dataset.optionId === word)!;
      expect(card.textContent).toContain(answer.textContent!);
      expect(card.textContent).toMatch(/[一-鿿]/); // a Chinese meaning is shown
      expect(card.querySelector('[data-testid="mascot"]')!.getAttribute('data-pose')).toBe(
        'encourage',
      );
    } finally {
      await i18n.changeLanguage('en');
    }
  });
});
