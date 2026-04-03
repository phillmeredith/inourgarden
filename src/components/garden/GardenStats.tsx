// GardenStats — summary stat cards displayed at the top of the Garden screen
// 4 stats in a 2x2 grid (4-col on tablet): species, sightings, this month, streak
// Each card uses the DS tint-pair system for its icon colour

import { Bird, Eye, Calendar, Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface GardenStatsProps {
  totalSpecies: number
  totalSightings: number
  thisMonthCount: number
  streak: number
}

interface StatCardDef {
  label: string
  value: number
  Icon: React.ComponentType<{ size: number; strokeWidth: number; className?: string; style?: React.CSSProperties }>
  tint: {
    bg: string
    icon: string
  }
}

export function GardenStats({
  totalSpecies,
  totalSightings,
  thisMonthCount,
  streak,
}: GardenStatsProps) {
  const cards: StatCardDef[] = [
    {
      label: 'Species',
      value: totalSpecies,
      Icon: Bird,
      tint: { bg: 'var(--blue-sub)', icon: 'var(--blue-t)' },
    },
    {
      label: 'Sightings',
      value: totalSightings,
      Icon: Eye,
      tint: { bg: 'var(--green-sub)', icon: 'var(--green-t)' },
    },
    {
      label: 'This month',
      value: thisMonthCount,
      Icon: Calendar,
      tint: { bg: 'var(--purple-sub)', icon: 'var(--purple-t)' },
    },
    {
      label: 'Streak',
      value: streak,
      Icon: Flame,
      tint: { bg: 'var(--amber-sub)', icon: 'var(--amber-t)' },
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className={cn(
            'flex items-center gap-3 px-4 py-3.5',
            'rounded-2xl border border-[var(--border-s)] bg-[var(--card)]',
          )}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: card.tint.bg }}
          >
            <card.Icon size={18} strokeWidth={2} style={{ color: card.tint.icon }} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[20px] font-bold text-[var(--t1)] leading-tight tabular-nums">
              {card.value}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--t3)]">
              {card.label}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
