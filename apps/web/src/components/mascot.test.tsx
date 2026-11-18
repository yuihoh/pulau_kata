/** G-2: the hornbill guide. */
import { act, render, screen } from '@testing-library/react';
import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Mascot, MascotSays, MASCOT_POSES, mascotUrl } from './Mascot';

const wrap = (ui: React.ReactNode) => (
  <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="never">{ui}</MotionConfig>
  </LazyMotion>
);

describe('Mascot', () => {
  it('has a small transparent WebP for every pose (and its source PNG is kept)', () => {
    const root = join(__dirname, '..', '..', '..', '..');
    for (const pose of MASCOT_POSES) {
      expect(mascotUrl(pose), pose).toBeTruthy();
      const webp = join(__dirname, '..', 'assets', 'mascot', `${pose}.webp`);
      expect(statSync(webp).size, `${pose}.webp size`).toBeLessThan(40 * 1024);
      expect(existsSync(join(root, 'assets-src', 'mascot', `${pose}.png`)), `${pose}.png`).toBe(
        true,
      );
    }
  });

  it('is decoration: hidden from screen readers, the text beside it carries the meaning', () => {
    render(wrap(<MascotSays pose="wave">Hello there</MascotSays>));
    const img = screen.getByTestId('mascot');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
    expect(img.dataset.pose).toBe('wave');
    expect(screen.getByText('Hello there')).toBeTruthy();
  });

  it('shows the requested pose at the requested size', () => {
    render(wrap(<Mascot pose="cheer" size={64} />));
    const img = screen.getByTestId('mascot') as HTMLImageElement;
    expect(img.dataset.pose).toBe('cheer');
    expect(img.getAttribute('width')).toBe('64');
    expect(img.src).toContain('cheer');
  });
});

// G-2 review #1/#2: the bob stops by itself, and switching reduce-motion on while a screen
// is open stops the mascot at once (framer only reads the setting at mount).
describe('Mascot motion', () => {
  it('follows the phone reduce-motion setting live', () => {
    const listeners = new Set<() => void>();
    let matches = false;
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      get matches() {
        return matches;
      },
      media: q,
      addEventListener: (_: string, l: () => void) => listeners.add(l),
      removeEventListener: (_: string, l: () => void) => listeners.delete(l),
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    try {
      render(wrap(<Mascot pose="wave" />));
      expect(screen.getByTestId('mascot').dataset.motion).toBe('move');
      act(() => {
        matches = true;
        listeners.forEach((l) => l());
      });
      expect(screen.getByTestId('mascot').dataset.motion).toBe('still');
    } finally {
      window.matchMedia = original;
    }
  });
});
