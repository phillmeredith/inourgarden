// SettingsScreen — appearance preferences, data management, about section
// Appearance: theme toggle, accent colour dots, text size, reduced motion
// Data: export/import JSON, clear all data with confirmation modal
// About: app name, version, data sources

import { useState, useRef } from 'react'
import {
  Download, Upload, Trash2, AlertTriangle,
  Loader2, MapPin, Mountain, Sun, Trees, Leaf, Check, ChevronDown, RefreshCw,
} from 'lucide-react'

declare const __APP_VERSION__: string
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

import { PageHeader } from '../components/layout/PageHeader'
import { Modal } from '../components/ui/Modal'
import { usePreferences } from '../hooks/usePreferences'
import { useDataExport } from '../hooks/useDataExport'
import { useGardenSetup, type GardenRegion } from '../hooks/useGardenSetup'
import { db } from '../lib/db'
import type { AppPreferences, AppTheme } from '../lib/db'

// ─── Region data ──────────────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

const REGIONS: { value: GardenRegion; label: string; Icon: LucideIcon }[] = [
  { value: 'scotland',       label: 'Scotland',         Icon: Mountain },
  { value: 'n-england',      label: 'North England',    Icon: Sun      },
  { value: 'midlands-wales', label: 'Midlands & Wales', Icon: Trees    },
  { value: 's-england',      label: 'South England',    Icon: Sun      },
  { value: 'n-ireland',      label: 'N. Ireland',       Icon: Leaf     },
]

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] font-bold uppercase tracking-[1px] text-[var(--t3)] px-1">
        {title}
      </h3>
      <div className="rounded-2xl border border-[var(--border-s)] bg-[var(--card)] px-5 divide-y divide-[var(--border-s)]">
        {children}
      </div>
    </div>
  )
}

// ─── Setting row wrapper ──────────────────────────────────────────────────────

function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ComponentType<{ size: number; strokeWidth: number; className?: string; style?: React.CSSProperties }>
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--elev)] shrink-0">
        <Icon size={18} strokeWidth={2} className="text-[var(--t2)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-[var(--t1)]">{label}</div>
        {description && (
          <div className="text-[12px] text-[var(--t3)] mt-0.5">{description}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-12 h-7 rounded-[var(--r-pill)] transition-colors duration-200 shrink-0"
      style={{ background: checked ? 'var(--blue)' : 'var(--border)' }}
      role="switch"
      aria-checked={checked}
    >
      <motion.div
        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ left: checked ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      />
    </button>
  )
}

// ─── Pill toggle (2-3 options) ────────────────────────────────────────────────

function PillToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; Icon?: React.ComponentType<{ size: number; strokeWidth: number }> }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div
      className="inline-flex rounded-[var(--r-pill)] p-1"
      style={{ background: 'var(--elev)', border: '1px solid var(--border-s)' }}
    >
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-[12px] font-semibold transition-all duration-150',
              active
                ? 'bg-[var(--card)] text-[var(--t1)] shadow-sm'
                : 'text-[var(--t3)] hover:text-[var(--t2)]',
            )}
          >
            {opt.Icon && <opt.Icon size={12} strokeWidth={2} />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Theme picker ─────────────────────────────────────────────────────────────

const THEMES: { value: AppTheme; label: string; bg: string; card: string; accent: string }[] = [
  { value: 'forest',   label: 'Forest',   bg: '#4f523f', card: '#363929', accent: '#5EC47A' },
  { value: 'midnight', label: 'Midnight', bg: '#0D0D11', card: '#18181D', accent: '#3772FF' },
  { value: 'meadow',   label: 'Meadow',   bg: '#F3EFE6', card: '#FFFFFF', accent: '#3A7D44' },
  { value: 'dusk',     label: 'Dusk',     bg: '#16101F', card: '#1F1730', accent: '#9757D7' },
]

function ThemePicker({
  value,
  onChange,
}: {
  value: AppTheme
  onChange: (v: AppTheme) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2 pt-1 pb-2">
      {THEMES.map(t => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className="flex flex-col items-center gap-1.5 group"
            aria-label={`${t.label} theme`}
          >
            {/* Swatch */}
            <div
              className="w-full aspect-[3/4] rounded-xl relative overflow-hidden transition-transform active:scale-[.95]"
              style={{
                background: t.bg,
                boxShadow: active ? `0 0 0 2.5px ${t.accent}` : '0 0 0 1.5px rgba(255,255,255,.08)',
              }}
            >
              {/* Mini card strip */}
              <div
                className="absolute bottom-3 left-2.5 right-2.5 h-5 rounded-lg"
                style={{ background: t.card }}
              />
              {/* Mini card line */}
              <div
                className="absolute bottom-3 left-2.5 right-2.5 h-5 rounded-lg opacity-80"
                style={{ background: t.card }}
              />
              {/* Accent dot */}
              <div
                className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full"
                style={{ background: t.accent }}
              />
              {/* Active tick */}
              {active && (
                <motion.div
                  layoutId="theme-tick"
                  className="absolute top-2 left-2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: t.accent }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </div>
            <span
              className="text-[11px] font-semibold transition-colors"
              style={{ color: active ? 'var(--t1)' : 'var(--t3)' }}
            >
              {t.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Action button row ────────────────────────────────────────────────────────

function ActionRow({
  icon: Icon,
  label,
  description,
  onClick,
  tint,
  loading = false,
}: {
  icon: React.ComponentType<{ size: number; strokeWidth: number; className?: string; style?: React.CSSProperties }>
  label: string
  description?: string
  onClick: () => void
  tint?: { bg: string; icon: string; text: string }
  loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-4 w-full py-4 text-left disabled:opacity-50"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: tint?.bg ?? 'var(--elev)' }}
      >
        {loading ? (
          <Loader2 size={18} strokeWidth={2} className="text-[var(--t2)] animate-spin" />
        ) : (
          <Icon size={18} strokeWidth={2} style={{ color: tint?.icon ?? 'var(--t2)' }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[15px] font-semibold"
          style={{ color: tint?.text ?? 'var(--t1)' }}
        >
          {label}
        </div>
        {description && (
          <div className="text-[12px] text-[var(--t3)] mt-0.5">{description}</div>
        )}
      </div>
    </button>
  )
}

// ─── Changelog ────────────────────────────────────────────────────────────────

const CHANGELOG: { version: string; label?: string; changes: string[] }[] = [
  {
    version: '1.1.5',
    changes: [
      'Fixed sound button staying highlighted when pausing from within a bird card — only highlights when paused via the top-right button itself',
    ],
  },
  {
    version: '1.1.4',
    changes: [
      'Top-right sound button now reflects global audio state: Volume2 (playing, highlighted), VolumeX (paused, highlighted), plain Volume2 (nothing playing)',
      'Clicking it while audio is active pauses or resumes playback',
    ],
  },
  {
    version: '1.1.3',
    changes: [
      'Fixed sound filter icon showing crossed-out when not muted',
    ],
  },
  {
    version: '1.1.2',
    changes: [
      'Fixed "Refresh for latest version" button getting stuck — now reliably reloads',
    ],
  },
  {
    version: '1.1.1',
    changes: [
      'Added "Refresh for latest version" button in Settings — fetches and applies the newest version without losing any data',
    ],
  },
  {
    version: '1.1.0',
    changes: [
      'Empty garden message moved to top and updated to "Your garden is empty!"',
    ],
  },
  {
    version: '1.0.9',
    changes: [
      'Renamed "In Our Garden" to "In our garden" throughout the app',
    ],
  },
  {
    version: '1.0.8',
    changes: [
      'Version number under Raccoon Ltd now updates automatically with each release',
      'Removed text size and reduced motion settings',
    ],
  },
  {
    version: '1.0.7',
    changes: [
      'Sound filter button now shows a crossed-out icon when the filter is off',
    ],
  },
  {
    version: '1.0.6',
    changes: [
      'Fixed search field causing iOS to zoom in on tap (font-size bumped to 16px)',
    ],
  },
  {
    version: '1.0.5',
    changes: [
      'Map now opens with the UK properly centred at a consistent zoom level',
    ],
  },
  {
    version: '1.0.4',
    changes: [
      'Fixed map legend clipping behind the bottom nav on iPhone (safe area inset not accounted for)',
    ],
  },
  {
    version: '1.0.3',
    changes: [
      'Map is now full-bleed — fills the entire screen with no box or rounded corners',
      'Map overlay badges reposition dynamically to clear the header and bottom nav',
    ],
  },
  {
    version: '1.0.2',
    changes: [
      'Fixed map not showing birds for Newcastle and other cities beyond the first four in each region',
    ],
  },
  {
    version: '1.0.1',
    changes: [
      'Map now matches the active theme — outdoors style for Forest, light for Meadow, dark for Midnight & Dusk',
      'Map performance significantly improved — switched from DOM markers to WebGL circle layer',
    ],
  },
  {
    version: '1.0.0',
    label: 'V1 Release',
    changes: [
      'Forest theme set as first/default in theme picker',
      'Removed flickering entrance animations from garden stat cards and bird grid',
      'Fixed map not loading on iPhone (iOS DVH height bug)',
      'Attract tabs now reset scroll position when switching between them',
    ],
  },
  {
    version: '0.9.4',
    changes: [
      'Verified and replaced all broken or wrong feeding/feature images',
      'Peanuts, mealworms, niger seeds, suet, mixed seed, log pile, nest boxes all fixed',
      'PWA icon updated to pure black background matching dark mode system icons',
    ],
  },
  {
    version: '0.9.3',
    changes: [
      'PWA app icon — Lucide Bird on dark rounded square, regenerated at 192/512/180px',
      'Dual theme-color meta tags so iOS sets status bar colour per light/dark mode',
      'Scoped drag-to-dismiss in bottom sheet to handle pill only — fixes scroll conflict',
    ],
  },
  {
    version: '0.9.2',
    changes: [
      'Edit Favourites shortcut on Strategy tab opens setup directly at step 2',
      'Fixed blank page when opening setup after using Edit Favourites (hooks violation)',
      'Fixed setup sheet scroll on bird favourites step',
    ],
  },
  {
    version: '0.9.1',
    changes: [
      'Garden region can now be changed from Settings',
      'Clear data modal requires typing DELETE before confirming',
      'Setup button removed from Attract header',
    ],
  },
  {
    version: '0.9.0',
    changes: [
      'Bird cards in Attract now open the full-screen BirdDetailModal (same as Learn More)',
      'Shopping list — copy individual items or the whole list with one tap',
      'Your Favourites moved to top of Strategy tab above Watch Out For',
    ],
  },
  {
    version: '0.8.1',
    changes: [
      'Feeding guide: real verified photos for every food type and garden feature',
      'Images confirmed via live browser fetch — no more placeholder or wrong subjects',
    ],
  },
  {
    version: '0.8.0',
    changes: [
      'Replaced every emoji in the app with matching Lucide icons in rounded containers',
      'Feeding tab cards show food/feature images on the right',
      'Strategy, Feeding and Hierarchy tabs all use consistent icon style',
    ],
  },
  {
    version: '0.7.0',
    changes: [
      'PWA support — installable to home screen, offline mode via service worker',
      'App manifest, icons and apple-touch-icon configured',
      'Attract screen garden setup with region, features and favourite birds',
    ],
  },
  {
    version: '0.6.0',
    changes: [
      'Full-screen bird detail modal with photo, conservation status, and habitat info',
      'Log a sighting directly from the bird detail view',
      'Pecking order (Hierarchy) tab showing feeding dominance and conflict pairs',
    ],
  },
  {
    version: '0.5.0',
    changes: [
      'Settings screen — Forest, Midnight, Meadow and Dusk themes',
      'Data export and import as JSON backup',
      'Text size and reduced motion preferences',
    ],
  },
  {
    version: '0.4.0',
    changes: [
      'Attract screen — personalised strategy based on garden region and features',
      'Feeding guide with food-type sections and which birds each attracts',
      'Shopping list consolidates everything needed for your favourite birds',
    ],
  },
  {
    version: '0.3.0',
    changes: [
      'Garden screen — log sightings and track your personal bird list',
      'Stats dashboard: species count, total sightings, monthly count, streak',
      'Sighting detail with date, count, and notes',
    ],
  },
  {
    version: '0.2.0',
    changes: [
      'Explore screen — full species list with search, filter by conservation status',
      'Bird cards with photo, conservation badge and garden likelihood',
      'UK distribution map with colour-coded markers',
    ],
  },
  {
    version: '0.1.0',
    label: 'First build',
    changes: [
      'Initial app — bird species database (200+ UK species)',
      'Bottom navigation: Garden, Explore, Attract, Settings',
      'Dark/light theme foundation with CSS variable design system',
    ],
  },
]

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const { preferences, updatePreference } = usePreferences()
  const { exportData, importData, importing, error: importError } = useDataExport()
  const { setup, update: updateGarden } = useGardenSetup()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  async function handleCheckForUpdate() {
    setUpdating(true)
    try {
      // Tell the SW to fetch the latest version from the server
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        await reg.update()
      }
    } catch {
      // ignore — reload regardless
    }
    // Reload picks up any newly fetched SW automatically
    window.location.reload()
  }
  const [clearModalOpen, setClearModalOpen] = useState(false)
  const [clearConfirmText, setClearConfirmText] = useState('')
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState<string | null>(null)


  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleExport() {
    await exportData()
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await importData(file, 'merge')
    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleClearAll() {
    try {
      setClearing(true)
      setClearError(null)
      await db.transaction('rw', db.gardenSightings, db.preferences, async () => {
        await db.gardenSightings.clear()
        await db.preferences.clear()
      })
      setClearModalOpen(false)
      setClearConfirmText('')
    } catch (err) {
      console.error('[SettingsScreen] clearAll failed:', err)
      setClearError('Failed to clear data. Please try again.')
    } finally {
      setClearing(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] overflow-y-auto">
      <PageHeader title="Settings" />

      <div
        className="px-6 pt-6 max-w-3xl mx-auto w-full flex flex-col gap-6"
        style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* ── Appearance ─────────────────────────────────────────────────── */}
        <Section title="Appearance">
          {/* Theme picker — full width, above the divider rows */}
          <div className="pt-4 pb-2">
            <p className="text-[12px] font-bold uppercase tracking-[0.8px] text-[var(--t3)] mb-3">Theme</p>
            <ThemePicker
              value={preferences.theme}
              onChange={v => updatePreference('theme', v)}
            />
          </div>

        </Section>

        {/* ── Garden ─────────────────────────────────────────────────────── */}
        <Section title="Garden">
          <div className="py-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--elev)] shrink-0">
                <MapPin size={18} strokeWidth={2} className="text-[var(--t2)]" />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-[var(--t1)]">Garden location</div>
                <div className="text-[12px] text-[var(--t3)] mt-0.5">
                  {setup.region
                    ? REGIONS.find(r => r.value === setup.region)?.label ?? 'Set below'
                    : 'Not set — choose your region'}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {REGIONS.map(r => {
                const active = setup.region === r.value
                return (
                  <button
                    key={r.value}
                    onClick={() => updateGarden({ region: r.value })}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                      active
                        ? 'border-[var(--blue)] bg-[var(--blue-sub)]'
                        : 'border-[var(--border-s)] bg-[var(--elev)]',
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: active ? 'var(--blue-sub)' : 'var(--card)' }}>
                      <r.Icon size={15} strokeWidth={2}
                        className={active ? 'text-[var(--blue-t)]' : 'text-[var(--t2)]'} />
                    </div>
                    <span className={cn(
                      'flex-1 text-[14px] font-semibold',
                      active ? 'text-[var(--blue-t)]' : 'text-[var(--t1)]',
                    )}>
                      {r.label}
                    </span>
                    {active && <Check size={14} strokeWidth={2.5} className="text-[var(--blue-t)]" />}
                  </button>
                )
              })}
            </div>
          </div>
        </Section>

        {/* ── Data ───────────────────────────────────────────────────────── */}
        <Section title="Data">
          <ActionRow
            icon={Download}
            label="Export data"
            description="Download all sightings as a JSON file"
            onClick={handleExport}
          />
          <ActionRow
            icon={Upload}
            label="Import data"
            description="Restore from a previously exported file"
            onClick={handleImportClick}
            loading={importing}
          />
          <ActionRow
            icon={Trash2}
            label="Clear all data"
            description="Remove all sightings and reset preferences"
            onClick={() => setClearModalOpen(true)}
            tint={{
              bg: 'var(--red-sub)',
              icon: 'var(--red-t)',
              text: 'var(--red-t)',
            }}
          />
          {importError && (
            <div className="py-3 text-[13px] text-[var(--red-t)]">{importError}</div>
          )}
        </Section>

        {/* ── About ──────────────────────────────────────────────────────── */}
        <Section title="About">
          <div className="py-4 flex flex-col gap-3">
            {/* Raccoon Developments branding row */}
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--elev)' }}
              >
                <img
                  src="/raccoon.png"
                  alt="Raccoon Ltd"
                  className="w-7 h-7 object-contain"
                  style={{ mixBlendMode: 'screen' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-[var(--t1)]">
                  Raccoon Ltd
                </div>
                <div className="text-[12px] text-[var(--t3)] mt-0.5">v{__APP_VERSION__}</div>
              </div>
            </div>
            {/* Update button */}
            <button
              onClick={handleCheckForUpdate}
              disabled={updating}
              className="flex items-center gap-2.5 h-10 px-4 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-[.97] disabled:opacity-60 self-start"
              style={{ background: 'var(--elev)', border: '1px solid var(--border-s)', color: 'var(--t1)' }}
            >
              {updating
                ? <Loader2 size={15} strokeWidth={2} className="animate-spin text-[var(--t3)]" />
                : <RefreshCw size={15} strokeWidth={2} className="text-[var(--t3)]" />}
              {updating ? 'Updating…' : 'Refresh for latest version'}
            </button>

            <p className="text-[12px] text-[var(--t3)] leading-relaxed">
              All data stored locally on your device.
            </p>
            <p className="text-[12px] text-[var(--t3)] leading-relaxed">
              Bird data sources: RSPB, BTO, eBird
            </p>

            {/* Collapsible changelog */}
            <button
              onClick={() => setChangelogOpen(o => !o)}
              className="w-full flex items-center justify-between pt-2 border-t border-[var(--border-s)]"
            >
              <span className="text-[12px] font-semibold text-[var(--t2)]">Version history</span>
              <ChevronDown
                size={14}
                strokeWidth={2.5}
                className="text-[var(--t3)] transition-transform duration-200"
                style={{ transform: changelogOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {changelogOpen && (
              <div className="flex flex-col gap-4 pt-1">
                {CHANGELOG.map(entry => (
                  <div key={entry.version}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-[var(--t1)] tabular-nums">
                        v{entry.version}
                      </span>
                      {entry.label && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--blue-sub)', color: 'var(--blue-t)' }}>
                          {entry.label}
                        </span>
                      )}
                    </div>
                    <ul className="flex flex-col gap-1">
                      {entry.changes.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[var(--t4)] mt-[3px] shrink-0">·</span>
                          <span className="text-[11px] text-[var(--t3)] leading-relaxed">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Clear data confirmation modal */}
      <Modal
        open={clearModalOpen}
        onClose={() => { setClearModalOpen(false); setClearConfirmText('') }}
        title="Clear all data?"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--red-sub)] border border-[var(--red)]">
            <AlertTriangle size={18} strokeWidth={2} className="text-[var(--red-t)] shrink-0 mt-0.5" />
            <p className="text-[13px] text-[var(--red-t)] leading-relaxed">
              This will permanently delete all your sightings and reset preferences.
              This action cannot be undone.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[var(--t3)] uppercase tracking-wide">
              Type DELETE to confirm
            </label>
            <input
              type="text"
              value={clearConfirmText}
              onChange={e => setClearConfirmText(e.target.value)}
              placeholder="DELETE"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className={cn(
                'w-full h-11 px-4 rounded-xl border text-[15px] font-mono font-bold tracking-widest',
                'bg-[var(--elev)] text-[var(--t1)] outline-none transition-colors',
                clearConfirmText === 'DELETE'
                  ? 'border-[var(--red)] text-[var(--red-t)]'
                  : 'border-[var(--border-s)]',
              )}
            />
          </div>

          {clearError && (
            <p className="text-[13px] text-[var(--red-t)]">{clearError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setClearModalOpen(false); setClearConfirmText('') }}
              className={cn(
                'flex-1 h-11 rounded-[var(--r-pill)] text-[14px] font-semibold',
                'bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t2)]',
                'transition-all active:scale-[.97]',
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleClearAll}
              disabled={clearing || clearConfirmText !== 'DELETE'}
              className={cn(
                'flex-1 h-11 rounded-[var(--r-pill)] text-[14px] font-semibold text-white',
                'transition-all active:scale-[.97]',
                'disabled:opacity-30 disabled:pointer-events-none',
              )}
              style={{ background: 'var(--red)' }}
            >
              {clearing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Clearing...
                </span>
              ) : (
                'Clear everything'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
