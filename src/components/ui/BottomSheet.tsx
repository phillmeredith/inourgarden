// BottomSheet — iOS-style bottom sheet with glass treatment
// Renders via createPortal to escape stacking context traps.
// Backdrop: gradient from transparent at top → dark at ~25% so the safe area
// and header remain visible, fading naturally into the overlay.

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

// ─── Backdrop — gradient overlay, fades in from bottom ────────────────────────

function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      className="fixed inset-0"
      style={{
        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.72) 28%)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
    />
  )
}

// ─── BottomSheet ───────────────────────────────────────────────────────────────

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  maxHeight?: string
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  maxHeight = '85vh',
}: BottomSheetProps) {
  // Reference-counted scroll lock
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    const count = Number(document.body.dataset.scrollLockCount ?? '0') + 1
    document.body.dataset.scrollLockCount = String(count)
    document.body.style.overflow = 'hidden'
    return () => {
      const next = count - 1
      document.body.dataset.scrollLockCount = String(next)
      if (next <= 0) {
        document.body.style.overflow = prev
        delete document.body.dataset.scrollLockCount
      }
    }
  }, [open])

  // Escape key dismiss
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const scrollMaxHeight = `calc(${maxHeight} - 80px)`

  const content = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1000] flex items-end">
          <Backdrop onClick={onClose} />
          <motion.div
            className={cn(
              'relative w-full',
              'rounded-t-2xl shadow-lg overflow-hidden',
              className,
            )}
            style={{
              maxHeight,
              background: 'var(--card)',
              borderTop: '1px solid var(--border-s)',
              borderLeft: '1px solid var(--border-s)',
              borderRight: '1px solid var(--border-s)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, info) => {
              // Dismiss if dragged down past 100px or with enough velocity
              if (info.offset.y > 100 || info.velocity.y > 300) {
                onClose()
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between px-7 py-3 border-b border-[var(--border-s)]">
              {title ? (
                <h2 className="text-[22px] font-bold text-[var(--t1)]">{title}</h2>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[var(--elev)] text-[var(--t3)] hover:bg-[var(--border)] hover:text-[var(--t1)] transition-colors flex items-center justify-center shrink-0"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            {/* Scrollable content area */}
            <div
              className="overflow-y-auto overscroll-contain"
              style={{
                maxHeight: scrollMaxHeight,
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
