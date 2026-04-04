#!/usr/bin/env node
// fetch-sounds.mjs — populate soundUrl for birds missing sounds
// Uses Wikimedia Commons API: free, no key, CORS-open CDN URLs
//
// Usage: node scripts/fetch-sounds.mjs
// Resume:  node scripts/fetch-sounds.mjs   (reads progress.json, skips done)

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = join(__dir, '..')
const DATA  = join(ROOT, 'src/data')
const PROGRESS_FILE = join(__dir, 'sound-progress.json')

const BATCH_FILES = [
  'birds_batch1.ts',  'birds_batch2.ts',  'birds_batch3.ts',
  'birds_batch4.ts',  'birds_batch5.ts',  'birds_batch6.ts',
  'birds_batch7.ts',  'birds_batch8.ts',  'birds_batch9.ts',
  'birds_batch10.ts', 'birds_batch11.ts', 'birds_batch12.ts',
]

const DELAY_MS = 1200 // be polite to Wikimedia — 1.2s avoids rate limiting

// ─── Wikimedia helpers ────────────────────────────────────────────────────────

async function fetchJSON(url, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'InOurGarden-BirdSounds/1.0 (birdwatching app; educational)' }
    })
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      if (attempt < retries - 1) {
        const wait = 3000 * (attempt + 1)
        process.stdout.write(` [rate-limited, retrying in ${wait/1000}s]`)
        await sleep(wait)
      }
    }
  }
  return null
}

async function searchWikimedia(scientificName) {
  const query = encodeURIComponent(`${scientificName} song`)
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${query}&srnamespace=6&format=json&srlimit=8&origin=*`
  const data = await fetchJSON(url)
  return data?.query?.search ?? []
}

async function getFileUrl(fileTitle) {
  const title = encodeURIComponent(fileTitle)
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${title}&prop=imageinfo&iiprop=url|mime|duration&format=json&origin=*`
  const data = await fetchJSON(url)
  if (!data) return null
  const pages = data?.query?.pages ?? {}
  const page = Object.values(pages)[0]
  return page?.imageinfo?.[0] ?? null
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Pick the best audio file from search results ─────────────────────────────

function scoredTitle(title, scientificName) {
  const t = title.toLowerCase()
  const sci = scientificName.toLowerCase().split(' ')
  let score = 0
  if (sci.some(w => t.includes(w))) score += 10  // scientific name match
  if (t.includes('song')) score += 5
  if (t.endsWith('.mp3')) score += 2              // prefer mp3 over ogg
  if (t.endsWith('.ogg')) score += 1
  if (t.includes('call')) score -= 1             // prefer song over call
  if (t.includes('alarm')) score -= 3
  if (t.includes('juvenile')) score -= 2
  return score
}

async function findSound(scientificName) {
  const results = await searchWikimedia(scientificName)
  if (!results.length) return null

  // Filter to audio files only
  const audioResults = results.filter(r => {
    const t = r.title.toLowerCase()
    return t.endsWith('.mp3') || t.endsWith('.ogg') || t.endsWith('.flac') || t.endsWith('.wav')
  })
  if (!audioResults.length) return null

  // Pick highest scoring
  audioResults.sort((a, b) => scoredTitle(b.title, scientificName) - scoredTitle(a.title, scientificName))
  const best = audioResults[0]

  // Get direct CDN URL
  const info = await getFileUrl(best.title)
  if (!info?.url) return null

  // Only return if it's an audio mime type
  if (!info.mime?.startsWith('audio/')) return null

  return { url: info.url, label: 'Song', title: best.title }
}

// ─── Extract birds from a batch file ─────────────────────────────────────────

function extractBirds(content) {
  const birds = []
  // Match id, scientificName, soundUrl fields within each object
  const idRe = /id:\s*'([^']+)'/g
  const sciRe = /scientificName:\s*'([^']+)'/g
  const soundRe = /soundUrl:\s*(null|'[^']*')/g

  let idMatch, sciMatch, soundMatch
  const ids = [], scis = [], sounds = []

  while ((idMatch = idRe.exec(content))) ids.push({ val: idMatch[1], idx: idMatch.index })
  while ((sciMatch = sciRe.exec(content))) scis.push({ val: sciMatch[1], idx: sciMatch.index })
  while ((soundMatch = soundRe.exec(content))) sounds.push({ val: soundMatch[1], idx: soundMatch.index })

  // Pair them up by proximity (they appear in the same object block)
  // Sort all by index, then assign IDs → scientificNames → soundUrls in order
  for (let i = 0; i < ids.length; i++) {
    birds.push({
      id: ids[i]?.val,
      scientificName: scis[i]?.val,
      soundUrl: sounds[i]?.val === 'null' ? null : sounds[i]?.val?.replace(/'/g, ''),
    })
  }
  return birds
}

