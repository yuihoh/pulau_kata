/**
 * Small sound effects, synthesized with Web Audio: original, tiny (no files to download)
 * and with no licence to worry about. Gentle on purpose: a wrong answer gets a soft "boop",
 * never a buzzer. If Yang's recorded jingles exist (`src/assets/music/jingle-*.mp3`), they
 * replace the synthesized "complete" and "star" sounds.
 */
import { onSoundChange, soundEnabled } from './settings';

export type Sfx = 'correct' | 'wrong' | 'splash' | 'star' | 'complete' | 'flip';

const jingles = import.meta.glob<string>('../assets/music/jingle-*.{mp3,m4a}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const jingleUrl = (name: string) =>
  Object.entries(jingles).find(([p]) => new RegExp(`/jingle-${name}\\.(mp3|m4a)$`).test(p))?.[1];

const VOLUME = 0.18;
let ctx: AudioContext | null = null;
/** Every synthesized sound goes through this, so switching sound off silences it at once. */
let master: GainNode | null = null;
/** Recorded jingles currently playing (stopped when sound is switched off). */
const activeFiles = new Set<HTMLAudioElement>();

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  master!.gain.value = 1;
  return ctx;
}

/** Switching sound off stops anything already playing (task-07 review #3). */
export function stopAllSfx(): void {
  for (const el of activeFiles) el.pause();
  activeFiles.clear();
  if (master && ctx) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.value = 0;
  }
}

onSoundChange(() => {
  if (!soundEnabled()) stopAllSfx();
});

/** One soft note with a quick attack and smooth decay. */
function note(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 1,
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(VOLUME * gain, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(master ?? c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function splash(c: AudioContext, start: number) {
  const len = Math.floor(c.sampleRate * 0.4);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, start);
  filter.frequency.exponentialRampToValueAtTime(400, start + 0.4);
  const g = c.createGain();
  g.gain.value = VOLUME * 1.5;
  src
    .connect(filter)
    .connect(g)
    .connect(master ?? c.destination);
  src.start(start);
}

/** Plays a recorded jingle, tracked so switching sound off can stop it. */
export function playFile(url: string): HTMLAudioElement | null {
  try {
    const a = new Audio(url);
    a.volume = 0.6;
    activeFiles.add(a);
    const forget = () => activeFiles.delete(a);
    a.addEventListener('ended', forget);
    a.addEventListener('error', forget);
    const p = a.play();
    if (p && typeof p.then === 'function') void p.catch(forget);
    return a;
  } catch {
    return null;
  }
}

export function playSfx(name: Sfx): void {
  if (!soundEnabled()) return;
  const file = name === 'complete' || name === 'star' ? jingleUrl(name) : undefined;
  if (file) {
    playFile(file);
    return;
  }
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.01;
  switch (name) {
    case 'correct': // two bright rising notes
      note(c, 784, t, 0.18, 'triangle');
      note(c, 1175, t + 0.1, 0.28, 'triangle');
      break;
    case 'wrong': // a soft, low "boop": never a buzzer
      note(c, 330, t, 0.22, 'sine', 0.8);
      note(c, 262, t + 0.12, 0.3, 'sine', 0.7);
      break;
    case 'splash':
      splash(c, t);
      note(c, 523, t + 0.05, 0.2, 'sine', 0.5);
      break;
    case 'star': // sparkle
      [1319, 1568, 2093].forEach((f, i) => note(c, f, t + i * 0.07, 0.25, 'triangle', 0.7));
      break;
    case 'complete': // little fanfare
      [523, 659, 784, 1047].forEach((f, i) =>
        note(c, f, t + i * 0.12, i === 3 ? 0.6 : 0.2, 'triangle'),
      );
      break;
    case 'flip':
      note(c, 660, t, 0.08, 'sine', 0.5);
      break;
  }
}
