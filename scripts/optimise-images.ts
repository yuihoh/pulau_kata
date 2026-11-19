/**
 * Turns the big PNG pictures from ChatGPT/Codex into small WebP files the app ships.
 *
 *   npm run optimise-images -- --dry-run   show what would change, write nothing
 *   npm run optimise-images                convert every PNG found under content/
 *
 * For each `content/**` PNG it writes a WebP next to it (same name, `.webp`, scaled down, with
 * transparency kept) and then MOVES the PNG master to `assets-src/content-originals/` (same
 * relative path), so the app never bundles the 1-3 MB originals. Nothing is deleted: to redo a
 * picture, put its new PNG into content/ and run the script again; the earlier master stays in
 * the archive as `name.1.png`, `name.2.png`, ... Safe to re-run; with no PNGs left in content/ it
 * does nothing.
 *
 * Sizes (longest side, never enlarged): word pictures 512, postcards 768, Misi backgrounds
 * (`quest/bg-*`) 1024, other Misi art 512, unit icons 256.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const contentDir = join(root, 'content');
const originalsDir = join(root, 'assets-src', 'content-originals');
const dryRun = process.argv.includes('--dry-run');
const QUALITY = 80;

/** Longest side in pixels for a picture, from where it lives in content/. */
export function targetSize(relPath: string): number {
  const parts = relPath.replace(/\\/g, '/').split('/');
  const name = parts[parts.length - 1]!;
  const folder = parts[parts.length - 2]!;
  if (folder === 'quest') return name.startsWith('bg-') ? 1024 : 512;
  if (name.startsWith('postcard')) return 768;
  if (name.startsWith('icon')) return 256;
  return 512;
}

function findPngs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findPngs(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) out.push(full);
  }
  return out;
}

/** Move across drives too (rename fails there with EXDEV), and never leave the PNG in two places. */
function moveFile(from: string, to: string): void {
  mkdirSync(dirname(to), { recursive: true });
  try {
    renameSync(from, to);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EXDEV') throw err;
    copyFileSync(from, to);
    unlinkSync(from);
  }
}

/**
 * Put a PNG master in the archive. If the archive already holds a master at that path (a picture
 * that was redone), the older one is kept beside it as `name.1.png`, `name.2.png`, ... so no
 * master is ever overwritten. Returns the path the older master was kept at, if any.
 */
function archiveMaster(from: string, to: string): string | undefined {
  let keptAs: string | undefined;
  if (existsSync(to)) {
    const stem = to.replace(/\.png$/i, '');
    let n = 1;
    while (existsSync(`${stem}.${n}.png`)) n += 1;
    keptAs = `${stem}.${n}.png`;
    moveFile(to, keptAs);
  }
  moveFile(from, to);
  return keptAs;
}

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

async function main(): Promise<void> {
  const pngs = findPngs(contentDir).sort();
  if (pngs.length === 0) {
    console.log('No PNG files under content/. Nothing to do.');
    return;
  }
  let before = 0;
  let after = 0;
  for (const png of pngs) {
    const rel = relative(contentDir, png);
    const webp = png.replace(/\.png$/i, '.webp');
    const size = targetSize(rel);
    const pngBytes = statSync(png).size;
    if (dryRun) {
      console.log(`would convert ${rel}  (${kb(pngBytes)}, max ${size}px)`);
      before += pngBytes;
      continue;
    }
    const info = await sharp(png)
      .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY, alphaQuality: 90, effort: 6 })
      .toFile(webp);
    const keptAs = archiveMaster(png, join(originalsDir, rel));
    if (keptAs) console.log(`  (older master kept as ${relative(root, keptAs)})`);
    before += pngBytes;
    after += info.size;
    console.log(
      `${rel.padEnd(52)} ${kb(pngBytes).padStart(8)} -> ${kb(info.size).padStart(6)}  ${info.width}x${info.height}`,
    );
  }
  if (dryRun) {
    console.log(
      `\n${pngs.length} PNG files, ${(before / 1048576).toFixed(1)} MB. Nothing written (dry run).`,
    );
  } else {
    console.log(
      `\n${pngs.length} pictures: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB. ` +
        `PNG masters moved to ${relative(root, originalsDir)}/`,
    );
  }
}

/** True only when this file is the program being run (not when another file imports it). */
function isEntryPoint(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync.native(entry) === realpathSync.native(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  void main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
