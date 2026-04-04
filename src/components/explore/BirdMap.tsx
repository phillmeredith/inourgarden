// BirdMap — interactive map showing bird distribution across the UK
// Uses Mapbox GL via react-map-gl with conservation-status colored markers

import { useCallback, useMemo, useRef } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import { Bird, MapOff } from 'lucide-react'
import type { BirdSpecies } from '../../data/birds'
import 'mapbox-gl/dist/mapbox-gl.css'

// ─── Default UK bird distribution coordinates ────────────────────────────────
// Generates representative coordinates for birds based on their habitat/category

const UK_REGIONS: Record<string, { lat: number; lng: number }[]> = {
  Garden: [
    { lat: 51.5074, lng: -0.1278 },   // London
    { lat: 53.4808, lng: -2.2426 },   // Manchester
    { lat: 52.4862, lng: -1.8904 },   // Birmingham
    { lat: 53.8008, lng: -1.5491 },   // Leeds
    { lat: 51.4545, lng: -2.5879 },   // Bristol
    { lat: 55.9533, lng: -3.1883 },   // Edinburgh
    { lat: 54.9783, lng: -1.6174 },   // Newcastle
    { lat: 52.2053, lng: 0.1218 },    // Cambridge
    { lat: 51.7520, lng: -1.2577 },   // Oxford
    { lat: 54.5973, lng: -5.9301 },   // Belfast
  ],
  Woodland: [
    { lat: 51.4167, lng: -0.8333 },   // Windsor Great Park
    { lat: 50.8667, lng: -1.6000 },   // New Forest
    { lat: 52.8000, lng: -1.0667 },   // Sherwood Forest
    { lat: 54.5833, lng: -2.1667 },   // Kielder Forest
    { lat: 52.0500, lng: -3.1667 },   // Brecon Beacons woodlands
    { lat: 56.6500, lng: -5.1333 },   // Caledonian Forest
    { lat: 54.3700, lng: -2.9200 },   // Lake District woodlands
    { lat: 52.7500, lng: -3.5000 },   // Mid-Wales woods
  ],
  Wetland: [
    { lat: 52.5833, lng: 1.7167 },    // Norfolk Broads
    { lat: 52.3167, lng: -0.2833 },   // Ouse Washes
    { lat: 51.3500, lng: -2.8833 },   // Somerset Levels
    { lat: 53.7000, lng: -0.3500 },   // Humber Estuary
    { lat: 51.4833, lng: 0.7000 },    // North Kent Marshes
    { lat: 53.3500, lng: -2.8833 },   // Martin Mere
    { lat: 55.7667, lng: -2.1500 },   // Lindisfarne
    { lat: 56.1000, lng: -3.6000 },   // Loch Leven
  ],
  Coastal: [
    { lat: 50.6833, lng: -1.0833 },   // Isle of Wight
    { lat: 55.6667, lng: -1.6833 },   // Farne Islands
    { lat: 53.1167, lng: -4.2833 },   // Anglesey
    { lat: 57.6833, lng: -5.3167 },   // Scottish Highlands coast
    { lat: 58.9667, lng: -3.3000 },   // Orkney
    { lat: 51.6833, lng: -5.0833 },   // Pembrokeshire
    { lat: 50.1167, lng: -5.5333 },   // Cornwall
    { lat: 54.1167, lng: -0.0833 },   // Flamborough Head
    { lat: 56.2000, lng: -5.5000 },   // Islay
  ],
  Farmland: [
    { lat: 52.0000, lng: -0.7500 },   // Bedfordshire
    { lat: 52.6167, lng: -0.2500 },   // Cambridgeshire Fens
    { lat: 51.0000, lng: -2.0000 },   // Dorset downs
    { lat: 53.0000, lng: -1.0000 },   // Nottinghamshire
    { lat: 52.1500, lng: -1.5000 },   // Warwickshire
    { lat: 51.5000, lng: -1.5000 },   // Wiltshire
    { lat: 54.0000, lng: -1.5000 },   // North Yorkshire
    { lat: 52.5000, lng: 0.5000 },    // Norfolk fields
  ],
  Upland: [
    { lat: 54.4500, lng: -3.0833 },   // Lake District
    { lat: 55.3833, lng: -3.2500 },   // Borders hills
    { lat: 57.0500, lng: -5.5000 },   // Scottish Highlands
    { lat: 52.7667, lng: -3.6000 },   // Snowdonia
    { lat: 54.5000, lng: -2.3333 },   // Pennines
    { lat: 56.8000, lng: -4.5000 },   // Cairngorms
    { lat: 53.1000, lng: -3.7000 },   // Snowdonia south
    { lat: 56.5000, lng: -3.5000 },   // Perthshire
  ],
  Urban: [
    { lat: 51.5074, lng: -0.1278 },   // London
    { lat: 53.4808, lng: -2.2426 },   // Manchester
    { lat: 52.4862, lng: -1.8904 },   // Birmingham
    { lat: 55.9533, lng: -3.1883 },   // Edinburgh
    { lat: 51.4545, lng: -2.5879 },   // Bristol
    { lat: 53.3811, lng: -1.4701 },   // Sheffield
    { lat: 50.7184, lng: -1.8806 },   // Bournemouth
    { lat: 54.9783, lng: -1.6174 },   // Newcastle
  ],
}

