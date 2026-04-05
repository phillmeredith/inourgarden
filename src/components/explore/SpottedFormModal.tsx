// SpottedFormModal — centred modal for logging a wild sighting
// Allows location name, GPS (current or drop-a-pin), and notes

import { useState } from 'react'
import { MapPinned, Loader2, MapIcon } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { SuccessOverlay } from '../ui/SuccessOverlay'
import { cn } from '../../lib/utils'
import { useWildSightings } from '../../hooks/useWildSightings'
import { LocationPicker } from './LocationPicker'
import type { BirdSpecies } from '../../data/birds'

interface SpottedFormModalProps {
  bird: BirdSpecies | null
  onClose: () => void
}

export function SpottedFormModal({ bird, onClose }: SpottedFormModalProps) {
  const { addWildSighting } = useWildSightings()

  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [notes, setNotes] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [successName, setSuccessName] = useState<string | null>(null)

  function resetAndClose() {
    setLocation('')
    setCoords(null)
    setNotes('')
    setShowMapPicker(false)
    setGettingLocation(false)
    onClose()
  }

  function handleGetLocation() {
    if (!navigator.geolocation) return
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGettingLocation(false)
        setShowMapPicker(false)
      },
      () => setGettingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleSave() {
    if (!bird) return
    const name = bird.name
    await addWildSighting(bird.id, {
      notes: notes || null,
      locationName: location || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
    setSuccessName(name)
    setTimeout(() => {
      setSuccessName(null)
      resetAndClose()
    }, 2400)
  }

  return (
    <>
    <Modal
      open={!!bird}
      onClose={resetAndClose}
      title={bird ? `Spotted: ${bird.name}` : ''}
      maxWidth="max-w-[460px]"
    >
      {bird && (
        <div className="space-y-4">
          {/* Location name */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--t3)] mb-1 block">
              Location name
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Kielder Forest"
              autoFocus
              className="w-full h-10 px-3 rounded-[var(--r-md)] bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t1)] text-[14px] placeholder:text-[var(--t4)] outline-none focus:border-[var(--blue)]"
            />
          </div>

          {/* GPS coordinates */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--t3)] mb-1 block">
              GPS coordinates
            </label>
            {coords ? (
              <button
                onClick={() => { setCoords(null); setShowMapPicker(false) }}
                className="w-full h-10 rounded-[var(--r-md)] bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t2)] text-[13px] font-medium flex items-center justify-center gap-2"
              >
                <MapPinned size={14} className="text-[var(--green-t)]" />
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                <span className="text-[11px] text-[var(--t4)] ml-1">tap to clear</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleGetLocation}
                  disabled={gettingLocation}
                  className="flex-1 h-10 rounded-[var(--r-md)] bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t2)] text-[13px] font-medium flex items-center justify-center gap-2"
                >
                  {gettingLocation ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Getting location…
                    </>
                  ) : (
                    <>
                      <MapPinned size={14} />
                      Use current
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className={cn(
                    'flex-1 h-10 rounded-[var(--r-md)] bg-[var(--elev)] border text-[13px] font-medium flex items-center justify-center gap-2',
                    showMapPicker
                      ? 'border-[var(--blue)] text-[var(--blue-t)]'
                      : 'border-[var(--border-s)] text-[var(--t2)]',
                  )}
                >
                  <MapIcon size={14} />
                  Drop a pin
                </button>
              </div>
            )}
            {showMapPicker && !coords && (
              <div className="mt-2">
                <LocationPicker
                  coords={coords}
                  onCoordsChange={(c) => {
                    setCoords(c)
                    setShowMapPicker(false)
                  }}
                />
                <p className="text-[11px] text-[var(--t4)] mt-1 text-center">Tap the map to drop a pin</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--t3)] mb-1 block">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What was it doing? Any details..."
              rows={2}
              className="w-full px-3 py-2 rounded-[var(--r-md)] bg-[var(--elev)] border border-[var(--border-s)] text-[var(--t1)] text-[14px] placeholder:text-[var(--t4)] outline-none focus:border-[var(--blue)] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={resetAndClose}
              className="flex-1 h-10 rounded-[var(--r-md)] bg-[var(--elev)] border border-[var(--border-s)] text-[14px] font-medium text-[var(--t2)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-10 rounded-[var(--r-md)] bg-[var(--purple)] text-white text-[14px] font-semibold"
            >
              Save sighting
            </button>
          </div>
        </div>
      )}
    </Modal>

    <SuccessOverlay name={successName} variant="spotted" />
    </>
  )
}
