# Handoff — Task 5: Stage 2 Uji (quiz)

*16 Nov 2026 · Claude Code → reviewer (Codex)*

Context: `CLAUDE.md` §1 (Uji: picture→word, word→meaning, Dengar & pilih, Isi tempat kosong, Susun huruf; wrong words come back; one hint per question; gentle "Cuba lagi!"). The engine is from task 3 (`docs/handoffs/task-03-engine.md`) and the screens and storage from task 4. Not a git repo, so the files are listed below.

## What was built
| File (under `apps/web/src/`) | What |
|---|---|
| `stages/Uji.tsx` | The Uji stage. Builds a seeded session with `buildUjiSession` (one question per word, types spread evenly), runs it through the retry queue (`gap` 3, `maxRetries` 2), and shows one question at a time with a progress bar. A correct answer shows "Betul! 🎉" and auto-advances after 900 ms. A wrong answer shows "Cuba lagi!", the correct answer and "This word will come back soon", then waits for **Continue**. At the end: `quizStars(results)` → `completeStage('uji')` → `StageResult` |
| | Question views: `McqView` (word options, or meanings in EN/中文 for `word-meaning`) and `ScrambleView` (tap tiles into slots, tap a slot to remove it, auto-submit when full, spaces/hyphens kept as gaps) |
| | Hint (💡, once per question, first attempt only): MCQ disables one wrong option; unscramble locks the first letter into slot 1. Recorded with `markHintUsed` (a hinted correct answer is worth 0.5) |
| | `availableTypes(entry)` drops `picture-word` unless **every** word has an image, and `listen-word` unless every word has audio. No TTS audio exists yet, so Dengar & pilih is currently off |
| `stages/Uji.test.tsx` | Seeded component tests: perfect run → 3★ saved, wrong answer → word returns exactly 3 questions later, hint disables exactly one wrong option, no listen questions without audio |
| `tests/e2e/smoke.spec.ts` (under `apps/web/`) | New e2e: Kenali → Padankan → "Next: Uji" → answer all 12 → 3★ (desktop + Pixel 7) |
| `i18n/en.json`, `zh.json` | `uji.*` strings. "Betul!" and "Cuba lagi!" are BM in both languages on purpose |
| `screens/ChapterScreen.tsx`, `App.tsx` | Uji added to `PLAYABLE` and to the route switch |

## Verified locally
lint, format, typecheck, 68 unit tests, build (136.6 KB gzip JS), e2e 6/6, plus phone-size screenshots of every question type and of the wrong-answer state.

## Decisions worth challenging
1. **A wrong answer reveals the correct answer immediately**, and the same question object (same options and order) returns 3 questions later. Is that too easy a retry? The alternative is rebuilding it with another type.
2. **Correct answers auto-advance (900 ms); wrong answers need a tap.** This gives the child time to read the correct answer.
3. **Unscramble auto-submits when the last slot fills**, so there's no "check" button. A child can remove letters before the last one.
4. **Per-chapter media gating**: picture questions are all-or-nothing per chapter, rather than skipped for the individual words that lack an image.
5. **Word-level spaced repetition (`mastery.ts`) isn't persisted yet.** Uji only uses the in-session queue. The plan is to add `WordStat` storage with Ulang Kaji (P3), or earlier if needed.
6. `CORRECT_PAUSE_MS` and the retry `gap`/`maxRetries` are constants (pilot tuning).
7. The test helper `answerCurrent` relies on MCQ `answerId === wordId` (true for all basic types).

## What I'd like from the review
Bugs (state transitions, timers, double-taps, stale closures, the hint + scramble interaction, replay), anything unfair or discouraging for a 9-year-old, i18n gaps, accessibility on touch (labels, focus after advancing, screen reader announcements), and weak tests. Rank by severity, cite `file:line`, give a failure scenario, and keep it concise.

## Review outcome (Codex review: `task-05-uji.review.md`)
All 6 findings were valid and are fixed. Regression tests are in `stages/Uji.test.tsx` (describe "Uji review regressions").

| # | Finding | Fix |
|---|---|---|
| 1 | Medium: a hint filling the last empty slot left the scramble stuck | `ScrambleView` submits when the hint completes the word (`hintFilledAnswer` effect) |
| 2 | Medium: focus was lost and nothing was announced after advancing | The instruction is now an `<h2 tabIndex=-1>` (`Ask`) that focuses on mount. Views are keyed by question + attempt, so this runs for every new question and retry |
| 3 | Medium: picture prompt had `alt=""` | `alt` = the meaning in the support language (picture-word and unscramble) |
| 4 | Low: "will come back" shown on the last allowed miss | `MAX_RETRIES` constant is shared with `answer()`. Footer shows the promise only when `attempt < MAX_RETRIES` |
| 5 | Low: translated meaning marked `lang="ms"` | `lang` is the support language for `word-meaning` answers |
| 6 | Low: 40 px letter slots | `w-11` (44 px) |

Also changed: "Cuba lagi!" is now amber, not red (gentler, per CLAUDE.md tone).

All checks re-run green: lint, format, typecheck, 71 unit tests, build (137 KB gzip) and e2e 6/6.
