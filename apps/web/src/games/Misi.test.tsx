import { fireEvent, render, screen } from '@testing-library/react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { afterEach, describe, expect, it } from 'vitest';
import '../i18n';
import { findChapter, findQuest } from '../content/loader';
import { completeStage, emptyProgress, openCard } from '../engine';
import { ChapterScreen } from '../screens/ChapterScreen';
import { MemoryProgressStore } from '../storage/ProgressStore';
import { ProgressProvider } from '../storage/ProgressProvider';
import Misi from './Misi';

const { quest, entry } = findQuest('t3-u02')!;
const wordText = (id: string) => entry.chapter.words.find((w) => w.id === id)!.word;

afterEach(() => localStorage.clear());

function renderMisi() {
  render(
    <LazyMotion features={domAnimation}>
      <Misi chapterId="t3-u02" seed={3} />
    </LazyMotion>,
  );
  fireEvent.click(screen.getByRole('button', { name: /Start the adventure/ }));
}

/** The current step from the quest content, located by scene id and line text. */
function currentStep() {
  const sceneId = screen.getByTestId('scene').dataset.scene!;
  const scene = quest.scenes.find((s) => s.id === sceneId)!;
  const line = screen.getByTestId('line').textContent!.replaceAll(String.fromCharCode(160), ' ');
  return scene.steps.find((st) => {
    const [a, b] = st.line.bm.split('___');
    return line.startsWith(a!.trim()) && line.trimEnd().endsWith((b ?? '').trim());
  })!;
}

function solve(wrongFirst = false) {
  const step = currentStep();
  if (step.kind === 'choose') {
    const right = wordText(step.word);
    if (wrongFirst)
      fireEvent.click(
        screen.getAllByTestId('misi-option').find((o) => o.dataset.option !== right)!,
      );
    fireEvent.click(screen.getAllByTestId('misi-option').find((o) => o.dataset.option === right)!);
  } else if (step.kind === 'find') {
    if (wrongFirst)
      fireEvent.click(screen.getAllByTestId('prop').find((p) => p.dataset.propId !== step.answer)!);
    fireEvent.click(screen.getAllByTestId('prop').find((p) => p.dataset.propId === step.answer)!);
  }
}

function playToEnd(wrongFirst = false) {
  for (let i = 0; i < 40 && !screen.queryByTestId('misi-result'); i++) {
    solve(wrongFirst);
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
  }
}

describe('Misi screen', () => {
  it('a perfect adventure gives 3 stars and the holiday photo', () => {
    renderMisi();
    playToEnd();
    expect(screen.getByTestId('misi-result')).toBeTruthy();
    expect(screen.getByText('You got 3 stars!')).toBeTruthy();
    expect(screen.getByText('Gambar kenangan')).toBeTruthy();
    expect(screen.getByText('You chose every word right the first time!')).toBeTruthy();
  });

  it('a wrong choice is crossed out, the character gives a hint, and Next waits', () => {
    renderMisi();
    fireEvent.click(screen.getByRole('button', { name: /Next/ })); // narrator line
    const step = currentStep();
    expect(step.kind).toBe('choose');
    const wrong = screen.getAllByTestId('misi-option').find((o) => o.dataset.option !== 'sepupu')!;
    fireEvent.click(wrong);
    expect((wrong as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId('hint').textContent).toContain('Hmm, bukan itu.');
    expect(screen.queryByRole('button', { name: /Next/ })).toBeNull();
    fireEvent.click(
      screen.getAllByTestId('misi-option').find((o) => o.dataset.option === 'sepupu')!,
    );
    expect(screen.getByTestId('line').textContent).toContain('sepupu');
    expect(screen.getByText('Betul!')).toBeTruthy();
  });

  it('🌐 shows the translation with the blank still blank, and stays on', () => {
    renderMisi();
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Translate' }));
    const tr = screen.getByTestId('translation').textContent!;
    expect(tr).toContain('___');
    expect(tr).not.toMatch(/cousin/i);
    solve();
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByTestId('translation')).toBeTruthy();
  });

  it('find steps: only then can props be tapped; the right prop solves it', () => {
    renderMisi();
    const props = () => screen.getAllByTestId('prop') as HTMLButtonElement[];
    expect(props().every((p) => p.disabled)).toBe(true);
    for (let i = 0; i < 10 && currentStep().kind !== 'find'; i++) {
      solve();
      fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    }
    expect(props().some((p) => !p.disabled)).toBe(true);
    expect(screen.getByText(/Tap the right thing/)).toBeTruthy();
    solve(true);
    expect(screen.getByText('Betul!')).toBeTruthy();
  });

  it('mistakes show up as words to practise', () => {
    renderMisi();
    playToEnd(true);
    expect(screen.getByText('You got 1 star!')).toBeTruthy();
    expect(screen.getByTestId('misi-practise').textContent).toContain('sepupu');
  });
});

describe('task-05c review regressions (screen)', () => {
  it('#5 a unit without a quest says so instead of showing another unit', () => {
    render(
      <LazyMotion features={domAnimation}>
        <Misi chapterId="t3-u01" />
      </LazyMotion>,
    );
    expect(screen.getByText('There is no story adventure for this unit yet.')).toBeTruthy();
  });

  it('#4 the line and answers come before the scene props in reading/focus order', () => {
    renderMisi();
    for (let i = 0; i < 10 && currentStep().kind !== 'find'; i++) {
      solve();
      fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    }
    const line = screen.getByTestId('line');
    const firstProp = screen.getAllByTestId('prop')[0]!;
    expect(document.activeElement).toBe(line);
    expect(line.compareDocumentPosition(firstProp) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('Misi saves its result once (task 7)', () => {
  it('calls onComplete exactly once with the stars when the adventure ends', () => {
    const calls: number[] = [];
    render(
      <LazyMotion features={domAnimation}>
        <Misi chapterId="t3-u02" seed={3} onComplete={(s) => calls.push(s)} />
      </LazyMotion>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Start the adventure/ }));
    playToEnd();
    expect(calls).toEqual([3]);
    expect(screen.getByRole('link', { name: /See my Koleksi/ })).toBeTruthy();
  });

  it('pure lab play (no onComplete) saves nothing and offers no Koleksi link', () => {
    renderMisi();
    playToEnd();
    expect(screen.queryByRole('link', { name: /See my Koleksi/ })).toBeNull();
  });
});

describe('Misi card on the unit screen', () => {
  function renderChapter(ujiDone: boolean) {
    const store = new MemoryProgressStore();
    const ch = findChapter('t3-u02')!;
    const ids = ch.chapter.words.map((w) => w.id);
    let p = emptyProgress(ch.chapter.id);
    for (const id of ids) p = openCard(p, id);
    p = completeStage(p, 'kenali', 3, { wordIds: ids });
    if (ujiDone) p = completeStage(p, 'uji', 3);
    void store.saveChapter(p);
    render(
      <ProgressProvider store={store}>
        <ChapterScreen entry={ch} />
      </ProgressProvider>,
    );
  }

  it('is locked until Uji is done', async () => {
    renderChapter(false);
    const card = await screen.findByTestId('misi-card');
    expect(card.tagName).toBe('DIV');
    expect(card.textContent).toContain('Finish Uji');
  });

  it('links to the adventure after Uji', async () => {
    renderChapter(true);
    await screen.findByText(/Bonus story adventure/);
    expect(screen.getByTestId('misi-card').getAttribute('href')).toBe('#/lab/misi/t3-u02');
  });
});
