# Handoff: Task 6, Stage 3 Bina + check-sentence Worker (mock mode)

*17 Nov 2026 · Claude Code → reviewer (Codex)*

## Context
- `CLAUDE.md` §1: Bina is Pilih perkataan → Susun ayat → sentence frames (*Siapa + Buat apa + Di mana/Bila*) → Tulis sendiri (AI-checked).
- `CLAUDE.md` §7: the AI sentence check spec.
- `CLAUDE.md` §9: conventions (no secrets in code; never send personal data; gentle tone).
- `docs/jelajah-kata-technical-plan.md` §3.3: the check design and safeguards.
- The engine and screens follow tasks 3 to 5 (see `docs/handoffs/`).
- This is not a git repo, so the files are listed below.

## What was built

### Bina flow (`apps/web/`)
1. **Susun ayat**, 5 words per session (seeded).
   - The tiles come from `jumbled_sentence`; the child taps them into the sentence line, and taps a placed tile to remove it.
   - The answer is checked automatically when the last tile is placed. It compares tile text, not ids, and ignores case.
   - **Right:** "Betul!" plus the sentence with a capital letter and full stop, then it moves on by itself after 1.2 s.
   - **Wrong:** "Cuba lagi!" plus the right sentence, then **Continue**. The sentence comes back 3 items later, at most twice (the same retry queue as Uji).
   - **Hint** (once, first attempt only): locks the first word in place and counts as half a point. If the hint completes the sentence, it is checked then (the Uji bug, avoided from the start).
   - Tiles keep their original case. Some sentences start with a name ("Ali", "Hari Raya…"), so lowercasing the first tile would teach a wrong spelling.
2. **Pilih perkataan:** the child picks any chapter word not yet written about (picture, word, meaning).
3. **Tulis sendiri**, 2 sentences.
   - The screen shows the word, meaning, word class and audio, plus the frame card (Siapa? / Buat apa? / Di mana? / Bila?, with EN/中文 labels).
   - Starter chips (`STARTERS`: Saya, Kami, Ibu…, plus the target word) insert words into the sentence.
   - There is a textarea (`lang="ms"`, 200 characters max) and a **Check** button. The button is disabled for unchanged text.
   - **Up to 3 checks per word.** The result card shows "Betul!", "Hampir betul!" or "Cuba lagi!", the tip in the UI language, and an example sentence. **Next** is available after any check, so a child is never stuck.
   - **Points per word** = best `aiPoints` result (1, 0.5 or 0). When the check can't run (offline, limit reached, server error), the card shows the word's example sentence for self-comparison and counts 0.5.
4. **Stars:** `binaStars` = (Susun ayat points + writing points) / 7 → `completeStage('bina')`. The minimum is 1 star.

### Code
| File | What |
|---|---|
| `src/engine/bina.ts` (+ `bina.test.ts`) | `buildSusunSession` (never already solved), `checkSusun`, `susunHint`, `formatSentence`, `binaStars`, `STARTERS`, `BINA` constants. Tests cover every word of every chapter and 20 seeds |
| `src/stages/Bina.tsx` (+ `Bina.test.tsx`) | The stage. `check` is injectable for tests. Tests: perfect run → 3★ saved and only contract fields sent; wrong order; hint; try again/tries left/no re-check of the same text; unavailable fallback; starter chips |
| `src/api/checkSentence.ts` (+ test) | Browser client. Random install id in localStorage (`jk.device`) as `X-Device-Id`; 20 s timeout. Never throws: returns `ok`, `offline`, `rate_limited` or `unavailable`. Validates the response shape |
| `src/components/ui.tsx` | `Ask` and `ProgressBar` moved here from Uji (shared) |
| `src/App.tsx`, `screens/ChapterScreen.tsx` | Bina route; `PLAYABLE` includes `bina` |
| `src/i18n/*.json` | `bina.*` |
| `vite.config.ts` | `workerApi()` plugin: serves `/api/*` from the Worker's `handleRequest` in `vite dev` and `vite preview`, so `npm run dev` runs everything with no wrangler. Env comes from `workers/api/.dev.vars` if present (git-ignored), otherwise mock |
| `tests/e2e/smoke.spec.ts` | Full flow Kenali → Padankan → Uji → Bina (5 sentences + 2 own sentences through the real handler, mock AI) → 3★; API rejects an extra field (`childName`) with 400 |

