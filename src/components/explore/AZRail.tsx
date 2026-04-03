// AZRail — alphabetical index rail for quick grid navigation
// Supports tap and scrub (drag along the rail to rapidly change letter)

import { useRef } from 'react'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface AZRailProps {
  onLetterTap: (letter: string) => void
  activeLetter: string | null
  availableLetters: Set<string>
}

export function AZRail({ onLetterTap, activeLetter, availableLetters }: AZRailProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const lastLetter = useRef<string | null>(null)

  function letterFromY(clientY: number): string | null {
    const rail = railRef.current
    if (!rail) return null
    const rect = rail.getBoundingClientRect()
    const y = clientY - rect.top
    const index = Math.floor((y / rect.height) * LETTERS.length)
    const clamped = Math.max(0, Math.min(LETTERS.length - 1, index))
    return LETTERS[clamped]
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const letter = letterFromY(e.clientY)
    if (letter && availableLetters.has(letter)) {
      lastLetter.current = letter
      onLetterTap(letter)
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (e.buttons === 0) return
    const letter = letterFromY(e.clientY)
    if (letter && letter !== lastLetter.current && availableLetters.has(letter)) {
      lastLetter.current = letter
      onLetterTap(letter)
    }
  }

  return (
    <div
      ref={railRef}
      className="flex flex-col items-center justify-evenly w-7 py-4 select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      {LETTERS.map(letter => {
        const isAvailable = availableLetters.has(letter)
        const isActive = activeLetter === letter
        return (
          <span
            key={letter}
            className={[
              'text-[10px] font-bold uppercase leading-none py-0.5 px-1 transition-colors duration-100',
              isActive
                ? 'text-[var(--blue)]'
                : isAvailable
                  ? 'text-[var(--t3)] active:text-[var(--blue)]'
                  : 'text-[var(--t4)]',
            ].join(' ')}
          >
            {letter}
          </span>
        )
      })}
    </div>
  )
}
