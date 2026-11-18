import { z } from 'zod';

/** Word classes used in KSSR BM. Simpulan bahasa and other phrases use `lain-lain`. */
export const WORD_CLASSES = [
  'kata nama',
  'kata kerja',
  'kata adjektif',
  'kata adverba',
  'kata sendi',
  'lain-lain',
] as const;

const nonEmpty = z.string().trim().min(1);

/** Text in the learning language (BM) plus both support languages. */
export const TriLingual = z.strictObject({ bm: nonEmpty, en: nonEmpty, zh: nonEmpty });

/** Lowercase kebab-case, e.g. `menyapu`, `anak-sulung`, `berbual-bual`. */
export const Slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be lowercase kebab-case');

export const WordSchema = z.strictObject({
  id: Slug,
  /** The word or phrase exactly as the child learns it, e.g. `anak sulung`. */
  word: nonEmpty,
  class: z.enum(WORD_CLASSES),
  meaning: TriLingual,
  image: z.string().regex(/^[a-z0-9-]+\.webp$/, 'must be <slug>.webp'),
  audio: z.string().regex(/^[a-z0-9-]+\.mp3$/, 'must be <slug>.mp3'),
  example: TriLingual,
  synonym: nonEmpty.nullable(),
  antonym: nonEmpty.nullable(),
  blank_sentences: z.array(nonEmpty).min(1),
  /** Tiles in the correct order; each tile is a single token (no spaces). */
  jumbled_sentence: z
    .array(z.string().regex(/^\S+$/, 'tile must not contain spaces'))
    .min(3)
    .max(8),
  distractors: z.array(nonEmpty).min(3),
});

export const ChapterSchema = z.strictObject({
  id: z.string().regex(/^t\d-u\d{2}$/, 'must look like t3-u01'),
  year: z.number().int().min(1).max(6),
  tema: z.number().int().min(1),
  unit: z.number().int().min(1),
  /** False until Yang has reviewed the BM content. Unreviewed chapters never ship to production. */
  reviewed: z.boolean(),
  title: TriLingual,
  words: z.array(WordSchema).min(4),
});

export const TrackSchema = z.strictObject({
  year: z.number().int().min(1).max(6),
  title: TriLingual,
  tema: z
    .array(
      z.strictObject({
        tema: z.number().int().min(1),
        title: TriLingual,
        units: z
          .array(
            z.strictObject({
              unit: z.number().int().min(1),
              id: z.string(),
              dir: z.string().regex(/^unit-\d{2}$/),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

// ---------------------------------------------------------------- Misi (story quest)

const Image = z.string().regex(/^[a-z0-9-]+\.webp$/, 'must be <slug>.webp');
/** Where a prop sits on the scene, in % of the scene's width/height (its centre). */
const Percent = z.number().min(0).max(100);

export const QuestPropSchema = z.strictObject({
  id: Slug,
  image: Image,
  /** What the object is, for screen readers (support languages; the BM word is the answer). */
  label: z.strictObject({ en: nonEmpty, zh: nonEmpty }),
  x: Percent,
  y: Percent,
  /** Width in % of the scene. */
  size: z.number().min(10).max(60),
  /** Hidden until a `choose` step with `reveal: <id>` is solved (e.g. the tent goes up). */
  hidden: z.boolean().optional(),
});

/** A character id, or `narrator`. */
const Speaker = Slug;

export const QuestStepSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('say'), speaker: Speaker, line: TriLingual }),
  /** Fill the blank (`___`) in the line with the chapter word `word`, chosen from `options`. */
  z.strictObject({
    kind: z.literal('choose'),
    speaker: Speaker,
    line: TriLingual,
    word: Slug,
    options: z.array(nonEmpty).min(3).max(4),
    reveal: Slug.optional(),
  }),
  /** Tap the prop that matches the chapter word `word`. */
  z.strictObject({
    kind: z.literal('find'),
    speaker: Speaker,
    line: TriLingual,
    word: Slug,
    answer: Slug,
  }),
]);

export const QuestSchema = z.strictObject({
  id: z.string().regex(/^t\d-u\d{2}-misi$/, 'must look like t3-u02-misi'),
  chapter: z.string().regex(/^t\d-u\d{2}$/),
  /** False until Yang has reviewed the BM text. Unreviewed quests never ship to production. */
  reviewed: z.boolean(),
  title: TriLingual,
  intro: TriLingual,
  characters: z.array(z.strictObject({ id: Slug, name: nonEmpty, portrait: Image })).min(1),
  scenes: z
    .array(
      z.strictObject({
        id: Slug,
        title: TriLingual,
        background: Image,
        props: z.array(QuestPropSchema),
        steps: z.array(QuestStepSchema).min(1),
      }),
    )
    .min(1),
  reward: z.strictObject({ image: Image, title: TriLingual }),
});

export type QuestStep = z.infer<typeof QuestStepSchema>;
export type QuestProp = z.infer<typeof QuestPropSchema>;
export type Quest = z.infer<typeof QuestSchema>;

export type WordClass = (typeof WORD_CLASSES)[number];
export type Word = z.infer<typeof WordSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Track = z.infer<typeof TrackSchema>;
