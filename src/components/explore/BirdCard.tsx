// BirdCard — grid card for the Explore directory
// Aspect-square image, common name, conservation status dot, seasonality badge
// Inline audio player when bird has sound data
// DS hover pattern: motion-safe:hover:-translate-y-0.5 etc.

import { cn } from '../../lib/utils'
import type { BirdSpecies } from '../../data/birds'
import { InlineAudioPlayer } from './InlineAudioPlayer'

// ─── Conservation dot colour mapping ─────────────────────────────────────────

const CONSERVATION_DOT: Record<string, string> = {
  Red: 'bg-[var(--red)]',
  Amber: 'bg-[var(--amber)]',
  Green: 'bg-[var(--green)]',
}

// ─── Seasonality badge tint pairs ────────────────────────────────────────────

const SEASONALITY_STYLE: Record<string, string> = {
  Resident: 'bg-[var(--green-sub)] text-[var(--green-t)]',
  Summer: 'bg-[var(--amber-sub)] text-[var(--amber-t)]',
  Winter: 'bg-[var(--blue-sub)] text-[var(--blue-t)]',
  Passage: 'bg-[var(--purple-sub)] text-[var(--purple-t)]',
}

interface BirdCardProps {
  bird: BirdSpecies
  onClick: () => void
}

export function BirdCard({ bird, onClick }: BirdCardProps) {
  // Resolve the first available sound URL (prefer soundUrl, fall back to sounds[])
  const soundUrl = bird.soundUrl ?? bird.sounds?.[0]?.url ?? null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        'w-full text-left cursor-pointer select-none',
        'bg-[var(--card)] border border-[var(--border-s)] rounded-[var(--r-lg)] overflow-hidden',
        'hover:border-[var(--border)]',
        'motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]',
        'transition-all duration-300 motion-safe:active:scale-[.97]',
        'focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
      )}
    >
      {/* Image — aspect-square */}
      <div className="w-full aspect-square bg-[var(--elev)] relative overflow-hidden">
        {bird.imageUrl ? (
          <img
            src={bird.imageUrl}
            alt={bird.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--t4)] text-[11px]">
            No image
          </div>
        )}

        {/* Conservation status dot — bottom-left overlay (raised when audio player present) */}
        <span
          className={cn(
            'absolute left-1.5 w-3 h-3 rounded-full',
            'border-2 border-[var(--card)]',
            soundUrl ? 'bottom-9' : 'bottom-1.5',
            CONSERVATION_DOT[bird.conservationStatus] ?? 'bg-[var(--t3)]',
          )}
          aria-label={`${bird.conservationStatus} conservation status`}
        />

        {/* Seasonality badge — top-right overlay */}
        <span
          className={cn(
            'absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md',
            'text-[9px] font-bold uppercase tracking-wider leading-none',
            SEASONALITY_STYLE[bird.seasonality] ?? 'bg-[var(--elev)] text-[var(--t3)]',
          )}
        >
          {bird.seasonality}
        </span>

        {/* Inline audio player — anchored to bottom of image area */}
        {soundUrl && (
          <div className="absolute bottom-0 left-0 right-0">
            <InlineAudioPlayer birdId={bird.id} soundUrl={soundUrl} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <span className="text-[13px] font-semibold text-[var(--t1)] line-clamp-1 truncate leading-tight block mb-0.5">
          {bird.name}
        </span>
        <p className="text-[11px] text-[var(--t3)] leading-none truncate">
          {bird.family} · {bird.category}
        </p>
      </div>
    </div>
  )
}
