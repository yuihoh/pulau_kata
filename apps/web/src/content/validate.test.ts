import { describe, expect, it } from 'vitest';
import { ChapterSchema, type Chapter, type Word } from './schema';
import { checkChapter, checkTrack, containsPhrase } from './validate';

function word(over: Partial<Word> = {}): Word {
  return {
    id: 'menyapu',
    word: 'menyapu',
    class: 'kata kerja',
    meaning: { bm: 'membersihkan lantai', en: 'to sweep', zh: '扫地' },
    image: 'menyapu.webp',
    audio: 'menyapu.mp3',
    example: { bm: 'Adik menyapu lantai.', en: 'My sibling sweeps the floor.', zh: '弟弟扫地。' },
    synonym: null,
    antonym: null,
    blank_sentences: ['Ibu ___ halaman rumah.'],
    jumbled_sentence: ['Kami', 'menyapu', 'kelas'],
    distractors: ['mengelap', 'membasuh', 'menyiram'],
    ...over,
  };
}

function chapter(words: Word[]): Chapter {
  return {
    id: 't3-u01',
    year: 3,
    tema: 1,
    unit: 1,
    reviewed: false,
    title: { bm: 'a', en: 'b', zh: 'c' },
    words,
  };
}

const errors = (c: Chapter) => checkChapter(c).filter((i) => i.severity === 'error');

describe('containsPhrase', () => {
  it('matches whole words and phrases, ignoring case', () => {
    expect(containsPhrase('Kakak ialah anak sulung kami', 'anak sulung')).toBe(true);
    expect(containsPhrase('Saudara-mara datang', 'saudara-mara')).toBe(true);
    expect(containsPhrase('Kami menyapunya', 'menyapu')).toBe(false);
    expect(containsPhrase('saudara-mara datang', 'saudara')).toBe(false);
  });
});

describe('checkChapter', () => {
  it('accepts a valid word', () => {
    expect(checkChapter(chapter([word()]))).toEqual([]);
  });

  it('requires exactly one ___ in blank sentences', () => {
    expect(errors(chapter([word({ blank_sentences: ['Tiada tempat kosong.'] })]))).toHaveLength(1);
    expect(errors(chapter([word({ blank_sentences: ['___ dan ___'] })]))).toHaveLength(1);
    expect(errors(chapter([word({ blank_sentences: ['Ibu ____ halaman.'] })]))).toHaveLength(1);
  });

  it('requires the jumbled sentence to contain the word', () => {
    expect(errors(chapter([word({ jumbled_sentence: ['Kami', 'ke', 'kelas'] })]))).toHaveLength(1);
  });

  it('rejects a distractor equal to the word and duplicate distractors', () => {
    const c = chapter([word({ distractors: ['Menyapu', 'mengelap', 'mengelap'] })]);
    expect(errors(c)).toHaveLength(2);
  });

  it('rejects duplicate ids and mismatched media names', () => {
    expect(errors(chapter([word(), word()])).length).toBeGreaterThanOrEqual(2);
    expect(errors(chapter([word({ image: 'other.webp' })]))).toHaveLength(1);
  });

  it('warns when a distractor from the chapter has a different class', () => {
    const c = chapter([
      word({ distractors: ['bangga', 'mengelap', 'membasuh'] }),
      word({
        id: 'bangga',
        word: 'bangga',
        class: 'kata adjektif',
        image: 'bangga.webp',
        audio: 'bangga.mp3',
        example: { bm: 'Ayah bangga.', en: 'Dad is proud.', zh: '爸爸很自豪。' },
        jumbled_sentence: ['Ayah', 'bangga', 'sekali'],
        distractors: ['sedih', 'takut', 'malas'],
      }),
    ]);
    const issues = checkChapter(c);
    expect(issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect(issues.filter((i) => i.severity === 'warning')).toHaveLength(1);
  });
});

describe('ChapterSchema', () => {
  const fourWords = () =>
    ['a', 'b', 'c', 'd'].map((s) =>
      word({ id: `kata-${s}`, image: `kata-${s}.webp`, audio: `kata-${s}.mp3` }),
    );

  it('rejects a missing translation (and only because of it)', () => {
    const good = chapter(fourWords());
    expect(ChapterSchema.safeParse(good).success).toBe(true);

    const words = fourWords();
    words[0] = { ...words[0]!, meaning: { bm: 'x', en: 'y', zh: '' } };
    const result = ChapterSchema.safeParse(chapter(words));
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join('.'))).toEqual(['words.0.meaning.zh']);
  });

  it('rejects jumbled tiles that contain spaces', () => {
    const c = chapter([word({ jumbled_sentence: ['Kami', 'menyapu kelas', 'hari'] })]);
    expect(
      ChapterSchema.safeParse({ ...c, words: [...c.words, word(), word(), word()] }).success,
    ).toBe(false);
  });
});

describe('checkTrack', () => {
  const track = {
    year: 3,
    title: { bm: 'a', en: 'b', zh: 'c' },
    tema: [
      {
        tema: 1,
        title: { bm: 'a', en: 'b', zh: 'c' },
        units: [{ unit: 1, id: 't3-u01', dir: 'unit-01' }],
      },
    ],
  };

  it('passes when track and chapters agree', () => {
    expect(checkTrack(track, new Map([['unit-01', chapter([word()])]]))).toEqual([]);
  });

  it('flags missing chapters, wrong year and unlisted folders', () => {
    expect(checkTrack(track, new Map())).toHaveLength(1);
    expect(
      checkTrack(track, new Map([['unit-01', { ...chapter([word()]), year: 4 }]])),
    ).toHaveLength(1);
    const extra = new Map([
      ['unit-01', chapter([word()])],
      ['unit-02', chapter([])],
    ]);
    expect(checkTrack(track, extra).some((i) => i.message.includes('not listed'))).toBe(true);
  });

  it('flags the same word id in two chapters', () => {
    const two = {
      ...track,
      tema: [
        {
          ...track.tema[0]!,
          units: [
            { unit: 1, id: 't3-u01', dir: 'unit-01' },
            { unit: 2, id: 't3-u02', dir: 'unit-02' },
          ],
        },
      ],
    };
    const chapters = new Map([
      ['unit-01', chapter([word()])],
      ['unit-02', { ...chapter([word()]), id: 't3-u02', unit: 2 }],
    ]);
    expect(checkTrack(two, chapters).some((i) => i.message.includes('also in'))).toBe(true);
  });
});
