import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('home lists chapters and the language can be switched', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Keluarga Tersayang')).toBeVisible();
  await expect(
    page
      .getByText('Choose a chapter')
      .or(page.getByText('Explore Malay words, one chapter at a time')),
  ).toBeVisible();
  await page.getByRole('button', { name: /Language/ }).click();
  await expect(page.getByText('一章一章探索马来语单词')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
});

async function openAllCards(page: Page) {
  const cards = page.locator('[data-testid^="card-"]');
  await expect(cards.first()).toBeVisible(); // count only after the cards have rendered
  const n = await cards.count();
  expect(n).toBe(12);
  for (let i = 0; i < n; i++) {
    await cards.nth(i).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  }
}

async function solvePadankan(page: Page) {
  const cards = page.getByTestId('pad-card');
  const n = await cards.count();
  const wordIds = new Set<string>();
  for (let i = 0; i < n; i++) wordIds.add((await cards.nth(i).getAttribute('data-word-id'))!);
  for (const id of wordIds) {
    await page.locator(`[data-testid="pad-card"][data-word-id="${id}"][data-face="image"]`).click();
    await page.locator(`[data-testid="pad-card"][data-word-id="${id}"][data-face="word"]`).click();
  }
}

test('Kenali: open every card, play Padankan, unlock Uji, progress survives reload', async ({
  page,
}) => {
  await page.goto('/#/c/t3-u01');
  await page.getByTestId('stage-kenali').click();

  const play = page.getByRole('button', { name: /Play Padankan/ });
  await expect(play).toBeDisabled();
  await openAllCards(page);
  await expect(page.getByText('12 of 12 cards opened')).toBeVisible();
  await play.click();

  await solvePadankan(page);
  await expect(page.getByTestId('stage-result')).toBeVisible();
  await expect(page.getByText('You got 3 stars!')).toBeVisible();

  await page.getByRole('link', { name: 'Back to chapter' }).click();
  await expect(page.getByTestId('stage-uji').locator('[data-locked]')).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId('stage-kenali')).toHaveAttribute('href', /kenali/);
  await expect(page.getByTestId('stage-uji').locator('[data-locked]')).toHaveCount(0);
});

// G-1 review #1: a star burst on a card at the screen edge must not make a narrow phone
// scroll sideways.
test('star bursts never make a 320px-wide phone scroll sideways', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/#/c/t3-u01/kenali');
  await openAllCards(page);
  await page.getByRole('button', { name: /Play Padankan/ }).click();
  const cards = page.getByTestId('pad-card');
  await expect(cards.first()).toBeVisible();
  const n = await cards.count();
  let widest = 0;
  for (let i = 0; i < n; i++) {
    const id = (await cards.nth(i).getAttribute('data-word-id'))!;
    const pair = page.locator(`[data-testid="pad-card"][data-word-id="${id}"]`);
    if ((await pair.first().getAttribute('data-up')) === 'true') continue;
    await pair.nth(0).click();
    await pair.nth(1).click();
    for (let k = 0; k < 4; k++) {
      widest = Math.max(
        widest,
        await page.evaluate(() => document.scrollingElement!.scrollWidth - window.innerWidth),
      );
      await page.waitForTimeout(100);
    }
    if (widest > 0) break;
  }
  expect(widest).toBeLessThanOrEqual(0);
});

const unit1 = JSON.parse(
  readFileSync(
    new URL('../../../../content/tahun-3/unit-01/chapter.json', import.meta.url),
    'utf8',
  ),
) as { words: { id: string; word: string; jumbled_sentence: string[] }[] };
const wordById = new Map(unit1.words.map((w) => [w.id, w.word]));
const sentenceById = new Map(unit1.words.map((w) => [w.id, w.jumbled_sentence]));

