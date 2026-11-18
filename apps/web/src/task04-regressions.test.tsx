/** Regression tests for docs/handoffs/task-04-kenali.review.md (Codex). */
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import './i18n';
import { parseRoute } from './app/router';
import { Dialog } from './components/ui';
import { findChapter } from './content/loader';
import { Padankan } from './games/Padankan';
import { completeStage, emptyProgress, mergeProgress, openCard } from './engine';
import { MemoryProgressStore } from './storage/ProgressStore';

describe('progress is never lost by a stale save', () => {
  const ids = ['a', 'b'];
  const done = completeStage(openCard(openCard(emptyProgress('c'), 'a'), 'b'), 'kenali', 3, {
    wordIds: ids,
  });
  const stale = openCard(emptyProgress('c'), 'a');

  it('mergeProgress keeps best stars, all opened cards and the earliest completion', () => {
    const m = mergeProgress(done, stale);
    expect(m.stages.kenali.stars).toBe(3);
    expect(m.stages.kenali.completedAt).toBe(done.stages.kenali.completedAt);
    expect([...m.cardsOpened].sort()).toEqual(['a', 'b']);
    expect(mergeProgress(stale, done)).toEqual(m);
    expect(() => mergeProgress(done, emptyProgress('other'))).toThrow();
  });

  it('a store save of a stale snapshot returns the merged progress', async () => {
    const store = new MemoryProgressStore();
    await store.saveChapter(done);
    const result = await store.saveChapter(stale);
    expect(result.stages.kenali.stars).toBe(3);
    expect((await store.loadAll())[0]!.stages.kenali.stars).toBe(3);
  });
});

describe('router', () => {
  it('falls back to home on malformed encoding instead of throwing', () => {
    expect(parseRoute('#/c/%')).toEqual({ name: 'home' });
    expect(parseRoute('#/c/t3-u01/kenali')).toEqual({
      name: 'stage',
      chapterId: 't3-u01',
      stage: 'kenali',
    });
  });
});

describe('Dialog', () => {
  it('returns focus to the opener when it closes', () => {
    function Harness({ open }: { open: boolean }) {
      return (
        <>
          <button type="button">opener</button>
          {open && (
            <Dialog label="d" onClose={() => undefined}>
              <p>content</p>
            </Dialog>
          )}
        </>
      );
    }
    const { rerender } = render(<Harness open={false} />);
    const opener = screen.getByRole('button', { name: 'opener' });
    opener.focus();
    rerender(<Harness open />);
    expect(screen.getByText('content')).toBeTruthy();
    rerender(<Harness open={false} />);
    expect(document.activeElement).toBe(opener);
  });

  it('closes on Escape (cancel) and on a backdrop click, not on content clicks', () => {
    let closed = 0;
    render(
      <Dialog label="d" onClose={() => closed++}>
        <p>content</p>
      </Dialog>,
    );
    const dialog = document.querySelector('dialog')!;
    fireEvent.click(screen.getByText('content'));
    expect(closed).toBe(0);
    fireEvent.click(dialog);
    expect(closed).toBe(1);
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(closed).toBe(2);
  });
});

describe('Padankan without images', () => {
  it('shows the meaning on picture cards so pairs stay distinct', async () => {
    const real = findChapter('t3-u01')!;
    const noMedia = { chapter: real.chapter, dir: 'none/unit-99' };
    render(<Padankan entry={noMedia} onDone={() => undefined} />);
    const imageCard = document.querySelector<HTMLButtonElement>('[data-face="image"]')!;
    fireEvent.click(imageCard);
    const meaning = await screen.findByTestId('pad-meaning');
    const word = real.chapter.words.find((w) => w.id === imageCard.dataset.wordId)!;
    expect(meaning.textContent).toBe(word.meaning.en);
  });
});
