// useBirdRecon — bird identification via Google Gemini Vision API
// Free tier: gemini-2.0-flash, 1500 req/day, no cost
// Works on all devices including iPhone (no ONNX/WASM required)

import { useState, useCallback } from 'react'
import { BIRDS } from '../data/birds'
import type { BirdSpecies } from '../data/birds'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReconMatch {
  bird: BirdSpecies
  confidence: number        // 0-100
  reasoning: string
}

export interface ReconResult {
  matches: ReconMatch[]
  rawDescription: string
  timestamp: Date
}

type ReconStatus = 'idle' | 'analysing' | 'done' | 'error'

// ─── Config ─────────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

const PROMPT = `You are a UK bird identification expert. Identify the bird in this photo.

Return ONLY valid JSON in this exact format:
{
  "description": "Brief description of what you see in the photo",
  "matches": [
    {
      "name": "UK common name",
      "confidence": 85,
      "reasoning": "Key features that identify this bird"
    }
  ]
}

Rules:
- Use UK common names (e.g. "Robin", "Blue Tit", "Grey Heron", "Mallard")
- Up to 3 matches ordered by confidence (0–100)
- If no bird is clearly visible, return matches: []
- One sentence per reasoning`

// ─── Resize image before sending to API ─────────────────────────────────────

function resizeImage(base64: string, maxDim = 768): Promise<string> {
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

// ─── Map Gemini names to UK catalogue ───────────────────────────────────────

function matchToCatalogue(
  geminiMatches: { name: string; confidence: number; reasoning: string }[],
): ReconMatch[] {
  const seen = new Set<string>()
  const results: ReconMatch[] = []

  for (const gm of geminiMatches) {
    const nameLower = gm.name.toLowerCase().trim()
    const nameWords = nameLower.split(/[\s-]+/)

    // Try exact match first, then partial
    let bird = BIRDS.find(b => b.name.toLowerCase() === nameLower)

    if (!bird) {
      bird = BIRDS.find(b => {
        const bWords = b.name.toLowerCase().split(/[\s-]+/)
        return nameWords.some(w => w.length >= 4 && bWords.includes(w))
      })
    }

    if (bird && !seen.has(bird.id)) {
      seen.add(bird.id)
      results.push({ bird, confidence: gm.confidence, reasoning: gm.reasoning })
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence)
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBirdRecon() {
  const [status, setStatus] = useState<ReconStatus>('idle')
  const [photo, setPhoto] = useState<string | null>(null)
  const [result, setResult] = useState<ReconResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyse = useCallback(async (base64Image: string) => {
    if (!API_KEY) {
      setError('Add VITE_GEMINI_API_KEY to your .env file to enable BirdRecon.')
      setStatus('error')
      return
    }

    try {
      setStatus('analysing')
      setError(null)

      const resized = await resizeImage(base64Image)
      setPhoto(resized)

      // Strip the data URL prefix to get raw base64
      const base64Data = resized.replace(/^data:image\/\w+;base64,/, '')

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data,
                },
              },
              { text: PROMPT },
            ],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `API error ${response.status}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const parsed = JSON.parse(text) as {
        description: string
        matches: { name: string; confidence: number; reasoning: string }[]
      }

      const matches = matchToCatalogue(parsed.matches ?? [])
      const description = parsed.description ?? 'No description returned.'

      setResult({ matches, rawDescription: description, timestamp: new Date() })
      setStatus('done')
    } catch (err) {
      console.error('[BirdRecon] Gemini error:', err)
      const msg = err instanceof Error ? err.message : 'Identification failed'
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key')) {
        setError('Invalid Gemini API key. Check VITE_GEMINI_API_KEY in your .env file.')
      } else if (msg.includes('RATE_LIMIT') || msg.includes('429')) {
        setError('Too many requests — you\'ve hit the free limit. Try again in a minute.')
      } else {
        setError('Identification failed. Check your connection and try again.')
      }
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setPhoto(null)
    setResult(null)
    setError(null)
  }, [])

  return { status, photo, result, error, analyse, reset, modelLoaded: !!API_KEY }
}
