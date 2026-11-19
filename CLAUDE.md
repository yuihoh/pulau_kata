# CLAUDE.md — Jelajah Kata (BM Vocabulary Game)

> Handoff from planning sessions in the Claude app (16 Nov 2026) to Claude Code in VS Code.
> Full product & technical plan: `docs/jelajah-kata-technical-plan.md` — read it before making architectural decisions.

---

## 1. What we are building

A web game (installable PWA) that helps Malaysian primary school pupils (aged 9–12) learn **Bahasa Melayu vocabulary from the KSSR textbook, chapter by chapter**.

- **1 textbook chapter (unit) = 1 game**, about 8–12 words each.
- **Separate track per school year**, starting with **KSSR BM Tahun 3** (changed from Tahun 4 by Yang on 16 Nov 2026). Tahun 4–6 come later.
- The textbook groups units into **Tema** (8 Tema × 3 units = 24 units for Tahun 3). The textbook has no vocabulary list, so we pick 8–12 words per unit from its pages.
- Learning content is in BM. **Explanations and instructions are in English or 中文**, and the child can switch.
- Owner: Yang, an experienced programmer and the product owner. He makes product decisions and reviews BM content.

### Chapter game flow (every chapter uses the same engine)

| Stage | Name | Goal | Activities |
|---|---|---|---|
| 1 | **Kenali** (Get to know) | Know the meaning | Word cards (picture, audio, meaning EN/中文, word class, example sentence) + **Padankan** memory-match game. All cards must be opened to unlock Stage 2 |
| 2 | **Uji** (Test) | Recall | Picture→word MCQ, word→meaning MCQ, **Dengar & pilih** (audio), **Isi tempat kosong** (fill blank), **Susun huruf** (unscramble), seerti/berlawan (higher levels). Wrong words come back later in the session. One hint per question. Gentle "Cuba lagi!" (never a harsh fail screen) |
| 3 | **Bina** (Build) | Use the word correctly | Pilih perkataan → **Susun ayat** (drag tiles) → sentence frames (*Siapa + Buat apa + Di mana/Bila*) → **Tulis sendiri** (free sentence, **AI-checked**) |
| ★ | **Cabaran Akhir** | Consolidate | Short mixed timed challenge |

Motivation layer: 1–3 stars per stage (retries allowed), collectibles ("Jelajah Malaysia" map), streaks, badges, avatar. Sessions should take 10–15 minutes.

---

## 2. Decisions already made (don't re-open without asking Yang)

| Topic | Decision |
|---|---|
| Platform | **Own web app (PWA). Not Roblox.** Roblox was considered and rejected: low creator revenue share, the child is the payer, the audience is too niche, and Yang wouldn't control the rules |
| Business model | Parents pay (later also tuition centres). Planned: **one-time payment per school-year track** (not per unit, not a subscription). Delivered as a **web link (PWA), no .exe/.apk, no app store at launch**. Proposed RM39 per Tahun, founding families RM19–29, to be tested with pilot parents. Details: `docs/delivery-and-pricing-plan.md` (18 Nov 2026) |
| Release strategy | Start simple. **P1 free pilot → P2 paid beta → P3 grow** (see §4) |
| Sentence check | **AI check** through a serverless proxy. The API key is never in the browser |
| Images | Yang generates them with ChatGPT in one fixed style. Use placeholders until they're ready |
| Content originality | Example sentences, quiz items and images must be **original**, never copied from the textbook (copyright). Using the chapter's vocabulary list is fine |
| Privacy | Collect the minimum. No child full names or school names. Parental consent at sign-up (P2) |

---

## 3. Tech stack

