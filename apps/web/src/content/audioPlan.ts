/**
 * What gets read aloud, and in which voice (Azure Speech, Malay ms-MY; Yang's decision).
 * Pure: `scripts/gen-audio.ts` turns this plan into MP3s; the app finds the files by the
 * same names through the loader. Changing a name here changes both sides.
 *
 *   unit-XX/audio/<wordId>.mp3            the word          (word.audio)
 *   unit-XX/audio/<wordId>-example.mp3    its example sentence
 *   unit-XX/quest/audio/<scene>-<step>.mp3  each Misi line (blank read as a short pause)
 */
import type { Chapter, Quest } from './schema';

export const VOICES = {
  female: 'ms-MY-YasminNeural',
  male: 'ms-MY-OsmanNeural',
} as const;

export interface Voice {
  name: string;
  /** SSML prosody, e.g. pitch "+12%" for a child's voice, rate "-10%" for learners. */
  pitch?: string;
  rate?: string;
}

/** Words and example sentences: clear and a little slower, for learners. */
export const LEARNER_VOICE: Voice = { name: VOICES.female, rate: '-10%' };

/** Misi speakers. Unknown ids use the narrator's voice. */
export const SPEAKER_VOICES: Record<string, Voice> = {
  narrator: { name: VOICES.female, rate: '-5%' },
  aina: { name: VOICES.female, pitch: '+12%', rate: '+0%' },
  ayah: { name: VOICES.male, rate: '-5%' },
  'mak-long': { name: VOICES.female, pitch: '-6%', rate: '-5%' },
};

export const exampleAudioFile = (wordId: string) => `${wordId}-example.mp3`;
export const questLineAudioFile = (sceneId: string, step: number) => `${sceneId}-${step}.mp3`;

export interface AudioItem {
  /** Path relative to the unit folder, e.g. `audio/membela.mp3`. */
  path: string;
  /** The BM text (for review lists and character counts). */
  text: string;
  voice: Voice;
}

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** SSML for one item. A `___` blank becomes a short pause. */
export function toSsml(item: AudioItem): string {
  const body = escapeXml(item.text).replace(/_{3,}/g, '<break time="700ms"/>');
  const { name, pitch, rate } = item.voice;
  const attrs = [pitch && `pitch="${pitch}"`, rate && `rate="${rate}"`].filter(Boolean).join(' ');
  const inner = attrs ? `<prosody ${attrs}>${body}</prosody>` : body;
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ms-MY"><voice name="${name}">${inner}</voice></speak>`;
}

export function audioPlan(chapter: Chapter, quest?: Quest): AudioItem[] {
  const items: AudioItem[] = chapter.words.flatMap((w) => [
    { path: `audio/${w.audio}`, text: w.word, voice: LEARNER_VOICE },
    { path: `audio/${exampleAudioFile(w.id)}`, text: w.example.bm, voice: LEARNER_VOICE },
  ]);
  if (quest)
    quest.scenes.forEach((scene) =>
      scene.steps.forEach((step, i) =>
        items.push({
          path: `quest/audio/${questLineAudioFile(scene.id, i)}`,
          text: step.line.bm,
          voice: SPEAKER_VOICES[step.speaker] ?? SPEAKER_VOICES.narrator!,
        }),
      ),
    );
  return items;
}
