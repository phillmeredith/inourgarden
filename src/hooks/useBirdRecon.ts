// useBirdRecon — on-device AI bird identification using TensorFlow.js
// Uses MobileNet (ImageNet) to classify bird photos, then maps to UK catalogue
// No API key required — runs entirely in the browser

import { useState, useCallback, useRef, useEffect } from 'react'
import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-backend-cpu'
import * as tf from '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'
import { BIRDS } from '../data/birds'
import type { BirdSpecies } from '../data/birds'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReconMatch {
  bird: BirdSpecies
  confidence: number        // 0-100
  reasoning: string         // Why this bird was matched
}

export interface ReconResult {
  matches: ReconMatch[]
  rawDescription: string    // Summary of what the model detected
  timestamp: Date
}

type ReconStatus = 'idle' | 'loading' | 'analysing' | 'done' | 'error'

// ─── ImageNet bird class → UK catalogue mapping ────────────────────────────
// Maps ImageNet class names (lowercase) to catalogue bird IDs
// MobileNet/ImageNet has ~60 bird classes; we map all that overlap with UK species

const IMAGENET_TO_CATALOGUE: Record<string, string[]> = {
  // Direct species matches
  'robin': ['robin'],
  'european robin': ['robin'],
  'robin, american robin': ['robin'],
  'magpie': ['magpie'],
  'jay': ['jay'],
  'goldfinch': ['goldfinch'],
  'european goldfinch': ['goldfinch'],
  'house finch': ['goldfinch', 'linnet', 'bullfinch'],
  'brambling': ['brambling'],
  'junco': ['dunnock'],
  'indigo bunting': ['blue-tit', 'kingfisher'],
  'bulbul': ['blackbird', 'starling'],
  'chickadee': ['blue-tit', 'great-tit', 'coal-tit'],
  'water ouzel': ['dipper'],
  'dipper': ['dipper'],
  'hummingbird': ['kingfisher'],
  'bee eater': ['kingfisher'],
  'hornbill': ['kingfisher'],
  'kingfisher': ['kingfisher'],
  'jacamar': ['kingfisher'],
  'toucan': ['puffin'],
  'drake': ['mallard'],
  'red-breasted merganser': ['goosander', 'mallard'],
  'goose': ['canada-goose', 'greylag-goose'],
  'swan': ['mute-swan'],
  'black swan': ['mute-swan'],
  'black stork': ['heron'],
  'white stork': ['heron'],
  'crane': ['heron', 'grey-heron'],
  'heron': ['grey-heron'],
  'spoonbill': ['grey-heron'],
  'flamingo': ['grey-heron'],
  'little blue heron': ['grey-heron'],
  'bittern': ['bittern'],
  'american egret': ['little-egret', 'grey-heron'],
  'pelican': ['cormorant'],
  'albatross': ['gannet', 'fulmar'],
  'king penguin': ['puffin', 'guillemot', 'razorbill'],
  'coucal': ['pheasant'],
  'cock': ['pheasant'],
  'hen': ['pheasant'],
  'peacock': ['pheasant'],
  'partridge': ['red-legged-partridge', 'grey-partridge'],
  'quail': ['grey-partridge', 'red-legged-partridge'],
  'prairie chicken': ['red-grouse', 'grey-partridge'],
  'ptarmigan': ['ptarmigan'],
  'ruffed grouse': ['red-grouse'],
  'black grouse': ['black-grouse'],
  'vulture': ['red-kite', 'buzzard'],
  'bald eagle': ['white-tailed-eagle', 'golden-eagle'],
  'kite': ['red-kite'],
  'red-tailed hawk': ['buzzard', 'red-kite'],
  'hawk': ['sparrowhawk', 'buzzard'],
  'osprey': ['osprey'],
  'owl': ['tawny-owl', 'barn-owl'],
  'great grey owl': ['tawny-owl'],
  'barn owl': ['barn-owl'],
  'eagle': ['golden-eagle'],
  'limpkin': ['curlew'],
  'coot': ['coot'],
  'bustard': ['curlew'],
  'american coot': ['coot', 'moorhen'],
  'oystercatcher': ['oystercatcher'],
  'redshank': ['redshank'],
  'dowitcher': ['snipe', 'redshank'],
  'woodpecker': ['great-spotted-woodpecker', 'green-woodpecker'],
  'red-backed sandpiper': ['dunlin'],
  'dunlin': ['dunlin'],
  'sandpiper': ['dunlin', 'common-sandpiper'],
  'red-breasted sandpiper': ['dunlin', 'knot'],
  'african grey': ['woodpigeon', 'stock-dove'],
  'macaw': ['jay', 'kingfisher'],
  'lorikeet': ['greenfinch', 'goldfinch'],
  'sulphur-crested cockatoo': ['woodpigeon'],
  'wren': ['wren'],
  'house wren': ['wren'],
  'warbler': ['chiffchaff', 'willow-warbler', 'blackcap'],
  'water thrush': ['dipper', 'grey-wagtail'],
  'wagtail': ['pied-wagtail', 'grey-wagtail'],
  'pipit': ['meadow-pipit'],
  'swallow': ['swallow', 'house-martin'],
  'barn swallow': ['swallow'],
  'swift': ['swift'],
  'nightjar': ['nightjar'],
  'whippoorwill': ['nightjar'],
  'plover': ['lapwing', 'ringed-plover'],
  'lapwing': ['lapwing'],
  'avocet': ['avocet'],
  'cormorant': ['cormorant'],
  'shag': ['shag'],
  'gull': ['herring-gull', 'black-headed-gull'],
  'herring gull': ['herring-gull'],
  'tern': ['common-tern', 'arctic-tern'],
  'skua': ['great-skua'],
  'puffin': ['puffin'],
  'guillemot': ['guillemot'],
  'razorbill': ['razorbill'],
  'starling': ['starling'],
  'crow': ['carrion-crow'],
  'raven': ['raven'],
  'rook': ['rook'],
  'jackdaw': ['jackdaw'],
  'blackbird': ['blackbird'],
  'thrush': ['song-thrush', 'mistle-thrush'],
  'robin redbreast': ['robin'],
  'sparrow': ['house-sparrow', 'tree-sparrow'],
  'house sparrow': ['house-sparrow'],
  'tree sparrow': ['tree-sparrow'],
  'chaffinch': ['chaffinch'],
  'siskin': ['siskin'],
  'linnet': ['linnet'],
  'nuthatch': ['nuthatch'],
  'treecreeper': ['treecreeper'],
  'long-tailed tit': ['long-tailed-tit'],
  'blue tit': ['blue-tit'],
  'great tit': ['great-tit'],
  'coal tit': ['coal-tit'],
  'pigeon': ['woodpigeon', 'feral-pigeon'],
  'dove': ['collared-dove', 'stock-dove'],
  'cuckoo': ['cuckoo'],
}

