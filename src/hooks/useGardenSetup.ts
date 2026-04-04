// useGardenSetup — persists the Attract screen garden setup to localStorage.
// Stores: region, garden features, favourite birds, birds to discourage.

import { useState, useEffect } from 'react'

export type GardenRegion =
  | 'scotland'
  | 'n-england'
  | 'midlands-wales'
  | 's-england'
  | 'n-ireland'

export type GardenFeature =
  | 'trees'
  | 'hedges'
  | 'water'
  | 'lawn'
  | 'berries'
  | 'feeders'

export interface GardenSetup {
  region: GardenRegion | null
  features: GardenFeature[]
  favourites: string[]    // bird common names Laura loves
  discourage: string[]    // bird common names she wants to deter
}

const DEFAULT_SETUP: GardenSetup = {
  region: null,
  features: [],
  favourites: [],
  discourage: [],
}

const KEY = 'garden-setup-v1'

function load(): GardenSetup {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SETUP
    return { ...DEFAULT_SETUP, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETUP
  }
}

export function useGardenSetup() {
  const [setup, setSetup] = useState<GardenSetup>(load)

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(setup))
  }, [setup])

  function update(patch: Partial<GardenSetup>) {
    setSetup(prev => ({ ...prev, ...patch }))
  }

  function toggleFeature(feature: GardenFeature) {
    setSetup(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }))
  }

  function toggleFavourite(name: string) {
    setSetup(prev => ({
      ...prev,
      favourites: prev.favourites.includes(name)
        ? prev.favourites.filter(n => n !== name)
        : [...prev.favourites, name],
    }))
  }

  function toggleDiscourage(name: string) {
    setSetup(prev => ({
      ...prev,
      discourage: prev.discourage.includes(name)
        ? prev.discourage.filter(n => n !== name)
        : [...prev.discourage, name],
    }))
  }

  const isConfigured = setup.region !== null

  return {
    setup,
    isConfigured,
    update,
    toggleFeature,
    toggleFavourite,
    toggleDiscourage,
  }
}
