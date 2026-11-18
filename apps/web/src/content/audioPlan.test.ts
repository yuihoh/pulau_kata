import { describe, expect, it } from 'vitest';
import { audioPlan, LEARNER_VOICE, SPEAKER_VOICES, toSsml, VOICES } from './audioPlan';
import { findChapter, findQuest } from './loader';

describe('audio plan', () => {
  const unit2 = findChapter('t3-u02')!.chapter;
  const quest = findQuest('t3-u02')!.quest;

  it('reads every word, every example and every Misi line', () => {
    const plan = audioPlan(unit2, quest);
    const lines = quest.scenes.reduce((n, s) => n + s.steps.length, 0);
    expect(plan).toHaveLength(unit2.words.length * 2 + lines);
    // Word files use the content's own `audio` name, so the loader finds them.
    for (const w of unit2.words) expect(plan.map((p) => p.path)).toContain(`audio/${w.audio}`);
    expect(plan.map((p) => p.path)).toContain('audio/sepupu-example.mp3');
    expect(plan.map((p) => p.path)).toContain('quest/audio/hutan-1.mp3');
    expect(new Set(plan.map((p) => p.path)).size).toBe(plan.length);
  });

  it('gives each Misi character a voice; words use the slower learner voice', () => {
    const plan = audioPlan(unit2, quest);
    expect(plan.find((p) => p.path === 'audio/sepupu.mp3')!.voice).toEqual(LEARNER_VOICE);
    expect(plan.find((p) => p.path === 'quest/audio/hutan-1.mp3')!.voice).toEqual(
      SPEAKER_VOICES.aina,
    );
    expect(SPEAKER_VOICES.ayah!.name).toBe(VOICES.male);
  });

  it('builds safe SSML: escapes text, reads a blank as a pause', () => {
    const ssml = toSsml({
      path: 'x.mp3',
      text: 'Saya <b> & ___ "kamu"',
      voice: { name: VOICES.female, pitch: '+12%' },
    });
    expect(ssml).toContain('xml:lang="ms-MY"');
    expect(ssml).toContain('<voice name="ms-MY-YasminNeural">');
    expect(ssml).toContain('<prosody pitch="+12%">');
    expect(ssml).toContain('Saya &lt;b&gt; &amp; <break time="700ms"/> &quot;kamu&quot;');
    expect(ssml).not.toContain('<b>');
  });
});