async function answerUjiQuestion(page: Page) {
  const q = page.getByTestId('question');
  const wordId = (await q.getAttribute('data-word-id'))!;
  if ((await q.getAttribute('data-type')) === 'unscramble') {
    for (const letter of wordById.get(wordId)!.replace(/[\s-]/g, '')) {
      await page.locator(`[data-testid="tile"][data-letter="${letter}"]:enabled`).first().click();
    }
  } else {
    await page.locator(`[data-testid="option"][data-option-id="${wordId}"]`).click();
  }
  await expect(page.getByText('Betul!')).toBeVisible();
  // Wait for the auto-advance so the next read sees the next question.
  await expect(page.getByText('Betul!')).toBeHidden();
}

test('Sampan Kata prototype: steer into the right buoy', async ({ page }) => {
  await page.goto('/#/lab/sampan/t3-u01');
  await page.getByTestId('unit-t3-u01').click();
  await page.getByRole('button', { name: /Start/ }).click();
  const id = (await page.getByTestId('sampan-prompt').getAttribute('data-word-id'))!;
  const target = Number(
    await page.locator(`[data-testid="buoy"][data-option-id="${id}"]`).getAttribute('data-lane'),
  );
  // Tap the lane on the river (the same as a child's tap).
  const box = (await page.getByTestId('river').boundingBox())!;
  await page.mouse.click(box.x + (box.width * (target + 0.5)) / 3, box.y + box.height * 0.6);
  await expect(page.getByTestId('boat')).toHaveAttribute('data-lane', String(target));
  await expect(page.getByText(/Betul!/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('score')).not.toHaveText('0');
});

test('Uji then Bina: after Kenali, answer every question, build and write sentences', async ({
  page,
}) => {
  test.setTimeout(120_000); // three stages in one run
  await page.goto('/#/c/t3-u01/kenali');
  await openAllCards(page);
  await page.getByRole('button', { name: /Play Padankan/ }).click();
  await solvePadankan(page);
  await page.getByRole('link', { name: /Next: Uji/ }).click();

  for (let i = 0; i < 12; i++) {
    await expect(page.getByTestId('question')).toBeVisible();
    await answerUjiQuestion(page);
  }
  await expect(page.getByTestId('stage-result')).toBeVisible();
  await expect(page.getByText('You got 3 stars!')).toBeVisible();

  // Stage 3 Bina, with the sentence check served by the Worker handler (mock AI).
  await page.getByRole('link', { name: /Next: Bina/ }).click();
  for (let i = 0; i < 5; i++) {
    const wordId = (await page.getByTestId('susun').getAttribute('data-word-id'))!;
    for (const w of sentenceById.get(wordId)!)
      await page.locator(`[data-testid="word-tile"][data-text="${w}"]:enabled`).first().click();
    await expect(page.getByText('Betul!')).toBeVisible();
    await expect(page.getByText('Betul!')).toBeHidden();
  }
  for (const [id, sentence] of [
    ['membela', 'Adik membela seekor kucing.'],
    ['menjaga', 'Kakak menjaga adik di rumah.'],
  ] as const) {
    await page.getByTestId(`pick-${id}`).click();
    await page.getByTestId('sentence-input').fill(sentence);
    await page.getByRole('button', { name: 'Check my sentence' }).click();
    await expect(page.getByTestId('verdict')).toHaveAttribute('data-result', 'correct');
    await page.getByRole('button', { name: /Next|Finish/ }).click();
  }
  await expect(page.getByTestId('stage-result')).toBeVisible();
  await expect(page.getByText('You got 3 stars!')).toBeVisible();
});

test('the check-sentence API rejects bad input and extra fields', async ({ request }) => {
  const headers = { 'X-Device-Id': 'e2e-device-0123456789' };
  const good = {
    word: 'membela',
    wordClass: 'kata kerja',
    year: 3,
    sentence: 'membela',
    lang: 'en',
  };
  const res = await request.post('/api/check-sentence', { headers, data: good });
  expect(res.status()).toBe(200);
  expect((await res.json()).result).toBe('try_again');
  const extra = await request.post('/api/check-sentence', {
    headers,
    data: { ...good, childName: 'x' },
  });
  expect(extra.status()).toBe(400);
});

const unit2Quest = JSON.parse(
  readFileSync(new URL('../../../../content/tahun-3/unit-02/quest.json', import.meta.url), 'utf8'),
) as {
  scenes: {
    id: string;
    steps: { kind: string; line: { bm: string }; word?: string; answer?: string }[];
  }[];
};
const unit2 = JSON.parse(
  readFileSync(
    new URL('../../../../content/tahun-3/unit-02/chapter.json', import.meta.url),
    'utf8',
  ),
) as { words: { id: string; word: string }[] };

test('Misi prototype: play the whole forest adventure', async ({ page }) => {
  await page.goto('/#/lab/misi/t3-u02');
  await page.getByRole('button', { name: /Start the adventure/ }).click();
  for (const scene of unit2Quest.scenes) {
    await expect(page.getByTestId('scene')).toHaveAttribute('data-scene', scene.id);
    for (const step of scene.steps) {
      if (step.kind === 'choose') {
        const word = unit2.words.find((w) => w.id === step.word)!.word;
        await page.locator(`[data-testid="misi-option"][data-option="${word}"]`).click();
      } else if (step.kind === 'find') {
        await page.locator(`[data-testid="prop"][data-prop-id="${step.answer}"]`).click();
      }
      await page.getByRole('button', { name: /Next/ }).click();
    }
  }
  await expect(page.getByTestId('misi-result')).toBeVisible();
  await expect(page.getByText('You got 3 stars!')).toBeVisible();
});

/** Seeds IndexedDB progress (the app's own store) so a test can start at a later stage. */
async function seedProgress(page: Page, stages: string[]) {
  await page.goto('/');
  await page.evaluate(
    async ({ ids, stages }) => {
      const now = new Date().toISOString();
      const all = ['kenali', 'uji', 'bina', 'cabaran'];
      const data = {
        chapterId: 't3-u01',
        cardsOpened: ids,
        stages: Object.fromEntries(
          all.map((s) => [s, stages.includes(s) ? { stars: 3, completedAt: now } : { stars: 0 }]),
        ),
      };
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('jelajah-kata');
        req.onupgradeneeded = () => req.result.createObjectStore('progress');
        req.onsuccess = () => {
          const tx = req.result.transaction('progress', 'readwrite');
          tx.objectStore('progress').put({ v: 1, data }, 'chapter:t3-u01');
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      });
    },
    { ids: unit1.words.map((w) => w.id), stages },
  );
}

