/**
 * Pieces of the Home map (Yang's ChatGPT mockups, 18 Nov 2026): the wooden year sign, the Tema
 * ribbon, the numbered stone markers and the unit cards. Every word is drawn in code, so it is
 * translatable; the Codex pictures (sign, stone, unit icons) are blank. Each picture falls back
 * to plain CSS when its file is missing, so the screen never breaks.
 */
import type { ReactNode } from 'react';
import { Icon } from './Icon';

const art = import.meta.glob<string>('../assets/home/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const signUrl = art['../assets/home/sign.webp'];
const stoneUrl = art['../assets/home/marker.webp'];

/** "Bahasa Melayu Tahun 3" → { subject: "Bahasa Melayu", year: "Tahun 3" }. */
export function splitTrackTitle(title: string): { subject: string; year: string | null } {
  const m = /^(.*?)\s+(Tahun\s+\d+)\s*$/.exec(title);
  return m ? { subject: m[1]!, year: m[2]! } : { subject: title, year: null };
}

/**
 * The hanging wooden sign with the subject and the school year. The wood is a stretched
 * background and the text is in normal flow, so the sign grows (and the text wraps) with the
 * text size and with titles that have no year.
 */
export function WoodSign({
  title,
  level = 2,
  compact = false,
}: {
  title: string;
  /** Heading level: 2 on Home, 1 where the sign is the page title. */
  level?: 1 | 2;
  /** A smaller sign for a top bar. */
  compact?: boolean;
}) {
  const { subject, year } = splitTrackTitle(title);
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <div
      className={`relative w-fit max-w-full drop-shadow-md ${compact ? 'min-w-[min(10rem,100%)]' : 'min-w-48'}`}
      data-testid="wood-sign"
    >
      {signUrl ? (
        <img
          src={signUrl}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full object-fill select-none"
        />
      ) : (
        <span className="absolute inset-x-0 top-[22%] bottom-0 rounded-2xl bg-amber-800" />
      )}
      <Heading className="relative flex flex-col items-center px-[11%] pt-[27%] pb-[9%] text-center">
        <span
          className={`${compact ? 'text-[1.05rem]' : 'text-[1.3rem]'} leading-tight font-bold text-white [text-shadow:0_2px_0_#5b3416,0_0_6px_#5b3416]`}
        >
          {subject}
        </span>
        {year && (
          <span
            className={`mt-1 rounded-full bg-yellow-300 px-3 py-0.5 ${compact ? 'text-base' : 'text-[1.15rem]'} leading-tight font-bold text-amber-950 shadow ring-2 ring-amber-500`}
          >
            {year}
          </span>
        )}
      </Heading>
    </div>
  );
}

/** The orange stitched ribbon with the Tema name. */
export function Ribbon({ children }: { children: ReactNode }) {
  return (
    <div className="drop-shadow-md" data-testid="tema-ribbon">
      <h3
        className="bg-gradient-to-b from-orange-400 to-orange-600 px-7 py-2.5 text-center text-sm leading-tight font-bold tracking-wide text-white uppercase [text-shadow:0_1px_0_#9a3412]"
        style={{
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 14px) 50%, 100% 100%, 0 100%, 14px 50%)',
        }}
      >
        <span className="block rounded border border-dashed border-white/70 px-3 py-0.5">
          {children}
        </span>
      </h3>
    </div>
  );
}

/** A numbered game button on a log pedestal; a tick when the unit is finished, a glow when next. */
export function UnitMarker({
  n,
  done,
  current,
  doneLabel,
}: {
  n: number;
  done: boolean;
  current: boolean;
  doneLabel: string;
}) {
  return (
    <span className="relative block h-full w-full">
      {current && (
        <span
          aria-hidden
          className="absolute inset-[-6%] rounded-full bg-amber-300/70 blur-lg motion-safe:animate-pulse"
        />
      )}
      {stoneUrl ? (
        <img
          src={stoneUrl}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain select-none"
        />
      ) : (
        <span className="absolute inset-x-[6%] top-[4%] bottom-[22%] rounded-full border-4 border-white bg-orange-500 shadow-lg" />
      )}
      <span
        className="absolute inset-x-0 top-[6%] flex h-[68%] items-center justify-center text-3xl font-bold text-white [text-shadow:0_2px_0_#9a3412]"
        data-testid="unit-number"
      >
        {n}
      </span>
      {done && (
        <span className="absolute right-0 bottom-[14%] flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
          <Icon name="check" weight="bold" size={16} />
          <span className="sr-only">{doneLabel}</span>
        </span>
      )}
    </span>
  );
}

const TINTS = [
  {
    card: 'border-orange-300 from-white to-orange-100',
    go: 'bg-orange-500',
    halo: 'bg-orange-100',
  },
  { card: 'border-sky-300 from-white to-sky-100', go: 'bg-sky-500', halo: 'bg-sky-100' },
  {
    card: 'border-violet-300 from-white to-violet-100',
    go: 'bg-violet-500',
    halo: 'bg-violet-100',
  },
] as const;

/** The card beside a stop: unit picture, "Unit N" pill, titles, stars, and a go button. */
export function UnitCard({
  index,
  icon,
  unitLabel,
  title,
  subtitle,
  stars,
  starsId,
}: {
  /** Position in the Tema (0-based): the card colour cycles orange, blue, purple. */
  index: number;
  icon: string | undefined;
  unitLabel: string;
  title: string;
  subtitle: string;
  stars: ReactNode;
  starsId: string;
}) {
  const tint = TINTS[index % TINTS.length]!;
  return (
    <span className="@container block">
      <span
        className={`flex items-center gap-2 rounded-3xl border-2 bg-gradient-to-r p-2 pr-2.5 shadow-md ${tint.card}`}
      >
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tint.halo} @max-[12rem]:hidden`}
          aria-hidden
        >
          {icon ? (
            <img src={icon} alt="" draggable={false} className="h-full w-full object-contain" />
          ) : (
            <Icon name="book" weight="duotone" size={30} className="text-amber-500" />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="w-fit rounded-full bg-yellow-300 px-2 text-xs font-bold text-amber-900">
            {unitLabel}
          </span>
          <span className="text-[1.05rem] leading-tight font-bold text-slate-900" lang="ms">
            {title}
          </span>
          <span className="text-xs leading-tight text-slate-500">{subtitle}</span>
          <span
            className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-white/80 px-2 text-sm font-bold text-amber-600 shadow-sm"
            data-testid={starsId}
          >
            {stars}
          </span>
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow ${tint.go} @max-[12rem]:hidden`}
          aria-hidden
        >
          <Icon name="right" weight="bold" size={18} />
        </span>
      </span>
    </span>
  );
}
