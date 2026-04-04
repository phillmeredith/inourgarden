/**
 * download-sounds.mjs
 * Downloads all Wikimedia bird audio files to public/sounds/ then
 * rewrites the TS data files to use local paths.
 *
 * Run from project root:  node download-sounds.mjs
 */

import https from 'https';
import http  from 'http';
import fs    from 'fs';
import path  from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const SOUNDS_DIR = path.join(__dirname, 'public', 'sounds');
const DATA_DIR   = path.join(__dirname, 'src', 'data');

const BASE_DELAY_MS  = 600;   // gap between each download
const MAX_RETRIES    = 5;     // retries per file on 429
const RETRY_BASE_MS  = 8000;  // first retry wait (doubles each time)

// ── helpers ──────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

function downloadOnce(url, destPath) {
  return new Promise((resolve, reject) => {
    const get = (u, hops = 0) => {
      if (hops > 5) return reject(new Error('Too many redirects'));
      const lib = u.startsWith('https') ? https : http;
      lib.get(u, {
        headers: { 'User-Agent': 'BirdApp/1.0 (educational; contact phill.meredith@gmail.com)' }
      }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          res.resume();
          return get(res.headers.location, hops + 1);
        }
        if (res.statusCode === 429) {
          res.resume();
          const retryAfter = parseInt(res.headers['retry-after'] || '0', 10);
          return reject(Object.assign(new Error('HTTP 429'), { retryAfter }));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error',  err => { try { fs.unlinkSync(destPath); } catch {} reject(err); });
      }).on('error', reject);
    };
    get(url);
  });
}

async function downloadWithRetry(url, destPath) {
  let delay = RETRY_BASE_MS;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await downloadOnce(url, destPath);
      return true;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      if (err.message.includes('429')) {
        const wait = err.retryAfter ? err.retryAfter * 1000 + 1000 : delay;
        process.stdout.write(` [rate-limited, waiting ${Math.round(wait/1000)}s...]`);
        await sleep(wait);
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
}

// ── step 1: find all Wikimedia URLs in the batch files ───────────────────────

console.log('\n🔍 Scanning batch files...');

const ID_URL_RE = /id:\s*'([^']+)'[\s\S]{0,2500}?soundUrl:\s*'(https:\/\/upload\.wikimedia\.org[^']+)'/g;
const birds = [];
const seen  = new Set();

for (let i = 1; i <= 12; i++) {
  const fp = path.join(DATA_DIR, `birds_batch${i}.ts`);
  if (!fs.existsSync(fp)) continue;
  const content = fs.readFileSync(fp, 'utf8');
  let m;
  while ((m = ID_URL_RE.exec(content)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const url = m[2];
    const ext = decodeURIComponent(url).match(/\.(ogg|mp3|flac|wav)(\?|$)/i)?.[1]?.toLowerCase() ?? 'ogg';
    birds.push({ id, url, localFile: path.join(SOUNDS_DIR, `${id}-song.${ext}`), localPath: `/sounds/${id}-song.${ext}` });
  }
}

console.log(`   ${birds.length} birds with Wikimedia URLs\n`);
if (!fs.existsSync(SOUNDS_DIR)) fs.mkdirSync(SOUNDS_DIR, { recursive: true });

// ── step 2: download ──────────────────────────────────────────────────────────

console.log(`📥 Downloading to public/sounds/  (${BASE_DELAY_MS}ms between each)\n`);

const downloaded = [], skipped = [], failed = [];

for (let i = 0; i < birds.length; i++) {
  const { id, url, localFile, localPath } = birds[i];
  const label = `[${String(i+1).padStart(3)}/${birds.length}] ${id.padEnd(42)}`;

  if (fs.existsSync(localFile) && fs.statSync(localFile).size > 1000) {
    console.log(`  ${label} ⏩ exists`);
    skipped.push({ id, localPath });
    continue;
  }

  process.stdout.write(`  ${label}`);
  try {
    await downloadWithRetry(url, localFile);
    const kb = Math.round(fs.statSync(localFile).size / 1024);
    process.stdout.write(` ✅ ${kb}KB\n`);
    downloaded.push({ id, localPath });
  } catch (err) {
    process.stdout.write(` ❌ ${err.message}\n`);
    failed.push({ id, error: err.message });
  }

  await sleep(BASE_DELAY_MS);
}

console.log('\n─────────────────────────────────────────────────────────');
console.log(`  ✅ Downloaded : ${downloaded.length}`);
console.log(`  ⏩ Skipped    : ${skipped.length}`);
console.log(`  ❌ Failed     : ${failed.length}`);
if (failed.length) {
  console.log('\n  Failed birds (re-run the script to retry):');
  failed.forEach(f => console.log(`    ${f.id}: ${f.error}`));
}

if (downloaded.length + skipped.length === 0) {
  console.log('\n⚠️  Nothing to update in TS files — all downloads failed.\n');
  process.exit(1);
}

// ── step 3: rewrite TS files ─────────────────────────────────────────────────

console.log('\n📝 Rewriting TypeScript data files...\n');

const localMap = {};
for (const { id, localPath } of [...downloaded, ...skipped]) localMap[id] = localPath;

let totalUpdated = 0;
for (let i = 1; i <= 12; i++) {
  const fp = path.join(DATA_DIR, `birds_batch${i}.ts`);
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  let count = 0;

  for (const [birdId, localPath] of Object.entries(localMap)) {
    const idx = content.indexOf(`id: '${birdId}'`);
    if (idx === -1) continue;
    const slice = content.slice(idx, idx + 3000);
    if (!slice.includes('upload.wikimedia.org')) continue;

    const newSlice = slice
      .replace(/soundUrl:\s*'https:\/\/upload\.wikimedia\.org[^']*'/, `soundUrl: '${localPath}'`)
      .replace(/sounds:\s*\[\{[^}]*?url:\s*'https:\/\/upload\.wikimedia\.org[^']*'[^}]*?\}\]/, `sounds: [{ label: 'Song', url: '${localPath}' }]`);

    if (newSlice !== slice) {
      content = content.slice(0, idx) + newSlice + content.slice(idx + 3000);
      count++;
    }
  }

  if (count > 0) {
    fs.writeFileSync(fp, content);
    console.log(`  birds_batch${i}.ts  →  ${count} updated`);
    totalUpdated += count;
  }
}

console.log(`\n✅ Done! ${totalUpdated} entries now use local files.`);
console.log(`   If any files failed above, just re-run: node download-sounds.mjs\n`);