test('Cabaran Akhir: a full boat round completes the unit and earns the postcard', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await seedProgress(page, ['kenali', 'uji', 'bina']);
  await page.goto('/#/c/t3-u01');
  await page.reload(); // a hash change alone doesn't reload the seeded progress
  await expect(page.getByTestId('stage-cabaran')).toHaveAttribute('href', /cabaran/);
  await page.getByTestId('stage-cabaran').click();
  // Relaxed mode keeps the river slow, so a busy test machine still steers in time.
  await page.getByRole('checkbox', { name: /Relaxed mode/ }).check();
  await page.getByRole('button', { name: /Start/ }).click();
  const result = page.getByTestId('stage-result');
  // Short waits: the round can end (prompt gone) between two reads.
  const read = (sel: string, attr: string) =>
    page
      .locator(sel)
      .first()
      .getAttribute(attr, { timeout: 500 })
      .catch(() => null);
  while (!(await result.isVisible())) {
    const id = await read('[data-testid="sampan-prompt"]', 'data-word-id');
    const target = id && (await read(`[data-testid="buoy"][data-option-id="${id}"]`, 'data-lane'));
    const boat = await read('[data-testid="boat"]', 'data-lane');
    if (target && boat)
      for (let i = 0; i < Math.abs(Number(target) - Number(boat)); i++)
        await page.keyboard.press(Number(target) > Number(boat) ? 'ArrowRight' : 'ArrowLeft');
    await page.waitForTimeout(250);
  }
  await expect(page.getByText(/You got [123] stars?!/)).toBeVisible();
  await expect(page.getByTestId('unit-complete')).toBeVisible();
  await page.getByRole('link', { name: /See my Koleksi/ }).click();
  await expect(page.getByTestId('koleksi-postcard:t3-u01')).toHaveAttribute('data-earned', 'true');
});

