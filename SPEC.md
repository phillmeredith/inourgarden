# Laura's Bird Watching App — Product Spec

## Overview

A focused bird watching PWA for Laura. Three sections: **Explore** (searchable bird directory), **In Our Garden** (personal sighting collection), and **Settings** (data management + appearance). Built on the same tech stack and design system as Animal Kingdom but stripped of all game, card, marketplace, and economy mechanics.

**Target device:** iPad (primary), phone (secondary) — same responsive approach as Animal Kingdom.

---

## 1. Information Architecture

```
Bottom Nav (3 tabs):
├── Explore        — Full bird directory
├── In Our Garden  — Personal sighting log
└── Settings       — Export/import, appearance
```

---

## 2. Explore Screen

The main discovery experience. A searchable, filterable directory of UK and world birds.

### 2.1 Data per bird species

Each bird entry contains:

| Field | Type | Notes |
|-------|------|-------|
| `commonName` | string | e.g. "European Robin" |
| `scientificName` | string | e.g. "Erithacus rubecula" |
| `family` | string | e.g. "Muscicapidae" (Old World flycatchers) |
| `order` | string | e.g. "Passeriformes" |
| `imageUrl` | string | Primary photo |
| `images` | string[] | Gallery (up to 5: male, female, juvenile, flight, habitat) |
| `description` | string | 2-3 sentence overview |
| `habitat` | string[] | e.g. ["Woodland", "Gardens", "Hedgerows"] |
| `diet` | string[] | e.g. ["Insects", "Berries", "Seeds"] |
| `size` | { length: string, wingspan: string, weight: string } | |
| `conservationStatus` | "Red" \| "Amber" \| "Green" | UK conservation status (BoCC) |
| `iucnStatus` | string | IUCN Red List status |
| `seasonality` | "Resident" \| "Summer visitor" \| "Winter visitor" \| "Passage migrant" | |
| `song` | { url: string, description: string } \| null | Audio file + text description of the call |
| `callTypes` | { name: string, url: string, description: string }[] | Multiple call types (alarm, song, contact) |
| `facts` | string[] | 3-5 interesting facts |
| `behaviour` | string | Feeding, nesting, social behaviour summary |
| `nesting` | { season: string, clutchSize: string, incubation: string, fledging: string } | |
| `identification` | { male: string, female: string, juvenile: string, inFlight: string } | Field ID tips |
| `confusedWith` | { species: string, differences: string }[] | Similar species and how to tell apart |
| `ukDistribution` | string | Where in UK (e.g. "Widespread", "Scotland only") |
| `coordinates` | { lat: number, lng: number }[] | Geographic range markers for map |
| `regions` | string[] | e.g. ["Europe", "Asia", "North Africa"] |
| `migrationRoute` | { from: string, to: string, months: string } \| null | |
| `gardenLikelihood` | "Very common" \| "Common" \| "Occasional" \| "Rare" \| "Unlikely" | How likely to see in a UK garden |
| `bestTimeToSee` | string | e.g. "Year-round, most vocal Feb-Jun" |
| `feedingTips` | string | What to put out to attract this bird |

### 2.2 Filter & search

- **Search bar** — matches common name, scientific name, family
- **Category pills** — filterable by:
  - Habitat: Garden, Woodland, Wetland, Coastal, Farmland, Upland, Urban
  - Family/order groupings: Songbirds, Raptors, Waterbirds, Seabirds, Waders, Pigeons & Doves, Woodpeckers, Owls, Game birds
- **Conservation status filter** — Red / Amber / Green pills (using DS tint pairs: red, amber, green)
- **Seasonality filter** — Resident / Summer / Winter / Passage
- **Has sound toggle** — filter to only birds with audio
- **Garden likelihood filter** — "Likely in our garden" quick toggle
- **Sort** — A-Z (default), by family, by conservation status
- **A-Z rail** — alphabetic jump (same pattern as Animal Kingdom)

### 2.3 Grid view

- Virtual grid (same TanStack Virtual pattern)
- Responsive columns: 2 (phone) / 3 (768px) / 4 (1024px)
- Card shows: image, common name, conservation status dot, seasonality badge
- Tap → Bird Profile Sheet

### 2.4 Map view

