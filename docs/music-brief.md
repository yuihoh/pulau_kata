# Music brief: Jelajah Kata background music

*17 Nov 2026 · for Yang (composer and performer, arranger keyboard)*

The background music is soft, on by default at low volume, with a 🎵 on/off toggle. It fades down whenever a word or sentence is read aloud.

## 1. Format to deliver
| | Requirement |
|---|---|
| **File type** | **WAV**, stereo, 44.1 kHz or 48 kHz, 16- or 24-bit. If the keyboard can only export MP3, use 320 kbps |
| **Level** | Loudest peaks below about **−1 dB**, with **no clipping** (no red light). Keep all tracks at a similar loudness; Claude evens them out and sets the in-app volume |
| **Start and end** | **No fade-in or fade-out** on the loops. Each one must loop seamlessly (the jingles may fade out) |
| **Length** | **60–90 seconds** per loop. Shorter becomes repetitive over a 10–15 minute session |
| **Looping** | Play the piece **twice in a row** without stopping, and note the **tempo (BPM) and number of bars**. Claude cuts an exact loop from the middle so the reverb tail carries into the start smoothly |
| **Names** | Exactly the file names in section 3 |

Claude converts the files to small web formats (about 0.5 MB per minute). The original WAVs go in a source folder that isn't shipped with the app.

## 2. What the music must do
**Rule 1: it sits behind a Malay voice reading words. It must never compete with the voice.**

- **No vocals or lyrics.**
- **A simple, sparse melody.** Avoid busy lines in the speaking-voice range.
- **Soft, warm sounds:** marimba, kalimba, soft piano, nylon guitar, flute, light strings, pads.
- **A gentle Malaysian touch is welcome:** angklung, gambus, sape, soft kompang or hand percussion.
- **Avoid:** heavy drums, deep booming bass, cymbal crashes, sudden loud hits, sharp instruments such as serunai.
- **Happy and calm, in a major key**, with small variations (an A part and a B part) so the loop doesn't feel repetitive.

## 3. Tracks
| File | Where it plays | Feel | Tempo |
|---|---|---|---|
| `music-home.wav` | Home, unit screen, Kenali | Warm, welcoming | 80–90 BPM |
| `music-misi.wav` | Misi story adventure | Light and curious; a forest/walking feel | 90–100 BPM |
| `music-sampan.wav` | Sampan Kata (Cabaran Akhir) | Upbeat paddling rhythm; fun but not stressful | 115–125 BPM |
| `jingle-complete.wav` (3–5 s) | Stage or unit finished | Small happy fanfare; may fade out | — |
| `jingle-star.wav` (1–2 s) | Earning stars | Short sparkle or chime | — |

### Reference tracks to listen to (style and tempo targets only)
These are licensed stock tracks, so use them to hear the target instruments, density and tempo. **Do not copy their melodies or distinctive chord patterns.** The descriptions come from the libraries' listings, not from listening, so judge each by ear. To search YouTube, use the phrases in the last column.

| Your track | What to listen for | Where to listen | Search on YouTube |
|---|---|---|---|
| `music-home` | Soft kalimba and marimba melody, light percussion, gentle pads | [Paradise Discovered](https://www.motionelements.com/stock-music-15186236-paradise-discovered-kalimba-percussion-only) (kalimba and marimba, relaxed); [Melody Loops "gentle" mood](https://www.melodyloops.com/moods/gentle/?page=122) | `soft kalimba marimba background music for kids no vocals` |
| `music-misi` | A Malaysian touch: gentle gamelan-style percussion, suling (bamboo flute), sape or angklung over a light walking beat | [Malaysian Adventures](https://www.audiomicro.com/malaysian-adventures-royalty-free-stock-music-1636757); [100audio track](https://100audio.com/en/download/830263) (gamelan, bamboo flute, sape); [Authentic Malaysia album](https://musou.gr/music/album/sonoton/sonoton-authentic-series-sas/SAS0030-authentic-malaysia) | `Malaysian traditional instrumental sape angklung relaxing`, `Borneo rainforest relaxing music` |
| `music-sampan` | Ukulele strums, pizzicato strings, bells, hand claps, marimba | [Playful Pizzicato](https://motionarray.com/royalty-free-music/playful-pizzicato-1767558/) (120 BPM); [Fun All Day](https://motionarray.com/royalty-free-music/fun-all-day-726781/) (120 BPM); [Such a Funny Game](https://www.melodyloops.com/tracks/such-a-funny-game/) (119 BPM, marimba) | `playful ukulele pizzicato kids game music 120 bpm` |
| `jingle-complete` | A short, happy marimba or bell run ending on a bright note | [Marimba level complete](https://uppbeat.io/sfx/marimba-level-complete/13121/32619); [Kids game level complete](https://uppbeat.io/sfx/kids-game-level-complete/6869/22243); [Game Win Logo 07](https://audiojungle.net/item/game-win-logo-07/55136560) | `kids game level complete jingle sound effect` |
| `jingle-star` | Two or three rising chime notes with a short tail (about 2 s) | [Vibrant Star Collect Success](https://audiojungle.net/item/vibrant-star-collect-success/60941528) | `star collect sparkle chime sound effect` |

**How to use them:** listen for the ingredients (instruments, how busy the melody is, how loud the bass is, how long before the loop repeats), not the tune. Malaysian-instrument tracks are the most likely to be too busy behind a spoken voice, so keep yours sparser than the reference.

- **Uji and Bina have no music**, or at most a very faint loop. They are concentration tasks, and Bina includes typing.
- **Small sound effects** (ding, splash, soft "Cuba lagi") are made by Claude as original sounds, so they need no licence.

## 4. Rights checklist (the app will be sold)
- [ ] **Original melodies only.** Don't base them on existing songs, including well-known Malaysian pop or folk songs, because arrangements and many melodies are still owned by someone.
- [ ] **Built-in styles and voices** on most arranger keyboards may be used in your own recordings; **the keyboard's demo songs may not.** Check the keyboard manual for its licence wording.
- [ ] **Keep a record for each track:** title, date, keyboard model, "composed and performed by Yang". It is stored in `docs/licences/music.md` as proof of ownership.

## 5. Quick test before sending
Play the track on a **phone speaker at low volume** while someone reads a sentence over it, e.g. *"Adik membela seekor kucing."* If every word is easy to hear, the track works.

## 6. Where to put the files
Put the WAVs in `assets-src/music/` in the project folder (create it if needed) and tell Claude. Until then, the music player stays silent.
