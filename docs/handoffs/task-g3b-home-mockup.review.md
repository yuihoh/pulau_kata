1. **P2 — `apps/web/src/components/HomeParts.tsx:162`** — At 393px with 2× text, the fixed 340px breakpoint keeps the picture and chevron visible. Their enlarged widths consume the card’s available space, collapsing the text column and causing overlap/clipping. **Fix:** hide decorations based on available card width using relative units; test 341px and 393px at 2× text.

2. **P2 — `apps/web/src/components/HomeParts.tsx:44`** — At 320px/2× text, the sign shrinks while its absolutely positioned, nonwrapping text grows beyond it and is clipped by the Tema container. Long titles without “Tahun N” also overflow. **Fix:** allow wrapping and content-driven height; add rendered tests for both cases.

3. **P2 — `apps/web/src/components/TrailMap.tsx:153`** — On a 288px-wide map, the 20% marker starts at 19.6px, while the clamped guide occupies 0–56px. Its higher stacking order covers part of the current marker; the 80% position mirrors this problem. **Fix:** move the guide above the marker when side space is insufficient, and test guide–marker overlap.

4. **P3 — `scripts/home-art-to-webp.py:77`** — The transparency check runs after transparent padding is added. A completely opaque square becomes approximately 89% opaque and passes even when background removal removed nothing. **Fix:** validate background transparency before padding; add a synthetic opaque-background regression test.

No additional findings in ribbon text, marker glow/number alignment, missing-file fallbacks, heading order, decorative images, unit-link names, loader, or licences from static inspection.