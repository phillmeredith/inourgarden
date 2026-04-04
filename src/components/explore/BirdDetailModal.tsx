// BirdDetailModal — full-screen modal with all bird details
// Scrollable sections: hero, at a glance, identification, sound, behaviour,
// nesting, diet, habitat, similar species, facts, and "mark as seen" CTA
// Uses FullScreenModal (portal-mounted, escapes stacking contexts)

import { X, Volume2, Eye, Feather, GitCompare, Egg, Utensils, MapPin, Lightbulb, Binoculars } from 'lucide-react'
import { FullScreenModal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { useBirdAudio } from '../../hooks/useBirdAudio'
import { useGardenSightings } from '../../hooks/useGardenSightings'
import { useWildSightings } from '../../hooks/useWildSightings'
import type { BirdSpecies } from '../../data/birds'

// ─── Conservation labels & pill tint pairs ──────────────────────────────────

const STATUS_LABEL: Record<string, string> = { Red: 'High concern', Amber: 'Declining', Green: 'Least concern' }

const CONSERVATION_PILL: Record<string, { bg: string; border: string; text: string }> = {
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

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size: number; strokeWidth: number; className?: string }>
  label: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} strokeWidth={2} className="text-[var(--blue-t)] shrink-0" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--t3)]">
        {label}
      </span>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface BirdDetailModalProps {
  bird: BirdSpecies | null
  onClose: () => void
  onSpotted: () => void
}

