/**
 * One remembered sound switch (🔊 / 🔇) for background music and sound effects. On by
 * default (Yang's decision: music on at low volume). Read-aloud audio always plays when the
 * child taps 🔊, because that's learning content, not decoration.
 */
import { useSyncExternalStore } from 'react';

const KEY = 'jk.sound';
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

let enabled = read();

export const soundEnabled = () => enabled;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* storage blocked: the choice lasts for this visit */
  }
  for (const l of listeners) l();
}

export function onSoundChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(onSoundChange, soundEnabled, () => true);
}
