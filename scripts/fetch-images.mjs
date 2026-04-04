#!/usr/bin/env node
/**
 * Fetch bird images from Wikimedia Commons for birds missing imageUrls.
 * Uses the Wikimedia API to search by scientific name, gets a high-quality JPG.
 */

import { createWriteStream } from 'fs'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { pipeline } from 'stream/promises'
import https from 'https'

const BIRDS_DIR = new URL('../public/birds/', import.meta.url).pathname
const DATA_DIR = new URL('../src/data/', import.meta.url).pathname
const DELAY_MS = 1500

const BIRDS_TO_FETCH = [
  { id: 'arctic-skua',          sci: 'Stercorarius parasiticus' },
  { id: 'arctic-tern',          sci: 'Sterna paradisaea' },
  { id: 'baird-sandpiper',      sci: 'Calidris bairdii' },
  { id: 'black-guillemot',      sci: 'Cepphus grylle' },
  { id: 'black-tern',           sci: 'Chlidonias niger' },
  { id: 'black-tailed-godwit',  sci: 'Limosa limosa' },
  { id: 'brnnich-guillemot',    sci: 'Uria lomvia' },
  { id: 'common-guillemot',     sci: 'Uria aalge' },
  { id: 'cream-coloured-courser', sci: 'Cursorius cursor' },
  { id: 'curlew-sandpiper',     sci: 'Calidris ferruginea' },
  { id: 'forster-tern',         sci: 'Sterna forsteri' },
  { id: 'great-auk',            sci: 'Pinguinus impennis' },
  { id: 'great-snipe',          sci: 'Gallinago media' },
  { id: 'grey-phalarope',       sci: 'Phalaropus fulicarius' },
  { id: 'jack-snipe',           sci: 'Lymnocryptes minimus' },
  { id: 'kentish-plover',       sci: 'Anarhynchus alexandrinus' },
  { id: 'least-sandpiper',      sci: 'Calidris minutilla' },
  { id: 'little-auk',           sci: 'Alle alle' },
  { id: 'little-stint',         sci: 'Calidris minuta' },
  { id: 'long-tailed-skua',     sci: 'Stercorarius longicaudus' },
  { id: 'oriental-pratincole',  sci: 'Glareola maldivarum' },
  { id: 'pectoral-sandpiper',   sci: 'Calidris melanotos' },
  { id: 'pomarine-skua',        sci: 'Stercorarius pomarinus' },
  { id: 'purple-sandpiper',     sci: 'Calidris maritima' },
  { id: 'red-necked-phalarope', sci: 'Phalaropus lobatus' },
  { id: 'ross-gull',            sci: 'Rhodostethia rosea' },
  { id: 'semipalmated-sandpiper', sci: 'Calidris pusilla' },
  { id: 'spotted-redshank',     sci: 'Tringa erythropus' },
  { id: 'spotted-sandpiper',    sci: 'Actitis macularius' },
  { id: 'temminck-stint',       sci: 'Calidris temminckii' },
  { id: 'upland-sandpiper',     sci: 'Bartramia longicauda' },
  { id: 'western-sandpiper',    sci: 'Calidris mauri' },
  { id: 'white-rumped-sandpiper', sci: 'Calidris fuscicollis' },
  { id: 'wilson-phalarope',     sci: 'Phalaropus tricolor' },
  { id: 'wilson-snipe',         sci: 'Gallinago delicata' },
  { id: 'wood-sandpiper',       sci: 'Tringa glareola' },
]

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'InOurGarden/1.0 (bird app; educational)' }
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`JSON parse failed: ${data.slice(0, 200)}`)) }
      })
    }).on('error', reject)
  })
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath)
    https.get(url, { headers: { 'User-Agent': 'InOurGarden/1.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject)
        return
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', err => { file.close(); reject(err) })
  })
}

async function searchWikimediaImage(sciName) {
  // Search Commons for the scientific name
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(sciName)}&srnamespace=6&srlimit=5&format=json`
  const searchData = await fetchJson(searchUrl)

  if (!searchData.query?.search?.length) return null

  // Get the first result's image info
  const titles = searchData.query.search.slice(0, 3).map(r => r.title).join('|')
  const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=800&format=json`
  const infoData = await fetchJson(infoUrl)

  const pages = Object.values(infoData.query?.pages || {})
  for (const page of pages) {
    const info = page.imageinfo?.[0]
    if (!info) continue
    if (!info.mime?.startsWith('image/')) continue
    // Prefer JPEG over SVG/PNG
    const url = info.thumburl || info.url
    if (url && (info.mime === 'image/jpeg' || info.mime === 'image/png')) {
      return url
    }
  }

  // Fall back to any image
  for (const page of pages) {
    const info = page.imageinfo?.[0]
    if (info?.thumburl || info?.url) return info.thumburl || info.url
  }

  return null
}

async function findBestImage(birdId, sciName) {
  // Try searching by scientific name first
  let imageUrl = await searchWikimediaImage(sciName)
  if (imageUrl) return imageUrl

  // Try common name (derived from id)
  const commonName = birdId.replace(/-/g, ' ')
  imageUrl = await searchWikimediaImage(commonName + ' bird')
  return imageUrl
}

async function main() {
  const results = {} // id -> local path

  for (const bird of BIRDS_TO_FETCH) {
    const destPath = `${BIRDS_DIR}${bird.id}.jpg`

    if (existsSync(destPath)) {
      console.log(`  ✓ ${bird.id} — already exists`)
      results[bird.id] = `/birds/${bird.id}.jpg`
      continue
    }

    console.log(`  → ${bird.id} (${bird.sci})…`)

    try {
      const imgUrl = await findBestImage(bird.id, bird.sci)

      if (!imgUrl) {
        console.log(`    ✗ no image found`)
        continue
      }

      await downloadFile(imgUrl, destPath)
      results[bird.id] = `/birds/${bird.id}.jpg`
      console.log(`    ✓ saved`)
    } catch (err) {
      console.log(`    ✗ error: ${err.message}`)
    }

    await sleep(DELAY_MS)
  }

  // Update data files with new imageUrls
  console.log('\nUpdating data files...')
  let updated = 0

  const files = [`${DATA_DIR}birds.ts`, ...Array.from({length:12}, (_,i) => `${DATA_DIR}birds_batch${i+1}.ts`)]

  for (const filepath of files) {
    if (!existsSync(filepath)) continue
    let content = readFileSync(filepath, 'utf8')
    let changed = false

    for (const [birdId, localPath] of Object.entries(results)) {
      // Replace imageUrl: null for this bird
      const pattern = new RegExp(
        `(id:\\s*'${birdId.replace(/-/g, '\\-')}'[\\s\\S]{0,400}?imageUrl:\\s*)null`,
        'g'
      )
      const newContent = content.replace(pattern, `$1'${localPath}'`)
      if (newContent !== content) {
        content = newContent
        changed = true
        updated++
        console.log(`  Updated ${birdId}`)
      }
    }

    if (changed) writeFileSync(filepath, content, 'utf8')
  }

  console.log(`\nDone. ${updated} imageUrls updated.`)
}

main().catch(console.error)
