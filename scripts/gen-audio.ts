/**
 * Generates the read-aloud MP3s with Azure Speech (Malay ms-MY neural voices).
 *
 *   npm run gen-audio -- --dry-run        list what's missing + character count (no key needed)
 *   npm run gen-audio                     generate every missing file
 *   npm run gen-audio -- --only t3-u02    one unit
 *   npm run gen-audio -- --force          regenerate existing files too
 *
 * The plan (which texts, which voice, which file names) is `apps/web/src/content/audioPlan.ts`.
 * Credentials come from `.env.local` (git-ignored) or the environment, never from code:
 *   AZURE_SPEECH_KEY=...
 *   AZURE_SPEECH_REGION=southeastasia
 * The key is never printed. Requests are spaced out to stay inside the free (F0) tier's
 * rate limit, and 429 responses are retried after the server's suggested wait.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { audioPlan, toSsml, VOICES, type AudioItem } from '../apps/web/src/content/audioPlan';
import type { Chapter, Quest } from '../apps/web/src/content/schema';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined;
const GAP_MS = 3500; // F0: about 20 requests per minute
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';

function loadEnvLocal(): Record<string, string> {
  const file = join(root, '.env.local');
  const env: Record<string, string> = {};
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (m) env[m[1]!] = m[2]!.replace(/^["']|["']$/g, '');
  }
  return env;
}

interface Job {
  unit: string;
  file: string;
  item: AudioItem;
}

function collectJobs(): Job[] {
  const jobs: Job[] = [];
  const contentDir = join(root, 'content');
  for (const track of readdirSync(contentDir, { withFileTypes: true })) {
    if (!track.isDirectory()) continue;
    const trackDir = join(contentDir, track.name);
    for (const unit of readdirSync(trackDir, { withFileTypes: true })) {
      if (!unit.isDirectory() || !/^unit-\d{2}$/.test(unit.name)) continue;
      const dir = join(trackDir, unit.name);
      const chapterPath = join(dir, 'chapter.json');
      if (!existsSync(chapterPath)) continue;
      const chapter = JSON.parse(readFileSync(chapterPath, 'utf8')) as Chapter;
      if (only && chapter.id !== only) continue;
      const questPath = join(dir, 'quest.json');
      const quest = existsSync(questPath)
        ? (JSON.parse(readFileSync(questPath, 'utf8')) as Quest)
        : undefined;
      for (const item of audioPlan(chapter, quest)) {
        const file = join(dir, item.path);
        if (force || !existsSync(file)) jobs.push({ unit: chapter.id, file, item });
      }
    }
  }
  return jobs;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function synthesize(job: Job, key: string, region: string): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': OUTPUT_FORMAT,
        'User-Agent': 'jelajah-kata-gen-audio',
      },
      body: toSsml(job.item),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status === 429 && attempt < 6) {
      const wait = Number(res.headers.get('Retry-After') ?? 10) * 1000;
      console.warn(`  rate limited; waiting ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    throw new Error(`Azure TTS ${res.status} for ${job.item.path}: ${await res.text()}`);
  }
}

async function checkVoices(key: string, region: string) {
  const res = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
    { headers: { 'Ocp-Apim-Subscription-Key': key } },
  );
  if (!res.ok) throw new Error(`Could not list voices (${res.status}). Check the key and region.`);
  const names = new Set(((await res.json()) as { ShortName: string }[]).map((v) => v.ShortName));
  const missing = Object.values(VOICES).filter((v) => !names.has(v));
  if (missing.length) throw new Error(`Voice(s) not available in ${region}: ${missing.join(', ')}`);
}

async function main() {
  const jobs = collectJobs();
  const chars = jobs.reduce((n, j) => n + j.item.text.length, 0);
  console.log(`gen-audio: ${jobs.length} file(s) to make, ${chars} characters.`);
  if (dryRun) {
    for (const j of jobs)
      console.log(`  ${j.unit}  ${j.item.path}  [${j.item.voice.name}]  ${j.item.text}`);
    return;
  }
  if (jobs.length === 0) return;

  const env = { ...loadEnvLocal(), ...process.env };
  const key = env.AZURE_SPEECH_KEY;
  const region = env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    console.error('Missing AZURE_SPEECH_KEY / AZURE_SPEECH_REGION (put them in .env.local).');
    process.exit(1);
  }
  await checkVoices(key, region);

  let done = 0;
  for (const job of jobs) {
    const mp3 = await synthesize(job, key, region);
    mkdirSync(dirname(job.file), { recursive: true });
    writeFileSync(job.file, mp3);
    done++;
    console.log(`  ${done}/${jobs.length}  ${job.unit}  ${job.item.path}`);
    if (done < jobs.length) await sleep(GAP_MS);
  }
  console.log(
    'gen-audio: done. Listen through each unit and re-record any word that sounds wrong.',
  );
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
