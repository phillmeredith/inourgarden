// AttractScreen — garden bird attraction hub
//
// Tabs: Strategy (personalised) | Feeding Guide | Pecking Order
//
// Strategy tab: Laura sets her region, garden features, favourite birds and
// birds she wants to discourage. The screen builds a personalised plan:
//   • What to buy and do for each favourite
//   • Conflict alerts — birds likely to threaten her favourites
//   • Shopping list — consolidated food/equipment to get
//
// Feeding Guide tab: per-food-type sections showing which birds each attracts.
//
// Pecking Order tab: visual hierarchy from apex predator down to gentle shy birds,
// with conflict pair warnings throughout.

import { useState, useLayoutEffect, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Leaf, Settings2, Heart, ChevronRight, AlertTriangle,
  ShoppingCart, Check, X, Star, Info,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'
import { PageHeader } from '../components/layout/PageHeader'
import { BottomSheet } from '../components/ui/BottomSheet'
import { BIRDS } from '../data/birds'
import {
  ATTRACT_DATA, FOOD_GUIDE, GARDEN_FEATURES,
  TIER_META, type HierarchyTier,
} from '../data/attractData'
import {
  useGardenSetup,
  type GardenRegion, type GardenFeature,
} from '../hooks/useGardenSetup'
import type { BirdSpecies } from '../data/birds'
import type { AttractEntry } from '../data/attractData'

// ─── Constants ────────────────────────────────────────────────────────────────

type AttractTab = 'strategy' | 'feeding' | 'hierarchy'

const REGIONS: { value: GardenRegion; label: string; emoji: string }[] = [
  { value: 'scotland',       label: 'Scotland',         emoji: '🏔️' },
  { value: 'n-england',      label: 'North England',    emoji: '🌄' },
  { value: 'midlands-wales', label: 'Midlands & Wales', emoji: '🌿' },
  { value: 's-england',      label: 'South England',    emoji: '🌳' },
  { value: 'n-ireland',      label: 'N. Ireland',       emoji: '☘️' },
]

const FEATURES: { value: GardenFeature; label: string; emoji: string }[] = [
  { value: 'trees',   label: 'Trees',         emoji: '🌳' },
  { value: 'hedges',  label: 'Dense Hedges',  emoji: '🌿' },
  { value: 'water',   label: 'Water / Pond',  emoji: '💧' },
  { value: 'lawn',    label: 'Lawn',          emoji: '🌱' },
  { value: 'berries', label: 'Berry Plants',  emoji: '🫐' },
  { value: 'feeders', label: 'Feeders up',    emoji: '🪤' },
]

const TIER_ORDER: HierarchyTier[] = ['apex', 'dominant', 'assertive', 'moderate', 'shy']

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Birds from our data that have attract enrichment AND gardenLikelihood >= 2 */
function useGardenBirds() {
  return useMemo(() =>
    BIRDS
      .filter(b => b.gardenLikelihood >= 2 && ATTRACT_DATA[b.name])
      .sort((a, b) => b.gardenLikelihood - a.gardenLikelihood),
  [])
}

/** For each of Laura's favourites, find other garden birds that threaten them */
function useConflicts(
  favourites: string[],
  gardenBirds: BirdSpecies[],
): { threatBird: BirdSpecies; entry: AttractEntry; victims: string[] }[] {
  return useMemo(() => {
    if (favourites.length === 0) return []
    const threats: Map<string, { threatBird: BirdSpecies; entry: AttractEntry; victims: string[] }> = new Map()
    for (const bird of gardenBirds) {
      const entry = ATTRACT_DATA[bird.name]
      if (!entry?.conflictsWith?.length) continue
      const victims = entry.conflictsWith.filter(v => favourites.includes(v))
      if (victims.length > 0) {
        threats.set(bird.name, { threatBird: bird, entry, victims })
      }
    }
    return Array.from(threats.values()).sort((a, b) =>
      TIER_ORDER.indexOf(a.entry.tier) - TIER_ORDER.indexOf(b.entry.tier)
    )
  }, [favourites, gardenBirds])
}

/** Deduplicated shopping list from all favourites' food lists */
function useShoppingList(favourites: string[]): string[] {
  return useMemo(() => {
    const foods = new Set<string>()
    for (const name of favourites) {
      const entry = ATTRACT_DATA[name]
      if (!entry) continue
      for (const f of entry.foods) foods.add(f.item)
    }
    return Array.from(foods)
  }, [favourites])
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier, small = false }: { tier: HierarchyTier; small?: boolean }) {
  const meta = TIER_META[tier]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold uppercase tracking-wide border',
        small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
      )}
      style={{ background: meta.bg, color: meta.color, borderColor: meta.color + '55' }}
    >
      {meta.label}
    </span>
  )
}

