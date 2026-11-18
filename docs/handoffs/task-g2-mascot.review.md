1. **P2 — `apps/web/src/components/Mascot.tsx:45`** — Enabling reduced motion while Home or Kenali remains mounted leaves the mascot bobbing. Confirmed against the installed hook, which snapshots the preference until remount. **Fix:** subscribe to preference changes, stop/reset active animations, and test toggling the setting.

2. **P2 — `apps/web/src/components/Mascot.tsx:58`** — The automatic bob runs indefinitely beside reading material, with no pause control or visibility guard. **Fix:** finish within five seconds, or provide a pause mechanism and suspend animation offscreen.

3. **P3 — `scripts/mascot-to-webp.py:36`** — Border-only filling leaves enclosed background pockets opaque, visibly between the head and raised wings in `wave` and `cheer`. The “transparent WebP” test passes because it never checks alpha. **Fix:** add per-pose background seeds/masks, regenerate affected assets, and assert transparent gaps alongside opaque belly/tail pixels.

- **Screen-reader semantics:** no hidden information or duplicated announcements found.
- **Asset imports/precache:** no issue found in the existing build; all eight WebPs are cached, totaling 149,002 bytes.
- **320 px layout:** no issue found by inspection; browser verification and test reruns were blocked by read-only temporary directories.