test('voice review page: rows fit the screen and a clip can be flagged', async ({ page }) => {
  await page.goto('/#/lab/audio/t3-u01');
  const rows = page.getByTestId('clip');
  await expect(rows).toHaveCount(24); // 12 words + 12 examples (Unit 1 has no Misi)
  const viewport = page.viewportSize()!;
  // Regression: long meanings once stretched rows far past the screen edge on a phone.
  for (const i of [0, 11, 23]) {
    const box = (await rows.nth(i).boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  }
  await page.getByRole('checkbox', { name: /Needs fixing: ambil berat$/ }).check();
  await expect(page.getByTestId('flagged-title')).toHaveText('Needs fixing (1)');
  await expect(page.getByTestId('flagged-text')).toHaveValue(/audio\/ambil-berat\.mp3/);
});

test('Tahun 5: Home lists both years; a Tahun 5 unit opens and its word cards show', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Bahasa Melayu Tahun 3' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bahasa Melayu Tahun 5' })).toBeVisible();
  await page.getByText('Riangnya Keluargaku').click();
  await expect(page.getByTestId('stage-kenali')).toBeVisible();
  await page.getByTestId('stage-kenali').click();
  const cards = page.locator('[data-testid^="card-"]');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBe(12);
  await cards.first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('idaman', { exact: true }).first()).toBeVisible();
  // The picture really loads (not the placeholder), and the read-aloud button is there.
  await expect(dialog.locator('img').first()).toBeVisible();
  // task-07c review #6: poll, because a visible lazy image may not have finished loading yet.
  await expect
    .poll(() =>
      dialog
        .locator('img')
        .first()
        .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
    )
    .toBe(true);
  await expect(dialog.getByRole('button', { name: /Listen|Play/i }).first()).toBeVisible();
});

