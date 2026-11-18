# Handoff: G-1, look and feel (font, own icons, Tema colours, game-feel feedback)

*18 Nov 2026 · Claude Code → reviewer (Codex)*

## Context
- Yang played the app and found the screens and games too plain. Plan: `docs/graphics-and-games-proposal.md`. Yang decided (18 Nov): improve both, hornbill mascot, Tangkap Buah + Pecah Belon, all **before the pilot**. Order: **G-1 look and feel** → G-2 mascot → G-3 Home map → G-4 mini-games.
- This task is G-1 only. No content, engine or progress changes. Not a git repo, so files are listed.

## What changed
1. **Font: Fredoka** (SIL OFL 1.1), variable weight, Latin + Latin-ext only (34 KB), vendored in `apps/web/src/assets/fonts/` and declared in `apps/web/src/index.css` (`@font-face` + Tailwind `@theme --font-sans`). Chinese falls back to system fonts. Precached by the existing `woff2` glob.
2. **Own icon set** `apps/web/src/components/Icon.tsx`: Phosphor Icons (`@phosphor-icons/react` 2.1.10, MIT), each icon imported from its own module (tree-shaken). Decorative by default (`aria-hidden`), `label` → `role="img"`. Replaced every emoji in screens: `components/ui.tsx` (Stars, picture placeholder, AudioButton, SoundToggle, back arrow), `screens/Home.tsx`, `screens/ChapterScreen.tsx` (round stage badges, `data-locked` on the padlock badge), `screens/Koleksi.tsx`, `stages/Kenali.tsx` (tick badge, puzzle), `stages/Uji.tsx`, `stages/Bina.tsx` (hint bulb, party icon), `stages/StageResult.tsx`, `stages/CabaranAkhir.tsx`, `games/Padankan.tsx` (card back), `games/Misi.tsx` (translate, map, smile, book, tap, next), `games/SampanKata.tsx` (menus, HUD, steer buttons, pause). **Left for G-6:** the boat sprite inside the river; the ▶ on the voice-review lab page.
3. **Tema colours** `apps/web/src/components/tema.ts`: 8 colours (Tema 1 = orange), full class names so Tailwind keeps them. Used on Home (Tema pill, unit card strip) and the unit screen (pill, stage badges).
4. **Game-feel feedback** `apps/web/src/components/celebrate.tsx`:
   - `answerMotion(state)`: bounce on right, shake on wrong (Uji options + letter slots, Bina sentence area, Misi options).
   - `StarBurst`: stars fly out of a right answer (Uji, Bina Susun + AI verdict "correct", Misi, Padankan pairs).
   - `Confetti`: on stage results with ≥1 star and the Sampan result. Layout computed once at module load (render stays pure; eslint `react-hooks/purity`).
   - `Stars animate`: earned stars pop in one by one on results.
   - Both off when reduced motion applies: `App.tsx` wraps everything in `MotionConfig reducedMotion="user"`; the components read `useReducedMotionConfig()`.
5. **Screen fade** in `App.tsx`: each route fades in (opacity only, keyed by the route). Opacity only, so `position: fixed` overlays (confetti, Sampan pause) are not moved by a transform.
6. **Chunky "game" buttons**: `PrimaryButton`, letter/word tiles, steer buttons, Uji/Misi options get a darker bottom edge that squashes when pressed (framer `whileTap` on motion buttons, because a framer transform overrides the CSS `active:scale`).
7. **UI strings**: removed emoji from `i18n/en.json` + `zh.json` (`Betul!`, lab links, Koleksi), and "◀ ▶ buttons" → "arrow buttons".
8. **Licences**: `docs/licences/README.md` rows + `fredoka-OFL.txt`, `phosphor-icons-MIT.txt`.
9. **Tests**: new `components/look.test.tsx` (every icon renders; a11y; 8 distinct Tema colours + wrap; answerMotion; StarBurst/Confetti present, and absent under reduced motion; Stars as icons with the label; **guard: no emoji in any non-test `.tsx`/`.json` under `src/`** except the two listed exceptions). `App.test.tsx`: lock checks use `[data-locked]`; new regression test (below). e2e/unit strings `Betul! 🎉` → `Betul!`, lock checks via `[data-locked]`.

## Bug found while verifying
The Kenali tick badge first had `data-testid="card-opened"`, which matched the e2e loop's `[data-testid^="card-"]`, so the loop clicked badges and only 6 of 12 cards opened (4 e2e failures). Renamed to `opened-badge`; regression test in `App.test.tsx`.

## Verified
prettier, eslint, typecheck, **191 web + 37 Worker unit tests**, validate-content (0 errors), build (precache 176 entries, 4.18 MB; the font adds 34 KB), **e2e 18/18** (desktop + Pixel 7). Screens checked on a Pixel 7 viewport: Home, unit screen, Kenali, Uji right answer (bounce + stars), Padankan card backs, stage result (stars + confetti), Sampan HUD, Koleksi.

Not verified: real devices (iPhone Safari variable-font rendering); how it feels to a child.

## Decisions worth challenging
1. Fredoka for **all** text, not only headings (one consistent look; it stays readable at body size). Max weight 700, so existing `font-extrabold` renders as bold.
2. Phosphor *duotone/fill* rather than drawing our own SVGs: consistent, licensed, small; a custom set can replace it later through `Icon.tsx` only.
3. Screen fade keyed by the whole route remounts the screen on every hash change. No screen changes the hash while expecting to keep state (checked: `navigate()` is unused), but say so if you see one.

## What I'd like from the review
- Bugs: the route-keyed fade (state loss, focus, double effects such as music or autoplay), framer `animate`/`whileTap` on disabled buttons, StarBurst overflow causing horizontal scroll on narrow phones, confetti z-index over dialogs, `data-locked` semantics.
- Accessibility: icons replacing text symbols (anything that lost its accessible name?), reduced motion coverage.
- Bundle/offline: font loading and precache, Phosphor imports.
- Tests: weak spots in `look.test.tsx` (e.g. the emoji guard's comment stripping).

Rank by severity, cite `file:line`, give a failure scenario, keep it concise.

## Review outcome (Codex review: `task-g1-look-and-feel.review.md`)
All 3 findings were valid and are fixed. Codex found no issues in the route-keyed fade, disabled-button motion, confetti/dialog stacking, lock semantics, reduced motion, or bundle/offline loading.

| # | Finding | Fix |
|---|---|---|
| 1 | P2: a star burst on a right-edge card spilled ~19 px past a 320 px screen, so the page scrolled sideways; finished particles stayed mounted | `html, body { overflow-x: clip }` in `index.css` (clip, not hidden, so sticky headers still work); `StarBurst` removes itself after 800 ms. Tests: e2e "star bursts never make a 320px-wide phone scroll sideways" (checked that it **fails** without the CSS fix: 2 px overflow), unit "removes the star burst once it has played" |
| 2 | P2: the opened-card tick was `aria-hidden`, so screen readers could not tell opened cards apart | Visually hidden ", opened" / "，已打开" inside the badge (`kenali.cardOpened`). Test in `App.test.tsx` |
| 3 | P3: the emoji guard's regex comment stripping could hide real JSX text or misfire on `//` in strings | Small scanner `stripComments` that skips strings/templates; JSON is scanned whole. Test with URL strings, templates and JSX comments |

Re-run: prettier, eslint, typecheck, **193 web + 37 Worker unit tests**, build, **e2e 20/20**.
