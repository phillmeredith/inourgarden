// BirdMap — interactive map showing bird distribution across the UK
// Uses Mapbox GL via react-map-gl
// Rendering: GeoJSON Source + WebGL circle Layer (no DOM markers → fast)
// Theming: watches data-theme attribute and switches Mapbox basemap style

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/mapbox'
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/mapbox'
import { MapPinOff } from 'lucide-react'
import type { BirdSpecies } from '../../data/birds'
import 'mapbox-gl/dist/mapbox-gl.css'

// ─── Default UK bird distribution coordinates ────────────────────────────────

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
  const count = 2 + (bird.id.length % 3)

  // Hash the bird id to a starting index so pins are spread across ALL region
  // cities (not always just the first 2-4). Without this, cities like Newcastle
  // (index 6 in Garden) are never reached because count is at most 4.
  let hash = 0
  for (let c = 0; c < bird.id.length; c++) {
    hash = (hash << 5) - hash + bird.id.charCodeAt(c)
    hash |= 0
  }
  const startIdx = Math.abs(hash) % regionCoords.length

  return Array.from({ length: count }, (_, i) => {
    const coord = regionCoords[(startIdx + i) % regionCoords.length]
    const off = seededOffset(bird.id, i)
    return { lat: coord.lat + off.lat, lng: coord.lng + off.lng }
  })
}

// ─── Theme → Mapbox style ─────────────────────────────────────────────────────
// Forest:   earthy green    → outdoors basemap
// Midnight: near-black      → dark basemap
// Meadow:   warm cream      → light basemap
// Dusk:     deep purple     → dark basemap

const THEME_STYLES: Record<string, string> = {
  forest:   'mapbox://styles/mapbox/outdoors-v12',
  midnight: 'mapbox://styles/mapbox/dark-v11',
  meadow:   'mapbox://styles/mapbox/light-v11',
  dusk:     'mapbox://styles/mapbox/dark-v11',
}

function useMapStyle() {
  const getTheme = () =>
    THEME_STYLES[document.documentElement.dataset.theme ?? 'forest'] ?? THEME_STYLES.forest

  const [mapStyle, setMapStyle] = useState(getTheme)

  useEffect(() => {
    const obs = new MutationObserver(() => setMapStyle(getTheme()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  return mapStyle
}

// ─── GeoJSON layer spec ───────────────────────────────────────────────────────
// Conservation status colours are static tokens (not per-theme) so hex is fine

const CIRCLE_LAYER = {
  id: 'bird-points',
  type: 'circle' as const,
  paint: {
    // Scale radius slightly with zoom for readability
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 5, 8, 9] as unknown as number,
    'circle-color': [
      'match',
      ['get', 'status'],
      'Red',   '#EF466F',
      'Amber', '#F5A623',
      'Green', '#45B26B',
      '#3772FF',
    ] as unknown as string,
    'circle-stroke-width': 1.5,
    'circle-stroke-color': 'rgba(255,255,255,0.55)',
    'circle-opacity': 0.88,
  },
}

// ─── BirdMap ──────────────────────────────────────────────────────────────────

interface BirdMapProps {
  birds: BirdSpecies[]
  onBirdTap: (bird: BirdSpecies) => void
  /** Height of the floating header in px — used to position overlay badges below it */
  headerHeight?: number
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

const UK_BOUNDS: [[number, number], [number, number]] = [
  [-9.0, 49.0],
  [2.5, 60.0],
]

export function BirdMap({ birds, onBirdTap, headerHeight = 0 }: BirdMapProps) {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerReady, setContainerReady] = useState(false)
  const [cursor, setCursor] = useState('auto')
  const mapStyle = useMapStyle()

  // Wait for the container to have a real height before mounting the WebGL context.
  // On iOS Safari PWA, calc(100dvh - X) can resolve to 0 at mount time.
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const check = () => { if (el.clientHeight > 0) setContainerReady(true) }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Build a GeoJSON FeatureCollection from all filtered birds.
  // Each bird gets 2-4 coordinate points; all rendered as WebGL circles.
  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: birds.flatMap(bird =>
      getBirdCoordinates(bird).map((c, i) => ({
        type: 'Feature' as const,
        properties: { birdId: bird.id, status: bird.conservationStatus },
        geometry: { type: 'Point' as const, coordinates: [c.lng, c.lat] },
      }))
    ),
  }), [birds])

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0]
    if (!feature) return
    const bird = birds.find(b => b.id === feature.properties?.birdId)
    if (bird) onBirdTap(bird)
  }, [birds, onBirdTap])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[var(--card)]">
        <MapPinOff size={32} className="text-[var(--t3)]" />
        <p className="text-[14px] font-semibold text-[var(--t1)]">Map unavailable</p>
        <p className="text-[12px] text-[var(--t3)] text-center max-w-[260px]">
          Add <code className="bg-[var(--elev)] px-1 rounded text-[11px]">VITE_MAPBOX_TOKEN</code> to your Vercel environment variables to enable the map.
        </p>
      </div>
    )
  }

  // Bottom of the floating nav bar — legend sits just above it
  const navBottom = 68 // px, matches BottomNav height

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {containerReady && (
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          onLoad={(e) => {
            e.target.fitBounds(UK_BOUNDS, {
              padding: { top: headerHeight + 20, bottom: navBottom + 20, left: 30, right: 30 },
              duration: 0,
            })
          }}
          initialViewState={{ longitude: -3.0, latitude: 54.5, zoom: 4 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={mapStyle}
          attributionControl={false}
          interactiveLayerIds={['bird-points']}
          cursor={cursor}
          onMouseEnter={() => setCursor('pointer')}
          onMouseLeave={() => setCursor('auto')}
          onClick={handleClick}
        >
          <NavigationControl position="top-right" showCompass={false} />

          <Source id="birds" type="geojson" data={geojson}>
            <Layer {...CIRCLE_LAYER} />
          </Source>
        </Map>
      )}

      {/* Legend — above the bottom nav + safe area */}
      <div
        className="absolute left-4 flex items-center gap-3 px-3 py-2 rounded-[var(--r-md)] bg-[var(--elev)] backdrop-blur-xl border border-[var(--border-s)]"
        style={{ bottom: `calc(${navBottom}px + env(safe-area-inset-bottom, 0px) + 12px)` }}
      >
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

      {/* Bird count badge — below the floating header */}
      <div
        className="absolute left-4 px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--elev)] backdrop-blur-xl border border-[var(--border-s)]"
        style={{ top: headerHeight + 12 }}
      >
        <span className="text-[12px] text-[var(--t2)] font-medium">
          {birds.length} species
        </span>
      </div>
    </div>
  )
}