// ─── Family-level fallback mapping (ImageNet label keywords → families) ─────

const FAMILY_KEYWORDS: Record<string, string[]> = {
  'finch': ['goldfinch', 'chaffinch', 'greenfinch', 'bullfinch', 'siskin', 'linnet'],
  'tit': ['blue-tit', 'great-tit', 'coal-tit', 'long-tailed-tit'],
  'thrush': ['blackbird', 'song-thrush', 'mistle-thrush', 'fieldfare', 'redwing'],
  'warbler': ['chiffchaff', 'willow-warbler', 'blackcap', 'garden-warbler'],
  'wader': ['lapwing', 'curlew', 'oystercatcher', 'redshank', 'dunlin'],
  'raptor': ['buzzard', 'sparrowhawk', 'kestrel', 'red-kite', 'peregrine'],
  'gull': ['herring-gull', 'black-headed-gull', 'lesser-black-backed-gull'],
  'duck': ['mallard', 'teal', 'tufted-duck', 'wigeon', 'pochard'],
  'goose': ['canada-goose', 'greylag-goose', 'brent-goose'],
  'pigeon': ['woodpigeon', 'feral-pigeon', 'stock-dove', 'collared-dove'],
  'crow': ['carrion-crow', 'rook', 'jackdaw', 'magpie', 'jay', 'raven'],
  'owl': ['tawny-owl', 'barn-owl', 'little-owl', 'short-eared-owl'],
  'woodpecker': ['great-spotted-woodpecker', 'green-woodpecker'],
  'heron': ['grey-heron', 'little-egret'],
  'swallow': ['swallow', 'house-martin', 'sand-martin'],
  'bird of prey': ['buzzard', 'sparrowhawk', 'kestrel', 'red-kite', 'peregrine'],
}

// ─── Model singleton ───────────────────────────────────────────────────────

let modelPromise: Promise<mobilenet.MobileNet> | null = null
let modelReady = false

function getModel(): Promise<mobilenet.MobileNet> {
  if (!modelPromise) {
    modelPromise = tf.ready().then(() =>
      mobilenet.load({ version: 2, alpha: 1.0 })
    ).then(m => {
      modelReady = true
      return m
    })
  }
  return modelPromise
}

// ─── Load image as HTMLImageElement ─────────────────────────────────────────

function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = base64
  })
}

// ─── Resize for efficient classification ────────────────────────────────────

function resizeImage(base64: string, maxDim = 512): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const { width, height } = img
      if (width <= maxDim && height <= maxDim) {
        resolve(base64)
        return
      }
      const scale = maxDim / Math.max(width, height)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = base64
  })
}

// ─── Map MobileNet predictions to UK bird catalogue ────────────────────────

