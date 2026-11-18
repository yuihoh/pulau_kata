1. **P2 — `apps/web/src/components/TrailMap.tsx:87`** — At 200% text size, labels outgrow the fixed 118/132px spacing, overlap adjacent stops and can be clipped by the map container. **Fix:** size rows from label height and derive marker/path coordinates from those rows.

2. **P3 — `apps/web/src/components/TrailMap.tsx:97`** — At a 320px viewport, the map is 288px wide; the mascot starts at `0.28 × 288 − 36 − 56 = −11.36px`, clipping its outer edge on either side. **Fix:** clamp its position or reduce its size at narrow widths.

3. **P3 — `apps/web/src/screens/map.test.tsx:35`** — DOM-only assertions let both layout defects pass; all-finished, single-stop and multiple-Tema cases are also uncovered. **Fix:** add browser bounds/overlap checks at 320px and enlarged text, plus those state fixtures.

Accessibility: no other issues found in link names, decorative SVG, focus order or locked-stage markup.

Other geometry/state: no issues found in row-wide links, mascot mirroring, `current = -1` or the single-stop path.

Loader/precache: no issues found; both 768×1152 WebPs are present in the built precache (89,500 and 112,572 bytes).