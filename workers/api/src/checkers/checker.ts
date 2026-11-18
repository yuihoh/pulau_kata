import type { CheckRequest, CheckResponse } from '../types';

/** The AI provider sits behind this adapter so the model or vendor can be swapped. */
export interface SentenceChecker {
  check(req: CheckRequest): Promise<CheckResponse>;
}

/** Neutral redirect for off-topic, inappropriate or refused input (CLAUDE.md §7). */
export const REDIRECT_TIP = {
  en: 'Cuba tulis ayat menggunakan perkataan ini. (Try writing a sentence with this word.)',
  zh: 'Cuba tulis ayat menggunakan perkataan ini。（试着用这个词造一个句子。）',
} as const;

export function redirect(req: CheckRequest): CheckResponse {
  return {
    result: 'try_again',
    uses_target_word: false,
    tip: REDIRECT_TIP[req.lang],
    suggested_sentence: null,
  };
}
