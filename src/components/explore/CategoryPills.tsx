// CategoryPills — horizontal scrollable habitat category filter row
// Tint-pair active style per DS: bg-[var(--blue-sub)] border-[var(--blue)] text-[var(--blue-t)]

import { cn } from '../../lib/utils'
import { ALL_CATEGORIES } from '../../data/birds'
import type { HabitatCategory } from '../../data/birds'

const ALL = 'All' as const
type FilterValue = HabitatCategory | typeof ALL

const PILLS: FilterValue[] = [ALL, ...ALL_CATEGORIES]

interface CategoryPillsProps {
  active: FilterValue
  onChange: (cat: string | null) => void
}

export function CategoryPills({ active, onChange }: CategoryPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {PILLS.map(cat => {
        const isActive = active === cat || (cat === ALL && active == null)
        return (
          <button
            key={cat}
            onClick={() => {
              if (cat === ALL) {
                onChange(null)
              } else {
                // Toggle: tapping active category resets to All
                onChange(isActive ? null : cat)
              }
            }}
            aria-pressed={isActive}
            className={cn(
              'flex-shrink-0 px-4 h-9 rounded-[var(--r-pill)]',
              'text-[13px] font-semibold transition-colors duration-150',
              isActive
                ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
                : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]',
            )}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
