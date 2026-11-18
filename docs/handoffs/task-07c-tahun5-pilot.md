# Handoff: Task 7c, Tahun 5 pilot track (Tema 1, Units 1–3)

*17 Nov 2026 · Claude Code → reviewer (Codex)*

## Context
- Yang supplied the DBP **Tahun 5 SJK** textbook (`BAHASA MELAYU T5 SJK.pdf`, repo root; 169 PDF pages, printed pages 1–162, all 24 units present, checked page by page) and asked for a **Tahun 5 pilot**, next to the Tahun 3 one.
- The loader, schema, router and progress already support several tracks, so this is mostly **content** plus two small UI fixes. Tahun 3 is untouched.
- The textbook is Ministry/DBP copyright and is a **reference only**: the words come from its Tema 1 pages (2–20, contents page: Unit 1 pp. 2–6, Unit 2 pp. 7–11, Unit 3 pp. 12–20). Every example sentence, blank, jumbled sentence, meaning, image and voice is **original**. Not a git repo, so the files are listed below.

## What changed
1. **`content/tahun-5/`** (new): `track.json` (Tema 1 *Keluarga Tercinta*, 3 units), `unit-01..03/chapter.json` (12 words each = 36), all **`reviewed:false`** (drafts for Yang; never shown in production).
   - Unit 1 *Riangnya Keluargaku*: idaman, mencadangkan, keistimewaan, teruja, membayangkan, berbincang, bersungguh-sungguh, mencabar, bersorak, berpuas hati, menjamu selera, hidangan.
   - Unit 2 *Keluarga Bestari*: johan, mengumumkan, menggalakkan, bermutu, tugasan, merujuk, cemerlang, tekun, bertanggungjawab, kerjaya, berbakat, anugerah.
   - Unit 3 *Hadapi Bersama-sama*: mengeratkan, bersyukur, sepakat, berkorban, berbakti, berganding bahu, membanting tulang, rintangan, dusun, mempertahankan, menikmati, berswafoto.
   - No word id is shared with Tahun 3 (progress is per word). Idioms use class `lain-lain`, as in Tahun 3.
   - Each word has a trilingual meaning and example, one fill-the-blank sentence, a jumbled sentence (3–8 tiles), 3 distractors (same class where I could), and a synonym/antonym where one is clear.
2. **Media:** `image-prompts.json` + `postcard-prompts.json` (style copied from Tahun 3; about a third of families named Chinese or Indian Malaysian, one family = one ethnicity); **36 word pictures + 3 postcards** generated with Codex (viewed on contact sheets: no text in any image); **72 Azure clips** (`npm run gen-audio`: word + example for each word).
3. **`apps/web/src/screens/Koleksi.tsx`:** the collection page is now grouped **by year** (two "Unit 1" cards would otherwise be ambiguous). Test ids unchanged.
4. **`apps/web/src/games/AudioReview.tsx`:** unit headings show `(Tahun N)`.
5. **`scripts/validate-content.ts`:** `REQUIRED_TRACKS` now includes `tahun-5`.
6. **Tests:** new `apps/web/src/content/tahun5.test.ts` (6 tests: second track and counts; zero content-rule issues including warnings; drafts; every picture, word clip, example clip and postcard exists; audio plan; no word id shared with Tahun 3). New e2e: Home lists both years, a Tahun 5 unit opens, its 12 cards show, the picture really loads.
7. **Docs:** `CLAUDE.md` §4 and §10, `HANDOFF-next-agent.md`.

## Verified
- prettier, eslint, typecheck; **176 web + 37 Worker unit tests** (180 after the review fixes); validate-content (0 errors; the warnings are the not-yet-converted `.webp` files, same as Tahun 3); build; **e2e 18/18** (desktop + Pixel 7).
- Not verified: the BM is **my draft**; I am not a native reviewer. How the voices sound; Yang or a teacher must listen (`#/lab/audio`, now also lists Tahun 5). Uji, Bina and Cabaran on Tahun 5 are covered only by the shared engine tests and the Kenali e2e, not a full Tahun 5 run.

## Decisions worth challenging
1. **Tahun 5 sits beside Tahun 3** (two sections on Home), not instead of it. A year picker may be wanted once there are more years.
2. **12 words per unit**, same as Tahun 3, chosen from the textbook's reading passages, dialogues and dictionary activity. The textbook has no word list.
3. **Words with several meanings** (e.g. *mencabar*, *tekun*) have a single, child-level meaning.
4. **Tahun 5 is harder:** abstract words (*cemerlang*, *tekun*, *bersyukur*, *rintangan*) are pictured with a scene, not a literal icon.
5. **No Misi quest** for Tahun 5 yet (optional per unit).
6. **Precache grows** to about 4 MB because the PNGs ship until task 9 converts them to WebP.

## What I'd like from the review
- **Content correctness (most important):** wrong class or meaning, a blank sentence where **two options fit**, an example that is unnatural BM, a jumbled sentence with a different valid order, a distractor that is also a correct answer, zh translations that are wrong.
- **Originality:** any sentence too close to the textbook text in `BAHASA MELAYU T5 SJK.pdf` (pp. 2–20).
- **Bugs:** Koleksi grouping (a track with no items, key and test-id collisions, the "N of M" count), the audio-review heading, the validator change.
- **Tests:** weak spots in `tahun5.test.ts` and the new e2e.

Rank by severity, cite `file:line`, give a failure scenario, and keep it concise.

## Review outcome (Codex review: `task-07c-tahun5-pilot.review.md`)
All 6 findings were valid and are fixed. Codex also read the textbook PDF and found **no sentence copying** (originality OK). Regression tests are in `content/tahun5.test.ts` ("review #1…#5") and the e2e.

| # | Finding | Fix |
|---|---|---|
| 1 | Medium: some blanks accepted two answers (*tekun / cemerlang / berbakat* for *bertanggungjawab*, *cemerlang* for *berbakat*, *senyap-senyap* for *bersungguh-sungguh*) | Replaced those distractors. I then re-read **every blank** and found 8 more of the same kind (*menjamu selera* for *berbincang*, *berbincang* for *berganding bahu*, *menikmati* for *berswafoto*, *tugasan* for *hidangan* and *anugerah*, *beramai-ramai*, *mempertahankan* for *mengeratkan*, *berbincang* for *mencadangkan*, *mengumumkan* for *menggalakkan*) and fixed them too. Test: the removed distractors are gone |
| 2 | Medium: Susun ayat accepts one order only, but several sentences also had another valid order (a phrase can move to the front: "Di dewan guru mengumumkan…") | Rewrote the jumbled sentences so no tile is a preposition or conjunction (*di, pada, dengan, untuk, kerana, apabila, sebelum, kepada, atas, dalam, sebagai, dan…*). Test: **no jumbled sentence contains one**. This caught 2 more that I had missed |
| 3 | Medium: *Keistimewaan rumah itu ialah halamannya luas* needs a missing *yang* | The sentence now includes the tile *yang*. Test |
| 4 | Medium: "selama lama" | Sentence changed (no duration phrase). Test |
| 5 | Medium: *idaman* is a noun (DBP), not an adjective | Class is now `kata nama`, with the meaning and distractors updated. Test. The *mencabar* distractor that used it was replaced (the validator's class warning caught that) |
| 6 | Low: the picture check could race on a slow load | The e2e now polls until `complete && naturalWidth > 0` |

Re-run: prettier, eslint, typecheck, validate-content (0 errors), **180 web + 37 Worker unit tests**, build, **e2e 18/18**.
**Still open:** the BM is a draft and needs Yang's (or a teacher's) review before `reviewed: true`.