// G-3 / G-3b reviews: on small phones, at normal and doubled text size, the Home map holds:
// labels never overlap the next stop, markers and the guide stay inside the map, the guide never
// covers a marker, the sign's text stays on the sign, the unit title keeps a readable width,
// the path exists and the page never scrolls sideways.
for (const width of [320, 393]) {
  for (const scale of [1, 2]) {
    test(`Home map layout holds at ${width}px with text x${scale}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('/');
      if (scale !== 1)
        await page.addStyleTag({ content: `html { font-size: ${16 * scale}px !important; }` });
      await expect(page.getByTestId('unit-stop-t3-u01')).toBeVisible();
      await page.waitForTimeout(300); // let the path re-measure
      const problems = await page.evaluate(() => {
        const out: string[] = [];
        const rect = (e: Element) => e.getBoundingClientRect();
        const overlap = (a: DOMRect, b: DOMRect) =>
          a.left < b.right - 1 &&
          b.left < a.right - 1 &&
          a.top < b.bottom - 1 &&
          b.top < a.bottom - 1;
        for (const trail of document.querySelectorAll('[data-testid="trail"]')) {
          const box = rect(trail);
          const rows = [...trail.querySelectorAll(':scope > ol > li')];
          const parts = rows.map((li) => ({
            marker: rect(li.querySelector('[data-testid="trail-marker"]')!),
            label: rect(li.querySelector('[data-testid="trail-marker"] ~ *')!),
          }));
          parts.forEach((p, i) => {
            if (p.marker.left < box.left - 1 || p.marker.right > box.right + 1)
              out.push(`marker ${i} outside the map`);
            if (overlap(p.marker, p.label)) out.push(`marker ${i} covers its label`);
            const next = parts[i + 1];
            if (next && (overlap(p.label, next.label) || overlap(p.label, next.marker)))
              out.push(`row ${i} overlaps row ${i + 1}`);
          });
          const guide = trail.querySelector('[data-testid="trail-guide"]');
          if (guide) {
            const g = rect(guide);
            if (g.left < box.left - 1 || g.right > box.right + 1) out.push('guide outside the map');
            for (const [i, p] of parts.entries())
              if (overlap(g, p.marker)) out.push(`guide covers marker ${i}`);
          }
          if (rows.length > 1 && !trail.querySelector('svg path')) out.push('no path');
          // The unit title must keep a readable column (not squeezed by picture + chevron).
          for (const t of trail.querySelectorAll('[lang="ms"]')) {
            const card = t.closest('a')!;
            if (rect(t).width < 60) out.push(`title squeezed to ${Math.round(rect(t).width)}px`);
            if (rect(t).right > rect(card).right + 1) out.push('title overflows its card');
          }
        }
        for (const sign of document.querySelectorAll('[data-testid="wood-sign"]')) {
          const s = rect(sign);
          for (const el of sign.querySelectorAll('h2 > span')) {
            const r = rect(el);
            if (r.left < s.left - 1 || r.right > s.right + 1 || r.bottom > s.bottom + 1)
              out.push('sign text outside the sign');
          }
        }
        if (document.scrollingElement!.scrollWidth > window.innerWidth)
          out.push('page scrolls sideways');
        return out;
      });
      expect(problems).toEqual([]);
    });
  }
}

// G-6 review #1/#2/#3/#4 (Sampan Kata on a small phone, 320x568): everything fits without
// scrolling, the header controls are inside the screen, buoys never sail past the boat's top
// edge, and pausing during feedback puts the pause screen above the feedback card.
test('Sampan Kata fits a 320x568 phone; buoys stop at the boat; pause covers feedback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/#/lab/sampan');
  await page.getByRole('button', { name: /Start/ }).click();
  await expect(page.getByTestId('river')).toBeVisible();
  const fit = await page.evaluate(() => {
    const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
    const buttons = [...document.querySelectorAll('button')].filter((b) =>
      /Steer/.test(b.getAttribute('aria-label') ?? ''),
    );
    return {
      steerBottom: Math.max(...buttons.map((b) => b.getBoundingClientRect().bottom)),
      langRight: r('header button:last-of-type').right,
      riverHeight: r('[data-testid=river]').height,
      sideways: document.scrollingElement!.scrollWidth - window.innerWidth,
      inner: window.innerHeight,
    };
  });
  expect(fit.steerBottom).toBeLessThanOrEqual(fit.inner);
  expect(fit.langRight).toBeLessThanOrEqual(320);
  expect(fit.riverHeight).toBeGreaterThanOrEqual(200);
  expect(fit.sideways).toBeLessThanOrEqual(0);

  // Watch the buoys arrive: none may reach below the boat's top edge.
  const worst = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let max = -999;
        const t0 = performance.now();
        const tick = () => {
          const boat = document.querySelector('[data-testid=boat]')!.getBoundingClientRect();
          // Only buoys still sailing: after an answer the boat wobbles, which enlarges its box.
          for (const b of document.querySelectorAll('[data-testid=buoy][data-state=idle]'))
            max = Math.max(max, b.getBoundingClientRect().bottom - boat.top);
          if (performance.now() - t0 < 7000) requestAnimationFrame(tick);
          else resolve(max);
        };
        tick();
      }),
  );
  expect(worst).toBeLessThanOrEqual(4);

  // Pause while a feedback card is showing: the topmost element at the river's centre is the
  // pause screen.
  await expect(page.locator('[data-testid=river] [role=status]')).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Pause' }).click();
  const top = await page.evaluate(() => {
    const r = document.querySelector('[data-testid=river]')!.getBoundingClientRect();
    return document
      .elementFromPoint(r.left + r.width / 2, r.top + r.height / 3)
      ?.closest('[data-testid=river] > div')?.textContent;
  });
  expect(top).toContain('Paused');
});
