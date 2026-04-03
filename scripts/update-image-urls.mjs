// update-image-urls.mjs — Updates imageUrl fields in bird data files
// to point to /birds/<kebab-name>.jpg if that file exists in public/birds/

import fs from 'fs'
import path from 'path'

const PUBLIC_DIR = path.resolve('public/birds')
const DATA_DIR = path.resolve('src/data')

// Get list of available images
const images = new Set(fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.jpg')))

const files = [
  'birds.ts',
  'birds_batch1.ts',
  'birds_batch2.ts',
  'birds_batch3.ts',
  'birds_batch4.ts',
  'birds_batch5.ts',
  'birds_batch6.ts',
]

let updated = 0
let notFound = 0

for (const file of files) {
  const filePath = path.join(DATA_DIR, file)
  if (!fs.existsSync(filePath)) continue

  let content = fs.readFileSync(filePath, 'utf-8')
  let changed = false

  // Match patterns like:
  //   name: 'Robin',
  // ... followed by ...
  //   imageUrl: null,  or  imageUrl: '/birds/robin.jpg',

  // Find each bird entry and update its imageUrl
  const nameRegex = /name: '([^']+)'/g
  let match
  while ((match = nameRegex.exec(content)) !== null) {
    const name = match[1]
    const kebab = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
    const filename = kebab + '.jpg'

    if (images.has(filename)) {
      const newUrl = `/birds/${filename}`
      // Find the imageUrl line after this name
      const afterName = content.indexOf(match[0], match.index)
      const nextImageUrl = content.indexOf('imageUrl:', afterName)

      if (nextImageUrl !== -1 && nextImageUrl - afterName < 500) {
        const lineEnd = content.indexOf(',', nextImageUrl)
        if (lineEnd !== -1) {
          const oldLine = content.substring(nextImageUrl, lineEnd)
          const newLine = `imageUrl: '${newUrl}'`
          if (oldLine !== newLine) {
            content = content.substring(0, nextImageUrl) + newLine + content.substring(lineEnd)
            changed = true
            updated++
          }
        }
      }
    } else {
      console.log(`  NO IMAGE: ${name} (expected ${filename})`)
      notFound++
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content)
    console.log(`Updated: ${file}`)
  }
}

console.log(`\nDone: ${updated} imageUrls updated, ${notFound} missing images`)