// ─── Bird pick card (for favourites selection) ────────────────────────────────

function BirdPickCard({
  bird,
  selected,
  onToggle,
}: {
  bird: BirdSpecies
  selected: boolean
  onToggle: () => void
}) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.94 }}
      className={cn(
        'relative rounded-xl overflow-hidden border transition-all duration-200 text-left',
        selected
          ? 'border-[var(--blue)] ring-2 ring-[var(--blue)] ring-opacity-40'
          : 'border-[var(--border-s)]',
      )}
    >
      {/* Image */}
      <div className="aspect-square w-full bg-[var(--elev)]">
        {bird.imageUrl
          ? <img src={bird.imageUrl} alt={bird.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-[var(--t4)]"><Leaf size={20} /></div>
        }
      </div>
      {/* Name */}
      <div className="px-2 py-1.5" style={{ background: 'var(--card)' }}>
        <p className="text-[11px] font-semibold text-[var(--t1)] leading-snug line-clamp-1">{bird.name}</p>
      </div>
      {/* Tick overlay */}
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'var(--blue)' }}>
          <Check size={11} strokeWidth={3} className="text-white" />
        </div>
      )}
    </motion.button>
  )
}

// ─── Attract bird card (in directory / strategy views) ───────────────────────

function AttractBirdCard({
  bird,
  isFavourite,
  isDiscouraged,
  isConflict,
  onTap,
  onToggleFavourite,
}: {
  bird: BirdSpecies
  isFavourite: boolean
  isDiscouraged: boolean
  isConflict: boolean
  onTap: () => void
  onToggleFavourite: () => void
}) {
  const entry = ATTRACT_DATA[bird.name]!
  const meta = TIER_META[entry.tier]

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className={cn(
        'rounded-2xl overflow-hidden border transition-all duration-200',
        isDiscouraged ? 'opacity-60' : '',
        isFavourite
          ? 'border-[var(--blue)] ring-1 ring-[var(--blue)] ring-opacity-30'
          : 'border-[var(--border-s)]',
      )}
      style={{ background: 'var(--card)' }}
    >
      {/* Image */}
      <button onClick={onTap} className="block w-full relative">
        <div className="aspect-square w-full bg-[var(--elev)]">
          {bird.imageUrl
            ? <img src={bird.imageUrl} alt={bird.name} className="w-full h-full object-cover" />
            : <Leaf size={24} className="text-[var(--t4)] absolute inset-0 m-auto" />
          }
        </div>
        {/* Tier badge */}
        <div className="absolute top-2 left-2">
          <TierBadge tier={entry.tier} small />
        </div>
        {/* Conflict warning */}
        {isConflict && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'var(--red-sub)', border: '1px solid var(--red)' }}>
            <AlertTriangle size={10} className="text-[var(--red-t)]" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-12"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
      </button>

      {/* Footer */}
      <div className="px-2.5 py-2 flex items-center gap-1.5">
        <button onClick={onTap} className="flex-1 text-left min-w-0">
          <p className="text-[12px] font-semibold text-[var(--t1)] leading-tight line-clamp-1">{bird.name}</p>
          <p className="text-[10px] text-[var(--t3)] mt-0.5 line-clamp-1">
            {entry.foods.slice(0, 2).map(f => f.emoji).join(' ')} {entry.foods[0]?.item}
          </p>
        </button>
        {/* Heart toggle */}
        <button
          onClick={onToggleFavourite}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors"
          style={{
            background: isFavourite ? 'var(--blue-sub)' : 'var(--elev)',
          }}
          aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Heart
            size={13}
            strokeWidth={2}
            className={isFavourite ? 'fill-[var(--blue)] text-[var(--blue)]' : 'text-[var(--t3)]'}
          />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Bird detail sheet ────────────────────────────────────────────────────────

