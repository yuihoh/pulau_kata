/**
 * The hornbill guide (G-2; Yang chose a hornbill, 18 Nov 2026). First version drawn with Codex
 * (`assets-src/mascot/`, converted by `scripts/mascot-to-webp.py`); an illustrator may redraw
 * the poses later without code changes. Purely decorative: the text next to it carries the
 * meaning, so the picture is hidden from screen readers.
 */
import { m, useReducedMotionConfig } from 'framer-motion';
import { useSyncExternalStore, type ReactNode } from 'react';

export const MASCOT_POSES = [
  'wave',
  'cheer',
  'think',
  'encourage',
  'clap',
  'point',
  'star',
  'sleep',
] as const;
export type MascotPose = (typeof MASCOT_POSES)[number];

const FILES = import.meta.glob<string>('../assets/mascot/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function mascotUrl(pose: MascotPose): string | undefined {
  return FILES[`../assets/mascot/${pose}.webp`];
}

/** One bob takes 2.4 s; it plays twice (≈ 4.8 s) and then stops (WCAG 2.2.2: under 5 s). */
const BOB_S = 2.4;
const BOB_REPEATS = 1;

const QUERY = '(prefers-reduced-motion: reduce)';
function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener?.('change', onChange);
  return () => mq.removeEventListener?.('change', onChange);
}
const snapshot = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches;

/** The phone's reduce-motion setting, updated live when it changes while a screen is open. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

/** Poses that hop once when they appear (celebrations); the rest bob gently. */
const HOP: readonly MascotPose[] = ['cheer', 'clap', 'star'];

export function Mascot({
  pose,
  size = 96,
  className = '',
}: {
  pose: MascotPose;
  /** Height in px (the poses are roughly square). */
  size?: number;
  className?: string;
}) {
  // framer's own value is read once per mount, so also follow the phone setting live.
  const live = usePrefersReducedMotion();
  const reduce = useReducedMotionConfig() || live;
  const src = mascotUrl(pose);
  if (!src) return null;
  const motion = reduce
    ? {}
    : HOP.includes(pose)
      ? {
          initial: { y: 12, scale: 0.8, opacity: 0 },
          animate: { y: [12, -14, 0], scale: 1, opacity: 1 },
          transition: { duration: 0.5 },
        }
      : {
          // Two gentle bobs (under 5 s, then still), so it never distracts from reading.
          animate: { y: [0, -4, 0] },
          transition: { duration: BOB_S, repeat: BOB_REPEATS, ease: 'easeInOut' as const },
        };
  return (
    <m.img
      // Remount when reduced motion switches on, so a running animation stops at once.
      key={`${pose}:${reduce ? 'still' : 'move'}`}
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      data-testid="mascot"
      data-pose={pose}
      data-motion={reduce ? 'still' : 'move'}
      width={size}
      height={size}
      className={`pointer-events-none shrink-0 object-contain select-none ${className}`}
      style={{ width: size, height: size }}
      {...motion}
    />
  );
}

/** The mascot with a speech bubble beside it (instructions, greetings, encouragement). */
export function MascotSays({
  pose,
  children,
  size = 80,
  className = '',
}: {
  pose: MascotPose;
  children: ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-end gap-2 ${className}`} data-testid="mascot-says">
      <Mascot pose={pose} size={size} />
      <div className="relative mb-3 flex-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
        {children}
      </div>
    </div>
  );
}
