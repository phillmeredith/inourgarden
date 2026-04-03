// useIdentifyFilter — filter logic for bird identification wizard
// Derives filterable traits from existing BirdSpecies data

import { useMemo, useState, useCallback } from 'react'
import { BIRDS } from '../data/birds'
import type { BirdSpecies } from '../data/birds'

// ─── Color extraction ───────────────────────────────────────────────────────

const COLOR_KEYWORDS = [
  'red', 'blue', 'green', 'yellow', 'orange', 'brown',
  'black', 'white', 'grey', 'pink', 'purple',
] as const

export type BirdColor = typeof COLOR_KEYWORDS[number]

const colorCache = new Map<string, BirdColor[]>()

function extractColors(bird: BirdSpecies): BirdColor[] {
  if (colorCache.has(bird.id)) return colorCache.get(bird.id)!
  const text = `${bird.identification.male} ${bird.identification.female}`.toLowerCase()
  const colors = COLOR_KEYWORDS.filter(c => text.includes(c))
  colorCache.set(bird.id, colors)
  return colors
}

// ─── Size category extraction ───────────────────────────────────────────────

export type SizeCategory = 'Tiny' | 'Small' | 'Medium' | 'Large'

function extractSize(bird: BirdSpecies): SizeCategory {
  const s = bird.size.toLowerCase()
  if (s.startsWith('tiny')) return 'Tiny'
  if (s.startsWith('small')) return 'Small'
  if (s.startsWith('large')) return 'Large'
  return 'Medium'
}

// ─── Filter state ───────────────────────────────────────────────────────────

export interface IdentifyFilters {
  size: SizeCategory | null
  colors: BirdColor[]
}

const INITIAL: IdentifyFilters = {
  size: null,
  colors: [],
}

export interface IdentifyResult {
  bird: BirdSpecies
  score: number
  maxScore: number
}

export function useIdentifyFilter() {
  const [filters, setFilters] = useState<IdentifyFilters>(INITIAL)

  const hasAnyFilter = filters.size !== null ||
    filters.colors.length > 0

  const setSize = useCallback((v: SizeCategory | null) =>
    setFilters(f => ({ ...f, size: f.size === v ? null : v })), [])

  const toggleColor = useCallback((c: BirdColor) =>
    setFilters(f => ({
      ...f,
      colors: f.colors.includes(c)
        ? f.colors.filter(x => x !== c)
        : [...f.colors, c],
    })), [])

  const reset = useCallback(() => setFilters(INITIAL), [])

  const results = useMemo<IdentifyResult[]>(() => {
    if (!hasAnyFilter) return []

    return BIRDS.map(bird => {
      let score = 0
      let maxScore = 0

      if (filters.size !== null) {
        maxScore++
        if (extractSize(bird) === filters.size) score++
      }

      if (filters.colors.length > 0) {
        const birdColors = extractColors(bird)
        maxScore += filters.colors.length
        for (const c of filters.colors) {
          if (birdColors.includes(c)) score++
        }
      }

      return { bird, score, maxScore }
    })
      .filter(r => r.score > 0)
      .sort((a, b) => {
        const pctA = a.score / a.maxScore
        const pctB = b.score / b.maxScore
        if (pctB !== pctA) return pctB - pctA
        return a.bird.name.localeCompare(b.bird.name)
      })
  }, [filters, hasAnyFilter])

  return {
    filters,
    hasAnyFilter,
    results,
    setSize,
    toggleColor,
    reset,
  }
}
