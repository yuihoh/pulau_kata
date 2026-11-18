/**
 * Screens a child's sentence for obvious personal data BEFORE it is sent to the AI
 * (CLAUDE.md: never send personal data to the AI check). Runs in the browser (so it never
 * leaves the device) and again in the Worker (so a modified client can't skip it).
 *
 * Catches: email addresses, phone numbers and other long digit runs (incl. Malaysian IC
 * numbers like 150101-14-1234), web links and @handles. It cannot catch every name: BM
 * sentences use names normally ("Ali membela kucing."), so the UI asks children not to
 * write their own name, and the Worker never logs the sentence.
 */
const PATTERNS: RegExp[] = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/, // email
  /(?:\d[\s-]?){7,}/, // phone, IC number, any 7+ digits
  /\b\d{6}-\d{2}-\d{4}\b/, // IC number with dashes (also matched above; explicit for clarity)
  /\bhttps?:\/\/|\bwww\.|\b[\w-]+\.(?:com|my|net|org)\b/i, // links
  /(?:^|\s)@\w{2,}/, // social media handle
];

export const PERSONAL_DATA_TIP = {
  en: "Please don't write phone numbers, emails or links. Write a sentence with the word.",
  zh: '请不要写电话号码、电邮或网址。用这个单词写一个句子吧。',
} as const;

export function containsPersonalData(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}
