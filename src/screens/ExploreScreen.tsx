// ExploreScreen — searchable bird directory with virtualised grid
//
// Virtualisation: scroll container is the flex-1 overflow-y-auto div (scrollContainerRef).
// BirdVirtualGrid groups filteredBirds into rows of colCount and uses useVirtualizer
// relative to that scroll element.
//
// Column counts: 2 @ <768px | 3 @ 768-1023px | 4 @ >= 1024px
//
// AZ rail scroll: handleLetterPress computes the target row index for each letter
// and scrolls the virtualiser to the correct offset.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Grid3X3, Map as MapIcon, Search, Volume2 } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { SearchBar } from '../components/ui/SearchBar'
import { Button } from '../components/ui/Button'
import { CategoryPills } from '../components/explore/CategoryPills'
import { ConservationPills } from '../components/explore/ConservationPills'
import { BirdCard } from '../components/explore/BirdCard'
import { AZRail } from '../components/explore/AZRail'
import { BirdProfileSheet } from '../components/explore/BirdProfileSheet'
import { BirdDetailModal } from '../components/explore/BirdDetailModal'
import { SpottedFormModal } from '../components/explore/SpottedFormModal'
import { BirdMap } from '../components/explore/BirdMap'
import { IdentifyView } from '../components/explore/IdentifyView'
import { useExploreFilter } from '../hooks/useExploreFilter'
import type { BirdSpecies } from '../data/birds'

// ─── Virtual grid ─────────────────────────────────────────────────────────────

interface BirdVirtualGridProps {
  items: BirdSpecies[]
  letterFirstIndex: Map<string, number>
  onCardTap: (bird: BirdSpecies) => void
  scrollRef: React.RefObject<HTMLDivElement>
  virtualizerRef: React.MutableRefObject<{
    scrollToIndex: (index: number, opts?: { align?: 'start' }) => void
  } | null>
}

