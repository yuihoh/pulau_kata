# Handoff — Task 4: Kenali stage, Padankan, progress storage, first screens

*16 Nov 2026 · Claude Code → reviewer (Codex)*

Context: `CLAUDE.md` (§1 chapter flow, §3 stack, §4 "P1 must allow P2 additions", §9 conventions). Earlier handoffs are in `docs/handoffs/`. Not a git repo, so the files are listed below.

## What was built
| Area | Files | Notes |
|---|---|---|
| Padankan rules (pure) | `src/engine/padankan.ts` (+ `padankan.test.ts`) | 6 pairs of picture + BM word cards. `flip` → match or mismatch. `resolveMismatch` is called by the UI after a 900 ms pause. Stars use `padankanStars` from task 3 |
| Storage | `src/storage/ProgressStore.ts`, `IdbProgressStore.ts`, `ProgressProvider.tsx` | `ProgressStore` interface (P2 adds a Supabase implementation). IndexedDB via idb-keyval with versioned records `{ v: 1, data }`. Falls back to memory if IndexedDB fails. A React context with `get`/`save` keeps an in-memory cache |
| Content loader | `src/content/loader.ts` | Build-time `import.meta.glob` of `content/*/track.json`, chapters and media. No runtime Zod (CI validates). Image falls back from `.webp` to `.png` to a placeholder; audio is hidden if missing. **Production hides `reviewed: false` chapters** unless `VITE_SHOW_UNREVIEWED=true` (for staging) |
| Routing | `src/app/router.ts` | Hash router (`#/`, `#/c/<id>`, `#/c/<id>/<stage>`) using `useSyncExternalStore`. Locked or unbuilt stage URLs fall back to the chapter screen (`App.tsx`) |
| Screens | `src/App.tsx`, `screens/Home.tsx`, `screens/ChapterScreen.tsx`, `stages/Kenali.tsx`, `stages/StageResult.tsx`, `games/Padankan.tsx`, `components/ui.tsx` | Home (tema → units, star totals), chapter (4 stages with lock and stars), Kenali (card grid, word detail dialog, progress counter, Padankan unlocks after all cards are opened), result (stars, next stage, replay) |
| i18n | `src/i18n/en.json`, `zh.json` | All UI strings in both languages; word class labels translated |
| Tests | `src/App.test.tsx`, `src/test-setup.ts`, `tests/e2e/smoke.spec.ts` | Unit: loader, home, unlock, locked-URL redirect (58 tests in total). E2E (desktop + Pixel 7): open 12 cards → Padankan → 3★ → Uji unlocked → **progress survives reload** |

Paths above are relative to `apps/web/`. `src/main.tsx` wires `IdbProgressStore` + `ProgressProvider`.

## Verified locally
lint, format, typecheck, 58 unit tests, validate-content, build, e2e (4/4), plus phone-size screenshots of home, chapter, Kenali, word detail and Padankan.

## Decisions worth challenging
1. **Kenali completion = all cards opened + Padankan finished.** Padankan stars become the Kenali stars. Opening cards is saved immediately, so leaving mid-way keeps progress.
2. **Padankan uses 6 random words of 12**, not all 12 (screen size and session length).
3. **Bundle grew to 132 KB gzip** (from 87). Framer Motion via `LazyMotion` + `domAnimation`, idb-keyval and three chapters of JSON are now in the main chunk. Is anything worth splitting?
4. **Source PNGs (≈1–2 MB each) are emitted into `dist/`** via the `.png` fallback until task 9 converts them to WebP. They aren't precached (workbox `globPatterns` excludes png).
5. **Word detail shows the BM definition under the EN/中文 meaning**, and example BM first, then translation.
6. **`ProgressProvider.save` is fire-and-forget** (`void store.saveChapter`). Errors are swallowed inside `IdbProgressStore` (memory fallback + one console warning).
7. **Stage names are hard-coded BM** (`Kenali`, `Uji`, …) in `ChapterScreen.tsx`, not i18n, because they're the product's BM names. Subtitles are translated.

## What I'd like from the review
Bugs (state, effects, timers, routing, storage), accessibility on touch devices (focus, labels, 44 px targets), anything confusing or discouraging for a 9-year-old, i18n gaps (hard-coded strings), and P2-readiness of the storage design. Rank by severity, cite `file:line`, give a failure scenario, and keep it concise.

## Review outcome (Codex review: `task-04-kenali.review.md`)
All 4 findings were valid and are fixed. Regression tests are in `src/task04-regressions.test.tsx`.

| # | Finding | Fix |
|---|---|---|
| 1 | Medium: missing images made Padankan picture cards identical | The picture face falls back to the word's meaning in EN/中文 (`data-testid="pad-meaning"`) |
| 2 | Medium: a stale tab could overwrite progress | New pure `mergeProgress` (union of cards, best stars, earliest completion). `IdbProgressStore.saveChapter` merges inside one idb `update` transaction. `saveChapter` now **returns** the merged progress, and the provider adopts it. Ready for P2 sync |
| 3 | Medium: dialog focus could escape and wasn't restored | Native `<dialog>` + `showModal()` (inert background), `cancel` → onClose, backdrop click closes, focus returns to the opener. jsdom fallback sets `open` |
| 4 | Low: `#/c/%` threw `URIError` | `parseRoute` catches decode errors and goes home |

API change: `ProgressStore.saveChapter(p): Promise<ChapterProgress>` (was `Promise<void>`).

Also changed after the handoff was written: home cards now show a compact "★ n / 12" instead of 12 star glyphs.

All checks re-run green: lint, format, typecheck, 64 unit tests, validate-content, build, and e2e 4/4 on desktop + Pixel 7.
