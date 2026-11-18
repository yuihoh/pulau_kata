# Handoff to the next agent: Jelajah Kata

*17 Nov 2026 · written by Claude Code (Opus) at the end of a long session, for the agent continuing the build*

Read this first, then `CLAUDE.md` (the project's rules and status) and the per-task handoffs in `docs/handoffs/`. The product owner is **Yang**. Use they/them for Yang. Yang is an experienced programmer who reviews the BM content and makes the product decisions.

---

## 1. What the product is (one paragraph)
Jelajah Kata is a Bahasa Melayu vocabulary PWA for Malaysian primary pupils (pilot: **Tahun 3 and Tahun 5, Tema 1, Units 1–3 each**), with EN/中文 support (**default English**).
- **Stages:** each unit has four:
  - **Kenali:** word cards + the Padankan memory game;
  - **Uji:** quiz;
  - **Bina:** build sentences + the AI-checked "write your own";
  - **★ Cabaran Akhir:** the Sampan Kata boat game.
- **Extras:**
  - an optional **Misi** story adventure per unit (unlocked after Uji);
  - a **Koleksi** of postcards and rewards;
  - sound effects, background music (Yang's own recordings, pending) and read-aloud (Azure voices, pending).
- **Business model:** parents will pay, so every asset needs commercial rights (`docs/licences/`).

## 2. The standing workflow (Yang asked for this; follow it)
After **every** task:
1. **Write a handoff:** `docs/handoffs/task-NN-<slug>.md`. List every changed file (this folder is **not a git repo**, so Codex can't diff). Include what was built, what was verified, "decisions worth challenging" and "what I'd like from the review".
2. **Ask Codex to review it.** Run in the background:
   ```bash
   cd /c/Users/yuiho/projects/pulau_kata && codex exec --skip-git-repo-check -s read-only \
     -o docs/handoffs/task-NN-<slug>.review.md \
     "You are reviewing work by another engineer in this repo. Read docs/handoffs/task-NN-<slug>.md and every file it lists, plus CLAUDE.md for product rules. Do the review it asks for. Output a concise markdown review: findings ranked by severity (High/Medium/Low), each with file:line, the failure scenario, and a suggested fix. Only real issues." \
     > <scratchpad>/codex-NN.log 2>&1 < /dev/null
   ```
   ⚠️ Without `--skip-git-repo-check` Codex exits at once (not a git repo). Don't send its output to /dev/null, or you won't see failures.
3. **Fix every valid finding**, add regression tests marked with the review finding number (e.g. "task-NN review #1"), re-run all checks, and append a **"Review outcome"** table to the handoff.
4. **Tell Yang** in plain language: what was built, what Codex found, what was fixed, and what is waiting on them.

Also: **update the CLAUDE.md §10 status** after each task. **Commit or push only if Yang asks**; there is no git repo yet.

## 3. How to run things
Use the Bash tool (Git Bash on Windows). **`node` is not on PATH in Bash**, so prefix commands:
```bash
export PATH="$PATH:/c/Program Files/nodejs"
cd /c/Users/yuiho/projects/pulau_kata
npm run dev              # Vite dev server :5173 (also serves /api via the Worker handler, mock AI)
npm run lint && npm run format:check && npm run typecheck
npm test                 # web (Vitest, ~159 tests) + workers/api (~37 tests)
npm run validate-content # add -- --strict for production (fails on unreviewed content / missing media)
npm run build            # tsc + vite build (watch the main bundle size; ~154 KB gzip start-up JS now)
npm run e2e              # Playwright desktop + Pixel 7 (builds + previews on :4173, ~2 min, 14 tests)
npm run gen-audio -- --dry-run   # Azure TTS plan (88 files); real run needs AZURE_SPEECH_KEY/REGION in .env.local
npx prettier --write <paths>     # format before format:check
```
- **The live preview for Yang** runs as `npx vite --host --port 5173 --strictPort` from `apps/web` (http://localhost:5173 and http://192.168.1.2:5173 on Yang's phone). A dev server started in an earlier session may still be running.
- **New content images need a restart:** Vite's `import.meta.glob` often doesn't pick up files created after the server started. To restart, stop the **node process** that owns the port (PowerShell: `Get-NetTCPConnection -LocalPort 5173`, then `Stop-Process`); stopping the Bash wrapper alone leaves node running.
- **Port 4173 (e2e):** Playwright reuses an existing server there when not in CI. If e2e behaves like old code, a stale preview server is on 4173; stop it.
- **Phone screenshots:** Playwright scripts in the scratchpad import `file:///C:/Users/yuiho/projects/pulau_kata/node_modules/playwright/index.mjs`, using `devices['Pixel 7']`. To seed progress, write to IndexedDB DB `jelajah-kata`, store `progress`, key `chapter:<id>`, value `{ v: 1, data: ChapterProgress }`, **then reload** (a hash change doesn't reload progress).

## 4. Repository map (what's where)
```
CLAUDE.md                         rules, decisions, status (keep §10 up to date)
docs/jelajah-kata-technical-plan.md
docs/handoffs/                    task handoffs + Codex reviews (+ this file)
docs/music-brief.md               format/creative brief for Yang's keyboard music
docs/licences/README.md           rights record per asset type
content/tahun-3/
  track.json, image-prompts.json, postcard-prompts.json
  unit-0X/chapter.json            12 words each, reviewed:true (Yang approved 16 Nov)
  unit-0X/images/*.png            word pictures (Codex); WebP conversion is still to do
  unit-0X/postcard.png            Koleksi postcard
  unit-02/quest.json              Misi "Pengembaraan di Hutan" (reviewed:false, waiting for Yang)
  unit-02/quest-prompts.json, unit-02/quest/*.png   Misi art
apps/web/src/
  engine/       pure, seeded, unit-tested rules: questions, queue, scoring, progress (+misi),
                mastery, padankan, sampan, bina, quest, collection
  content/      schema.ts (Zod: Chapter, Track, Quest), validate.ts (checkChapter/Quest/Track),
                loader.ts (import.meta.glob; hides unreviewed in prod), audioPlan.ts (TTS plan)
  stages/       Kenali, Uji, Bina, CabaranAkhir (lazy), StageResult
  games/        Padankan, SampanKata (lazy; exports SampanGame), Misi (lazy)
  screens/      Home, ChapterScreen (+MisiCard), Koleksi
  audio/        settings (one 🔊 switch), music (MusicPlayer, Web Audio gain), speech, sfx (synth)
  api/          checkSentence.ts (browser client; personal-data screen; device id)
  storage/      ProgressStore (merge-on-save), IdbProgressStore, ProgressProvider
  app/          router (hash: #/, #/c/<id>, #/c/<id>/<stage>, #/lab/sampan|misi[/<id>], #/koleksi), flags (LAB_MODE)
  i18n/         en.json, zh.json (all UI strings; BM learning content stays in content/)
  assets/music/ (empty) web versions of Yang's music go here
workers/api/    Cloudflare Worker /api/check-sentence: mock checker (default) + Claude Haiku
                (claude-haiku-5-5) behind an adapter; Zod validation; personal-data screen;
                Durable Object rate limiter; wrangler.toml (not deployed; wrangler not installed)
scripts/        validate-content.ts, gen-audio.ts
apps/web/vite.config.ts   includes workerApi() plugin: serves /api from the Worker in dev/preview
apps/web/playwright.config.ts   builds with VITE_SHOW_UNREVIEWED + VITE_SHOW_LAB (staging-like)
```

## 5. Decisions already made (don't reopen without Yang)
- **Tahun 5 pilot (added 17 Nov 2026):** `content/tahun-5/`, draft (`reviewed:false`) until Yang approves; see `task-07c-tahun5-pilot.md`. The DBP textbook PDF in the repo root is a reference only, never copy its text or art.
- **Tahun 3 pilot.** Keep the textbook forms of simpulan bahasa (*ambil berat*, *ambil hati*); the AI accepts the formal forms too.
- **Images:** generated by the **Codex CLI**, one `codex exec -s workspace-write` per image from a prompts JSON.
  - **One family = one ethnicity.** Name Chinese/Indian Malaysian families explicitly in the prompt (Codex defaults to Malay).
  - The generator script in the scratchpad was `gen-quest.sh` / `gen-prompts.sh` (`PROMPTS=<file>`); recreate it if the scratchpad is gone.
- **Sampan Kata = Cabaran Akhir:** boat theme; no dying; 90 s round; adaptive speed; relaxed mode; at least 1 star.
- **Misi:** optional per unit, unlocked after Uji; BM lines with 🌐 tap-to-translate; Unit 2 waterfall/forest prototype. If Yang approves, write quests for Units 1 and 3 in the same format.
- **Sentence check:** mock by default. Claude Haiku once `AI_MODE=anthropic` and a key are set (`workers/api/.dev.vars` locally; `wrangler secret` when deployed). Never send personal data; never log the sentence.
- **Audio:**
  - **Read-aloud:** Azure Speech ms-MY (`ms-MY-YasminNeural`, `ms-MY-OsmanNeural`), pre-generated MP3s.
  - **Music:** composed and played by Yang on an arranger keyboard. On by default at low volume, ducks under speech, silent in Uji and Bina.
  - **Sound effects:** synthesized in code.
- **Default UI language: English.**
- **Content originality:** never copy the textbook. Unreviewed content (`reviewed:false`) must never ship to production (the loader hides it; `validate-content --strict` fails on it).

## 6. Waiting on Yang
1. **Listen through the Azure voices (done: generated 17 Nov 2026).** Yang created the Azure account (free account, Speech resource `jelajah-kata-speech`, Free F0, Southeast Asia, budget alert US$5/month) and `.env.local` holds the key (git-ignored; never ask for it in chat). `npm run gen-audio` created all 88 files (72 word/example files in `unit-0X/audio/`, 16 Misi lines in `unit-02/quest/audio/`, 2.1 MB). The 🔊 buttons now show on word cards, example sentences and Misi lines, and Uji's "listen and choose" questions are on. **Still to do:** Yang or a BM teacher listens through each unit. To fix a word, change its text or SSML in `content/audioPlan.ts` (or the voice/rate), then run `npm run gen-audio -- --force --only <chapterId>`, and restart the dev server. New content files need a dev-server restart.
2. **Music.** WAVs go in `assets-src/music/` (`music-home`, `music-misi`, `music-sampan`, `jingle-complete`, `jingle-star`; spec in `docs/music-brief.md`). Then:
   - cut a seamless loop from the doubled take (BPM and bars come from Yang);
   - normalise to about −16 to −18 LUFS;
   - encode MP3 (~96 kbps) into `apps/web/src/assets/music/` (install ffmpeg via winget if needed);
   - add a per-track record to `docs/licences/music.md`.
3. **Review the Misi BM text** in `content/tahun-3/unit-02/quest.json`. If approved, set `"reviewed": true`.
4. **Anthropic API key** for the real sentence check, for when Yang wants to test it.
5. **Later:** a Cloudflare account (deploy), PostHog and Sentry, a domain, the pilot families and price, a BM teacher reviewer.

## 7. Next tasks (CLAUDE.md §10 order, updated)
- **Task 8:** PWA offline (precache WebP/MP3; the runtime image cache already exists) + PostHog events (`chapter_started`, `stage_completed`, `chapter_completed`, `returned_next_day`). The EN/中文 toggle is done.
- **Task 9:** `optimise-images` (PNG → ~512px WebP, so the app can precache them) and `draft-chapter` (AI-assisted content draft). `gen-audio` is already built (task 7).
- **Task 10:** Cloudflare Pages + Worker deploy workflows (staging + production with manual approval). Install wrangler. The Worker needs its Durable Object binding (already in `wrangler.toml`).
- **Task 11:** Units 2–3 through the pipeline → staging UAT → production → pilot.
- **Possible extras Yang may ask for:** Misi quests for Units 1 and 3; the Jelajah Malaysia map linking the units; an "Arked" corner of mini-games.

## 8. Gotchas learned the hard way
- **The Edit tool turns `\u00a0` escapes into a literal NBSP**, which ESLint rejects (`no-irregular-whitespace`). Use `String.fromCharCode(160)`, or edit with sed byte patterns.
- **A JSX comment inside `{cond && ( ... )}`** makes two siblings and fails to parse. Put the comment outside the conditional.
- **Vitest + framer-motion:** an `AnimatePresence` exit never finishes in jsdom (leftover nodes), so avoid it in testable UI. Boat-game tests fake `requestAnimationFrame` / `performance` / timers explicitly.
- **Dynamic `import()` inside a test** can time out (5 s) once the content loader grows; use static imports.
- **e2e races:** wait for elements before `count()`. Use short `{ timeout }` on reads inside polling loops. Use relaxed mode for full boat rounds. Seed IndexedDB, then `reload()`.
- **Build output:** the bundler names the shared chunk after a module (currently `sfx-*.js`). It is really the content loader plus shared code; don't be misled.
- **Bina tiles keep their original case** (sentences can start with a name like "Ali").
- **Long BM words** (e.g. *menghadiahkan*, 13 letters) must never break mid-word. Buoys shrink the font; Misi options wrap to a new row.
- **Production hides `reviewed:false` content.** Playwright builds with `VITE_SHOW_UNREVIEWED=true` and `VITE_SHOW_LAB=true` (like staging), so the draft Misi is testable.

## 9. Memory
The persistent memory for this project is at `C:\Users\yuiho\.claude\projects\c--Users-yuiho-projects-pulau-kata\memory\`, with an index in `MEMORY.md`. Memories cover: handoff + Codex review, Codex image generation, action game, adventure Misi, and audio decisions. Keep it current.
