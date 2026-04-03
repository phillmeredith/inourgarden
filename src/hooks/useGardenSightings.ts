// useGardenSightings — CRUD operations for the gardenSightings table
// Reactive reads via useLiveQuery; all mutations wrapped in try/catch

import { useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, todayString } from '../lib/db'
import type { GardenSighting } from '../lib/db'

export function useGardenSightings() {
  const sightings = useLiveQuery(
    () => db.gardenSightings.toArray(),
    [],
    [] as GardenSighting[],
  )

  /** Set of all unique birdIds the user has ever logged. */
  const seenBirdIds = useMemo(() => {
    const ids = new Set<string>()
    for (const s of sightings) {
      ids.add(s.birdId)
    }
    return ids
  }, [sightings])

  /** Check whether a bird has been seen at least once. */
  const hasSeen = useCallback(
    (birdId: string): boolean => seenBirdIds.has(birdId),
    [seenBirdIds],
  )

  /** Return all sightings for a specific bird, most recent first. */
  const sightingsForBird = useCallback(
    (birdId: string): GardenSighting[] =>
      sightings
        .filter(s => s.birdId === birdId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [sightings],
  )

  /** Add a new sighting record. */
  async function addSighting(
    birdId: string,
    data?: Partial<Omit<GardenSighting, 'id' | 'birdId' | 'createdAt'>>,
  ): Promise<number | undefined> {
    try {
      const record: GardenSighting = {
        birdId,
        date: data?.date ?? todayString(),
        time: data?.time ?? null,
        notes: data?.notes ?? null,
        photo: data?.photo ?? null,
        count: data?.count ?? 1,
        weather: data?.weather ?? null,
        createdAt: new Date(),
      }
      const id = await db.gardenSightings.add(record)
      return id as number
    } catch (err) {
      console.error('[useGardenSightings] addSighting failed:', err)
      return undefined
    }
  }

  /** Delete a sighting by id. */
  async function removeSighting(id: number): Promise<boolean> {
    try {
      await db.gardenSightings.delete(id)
      return true
    } catch (err) {
      console.error('[useGardenSightings] removeSighting failed:', err)
      return false
    }
  }

  /** Partial update of an existing sighting. */
  async function updateSighting(
    id: number,
    updates: Partial<Omit<GardenSighting, 'id' | 'createdAt'>>,
  ): Promise<boolean> {
    try {
      const count = await db.gardenSightings.update(id, updates)
      return count > 0
    } catch (err) {
      console.error('[useGardenSightings] updateSighting failed:', err)
      return false
    }
  }

  return {
    sightings,
    seenBirdIds,
    hasSeen,
    sightingsForBird,
    addSighting,
    removeSighting,
    updateSighting,
  }
}
