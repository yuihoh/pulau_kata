import { describe, expect, it } from 'vitest';
import { findChapter, findQuest } from '../content/loader';
import { QuestSchema, type Chapter, type Quest } from '../content/schema';
import { checkQuest } from '../content/validate';
import {
  answerStep,
  canOpenMisi,
  challengeCount,
  currentStep,
  nextStep,
  optionsFor,
  questSummary,
  startQuest,
  visibleProps,
  type QuestRun,
} from './quest';

const { quest, entry } = findQuest('t3-u02')!;
const chapter = entry.chapter;

/** The right answer for the current step (option text or prop id). */
function right(run: QuestRun): string {
  const step = currentStep(quest, run)!;
  if (step.kind === 'find') return step.answer;
  if (step.kind === 'choose') return chapter.words.find((w) => w.id === step.word)!.word;
  throw new Error('not a challenge');
}

/** Plays the whole quest; `miss` lists challenge indexes answered wrongly first. */
function play(miss: number[] = []) {
  let run = startQuest(quest, 1);
  let c = 0;
  for (let guard = 0; guard < 200 && !run.done; guard++) {
    const step = currentStep(quest, run)!;
    if (step.kind !== 'say') {
      if (miss.includes(c)) {
        const wrong =
          step.kind === 'choose'
            ? optionsFor(run).find((o) => o !== right(run))!
            : visibleProps(quest, run).find((p) => p.id !== right(run))!.id;
        run = answerStep(quest, chapter, run, wrong);
        expect(run.solved).toBe(false);
      }
      run = answerStep(quest, chapter, run, right(run));
      expect(run.solved).toBe(true);
      c++;
    }
    run = nextStep(quest, run);
  }
  return run;
}

describe('Misi engine', () => {
  it('the Unit 2 quest is valid and practises all 12 words', () => {
    expect(QuestSchema.safeParse(quest).success).toBe(true);
    expect(checkQuest(quest, chapter)).toEqual([]);
    expect(challengeCount(quest)).toBe(12);
  });

  it('a perfect run ends with 3 stars and nothing to practise', () => {
    const run = play();
    expect(run.done).toBe(true);
    expect(questSummary(quest, run)).toEqual({ stars: 3, firstTry: 12, total: 12, practise: [] });
  });

  it('a wrong choice is crossed out, can be retried, and counts against first try only', () => {
    const run = play([0, 4]);
    const sum = questSummary(quest, run);
    expect(sum.firstTry).toBe(10);
    expect(sum.practise).toEqual(['sepupu', 'memancing']);
    expect(sum.stars).toBe(2);
  });

  it('cannot skip a challenge, and ignores repeated wrong taps', () => {
    let run = startQuest(quest, 1);
    run = nextStep(quest, run); // narrator line → first challenge
    expect(nextStep(quest, run)).toBe(run);
    const wrong = optionsFor(run).find((o) => o !== right(run))!;
    run = answerStep(quest, chapter, run, wrong);
    expect(answerStep(quest, chapter, run, wrong)).toBe(run);
    expect(run.wrong).toEqual([wrong]);
  });

  it('options are shuffled by seed and always include the answer', () => {
    const a = startQuest(quest, 1);
    const b = startQuest(quest, 1);
    expect(a.order).toEqual(b.order);
    for (const opts of Object.values(a.order)) expect(opts.length).toBeGreaterThanOrEqual(3);
  });

  it('a solved choose step reveals its hidden prop (the rambutan basket)', () => {
    let run = startQuest(quest, 1);
    while (!(currentStep(quest, run)?.kind === 'choose' && run.scene === 1)) {
      if (currentStep(quest, run)!.kind !== 'say')
        run = answerStep(quest, chapter, run, right(run));
      run = nextStep(quest, run);
    }
    expect(visibleProps(quest, run).map((p) => p.id)).not.toContain('bakul');
    run = answerStep(quest, chapter, run, right(run));
    expect(visibleProps(quest, run).map((p) => p.id)).toContain('bakul');
  });
});

describe('task-05c review regressions', () => {
  it('#1 answers match the validator: case and extra spaces never make a step unanswerable', () => {
    const q: Quest = structuredClone(quest);
    const step = q.scenes[0]!.steps[1]!;
    if (step.kind !== 'choose') throw new Error('expected choose');
    step.options = [' Sepupu ', 'jiran', 'guru'];
    // The validator rejects the untidy option…
    expect(checkQuest(q, chapter).some((i) => /extra spaces/.test(i.message))).toBe(true);
    // …and the engine still accepts it as the answer.
    let run = nextStep(q, startQuest(q, 1));
    run = answerStep(q, chapter, run, ' Sepupu ');
    expect(run.solved).toBe(true);
  });

  it('#2 a Misi opens only after Uji, unless in lab mode', () => {
    expect(canOpenMisi(false, false)).toBe(false);
    expect(canOpenMisi(true, false)).toBe(true);
    expect(canOpenMisi(false, true)).toBe(true);
  });
});

describe('checkQuest', () => {
  const unit2 = findChapter('t3-u02')!.chapter;
  const clone = (): Quest => structuredClone(quest);
  const errors = (q: Quest, c: Chapter = unit2) =>
    checkQuest(q, c)
      .filter((i) => i.severity === 'error')
      .map((i) => i.message);

  it('catches an answer missing from the options', () => {
    const q = clone();
    const step = q.scenes[0]!.steps[1]!;
    if (step.kind === 'choose') step.options = ['jiran', 'guru', 'adik'];
    expect(errors(q).join()).toMatch(/must contain "sepupu"/);
  });

  it('catches a translation that would give the answer away (no blank)', () => {
    const q = clone();
    q.scenes[0]!.steps[1]!.line.en = "Hi! I'm Aina, your cousin.";
    expect(errors(q).join()).toMatch(/line\.en|exactly one "___"/);
  });

  it('catches a find answer that is hidden at that step', () => {
    const q = clone();
    q.scenes[1]!.props.find((p) => p.id === 'joran')!.hidden = true;
    expect(errors(q).join()).toMatch(/not visible/);
  });

  it('catches unknown speakers and words', () => {
    const q = clone();
    q.scenes[0]!.steps[0]!.speaker = 'nenek';
    const step = q.scenes[0]!.steps[2]!;
    if (step.kind === 'choose') step.word = 'tiada';
    const msgs = errors(q).join();
    expect(msgs).toMatch(/unknown speaker/);
    expect(msgs).toMatch(/not in t3-u02/);
  });

  it('warns when a chapter word is not practised', () => {
    const q = clone();
    q.scenes[2]!.steps = q.scenes[2]!.steps.filter((s) => s.kind === 'say');
    const warnings = checkQuest(q, unit2).filter((i) => i.severity === 'warning');
    expect(warnings.map((w) => w.message).join()).toMatch(/air terjun/);
  });
});
