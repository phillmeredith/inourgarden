// EmptyGarden — empty state for the Garden screen when no sightings exist
// Lucide Bird icon, message, and CTA to explore birds

import { useNavigate } from 'react-router-dom'
import { Bird } from 'lucide-react'

export function EmptyGarden() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
      <Bird size={48} strokeWidth={1.5} className="text-[var(--t4)] mb-5" />

      <h2 className="text-[22px] font-semibold text-[var(--t1)] mb-2">
        Your garden bird list is empty
      </h2>

      <p className="text-[15px] text-[var(--t3)] max-w-[300px] mb-6 leading-relaxed">
        Head to Explore to discover birds and mark them as seen!
      </p>

      <button
        onClick={() => navigate('/explore')}
        className="h-11 px-6 rounded-[var(--r-pill)] text-[14px] font-semibold text-white transition-all duration-200 active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
        style={{ background: 'var(--blue)' }}
      >
        Explore Birds
      </button>
    </div>
  )
}
