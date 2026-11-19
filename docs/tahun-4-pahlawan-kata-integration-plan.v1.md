# Plan: bringing Pahlawan Kata into Jelajah Kata for Tahun 4

*19 Nov 2026 · Claude Code → Yang · Draft for Codex review, then Yang's review*

**Sources studied**
- Everything in `pahlawan-kata/`:
  - `CLAUDE.md`, `README.md`
  - `docs/design-v0.3.md`, `docs/art-assets-and-prompts.md`
  - `data/textbook_map.json`, `data/schema/unit.schema.json`, `data/sample/t2_u4.json`, the 24 `data/vocab_candidates/unit_XX.csv`
  - `tools/extract_vocab.py`
  - the 21 prototype screens in `prototype/`
- The Tahun 4 SJK textbook (`Bahasa Melayu_Tahun_4_SJK.pdf.pdf`, 168 pages, with a text layer).
- This repo's current code and plans: `CLAUDE.md`, `docs/jelajah-kata-technical-plan.md`, `docs/delivery-and-pricing-plan.md`, `docs/graphics-and-games-proposal.md`, `apps/web/src/`.

**Naming used below**
- **JK** means Jelajah Kata, the app in this repo.
- **PK** means Pahlawan Kata (词语勇士), the design in `pahlawan-kata/`.

---

## 0. Summary

**Recommendation: keep one app, and make Tahun 4 the first track that uses the best of PK.** Do not build PK as a second app.

1. **PK's textbook analysis is the most valuable part, and it is correct.** I checked it against the PDF:
   - all 24 unit titles and pages match;
   - all 24 grammar points match;
   - 189 of 189 sample words appear in their unit.

   That makes Tahun 4 the best-prepared track we have.
2. **Add now, built once for every Tahun.**
   - A **Tatabahasa (grammar) stage** in each unit: one grammar point per unit, games reused from Uji.
   - An optional **Seni Bahasa** stage: peribahasa, simpulan bahasa and Jawi.
   - A **Tema finale** after the 3 units: Ulang Kaji practice plus a friendly **Tema Boss**.
   - **Per-word mastery that is actually saved.**
