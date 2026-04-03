// SettingsScreen — appearance preferences, data management, about section
// Appearance: theme toggle, accent colour dots, text size, reduced motion
// Data: export/import JSON, clear all data with confirmation modal
// About: app name, version, data sources

import { useState, useRef } from 'react'
import {
  Download, Upload, Trash2, AlertTriangle,
  Loader2, Palette, Type, Zap, Sun, Moon, Monitor,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

import { PageHeader } from '../components/layout/PageHeader'
import { Modal } from '../components/ui/Modal'
import { usePreferences } from '../hooks/usePreferences'
import { useDataExport } from '../hooks/useDataExport'
import { db } from '../lib/db'
import type { AppPreferences } from '../lib/db'

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

// ─── Accent colour picker ─────────────────────────────────────────────────────

const ACCENT_COLOURS: { value: AppPreferences['accentColour']; colour: string }[] = [
  { value: 'blue', colour: 'var(--blue)' },
  { value: 'green', colour: 'var(--green)' },
  { value: 'purple', colour: 'var(--purple)' },
  { value: 'pink', colour: 'var(--pink)' },
]

function AccentPicker({
  value,
  onChange,
}: {
  value: AppPreferences['accentColour']
  onChange: (v: AppPreferences['accentColour']) => void
}) {
  return (
    <div className="flex items-center gap-3">
      {ACCENT_COLOURS.map(a => (
        <button
          key={a.value}
          onClick={() => onChange(a.value)}
          className="relative w-8 h-8 rounded-full transition-transform active:scale-[.9]"
          style={{ background: a.colour }}
          aria-label={`${a.value} accent`}
        >
          {a.value === value && (
            <motion.div
              layoutId="accent-ring"
              className="absolute -inset-1 rounded-full border-2"
              style={{ borderColor: a.colour }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            />
          )}
        </button>
      ))}
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const { preferences, updatePreference } = usePreferences()
  const { exportData, importData, importing, error: importError } = useDataExport()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [clearModalOpen, setClearModalOpen] = useState(false)
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

      <div className="px-6 pt-6 pb-24 max-w-3xl mx-auto w-full flex flex-col gap-6">
        {/* ── Appearance ─────────────────────────────────────────────────── */}
        <Section title="Appearance">
          <SettingRow icon={Sun} label="Theme" description="Choose your preferred theme">
            <PillToggle
              options={[
                { value: 'dark' as const, label: 'Dark', Icon: Moon },
                { value: 'light' as const, label: 'Light', Icon: Sun },
                { value: 'system' as const, label: 'System', Icon: Monitor },
              ]}
              value={preferences.theme}
              onChange={v => updatePreference('theme', v)}
            />
          </SettingRow>

          <SettingRow icon={Palette} label="Accent colour" description="Highlight colour used throughout the app">
            <AccentPicker
              value={preferences.accentColour}
              onChange={v => updatePreference('accentColour', v)}
            />
          </SettingRow>

          <SettingRow icon={Type} label="Text size">
            <PillToggle
              options={[
                { value: 'default' as const, label: 'Default' },
                { value: 'large' as const, label: 'Large' },
              ]}
              value={preferences.textSize}
              onChange={v => updatePreference('textSize', v)}
            />
          </SettingRow>

          <SettingRow icon={Zap} label="Reduced motion" description="Minimise animations and transitions">
            <Toggle
              checked={preferences.reducedMotion}
              onChange={v => updatePreference('reducedMotion', v)}
            />
          </SettingRow>
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
          <div className="py-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-[var(--t1)]">
                Laura's Birdwatch
              </span>
              <span className="text-[12px] font-medium text-[var(--t3)] tabular-nums">
                v1.0.0
              </span>
            </div>
            <p className="text-[12px] text-[var(--t3)] leading-relaxed">
              All data stored locally on your device.
            </p>
            <p className="text-[12px] text-[var(--t3)] leading-relaxed">
              Bird data sources: RSPB, BTO, eBird
            </p>
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
        onClose={() => setClearModalOpen(false)}
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

          {clearError && (
            <p className="text-[13px] text-[var(--red-t)]">{clearError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setClearModalOpen(false)}
              className={cn(
                'flex-1 h-11 rounded-[var(--r-pill)] text-[14px] font-semibold',
                'bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t2)]',
                'transition-all active:scale-[.97]',
                'hover:bg-[var(--card)]',
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className={cn(
                'flex-1 h-11 rounded-[var(--r-pill)] text-[14px] font-semibold text-white',
                'transition-all active:scale-[.97]',
                'disabled:opacity-40 disabled:pointer-events-none',
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
