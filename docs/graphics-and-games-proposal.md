# Proposal: better graphics and more kinds of games

*18 Nov 2026 · Claude Code → Yang.*

> **Yang's decisions (18 Nov 2026):** (1) improve **both** the screens and the games; (2) mascot = **hornbill (burung enggang)**; (3) **Codex draws the first version**, commission an illustrator later if parents pay; (4) first two new games = **Tangkap Buah** and **Pecah Belon**; (5) do steps 1–4 **before the pilot**.

## 1. What the app looks like today

Screens checked on a phone-sized browser (Pixel 7):

| Area | Today | Verdict |
|---|---|---|
| **Word pictures** (Kenali cards) | Rich, consistent illustrations, Malaysian families | **Good.** Keep the style |
| **Misi story art** | Illustrated scenes and object cards | **Good** |
| **Home** | A list of white text cards, three dashed "prototype" buttons | Looks like a web form, not a game |
| **Unit screen** | Four rows with padlocks | Plain; no sense of a journey |
| **Icons** | Emoji (🔊 🎒 🔒 🛶 📖) | Look different on Android, iPhone and Windows; not our own look |
| **Sampan Kata** | Flat blue box with grid lines, an emoji boat, white word pills | **Weakest screen.** No river banks, no movement, no splash |
| **Koleksi** | The same 🖼️ emoji in every locked slot | No reason to want to collect |
| **Feedback** | Small colour changes, a short sound | Right and wrong answers feel the same size |
| **Text** | System font, sizes vary by device | Readable, but no personality |

**Summary:** the *content* art is good; the *game around it* (frame, navigation, rewards, motion) is what looks unfinished. A child judges the app in the first ten seconds on Home, and Home has no pictures at all.

The question types are also worth checking. Uji is a sequence of quiz questions (picture→word, word→meaning, listen, fill the blank, unscramble). Each works, but in a row they feel like a worksheet. Kids return to *games*, and returning on their own is a pilot goal (CLAUDE.md §4).

---

## 2. Graphics plan

### G1. Look and feel (one consistent style)
- **A rounded, friendly font** for headings and buttons, e.g. *Fredoka* or *Baloo 2* (both SIL Open Font Licence: free for commercial use). Bundled with the app so it works offline. Chinese text keeps the system font.
- **Our own icon set** instead of emoji: sound, language, back, lock, star, bag, boat, book, map. Drawn as SVG in one style, so they look the same on every phone. Small (a few KB).
- **Colour per Tema:** Tema 1 (family) warm orange; later Tema get their own colour, so a child knows where they are.

### G2. A mascot
A guide character who appears on Home, cheers on correct answers, gives hints and celebrates finished units.

- **Proposal: Sang Kancil** (the clever mouse-deer of Malay folk tales). Every Malaysian child knows the stories, it fits all three communities, and "clever" fits a learning app. Alternatives: a hornbill (burung enggang), a turtle (penyu), a Malayan tiger cub.
- Needs about **8 poses**: waving, thinking, cheering, clapping, pointing, sleeping (for "come back tomorrow"), surprised, holding a star.
- **Who draws it:** Codex image generation can make it in the same style as the word pictures. But a mascot is the face of the brand, and AI images are hard to keep identical across poses and get weak copyright protection. **Recommended:** generate a first version with Codex to test with kids; if parents pay, commission an illustrator for the final poses with a written commercial licence.

### G3. Home becomes a map
- Each Tahun is an **island**; each Tema is a region; each unit is a **stop on a path** (like a board game). Finished stops show stars; the next stop has the mascot standing on it.
- This is the "Jelajah Malaysia" map already in the game design (CLAUDE.md §1, motivation layer), so it is not a new idea, just one we haven't built.
- One illustrated background per Tema (Codex), with the path, stops and stars drawn on top in code (so it works for any number of units).
- The **prototype buttons** move to a small "Lab" corner (they never show in production anyway).

### G4. Unit screen becomes a short path
Kenali → Uji → Bina → ★ Cabaran as four illustrated stepping stones, not four rows. Locked steps are greyed pictures, not a padlock emoji.

### G5. Feedback that feels like a game
Using Framer Motion (already in the app; no new library):
- **Correct:** a bounce, a burst of stars, the mascot cheers, a bright "ding".
- **Wrong:** a gentle shake, "Cuba lagi!" from the mascot (still no harsh fail screen).
- **Stage complete:** stars fly into the bar one by one, then confetti.
- **Between screens:** short slide transitions instead of instant jumps.
- Respect the phone's "reduce motion" setting.

### G6. Sampan Kata gets real art
- An illustrated **river**: banks with kampung houses, coconut trees and a jetty that scroll past (two or three layers moving at different speeds), and moving water.
- The **boat** is a drawn sampan with the mascot rowing, not an emoji.
- **Buoys** are drawn floats with the word on a flag; a splash when you hit one, ripples when you change lanes.
- Same game rules; only the drawing changes.

### G7. Koleksi worth collecting
- Locked postcards show a **blurred or shadowed version of the real postcard**, so the child sees what they are working towards.
- Unlocking plays a short "stamp" animation.

