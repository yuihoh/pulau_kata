/**
 * Builds Stage 2 (Uji) questions from a chapter. Pure: same chapter + same seed → same questions.
 * The engine never picks a UI language: options carry word ids, and the UI renders the
 * meaning in EN or 中文 itself.
 */
import type { Chapter, Word } from '../content/schema';
import { pick, shuffle, type Rng } from './rng';

export type McqType =
  | 'picture-word' // see picture → choose BM word
  | 'word-meaning' // see BM word → choose meaning (EN/中文)
  | 'listen-word' // hear audio → choose BM word (Dengar & pilih)
  | 'fill-blank' // Isi tempat kosong
  | 'synonym' // seerti (higher levels)
  | 'antonym'; // berlawan (higher levels)
export type QuestionType = McqType | 'unscramble'; // Susun huruf

export const BASIC_TYPES: readonly QuestionType[] = [
  'picture-word',
  'word-meaning',
  'listen-word',
  'fill-blank',
  'unscramble',
];

export interface Option {
  /** Chapter word id, or `x:<text>` for a distractor that is not a chapter word. */
  id: string;
  /** BM text of the option. For `word-meaning` the UI shows that word's meaning instead. */
  text: string;
}

export interface McqQuestion {
  kind: 'mcq';
  id: string;
  type: McqType;
  wordId: string;
  /** What to show/play: the word itself, its image/audio, or a sentence with `___`. */
  prompt: { word?: string; image?: string; audio?: string; sentence?: string };
  options: Option[];
  answerId: string;
}

export interface ScrambleQuestion {
  kind: 'scramble';
  id: string;
  type: 'unscramble';
  wordId: string;
  prompt: { image: string; audio: string };
  /** Shuffled letter tiles (spaces and hyphens are not tiles). */
  tiles: { id: string; letter: string }[];
  /** Word shape: `_` per letter tile, spaces/hyphens kept, e.g. `____ ______`. */
  pattern: string;
}

export type Question = McqQuestion | ScrambleQuestion;

const FIXED = /[\s-]/;
const lettersOf = (s: string) => [...s.toLowerCase()].filter((c) => !FIXED.test(c));
const optionFor = (text: string, chapter: Chapter): Option => {
  const w = chapter.words.find((o) => o.word.toLowerCase() === text.toLowerCase());
  return w ? { id: w.id, text: w.word } : { id: `x:${text}`, text };
};

function wordOptions(word: Word, chapter: Chapter, rng: Rng): Option[] {
  const opts = [
    { id: word.id, text: word.word },
    ...word.distractors.slice(0, 3).map((d) => optionFor(d, chapter)),
  ];
  return shuffle(opts, rng);
}

function meaningOptions(word: Word, chapter: Chapter, rng: Rng): Option[] {
  const others = shuffle(
    chapter.words.filter((w) => w.id !== word.id),
    rng,
  ).slice(0, 3);
  return shuffle([word, ...others], rng).map((w) => ({ id: w.id, text: w.word }));
}

/** Synonym/antonym MCQ, or null if the word has none. */
function relationQuestion(
  word: Word,
  chapter: Chapter,
  type: 'synonym' | 'antonym',
  rng: Rng,
): McqQuestion | null {
  const target = type === 'synonym' ? word.synonym : word.antonym;
  if (!target) return null;
  const correct = optionFor(target, chapter);
  const rel = (w: Word) => (type === 'synonym' ? w.synonym : w.antonym)?.toLowerCase();
  const taken = new Set([word.word.toLowerCase(), target.toLowerCase()]);
  // A wrong option must not itself be a valid answer: skip words that share the relation
  // with the prompt word or the answer (e.g. B.synonym = A when asking for A's synonym).
  const others = shuffle(
    chapter.words.filter((w) => !taken.has(w.word.toLowerCase()) && !taken.has(rel(w) ?? '')),
    rng,
  )
    .slice(0, 3)
    .map((w) => ({ id: w.id, text: w.word }));
  return {
    kind: 'mcq',
    id: `${type}:${word.id}`,
    type,
    wordId: word.id,
    prompt: { word: word.word },
    options: shuffle([correct, ...others], rng),
    answerId: correct.id,
  };
}

