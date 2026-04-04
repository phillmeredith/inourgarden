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

// ─── Location / habitat filter ──────────────────────────────────────────────

export type LocationFilter = 'garden' | 'woodland' | 'wetland' | 'coastal' | 'farmland' | 'upland' | 'urban'

/** Map our LocationFilter values to the HabitatCategory strings used on BirdSpecies */
const LOCATION_TO_CATEGORY: Record<LocationFilter, string> = {
  garden:   'Garden',
  woodland: 'Woodland',
  wetland:  'Wetland',
  coastal:  'Coastal',
  farmland: 'Farmland',
  upland:   'Upland',
  urban:    'Urban',
}

export const LOCATION_LABELS: Record<LocationFilter, string> = {
  garden:   'My garden',
  woodland: 'Woodland',
  wetland:  'Wetland / lake',
  coastal:  'Coast / sea',
  farmland: 'Farmland',
  upland:   'Upland / moor',
  urban:    'Town / park',
}

export const ALL_LOCATIONS: LocationFilter[] = [
  'garden', 'woodland', 'wetland', 'coastal', 'farmland', 'upland', 'urban',
]

// ─── Filter state ───────────────────────────────────────────────────────────

export interface IdentifyFilters {
  size: SizeCategory | null
  colors: BirdColor[]
  location: LocationFilter | null
}

const INITIAL: IdentifyFilters = {
  size: null,
  colors: [],
  location: null,
}

export interface IdentifyResult {
  bird: BirdSpecies
  score: number
  maxScore: number
}

export function useIdentifyFilter() {
  const [filters, setFilters] = useState<IdentifyFilters>(INITIAL)

  const hasAnyFilter = filters.size !== null ||
    filters.colors.length > 0 ||
    filters.location !== null

  const setSize = useCallback((v: SizeCategory | null) =>
    setFilters(f => ({ ...f, size: f.size === v ? null : v })), [])

  const toggleColor = useCallback((c: BirdColor) =>
    setFilters(f => ({
      ...f,
      colors: f.colors.includes(c)
        ? f.colors.filter(x => x !== c)
        : [...f.colors, c],
    })), [])

  const setLocation = useCallback((v: LocationFilter | null) =>
    setFilters(f => ({ ...f, location: f.location === v ? null : v })), [])

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

      if (filters.location !== null) {
        if (filters.location === 'garden') {
          // Garden: weighted by gardenLikelihood (1-5) — non-garden birds score 0
          // Use 2 points max so location carries more weight than a single colour
          maxScore += 2
          if (bird.gardenBird) {
            score += bird.gardenLikelihood >= 3 ? 2 : 1
          }
        } else {
          const category = LOCATION_TO_CATEGORY[filters.location]
          maxScore++
          if (bird.category === category) score++
        }
      }

      return { bird, score, maxScore }
    })
      .filter(r => r.score > 0)
      .sort((a, b) => {
        const pctA = a.score / a.maxScore
        const pctB = b.score / b.maxScore
        if (pctB !== pctA) return pctB - pctA
        // Secondary sort: for garden filter, boost by likelihood
        if (filters.location === 'garden') {
          return b.bird.gardenLikelihood - a.bird.gardenLikelihood
        }
        return a.bird.name.localeCompare(b.bird.name)
      })
  }, [filters, hasAnyFilter])

  return {
    filters,
    hasAnyFilter,
    results,
    setSize,
    toggleColor,
    setLocation,
    reset,
  }
}
