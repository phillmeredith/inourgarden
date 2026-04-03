// birds.ts — UK bird species catalogue
// Conservation statuses follow the UK Birds of Conservation Concern (BoCC5) classification

export type ConservationStatus = 'Red' | 'Amber' | 'Green'
export type Seasonality = 'Resident' | 'Summer' | 'Winter' | 'Passage'
export type HabitatCategory = 'Garden' | 'Woodland' | 'Wetland' | 'Coastal' | 'Farmland' | 'Upland' | 'Urban'

export interface SoundEntry {
  label: string // e.g. "Song", "Call", "Alarm call"
  url: string
}

export interface BirdSpecies {
  id: string
  name: string            // Common name
  scientificName: string
  family: string          // e.g. "Tits", "Finches", "Thrushes"
  category: HabitatCategory
  conservationStatus: ConservationStatus
  seasonality: Seasonality
  gardenBird: boolean
  size: string            // e.g. "Small (14cm)"
  length: string | null   // e.g. "14-15cm"
  wingspan: string | null // e.g. "21-25.5cm"
  imageUrl: string | null
  soundUrl: string | null // Primary sound URL
  sounds: SoundEntry[]    // All available sounds (song, call, alarm etc.)
  description: string

  // Identification
  identification: {
    male: string
    female: string
    juvenile?: string
    flight?: string
  }

  // Behaviour and ecology
  behaviour: string
  diet: string
  habitat: string
  nesting: string

  // Fun facts
  facts: string[]

  // Similar species for comparison
  similarSpecies: {
    name: string
    tip: string           // How to tell them apart
  }[]

  // Garden likelihood: 1 (rare) to 5 (very common)
  gardenLikelihood: number
}

import { BIRDS_BATCH1 } from './birds_batch1'
import { BIRDS_BATCH2 } from './birds_batch2'
import { BIRDS_BATCH3 } from './birds_batch3'
import { BIRDS_BATCH4 } from './birds_batch4'
import { BIRDS_BATCH5 } from './birds_batch5'
import { BIRDS_BATCH6 } from './birds_batch6'
import { BIRDS_BATCH7 } from './birds_batch7'
import { BIRDS_BATCH9 } from './birds_batch9'
import { BIRDS_BATCH10 } from './birds_batch10'
import { BIRDS_BATCH11 } from './birds_batch11'
import { BIRDS_BATCH12 } from './birds_batch12'

// ─── Static catalogue ─────────────────────────────────────────────────────────