- **Frontend:** React + TypeScript (strict) + Vite, PWA (vite-plugin-pwa), Tailwind CSS, Framer Motion, dnd-kit, i18next (`en`, `zh`)
- **Local progress (P1):** IndexedDB (Dexie or idb-keyval). No login in P1
- **Content:** a JSON file per chapter in `content/`, validated with **Zod**
- **Audio:** MP3s pre-generated at build time from **Azure Speech** Malay (ms-MY) neural voices (Yang's decision, 17 Nov 2026). Don't rely on the browser's built-in speech
- **Music:** soft background loops from a **commissioned composer** with a written commercial app licence (keep licences in `docs/licences/`). On by default at low volume, remembered 🎵 toggle, ducks under speech
- **Images:** PNG from ChatGPT → WebP (~512×512) at build time
- **API:** Cloudflare Workers (`/api/check-sentence`; payment webhook in P2)
- **AI model:** a small, fast model (e.g. Claude Haiku) behind the Worker
- **Hosting:** Cloudflare Pages (staging + production)
- **P2+:** Supabase (Auth + Postgres + RLS, Singapore region), Malaysian payment gateway with FPX (Billplz / ToyyibPay / Stripe, not decided yet)
- **Observability:** PostHog (pilot metrics), Sentry (errors)
- **Testing:** Vitest, Playwright (desktop + mobile viewport), content validation script
- **CI/CD:** GitHub Actions

---

## 4. Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| **P1 — Free pilot** ← *current* | Tahun 3 **and Tahun 5** (added 17 Nov 2026), Tema 1 (Units 1–3) each, all stages, no login, progress on device, EN/中文 toggle (default **English**, Yang 17 Nov 2026; the child's choice is remembered), AI check | Kids finish a chapter without being pushed; kids return on their own; several parents say yes to a stated price |
| P2 — Paid beta | All Tahun 3 chapters, parent accounts, progress view, payments, founding-family price | Paying conversion and retention justify more content |
| P3 — Grow | Tahun 4–6, tuition centre / teacher accounts, full parent dashboard, Ulang Kaji revision mode | — |

**Design P1 so P2/P3 are additions, not rewrites.** For example, put progress storage behind an interface so a Supabase sync can be added later.

---

## 5. Repository layout (target)

```
jelajah-kata/
├─ CLAUDE.md
├─ docs/jelajah-kata-technical-plan.md
├─ apps/web/                 # React PWA
│  ├─ src/
│  │  ├─ stages/             # Kenali, Uji, Bina, CabaranAkhir
│  │  ├─ games/              # Padankan, SusunAyat, SusunHuruf, …
│  │  ├─ engine/             # scoring, stars, spaced repetition (pure TS, unit-tested)
│  │  ├─ content/            # loaders + Zod schema
│  │  ├─ i18n/               # en.json, zh.json
│  │  └─ storage/            # ProgressStore interface; IndexedDB impl (P1)
│  └─ tests/
├─ workers/api/              # Cloudflare Worker
├─ content/tahun-3/
│  ├─ track.json             # tema → units, order, titles
│  └─ unit-01/{chapter.json, images/, audio/}
├─ tahun3/                   # Yang's textbook photos (reference only, never shipped)
├─ scripts/                  # draft-chapter, validate-content, gen-audio, optimise-images
├─ supabase/migrations/      # P2+
└─ .github/workflows/        # ci.yml, deploy-staging.yml, deploy-production.yml
```

---

## 6. Content schema (chapter.json)

```json
{
  "id": "t3-u01",
  "year": 3,
  "unit": 1,
  "tema": 1,
  "reviewed": false,
  "title": { "bm": "…", "en": "…", "zh": "…" },
  "words": [
    {
      "id": "menyapu",
      "word": "menyapu",
      "class": "kata kerja",
      "meaning": { "bm": "membersihkan lantai dengan penyapu", "en": "to sweep", "zh": "扫地" },
      "image": "menyapu.webp",
      "audio": "menyapu.mp3",
      "example": { "bm": "Adik menyapu lantai dapur.", "en": "My younger sibling sweeps the kitchen floor.", "zh": "弟弟/妹妹在扫厨房的地板。" },
      "synonym": null,
      "antonym": null,
      "blank_sentences": ["Ibu ___ halaman rumah setiap pagi."],
      "jumbled_sentence": ["Kami", "menyapu", "kelas", "selepas", "sekolah"],
      "distractors": ["mengelap", "membasuh", "menyiram"]
    }
  ]
}
```

`class` is one of: `kata nama`, `kata kerja`, `kata adjektif`, `kata adverba`, `kata sendi`, `lain-lain`.

### Content validation rules (run in CI; fail the build if broken)
- Every word has `meaning.en`, `meaning.zh`, `meaning.bm` and an example in all three languages
- The image and audio files referenced actually exist (a placeholder is allowed in dev only)
- `blank_sentences` contain exactly one `___`
- `jumbled_sentence` joined with spaces is a sentence that contains the word
- Distractors don't duplicate the word and are of the same word class where possible
- No duplicate word IDs within a track

---

## 7. AI sentence check spec

- `POST /api/check-sentence` with body `{ word, wordClass, year, sentence, lang }` (`lang` is `en` or `zh`)
- **Never send personal data.** Max sentence length 200 chars. Rate limit about 20 checks per device per day
- The model must return **strict JSON**:
  ```json
  { "result": "correct" , "uses_target_word": true,
    "tip": "short, kind tip in the requested language",
    "suggested_sentence": "BM sentence or null" }
  ```
  `result` is one of `correct` | `almost` | `try_again`.
- Judging rules:
  - the target word is used with the correct meaning
  - grammar is judged at the level of the child's school year
  - forgive small spelling slips
  - accept both the textbook form and the formal form of simpulan bahasa (e.g. *ambil berat* and *mengambil berat*). Content uses the textbook form (Yang's decision)
  - inappropriate or off-topic input gets a neutral redirect ("Cuba tulis ayat menggunakan perkataan ini.")
- Keep the AI provider behind an adapter so the model or vendor can be swapped
- Dev mode: a mock checker that needs no API key

---

## 8. Environments & pipeline

| Env | URL | Trigger |
|---|---|---|
| Local | localhost | — (mock AI, dev keys) |
| Preview | Cloudflare Pages preview URL | Every PR |
| Staging | `staging.<domain>` | Merge to `main` (auto) |
| Production | `app.<domain>` | Git tag `vX.Y.Z` + **manual approval** (GitHub Environment) |

- Trunk-based: `feature/*` and `content/t3-uXX` branches → PR → `main`.
- **CI on every PR:** ESLint/Prettier, `tsc --noEmit`, Vitest, content validation, Vite build, Playwright (completes Unit 1 flow end to end), bundle size check.
- **Rollback:** redeploy the previous release.
- Each environment has its own secrets, keys and (P2+) database.

---

## 9. Conventions

- TypeScript strict. Keep game logic in `engine/` as pure functions with unit tests.
- **Mobile- and tablet-first.** Touch targets ≥ 44px, works in portrait, works offline after first load.
- Every UI string goes through i18next, so no hard-coded English or Chinese in components. BM learning content comes from `content/`, never from i18n files.
- Kid-friendly tone: encouraging, short sentences, no shaming.
- **Secrets never go in code or chat.** Use `.dev.vars` / `.env.local` (git-ignored), Cloudflare secrets and GitHub secrets.
- Generated BM content is a **draft until Yang reviews it**. Mark unreviewed chapters with `"reviewed": false` and don't release them to production.
- Keep the bundle small. Kids may be on slow mobile data.

---

## 10. Current status (17 Nov 2026)

> **Continuing agent: read `docs/handoffs/HANDOFF-next-agent.md` first** (workflow, how to run, waiting items, gotchas).

**Done:**
- Game design
- Platform decision (own PWA, not Roblox)
- Monetisation direction
- Technical plan
- Pipeline design

- Repo scaffold (task 1): npm workspaces, Vite React TS PWA, Tailwind v4, i18next, Vitest, Playwright, ESLint/Prettier, CI. Lint, typecheck, unit, build and e2e all pass
- Task 2: Zod schema + rules in `apps/web/src/content/` (unit-tested), `scripts/validate-content.ts` (`--strict` for production: fails on unreviewed chapters or missing media; otherwise missing media is only a warning). `content/tahun-3/` has track.json + Units 1–3 (12 words each), **reviewed and approved by Yang on 16 Nov 2026**
- Task 3: `apps/web/src/engine/` (questions, retry queue, hints, stars, stage unlocking, Leitner mastery), 50 unit tests, Codex-reviewed
- Task 4: Kenali + Padankan screens, IndexedDB `ProgressStore` (merging saves), content loader (png fallback, hides unreviewed in prod), hash router, EN/中文 UI. Uji/Bina/Cabaran show "coming soon"
- Task 5: Uji stage (picture→word, word→meaning, fill blank, unscramble; listen-word auto-enabled once audio exists), retry queue, hints, stars
- Task 5b (17 Nov 2026, Yang's request): **Sampan Kata** boat game prototype at `#/lab/sampan` (linked on Home in dev, or with `VITE_SHOW_LAB=true`). Yang decided: it becomes **Cabaran Akhir** in task 7; boat theme; no dying, 90 s round, speed adapts, relaxed mode. Progress not saved yet. Engine `engine/sampan.ts`, lazy chunk `games/SampanKata.tsx`
- Task 5c (17 Nov 2026, Yang's request): **Misi** story-adventure prototype. Yang decided: optional per unit, unlocked after Uji; BM lines with 🌐 tap-to-translate; Unit 2 theme. `content/tahun-3/unit-02/quest.json` ("Pengembaraan di Hutan", 3 scenes, all 12 Unit 2 words, **draft BM awaiting Yang's review**), `QuestSchema` + `checkQuest` in validate-content, `engine/quest.ts`, lazy `games/Misi.tsx` at `#/lab/misi/<chapterId>`, Misi card on the unit screen. Art via `unit-02/quest-prompts.json` (Codex). Progress/reward not saved yet
- Task 6: Bina stage (Susun ayat ×5 tap-to-place, Pilih perkataan, Tulis sendiri ×2 with Siapa/Buat apa/Di mana-Bila frame + starter chips). `workers/api` check-sentence Worker: mock checker (default, no key) and Claude Haiku checker behind an adapter, strict validation, personal-data screen (phone/email/IC/links; in the browser and again in the Worker, before any AI call), per-device + per-IP daily limits (Durable Object counter), no sentence text in logs. `npm run dev` serves `/api` through a Vite plugin (mock unless `workers/api/.dev.vars` sets `AI_MODE=anthropic` + key)
- Task 7: **Cabaran Akhir** = Sampan Kata on the unit's words (saves stars; first unit completion → celebration + postcard). **Koleksi** (`#/koleksi`): postcard per unit (3 Codex postcards) + Misi reward, derived from progress; Misi results saved (`progress.misi`). **Sound** (`src/audio/`): one remembered 🔊/🔇 switch, music player per screen (silent until Yang's files land in `src/assets/music/`, Uji/Bina quiet, ducks under speech), synthesized sound effects, read-aloud via `playSpeech`. **`npm run gen-audio`** (Azure ms-MY; `--dry-run` works without a key; plan in `content/audioPlan.ts`: words, example sentences, Misi lines). Music brief: `docs/music-brief.md`; rights records: `docs/licences/`
- Task 9 (18 Nov 2026): **`npm run optimise-images`** (`scripts/optimise-images.ts`, sharp). Converts every PNG under `content/` to a small WebP beside it (word pictures 512 px, postcards 768, Misi backgrounds 1024) and **moves the PNG masters to `assets-src/content-originals/`**. 89 pictures 187.7 MB -> 5.1 MB; `dist` 194 MB -> 11 MB. **New Codex PNGs: drop them in `content/`, then run the script.** Open for task 8: the service worker now precaches 10 MB (pictures 5.7 MB + audio 3.4 MB); decide whether to cache per unit instead. Handoff: `docs/handoffs/task-09-optimise-images.md`
- Each task gets a handoff in `docs/handoffs/` + a Codex review (`*.review.md`) before moving on
- Unit 1 pages 4–5 are A–Z handwriting practice, so there are no extra words there
- **Tahun 5 pilot (17 Nov 2026, Yang's request):** a second track `content/tahun-5/` (Tema 1 Keluarga Tercinta; Unit 1 Riangnya Keluargaku, Unit 2 Keluarga Bestari, Unit 3 Hadapi Bersama-sama; 12 words each, original examples; words chosen from the DBP Tahun 5 SJK textbook pp. 2–20, which is a reference only and never shipped). All content is **`reviewed:false` (draft) until Yang approves**. 36 word pictures + 3 postcards via Codex, 72 Azure voice clips. Home and Koleksi group by year. No Misi quest for Tahun 5 yet. Handoff: `docs/handoffs/task-07c-tahun5-pilot.md`
- Pilot track switched to **Tahun 3**. Photos of Tema 1 (Units 1–3, contents page) are in `tahun3/`. Unit 1 pages 4–5 are missing

**Pilot units (Tahun 5, Tema 1 Keluarga Tercinta):** Unit 1 Riangnya Keluargaku, Unit 2 Keluarga Bestari, Unit 3 Hadapi Bersama-sama (drafts, awaiting Yang's review).

**Pilot units (Tahun 3, Tema 1 Keluarga Bahagia):** Unit 1 Keluarga Tersayang, Unit 2 Hubungan Erat, Unit 3 Keluarga Prihatin. Draft word lists were proposed by Claude and still need Yang's confirmation.

### Waiting on Yang
00. **Review the Tahun 5 words** (`content/tahun-5/unit-0X/chapter.json`, BM meanings and examples) and listen to the Tahun 5 voices at `#/lab/audio`; then set `"reviewed": true`
0. **Listen through the Azure voices** (88 files generated 17 Nov 2026) and report any word that sounds wrong; then Yang's music files in `assets-src/music/`
1. Play-test Bina and the Misi prototype (`#/lab/misi/t3-u02`); review the Misi BM text in `content/tahun-3/unit-02/quest.json` (Sampan Kata: approved "ok" on 17 Nov 2026)
2. Accounts: GitHub repo (this one), Cloudflare (free), Anthropic API key (to switch the sentence check from mock to Claude), Azure/Google TTS, PostHog + Sentry (can come later), domain (optional; `*.pages.dev` is fine for the pilot)
3. Later: name confirmation ("Jelajah Kata" is a working title), number of pilot families and devices, pilot price to ask parents, a BM teacher reviewer

### Graphics + games (Yang, 18 Nov 2026; **before the pilot**, i.e. before tasks 8–11)
Plan: `docs/graphics-and-games-proposal.md`. Decided: improve screens **and** games; mascot = **hornbill** (Codex first version, commission later); first new games **Tangkap Buah** + **Pecah Belon** as skins over the existing question engine (no new content per unit). Order: **G-1 look and feel — done 18 Nov 2026** (Fredoka font, Phosphor icons via `components/Icon.tsx`, no emoji in screens (guard test), `components/tema.ts`, `components/celebrate.tsx` bounce/shake/stars/confetti, reduced motion respected; handoff `docs/handoffs/task-g1-look-and-feel.md`) → **G-2 hornbill mascot — done 18 Nov** (8 Codex poses in `assets-src/mascot/`, `scripts/mascot-to-webp.py`, `components/Mascot.tsx`; not named yet; handoff `task-g2-mascot.md`) → **G-3 Home map + unit trail — done 18 Nov; G-3b Home rebuilt from Yang's ChatGPT mockups, done 18 Nov** (wooden year sign, Tema ribbon, numbered stone markers, tinted unit cards with a Codex icon each; `components/HomeParts.tsx`, art in `assets-src/home/`, `scripts/home-art-to-webp.py`; a new unit needs `unit-NN/icon.webp`; handoff `task-g3b-home-mockup.md`) (`components/TrailMap.tsx`, Tema landscapes `content/<track>/tema-NN.webp` from `assets-src/maps/`; handoff `task-g3-home-map.md`) → G-4 mini-game framework + the two games, Uji = 3 short rounds → **G-4 mini-games — prototypes built 18 Nov** (`#/lab/tangkap` Tangkap Buah, `#/lab/belon` Pecah Belon; pure engines `engine/tangkap.ts`, `engine/belon.ts`; shared `games/miniGameParts.tsx`; handoff `task-g4-mini-games.md`). **Still to do for G-4: make them the rounds inside Uji ("Uji = 3 short rounds") after Yang has played them** → later Koleksi previews, more games, Arked. **G-6 Sampan Kata UI from Yang's mockup — done 18 Nov** (smiling boat, buoys per lane, wood-sign header, hornbill feedback card, corner leaves; art in `assets-src/sampan/`; handoff `task-g6-sampan-ui.md`).

### Next tasks for Claude Code (P1 build order)
1. Scaffold the repo (Vite React TS PWA, Tailwind, i18next, Vitest, Playwright, ESLint/Prettier) + CI workflow
2. Zod content schema + `scripts/validate-content.ts` + `content/tahun-3/` track and Units 1–3 drafted from the word lists (`"reviewed": false`)
3. `engine/`: scoring, stars, spaced-repetition queue (unit-tested)
4. Stage 1 Kenali + Padankan
5. Stage 2 Uji (all question types)
6. Stage 3 Bina + `workers/api` check-sentence (with mock mode)
7. Cabaran Akhir (= Sampan Kata, from the task 5b prototype), stars, simple collectibles, sounds
8. ~~EN/中文 toggle~~ (done), PWA offline, PostHog events (chapter_started, stage_completed, chapter_completed, returned_next_day)
9. Scripts: `draft-chapter` (AI-assisted content draft), ~~`gen-audio` (TTS)~~ (done), ~~`optimise-images`~~ (done 18 Nov 2026)
10. Cloudflare Pages staging + production deploy workflows with manual approval
11. Units 2–3 through the content pipeline → staging UAT → production → pilot

### Image prompt template (for Yang to use in ChatGPT)
> "Simple flat cartoon illustration of [meaning], bright colours, white background, child-friendly, no text, square 1:1, Malaysian setting"

Save each image as `content/tahun-3/unit-XX/images/<word>.png`. For abstract words (e.g. *jujur*, *rajin*), describe a scene that shows the meaning.
