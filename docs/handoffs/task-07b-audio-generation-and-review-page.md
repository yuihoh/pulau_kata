# Handoff: Task 7b, Azure voices generated + voice review page

*17 Nov 2026 · Claude Code → reviewer (Codex)*

## Context
- Follows task 7 (`task-07-cabaran-collectibles-sound.md`), which built `gen-audio` and the read-aloud plumbing.
- Yang then set up Azure (free account, Speech resource `jelajah-kata-speech`, Free F0, Southeast Asia, a US$5/month budget alert) and saved the key in `.env.local` (git-ignored; never shared in chat).
- **What happened:**
  - `npm run gen-audio` generated all **88 MP3s**: 72 word and example files in `content/tahun-3/unit-0X/audio/`, 16 Misi lines in `unit-02/quest/audio/`, 2.1 MB in total.
  - Yang asked for a way to review them, so this task adds a **voice review page**.
- Not a git repo, so the files are listed below.

## What changed
1. **Generated audio** (no code change): 88 MP3s from `content/audioPlan.ts` (female `ms-MY-YasminNeural` for words and examples; per-character voices for Misi lines). The 🔊 buttons on word cards, example sentences and Misi lines now appear, and Uji's "listen and choose" and the boat game's listen prompts switch on automatically (`availableTypes` / `promptKinds` require every word to have audio).
2. **`games/AudioReview.tsx`** (new, lazy chunk 2.3 KB gzip), at `#/lab/audio[/<chapterId>]`, linked from Home in lab mode:
   - lists every clip per unit (words + examples, Misi lines) with the BM text, the meaning or speaker, and a ▶;
   - **Play all** per section: plays in order with a 0.5 s gap, and has a Stop button;
   - **Needs fixing** tick per clip, remembered in `localStorage` (`jk.audioReview`; corrupt data is ignored). A list of flagged clips (`unit · path · voice · "text"`) with a **Copy** button, so Yang can paste it back for re-recording;
   - a clip with no MP3 shows "Audio file missing" with ▶ disabled;
   - uses `playSpeech`, as the real app does, so music ducks; the page itself has no background music (`musicFor`: lab audio → none).
3. **Router, Home, App, i18n:** `LAB_GAMES` gains `audio`; Home link; `App.tsx` route; `audioReview.*` strings in EN and 中文.
4. **Test updated:** `Uji.test.tsx` said "never offers listen questions while there is no audio". Now it asserts the rule: offered only when every word has audio (real unit: yes; a unit pointing at a folder with no audio: no).
5. **Docs:** `HANDOFF-next-agent.md` and `CLAUDE.md` now say the voices are generated and waiting for Yang's listen-through.

## Bug found by testing in a real browser
Rows were **630 px wide on a 412 px phone**: the unwrappable meaning text (`truncate`) stretched the implicit grid column, pushing the checkbox off-screen so it couldn't be tapped. Fixed with `grid-cols-1` (`minmax(0,1fr)`). Unit tests can't see layout, so a Playwright test now checks that rows fit the viewport.

## Verified
- lint, format, typecheck; **165 web + 37 Worker unit tests**; validate-content (0 errors); build (AudioReview chunk 2.3 KB gzip; offline precache now 100 entries, about 2.5 MB because the MP3s are included); **e2e 16/16** (desktop + Pixel 7).
- Phone screenshot of the review page; the real-browser check that an MP3 streams (206) and plays.
- **Not verified:** how the voices *sound*. That needs a human listener (Yang), which is what this page is for.

## Decisions worth challenging
1. **Flags are stored on one device** (localStorage). The copied text is the only way to get them back to the developer.
2. **Play all stops at the end of a section**, not the whole page; one list per unit per section.
3. **A clip that never reports its end** is capped at 20 s so "Play all" can't freeze.
4. **Notes are truncated** with an ellipsis to keep rows compact; the full text is in the clip's BM line.
5. **The page is lab-only** (`#/lab/audio`), reachable by URL in production but not linked (same as the other lab pages).
6. **Offline precache** now includes about 2 MB of voice files on first install.

## What I'd like from the review
- **Bugs:** the Play all token logic (stop, restart, unmount, `pause` firing when a new clip starts, the timeout guard), flag persistence, StrictMode, double taps.
- **Accessibility:** labels on ▶ and the checkbox, focus, the live region for the flagged list.
- **Phone layout** at 360 px and wide screens.
- **Privacy:** nothing leaves the device.
- **Tests:** weak spots, and whether the audio-availability change affects anything else (Uji listen questions, boat-game prompts, Bina).

Rank by severity, cite `file:line`, give a failure scenario, and keep it concise.

## Review outcome (Codex review: `task-07b-audio-generation-and-review-page.review.md`)
All 4 findings were valid and are fixed. Regression tests are in `games/AudioReview.test.tsx` (describe "task-07b review regressions"). Browser layout verification was blocked for Codex by its read-only sandbox, but I had already run it in a real browser (the 630 px bug above, plus the 16/16 e2e).

| # | Finding | Fix |
|---|---|---|
| 1 | Medium: "Play all" creates a new `Audio` per clip, so on Safari every clip after the first starts outside the tap and can be refused; a refusal also gave no event, so it waited 20 s | One `Audio` element is created at the first tap and **reused** for every clip. A refused `play()` ends that clip at once (the next clip follows after the usual 0.5 s gap). Tests: exactly one element is created across a whole list; a refused clip doesn't stall the list |
| 2 | Medium: a timed-out clip left its element running and the Stop button gone | On the 20 s timeout the element is paused, the timer and listeners are cleared. Test: a stalled clip is paused once at 20 s and the Stop button disappears after the gap |
| 3 | Medium: switching between review URLs reused the component, so the old playlist kept playing | `App.tsx` keys `AudioReview` by `chapterId`, so switching unit unmounts it and cancels playback; `cancel()` also runs when a new list starts, so two lists can never overlap |
| 4 | Low: the flagged-list textarea had no accessible name | `aria-labelledby` points at its heading. Test: `getByRole('textbox', { name: 'Needs fixing (1)' })` |

**Also fixed while doing this:** my first rewrite of the player let an old clip's 20 s timer pause a *newer* clip when a new list started mid-clip. Cancelling is now explicit (`cancel()` resolves the waiting loop and clears its timer instead of relying on a `pause` event, which would also have fired for the next clip). Test: a second list starting during a stalled clip is not paused 20 s later; unmounting pauses the element.

**Test-harness note:** the leftover unmount from the previous test pushed into the shared `paused` list, because Vitest runs `afterEach` hooks in reverse order. The arrays are now also reset in `beforeEach`.

Re-run: lint, format, typecheck, **170 web + 37 Worker unit tests**, build (AudioReview chunk 2.4 KB gzip), **e2e 16/16**.
