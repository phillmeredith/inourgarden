// AppRouter — main routing shell with bottom nav
// 4 routes: Garden, Explore, Attract, Settings

import { Routes, Route, Navigate } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { GradientFade } from './GradientFade'
import { ExploreScreen } from '../../screens/ExploreScreen'
import { GardenScreen } from '../../screens/GardenScreen'
import { SettingsScreen } from '../../screens/SettingsScreen'
import { AttractScreen } from '../../screens/AttractScreen'
import { usePreferences } from '../../hooks/usePreferences'

export function AppRouter() {
  // Apply theme to DOM on every screen (data-theme, theme-color meta, html bg)
  usePreferences()

  return (
    <div className="relative h-full flex flex-col bg-[var(--bg)]">
      {/* Screen area */}
      <main className="relative flex-1 overflow-hidden flex flex-col">
        <Routes>
          <Route path="/"         element={<GardenScreen />} />
          <Route path="/explore"  element={<ExploreScreen />} />
          <Route path="/attract"  element={<AttractScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/garden"   element={<Navigate to="/" replace />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <GradientFade />
      <BottomNav />
    </div>
  )
}
