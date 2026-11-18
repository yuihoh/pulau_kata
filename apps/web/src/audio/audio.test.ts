import { afterEach, describe, expect, it, vi } from 'vitest';
import { musicFor } from '../App';
import { DUCKED_VOLUME, MUSIC_VOLUME, MusicPlayer, music, trackUrl } from './music';
import { setSoundEnabled } from './settings';
import { playFile, playSfx } from './sfx';

afterEach(() => {
  vi.unstubAllGlobals();
  setSoundEnabled(true);
});

describe('music per screen', () => {
  it('home, Kenali and Koleksi share the calm loop; Uji and Bina are quiet', () => {
    expect(musicFor({ name: 'home' })).toBe('home');
    expect(musicFor({ name: 'koleksi' })).toBe('home');
    expect(musicFor({ name: 'stage', chapterId: 'x', stage: 'kenali' })).toBe('home');
    expect(musicFor({ name: 'stage', chapterId: 'x', stage: 'uji' })).toBeNull();
    expect(musicFor({ name: 'stage', chapterId: 'x', stage: 'bina' })).toBeNull();
    expect(musicFor({ name: 'stage', chapterId: 'x', stage: 'cabaran' })).toBe('sampan');
    expect(musicFor({ name: 'lab', game: 'misi' })).toBe('misi');
  });

  it('is silent (no audio created) until Yang’s music files exist', () => {
    const Audio = vi.fn();
    vi.stubGlobal('Audio', Audio);
    expect(trackUrl('home')).toBeUndefined();
    music.setTrack('home');
    document.dispatchEvent(new Event('pointerdown'));
    expect(Audio).not.toHaveBeenCalled();
    music.setTrack(null);
  });

  it('ducks under speech and comes back when every clip is done', () => {
    expect(DUCKED_VOLUME).toBeLessThan(MUSIC_VOLUME);
    const a = music.duck();
    const b = music.duck();
    a();
    a(); // releasing twice is harmless
    b();
  });
});

