#!/usr/bin/env node
import { writeFile, readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const SOUNDS_DIR = path.resolve('public/sounds')
const ALL_BIRDS = JSON.parse(await readFile('/tmp/bou_all_birds.json', 'utf-8'))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const UA = 'InOurGarden/1.0 (educational birdwatching PWA)'

const existingSounds = new Set()
for (const f of (await readdir(SOUNDS_DIR)).filter(f => f.endsWith('.mp3') || f.endsWith('.ogg'))) {
  existingSounds.add(f.replace(/-(song|call)\.(mp3|ogg)$/, ''))
}

const needSounds = ALL_BIRDS.filter(b => !existingSounds.has(b.id))
console.log(`Need sounds for ${needSounds.length} / ${ALL_BIRDS.length} birds`)

async function searchSound(sciName) {
  try {
    const params = new URLSearchParams({
      action: 'query', generator: 'search', gsrnamespace: '6',
      gsrsearch: `${sciName} filetype:audio`, gsrlimit: '3',
      prop: 'imageinfo', iiprop: 'url|mime', format: 'json',
    })
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } })
    if (!r.ok) return null
    const d = await r.json()
    const pages = d.query?.pages || {}
    for (const p of Object.values(pages)) {
      const url = p.imageinfo?.[0]?.url
      if (url?.match(/\.(mp3|ogg|oga)/i)) return url
    }
  } catch(e) {}
  return null
}

let ok = 0, fail = 0
for (let i = 0; i < needSounds.length; i++) {
  const b = needSounds[i]
  const fpMp3 = path.join(SOUNDS_DIR, `${b.id}-call.mp3`)
  const fpOgg = path.join(SOUNDS_DIR, `${b.id}-call.ogg`)
  if (existsSync(fpMp3) || existsSync(fpOgg)) continue

  try {
    const url = await searchSound(b.scientificName)
    if (!url) { fail++; await sleep(500); continue }

    const resp = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const buf = Buffer.from(await resp.arrayBuffer())
    if (buf.length < 500) throw new Error('tiny')

    const ext = url.match(/\.(mp3|ogg|oga)/i)?.[1] || 'mp3'
    const fp = path.join(SOUNDS_DIR, `${b.id}-call.${ext === 'oga' ? 'ogg' : ext}`)
    await writeFile(fp, buf)
    ok++
    if (ok % 20 === 0) console.log(`[${i+1}/${needSounds.length}] Downloaded ${ok} sounds...`)
  } catch(e) {
    fail++
    if (e.message?.includes('429')) await sleep(5000)
  }
  await sleep(1500)
}
console.log(`Done! Sounds: ${ok}, No sound: ${fail}`)
