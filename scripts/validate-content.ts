/**
 * Validates every track under content/ (CLAUDE.md §6).
 *
 *   npm run validate-content            # CI / PRs
 *   npm run validate-content -- --strict  # production deploy
 *
 * Media rule: missing images/audio are warnings in normal mode (the app shows placeholders
 * in dev/staging) and errors with --strict. --strict also fails on any unreviewed chapter,
 * because unreviewed BM content must never reach production.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { z } from 'zod';
import {
  ChapterSchema,
  QuestSchema,
  TrackSchema,
  type Chapter,
} from '../apps/web/src/content/schema';
import { checkChapter, checkQuest, checkTrack, type Issue } from '../apps/web/src/content/validate';

const root = fileURLToPath(new URL('..', import.meta.url));
const contentDir = join(root, 'content');
const strict = process.argv.includes('--strict');

const issues: Issue[] = [];
const rel = (p: string) => relative(root, p).replaceAll('\\', '/');

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    issues.push({ severity: 'error', where: rel(path), message: `invalid JSON: ${String(e)}` });
    return undefined;
  }
}

function zodIssues(path: string, err: z.ZodError) {
  for (const i of err.issues)
    issues.push({
      severity: 'error',
      where: `${rel(path)}:${i.path.join('.')}`,
      message: i.message,
    });
}

let chapterCount = 0;
let wordCount = 0;
let questCount = 0;

const tracks = existsSync(contentDir)
  ? readdirSync(contentDir, { withFileTypes: true }).filter((d) => d.isDirectory())
  : [];

/** Tracks that must exist; an accidentally deleted content/ folder must not pass the gate. */
const REQUIRED_TRACKS = ['tahun-3', 'tahun-5'];
for (const name of REQUIRED_TRACKS)
  if (!tracks.some((t) => t.name === name))
    issues.push({ severity: 'error', where: `content/${name}`, message: 'required track missing' });

for (const t of tracks) {
  const trackDir = join(contentDir, t.name);
  const trackPath = join(trackDir, 'track.json');
  if (!existsSync(trackPath)) {
    issues.push({ severity: 'error', where: rel(trackDir), message: 'missing track.json' });
    continue;
  }
  const track = TrackSchema.safeParse(readJson(trackPath));
  if (!track.success) {
    zodIssues(trackPath, track.error);
    continue;
  }

  const chapters = new Map<string, Chapter>();
  const unitDirs = readdirSync(trackDir, { withFileTypes: true }).filter(
    (d) => d.isDirectory() && /^unit-\d{2}$/.test(d.name),
  );

  for (const u of unitDirs) {
    const dir = join(trackDir, u.name);
    const path = join(dir, 'chapter.json');
    if (!existsSync(path)) {
      issues.push({ severity: 'error', where: rel(dir), message: 'missing chapter.json' });
      continue;
    }
    const parsed = ChapterSchema.safeParse(readJson(path));
    if (!parsed.success) {
      zodIssues(path, parsed.error);
      continue;
    }
    const ch = parsed.data;
    chapters.set(u.name, ch);
    chapterCount++;
    wordCount += ch.words.length;
    issues.push(...checkChapter(ch));

    if (!ch.reviewed && strict)
      issues.push({ severity: 'error', where: ch.id, message: 'not reviewed (--strict)' });

    const mediaSeverity = strict ? 'error' : 'warning';
    let missing = 0;
    for (const w of ch.words) {
      for (const f of [`images/${w.image}`, `audio/${w.audio}`]) {
        if (!existsSync(join(dir, f))) {
          missing++;
          if (mediaSeverity === 'error')
            issues.push({ severity: 'error', where: `${ch.id}/${f}`, message: 'file missing' });
        }
      }
    }
    if (missing && mediaSeverity === 'warning')
      issues.push({
        severity: 'warning',
        where: ch.id,
        message: `${missing} image/audio file(s) missing (placeholders allowed outside --strict)`,
      });

    // Optional Misi (story quest) for this unit.
    const questPath = join(dir, 'quest.json');
    if (existsSync(questPath)) {
      const q = QuestSchema.safeParse(readJson(questPath));
      if (!q.success) zodIssues(questPath, q.error);
      else {
        questCount++;
        issues.push(...checkQuest(q.data, ch));
        if (!q.data.reviewed && strict)
          issues.push({ severity: 'error', where: q.data.id, message: 'not reviewed (--strict)' });
        const files = [
          ...q.data.characters.map((c) => c.portrait),
          ...q.data.scenes.flatMap((s) => [s.background, ...s.props.map((p) => p.image)]),
          q.data.reward.image,
        ];
        // Source PNGs are converted to WebP in the build pipeline (task 9).
        for (const f of new Set(files)) {
          const base = join(dir, 'quest', f);
          if (!existsSync(base) && !existsSync(base.replace(/\.webp$/, '.png')))
            issues.push({
              severity: mediaSeverity,
              where: `${q.data.id}/quest/${f}`,
              message: 'file missing',
            });
        }
      }
    }
  }

  issues.push(...checkTrack(track.data, chapters));
}

const errors = issues.filter((i) => i.severity === 'error');
const warnings = issues.filter((i) => i.severity === 'warning');
for (const i of warnings) console.warn(`  warn  ${i.where}: ${i.message}`);
for (const i of errors) console.error(`  ERROR ${i.where}: ${i.message}`);
console.log(
  `validate-content${strict ? ' --strict' : ''}: ${tracks.length} track(s), ${chapterCount} chapter(s), ` +
    `${wordCount} word(s), ${questCount} quest(s) — ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length ? 1 : 0);
