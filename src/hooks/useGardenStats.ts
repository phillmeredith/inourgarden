// useGardenStats — derived statistics from garden sightings
// Pure computation hook — reads from useGardenSightings, no direct DB access

import { useMemo } from 'react'
import { useGardenSightings } from './useGardenSightings'
import { getBirdById } from '../data/birds'
import type { BirdSpecies } from '../data/birds'
import type { GardenSighting } from '../lib/db'

export interface SightingWithBird extends GardenSighting {
  bird: BirdSpecies | null
}

export interface ConservationBreakdown {
  red: number
  amber: number
  green: number
}

export function useGardenStats() {
  const { sightings, seenBirdIds } = useGardenSightings()

  /** Number of unique species seen. */
  const totalSpecies = seenBirdIds.size

  /** Total count of all sighting records. */
  const totalSightings = sightings.length

  /** Sightings logged in the current calendar month. */
  const thisMonthCount = useMemo(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = now.getMonth() // 0-indexed
    return sightings.filter(s => {
      const d = new Date(s.date)
      return d.getFullYear() === yyyy && d.getMonth() === mm
    }).length
  }, [sightings])

  /**
   * Consecutive days with at least one sighting, counting backwards from today.
   * If today has no sightings, the streak is 0.
   */
  const streak = useMemo(() => {
    if (sightings.length === 0) return 0

    // Build a Set of all unique date strings
    const dateSet = new Set<string>()
    for (const s of sightings) {
      dateSet.add(s.date)
    }

    let count = 0
    const cursor = new Date()

    // Walk backwards day by day from today
    while (true) {
      const yyyy = cursor.getFullYear()
      const mm = String(cursor.getMonth() + 1).padStart(2, '0')
      const dd = String(cursor.getDate()).padStart(2, '0')
      const dateStr = `${yyyy}-${mm}-${dd}`

      if (!dateSet.has(dateStr)) break

      count++
      cursor.setDate(cursor.getDate() - 1)
    }

    return count
  }, [sightings])

  /** Sightings per month (YYYY-MM key), for chart rendering. */
  const monthlyCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of sightings) {
      // date is YYYY-MM-DD, extract YYYY-MM
      const key = s.date.slice(0, 7)
      counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
  }, [sightings])

  /** Species seen broken down by conservation status. */
  const conservationBreakdown = useMemo<ConservationBreakdown>(() => {
    const result: ConservationBreakdown = { red: 0, amber: 0, green: 0 }

    for (const birdId of seenBirdIds) {
      const bird = getBirdById(birdId)
      if (!bird) continue

      switch (bird.conservationStatus) {
        case 'Red':
          result.red++
          break
        case 'Amber':
          result.amber++
          break
        case 'Green':
          result.green++
          break
      }
    }

    return result
  }, [seenBirdIds])

  /** Last 10 sightings with bird data attached, most recent first. */
  const recentSightings = useMemo<SightingWithBird[]>(() => {
    const sorted = [...sightings].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )
    return sorted.slice(0, 10).map(s => ({
      ...s,
      bird: getBirdById(s.birdId) ?? null,
    }))
  }, [sightings])

  return {
    totalSpecies,
    totalSightings,
    thisMonthCount,
    streak,
    monthlyCounts,
    conservationBreakdown,
    recentSightings,
  }
}
