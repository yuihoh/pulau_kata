# Handoff: Task 5b, Sampan Kata prototype (boat action game)

*17 Nov 2026 · Claude Code → reviewer (Codex)*

## Context
On 17 Nov 2026 Yang approved adding an action game. It will become **Cabaran Akhir** (task 7) after a prototype pass, and Yang chose the boat theme. The prototype comes first so Yang can feel it on a phone; task 6 (Bina) follows.

Game rules approved by Yang:
- No dying. The round is fixed-length.
- The speed adapts (faster with a combo, slower after a miss).
- There is a relaxed mode.
- The minimum result is 1 star.
- Every move is a word question.

Background: `CLAUDE.md` §1 (stages, gentle tone) and §9 (44 px targets, small bundle, i18n). The engine conventions come from task 3 (`docs/handoffs/task-03-engine.md`). This is not a git repo, so the changed files are listed below.

## How it plays
- A row of 3 word buoys drifts down a 3-lane river toward the boat.
- The prompt is a picture or a meaning (EN/中文). Listening prompts turn on once every word has audio.
- The buoy in the boat's lane when the row arrives is the child's answer, so every row counts as exactly one answer.
- **Right buoy:** "Betul!" and points (10 × combo, capped at ×5).
- **Wrong buoy:** amber "Cuba lagi!", plus the right word and its meaning for 1.8 s. The boat wobbles and the word comes back 3 waves later, at most 2 more times (same rule as Uji).
- **Speed:** each row takes 6 s to arrive; each right answer multiplies that time by 0.9 (minimum 3.2 s), and each miss by 1.25 (maximum 7.5 s). In relaxed mode it stays at 7 s.
- **Relaxed mode** is on by default when the device has reduce-motion set.
- **End of the round:** every word cleared, or 90 s up. The row on screen still finishes.
- **Stars:** `challengeStars(right first time, words in chapter)`. The end screen lists the "words to practise", meaning any word that was missed or never reached.
- **Controls:**
  - tap a lane on the river;
  - swipe left or right (more than 30 px sideways counts as a swipe);
  - the ◀ ▶ buttons (56 px tall);
  - the arrow keys, or A and D.
- **Pausing:** a pause button, plus an automatic pause when the tab is hidden (the child taps Resume).
- **Lab only:** progress is not saved. The route is `#/lab/sampan[/<chapterId>]`. Home links to it only in dev, or when `VITE_SHOW_LAB=true`.

## Files (under `apps/web/`)
| File | What |
|---|---|
| `src/engine/sampan.ts` | Pure, seeded rules: `createSampan`, `step(state, dtMs)`, `steer`, `nudge`, `timeLeftMs`, `summarise`, `SAMPAN_DEFAULTS`. Reuses `buildQuestion('picture-word')` for options and distractors, the retry `queue`, and `challengeStars` |
| `src/engine/sampan.test.ts` | 10 tests covering: determinism, one answer per row, the collision rule, clamping, the perfect run, the miss/slow-down/return after 3 waves, relaxed mode, time-up behaviour, the all-wrong run (finishes, 1★), and prompt kinds |
| `src/games/SampanKata.tsx` | Lazy-loaded screen (4.9 KB gzip chunk) with intro (unit picker, relaxed toggle), game (HUD, prompt, river, boat, feedback) and result. The animation loop is a `requestAnimationFrame` hook with dt clamped to 50 ms; React state updates every frame |
| `src/games/SampanKata.test.tsx` | Fake requestAnimationFrame tests: right buoy → Betul/score; wrong → Cuba lagi + answer; pause freezes the river and ignores keys; a full perfect round → 3★ |
| `src/app/router.ts` + `router.test.ts` | `lab` route |
| `src/App.tsx` | `React.lazy` + `Suspense` for the lab route |
| `src/screens/Home.tsx` | Dev/staging-only lab link |
| `src/i18n/en.json`, `zh.json` | `sampan.*`, `home.lab` |
| `src/index.css` | Animated river ripples, only under `prefers-reduced-motion: no-preference` |
| `tests/e2e/smoke.spec.ts` | New e2e: tap the right lane → Betul, score > 0 (desktop + Pixel 7) |

## Verified
- lint, typecheck, 88 unit tests, build (main 138.7 KB gzip, game chunk 4.9 KB), e2e 8/8.
- Phone screenshots (412 and 360 px) of sailing, a miss, a hit, and the longest word (*menghadiahkan*) without a mid-word break.

## Decisions worth challenging
1. **Each row is one forced answer**: there's always a buoy in the boat's lane. So doing nothing still answers, and might be right by luck (1 in 3).
2. **React state is updated every frame** (about 60 renders/s of a small tree) instead of moving DOM elements directly.
3. **Buoys are positioned with `top: %`**, not transforms (layout every frame, but only 3 elements).
4. **When time is up, the row on screen still finishes**, so the end never cuts off mid-answer.
5. **Stars count only first-try correct words out of all chapter words**, so unreached words lower the stars.
6. **The lab route is reachable in production by URL**; only the link is hidden.
7. **Long BM words get a smaller font** instead of being broken mid-word.

## What I'd like from the review
- Bugs: the game loop and timing, pause/resume, StrictMode double effects, stale closures, input during resolving or after finishing, and the swipe vs tap logic.
- Fairness for a 9-year-old (speeds, the time limit, feedback time), accessibility, performance on cheap Android phones, and weak tests.
- Rank by severity, cite `file:line`, give a failure scenario, and keep it concise.

## Review outcome (Codex review: `task-05b-sampan-prototype.review.md`)
All 5 findings were valid and are fixed. Regression tests are marked "review #n".

| # | Finding | Fix |
|---|---|---|
| 1 | Medium: the 50 ms clamp slowed the clock on slow phones (90 s took about 180 s at 10 FPS) | New `advance(s, frameMs)` plays real frame time in ≤50 ms steps. Only stalls over 250 ms (`MAX_FRAME_MS`, an app freeze) are capped, so a buoy can't jump onto the boat. Test: ten 100 ms frames = 1000 ms |
| 2 | Medium: a reused `AudioButton` replayed its first word | `AudioButton` (shared `components/ui.tsx`) makes a new `Audio` when `src` changes. The sampan prompt also keys it per wave. Test in `components/ui.test.tsx` |
| 3 | Medium: new questions weren't announced, only the buoys | One always-mounted live region announces "Question n. <ask> <meaning>. Buoys, left to right: …" per wave |
| 4 | Low: the miss highlight followed the boat after steering | The highlight comes from `last.chosenId` |
| 5 | Low: `nextWave` mutated a shared RNG (StrictMode replay changed waves) | The state holds a numeric `waveSeed`; each wave derives its randomness from it and stores the next seed. Purity test: the same `step` twice gives the same wave |

Re-run: lint, typecheck, 93 unit tests.
