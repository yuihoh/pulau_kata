# Task 9: optimise-images

*18 Nov 2026 · Claude Code*

## What was built
`npm run optimise-images` (`scripts/optimise-images.ts`, Node + `sharp`) turns the PNG pictures under `content/` into small WebP files and archives the PNG masters.

- Finds every `content/**/*.png`, writes `<name>.webp` beside it (transparency kept, quality 80, never enlarged), then **moves** the PNG to `assets-src/content-originals/<same relative path>`. Nothing is deleted.
- Longest side: word pictures 512, postcards 768, Misi backgrounds (`quest/bg-*`) 1024, other Misi art 512, unit icons 256 (`targetSize()` in the script).
- `--dry-run` lists what would change. With no PNG left in `content/` it does nothing, so it is safe to re-run. To redo a picture, put its PNG back in `content/` and run it again.
- Why move the masters: the loader's `import.meta.glob` matched both `.png` and `.webp`, so Vite bundled both and `dist` was 194 MB. With the masters out of `content/`, only WebP ships.

## Result (run on 18 Nov 2026)
- 89 PNGs, **187.7 MB -> 5.1 MB** (word pictures about 50-75 KB, postcards about 137 KB). `content/` is 9.5 MB, `apps/web/dist` is 11 MB (was 194 MB).
- Masters are in `assets-src/content-originals/` (188 MB).
- Looked at a contact sheet (word picture, waterfall scene, postcard, Misi background, Misi character): sharp edges, no artefacts, transparent corners kept.

## Changed files
- `scripts/optimise-images.ts` (new)
- `package.json` (script `optimise-images`, devDependency `sharp ^0.35.5`) and `package-lock.json`
- `content/tahun-3/**` and `content/tahun-5/**`: 89 `.png` replaced by `.webp` (word images, `postcard`, `quest/*`)
- `assets-src/content-originals/**`: the 89 original PNGs (moved)
- `CLAUDE.md` §10 (status)

## Verified
`validate-content` 0 errors 0 warnings · `typecheck` · `lint` · `format:check` · unit tests (web 253, api 37) · `build` · `e2e` 40 passed (desktop + Pixel 7).

## Decisions worth challenging
1. **Moving the masters out of `content/`** instead of keeping them there and excluding them from the bundle. Reason: the `content/` layout in CLAUDE.md is what ships, `assets-src/` already holds the masters for the other art. Cost: new Codex PNGs land in `content/` and need one script run.
2. **No quality tuning per picture.** One setting (80) for everything. Flat cartoon art with alpha looked fine; it would be easy to change `QUALITY`.
3. **Precache grew from 4.8 MB to 10 MB** (291 files: WebP 5.7 MB, MP3 3.4 MB, JS 0.7 MB). Before, the PNGs were never precached, so first load did not include the pictures. Now the service worker downloads all pictures on first visit. This is a task 8 (PWA offline) decision: precache everything, or cache pictures and audio per unit when it is opened. Not changed here.
4. The loader still falls back to `.png` (`loader.ts`, `validate-content.ts`). Harmless now; could be removed.
5. A PNG left in `content/` is not flagged by `validate-content`, so forgetting to run the script would ship the big file. A warning could be added.

## Review outcome (Codex, 18 Nov 2026)

| # | Severity | Finding | Outcome |
|---|---|---|---|
| 1 | Medium | A redone picture overwrote the archived master, breaking "nothing is deleted"; the copy fallback caught every error | **Fixed.** `archiveMaster()` keeps the older master as `name.1.png`, `name.2.png`, ...; the copy fallback now only runs for `EXDEV`. Tested by putting a master back in `content/`: the older one was kept, byte for byte |
| 2 | Low | Importing the script from a test could trigger conversion (loose file-name check) | **Fixed.** `isEntryPoint()` compares the real path of `process.argv[1]` with this file. Tested: importing it from `tsx -e` ran nothing and left the PNG in `content/` |

Decisions 3 (precache size) and 5 (warn about PNG in `content/`) stay open as follow-ups (3 belongs to task 8). The script has no automated test (scripts are outside Vitest); both fixes were checked by hand as above.

## What I'd like from the review
- Bugs in `scripts/optimise-images.ts` (path handling on Windows, the move fallback, the "run only as a script" check, re-running after a partial failure).
- Anything in the app that still expects a `.png` under `content/`.
- Whether decision 3 or 5 should be handled in this task.
