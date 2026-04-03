// SightingDetailSheet — bottom sheet showing all sightings for a specific bird
// Header: bird name + total count. List of individual sightings with edit/delete.
// "View species info" link available for navigating to the full bird detail.

import { useState } from 'react'
import {
  Calendar, Clock, Hash, FileText, Cloud, Camera,
  Trash2, Pencil, ExternalLink,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomSheet } from '../ui/BottomSheet'
import { cn } from '../../lib/utils'
import type { BirdSpecies } from '../../data/birds'
import type { GardenSighting } from '../../lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SightingDetailSheetProps {
  open: boolean
  onClose: () => void
  bird: BirdSpecies | null
  sightings: GardenSighting[]
  onDelete: (sightingId: number) => void
  onViewSpecies?: (birdId: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTime(timeStr: string | null): string | null {
  if (!timeStr) return null
  // Input is HH:MM — return as-is, it's already human-readable
  return timeStr
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SightingDetailSheet({
  open,
  onClose,
  bird,
  sightings,
  onDelete,
  onViewSpecies,
}: SightingDetailSheetProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  if (!bird) return null

  const sortedSightings = [...sightings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  const totalCount = sightings.reduce((sum, s) => sum + s.count, 0)
  const firstSeen = sortedSightings.length > 0
    ? sortedSightings[sortedSightings.length - 1].date
    : null
  const lastSeen = sortedSightings.length > 0
    ? sortedSightings[0].date
    : null

  function handleDelete(id: number) {
    if (confirmDeleteId === id) {
      onDelete(id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={bird.name} maxHeight="85vh">
      <div className="px-6 py-4 flex flex-col gap-5">
        {/* Bird header row */}
        <div className="flex items-center gap-4">
          {/* Conservation status badge */}
          <div
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.5px]"
            style={{
              background:
                bird.conservationStatus === 'Red'
                  ? 'var(--red-sub)'
                  : bird.conservationStatus === 'Amber'
                    ? 'var(--amber-sub)'
                    : 'var(--green-sub)',
              color:
                bird.conservationStatus === 'Red'
                  ? 'var(--red-t)'
                  : bird.conservationStatus === 'Amber'
                    ? 'var(--amber-t)'
                    : 'var(--green-t)',
              border: `1px solid ${
                bird.conservationStatus === 'Red'
                  ? 'var(--red)'
                  : bird.conservationStatus === 'Amber'
                    ? 'var(--amber)'
                    : 'var(--green)'
              }`,
            }}
          >
            {bird.conservationStatus}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[12px] italic text-[var(--t3)] truncate">
              {bird.scientificName}
            </p>
          </div>

          {onViewSpecies && (
            <button
              onClick={() => onViewSpecies(bird.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold',
                'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]',
                'transition-colors hover:bg-[var(--blue)] hover:text-white',
              )}
            >
              <ExternalLink size={12} strokeWidth={2} />
              Species info
            </button>
          )}
        </div>

        {/* Summary stats row */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Total seen" value={String(totalCount)} />
          <SummaryCard
            label="First seen"
            value={firstSeen ? formatDate(firstSeen) : '--'}
          />
          <SummaryCard
            label="Last seen"
            value={lastSeen ? formatDate(lastSeen) : '--'}
          />
        </div>

        {/* Sightings list */}
        <div className="flex flex-col gap-1">
          <h3 className="text-[11px] font-bold uppercase tracking-[1px] text-[var(--t3)] mb-2">
            All sightings ({sightings.length})
          </h3>

          {sortedSightings.length === 0 ? (
            <p className="text-[13px] text-[var(--t3)] py-6 text-center">
              No sightings recorded
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedSightings.map((sighting) => (
                <motion.div
                  key={sighting.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  className={cn(
                    'rounded-xl border border-[var(--border-s)] bg-[var(--card)] p-3.5',
                    'flex flex-col gap-2',
                  )}
                >
                  {/* Top row: date, time, count */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--t1)]">
                      <Calendar size={12} strokeWidth={2} className="text-[var(--t3)]" />
                      {formatDate(sighting.date)}
                    </span>
                    {sighting.time && (
                      <span className="flex items-center gap-1.5 text-[12px] text-[var(--t2)]">
                        <Clock size={11} strokeWidth={2} className="text-[var(--t4)]" />
                        {formatTime(sighting.time)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-[var(--t2)]">
                      <Hash size={11} strokeWidth={2} className="text-[var(--t4)]" />
                      {sighting.count}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <AnimatePresence>
                        {confirmDeleteId === sighting.id && (
                          <motion.span
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            className="text-[11px] text-[var(--red-t)] font-medium mr-1"
                          >
                            Tap again
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <button
                        onClick={() => handleDelete(sighting.id!)}
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                          confirmDeleteId === sighting.id
                            ? 'bg-[var(--red-sub)] text-[var(--red-t)]'
                            : 'bg-[var(--elev)] text-[var(--t4)] hover:text-[var(--red-t)]',
                        )}
                        aria-label="Delete sighting"
                      >
                        <Trash2 size={12} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {sighting.notes && (
                    <div className="flex items-start gap-1.5">
                      <FileText size={11} strokeWidth={2} className="text-[var(--t4)] mt-0.5 shrink-0" />
                      <p className="text-[12px] text-[var(--t2)] leading-relaxed">
                        {sighting.notes}
                      </p>
                    </div>
                  )}

                  {/* Weather */}
                  {sighting.weather && (
                    <div className="flex items-center gap-1.5">
                      <Cloud size={11} strokeWidth={2} className="text-[var(--t4)] shrink-0" />
                      <span className="text-[11px] text-[var(--t3)]">
                        {sighting.weather}
                      </span>
                    </div>
                  )}

                  {/* Photo thumbnail */}
                  {sighting.photo && (
                    <div className="flex items-center gap-1.5">
                      <Camera size={11} strokeWidth={2} className="text-[var(--t4)] shrink-0" />
                      <img
                        src={sighting.photo}
                        alt="Sighting photo"
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl bg-[var(--elev)] border border-[var(--border-s)]">
      <span className="text-[15px] font-bold text-[var(--t1)] tabular-nums">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[var(--t3)]">
        {label}
      </span>
    </div>
  )
}
