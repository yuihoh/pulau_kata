/**
 * Misi (story quest) runner. Pure: the quest content is read-only, the run state is plain
 * data, and option order is seeded. No timer and no failing: a wrong choice is crossed out
 * and the character gives a hint; the child tries again until it's right.
 */
import type { Chapter, Quest, QuestProp, QuestStep } from '../content/schema';
import { createRng, shuffle } from './rng';
import { starsFromRatio, type Stars } from './scoring';

export interface QuestRun {
  scene: number;
  step: number;
  /** Options (choose) or prop ids (find) already tried wrongly on the current step. */
  wrong: string[];
  /** True once the current challenge is answered correctly (waiting for "Next"). */
  solved: boolean;
  /** Hidden props revealed so far, per scene id. */
  revealed: Record<string, string[]>;
  /** Per challenge (`scene/step`): right on the first try? */
  results: Record<string, { wordId: string; firstTry: boolean }>;
  /** Shuffled option order per `choose` step (`scene/step`). */
  order: Record<string, string[]>;
  done: boolean;
}

const key = (scene: number, step: number) => `${scene}/${step}`;
export const isChallenge = (s: QuestStep) => s.kind !== 'say';

export function startQuest(quest: Quest, seed = Date.now()): QuestRun {
  const rng = createRng(seed);
  const order: Record<string, string[]> = {};
  quest.scenes.forEach((sc, si) =>
    sc.steps.forEach((st, i) => {
      if (st.kind === 'choose') order[key(si, i)] = shuffle(st.options, rng);
    }),
  );
  return {
    scene: 0,
    step: 0,
    wrong: [],
    solved: false,
    revealed: {},
    results: {},
    order,
    done: false,
  };
}

export function currentStep(quest: Quest, run: QuestRun): QuestStep | null {
  return run.done ? null : (quest.scenes[run.scene]?.steps[run.step] ?? null);
}

export const optionsFor = (run: QuestRun) => run.order[key(run.scene, run.step)] ?? [];

/** Props on screen in the current scene (hidden ones only after they are revealed). */
export function visibleProps(quest: Quest, run: QuestRun): QuestProp[] {
  const scene = quest.scenes[run.scene];
  if (!scene) return [];
  const shown = run.revealed[scene.id] ?? [];
  return scene.props.filter((p) => !p.hidden || shown.includes(p.id));
}

/** Text equality ignoring case and extra/surrounding spaces. */
export const sameText = (a: string, b: string) =>
  a.toLowerCase().replace(/\s+/g, ' ').trim() === b.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Whether the child may open a unit's Misi: only after Uji, except in dev/staging lab mode
 * (prototype testing), so a direct link can't skip the unlock in production.
 */
export const canOpenMisi = (ujiDone: boolean, labMode: boolean) => ujiDone || labMode;

/** The text that is right for a challenge (the chapter word, or the prop id for `find`). */
function rightAnswer(step: QuestStep, chapter: Chapter): string | null {
  if (step.kind === 'say') return null;
  if (step.kind === 'find') return step.answer;
  return chapter.words.find((w) => w.id === step.word)?.word ?? null;
}

/** Answers the current challenge with an option text (choose) or a prop id (find). */
export function answerStep(
  quest: Quest,
  chapter: Chapter,
  run: QuestRun,
  choice: string,
): QuestRun {
  const step = currentStep(quest, run);
  if (!step || step.kind === 'say' || run.solved || run.wrong.includes(choice)) return run;
  const k = key(run.scene, run.step);
  const firstAttempt = !Object.hasOwn(run.results, k);
  const right = rightAnswer(step, chapter);
  // Same normalisation as the validator, so validated content is always answerable.
  const correct = right !== null && sameText(choice, right);
  const results = firstAttempt
    ? { ...run.results, [k]: { wordId: step.word, firstTry: correct } }
    : run.results;
  if (!correct) return { ...run, results, wrong: [...run.wrong, choice] };

  let revealed = run.revealed;
  if (step.kind === 'choose' && step.reveal) {
    const sceneId = quest.scenes[run.scene]!.id;
    revealed = { ...revealed, [sceneId]: [...(revealed[sceneId] ?? []), step.reveal] };
  }
  return { ...run, results, revealed, solved: true };
}

/** Moves on: after a `say` line, or after a solved challenge. */
export function nextStep(quest: Quest, run: QuestRun): QuestRun {
  const step = currentStep(quest, run);
  if (!step || (isChallenge(step) && !run.solved)) return run;
  const scene = quest.scenes[run.scene]!;
  const base = { ...run, wrong: [], solved: false };
  if (run.step + 1 < scene.steps.length) return { ...base, step: run.step + 1 };
  if (run.scene + 1 < quest.scenes.length) return { ...base, scene: run.scene + 1, step: 0 };
  return { ...base, done: true };
}

export function challengeCount(quest: Quest): number {
  return quest.scenes.reduce((n, s) => n + s.steps.filter(isChallenge).length, 0);
}

export interface QuestSummary {
  stars: Stars;
  firstTry: number;
  total: number;
  /** Word ids that needed more than one try (each once, in quest order). */
  practise: string[];
}

export function questSummary(quest: Quest, run: QuestRun): QuestSummary {
  const total = challengeCount(quest);
  const results = Object.values(run.results);
  const firstTry = results.filter((r) => r.firstTry).length;
  const practise = [...new Set(results.filter((r) => !r.firstTry).map((r) => r.wordId))];
  return { stars: total ? starsFromRatio(firstTry / total) : 1, firstTry, total, practise };
}
