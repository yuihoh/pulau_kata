# Handoff: G-2, the hornbill mascot

*18 Nov 2026 · Claude Code → reviewer (Codex)*

## Context
- Plan: `docs/graphics-and-games-proposal.md` §G2. Yang chose a **hornbill (burung enggang)**, drawn first by Codex image generation; an illustrator may redraw it later if parents pay.
- Builds on G-1 (`task-g1-look-and-feel.md`). Not a git repo, so files are listed.

## What changed
1. **Art source** `assets-src/mascot/`: `mascot-prompts.json` (shared style, a "consistency" instruction, 8 poses with where each is used) and 8 PNGs (1024²): `wave` (generated first, from text only), then `cheer`, `think`, `encourage`, `clap`, `point`, `star`, `sleep`, each generated with `wave.png` attached as the character reference (`codex exec … -i assets-src/mascot/wave.png`; `-i` must come after the prompt because it takes several files). The first `wave` attempt put the red casque on the head like a crest; the prompt now says the casque sits on the beak.
2. **Conversion** `scripts/mascot-to-webp.py` (Python + Pillow, `py -I scripts/mascot-to-webp.py`): flood-fills the white background from the border (white inside the outline stays white), trims, pads 4 %, scales to 320 px, writes transparent WebP to `apps/web/src/assets/mascot/<pose>.webp`. Python is a stop-gap until task 9's `optimise-images`.
3. **Component** `apps/web/src/components/Mascot.tsx`: `<Mascot pose size>` (decorative `alt=""` + `aria-hidden`; gentle bob, or one hop for `cheer`/`clap`/`star`; still when reduced motion applies) and `<MascotSays pose>` (mascot + speech bubble). Files via `import.meta.glob(…, { query: '?url' })`.
4. **Where it appears:** Home (waving, the tagline in a bubble), Kenali (pointing at the intro; clapping once every card is open), Uji and Bina Susun (cheer on right, thumbs-up "encourage" on wrong), Bina Tulis sendiri verdict (cheer / encourage), stage results (clap; holding a star when the whole unit is complete), Koleksi (holding a star beside the count), not-found page (sleeping). Not yet: Misi (has its own characters), Sampan (G-6 redraws the boat with the hornbill rowing), `think` and `point` beyond Kenali.
5. **Tests:** `components/mascot.test.tsx` (every pose has a WebP under 40 KB and its source PNG; decorative a11y; pose and size). `stages/Uji.test.tsx`: cheer on a right answer, encourage on a wrong one, clap on the result.

## Verified
prettier, eslint, typecheck, **196 web + 37 Worker unit tests**, validate-content (0 errors), build (precache 184 entries, 4.33 MB; the 8 poses add ~140 KB), **e2e 20/20** (desktop + Pixel 7). All 8 WebPs checked composited on blue (background fully removed, white belly/tail kept). Screens checked on a Pixel 7 viewport: Home (waving + bubble), Uji right (cheer) and wrong (thumbs-up), stage result (clap + confetti), not-found (sleep).

Not verified: real devices; whether children like it; the hornbill is a first AI version (one oddity Yang may notice: the far eye sits on the edge of the beak, a cartoon convention).

## Decisions worth challenging
1. A hornbill with no name yet: Yang to name it (a name is a brand decision).
2. Decorative only: the mascot never carries information that isn't also in text.
3. 320 px WebP for every pose, though most screens show it at 56–128 px (sharp on 2–3× screens; ~10–20 KB each).

## What I'd like from the review
- Bugs: the background removal (could it eat into the bird where the outline has a gap?), `import.meta.glob` with `?url` in build and tests, layout on a 320 px phone (mascot + bubble + long Chinese text), motion loops (`repeat: Infinity`) and battery/CPU on many mascots, reduced motion.
- Accessibility: anything the mascot hides or duplicates.
- Precache size.
- Tests: weak spots.

Rank by severity, cite `file:line`, give a failure scenario, keep it concise.

## Review outcome (Codex review: `task-g2-mascot.review.md`)
All 3 findings were valid and are fixed. Codex found no screen-reader, import or precache issues.

| # | Finding | Fix |
|---|---|---|
| 1 | P2: switching "reduce motion" on while Home/Kenali is open left the mascot bobbing (framer reads the setting only at mount) | `usePrefersReducedMotion()` in `Mascot.tsx` follows the setting live (`useSyncExternalStore` on `matchMedia`); the image is keyed by moving/still, so a running animation stops at once. Test "follows the phone reduce-motion setting live" (`data-motion`) |
| 2 | P2: the bob ran forever beside reading text | The bob now plays twice (≈ 4.8 s, under WCAG 2.2.2's 5 s) and stops |
| 3 | P3: white gaps enclosed by the outline (between the raised wings and the head in `cheer`, beside the beak in `think`) stayed opaque | Per-pose `"clear"` points in `mascot-prompts.json`; `scripts/mascot-to-webp.py` fills from them too and **self-checks** (every named gap transparent, the bird > 30 % opaque) because the web tests cannot decode WebP. Checked visually on blue: gaps gone, eyes/belly/tail intact. (In `wave` I found no enclosed gap; the measured white regions there are the eyes.) |

Re-run: prettier, eslint, typecheck, **197 web + 37 Worker unit tests**, validate-content (0 errors), build, **e2e 20/20**. (The tree also contains the G-3 Home map work, checked by the same run; it has its own handoff.)
