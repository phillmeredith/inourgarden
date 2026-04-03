// AddSightingSheet — bottom sheet for logging a new garden sighting
// Search/select a bird, set date/time/count/notes/weather, save
// Uses the shared BottomSheet component with glass treatment

import { useState, useMemo, useRef } from 'react'
import {
  Search, Camera, X, ChevronRight, Check, Calendar,
  Clock, Hash, FileText, Cloud,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomSheet } from '../ui/BottomSheet'
import { BIRDS } from '../../data/birds'
import { todayString } from '../../lib/db'
import { cn } from '../../lib/utils'
import type { BirdSpecies } from '../../data/birds'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddSightingSheetProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    birdId: string
    date: string
    time: string | null
    count: number
    notes: string | null
    weather: string | null
    photo: string | null
  }) => void
  /** Pre-select a bird when opening from a bird detail context */
  preselectedBirdId?: string | null
}

type Step = 'select-bird' | 'details'

// ─── Component ────────────────────────────────────────────────────────────────

export function AddSightingSheet({
  open,
  onClose,
  onSave,
  preselectedBirdId = null,
}: AddSightingSheetProps) {
  // ─── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(preselectedBirdId ? 'details' : 'select-bird')
  const [selectedBird, setSelectedBird] = useState<BirdSpecies | null>(
    preselectedBirdId ? BIRDS.find(b => b.id === preselectedBirdId) ?? null : null,
  )
  const [query, setQuery] = useState('')
  const [date, setDate] = useState(todayString())
  const [time, setTime] = useState('')
  const [count, setCount] = useState(1)
  const [notes, setNotes] = useState('')
  const [weather, setWeather] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Filtered bird list ───────────────────────────────────────────────────
  const filteredBirds = useMemo(() => {
    if (!query.trim()) return BIRDS
    const q = query.toLowerCase().trim()
    return BIRDS.filter(
      b =>
        b.name.toLowerCase().includes(q) ||
        b.scientificName.toLowerCase().includes(q) ||
        b.family.toLowerCase().includes(q),
    )
  }, [query])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function handleSelectBird(bird: BirdSpecies) {
    setSelectedBird(bird)
    setStep('details')
    setQuery('')
  }

  function handleSave() {
    if (!selectedBird) return

    onSave({
      birdId: selectedBird.id,
      date,
      time: time || null,
      count: Math.max(1, count),
      notes: notes.trim() || null,
      weather: weather.trim() || null,
      photo,
    })

    // Reset form
    resetForm()
    onClose()
  }

  function resetForm() {
    setStep(preselectedBirdId ? 'details' : 'select-bird')
    setSelectedBird(
      preselectedBirdId ? BIRDS.find(b => b.id === preselectedBirdId) ?? null : null,
    )
    setQuery('')
    setDate(todayString())
    setTime('')
    setCount(1)
    setNotes('')
    setWeather('')
    setPhoto(null)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setPhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleBack() {
    if (step === 'details' && !preselectedBirdId) {
      setStep('select-bird')
      setSelectedBird(null)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <BottomSheet open={open} onClose={handleClose} title="Add Sighting" maxHeight="90vh">
      <div className="px-6 py-4 flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {step === 'select-bird' ? (
            <motion.div
              key="select-bird"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-3"
            >
              {/* Search input */}
              <div className="relative">
                <Search
                  size={16}
                  strokeWidth={2}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--t4)]"
                />
                <input
                  type="text"
                  placeholder="Search birds..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                  className={cn(
                    'w-full h-11 pl-10 pr-4 rounded-xl text-[14px] text-[var(--t1)]',
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

              {/* Bird list */}
              <div className="flex flex-col max-h-[50vh] overflow-y-auto overscroll-contain rounded-xl border border-[var(--border-s)]">
                {filteredBirds.length === 0 ? (
                  <div className="py-10 text-center text-[13px] text-[var(--t3)]">
                    No birds match your search
                  </div>
                ) : (
                  filteredBirds.map((bird, i) => (
                    <button
                      key={bird.id}
                      onClick={() => handleSelectBird(bird)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-left transition-colors',
                        'hover:bg-[var(--elev)] active:bg-[var(--elev)]',
                        i > 0 && 'border-t border-[var(--border-s)]',
                      )}
                    >
                      {/* Conservation status dot */}
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          background:
                            bird.conservationStatus === 'Red'
                              ? 'var(--red)'
                              : bird.conservationStatus === 'Amber'
                                ? 'var(--amber)'
                                : 'var(--green)',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[var(--t1)] truncate">
                          {bird.name}
                        </p>
                        <p className="text-[11px] text-[var(--t3)] truncate">
                          {bird.scientificName}
                        </p>
                      </div>
                      <ChevronRight size={14} strokeWidth={2} className="text-[var(--t4)] shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4"
            >
              {/* Selected bird header */}
              {selectedBird && (
                <div className="flex items-center gap-3">
                  {!preselectedBirdId && (
                    <button
                      onClick={handleBack}
                      className="w-8 h-8 rounded-full bg-[var(--elev)] text-[var(--t3)] hover:text-[var(--t1)] transition-colors flex items-center justify-center shrink-0"
                    >
                      <ChevronRight size={14} strokeWidth={2} className="rotate-180" />
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-[var(--t1)] truncate">
                      {selectedBird.name}
                    </p>
                    <p className="text-[12px] text-[var(--t3)] italic truncate">
                      {selectedBird.scientificName}
                    </p>
                  </div>
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      background:
                        selectedBird.conservationStatus === 'Red'
                          ? 'var(--red)'
                          : selectedBird.conservationStatus === 'Amber'
                            ? 'var(--amber)'
                            : 'var(--green)',
                    }}
                  />
                </div>
              )}

              {/* Date + Time row */}
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Date" Icon={Calendar}>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    max={todayString()}
                    className={cn(
                      'w-full h-10 px-3 rounded-lg text-[13px] text-[var(--t1)]',
                      'bg-[var(--elev)] border border-[var(--border-s)]',
                      'outline-none focus:border-[var(--blue)] transition-colors',
                    )}
                  />
                </FieldGroup>
                <FieldGroup label="Time (optional)" Icon={Clock}>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className={cn(
                      'w-full h-10 px-3 rounded-lg text-[13px] text-[var(--t1)]',
                      'bg-[var(--elev)] border border-[var(--border-s)]',
                      'outline-none focus:border-[var(--blue)] transition-colors',
                    )}
                  />
                </FieldGroup>
              </div>

              {/* Count */}
              <FieldGroup label="How many?" Icon={Hash}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCount(c => Math.max(1, c - 1))}
                    className="w-10 h-10 rounded-lg bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t2)] text-[16px] font-bold flex items-center justify-center active:scale-[.95] transition-transform"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={count}
                    onChange={e => setCount(Math.max(1, Number(e.target.value) || 1))}
                    className={cn(
                      'w-16 h-10 px-3 rounded-lg text-center text-[14px] font-semibold text-[var(--t1)]',
                      'bg-[var(--elev)] border border-[var(--border-s)]',
                      'outline-none focus:border-[var(--blue)] transition-colors tabular-nums',
                    )}
                  />
                  <button
                    onClick={() => setCount(c => c + 1)}
                    className="w-10 h-10 rounded-lg bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t2)] text-[16px] font-bold flex items-center justify-center active:scale-[.95] transition-transform"
                  >
                    +
                  </button>
                </div>
              </FieldGroup>

              {/* Notes */}
              <FieldGroup label="Notes (optional)" Icon={FileText}>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="What were they doing?"
                  rows={2}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg text-[13px] text-[var(--t1)] resize-none',
                    'bg-[var(--elev)] border border-[var(--border-s)]',
                    'placeholder:text-[var(--t4)] outline-none',
                    'focus:border-[var(--blue)] transition-colors',
                  )}
                />
              </FieldGroup>

              {/* Weather */}
              <FieldGroup label="Weather (optional)" Icon={Cloud}>
                <input
                  type="text"
                  value={weather}
                  onChange={e => setWeather(e.target.value)}
                  placeholder="Sunny, overcast, drizzle..."
                  className={cn(
                    'w-full h-10 px-3 rounded-lg text-[13px] text-[var(--t1)]',
                    'bg-[var(--elev)] border border-[var(--border-s)]',
                    'placeholder:text-[var(--t4)] outline-none',
                    'focus:border-[var(--blue)] transition-colors',
                  )}
                />
              </FieldGroup>

              {/* Photo upload */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--t3)]">
                  Photo (optional)
                </span>
                {photo ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden">
                    <img src={photo} alt="Sighting photo" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPhoto(null)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                    >
                      <X size={10} strokeWidth={2.5} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-medium',
                      'bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t2)]',
                      'hover:border-[var(--border)] transition-colors',
                    )}
                  >
                    <Camera size={14} strokeWidth={2} />
                    Add photo
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={!selectedBird}
                className={cn(
                  'w-full h-12 rounded-[var(--r-pill)] text-[15px] font-semibold text-white',
                  'transition-all duration-200 active:scale-[.97]',
                  'disabled:opacity-40 disabled:pointer-events-none',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]',
                )}
                style={{ background: 'var(--blue)' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Check size={16} strokeWidth={2.5} />
                  Save Sighting
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BottomSheet>
  )
}

// ─── FieldGroup helper ────────────────────────────────────────────────────────

function FieldGroup({
  label,
  Icon,
  children,
}: {
  label: string
  Icon: React.ComponentType<{ size: number; strokeWidth: number; className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--t3)]">
        <Icon size={12} strokeWidth={2} className="text-[var(--t4)]" />
        {label}
      </span>
      {children}
    </div>
  )
}
