# Handoff: G-3, Home map + unit trail

*18 Nov 2026 · Claude Code → reviewer (Codex)*

## Context
- Plan: `docs/graphics-and-games-proposal.md` §G3/G4. Builds on G-1 (look and feel) and G-2 (hornbill mascot). Not a git repo, so files are listed.
- Home was a list of white text cards; it is now a board-game map. The unit screen's four stage rows are now stepping stones.

## What changed
1. **`apps/web/src/components/TrailMap.tsx`** (new): round stops on a winding dashed path, zig-zagging between 28 % and 72 % of the width, `spacing` px apart. The path is an SVG (`viewBox 0 0 100 H`, `preserveAspectRatio="none"`, `vector-effect: non-scaling-stroke`), so it works for any number of stops and any width. Each stop: a marker, a label card on the wider side, and a `wrap` (link or locked div) covering the row. The hornbill (`point` pose, mirrored on the right) stands on the free side of the `current` stop (`data-current`).
2. **`apps/web/src/screens/Home.tsx`** (rewritten): per track a `map-<track>` section; per Tema an illustrated landscape (or the Tema colour without one) with a Tema banner and a `TrailMap` of its units: numbered Tema-coloured markers, a green tick + visually hidden "Finished" when all four stages are done, label = Unit N, BM title, translation, `★ x / 12` (`chapter-stars-<id>` kept). The guide stands at the first unfinished unit **per track**. Units stay unlocked (the path suggests an order only). Tagline is plain text again (the guide is on the map). Lab links moved to a small chip row at the bottom (`home.labTitle`).
3. **`apps/web/src/screens/ChapterScreen.tsx`**: the four stages as a `TrailMap` (badges from G-1, label with name, description, stars). Guide at `nextStage()` if it is unlocked. Test ids `stage-<stage>` and `[data-locked]` unchanged; `StageBadge` takes a size class.
4. **Art**: `assets-src/maps/map-prompts.json` (style: portrait 2:3, scenery on the edges, calm open centre, no roads/people/text) + 2 Codex PNGs (Tahun 3 Tema 1 kampung; Tahun 5 Tema 1 town neighbourhood). `scripts/png-to-webp.py` → `content/tahun-3/tema-01.webp` (87 KB), `content/tahun-5/tema-01.webp` (109 KB), 768 px wide.
5. **`apps/web/src/content/loader.ts`**: `temaMapUrl(track, tema)` (glob `content/*/tema-*.webp`).
6. **i18n**: `home.unitDone`, `home.labTitle` (en + zh). **Licences**: README row.
7. **Tests** `apps/web/src/screens/map.test.tsx`: landscapes exist (and Tema 2 falls back); every unit is a stop linking to its unit with its title; the guide stands at the first unfinished unit per track and finished units say "Finished"; the unit trail's guide waits at Uji after Kenali, and only one guide is shown.

## Verified
prettier, eslint, typecheck, **201 web + 37 Worker unit tests**, validate-content, build (precache 186 entries, 4.54 MB; the two maps add ~200 KB), **e2e 20/20** (before the review fixes). Screens checked at Pixel 7 width and at 320 px: labels wrap (e.g. "Riangnya Keluargaku") without overlapping the next stop; the guide fits on the free side.

Not verified: real devices; tablets/desktop width (the map is capped by the page's `max-w-3xl`); a Tema with many more than 3 units (the path just grows).

## Decisions worth challenging
1. Units are not locked on the map (same as before); only the guide suggests the order.
2. One guide per year (two maps on Home in the pilot, so two hornbills).
3. Label cards are 95 % opaque, which hides part of the art but keeps the text readable on any background.
4. Map art ships as WebP made by a Python stop-gap script until task 9.

## What I'd like from the review
- Bugs: TrailMap geometry (overlap when a label wraps to 4 lines, very narrow or very wide screens, the `calc()` positions), the row-wide link hit area, the mirrored mascot, `current` when every unit is finished (-1), the SVG path for 1 stop.
- Accessibility: link names (marker number + label text), the decorative SVG, focus order, the locked stage div.
- Loader/precache: the new glob, WebP sizes.
- Tests: weak spots.

Rank by severity, cite `file:line`, give a failure scenario, keep it concise.

## Review outcome (Codex review: `task-g3-home-map.review.md`)
All 3 findings were valid and are fixed. Codex found no issues in link names, the decorative SVG, focus order, locked-stage markup, row links, mascot mirroring, `current = -1`, the single-stop path, or the loader/precache.

| # | Finding | Fix |
|---|---|---|
| 1 | P2: at 200 % text size the labels outgrew the fixed 118/132 px rows and overlapped the next stop | `TrailMap` rewritten: each stop is a row in normal flow with `min-height: spacing` (grows with its label); the marker is centred in its row; the dashed path is drawn afterwards through the markers' **measured** centres (`ResizeObserver`), so it always meets them. Stop wrappers (`Home`, `ChapterScreen`) are now in-flow `block w-full` |
| 2 | P3: at 320 px the guide started ~11 px outside the map | Guide position clamped with CSS `max()`/`min()` to stay inside the map |
| 3 | P3: DOM-only tests could not catch layout defects; all-finished and single-stop cases untested | e2e "Home map layout holds at 320px with text x1 / x2" (no label/marker overlap between rows, markers and guide inside the map, a path exists, no sideways scroll). Checked that the x2 test **fails** with fixed row heights ("row 0 overlaps row 1"). Unit tests: all units finished → no guide, 3× "Finished"; a single stop → no path, still a link, guide shown |

Re-run: prettier, eslint, typecheck, **203 web + 37 Worker unit tests**, build, **e2e 24/24**. Screens re-checked at 320 px and Pixel 7: same look as before.
