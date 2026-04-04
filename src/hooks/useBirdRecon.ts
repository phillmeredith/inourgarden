// useBirdRecon — bird identification via Groq Vision API (Llama 3.2)
// Free tier, works globally including UK, no billing required
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

const API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

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
      setError('Add VITE_GROQ_API_KEY to your .env file to enable BirdRecon.')
      setStatus('error')
      return
    }

    try {
      setStatus('analysing')
      setError(null)

      const resized = await resizeImage(base64Image)
      setPhoto(resized)

      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: resized },
              },
              {
                type: 'text',
                text: PROMPT,
              },
            ],
          }],
          temperature: 0.1,
          max_tokens: 512,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        const msg = err?.error?.message ?? `API error ${response.status}`
        console.error('[BirdRecon] Groq API error:', response.status, msg, err)
        throw new Error(msg)
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content ?? ''
      console.log('[BirdRecon] Groq raw response:', text)
      // Strip markdown code fences if present
      const cleanText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(cleanText) as {
        description: string
        matches: { name: string; confidence: number; reasoning: string }[]
      }

      const matches = matchToCatalogue(parsed.matches ?? [])
      const description = parsed.description ?? 'No description returned.'

      setResult({ matches, rawDescription: description, timestamp: new Date() })
      setStatus('done')
    } catch (err) {
      console.error('[BirdRecon] Groq error:', err)
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('401') || msg.includes('invalid_api_key') || msg.includes('Unauthorized')) {
        setError('Invalid Groq API key. Check VITE_GROQ_API_KEY in your .env file.')
      } else if (msg.includes('429') || msg.includes('rate_limit') || msg.includes('quota')) {
        setError('Groq is busy — wait a few seconds and try again.')
      } else {
        setError(`Identification failed: ${msg}`)
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
