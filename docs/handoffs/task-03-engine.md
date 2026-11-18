# Handoff — Task 3: game engine (`apps/web/src/engine/`)

*16 Nov 2026 · Claude Code → reviewer (Codex)*

Context: `CLAUDE.md` §1 (chapter flow) and §9 (engine = pure TS, unit-tested). The previous handoff is `docs/handoffs/task-01-02-scaffold-and-content.md`. Not a git repo, so the files are listed below.

## What was built
All of this is pure TypeScript with no React, storage or DOM. Randomness is injected (`Rng`) so sessions are reproducible.

| File | Responsibility |
|---|---|
| `rng.ts` | `createRng(seed)` (mulberry32), `shuffle`, `pick` |
| `questions.ts` | Stage 2 (Uji) questions. MCQ types: `picture-word`, `word-meaning`, `listen-word`, `fill-blank`, `synonym`, `antonym`; plus `unscramble` (Susun huruf). `buildUjiSession` spreads types evenly over words. Also `checkAnswer` and `hintFor` (one hint per question: eliminate a wrong option, or reveal the first-letter tile) |
| `queue.ts` | In-session retry queue. A wrong item returns `gap` (3) questions later, at most `maxRetries` (2) times, then retires so the child is never stuck. Tracks `firstTryCorrect`, `hintUsed` and `attempts` per item. Immutable |
| `scoring.ts` | Stars 1–3 (never 0, so no fail screen). Quiz stars: 1 point for right first try, 0.5 if a hint was used, 0 otherwise. ≥90% gives 3★ and ≥60% gives 2★. Also Padankan stars by mismatches, AI points (`correct` 1, `almost` 0.5), and Cabaran stars |
| `progress.ts` | `ChapterProgress` as plain data, ready to persist. Stages unlock in order Kenali → Uji → Bina → Cabaran. Kenali needs every card opened. Best stars are kept on retry |
| `mastery.ts` | Cross-session Leitner boxes 0–4 (intervals of 0/1/3/7/14 days), with box ≥3 counting as mastered. Mirrors the planned `word_stats` table. Used later for word ordering and Ulang Kaji |
| `index.ts` | Barrel export |
| `engine.test.ts`, `all-chapters.test.ts` | 32 engine tests. The second file runs every question type × 20 seeds over all three real Tahun 3 chapters |

## Design choices worth challenging
1. **Options carry word ids, not display text in a UI language.** For `word-meaning` the UI renders each option's meaning in EN/中文. Distractors that aren't chapter words get id `x:<text>`.
2. **`word-meaning` distractors are other chapter words** (their meanings), not `word.distractors`, because distractors have no meanings in the data.
3. **Seerti/berlawan** are built only when `synonym`/`antonym` is set, and they aren't in `BASIC_TYPES` (CLAUDE.md says "higher levels"). Their wrong options are random chapter words. Could one of them accidentally also be a synonym?
4. **Unscramble:** spaces and hyphens are fixed in `pattern` and aren't tiles. Answers are compared letters-only and case-insensitive, so "anaksulung" is accepted.
5. **Session size:** default is one question per word (12 + retries). `perWord` can raise it. CLAUDE.md wants 10–15 minutes for the *whole chapter*.
6. **Requeue repeats the same question object** (same options and order). Should it rebuild with a new type or reshuffle?
7. **Hint after a wrong attempt isn't recorded** (`markHintUsed` only counts before the first attempt). Scoring only cares about the first try anyway.
8. **Padankan thresholds:** ≤ ceil(pairs/2) mismatches gives 3★ and ≤ 1.5×pairs gives 2★. These are guesses to tune in the pilot.

## Verified locally
lint, format, typecheck (app + scripts), and 45 unit tests all pass.

## Not in this task
UI (tasks 4–7), storage (`ProgressStore`, task 4), Susun ayat (sentence tile) checking (task 6, Bina), and the AI check (task 6).

## What I'd like from the review
Correctness bugs (especially edge cases in the queue, unscramble and the session builder), anything that would make the game feel unfair or frustrating for a 9-year-old, gaps against CLAUDE.md, and weak tests. Rank by severity, cite `file:line`, and keep it concise.

## Review outcome (Codex review: `task-03-engine.review.md`)
All 5 findings were valid and are fixed. Each has a regression test in `engine/review-regressions.test.ts`.

| # | Finding | Fix |
|---|---|---|
| 1 | Medium: `completeStage('kenali')` ignored the card rule | `completeStage(p, stage, stars, { wordIds, now })` now throws for Kenali unless `wordIds` is non-empty and every card is opened |
| 2 | Medium: a synonym/antonym distractor could be a valid answer | Skip words whose same relation points at the prompt word or the answer (reciprocal and shared relations) |
| 3 | Medium: id `constructor` read `Object.prototype` and hung the queue | `Object.hasOwn` in `resultOf` |
| 4 | Low: 10 reshuffles didn't guarantee an unsolved unscramble | Deterministic swap fallback. Tested with "di" over 5,000 seeds |
| 5 | Low: same word back to back at round boundaries | `separateRoundBoundaries` swap. Tested for perWord 2 and 3 over 300 seeds |

API change for later tasks: `completeStage`'s 4th argument is now an options object, not `now: Date`.

All checks re-run green: lint, format, typecheck, 50 unit tests and build.
