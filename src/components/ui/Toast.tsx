// Toast notification system — glass treatment with tint-pair type colours
// 3 types: success (green), error (red), info (blue)
// Max 3 visible, stacked from top, auto-dismiss after 3s (error: persistent)
// Renders via createPortal to document.body

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info'

export interface ToastOptions {
  type: ToastType
  title: string
  description?: string
  /** Override auto-dismiss duration (ms). Pass null for persistent. */
  duration?: number | null
}

interface ToastItem extends ToastOptions {
  id: string
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
}

// ─── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (options: ToastOptions): string => {
      const id = crypto.randomUUID()
      const item: ToastItem = { ...options, id }

      setToasts((prev) => {
        const next = [item, ...prev]
        return next.slice(0, 3)
      })

      // Auto-dismiss durations by type
      const defaultDurations: Record<ToastType, number | null> = {
        success: 3000,
        info: 3000,
        error: null, // persistent — user must dismiss
      }
      const duration = options.duration ?? defaultDurations[options.type]

      if (duration !== null) {
        const timer = setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }

      return id
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ─── Container ─────────────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  const portal = (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
  return createPortal(portal, document.body)
}

// ─── Individual toast ──────────────────────────────────────────────────────────

const CONFIG: Record<
  ToastType,
  {
    bg: string
    border: string
    iconColor: string
    titleColor: string
    Icon: React.ComponentType<{ size: number }>
  }
> = {
  success: {
    bg: 'bg-[var(--green-sub)]',
    border: 'border-[rgba(69,178,107,.2)]',
    iconColor: 'text-[var(--green)]',
    titleColor: 'text-[var(--green-t)]',
    Icon: CheckCircle,
  },
  error: {
    bg: 'bg-[var(--red-sub)]',
    border: 'border-[rgba(239,70,111,.2)]',
    iconColor: 'text-[var(--red)]',
    titleColor: 'text-[var(--red-t)]',
    Icon: XCircle,
  },
  info: {
    bg: 'bg-[var(--blue-sub)]',
    border: 'border-[rgba(55,114,255,.2)]',
    iconColor: 'text-[var(--blue)]',
    titleColor: 'text-[var(--blue-t)]',
    Icon: Info,
  },
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  const cfg = CONFIG[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`
        pointer-events-auto flex items-start gap-3 px-4 py-3.5
        rounded-[14px] border ${cfg.bg} ${cfg.border}
        shadow-lg w-full
      `}
      style={{
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
      role="alert"
    >
      {/* Icon circle */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full ${cfg.bg} ${cfg.iconColor} flex items-center justify-center`}
      >
        <cfg.Icon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${cfg.titleColor}`}>
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-xs text-[var(--t2)] mt-0.5 leading-snug">
            {toast.description}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--elev)] flex items-center justify-center text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </motion.div>
  )
}
