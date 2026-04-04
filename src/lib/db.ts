// db.ts — Laura's Birdwatch Database Schema
// Dexie.js v4 (IndexedDB), schema version 1
// Never delete or rename columns — add new ones and increment version

import Dexie, { type Table } from 'dexie'

// ─── Entity types ──────────────────────────────────────────────────────────────

export interface GardenSighting {
  id?: number
  birdId: string
  date: string          // YYYY-MM-DD
  time: string | null
  notes: string | null
  photo: string | null  // base64 or blob URL
  count: number
  weather: string | null
  createdAt: Date
}

export interface WildSighting {
  id?: number
  birdId: string
  date: string          // YYYY-MM-DD
  time: string | null
  notes: string | null
  photo: string | null
  count: number
  lat: number | null     // GPS latitude
  lng: number | null     // GPS longitude
  locationName: string | null // e.g. "Kielder Forest", "Farne Islands"
  createdAt: Date
}

export type AppTheme = 'midnight' | 'forest' | 'meadow' | 'dusk'

export interface AppPreferences {
  id?: number
  theme: AppTheme
  reducedMotion: boolean
  textSize: 'default' | 'large'
}

// ─── Database class ────────────────────────────────────────────────────────────

class BirdwatchDB extends Dexie {
  gardenSightings!: Table<GardenSighting>
  wildSightings!: Table<WildSighting>
  preferences!: Table<AppPreferences>

  constructor() {
    super('laura-birdwatch')

    this.version(1).stores({
      gardenSightings: '++id, birdId, date',
      preferences: '++id',
    })

    this.version(2).stores({
      gardenSightings: '++id, birdId, date',
      wildSightings: '++id, birdId, date',
      preferences: '++id',
    })

    this.version(3).stores({
      gardenSightings: '++id, birdId, date',
      wildSightings: '++id, birdId, date',
      preferences: '++id',
    }).upgrade(tx =>
      tx.table('preferences').toCollection().modify(pref => {
        const valid = ['midnight', 'forest', 'meadow', 'dusk']
        if (!valid.includes(pref.theme)) pref.theme = 'midnight'
        delete pref.accentColour
      })
    )
  }
}

export const db = new BirdwatchDB()

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD in local time. */
export function todayString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
