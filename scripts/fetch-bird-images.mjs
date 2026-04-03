// fetch-bird-images.mjs — Downloads bird images from Wikipedia for all species
// Uses the Wikipedia API to find the main image for each bird's article

import https from 'https'
import fs from 'fs'
import path from 'path'

const OUT_DIR = path.resolve('public/birds')

// Wikipedia article title overrides for species whose common name doesn't match
const WIKI_OVERRIDES = {
  'Rock Dove/Feral Pigeon': 'Rock_dove',
  'Hooded Crow': 'Hooded_crow',
  'Bearded Tit': 'Bearded_reedling',
  'Storm Petrel': 'European_storm_petrel',
  'Redpoll': 'Common_redpoll',
  'Lesser Redpoll': 'Lesser_redpoll',
  'Crossbill': 'Red_crossbill',
  'Ring Ouzel': 'Ring_ouzel',
  'Cirl Bunting': 'Cirl_bunting',
  'Corn Bunting': 'Corn_bunting',
  'Snow Bunting': 'Snow_bunting',
  'Reed Bunting': 'Common_reed_bunting',
  'Dotterel': 'Eurasian_dotterel',
  'Greenshank': 'Common_greenshank',
  'Knot': 'Red_knot',
  'Ruff': 'Ruff_(bird)',
  'Whimbrel': 'Eurasian_whimbrel',
  'Chough': 'Red-billed_chough',
  'Dipper': 'White-throated_dipper',
  'Merlin': 'Merlin_(bird)',
  'Hobby': 'Eurasian_hobby',
  'Goshawk': 'Northern_goshawk',
  'Sparrowhawk': 'Eurasian_sparrowhawk',
  'Peregrine': 'Peregrine_falcon',
  'Firecrest': 'Common_firecrest',
  'Wryneck': 'Eurasian_wryneck',
  'Whitethroat': 'Common_whitethroat',
  'Lesser Whitethroat': 'Lesser_whitethroat',
  'Stonechat': 'European_stonechat',
  'Wheatear': 'Northern_wheatear',
  'Redstart': 'Common_redstart',
  'Nightingale': 'Common_nightingale',
  'Nightjar': 'European_nightjar',
  'Treecreeper': 'Eurasian_treecreeper',
  'Swallow': 'Barn_swallow',
  'Swift': 'Common_swift',
  'House Martin': 'Common_house_martin',
  'Rock Pipit': 'Eurasian_rock_pipit',
  'Pied Wagtail': 'White_wagtail',
  'Yellow Wagtail': 'Western_yellow_wagtail',
  'Linnet': 'Common_linnet',
  'Siskin': 'Eurasian_siskin',
  'Waxwing': 'Bohemian_waxwing',
  'Coot': 'Eurasian_coot',
  'Moorhen': 'Common_moorhen',
  'Snipe': 'Common_snipe',
  'Woodcock': 'Eurasian_woodcock',
  'Curlew': 'Eurasian_curlew',
  'Redshank': 'Common_redshank',
  'Turnstone': 'Ruddy_turnstone',
  'Ringed Plover': 'Common_ringed_plover',
  'Golden Plover': 'European_golden_plover',
  'Avocet': 'Pied_avocet',
  'Oystercatcher': 'Eurasian_oystercatcher',
  'Shelduck': 'Common_shelduck',
  'Teal': 'Eurasian_teal',
  'Wigeon': 'Eurasian_wigeon',
  'Pintail': 'Northern_pintail',
  'Shoveler': 'Northern_shoveler',
  'Pochard': 'Common_pochard',
  'Goldeneye': 'Common_goldeneye',
  'Goosander': 'Common_merganser',
  'Eider': 'Common_eider',
  'Robin': 'European_robin',
  'Blue Tit': 'Eurasian_blue_tit',
  'Nuthatch': 'Eurasian_nuthatch',
  'Jay': 'Eurasian_jay',
  'Magpie': 'Eurasian_magpie',
  'Jackdaw': 'Western_jackdaw',
  'Rook': 'Rook_(bird)',
  'Raven': 'Common_raven',
  'Starling': 'Common_starling',
  'Wren': 'Eurasian_wren',
  'Blackbird': 'Common_blackbird',
  'Blackcap': 'Eurasian_blackcap',
  'Chiffchaff': 'Common_chiffchaff',
  'Reed Warbler': 'Eurasian_reed_warbler',
  'Grasshopper Warbler': 'Common_grasshopper_warbler',
  "Cetti's Warbler": "Cetti's_warbler",
  'Woodpigeon': 'Common_wood_pigeon',
  'Collared Dove': 'Eurasian_collared_dove',
  'Turtle Dove': 'European_turtle_dove',
  'Cuckoo': 'Common_cuckoo',
  'Ring-necked Parakeet': 'Rose-ringed_parakeet',
  'Kingfisher': 'Common_kingfisher',
  'Green Woodpecker': 'European_green_woodpecker',
  'Skylark': 'Eurasian_skylark',
  'Goldfinch': 'European_goldfinch',
  'Greenfinch': 'European_greenfinch',
  'Bullfinch': 'Eurasian_bullfinch',
  'Chaffinch': 'Common_chaffinch',
  'Pheasant': 'Common_pheasant',
  'Ptarmigan': 'Rock_ptarmigan',
  'Capercaillie': 'Western_capercaillie',
  'Cormorant': 'Great_cormorant',
  'Shag': 'European_shag',
  'Gannet': 'Northern_gannet',
  'Fulmar': 'Northern_fulmar',
  'Guillemot': 'Common_murre',
  'Puffin': 'Atlantic_puffin',
  'Kittiwake': 'Black-legged_kittiwake',
  'Herring Gull': 'European_herring_gull',
  'Kestrel': 'Common_kestrel',
  'Marsh Harrier': 'Western_marsh_harrier',
  'Red Kite': 'Red_kite_(bird)',
  'Buzzard': 'Common_buzzard',
  'Honey Buzzard': 'European_honey_buzzard',
  'Hoopoe': 'Eurasian_hoopoe',
  'Lapwing': 'Northern_lapwing',
  'Pied Flycatcher': 'European_pied_flycatcher',
  'Tree Sparrow': 'Eurasian_tree_sparrow',
  'Slavonian Grebe': 'Horned_grebe',
  'Spoonbill': 'Eurasian_spoonbill',
  'Bittern': 'Eurasian_bittern',
}