### Cost and limits
- **Size:** kids may be on slow mobile data (CLAUDE.md §9). Backgrounds as WebP (task 9's converter), icons as SVG, the font as one compressed file. Target: Home loads in under 3 s on a slow 4G connection.
- **Art production:** about 10–15 new illustrations for Tema 1 (map backgrounds, river layers, mascot poses), via the same Codex pipeline as the word pictures.

---

## 3. Game variety plan

### The key idea: new games, no new content
Every word already has: picture, audio, meaning (EN/中文/BM), word class, example, fill-the-blank sentence, jumbled sentence, distractors, and sometimes synonym/antonym.

The engine already turns these into questions ("which of these 4 matches the picture?") and keeps the retry queue, hints and stars. A new game only changes **how the question is played**, not the content. So **each new game works for every unit and every Tahun with no extra writing, pictures or voice clips.** That matters with 24 units per year.

```
chapter.json  →  engine (questions, retry, stars)  →  mini-game "skin"
                                                       ├─ quiz cards (today)
                                                       ├─ Tangkap Buah
                                                       ├─ Pecah Belon
                                                       └─ …
```

### Proposed games

| # | Game | How it plays | What it practises | Content used | Feel |
|---|---|---|---|---|---|
| 1 | **Tangkap Buah** (Catch the fruit) | Rambutans with words fall from a tree; move a basket to catch the one that matches the picture or the voice | Recognise the word | picture, audio, distractors | Action |
| 2 | **Pecah Belon** (Pop the balloons) | Balloons float up; pop every *kata kerja* (or every word that means "happy"…) | **Word class**, a KSSR grammar point not practised today | class | Action |
| 3 | **Cari Kata** (Word search) | Find the unit's words hidden in a letter grid; the grid is generated automatically | Spelling | word | Calm |
| 4 | **Lompat Batu** (Stepping stones) | Cross a river by hopping on the stone that fills the blank in the sentence | Use in context | blank sentences, distractors | Action-light |
| 5 | **Kereta Api Ayat** (Sentence train) | Drag carriages, each with a word, into order behind the engine (Susun ayat redrawn) | Sentence building | jumbled sentence | Calm |
| 6 | **Ulat Huruf** (Letter caterpillar) | The caterpillar eats letters in the right order to spell the word (Susun huruf redrawn) | Spelling | word, picture | Calm |
| 7 | **Tarik Tali** (Tug of war) | Answer quickly to pull the rope against the mascot | Speed recall, synonyms/antonyms | meaning, synonym/antonym | Competitive |
| 8 | **Padankan** (memory match, exists) | Gets new card art and a flip animation | Picture ↔ word | picture, word | Calm |

**Not recommended for now:**
- **Speaking games** (say the word): browser speech recognition for Malay is unreliable, and it sends the child's voice to Google or Apple. That conflicts with the privacy rules.
- **Games that need new content per unit** (e.g. "find the object in a big scene", a market-stall role play): they look great but each unit needs new art and new text, which the per-Tahun price can't support yet. Misi already covers stories.

### Where the games go
1. **Uji** stops being one long quiz: it becomes **3 short rounds**, each a different game (e.g. Tangkap Buah → Cari Kata → Lompat Batu), chosen by the app so every visit feels a little different. Stars and the retry queue work as today.
2. **Bina** uses Kereta Api Ayat for Susun ayat; Tulis sendiri (AI-checked writing) stays as it is.
3. **Cabaran Akhir** stays Sampan Kata (Yang's decision), with the new art (G6).
4. A new **Arked** (arcade) on Home: replay any game with words from units already finished. This is free practice that brings children back without new content, and it is an early form of the planned Ulang Kaji revision mode (P3).

---

## 4. Order and size

Each step below is roughly one task as we have done them so far (build, tests, handoff, Codex review).

| Step | What | Why first |
|---|---|---|
| **1** | G1 look and feel (font, icons, colours) + G5 feedback animations | Changes every screen at once; cheap |
| **2** | G2 mascot (Codex first version, 8 poses) | Needed by Home, feedback and Sampan |
| **3** | G3 Home map + G4 unit path | The first thing a child sees |
| **4** | Mini-game framework + **Tangkap Buah** + **Pecah Belon**; Uji becomes 3 rounds | Biggest change to "it feels like a game" |
| **5** | G6 Sampan Kata art + G7 Koleksi | Rewards and the final challenge |
| **6** | **Cari Kata**, **Lompat Batu**, Kereta Api Ayat, Ulat Huruf | More variety |
| **7** | **Arked** on Home | Reasons to come back |
| later | Tarik Tali; commissioned mascot | After pilot feedback |

**Suggested way to start:** build steps 1–3 and one new game as a **prototype in the Lab** (as with Sampan Kata and Misi), so Yang can play it on a phone before anything replaces today's screens.

**Effect on other work:** this sits before tasks 8–11 (offline, scripts, deploy, pilot). It delays the pilot by roughly the size of steps 1–4. The alternative is to run the pilot with today's look and use the kids' reactions to choose what to improve. Yang decides.

---

## 5. Questions for Yang
1. What bothered you most when you played: the **screens around the game** (Home, menus), the **games themselves** (they feel like a quiz), or **both**?
2. **Mascot:** Sang Kancil, a hornbill, a turtle, a tiger cub, or none?
3. **Mascot art:** Codex first and commission later (recommended), or commission now?
4. **Which 2 new games first?** (Proposed: Tangkap Buah and Pecah Belon.)
5. **Timing:** improve the look before the pilot, or pilot first and improve after watching kids play?
