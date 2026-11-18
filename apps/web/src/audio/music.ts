/**
 * Background music: one soft loop per area, on by default at low volume.
 *  - Files: `src/assets/music/music-<name>.mp3` (made from Yang's recordings, see
 *    docs/music-brief.md). Until they exist the player is silent; nothing else changes.
 *  - Browsers only allow sound after a completed tap, so every tap/click/key tries to start
 *    it until playback actually succeeds (task-07 review #1).
 *  - Volume goes through a Web Audio gain node, because iOS ignores `audio.volume`
 *    (task-07 review #2). Without Web Audio, music pauses during speech instead of ducking.
 *  - It ducks while read-aloud audio plays, and pauses when the app is hidden or sound is off.
 */
import { onSoundChange, soundEnabled } from './settings';

export type MusicTrack = 'home' | 'misi' | 'sampan';

const files = import.meta.glob<string>('../assets/music/music-*.{mp3,m4a}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function trackUrl(track: MusicTrack): string | undefined {
  const hit = Object.entries(files).find(([path]) =>
    new RegExp(`/music-${track}\\.(mp3|m4a)$`).test(path),
  );
  return hit?.[1];
}

export const MUSIC_VOLUME = 0.25;
export const DUCKED_VOLUME = 0.06;
const FADE_S = 0.15; // time constant of the gain fade

type AudioCtor = typeof AudioContext;

export interface MusicDeps {
  urlFor?: (track: MusicTrack) => string | undefined;
  /** Web Audio constructor, or null to force the no-Web-Audio fallback. */
  audioContext?: AudioCtor | null;
}

const GESTURES = ['pointerup', 'click', 'keydown', 'touchend'] as const;

export class MusicPlayer {
  private el: HTMLAudioElement | null = null;
  private gain: GainNode | null = null;
  private ctx: AudioContext | null = null;
  private track: MusicTrack | null = null;
  /** True once playback has actually started after a user gesture. */
  private unlocked = false;
  private ducks = 0;
  private readonly urlFor: (track: MusicTrack) => string | undefined;
  private readonly Ctx: AudioCtor | null;
  private readonly onGesture = () => this.sync(true);

  constructor(deps: MusicDeps = {}) {
    this.urlFor = deps.urlFor ?? trackUrl;
    this.Ctx =
      deps.audioContext !== undefined
        ? deps.audioContext
        : typeof window !== 'undefined'
          ? (window.AudioContext ??
            (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext ??
            null)
          : null;
    if (typeof document === 'undefined') return;
    for (const g of GESTURES) document.addEventListener(g, this.onGesture, { capture: true });
    document.addEventListener('visibilitychange', () => this.sync());
    onSoundChange(() => this.sync());
  }

  /** The loop for the current screen, or null for silence (e.g. Uji and Bina). */
  setTrack(track: MusicTrack | null): void {
    if (track === this.track) return;
    this.track = track;
    this.dispose();
    this.sync();
  }

  /** Lowers the music while read-aloud audio plays. Call the returned function when done. */
  duck(): () => void {
    this.ducks++;
    this.applyLevel();
    let done = false;
    return () => {
      if (done) return;
      done = true;
      this.ducks = Math.max(0, this.ducks - 1);
      this.applyLevel();
    };
  }

  get isDucked() {
    return this.ducks > 0;
  }

  private dispose() {
    this.el?.pause();
    this.gain?.disconnect();
    this.el = null;
    this.gain = null;
  }

  private stopListening() {
    for (const g of GESTURES)
      document.removeEventListener(g, this.onGesture, { capture: true } as EventListenerOptions);
  }

  private wanted(): string | undefined {
    const url = this.track ? this.urlFor(this.track) : undefined;
    const visible = !(typeof document !== 'undefined' && document.hidden);
    return url && soundEnabled() && visible ? url : undefined;
  }

  /** Starts, stops or adjusts playback to match the current state. */
  private sync(fromGesture = false): void {
    const url = this.wanted();
    if (!url) {
      this.el?.pause();
      return;
    }
    // Before the first successful start, only a user gesture may try to play.
    if (!this.unlocked && !fromGesture) return;
    if (!this.el) this.create(url);
    if (this.ctx?.state === 'suspended') void this.ctx.resume().catch(() => undefined);
    this.applyLevel();
    const el = this.el!;
    if (!el.paused && this.unlocked) return;
    let attempt: Promise<void> | undefined;
    try {
      attempt = el.play();
    } catch {
      return; // not supported here (e.g. tests); a later gesture retries
    }
    void Promise.resolve(attempt)
      .then(() => {
        this.unlocked = true;
        this.stopListening();
        this.applyLevel();
      })
      .catch(() => undefined); // blocked: keep listening, the next tap retries
  }

  private create(url: string) {
    const el = new Audio(url);
    el.loop = true;
    this.el = el;
    if (!this.Ctx) {
      el.volume = MUSIC_VOLUME;
      return;
    }
    try {
      this.ctx ??= new this.Ctx();
      const source = this.ctx.createMediaElementSource(el);
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0;
      source.connect(this.gain).connect(this.ctx.destination);
    } catch {
      this.gain = null; // fall back to element volume
      el.volume = MUSIC_VOLUME;
    }
  }

  /** Sets the music level: normal, ducked, or (without Web Audio) paused during speech. */
  private applyLevel() {
    const el = this.el;
    if (!el) return;
    const target = this.ducks > 0 ? DUCKED_VOLUME : MUSIC_VOLUME;
    if (this.gain && this.ctx) {
      const now = this.ctx.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setTargetAtTime(target, now, FADE_S);
      return;
    }
    // No gain control (iOS ignores audio.volume): pause instead of ducking.
    if (this.ducks > 0) el.pause();
    else if (this.unlocked && this.wanted() && el.paused) {
      try {
        void Promise.resolve(el.play()).catch(() => undefined);
      } catch {
        /* ignore */
      }
    }
  }
}

export const music = new MusicPlayer();
