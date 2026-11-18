# Handoff: G-3b, Home screen rebuilt from Yang's mockups

*18 Nov 2026 · Claude Code → reviewer (Codex)*

## Context
- Yang attached two ChatGPT mockups (Tahun 3 and Tahun 5 Home) and asked for the main page to match them, with Codex generating the pictures. Builds on G-3 (`task-g3-home-map.md`). Not a git repo, so files are listed.
- Mockup elements: wooden hanging sign "Bahasa Melayu / Tahun N", orange stitched ribbon with the Tema, glowing numbered stones on a dotted yellow path, wide unit cards (picture, "Unit N" pill, title, translation, `★ 0/12`, round chevron button) tinted orange / blue / purple.
- The mockups are landscape; the app is phone-first portrait, so the structure (sign, ribbon, alternating stones and cards on the path over a landscape) is kept and fitted to a phone, not copied pixel for pixel.

## What changed
1. **Art (Codex, on white, then transparent WebP):** `assets-src/home/home-prompts.json` (one shared style; items: `sign`, `marker`, six unit icons) → `scripts/home-art-to-webp.py` (flood-fill background removal + trim + scale, with a self-check that the picture is neither empty nor fully opaque). Outputs: `apps/web/src/assets/home/sign.webp` (24 KB), `marker.webp` (13 KB), and `content/<track>/unit-0N/icon.webp` (12–21 KB each). The sign and the stone are **blank**: all text and numbers are drawn in code so they stay translatable.
2. **`apps/web/src/components/HomeParts.tsx`** (new): `WoodSign` (subject + year pill as real text; `splitTrackTitle("Bahasa Melayu Tahun 3")`), `Ribbon` (CSS orange ribbon with notched ends and a dashed stitch), `UnitMarker` (stone picture + number; glow when it is the next unit; tick + visually hidden "Finished" when done), `UnitCard` (tinted orange/blue/purple by position, picture, pill, titles, stars, chevron; picture and chevron hidden below 340 px). Every picture falls back to plain CSS when its file is missing.
3. **`TrailMap.tsx`**: marker centre (`left`/`right` %) and size are props (Home uses 20/80 % and 76 px; the unit screen keeps 28/72 and 68).
4. **`Home.tsx`**: the year sign hangs over the first Tema of each year, the ribbon over every Tema; stops use `UnitMarker` + `UnitCard`. Test ids kept (`unit-stop-*`, `chapter-stars-*`, `map-*`).
5. **`content/loader.ts`**: `unitIconUrl(entry)` (glob `content/*/unit-*/icon.{webp,png}`); a new unit needs only an `icon.webp` to get its picture.
6. **Tests:** `components/homeParts.test.tsx` (title split, sign/ribbon text, stone number and tick, card colour cycle and fallback). Existing `map.test.tsx` and the 320 px / 2× text e2e layout test still apply.
7. **Licences:** README row for the Home art.

## Verified
prettier, eslint, typecheck, **209 web + 37 Worker unit tests**, validate-content (0 errors), build (precache 194 entries, 4.68 MB; the Home art adds ~150 KB), **e2e 24/24** (includes the 320 px / 2× text layout test, which still passes with the new cards). Screens checked at Pixel 7 width for both years: sign, ribbon, stones, cards and icons all render and match the mockups in structure.

Not verified: real devices; tablets/desktop; Chinese UI strings in the cards (the layout test uses English).

## Decisions worth challenging
1. Sign and ribbon are stacked, not side by side (a phone is too narrow for both).
2. The year sign appears once per year (over Tema 1); 8 Tema would otherwise repeat it.
3. Card colours cycle by position, not by meaning (as in the mockup).
4. Six unit icons are generated now; each new unit needs one more image (prompt entry + conversion).

## What I'd like from the review
- Bugs: text on the sign when the title has no "Tahun N", long Tema titles in the ribbon (clip-path) at 320 px and 2× text, the glow on a 76 px marker, number alignment on the stone, the hidden picture/chevron breakpoint, fallbacks without art.
- Accessibility: heading order (h2 sign, h3 ribbon), decorative images, link name of a unit stop.
- Layout: TrailMap with the new `left`/`right` values (marker vs card overlap, guide placement).
- Tests/script: weak spots in `homeParts.test.tsx` and `home-art-to-webp.py`.

Rank by severity, cite `file:line`, give a failure scenario, keep it concise.

## Review outcome (Codex review: `task-g3b-home-mockup.review.md`)
All 4 findings were valid and are fixed. Codex found nothing in the ribbon text, marker glow/number alignment, missing-file fallbacks, heading order, decorative images, unit-link names, loader or licences.

| # | Finding | Fix |
|---|---|---|
| 1 | P2: the picture/chevron breakpoint was a fixed 340 px, so at 393 px with 2× text they squeezed the unit title to nothing | The card is a CSS container (`@container`) and hides picture and chevron with `@max-[12rem]:hidden`, so the rule follows the card's own width in rem and scales with text size. e2e checks the title keeps ≥ 60 px and stays inside its card; **verified it fails (title squeezed to 0 px) with the old fixed breakpoint** |
| 2 | P2: the sign's text was absolutely positioned and non-wrapping, so it escaped the sign at large text or with a title without "Tahun N" | The sign's wood is a stretched background; the text is in normal flow and wraps, so the sign grows with it. e2e checks the sign's text stays inside the sign at 320/393 px × 1×/2× |
| 3 | P3: at 288 px the guide (0–56 px) covered part of the 20 % marker | Home markers moved to 24 %/76 %; the guide is sized to the **measured** room beside the marker and left out below 32 px (very narrow phones), so it can never cover a marker. e2e checks guide–marker overlap |
| 4 | P3: the art script checked transparency after adding transparent padding, so an opaque square still passed | `check_transparent` runs on the trimmed picture before padding; `py -I scripts/home-art-to-webp.py --self-test` proves an opaque square fails and a round object on white passes |

Also fixed while re-running: two unit tests looked at the old card wrapper / needed a measured width (the guide is shown at full size until the width is measured, which a browser does before the first paint).

Re-run: prettier, eslint, typecheck, **209 web + 37 Worker unit tests**, build, **e2e 28/28** (layout test now runs at 320 and 393 px, text 1× and 2×).