export function buildQuestion(
  word: Word,
  chapter: Chapter,
  type: QuestionType,
  rng: Rng,
): Question | null {
  const id = `${type}:${word.id}`;
  switch (type) {
    case 'picture-word':
      return {
        kind: 'mcq',
        id,
        type,
        wordId: word.id,
        prompt: { image: word.image },
        options: wordOptions(word, chapter, rng),
        answerId: word.id,
      };
    case 'listen-word':
      return {
        kind: 'mcq',
        id,
        type,
        wordId: word.id,
        prompt: { audio: word.audio },
        options: wordOptions(word, chapter, rng),
        answerId: word.id,
      };
    case 'fill-blank':
      return {
        kind: 'mcq',
        id,
        type,
        wordId: word.id,
        prompt: { sentence: pick(word.blank_sentences, rng) },
        options: wordOptions(word, chapter, rng),
        answerId: word.id,
      };
    case 'word-meaning':
      return {
        kind: 'mcq',
        id,
        type,
        wordId: word.id,
        prompt: { word: word.word },
        options: meaningOptions(word, chapter, rng),
        answerId: word.id,
      };
    case 'synonym':
    case 'antonym':
      return relationQuestion(word, chapter, type, rng);
    case 'unscramble': {
      const letters = lettersOf(word.word);
      let order = shuffle(letters, rng);
      // Never show the word already solved (possible for short words).
      for (
        let i = 0;
        i < 10 && order.join('') === letters.join('') && new Set(letters).size > 1;
        i++
      )
        order = shuffle(letters, rng);
      if (order.join('') === letters.join('')) {
        // Still solved: swap the first letter with the first different one (guaranteed change).
        const j = order.findIndex((c) => c !== order[0]);
        if (j > 0) [order[0], order[j]] = [order[j]!, order[0]!];
      }
      return {
        kind: 'scramble',
        id,
        type,
        wordId: word.id,
        prompt: { image: word.image, audio: word.audio },
        tiles: order.map((letter, i) => ({ id: `t${i}`, letter })),
        pattern: [...word.word.toLowerCase()].map((c) => (FIXED.test(c) ? c : '_')).join(''),
      };
    }
  }
}

export interface SessionOptions {
  /** Questions per word, each of a different type. Default 1. */
  perWord?: number;
  /** Question types to use. Default: the five basic types. */
  types?: readonly QuestionType[];
}

/**
 * One Uji session: every word appears `perWord` times, question types are spread evenly
 * across words (round-robin over a shuffled word order), and the result is shuffled so the
 * same word's questions are not back to back where avoidable.
 */
export function buildUjiSession(chapter: Chapter, rng: Rng, opts: SessionOptions = {}): Question[] {
  const types = opts.types ?? BASIC_TYPES;
  const perWord = Math.min(opts.perWord ?? 1, types.length);
  const words = shuffle(chapter.words, rng);
  const rounds: Question[][] = [];
  let t = Math.floor(rng() * types.length);

  for (let r = 0; r < perWord; r++) {
    const round: Question[] = [];
    for (const w of words) {
      // Try each type once, starting at the round-robin position; skip types the word can't do.
      for (let k = 0; k < types.length; k++) {
        const type = types[(t + k) % types.length]!;
        if (rounds.some((rd) => rd.some((q) => q.wordId === w.id && q.type === type))) continue;
        const q = buildQuestion(w, chapter, type, rng);
        if (q) {
          round.push(q);
          break;
        }
      }
      t = (t + 1) % types.length;
    }
    rounds.push(shuffle(round, rng));
  }
  return separateRoundBoundaries(rounds);
}

/**
 * Within a round every word appears once, so the only possible back-to-back repeat is where
 * one round ends and the next begins. Fix it by swapping the next round's first question
 * with another question of that round.
 */
function separateRoundBoundaries(rounds: Question[][]): Question[] {
  for (let r = 1; r < rounds.length; r++) {
    const prev = rounds[r - 1]!.at(-1);
    const round = rounds[r]!;
    if (!prev || round[0]?.wordId !== prev.wordId) continue;
    // Prefer a non-last slot so the swap can't create a new repeat at the next boundary.
    const candidates = round.map((_, i) => i).filter((i) => i > 0);
    const k = candidates.find((i) => i < round.length - 1) ?? candidates[0];
    if (k !== undefined) [round[0], round[k]] = [round[k]!, round[0]!];
  }
  return rounds.flat();
}

/** True if `answer` (an option id, or the typed/arranged letters) is correct. */
export function checkAnswer(q: Question, answer: string, chapter: Chapter): boolean {
  if (q.kind === 'mcq') return answer === q.answerId;
  const word = chapter.words.find((w) => w.id === q.wordId);
  return !!word && lettersOf(answer).join('') === lettersOf(word.word).join('');
}

export type Hint =
  | { kind: 'eliminate'; optionId: string }
  | { kind: 'first-letter'; tileId: string; letter: string };

/** The single hint allowed per question: remove one wrong option, or place the first letter. */
export function hintFor(q: Question, chapter: Chapter, rng: Rng): Hint {
  if (q.kind === 'mcq') {
    const wrong = q.options.filter((o) => o.id !== q.answerId);
    return { kind: 'eliminate', optionId: pick(wrong, rng).id };
  }
  const word = chapter.words.find((w) => w.id === q.wordId)!;
  const first = lettersOf(word.word)[0]!;
  const tile = q.tiles.find((tl) => tl.letter === first)!;
  return { kind: 'first-letter', tileId: tile.id, letter: first };
}
