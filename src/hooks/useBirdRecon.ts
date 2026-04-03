// useBirdRecon — on-device AI bird identification using Transformers.js
// Uses dima806/bird_species_image_detection (ViT, 525 species)
// Runs entirely in the browser via Web Worker — no API key required

import { useState, useCallback, useEffect, useRef } from 'react'
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

// ─── 525-species label → UK catalogue mapping ──────────────────────────────
// Maps model labels (UPPERCASE) to catalogue bird IDs
// Only maps species that have a plausible UK equivalent

const LABEL_TO_CATALOGUE: Record<string, string[]> = {
  // Direct UK species matches
  'AMERICAN ROBIN': ['robin'],
  'EUROPEAN GOLDFINCH': ['goldfinch'],
  'EURASIAN MAGPIE': ['magpie'],
  'EURASIAN BULLFINCH': ['bullfinch'],
  'EURASIAN GOLDEN ORIOLE': ['golden-oriole'],
  'EUROPEAN TURTLE DOVE': ['turtle-dove'],
  'COMMON STARLING': ['starling'],
  'COMMON HOUSE MARTIN': ['house-martin'],
  'COMMON FIRECREST': ['firecrest'],
  'BARN OWL': ['barn-owl'],
  'BARN SWALLOW': ['swallow'],
  'HOUSE SPARROW': ['house-sparrow'],
  'HOUSE FINCH': ['linnet', 'greenfinch'],
  'MALLARD DUCK': ['mallard'],
  'MANDRIN DUCK': ['mandarin-duck'],
  'DUNLIN': ['dunlin'],
  'PUFFIN': ['puffin'],
  'RAZORBILL': ['razorbill'],
  'OSPREY': ['osprey'],
  'PEREGRINE FALCON': ['peregrine'],
  'MERLIN': ['merlin'],
  'GOLDEN EAGLE': ['golden-eagle'],
  'BALD EAGLE': ['white-tailed-eagle'],
  'HAWFINCH': ['hawfinch'],
  'PARUS MAJOR': ['great-tit'],
  'AZURE TIT': ['blue-tit'],
  'CROW': ['carrion-crow'],
  'ROCK DOVE': ['feral-pigeon', 'stock-dove'],
  'GREY PLOVER': ['grey-plover'],
  'GRAY PARTRIDGE': ['grey-partridge'],
  'BAR-TAILED GODWIT': ['bar-tailed-godwit'],
  'BEARDED REEDLING': ['bearded-tit'],
  'BLACK-NECKED GREBE': ['slavonian-grebe'],
  'LONG-EARED OWL': ['long-eared-owl'],
  'SAND MARTIN': ['sand-martin'],
  'NORTHERN GANNET': ['gannet'],
  'NORTHERN FULMAR': ['fulmar'],
  'NORTHERN GOSHAWK': ['goshawk'],
  'NORTHERN SHOVELER': ['shoveler'],
  'RING-NECKED PHEASANT': ['pheasant'],
  'RED CROSSBILL': ['crossbill'],
  'RED KNOT': ['knot'],
  'WHIMBREL': ['whimbrel'],
  'JACK SNIPE': ['snipe'],
  'RUDDY SHELDUCK': ['shelduck'],
  'GREAT GRAY OWL': ['tawny-owl'],
  'SNOWY OWL': ['barn-owl'],
  'ALPINE CHOUGH': ['chough'],
  'CASPIAN TERN': ['common-tern'],
  'WILLOW PTARMIGAN': ['ptarmigan'],
  'BLUE GROUSE': ['black-grouse'],
  'BLOOD PHEASANT': ['pheasant'],
  'RED TAILED HAWK': ['buzzard'],
  'ROUGH LEG BUZZARD': ['buzzard'],
  'HARLEQUIN DUCK': ['teal', 'tufted-duck'],
  'BAIKAL TEAL': ['teal'],
  'TEAL DUCK': ['teal'],
  'MOURNING DOVE': ['collared-dove'],
  'SQUACCO HERON': ['grey-heron'],
  'BLUE HERON': ['grey-heron'],
  'GLOSSY IBIS': ['little-egret'],
  'OYSTER CATCHER': ['oystercatcher'],
  'MASKED LAPWING': ['lapwing'],
  'ANDEAN LAPWING': ['lapwing'],
  'AMERICAN AVOCET': ['avocet'],
  'AMERICAN COOT': ['coot'],
  'AMERICAN DIPPER': ['dipper'],
  'AMERICAN KESTREL': ['kestrel'],
  'AMERICAN PIPIT': ['meadow-pipit'],
  'AMERICAN WIGEON': ['wigeon'],
  'CRAB PLOVER': ['ringed-plover'],
  'SNOWY PLOVER': ['ringed-plover'],
  'FOREST WAGTAIL': ['pied-wagtail', 'grey-wagtail'],
  'DARK EYED JUNCO': ['dunnock'],
  'CHIPPING SPARROW': ['tree-sparrow'],
  'BLACK-THROATED SPARROW': ['house-sparrow'],
  'JAPANESE ROBIN': ['robin'],
  'DUSKY ROBIN': ['robin'],
  'PINK ROBIN': ['robin'],
  'EASTERN YELLOW ROBIN': ['robin'],
  'DAURIAN REDSTART': ['redstart'],
  'AMERICAN REDSTART': ['redstart'],
  'SPLENDID WREN': ['wren'],
  'CACTUS WREN': ['wren'],
  'FASCIATED WREN': ['wren'],
  'BROWN CREPPER': ['treecreeper'],
  'WALL CREAPER': ['treecreeper'],
  'CRESTED NUTHATCH': ['nuthatch'],
  'RED HEADED WOODPECKER': ['great-spotted-woodpecker'],
  'DOWNY WOODPECKER': ['great-spotted-woodpecker', 'lesser-spotted-woodpecker'],
  'GILA WOODPECKER': ['green-woodpecker'],
  'CANARY': ['yellowhammer', 'siskin'],
  'ANDEAN SISKIN': ['siskin'],
  'CEDAR WAXWING': ['waxwing'],
  'SURF SCOTER': ['eider'],
  'KING EIDER': ['eider'],
  'SNOW GOOSE': ['greylag-goose'],
  'EGYPTIAN GOOSE': ['canada-goose'],
  'HAWAIIAN GOOSE': ['canada-goose'],
  'BLACK SWAN': ['mute-swan'],
  'TRUMPTER SWAN': ['mute-swan'],
  'HOOPOES': ['hoopoe'],
  'LITTLE AUK': ['guillemot'],
  'LAUGHING GULL': ['black-headed-gull'],
  'CALIFORNIA GULL': ['herring-gull'],
  'IVORY GULL': ['herring-gull'],
  'FAIRY TERN': ['common-tern'],
  'INCA TERN': ['arctic-tern'],
  'LIMPKIN': ['curlew'],
  'SUPERB STARLING': ['starling'],
  'CAPE GLOSSY STARLING': ['starling'],
  'BALI STARLING': ['starling'],
  'PURPLE MARTIN': ['house-martin', 'sand-martin'],
  'TREE SWALLOW': ['swallow'],
  'STRIPPED SWALLOW': ['swallow'],
  'SCARLET TANAGER': ['crossbill'],
  'NORTHERN CARDINAL': ['bullfinch'],
  'DOUBLE BRESTED CORMARANT': ['cormorant'],
  'BRANDT CORMARANT': ['cormorant'],
  'RED FACED CORMORANT': ['shag'],
  'GYRFALCON': ['peregrine'],
  'GREY HEADED FISH EAGLE': ['osprey'],
  'SHORT BILLED DOWITCHER': ['snipe', 'redshank'],
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

// ─── Map model predictions to UK bird catalogue ────────────────────────────

function mapToCatalogue(
  predictions: { label: string; score: number }[],
): ReconMatch[] {
  const seen = new Set<string>()
  const matches: ReconMatch[] = []

  console.log('[BirdRecon] Model predictions:', predictions.map(p =>
    `${p.label} (${(p.score * 100).toFixed(1)}%)`
  ))

  for (const pred of predictions) {
    const label = pred.label.toUpperCase().trim()

    // ── Step 1: Direct label mapping ──────────────────────────────
    const directIds = LABEL_TO_CATALOGUE[label]
    if (directIds) {
      for (const id of directIds) {
        if (seen.has(id)) continue
        const bird = BIRDS.find(b => b.id === id)
        if (!bird) continue
        seen.add(id)
        matches.push({
          bird,
          confidence: Math.round(pred.score * 100),
          reasoning: `Identified as ${pred.label} — matches ${bird.name}`,
        })
      }
    }

    // ── Step 2: Fuzzy name matching against catalogue ─────────────
    // Try matching prediction label words against bird names/families
    const predWords = label.toLowerCase().split(/\s+/)
    for (const bird of BIRDS) {
      if (seen.has(bird.id)) continue
      const birdNameLower = bird.name.toLowerCase()
      const birdWords = birdNameLower.split(/[\s-]+/)

      // Check if a significant word from the prediction matches the bird name
      const significantMatch = predWords.some(pw =>
        pw.length >= 4 && (
          birdNameLower.includes(pw) ||
          birdWords.some(bw => bw === pw)
        )
      )

      if (significantMatch) {
        seen.add(bird.id)
        matches.push({
          bird,
          confidence: Math.round(pred.score * 85), // Slightly lower for fuzzy
          reasoning: `Identified as ${pred.label} — similar to ${bird.name}`,
        })
      }
    }
  }

  console.log('[BirdRecon] Matched UK birds:', matches.map(m =>
    `${m.bird.name} (${m.confidence}%)`
  ))

  return matches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useBirdRecon() {
  const [status, setStatus] = useState<ReconStatus>('idle')
  const [photo, setPhoto] = useState<string | null>(null)
  const [result, setResult] = useState<ReconResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const workerRef = useRef<Worker | null>(null)

  // Spin up Web Worker on mount
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/birdRecon.worker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (e: MessageEvent) => {
      const { type, status: workerStatus, predictions, message } = e.data

      if (type === 'model-ready') {
        setModelLoaded(true)
      } else if (type === 'status') {
        console.log(`[BirdRecon] Worker status: ${workerStatus}`)
      } else if (type === 'result') {
        console.log('[BirdRecon] Worker returned predictions')
        const mapped = mapToCatalogue(predictions)
        const topPred = predictions[0]
        const description = mapped.length > 0
          ? `Identified as ${topPred.label} (${Math.round(topPred.score * 100)}% confidence). Best UK match: ${mapped[0].bird.name}.`
          : `Identified as ${topPred.label} (${Math.round(topPred.score * 100)}% confidence). No direct UK species match found — try the manual filters below.`

        setResult({
          matches: mapped,
          rawDescription: description,
          timestamp: new Date(),
        })
        setStatus('done')
      } else if (type === 'error') {
        console.error('[BirdRecon] Worker error:', message)
        setError(message)
        setStatus('error')
      }
    }

    worker.onerror = (e) => {
      console.error('[BirdRecon] Worker crashed:', e)
      setError('Bird identification engine failed to start')
      setStatus('error')
    }

    workerRef.current = worker
    return () => worker.terminate()
  }, [])

  const analyse = useCallback(async (base64Image: string) => {
    try {
      setStatus('loading')
      setError(null)

      console.log('[BirdRecon] Resizing image...')
      const resized = await resizeImage(base64Image)
      setPhoto(resized)

      setStatus('analysing')
      console.log('[BirdRecon] Sending to worker...')
      workerRef.current?.postMessage({
        type: 'analyse',
        payload: { imageDataUrl: resized },
      })
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
