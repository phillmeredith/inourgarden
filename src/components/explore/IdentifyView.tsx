// IdentifyView — bird identification with BirdRecon photo AI + manual filters
// Laura can upload/snap a photo for AI identification OR use size/colour filters

import { useRef } from 'react'
import { Binoculars, RotateCcw, Camera, Upload, Loader2, AlertCircle, Scan, Sparkles, Cpu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useIdentifyFilter } from '../../hooks/useIdentifyFilter'
import { useBirdRecon } from '../../hooks/useBirdRecon'
import type { BirdColor, SizeCategory } from '../../hooks/useIdentifyFilter'
import type { BirdSpecies } from '../../data/birds'

// ─── Color swatch mapping ───────────────────────────────────────────────────

const COLOR_SWATCH: Record<BirdColor, string> = {
  red: '#E53935',
  blue: '#1E88E5',
  green: '#43A047',
  yellow: '#FDD835',
  orange: '#FB8C00',
  brown: '#795548',
  black: '#212121',
  white: '#FAFAFA',
  grey: '#9E9E9E',
  pink: '#EC407A',
  purple: '#9C27B0',
}

// ─── Conservation badge colour ──────────────────────────────────────────────

function conservationColor(status: string) {
  if (status === 'Red') return 'var(--red)'
  if (status === 'Amber') return 'var(--amber)'
  return 'var(--green)'
}

// ─── Filter pill component ──────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onClick,
  swatch,
}: {
  label: string
  active: boolean
  onClick: () => void
  swatch?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-8 px-3 rounded-[var(--r-pill)] text-[12px] font-semibold border transition-colors duration-150 flex items-center gap-1.5 shrink-0',
        active
          ? 'bg-[var(--blue-sub)] border-[var(--blue)] text-[var(--blue-t)]'
          : 'bg-[var(--card)] border-[var(--border-s)] text-[var(--t2)] hover:text-[var(--t1)]',
      )}
    >
      {swatch && (
        <span
          className="w-3 h-3 rounded-full border border-white/20 shrink-0"
          style={{ background: swatch }}
        />
      )}
      {label}
    </button>
  )
}

// ─── Filter section ─────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--t3)] mb-2">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  )
}

// ─── Manual filter result row ───────────────────────────────────────────────

function ResultRow({
  bird,
  score,
  maxScore,
  onTap,
}: {
  bird: BirdSpecies
  score: number
  maxScore: number
  onTap: (bird: BirdSpecies) => void
}) {
  const pct = Math.round((score / maxScore) * 100)

  return (
    <button
      onClick={() => onTap(bird)}
      className="w-full flex items-center gap-3 p-3 rounded-[var(--r-lg)] bg-[var(--card)] border border-[var(--border-s)] hover:border-[var(--blue)] transition-colors text-left"
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--elev)] shrink-0">
        {bird.imageUrl ? (
          <img src={bird.imageUrl} alt={bird.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--t4)] text-[10px]">?</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[var(--t1)] truncate">{bird.name}</p>
        <p className="text-[12px] text-[var(--t3)] truncate">{bird.family} · {bird.size}</p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <div className="w-10 h-1.5 rounded-full bg-[var(--elev)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--blue)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-[var(--t3)] w-8 text-right">{pct}%</span>
      </div>
    </button>
  )
}

// ─── BirdRecon result card ──────────────────────────────────────────────────

function ReconResultCard({
  bird,
  confidence,
  reasoning,
  onTap,
  rank,
}: {
  bird: BirdSpecies
  confidence: number
  reasoning: string
  onTap: (bird: BirdSpecies) => void
  rank: number
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08 }}
      onClick={() => onTap(bird)}
      className="w-full flex items-start gap-3 p-3 rounded-[var(--r-lg)] bg-[var(--card)] border border-[var(--border-s)] hover:border-[var(--blue)] transition-colors text-left"
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--elev)] shrink-0">
        {bird.imageUrl ? (
          <img src={bird.imageUrl} alt={bird.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--t4)] text-[10px]">?</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[14px] font-semibold text-[var(--t1)] truncate">{bird.name}</p>
          <span
            className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: confidence >= 80 ? 'var(--green-sub)' : confidence >= 50 ? 'var(--amber-sub)' : 'var(--elev)',
              color: confidence >= 80 ? 'var(--green-t)' : confidence >= 50 ? 'var(--amber-t)' : 'var(--t3)',
            }}
          >
            {confidence}%
          </span>
        </div>
        <p className="text-[12px] text-[var(--t3)] truncate">
          {bird.family} · {bird.size}
          <span
            className="inline-block w-1.5 h-1.5 rounded-full ml-2 mr-1 align-middle"
            style={{ background: conservationColor(bird.conservationStatus) }}
          />
          {bird.conservationStatus}
        </p>
        <p className="text-[12px] text-[var(--t2)] mt-1 leading-relaxed line-clamp-2">
          {reasoning}
        </p>
      </div>
    </motion.button>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

interface IdentifyViewProps {
  onBirdTap: (bird: BirdSpecies) => void
}

const SIZES: SizeCategory[] = ['Tiny', 'Small', 'Medium', 'Large']
const COLORS: BirdColor[] = ['red', 'blue', 'green', 'yellow', 'orange', 'brown', 'black', 'white', 'grey', 'pink']