// ─── Patch soundUrl in a file ─────────────────────────────────────────────────

function patchFile(filePath, birdId, soundUrl) {
  let content = readFileSync(filePath, 'utf8')

  // Find the bird block by id, then replace its soundUrl
  // Strategy: find the id:'birdId' occurrence, then the next soundUrl: null after it
  const idPattern = new RegExp(`id:\\s*'${birdId}'`)
  const idMatch = idPattern.exec(content)
  if (!idMatch) {
    console.warn(`  ⚠ id '${birdId}' not found in ${filePath}`)
    return false
  }

  // From that position, find the next `soundUrl: null`
  const afterId = content.slice(idMatch.index)
  const soundNullRe = /soundUrl:\s*null/
  const soundMatch = soundNullRe.exec(afterId)
  if (!soundMatch) {
    return false // already has a sound or pattern not found
  }

  const absolutePos = idMatch.index + soundMatch.index
  const escaped = soundUrl.replace(/'/g, "\\'")
  const newContent =
    content.slice(0, absolutePos) +
    `soundUrl: '${escaped}'` +
    content.slice(absolutePos + soundMatch[0].length)

  // Also patch sounds: [] → sounds: [{ label: 'Song', url: '...' }]
  // Find sounds: [] after the soundUrl we just patched
  const afterPatch = newContent.slice(absolutePos)
  const soundsArrRe = /sounds:\s*\[\]/
  const soundsMatch = soundsArrRe.exec(afterPatch)
  let finalContent = newContent
  if (soundsMatch) {
    const absPos2 = absolutePos + soundsMatch.index
    finalContent =
      newContent.slice(0, absPos2) +
      `sounds: [{ label: 'Song', url: '${escaped}' }]` +
      newContent.slice(absPos2 + soundsMatch[0].length)
  }

  writeFileSync(filePath, finalContent, 'utf8')
  return true
}

// ─── Load / save progress ─────────────────────────────────────────────────────

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'))
  }
  return { done: {}, failed: [] }
}

function saveProgress(progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const progress = loadProgress()
  let found = 0, missed = 0, skipped = 0

  for (const batchFile of BATCH_FILES) {
    const filePath = join(DATA, batchFile)
    const content = readFileSync(filePath, 'utf8')
    const birds = extractBirds(content)
    const needsSound = birds.filter(b => b.soundUrl === null && !progress.done[b.id])

    if (!needsSound.length) {
      console.log(`✓ ${batchFile} — all done`)
      continue
    }

    console.log(`\n📁 ${batchFile} — ${needsSound.length} birds need sounds`)

    for (const bird of needsSound) {
      if (!bird.id || !bird.scientificName) continue

      process.stdout.write(`  ${bird.id} (${bird.scientificName})… `)

      try {
        const result = await findSound(bird.scientificName)

        if (result) {
          const patched = patchFile(filePath, bird.id, result.url)
          if (patched) {
            console.log(`✓  ${result.url.slice(0, 60)}…`)
            progress.done[bird.id] = result.url
            found++
          } else {
            console.log(`⚠ patch failed`)
          }
        } else {
          console.log(`✗ no match`)
          progress.failed.push(bird.id)
          missed++
        }
      } catch (err) {
        console.log(`✗ error: ${err.message}`)
        progress.failed.push(bird.id)
        missed++
      }

      saveProgress(progress)
      await sleep(DELAY_MS)
    }

    skipped += birds.filter(b => progress.done[b.id]).length
  }

  console.log(`\n─────────────────────────────────`)
  console.log(`✓ Found:   ${found}`)
  console.log(`✗ Missed:  ${missed}`)
  console.log(`⟳ Skipped: ${skipped} (already done)`)
  console.log(`Progress saved to scripts/sound-progress.json`)
}

main().catch(console.error)