describe('music player on real devices (task-07 review)', () => {
  class FakeAudioEl {
    paused = true;
    loop = false;
    volume = 1;
    plays = 0;
    constructor(
      public src: string,
      private outcomes: ('ok' | 'blocked')[],
    ) {}
    play() {
      this.plays++;
      const outcome = this.outcomes.shift() ?? 'ok';
      if (outcome === 'blocked') return Promise.reject(new Error('NotAllowedError'));
      this.paused = false;
      return Promise.resolve();
    }
    pause() {
      this.paused = true;
    }
    addEventListener() {}
  }

  function fakeWebAudio() {
    const levels: number[] = [];
    class Ctx {
      currentTime = 0;
      state = 'running';
      destination = {};
      resume = () => Promise.resolve();
      createMediaElementSource() {
        return { connect: (n: unknown) => n };
      }
      createGain() {
        return {
          connect: (n: unknown) => n,
          disconnect: () => undefined,
          gain: {
            value: 0,
            cancelScheduledValues: () => undefined,
            setTargetAtTime: (v: number) => levels.push(v),
          },
        };
      }
    }
    return { Ctx: Ctx as unknown as typeof AudioContext, levels };
  }

  const flush = () => new Promise((r) => setTimeout(r, 0));

  it('#1 a blocked first tap keeps listening; the next tap starts the music', async () => {
    const els: FakeAudioEl[] = [];
    const outcomes: ('ok' | 'blocked')[] = ['blocked'];
    vi.stubGlobal(
      'Audio',
      class extends FakeAudioEl {
        constructor(src: string) {
          super(src, outcomes);
          els.push(this);
        }
      },
    );
    const { Ctx } = fakeWebAudio();
    const player = new MusicPlayer({ urlFor: () => '/m.mp3', audioContext: Ctx });
    player.setTrack('home');
    expect(els).toHaveLength(0); // nothing before a gesture
    document.dispatchEvent(new Event('pointerup'));
    await flush();
    expect(els[0]!.paused).toBe(true); // blocked
    document.dispatchEvent(new Event('click'));
    await flush();
    expect(els[0]!.paused).toBe(false);
    expect(els[0]!.plays).toBe(2);
  });

  it('#2 volume goes through a gain node (iOS ignores audio.volume) and ducks under speech', async () => {
    vi.stubGlobal(
      'Audio',
      class extends FakeAudioEl {
        constructor(src: string) {
          super(src, []);
        }
      },
    );
    const { Ctx, levels } = fakeWebAudio();
    const player = new MusicPlayer({ urlFor: () => '/m.mp3', audioContext: Ctx });
    player.setTrack('home');
    document.dispatchEvent(new Event('click'));
    await flush();
    expect(levels.at(-1)).toBe(MUSIC_VOLUME);
    const release = player.duck();
    expect(levels.at(-1)).toBe(DUCKED_VOLUME);
    release();
    expect(levels.at(-1)).toBe(MUSIC_VOLUME);
  });

  it('#2 without Web Audio, music pauses during speech instead of staying loud', async () => {
    let el: FakeAudioEl | null = null;
    vi.stubGlobal(
      'Audio',
      class extends FakeAudioEl {
        constructor(src: string) {
          super(src, []);
          el = this; // eslint-disable-line @typescript-eslint/no-this-alias
        }
      },
    );
    const player = new MusicPlayer({ urlFor: () => '/m.mp3', audioContext: null });
    player.setTrack('home');
    document.dispatchEvent(new Event('click'));
    await flush();
    expect(el!.paused).toBe(false);
    const release = player.duck();
    expect(el!.paused).toBe(true);
    release();
    await flush();
    expect(el!.paused).toBe(false);
  });

  it('switching sound off pauses the music', async () => {
    let el: FakeAudioEl | null = null;
    vi.stubGlobal(
      'Audio',
      class extends FakeAudioEl {
        constructor(src: string) {
          super(src, []);
          el = this; // eslint-disable-line @typescript-eslint/no-this-alias
        }
      },
    );
    const player = new MusicPlayer({ urlFor: () => '/m.mp3', audioContext: null });
    player.setTrack('home');
    document.dispatchEvent(new Event('click'));
    await flush();
    setSoundEnabled(false);
    expect(el!.paused).toBe(true);
  });
});

describe('sound effects', () => {
  it('#3 switching sound off stops a jingle that is already playing', () => {
    const paused: string[] = [];
    vi.stubGlobal(
      'Audio',
      class {
        volume = 1;
        constructor(public src: string) {}
        play() {
          return Promise.resolve();
        }
        pause() {
          paused.push(this.src);
        }
        addEventListener() {}
      },
    );
    playFile('/jingle-complete.mp3');
    setSoundEnabled(false);
    expect(paused).toEqual(['/jingle-complete.mp3']);
  });

  function fakeContext() {
    const made: string[] = [];
    const node = () => ({
      connect: (n: unknown) => n,
      start: () => undefined,
      stop: () => undefined,
      type: '',
      frequency: { setValueAtTime: () => undefined, exponentialRampToValueAtTime: () => undefined },
      gain: {
        value: 1,
        setValueAtTime: () => undefined,
        exponentialRampToValueAtTime: () => undefined,
        cancelScheduledValues: () => undefined,
      },
      buffer: null,
    });
    class Ctx {
      currentTime = 0;
      state = 'running';
      sampleRate = 8000;
      destination = {};
      createOscillator() {
        made.push('osc');
        return node();
      }
      createGain = node;
      createBiquadFilter = node;
      createBufferSource() {
        made.push('noise');
        return node();
      }
      createBuffer(_c: number, len: number) {
        return { getChannelData: () => new Float32Array(len) };
      }
      resume = () => Promise.resolve();
    }
    vi.stubGlobal('AudioContext', Ctx);
    return made;
  }

  it('plays synthesized effects, and nothing when sound is off', () => {
    const made = fakeContext();
    playSfx('correct');
    expect(made.filter((m) => m === 'osc')).toHaveLength(2);
    playSfx('splash');
    expect(made).toContain('noise');
    made.length = 0;
    setSoundEnabled(false);
    playSfx('correct');
    playSfx('complete');
    expect(made).toHaveLength(0);
  });
});
