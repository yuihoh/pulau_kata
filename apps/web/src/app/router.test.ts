import { describe, expect, it } from 'vitest';
import { hrefFor, parseRoute } from './router';

describe('lab routes', () => {
  it('parses the prototype game, with or without a chapter', () => {
    expect(parseRoute('#/lab/sampan')).toEqual({ name: 'lab', game: 'sampan' });
    expect(parseRoute('#/lab/sampan/t3-u02')).toEqual({
      name: 'lab',
      game: 'sampan',
      chapterId: 't3-u02',
    });
  });

  it('unknown lab games go home', () => {
    expect(parseRoute('#/lab/nope')).toEqual({ name: 'home' });
    expect(parseRoute('#/lab')).toEqual({ name: 'home' });
  });

  it('round-trips through hrefFor', () => {
    for (const r of [
      { name: 'lab', game: 'sampan' },
      { name: 'lab', game: 'sampan', chapterId: 't3-u01' },
    ] as const)
      expect(parseRoute(hrefFor(r))).toEqual(r);
  });
});

describe('audio review lab route', () => {
  it('parses and round-trips', () => {
    expect(parseRoute('#/lab/audio')).toEqual({ name: 'lab', game: 'audio' });
    const r = { name: 'lab', game: 'audio', chapterId: 't3-u01' } as const;
    expect(parseRoute(hrefFor(r))).toEqual(r);
  });
});

describe('misi lab route', () => {
  it('parses and round-trips', () => {
    const r = { name: 'lab', game: 'misi', chapterId: 't3-u02' } as const;
    expect(parseRoute('#/lab/misi/t3-u02')).toEqual(r);
    expect(parseRoute(hrefFor(r))).toEqual(r);
  });
});
