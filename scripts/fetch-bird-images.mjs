#!/usr/bin/env node
import { writeFile, readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const BIRDS_DIR = path.resolve('public/birds')
const ALL_BIRDS = JSON.parse(await readFile('/tmp/bou_all_birds.json', 'utf-8'))
const existingFiles = new Set(
  (await readdir(BIRDS_DIR)).filter(f => f.endsWith('.jpg')).map(f => f.replace('.jpg', ''))
)
const needImages = ALL_BIRDS.filter(b => !existingFiles.has(b.id))
console.log(`Need: ${needImages.length}`)

const sleep = ms => new Promise(r => setTimeout(r, ms))
const UA = 'InOurGarden/1.0 (https://inourgarden.vercel.app; birdwatching PWA) Node'

async function getImageUrl(sciName, comName) {
  for (const title of [sciName, comName]) {
    try {
      const p = new URLSearchParams({ action:'query', titles:title, prop:'pageimages', pithumbsize:'800', format:'json', redirects:'1' })
      const r = await fetch(`https://en.wikipedia.org/w/api.php?${p}`, { headers:{'User-Agent':UA} })
      if (r.status === 429) { await sleep(5000); continue }
      if (!r.ok) continue
      const d = await r.json()
      for (const pg of Object.values(d.query?.pages||{})) {
        if (pg.thumbnail?.source) return pg.thumbnail.source
      }
    } catch(e) {}
  }
  return null
}

let ok=0, fail=0
for (let i=0; i<needImages.length; i++) {
  const b = needImages[i]
  const fp = path.join(BIRDS_DIR, `${b.id}.jpg`)
  if (existsSync(fp)) continue
  try {
    const url = await getImageUrl(b.scientificName, b.name)
    if (!url) { console.log(`[${i+1}] MISS ${b.name}`); fail++; continue }
    const r = await fetch(url, { headers:{'User-Agent':UA} })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length < 500) throw new Error('tiny')
    await writeFile(fp, buf)
    ok++
    if (ok % 20 === 0) console.log(`[${i+1}/${needImages.length}] Downloaded ${ok} so far...`)
  } catch(e) {
    console.log(`[${i+1}] FAIL ${b.name}: ${e.message}`)
    fail++
    if (e.message.includes('429')) await sleep(5000)
  }
  await sleep(1000) // 1s between each request
}
console.log(`Done! OK: ${ok}, Failed: ${fail}`)
