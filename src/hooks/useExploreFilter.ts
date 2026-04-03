// useExploreFilter — client-side filtering and sorting for the bird explorer
// Pure state hook — no DB dependency, derives from the static BIRDS catalogue

import { useState, useMemo, useDeferredValue, useCallback } from 'react'
import { BIRDS } from '../data/birds'
import type { BirdSpecies } from '../data/birds'

export type ConservationFilter = 'Red' | 'Amber' | 'Green' | null
export type SortBy = 'az' | 'family' | 'conservation'

interface ExploreFilterState {
  query: string
  activeCategory: string | null
  conservationStatus: ConservationFilter
  seasonality: string | null
  hasSoundOnly: boolean
  gardenOnly: boolean
  sortBy: SortBy
}

const INITIAL_STATE: ExploreFilterState = {
  query: '',
  activeCategory: null,
  conservationStatus: null,
  seasonality: null,
  hasSoundOnly: false,
  gardenOnly: false,
  sortBy: 'az',
}

const CONSERVATION_ORDER: Record<string, number> = { Red: 0, Amber: 1, Green: 2 }

export function useExploreFilter() {
  const [state, setState] = useState<ExploreFilterState>(INITIAL_STATE)

  // Defer the query value so keystroke rendering stays responsive
  const deferredQuery = useDeferredValue(state.query)

  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }))
  }, [])

  const setActiveCategory = useCallback((activeCategory: string | null) => {
    setState(prev => ({ ...prev, activeCategory }))
  }, [])

  const setConservationStatus = useCallback((conservationStatus: ConservationFilter) => {
    setState(prev => ({ ...prev, conservationStatus }))
  }, [])

  const setSeasonality = useCallback((seasonality: string | null) => {
    setState(prev => ({ ...prev, seasonality }))
  }, [])

  const setHasSoundOnly = useCallback((hasSoundOnly: boolean) => {
    setState(prev => ({ ...prev, hasSoundOnly }))
  }, [])

  const setGardenOnly = useCallback((gardenOnly: boolean) => {
    setState(prev => ({ ...prev, gardenOnly }))
  }, [])

  const setSortBy = useCallback((sortBy: SortBy) => {
    setState(prev => ({ ...prev, sortBy }))
  }, [])

  const reset = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  const filteredBirds = useMemo(() => {
    const q = deferredQuery.toLowerCase().trim()

    let result: BirdSpecies[] = BIRDS

    // Text search — match against name, scientific name, and family
    if (q) {
      result = result.filter(
        b =>
          b.name.toLowerCase().includes(q) ||
          b.scientificName.toLowerCase().includes(q) ||
          b.family.toLowerCase().includes(q),
      )
    }

    // Category filter
    if (state.activeCategory) {
      result = result.filter(b => b.category === state.activeCategory)
    }

    // Conservation status
    if (state.conservationStatus) {
      result = result.filter(b => b.conservationStatus === state.conservationStatus)
    }

    // Seasonality
    if (state.seasonality) {
      result = result.filter(b => b.seasonality === state.seasonality)
    }

    // Sound availability
    if (state.hasSoundOnly) {
      result = result.filter(b => b.soundUrl != null && b.soundUrl !== '')
    }

    // Garden birds only
    if (state.gardenOnly) {
      result = result.filter(b => b.gardenBird)
    }

    // Sort
    switch (state.sortBy) {
      case 'az':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'family':
        result = [...result].sort(
          (a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name),
        )
        break
      case 'conservation':
        result = [...result].sort(
          (a, b) =>
            (CONSERVATION_ORDER[a.conservationStatus] ?? 99) -
            (CONSERVATION_ORDER[b.conservationStatus] ?? 99) ||
            a.name.localeCompare(b.name),
        )
        break
    }

    return result
  }, [
    deferredQuery,
    state.activeCategory,
    state.conservationStatus,
    state.seasonality,
    state.hasSoundOnly,
    state.gardenOnly,
    state.sortBy,
  ])

  return {
    // Current filter state
    query: state.query,
    activeCategory: state.activeCategory,
    conservationStatus: state.conservationStatus,
    seasonality: state.seasonality,
    hasSoundOnly: state.hasSoundOnly,
    gardenOnly: state.gardenOnly,
    sortBy: state.sortBy,

    // Derived
    filteredBirds,

    // Setters
    setQuery,
    setActiveCategory,
    setConservationStatus,
    setSeasonality,
    setHasSoundOnly,
    setGardenOnly,
    setSortBy,
    reset,
  }
}