const BIRDS_CORE: BirdSpecies[] = [
  {
    id: 'robin',
    name: 'Robin',
    scientificName: 'Erithacus rubecula',
    family: 'Chats',
    category: 'Garden',
    conservationStatus: 'Green',
    seasonality: 'Resident',
    gardenBird: true,
    size: 'Small (14cm)',
    length: '14cm',
    wingspan: '20-22cm',
    imageUrl: '/birds/robin.jpg',
    soundUrl: '/sounds/robin-song.mp3',
    sounds: [
      { label: 'Song', url: '/sounds/robin-song.mp3' },
      { label: 'Call', url: '/sounds/robin-call.mp3' },
    ],
    description: 'A familiar garden bird with an orange-red breast, known for its beautiful song and territorial behaviour.',
    identification: {
      male: 'Orange-red breast and face, brown upperparts, whitish belly.',
      female: 'Identical to male — both sexes have the red breast.',
      juvenile: 'Spotty brown all over, no red breast. Develops adult plumage in first autumn.',
      flight: 'Low, undulating flight with rapid wing beats.',
    },
    behaviour: 'Territorial year-round. Sings from exposed perches, often at dawn and dusk. Follows gardeners to catch disturbed invertebrates.',
    diet: 'Insects, worms, berries, and seeds. Readily visits feeders for mealworms and suet.',
    habitat: 'Gardens, hedgerows, woodland with dense undergrowth, parks.',
    nesting: 'Cup nest in dense vegetation, hedge banks, or unusual sites like old kettles. 4-6 eggs, 2 broods per year.',
    facts: [
      'Robins sing at night near street lights, often mistaken for nightingales.',
      'Both males and females hold winter territories and will fight intruders fiercely.',
      'The UK robin is unrelated to the American robin, which is a thrush.',
    ],
    similarSpecies: [
      { name: 'Dunnock', tip: 'Dunnock has a thin bill, streaked flanks, and no red breast.' },
    ],
    gardenLikelihood: 5,
  },
  {
    id: 'blue-tit',
    name: 'Blue Tit',
    scientificName: 'Cyanistes caeruleus',
    family: 'Tits',
    category: 'Garden',
    conservationStatus: 'Green',
    seasonality: 'Resident',
    gardenBird: true,
    size: 'Small (12cm)',
    length: '12cm',
    wingspan: '18cm',
    imageUrl: '/birds/blue-tit.jpg',
    soundUrl: '/sounds/blue-tit-song.mp3',
    sounds: [
      { label: 'Song', url: '/sounds/blue-tit-song.mp3' },
      { label: 'Call', url: '/sounds/blue-tit-call.mp3' },
    ],
    description: 'A colourful and acrobatic small bird, easily recognised by its blue cap and yellow underparts.',
    identification: {
      male: 'Blue cap, white face with dark eye stripe, yellow underparts, green back.',
      female: 'Similar to male but slightly duller blue cap.',
      juvenile: 'Yellow face instead of white, duller blue cap.',
      flight: 'Rapid, slightly undulating. Often seen flitting between branches.',
    },
    behaviour: 'Acrobatic feeder, often hanging upside down. Forms mixed flocks with other tit species in winter.',
    diet: 'Insects, caterpillars, seeds, and nuts. Loves peanut feeders and fat balls.',
    habitat: 'Deciduous woodland, hedgerows, gardens, parks.',
    nesting: 'Cavity nester — readily uses nest boxes. 7-13 eggs, one large brood timed to caterpillar peak.',
    facts: [
      'A single brood of blue tits can consume 10,000 caterpillars.',
      'Blue tits can see ultraviolet light. Their blue cap glows in UV, signalling fitness to mates.',
      'They learned to open milk bottle tops in the 20th century — a famous example of cultural learning.',
    ],
    similarSpecies: [
      { name: 'Great Tit', tip: 'Great tit is larger with a black head and white cheeks, plus a bold black belly stripe.' },
    ],
    gardenLikelihood: 5,
  },
  {
    id: 'great-tit',
    name: 'Great Tit',
    scientificName: 'Parus major',
    family: 'Tits',
    category: 'Garden',
    conservationStatus: 'Green',
    seasonality: 'Resident',
    gardenBird: true,
    size: 'Small (14cm)',
    length: '14cm',
    wingspan: '22-25cm',
    imageUrl: '/birds/great-tit.jpg',
    soundUrl: '/sounds/great-tit-song.mp3',
    sounds: [
      { label: 'Song', url: '/sounds/great-tit-song.mp3' },
    ],
    description: 'The largest UK tit, recognised by its black head, white cheeks, and bold yellow underparts with a black stripe.',
    identification: {
      male: 'Black head with white cheeks, yellow underparts with bold black central stripe. Green back.',
      female: 'Similar but narrower black belly stripe.',
      juvenile: 'Duller, with yellowish cheeks instead of white.',
    },
    behaviour: 'Bold and assertive at feeders. Dominant over smaller tit species. Sings a distinctive two-note "teacher-teacher" song.',
    diet: 'Insects, seeds, nuts, and berries. Visits feeders readily for sunflower seeds and peanuts.',
    habitat: 'Woodland, gardens, parks, hedgerows. Anywhere with trees and nest holes.',
    nesting: 'Cavity nester, uses nest boxes. 7-9 eggs. One brood.',
    facts: [
      'Great tits have over 40 different call types.',
      'In harsh winters, great tits have been observed killing and eating other small birds.',
      'Their "teacher-teacher" song is one of the first bird songs children learn to recognise.',
    ],
    similarSpecies: [
      { name: 'Blue Tit', tip: 'Blue tit is smaller with a blue (not black) cap and no belly stripe.' },
      { name: 'Coal Tit', tip: 'Coal tit has a white nape patch and no yellow underparts.' },
    ],
    gardenLikelihood: 5,
  },
  {
    id: 'blackbird',
    name: 'Blackbird',
    scientificName: 'Turdus merula',
    family: 'Thrushes',
    category: 'Garden',
    conservationStatus: 'Green',
    seasonality: 'Resident',
    gardenBird: true,
    size: 'Medium (25cm)',
    length: '24-25cm',
    wingspan: '34-38cm',
    imageUrl: '/birds/blackbird.jpg',
    soundUrl: '/sounds/blackbird-song.mp3',
    sounds: [
      { label: 'Song', url: '/sounds/blackbird-song.mp3' },
      { label: 'Alarm call', url: '/sounds/blackbird-alarm.mp3' },
    ],
    description: 'Males are jet black with a bright orange bill. One of the best songsters in the UK.',
    identification: {
      male: 'Jet black with bright orange-yellow bill and eye ring.',
      female: 'Dark brown with streaked breast, dark bill.',
      juvenile: 'Reddish-brown with spots on breast.',
      flight: 'Low flight with tail fanned on landing.',
    },
    behaviour: 'Forages on lawns, turning over leaves. Males sing from rooftops and treetops at dawn and dusk. Loud alarm call when disturbed.',
    diet: 'Earthworms, insects, berries, and fruit. Loves windfall apples in autumn.',
    habitat: 'Gardens, woodland, hedgerows, parks. One of the most adaptable UK birds.',
    nesting: 'Cup nest in hedges, shrubs, or ivy. 3-5 eggs. 2-3 broods per year.',
    facts: [
      'The blackbird has one of the most beautiful songs of any European bird.',
      'Originally a woodland bird, it adapted to gardens only in the 19th century.',
      'Females are brown, not black — a common source of confusion.',
    ],
    similarSpecies: [
      { name: 'Ring Ouzel', tip: 'Ring ouzel has a white crescent on the breast and is found on upland moors.' },
      { name: 'Starling', tip: 'Starling is smaller, glossy with spots, and has a pointed bill.' },
    ],
    gardenLikelihood: 5,
  },
  {
    id: 'house-sparrow',
    name: 'House Sparrow',
    scientificName: 'Passer domesticus',
    family: 'Sparrows',
    category: 'Urban',
    conservationStatus: 'Red',
    seasonality: 'Resident',
    gardenBird: true,
    size: 'Small (14cm)',
    length: '14-15cm',
    wingspan: '21-25cm',
    imageUrl: '/birds/house-sparrow.jpg',
    soundUrl: '/sounds/house-sparrow-call.mp3',
    sounds: [
      { label: 'Call', url: '/sounds/house-sparrow-call.mp3' },
    ],
    description: 'A familiar bird of towns and cities, the male has a grey crown and black bib.',
    identification: {
      male: 'Grey crown, chestnut nape, black bib, streaked brown back.',
      female: 'Plain brown with pale eyebrow stripe. No black bib.',
      juvenile: 'Similar to female.',
    },
    behaviour: 'Highly social, always in noisy groups. Dust-bathes on paths. Nests colonially.',
    diet: 'Seeds, grain, insects, scraps. Frequent at bird tables.',
    habitat: 'Towns, villages, farms — always near human habitation.',
    nesting: 'Untidy nest in roof spaces, holes in buildings, or dense ivy. 3-5 eggs. 2-3 broods.',
    facts: [
      'House sparrow numbers have declined by over 50% since the 1970s, earning them Red status.',
      'They are one of the most widespread birds on Earth, found on every continent except Antarctica.',
      'Males with larger black bibs tend to be more dominant.',
    ],
    similarSpecies: [
      { name: 'Tree Sparrow', tip: 'Tree sparrow has a chestnut (not grey) crown and a black cheek spot.' },
      { name: 'Dunnock', tip: 'Dunnock has a thin bill and is more grey, less brown.' },
    ],
    gardenLikelihood: 4,
  },
  {
    id: 'goldfinch',
    name: 'Goldfinch',
    scientificName: 'Carduelis carduelis',
    family: 'Finches',
    category: 'Garden',
    conservationStatus: 'Green',
    seasonality: 'Resident',
    gardenBird: true,
    size: 'Small (12cm)',
    length: '12cm',
    wingspan: '21-25cm',
    imageUrl: '/birds/goldfinch.jpg',
    soundUrl: '/sounds/goldfinch-song.mp3',
    sounds: [
      { label: 'Song', url: '/sounds/goldfinch-song.mp3' },
    ],
    description: 'A strikingly colourful finch with a red face, black and white head, and golden wing bars.',
    identification: {
      male: 'Red face, black and white head, golden wing bars, sandy brown body.',
      female: 'Very similar to male; slightly less extensive red on face.',
      juvenile: 'Brown-streaked head, lacks red face. Wing bars present from fledging.',
      flight: 'Bouncy, undulating. Broad golden wing bars very visible.',
    },
    behaviour: 'Often feeds in flocks on seed heads. Tinkling flight call. Increasingly visits garden feeders, especially nyjer seed.',
    diet: 'Seeds, especially thistles, teasels, and dandelions. Loves nyjer seed feeders.',
    habitat: 'Orchards, gardens, wasteland, field edges — anywhere with seed-bearing plants.',
    nesting: 'Neat cup nest at end of a branch. 5-6 eggs. 2-3 broods.',
    facts: [
      'A group of goldfinches is called a "charm".',
      'Goldfinch numbers have increased by 80% since the 1980s, partly due to garden feeding.',
      'Their fine, pointed bill is perfectly adapted for extracting seeds from teasel heads.',
    ],
    similarSpecies: [
      { name: 'Siskin', tip: 'Siskin is green-yellow without the red face.' },
    ],
    gardenLikelihood: 4,
  },
  {
    id: 'woodpigeon',
    name: 'Woodpigeon',
    scientificName: 'Columba palumbus',
    family: 'Pigeons',
    category: 'Garden',
    conservationStatus: 'Green',
    seasonality: 'Resident',
    gardenBird: true,
    size: 'Large (41cm)',
    length: '40-42cm',
    wingspan: '75-80cm',
    imageUrl: '/birds/woodpigeon.jpg',
    soundUrl: '/sounds/woodpigeon-song.mp3',
    sounds: [
      { label: 'Song', url: '/sounds/woodpigeon-song.mp3' },
    ],
    description: 'A large, common pigeon with a pink breast, white neck patch, and distinctive cooing song.',
    identification: {
      male: 'Grey overall with pink breast, white neck patch, and white wing bars in flight.',
      female: 'Identical to male.',
      juvenile: 'Lacks the white neck patch.',
      flight: 'Clattering wing-clap display flight. White wing bars distinctive.',
    },
    behaviour: 'Walks on lawns and feeds on crops. Distinctive cooing song. Display flight involves steep climb, wing-clap, then glide.',
    diet: 'Seeds, grain, berries, green leaves, buds. Can be a crop pest.',
    habitat: 'Woodland, parks, gardens, farmland. Common everywhere.',
    nesting: 'Flimsy platform of twigs in trees or hedges. 2 eggs. Multiple broods year-round.',
    facts: [
      'The woodpigeon is the UK\'s largest and most common pigeon.',
      'Their five-note song is often written as "my toe bleeds, Betty".',
      'They can drink by sucking water up through their bill — most birds have to tilt their head back.',
    ],
    similarSpecies: [
      { name: 'Stock Dove', tip: 'Stock dove is smaller, lacks white neck patch and wing bars.' },
      { name: 'Feral Pigeon', tip: 'Feral pigeon is smaller with variable plumage and no white neck patch.' },
    ],
    gardenLikelihood: 5,
  },
  {
    id: 'wren',
    name: 'Wren',
    scientificName: 'Troglodytes troglodytes',
    family: 'Wrens',
    category: 'Garden',
    conservationStatus: 'Amber',
    seasonality: 'Resident',
    gardenBird: true,
    size: 'Tiny (10cm)',
    length: '9-10cm',
    wingspan: '13-17cm',
    imageUrl: '/birds/wren.jpg',
    soundUrl: '/sounds/wren-song.mp3',
    sounds: [
      { label: 'Song', url: '/sounds/wren-song.mp3' },
    ],
    description: 'One of the UK\'s smallest birds, the wren is tiny and round with a cocked tail and surprisingly loud song.',
    identification: {
      male: 'Tiny, round, brown bird with a cocked tail. Pale eyebrow stripe. Barred wings and tail.',
      female: 'Identical to male.',
      flight: 'Whirring, low flight on short wings.',
    },
    behaviour: 'Skulks in undergrowth. Surprisingly loud song for such a tiny bird. Males build multiple nests for females to choose from.',
    diet: 'Insects and spiders, found by probing crevices and undergrowth.',
    habitat: 'Dense undergrowth, hedgerows, gardens, woodland, rocky areas.',
    nesting: 'Domed nest in dense cover. Male builds several, female chooses one and lines it. 5-8 eggs.',
    facts: [
      'The wren is one of the UK\'s smallest birds but has one of the loudest songs relative to body size.',
      'In cold weather, wrens roost communally — up to 60 have been recorded in a single nest box.',
      'Despite being tiny, wrens are the most common breeding bird in the UK.',
    ],
    similarSpecies: [
      { name: 'Goldcrest', tip: 'Goldcrest is even smaller, greenish, with a gold stripe on the crown.' },
    ],
    gardenLikelihood: 4,
  },
  {
    id: 'song-thrush',
    name: 'Song Thrush',
    scientificName: 'Turdus philomelos',
    family: 'Thrushes',
    category: 'Garden',
    conservationStatus: 'Red',
    seasonality: 'Resident',
    gardenBird: true,
    size: 'Medium (23cm)',
    length: '20-23cm',
    wingspan: '33-36cm',
    imageUrl: '/birds/song-thrush.jpg',
    soundUrl: '/sounds/song-thrush-song.mp3',
    sounds: [
      { label: 'Song', url: '/sounds/song-thrush-song.mp3' },
    ],
    description: 'A classic garden thrush known for repeating song phrases and smashing snails on stones.',
    identification: {
      male: 'Brown upperparts, cream underparts with dark spots arranged in streaks. Warm orange-buff underwing.',
      female: 'Identical to male.',
      juvenile: 'Similar but with pale streaks on back.',
      flight: 'Direct flight; orange-buff underwing visible.',
    },
    behaviour: 'Smashes snails on favourite "anvil" stones. Repeats song phrases 2-4 times. Sings from treetops.',
    diet: 'Snails, worms, berries, and fruit. The only UK thrush that regularly eats snails.',
    habitat: 'Gardens, woodland, hedgerows, parks.',
    nesting: 'Cup nest lined with mud in hedges or shrubs. 4-5 eggs. 2-3 broods.',
    facts: [
      'Song thrushes repeat each song phrase 2-4 times, unlike the blackbird which rarely repeats.',
      'They are one of the few birds that can break into snail shells, using a stone as an anvil.',
      'Numbers have declined by over 50% since the 1970s.',
    ],
    similarSpecies: [
      { name: 'Mistle Thrush', tip: 'Mistle thrush is larger, greyer, with rounder spots and white tail corners in flight.' },
      { name: 'Redwing', tip: 'Redwing has a bold white eyebrow stripe and red flanks.' },
    ],
    gardenLikelihood: 3,
  },
  {
    id: 'long-tailed-tit',
    name: 'Long-tailed Tit',
    scientificName: 'Aegithalos caudatus',
    family: 'Tits',
    category: 'Woodland',
    conservationStatus: 'Green',
    seasonality: 'Resident',
    gardenBird: true,
    size: 'Small (14cm inc. tail)',
    length: '13-15cm',
    wingspan: '16-19cm',
    imageUrl: '/birds/long-tailed-tit.jpg',
    soundUrl: '/sounds/long-tailed-tit-call.mp3',
    sounds: [
      { label: 'Call', url: '/sounds/long-tailed-tit-call.mp3' },
    ],
    description: 'A tiny, round-bodied bird with a spectacularly long tail, always seen in family flocks.',
    identification: {
      male: 'Tiny round body with an extremely long tail. Pink, black, and white plumage. Pink shoulder patches.',
      female: 'Identical to male.',
      juvenile: 'Darker, less pink, with a dark stripe through the eye.',
      flight: 'Weak, undulating flight showing the very long tail.',
    },
    behaviour: 'Always in family flocks of 8-20, calling constantly to stay in contact. Roost huddled together for warmth.',
    diet: 'Insects, spiders, and their eggs. Occasionally visits feeders for suet and fat balls.',
    habitat: 'Woodland edges, hedgerows, gardens, scrub.',
    nesting: 'Elaborate domed nest of moss, lichen, and spider silk, lined with up to 2000 feathers. 8-12 eggs.',
    facts: [
      'Their nest is one of the most elaborate of any British bird, taking 3 weeks to build.',
      'Failed breeders become helpers at relatives\' nests — a rare behaviour in birds.',
      'Despite the name, they are not true tits but belong to their own family.',
    ],
    similarSpecies: [
      { name: 'Pied Wagtail', tip: 'Pied wagtail has a long tail but is black and white with a wagging motion.' },
    ],
    gardenLikelihood: 3,
  },
  {
    id: 'swift',
    name: 'Swift',
    scientificName: 'Apus apus',
    family: 'Swifts',
    category: 'Urban',
    conservationStatus: 'Red',
    seasonality: 'Summer',
    gardenBird: false,
    size: 'Medium (17cm)',
    length: '16-17cm',
    wingspan: '42-48cm',
    imageUrl: '/birds/swift.jpg',
    soundUrl: '/sounds/swift-call.mp3',
    sounds: [
      { label: 'Screaming call', url: '/sounds/swift-call.mp3' },
    ],
    description: 'An aerial master that spends almost its entire life on the wing, returning to the UK only for a few months in summer.',
    identification: {
      male: 'All dark brown-black with a pale throat. Long, scythe-shaped wings. Short forked tail.',
      female: 'Identical to male.',
      flight: 'Rapid, stiff-winged flight. Screaming parties chase around rooftops in summer evenings.',
    },
    behaviour: 'Almost entirely aerial — eats, sleeps, and mates on the wing. Only lands at the nest. Screaming parties are a defining sound of summer.',
    diet: 'Flying insects and spiders caught on the wing. Feeds at high altitude in good weather.',
    habitat: 'Over towns and cities in summer. Nests in roof spaces of older buildings.',
    nesting: 'In roof cavities or under eaves. 2-3 eggs. Single brood. Faithful to the same nest site for life.',
    facts: [
      'Swifts spend almost their entire lives in the air — they can sleep while flying.',
      'Young swifts leave the nest and may not land again for 2-3 years until they breed.',
      'They arrive in the UK in late April and leave by mid-August — the shortest summer visit of any migrant.',
    ],
    similarSpecies: [
      { name: 'Swallow', tip: 'Swallow has a red throat, blue back, and long tail streamers.' },
      { name: 'House Martin', tip: 'House martin has a white rump and white underparts.' },
    ],
    gardenLikelihood: 1,
  },
  {
    id: 'kingfisher',
    name: 'Kingfisher',
    scientificName: 'Alcedo atthis',
    family: 'Kingfishers',
    category: 'Wetland',
    conservationStatus: 'Amber',
    seasonality: 'Resident',
    gardenBird: false,
    size: 'Small (16cm)',
    length: '16-17cm',
    wingspan: '24-26cm',
    imageUrl: '/birds/kingfisher.jpg',
    soundUrl: '/sounds/kingfisher-call.mp3',
    sounds: [
      { label: 'Call', url: '/sounds/kingfisher-call.mp3' },
    ],
    description: 'A dazzling small bird with electric blue upperparts and orange underparts, seen as a flash of colour over water.',
    identification: {
      male: 'Electric blue upperparts, orange underparts, white throat. Dagger-like black bill.',
      female: 'Similar but lower mandible is orange-red.',
      flight: 'Fast and low over water, a flash of blue.',
    },
    behaviour: 'Perches motionless on a branch over water, then dives headfirst for fish. Bobs head before diving.',
    diet: 'Small fish, aquatic insects, and crustaceans.',
    habitat: 'Rivers, streams, lakes, canals — clean, slow-moving or still water with suitable perches.',
    nesting: 'Burrow in a riverbank, up to 90cm deep. 6-7 eggs. 2 broods.',
    facts: [
      'Kingfisher plumage is not actually blue — it is brown. The blue colour is caused by light scattering in the feather structure.',
      'The Japanese bullet train nose was designed based on the kingfisher\'s bill to reduce sonic booms.',
      'They eat about 60% of their body weight in fish each day.',
    ],
    similarSpecies: [],
    gardenLikelihood: 1,
  },
  {
    id: 'curlew',
    name: 'Curlew',
    scientificName: 'Numenius arquata',
    family: 'Sandpipers',
    category: 'Upland',
    conservationStatus: 'Red',
    seasonality: 'Resident',
    gardenBird: false,
    size: 'Large (55cm)',
    length: '50-60cm',
    wingspan: '80-100cm',
    imageUrl: '/birds/curlew.jpg',
    soundUrl: '/sounds/curlew-call.mp3',
    sounds: [
      { label: 'Call', url: '/sounds/curlew-call.mp3' },
      { label: 'Song', url: '/sounds/curlew-song.mp3' },
    ],
    description: 'A large wader with a very long, downcurved bill and an evocative bubbling call that defines wild moorland.',
    identification: {
      male: 'Large, brown-streaked wader with a very long, downcurved bill. Relatively plain face.',
      female: 'Similar but longer bill than male.',
      flight: 'Large wader with pointed wings, long bill visible in flight. White rump.',
    },
    behaviour: 'Probes deeply in mud for invertebrates. Bubbling song on breeding grounds. Flocks on estuaries in winter.',
    diet: 'Worms, shellfish, crabs, and insects, extracted with its long bill.',
    habitat: 'Breeds on upland moors and rough grassland. Winters on estuaries, mudflats, and coastal fields.',
    nesting: 'Scrape on the ground in heather or rough grass. 4 eggs. Single brood.',
    facts: [
      'The curlew\'s evocative call is one of the most recognisable sounds of wild Britain.',
      'The UK holds about 25% of the world\'s breeding curlews.',
      'Curlew numbers have halved in the last 25 years, making them the UK\'s most pressing bird conservation priority.',
    ],
    similarSpecies: [
      { name: 'Whimbrel', tip: 'Whimbrel is smaller with a striped crown and shorter bill.' },
    ],
    gardenLikelihood: 1,
  },
  {
    id: 'oystercatcher',
    name: 'Oystercatcher',
    scientificName: 'Haematopus ostralegus',
    family: 'Oystercatchers',
    category: 'Coastal',
    conservationStatus: 'Amber',
    seasonality: 'Resident',
    gardenBird: false,
    size: 'Large (43cm)',
    length: '40-45cm',
    wingspan: '80-86cm',
    imageUrl: '/birds/oystercatcher.jpg',
    soundUrl: '/sounds/oystercatcher-call.mp3',
    sounds: [
      { label: 'Call', url: '/sounds/oystercatcher-call.mp3' },
    ],
    description: 'A striking black and white wader with a long orange bill and pink legs, common on coasts and increasingly inland.',
    identification: {
      male: 'Black and white plumage, long orange-red bill, pink legs, red eye.',
      female: 'Identical to male.',
      juvenile: 'Brown-tinged black, dark-tipped bill.',
      flight: 'Bold black and white wing pattern. Noisy in flight.',
    },
    behaviour: 'Piping call in flight. Feeds by probing and hammering shellfish open. Forms large winter flocks.',
    diet: 'Mussels, cockles, worms, and limpets. Two feeding techniques: stabbing or hammering.',
    habitat: 'Coasts, estuaries, and increasingly inland on rivers, lakes, and farmland.',
    nesting: 'Scrape on shingle, short turf, or flat rooftops. 3 eggs. Single brood.',
    facts: [
      'Despite the name, oystercatchers rarely eat oysters — they prefer mussels and cockles.',
      'They teach their chicks which feeding technique to use (stabbing or hammering), passed down through generations.',
      'Oystercatchers can live for over 40 years.',
    ],
    similarSpecies: [
      { name: 'Avocet', tip: 'Avocet has an upturned bill, is more slender, and has black and white plumage.' },
    ],
    gardenLikelihood: 1,
  },
  {
    id: 'skylark',
    name: 'Skylark',
    scientificName: 'Alauda arvensis',
    family: 'Larks',
    category: 'Farmland',
    conservationStatus: 'Red',
    seasonality: 'Resident',
    gardenBird: false,
    size: 'Medium (18cm)',
    length: '18-19cm',
    wingspan: '30-36cm',
    imageUrl: '/birds/skylark.jpg',
    soundUrl: '/sounds/skylark-song.mp3',
    sounds: [
      { label: 'Song', url: '/sounds/skylark-song.mp3' },
    ],
    description: 'Famous for its sustained, soaring song flight high above farmland and open grassland.',
    identification: {
      male: 'Brown-streaked, with a small crest. White outer tail feathers. Pale underparts with streaked breast.',
      female: 'Identical to male.',
      flight: 'Rises vertically while singing, hovering high above fields.',
    },
    behaviour: 'Famous for its song flight — rises almost vertically, singing continuously for minutes. Walks and runs rather than hopping.',
    diet: 'Seeds, grain, and insects. Ground feeder.',
    habitat: 'Arable farmland, grassland, heaths, saltmarsh.',
    nesting: 'Ground nest in a scrape among crops or grass. 3-4 eggs. 2 broods.',
    facts: [
      'Skylarks can sing for up to an hour without stopping, at heights of 50-100 metres.',
      'Their song has inspired poets from Shakespeare to Shelley.',
      'Numbers have declined by 75% since 1972, largely due to changes in farming practice.',
    ],
    similarSpecies: [
      { name: 'Meadow Pipit', tip: 'Meadow pipit is slimmer, lacks a crest, and has a thinner bill.' },
    ],
    gardenLikelihood: 1,
  },
  {
    id: 'nuthatch',
    name: 'Nuthatch',
    scientificName: 'Sitta europaea',
    family: 'Nuthatches',
    category: 'Woodland',
    conservationStatus: 'Green',
    seasonality: 'Resident',
    gardenBird: true,
    size: 'Small (14cm)',
    length: '14cm',
    wingspan: '22-27cm',
    imageUrl: '/birds/nuthatch.jpg',
    soundUrl: '/sounds/nuthatch-call.mp3',
    sounds: [
      { label: 'Call', url: '/sounds/nuthatch-call.mp3' },
    ],
    description: 'A stocky woodland bird with a blue-grey back and bold black eye stripe, unique in being able to walk headfirst down trees.',
    identification: {
      male: 'Blue-grey upperparts, buff-orange underparts, bold black eye stripe. Dagger-like bill.',
      female: 'Similar but paler orange underparts.',
      flight: 'Undulating, showing short tail.',
    },
    behaviour: 'Unique ability to descend tree trunks headfirst. Wedges nuts into bark crevices and hammers them open. Loud, ringing call.',
    diet: 'Insects, seeds, and nuts. Caches food in bark crevices. Visits feeders for sunflower seeds and peanuts.',
    habitat: 'Mature deciduous woodland, parkland, and gardens with large trees.',
    nesting: 'Natural tree holes or nest boxes, plastering mud around the entrance to reduce the hole size. 6-8 eggs.',
    facts: [
      'The nuthatch is the only UK bird that can walk down a tree trunk headfirst.',
      'They plaster mud around nest hole entrances to make them the right size — and will reduce nest box holes too.',
      'Nuthatches are expanding northward in the UK, now reaching southern Scotland.',
    ],
    similarSpecies: [
      { name: 'Treecreeper', tip: 'Treecreeper is brown and white, always climbs upward, and has a curved bill.' },
    ],
    gardenLikelihood: 3,
  },
  {
    id: 'puffin',
    name: 'Puffin',
    scientificName: 'Fratercula arctica',
    family: 'Auks',
    category: 'Coastal',
    conservationStatus: 'Red',
    seasonality: 'Summer',
    gardenBird: false,
    size: 'Medium (30cm)',
    length: '26-29cm',
    wingspan: '47-63cm',
    imageUrl: '/birds/puffin.jpg',
    soundUrl: null,
    sounds: [],
    description: 'An iconic seabird with a colourful triangular bill, breeding on clifftop burrows and spending winter far out at sea.',
    identification: {
      male: 'Black upperparts, white face and underparts. Large, colourful triangular bill (orange, blue, and yellow). Orange feet.',
      female: 'Identical to male.',
      juvenile: 'Smaller, darker bill. Grey face.',
      flight: 'Rapid wing beats, whirring flight low over sea.',
    },
    behaviour: 'Breeds in large colonies on clifftop burrows. Expert diver, catching sand eels underwater. Carries multiple fish crosswise in bill.',
    diet: 'Sand eels, sprats, and other small fish, caught by diving.',
    habitat: 'Offshore islands and sea cliffs for breeding. Open sea in winter.',
    nesting: 'Burrow on grassy clifftop, sometimes uses old rabbit burrows. 1 egg. Single brood.',
    facts: [
      'Puffins can carry 10 or more sand eels in their bill at once, held crosswise.',
      'They spend most of the year at sea, only coming to land to breed.',
      'Puffin bills become duller in winter and brighten up for the breeding season.',
    ],
    similarSpecies: [
      { name: 'Razorbill', tip: 'Razorbill has a thicker black bill with a white line, and lacks the colourful face.' },
      { name: 'Guillemot', tip: 'Guillemot is slimmer with a pointed bill and no colourful bill markings.' },
    ],
    gardenLikelihood: 1,
  },
  {
    id: 'barn-owl',
    name: 'Barn Owl',
    scientificName: 'Tyto alba',
    family: 'Owls',
    category: 'Farmland',
    conservationStatus: 'Amber',
    seasonality: 'Resident',
    gardenBird: false,
    size: 'Medium (34cm)',
    length: '33-35cm',
    wingspan: '80-95cm',
    imageUrl: '/birds/guillemot.jpg',
    soundUrl: '/sounds/barn-owl-call.mp3',
    sounds: [
      { label: 'Screech', url: '/sounds/barn-owl-call.mp3' },
    ],
    description: 'A ghostly, pale owl with a heart-shaped face, hunting silently over rough grassland at dusk.',
    identification: {
      male: 'White heart-shaped face, golden-buff upperparts with grey markings, white underparts.',
      female: 'Similar but often has small dark spots on breast and flanks.',
      flight: 'Silent, ghost-like flight on long, rounded wings. Pale underside distinctive.',
    },
    behaviour: 'Hunts at dusk and dawn, quartering low over rough grassland. Silent flight. Swallows prey whole.',
    diet: 'Voles, mice, shrews, and occasionally small birds.',
    habitat: 'Rough grassland, field margins, farmland with suitable hunting habitat.',
    nesting: 'In barns, tree holes, or nest boxes. 4-6 eggs. 1-2 broods depending on prey availability.',
    facts: [
      'Barn owls can locate prey in complete darkness using hearing alone.',
      'They swallow prey whole and regurgitate pellets of indigestible bone and fur.',
      'A barn owl eats about 1,500 mice and voles per year.',
    ],
    similarSpecies: [
      { name: 'Short-eared Owl', tip: 'Short-eared owl has yellow eyes, streaked underparts, and dark wing patches.' },
    ],
    gardenLikelihood: 1,
  },
  {
    id: 'greenfinch',
    name: 'Greenfinch',
    scientificName: 'Chloris chloris',
    family: 'Finches',
    category: 'Garden',
    conservationStatus: 'Red',
    seasonality: 'Resident',
    gardenBird: true,
    size: 'Small (15cm)',
    length: '15cm',
    wingspan: '25-27cm',
    imageUrl: '/birds/greenfinch.jpg',
    soundUrl: '/sounds/greenfinch-song.mp3',
    sounds: [
      { label: 'Song', url: '/sounds/greenfinch-song.mp3' },
    ],
    description: 'An olive-green finch with bright yellow wing patches, once common at garden feeders but now in serious decline.',
    identification: {
      male: 'Olive-green with bright yellow wing and tail patches. Stout, pale bill.',
      female: 'Duller and browner than male, with less yellow.',
      juvenile: 'Brown-streaked, with faint wing bars.',
      flight: 'Undulating. Bat-like display flight with slow wing beats.',
    },
    behaviour: 'Regular at garden feeders. Display flight involves slow, deliberate wing beats while singing. Can be aggressive at feeders.',
    diet: 'Seeds, especially sunflower seeds and peanuts at feeders. Some berries.',
    habitat: 'Gardens, parks, woodland edges, farmland hedgerows.',
    nesting: 'Cup nest in dense shrubs or hedges. 4-6 eggs. 2 broods.',
    facts: [
      'Greenfinch populations crashed by 35% due to the trichomonosis disease in 2005-2007.',
      'They are now on the Red list due to ongoing population decline.',
      'The wheezy "dzweee" flight call is a distinctive garden sound.',
    ],
    similarSpecies: [
      { name: 'Siskin', tip: 'Siskin is smaller, more streaked, with a dark cap and thinner bill.' },
    ],
    gardenLikelihood: 3,
  },
  {
    id: 'lapwing',
    name: 'Lapwing',
    scientificName: 'Vanellus vanellus',
    family: 'Plovers',
    category: 'Farmland',
    conservationStatus: 'Red',
    seasonality: 'Resident',
    gardenBird: false,
    size: 'Medium (30cm)',
    length: '28-31cm',
    wingspan: '82-87cm',
    imageUrl: '/birds/lapwing.jpg',
    soundUrl: '/sounds/lapwing-call.mp3',
    sounds: [
      { label: 'Call', url: '/sounds/lapwing-call.mp3' },
    ],
    description: 'A striking wader with iridescent green-purple upperparts, a wispy crest, and a tumbling display flight.',
    identification: {
      male: 'Black and white with iridescent green-purple upperparts. Long, wispy crest. Broad, rounded wings.',
      female: 'Similar but shorter crest.',
      flight: 'Floppy, tumbling display flight. Broad rounded wings distinctive.',
    },
    behaviour: 'Tumbling display flight with "peewit" call in spring. Forms large winter flocks on fields. Bobs when alarmed.',
    diet: 'Insects, worms, and other invertebrates from farmland soil.',
    habitat: 'Arable farmland, wet grassland, marshes. Winter flocks on ploughed fields.',
    nesting: 'Scrape on bare or short-vegetation ground. 4 eggs. Single brood.',
    facts: [
      'Also known as the "peewit" after its distinctive call.',
      'Breeding numbers have declined by 80% since the 1960s.',
      'In winter, huge flocks gather on fields, sometimes numbering thousands.',
    ],
    similarSpecies: [
      { name: 'Golden Plover', tip: 'Golden plover lacks the crest and has gold-spangled upperparts.' },
    ],
    gardenLikelihood: 1,
  },
]

