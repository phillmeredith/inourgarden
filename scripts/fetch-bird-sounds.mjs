#!/usr/bin/env node
// fetch-bird-sounds.mjs — Download bird sounds from xeno-canto
// Uses xeno-canto API v2: https://xeno-canto.org/explore/api
import { writeFile, readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const SOUNDS_DIR = path.resolve('public/sounds')
const ALL_BIRDS = JSON.parse(await readFile('/tmp/bou_all_birds.json', 'utf-8'))

const existingSounds = new Set(
  (await readdir(SOUNDS_DIR)).filter(f => f.endsWith('.mp3')).map(f => f.replace('.mp3', ''))
)

// Check which birds need sounds (any bird that doesn't have at least a song or call)
const needSounds = ALL_BIRDS.filter(b => {
  const hasSound = existingSounds.has(`${b.id}-song`) || existingSounds.has(`${b.id}-call`)
  return !hasSound
})

console.log(`Total birds: ${ALL_BIRDS.length}`)
console.log(`Already have sounds: ${ALL_BIRDS.length - needSounds.length}`)
console.log(`Need sounds: ${needSounds.length}`)

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchXenoCanto(scientificName) {
  try {
    // Search xeno-canto for recordings of this species, sorted by quality
    const url = `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(scientificName)}+q:A&page=1`
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'InOurGarden/1.0 (educational birdwatching PWA)' }
    })
    if (!resp.ok) return []
    const data = await resp.json()
    return data.recordings || []
  } catch (e) {
    return []
  }
}

async function downloadSound(url, filepath) {
  // xeno-canto URLs use // prefix, need https:
  const fullUrl = url.startsWith('//') ? `https:${url}` : url
  const resp = await fetch(fullUrl, {
    headers: { 'User-Agent': 'InOurGarden/1.0' }
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const buffer = Buffer.from(await resp.arrayBuffer())
  if (buffer.length < 1000) throw new Error('Too small')
  await writeFile(filepath, buffer)
  return buffer.length
}

let ok = 0, fail = 0

for (let i = 0; i < needSounds.length; i++) {
  const bird = needSounds[i]
  
  try {
    const recordings = await fetchXenoCanto(bird.scientificName)
    
    if (recordings.length === 0) {
      console.log(`[${i+1}/${needSounds.length}] MISS ${bird.name} (${bird.scientificName})`)
      fail++
      await sleep(1000)
      continue
    }
    
    // Find best song and best call
    const songs = recordings.filter(r => r.type?.toLowerCase().includes('song'))
    const calls = recordings.filter(r => r.type?.toLowerCase().includes('call'))
    
    // Download best song
    const bestSong = songs[0] || recordings[0]
    if (bestSong?.file) {
      const type = bestSong.type?.toLowerCase().includes('song') ? 'song' : 'call'
      const fp = path.join(SOUNDS_DIR, `${bird.id}-${type}.mp3`)
      if (!existsSync(fp)) {
        const size = await downloadSound(bestSong.file, fp)
        ok++
      }
    }
    
    // Download best call if different from song
    if (calls.length > 0 && calls[0].id !== (songs[0]?.id || recordings[0]?.id)) {
      const fp = path.join(SOUNDS_DIR, `${bird.id}-call.mp3`)
      if (!existsSync(fp)) {
        const size = await downloadSound(calls[0].file, fp)
        ok++
      }
    }
    
    if (ok % 20 === 0 && ok > 0) console.log(`[${i+1}/${needSounds.length}] Downloaded ${ok} sounds so far...`)
  } catch (e) {
    console.log(`[${i+1}/${needSounds.length}] FAIL ${bird.name}: ${e.message}`)
    fail++
    if (e.message.includes('429')) await sleep(5000)
  }
  
  await sleep(1500) // 1.5s between requests to be polite to xeno-canto
}

console.log(`\nDone! Sounds downloaded: ${ok}, Failed species: ${fail}`)
