// useIdentifyFilter — filter logic for the bird identification wizard
// Question order mirrors the expert birder mental model (Merlin / Cornell research):
//   Location → Size → Behaviour → Field marks → Colour
// Each step halves the candidate pool. Field marks are most discriminating.

import { useMemo, useState, useCallback } from 'react'
import { BIRDS } from '../data/birds'
import type { BirdSpecies } from '../data/birds'

// ─── Location / habitat ─────────────────────────────────────────────────────

export type LocationFilter =
  | 'garden' | 'woodland' | 'wetland' | 'coastal'
  | 'farmland' | 'upland' | 'urban'

const LOCATION_TO_CATEGORY: Record<LocationFilter, string> = {
  garden: 'Garden', woodland: 'Woodland', wetland: 'Wetland',
  coastal: 'Coastal', farmland: 'Farmland', upland: 'Upland', urban: 'Urban',
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

// ─── Size — 5 levels with reference birds ───────────────────────────────────
// Research (Merlin, Audubon): abstract labels ("small/large") are less useful
// than named reference birds that observers already know.

export type SizeCategory = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Very Large'

export const SIZE_CONFIG: Record<SizeCategory, { ref: string; cm: string; dotPx: number }> = {
  'Tiny':       { ref: 'Wren-sized',      cm: '~9cm',  dotPx: 8  },
  'Small':      { ref: 'Robin-sized',     cm: '~14cm', dotPx: 13 },
  'Medium':     { ref: 'Blackbird-sized', cm: '~25cm', dotPx: 19 },
  'Large':      { ref: 'Pigeon-sized',    cm: '~40cm', dotPx: 25 },
  'Very Large': { ref: 'Heron-sized',     cm: '60cm+', dotPx: 32 },
}

export const ALL_SIZES: SizeCategory[] = ['Tiny', 'Small', 'Medium', 'Large', 'Very Large']

function extractSize(bird: BirdSpecies): SizeCategory {
  const s = bird.size.toLowerCase()
  // Check for explicit "very large" label first
  if (s.startsWith('very')) return 'Very Large'
  if (s.startsWith('tiny')) return 'Tiny'
  if (s.startsWith('small')) return 'Small'
  if (s.startsWith('large')) return 'Large'
  // Fallback: detect very large birds by cm value (>55cm = heron, crane, goose territory)
  const cm = s.match(/\((\d+)\s*(?:–|-|to)?\d*\s*cm\)/)
  if (cm && parseInt(cm[1]) > 55) return 'Very Large'
  return 'Medium'
}

// ─── Behaviour ──────────────────────────────────────────────────────────────
// Merlin's #5 question. Highly discriminating — a bird on a feeder vs on water
// eliminates 90% of candidates before any plumage is checked.

export type Behavior = 'feeder' | 'ground' | 'trees' | 'water' | 'overhead' | 'bark'

export const BEHAVIOR_LABELS: Record<Behavior, string> = {
  feeder:   'On a feeder',
  ground:   'On the ground',
  trees:    'In trees or bushes',
  water:    'On or near water',
  overhead: 'Flying overhead',
  bark:     'Climbing bark or walls',
}

export const ALL_BEHAVIORS: Behavior[] = [
  'feeder', 'ground', 'trees', 'water', 'overhead', 'bark',
]

const behaviorCache = new Map<string, Behavior[]>()

function extractBehaviors(bird: BirdSpecies): Behavior[] {
  if (behaviorCache.has(bird.id)) return behaviorCache.get(bird.id)!
  const text = `${bird.behaviour} ${bird.diet} ${bird.habitat}`.toLowerCase()
  const behaviors: Behavior[] = []

  // Feeder birds: visits garden feeders or eats seeds/nuts in garden context
  if (/feeder|bird table|peanut|sunflower|fat ball|niger|seed.*garden|garden.*seed/.test(text)
    || (bird.gardenBird && /seed|nut|berry|berry/.test(text))) {
    behaviors.push('feeder')
  }
  // Ground foragers
  if (/ground|lawn|grass|soil|leaf litter|forages.*ground|ground.*forag|walks|hops along/.test(text)) {
    behaviors.push('ground')
  }
  // Tree/bush dwellers
  if (/\btree\b|branch|canopy|foliage|shrub|bush|hedgerow|woodland|understorey/.test(text)) {
    behaviors.push('trees')
  }
  // Water birds
  if (/water|swim|wad|dive|pond|lake|river|marsh|estuar|shore|tidal|coast/.test(text)) {
    behaviors.push('water')
  }
  // Aerial feeders
  if (/aerial|soar|glide|hawk insect|on the wing|in flight catch|swift|swallow|martin/.test(text)
    || /\bsoars\b|\bglides\b|\bswoops\b/.test(text)) {
    behaviors.push('overhead')
  }
  // Bark/wall climbers
  if (/bark|trunk|creep|cling|scramble.*up|descend.*headfirst|wall.*cling/.test(text)) {
    behaviors.push('bark')
  }

  behaviorCache.set(bird.id, behaviors)
  return behaviors
}

// ─── Field marks ────────────────────────────────────────────────────────────
// The single most discriminating filter. Expert birders identify by structural
// features and specific marks first — colour is secondary (Cornell research).
// These 8 marks cover the most memorable, commonly-noticed UK field marks.

export type FieldMark =
  | 'red-breast'
  | 'black-cap'
  | 'streaky'
  | 'spotted-chest'
  | 'yellow'
  | 'long-tail'
  | 'crest'
  | 'wing-bars'

export const FIELD_MARK_LABELS: Record<FieldMark, string> = {
  'red-breast':    'Red or orange breast',
  'black-cap':     'Black cap or head',
  'streaky':       'Streaky or streaked',
  'spotted-chest': 'Spotted chest',
  'yellow':        'Yellow on it',
  'long-tail':     'Very long tail',
  'crest':         'Crest on head',
  'wing-bars':     'Wing bars',
}

/** Small colour indicator shown on each field mark chip */
export const FIELD_MARK_INDICATOR: Record<FieldMark, string> = {
  'red-breast':    '#E05A2B',
  'black-cap':     '#1a1a1a',
  'streaky':       '#8B7355',
  'spotted-chest': '#6B7280',
  'yellow':        '#EAB308',
  'long-tail':     '#4B5563',
  'crest':         '#7C3AED',
  'wing-bars':     '#374151',
}

export const ALL_FIELD_MARKS: FieldMark[] = [
  'red-breast', 'black-cap', 'streaky', 'spotted-chest',
  'yellow', 'long-tail', 'crest', 'wing-bars',
]

const FIELD_MARK_PATTERNS: Record<FieldMark, RegExp> = {
  'red-breast':    /\b(red|orange|rufous|chestnut)[\s-]?(breast|chest|belly|underpart)/i,
  'black-cap':     /\bblack[\s-]?(cap|crown|head|hood|face)\b/i,
  'streaky':       /\bstreak(ed|y|ing|s)?\b/i,
  'spotted-chest': /\bspot(ted|s)?\s*(breast|chest|belly|below|underpart)/i,
  'yellow':        /\byellow\b/i,
  'long-tail':     /\blong[\s-]?(and\s+)?(pointed\s+)?tail\b/i,
  'crest':         /\bcrest(ed)?\b/i,
  'wing-bars':     /\bwing[\s-]?bar(s)?\b/i,
}

const fieldMarkCache = new Map<string, FieldMark[]>()

function extractFieldMarks(bird: BirdSpecies): FieldMark[] {
  if (fieldMarkCache.has(bird.id)) return fieldMarkCache.get(bird.id)!
  const text = [
    bird.identification.male,
    bird.identification.female,
    bird.identification.juvenile ?? '',
  ].join(' ')
  const marks = ALL_FIELD_MARKS.filter(m => FIELD_MARK_PATTERNS[m].test(text))
  fieldMarkCache.set(bird.id, marks)
  return marks
}

// ─── Colour ─────────────────────────────────────────────────────────────────
// Positioned last — colour is cognitively accessible for beginners but least
// discriminating. Most UK birds share common colours. Use as confirmation, not
// primary filter. (Cornell / Audubon research)

const COLOR_KEYWORDS = [
  'red', 'blue', 'green', 'yellow', 'orange', 'brown',
  'black', 'white', 'grey', 'pink', 'purple',
] as const

export type BirdColor = typeof COLOR_KEYWORDS[number]

export const ALL_COLORS: BirdColor[] = [...COLOR_KEYWORDS]

export const COLOR_SWATCH: Record<BirdColor, string> = {
  red: '#DC2626', blue: '#2563EB', green: '#16A34A', yellow: '#CA8A04',
  orange: '#EA580C', brown: '#92400E', black: '#111827', white: '#E5E7EB',
  grey: '#6B7280', pink: '#DB2777', purple: '#7C3AED',
}

const colorCache = new Map<string, BirdColor[]>()

function extractColors(bird: BirdSpecies): BirdColor[] {
  if (colorCache.has(bird.id)) return colorCache.get(bird.id)!
  const text = `${bird.identification.male} ${bird.identification.female}`.toLowerCase()
  const colors = COLOR_KEYWORDS.filter(c => text.includes(c))
  colorCache.set(bird.id, colors)
  return colors
}

// ─── Filter state ────────────────────────────────────────────────────────────

export interface IdentifyFilters {
  location: LocationFilter | null
  size: SizeCategory | null
  behaviors: Behavior[]
  fieldMarks: FieldMark[]
  colors: BirdColor[]
}

const INITIAL: IdentifyFilters = {
  location: null,
  size: null,
  behaviors: [],
  fieldMarks: [],
  colors: [],
}

export interface IdentifyResult {
  bird: BirdSpecies
  score: number
  maxScore: number
}

export function useIdentifyFilter() {
  const [filters, setFilters] = useState<IdentifyFilters>(INITIAL)

  const hasAnyFilter =
    filters.location !== null ||
    filters.size !== null ||
    filters.behaviors.length > 0 ||
    filters.fieldMarks.length > 0 ||
    filters.colors.length > 0

  const setLocation = useCallback((v: LocationFilter | null) =>
    setFilters(f => ({ ...f, location: f.location === v ? null : v })), [])

  const setSize = useCallback((v: SizeCategory | null) =>
    setFilters(f => ({ ...f, size: f.size === v ? null : v })), [])

  const toggleBehavior = useCallback((b: Behavior) =>
    setFilters(f => ({
      ...f,
      behaviors: f.behaviors.includes(b)
        ? f.behaviors.filter(x => x !== b)
        : [...f.behaviors, b],
    })), [])

  const toggleFieldMark = useCallback((m: FieldMark) =>
    setFilters(f => ({
      ...f,
      fieldMarks: f.fieldMarks.includes(m)
        ? f.fieldMarks.filter(x => x !== m)
        : [...f.fieldMarks, m],
    })), [])

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

      // Location (weight: 2) — garden uses gardenLikelihood for bonus
      if (filters.location !== null) {
        if (filters.location === 'garden') {
          maxScore += 2
          if (bird.gardenBird) score += bird.gardenLikelihood >= 3 ? 2 : 1
        } else {
          maxScore += 2
          if (bird.category === LOCATION_TO_CATEGORY[filters.location]) score += 2
        }
      }

      // Size (weight: 2) — exact match only; size is highly specific
      if (filters.size !== null) {
        maxScore += 2
        if (extractSize(bird) === filters.size) score += 2
      }

      // Behaviour (weight: 2 each) — very discriminating
      if (filters.behaviors.length > 0) {
        const birdBehaviors = extractBehaviors(bird)
        for (const b of filters.behaviors) {
          maxScore += 2
          if (birdBehaviors.includes(b)) score += 2
        }
      }

      // Field marks (weight: 3 each) — most discriminating, highest weight
      if (filters.fieldMarks.length > 0) {
        const birdMarks = extractFieldMarks(bird)
        for (const m of filters.fieldMarks) {
          maxScore += 3
          if (birdMarks.includes(m)) score += 3
        }
      }

      // Colour (weight: 1 each) — least discriminating, confirmation only
      if (filters.colors.length > 0) {
        const birdColors = extractColors(bird)
        for (const c of filters.colors) {
          maxScore += 1
          if (birdColors.includes(c)) score += 1
        }
      }

      return { bird, score, maxScore }
    })
      .filter(r => r.score > 0)
      .sort((a, b) => {
        const pctA = a.score / a.maxScore
        const pctB = b.score / b.maxScore
        if (Math.abs(pctB - pctA) > 0.001) return pctB - pctA
        // Tiebreak: garden likelihood (more common garden birds first)
        if (b.bird.gardenLikelihood !== a.bird.gardenLikelihood) {
          return b.bird.gardenLikelihood - a.bird.gardenLikelihood
        }
        return a.bird.name.localeCompare(b.bird.name)
      })
  }, [filters, hasAnyFilter])

  return {
    filters,
    hasAnyFilter,
    results,
    setLocation,
    setSize,
    toggleBehavior,
    toggleFieldMark,
    toggleColor,
    reset,
  }
}
