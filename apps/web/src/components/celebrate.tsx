/**
 * Game-feel feedback shared by every stage: a burst of stars on a right answer, a gentle
 * shake on a wrong one, confetti when a stage is finished. All of it is decoration
 * (aria-hidden) and is switched off when the phone asks for reduced motion.
 */
import { m, useReducedMotionConfig, type TargetAndTransition } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Icon } from './Icon';

export type AnswerState = 'idle' | 'right' | 'wrong';

/** Motion for an answer button or answer area: bounce when right, shake when wrong. */
export function answerMotion(state: AnswerState): TargetAndTransition {
  if (state === 'right') return { scale: [1, 1.12, 0.97, 1], transition: { duration: 0.45 } };
  if (state === 'wrong') return { x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } };
  return { scale: 1, x: 0 };
}

const BURST = 8;
const BURST_MS = 800;

/**
 * Stars flying out of the middle of the parent (which must be `relative`). They are removed
 * once the animation is over; the page itself clips sideways overflow (index.css), so a burst
 * at the screen edge never makes the page scroll.
 */
export function StarBurst() {
  const reduce = useReducedMotionConfig();
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setOn(false), BURST_MS);
    return () => clearTimeout(id);
  }, []);
  if (reduce || !on) return null;
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden data-testid="star-burst">
      {Array.from({ length: BURST }, (_, i) => {
        const angle = (i / BURST) * Math.PI * 2;
        return (
          <m.span
            key={i}
            className="absolute top-1/2 left-1/2 -mt-2.5 -ml-2.5 text-amber-400"
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * 70,
              y: Math.sin(angle) * 50,
              scale: 1,
              opacity: 0,
            }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <Icon name="star" weight="fill" size={20} />
          </m.span>
        );
      })}
    </span>
  );
}

const CONFETTI_COLOURS = ['#f59e0b', '#f97316', '#10b981', '#0ea5e9', '#8b5cf6', '#f43f5e'];
const PIECES = 36;
const CONFETTI_MS = 2600;

/** Worked out once when the module loads (rendering must stay pure). */
const CONFETTI_PIECES = Array.from({ length: PIECES }, (_, i) => ({
  left: Math.random() * 100,
  delay: Math.random() * 0.5,
  drift: (Math.random() - 0.5) * 120,
  spin: (Math.random() - 0.5) * 720,
  colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
  wide: i % 3 === 0,
}));

/** Confetti falling over the whole screen for a moment (stage or unit finished). */
export function Confetti() {
  const reduce = useReducedMotionConfig();
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setOn(false), CONFETTI_MS);
    return () => clearTimeout(id);
  }, []);
  const pieces = CONFETTI_PIECES;
  if (reduce || !on) return null;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden
      data-testid="confetti"
    >
      {pieces.map((p, i) => (
        <m.span
          key={i}
          className={`absolute top-0 block rounded-sm ${p.wide ? 'h-2 w-3' : 'h-3 w-2'}`}
          style={{ left: `${p.left}%`, backgroundColor: p.colour }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '100vh', x: p.drift, rotate: p.spin, opacity: [1, 1, 0] }}
          transition={{ duration: 2, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