export function IdentifyView({ onBirdTap }: IdentifyViewProps) {
  const {
    filters,
    hasAnyFilter,
    results,
    setSize,
    toggleColor,
    reset: resetFilters,
  } = useIdentifyFilter()

  const {
    status: reconStatus,
    photo: reconPhoto,
    result: reconResult,
    error: reconError,
    analyse,
    reset: resetRecon,
  } = useBirdRecon()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const reconActive = reconStatus !== 'idle'

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => analyse(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">
      {/* ─── BirdRecon: Photo identification ──────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--blue-sub)]">
              <Scan size={14} className="text-[var(--blue-t)]" />
            </div>
            <h2 className="text-[15px] font-bold text-[var(--t1)]">On-device AI identification</h2>
          </div>
          {reconActive && (
            <button
              onClick={resetRecon}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
            >
              <RotateCcw size={12} />
              Clear
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Idle: compact capture buttons */}
          {reconStatus === 'idle' && (
            <motion.div
              key="capture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 h-[72px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[.97] border-[var(--blue)]/40 bg-[var(--blue-sub)] text-[var(--blue-t)] hover:border-[var(--blue)]"
              >
                <Camera size={20} />
                <span className="text-[12px] font-semibold">Camera</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-[72px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[.97] border-[var(--border)] bg-[var(--card)] text-[var(--t2)] hover:border-[var(--blue)] hover:text-[var(--blue-t)]"
              >
                <Upload size={20} />
                <span className="text-[12px] font-semibold">Upload</span>
              </button>
            </motion.div>
          )}

          {/* Loading model / Analysing */}
          {(reconStatus === 'loading' || reconStatus === 'analysing') && (
            <motion.div
              key="analysing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-[var(--border-s)] bg-[var(--card)] p-4"
            >
              <div className="flex items-center gap-4">
                {reconPhoto && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--elev)] shrink-0 relative">
                    <img src={reconPhoto} alt="Scanning" className="w-full h-full object-cover" />
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-[var(--blue)]"
                      initial={{ top: 0, opacity: 0.8 }}
                      animate={{ top: '100%', opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="text-[var(--blue-t)] animate-spin" />
                    <p className="text-[14px] font-semibold text-[var(--t1)]">
                      {reconStatus === 'loading' ? 'Loading model...' : 'Analysing...'}
                    </p>
                  </div>
                  <p className="text-[12px] text-[var(--t3)] mt-1">
                    {reconStatus === 'loading'
                      ? 'Downloading bird classifier (first time only)'
                      : 'BirdRecon is examining your photo'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {reconStatus === 'done' && reconResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Photo + description */}
              <div className="flex gap-3 mb-4 p-3 rounded-xl bg-[var(--card)] border border-[var(--border-s)]">
                {reconPhoto && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--elev)] shrink-0">
                    <img src={reconPhoto} alt="Scanned" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles size={11} className="text-[var(--blue-t)]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--blue-t)]">
                      Analysis
                    </p>
                  </div>
                  <p className="text-[12px] text-[var(--t2)] leading-relaxed line-clamp-3">
                    {reconResult.rawDescription}
                  </p>
                </div>
              </div>

              {reconResult.matches.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {reconResult.matches.map((m, i) => (
                    <ReconResultCard
                      key={m.bird.id}
                      bird={m.bird}
                      confidence={m.confidence}
                      reasoning={m.reasoning}
                      onTap={onBirdTap}
                      rank={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 gap-2">
                  <p className="text-[13px] text-[var(--t3)]">No birds identified — try the filters below</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Error */}
          {reconStatus === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--red-sub)] border border-[var(--red)]"
            >
              <AlertCircle size={14} className="text-[var(--red-t)] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[var(--red-t)] leading-relaxed">{reconError}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Divider ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[var(--border-s)]" />
        <span className="text-[11px] font-semibold text-[var(--t4)] uppercase tracking-widest">or describe it</span>
        <div className="flex-1 h-px bg-[var(--border-s)]" />
      </div>

      {/* ─── Manual filters: Size + Colour ───────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Binoculars size={18} className="text-[var(--blue-t)]" />
          <h2 className="text-[16px] font-bold text-[var(--t1)]">What did you see?</h2>
        </div>
        {hasAnyFilter && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
          >
            <RotateCcw size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Filters */}
      <FilterSection title="Size">
        {SIZES.map(s => (
          <FilterPill
            key={s}
            label={s}
            active={filters.size === s}
            onClick={() => setSize(s)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Colours spotted">
        {COLORS.map(c => (
          <FilterPill
            key={c}
            label={c.charAt(0).toUpperCase() + c.slice(1)}
            active={filters.colors.includes(c)}
            onClick={() => toggleColor(c)}
            swatch={COLOR_SWATCH[c]}
          />
        ))}
      </FilterSection>

      {/* Filter Results */}
      {hasAnyFilter && (
        <div className="mt-6">
          <p className="text-[13px] font-semibold text-[var(--t2)] mb-3">
            {results.length === 0
              ? 'No birds match your criteria'
              : `${results.length} bird${results.length === 1 ? '' : 's'} match`}
          </p>
          <div className="flex flex-col gap-2">
            {results.slice(0, 30).map(r => (
              <ResultRow
                key={r.bird.id}
                bird={r.bird}
                score={r.score}
                maxScore={r.maxScore}
                onTap={onBirdTap}
              />
            ))}
            {results.length > 30 && (
              <p className="text-[12px] text-[var(--t4)] text-center pt-2">
                + {results.length - 30} more — try adding filters to narrow down
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty state — only if no recon active and no filters */}
      {!hasAnyFilter && !reconActive && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Binoculars size={40} className="text-[var(--t3)]" />
          <p className="text-[13px] text-[var(--t2)] text-center max-w-[260px]">
            Upload a photo above or select characteristics to identify a bird
          </p>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  )
}