function BirdVirtualGrid({
  items,
  letterFirstIndex,
  onCardTap,
  scrollRef,
  virtualizerRef,
}: BirdVirtualGridProps) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [gridWidth, setGridWidth] = useState(0)

  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setGridWidth(entries[0]?.contentRect.width ?? 0)
    })
    observer.observe(el)
    setGridWidth(el.offsetWidth)
    return () => observer.disconnect()
  }, [])

  // Column count: 1 (very narrow) / 2 (phone) / 3 (tablet portrait) / 4 (tablet landscape+)
  const colCount = useMemo(() => {
    if (gridWidth >= 1024) return 4
    if (gridWidth >= 768) return 3
    if (gridWidth >= 340) return 2
    return 1
  }, [gridWidth])

  const gap = 12 // gap-3 = 12px

  const cardWidth = gridWidth > 0
    ? (gridWidth - gap * (colCount - 1)) / colCount
    : 0

  // BirdCard is aspect-square image + name strip (~44px)
  const cardHeight = cardWidth > 0 ? cardWidth + 44 : 0
  const rowHeight = cardHeight + gap

  const rows = useMemo<BirdSpecies[][]>(() => {
    if (colCount === 0) return []
    const result: BirdSpecies[][] = []
    for (let i = 0; i < items.length; i += colCount) {
      result.push(items.slice(i, i + colCount))
    }
    return result
  }, [items, colCount])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (rowHeight > 0 ? rowHeight : 240),
    overscan: 4,
  })

  // Expose imperative scroll-to-row
  useEffect(() => {
    virtualizerRef.current = {
      scrollToIndex: (rowIndex, opts) =>
        virtualizer.scrollToIndex(rowIndex, opts),
    }
  })

  if (cardWidth === 0) {
    return (
      <div
        ref={measureRef}
        className="w-full pt-1"
        style={{ minHeight: 4 }}
        aria-hidden="true"
      />
    )
  }

  return (
    // pt-1: prevents hover lift from clipping at the scroll container top
    <div ref={measureRef} className="w-full pt-1">
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const row = rows[virtualRow.index]
          if (!row) return null
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                gap: `${gap}px`,
                paddingBottom: `${gap}px`,
              }}
            >
              {row.map((bird, colIdx) => {
                const globalIndex = virtualRow.index * colCount + colIdx
                const letter = bird.name[0].toUpperCase()
                const isFirst = letterFirstIndex.get(letter) === globalIndex
                return (
                  <div
                    key={bird.id}
                    {...(isFirst ? { 'data-first-letter': letter } : {})}
                  >
                    <BirdCard
                      bird={bird}
                      onClick={() => onCardTap(bird)}
                    />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── View mode ────────────────────────────────────────────────────────────────

type ExploreViewMode = 'grid' | 'map'
type ExploreTab = 'browse' | 'identify'

// ─── ExploreScreen ────────────────────────────────────────────────────────────

export function ExploreScreen() {
  const [activeTab, setActiveTab] = useState<ExploreTab>('browse')
  const [viewMode, setViewMode] = useState<ExploreViewMode>('grid')
  const {
    query,
    activeCategory,
    conservationStatus,
    hasSoundOnly,
    filteredBirds,
    setQuery,
    setActiveCategory,
    setConservationStatus,
    setHasSoundOnly,
    reset,
  } = useExploreFilter()

  const [selectedBird, setSelectedBird] = useState<BirdSpecies | null>(null)
  const [detailBird, setDetailBird] = useState<BirdSpecies | null>(null)
  const [spottedBird, setSpottedBird] = useState<BirdSpecies | null>(null)

  // Active letter for AZ rail highlight
  const [activeLetter, setActiveLetter] = useState<string | null>(null)

  // scrollContainerRef — the overflow-y-auto flex child; passed to BirdVirtualGrid
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Imperative handle to the virtualiser inside BirdVirtualGrid
  const virtualizerRef = useRef<{
    scrollToIndex: (index: number, opts?: { align?: 'start' }) => void
  } | null>(null)

  // Track the index of the first bird for each letter (for AZ rail scrolling)
  const letterFirstIndex = useMemo(() => {
    const map = new Map<string, number>()
    filteredBirds.forEach((bird, i) => {
      const letter = bird.name[0].toUpperCase()
      if (!map.has(letter)) map.set(letter, i)
    })
    return map
  }, [filteredBirds])

  const availableLetters = useMemo(() => {
    const letters = new Set<string>()
    filteredBirds.forEach(b => letters.add(b.name[0].toUpperCase()))
    return letters
  }, [filteredBirds])

  // Called by BirdProfileSheet when "Learn More" is tapped.
  // Captures the bird reference, closes the sheet, then mounts detail modal after delay.
  function handleLearnMore() {
    const bird = selectedBird
    if (!bird) return
    setSelectedBird(null)
    setTimeout(() => {
      setDetailBird(bird)
    }, 100)
  }

  // Called by BirdProfileSheet/BirdDetailModal when "Spotted in the wild" is tapped.
  function handleSpotted() {
    const bird = selectedBird ?? detailBird
    if (!bird) return
    if (selectedBird) setSelectedBird(null)
    if (detailBird) setDetailBird(null)
    setTimeout(() => setSpottedBird(bird), 100)
  }

  // AZ rail scroll — derive the row index for the letter's first bird
  function handleLetterPress(letter: string) {
    setActiveLetter(letter)
    const birdIndex = letterFirstIndex.get(letter)
    if (birdIndex == null) return
    const containerWidth = scrollContainerRef.current?.offsetWidth ?? 0
    const colCount = containerWidth >= 1024 ? 4 : containerWidth >= 768 ? 3 : containerWidth >= 340 ? 2 : 1
    const rowIndex = Math.floor(birdIndex / colCount)
    virtualizerRef.current?.scrollToIndex(rowIndex, { align: 'start' })
  }

  return (
    <div className="flex h-full bg-[var(--bg)]">
      {/* Scrollable content column */}
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <PageHeader
          title="Explore"
          centre={
            <div className="flex rounded-[var(--r-pill)] overflow-hidden border border-[var(--border-s)] bg-[var(--card)]">
              {(['browse', 'identify'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={activeTab === tab}
                  className={[
                    'h-9 px-3.5 text-[13px] font-semibold transition-colors duration-150 capitalize',
                    activeTab === tab
                      ? 'bg-[var(--blue-sub)] text-[var(--blue-t)]'
                      : 'text-[var(--t2)] hover:text-[var(--t1)]',
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}
            </div>
          }
          rightAction={
            <div className="flex items-center gap-2">
              {/* Sound filter toggle */}
              <button
                onClick={() => setHasSoundOnly(!hasSoundOnly)}
                aria-pressed={hasSoundOnly}
                aria-label="Show only birds with sounds"
                className={[
                  'w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-150',
                  hasSoundOnly
                    ? 'bg-[var(--blue-sub)] text-[var(--blue-t)]'
                    : 'text-[var(--t3)] hover:text-[var(--t1)] hover:bg-white/[.06]',
                ].join(' ')}
              >
                <Volume2 size={18} strokeWidth={2} />
              </button>
            </div>
          }
          below={
            <>
              {activeTab === 'browse' && (
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search birds..."
              />)}
              {activeTab === 'browse' && (
              <>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6">
                <div className="flex-1 min-w-0">
                  <CategoryPills
                    active={activeCategory ?? 'All'}
                    onChange={setActiveCategory}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6">
                <ConservationPills
                  active={conservationStatus}
                  onChange={setConservationStatus}
                />

                {/* Grid / Map toggle */}
                <div
                  className="flex shrink-0 rounded-[var(--r-pill)] overflow-hidden border border-[var(--border-s)] bg-[var(--card)] ml-auto"
                  style={{ gap: 0 }}
                >
                  {(['grid', 'map'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      aria-pressed={viewMode === mode}
                      aria-label={mode === 'grid' ? 'Grid view' : 'Map view'}
                      className={[
                        'h-9 px-3 flex items-center gap-1.5 text-[13px] font-semibold transition-colors duration-150',
                        viewMode === mode
                          ? 'bg-[var(--blue-sub)] text-[var(--blue-t)]'
                          : 'text-[var(--t2)] hover:text-[var(--t1)]',
                      ].join(' ')}
                    >
                      {mode === 'grid'
                        ? <Grid3X3 size={14} strokeWidth={2} aria-hidden="true" />
                        : <MapIcon size={14} strokeWidth={2} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </div>
              </>
              )}
            </>
          }
        />

        {/* ─── Browse tab content ─────────────────────────────────── */}
        {activeTab === 'browse' && (
          <>
            {/* Grid content */}
            {viewMode === 'grid' && (
              filteredBirds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 px-6">
                  <Search size={48} className="text-[var(--t3)]" />
                  <p className="text-[17px] font-semibold text-[var(--t1)]">
                    No birds found
                  </p>
                  <p className="text-[14px] text-[var(--t2)]">Try a different search or clear filters</p>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={reset}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">
                  <BirdVirtualGrid
                    items={filteredBirds}
                    letterFirstIndex={letterFirstIndex}
                    onCardTap={setSelectedBird}
                    scrollRef={scrollContainerRef as React.RefObject<HTMLDivElement>}
                    virtualizerRef={virtualizerRef}
                  />
                </div>
              )
            )}

            {/* Map view */}
            {viewMode === 'map' && (
              <div className="px-4 pt-4 pb-24">
                <BirdMap
                  birds={filteredBirds}
                  onBirdTap={setSelectedBird}
                />
              </div>
            )}
          </>
        )}

        {/* ─── Identify tab content ──────────────────────────────── */}
        {activeTab === 'identify' && (
          <IdentifyView onBirdTap={setSelectedBird} />
        )}
      </div>

      {/* A-Z Rail — only shown in browse grid view */}
      {activeTab === 'browse' && viewMode === 'grid' && filteredBirds.length > 0 && (
        <AZRail
          availableLetters={availableLetters}
          onLetterTap={handleLetterPress}
          activeLetter={activeLetter}
        />
      )}

      {/* Bird profile sheet — summary view */}
      <BirdProfileSheet
        bird={selectedBird}
        onClose={() => setSelectedBird(null)}
        onLearnMore={handleLearnMore}
        onSpotted={handleSpotted}
      />

      {/* Bird detail modal — full-screen profile */}
      <BirdDetailModal
        bird={detailBird}
        onClose={() => setDetailBird(null)}
        onSpotted={handleSpotted}
      />

      {/* Spotted in the wild — centred form modal */}
      <SpottedFormModal
        bird={spottedBird}
        onClose={() => setSpottedBird(null)}
      />
    </div>
  )
}
