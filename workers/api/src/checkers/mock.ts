/**
 * Mock checker for local dev and tests: no API key, no network, deterministic. It only
 * checks surface rules (target word used, enough words, capital letter and full stop). It
 * does not judge meaning, so it must never be the production checker.
 */
import type { CheckRequest, CheckResponse } from '../types';
import type { SentenceChecker } from './checker';

const TIPS = {
  missingWord: {
    en: (w: string) => `Use the word “${w}” in your sentence.`,
    zh: (w: string) => `在句子里用上“${w}”这个词。`,
  },
  tooShort: {
    en: () => 'Write a full sentence: who does what?',
    zh: () => '写一个完整的句子：谁做什么？',
  },
  punctuation: {
    en: () => 'Almost! Start with a capital letter and end with a full stop.',
    zh: () => '差一点！句子要用大写字母开头，用句号结尾。',
  },
  good: {
    en: () => 'Great sentence!',
    zh: () => '句子写得很好！',
  },
};

const PREFIXES = ['meng', 'meny', 'mem', 'men', 'me', 'di', 'ber', 'ter', 'pe'];
const SUFFIXES = ['kan', 'i', 'nya', 'lah', 'an'];

export const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** One sentence token against one target token: exact, a small slip, or an affixed form. */
function tokenMatches(s: string, t: string): boolean {
  if (s === t) return true;
  if (t.length >= 5 && editDistanceAtMostOne(s, t)) return true;
  // Affixed forms, e.g. "ambil berat" written formally as "mengambil berat" (CLAUDE.md §7).
  for (const p of ['', ...PREFIXES])
    for (const x of ['', ...SUFFIXES]) if ((p || x) && s === p + t + x) return true;
  return false;
}

/** True if the sentence contains the target word or phrase (tokens in order, adjacent). */
export function usesWord(sentence: string, word: string): boolean {
  const s = tokens(sentence);
  const t = tokens(word);
  if (t.length === 0) return false;
  for (let i = 0; i + t.length <= s.length; i++)
    if (t.every((tok, j) => tokenMatches(s[i + j]!, tok))) return true;
  return false;
}

export class MockChecker implements SentenceChecker {
  async check(req: CheckRequest): Promise<CheckResponse> {
    const { sentence, word, lang } = req;
    const uses = usesWord(sentence, word);
    const respond = (result: CheckResponse['result'], tip: string): CheckResponse => ({
      result,
      uses_target_word: uses,
      tip,
      suggested_sentence: null,
    });

    if (!uses) return respond('try_again', TIPS.missingWord[lang](word));
    // The word alone is not a sentence; anything more can be ("Saya bangga.").
    if (tokens(sentence).length <= tokens(word).length)
      return respond('try_again', TIPS.tooShort[lang]());
    const trimmed = sentence.trim();
    if (!/^\p{Lu}/u.test(trimmed) || !/[.!?]$/.test(trimmed))
      return respond('almost', TIPS.punctuation[lang]());
    return respond('correct', TIPS.good[lang]());
  }
}
