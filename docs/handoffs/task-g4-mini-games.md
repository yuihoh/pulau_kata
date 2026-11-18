# Handoff: G-4, mini-game prototypes (Tangkap Buah + Pecah Belon)

*18 Nov 2026 · Claude Code → reviewer (Codex)*

## Context
- Plan: `docs/graphics-and-games-proposal.md` §3. Yang chose **Tangkap Buah** (catch the fruit) and **Pecah Belon** (pop the balloons) as the first two new games, built as skins over the existing question engine (no new content per unit), and wants them before the pilot.
- **Scope of this task: the two games as playable lab prototypes** (`#/lab/tangkap`, `#/lab/belon`, with chips on the lab row of Home), the same way Sampan Kata and Misi started. **Not done yet: making them the rounds inside Uji** (the proposal's "Uji = 3 short rounds"). That step changes the stage everyone plays and the Uji e2e flow, so it waits for Yang to play these two first.
- Not a git repo until the GitHub check-in earlier today; there is now a local repo with one commit, so this task's files are the uncommitted changes.

## What changed
1. **`engine/tangkap.ts`** (pure, seeded, 17 tests). Questions come from `buildQuestion` like Uji/Sampan, so every unit works with no extra content. A prompt (picture / meaning / listen) stays up while rambutans with words fall; the child moves a basket under the right one. A wrong catch is gentle (combo resets, the question stays, the fall slows; after 2 the right fruit glows); a missed right fruit just falls away and one is sure to fall at least every 3 fruits. A word caught only after a wrong catch is not first-try and **comes back later through the shared retry queue**. Round time 90 s (150 s in relaxed mode, so a calm game does not run out of time). Stars from first-try catches (`challengeStars`).
2. **`engine/belon.ts`** (pure, seeded, 12 tests). Practises **word class**, which no other stage covers. A round names a class ("Pop every kata kerja (verb)!") and 8 balloons float up (≤ 4 of that class). Only the four real classes are used; **idioms (`lain-lain`) and prepositions are left out** (no clean answer for a child). A class is a valid round only with ≥ 2 words of it and ≥ 2 usable others; up to 3 rounds. Wrong pop = a kind note (timer in the engine) and −1 for the round (never below 0); a target that floats away is a word to practise. No timer, no dying. `canPlayBelon` false → the unit is shown but Start is disabled with an explanation. All six pilot units can play it.
3. **Shared module `games/miniGameParts.tsx`**, extracted from Sampan Kata (which now uses it): `useAnimationFrame`, `SceneDecor`, `PromptCard`, `GameHud`/`TimeBar`, `GameIntro` (unit chooser), `GameResult`, `PractiseList`, `promptKinds`, `prefersReducedMotion`. `SampanKata.tsx` re-exports `PractiseList`/`promptKinds`/`prefersReducedMotion` for `CabaranAkhir`. Sampan's behaviour is unchanged (its tests pass untouched).
4. **`games/TangkapBuah.tsx`**: orchard (leaves overhead, rambutans with word labels, woven basket), drag/tap or arrow keys or two buttons to move, hornbill feedback card, pause, sr-only live announcement of the question and fruit words, result with words to practise. The prompt stays on the word just caught while the answer card shows. **`games/PecahBelon.tsx`**: CSS balloons (5 colours), round banner, hornbill prompt, "N to go", star burst on a right pop, a kind note on a wrong one, pause, result.
5. **Art:** Codex rambutan and basket (`assets-src/minigames/`, `scripts/home-art-to-webp.py` now supports per-item `clear` points for holes such as basket handles). Balloons are drawn in code. Two new icons (basket, balloon).
6. **Router/App/Home/i18n:** `LAB_GAMES` gains `tangkap` and `belon`; two lazy chunks (~4–5 KB gzip each); two lab chips on Home; EN + 中文 strings.
7. **Tests:** `engine/tangkap.test.ts`, `engine/belon.test.ts`; `games/MiniGames.test.tsx` (9 screen tests); e2e: both games played for real **with a console-error watcher**, plus "both fit a 320×568 phone".

## Bug found while verifying
A browser run showed React's "two children with the same key" warning in Pecah Belon (the burst and the note both used the pop counter as key). Keys are now prefixed (`burst-`, `note-`, `banner-`, …) in both games; the e2e now fails on any console error.

## Verified
prettier, eslint, typecheck, **247 web + 37 Worker unit tests**, validate-content, build (precache 202 entries, 4.83 MB), **e2e 36/36** (desktop + Pixel 7; the Tangkap e2e ran 3× in a row without a failure). Played both on a Pixel 7 viewport and looked at screenshots of the orchard, the right-catch card, the balloons, the banner.
Not verified: real devices (touch dragging in the orchard, balloon tap size on small hands); how it feels to a child; Chinese strings on screen; audio of the new `correct`/`wrong` chimes in these games.

## Decisions worth challenging
1. Wrong catches in Tangkap **do** make a word come back and count against first-try stars; the child can never fail, only repeat.
2. Pecah Belon trusts the `class` field of the content. Those were reviewed for Tahun 3 (Yang) and by Codex for Tahun 5, but a disputed class would be taught as fact. Idioms and prepositions are excluded for that reason.
3. Words that are both a noun and a verb in BM (e.g. *tugasan*) would be risky; the pilot units have none, but the content validator does not check for this.
4. Tangkap's relaxed mode gets 150 s instead of 90 s.

## What I'd like from the review
- Bugs: the fruit/basket geometry (`top = calc(y / catchY × (100% − fruit − basket))`; does a fruit visually meet the basket exactly when the engine catches it, at 208 px and 640 px field height and at 320 px width, including the clamped left/right?), pointer handling (pointer capture, `touch-none`, mouse hover vs touch drag), balloon clamp at the field edges, `step()` purity (`noteLeftMs`, seeds), a state where the game can never finish (no right fruit appears, balloon rounds that never end), `advance` frame caps, memory/CPU with many nodes, double `onFinish`.
- Accessibility: the orchard and balloons for screen readers and keyboard (balloons are buttons while moving; is that usable?), live announcements, colour contrast of white text on the balloon gradients, the glow hint.
- Engine correctness: Belon plan edge cases (a class with exactly 2 words; all words one class), Tangkap retry queue interplay, relaxed mode timing.
- Tests: weak spots (e.g. the screen tests mock `getBoundingClientRect`).

Rank by severity, cite `file:line`, give a failure scenario, keep it concise.

## Review outcome (Codex review: `task-g4-mini-games.review.md`)
All 5 findings were valid and are fixed. Codex found nothing in pointer handling, purity/seeding, termination and frame caps, node bounds, `onFinish`, the retry queue, Belon plan edge cases, relaxed timing, or the Sampan extraction.

| # | Finding | Fix |
|---|---|---|
| 1 | P2: the basket was drawn clamped to the field but hit-tested unclamped, so at the edges fruit that looked caught was missed | The engine now keeps the basket centre `basketHalf` away from the edges (`moveBasket`), and the screen draws the basket **30 % of the orchard's width** (`cqw` container units, with the picture's proportions) at a plain `x %`, so picture and hit-test agree at any width; the fruit lands on the basket's top via `calc(y / catchY × (100 % − fruit − basket))`; fruit is released in 0.18–0.82. e2e: tapping the far left and right keeps the basket inside the orchard |
| 2 | P2: a blind player heard the fruit words but could not aim a basket | New `chooseOption(state, optionId)` in the engine (same scoring as catching that fruit; a wrong word is a gentle miss and the right one afterwards is not first-try). The words are real buttons in a visually hidden group that appears on focus (`focus-within`), placed before the orchard in the reading order. Tests: engine (3) + a screen test + an e2e that plays **a whole game by keyboard only** to 3 stars |
| 3 | P2: balloons were removed while about 98 px (208 px field) / 55 px (640 px field) of the body was still visible and tappable | Balloons now travel from **completely below to completely above** the field (`top = y × (100 % + H) − H`, engine `TRAVEL = 1`, `LEAVE_Y = 0`). e2e watches every unpopped balloon and requires it to be out of sight when it disappears (**fails with 161 px visible under the old mapping**) |
| 4 | P2: white text on the amber/emerald gradients was about 2.5–2.7 : 1; long words at 13 px | Darker gradients (rose 500→700, sky 600→800, orange 600→800, emerald 600→800, violet 500→700), 112 px balloons, 14 px for long words; the hex ends are listed in `COLOURS` and a unit test requires ≥ 4.5 : 1 for white on the middle of each |
| 5 | P3: the balloon e2e used DOM `.click()` (no hit-testing) and keyboard was untested | The e2e pops one balloon with focus + Enter, then uses real mouse taps at each balloon's centre; (real taps can land on a neighbour, so 2 or 3 stars are accepted) |

Not changed: Codex's note that a blind player gets no *positions* of fruit: the button path replaces aiming entirely, with equal scoring; balloons remain focusable buttons while they move (usable with the keyboard; relaxed mode slows them).

Re-run: prettier, eslint, typecheck, **253 web + 37 Worker unit tests**, build (precache 202 entries, 4.83 MB), **e2e 40/40** (desktop + Pixel 7).
