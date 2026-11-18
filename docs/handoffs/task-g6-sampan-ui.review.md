1. **P2 — `apps/web/src/games/SampanKata.tsx:545`** — On a 568 px-tall phone, the 320 px minimum river plus header, HUD, prompt and buttons pushes steering below the viewport. Scrolling also loses the sticky header because the scene uses `overflow-hidden`. **Fix:** size the river from available viewport height and confine overflow clipping to decorations.

2. **P2 — `apps/web/src/components/ui.tsx:188`** — At 320 px wide, the compact sign, three controls, gaps and padding require at least 332 px. The scene clips the rightmost language control. **Fix:** let the sign column shrink, remove its fixed minimum at narrow widths, or reflow the header.

3. **P2 — `apps/web/src/games/SampanKata.tsx:605`** — In the minimum-height river, arriving buoys have only about 37 px between their top and the boat. Two-line labels exceed that space, so the boat obscures the selected label’s second line before the answer resolves. **Fix:** position arrival using the buoy’s actual bottom edge and the boat’s top edge.

4. **P2 — `apps/web/src/games/SampanKata.tsx:695`** — Pausing during feedback leaves the `z-10` feedback card above the pause overlay. On short rivers, it overlaps the centered pause message. **Fix:** give the pause overlay a stacking level above feedback and boat layers.

5. **P2 — `apps/web/src/games/SampanKata.tsx:673`** — The correct-answer score uses amber-500 on nearly white, giving approximately 2.1:1 contrast, below the 3:1 requirement for large text. **Fix:** use a darker foreground such as amber-700.

6. **P3 — `apps/web/src/games/SampanKata.test.tsx:80`** — The pause test checks text presence during sailing, so feedback stacking failures pass. Compact-header geometry, Chinese feedback and missing-art fallback also lack coverage. **Fix:** add focused rendering tests and browser checks at 320×568, including pausing during feedback.

No additional source-level findings in lane hit handling, SceneDecor containment, live-region content, heading order, decorative-image semantics, reduced-motion sparkles, or buoy/header text contrast; browser verification was blocked by the read-only sandbox.