function mapToCatalogue(
  predictions: { className: string; probability: number }[],
): ReconMatch[] {
  const seen = new Set<string>()
  const matches: ReconMatch[] = []

  for (const pred of predictions) {
    // MobileNet returns comma-separated labels (e.g. "magpie" or "cock, rooster")
    const labels = pred.className.toLowerCase().split(',').map(s => s.trim())

    for (const label of labels) {
      // Direct mapping
      const directIds = IMAGENET_TO_CATALOGUE[label]
      if (directIds) {
        for (const id of directIds) {
          if (seen.has(id)) continue
          const bird = BIRDS.find(b => b.id === id)
          if (!bird) continue
          seen.add(id)
          matches.push({
            bird,
            confidence: Math.round(pred.probability * 100),
            reasoning: `Detected as "${pred.className}" — matches ${bird.name}`,
          })
        }
        continue
      }

      // Family keyword fallback
      for (const [keyword, birdIds] of Object.entries(FAMILY_KEYWORDS)) {
        if (label.includes(keyword)) {
          for (const id of birdIds.slice(0, 2)) {
            if (seen.has(id)) continue
            const bird = BIRDS.find(b => b.id === id)
            if (!bird) continue
            seen.add(id)
            matches.push({
              bird,
              confidence: Math.round(pred.probability * 70), // Lower confidence for family match
              reasoning: `Detected "${pred.className}" — could be ${bird.name} (${bird.family})`,
            })
          }
        }
      }
    }
  }

  // Sort by confidence descending, cap at 5
  return matches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
}

// ─── Check if any prediction looks bird-related ────────────────────────────

const BIRD_INDICATORS = [
  'bird', 'robin', 'finch', 'sparrow', 'hawk', 'eagle', 'owl', 'heron',
  'duck', 'goose', 'swan', 'gull', 'pigeon', 'dove', 'crow', 'jay',
  'magpie', 'starling', 'thrush', 'warbler', 'wren', 'tit', 'woodpecker',
  'kingfisher', 'swallow', 'martin', 'swift', 'cuckoo', 'grouse', 'pheasant',
  'partridge', 'quail', 'plover', 'sandpiper', 'tern', 'puffin', 'cormorant',
  'pelican', 'crane', 'stork', 'flamingo', 'vulture', 'kite', 'osprey',
  'falcon', 'hen', 'cock', 'drake', 'chickadee', 'bulbul', 'toucan',
  'macaw', 'parrot', 'cockatoo', 'lorikeet', 'albatross', 'penguin',
  'bittern', 'egret', 'avocet', 'lapwing', 'coot', 'moorhen',
  'nightjar', 'dipper', 'wagtail', 'pipit', 'brambling',
]

function isBirdRelated(className: string): boolean {
  const lower = className.toLowerCase()
  return BIRD_INDICATORS.some(kw => lower.includes(kw))
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useBirdRecon() {
  const [status, setStatus] = useState<ReconStatus>('idle')
  const [photo, setPhoto] = useState<string | null>(null)
  const [result, setResult] = useState<ReconResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState(modelReady)

  // Pre-load model on mount
  useEffect(() => {
    if (!modelReady) {
      getModel().then(() => setModelLoaded(true)).catch(() => {})
    }
  }, [])

  const analyse = useCallback(async (base64Image: string) => {
    try {
      setStatus('loading')
      setError(null)

      // Resize the image
      const resized = await resizeImage(base64Image)
      setPhoto(resized)

      // Load model (may already be cached)
      setStatus('analysing')
      const model = await getModel()
      setModelLoaded(true)

      // Classify the image
      const imgElement = await loadImage(resized)
      const predictions = await model.classify(imgElement, 10) // top 10 predictions

      // Check if anything bird-related was detected
      const birdPredictions = predictions.filter(p => isBirdRelated(p.className))
      const allPredictions = birdPredictions.length > 0 ? birdPredictions : predictions

      // Map to UK catalogue
      const matches = mapToCatalogue(allPredictions)

      // Build description
      const topLabels = predictions.slice(0, 3).map(p =>
        `${p.className} (${Math.round(p.probability * 100)}%)`
      ).join(', ')

      const hasBird = birdPredictions.length > 0
      const description = hasBird
        ? `Bird detected: ${birdPredictions[0].className}. ${matches.length > 0 ? `Best UK match: ${matches[0].bird.name}.` : 'No UK species match found.'}`
        : `No bird clearly detected. Top predictions: ${topLabels}. Try a clearer photo with the bird more visible.`

      setResult({
        matches,
        rawDescription: description,
        timestamp: new Date(),
      })
      setStatus('done')
    } catch (err) {
      console.error('[BirdRecon] analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setPhoto(null)
    setResult(null)
    setError(null)
  }, [])

  return {
    status,
    photo,
    result,
    error,
    analyse,
    reset,
    modelLoaded,
  }
}