export function BirdDetailModal({ bird, onClose, onSpotted }: BirdDetailModalProps) {
  const { play, stop, isPlaying, currentUrl } = useBirdAudio()
  const { hasSeen, addSighting } = useGardenSightings()
  const { sightingsForBird } = useWildSightings()

  const isAlreadySeen = bird ? hasSeen(bird.id) : false
  const wildCount = bird ? sightingsForBird(bird.id).length : 0
  const conservationPill = bird ? CONSERVATION_PILL[bird.conservationStatus] : null

  function handlePlaySound(url: string) {
    if (isPlaying && currentUrl === url) {
      stop()
    } else {
      play(url)
    }
  }

  function handleClose() {
    stop()
    onClose()
  }

  async function handleMarkAsSeen() {
    if (!bird || isAlreadySeen) return
    await addSighting(bird.id)
  }

  return (
    <FullScreenModal open={!!bird} onClose={handleClose}>
      {bird && (
        <div className="min-h-full">
          {/* Sticky close button — positioned outside scroll content */}
          <div className="sticky top-0 z-10 flex justify-end p-4">
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
              style={{
                background: 'var(--elev)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
              aria-label="Close"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          <div className="px-6 pb-24 max-w-3xl mx-auto w-full -mt-14 pt-14">
            {/* Hero image */}
            <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden bg-[var(--elev)] mb-6">
              {bird.imageUrl ? (
                <img
                  src={bird.imageUrl}
                  alt={bird.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--t4)]">
                  No image available
                </div>
              )}
            </div>

            {/* Name + scientific name */}
            <h1 className="text-[28px] font-bold text-[var(--t1)] leading-tight mb-1">
              {bird.name}
            </h1>
            <p className="text-[16px] italic text-[var(--t3)] leading-snug mb-4">
              {bird.scientificName}
            </p>

            {/* ─── At a Glance ──────────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap mb-6">
              {/* Conservation status pill */}
              {conservationPill && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--r-pill)]',
                    'text-[12px] font-bold border',
                    conservationPill.bg,
                    conservationPill.border,
                    conservationPill.text,
                  )}
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      bird.conservationStatus === 'Red' ? 'bg-[var(--red)]' : bird.conservationStatus === 'Amber' ? 'bg-[var(--amber)]' : 'bg-[var(--green)]',
                    )}
                  />
                  {STATUS_LABEL[bird.conservationStatus] ?? bird.conservationStatus}
                </span>
              )}

              {/* Seasonality */}
              <span className="inline-flex items-center px-3 py-1 rounded-[var(--r-pill)] text-[12px] font-semibold bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t2)]">
                {bird.seasonality}
              </span>

              {/* Size */}
              <span className="inline-flex items-center px-3 py-1 rounded-[var(--r-pill)] text-[12px] font-semibold bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t2)]">
                {bird.size}
              </span>

              {/* Family */}
              <span className="inline-flex items-center px-3 py-1 rounded-[var(--r-pill)] text-[12px] font-semibold bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t2)]">
                {bird.family}
              </span>

              {/* Garden bird indicator */}
              {bird.gardenBird && (
                <span className="inline-flex items-center px-3 py-1 rounded-[var(--r-pill)] text-[12px] font-semibold bg-[var(--green-sub)] border border-[var(--green)] text-[var(--green-t)]">
                  Garden bird
                </span>
              )}
            </div>

            {/* ─── Identification ────────────────────────────────────────── */}
            <section className="mb-8">
              <SectionHeading icon={Feather} label="Identification" />
              <div className="flex flex-col gap-3">
                {bird.identification.male && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--t3)]">Male</span>
                    <p className="text-[14px] text-[var(--t2)] leading-relaxed mt-0.5">{bird.identification.male}</p>
                  </div>
                )}
                {bird.identification.female && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--t3)]">Female</span>
                    <p className="text-[14px] text-[var(--t2)] leading-relaxed mt-0.5">{bird.identification.female}</p>
                  </div>
                )}
                {bird.identification.juvenile && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--t3)]">Juvenile</span>
                    <p className="text-[14px] text-[var(--t2)] leading-relaxed mt-0.5">{bird.identification.juvenile}</p>
                  </div>
                )}
                {bird.identification.flight && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--t3)]">In flight</span>
                    <p className="text-[14px] text-[var(--t2)] leading-relaxed mt-0.5">{bird.identification.flight}</p>
                  </div>
                )}
              </div>
            </section>

            {/* ─── Sound ─────────────────────────────────────────────────── */}
            {bird.sounds.length > 0 && (
              <section className="mb-8">
                <SectionHeading icon={Volume2} label="Sound" />
                <div className="flex flex-wrap gap-2">
                  {bird.sounds.map(sound => {
                    const isCurrent = isPlaying && currentUrl === sound.url
                    return (
                      <button
                        key={sound.url}
                        onClick={() => handlePlaySound(sound.url)}
                        className={cn(
                          'flex items-center gap-2 px-4 h-10 rounded-[var(--r-pill)]',
                          'text-[13px] font-semibold transition-colors duration-150 border',
                          isCurrent
                            ? 'bg-[var(--blue-sub)] border-[var(--blue)] text-[var(--blue-t)]'
                            : 'bg-[var(--card)] border-[var(--border-s)] text-[var(--t2)]',
                        )}
                      >
                        <Volume2 size={14} strokeWidth={2} aria-hidden="true" />
                        {isCurrent ? `Stop ${sound.label}` : `Play ${sound.label}`}
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ─── Behaviour ─────────────────────────────────────────────── */}
            <section className="mb-8">
              <SectionHeading icon={Feather} label="Behaviour" />
              <p className="text-[14px] text-[var(--t2)] leading-relaxed">{bird.behaviour}</p>
            </section>

            {/* ─── Nesting ───────────────────────────────────────────────── */}
            <section className="mb-8">
              <SectionHeading icon={Egg} label="Nesting" />
              <p className="text-[14px] text-[var(--t2)] leading-relaxed">{bird.nesting}</p>
            </section>

            {/* ─── Diet ──────────────────────────────────────────────────── */}
            <section className="mb-8">
              <SectionHeading icon={Utensils} label="Diet" />
              <p className="text-[14px] text-[var(--t2)] leading-relaxed">{bird.diet}</p>
            </section>

            {/* ─── Habitat ───────────────────────────────────────────────── */}
            <section className="mb-8">
              <SectionHeading icon={MapPin} label="Habitat" />
              <p className="text-[14px] text-[var(--t2)] leading-relaxed">{bird.habitat}</p>
            </section>

            {/* ─── Similar Species ────────────────────────────────────────── */}
            {bird.similarSpecies.length > 0 && (
              <section className="mb-8">
                <SectionHeading icon={GitCompare} label="Similar Species" />
                <div className="flex flex-col gap-3">
                  {bird.similarSpecies.map(sp => (
                    <div
                      key={sp.name}
                      className="p-4 rounded-[var(--r-lg)] bg-[var(--card)] border border-[var(--border-s)]"
                    >
                      <span className="text-[14px] font-semibold text-[var(--t1)] block mb-1">
                        {sp.name}
                      </span>
                      <p className="text-[13px] text-[var(--t2)] leading-snug">{sp.tip}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── Facts ─────────────────────────────────────────────────── */}
            {bird.facts.length > 0 && (
              <section className="mb-8">
                <SectionHeading icon={Lightbulb} label="Facts" />
                <div className="flex flex-col gap-3">
                  {bird.facts.map((fact, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-[var(--r-lg)] bg-[var(--card)] border border-[var(--border-s)]"
                    >
                      <p className="text-[14px] text-[var(--t2)] leading-relaxed">{fact}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── CTA buttons ──────────────────────────────────────────── */}
            <div className="sticky bottom-0 pb-6 pt-4 -mx-6 px-6 flex flex-col gap-2" style={{ background: 'var(--bg)' }}>
              <Button
                variant={isAlreadySeen ? 'secondary' : 'primary'}
                size="lg"
                className="w-full"
                disabled={isAlreadySeen}
                onClick={handleMarkAsSeen}
              >
                <span className="flex items-center gap-2">
                  <Eye size={18} strokeWidth={2} />
                  {isAlreadySeen ? 'Seen in our garden' : 'Mark as seen in our garden'}
                </span>
              </Button>

              <button
                onClick={onSpotted}
                className="w-full h-12 rounded-[var(--r-md)] text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors bg-[var(--purple-sub)] text-[var(--purple-t)] border border-transparent hover:border-[var(--purple)]"
              >
                <Binoculars size={18} strokeWidth={2} />
                {wildCount > 0 ? `Spotted in the wild (${wildCount})` : 'Spotted in the wild'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FullScreenModal>
  )
}
