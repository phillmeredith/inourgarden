// useWildSightings — CRUD operations for the wildSightings table
// For birds spotted outside the garden (out and about)

import { useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, todayString } from '../lib/db'
import type { WildSighting } from '../lib/db'

export function useWildSightings() {
  const sightings = useLiveQuery(
    () => db.wildSightings.toArray(),
    [],
    [] as WildSighting[],
  )

  const spottedBirdIds = useMemo(() => {
    const ids = new Set<string>()
    for (const s of sightings) ids.add(s.birdId)
    return ids
  }, [sightings])

  const hasSpotted = useCallback(
    (birdId: string): boolean => spottedBirdIds.has(birdId),
    [spottedBirdIds],
  )

  const sightingsForBird = useCallback(
    (birdId: string): WildSighting[] =>
      sightings
        .filter(s => s.birdId === birdId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [sightings],
  )

  async function addWildSighting(
    birdId: string,
    data?: Partial<Omit<WildSighting, 'id' | 'birdId' | 'createdAt'>>,
  ): Promise<number | undefined> {
    try {
      const record: WildSighting = {
        birdId,
        date: data?.date ?? todayString(),
        time: data?.time ?? null,
        notes: data?.notes ?? null,
        photo: data?.photo ?? null,
        count: data?.count ?? 1,
        lat: data?.lat ?? null,
        lng: data?.lng ?? null,
        locationName: data?.locationName ?? null,
        createdAt: new Date(),
      }
      const id = await db.wildSightings.add(record)
      return id as number
    } catch (err) {
      console.error('[useWildSightings] addWildSighting failed:', err)
      return undefined
    }
  }

  async function removeWildSighting(id: number): Promise<boolean> {
    try {
      await db.wildSightings.delete(id)
      return true
    } catch (err) {
      console.error('[useWildSightings] removeWildSighting failed:', err)
      return false
    }
  }

  return {
    sightings,
    spottedBirdIds,
    hasSpotted,
    sightingsForBird,
    addWildSighting,
    removeWildSighting,
  }
}
