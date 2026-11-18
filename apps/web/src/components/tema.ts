/**
 * One colour per Tema, so a child can tell where they are (Tema 1 family = warm orange).
 * Full class names are written out so Tailwind keeps them in the build.
 */
export interface TemaColour {
  /** Solid accent (strips, badges). */
  solid: string;
  /** Soft background. */
  soft: string;
  /** Text on a light background. */
  text: string;
  /** Ring/border. */
  ring: string;
}

const PALETTE: TemaColour[] = [
  {
    solid: 'bg-orange-400',
    soft: 'bg-orange-50',
    text: 'text-orange-700',
    ring: 'ring-orange-300',
  },
  { solid: 'bg-sky-400', soft: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-300' },
  {
    solid: 'bg-emerald-400',
    soft: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-300',
  },
  {
    solid: 'bg-violet-400',
    soft: 'bg-violet-50',
    text: 'text-violet-700',
    ring: 'ring-violet-300',
  },
  { solid: 'bg-rose-400', soft: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-300' },
  { solid: 'bg-teal-400', soft: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-300' },
  { solid: 'bg-amber-400', soft: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-300' },
  {
    solid: 'bg-indigo-400',
    soft: 'bg-indigo-50',
    text: 'text-indigo-700',
    ring: 'ring-indigo-300',
  },
];

/** Colour of Tema `n` (1-based); wraps around after 8. */
export function temaColour(n: number): TemaColour {
  const i = (((Math.trunc(n) - 1) % PALETTE.length) + PALETTE.length) % PALETTE.length;
  return PALETTE[i]!;
}