### Worker (`workers/api/`, new workspace)
| File | What |
|---|---|
| `src/types.ts` | Contract types only, imported by the web app with `import type` |
| `src/validate.ts` | Zod: strict request (no extra fields; word ≤60; sentence 1–200 after trim; class enum; year 1–6; lang en/zh); `sanitiseResponse` caps the tip and the example sentence |
| `src/checkers/checker.ts` | `SentenceChecker` adapter interface; neutral BM redirect ("Cuba tulis ayat menggunakan perkataan ini") |
| `src/checkers/mock.ts` | Deterministic, no key. Uses target word (phrase tokens in order; affixed forms like *mengambil berat*; one-letter slips for words of 5+ letters), at least 3 words, capital + end punctuation → correct / almost / try_again with EN/中文 tips |
| `src/checkers/anthropic.ts` | `@anthropic-ai/sdk` `messages.parse` with `zodOutputFormat`, model `claude-haiku-5-5` (CLAUDE.md names Haiku; override with `AI_MODEL`), effort `medium`, `max_tokens` 4000, timeout 15 s, 1 retry. Fixed system prompt holding the judging rules from §7. The sentence goes in the user turn inside `<sentence>`, with `<` and `>` escaped so it can't close the tag. The model also returns `off_topic`; if true, or if `stop_reason` is `refusal`, we return the neutral redirect ourselves. Unparsed output → error → 503 |
| `src/rateLimit.ts` | Daily limits, per device (20) and per IP (300). KV (`RATE_LIMIT_KV`) if bound, otherwise in memory |
| `src/index.ts` | `handleRequest`: path/method checks; device id format; 2 KB body cap; JSON + schema validation; limits; check; sanitise; JSON with `no-store`. CORS only for `ALLOWED_ORIGINS`. `AI_MODE=anthropic` without a key → 503 (fails closed; never a silent mock). Logs result, word, year and length only, **never the sentence or ids** |
| `src/api.test.ts` | 28 tests: mock rules, all 400 cases, 404/405, device and IP limits, misconfiguration 503, checker failure 503, log contains no sentence or device id, string caps, CORS, Anthropic adapter with a fake client (prompt shape, tag escaping, off-topic/refusal redirect, correct drops the example sentence, unparsed → error) |
| `wrangler.toml`, `.dev.vars.example` | Mock by default; staging/production set `AI_MODE=anthropic` (key via `wrangler secret`). KV binding commented until Yang has a Cloudflare account. wrangler itself is not installed yet (task 10) |

Root `package.json`: `test` and `typecheck` now include `workers/api`, so CI runs them.

## Verified
- lint, format, typecheck (web, Worker, scripts).
- 109 web + 28 Worker unit tests; validate-content; build: main bundle 142.9 KB gzip (+4 KB). The Worker, Zod and the SDK are not in the web bundle.
- e2e 10/10 (desktop + Pixel 7).
- Phone screenshots of Susun ayat, Pilih perkataan and Tulis sendiri with an "almost" verdict.
- The real Anthropic path is **not** exercised against the live API (no key yet). It is covered by the fake-client tests only.

## Decisions worth challenging
1. **Tap to place, not drag** (CLAUDE.md lists dnd-kit). It's the same interaction as Susun huruf, works one-handed and with screen readers, and adds no bundle size. Dragging could come later.
2. **Only the textbook order is accepted** in Susun ayat. Some sentences have other valid orders (e.g. a time phrase moved to the front).
3. **The sentence frame is a guide card plus starter chips**, not a structured fill-in, because the content has no per-word frame data. Every word class gets the same frame.
4. **When the check is unavailable, 0.5 points and the example sentence**, so a child is never blocked; this is also how the stage works offline.
5. **Rate limits count failed checks too**, and use KV (eventually consistent).
6. **Device id in localStorage**, random and not personal; clearing storage resets the limit, hence the IP cap.
7. **Haiku 5.5 at effort `medium`**, and an `off_topic` flag in the model schema instead of trusting the model to write the redirect itself.
8. **Bina is not lazy-loaded** (+4 KB to the main bundle).

## What I'd like from the review
- **Security and privacy:** the prompt-injection handling, anything personal reaching logs or the model, validation gaps, CORS, rate-limit bypasses, secrets.
- **Correctness:** the Susun state and hint, the write attempts/points/fallback logic, the "Next" vs "Finish" count, replay, stale state across words.
- **For a 9-year-old:** fairness and kindness of the mock and prompt rules (BM grammar judged at Tahun 3), plus i18n and accessibility (focus, live regions, labels).
- **Tests:** weak spots.

Rank by severity, cite `file:line`, give a failure scenario, and keep it concise.

## Review outcome (Codex review: `task-06-bina.review.md`)
All 5 findings were valid and are fixed. Regression tests are marked "task-06 review #n".

| # | Finding | Fix |
|---|---|---|
| 1 | High: personal data (phone, email, full name) could reach the AI; `off_topic` only acted afterwards | New `workers/api/src/personal.ts` screens for email, 7+ digit runs (phone, IC number), links and @handles. It runs **in the browser** (`checkSentence` returns `personal_data`, nothing is sent, no try used, the child edits and checks again) and **again in the Worker** before the limiter and the checker (a modified client gets a `try_again` tip; the checker is never called). **Limit:** names can't be screened, since BM sentences use names normally ("Ali membela kucing."). Mitigations: the sentence is never logged, only the target word and sentence go to the model, and nothing ties a request to a child |
| 2 | Medium: KV limiter breaks with concurrent pupils on one IP (1 write/s/key; lost increments; exceptions not handled) | Replaced with a **Durable Object** counter (`RateLimitCounter`, one per day+key, serial so atomic, deletes itself after 2 days; `wrangler.toml` binding + migration). Limiter errors fail closed → 503 (the app shows the example sentence; the child carries on). Tests: 30 concurrent takes on one key → exactly 20 allowed; per-key/per-day isolation; limiter error → 503 with no AI call |
| 3 | Medium: body cap applied after buffering the whole body | `readLimited` rejects on `Content-Length`, otherwise streams and cancels once over 2 KB → 413. Test: a streamed 1 MB body stops after under 10 chunks |
| 4 | Medium: editing during a pending check could lock unchecked text as "correct" | The textarea is read-only and the starter chips are disabled while checking. Test with a deferred response |
| 5 | Low: mock rejected valid short sentences ("Saya bangga.") | The rule is now "more than the word itself" instead of 3 words |

Re-run: lint, format, typecheck, 112 web + 37 Worker unit tests, content validation, build (main 143.3 KB gzip), e2e 10/10.
