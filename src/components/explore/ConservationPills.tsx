// ConservationPills — Red / Amber / Green filter pills
// Each uses its own tint pair from the DS colour system

import { cn } from '../../lib/utils'
import type { ConservationFilter } from '../../hooks/useExploreFilter'

interface ConservationPillsProps {
  active: ConservationFilter
  onChange: (status: ConservationFilter) => void
}

const STATUSES = [
  {
    value: 'Red' as const,
    label: 'Red',
    activeBg: 'bg-[var(--red-sub)]',
    activeBorder: 'border-[var(--red)]',
    activeText: 'text-[var(--red-t)]',
    dot: 'bg-[var(--red)]',
  },
  {
    value: 'Amber' as const,
    label: 'Amber',
    activeBg: 'bg-[var(--amber-sub)]',
    activeBorder: 'border-[var(--amber)]',
    activeText: 'text-[var(--amber-t)]',
    dot: 'bg-[var(--amber)]',
  },
  {
    value: 'Green' as const,
    label: 'Green',
    activeBg: 'bg-[var(--green-sub)]',
    activeBorder: 'border-[var(--green)]',
    activeText: 'text-[var(--green-t)]',
    dot: 'bg-[var(--green)]',
  },
]

export function ConservationPills({ active, onChange }: ConservationPillsProps) {
  return (
    <div className="flex gap-2">
      {STATUSES.map(({ value, label, activeBg, activeBorder, activeText, dot }) => {
        const isActive = active === value
        return (
          <button
            key={value}
            onClick={() => onChange(isActive ? null : value)}
            aria-pressed={isActive}
            className={cn(
              'flex-shrink-0 px-3 h-9 rounded-[var(--r-pill)]',
              'text-[13px] font-semibold transition-colors duration-150',
              'flex items-center gap-1.5 border',
              isActive
                ? `${activeBg} ${activeBorder} ${activeText}`
                : 'bg-[var(--card)] border-[var(--border-s)] text-[var(--t2)]',
            )}
          >
            <span
              className={cn('w-2 h-2 rounded-full shrink-0', dot)}
              aria-hidden="true"
            />
            {label}
          </button>
        )
      })}
    </div>
  )
}
