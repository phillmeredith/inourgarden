// usePreferences — reads/writes the single AppPreferences row (id=1)
// Reactive via useLiveQuery; applies theme and text size to the DOM

import { useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import type { AppPreferences } from '../lib/db'

const DEFAULTS: AppPreferences = {
  id: 1,
  theme: 'dark',
  accentColour: 'blue',
  reducedMotion: false,
  textSize: 'default',
}

/**
 * Ensure the preferences row exists. Called once on hook mount.
 * If no row with id=1 exists, inserts the defaults.
 */
async function ensurePreferences(): Promise<void> {
  try {
    const existing = await db.preferences.get(1)
    if (!existing) {
      await db.preferences.add(DEFAULTS)
    }
  } catch (err) {
    console.error('[usePreferences] ensurePreferences failed:', err)
  }
}

export function usePreferences() {
  // Ensure the row exists on first mount
  useEffect(() => {
    ensurePreferences()
  }, [])

  const preferences = useLiveQuery(
    () => db.preferences.get(1),
    [],
    DEFAULTS,
  )

  // Merge with defaults so callers always get a complete object
  const prefs: AppPreferences = { ...DEFAULTS, ...preferences }

  // Apply theme to document root whenever it changes
  useEffect(() => {
    const root = document.documentElement

    if (prefs.theme === 'system') {
      // Respect OS preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', prefs.theme)
    }
  }, [prefs.theme])

  // Apply text size class to body whenever it changes
  useEffect(() => {
    const body = document.body

    // Remove any previous text size class
    body.classList.remove('text-size-default', 'text-size-large')

    // Apply the current one
    body.classList.add(`text-size-${prefs.textSize}`)
  }, [prefs.textSize])

  // Apply reduced motion preference
  useEffect(() => {
    const root = document.documentElement
    if (prefs.reducedMotion) {
      root.setAttribute('data-reduced-motion', 'true')
    } else {
      root.removeAttribute('data-reduced-motion')
    }
  }, [prefs.reducedMotion])

  /** Update a single preference key. */
  const updatePreference = useCallback(
    async <K extends keyof Omit<AppPreferences, 'id'>>(
      key: K,
      value: AppPreferences[K],
    ): Promise<boolean> => {
      try {
        await db.preferences.update(1, { [key]: value })
        return true
      } catch (err) {
        console.error('[usePreferences] updatePreference failed:', err)
        return false
      }
    },
    [],
  )

  return {
    preferences: prefs,
    updatePreference,
  }
}
