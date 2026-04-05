// Modal — centred dialog + full-screen modal
// Renders via createPortal to escape stacking context traps from Framer Motion ancestors.
// Backdrop: gradient from transparent at top → dark at ~25%, so the safe area
// and header remain visible, fading naturally into the overlay.

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

// ─── Backdrop — gradient overlay ──────────────────────────────────────────────

function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      className="fixed inset-0"
      style={{
        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.72) 8%)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
    />
  )
}

// ─── FullScreenBackdrop ───────────────────────────────────────────────────────

function FullScreenBackdrop() {
  return (
    <motion.div
      className="fixed inset-0 z-[999]"
      style={{
        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.72) 8%)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    />
  )
}

// ─── Full-screen Modal ────────────────────────────────────────────────────────
// Used for detail views that take over the entire viewport.
// Scrollable. Glass-free (uses --bg solid background). Portal-mounted.

interface FullScreenModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function FullScreenModal({
  open,
  onClose,
  children,
  className,
}: FullScreenModalProps) {
  // Scroll lock
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

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <FullScreenBackdrop />
          <motion.div
            className={cn('fixed inset-0 z-[1000] overflow-y-auto', className)}
            style={{ background: 'var(--bg)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}

// ─── Centred Modal ────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  maxWidth?: string
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  maxWidth = 'max-w-[420px]',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Scroll lock
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

  // Focus trap
  useEffect(() => {
    if (!open) return
    const el = dialogRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const content = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center pb-0 sm:items-center sm:p-4">
          <Backdrop onClick={onClose} />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            className={cn(
              'relative rounded-t-2xl sm:rounded-2xl p-7 shadow-lg w-full',
              maxWidth,
              className,
            )}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border-s)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--elev)] text-[var(--t3)] hover:bg-[var(--border)] hover:text-[var(--t1)] transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <X size={14} />
            </button>

            {title && (
              <h2 id="modal-title" className="text-[22px] font-bold text-[var(--t1)] mb-4 pr-8">
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
