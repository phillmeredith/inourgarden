// patch-image-urls.mjs — Scan batch files and set imageUrl for birds that have images downloaded
import fs from 'fs'
import path from 'path'

const BIRDS_DIR = path.resolve('public/birds')
const DATA_DIR = path.resolve('src/data')

// Get all downloaded image filenames (without extension)
const imageFiles = new Set(
  fs.readdirSync(BIRDS_DIR)
    .filter(f => f.endsWith('.jpg'))
    .map(f => f.replace('.jpg', ''))
)

console.log(`Found ${imageFiles.size} bird images`)

// Process each batch file
const batchFiles = fs.readdirSync(DATA_DIR)
  .filter(f => /^birds_batch\d+\.ts$/.test(f))
  .sort()

let totalPatched = 0

for (const file of batchFiles) {
  const filePath = path.join(DATA_DIR, file)
  let content = fs.readFileSync(filePath, 'utf-8')
  let patched = 0

  // Match each bird entry's id and imageUrl
  content = content.replace(
    /id:\s*'([^']+)'([\s\S]*?)imageUrl:\s*null/g,
    (match, id, between) => {
      if (imageFiles.has(id)) {
        patched++
        return `id: '${id}'${between}imageUrl: '/birds/${id}.jpg'`
      }
      return match
    }
  )

  if (patched > 0) {
    fs.writeFileSync(filePath, content)
    console.log(`${file}: patched ${patched} imageUrls`)
    totalPatched += patched
  } else {
    console.log(`${file}: no patches needed`)
  }
}

console.log(`\nTotal: ${totalPatched} imageUrls patched`)
