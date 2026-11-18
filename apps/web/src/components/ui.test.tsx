import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../i18n';
import { soundEnabled, setSoundEnabled } from '../audio/settings';
import { AudioButton, Header } from './ui';

const played: string[] = [];
class FakeAudio {
  currentTime = 0;
  volume = 1;
  loop = false;
  constructor(public src: string) {}
  play() {
    played.push(this.src);
    return Promise.resolve();
  }
  pause() {}
  addEventListener() {}
}

afterEach(() => {
  vi.unstubAllGlobals();
  played.length = 0;
  setSoundEnabled(true);
  localStorage.clear();
});

describe('AudioButton', () => {
  it('plays the new word when a reused button gets a new src (sampan review #2)', () => {
    vi.stubGlobal('Audio', FakeAudio);
    const { rerender } = render(<AudioButton src="/a.mp3" label="Listen" />);
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
    rerender(<AudioButton src="/b.mp3" label="Listen" />);
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
    expect(played).toEqual(['/a.mp3', '/b.mp3', '/b.mp3']);
  });

  it('is hidden until the audio file exists', () => {
    render(<AudioButton src={undefined} label="Listen" />);
    expect(screen.queryByRole('button', { name: 'Listen' })).toBeNull();
  });

  it('read-aloud still plays when music and sounds are off (it is learning content)', () => {
    vi.stubGlobal('Audio', FakeAudio);
    setSoundEnabled(false);
    render(<AudioButton src="/a.mp3" label="Listen" />);
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
    expect(played).toEqual(['/a.mp3']);
  });
});

describe('sound toggle in the header', () => {
  it('is on by default, switches off, and is remembered', () => {
    render(<Header title="x" />);
    const btn = screen.getByTestId('sound-toggle');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(btn);
    expect(soundEnabled()).toBe(false);
    expect(localStorage.getItem('jk.sound')).toBe('off');
    expect(screen.getByTestId('sound-toggle').getAttribute('aria-pressed')).toBe('false');
  });
});
