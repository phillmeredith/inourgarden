// ExploreScreen — searchable bird directory with virtualised grid
//
// Layout: scroll container is absolute inset-0 so it starts at the very top
// of the viewport (behind the PageHeader). The PageHeader floats above it as
// absolute top-0. This means bird images sit behind the header zone — when a
// modal opens, backdrop-filter blurs the grid all the way into the safe area.
//
// Content padding: all scroll content gets paddingTop = headerHeight so birds
// appear below the header at rest. AZ rail also starts below the header.
//
// Virtualisation: BirdVirtualGrid uses @tanstack/react-virtual relative to
// the scroll container. scrollToIndex is NOT used for letter navigation
// (it doesn't know about the top padding) — handleLetterPress computes the
// raw scroll offset manually instead.
//
// Column counts: 2 @ <500px | 3 @ 500-767px | 4 @ ≥1024px

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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

// ─── BirdVirtualGrid (inner) ──────────────────────────────────────────────────
// Receives a confirmed containerWidth — never called with 0.
// Virtualizer is always initialised with correct item sizes.

interface BirdVirtualGridInnerProps {
  containerWidth: number
  items: BirdSpecies[]
  letterFirstIndex: Map<string, number>
  onCardTap: (bird: BirdSpecies) => void
  scrollRef: React.RefObject<HTMLDivElement>
  virtualizerRef: React.MutableRefObject<{
    scrollToIndex: (index: number, opts?: { align?: 'start' }) => void
  } | null>
}

