/**
 * A board-game style trail (G-3): round stops on a winding dashed path, each with a label
 * card beside it. Used for the units of a Tema on Home and for the four stages of a unit.
 *
 * Layout: each stop is a row in normal flow, at least `spacing` px tall and taller when its
 * label wraps (long titles, 200 % text size), so labels never overlap the next stop. Markers
 * zig-zag between 28 % and 72 % of the width; the label sits on the wider side and the guide
 * (mascot) stands on the other side of the current stop. The dashed path is drawn afterwards
 * through the markers' measured centres, so it always meets them.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Mascot } from './Mascot';

export interface TrailStop {
  key: string;
  /** The round marker (number, icon, padlock…). */
  marker: ReactNode;
  /** The card beside the marker. */
  label: ReactNode;
  /** Wraps marker + label (a link, or a div for a locked stop); it fills the row. */
  wrap: (children: ReactNode) => ReactNode;
}

const GUIDE = 56;
/** Below this the guide would be too small to read, so it is left out. */
const MIN_GUIDE = 32;
const GAP = 6;

interface Point {
  x: number;
  y: number;
}

export function TrailMap({
  stops,
  current,
  spacing = 132,
  pad = 16,
  left = 28,
  right = 72,
  marker: MARKER = 68,
}: {
  stops: TrailStop[];
  /** Index of the stop the child should do next (the guide stands there), or -1. */
  current: number;
  /** Minimum row height in px. */
  spacing?: number;
  pad?: number;
  /** Marker centre, in % of the width, for odd and even stops (default 28 and 72). */
  left?: number;
  right?: number;
  /** Marker diameter in px. */
  marker?: number;
}) {
  const stopX = (i: number) => (i % 2 === 0 ? left : right);
  /** Room beside stop i's marker on its free side (needs the measured width). */
  const guideSize = (i: number) => {
    if (!size.w) return GUIDE; // not measured yet (measured before the first paint in a browser)
    const x = stopX(i);
    const room = ((x < 50 ? x : 100 - x) / 100) * size.w - MARKER / 2 - 2;
    return Math.min(GUIDE, Math.floor(room));
  };
  const box = useRef<HTMLDivElement>(null);
  const markers = useRef<(HTMLSpanElement | null)[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0, points: [] as Point[] });

  // Measure where the markers really are, now and whenever the layout changes.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const points = markers.current
        .slice(0, stops.length)
        .filter((m): m is HTMLSpanElement => !!m)
        .map((m) => {
          const b = m.getBoundingClientRect();
          return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 };
        });
      setSize((prev) =>
        prev.w === r.width &&
        prev.h === r.height &&
        JSON.stringify(prev.points) === JSON.stringify(points)
          ? prev
          : { w: r.width, h: r.height, points },
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stops.length]);

  const { points } = size;
  let d = '';
  points.forEach((p, i) => {
    if (i === 0) d = `M ${p.x} ${p.y}`;
    else {
      const a = points[i - 1]!;
      const mid = (p.y - a.y) / 2;
      d += ` C ${a.x} ${a.y + mid}, ${p.x} ${p.y - mid}, ${p.x} ${p.y}`;
    }
  });

  return (
    <div
      ref={box}
      className="relative w-full"
      style={{ paddingTop: pad, paddingBottom: pad }}
      data-testid="trail"
    >
      {points.length > 1 && (
        <svg
          className="pointer-events-none absolute inset-0"
          width={size.w}
          height={size.h}
          aria-hidden
        >
          <path
            d={d}
            fill="none"
            stroke="white"
            strokeOpacity={0.9}
            strokeWidth={14}
            strokeLinecap="round"
          />
          <path
            d={d}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={4}
            strokeDasharray="2 12"
            strokeLinecap="round"
          />
        </svg>
      )}
      <ol className="relative">
        {stops.map((s, i) => {
          const x = stopX(i);
          const labelOnRight = x < 50;
          const half = MARKER / 2;
          return (
            <li
              key={s.key}
              className="relative flex items-center py-2"
              style={{
                minHeight: spacing,
                // The label takes the wider side, next to the marker.
                ...(labelOnRight
                  ? { paddingLeft: `calc(${x}% + ${half + GAP}px)` }
                  : { paddingRight: `calc(${100 - x}% + ${half + GAP}px)` }),
              }}
              data-current={i === current ? 'true' : undefined}
            >
              {i === current && guideSize(i) >= MIN_GUIDE && (
                <span
                  className="pointer-events-none absolute top-1/2 z-10"
                  style={{
                    marginTop: -half - 10,
                    // Beside the marker, on its free side, facing it; sized to the room there,
                    // so it never covers the marker or leaves the map.
                    left: labelOnRight
                      ? `calc(${x}% - ${half + 2 + guideSize(i)}px)`
                      : `calc(${x}% + ${half + 2}px)`,
                    transform: labelOnRight ? undefined : 'scaleX(-1)',
                  }}
                  data-testid="trail-guide"
                >
                  <Mascot pose="point" size={guideSize(i)} />
                </span>
              )}
              {s.wrap(
                <>
                  <span
                    ref={(el) => {
                      markers.current[i] = el;
                    }}
                    className="absolute top-1/2"
                    style={{
                      left: `calc(${x}% - ${half}px)`,
                      width: MARKER,
                      height: MARKER,
                      marginTop: -half,
                    }}
                    data-testid="trail-marker"
                  >
                    {s.marker}
                  </span>
                  <span className="relative block w-full">{s.label}</span>
                </>,
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
