# Handoff: G-6, Sampan Kata UI from Yang's mockup

*18 Nov 2026 · Claude Code → reviewer (Codex)*

## Context
- Yang attached a ChatGPT mockup of the boat game and asked for the UI to follow it. Builds on G-1/G-2/G-3b. The game rules and engine (`engine/sampan.ts`) are unchanged; this is look and feel. Not a git repo yet (a GitHub check-in follows), so files are listed.
- Mockup elements: wooden "Sampan Kata" sign, star-score pill, striped blue time bar, round pause button, a prompt card with a big round audio button, a bordered blue river with pink/yellow/green word buoys, a smiling wooden boat on waves, a "Cuba lagi!" card with the hornbill and "The answer is: …", glossy chevron steer buttons, clouds and leaves around the page.

## What changed
1. **Art (Codex → transparent WebP):** `assets-src/sampan/sampan-prompts.json` (same pipeline as the Home art) → `apps/web/src/assets/sampan/boat.webp` (16 KB), `foliage.webp` (32 KB), `cloud.webp` (5 KB). `scripts/home-art-to-webp.py` now takes the prompts file as an argument. Everything else (buoys, bar, buttons, waves) is CSS/SVG in code.
2. **`games/SampanKata.tsx`:** page wrapper `sampan-scene` (pale sky → cream) with `SceneDecor` (clouds, mirrored corner leaves); `Header … sign`; HUD (score pill, striped bar, glossy pause); prompt card (big round blue `AudioButton size="lg"`, divider, bold question); river (border, cloud, sparkle, SVG `Waves`); buoys coloured per lane (pink, yellow, green) with a **`data-state`** (`idle | answer | chosen | other`); boat is the smiling sampan with foam and sparkles on a right answer (falls back to an icon without the art); feedback card = big "Cuba lagi!"/"Betul!" + hornbill (`encourage`/`cheer`) + "The answer is" pill + meaning; glossy steer buttons.
3. **`components/ui.tsx`:** `Header` has a `sign` mode (the title on a compact wooden sign, transparent bar); `AudioButton` has a `lg` size. **`components/HomeParts.tsx`:** `WoodSign` takes `level` (h1 when it is the page title) and `compact`.
4. **`index.css`:** lighter river gradient, `.sampan-scene`, `.bar-stripes`.
5. **Tests:** `SampanKata.test.tsx` now asserts the buoy `data-state` instead of a colour class (the old assertion was tied to `bg-amber-100`). The existing e2e (steer into the right buoy; Cabaran Akhir full round) still pass.

## Verified
prettier, eslint, typecheck, **209 web + 37 Worker unit tests**, build (precache 198 entries, 4.75 MB), **e2e 28/28** (desktop + Pixel 7). Played a real round on a Pixel 7 viewport and captured the play screen, a right answer and a wrong answer: they match the mockup's structure.
Honest note: the **first** e2e run after the restyle reported 5 failures (`toBeVisible`); I could not reproduce them: desktop and mobile each passed alone and the full suite passed twice afterwards. If you see a flaky e2e, that is the lead.

Not verified: real devices; the boat on very short screens (river `min-h-80`); Chinese UI strings in the feedback card.

## Decisions worth challenging
1. The game keeps the shared top bar (back, sound, language) and shows the title on the sign inside it, so the controls stay reachable.
2. Buoy colours follow the lane, as in the mockup, not the answer. A colour never reveals the answer; only the result state does (green for the answer, amber for the child's pick).
3. The boat sprite is 100 px wide (was a 60 px emoji) and sits on the same line, so it may overlap a buoy that has just arrived for a moment.

## What I'd like from the review
- Bugs: the boat/buoy overlap and hit area at 100 px, the feedback card covering buoys or the boat, the sign header height on small screens (river `54dvh` + header + HUD + prompt + buttons on a 568 px-tall phone), `SceneDecor` overflow/scroll, reduced motion for the sparkles (`animate-ping`), the paused overlay on top of the new layers.
- Accessibility: `aria-live` announcement still correct; heading order (the sign is the h1); decorative images; colour contrast of text on the coloured buoys and the transparent header.
- Tests: weak spots (e.g. nothing checks the sign, the feedback card or the fallback without art).

Rank by severity, cite `file:line`, give a failure scenario, keep it concise.

## Review outcome (Codex review: `task-g6-sampan-ui.review.md`)
All 6 findings were valid and are fixed. Codex found nothing in lane hit handling, `SceneDecor` containment, live-region content, heading order, decorative-image semantics, or reduced-motion sparkles.

| # | Finding | Fix |
|---|---|---|
| 1 | P2: on a 568 px-tall phone the fixed 320 px river pushed the steer buttons off-screen; `overflow-hidden` on the scene broke the sticky header | The scene is a flex column and the river is `flex-1 min-h-52 max-h-[640px]`, so it takes the space left; `overflow-hidden` removed from the scene (only the decoration layer clips) |
| 2 | P2: at 320 px the header (sign + 3 controls) needed ~332 px and clipped the language button | Sign column `min-w-0`, compact sign `min-w-24` (its text wraps to two lines), header `px-3` in sign mode |
| 3 | P2: two-line buoys reached under the 100 px boat before resolving (buoy position used a fixed fraction) | Buoys have a fixed height (3.25 rem) and `top = y × (100% − boat − buoy height)`, so at y = 1 the buoy's bottom meets the boat's top edge at any river height; the boat is anchored to the bottom; `y` is clamped to 1 |
| 4 | P2: the feedback card (`z-10`) stayed above the pause screen | Pause overlay `z-20` |
| 5 | P2: the "+N" score used amber-500 on white (≈ 2.1 : 1) | `text-amber-700` |
| 6 | P3: weak tests | e2e at 320×568: everything fits without scrolling, header inside the screen, river ≥ 200 px, no sideways scroll; **no sailing buoy goes below the boat's top** over 7 s; **pausing during feedback puts the pause screen on top** (checked it fails without the `z-20`). Unit: the feedback card in 中文 shows the answer, a Chinese meaning and the hornbill's `encourage` pose |

Not added: a missing-art fallback test (the art is bundled by a build-time glob, so jsdom cannot remove it) and a jsdom check of the buoy `calc()` (jsdom rewrites `calc`; the browser test covers it).

Re-run: prettier, eslint, typecheck, **210 web + 37 Worker unit tests**, build, **e2e 30/30** (desktop + Pixel 7). Screenshot at 320×568 checked.