function BirdVirtualGridInner({
  containerWidth,
  items,
  letterFirstIndex,
  onCardTap,
  scrollRef,
  virtualizerRef,
}: BirdVirtualGridInnerProps) {
  const gap = 12

  const colCount = containerWidth >= 1024 ? 4
    : containerWidth >= 768 ? 3
    : containerWidth >= 500 ? 2
    : 1

  const cardWidth = (containerWidth - gap * (colCount - 1)) / colCount
  // BirdCard: aspect-square image + ~44px name strip
  const rowHeight = cardWidth + 44 + gap

  const rows = useMemo<BirdSpecies[][]>(() => {
    const result: BirdSpecies[][] = []
    for (let i = 0; i < items.length; i += colCount) {
      result.push(items.slice(i, i + colCount))
    }
    return result
  }, [items, colCount])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  })

  useEffect(() => {
    virtualizerRef.current = {
      scrollToIndex: (rowIndex, opts) =>
        virtualizer.scrollToIndex(rowIndex, opts),
    }
  })

  return (
    <div
      style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}
    >
      {virtualizer.getVirtualItems().map(virtualRow => {
        const row = rows[virtualRow.index]
        if (!row) return null
        return (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translate3d(0,${virtualRow.start}px,0)`,
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
                <div key={bird.id} {...(isFirst ? { 'data-first-letter': letter } : {})}>
                  <BirdCard bird={bird} onClick={() => onCardTap(bird)} />
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ─── BirdVirtualGrid (outer container) ───────────────────────────────────────
// Measures its own width with useLayoutEffect. Only renders BirdVirtualGridInner
// once a real width is known — virtualizer never sees width = 0.

interface BirdVirtualGridProps {
  items: BirdSpecies[]
  letterFirstIndex: Map<string, number>
  onCardTap: (bird: BirdSpecies) => void
  scrollRef: React.RefObject<HTMLDivElement>
  virtualizerRef: React.MutableRefObject<{
    scrollToIndex: (index: number, opts?: { align?: 'start' }) => void
  } | null>
}

function BirdVirtualGrid(props: BirdVirtualGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerWidth(el.offsetWidth)
    const ro = new ResizeObserver(([entry]) =>
      setContainerWidth(entry.contentRect.width)
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    // pt-1: prevents hover-lift shadow clipping at scroll container top
    <div ref={containerRef} className="w-full pt-1">
      {containerWidth > 0 && (
        <BirdVirtualGridInner containerWidth={containerWidth} {...props} />
      )}
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

  // scrollContainerRef — the overflow-y-auto div; passed to BirdVirtualGrid
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // headerRef + headerHeight — measures the floating PageHeader so we can
  // push all content down by exactly that amount.
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    setHeaderHeight(el.offsetHeight)
    const ro = new ResizeObserver(([entry]) =>
      setHeaderHeight(entry.contentRect.height)
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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
  function handleLearnMore() {
    const bird = selectedBird
    if (!bird) return
    setSelectedBird(null)
    setTimeout(() => setDetailBird(bird), 100)
  }

  // Called by BirdProfileSheet/BirdDetailModal when "Spotted in the wild" is tapped.
  function handleSpotted() {
    const bird = selectedBird ?? detailBird
    if (!bird) return
    if (selectedBird) setSelectedBird(null)
    if (detailBird) setDetailBird(null)
    setTimeout(() => setSpottedBird(bird), 100)
  }

  // AZ rail — manually compute scroll offset so we account for the headerHeight
  // top padding. scrollToIndex can't be used here because the virtualizer's
  // coordinate system starts at 0 (within the virtual container), unaware of
  // the paddingTop that sits before it in the scroll container.
  function handleLetterPress(letter: string) {
    setActiveLetter(letter)
    const birdIndex = letterFirstIndex.get(letter)
    const scrollEl = scrollContainerRef.current
    if (birdIndex == null || !scrollEl) return

    // Match the grid's actual containerWidth (subtract px-6 on each side)
    const containerWidth = Math.max(0, scrollEl.offsetWidth - 48)
    const colCount = containerWidth >= 1024 ? 4
      : containerWidth >= 768 ? 3
      : containerWidth >= 500 ? 2
      : 1
    const gap = 12
    const cardWidth = (containerWidth - gap * (colCount - 1)) / colCount
    const rowHeight = cardWidth + 44 + gap
    const rowIndex = Math.floor(birdIndex / colCount)

    // headerHeight = top padding before the grid + 16px (original pt-4 on grid wrapper)
    scrollEl.scrollTop = headerHeight + 16 + rowIndex * rowHeight
  }

  return (
    // data-explore-screen: used by CSS to scope the modal-open PageHeader
    // transparency rule to this screen only (not Garden/Settings).
    // bg-[var(--nav-solid)]: matches html/body so the safe area colour is
    // consistent when the floating header becomes transparent.
    <div data-explore-screen="" className="relative h-full bg-[var(--nav-solid)]">

      {/* ── Phantom bird strip ───────────────────────────────────────────────
          Fixed behind the floating PageHeader (z-1). At scrollTop=0 the bird
          grid starts below headerHeight so the top zone is visually empty.
          This strip fills that zone with real bird images so that when a modal
          opens and the PageHeader becomes transparent, the backdrop-filter blur
          has something colourful to sample — extending the frosted glass effect
          all the way into the safe area behind the status bar. */}
      {activeTab === 'browse' && viewMode === 'grid' && filteredBirds.length > 0 && headerHeight > 0 && (
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 z-[1] overflow-hidden pointer-events-none"
          style={{ height: headerHeight }}
        >
          <div className="flex h-full">
            {filteredBirds.slice(0, 6).map(bird => (
              <div
                key={bird.id}
                className="flex-1 overflow-hidden"
                style={{ background: 'var(--card)' }}
              >
                {bird.imageUrl && (
                  <img
                    src={bird.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Scroll area + AZ rail ─────────────────────────────────────────
          Starts at the very top of the viewport (y=0), behind the floating
          header. Bird content is offset downward by paddingTop = headerHeight
          so it appears below the header at rest.
          When a modal opens, its backdrop-filter blurs the bird grid content
          all the way up into the safe-area zone behind the status bar. */}
      <div className="absolute inset-0 flex">
        <div
          className="flex-1 overflow-y-auto bg-[var(--bg)]"
          ref={scrollContainerRef}
          style={{ willChange: 'scroll-position' }}
        >
          {/* ─── Browse tab ──────────────────────────────────────── */}
          {activeTab === 'browse' && (
            <>
              {viewMode === 'grid' && (
                filteredBirds.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-16 gap-3 px-6"
                    style={{ paddingTop: headerHeight + 64 }}
                  >
                    <Search size={48} className="text-[var(--t3)]" />
                    <p className="text-[17px] font-semibold text-[var(--t1)]">
                      No birds found
                    </p>
                    <p className="text-[14px] text-[var(--t2)]">Try a different search or clear filters</p>
                    <Button variant="outline" size="md" onClick={reset}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div
                    className="px-6 pb-24 max-w-3xl mx-auto w-full"
                    style={{ paddingTop: headerHeight + 16 }}
                  >
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

              {viewMode === 'map' && (
                <div className="px-4 pb-24" style={{ paddingTop: headerHeight + 16 }}>
                  <BirdMap birds={filteredBirds} onBirdTap={setSelectedBird} />
                </div>
              )}
            </>
          )}

          {/* ─── Identify tab ────────────────────────────────────── */}
          {activeTab === 'identify' && (
            <div style={{ paddingTop: headerHeight }}>
              <IdentifyView onBirdTap={setSelectedBird} />
            </div>
          )}
        </div>

        {/* A-Z Rail — only in browse grid view.
            Wrapper has paddingTop = headerHeight so letters start below
            the floating header and the AZ position-to-letter mapping
            correctly covers only the visible (non-header) screen area. */}
        {activeTab === 'browse' && viewMode === 'grid' && filteredBirds.length > 0 && (
          <div
            style={{
              paddingTop: headerHeight,
              height: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <AZRail
              availableLetters={availableLetters}
              onLetterTap={handleLetterPress}
              activeLetter={activeLetter}
            />
          </div>
        )}
      </div>

      {/* ── Floating PageHeader ──────────────────────────────────────────────
          Absolutely positioned above the scroll area. The scroll content
          slides behind it. */}
      <div ref={headerRef} className="absolute top-0 left-0 right-0 z-[100]">
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
                <SearchBar value={query} onChange={setQuery} placeholder="Search birds..." />
              )}
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
      </div>

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
