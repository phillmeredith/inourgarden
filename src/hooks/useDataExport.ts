// useDataExport — import/export garden sightings as JSON
// Supports full replace or merge (skip duplicates by birdId+date+time)

import { useState, useCallback } from 'react'
import { db } from '../lib/db'
import type { GardenSighting } from '../lib/db'

/** Shape of the exported JSON file. Versioned for future compatibility. */
interface ExportPayload {
  version: 1
  exportedAt: string
  gardenSightings: GardenSighting[]
}

/**
 * Type guard: validates that an unknown parsed value matches ExportPayload shape.
 * Checks structural requirements without validating every field deeply.
 */
function isValidExportPayload(data: unknown): data is ExportPayload {
  if (data == null || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>

  if (obj.version !== 1) return false
  if (typeof obj.exportedAt !== 'string') return false
  if (!Array.isArray(obj.gardenSightings)) return false

  // Spot-check first record if present
  if (obj.gardenSightings.length > 0) {
    const first = obj.gardenSightings[0] as Record<string, unknown>
    if (typeof first.birdId !== 'string') return false
    if (typeof first.date !== 'string') return false
  }

  return true
}

export function useDataExport() {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Export all garden sightings as a JSON file download.
   */
  const exportData = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)
      const sightings = await db.gardenSightings.toArray()

      const payload: ExportPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        gardenSightings: sightings,
      }

      const json = JSON.stringify(payload, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `birdwatch-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(anchor)
      anchor.click()

      // Cleanup
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed'
      console.error('[useDataExport] exportData failed:', err)
      setError(message)
      return false
    }
  }, [])

  /**
   * Import sightings from a JSON file.
   * @param file — the File object from an <input type="file">
   * @param mode — 'merge' skips duplicates, 'replace' wipes existing data first
   */
  const importData = useCallback(
    async (
      file: File,
      mode: 'merge' | 'replace' = 'merge',
    ): Promise<{ imported: number; skipped: number } | null> => {
      try {
        setImporting(true)
        setError(null)

        const text = await file.text()

        let parsed: unknown
        try {
          parsed = JSON.parse(text)
        } catch {
          setError('Invalid JSON file. Could not parse the file contents.')
          return null
        }

        if (!isValidExportPayload(parsed)) {
          setError(
            'Invalid file format. Expected a Birdwatch export file (version 1).',
          )
          return null
        }

        const incoming = parsed.gardenSightings

        if (mode === 'replace') {
          // Wipe and replace inside a single transaction
          let importedCount = 0
          await db.transaction('rw', db.gardenSightings, async () => {
            await db.gardenSightings.clear()

            for (const record of incoming) {
              // Strip the id so Dexie auto-increments fresh ids
              const { id: _id, ...rest } = record
              await db.gardenSightings.add({
                ...rest,
                createdAt: new Date(rest.createdAt),
              })
              importedCount++
            }
          })

          return { imported: importedCount, skipped: 0 }
        }

        // Merge mode — skip records that already exist (same birdId + date + time)
        const existing = await db.gardenSightings.toArray()
        const existingKeys = new Set(
          existing.map(s => `${s.birdId}|${s.date}|${s.time ?? ''}`),
        )

        let imported = 0
        let skipped = 0

        await db.transaction('rw', db.gardenSightings, async () => {
          for (const record of incoming) {
            const key = `${record.birdId}|${record.date}|${record.time ?? ''}`

            if (existingKeys.has(key)) {
              skipped++
              continue
            }

            const { id: _id, ...rest } = record
            await db.gardenSightings.add({
              ...rest,
              createdAt: new Date(rest.createdAt),
            })
            imported++
            existingKeys.add(key) // prevent dupes within the import file itself
          }
        })

        return { imported, skipped }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Import failed'
        console.error('[useDataExport] importData failed:', err)
        setError(message)
        return null
      } finally {
        setImporting(false)
      }
    },
    [],
  )

  return {
    exportData,
    importData,
    importing,
    error,
  }
}
