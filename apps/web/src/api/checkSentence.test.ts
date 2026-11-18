import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkSentence, deviceId, type CheckRequest } from './checkSentence';

const req: CheckRequest = {
  word: 'membela',
  wordClass: 'kata kerja',
  year: 3,
  sentence: 'Adik membela kucing.',
  lang: 'en',
};

const respond = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('checkSentence', () => {
  it('posts the request with a stable device id and returns the verdict', async () => {
    const verdict = {
      result: 'correct',
      uses_target_word: true,
      tip: 'Bagus',
      suggested_sentence: null,
    };
    const fetchImpl = respond(200, verdict);
    expect(await checkSentence(req, fetchImpl)).toEqual({ kind: 'ok', response: verdict });
    const [url, init] = fetchImpl.mock.calls[0]! as unknown as [string, RequestInit];
    expect(url).toBe('/api/check-sentence');
    expect(JSON.parse(init.body as string)).toEqual(req);
    const id = (init.headers as Record<string, string>)['X-Device-Id'];
    expect(id).toMatch(/^[A-Za-z0-9-]{16,64}$/);
    expect(deviceId()).toBe(id); // same install, same id
  });

  it('maps errors to friendly outcomes and never throws', async () => {
    expect(await checkSentence(req, respond(429, { error: 'rate_limited' }))).toEqual({
      kind: 'rate_limited',
    });
    expect(await checkSentence(req, respond(503, { error: 'unavailable' }))).toEqual({
      kind: 'unavailable',
    });
    expect(await checkSentence(req, respond(200, { result: 'great!' }))).toEqual({
      kind: 'unavailable',
    });
    const boom = vi.fn(async () => {
      throw new TypeError('network');
    });
    expect(await checkSentence(req, boom)).toEqual({ kind: 'unavailable' });
  });

  it('personal data never leaves the device', async () => {
    const fetchImpl = respond(200, {});
    for (const sentence of ['Telefon saya 0123456789', 'ali@example.com membela'])
      expect(await checkSentence({ ...req, sentence }, fetchImpl)).toEqual({
        kind: 'personal_data',
      });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('offline: does not even try', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const fetchImpl = respond(200, {});
    expect(await checkSentence(req, fetchImpl)).toEqual({ kind: 'offline' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
