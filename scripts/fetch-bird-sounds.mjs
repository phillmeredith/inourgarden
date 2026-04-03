#!/usr/bin/env node

/**
 * fetch-bird-sounds.mjs
 *
 * Downloads free bird sound recordings from Wikimedia Commons
 * (sourced from xeno-canto CC-licensed recordings uploaded there)
 * for each bird in the app that has a non-null soundUrl.
 *
 * Usage: node scripts/fetch-bird-sounds.mjs
 *
 * Note: xeno-canto API v2 was retired and v3 requires an API key.
 * Wikimedia Commons hosts many of the same xeno-canto recordings
 * under CC licences, accessible without authentication.
 */

import { mkdirSync, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

// ── Bird data: name, scientific name, target filename, and preferred type ────

const BIRDS = [
  { name: 'Robin', scientificName: 'Erithacus rubecula', soundUrl: '/sounds/robin-song.mp3', type: 'song' },
  { name: 'Blue Tit', scientificName: 'Cyanistes caeruleus', soundUrl: '/sounds/blue-tit-song.mp3', type: 'song' },
  { name: 'Great Tit', scientificName: 'Parus major', soundUrl: '/sounds/great-tit-song.mp3', type: 'song' },
  { name: 'Blackbird', scientificName: 'Turdus merula', soundUrl: '/sounds/blackbird-song.mp3', type: 'song' },
  { name: 'House Sparrow', scientificName: 'Passer domesticus', soundUrl: '/sounds/house-sparrow-call.mp3', type: 'call' },
  { name: 'Goldfinch', scientificName: 'Carduelis carduelis', soundUrl: '/sounds/goldfinch-song.mp3', type: 'song' },
  { name: 'Woodpigeon', scientificName: 'Columba palumbus', soundUrl: '/sounds/woodpigeon-song.mp3', type: 'song' },
  { name: 'Wren', scientificName: 'Troglodytes troglodytes', soundUrl: '/sounds/wren-song.mp3', type: 'song' },
  { name: 'Song Thrush', scientificName: 'Turdus philomelos', soundUrl: '/sounds/song-thrush-song.mp3', type: 'song' },
  { name: 'Long-tailed Tit', scientificName: 'Aegithalos caudatus', soundUrl: '/sounds/long-tailed-tit-call.mp3', type: 'call' },
  { name: 'Swift', scientificName: 'Apus apus', soundUrl: '/sounds/swift-call.mp3', type: 'call' },
  { name: 'Kingfisher', scientificName: 'Alcedo atthis', soundUrl: '/sounds/kingfisher-call.mp3', type: 'call' },
  { name: 'Curlew', scientificName: 'Numenius arquata', soundUrl: '/sounds/curlew-call.mp3', type: 'call' },
  { name: 'Oystercatcher', scientificName: 'Haematopus ostralegus', soundUrl: '/sounds/oystercatcher-call.mp3', type: 'call' },
  { name: 'Skylark', scientificName: 'Alauda arvensis', soundUrl: '/sounds/skylark-song.mp3', type: 'song' },
  { name: 'Nuthatch', scientificName: 'Sitta europaea', soundUrl: '/sounds/nuthatch-call.mp3', type: 'call' },
  { name: 'Barn Owl', scientificName: 'Tyto alba', soundUrl: '/sounds/barn-owl-call.mp3', type: 'call' },
  { name: 'Greenfinch', scientificName: 'Chloris chloris', soundUrl: '/sounds/greenfinch-song.mp3', type: 'song' },
  { name: 'Lapwing', scientificName: 'Vanellus vanellus', soundUrl: '/sounds/lapwing-call.mp3', type: 'call' },
];

// ── Config ───────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const SOUNDS_DIR = path.join(PROJECT_ROOT, 'public', 'sounds');
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const DELAY_MS = 3000;        // 3 seconds between birds to respect rate limits
const MAX_RETRIES = 3;        // retry downloads up to 3 times on 429
const RETRY_BASE_MS = 10000;  // start with 10s backoff, doubles each retry

// Wikimedia upload CDN blocks generic bot User-Agents on media files.
// Use a browser-like UA for downloads, and the polite bot UA for API calls.
const API_UA = 'InOurGarden-BirdApp/1.0 (phillm@example.com; bird sound downloader)';
const DOWNLOAD_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Search Wikimedia Commons for an audio file of the given species.
 * Tries multiple search strategies in order of preference.
 */
async function findAudioFile(scientificName, preferredType) {
  const searchStrategies = [
    `${scientificName} ${preferredType}`,           // e.g. "Erithacus rubecula song"
    `${scientificName} XC`,                          // xeno-canto uploads on Commons
    `${scientificName} bird sound`,                  // broader search
    scientificName,                                  // just the scientific name
  ];

  for (const query of searchStrategies) {
    const searchUrl = `${COMMONS_API}?action=query&list=search` +
      `&srsearch=${encodeURIComponent(query)}` +
      `&srnamespace=6&format=json&srlimit=10`;

    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': API_UA },
    });

    if (!res.ok) {
      console.warn(`  [WARN] Commons search returned ${res.status} for: ${query}`);
      continue;
    }

    const data = await res.json();
    const results = data.query?.search || [];

    // Filter for audio files (.mp3, .ogg, .wav)
    const audioResults = results.filter((r) =>
      /\.(mp3|ogg|wav|flac)$/i.test(r.title)
    );

    if (audioResults.length > 0) {
      // Prefer mp3 files
      const mp3 = audioResults.find((r) => /\.mp3$/i.test(r.title));
      const chosen = mp3 || audioResults[0];
      console.log(`  Found: ${chosen.title} (via query: "${query}")`);
      return chosen.title;
    }
  }

  return null;
}