// Deterministic pseudo-random offset so pins don't stack
function seededOffset(id: string, i: number): { lat: number; lng: number } {
  let hash = 0
  const str = id + i
  for (let c = 0; c < str.length; c++) {
    hash = (hash << 5) - hash + str.charCodeAt(c)
    hash |= 0
  }
  return {
    lat: ((hash % 100) / 100) * 0.3 - 0.15,
    lng: (((hash >> 8) % 100) / 100) * 0.4 - 0.2,
  }
}

function getBirdCoordinates(bird: BirdSpecies): { lat: number; lng: number }[] {
  const regionCoords = UK_REGIONS[bird.category] ?? UK_REGIONS.Garden
  // Pick 2-4 locations for each bird with small offsets
  const count = 2 + (bird.id.length % 3)
  return regionCoords.slice(0, count).map((coord, i) => {
    const off = seededOffset(bird.id, i)
    return { lat: coord.lat + off.lat, lng: coord.lng + off.lng }
  })
}

// ─── Conservation status colours ─────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Red: 'var(--red)',
  Amber: 'var(--amber)',
  Green: 'var(--green)',
}

const STATUS_BG: Record<string, string> = {
  Red: 'var(--red-sub)',
  Amber: 'var(--amber-sub)',
  Green: 'var(--green-sub)',
}

// ─── Pin component ───────────────────────────────────────────────────────────

function MapPin({
  bird,
  onClick,
}: {
  bird: BirdSpecies
  onClick: () => void
}) {
  const color = STATUS_COLORS[bird.conservationStatus] ?? 'var(--blue)'
  const bg = STATUS_BG[bird.conservationStatus] ?? 'var(--blue-sub)'

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center cursor-pointer"
      aria-label={`${bird.name} — ${bird.conservationStatus} status`}
      style={{ transform: 'translate(-50%, -100%)' }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform duration-150 group-hover:scale-110"
        style={{ backgroundColor: bg, border: `2px solid ${color}` }}
      >
        <Bird size={14} style={{ color }} />
      </div>
      <div
        className="w-0 h-0"
        style={{
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: `6px solid ${color}`,
          marginTop: '-1px',
        }}
      />
    </button>
  )
}

// ─── BirdMap ─────────────────────────────────────────────────────────────────

interface BirdMapProps {
  birds: BirdSpecies[]
  onBirdTap: (bird: BirdSpecies) => void
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

// UK bounding box: SW corner to NE corner with padding
const UK_BOUNDS: [[number, number], [number, number]] = [
  [-9.0, 49.0],  // SW: Cornwall / Isles of Scilly
  [2.5, 60.0],   // NE: Shetland
]

export function BirdMap({ birds, onBirdTap }: BirdMapProps) {
  const mapRef = useRef<MapRef>(null)

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-[calc(100dvh-290px)] min-h-[350px] flex flex-col items-center justify-center gap-3 rounded-[var(--r-md)] bg-[var(--card)] border border-[var(--border-s)]">
        <MapOff size={32} className="text-[var(--t3)]" />
        <p className="text-[14px] font-semibold text-[var(--t1)]">Map unavailable</p>
        <p className="text-[12px] text-[var(--t3)] text-center max-w-[260px]">
          Add <code className="bg-[var(--elev)] px-1 rounded text-[11px]">VITE_MAPBOX_TOKEN</code> to your Vercel environment variables to enable the map.
        </p>
      </div>
    )
  }

  const onMapLoad = useCallback(() => {
    mapRef.current?.fitBounds(UK_BOUNDS, { padding: 30, duration: 0 })
  }, [])

  // Generate markers for all filtered birds
  const markers = useMemo(() => {
    const result: { bird: BirdSpecies; lat: number; lng: number; key: string }[] = []
    for (const bird of birds) {
      const coords = getBirdCoordinates(bird)
      coords.forEach((c, i) => {
        result.push({ bird, lat: c.lat, lng: c.lng, key: `${bird.id}-${i}` })
      })
    }
    return result
  }, [birds])

  return (
    <div className="w-full h-[calc(100dvh-290px)] min-h-[350px] relative">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={(e) => {
          e.target.fitBounds(UK_BOUNDS, { padding: { top: 50, bottom: 80, left: 50, right: 50 }, duration: 0 })
        }}
        initialViewState={{
          longitude: -3.0,
          latitude: 54.5,
          zoom: 4,
        }}
        style={{ width: '100%', height: '100%', borderRadius: 'var(--r-md)' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {markers.map(m => (
          <Marker
            key={m.key}
            longitude={m.lng}
            latitude={m.lat}
            anchor="bottom"
          >
            <MapPin bird={m.bird} onClick={() => onBirdTap(m.bird)} />
          </Marker>
        ))}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3 py-2 rounded-[var(--r-md)] bg-[rgba(13,13,17,0.85)] backdrop-blur-xl border border-[var(--border-s)]">
        {(['Red', 'Amber', 'Green'] as const).map(status => (
          <div key={status} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: `var(--${status.toLowerCase()})` }}
            />
            <span className="text-[11px] text-[var(--t2)] font-medium">{status}</span>
          </div>
        ))}
      </div>

      {/* Bird count badge */}
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-[var(--r-pill)] bg-[rgba(13,13,17,0.85)] backdrop-blur-xl border border-[var(--border-s)]">
        <span className="text-[12px] text-[var(--t2)] font-medium">
          {birds.length} species
        </span>
      </div>
    </div>
  )
}
