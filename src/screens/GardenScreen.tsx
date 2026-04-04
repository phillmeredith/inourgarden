// GardenScreen — "In Our Garden" — Laura's personal sighting collection
// PageHeader with title, below-slot search + sort pills
// GardenStats summary cards, grid of seen birds with sighting count + last-seen date
// FAB for adding sightings, tap a bird card to open SightingDetailSheet

import { useState, useMemo } from 'react'
import { Search, Plus, X, Bird } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

import { PageHeader } from '../components/layout/PageHeader'
import { GardenStats } from '../components/garden/GardenStats'
import { EmptyGarden } from '../components/garden/EmptyGarden'
import { AddSightingSheet } from '../components/garden/AddSightingSheet'
import { SightingDetailSheet } from '../components/garden/SightingDetailSheet'
import { BirdDetailModal } from '../components/explore/BirdDetailModal'

import { useGardenSightings } from '../hooks/useGardenSightings'
import { useGardenStats } from '../hooks/useGardenStats'
import { BIRDS, getBirdById } from '../data/birds'
import type { BirdSpecies } from '../data/birds'

// ─── Constants ────────────────────────────────────────────────────────────────

type SortOption = 'recent' | 'az' | 'most-seen'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'az', label: 'A-Z' },
  { value: 'most-seen', label: 'Most seen' },
]

// ─── Derived bird summary for the grid ────────────────────────────────────────

interface GardenBirdSummary {
  bird: BirdSpecies
  sightingCount: number
  totalIndividuals: number
  lastSeenDate: string
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function GardenScreen() {
  const { isLoading, sightings, seenBirdIds, sightingsForBird, addSighting, removeSighting } =
    useGardenSightings()
  const stats = useGardenStats()

  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [selectedBirdId, setSelectedBirdId] = useState<string | null>(null)
  const [detailBirdId, setDetailBirdId] = useState<string | null>(null)

  // ─── Build the garden bird grid data ──────────────────────────────────────

  const gardenBirds = useMemo<GardenBirdSummary[]>(() => {
    // Build summaries for each seen species
    const summaries: GardenBirdSummary[] = []

    for (const birdId of seenBirdIds) {
      const bird = getBirdById(birdId)
      if (!bird) continue

      const birdSightings = sightings.filter(s => s.birdId === birdId)
      if (birdSightings.length === 0) continue

      const totalIndividuals = birdSightings.reduce((sum, s) => sum + s.count, 0)

      // Find the most recent sighting date
      const sorted = [...birdSightings].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      const lastSeenDate = sorted[0].date

      summaries.push({
        bird,
        sightingCount: birdSightings.length,
        totalIndividuals,
        lastSeenDate,
      })
    }

    return summaries
  }, [seenBirdIds, sightings])

  // ─── Filter + sort ────────────────────────────────────────────────────────

  const filteredBirds = useMemo(() => {
    let result = gardenBirds

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase().trim()
      result = result.filter(
        s =>
          s.bird.name.toLowerCase().includes(q) ||
          s.bird.scientificName.toLowerCase().includes(q) ||
          s.bird.family.toLowerCase().includes(q),
      )
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        return [...result].sort(
          (a, b) => new Date(b.lastSeenDate).getTime() - new Date(a.lastSeenDate).getTime(),
        )
      case 'az':
        return [...result].sort((a, b) => a.bird.name.localeCompare(b.bird.name))
      case 'most-seen':
        return [...result].sort((a, b) => b.totalIndividuals - a.totalIndividuals)
      default:
        return result
    }
  }, [gardenBirds, query, sortBy])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleAddSighting(data: {
    birdId: string
    date: string
    time: string | null
    count: number
    notes: string | null
    weather: string | null
    photo: string | null
  }) {
    await addSighting(data.birdId, {
      date: data.date,
      time: data.time,
      count: data.count,
      notes: data.notes,
      weather: data.weather,
      photo: data.photo,
    })
  }

  async function handleDeleteSighting(sightingId: number) {
    await removeSighting(sightingId)
  }

  function handleViewSpecies(birdId: string) {
    setSelectedBirdId(null)
    setTimeout(() => setDetailBirdId(birdId), 150)
  }

  // ─── Selected bird data for detail sheet ──────────────────────────────────

  const selectedBird = selectedBirdId ? getBirdById(selectedBirdId) ?? null : null
  const selectedBirdSightings = selectedBirdId ? sightingsForBird(selectedBirdId) : []
  const detailBird = detailBirdId ? getBirdById(detailBirdId) ?? null : null

  // ─── Render ───────────────────────────────────────────────────────────────

