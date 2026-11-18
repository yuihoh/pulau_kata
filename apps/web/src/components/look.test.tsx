/**
 * G-1 look and feel: our own icon set instead of emoji, one colour per Tema, game-feel
 * feedback (bounce / shake / stars / confetti) that respects "reduce motion".
 */
import { act, render, screen } from '@testing-library/react';
import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { answerMotion, Confetti, StarBurst } from './celebrate';
import { Icon, ICON_NAMES } from './Icon';
import { temaColour } from './tema';
import { Stars } from './ui';

const withMotion = (ui: React.ReactNode, reduced = false) => (
  <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{ui}</MotionConfig>
  </LazyMotion>
);

describe('Icon', () => {
  it('renders every icon in the set as an SVG', () => {
    const { container } = render(
      <>
        {ICON_NAMES.map((n) => (
          <Icon key={n} name={n} />
        ))}
      </>,
    );
    expect(container.querySelectorAll('svg')).toHaveLength(ICON_NAMES.length);
  });

  it('is hidden from screen readers unless it is given a label', () => {
    const { container } = render(<Icon name="star" />);
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    render(<Icon name="lock" label="Locked" />);
    expect(screen.getByRole('img', { name: 'Locked' })).toBeTruthy();
  });
});

describe('Tema colours', () => {
  it('gives each of the 8 Tema its own colour and wraps after that', () => {
    const solids = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => temaColour(n).solid);
    expect(new Set(solids).size).toBe(8);
    expect(temaColour(1).solid).toBe('bg-orange-400'); // Tema 1 family = warm orange
    expect(temaColour(9)).toEqual(temaColour(1));
  });
});

describe('feedback', () => {
  it('bounces a right answer and shakes a wrong one', () => {
    expect(answerMotion('right').scale).toBeDefined();
    expect(answerMotion('wrong').x).toBeDefined();
    expect(answerMotion('idle')).toEqual({ scale: 1, x: 0 });
  });

  it('shows stars and confetti, but not when the phone asks for reduced motion', () => {
    const { unmount } = render(
      withMotion(
        <>
          <StarBurst />
          <Confetti />
        </>,
      ),
    );
    expect(screen.getByTestId('star-burst')).toBeTruthy();
    expect(screen.getByTestId('confetti')).toBeTruthy();
    unmount();

    // The app passes reducedMotion="user" (the phone's setting); "always" stands in for it.
    render(
      withMotion(
        <>
          <StarBurst />
          <Confetti />
        </>,
        true,
      ),
    );
    expect(screen.queryByTestId('star-burst')).toBeNull();
    expect(screen.queryByTestId('confetti')).toBeNull();
  });

  // G-1 review #1: finished bursts are removed (no invisible particles left behind).
  it('removes the star burst once it has played', () => {
    vi.useFakeTimers();
    try {
      render(withMotion(<StarBurst />));
      expect(screen.getByTestId('star-burst')).toBeTruthy();
      act(() => {
        vi.advanceTimersByTime(900);
      });
      expect(screen.queryByTestId('star-burst')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('Stars draws earned and empty stars as icons and keeps its label', () => {
    render(withMotion(<Stars count={2} animate />));
    const stars = screen.getByRole('img', { name: '2/3 ★' });
    expect(stars.querySelectorAll('svg')).toHaveLength(3);
  });
});

/**
 * Removes // and /* *\/ comments from TS/TSX source while leaving string, template and JSX
 * text intact (a small scanner, so a "//" inside a URL string is not taken as a comment).
 * An apostrophe in JSX text may start a fake string; that can only make the guard stricter.
 */
function stripComments(src: string): string {
  let out = '';
  let i = 0;
  let quote: string | null = null;
  while (i < src.length) {
    const c = src[i]!;
    const next = src[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') {
        out += next ?? '';
        i += 2;
        continue;
      }
      if (c === quote || (c === '\n' && quote !== '`')) quote = null;
      i++;
      continue;
    }
    if (c === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 2;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    out += c;
    i++;
  }
  return out;
}

/**
 * Emoji look different on every phone, so screens use <Icon>. Source comments may still
 * mention them. Known exceptions: the boat sprite inside the Sampan Kata river (redrawn in
 * G-6) and the ▶ on the voice-review lab page.
 */
describe('no emoji in the UI', () => {
  const SRC = join(__dirname, '..');
  const ALLOWED: Record<string, string[]> = {
    'games/SampanKata.tsx': ['🛶'],
    'games/AudioReview.tsx': ['▶'],
    'i18n/en.json': ['▶'],
    'i18n/zh.json': ['▶'],
  };
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) return files(p);
      return /\.(tsx|json)$/.test(f) && !/\.test\./.test(f) ? [p] : [];
    });

  it('the comment stripper keeps strings and JSX text, and drops only real comments', () => {
    const src = [
      "const url = 'https://x.y/*not a comment*/'; // 🔊 comment",
      '/* 🔒 block */ const a = `tpl // 🎉 kept`;',
      '<p>{/* 🧩 jsx comment */}hi 🛶 there</p>',
    ].join('\n');
    const out = stripComments(src);
    expect(out).toContain("'https://x.y/*not a comment*/'");
    expect(out).toContain('`tpl // 🎉 kept`');
    expect(out).toContain('hi 🛶 there');
    expect(out).not.toMatch(/🔊|🔒|🧩/u);
  });

  it('screens and UI strings use icons, not emoji', () => {
    const found: string[] = [];
    for (const file of files(SRC)) {
      const rel = file.slice(SRC.length + 1).replaceAll('\\', '/');
      const raw = readFileSync(file, 'utf8');
      const code = file.endsWith('.json') ? raw : stripComments(raw);
      for (const m of code.matchAll(/\p{Extended_Pictographic}/gu)) {
        if (m[0] === '★' || m[0] === '©') continue; // text star in an aria-label
        if (ALLOWED[rel]?.includes(m[0])) continue;
        found.push(`${rel}: ${m[0]}`);
      }
    }
    expect(found).toEqual([]);
  });
});
