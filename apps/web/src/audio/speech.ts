/**
 * Read-aloud playback (Azure TTS MP3s, see scripts/gen-audio.ts). Music ducks while it plays.
 * Always plays when the child asks, even with the sound switch off: it's learning content.
 */
import { music } from './music';

let current: { el: HTMLAudioElement; release: () => void } | null = null;

export function stopSpeech(): void {
  if (!current) return;
  current.el.pause();
  current.release();
  current = null;
}

/** Plays one clip from the start, stopping any clip already playing. */
export function playSpeech(src: string): HTMLAudioElement {
  stopSpeech();
  const el = new Audio(src);
  const release = music.duck();
  const entry = { el, release };
  current = entry;
  const done = () => {
    release();
    if (current === entry) current = null;
  };
  el.addEventListener('ended', done);
  el.addEventListener('error', done);
  try {
    const p = el.play();
    if (p && typeof p.then === 'function') void p.catch(done);
  } catch {
    done();
  }
  return el;
}
