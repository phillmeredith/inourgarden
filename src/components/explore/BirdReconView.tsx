// BirdReconView — AI-powered photo identification
// Take a photo or upload one to identify birds using Claude Vision

import { useRef } from 'react'
import { Camera, Upload, RotateCcw, Loader2, AlertCircle, Scan, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useBirdRecon } from '../../hooks/useBirdRecon'
import type { BirdSpecies } from '../../data/birds'

// ─── Conservation badge colour ──────────────────────────────────────────────

function conservationColor(status: string) {
  if (status === 'Red') return 'var(--red)'
  if (status === 'Amber') return 'var(--amber)'
  return 'var(--green)'
}

// ─── Result card ────────────────────────────────────────────────────────────

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
      {/* Bird image */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--elev)] shrink-0">
        {bird.imageUrl ? (
          <img src={bird.imageUrl} alt={bird.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--t4)] text-[10px]">?</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Name + confidence */}
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

        {/* Details */}
        <p className="text-[12px] text-[var(--t3)] truncate">
          {bird.family} · {bird.size}
          <span
            className="inline-block w-1.5 h-1.5 rounded-full ml-2 mr-1 align-middle"
            style={{ background: conservationColor(bird.conservationStatus) }}
          />
          {bird.conservationStatus}
        </p>

        {/* Reasoning */}
        <p className="text-[12px] text-[var(--t2)] mt-1 leading-relaxed line-clamp-2">
          {reasoning}
        </p>
      </div>
    </motion.button>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

interface BirdReconViewProps {
  onBirdTap: (bird: BirdSpecies) => void
}

export function BirdReconView({ onBirdTap }: BirdReconViewProps) {
  const { status, photo, result, error, analyse, reset } = useBirdRecon()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const hasApiKey = true // TF.js — no API key needed

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      analyse(reader.result as string)
    }
    reader.readAsDataURL(file)
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--blue-sub)]">
            <Scan size={16} className="text-[var(--blue-t)]" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-[var(--t1)]">BirdRecon</h2>
            <p className="text-[11px] text-[var(--t3)]">AI-powered identification</p>
          </div>
        </div>
        {(status === 'done' || status === 'error') && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
          >
            <RotateCcw size={12} />
            New scan
          </button>
        )}
      </div>

      {/* No API key warning */}
      {!hasApiKey && status === 'idle' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--amber-sub)] border border-[var(--amber)] mb-5">
          <AlertCircle size={16} className="text-[var(--amber-t)] shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-[var(--amber-t)]">API key required</p>
            <p className="text-[12px] text-[var(--amber-t)] mt-1 opacity-80">
              Add your Anthropic API key in Settings → BirdRecon to enable photo identification.
            </p>
          </div>
        </div>
      )}

      {/* ─── Idle: capture buttons ─────────────────────────────── */}
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Drop zone / capture area */}
            <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-8 flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[var(--blue-sub)] flex items-center justify-center">
                <Camera size={28} className="text-[var(--blue-t)]" />
              </div>

              <div className="text-center">
                <p className="text-[15px] font-semibold text-[var(--t1)]">
                  Snap or upload a bird photo
                </p>
                <p className="text-[13px] text-[var(--t3)] mt-1">
                  BirdRecon will identify it from our UK catalogue
                </p>
              </div>

              <div className="flex gap-3 w-full max-w-[320px]">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={!hasApiKey}
                  className={cn(
                    'flex-1 h-11 rounded-[var(--r-pill)] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[.97]',
                    hasApiKey
                      ? 'bg-[var(--blue)] text-white hover:bg-[var(--blue-h)]'
                      : 'bg-[var(--elev)] text-[var(--t4)] cursor-not-allowed',
                  )}
                >
                  <Camera size={15} />
                  Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!hasApiKey}
                  className={cn(
                    'flex-1 h-11 rounded-[var(--r-pill)] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[.97]',
                    hasApiKey
                      ? 'bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t1)] hover:bg-[var(--card)]'
                      : 'bg-[var(--elev)] text-[var(--t4)] cursor-not-allowed border border-[var(--border-s)]',
                  )}
                >
                  <Upload size={15} />
                  Upload
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Analysing: spinner + photo preview ────────────── */}
        {status === 'analysing' && (
          <motion.div
            key="analysing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            {photo && (
              <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-[var(--elev)] relative">
                <img src={photo} alt="Bird to identify" className="w-full h-full object-cover" />
                {/* Scanning overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--blue)]/10 to-transparent" />
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-[var(--blue)]"
                  initial={{ top: 0, opacity: 0.8 }}
                  animate={{ top: '100%', opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="text-[var(--blue-t)] animate-spin" />
              <p className="text-[14px] font-semibold text-[var(--t1)]">Analysing...</p>
            </div>
            <p className="text-[12px] text-[var(--t3)]">BirdRecon is examining your photo</p>
          </motion.div>
        )}

        {/* ─── Done: results ─────────────────────────────────── */}
        {status === 'done' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Photo + description */}
            <div className="flex gap-4 mb-5">
              {photo && (
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--elev)] shrink-0">
                  <img src={photo} alt="Scanned bird" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={13} className="text-[var(--blue-t)]" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--blue-t)]">
                    BirdRecon Analysis
                  </p>
                </div>
                <p className="text-[13px] text-[var(--t2)] leading-relaxed line-clamp-3">
                  {result.rawDescription}
                </p>
              </div>
            </div>

            {/* Matches */}
            {result.matches.length > 0 ? (
              <>
                <p className="text-[13px] font-semibold text-[var(--t2)] mb-3">
                  {result.matches.length} match{result.matches.length === 1 ? '' : 'es'} found
                </p>
                <div className="flex flex-col gap-2">
                  {result.matches.map((m, i) => (
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
              </>
            ) : (
              <div className="flex flex-col items-center py-8 gap-3">
                <AlertCircle size={32} className="text-[var(--t3)]" />
                <p className="text-[14px] font-semibold text-[var(--t1)]">No birds identified</p>
                <p className="text-[13px] text-[var(--t3)] text-center max-w-[280px]">
                  Try a clearer photo with the bird more visible, or use the visual filters instead.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Error state ───────────────────────────────────── */}
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            {photo && (
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--elev)]">
                <img src={photo} alt="Failed scan" className="w-full h-full object-cover opacity-50" />
              </div>
            )}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--red-sub)] border border-[var(--red)] max-w-sm">
              <AlertCircle size={16} className="text-[var(--red-t)] shrink-0 mt-0.5" />
              <p className="text-[13px] text-[var(--red-t)] leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
