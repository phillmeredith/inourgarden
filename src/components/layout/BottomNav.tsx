// BottomNav — 4-tab fixed bottom navigation
// Glass treatment: rgba(13,13,17,.88) + backdrop-filter blur(24px) + border top

import { NavLink } from 'react-router-dom'
import { Binoculars, Bird, Settings, Leaf } from 'lucide-react'

const TABS: {
  to: string
  label: string
  Icon: React.ComponentType<{ size: number; strokeWidth: number; className?: string }>
}[] = [
  { to: '/',         label: 'In Our Garden', Icon: Bird },
  { to: '/explore',  label: 'Explore',       Icon: Binoculars },
  { to: '/attract',  label: 'Attract',       Icon: Leaf },
  { to: '/settings', label: 'Settings',      Icon: Settings },
]

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[900]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'var(--nav)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <div style={{ borderTop: '1px solid var(--border-s)' }}>
        <div className="flex items-stretch h-[68px]">
          {TABS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) => `
                flex flex-col items-center justify-center gap-1 flex-1
                text-[11px] font-medium transition-colors duration-150
                min-h-[44px]
                ${isActive ? 'text-[var(--blue)]' : 'text-[var(--t3)]'}
              `}
            >
              {({ isActive }) => (
                <div className="relative flex flex-col items-center gap-0.5">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'text-[var(--blue)]' : 'text-[var(--t3)]'}
                  />
                  <span
                    className={`text-[10px] font-semibold tracking-wide ${
                      isActive ? 'text-[var(--t1)]' : 'text-[var(--t3)]'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
