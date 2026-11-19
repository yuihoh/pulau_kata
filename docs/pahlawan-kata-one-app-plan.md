# Plan v2: one app, built on Pahlawan Kata, reusing Jelajah Kata

*19 Nov 2026 · Claude Code → Yang · Draft for Codex review, then Yang's review*

**What changed since v1**
- **v1** (`docs/tahun-4-pahlawan-kata-integration-plan.v1.md`, Codex review `….v1.review.md`) kept Jelajah Kata as the product and borrowed parts of Pahlawan Kata.
- **Yang's direction (19 Nov 2026):**
  - **one app, with Pahlawan Kata as the main idea**, reusing the components of Jelajah Kata;
  - **eventually every Tahun**, rollout to be proposed;
  - **lives can grow with the player's level**, with a check on whether that contradicts other game rules (§5).
- **Carried over from v1:** the technical fixes from the v1 Codex review (mastery log, stage migration, adapters, schema details).

**Naming used below**
- **PK** is Pahlawan Kata (词语勇士): the design in `pahlawan-kata/` (`docs/design-v0.3.md`, `docs/art-assets-and-prompts.md`, `data/`, 21 prototype screens).
- **JK** is Jelajah Kata: the code, content and pipeline in this repo.

---

## 0. Summary

1. **One product, one code base.** The app in `apps/web` **becomes Pahlawan Kata**. It is not rewritten from zero, and there is no second app.
   - PK's own suggested stack is the same as JK's: React + TypeScript + Vite PWA, i18next, Supabase later.
   - **Almost all of JK's non-screen code carries over** unchanged or with small changes (§6):
     - the pure engines;
     - the content schema, validation and loader;
     - the AI sentence-check Worker;
     - the audio, image and voice pipelines;
     - offline/PWA, CI and tests.
   - The rest is restyled or replaced by PK screens (§6).
2. **PK's design becomes the main design document.** JK decisions that PK changes are listed in §3 for Yang to confirm, because CLAUDE.md says decided items are only re-opened by Yang.
3. **All Tahun, one world per Tahun** (PK: "Tahun 5 and 6 are new worlds").
   - One hero per child, who keeps their level and wardrobe across worlds.
   - **Build the RPG once with Tahun 4 Tema 1** (the best-prepared data: checked against the textbook), then **port Tahun 3 and 5 Tema 1** (72 words, pictures and voices already made).
   - Then add Tema 2–8, one Tema at a time per Tahun (§4).