- Toggle between grid and map (same as Animal Kingdom)
- Mapbox GL map showing bird distribution
- Pins coloured by conservation status (Red/Amber/Green)
- Tap pin → Bird Profile Sheet
- Filter state applies to map too

### 2.5 Bird Profile Sheet (bottom sheet)

Compact summary on tap:
- Header row: image thumbnail (w-20 h-20) + common name + scientific name + conservation badge
- Quick stats: size, seasonality, garden likelihood
- Play sound button (if available)
- "Learn More" button → Full Detail Modal

### 2.6 Bird Detail Modal (full screen)

Sections (scrollable):
1. **Hero** — large image with gallery swipe
2. **At a Glance** — conservation status, seasonality, size, family
3. **Identification** — male/female/juvenile/flight descriptions with images
4. **Sound** — audio player with waveform, multiple call types
5. **Behaviour** — feeding, nesting, social
6. **Nesting** — season, clutch size, incubation, fledging
7. **Diet** — what they eat
8. **Habitat** — where they live, UK distribution
9. **Similar Species** — "confused with" section with comparison tips
10. **Map** — inline map showing range
11. **Facts** — fun facts cards
12. **In Our Garden** — if sighted, show sighting history; if not, show "Mark as seen" button
13. **Attract This Bird** — feeding tips for garden

---

## 3. In Our Garden Screen

Laura's personal bird sighting collection. Every bird she's spotted in the garden.

### 3.1 Adding a sighting

Two entry points:
1. From Bird Detail Modal → "Mark as seen in our garden" button
2. From In Our Garden screen → "Add sighting" FAB/button → search picker → select bird

### 3.2 Sighting record

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | Auto-increment |
| `birdId` | string | Reference to bird species |
| `date` | string | YYYY-MM-DD, defaults to today |
| `time` | string \| null | HH:MM, optional |
| `notes` | string \| null | Free text ("Spotted on the fence", "Pair nesting in hedge") |
| `photo` | string \| null | Base64 or blob URL from camera/gallery |
| `count` | number | How many seen (default 1) |
| `weather` | string \| null | Optional weather note |
| `createdAt` | Date | |

### 3.3 Collection view

- **Summary stats at top**: Total species seen, total sightings, current month count, streak (consecutive days with a sighting)
- **Grid of seen birds**: Same card style as Explore but with a "seen" badge and sighting count
- **Sort**: Most recent sighting, alphabetical, most sightings
- **Filter**: By month, by season, by conservation status
- **Search**: Same search bar pattern
- **Empty state**: Illustrated empty state — "Your garden bird list is empty. Head to Explore to discover birds and mark them as seen!"

### 3.4 Bird sighting detail

Tap a bird in the collection → Sheet showing:
- All sighting records for that bird (chronological)
- Total count
- First seen / last seen dates
- Notes and photos from each sighting
- Link back to full species detail

### 3.5 Garden stats

A summary section (could be top of screen or a dedicated sub-tab):
- **Monthly tally chart** — simple bar chart of sightings per month
- **Seasonality breakdown** — which birds visit in which seasons
- **Conservation contribution** — "You've spotted X red-listed species"
- **Garden biodiversity score** — simple metric based on species diversity

---

## 4. Settings Screen

### 4.1 Data management

- **Export data** — export all sighting records as JSON (downloadable file)
- **Import data** — import from JSON file (merge or replace option)
- **Clear all data** — with confirmation modal

### 4.2 Appearance

- **Theme** — Dark (default, matching DS) / Light / System
- **Accent colour** — Blue (default) / Green (nature) / Purple / Pink
- **Reduced motion** — toggle for animation preferences
- **Text size** — Default / Large

### 4.3 About

- App version
- Data attribution (bird data sources, sound credits)
- Privacy note (all data stored locally, nothing sent to servers)

---

## 5. Technical Architecture

### 5.1 Tech stack (same as Animal Kingdom)

- React 18 + TypeScript + Vite
- Tailwind CSS + Design System CSS vars
- Dexie.js (IndexedDB) for local storage
- TanStack Virtual for grid virtualisation
- Framer Motion for animations
- Mapbox GL for maps
- Lucide React for icons
- PWA via vite-plugin-pwa

### 5.2 Database schema

