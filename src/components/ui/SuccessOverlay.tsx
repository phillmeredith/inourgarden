// SuccessOverlay — full-screen animated success splash, portal-mounted above everything
// variant 'garden'  → green tick  + "Added to your garden!"
// variant 'spotted' → purple tick + "Spotted in the wild!"

import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface SuccessOverlayProps {
  /** Bird name to display — truthy value also controls visibility */
  name: string | null
  variant: 'garden' | 'spotted'
}

const VARIANTS = {
  garden: {
    heading: 'Added to your garden!',
    circle: 'var(--green-sub)',
    stroke: 'var(--green)',
  },
  spotted: {
    heading: 'Spotted in the wild!',
    circle: 'var(--purple-sub)',
    stroke: 'var(--purple)',
  },
}

export function SuccessOverlay({ name, variant }: SuccessOverlayProps) {
  const { heading, circle, stroke } = VARIANTS[variant]

  return createPortal(
    <AnimatePresence>
      {name && (
        <motion.div
          className="fixed inset-0 z-[1200] flex flex-col items-center justify-center"
          style={{ background: 'var(--bg)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Tick circle */}
          <motion.div
            className="relative flex items-center justify-center mb-8"
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.1 }}
          >
            <div
              className="w-32 h-32 rounded-full"
              style={{ background: circle, border: `2.5px solid ${stroke}` }}
            />
            <svg
              viewBox="0 0 64 64"
              className="absolute w-14 h-14"
              fill="none"
              aria-hidden="true"
            >
              <motion.path
                d="M14 32 L27 45 L50 18"
                stroke={stroke}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.35, duration: 0.45, ease: 'easeOut' }}
              />
            </svg>
          </motion.div>

          {/* Text */}
          <motion.div
            className="text-center px-10"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.32 }}
          >
            <p className="text-[28px] font-bold text-[var(--t1)] mb-2 leading-tight">
              {heading}
            </p>
            <p className="text-[16px] text-[var(--t2)]">{name}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
