// BirdProfileSheet — BottomSheet summary when tapping a bird in the grid
// Header row: w-20 h-20 rounded-xl image + common name + scientific name + conservation badge
// Quick stats, play sound button, "Learn More", "Mark as seen", and "Spotted" CTAs

import { Volume2, Eye, ChevronRight, Binoculars } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { useBirdAudio } from '../../hooks/useBirdAudio'
import { useGardenSightings } from '../../hooks/useGardenSightings'
import { useWildSightings } from '../../hooks/useWildSightings'
import type { BirdSpecies } from '../../data/birds'

// ─── Conservation labels & badge tint pairs ─────────────────────────────────

const STATUS_LABEL: Record<string, string> = { Red: 'High concern', Amber: 'Declining', Green: 'Least concern' }

const CONSERVATION_BADGE: Record<string, { bg: string; border: string; text: string }> = {
  Red: {
    bg: 'bg-[var(--red-sub)]',
    border: 'border-[var(--red)]',
    text: 'text-[var(--red-t)]',
  },
  Amber: {
    bg: 'bg-[var(--amber-sub)]',
    border: 'border-[var(--amber)]',
    text: 'text-[var(--amber-t)]',
  },
  Green: {
    bg: 'bg-[var(--green-sub)]',
    border: 'border-[var(--green)]',
    text: 'text-[var(--green-t)]',
  },
}

// ─── Garden likelihood label ─────────────────────────────────────────────────

function gardenLabel(likelihood: number): string {
  if (likelihood >= 5) return 'Very common'
  if (likelihood >= 4) return 'Common'
  if (likelihood >= 3) return 'Occasional'
  if (likelihood >= 2) return 'Uncommon'
  return 'Rare'
}

interface BirdProfileSheetProps {
  bird: BirdSpecies | null
  onClose: () => void
  onLearnMore: () => void
  onSpotted: () => void
}

export function BirdProfileSheet({ bird, onClose, onLearnMore, onSpotted }: BirdProfileSheetProps) {
  const { play, stop, isPlaying, currentUrl } = useBirdAudio()
  const { hasSeen, addSighting } = useGardenSightings()
  const { sightingsForBird } = useWildSightings()

  const isAlreadySeen = bird ? hasSeen(bird.id) : false
  const wildCount = bird ? sightingsForBird(bird.id).length : 0

  function handlePlaySound() {
    if (!bird?.soundUrl) return
    if (isPlaying && currentUrl === bird.soundUrl) {
      stop()
    } else {
      play(bird.soundUrl)
    }
  }

  function handleLearnMore() {
    stop()
    onLearnMore()
  }

  async function handleMarkAsSeen() {
    if (!bird || isAlreadySeen) return
    await addSighting(bird.id)
  }

  function handleClose() {
    stop()
    onClose()
  }

  const badge = bird ? CONSERVATION_BADGE[bird.conservationStatus] : null

  return (
    <BottomSheet open={!!bird} onClose={handleClose} maxHeight="100dvh">
      {bird && (
        <div className="pb-6">
          <div className="px-6 pt-4">
            {/* Hero row — thumbnail + name/meta */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--elev)] shrink-0">
                {bird.imageUrl ? (
                  <img
                    src={bird.imageUrl}
                    alt={bird.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--t4)] text-[11px]">
                    No image
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="text-[20px] font-bold text-[var(--t1)] leading-tight truncate">
                    {bird.name}
                  </h2>
                  {badge && (
                    <span
                      className={cn(
                        'shrink-0 px-2 py-0.5 rounded-[var(--r-pill)]',
                        'text-[11px] font-bold uppercase tracking-wide border',
                        badge.bg, badge.border, badge.text,
                      )}
                    >
                      {STATUS_LABEL[bird.conservationStatus] ?? bird.conservationStatus}
                    </span>
                  )}
                </div>
                <p className="text-[13px] italic text-[var(--t3)] leading-snug truncate mb-1.5">
                  {bird.scientificName}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-[var(--r-pill)] text-[11px] font-bold uppercase tracking-wide bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t3)]">
                    {bird.family}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {[
                { label: 'SIZE', value: bird.size },
                { label: 'SEASON', value: bird.seasonality },
                { label: 'GARDEN', value: gardenLabel(bird.gardenLikelihood) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--t3)]">
                    {label}
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--t1)]">{value}</span>
                </div>
              ))}
            </div>

            {/* Play sound button */}
            {bird.soundUrl && (
              <button
                onClick={handlePlaySound}
                className={cn(
                  'flex items-center gap-2 px-4 h-10 rounded-[var(--r-pill)] mb-4',
                  'text-[13px] font-semibold transition-colors duration-150 border',
                  isPlaying && currentUrl === bird.soundUrl
                    ? 'bg-[var(--blue-sub)] border-[var(--blue)] text-[var(--blue-t)]'
                    : 'bg-[var(--card)] border-[var(--border-s)] text-[var(--t2)]',
                )}
              >
                <Volume2 size={16} strokeWidth={2} aria-hidden="true" />
                {isPlaying && currentUrl === bird.soundUrl ? 'Stop sound' : 'Play sound'}
              </button>
            )}

            {/* Description */}
            <p className="text-[14px] text-[var(--t2)] leading-relaxed mb-6">
              {bird.description}
            </p>

            {/* Learn More */}
            <Button
              variant="outline"
              size="md"
              className="w-full mb-3"
              onClick={handleLearnMore}
            >
              <span className="flex items-center gap-2">
                Learn More
                <ChevronRight size={16} strokeWidth={2} />
              </span>
            </Button>

            {/* Mark as seen */}
            <Button
              variant={isAlreadySeen ? 'secondary' : 'primary'}
              size="md"
              className="w-full mb-2"
              disabled={isAlreadySeen}
              onClick={handleMarkAsSeen}
            >
              <span className="flex items-center gap-2">
                <Eye size={16} strokeWidth={2} />
                {isAlreadySeen ? 'Already seen in our garden' : 'Mark as seen in our garden'}
              </span>
            </Button>

            {/* Spotted in the wild */}
            <button
              onClick={onSpotted}
              className="w-full h-11 rounded-[var(--r-md)] text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors bg-[var(--purple-sub)] text-[var(--purple-t)] border border-transparent hover:border-[var(--purple)]"
            >
              <Binoculars size={16} strokeWidth={2} />
              {wildCount > 0 ? `Spotted in the wild (${wildCount})` : 'Spotted in the wild'}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