```typescript
// Bird sighting collection
interface GardenSighting {
  id?: number
  birdId: string
  date: string
  time: string | null
  notes: string | null
  photo: string | null
  count: number
  weather: string | null
  createdAt: Date
}

// App preferences
interface AppPreferences {
  id?: number
  theme: 'dark' | 'light' | 'system'
  accentColour: 'blue' | 'green' | 'purple' | 'pink'
  reducedMotion: boolean
  textSize: 'default' | 'large'
}
```

### 5.3 Key hooks

| Hook | Purpose |
|------|---------|
| `useExploreFilter` | Search, category, conservation status, seasonality, sound filtering |
| `useGardenSightings` | CRUD for sighting records |
| `useGardenStats` | Derived stats: species count, monthly tallies, streaks |
| `useBirdAudio` | Audio playback for bird songs/calls |
| `usePreferences` | Theme, accent, motion, text size |
| `useDataExport` | JSON export/import logic |

### 5.4 Data source

Bird data will be a static JSON catalogue bundled with the app (same pattern as `animals.ts` / `animal_encyclopedia.json`). Initial focus on **UK birds** (~600 species on the British List, ~250 commonly seen). Can expand later.

Audio files stored in `/public/bird-sounds/` as MP3s.

### 5.5 Folder structure

```
src/
├── components/
│   ├── layout/          AppRouter, BottomNav, PageHeader, GradientFade
│   ├── ui/              SearchBar, Button, Modal, BottomSheet, Toast
│   ├── explore/         BirdCard, BirdProfileSheet, BirdDetailModal,
│   │                    CategoryPills, ConservationPills, AZRail, BirdMap
│   ├── garden/          SightingCard, AddSightingSheet, SightingDetail,
│   │                    GardenStats, EmptyGarden
│   └── settings/        ThemePicker, DataExport, DataImport
├── screens/
│   ├── ExploreScreen.tsx
│   ├── GardenScreen.tsx
│   └── SettingsScreen.tsx
├── hooks/
│   ├── useExploreFilter.ts
│   ├── useGardenSightings.ts
│   ├── useGardenStats.ts
│   ├── useBirdAudio.ts
│   ├── usePreferences.ts
│   └── useDataExport.ts
├── lib/
│   ├── db.ts
│   └── utils.ts
├── data/
│   ├── birds.ts          (catalogue wrapper)
│   └── birds_uk.json     (static bird data)
├── App.tsx
├── main.tsx
└── index.css
```

### 5.6 Routes

```
/            → ExploreScreen (default landing)
/garden      → GardenScreen
/settings    → SettingsScreen
```

---

## 6. Design considerations

- Same dark design system as Animal Kingdom (NFT dark theme)
- Conservation status colours map naturally to DS tint pairs:
  - Red list → `--red` / `--red-sub` / `--red-t`
  - Amber list → `--amber` / `--amber-sub` / `--amber-t`
  - Green list → `--green` / `--green-sub` / `--green-t`
- Bottom nav icons: Binoculars (Explore), Bird (Garden), Settings (Settings) — all from Lucide
- Glass rule applies to all overlays (same as AK)
- Gradient fade above bottom nav (same as AK)

---

## 7. What's NOT included (stripped from Animal Kingdom)

- No coin economy / wallet
- No card packs or collecting cards
- No games (Word Safari, Coin Rush, Habitat Builder, World Quest)
- No pet adoption / generation / naming
- No racing
- No marketplace / auctions / NPC trading
- No rescue missions
- No achievement badges (could add later as "Garden Milestones")
- No Schleich figurines
- No skins / customisation
- No home screen dashboard (Explore is the landing page)

---

## 8. Future considerations (not in v1)

- **Bird identification helper** — "I saw a bird that looks like..." with filtering by colour, size, beak shape
- **Garden milestones** — achievements for sighting counts, rare birds, streaks
- **Seasonal alerts** — "Winter visitors arriving soon — look out for Fieldfare and Redwing"
- **Photo gallery** — dedicated gallery of Laura's bird photos
- **Nest box cam integration** — if they get a camera
- **Big Garden Birdwatch** — RSPB annual count integration
- **Life list** — expand beyond garden to all birds seen anywhere
- **Social sharing** — share sighting cards