4. **Lives that grow with level fit PK** (it is already PK's *Vitality* stat). The plan found **six contradictions** with other rules, and Yang has agreed how to resolve each (§5.2):
   - **at 0 lives, the child redoes the missed word** (after a quick look at its card) and carries on; there is no game over;
   - **starting lives depend on the difficulty** (Initiate 5, Knight 4, Legend 3); levels (Vitality, up to +3) and armour add more, up to **8 for everyone**;
   - **lives can't stack forever**: a cap, potions only heal, hearts left become the reward;
   - **stronger Tema Bosses** with special moves;
   - **fair timers**;
   - **saved Boss phases**;
   - **stars shown apart from hearts**.
5. **Cost.** This is a much bigger build than finishing the JK pilot:
   - about **20 tasks** before an RPG pilot is ready (§13, after the review split some tasks), against about 3 for the JK pilot;
   - plus about **70 new art images** for the minimum game, and **about 300 files** for PK's full art list.

   §13 suggests running a **small JK content pilot in parallel** (tasks 8, 10 and 11 are needed by the RPG anyway). Yang decides.

---

## 1. PK in brief

- **Structure:**
  - world = Tahun;
  - kingdom = Tema (8);
  - region = unit (3 per Tema), with four steps: Kenal Kata → Kuiz → Tatabahasa → Bina Ayat;
  - each unit has an optional Seni Bahasa "secret realm";
  - each Tema ends with the textbook's **4P**: Pemulihan (remedial), Pengukuhan (practice), Penilaian (Tema Boss, 3 phases) and Pengayaan (challenge).
- **Three difficulty levels:**

  | Level | Words per unit | Time per question |
  |---|---|---|
  | Initiate | 12 (pack A) | 20 s |
  | Knight | 24 (packs A + B) | 15 s |
  | Legend | 36 (packs A + B + C) | 12 s |

  Pack C holds word families (imbuhan), peribahasa and synonyms or antonyms.
- **Battle:**
  - a 10-question round per pack;
  - 3 base lives;
  - timer, hints, pause, shield and potions;
  - monsters per Tema and a Tema Boss.
- **Growth:**
  - XP and levels 1–30;
  - one stat point per level, spent on:

    | Stat | Gain | Cap |
    |---|---|---|
    | Vitality | +1 life per 5 points | +3 lives |
    | Focus | +1 s per point | +10 s |
    | Wisdom | +1 hint per 4 points | +3 hints |

  - four weapons: sword and staff at the start, bow at level 5, hammer at level 10;
  - six gear slots × four rarities;
  - chests, coins and a shop (no real money);
  - a wardrobe with a "looks only" switch;
  - ranks (bronze, silver, gold) earned by finishing a Tema at a level.
- **Learning-first rules:**
  - gear never reduces the number of questions;
  - an answer that needed a hint is marked "review" and doesn't count as mastered;
  - Leitner review in 5 boxes;
  - XP limits against farming (full XP for the first 3 runs per day, half after that; due and weak words always full).
- **Also:**
  - a placement test;
  - parent accounts and a parent panel;
  - "school is teaching Tema N" doubles XP for that Tema;
  - 中文 or EN per child, with an option to show both.

## 2. What I checked against the Tahun 4 textbook

| Claim in PK | Result |
|---|---|
| 8 Tema × 3 units, page ranges | Matches the contents page (PDF page 3) |
| One grammar point per unit (24) | All 24 found on the unit pages |
| 189 sample words appear in their unit | 189 of 189 |
| 4P at the end of each Tema | *Pemulihan*, *Pengukuhan*, *Pengayaan*: 10 mentions each, so present for every Tema |
| *Celik Bahasa* grammar boxes | 21 mentions |

`vocab_candidates/*.csv` come from a rough stemmer: a shortlist for a human, not a word list.

**For the other Tahun:**
- **Tahun 3 and 5:** confirm that their textbooks also have 8 Tema × 3 units + 4P + a grammar point per unit before porting the full year. This is likely (the same KSSR Semakan 2017 design), but each book must be checked (T-port in §13).
- **Tahun 6:** no textbook is in the repo yet.

## 3. JK decisions that PK changes (Yang to confirm)

| # | Topic | JK decision (CLAUDE.md) | PK design | Proposal |
|---|---|---|---|---|
| D1 | Product and name | Jelajah Kata (working title), stages Kenali / Uji / Bina / Cabaran | Pahlawan Kata RPG | **PK.** Rename the app; keep BM stage names where they match (Kenal Kata, Kuiz, Tatabahasa, Bina Ayat) |
| D2 | Words per unit | 8–12 | 12 / 24 / 36 by level | **PK.** Tahun 3/5's existing 12 words become pack A; pack B added per unit; pack C after the pilot |
| D3 | Failure | "Cuba lagi!", never a harsh fail screen; Sampan "no dying" | Lives (HP), monsters counter-attack | **Agreed (Yang, 19 Nov):** PK lives with the §5.2 rules. At 0 lives, the child redoes the missed word and carries on; no game over |
| D4 | Timers | Only in Cabaran (relaxed mode) | Every question 20 / 15 / 12 s | **Agreed (Yang, 19 Nov):** PK timers with the §5.2 fairness rules (no life lost to a timeout at Initiate, more time for long prompts, timer after audio, 1.5× parent setting) |
| D5 | Final challenge | Cabaran Akhir = Sampan Kata (Yang, 17 Nov) | 4P finale + Tema Boss | **PK finale.** Sampan Kata becomes the **Pengayaan** challenge (timed race), so it is kept |
| D6 | Misi story quests | Optional per unit after Uji (Yang, 17 Nov) | Seni Bahasa secret realm | Keep Misi as an occasional **side quest** in a kingdom (content-heavy, not every unit); Seni Bahasa is the regular optional realm |
| D7 | Mascot | Hornbill guide, 8 poses (Yang, 18 Nov) | NPC friend per Tema; a hornbill exists only as a pet | **Hornbill = the hero's companion**: gives hints, revives at 0 lives (§5), cheers. Restyled to PK's line style later. NPCs speak in each kingdom |
| D8 | Art style | Flat cartoon word pictures; Fredoka | Chibi, navy outlines, own palette; Baloo 2 + ZCOOL KuaiLe + Noto Sans SC | **PK style for game art** (heroes, monsters, UI). **Keep the existing word-picture style** for word cards (72 already made, plus 3 postcards; they are neutral illustrations). Fonts: §6.5 (Chinese fonts are large) |
| D9 | Accounts | No login in P1; parents in P2 | Parent login + child profiles in the MVP | **Local child profiles on the device in the pilot**: no login, and profiles and progress stay on the device. The network services are separate and unchanged: the AI sentence check sends only the sentence (personal-data screen in the browser and the Worker), and analytics (task 8) sends anonymous events. Parent accounts in P2 as planned |
| D10 | Default language | English, remembered | Chosen per child; suggested from the phone's language | **PK**: suggest from the device language, chosen per child |
| D11 | Mini-games (G-4) | Tangkap Buah, Pecah Belon to become Uji rounds | Battle quiz | Mini-games become **battle "attack" styles** and Pengukuhan practice (§6.3) |
| D12 | Pricing | One payment per Tahun, Tema 1 free | No real money for gear or looks | Both hold; nothing to change |

## 4. All Tahun: how to roll out

**One app, one hero, one world per Tahun**
- The hero (looks, level, XP, gear, wardrobe, ranks) belongs to the child and **carries across Tahun**.
- Each Tahun is a **world** with its own map (8 kingdoms), words, grammar, Bosses and Tema sets.
- Word mastery and stage progress are kept **per Tahun** (word ids are only unique within a track).
- Payment stays **per Tahun** (D12). Tema 1 of every world is free.

**Order**

| Wave | Content | Why |
|---|---|---|
| 1 | **Tahun 4, Tema 1** (3 units, packs A + B = 24 words per unit) | PK's data is ready and checked; builds and tests every RPG system once |
| 2 | **Tahun 3 and 5, Tema 1** ported (pack A exists; add pack B + grammar blocks) | Reuses 72 words, pictures and 144 voice clips; pilot families with any of the three years can play |
| 3 | **RPG pilot** with waves 1–2 | Tests the RPG with children |
| 4 | **The first paid Tahun**, all 8 Tema, one Tema per task | Which Tahun is paid first is a pricing decision (delivery plan) |
| 5 | The other Tahun, Tahun 6, then pack C (Legend) per Tahun | After the pilot shows what children use |

Each world reuses every system. A new Tahun is **content + art for its Tema** (monsters, Boss, set, map region), not code.

## 5. Lives that grow with level: does it contradict other rules?

**Yang's idea is already in PK.** One stat point per level; *Vitality* gives +1 life per 5 points, up to +3. So a child who puts points into Vitality goes from 3 lives to 6 by about level 16. Lives also come from armour (gear), life potions, the revive amulet, the shield, and the hammer's starting shield.

### 5.1 What contradicts

| # | Contradiction | Against which rule | How serious |
|---|---|---|---|
| C1 | **PK never says what happens at 0 lives.** If the battle ends, the child answers fewer than 10 questions | PK's own "gear never reduces the number of questions" (learning first); JK's "never a harsh fail screen" and the retry queue (wrong words come back later in the round, which can't happen if the round ends); Sampan "no dying" | **High**: the rule must be defined before any battle code |
| C2 | **Beginners get the fewest lives.** Lives grow with level, and level grows with XP. A struggling child answers fewer correctly, earns less XP (and Legend earns ×2), so stays at 3 lives longest | Kid-friendly tone; "Initiate children can still get 3 stars" (PK §5.3) | **High** if 0 lives ends the battle; **Low** with the rule below |
| C3 | **Lives stack until they mean nothing.** Vitality +3, armour, potions, the amulet, the shield and the hammer together make a high-level child impossible to knock down | Balance; potions bought with coins reward grinding | Medium: needs a cap |
| C4 | **Timeouts.** PK doesn't say if running out of time costs a life. If it does, slow readers lose lives for reading speed (the bow exists for them) | Fairness; learning first | Medium |
| C5 | **The Boss has 3 phases.** Do lives carry over between phases? Undefined | — | Low: define it |
| C6 | **Stars vs lives.** If stars depended on lives left, a child with more levels (more lives) would get stars more easily for the same answers | PK §5: stars measure accuracy and are "the same across levels" | Low: keep stars from accuracy only |

**No contradiction with:**
- the hint rule (a hinted answer isn't mastered);
- XP anti-farming;
- pricing (no real money for lives or potions);
- privacy.

### 5.2 Agreed rules (Yang, 19 Nov 2026)

Yang chose these after reading the six contradictions. The rule for 0 lives is Yang's own idea.

**How many lives (C2, C3)**

| Difficulty | Starting lives | Vitality (from levels) | Armour | Maximum |
|---|---|---|---|---|
| Initiate | 5 | up to +3 | — (already at 8 with full Vitality) | **8** |
| Knight | 4 | up to +3 | up to +1 to reach 8 | **8** |
| Legend | 3 | up to +3 | up to +2 to reach 8 | **8** |

**The cap is 8 lives for everyone** (Yang, 19 Nov 2026).

- **Starting lives depend on the difficulty the child chose,** not on the hero's level. A child who finds it hard picks Initiate and has the most lives from the first battle (C2).
- **Lives still grow with level:** Vitality gives +1 per 5 points, up to +3 (PK as written).
- **Armour fills the rest up to 8:**
  - common and rare armour give +1 life; epic and legendary give +2;
  - lives above 8 are ignored;
  - the wardrobe shows "maximum lives reached" so a child understands why a better armour adds nothing. Its value then is its look and rarity; it carries no other hidden stat.
- **Potions heal up to 8, never past it.** The hammer's and shield's blocks stop one hit; they are not extra lives.
- **Why a cap of 8 is still a challenge (C3):**
  - a fully built Legend hero has 8 lives, but the Tema Boss takes **2 per wrong answer** at Knight and Legend, so 8 lives are 4 Boss mistakes;
  - the heart rewards (below) still reward keeping them.
- **XP for finishing a battle** (participation XP, under the same daily anti-farming limits), not only for correct answers. A struggling child still levels up steadily (C2).

**What costs a life**
- A **wrong answer** costs 1 life, and the question comes back later in the round (retry queue).
- A **timeout** counts as a wrong answer, but **costs no life at Initiate** (C4).
- In a **Tema Boss at Knight and Legend**, a wrong answer costs **2 lives** (C3).

**At 0 lives: redo the missed word (C1, Yang's rule)**
1. The hero is knocked down; the hornbill helps them up.
2. **Ulang kaji sekejap:** the missed word's card shows for a few seconds (picture, meaning, audio).
3. **The child answers that same question again straight away.** Earlier progress in the battle is kept; nothing restarts from question 1.
4. **If missed again,** the hornbill points to the right answer and the child taps it to carry on. A child is never stuck on a word they don't know. The word is marked weak, so daily review brings it back.
5. **Lives refill to the hero's own maximum** (starting lives + Vitality + armour, at most 8), and the battle continues with the next question.
6. **The only cost:** the battle loses its "no damage" and "hearts left" rewards (below). Stars, mastery, unlocking and the number of questions are never affected.

**Lives left become the reward (C3)**
- Each heart left at the end gives **bonus coins**. Finishing with **all of your hearts** (your own maximum, not 8) gives a **better chest** (one tier up). A child with 5 hearts who keeps all 5 earns it just like a child with 8.
- **Both only count if the hero was never knocked down** in that battle, so the refill at 0 lives can't be used to win more hearts.

**A stronger Tema Boss (C3)**
- A wrong answer costs 2 lives at Knight and Legend (above).
- **Each Boss has one special move that changes how a question is shown, never how hard the word is.** Examples:
  - Raja Aedes shuffles the options after 3 seconds;
  - Robot Karat swaps two options once;
  - Hantu Boros covers one option with coins until tapped.
- The moves are stored with the Boss in the track data (`boss.move`) and run at Knight and Legend. At Initiate the Boss only does a harmless animation.
- A move must never hide the question text, the audio or the hint button (accessibility).

**Timers that are fair to slow readers (C4)**
- **Base time** per question: 20 s / 15 s / 12 s by difficulty, plus the Focus stat and the bow (PK).
- **Long prompts get more time:** +0.5 s for each word beyond 6 in the prompt sentence.
- **On listening questions,** the timer **starts when the audio has finished**.
- **At 5 s left** the bar changes colour and a soft tick plays (no alarm sound).
- **A parent setting gives 1.5× time** (for slow readers and children with special needs).
- **The pause item** still works as in PK.

**Boss phases (C5)**
- Lives **carry over** across the 3 phases (words → grammar → sentences).
- **A break screen between phases:** the hornbill restores **1 life** (up to the hero's maximum, at most 8) and says what comes next.
- **Each phase is saved.** A child who leaves the app mid-Boss continues from the start of the phase they reached.
- The Boss health bar is shown **in 3 parts**, one per phase.

**Stars and hearts are shown separately (C6)**
- **Stars come from accuracy only,** with the same thresholds at every difficulty (90% / 60%; first-try correct without hint = 1, with hint = 0.5).
- **The result screen shows two separate rows:**
  - ★ **stars**: how well you knew the words;
  - ❤ **hearts left**: the bonus.

  This shows children and parents that an easier difficulty doesn't make stars harder or easier to get.

### 5.3 Exact battle rules (built and unit-tested in R3, before any battle screen)

- **A battle has 10 original questions.** Retries are not new questions.
  - A wrong answer (or a timeout) sends the question back into the retry queue, at most **2 more times** (as `queue.ts` does today).
  - **The knock-down redo uses one of those retries:** it is asked at once instead of later.
  - If the redo is missed, the "hornbill shows the answer" step **solves the question with help**: it is recorded as `assisted: 'shown'`, it does not count toward stars or mastery, and the word becomes weak.
  - After the last try, any question still unsolved is retired and its word is marked weak.
- **When the battle ends:** when the queue is empty, never earlier.
- **Monster HP:** equals the number of original questions.
  - Each question solved (on any try, with or without help) does 1 damage.
  - If questions were retired unsolved, the **companion lands the final blow**, so the monster is always beaten when the queue empties.
- **Penalties:** a battle loses its heart rewards at the first knock-down; later knock-downs refill lives with no further cost.
- **Rewards** (values in `economy.ts`, unit-tested, tunable after the pilot):

  | Reward | Value | Condition |
  |---|---|---|
  | Participation XP | +20 | per finished battle |
  | No-damage bonus | +20% XP | no life lost |
  | Heart coins | +2 coins per heart left (at most 16 with 8 hearts) | never knocked down |
  | Full-hearts chest | one tier up | HP at the end equals the hero's own maximum; chest tiers common → rare → epic → legendary, capped at legendary |

- **Boss:**
  - lives carry across phases, with +1 at each break;
  - wrong = −2 lives at Knight/Legend;
  - progress is saved per phase;
  - a knock-down follows the same redo rule.

### 5.4 Edge cases (from the Codex check of §5, 19 Nov 2026)

These make the agreed rules exact enough to write as pure, unit-tested functions. None of them changes what Yang agreed.

**1. The redo when a question has no retries left**
- The knock-down redo is a **recovery attempt outside the retry queue**. It is always allowed, even when the question's 2 retries are used up.
- It **settles the question** either way:
  - solved on the redo: the question is solved (not first try, so no star point);
  - missed: the answer is shown and the question is solved with help.
- **During recovery** there is no timer and no damage. The child can't be knocked down again on the same question.

**2. HP and the revive amulet**
- Each hit is resolved once, and **HP is clamped at 0** (a Boss's −2 from 1 HP gives 0). Recovery starts when HP ≤ 0.
- **The amulet acts first.** If the hero would reach 0 and wears a revive amulet with a charge (1 charge per battle):
  - the amulet restores **2 lives**;
  - there is **no knock-down and no redo**;
  - the heart rewards are kept;
  - the no-damage bonus is lost (damage was taken).
- With no amulet charge, the hornbill recovery (§5.2) happens.

**3. What a Boss battle is**
- **One battle in three phases,** with one battle id:

  | Phase | Original questions |
  |---|---|
  | 1 Words | 10 vocabulary |
  | 2 Grammar | 6 |
  | 3 Sentences | 3 tile sentences + 1 free sentence (AI-checked) |

  That makes **20 original questions**.
- **Each phase has its own retry queue.** The **hero's HP carries across the whole battle**.
- The Boss health bar has 3 parts sized by each phase's original questions.
- **Rewards are settled once, at the end of phase 3:**
  - participation XP once;
  - stars over all 20 originals with `pointsFor`/`quizStars`, counting zero-point originals;
  - heart coins and chest from the HP left then.

**4. Saving a Boss between phases**
- At the end of each phase, **one atomic checkpoint** is saved. It contains:
  - the battle id and the phase reached;
  - **HP at the start of the next phase**, after the break heal, plus a flag that the heal was applied, so leaving and coming back can't heal twice;
  - the reward flags (knocked down, damage taken);
  - the results of completed phases (question ids and points);
  - the question ids chosen for the remaining phases.
- **Leaving mid-phase:**
  - the answers given in that phase **stay as answer events** (they are real evidence for mastery), but the phase's score restarts from its beginning on resume;
  - items used during it **stay used** (each use is its own event);
  - HP returns to the checkpoint value.

**5. Recovery for each kind of question**

| Question kind | "Quick look" before the redo | If the redo is missed |
|---|---|---|
| Vocabulary | The word's card (picture, meaning, audio) | The hornbill points to the right option; tap it |
| Grammar | The question's rule (`explain`) with one example | The hornbill points to the right option or bin; tap it |
| Tile sentence | The correct sentence shown for 3 s | The tiles snap into place one by one; tap "Faham!" |
| Free sentence (AI-checked) | — | — |

- **AI-checked sentences never cost lives.** The check is a judgement, not a right/wrong key, so it only affects stars (as today: correct 1, almost 0.5).
- **Answer events** get `kind: 'vocab' | 'grammar' | 'sentence'`, and `wordIds` becomes an optional list. A sentence can involve several words or none. Only vocabulary first attempts move Leitner boxes (§8.2).

**6. The XP formula** (values in `economy.ts`, tunable)

**Per-answer XP:**

| Answer | XP |
|---|---|
| Correct on the first attempt | 10 |
| ... and without a hint | +5 |
| Correct on a retry or a redo | 5 |
| Answer shown by the hornbill | 0 |
| From the 3rd correct in a row | +2 each |

**Anti-farming (PK):**
- The counter key is **profile + step + difficulty + local day**.
- From the 4th run of the same step that day, each answer's XP is **halved, except answers on words that were due or weak** at the start of the battle (always full).
- Participation XP and heart coins are also halved from the 4th run.

**Order of calculation:**
1. Add the per-answer XP (after the farming factor) and the participation XP (+20, after the farming factor).
2. × difficulty (1 / 1.5 / 2).
3. × school Tema (×2 if a parent marked this Tema).
4. × 1.2 if no damage was taken.
5. **Round down** once, at the end.

**7. Timer life cycle**
- **Listening questions:** the countdown starts when the audio **ends, fails or is skipped**, or after **8 s**, whichever comes first. So a failed audio never leaves the timer stopped.
- **Replaying the audio pauses the timer** while it plays.
- **Every retry gets the full time again.**
- **The pause item** freezes the timer for 10 s.
- **No timer** during knock-down recovery, break screens or the Boss's move animation.

**8. When Boss moves can happen**
- **Which questions:** each move lists the question kinds it works on:
  - `shuffle_options` and `cover_option`: multiple-choice only;
  - `swap_options`: multiple-choice only. This replaces "hide the picture" as Robot Karat's move, because at Knight and Legend questions have no picture to hide.
- **On other kinds** (typing, tiles, free sentence) the move falls back to a harmless animation.
- **How often:** at most **once every 3 questions**, never on a retry, a redo or the first question of a phase.
- **Answers are checked by option id, not by position,** so moving options can't change which answer is right.

**Effect:** lives keep PK's excitement (protect your hearts for coins and a better chest; Bosses hit harder and play tricks) with no fail screen, no learning cut short, the most lives for the children who need them, and no way to stack lives into invincibility.

## 6. What happens to each part of JK

Legend:
- **Keep**: unchanged, or only small changes.
- **Adapt**: the logic stays, with a new look or new inputs.
- **Replace**: a PK screen replaces it; parts are reused.
- **Retire**: removed when the PK screen exists.

### 6.1 Pure engine (`apps/web/src/engine/`, unit-tested)

| Module | Disposition | In PK |
|---|---|---|
| `rng.ts` | Keep | Seeded randomness everywhere |
| `queue.ts` (retry queue) | Keep | Wrong answers return later in a battle |
| `scoring.ts` (stars) | Keep | PK stars use the same idea (percent of accuracy) |
| `questions.ts` (picture→word, word→meaning, listen, blank, unscramble, hints) | **Adapt** | Kuiz battle questions. **PK's language rule: answer options are always BM.** Today's `word-meaning` question shows the BM word and asks for the EN/中文 meaning (`questions.ts:150`, `Uji.tsx:267`); it is **replaced by meaning→BM word** ("Which word means *clean*?" with 4 BM options), with matching hints and feedback. Also: question choice by level (Initiate with picture, Knight without, Legend spelling/typing); a "typing" answer type |
| `mastery.ts` (Leitner) | **Adapt** | PK's hint rule with a **separate review flag** (below) + the answer-event log (§8.2). Feeds daily review, Pemulihan and the parent panel |
| `progress.ts` (stages, unlocking, merge) | **Adapt** | Stage ids → PK steps; per-chapter required stages (Tatabahasa only with grammar content); record v2 migration (v1 review finding #2) |
| `padankan.ts` | Keep | A memory-match round in Kenal Kata, or Pengukuhan practice |
| `bina.ts` (tiles) | **Adapt** | Bina Ayat (Initiate tiles), grammar `transform`; must accept a given sentence (v1 review #5) |
| `tangkap.ts`, `belon.ts` | **Adapt** | Battle attack styles and grammar `choose` / `classify` (question adapters, per-answer hook, no time cut-off in battles; v1 review #5) |
| `sampan.ts` | Keep | Pengayaan challenge (timed race) |
| `quest.ts` (Misi) | Keep | Side quests (D6) |
| `collection.ts` (postcards) | **Adapt** | Its pure "rewards derived from progress" logic is kept and extended to the badge wall, kingdom completion and set collection |
| *new* `battle.ts` | New | Lives, timer, hints, pause, shield, items, §5 rules, monster HP |
| *new* `hero.ts` | New | XP, levels 1–30, stat points, the derived lives / time / hints with caps |
| *new* `loot.ts`, `inventory.ts` | New | Chests by tier, gear and rarity, equipped slots, loadouts, "looks only" |
| *new* `economy.ts` | New | Coins, shop prices, XP anti-farming, the school-Tema ×2 |
| *new* `difficulty.ts` | New | Packs per level, placement test → suggested level, rank awards |
| *new* `finale.ts` | New | 4P: Pemulihan (≥ 5 weak words), Pengukuhan, Boss phases, Pengayaan; unlock after 3 units |
| *new* `grammar.ts` | New | Grammar sessions from the chapter's grammar block |

### 6.2 Content, data and services

| Part | Disposition | Notes |
|---|---|---|
| `content/schema.ts`, `validate.ts`, `scripts/validate-content.ts` | **Adapt** | Add `pack`, `root`, `grammar`, `seni`, track `kingdom`/`boss` (all optional, so existing chapters stay valid). Rules: §8.1 |
| `content/loader.ts` | **Adapt** | Load per world; packs by level; hide unreviewed content in production (kept) |
| `content/tahun-3`, `content/tahun-5` (6 chapters, 72 words, Misi quest) | Keep | Pack A of Tema 1 for Tahun 3/5 (wave 2) |
| `content/audioPlan.ts`, `scripts/gen-audio.ts` (Azure ms-MY) | Keep | Add pack B words and grammar sentences to the plan |
| `scripts/optimise-images.ts` | **Adapt** | Today it scans only `content/` and resizes to at most 512 px. Needed for PK art: **sizes per asset type** (layers keep the full 1024 × 1024 canvas, never trimmed, so they stay aligned with the base; icons 512; Boss 1536; backgrounds 1080 × 1350); the art folders and catalogue paths; the background removal now done by the Python scripts |
| `scripts/*-to-webp.py` (mascot, home art) | Retire later | Only after `optimise-images` covers background removal, the "clear" points and their output paths |
| `workers/api` (sentence check: mock + Claude Haiku, personal-data screen, rate limits) | **Keep** | Bina Ayat at Legend (PK planned it for v2; it already exists) |
| `api/checkSentence.ts` | Keep | |
| `storage/` (`ProgressStore`, IndexedDB, provider) | **Adapt** | Profiles, hero state, inventory, mastery log, world progress (§8.2). The interface stays so P2 Supabase sync is an addition |
| `audio/` (one sound switch, music player, sound effects, speech) | Keep | Battle sounds added to `sfx.ts` |
| `i18n/` (EN / 中文) | Keep | Strings rewritten for the PK screens. Add "show both" meanings |
| `app/router.ts`, `app/flags.ts` | Adapt | New routes per PK screen |
| PWA (`vite.config.ts`) | **Adapt** | Today the service worker precaches every matching media file, so every world's pictures and voices would be downloaded on first visit. Change in task 8: precache the app shell only; download a world's (or a kingdom's) media when it is opened; cache management; tests for offline play and app updates with several worlds |
| CI (`.github/workflows/ci.yml`), Playwright set-up, Vitest set-up | Keep | e2e flows rewritten for the PK screens |
| Lab pages (`#/lab/...`: Sampan, Misi, Tangkap, Belon, audio review) | Keep | The audio review page stays useful for every Tahun |

### 6.3 Screens and components

| JK part | Disposition | PK screen (prototype #) |
|---|---|---|
| `screens/Home.tsx`, `HomeParts.tsx` | **Replace** | World map (3) with 8 kingdoms, "due today" (opens daily review), school Tema |
| `components/TrailMap.tsx` (path of stops drawn in code over a background) | **Adapt** | The kingdom path of regions; the world map path |
| `screens/ChapterScreen.tsx` | **Replace** | Kingdom (4): 3 regions + 4P finale |
| `stages/Kenali.tsx` (word cards, all must be opened) | **Adapt** | Kenal Kata flip cards (5); packs by level |
| `stages/Uji.tsx` | **Replace** | Kuiz battle (6, 7) using `questions.ts` + `battle.ts` |
| `stages/Bina.tsx` (Susun ayat, Pilih perkataan, Tulis sendiri) | **Adapt** | Bina Ayat (8): tiles (Initiate), blank (Knight), free AI-checked sentence (Legend) |
| `stages/CabaranAkhir.tsx` + `games/SampanKata.tsx` | **Adapt** | Pengayaan challenge |
| `stages/StageResult.tsx` | **Adapt** | Result (10) → Chest (11) → Level up (12); its star display and saving flow are reused |
| `screens/Koleksi.tsx` | **Replace** | Badge wall / ranks (21), inventory (13) |
| `games/Padankan.tsx` | Keep | |
| `games/TangkapBuah.tsx`, `PecahBelon.tsx`, `miniGameParts.tsx` | **Adapt** | Attack styles, grammar games, Pengukuhan |
| `games/Misi.tsx` | Keep | Side quests |
| `components/Mascot.tsx` (hornbill) | **Adapt** | The companion (D7) |
| `components/celebrate.tsx` (bounce, shake, stars, confetti; reduced motion) | Keep | Battle hits, level up, chests |
| `components/Icon.tsx` (Phosphor icons) | Keep | UI icons (PK's own icon images are optional, art doc §12.1) |
| `components/ui.tsx`, `tema.ts`, `index.css` | **Adapt** | PK palette as design tokens (navy, ink, amber, teal, coral, blue, purple, cream; rarity colours) |
| *new* | New | Profile picker (1), character create (2), Tatabahasa (17), Seni Bahasa (18), Boss (9), shop (14), loadout (16), wardrobe (19), difficulty/placement (20), parent panel (15, P2), avatar paper-doll renderer |

### 6.4 Art already made

| Art | Disposition |
|---|---|
| 72 word pictures (Tahun 3/5), 3 + 3 postcards, Misi scenes | **Keep** (word cards, side quests, postcards → kingdom rewards) |
| Hornbill, 8 poses | Keep as the companion; restyle in PK line style later (optional) |
| Home sign, markers, unit icons, Tema landscapes, Sampan art | Retire from the main screens. The Sampan art stays with Pengayaan |

### 6.5 Fonts and size (a PK detail to change)

- **Problem:** PK chooses ZCOOL KuaiLe (titles) and Noto Sans SC (Chinese text). Full Chinese fonts are several MB each, which conflicts with "keep the bundle small; slow mobile data".
- **Proposal:**
  - **Baloo 2** for BM/EN (or keep Fredoka, already bundled: Yang's choice);
  - the **phone's own Chinese font** for body text;
  - ZCOOL KuaiLe only as a **subset** containing the characters the UI uses (generated at build time from `zh.json`), or not at all.

## 7. Tahun 4 structure in the app

```
World: Tahun 4                                  content/tahun-4/
└── Kingdom × 8 (= Tema, all open)              track.json (+ kingdom, Boss, colour, set)
    ├── Region (= unit) × 3                     unit-NN/chapter.json
    │   ├── 1 Kenal Kata   flip cards, pack A (+B) (+C) by level
    │   ├── 2 Kuiz         battle, 10 questions per pack
    │   ├── 3 Tatabahasa   battle, the unit's grammar point
    │   ├── 4 Bina Ayat    tiles / blank / free sentence (AI) by level
    │   └── ✦ Seni Bahasa  optional realm (peribahasa, simpulan bahasa, Jawi)
    └── Finale (4P)
        ├── Pemulihan      only with ≥ 5 weak words; recommended before the Boss
        ├── Pengukuhan     mixed practice of the 3 units, unlimited
        ├── Tema Boss      3 phases: words → grammar → sentences
        └── ✦ Pengayaan    Sampan Kata race (D5)
```

**The 24 Tahun 4 grammar points and their game types** (from v1, unchanged):
- `choose`: units 3, 4, 7–14;
- `classify`: units 1, 2, 5, 17–20, 24;
- `forge` (root + affix, the new *Bengkel Imbuhan* game): units 15–16;
- `transform`: units 6, 21–24.

**Seni Bahasa:**
- **First release:** only peribahasa, simpulan bahasa and Jawi (Units 8, 16, 24; about 10 units in all).
- **Poems and songs:** the textbook ones are **copyrighted**; we would need our own.
- **Jawi:**
  - needs a bundled Arabic-script font + right-to-left tiles;
  - **reviewed Jawi spellings** (PK's map has only the Rumi text);
  - Units 8 and 16 have 1 Jawi phrase each, Unit 24 has 2.

## 8. Content model and storage

### 8.1 Schema additions

All are optional, so existing chapters stay valid. Details were refined by the v1 review.

```ts
// Word
pack?: 'A' | 'B' | 'C'      // default 'A'
root?: string               // word family, Legend pack C, hints

// Chapter
grammar?: { topic: TriLingual; rule: TriLingual; questions: GrammarQuestion[] }  // 10–15
seni?: { kind: 'peribahasa' | 'simpulan_bahasa' | 'jawi'; items: SeniItem[] }   // jawi 1–4, others 2–8

// GrammarQuestion (discriminated union). Every question also has:
//   levels: ('initiate' | 'knight' | 'legend')[]   (PK's `levels` field)
// A topic offers variants per level (e.g. kata nama am/khas at Initiate as `choose`:
// "Pilih kata nama khas: ___"; at Knight as `classify`).
// Validation: every released unit has at least 10 grammar questions for EACH level it offers.
choose:    { sentence /* one ___ */, options /* 3–4 */, answer, explain: {en, zh} }
classify:  { item, bins /* 2 */, answer, explain }
forge:     { sentence /* one ___ */, root, affix, options /* complete words, all containing root */, answer, explain }
transform: { from, target, tiles, answer, explain }   // tiles joined = answer

// SeniItem
expression: { text, meaning: TriLingual, example }
situation:  { situation: TriLingual, options /* 3–4 expressions */, answer }
jawi:       { rumi, jawi /* Arabic script + spaces */, image? }

// Track tema
kingdom?: TriLingual; colour?: string; set?: string
boss?: { name: TriLingual; image; defeatedImage; move: 'shuffle_options' | 'swap_options' | 'cover_option' | … }
  // §5.2: a presentation trick, Knight/Legend only; never hides text, audio or the hint button
```

**Packs B and C** are only needed by Knight and Legend.

**Game items** (gear, weapons, outfits, sets, ranks, chests, monsters, Bosses) live in **one catalogue**:
- `content/game/items.json` (Zod-validated), carrying name, slot, z-order, rarity, stats, source and the art paths;
- PK's `assets/manifest.json` format (art doc §13.3) is the starting point;
- it shares the `en`/`zh`/`bm` naming of the rest of the content (PK used `ms`).

### 8.2 What is saved on the device

The pilot has no login; P2 syncs the same records to Supabase.

| Record | Content | Merge rule |
|---|---|---|
| `profile:<id>` | Nickname (no full name, no school), avatar choice, language, meaning display, **difficulty per Tema** (PK lets a child choose again for each Tema) | Last write wins (per field) |
| `events:<profile>` | **The hero's history as events**: `battle_completed`, `item_acquired`, `item_consumed` (potion), `item_dismantled`, `item_purchased`, `coins_earned`, `stat_allocated`, `equipped`, `look_set`, `rank_earned`. Each has a unique id, a time and the session it came from | Union by event id; **XP, level, coins, stat points, owned items, equipped items and ranks are computed by replaying the events** in a fixed order (time, then id) |
| `progress:<profile>:<chapter>` | **Per difficulty**: steps done, stars per step, **packs completed** (A, B, C), cards opened; finale and Boss results per difficulty, including **the Boss phase reached** (resume point, §5.2) | Stars keep the maximum per difficulty; unlocks never undone. **Switching difficulty never removes an earlier result** (a Knight badge stays when a child goes back to Initiate) |
| `answers:<profile>` | Answer events `{id, sessionId, battleId, questionId, attempt, kind: 'vocab' \| 'grammar' \| 'sentence', track, wordIds?, at, correct, assisted: 'none' \| 'hint' \| 'shown'}` (`shown` = the hornbill showed the answer after a knock-down redo, §5.3) | Union by event id, replayed in (time, id) order. Mastery is computed (rules below) |
| `sessions:<profile>` | Active time per screen type (learning steps, battle, map, wardrobe, shop), counted only while the app is in front | Union. Feeds the §11 check (learning time vs dressing-up time) and the P2 parent panel |

**Mastery rules** (v2 review):
- **Which answers count:** only **vocabulary** answers on the **first attempt** of a question in a session update a word's Leitner box. Retries and grammar answers are kept as evidence but don't move the box.
- **How the box moves:**
  - correct without help: +1 box and clears the review flag;
  - correct with a hint: box stays, and the word gets **`needsReview`**;
  - wrong: box 0.
- **Mastered** = box ≥ 3 **and not** `needsReview` (today's `isMastered()` checks only the box).

**Atomic, idempotent operations** (v2 review). `ProgressStore` today only saves chapters. Its contract grows to a few operations, each **one IndexedDB transaction** carrying a **unique operation id**, so a repeated call does nothing:
- `completeBattle(op)` writes the answer events, the progress update and the reward events together. This way an interrupted battle never pays out twice, or pays out without saving progress.
- `purchase(op)`, `consume(op)`, `allocateStat(op)`, `equip(op)` are each checked against the replayed balance before they are written.

**Two devices offline (P2 sync).**
- **On the server:**
  - events are accepted in order;
  - a spend or stat allocation that the replayed balance can't cover is **rejected**, and the device is told;
  - the item goes back (or the point is freed);
  - the child sees "this was already used on another device";
  - earnings are never rejected.
- **In the pilot:** this can't happen, because there is no sync.

**Migration:** existing JK progress on test devices moves into a first profile at Initiate.

**Profiles:** several children on one tablet are separate profiles (PK has this; JK had one record per device).

- **Migration:** existing JK progress on test devices moves into a first profile.
- **Profiles:** several children on one tablet are separate profiles (PK has this; JK had one record per device).

## 9. Art plan

- **Order:** PK's own (art doc §14). Each batch uses the approved style anchor (A0) and the base body (B-BOY-1) as references; layers are checked for alignment by stacking them on the base after every batch.

| Batch | Content | Images (about) | Needed for |
|---|---|---|---|
| 1 | A0 style anchor, B-BOY-1 | 2 | Everything |
| 2 | Other 5 bases, 7 hair/tudung | 12 | Character create |
| 3 | Blue robe, 6 common gear, sword + staff (common), icon + layer each | 18 | Inventory, wardrobe |
| 4 | 4 common monsters, Tema 1 monster + Boss (2 states), Chun Han (full + portrait) | 9 | Tahun 4 Tema 1 battles |
| 5 | 3 potions, chests (4 tiers × open/closed), medal rims + Tema 1 emblem, Tema 1 battle background, world map, kingdom node | about 18 | Rewards, map |
| Wave 2 | Tahun 3/5 Tema 1: 2 kingdoms × (monster + Boss 2 states + background + node + NPC) | about 12 | Ported worlds |
| Words | Tahun 4 Tema 1: 72 word pictures (packs A + B), 3 postcards | 75 | Kenal Kata |

- **Minimum game:** about **70 game images + 75 word pictures**.
- **The rest of PK's list** (rarities, bow/hammer, ranks, pets, 7 more Tema sets, NPCs and Bosses, about 230 more files) comes with the later waves.
- **Cultural review:** Tema 4 traditional outfits need someone who knows each culture (PK art doc §5.3).
- **Licensing:** commercial-licence notes in `docs/licences/` as today. AI-made art has weak copyright protection; commission the hero bases and the companion if the product earns money (as decided for the mascot).

## 10. Grammar, Bina Ayat and Kuiz by level

| | Initiate | Knight | Legend |
|---|---|---|---|
| Kuiz | 4 choices with a picture | 4 choices, no picture | Spelling, listen and type |
| Tatabahasa | Mostly `choose`; **every topic gets an Initiate variant** (a `classify` topic is asked as "choose the kata nama khas"; a `transform` topic as "choose the passive sentence") | `choose` + `classify` | `classify` + `transform` (+ `forge` where the unit has it) |
| Bina Ayat | Tiles (Susun ayat) | Sentence with a blank | Own sentence, AI-checked (exists) |
| Time per question | 20 s | 15 s | 12 s (+ Focus stat, + bow) |

- **Question adapters:** every game receives questions through an adapter and reports `{questionId, correct, hintUsed}` through one hook, so the retry queue, stars, mastery and XP are the same in every game (v1 review #5).

## 11. Pilot and phases (CLAUDE.md §4 to be rewritten)

| Phase | Was (JK) | Proposed (PK) |
|---|---|---|
| P1 pilot | Tahun 3 + 5 Tema 1, JK stages | **RPG pilot**: Tahun 4 Tema 1 + Tahun 3/5 Tema 1 ported; Initiate + Knight; local profiles; no payment |
| P2 paid beta | All Tahun 3, accounts, payment | **First paid Tahun complete (8 kingdoms)**, parent accounts + panel, payments, founding price; Legend level |
| P3 grow | Tahun 4–6, centres | Other Tahun, Tahun 6, centres/teachers, pets and achievements |

**Exit criteria stay:**
- children finish a region without being pushed;
- they return on their own;
- several parents say yes to a stated price.

Add: **does the RPG layer bring children back more than it distracts them?** Track time in learning steps vs time in shop and wardrobe.

## 12. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| The RPG build delays the pilot by months | No feedback from children; motivation and money | Optional parallel JK content pilot (§13, decision Q5); build MVP systems only (no pets, no bow/hammer, common rarity first) |
| AI art layers don't line up (paper doll) | Hundreds of regenerations | PK's own method: base reference, alignment check per batch, never hand-fix dozens. Start with batches 1–3 and stop if alignment fails |
| Lives and timers stress weak readers | Children quit | §5 rule; relaxed timer setting; watch it in the pilot |
| Children spend time dressing up instead of learning | Parents unhappy | Wardrobe and shop outside battles; only learning earns coins; parent panel shows learning time (P2) |
| Grammar questions with two right answers, or wrong BM | Wrong learning, lost trust | Validation rules; human review of every question; `reviewed: false` never ships |
| Copying textbook text | Copyright | Our own sentences; no poems or songs; a check in `draft-chapter` that flags any 6+ word run found in the local textbook text |
| Content volume (24 + 12 words per unit, grammar, seni, per Tahun) | Paid year late | Packs B and C only where needed; the `draft-chapter` tool; one Tema per task |
| Bundle size (art layers, Chinese fonts, Jawi font) | Slow on mobile data | WebP, per-world caching (task 8), font subsets (§6.5) |
| Migration of saved progress (test devices) | Lost stars | Record versions + migration tests |

## 13. Order of work

Each step is about one task (build, tests, handoff, Codex review).

| # | Task | Depends on | Result |
|---|---|---|---|
| R0 | **Decisions + housekeeping:** Yang answers §14; rewrite `CLAUDE.md` (PK as the design, decisions D1–D12); move `pahlawan-kata/` docs to `docs/design/` and fold its `CLAUDE.md` into the root one (so there's one set of rules); the textbook PDF into a git-ignored `reference/` | — | One rule set |
| R1 | **Storage v2:** profiles, hero ledger, answer-event log, progress v2 + migration; profile picker | R0 | Data model ready |
| R2 | **Content v2:** schema additions, validation, loader per world, `items.json` catalogue | R0 | Content model ready |
| R3 | **Engine core:** `hero.ts`, `battle.ts` (§5 rules), `economy.ts`, `difficulty.ts`, unlock rules, all unit-tested | R1, R2 | Game rules in pure code |
| R4a | **`draft-chapter` tool** (chosen words + textbook map → full word entries, grammar questions per level) | R2 | Drafting tool |
| R4b | **Tahun 4 Tema 1 content** (packs A + B, grammar blocks per level) as drafts → **Yang's review → `reviewed: true`** | R4a | Approved content for the first kingdom |
| R4c | Tahun 4 Tema 1 **media**: 72 word pictures, 3 postcards, voices; `optimise-images` adapted for PK art types | R4b | Media for the first kingdom |
| R5 | **Art batches 1–3** + avatar renderer + **character create** | R0 | A hero on screen |
| R6 | **Battle screen** (Kuiz) + Result + Chest + Level up; art batch 4 | R3, R5 | The core loop |
| R7 | **World map + kingdom + region** screens, **Kenal Kata**; art batch 5 | R6, R4c | Tahun 4 Tema 1 playable from the map |
| R8 | **Tatabahasa** (choose, classify, transform) + **Bina Ayat** by level | R6 | All four steps |
| R9 | **Finale:** Pemulihan, Pengukuhan, Tema Boss, Pengayaan (Sampan) | R8 | Tema 1 complete |
| R9b | **Daily review** ("due today" on the map → a battle of due and weak words across worlds); session time recording | R7, R1 | PK's daily review |
| R10a | **Inventory, equipment, loadouts, wardrobe** ("looks only"), common rarity | R6 | Gear and looks |
| R10b | **Coins and shop** (potions, looks), XP anti-farming | R10a | Spending |
| R10c | **Ranks + badge wall** | R9 | Rank rewards |
| R11 | **Placement test + level choice per Tema.** PK's "90% mastered → invitation to the next level" is **deferred** until pack B exists in every pilot world | R3 | Initiate / Knight per child |
| R12 | **Port Tahun 3 and 5 Tema 1** (pack B + grammar per level + kingdom art) after checking their textbooks' structure; content reviewed | R9 | Three worlds |
| R13 | Tasks 8 (offline with **per-world caching**, analytics) and 10 (deploy) | R12 | Online |
| **R14** | **Pilot gate**: the whole loop works together (R7 map, R8 steps, R9 finale, R9b review, R10 rewards, R11 placement); all pilot content `reviewed: true`; offline and update tests with three worlds; e2e on phone sizes. Then task 11, **RPG pilot** | R7–R13 | Pilot ready |
| later | Seni Bahasa realm; Bengkel Imbuhan; the paid Tahun's other 7 Tema; P2 accounts and payments; Legend (pack C) | Pilot | — |

**Size:** about **20 tasks** to the RPG pilot (R0–R14 with the splits), against about 3 for today's JK pilot.

**Parallel option (Q5):** tasks 8 and 10 are needed by both. Running them now and putting **today's JK build** in front of 3–5 families gives early feedback on:
- the word content and pictures;
- the Azure voices;
- the AI sentence check;
- the price questions.

It would be a content test, not the product. The RPG replaces it later.

## 14. Decisions for Yang

| # | Question | Recommendation |
|---|---|---|
| Q1 | Confirm D1–D12 (§3), or mark the ones to change | As proposed |
| Q2 | Product name: **Pahlawan Kata**? (Jelajah Kata was a working title) | Yes; check the name and domain are free |
| Q3 | The §5 lives rules | **Decided (Yang, 19 Nov 2026):** §5.2 as written; maximum **8 lives for everyone** |
| Q4 | Rollout (§4): Tahun 4 Tema 1 first, then port Tahun 3/5 Tema 1, then the pilot | Yes |
| Q5 | Run a small JK content pilot now, in parallel with the RPG build? | Yes, if 3–5 families are available; otherwise skip |
| Q6 | Pilot accounts: local child profiles on the device, parent accounts in P2 | Yes |
| Q7 | Art: PK style for game art, keep the existing word-picture style for word cards | Yes |
| Q8 | Hornbill becomes the hero's companion (hints, revive, cheering) | Yes |
| Q9 | Fonts: Baloo 2 (PK) or keep Fredoka; Chinese from the phone; ZCOOL KuaiLe subset or none | Baloo 2 + phone Chinese font |
| Q10 | Which Tahun is paid first (P2)? | Decide after the pilot (the delivery plan's open question) |
| Q11 | PK's own open questions (design §16): parent minimum level; "looks only"; Tema 4 outfits; Legend without AI (no longer needed: AI exists); less translation at Legend; Tamil; sibling leaderboard | Yes to "looks only" and less translation at Legend; Tema 4 outfits only with a cultural reviewer; leaderboard of weekly effort, not mastery, or none |
| Q12 | Who reviews BM content and grammar answers; who reviews Jawi | Yang + a BM teacher; a Jawi reader for 3 units |

---

## What I'd like from the review (Codex)

1. Is the **JK component disposition** (§6) right, given the actual code? Anything marked Keep that can't be kept, or Replace that could be adapted?
2. Is the **lives rule** (§5) internally consistent, and does it break any rule in `pahlawan-kata/CLAUDE.md`, `pahlawan-kata/docs/design-v0.3.md` or the root `CLAUDE.md` that the plan doesn't list?
3. Is the **storage design** (§8.2: event log, XP/coin ledger, merge rules) sound for P2 sync?
4. Is the **order of work** (§13) realistic? Missing dependencies, or tasks that are really two?
5. Anything in PK's design or prototypes that the plan drops without saying so.

---

## Review outcome (Codex, 19 Nov 2026)

Full review: `docs/pahlawan-kata-one-app-plan.review.md`.

**Codex's verdict:** the one-app direction is carried through well; reusing JK's engines, content, Worker, audio and UI parts is sound; lives through Vitality with automatic revive fits PK and avoids harsh failure; no further conflict with the agreed lives direction.

All 11 findings were valid and are folded into the plan above:

| # | Severity | Finding | Change in the plan |
|---|---|---|---|
| 1 | High | Progress couldn't tell which difficulty or pack was completed; difficulty is per Tema in PK | §8.2: progress per difficulty, packs completed, difficulty per Tema; switching never removes results |
| 2 | High | A ledger alone doesn't make sync safe (double spends, consumed items, rewards paid twice) | §8.2: everything as events, balances computed; atomic, idempotent operations (`completeBattle`, `purchase`, …); server rejects uncovered spends in P2 |
| 3 | Medium | Hinted answers left mastered words mastered; no attempt context | §8.2: separate `needsReview` flag; only first-attempt vocabulary answers move the box; events carry session, question and attempt |
| 4 | Medium | `questions.ts` asks BM → EN/中文 meanings; PK requires BM options | §6.1: replaced by meaning → BM word |
| 5 | Medium | Grammar types per level left Initiate without questions for some units | §8.1 and §10: `levels` on every question, an Initiate variant per topic, validation per level |
| 6 | Medium | Battle end, retries, monster HP, repeated knock-downs, chest floor and the bonus were undefined | New §5.3 with exact rules |
| 7 | Medium | Daily review and learning-time measurement had no task | R9b + `sessions` records; the 90% invitation explicitly deferred (R11) |
| 8 | Medium | `optimise-images` can't keep layer canvases or replace the Python background removal | §6.2: Adapt, sizes per asset type, retire the Python scripts only after coverage |
| 9 | Medium | The PWA precaches all media, so per-world caching needs work | §6.2: PWA Adapt, assigned to task 8 (R13) |
| 10 | Medium | The dependency chain didn't guarantee the pilot; R4 had no review gate; some tasks were too big | §13: R4 split into a/b/c with a review gate, R10 split into a/b/c, new R14 pilot gate. **About 20 tasks** to the pilot (was 14) |
| 11 | Low | "Nothing leaves the device" was inaccurate | §3 D9 reworded |

Also from the review: keep reusable internals of `TrailMap`, the result screen and `collection.ts` (now **Adapt** in §6).

## Review of the agreed lives rules (Codex, 19 Nov 2026)

Full review: `docs/pahlawan-kata-one-app-plan.lives-review.md`. All 8 findings were valid and are answered in **§5.4** without changing what Yang agreed:

| # | Severity | Gap | Rule added (§5.4) |
|---|---|---|---|
| 1 | High | A knock-down on a question with no retries left had no redo | The redo is a recovery attempt outside the queue; no timer, no damage |
| 2 | High | A saved Boss couldn't restore HP, earlier phases or reward flags; repeat healing | Atomic checkpoint per phase (HP after a once-only heal, flags, phase results, question ids); mid-phase rules |
| 3 | Medium | Revive amulet vs hornbill recovery; HP below zero | Amulet first (2 lives, no redo, hearts kept, no-damage bonus lost); HP clamped at 0 |
| 4 | Medium | Boss: 10 or 30 questions; rewards once or three times | 3 phases, 20 originals, queue per phase, one settlement |
| 5 | Medium | Recovery assumed a vocabulary word | Recovery per question kind; AI-checked sentences never cost lives; `sentence` answer events |
| 6 | Medium | XP formula incomplete | Per-answer XP, farming key and exemptions, calculation order, rounding |
| 7 | Medium | Timer could stay stopped if audio failed | Start on end/fail/skip or after 8 s; replay pauses; fresh time per retry |
| 8 | Medium | Boss moves on questions they can't apply to | Moves list their question kinds; fallback animation; at most every 3 questions; answers checked by option id |
