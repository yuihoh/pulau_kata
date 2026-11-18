/** The Home map's pieces: sign, ribbon, numbered stone, unit card (Yang's mockups, 18 Nov 2026). */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Ribbon, splitTrackTitle, UnitCard, UnitMarker, WoodSign } from './HomeParts';

describe('splitTrackTitle', () => {
  it('splits the subject from the school year', () => {
    expect(splitTrackTitle('Bahasa Melayu Tahun 3')).toEqual({
      subject: 'Bahasa Melayu',
      year: 'Tahun 3',
    });
    expect(splitTrackTitle('Bahasa Melayu Tahun 12')).toEqual({
      subject: 'Bahasa Melayu',
      year: 'Tahun 12',
    });
  });
  it('keeps a title without a year whole', () => {
    expect(splitTrackTitle('Bahasa Melayu')).toEqual({ subject: 'Bahasa Melayu', year: null });
  });
});

describe('Home map pieces', () => {
  it('the sign shows the subject and the year as real, translatable text', () => {
    render(<WoodSign title="Bahasa Melayu Tahun 5" />);
    const sign = screen.getByTestId('wood-sign');
    expect(within(sign).getByRole('heading', { level: 2 }).textContent).toContain('Bahasa Melayu');
    expect(within(sign).getByText('Tahun 5')).toBeTruthy();
  });

  it('the ribbon is a heading with the Tema name', () => {
    render(<Ribbon>Theme 1 · Keluarga Bahagia</Ribbon>);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(
      'Theme 1 · Keluarga Bahagia',
    );
  });

  it('the stone marker shows the unit number; a tick (with a spoken label) only when finished', () => {
    const { rerender } = render(
      <UnitMarker n={2} done={false} current={false} doneLabel="Finished" />,
    );
    expect(screen.getByTestId('unit-number').textContent).toBe('2');
    expect(screen.queryByText('Finished')).toBeNull();
    rerender(<UnitMarker n={2} done current doneLabel="Finished" />);
    expect(screen.getByText('Finished')).toBeTruthy();
  });

  it('the unit card cycles orange, blue, purple, and falls back without a picture', () => {
    const tints = [0, 1, 2, 3].map((i) => {
      const { container, unmount } = render(
        <UnitCard
          index={i}
          icon={undefined}
          unitLabel="Unit 1"
          title="Keluarga Tersayang"
          subtitle="My Beloved Family"
          stars="3 / 12"
          starsId={`s${i}`}
        />,
      );
      const cls = (container.querySelector('.border-2') as HTMLElement).className;
      unmount();
      return /border-(orange|sky|violet)-300/.exec(cls)![1];
    });
    expect(tints).toEqual(['orange', 'sky', 'violet', 'orange']);
  });
});
