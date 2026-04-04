// InlineAudioPlayer — compact play/pause + progress slider for bird cards
// Renders as a small translucent bar, designed to overlay the image area.

import { useCallback, useRef } from 'react'
import { cn } from '../../lib/utils'
import { useBirdAudioContext } from '../../contexts/BirdAudioContext'

interface InlineAudioPlayerProps {
  birdId: string
  soundUrl: string
}

export function InlineAudioPlayer({ birdId, soundUrl }: InlineAudioPlayerProps) {
  const { activeBirdId, activeUrl, isPlaying, progress, toggle, seek } =
    useBirdAudioContext()

  const trackRef = useRef<HTMLDivElement>(null)

  const isThisBirdPlaying =
    activeBirdId === birdId && activeUrl === soundUrl && isPlaying

  const isThisBirdActive =
    activeBirdId === birdId && activeUrl === soundUrl

  const displayProgress = isThisBirdActive ? progress : 0

  /** Handle play/pause tap — stop event from bubbling to the card onClick. */
  const handleToggle = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation()
      toggle(birdId, soundUrl)
    },
    [birdId, soundUrl, toggle],
  )

  /** Handle click/drag on the progress track to seek. */
  const handleTrackInteraction = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const track = trackRef.current
      if (!track) return

      const rect = track.getBoundingClientRect()
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))

      // If this bird isn't active yet, start playing then seek
      if (!isThisBirdActive) {
        toggle(birdId, soundUrl)
        // Seek after a tick so the audio element is created
        requestAnimationFrame(() => seek(fraction))
      } else {
        seek(fraction)
      }
    },
    [birdId, soundUrl, isThisBirdActive, toggle, seek],
  )

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5',
        'bg-[var(--elev)] backdrop-blur-sm',
        'rounded-b-[var(--r-lg)]',
      )}
      // Prevent card navigation when interacting with the player
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="group"
      aria-label="Audio player"
    >
      {/* Play / Pause button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle(e)
          }
        }}
        className={cn(
          'flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full',
          'bg-[var(--blue)] hover:bg-[var(--blue-h)] transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-[var(--blue-t)] focus-visible:outline-offset-1',
        )}
        aria-label={isThisBirdPlaying ? 'Pause bird sound' : 'Play bird sound'}
      >
        {isThisBirdPlaying ? (
          // Pause icon
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden="true"
          >
            <rect x="1.5" y="1" width="2.5" height="8" rx="0.5" fill="var(--t1)" />
            <rect x="6" y="1" width="2.5" height="8" rx="0.5" fill="var(--t1)" />
          </svg>
        ) : (
          // Play icon (triangle)
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden="true"
          >
            <path d="M2.5 1.5L8.5 5L2.5 8.5V1.5Z" fill="var(--t1)" />
          </svg>
        )}
      </button>

      {/* Progress track */}
      <div
        ref={trackRef}
        className="flex-1 h-4 flex items-center cursor-pointer group"
        onClick={handleTrackInteraction}
        role="slider"
        aria-label="Audio progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(displayProgress * 100)}
        tabIndex={0}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            seek(Math.min(1, displayProgress + 0.05))
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            seek(Math.max(0, displayProgress - 0.05))
          }
        }}
      >
        <div className="w-full h-[3px] rounded-full bg-[var(--border-s)] relative overflow-hidden">
          {/* Filled portion */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--blue)] transition-[width] duration-75 ease-linear"
            style={{ width: `${displayProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Waveform hint icon — purely decorative */}
      <svg
        width="14"
        height="10"
        viewBox="0 0 14 10"
        fill="none"
        className="flex-shrink-0 opacity-50"
        aria-hidden="true"
      >
        <line x1="1" y1="3" x2="1" y2="7" stroke="var(--t3)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="3.5" y1="1" x2="3.5" y2="9" stroke="var(--t3)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="6" y1="2.5" x2="6" y2="7.5" stroke="var(--t3)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8.5" y1="0.5" x2="8.5" y2="9.5" stroke="var(--t3)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="11" y1="2" x2="11" y2="8" stroke="var(--t3)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="13" y1="3.5" x2="13" y2="6.5" stroke="var(--t3)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