function nameToFilename(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') + '.jpg'
}

function nameToWikiTitle(name) {
  if (WIKI_OVERRIDES[name]) return WIKI_OVERRIDES[name]
  // Wikipedia titles: first word capitalised, rest lowercase (unless proper noun)
  return name.replace(/ /g, '_')
}

// Try multiple title variants
function getWikiTitleVariants(name) {
  if (WIKI_OVERRIDES[name]) return [WIKI_OVERRIDES[name]]
  const base = name.replace(/ /g, '_')
  // Try: exact, lowercase-after-first, fully lowercase first-cap
  const lowerAfterFirst = base.split('_').map((w, i) => i === 0 ? w : w.toLowerCase()).join('_')
  const allLower = base.charAt(0) + base.slice(1).toLowerCase().replace(/ /g, '_')
  const variants = [base]
  if (lowerAfterFirst !== base) variants.push(lowerAfterFirst)
  if (allLower !== base && allLower !== lowerAfterFirst) variants.push(allLower)
  return variants
}

// Robust HTTPS fetch with redirect following
function fetchUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'))

    const req = https.get(url, {
      headers: {
        'User-Agent': 'InOurGarden/1.0 (bird watching app; https://github.com)',
        'Accept': '*/*',
      },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location
        if (redirectUrl.startsWith('//')) redirectUrl = 'https:' + redirectUrl
        res.resume() // consume response
        return fetchUrl(redirectUrl, maxRedirects - 1).then(resolve).catch(reject)
      }

      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode}`))
      }

      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })

    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

async function getWikiImageUrl(wikiTitle) {
  // Use the MediaWiki API to get page images
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&format=json&pithumbsize=800`

  const buf = await fetchUrl(apiUrl)
  const data = JSON.parse(buf.toString())
  const pages = data?.query?.pages
  if (!pages) return null

  const page = Object.values(pages)[0]
  if (page?.thumbnail?.source) {
    return page.thumbnail.source
  }
  return null
}

async function downloadImage(url, filepath) {
  const buf = await fetchUrl(url)
  if (buf.length < 500) return false // too small, probably an error
  fs.writeFileSync(filepath, buf)
  return true
}

async function main() {
  const birdNames = fs.readFileSync('/dev/stdin', 'utf-8').trim().split('\n')

  let success = 0
  let failed = 0
  const failures = []

  for (const name of birdNames) {
    const filename = nameToFilename(name)
    const filepath = path.join(OUT_DIR, filename)

    // Skip if already downloaded
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
      console.log(`  SKIP ${name}`)
      success++
      continue
    }

    const variants = getWikiTitleVariants(name)

    try {
      let imgUrl = null
      for (const variant of variants) {
        imgUrl = await getWikiImageUrl(variant)
        if (imgUrl) break
        await new Promise(r => setTimeout(r, 200))
      }
      if (!imgUrl) {
        console.log(`  FAIL ${name} (no image, tried: ${variants.join(', ')})`)
        failed++
        failures.push(name)
        continue
      }

      const ok = await downloadImage(imgUrl, filepath)
      if (ok) {
        const size = fs.statSync(filepath).size
        console.log(`  OK   ${name} -> ${filename} (${Math.round(size / 1024)}KB)`)
        success++
      } else {
        console.log(`  FAIL ${name} (download too small)`)
        failed++
        failures.push(name)
      }
    } catch (err) {
      console.log(`  FAIL ${name} (${err.message})`)
      failed++
      failures.push(name)
    }

    // Rate limit — be generous to avoid 429s
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\nDone: ${success} success, ${failed} failed`)
  if (failures.length) {
    console.log('Failed:', failures.join(', '))
  }
}

main()
