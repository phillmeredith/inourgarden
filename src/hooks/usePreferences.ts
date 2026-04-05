// usePreferences — reads/writes the single AppPreferences row (id=1)
// Reactive via useLiveQuery; applies theme to the DOM via data-theme attribute

import { useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import type { AppPreferences } from '../lib/db'

const DEFAULTS: AppPreferences = {
  id: 1,
  theme: 'forest',
  reducedMotion: false,
  textSize: 'default',
}

const VALID_THEMES: AppPreferences['theme'][] = ['midnight', 'forest', 'meadow', 'dusk']

const THEME_NAV_COLOR: Record<AppPreferences['theme'], string> = {
  midnight: '#0D0D11',
  forest:   '#333626',
  meadow:   '#E8E4DA',
  dusk:     '#0E0914',
}

async function ensurePreferences(): Promise<void> {
  try {
    const existing = await db.preferences.get(1)
    if (!existing) await db.preferences.add(DEFAULTS)
  } catch (err) {
    console.error('[usePreferences] ensurePreferences failed:', err)
  }
}

export function usePreferences() {
  useEffect(() => { ensurePreferences() }, [])

  const preferences = useLiveQuery(() => db.preferences.get(1), [], DEFAULTS)
  const prefs: AppPreferences = { ...DEFAULTS, ...preferences }

  // Apply theme — sets data-theme on <html> which triggers CSS variable overrides
  // Also updates theme-color meta so the iOS status bar matches the nav
  useEffect(() => {
    const theme = VALID_THEMES.includes(prefs.theme) ? prefs.theme : 'midnight'
    const navColour = THEME_NAV_COLOR[theme]
    document.documentElement.setAttribute('data-theme', theme)
    // Set html background to solid nav colour so iOS safe-area/status-bar
    // shows the header colour rather than the page background colour
    document.documentElement.style.backgroundColor = navColour
    document.querySelectorAll('meta[name="theme-color"]').forEach(m =>
      m.setAttribute('content', navColour)
    )
  }, [prefs.theme])

  // Apply text size
  useEffect(() => {
    document.body.classList.remove('text-size-default', 'text-size-large')
    document.body.classList.add(`text-size-${prefs.textSize}`)
  }, [prefs.textSize])

  // Apply reduced motion
  useEffect(() => {
    if (prefs.reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true')
    } else {
      document.documentElement.removeAttribute('data-reduced-motion')
    }
  }, [prefs.reducedMotion])

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

  return { preferences: prefs, updatePreference }
}
