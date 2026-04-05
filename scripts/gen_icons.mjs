/**
 * Generates PWA icons using the Lucide Bird SVG, centred on a
 * rounded-square dark-green background.
 *
 * Sizes: 192, 512 (app icons) and 180 (apple-touch-icon)
 */
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dir, '../public')

// Lucide Bird paths (viewBox 0 0 24 24, stroke-based)
const BIRD_PATHS = [
  'M16 7h.01',
  'M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20',
  'm20 7 2 .5-2 .5',
  'M10 18v3',
  'M14 17.75V21',
  'M7 18a6 6 0 0 0 3.84-10.61',
]

function makeSvg(size) {
  const bg       = '#111111'   // near-black to match system dark mode icons
  const iconCol  = '#b5c47e'   // sage green
  const radius   = size * 0.22 // rounded square corners

  // The bird icon occupies a 24×24 viewBox.
  // We want it centred and taking up ~50% of the icon area (with padding).
  const birdSize  = size * 0.50
  const birdOff   = (size - birdSize) / 2

  // Use a nested <svg> with its own viewBox so stroke-width doesn't scale up
  const pathsStr = BIRD_PATHS.map(d =>
    `<path d="${d}" fill="none" stroke="${iconCol}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
  ).join('\n    ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- background -->
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${bg}"/>
  <!-- bird icon: nested svg keeps stroke-width in the 24×24 coordinate space -->
  <svg x="${birdOff.toFixed(2)}" y="${birdOff.toFixed(2)}" width="${birdSize.toFixed(2)}" height="${birdSize.toFixed(2)}" viewBox="0 0 24 24">
    ${pathsStr}
  </svg>
</svg>`
}

for (const [size, name] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) {
  const svg = makeSvg(size)
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  const outPath = resolve(publicDir, name)
  writeFileSync(outPath, png)
  console.log(`✓ ${name} (${size}×${size})  →  ${outPath}`)
}