  // Guard: don't render content until DB has responded — avoids flashing
  // EmptyGarden briefly on every navigation to this tab.
  const hasSightings = !isLoading && seenBirdIds.size > 0

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] overflow-y-auto">
      <PageHeader
        title="In Our Garden"
        below={
          hasSightings ? (
            <div className="flex flex-col gap-3">
              {/* Search bar */}
              <div className="relative">
                <Search
                  size={16}
                  strokeWidth={2}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--t4)]"
                />
                <input
                  type="text"
                  placeholder="Search your sightings..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className={cn(
                    'w-full h-10 pl-10 pr-10 rounded-xl text-[14px] text-[var(--t1)]',
                    'bg-[var(--elev)] border border-[var(--border-s)]',
                    'placeholder:text-[var(--t4)] outline-none',
                    'focus:border-[var(--blue)] transition-colors',
                  )}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--border)] flex items-center justify-center"
                  >
                    <X size={10} strokeWidth={2.5} className="text-[var(--t3)]" />
                  </button>
                )}
              </div>

              {/* Sort pills */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={cn(
                      'h-8 px-3.5 rounded-[var(--r-pill)] text-[12px] font-semibold whitespace-nowrap shrink-0 transition-colors duration-150',
                      sortBy === opt.value
                        ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
                        : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null
        }
      />

      {/* Content */}
      {!hasSightings ? (
        <EmptyGarden />
      ) : (
        <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">
          {/* Stats summary */}
          <div className="mb-6">
            <GardenStats
              totalSpecies={stats.totalSpecies}
              totalSightings={stats.totalSightings}
              thisMonthCount={stats.thisMonthCount}
              streak={stats.streak}
            />
          </div>

          {/* Bird grid */}
          {filteredBirds.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Search size={32} strokeWidth={1.5} className="text-[var(--t4)] mb-3" />
              <p className="text-[15px] font-semibold text-[var(--t1)] mb-1">
                No birds match your search
              </p>
              <p className="text-[13px] text-[var(--t3)]">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
              {filteredBirds.map((summary, i) => (
                <GardenBirdCard
                  key={summary.bird.id}
                  summary={summary}
                  index={i}
                  onTap={() => setSelectedBirdId(summary.bird.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAB — Add Sighting. z-[1050] sits above the nav-tab gradient overlay */}
      <motion.button
        onClick={() => setAddSheetOpen(true)}
        className={cn(
          'fixed z-[1050] w-14 h-14 rounded-full',
          'flex items-center justify-center text-white',
          'active:scale-[.92] transition-transform',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]',
        )}
        style={{
          background: 'var(--blue)',
          bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
          right: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,.25)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </motion.button>

      {/* Add Sighting Sheet */}
      <AddSightingSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onSave={handleAddSighting}
      />

      {/* Sighting Detail Sheet */}
      <SightingDetailSheet
        open={selectedBirdId !== null}
        onClose={() => setSelectedBirdId(null)}
        bird={selectedBird}
        sightings={selectedBirdSightings}
        onDelete={handleDeleteSighting}
        onViewSpecies={handleViewSpecies}
      />

      {/* Bird Detail Modal — opened from "Learn More" in SightingDetailSheet */}
      <BirdDetailModal
        bird={detailBird}
        onClose={() => setDetailBirdId(null)}
        onSpotted={() => {}}
      />
    </div>
  )
}

// ─── GardenBirdCard ───────────────────────────────────────────────────────────

function GardenBirdCard({
  summary,
  index,
  onTap,
}: {
  summary: GardenBirdSummary
  index: number
  onTap: () => void
}) {
  const { bird, totalIndividuals, lastSeenDate } = summary

  const formattedDate = (() => {
    try {
      const d = new Date(lastSeenDate + 'T00:00:00')
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    } catch {
      return lastSeenDate
    }
  })()

  return (
    <motion.button
      onClick={onTap}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
      className={cn(
        'w-full text-left rounded-2xl border border-[var(--border-s)] bg-[var(--card)]',
        'flex flex-col overflow-hidden',
        'transition-all duration-300',
        'motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]',
        'hover:border-[var(--border)] motion-safe:active:scale-[.97]',
        'focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
      )}
    >
      {/* Image area or placeholder */}
      <div className="relative w-full aspect-[4/3] bg-[var(--elev)] flex items-center justify-center">
        {bird.imageUrl ? (
          <img
            src={bird.imageUrl}
            alt={bird.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Bird size={28} strokeWidth={1.5} className="text-[var(--t4)]" />
        )}

        {/* Sighting count badge — top-right */}
        <div
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums"
          style={{
            background: 'var(--blue-sub)',
            border: '1px solid var(--blue)',
            color: 'var(--blue-t)',
          }}
        >
          {totalIndividuals}
        </div>

        {/* Conservation status dot — top-left */}
        <div
          className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full"
          style={{
            background:
              bird.conservationStatus === 'Red'
                ? 'var(--red)'
                : bird.conservationStatus === 'Amber'
                  ? 'var(--amber)'
                  : 'var(--green)',
          }}
        />
      </div>

      {/* Text area */}
      <div className="flex flex-col gap-0.5 p-3">
        <span className="text-[13px] font-semibold text-[var(--t1)] leading-snug line-clamp-1">
          {bird.name}
        </span>
        <span className="text-[11px] text-[var(--t3)]">
          Last seen {formattedDate}
        </span>
      </div>
    </motion.button>
  )
}