3. **Keep JK's rules where PK conflicts with them.**
   - **Words per unit:** 12 per unit (PK's pack A).
   - **Tone:** gentle "Cuba lagi!" with no lives lost and no game over.
   - **Art and guide:** the hornbill guide and today's art style.
   - **Login and EN default:** no login in P1, English as the default language.
4. **Decide after the pilot, using what children do.** These are PK's RPG layer:
   - XP and levels;
   - bronze, silver and gold ranks;
   - packs B and C (24 or 36 words);
   - the placement test;
   - an avatar with a wardrobe.

   They are attractive, but they triple content and art work, and they are not yet shown to bring children back better than stars, postcards and mini-games.
5. **Do not adopt.**
   - Lives (HP) that end a game.
   - Gear that changes timers or hints.
   - A full paper-doll art programme (about 300 files) before the pilot.
6. **First step that is useful straight away.** Turn Tema 1 of Tahun 4 into JK content (Units 1–3, 12 words each). It plays in today's stages with **no engine change** (only two optional track fields in the schema), so Tahun 4 can be tested while the grammar stage is built. It needs the `draft-chapter` tool first, or hand drafting (§11, T4-1a).

**Decisions needed from Yang:** see §13. The most important:
- one app (recommended) or a separate PK app;
- whether Tahun 4 joins the free pilot;
- whether the RPG layer is in or out for P2.

---

## 1. What PK is, in brief

PK is a mobile RPG for Tahun 4 SJK. Its design (v0.3):

- **World:**
  - 8 Tema become 8 "kingdoms";
  - each unit is a "region" with four steps: Kenal Kata → Kuiz → Tatabahasa → Bina Ayat;
  - each unit also has an optional Seni Bahasa "secret realm";
  - each Tema ends with the textbook's **4P**:
    - Pemulihan (remedial, when 5 or more words are weak);
    - Pengukuhan (practice ground);
    - Penilaian (Tema Boss, 3 phases);
    - Pengayaan (challenge).
- **Three difficulty levels:**

  | Level | Words per unit | Time per question |
  |---|---|---|
  | Initiate | 12 (pack A) | 20 s |
  | Knight | 24 (packs A + B) | 15 s |
  | Legend | 36 (packs A + B + C) | 12 s |

  Pack C is not new nouns. It holds word families (imbuhan), peribahasa and synonyms or antonyms of pack A words.
- **RPG layer:**
  - XP and levels 1–30 with stat points;
  - four weapons (sword and staff at the start, bow at level 5, hammer at level 10);
  - six gear slots × four rarities;
  - chests, a shop (no real money), a wardrobe with a "looks only" switch;
  - ranks (bronze, silver, gold) earned by finishing a Tema at a level;
  - Leitner review.
- **Learning-first rules:**
  - gear never reduces the number of questions;
  - an answer that needed a hint is marked "review" and doesn't count as mastered.
- **Other features:**
  - parent accounts and a parent panel;
  - a "school is teaching Tema N" setting that doubles XP for that Tema.
- **Content analysis:**
  - the textbook has **no word list**;
  - each unit has 16–48 core words (median 31);
  - the 24 grammar points run from word classes → word formation → sentence types;
  - Seni Bahasa appears in 22 of 24 units (none in Units 7 and 15).
- **Art plan:** about 212 images (about 300 files with icons and layers) in a chibi style with navy outlines and its own palette.

## 2. What I checked against the textbook

| Claim in PK | Result |
|---|---|
| 8 Tema × 3 units, page ranges | Matches the contents page (PDF page 3) |
| One grammar point per unit (24) | All 24 found on the unit pages, including Unit 7 *kata adjektif cara* and *jarak*, and Unit 15 *awalan* and *akhiran* |
| 189 sample words appear in their unit | 189 of 189 (two are split across lines or written separately: *tadahan air hujan*, *MyKid* / *MyKad*) |
| 4P at the end of each Tema | *Pemulihan*, *Pengukuhan*, *Pengayaan*: 10 mentions each in the text, so present for every Tema |
| *Bacaan Luas* page in Tema 4–8 | 5 mentions, consistent with the claim |
| *Celik Bahasa* grammar boxes | 21 mentions |

The vocabulary candidates (`vocab_candidates/*.csv`) come from a rough stemmer (the tool says so). Treat them as a shortlist for a human to choose from, not as a word list.

## 3. Side-by-side: where the two designs agree and conflict

| Area | JK today | PK | Fit | Proposal |
|---|---|---|---|---|
| Unit of content | 1 textbook unit = 1 game, 8–12 words | 1 unit = 1 region, 12/24/36 words | Agrees at 12 | 12 words (pack A) for Tahun 4. Packs B and C later (§12) |
| Stages | Kenali → Uji → Bina → ★ Cabaran (+ optional Misi) | Kenal → Kuiz → **Tatabahasa** → Bina (+ Seni Bahasa) | PK adds grammar | **Add a Tatabahasa stage** between Uji and Bina, for every track that has grammar content |
| Grammar | None | One grammar point per unit, 4 game types | Gap in JK | Biggest single improvement (§6) |
| End of Tema | Nothing (Home groups units by Tema) | 4P: remedial, practice, Boss, challenge | Gap in JK | Add a **Tema finale**: Ulang Kaji + Tema Boss (§8) |
| Failure | "Cuba lagi!", no fail screen; Sampan has no dying | Lives (HP) 3, monster "counter-attacks" | **Conflict** | Keep JK. The monster can lose HP when the child is right; the child never loses lives |
| Timer | Only in Cabaran Akhir (90 s round, speed adapts, relaxed mode) | Every question 20/15/12 s | **Conflict** | No per-question timer in learning stages. Timers only in Cabaran and the Tema Boss, with relaxed mode |
| Unit order | Not locked; the path suggests an order | Tema all open; the 4 steps inside a unit in order | Agrees | Keep. Tema Boss opens after its 3 units |
| Rewards | Stars, postcard per unit, Koleksi, Misi reward | XP, levels, chests, gear, coins, shop, wardrobe, ranks | Very different size | P1: stars, postcards, **Tema badge**. RPG layer is a P2 decision (§12) |
| Mastery | Leitner code exists (`engine/mastery.ts`) but **nothing saves or uses it** | Leitner 5 boxes; a hinted answer doesn't count | PK's rule is better | Save per-word mastery (§7.3) with PK's hint rule. Needed by Pemulihan, the parent view and Ulang Kaji |
| Languages | EN default, 中文, remembered | 中文 or EN per child; meanings can show both | Mostly agrees | Keep EN default. Add PK's "show both" meaning option (small) |
| Accounts | None in P1; parents in P2 | Parent login + child profiles from MVP | PK earlier | Keep P1 without login. Child profiles (siblings) join P2 |
| Art | Flat cartoon word pictures, hornbill guide, Fredoka | Chibi, navy outlines, Baloo 2 / ZCOOL, paper-doll avatar | Conflict | One art style: JK's. Reuse PK's ideas (kingdoms, Bosses) drawn in JK style |
| Content format | `chapter.json` (Zod), `bm`/`en`/`zh` | `t{N}_u{N}.json`, `ms`/`zh`/`en`, packs | Similar | Extend JK's schema; convert PK data with a script (§5) |
| Tech | React + TS + Vite PWA, Tailwind, IndexedDB; Supabase in P2 | React + TS + Vite PWA, Zustand, Supabase from MVP | Agrees | JK's stack; no Zustand needed |
| AI sentence check | Built (mock + Claude Haiku Worker) | "v2" | JK ahead | Use it in Tahun 4 Bina from day one |

## 4. Tahun 4 inside JK: the structure

```
Tahun 4 (track)                              content/tahun-4/
└── Tema 1–8 (all open)                      track.json (+ kingdom name, Boss, colour)
    ├── Unit (×3)                            unit-NN/chapter.json
    │   ├── 1 Kenali      word cards + Padankan                      (exists)
    │   ├── 2 Uji         quiz / mini-game rounds                    (exists; G-4 rounds)
    │   ├── 3 Tatabahasa  the unit's grammar point, 10 questions     NEW (§6)
    │   ├── 4 Bina        Susun ayat, Pilih perkataan, Tulis sendiri (exists)
    │   ├── ★ Cabaran     Sampan Kata on the unit's words            (exists)
    │   └── ✦ Seni Bahasa optional, opens after Tatabahasa           NEW (§7)
    └── Tema finale (opens when all 3 units' stages are done)        NEW (§8)
        ├── Ulang Kaji   mixed practice of the 3 units, replay freely
        │                (starts with weak words when there are any)
        └── Tema Boss    3 phases: words → grammar → sentences, Boss art per Tema
```

**Notes on the structure**
- **Misi** (story adventure) stays an optional extra. It is a heavy per-unit production (scenes, props, voice), so it is not planned for every Tahun 4 unit.
- **PK's 4P mapping:**
  - Pengukuhan becomes Ulang Kaji;
  - Penilaian becomes the Tema Boss;
  - Pemulihan is folded into Ulang Kaji (it starts with weak words);
  - Pengayaan (spot-the-difference and similar) is left out: it needs new art per Tema.
- **The kingdoms:** PK's names become the Tema landscapes and Boss on the Home map (Kampung Harmoni, Bandar Bersih, Kubu Selamat, …). They are drawn in JK style with the existing `tema-NN.webp` pipeline. The hornbill stays the guide.
- **PK's NPCs:** the eight friends (Chun Han, Aidil, …) can appear in Misi stories or Boss dialogue later. Only the names come from the textbook; the designs are ours.

## 5. Content model

### 5.1 Changes to the JK schema (`apps/web/src/content/schema.ts`)

Everything is optional, so Tahun 3 and 5 stay valid without edits.

```ts
// Word: two optional fields
pack?: 'A' | 'B' | 'C'            // default 'A'. Only A ships until §12 is decided
root?: string                     // e.g. 'sihat' for 'kesihatan': word families, Uji hints

// Chapter: two optional blocks
grammar?: {
  topic: TriLingual               // e.g. { bm: 'Penjodoh bilangan', en: 'Classifiers', zh: '量词' }
  rule: TriLingual                // the short "Celik Bahasa"-style explanation, our own words
  questions: GrammarQuestion[]    // 10–15
}
seni?: {
  kind: 'peribahasa' | 'simpulan_bahasa' | 'jawi' | 'pantun'
  items: SeniItem[]               // 4–8
}

// Track tema: optional theme data for the map and the finale
kingdom?: TriLingual              // 'Kampung Harmoni' / 'Harmony Village' / '和谐村'
boss?: { name: TriLingual; image: string; defeatedImage: string }
```

**GrammarQuestion** is a discriminated union, one case per game type in §6:

| Case | Fields |
|---|---|
| `choose` | `sentence` with one `___`, `options` (3–4), `answer`, `explain: {en, zh}` |
| `classify` | `item` (word or sentence), `bins` (2), `answer`, `explain` |
| `forge` | `sentence` with one `___` (the context), `root` (e.g. `sihat`), `options`: 3–4 **complete words** from the same root (e.g. `menyihatkan`, `kesihatan`, `penyihat`), `answer` (one of the options), `affix` (e.g. `meN-...-kan`, shown in the explanation), `explain`. Validation: options unique, answer in options, every option contains the root |
| `transform` | `from` (sentence), `target` (e.g. "ayat pasif"), `tiles`, `answer`, `explain` |

**SeniItem** covers three cases:
- an expression (`text`, `meaning: TriLingual`, `example`);
- a situation question (`situation: TriLingual`, `options`: 3–4 expressions, `answer`), the "which expression fits?" question in §7.1;
- Jawi (`rumi`, `jawi`, `image?`).

**Counts depend on the kind:**
- peribahasa and simpulan bahasa: 2–8 items;
- Jawi: 1–4 items.

The textbook gives Unit 8 and Unit 16 one Jawi phrase each, and Unit 24 two. PK's map has the Rumi targets but **no Jawi spellings**, so Jawi text must be written and reviewed (by someone who reads Jawi).

**Ids:**
- chapter ids follow today's pattern `t4-u01` … `t4-u24`;
- folders are `unit-01` … `unit-24` (textbook numbering, as PK uses);
- word ids are unique within the track (existing rule).

### 5.2 New validation rules (added to `scripts/validate-content.ts`, run in CI)

- **`choose`:**
  - exactly one `___`;
  - the answer is one of the options;
  - options have no duplicates.
- **`classify`:** the answer is one of the 2 bins.
- **`transform`:** the tiles joined with spaces equal the answer.
- **Explanations:** every question has `explain.en` and `explain.zh`.
- **Grammar size:** a chapter with a grammar block has 10–15 questions.
- **Jawi:** a Jawi item has both Rumi and Jawi text, and the Jawi text uses only Arabic-script characters **and spaces** (phrases have several words).
- **Seni Bahasa counts:** per kind, as listed above.
- **Unchanged rules still apply:**
  - all three languages present;
  - media files exist;
  - `reviewed: false` never reaches production.

### 5.3 From PK data to JK content (a converter script)

`scripts/import-pk-tahun4.ts`, run once per Tema, writes **drafts** (`reviewed: false`):

| PK source | JK target | Notes |
|---|---|---|
| `textbook_map.json` → tema titles, kingdom, Boss | `content/tahun-4/track.json` | Unit titles are BM only in PK. Add `en`/`zh` (drafted, then reviewed) |
| `textbook_map.json` → `sample_words` (with `zh`/`en`) | Seed of pack A per unit | 7–10 words per unit, already checked; top up to 12 from the CSV |
| `vocab_candidates/unit_XX.csv` (`A-candidate`) | Shortlist for the remaining pack A words | A human picks |
| PK word `ms` / `zh` / `en` | JK `bm` / `zh` / `en` | Rename keys |
| PK `example.ms` | JK `example.bm` | Must stay our own sentence |
| PK `root`, `family`, `pack` | JK `root`, `pack` | `family` becomes C-pack data later |
| PK `imagePrompt` | `content/tahun-4/image-prompts.json` | Same file format as Tahun 3/5 |
| PK `grammarQuestions` (`choose` and others) | JK `grammar.questions` | Rename fields; `rule` → `explain` |
| PK `sentences[].tiles` | JK word `jumbled_sentence` | Per word in JK |
| `textbook_map.json` → `seni.items` (peribahasa, simpulan bahasa with `zh`/`en`) | JK `seni.items` | Traditional expressions, not textbook text |

**Fields JK needs that PK does not have:**
- `class` (word class);
- `meaning.bm` (a short BM explanation);
- `blank_sentences`, `distractors`, `synonym`, `antonym`.

These come from the **`draft-chapter`** script: the AI drafting tool from P1 task 9, not built yet. Tahun 4 is a good first user: the script takes a unit's chosen words plus `textbook_map.json` context and drafts the rest. Yang (ideally with a BM teacher) reviews every chapter before `reviewed: true`.

## 6. The Tatabahasa stage (new; built for all Tahun)

### 6.1 Flow
1. **Rule card.** One short rule in EN or 中文 (Celik Bahasa style, our own words), with 2 BM examples, and a "Faham!" button.
2. **10 questions** using the game types below. Wrong answers come back later (the existing retry queue), with one hint per question.
3. **After every answer,** a one-line explanation shows. On a wrong answer it says why ("*batang* is for long, thin things").
4. **Stars** use the same thresholds as Uji (`quizStars`). Completing the stage unlocks Bina and Seni Bahasa.

### 6.2 Game types, reusing what exists

| PK type | How it plays in JK | Reuses | Grammar points (Tahun 4 unit) |
|---|---|---|---|
| `choose` (pick the word for the blank) | Quiz card, or **Tangkap Buah** (catch the right word) | `questions.ts` blank flow, `engine/tangkap.ts` | Kata ganti nama (3), penjodoh bilangan (4), kata adjektif ×5 (7–10), kata hubung (11), kata sendi nama (12), kata nafi (13), kata bilangan (14) |
| `classify` (two doors) | **Pecah Belon** with 2 categories ("pop every *kata nama khas*") for short words; a new 2-bin sort for sentences (too long for a balloon) | `engine/belon.ts`, **generalised**: today it takes the category from `word.class` of the chapter's words and allows only 4 classes; grammar items carry their own category (`am`/`khas`, `penuh`/`separa`, …) | Am/khas (1, 2), transitif/tak transitif (5), majmuk bebas/mantap (17, 18), ganda penuh/separa (19), tunggal/majmuk (20), biasa/songsang (24) |
| `forge` (root + affix) | New small game **Bengkel Imbuhan**: pick the affix that makes the word in the sentence | New engine + screen (~1 task) | Awalan/akhiran (15), apitan (16) |
| `transform` (rewrite a sentence) | Tile rebuild (Susun ayat) of the target form | Bina tile engine (`engine/bina.ts`) | Kata kerja pasif (6), ayat penyata (21), ayat tanya (22), ayat aktif (23), ayat susunan songsang (24) |

**Reuse is partial, not free** (corrected after the Codex review):
- **Tangkap Buah** builds its own vocabulary questions inside the engine and ends a game after 90 s (150 s relaxed). For grammar it needs a **question-count mode** (10 questions, no cut-off) and to accept questions from outside.
- **Pecah Belon** has no retry queue or hint tracking and scores in its own way.
- **Bina's tile engine** builds tiles from the chapter's words, not from a given sentence.

So every game gets a **question adapter**: `GrammarQuestion` → the game's input. It also gets a **per-answer hook** that reports `{questionId, correct, hintUsed}` to the shared retry queue, so stars come from `quizStars` in every game.

**What this costs:**
- **Reuse:** three of the four types reuse existing engines (with the adapters above), and all four share the retry, hint and star code through the hook.
- **New work:**
  - Bengkel Imbuhan;
  - generalising Pecah Belon to grammar items, plus a "two bins" sort for sentences;
  - the stage screen;
  - the rule card.
- **Other Tahun:** Tahun 3 and 5 grammar can be added later as content only (their textbooks also have a grammar point per unit).

## 7. Seni Bahasa, word mastery, and smaller adoptions

### 7.1 Seni Bahasa (optional stage)
- **Peribahasa and simpulan bahasa** (Units 1, 2, 9, 17, 23 and others): matching pairs (expression ↔ meaning) and one "which expression fits this situation" question. PK's `SeniBahasa` prototype shows this. It reuses the Padankan engine.
- **Jawi** (Units 8, 16, 24: "Malaysia", "Bersekutu Bertambah Mutu", "Bank Negara Malaysia", "Ringgit Malaysia"):
  - match Rumi ↔ Jawi, and build a word from Jawi letter tiles;
  - needs an **Arabic-script font that ships with the app** (e.g. Noto Naskh Arabic, SIL OFL) and right-to-left layout for those tiles;
  - test on Android and iPhone.
- **Sajak, lagu and ubah suai** (poem, song, adapt-a-text): the textbook texts are **copyrighted and must not be used**. Either:
  - write our own short pantun/sajak and use fill-the-blank on it, or
  - skip Seni Bahasa for those units. Recommended for the first release: Seni Bahasa only where it is peribahasa, simpulan bahasa or Jawi (about 10 of 24 units).
- **Rewards:** finishing Seni Bahasa adds a stamp to the unit's postcard in Koleksi (no new art needed).

### 7.2 Units with no Seni Bahasa
Units 7 and 15 have none in the textbook, so the stage is hidden there.

### 7.3 Save per-word mastery (prerequisite for the finale)
- **Today:** `engine/mastery.ts` has `recordAnswer`, `isDue` and `byWeakness`, but no screen calls them and `ProgressStore` has no place to save them.
- **Mastery can't be merged like stars** (corrected after the Codex review). Stars only go up, so "keep the maximum" is safe. Mastery must **go down** after a wrong answer: keeping the highest box would undo that drop, and saving a whole snapshot could lose answers given in another tab (or, in P2, on another device).
- **Design: an answer log, not a snapshot.**
  - Each answer is one event: `{id, trackId, wordId, at, correct, hintUsed}`.
  - Events are appended in one IndexedDB transaction per answer.
  - A word's `WordStat` is computed by replaying its events in time order.
  - P2 sync merges logs by event id (union, no duplicates), then replays, so no answer is lost and a wrong answer always counts.
  - Old events can be compacted into a checkpoint later.
- **Key = track + word id** (`t4:sihat`). Word ids are unique only within a track, so a plain word id would mix Tahun 3 and Tahun 5 progress. Mixed sessions (Ulang Kaji, Tema Boss) carry the track id with each word.
- **Tests:**
  - a wrong answer after a correct one ends in box 0;
  - two tabs answering at once lose nothing;
  - the same word id in two tracks stays separate.
- **PK's rule:**
  - a correct answer **without** a hint moves the word up a box;
  - a correct answer **with** a hint keeps the box;
  - a wrong answer drops it to box 0.

  This needs a one-line change to `recordAnswer`'s signature.
- **Feeds:**
  - Ulang Kaji ("weak words first");
  - the P2 parent view ("weakest words");
  - P3 Ulang Kaji mode;
  - the `returned_next_day` pilot metric.

### 7.4 Small PK ideas worth adopting in every Tahun
- **"Show meaning in both languages"** setting (EN + 中文 together).
- **High-level comprehension questions:** some questions show only a picture or a BM explanation (*tempat untuk memasak* → *dapur*). JK already stores `meaning.bm`.
- **"School is teaching Tema N"** marker set by a parent:
  - P1: a simple setting that highlights that Tema on Home;
  - P2: shown in the parent view.

## 8. Tema finale (new)

- **Opens when** all 3 units of the Tema have finished their core stages. Seni Bahasa and Misi are not required.
- **Ulang Kaji (practice):**
  - a mixed run of mini-games (Tangkap Buah, Pecah Belon, quiz cards) over the 3 units' 36 words and grammar;
  - due and weak words come first (§7.3);
  - unlimited replays, stars kept.
- **Tema Boss (Penilaian):**
  - three short phases: **words** (Sampan Kata round), **grammar** (10 mixed questions from the 3 units), **sentences** (3 Susun ayat + 1 Tulis sendiri, AI-checked);
  - the Boss has a health bar that goes down when the child is right;
  - **no lives are lost**; a wrong answer is "Cuba lagi!" and the question returns;
  - after the Boss, the "defeated" picture shows the Boss turned friendly (PK's idea: the mosquito king's tyre is empty and clean).
- **Rewards:**
  - a **Tema badge** in Koleksi (bronze, silver, gold by stars, so every level can earn gold);
  - a Tema postcard;
  - the Home map shows the Boss as beaten.
- **Engine:**
  - a pure `engine/finale.ts` (session building from 3 chapters, phase order, unlock rule) with unit tests;
  - Tema-level progress (`tema:<track>-<n>` records) in the same store.

## 9. Art and audio for Tahun 4

| Item | Count | How | Notes |
|---|---|---|---|
| Word pictures (pack A) | 24 × 12 = **288** | Codex, existing `image-prompts.json` flow, then `npm run optimise-images` | Same style as Tahun 3/5. Families: one ethnicity per family, the mix across units (existing rule) |
| Tema landscapes (Home map) | 8 | Existing `tema-NN.webp` flow | PK's kingdom scenes as the brief |
| Unit icons | 24 | Existing `icon.webp` flow | |
| Unit postcards | 24 | Existing postcard flow | |
| Tema Boss (battle + defeated) | 8 × 2 = 16 | Codex, JK style, transparent | PK's Boss prompts (§9.3 of its art doc) are a good brief, minus the chibi style block |
| Grammar / Seni Bahasa art | none required | Text-based games | Optional small icons later |
| Voice clips | about 24 × (12 words + 12 examples) = **576**, plus Seni Bahasa expressions | `npm run gen-audio` (Azure ms-MY) | Grammar sentences: read-aloud optional. Check the Azure free tier per month |

**Not in this plan:** PK's paper-doll avatar, gear, weapons, wardrobe, chests, pets and rank layers (about 300 files). See §12.

**Production estimate (pack A only):** about 360 new images and about 600 clips for the whole year. That is the same scale as one JK Tahun, plus 16 Boss pictures. Packs A + B + C would be about 864 word entries and about 600 pictures (PK's own estimate).

## 10. Content production per unit

1. **Pick 12 words.** Yang, from the `sample_words` seed and the CSV shortlist.
2. **Run the AI draft** (`draft-chapter`): meanings, word class, examples, blanks, jumbled sentence, distractors, the grammar block (10–15 questions with explanations) and Seni Bahasa items.
3. **Review.** Yang, ideally with a BM teacher, checks:
   - BM correctness and Tahun 4 level;
   - that grammar answers are unambiguous;
   - that no sentence is copied from the textbook.
4. **Make media.** Images via Codex, then `optimise-images`; audio via `gen-audio`.
5. **Validate and play.** `validate-content`, then play on a phone, then set `"reviewed": true`.

**Effort estimate** (rough, to be confirmed on Tema 1):

| | Per unit | Whole year |
|---|---|---|
| Yang's time | 2–3 h (word choice, review of words + 10–15 grammar questions, play-test) | 50–70 h |
| Codex image time | Unattended, about 12 images per unit | |

The grammar review is the new part; grammar questions must have exactly one right answer, which is easy to get wrong in an AI draft.

## 11. Order of work

Each step is about one task in the current way of working (build, tests, handoff, Codex review).

| Step | What | Needs | Result |
|---|---|---|---|
| **T4-0** | Housekeeping (details below) | — | No conflicting instructions; no copyright file in git |
| **T4-1a** | **`draft-chapter`** tool (P1 task 9's remaining script): chosen words + `textbook_map.json` context → full JK word entries (class, `meaning.bm`, examples, blanks, jumbled sentence, distractors, synonym/antonym). The PK sample (`t2_u4.json`) is incomplete and lacks these fields, so the converter alone cannot produce playable chapters. *Alternative:* draft Tema 1 by hand (Claude in the session) and build the tool afterwards. Either way, **re-estimate §10 after one complete unit** | — | Drafts that pass validation |
| **T4-1** | `import-pk-tahun4` converter. Schema support for the track's optional `kingdom` (and later `boss`) fields **added in this step**, because today's strict schema rejects unknown fields. `content/tahun-4/track.json` **lists only the units that have a chapter** (Tema 1 now): `checkTrack` rejects listed units with no chapter, and that gate stays. Tema 2–8 are added to the track as their chapters land. **Tema 1 content** (3 units × 12 words) as drafts (`reviewed: false`). 36 pictures, 72 clips, 3 icons, 3 postcards, Tema 1 landscape | T4-1a; Yang picks or edits the words | **Tahun 4 Tema 1 playable in today's stages** (Kenali, Uji, Bina, Cabaran) |
| **T4-2a** | **Stage framework**. Split "every stage id the app knows" (`STAGE_IDS`: kenali, uji, tatabahasa, bina, cabaran) from "the stages this chapter requires" (`stagesFor(chapter)`: tatabahasa only when the chapter has a grammar block). Update **every caller of the fixed list**, not only `progress.ts`: `App.tsx`, `StageResult.tsx`, `engine/collection.ts` (postcards), `app/router.ts` (stage parsing), Home totals, `ChapterScreen.tsx`, and the completion/save callers. **Old progress rules** (record version 2 + migration + regression tests on saved v1 records): a chapter that was complete before it gained a grammar block **stays complete and keeps its postcard**; a stage that was unlocked or has stars stays unlocked (unlock = previous required stage done, *or* this stage already has stars); the new Tatabahasa stage shows as "Baru!" | T4-1 | Any chapter can gain a stage without losing rewards |
| **T4-2b** | **Tatabahasa stage**. Rule card, the stage screen, and **question adapters** (below). `choose` + `transform` games. Grammar blocks for Tahun 4 Units 1–3 (kata nama am, kata nama khas, kata ganti nama) | T4-2a | Grammar in Tahun 4 Tema 1; ready for any Tahun |
| **T4-2c** | `classify`: generalise Pecah Belon to grammar items with their own category + per-answer result hook; 2-bin sort for sentences | T4-2b | Units 1–2 (am/khas) use the balloon game |
| **T4-3** | **Per-word mastery saved** (§7.3, event log) + Ulang Kaji + **Tema Boss** + Tema badge. Tema 1 Boss art | T4-2b | Tahun 4 Tema 1 complete end to end |
| **T4-4** | **Seni Bahasa** stage (peribahasa/simpulan bahasa matching; Jawi with font + RTL) | T4-2b | Units 1, 2, 9 … and Jawi Units 8, 16, 24 when their content lands |
| **T4-5** | `forge` game (**Bengkel Imbuhan**) | T4-2b | Needed by Units 15–16 (Tema 5–6) |
| **T4-6…** | Content for Tema 2–8, one Tema per task (3 units, grammar, Seni Bahasa, Boss, art, audio) | T4-2c, T4-3; T4-5 before Tema 5 | Full Tahun 4 (paid track) |
| **later** | RPG layer, if chosen (§12) | Pilot results | — |

**T4-0 housekeeping details:**
- move `pahlawan-kata/` to `docs/pahlawan-kata/` (reference material);
- rename its `CLAUDE.md` to `design-handoff.md`, so Claude Code does not load its conflicting rules (Zustand, Supabase from day one, 中文 first) when working nearby;
- move the PDF to a git-ignored `reference/` folder (it is already ignored by `*.pdf`, but a clear place helps);
- decide whether to commit `pahlawan-kata/` (it is untracked today).

**How this fits the current plan (CLAUDE.md §4):**
- **P1 pilot today:** Tahun 3 and Tahun 5, Tema 1. Tasks 8 (offline, analytics), 10 (deploy) and 11 (pilot) are still open, and G-4 (mini-games as the Uji rounds) is waiting for Yang's play-test.
- **T4-1a and T4-1 are tooling and content** (plus two optional schema fields). They can run beside those tasks.
- **T4-2a/b/c and T4-3 change the engine** and add value to every Tahun. They are the natural next code tasks after the pilot is online. If Yang wants grammar in the pilot, they come before task 11 and delay the pilot by **about four tasks**.
- **Recommendation:**
  1. do T4-0, T4-1a and T4-1 now;
  2. finish tasks 8, 10 and 11 so the pilot starts;
  3. build T4-2a/b/c and T4-3 while the pilot runs;
  4. add Tahun 4 Tema 1 to the pilot when T4-3 is done, so pilot families with a Tahun 4 child test grammar and the Boss.

## 12. The RPG layer: options for after the pilot

PK's progression and dress-up layer is the part most likely to excite children, and also the part that costs the most and fits JK least. Proposed decision path:

| Option | What children get | Cost | Risk |
|---|---|---|---|
| **A. None** (stars, postcards, badges, mini-games, Boss) | What the pilot tests | Nothing extra | May feel less "gamey" for older children (Tahun 5–6) |
| **B. Light** (recommended to test first) | XP and level from stars (no stats); the 3 ranks from PK (bronze, silver, gold) shown as a frame and badge; **a simple avatar** (choose boy/girl/tudung + 4 outfit colours) that wears Tema badges | About 2 tasks + about 30 images | Low; no balancing |
| **C. Full PK** | Gear with stats, weapons, chests, shop, coins, wardrobe with paper-doll layers, loadouts, pets | Many tasks + about 300 art files kept aligned across layers | High: balancing, alignment of AI art layers, "gear changes timers" conflicts with learning-first and no-fail rules; lots of non-learning screen time |

**Packs B and C (24/36 words):**
- **Decide with pilot data:** do children finish 12 words easily and want more?
- **If yes:**
  - add pack B as an optional **"Kata Tambahan"** round in Kenali and Uji (schema already supports `pack`);
  - fold pack C's word families into the grammar stage (Bengkel Imbuhan) instead of a 36-word list.
- **Pricing:** packs B and C triple the content for the same RM39 price, so they also need a pricing decision.

**Placement test:** only needed if packs or levels exist. Not in the first release.

## 13. Decisions for Yang

| # | Question | Recommendation |
|---|---|---|
| 1 | One app (Tahun 4 inside Jelajah Kata) or a separate Pahlawan Kata app? | **One app.** Same engine, content pipeline, payments and PWA; a second app doubles the work |
| 2 | Name: keep "Jelajah Kata", rename the product "Pahlawan Kata", or use "Pahlawan" for the RPG mode only? | Keep one name for now (it is still a working title, CLAUDE.md §10). Decide with the RPG layer |
| 3 | Words per unit for Tahun 4 | **12 (pack A)**, as in Tahun 3/5 |
| 4 | Add the **Tatabahasa** stage to every Tahun (Tahun 4 first)? | **Yes** |
| 5 | Tema finale with **Ulang Kaji + Tema Boss**, Boss loses HP, child never loses lives? | **Yes** |
| 6 | **Seni Bahasa**: only peribahasa, simpulan bahasa and Jawi at first (about 10 units), skip poems/songs (copyright)? | **Yes**; our own pantun later if wanted |
| 7 | Does Tahun 4 join the **free pilot** (Tema 1)? | **Yes, after T4-3**. The pilot starts with Tahun 3/5 as planned |
| 8 | Order: T4-0/T4-1a/T4-1 now, pilot tasks 8/10/11 next, then T4-2a/b/c and T4-3? | **Yes** |
| 8b | Build the `draft-chapter` tool first (T4-1a), or let Claude draft Tema 1 by hand and build the tool later? | **Tool first**: 24 units will need it, and it is a planned P1 task anyway |
| 9 | RPG layer: none, light, or full (§12)? | Decide after the pilot; **light** is the one to test |
| 10 | Packs B/C and the placement test | After the pilot |
| 11 | Kingdom names, Bosses and the eight NPC friends from PK on the Tahun 4 map? | Kingdoms + Bosses **yes**; NPCs later (Misi/Boss dialogue) |
| 12 | Hornbill stays the guide in Tahun 4 (PK suggested a hornbill only as a pet)? | **Yes** |
| 13 | Who reviews Tahun 4 BM, especially grammar answers? | Yang + a BM teacher if possible |
| 14 | Tahun 4 Tema 1 word lists: Yang picks from the PK seed + CSV, or Claude proposes 12 per unit for Yang to edit? | Claude proposes, Yang edits (faster) |

## 14. What happens to each PK file

| PK item | Where it goes | Use |
|---|---|---|
| `docs/design-v0.3.md` | `docs/pahlawan-kata/` (reference) | Source of the grammar, Seni Bahasa, finale and RPG ideas |
| `docs/art-assets-and-prompts.md` | Reference | Boss, kingdom and NPC briefs; restyle to JK |
| `data/textbook_map.json` | Input to `import-pk-tahun4` | Tema/unit titles, pages, grammar, Seni Bahasa, sample words |
| `data/vocab_candidates/*.csv` | Input to word selection | Shortlist |
| `data/schema/unit.schema.json` | Replaced by JK's Zod schema | Field ideas only (`pack`, `root`, grammar types) |
| `data/sample/t2_u4.json` | Converted as the converter's first test case | Unit 4 draft |
| `tools/extract_vocab.py` | `scripts/` (reference) | Re-run if the word selection method changes. The page ranges inside are useful |
| `prototype/*.dc.html` (21 screens) | Reference | Grammar, SeniBahasa, Boss, Kingdom, Result: layout and flow ideas for T4-2b…T4-4. The RPG screens wait for §12 |
| `CLAUDE.md`, `README.md` | Renamed (T4-0) | Avoid conflicting agent instructions |

## 15. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| AI-drafted grammar questions with two right answers, or wrong BM | Children learn wrong grammar; parents lose trust | Validation rules (§5.2); human review of every question; BM teacher; `reviewed: false` never ships |
| Copying textbook text by accident (examples, poems) | Copyright (KPM/DBP) | Our own sentences only; no sajak/lagu; a check in `draft-chapter` that flags any 6+ word run found in the textbook text (the PDF text stays local and is never committed) |
| Jawi rendering differs across phones | Wrong or broken letters | Bundled font, RTL tests on Android and iPhone in Playwright + real devices |
| Adding a stage breaks saved progress, navigation or postcards | Children lose stars or rewards | `STAGE_IDS` vs `stagesFor(chapter)`, every caller updated (T4-2a lists them), record version 2 with migration, tests on saved v1 records |
| Mastery data merged wrongly | Weak words look mastered, or answers are lost | Answer-event log keyed by track + word (§7.3), with tests for wrong-after-right, two tabs, and the same id in two tracks |
| Scope creep toward the full RPG | Pilot delayed, content falls behind | RPG layer only after the pilot (§12); learning stages first |
| Content volume (24 units) | Paid Tahun 4 late | One Tema per task after T4-3; the converter and `draft-chapter` cut drafting time |
| Bundle size grows (288 more pictures, Jawi font) | Slow on mobile data | WebP 512 px (task 9); cache per unit (task 8 decision); font subset |

---

## What I'd like from the review (Codex)

1. **Fit with the code:**
   - Is the proposed schema extension (§5.1) and per-chapter stage list (T4-2) a clean change to `schema.ts`, `progress.ts`, `loader.ts` and `ChapterScreen.tsx`?
   - Is anything in today's code that assumes four fixed stages missed?
2. Is the grammar-type → existing-engine mapping (§6.2) realistic, given `engine/tangkap.ts`, `engine/belon.ts` and `engine/bina.ts`?
3. Any rule in `CLAUDE.md` this plan breaks?
4. Missing risks, wrong effort estimates, or a better order (§11).
5. Anything in `pahlawan-kata/` that I misread or left out.

---

## Review outcome (Codex, 19 Nov 2026)

Full review: `docs/tahun-4-pahlawan-kata-integration-plan.review.md`. All 8 findings were valid and are folded into the plan above.

| # | Severity | Finding | Change in the plan |
|---|---|---|---|
| 1 | High | T4-1 as written fails validation: `checkTrack` rejects listed units with no chapter, and the strict schema rejects `kingdom`/`boss` | §11 T4-1: the track lists only units with chapters; the schema fields are added in T4-1 |
| 2 | High | Stage migration missed fixed-stage code in `App.tsx`, `StageResult.tsx`, `collection.ts`, the router, Home totals and save callers; no rule for keeping rewards | §11 T4-2a: `STAGE_IDS` vs `stagesFor(chapter)`, every caller listed, rules that keep completion, postcards and unlocks, v1-record regression tests |
| 3 | High | Mastery cannot be merged like stars (it must go down after a wrong answer) | §7.3: answer-event log, replayed in order; union by event id for P2 sync; concurrency tests |
| 4 | Medium | Word ids are unique only within a track | §7.3: key = track + word id; mixed sessions carry the track |
| 5 | Medium | Engine reuse understated (Tangkap's own questions and 90 s cut-off, Belon without retry/hints, Bina tiles from chapter words) | §6.2: question adapters + per-answer hook; Tangkap question-count mode; T4-2 split into a/b/c |
| 6 | Medium | `forge` schema had no sentence and unclear options | §5.1: sentence with `___`, options are complete words, validation rules |
| 7 | Medium | Seni/Jawi counts and data did not fit the source (1–2 Jawi phrases per unit, no Jawi spellings, spaces) | §5.1–5.2: counts per kind, Jawi spellings written and reviewed, spaces allowed, situation question modelled |
| 8 | Medium | T4-1 depends on the unbuilt `draft-chapter` tool | §11 T4-1a added (tool first, or hand drafting); re-estimate after one unit; decision 8b |

Not reviewed by Codex: the textbook checks in §2 (Codex was told not to open the PDF; I ran them on the PDF's text layer).
