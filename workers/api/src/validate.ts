import { z } from 'zod';
import { MAX_SENTENCE_LENGTH, WORD_CLASSES, type CheckRequest, type CheckResponse } from './types';

export const CheckRequestSchema = z.strictObject({
  word: z.string().trim().min(1).max(60),
  wordClass: z.enum(WORD_CLASSES),
  year: z.number().int().min(1).max(6),
  sentence: z.string().trim().min(1).max(MAX_SENTENCE_LENGTH),
  lang: z.enum(['en', 'zh']),
});

/** What the model must return (also used as the structured-output schema). */
export const CheckResponseSchema = z.object({
  result: z.enum(['correct', 'almost', 'try_again']),
  uses_target_word: z.boolean(),
  tip: z.string(),
  suggested_sentence: z.string().nullable(),
});

export function parseCheckRequest(body: unknown): CheckRequest | null {
  const r = CheckRequestSchema.safeParse(body);
  return r.success ? r.data : null;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Final guard on anything we send back to a child: known shape, short strings. */
export function sanitiseResponse(r: CheckResponse): CheckResponse {
  return {
    result: r.result,
    uses_target_word: r.uses_target_word,
    tip: clip(r.tip.trim(), 200),
    suggested_sentence: r.suggested_sentence?.trim()
      ? clip(r.suggested_sentence.trim(), MAX_SENTENCE_LENGTH)
      : null,
  };
}
