1. **P2 — `apps/web/src/games/TangkapBuah.tsx:378`** — The basket is clamped visually, but collisions use its unclamped position. In a 288px field, `basketX=0` renders at 58px; fruit at `x=.22` renders at 63px yet misses. **Fix:** share clamped coordinates and hitbox dimensions between rendering and the engine.

2. **P2 — `apps/web/src/games/TangkapBuah.tsx:323`** — Screen readers receive option words but no fruit positions or basket position. A blind player cannot intentionally steer toward an answer, and the glow hint supplies no actionable alternative. **Fix:** provide accessible word selection or announced positions with equivalent controls and scoring.

3. **P2 — `apps/web/src/games/PecahBelon.tsx:240`** — Balloons disappear while still visibly tappable. At engine removal (`y=-.1`), a 208px field still shows about 98px of the 104px balloon body; a 640px field shows about 55px. **Fix:** map travel across the full field plus balloon height, removing balloons after they exit.

4. **P2 — `apps/web/src/games/PecahBelon.tsx:296`** — White labels have weak contrast on the gradients, particularly amber and emerald (approximately 2.5–2.7:1 at their centres). Long words shrink to 13px, worsening readability. **Fix:** use an opaque, contrasting label background or substantially darker balloon colours.

5. **P3 — `apps/web/tests/e2e/smoke.spec.ts:512`** — Calling DOM `.click()` bypasses hit testing, so the balloon test passes even when targets are covered or unreachable by touch. Keyboard interaction is also untested. **Fix:** exercise real pointer taps and keyboard activation through the result screen.

No additional issues found in pointer handling, purity/seeding, termination/frame caps, node bounds, `onFinish`, retry queues, class-plan edge cases, relaxed timing, or the Sampan extraction.