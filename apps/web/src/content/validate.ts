/**
 * Content validation rules (CLAUDE.md §6). Pure functions: no file system access,
 * so the same rules run in the CLI script, in unit tests, and (if needed) in the app.
 */
import type { Chapter, Quest, Track } from './schema';

export type Severity = 'error' | 'warning';
export interface Issue {
  severity: Severity;
  where: string;
  message: string;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** True if `phrase` occurs in `text` as whole word(s), ignoring case. */
export function containsPhrase(text: string, phrase: string): boolean {
  const escaped = norm(phrase).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}-])${escaped}($|[^\\p{L}-])`, 'u').test(norm(text));
}

export function checkChapter(chapter: Chapter): Issue[] {
  const issues: Issue[] = [];
  const add = (severity: Severity, where: string, message: string) =>
    issues.push({ severity, where: `${chapter.id}/${where}`, message });

  const ids = new Set<string>();
  const words = new Set<string>();

  for (const w of chapter.words) {
    const at = w.id;

    if (ids.has(w.id)) add('error', at, `duplicate word id "${w.id}" in chapter`);
    ids.add(w.id);
    if (words.has(norm(w.word))) add('error', at, `duplicate word "${w.word}" in chapter`);
    words.add(norm(w.word));

    if (w.image !== `${w.id}.webp`) add('error', at, `image should be "${w.id}.webp"`);
    if (w.audio !== `${w.id}.mp3`) add('error', at, `audio should be "${w.id}.mp3"`);

    w.blank_sentences.forEach((s, i) => {
      const blanks = s.match(/_+/g) ?? [];
      if (blanks.length !== 1 || blanks[0] !== '___')
        add('error', `${at}.blank_sentences[${i}]`, 'must contain exactly one "___"');
    });

    const jumbled = w.jumbled_sentence.join(' ');
    if (!containsPhrase(jumbled, w.word))
      add('error', `${at}.jumbled_sentence`, `"${jumbled}" does not contain "${w.word}"`);

    if (!containsPhrase(w.example.bm, w.word))
      add('warning', `${at}.example.bm`, `example does not contain "${w.word}"`);

    const seen = new Set<string>();
    for (const d of w.distractors) {
      if (norm(d) === norm(w.word)) add('error', `${at}.distractors`, `distractor equals the word`);
      if (seen.has(norm(d))) add('error', `${at}.distractors`, `duplicate distractor "${d}"`);
      seen.add(norm(d));
    }

    // Same word class "where possible": we only know classes of words in this chapter.
    for (const d of w.distractors) {
      const other = chapter.words.find((o) => norm(o.word) === norm(d));
      if (other && other.class !== w.class)
        add('warning', `${at}.distractors`, `"${d}" is ${other.class}, word is ${w.class}`);
    }
  }

  return issues;
}

/**
 * Misi (story quest) rules. Walks the quest in order, tracking which props are visible, so
 * every challenge is checked in the state the child will actually see:
 * - speakers exist; each `choose` line has exactly one `___` in BM, EN and 中文 (so the
 *   translation never gives the answer away); the word's text is among the options exactly
 *   once; options are distinct; reveals point at hidden props of that scene;
 * - each `find` answer is a prop that is visible at that moment, with at least 2 others to
 *   choose from;
 * - every chapter word is practised (warning).
 */
export function checkQuest(quest: Quest, chapter: Chapter): Issue[] {
  const issues: Issue[] = [];
  const add = (severity: Severity, where: string, message: string) =>
    issues.push({ severity, where: `${quest.id}/${where}`, message });

  if (quest.chapter !== chapter.id)
    add('error', 'chapter', `is "${quest.chapter}", expected "${chapter.id}"`);
  const speakers = new Set(['narrator', ...quest.characters.map((c) => c.id)]);
  const used = new Set<string>();
  const sceneIds = new Set<string>();

  quest.scenes.forEach((scene, si) => {
    if (sceneIds.has(scene.id)) add('error', scene.id, 'duplicate scene id');
    sceneIds.add(scene.id);
    const propIds = new Set(scene.props.map((p) => p.id));
    if (propIds.size !== scene.props.length) add('error', scene.id, 'duplicate prop id');
    const visible = new Set(scene.props.filter((p) => !p.hidden).map((p) => p.id));

    scene.steps.forEach((step, i) => {
      const at = `${scene.id}.steps[${i}]`;
      if (!speakers.has(step.speaker)) add('error', at, `unknown speaker "${step.speaker}"`);
      if (step.kind === 'say') return;

      const word = chapter.words.find((w) => w.id === step.word);
      if (!word) {
        add('error', at, `word "${step.word}" is not in ${chapter.id}`);
        return;
      }
      used.add(word.id);

      if (step.kind === 'choose') {
        for (const lang of ['bm', 'en', 'zh'] as const) {
          const blanks = step.line[lang].match(/_+/g) ?? [];
          if (blanks.length !== 1 || blanks[0] !== '___')
            add('error', `${at}.line.${lang}`, 'must contain exactly one "___"');
        }
        const hits = step.options.filter((o) => norm(o) === norm(word.word)).length;
        if (hits !== 1) add('error', `${at}.options`, `must contain "${word.word}" exactly once`);
        if (new Set(step.options.map(norm)).size !== step.options.length)
          add('error', `${at}.options`, 'duplicate option');
        for (const o of step.options)
          if (o !== o.trim() || /\s{2,}/.test(o))
            add('error', `${at}.options`, `"${o}" has extra spaces`);
        if (step.reveal) {
          const prop = scene.props.find((p) => p.id === step.reveal);
          if (!prop?.hidden)
            add('error', `${at}.reveal`, `"${step.reveal}" is not a hidden prop of ${scene.id}`);
          else visible.add(prop.id);
        }
      } else {
        if (!visible.has(step.answer))
          add('error', `${at}.answer`, `prop "${step.answer}" is not visible at this step`);
        if (visible.size < 3) add('error', at, 'needs at least 3 visible props to choose from');
      }
    });
    if (si === 0 && quest.scenes.length === 0) add('error', 'scenes', 'no scenes');
  });

  for (const w of chapter.words)
    if (!used.has(w.id)) add('warning', 'words', `"${w.word}" is not practised in the quest`);
  return issues;
}

/** Cross-chapter checks: track ↔ chapters consistency and no duplicate word ids in a track. */
export function checkTrack(track: Track, chapters: Map<string, Chapter>): Issue[] {
  const issues: Issue[] = [];
  const add = (where: string, message: string) =>
    issues.push({ severity: 'error', where: `track/${where}`, message });

  const wordOwner = new Map<string, string>();
  const unitIds = new Set<string>();

  for (const t of track.tema) {
    for (const u of t.units) {
      if (unitIds.has(u.id)) add(u.id, 'unit listed twice');
      unitIds.add(u.id);

      const ch = chapters.get(u.dir);
      if (!ch) {
        add(u.id, `missing ${u.dir}/chapter.json`);
        continue;
      }
      if (ch.id !== u.id) add(u.id, `chapter id is "${ch.id}"`);
      if (ch.year !== track.year) add(u.id, `chapter year ${ch.year} ≠ track year ${track.year}`);
      if (ch.tema !== t.tema) add(u.id, `chapter tema ${ch.tema} ≠ ${t.tema}`);
      if (ch.unit !== u.unit) add(u.id, `chapter unit ${ch.unit} ≠ ${u.unit}`);

      for (const w of ch.words) {
        const owner = wordOwner.get(w.id);
        if (owner) add(u.id, `word id "${w.id}" also in ${owner}`);
        else wordOwner.set(w.id, ch.id);
      }
    }
  }

  for (const dir of chapters.keys()) {
    if (![...track.tema.flatMap((t) => t.units)].some((u) => u.dir === dir))
      add(dir, `${dir} exists but is not listed in track.json`);
  }

  return issues;
}