// ─── Merge all batches, deduplicating by id (core entries take priority) ─────

function dedup(birds: BirdSpecies[]): BirdSpecies[] {
  const seen = new Set<string>()
  const result: BirdSpecies[] = []
  for (const b of birds) {
    if (!seen.has(b.id)) {
      seen.add(b.id)
      result.push(b)
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name))
}

export const BIRDS: BirdSpecies[] = dedup([
  ...BIRDS_CORE,
  ...BIRDS_BATCH1,
  ...BIRDS_BATCH2,
  ...BIRDS_BATCH3,
  ...BIRDS_BATCH4,
  ...BIRDS_BATCH5,
  ...BIRDS_BATCH6,
  ...BIRDS_BATCH7,
  ...BIRDS_BATCH9,
  ...BIRDS_BATCH10,
  ...BIRDS_BATCH11,
  ...BIRDS_BATCH12,
])

// ─── Derived constants ────────────────────────────────────────────────────────

export const ALL_CATEGORIES: HabitatCategory[] = [
  'Garden', 'Woodland', 'Wetland', 'Coastal', 'Farmland', 'Upland', 'Urban',
]

export const ALL_CONSERVATION: ConservationStatus[] = ['Red', 'Amber', 'Green']

export const ALL_SEASONALITIES: Seasonality[] = ['Resident', 'Summer', 'Winter', 'Passage']

/** Look up a single bird by its id. Returns undefined if not found. */
export function getBirdById(id: string): BirdSpecies | undefined {
  return BIRDS.find(b => b.id === id)
}
