// LocationPicker — inline map for dropping a pin to set GPS coordinates
// Used in the "Spotted in the wild" form when user isn't at the location

import { useState, useCallback } from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import type { MapLayerMouseEvent } from 'react-map-gl/mapbox'
import { MapPin } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

interface LocationPickerProps {
  coords: { lat: number; lng: number } | null
  onCoordsChange: (coords: { lat: number; lng: number }) => void
}

export function LocationPicker({ coords, onCoordsChange }: LocationPickerProps) {
  const [viewState, setViewState] = useState({
    latitude: coords?.lat ?? 54.5,
    longitude: coords?.lng ?? -2.5,
    zoom: coords ? 10 : 5,
  })

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      onCoordsChange({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    },
    [onCoordsChange],
  )

  return (
    <div className="w-full h-[200px] rounded-[var(--r-md)] overflow-hidden border border-[var(--border-s)]">
      <Map
        {...viewState}
        onMove={e => setViewState(e.viewState)}
        onClick={handleClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {coords && (
          <Marker latitude={coords.lat} longitude={coords.lng} anchor="bottom">
            <MapPin size={28} strokeWidth={2} className="text-[var(--purple-t)]" fill="var(--purple)" />
          </Marker>
        )}
      </Map>
    </div>
  )
}
