1. **P2 — apps/web/src/components/celebrate.tsx:26** — Matching a rightmost Padankan card on a 320px phone sends stars about 19px beyond the viewport, creating horizontal scrolling. Invisible particles remain mounted afterward. **Fix:** clip the effect’s overflow or constrain its radius, and remove completed particles.

2. **P2 — apps/web/src/stages/Kenali.tsx:99** — The opened-card check is now `aria-hidden`, with no equivalent accessible status. Screen-reader users cannot distinguish opened cards from those still required to unlock Padankan. **Fix:** add localized “opened” text to the badge’s accessible name or as visually hidden text.

3. **P3 — apps/web/src/components/look.test.tsx:116** — Regex comment stripping removes actual JSX text between literal `/*` and `*/`, allowing UI emoji through; trailing `//` comments remain and can falsely fail the guard. **Fix:** use syntax-aware comment handling for TSX and parse JSON strings separately.

No issues found in route state/focus/audio handling, disabled-button motion, confetti/dialog stacking, lock semantics, reduced motion, or bundle/offline loading.