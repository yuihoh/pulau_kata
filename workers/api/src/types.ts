/**
 * The /api/check-sentence contract (CLAUDE.md §7). Types only, no runtime code, so the web
 * app can `import type` from here without pulling the Worker into its bundle.
 */

export const WORD_CLASSES = [
  'kata nama',
  'kata kerja',
  'kata adjektif',
  'kata adverba',
  'kata sendi',
  'lain-lain',
] as const;
export type WordClass = (typeof WORD_CLASSES)[number];

/** Request body. Contains no personal data: only the target word and the child's sentence. */
export interface CheckRequest {
  word: string;
  wordClass: WordClass;
  /** School year, 1–6. Grammar is judged at this level. */
  year: number;
  /** The child's sentence, at most 200 characters. */
  sentence: string;
  /** Language for the tip. */
  lang: 'en' | 'zh';
}

export type CheckResultKind = 'correct' | 'almost' | 'try_again';

export interface CheckResponse {
  result: CheckResultKind;
  uses_target_word: boolean;
  /** Short, kind tip in the requested language. */
  tip: string;
  /** A BM sentence the child can compare with, or null. */
  suggested_sentence: string | null;
}

/** Error body for non-200 responses. */
export interface CheckError {
  error: 'bad_request' | 'rate_limited' | 'unavailable' | 'not_found' | 'method_not_allowed';
}

/** Header carrying a random per-install id (no personal data), used only for rate limiting. */
export const DEVICE_HEADER = 'X-Device-Id';
export const MAX_SENTENCE_LENGTH = 200;