/**
 * Given a Wikimedia Commons file title, get the direct download URL.
 */
async function getFileUrl(fileTitle) {
  const url = `${COMMONS_API}?action=query` +
    `&titles=${encodeURIComponent(fileTitle)}` +
    `&prop=imageinfo&iiprop=url&format=json`;

  const res = await fetch(url, {
    headers: { 'User-Agent': API_UA },
  });

  if (!res.ok) {
    throw new Error(`Failed to get file URL: ${res.status}`);
  }

  const data = await res.json();
  const pages = data.query?.pages || {};
  const page = Object.values(pages)[0];

  if (page && page.imageinfo && page.imageinfo[0]) {
    return page.imageinfo[0].url;
  }

  throw new Error(`No imageinfo found for ${fileTitle}`);
}

/**
 * Download a file from the given URL and save it to disk using curl.
 * Node's fetch triggers Wikimedia rate limiting more aggressively than curl.
 */
async function downloadFile(url, destPath) {
  await execFileAsync('curl', [
    '-sS',
    '-L',                                   // follow redirects
    '-o', destPath,
    '-H', `User-Agent: ${DOWNLOAD_UA}`,
    '-H', 'Accept: */*',
    '-H', 'Referer: https://commons.wikimedia.org/',
    '--fail',                               // fail on HTTP errors
    '--retry', String(MAX_RETRIES),
    '--retry-delay', '10',
    '--retry-all-errors',
    url,
  ], { timeout: 120_000 });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Fetching bird sounds from Wikimedia Commons ===');
  console.log('    (xeno-canto recordings uploaded under CC licences)\n');

  // Ensure output directory exists
  mkdirSync(SOUNDS_DIR, { recursive: true });
  console.log(`Output directory: ${SOUNDS_DIR}\n`);

  const results = { success: [], skipped: [], failed: [] };

  for (let i = 0; i < BIRDS.length; i++) {
    const bird = BIRDS[i];
    const filename = path.basename(bird.soundUrl);
    const destPath = path.join(SOUNDS_DIR, filename);

    console.log(`[${i + 1}/${BIRDS.length}] ${bird.name} (${bird.scientificName})`);
    console.log(`  Target: ${filename}`);

    // Skip if file already exists
    if (existsSync(destPath)) {
      console.log('  SKIPPED — file already exists\n');
      results.skipped.push(bird.name);
      continue;
    }

    try {
      // Step 1: Find an audio file on Commons
      const fileTitle = await findAudioFile(bird.scientificName, bird.type);

      if (!fileTitle) {
        console.log('  FAILED — no audio file found on Wikimedia Commons\n');
        results.failed.push(bird.name);
        await sleep(DELAY_MS);
        continue;
      }

      // Step 2: Get the direct download URL
      const downloadUrl = await getFileUrl(fileTitle);
      console.log(`  Downloading: ${downloadUrl}`);

      // Step 3: Download and save
      await downloadFile(downloadUrl, destPath);
      console.log(`  SAVED: ${destPath}\n`);
      results.success.push(bird.name);
    } catch (err) {
      console.error(`  ERROR: ${err.message}\n`);
      results.failed.push(bird.name);
    }

    // Rate-limit: wait between requests
    if (i < BIRDS.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log('\n=== Summary ===');
  console.log(`  Downloaded: ${results.success.length} — ${results.success.join(', ') || 'none'}`);
  console.log(`  Skipped:    ${results.skipped.length} — ${results.skipped.join(', ') || 'none'}`);
  console.log(`  Failed:     ${results.failed.length} — ${results.failed.join(', ') || 'none'}`);

  if (results.failed.length > 0) {
    console.log('\n  Birds without sounds may need manual sourcing.');
  }

  console.log('\nDone.');

  if (results.failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