function AttractBirdSheet({
  bird,
  isFavourite,
  onClose,
  onToggleFavourite,
}: {
  bird: BirdSpecies | null
  isFavourite: boolean
  onClose: () => void
  onToggleFavourite: () => void
}) {
  const entry = bird ? ATTRACT_DATA[bird.name] : null

  return (
    <BottomSheet open={!!bird} onClose={onClose} maxHeight="92dvh">
      {bird && entry && (
        <div className="pb-8">
          {/* Hero image */}
          {bird.imageUrl && (
            <div className="w-full h-48 overflow-hidden">
              <img src={bird.imageUrl} alt={bird.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="px-6 pt-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex-1 min-w-0">
                <h2 className="text-[22px] font-bold text-[var(--t1)] leading-tight">{bird.name}</h2>
                <p className="text-[13px] italic text-[var(--t3)]">{bird.scientificName}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <TierBadge tier={entry.tier} />
                <button
                  onClick={onToggleFavourite}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors border',
                    isFavourite
                      ? 'bg-[var(--blue-sub)] border-[var(--blue)] text-[var(--blue-t)]'
                      : 'bg-[var(--elev)] border-[var(--border-s)] text-[var(--t2)]',
                  )}
                >
                  <Heart size={12} strokeWidth={2}
                    className={isFavourite ? 'fill-[var(--blue-t)] text-[var(--blue-t)]' : ''} />
                  {isFavourite ? 'Favourite' : 'Add to favourites'}
                </button>
              </div>
            </div>

            {/* Tier explanation */}
            <div className="mt-3 mb-4 px-3 py-2.5 rounded-xl"
              style={{ background: TIER_META[entry.tier].bg }}>
              <p className="text-[12px] font-medium" style={{ color: TIER_META[entry.tier].color }}>
                {TIER_META[entry.tier].description}
              </p>
            </div>

            {/* Conflict warning */}
            {entry.conflictsWith && entry.conflictsWith.length > 0 && (
              <div className="mb-4 px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--red-sub)', border: '1px solid var(--red)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={13} className="text-[var(--red-t)] shrink-0" />
                  <p className="text-[12px] font-bold text-[var(--red-t)]">Conflict warning</p>
                </div>
                <p className="text-[12px] text-[var(--red-t)] leading-relaxed">
                  {entry.conflictReason}
                </p>
                <p className="text-[11px] text-[var(--red-t)] mt-1 opacity-80">
                  May threaten: {entry.conflictsWith.join(', ')}
                </p>
              </div>
            )}

            {/* How to feed */}
            <Section title="How to Feed" icon="🍽️">
              <p className="text-[13px] text-[var(--t2)] mb-3 leading-relaxed">{entry.feederType}</p>
              <div className="flex flex-wrap gap-2">
                {entry.foods.map(f => (
                  <span key={f.item}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
                    style={{ background: 'var(--elev)', color: 'var(--t1)' }}>
                    {f.emoji} {f.item}
                  </span>
                ))}
              </div>
            </Section>

            {/* Garden tips */}
            <Section title="Garden Tips" icon="🌿">
              <ul className="flex flex-col gap-2.5">
                {entry.gardenTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: 'var(--green-sub)' }}>
                      <Check size={10} strokeWidth={3} className="text-[var(--green-t)]" />
                    </div>
                    <p className="text-[13px] text-[var(--t2)] leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Nesting */}
            {entry.nestingNote && (
              <Section title="Nesting Advice" icon="🏠">
                <p className="text-[13px] text-[var(--t2)] leading-relaxed">{entry.nestingNote}</p>
              </Section>
            )}

            {/* Good companions */}
            {entry.goodWith && entry.goodWith.length > 0 && (
              <Section title="Good Companions" icon="🤝">
                <p className="text-[12px] text-[var(--t3)] mb-2">These species coexist well in the same garden:</p>
                <div className="flex flex-wrap gap-2">
                  {entry.goodWith.map(name => (
                    <span key={name}
                      className="px-2.5 py-1 rounded-full text-[12px] font-semibold"
                      style={{ background: 'var(--elev)', color: 'var(--t2)' }}>
                      {name}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Season note */}
            {entry.seasonNote && (
              <div className="mt-4 px-3 py-2.5 rounded-xl flex items-start gap-2"
                style={{ background: 'var(--elev)' }}>
                <Info size={13} className="text-[var(--t3)] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[var(--t3)] leading-relaxed">{entry.seasonNote}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--t3)] mb-3 flex items-center gap-1.5">
        <span>{icon}</span>{title}
      </h3>
      {children}
    </div>
  )
}

// ─── Setup Sheet ──────────────────────────────────────────────────────────────

function SetupSheet({
  open, onClose, gardenBirds,
}: {
  open: boolean
  onClose: () => void
  gardenBirds: BirdSpecies[]
}) {
  const { setup, update, toggleFeature, toggleFavourite } = useGardenSetup()
  const [step, setStep] = useState(0)

  const steps = ['Where are you?', 'Your garden', 'Favourite birds']
  const isLastStep = step === steps.length - 1
  const canNext = step === 0
    ? setup.region !== null
    : step === 1
      ? true
      : true

  function handleClose() {
    setStep(0)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title="Garden Setup" maxHeight="92dvh">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-2">
        {steps.map((_, i) => (
          <div key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              background: i <= step ? 'var(--blue)' : 'var(--border)',
            }} />
        ))}
      </div>

      <div className="px-6 pb-6">
        <h3 className="text-[18px] font-bold text-[var(--t1)] mb-1">{steps[step]}</h3>

        {/* Step 0 — Region */}
        {step === 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[13px] text-[var(--t2)] mb-3">
              We'll use this to show birds that are realistic visitors in your area.
            </p>
            {REGIONS.map(r => (
              <button
                key={r.value}
                onClick={() => update({ region: r.value })}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                  setup.region === r.value
                    ? 'border-[var(--blue)] bg-[var(--blue-sub)]'
                    : 'border-[var(--border-s)] bg-[var(--elev)]',
                )}
              >
                <span className="text-xl">{r.emoji}</span>
                <span className={cn(
                  'text-[14px] font-semibold',
                  setup.region === r.value ? 'text-[var(--blue-t)]' : 'text-[var(--t1)]',
                )}>{r.label}</span>
                {setup.region === r.value && (
                  <Check size={14} className="text-[var(--blue-t)] ml-auto" strokeWidth={2.5} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Step 1 — Garden features */}
        {step === 1 && (
          <div className="mt-4">
            <p className="text-[13px] text-[var(--t2)] mb-4">
              Tick everything your garden has — this helps us match birds to what you can realistically offer.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FEATURES.map(f => {
                const active = setup.features.includes(f.value)
                return (
                  <button
                    key={f.value}
                    onClick={() => toggleFeature(f.value)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition-all',
                      active
                        ? 'border-[var(--blue)] bg-[var(--blue-sub)]'
                        : 'border-[var(--border-s)] bg-[var(--elev)]',
                    )}
                  >
                    <span className="text-lg">{f.emoji}</span>
                    <span className={cn(
                      'text-[13px] font-semibold leading-tight',
                      active ? 'text-[var(--blue-t)]' : 'text-[var(--t1)]',
                    )}>{f.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2 — Favourite birds */}
        {step === 2 && (
          <div className="mt-4">
            <p className="text-[13px] text-[var(--t2)] mb-4">
              Tap the birds you'd love to see in your garden. We'll build a personal strategy around them.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {gardenBirds.map(bird => (
                <BirdPickCard
                  key={bird.id}
                  bird={bird}
                  selected={setup.favourites.includes(bird.name)}
                  onToggle={() => toggleFavourite(bird.name)}
                />
              ))}
            </div>
            {setup.favourites.length > 0 && (
              <p className="text-[12px] text-[var(--t3)] mt-3 text-center">
                {setup.favourites.length} bird{setup.favourites.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 mt-6">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 h-11 rounded-xl border border-[var(--border-s)] text-[14px] font-semibold text-[var(--t2)]"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (isLastStep) handleClose()
              else setStep(s => s + 1)
            }}
            disabled={!canNext}
            className="flex-1 h-11 rounded-xl text-[14px] font-bold text-white disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--blue)' }}
          >
            {isLastStep ? 'Save my strategy' : 'Next'}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Strategy tab ─────────────────────────────────────────────────────────────

function StrategyTab({
  gardenBirds,
  onBirdTap,
  onToggleFavourite,
  onToggleDiscourage,
  onOpenSetup,
  favourites,
  discourage,
  isConfigured,
}: {
  gardenBirds: BirdSpecies[]
  onBirdTap: (b: BirdSpecies) => void
  onToggleFavourite: (name: string) => void
  onToggleDiscourage: (name: string) => void
  onOpenSetup: () => void
  favourites: string[]
  discourage: string[]
  isConfigured: boolean
}) {
  const conflicts = useConflicts(favourites, gardenBirds)
  const shoppingList = useShoppingList(favourites)
  const favouriteBirds = gardenBirds.filter(b => favourites.includes(b.name))
  const otherBirds = gardenBirds.filter(b => !favourites.includes(b.name) && !discourage.includes(b.name))

  // Warn birds that conflict with favourites but aren't yet discouraged
  const unconflictedThreats = conflicts.filter(c => !discourage.includes(c.threatBird.name))

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'var(--blue-sub)' }}>
          <Leaf size={28} className="text-[var(--blue-t)]" />
        </div>
        <h2 className="text-[20px] font-bold text-[var(--t1)] mb-2">Build your garden strategy</h2>
        <p className="text-[14px] text-[var(--t2)] leading-relaxed mb-6">
          Tell us about your garden and your favourite birds. We'll build you a personalised plan to attract them.
        </p>
        <button
          onClick={onOpenSetup}
          className="h-12 px-8 rounded-xl text-[15px] font-bold text-white"
          style={{ background: 'var(--blue)' }}
        >
          Get started
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 pb-24 flex flex-col gap-6 pt-4">

      {/* No favourites yet */}
      {favourites.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center"
          style={{ background: 'var(--card)' }}>
          <Heart size={24} className="text-[var(--t4)] mx-auto mb-2" />
          <p className="text-[14px] font-semibold text-[var(--t1)] mb-1">No favourites yet</p>
          <p className="text-[13px] text-[var(--t3)] mb-4">
            Tap the ♥ on any bird card, or update your setup to pick your favourites.
          </p>
          <button onClick={onOpenSetup}
            className="h-9 px-5 rounded-full text-[13px] font-semibold border border-[var(--blue)] text-[var(--blue-t)]">
            Pick favourites
          </button>
        </div>
      )}

      {/* Conflict alerts */}
      {unconflictedThreats.length > 0 && (
        <div>
          <SectionHeader title="⚠️ Watch Out For" subtitle="These birds are likely to visit but may threaten your favourites" />
          <div className="flex flex-col gap-3 mt-3">
            {unconflictedThreats.map(({ threatBird, entry, victims }) => (
              <div key={threatBird.id}
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: 'var(--red)', background: 'var(--card)' }}>
                <div className="flex items-center gap-3 p-3">
                  {threatBird.imageUrl && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                      <img src={threatBird.imageUrl} alt={threatBird.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[14px] font-bold text-[var(--t1)]">{threatBird.name}</p>
                      <TierBadge tier={entry.tier} small />
                    </div>
                    <p className="text-[11px] text-[var(--red-t)] leading-snug">
                      Threatens: {victims.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="px-3 pb-3">
                  <p className="text-[12px] text-[var(--t2)] leading-relaxed mb-2">{entry.conflictReason}</p>
                  <button
                    onClick={() => onToggleDiscourage(threatBird.name)}
                    className="h-8 px-4 rounded-full text-[12px] font-semibold border"
                    style={{ borderColor: 'var(--red)', color: 'var(--red-t)', background: 'var(--red-sub)' }}
                  >
                    Mark as discourage — see deterrent tips
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your favourites */}
      {favouriteBirds.length > 0 && (
        <div>
          <SectionHeader title="❤️ Your Favourites" subtitle="Tap any bird for your personalised attraction plan" />
          <div className="grid grid-cols-2 gap-3 mt-3">
            {favouriteBirds.map(bird => (
              <AttractBirdCard
                key={bird.id}
                bird={bird}
                isFavourite
                isDiscouraged={false}
                isConflict={false}
                onTap={() => onBirdTap(bird)}
                onToggleFavourite={() => onToggleFavourite(bird.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Shopping list */}
      {shoppingList.length > 0 && (
        <div>
          <SectionHeader title="🛒 Your Shopping List" subtitle="Everything you need to attract your favourite birds" />
          <div className="mt-3 rounded-2xl border border-[var(--border-s)] overflow-hidden"
            style={{ background: 'var(--card)' }}>
            {shoppingList.map((item, i) => (
              <div key={item}
                className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-[var(--border-s)]')}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--green)' }} />
                <span className="text-[13px] font-medium text-[var(--t1)]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discourage list */}
      {discourage.length > 0 && (
        <div>
          <SectionHeader title="🚫 Birds to Discourage" subtitle="Tap a bird for deterrent tips; tap × to remove from list" />
          <div className="flex flex-col gap-2 mt-3">
            {gardenBirds.filter(b => discourage.includes(b.name)).map(bird => {
              const entry = ATTRACT_DATA[bird.name]!
              return (
                <div key={bird.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border-s)]"
                  style={{ background: 'var(--card)' }}>
                  {bird.imageUrl && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      <img src={bird.imageUrl} alt={bird.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <button onClick={() => onBirdTap(bird)} className="flex-1 text-left min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--t1)]">{bird.name}</p>
                    <p className="text-[11px] text-[var(--t3)]">{TIER_META[entry.tier].label} · Tap for deterrent tips</p>
                  </button>
                  <button onClick={() => onToggleDiscourage(bird.name)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--elev)' }}>
                    <X size={12} className="text-[var(--t3)]" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All other likely visitors */}
      {otherBirds.length > 0 && (
        <div>
          <SectionHeader
            title="🐦 Other Likely Visitors"
            subtitle="All birds with a good chance of visiting your garden. Tap ♥ to add to favourites."
          />
          <div className="grid grid-cols-2 gap-3 mt-3">
            {otherBirds.map(bird => {
              const isConflict = conflicts.some(c => c.threatBird.id === bird.id)
              return (
                <AttractBirdCard
                  key={bird.id}
                  bird={bird}
                  isFavourite={false}
                  isDiscouraged={discourage.includes(bird.name)}
                  isConflict={isConflict}
                  onTap={() => onBirdTap(bird)}
                  onToggleFavourite={() => onToggleFavourite(bird.name)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Feeding guide tab ────────────────────────────────────────────────────────

function FeedingTab() {
  return (
    <div className="px-4 pb-24 pt-4 flex flex-col gap-4">
      {FOOD_GUIDE.map(entry => (
        <div key={entry.food}
          className="rounded-2xl border border-[var(--border-s)] overflow-hidden"
          style={{ background: 'var(--card)' }}>
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{entry.emoji}</span>
              <h3 className="text-[16px] font-bold text-[var(--t1)]">{entry.food}</h3>
            </div>
            <p className="text-[13px] text-[var(--t2)] leading-relaxed mb-3">{entry.description}</p>
            <p className="text-[12px] font-semibold text-[var(--t3)] mb-2 uppercase tracking-wide">Tip</p>
            <p className="text-[12px] text-[var(--t2)] leading-relaxed">{entry.feederTip}</p>
            {entry.avoid && (
              <div className="mt-3 px-3 py-2 rounded-xl"
                style={{ background: 'var(--amber-sub)', border: '1px solid var(--amber)' }}>
                <p className="text-[11px] font-bold text-[var(--amber-t)] mb-0.5">⚠️ Avoid</p>
                <p className="text-[11px] text-[var(--amber-t)] leading-relaxed">{entry.avoid}</p>
              </div>
            )}
          </div>
          <div className="border-t border-[var(--border-s)] px-4 py-3">
            <p className="text-[11px] font-bold text-[var(--t4)] uppercase tracking-wide mb-2">Attracts</p>
            <div className="flex flex-wrap gap-1.5">
              {entry.attractsBirds.map(name => (
                <span key={name}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: 'var(--elev)', color: 'var(--t2)' }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Garden features */}
      <h2 className="text-[18px] font-bold text-[var(--t1)] mt-2 mb-1 px-1">Garden Features</h2>
      <p className="text-[13px] text-[var(--t2)] px-1 mb-2">
        The right habitat matters as much as food. Here's what to plant or build.
      </p>
      {GARDEN_FEATURES.map(gf => (
        <div key={gf.feature}
          className="rounded-2xl border border-[var(--border-s)] p-4"
          style={{ background: 'var(--card)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{gf.emoji}</span>
            <h3 className="text-[15px] font-bold text-[var(--t1)]">{gf.feature}</h3>
          </div>
          <p className="text-[13px] text-[var(--t2)] leading-relaxed mb-3">{gf.tip}</p>
          <div className="flex flex-wrap gap-1.5">
            {gf.benefitsBirds.map(name => (
              <span key={name}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ background: 'var(--elev)', color: 'var(--t2)' }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Hierarchy tab ────────────────────────────────────────────────────────────

function HierarchyTab({ gardenBirds, onBirdTap }: { gardenBirds: BirdSpecies[]; onBirdTap: (b: BirdSpecies) => void }) {
  const byTier = useMemo(() => {
    const map: Record<HierarchyTier, BirdSpecies[]> = {
      apex: [], dominant: [], assertive: [], moderate: [], shy: [],
    }
    for (const bird of gardenBirds) {
      const entry = ATTRACT_DATA[bird.name]
      if (entry) map[entry.tier].push(bird)
    }
    return map
  }, [gardenBirds])

  return (
    <div className="px-4 pb-24 pt-4 flex flex-col gap-5">
      {/* Explainer */}
      <div className="rounded-2xl p-4 border border-[var(--border-s)]" style={{ background: 'var(--card)' }}>
        <h3 className="text-[15px] font-bold text-[var(--t1)] mb-2">How the pecking order works</h3>
        <p className="text-[13px] text-[var(--t2)] leading-relaxed">
          Garden birds have a clear social hierarchy. Dominant species displace subordinates at feeders,
          sometimes for hours. Understanding this helps you design a garden where shy, gentle birds can
          thrive alongside — or instead of — the boldest ones.
        </p>
      </div>

      {TIER_ORDER.map(tier => {
        const birds = byTier[tier]
        if (birds.length === 0) return null
        const meta = TIER_META[tier]

        return (
          <div key={tier}>
            {/* Tier header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border-s)' }} />
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border"
                style={{ background: meta.bg, color: meta.color, borderColor: meta.color + '44' }}>
                {meta.label}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-s)' }} />
            </div>
            <p className="text-[12px] text-[var(--t3)] text-center mb-3 px-4">{meta.description}</p>

            {/* Birds in this tier */}
            <div className="rounded-2xl border border-[var(--border-s)] overflow-hidden"
              style={{ background: 'var(--card)' }}>
              {birds.map((bird, i) => {
                const entry = ATTRACT_DATA[bird.name]!
                const hasConflicts = entry.conflictsWith && entry.conflictsWith.length > 0
                return (
                  <button
                    key={bird.id}
                    onClick={() => onBirdTap(bird)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5',
                      i > 0 && 'border-t border-[var(--border-s)]',
                    )}
                  >
                    {bird.imageUrl && (
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                        <img src={bird.imageUrl} alt={bird.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--t1)]">{bird.name}</p>
                      {hasConflicts && (
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--red-t)' }}>
                          ⚠️ Threatens: {entry.conflictsWith!.slice(0, 3).join(', ')}
                          {entry.conflictsWith!.length > 3 ? '…' : ''}
                        </p>
                      )}
                      {!hasConflicts && (
                        <p className="text-[11px] text-[var(--t4)] mt-0.5">
                          {entry.foods.slice(0, 2).map(f => f.emoji).join(' ')} {entry.foods[0]?.item}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-[var(--t4)] shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Key conflicts summary */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--red)', background: 'var(--card)' }}>
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-[15px] font-bold text-[var(--t1)] mb-1">⚠️ Key conflict pairs</h3>
          <p className="text-[13px] text-[var(--t2)] leading-relaxed">
            These combinations need careful management in a balanced garden.
          </p>
        </div>
        {[
          { threat: 'Magpie', victims: 'Robin, Blackbird, Blue Tit', action: 'Use prickly hedges and metal nest box hole guards' },
          { threat: 'Jay', victims: 'Robin, Blue Tit, Song Thrush', action: 'Dense cover for nests; most risk in May–June' },
          { threat: 'Sparrowhawk', victims: 'Most small birds', action: 'Dense escape shrubs near feeders — cannot be prevented' },
          { threat: 'Starling flocks', victims: 'Coal Tit, Nuthatch', action: 'Caged feeders with small openings exclude starlings' },
          { threat: 'Woodpecker', victims: 'Blue Tit, Great Tit (nests)', action: 'Metal hole guards on all nest boxes' },
        ].map((c, i) => (
          <div key={c.threat}
            className={cn('px-4 py-3', i > 0 && 'border-t border-[var(--border-s)]')}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-[13px] font-bold text-[var(--t1)]">{c.threat}</span>
              <span className="text-[11px] text-[var(--red-t)] shrink-0">→ {c.victims}</span>
            </div>
            <p className="text-[12px] text-[var(--t3)] leading-relaxed">💡 {c.action}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-1">
      <h2 className="text-[16px] font-bold text-[var(--t1)]">{title}</h2>
      {subtitle && <p className="text-[12px] text-[var(--t3)] mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ─── AttractScreen ────────────────────────────────────────────────────────────

export function AttractScreen() {
  const [activeTab, setActiveTab] = useState<AttractTab>('strategy')
  const [setupOpen, setSetupOpen] = useState(false)
  const [selectedBird, setSelectedBird] = useState<BirdSpecies | null>(null)

  const { setup, isConfigured, toggleFavourite, toggleDiscourage } = useGardenSetup()
  const gardenBirds = useGardenBirds()

  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    setHeaderHeight(el.offsetHeight)
    const ro = new ResizeObserver(([e]) => setHeaderHeight(e.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const TABS: { id: AttractTab; label: string }[] = [
    { id: 'strategy', label: 'Strategy' },
    { id: 'feeding',  label: 'Feeding'  },
    { id: 'hierarchy', label: 'Hierarchy' },
  ]

  const regionLabel = REGIONS.find(r => r.value === setup.region)?.label ?? 'Set location'

  return (
    <div className="relative h-full bg-[var(--bg)]">

      {/* Scrollable content */}
      <div className="absolute inset-0 overflow-y-auto" style={{ paddingTop: headerHeight }}>
        <AnimatePresence mode="wait">
          {activeTab === 'strategy' && (
            <motion.div key="strategy"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}>
              <StrategyTab
                gardenBirds={gardenBirds}
                onBirdTap={setSelectedBird}
                onToggleFavourite={toggleFavourite}
                onToggleDiscourage={toggleDiscourage}
                onOpenSetup={() => setSetupOpen(true)}
                favourites={setup.favourites}
                discourage={setup.discourage}
                isConfigured={isConfigured}
              />
            </motion.div>
          )}
          {activeTab === 'feeding' && (
            <motion.div key="feeding"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}>
              <FeedingTab />
            </motion.div>
          )}
          {activeTab === 'hierarchy' && (
            <motion.div key="hierarchy"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}>
              <HierarchyTab gardenBirds={gardenBirds} onBirdTap={setSelectedBird} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating header */}
      <div ref={headerRef} className="absolute top-0 left-0 right-0 z-[100]">
        <PageHeader
          title="Attract"
          centre={
            <div className="flex rounded-[var(--r-pill)] overflow-hidden border border-[var(--border-s)] bg-[var(--card)]">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'h-9 px-3 text-[12px] font-semibold transition-colors duration-150',
                    activeTab === tab.id
                      ? 'bg-[var(--blue-sub)] text-[var(--blue-t)]'
                      : 'text-[var(--t2)] hover:text-[var(--t1)]',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          }
          rightAction={
            <button
              onClick={() => setSetupOpen(true)}
              className={cn(
                'h-9 flex items-center gap-1.5 px-3 rounded-full text-[12px] font-semibold transition-colors border',
                isConfigured
                  ? 'border-[var(--border-s)] text-[var(--t2)] bg-[var(--card)]'
                  : 'border-[var(--blue)] text-[var(--blue-t)] bg-[var(--blue-sub)]',
              )}
            >
              {isConfigured
                ? <><Settings2 size={14} strokeWidth={2} />{regionLabel}</>
                : <><Star size={14} strokeWidth={2} />Set up</>
              }
            </button>
          }
        />
      </div>

      {/* Setup sheet */}
      <SetupSheet
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        gardenBirds={gardenBirds}
      />

      {/* Bird detail sheet */}
      <AttractBirdSheet
        bird={selectedBird}
        isFavourite={selectedBird ? setup.favourites.includes(selectedBird.name) : false}
        onClose={() => setSelectedBird(null)}
        onToggleFavourite={() => selectedBird && toggleFavourite(selectedBird.name)}
      />
    </div>
  )
}
