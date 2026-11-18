import { describe, expect, it } from 'vitest';
import { audioUrl, findChapter, imageUrl, postcardUrl, tracks } from './loader';
import { checkChapter, checkTrack } from './validate';
import { audioPlan } from './audioPlan';

/** The Tahun 5 pilot track (Tema 1, Units 1–3) sits beside Tahun 3 without touching it. */
describe('Tahun 5 pilot content', () => {
  const t5 = tracks.find((t) => t.name === 'tahun-5');

  it('is a second track: Tema 1 with three units of 12 words', () => {
    expect(tracks.map((t) => t.name)).toEqual(['tahun-3', 'tahun-5']);
    expect(t5!.track.year).toBe(5);
    expect(t5!.chapters.map((c) => c.chapter.id)).toEqual(['t5-u01', 't5-u02', 't5-u03']);
    for (const c of t5!.chapters) expect(c.chapter.words).toHaveLength(12);
    expect(findChapter('t5-u02')!.chapter.title.bm).toBe('Keluarga Bestari');
  });

  it('passes the same content rules as Tahun 3 with no warnings at all', () => {
    for (const { chapter } of t5!.chapters) expect(checkChapter(chapter)).toEqual([]);
    const map = new Map(t5!.chapters.map((c) => [c.dir.split('/')[1]!, c.chapter]));
    expect(checkTrack(t5!.track, map)).toEqual([]);
  });

  it('is a draft until Yang reviews it (never shown in production)', () => {
    for (const c of t5!.chapters) expect(c.chapter.reviewed).toBe(false);
  });

  it('has a picture, a word clip and an example clip for every word, and a postcard per unit', () => {
    for (const entry of t5!.chapters) {
      expect(postcardUrl(entry), `${entry.chapter.id} postcard`).toBeTruthy();
      for (const w of entry.chapter.words) {
        expect(imageUrl(entry, w.image), `${w.id} image`).toBeTruthy();
        expect(audioUrl(entry, w.audio), `${w.id} audio`).toBeTruthy();
        expect(audioUrl(entry, `${w.id}-example.mp3`), `${w.id} example audio`).toBeTruthy();
      }
    }
  });

  it('plans one word clip and one example clip per word', () => {
    for (const { chapter } of t5!.chapters)
      expect(audioPlan(chapter)).toHaveLength(chapter.words.length * 2);
  });

  // task-07c review #2/#3/#4: Susun ayat accepts ONE order only, so every jumbled sentence must
  // have exactly one natural order. A preposition or conjunction tile lets a phrase move to the
  // front ("Di dewan guru mengumumkan…"), which the checker would wrongly reject.
  it('review #2: jumbled sentences have no movable phrase, so one order is the only valid one', () => {
    const movable = new Set(
      'di pada dengan untuk kerana apabila sebelum selepas semasa tentang demi kepada atas dalam daripada sebagai dan atau'.split(
        ' ',
      ),
    );
    const bad = t5!.chapters.flatMap((c) =>
      c.chapter.words
        .filter((w) => w.jumbled_sentence.some((tile) => movable.has(tile.toLowerCase())))
        .map((w) => `${w.id}: ${w.jumbled_sentence.join(' ')}`),
    );
    expect(bad).toEqual([]);
  });

  it('review #3/#4: the two sentences that were ungrammatical are fixed', () => {
    const sentence = (id: string) =>
      t5!.chapters
        .flatMap((c) => c.chapter.words)
        .find((w) => w.id === id)!
        .jumbled_sentence.join(' ');
    expect(sentence('keistimewaan')).toBe('Keistimewaan rumah itu ialah halamannya yang luas');
    expect(sentence('berbakti')).not.toMatch(/selama lama/);
  });

  it('review #5: idaman is a noun (DBP), so Kenali teaches the right class', () => {
    const idaman = findChapter('t5-u01')!.chapter.words.find((w) => w.id === 'idaman')!;
    expect(idaman.class).toBe('kata nama');
  });

  // review #1: a fill-the-blank must have one defensible answer. These distractors were removed
  // because they also made a correct sentence in the blank they were offered with.
  it('review #1: distractors that also fit the blank are gone', () => {
    const words = t5!.chapters.flatMap((c) => c.chapter.words);
    const d = (id: string) => words.find((w) => w.id === id)!.distractors;
    expect(d('bertanggungjawab')).not.toEqual(expect.arrayContaining(['tekun']));
    expect(d('bertanggungjawab')).not.toContain('cemerlang');
    expect(d('bertanggungjawab')).not.toContain('berbakat');
    expect(d('berbakat')).not.toContain('cemerlang');
    expect(d('bersungguh-sungguh')).not.toContain('senyap-senyap');
    expect(d('bersungguh-sungguh')).not.toContain('beramai-ramai');
    expect(d('berbincang')).not.toContain('menjamu selera');
    expect(d('berganding-bahu')).not.toContain('berbincang');
    expect(d('berswafoto')).not.toContain('menikmati');
    expect(d('hidangan')).not.toContain('tugasan');
    expect(d('anugerah')).not.toContain('tugasan');
    expect(d('mengeratkan')).not.toContain('mempertahankan');
  });

  it('does not reuse a Tahun 3 word (progress is per word)', () => {
    const t3 = new Set(
      tracks
        .find((t) => t.name === 'tahun-3')!
        .chapters.flatMap((c) => c.chapter.words.map((w) => w.id)),
    );
    const shared = t5!.chapters
      .flatMap((c) => c.chapter.words.map((w) => w.id))
      .filter((id) => t3.has(id));
    expect(shared).toEqual([]);
  });
});
