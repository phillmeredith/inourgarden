// attractData.ts — garden-attraction enrichment layer
// Keyed by bird common name (matches BirdSpecies.name exactly).
// Provides hierarchy tier, feeding guide, garden tips, conflict data.

export type HierarchyTier = 'apex' | 'dominant' | 'assertive' | 'moderate' | 'shy'

export const TIER_META: Record<HierarchyTier, { label: string; color: string; bg: string; description: string }> = {
  apex:      { label: 'Predator',  color: 'var(--red-t)',    bg: 'var(--red-sub)',    description: 'Hunts garden birds — clears feeders on arrival' },
  dominant:  { label: 'Dominant',  color: 'var(--amber-t)',  bg: 'var(--amber-sub)',  description: 'Bold and large — routinely displaces other species' },
  assertive: { label: 'Assertive', color: 'var(--amber-t)',  bg: 'var(--amber-sub)',  description: 'Confident in groups — can monopolise feeding points' },
  moderate:  { label: 'Friendly',  color: 'var(--green-t)',  bg: 'var(--green-sub)',  description: 'Generally peaceful — holds its own without bullying' },
  shy:       { label: 'Gentle',    color: 'var(--blue-t)',   bg: 'var(--blue-sub)',   description: 'Easily displaced — needs quiet spots and spare feeders' },
}

export interface FoodItem {
  item: string
}

export interface AttractEntry {
  tier: HierarchyTier
  foods: FoodItem[]
  feederType: string        // How/where they feed
  gardenTips: string[]      // Actionable bullet tips
  nestingNote?: string      // Nest box / nesting advice if relevant
  conflictsWith?: string[]  // Common names this bird threatens
  conflictReason?: string   // Why it's a threat
  goodWith?: string[]       // Particularly compatible species
  seasonNote?: string       // Seasonal context
}

export const ATTRACT_DATA: Record<string, AttractEntry> = {

  'Robin': {
    tier: 'moderate',
    foods: [
      { item: 'Mealworms', emoji: '🪱' },
      { item: 'Suet pellets', emoji: '🟤' },
      { item: 'Sunflower hearts', emoji: '🌻' },
      { item: 'Soft fruit', emoji: '🫐' },
    ],
    feederType: 'Low tray feeder or open ground — reluctant to use hanging feeders',
    gardenTips: [
      'Place food near cover such as a hedge or shrub — robins prefer feeding close to shelter',
      'They become remarkably tame with patience; try hand-feeding mealworms after a few weeks',
      'Robins are fiercely territorial with each other — expect only one pair per garden',
      'Plant dense ivy or a low hedge for nesting; they also readily use open-fronted nest boxes',
      'Fresh mealworms are the single best thing you can put out — especially in breeding season',
    ],
    nestingNote: 'Open-fronted nest box sited 1–2m high, hidden in climbers, ivy or hedges',
    goodWith: ['Dunnock', 'Wren', 'Long-tailed Tit', 'Song Thrush'],
    seasonNote: 'Year-round resident; most vocal and visible in winter',
  },

  'Blue Tit': {
    tier: 'moderate',
    foods: [
      { item: 'Sunflower hearts', emoji: '🌻' },
      { item: 'Peanuts', emoji: '🥜' },
      { item: 'Suet', emoji: '🟤' },
    ],
    feederType: 'Any hanging feeder — very agile and will use all styles',
    gardenTips: [
      'A 25mm hole nest box is the single most effective thing for blue tits — they use them reliably year after year',
      'Face the box north or north-east to avoid overheating in summer',
      'Plant trees that support caterpillars (oak is ideal) — a nesting pair needs ~10,000 caterpillars for one brood',
      'Often the first tit to find a new feeder — attract them and great tits and coal tits usually follow',
      'Protect nest boxes with a metal hole plate to prevent woodpecker raids',
    ],
    nestingNote: '25mm hole nest box, 1.5–3m high on a tree or wall, facing north or north-east',
    conflictsWith: [],
    goodWith: ['Great Tit', 'Coal Tit', 'Long-tailed Tit', 'Chaffinch', 'Robin'],
    seasonNote: 'Year-round resident; roams in mixed tit flocks in winter',
  },

  'Great Tit': {
    tier: 'moderate',
    foods: [
      { item: 'Peanuts', emoji: '🥜' },
      { item: 'Sunflower hearts', emoji: '🌻' },
      { item: 'Suet', emoji: '🟤' },
      { item: 'Mealworms', emoji: '🪱' },
    ],
    feederType: 'Hanging feeder or ground; the most confident of the tits',
    gardenTips: [
      'The largest garden tit — will displace blue tits at busy feeders',
      'A 28mm hole nest box suits great tits and gives them a slight edge over blue tits',
      'Drill holes in a log section, pack with suet or peanut butter mix — a "tit log" they love',
      'Very bold and adaptable; one of the easiest garden birds to habituate to regular feeding',
      'Their "teacher-teacher" song is one of the first heard in late January — a sign spring is coming',
    ],
    nestingNote: '28mm hole nest box, 1.5–3m high on a tree or sheltered wall',
    goodWith: ['Blue Tit', 'Coal Tit', 'Nuthatch', 'Chaffinch'],
    seasonNote: 'Year-round resident',
  },

  'Coal Tit': {
    tier: 'shy',
    foods: [
      { item: 'Sunflower hearts', emoji: '🌻' },
      { item: 'Peanuts', emoji: '🥜' },
    ],
    feederType: 'Hanging feeder — makes rapid in-and-out visits, caches food nearby',
    gardenTips: [
      'The smallest and shyest garden tit — often bullied by great and blue tits at feeders',
      'Multiple feeders are key — coal tits need a feeder that isn\'t dominated by larger species',
      'They cache seeds in bark crevices and the ground, returning to them throughout the day',
      'Conifers in or near the garden greatly increase the chances of coal tit visits',
      'Often arrives as part of winter roaming tit flocks — watch for the white nape stripe',
    ],
    nestingNote: '25mm hole nest box, ideally mounted near a conifer',
    goodWith: ['Blue Tit', 'Long-tailed Tit', 'Goldcrest'],
    seasonNote: 'Year-round resident',
  },

  'Long-tailed Tit': {
    tier: 'shy',
    foods: [
      { item: 'Suet fat balls', emoji: '🟤' },
      { item: 'Suet pellets', emoji: '🟤' },
    ],
    feederType: 'Fat ball feeder — hangs acrobatically, often upside down',
    gardenTips: [
      'They arrive in family parties of 8–20, flooding the garden all at once — a magical sight',
      'Suet is the key food; they only recently began using garden feeders and suet is what drew them in',
      'Provide dense hedges and bramble for their elaborate domed nests — they don\'t use boxes',
      'Very shy around humans — keep movements slow when they visit',
      'In winter they join mixed flocks with blue tits and goldcrests drifting through gardens',
    ],
    goodWith: ['Blue Tit', 'Coal Tit'],
    seasonNote: 'Year-round resident; most visible visiting gardens in autumn and winter',
  },

  'Blackbird': {
    tier: 'assertive',
    foods: [
      { item: 'Earthworms', emoji: '🪱' },
      { item: 'Berries', emoji: '🫐' },
      { item: 'Mealworms', emoji: '🪱' },
      { item: 'Soft fruit', emoji: '🍎' },
    ],
    feederType: 'Ground feeding or large open table — does not use hanging feeders well',
    gardenTips: [
      'Leave a patch of damp lawn — blackbirds hunt earthworms by sight and listen for movement',
      'Plant berry-bearing shrubs: holly, cotoneaster, pyracantha, hawthorn and honeysuckle',
      'Put out mealworms in spring — a nesting pair raising two broods needs enormous food quantities',
      'Dense ivy and low hedges are favourite nesting spots; they also use open-fronted nest boxes',
      'Males are territorial at ground level — expect one dominant male with his own patch',
    ],
    nestingNote: 'Open-fronted nest box sited 1–2m high in dense cover; or plant ivy against a fence',
    goodWith: ['Song Thrush', 'Dunnock', 'Robin'],
    seasonNote: 'Year-round resident; numbers swell in winter with Continental migrants',
  },

  'Song Thrush': {
    tier: 'moderate',
    foods: [
      { item: 'Earthworms', emoji: '🪱' },
      { item: 'Snails', emoji: '🐌' },
      { item: 'Berries', emoji: '🫐' },
      { item: 'Mealworms', emoji: '🪱' },
    ],
    feederType: 'Ground feeding only — rarely visits hanging feeders',
    gardenTips: [
      'Never use slug pellets — thrushes are natural pest control for snails',
      'Leave a flat stone in the garden as an "anvil" — thrushes smash snail shells against it',
      'Short damp grass and leaf litter are essential for earthworm hunting',
      'Plant berry shrubs and leave windfalls on the ground in autumn and winter',
      'One of Britain\'s most beautiful singers — encourage with a shrub or low hedge as a song post',
    ],
    goodWith: ['Blackbird', 'Robin', 'Dunnock'],
    seasonNote: 'Year-round resident; in serious decline — a garden song thrush is precious',
  },

  'Mistle Thrush': {
    tier: 'assertive',
    foods: [
      { item: 'Berries', emoji: '🫐' },
      { item: 'Earthworms', emoji: '🪱' },
      { item: 'Holly berries', emoji: '🎄' },
    ],
    feederType: 'Ground feeding; will aggressively guard berry bushes from other birds',
    gardenTips: [
      'Much larger and bolder than song thrush — will drive other birds away from a berry bush',
      'Plant holly, yew and mistletoe — mistle thrushes are named for their love of mistletoe berries',
      'The "stormcock" — one of the few birds that sings boldly in rain and gales',
      'Needs large gardens or adjacent open space; less common in smaller urban plots',
      'Spotted breast is bolder and more rounded than song thrush; stands more upright',
    ],
    goodWith: ['Blackbird'],
    seasonNote: 'Year-round resident; most common in gardens October–March',
  },

  'Dunnock': {
    tier: 'shy',
    foods: [
      { item: 'Small seeds', emoji: '🌾' },
      { item: 'Insects', emoji: '🐛' },
      { item: 'Suet crumbs', emoji: '🟤' },
    ],
    feederType: 'Ground only — creeps mouse-like beneath feeders eating fallen seed',
    gardenTips: [
      'Often overlooked as a "little brown bird" — but its subtle plumage and quiet song reward attention',
      'Never uses feeders; sweep fallen seed from tables onto the ground specifically for it',
      'Dense ground-level cover (hedgebase, bramble, ivy) is essential for nesting and foraging',
      'Very sensitive to disturbance — a garden that keeps cats indoors benefits dunnocks greatly',
      'In rural areas it may be parasitised by cuckoos — their sky-blue eggs are unmistakeable',
    ],
    goodWith: ['Robin', 'Wren', 'Song Thrush'],
    seasonNote: 'Year-round resident',
  },

  'Wren': {
    tier: 'shy',
    foods: [
      { item: 'Insects', emoji: '🐛' },
      { item: 'Spiders', emoji: '🕷️' },
      { item: 'Mealworms', emoji: '🪱' },
    ],
    feederType: 'Rarely visits feeders — scatter mealworms near dense low cover in cold weather',
    gardenTips: [
      'Britain\'s commonest bird by numbers — but tiny and skulking, easily missed',
      'Log piles, compost heaps and dense ground cover are essential wren habitat',
      'Males build multiple "cock nests" in spring; the female chooses one and lines it',
      'Their incredibly loud, rattling song is remarkable for such a tiny bird',
      'On the coldest nights, dozens of wrens may roost together in a single nest box for warmth',
    ],
    nestingNote: 'Small open-fronted box or wren box sited very low in dense vegetation or a log pile',
    goodWith: ['Robin', 'Dunnock'],
    seasonNote: 'Year-round resident; populations crash in severe winters',
  },

  'House Sparrow': {
    tier: 'assertive',
    foods: [
      { item: 'Mixed seed', emoji: '🌾' },
      { item: 'Sunflower hearts', emoji: '🌻' },
      { item: 'Millet', emoji: '🌾' },
      { item: 'Suet', emoji: '🟤' },
    ],
    feederType: 'Any feeder type — arrives in noisy, competitive groups',
    gardenTips: [
      'Red-listed and in serious decline — attracting a colony is a genuine conservation achievement',
      'They are highly sociable and need company; attract a group or likely none',
      'Plant dense hedges (privet, hawthorn, pyracantha) where colonies can roost together each night',
      'Terrace nest boxes (a row of 3+ holes under the eaves) mimic their preferred colonial nesting',
      'Spread feeding points across the garden — in groups they can overwhelm a single feeder',
    ],
    nestingNote: '32mm hole nest box, mounted high under eaves — ideally in groups of 2 or 3',
    goodWith: ['Chaffinch', 'Collared Dove', 'Greenfinch'],
    seasonNote: 'Year-round resident',
  },

  'Chaffinch': {
    tier: 'moderate',
    foods: [
      { item: 'Sunflower hearts', emoji: '🌻' },
      { item: 'Mixed seed', emoji: '🌾' },
      { item: 'Millet', emoji: '🌾' },
    ],
    feederType: 'Hanging feeder or ground beneath — also feeds on open table',
    gardenTips: [
      'Males are one of our most colourful garden birds — vivid pink breast and blue-grey head in spring',
      'Often feeds on the ground beneath hanging feeders, picking up dropped seed',
      'A ground feeding tray or scattered seed complements hanging feeders well',
      'In winter, numbers swell with Scandinavian migrants forming large flocks',
      'Watch for bramblings mixed in with winter chaffinch flocks — they have orange wingbars',
    ],
    goodWith: ['Greenfinch', 'Goldfinch', 'House Sparrow', 'Blue Tit'],
    seasonNote: 'Year-round resident; boosted in winter by Continental migrants',
  },

  'Goldfinch': {
    tier: 'moderate',
    foods: [
      { item: 'Niger seeds', emoji: '⚫' },
      { item: 'Sunflower hearts', emoji: '🌻' },
      { item: 'Teasel seeds', emoji: '🌿' },
    ],
    feederType: 'Dedicated niger seed feeder with small ports — or sunflower hearts in a tube feeder',
    gardenTips: [
      'Niger seed in a specialist feeder is the single best way to attract goldfinches reliably',
      'Plant teasel, knapweed and other tall seed-heads — goldfinches acrobatically extract seeds',
      'Leave "weedy" patches: undisturbed dandelions and thistles are prime food sources',
      'Arrive in delightful groups — a collective noun "charm of goldfinches" perfectly suits them',
      'More numerous in gardens now than 30 years ago; sunflower hearts transformed their winter range',
    ],
    goodWith: ['Siskin', 'Chaffinch', 'Greenfinch', 'Blue Tit'],
    seasonNote: 'Year-round resident; flocks peak in autumn after the breeding season',
  },

  'Greenfinch': {
    tier: 'moderate',
    foods: [
      { item: 'Sunflower hearts', emoji: '🌻' },
      { item: 'Peanuts', emoji: '🥜' },
      { item: 'Niger seeds', emoji: '⚫' },
    ],
    feederType: 'Hanging tube feeder — dominant among finches',
    gardenTips: [
      'Greenfinches have suffered badly from trichomonosis (a throat parasite) — clean feeders every 2 weeks',
      'One of the larger finches; can outcompete goldfinches and smaller species at feeders',
      'Rose hips and berrying shrubs are important autumn and winter food alongside feeders',
      'Males have a distinctive wheezing call and a butterfly-like display flight in spring',
      'If you see lethargic, fluffed-up birds at feeders, remove food and disinfect immediately',
    ],
    goodWith: ['Chaffinch', 'House Sparrow', 'Goldfinch'],
    seasonNote: 'Year-round resident; in decline due to disease — supporting them matters',
  },

  'Siskin': {
    tier: 'shy',
    foods: [
      { item: 'Niger seeds', emoji: '⚫' },
      { item: 'Sunflower hearts', emoji: '🌻' },
      { item: 'Peanuts (mesh)', emoji: '🥜' },
    ],
    feederType: 'Niger feeder or peanut mesh — very acrobatic, often feeds upside-down',
    gardenTips: [
      'Primarily a winter visitor to gardens — breeds in conifer plantations in summer',
      'Red mesh peanut feeders seem to attract siskins particularly effectively',
      'Often arrives mixed with redpolls and goldfinches in winter finch flocks',
      'Conifers in or near the garden significantly increase the chance of visits',
      'Most likely January–March when natural woodland food supplies run out',
    ],
    goodWith: ['Goldfinch', 'Coal Tit'],
    seasonNote: 'Winter garden visitor (Oct–Apr); breeds in upland forests',
  },

  'Bullfinch': {
    tier: 'shy',
    foods: [
      { item: 'Sunflower hearts', emoji: '🌻' },
      { item: 'Ash keys', emoji: '🌲' },
      { item: 'Native plant seeds', emoji: '🌱' },
    ],
    feederType: 'Open hanging feeder in a very quiet, sheltered spot — extremely shy',
    gardenTips: [
      'The male\'s deep red breast is one of the most striking sights in a British garden',
      'Extremely shy — place feeders in a quiet corner well away from house activity and paths',
      'Native plants such as ash, teasel, nettle and dock provide natural food',
      'Dense hedge and bramble scrub for nesting — they need very undisturbed conditions to breed nearby',
      'Patient, quiet observation is the only way to enjoy them — they vanish at the slightest disturbance',
    ],
    goodWith: ['Dunnock', 'Song Thrush', 'Coal Tit'],
    seasonNote: 'Year-round resident; shy and easily missed even when present',
  },

  'Nuthatch': {
    tier: 'moderate',
    foods: [
      { item: 'Sunflower hearts', emoji: '🌻' },
      { item: 'Peanuts', emoji: '🥜' },
      { item: 'Suet', emoji: '🟤' },
      { item: 'Hazelnuts', emoji: '🌰' },
    ],
    feederType: 'Any hanging feeder — the only British bird that walks headfirst down trees',
    gardenTips: [
      'Needs mature trees — especially oak, beech and hazel — to be likely in your garden',
      'Will use a 32mm hole nest box; they famously plaster mud around the entrance to reduce the hole size',
      'Caches food in bark crevices and remembers each location — a fascinating behavioural quirk',
      'Bold and colourful; becomes a fixture at feeders once established',
      'Range is expanding northwards — increasingly likely across much of England',
    ],
    nestingNote: '32mm hole nest box on a mature tree trunk — they will plaster mud around the entrance',
    goodWith: ['Great Tit', 'Treecreeper', 'Great Spotted Woodpecker'],
    seasonNote: 'Year-round resident',
  },

  'Treecreeper': {
    tier: 'shy',
    foods: [
      { item: 'Suet (in bark)', emoji: '🟤' },
      { item: 'Insects', emoji: '🐛' },
      { item: 'Spiders', emoji: '🕷️' },
    ],
    feederType: 'Smear suet paste directly into bark crevices — will not use hanging feeders',
    gardenTips: [
      'Spirals up tree trunks like a little brown mouse, probing bark with its curved bill',
      'Smear suet or fat paste into bark crevices and they will return reliably to the same spot',
      'Needs mature trees with rough, deeply fissured bark — smooth-barked trees are no use',
      'Roosts in bark hollows in cold weather — a specialist treecreeper box can save lives in winter',
      'Listen for their thin, very high-pitched call as they spiral upward; easy to mistake for silence',
    ],
    nestingNote: 'Wedge-shaped treecreeper nest box (with side entrance) mounted flat against a mature tree trunk',
    goodWith: ['Nuthatch', 'Coal Tit', 'Long-tailed Tit'],
    seasonNote: 'Year-round resident',
  },

  'Great Spotted Woodpecker': {
    tier: 'assertive',
    foods: [
      { item: 'Peanuts (mesh)', emoji: '🥜' },
      { item: 'Suet', emoji: '🟤' },
      { item: 'Sunflower hearts', emoji: '🌻' },
    ],
    feederType: 'Clamps onto peanut mesh or suet cage — very strong and will dominate any feeder it visits',
    gardenTips: [
      'Its bold pied plumage and crimson patch make it unmistakeable — a real garden highlight',
      'Needs mature trees for foraging; a garden near old woodland has a good chance',
      'Mount a log section on a post as a "feeding station" — pack holes with peanut butter or suet',
      'Protect tit nest boxes with a metal hole guard plate to prevent woodpecker raids',
      'Numbers have increased significantly in recent decades; now regularly visiting suburban gardens',
    ],
    conflictsWith: ['Blue Tit', 'Great Tit'],
    conflictReason: 'May raid tit nest boxes by enlarging the entrance hole to extract chicks and eggs',
    goodWith: ['Nuthatch'],
    seasonNote: 'Year-round resident; most likely at feeders October–March',
  },

  'Starling': {
    tier: 'assertive',
    foods: [
      { item: 'Suet', emoji: '🟤' },
      { item: 'Mealworms', emoji: '🪱' },
      { item: 'Mixed seed', emoji: '🌾' },
    ],
    feederType: 'Any feeder — arrives in noisy, competitive flocks that can empty feeders quickly',
    gardenTips: [
      'Spectacular iridescent plumage of purple, green and gold — greatly under-appreciated',
      'Flocks can monopolise all feeding points for extended periods, excluding shier species',
      'Use caged feeders (feeders inside a wire cage with small openings) to protect smaller birds',
      'Starlings probe lawns for leatherjackets (crane fly larvae) — valuable pest control',
      'Winter murmurations of millions of birds at dusk are one of nature\'s most extraordinary spectacles',
    ],
    conflictsWith: ['Coal Tit', 'Nuthatch', 'Long-tailed Tit', 'Treecreeper'],
    conflictReason: 'Mobbing flocks dominate feeders and can exclude shy, small species for long periods',
    goodWith: [],
    seasonNote: 'Year-round resident; winter numbers massively boosted by European migrants',
  },

  'Woodpigeon': {
    tier: 'dominant',
    foods: [
      { item: 'Grain', emoji: '🌾' },
      { item: 'Berries', emoji: '🫐' },
      { item: 'Brassica leaves', emoji: '🥬' },
    ],
    feederType: 'Ground feeding only — too large for hanging feeders but dominates tables and ground areas',
    gardenTips: [
      'Britain\'s largest common garden bird — will dominate any ground feeding area by sheer size',
      'Use weight-sensitive or caged feeders to exclude woodpigeons and protect smaller birds',
      'Their soft, rhythmic cooing is one of the most relaxing garden sounds if you don\'t mind their bulk',
      'Will eat brassicas and peas in a vegetable garden — protect crops with netting',
      'Despite their size they are gentle birds — the problem is displacement, not aggression',
    ],
    conflictsWith: ['Dunnock', 'Chaffinch', 'Song Thrush'],
    conflictReason: 'Dominates ground feeding areas, displacing smaller species by presence alone',
    seasonNote: 'Year-round resident',
  },

  'Collared Dove': {
    tier: 'moderate',
    foods: [
      { item: 'Grain', emoji: '🌾' },
      { item: 'Mixed seed', emoji: '🌾' },
    ],
    feederType: 'Ground feeding or open table — gentle and does not monopolise',
    gardenTips: [
      'Only arrived in Britain in the 1950s and has become one of our most familiar garden birds',
      'Gentle and peaceful at feeders — far less dominant than woodpigeon despite similar habits',
      'Their repetitive three-note coo ("u-COOO-coo") is the quintessential sound of suburbia',
      'May raise 5–6 broods per year — the most productive garden nester we have',
      'Grain or mixed seed on a large flat surface suits them well',
    ],
    goodWith: ['House Sparrow', 'Chaffinch', 'Blackbird'],
    seasonNote: 'Year-round resident',
  },

  'Magpie': {
    tier: 'dominant',
    foods: [
      { item: 'Omnivorous', emoji: '🍽️' },
      { item: 'Eggs & nestlings', emoji: '🥚' },
      { item: 'Carrion', emoji: '🦴' },
    ],
    feederType: 'Ground and table — an opportunistic omnivore that takes almost anything',
    gardenTips: [
      'Strikingly beautiful in good light but a significant predator of other garden birds\' nests',
      'Use prickly dense shrubs (pyracantha, hawthorn, holly) to make other birds\' nests inaccessible',
      'Caged feeders and nest boxes with metal hole guards protect smaller birds from magpie interference',
      'Their presence alone causes stress to nesting songbirds and can reduce breeding success',
      'Lethal control is not a solution — manage habitat to protect other species instead',
    ],
    conflictsWith: ['Robin', 'Blackbird', 'Song Thrush', 'Blue Tit', 'Great Tit', 'Dunnock', 'House Sparrow', 'Chaffinch'],
    conflictReason: 'Actively predates nests — takes eggs and nestlings of virtually all garden songbirds during breeding season',
    seasonNote: 'Year-round resident',
  },

  'Jay': {
    tier: 'dominant',
    foods: [
      { item: 'Acorns', emoji: '🌰' },
      { item: 'Peanuts', emoji: '🥜' },
      { item: 'Eggs & nestlings', emoji: '🥚' },
    ],
    feederType: 'Ground and table — very wary but will come for peanuts in quiet gardens',
    gardenTips: [
      'The most colourful member of the crow family — the flash of white rump and blue wing panel is brilliant',
      'Plant oak trees — jays bury thousands of acorns in autumn and are the oak\'s primary seed disperser',
      'Very shy; position feeders near dense cover to tempt them; they hate open exposed spaces',
      'In autumn, watch for remarkable numbers moving through gardens on acorn-gathering runs',
      'Their harsh, screaming call is almost always heard before they are seen',
    ],
    conflictsWith: ['Robin', 'Blackbird', 'Song Thrush', 'Blue Tit', 'Great Tit'],
    conflictReason: 'Predates nests, taking eggs and nestlings — most dangerous to small songbirds in May–June',
    seasonNote: 'Year-round resident; most visible in autumn during the acorn harvest',
  },

  'Jackdaw': {
    tier: 'dominant',
    foods: [
      { item: 'Omnivorous', emoji: '🍽️' },
      { item: 'Grain', emoji: '🌾' },
      { item: 'Insects', emoji: '🐛' },
    ],
    feederType: 'Ground and table — large, confident and socially dominant',
    gardenTips: [
      'The smallest crow — charming, intelligent, with distinctive silvery eyes and sociable personality',
      'Colony nesters that prefer chimney pots, cliff ledges and old trees — very large nest boxes occasionally used',
      'Their confident size displaces smaller birds from feeding areas through presence alone',
      'Social "jack jack" calls are characteristic of rural villages and old buildings',
      'If a jackdaw colony is nearby they will visit the garden regularly and become quite tame',
    ],
    conflictsWith: ['Coal Tit', 'Nuthatch', 'Treecreeper'],
    conflictReason: 'Large size and bold confidence displaces small, shy species from feeding areas',
    seasonNote: 'Year-round resident',
  },

  'Sparrowhawk': {
    tier: 'apex',
    foods: [
      { item: 'Small birds', emoji: '🐦' },
    ],
    feederType: 'Not a feeder visitor — a predator that hunts other garden birds',
    gardenTips: [
      'A visiting sparrowhawk is a sign your garden supports a healthy, abundant bird community',
      'Dense shrubs and hedges are vital escape cover — without them small birds have nowhere to go',
      'They cause instant panic at feeders — birds scatter and go quiet for 20–30 minutes after a visit',
      'Sparrowhawks are fully protected — do not attempt to deter them; manage the habitat instead',
      'A garden feeding many small birds will inevitably attract sparrowhawks — it is a natural cycle',
    ],
    conflictsWith: ['Robin', 'Blue Tit', 'Great Tit', 'House Sparrow', 'Chaffinch', 'Goldfinch', 'Dunnock'],
    conflictReason: 'Active predator — the female takes prey up to mistle thrush size; visits cause prolonged feeder abandonment',
    seasonNote: 'Year-round resident; can visit at any time of year',
  },

  'Pied Wagtail': {
    tier: 'shy',
    foods: [
      { item: 'Insects', emoji: '🐛' },
      { item: 'Mealworms', emoji: '🪱' },
    ],
    feederType: 'Ground feeding near water or paved areas — chases insects on the run',
    gardenTips: [
      'A dapper black-and-white bird that walks quickly across lawns and hard surfaces chasing insects',
      'A garden pond or bird bath greatly increases the chance of regular visits',
      'They roost communally in large numbers — supermarket car parks and reed beds in winter',
      'A low open-fronted nest box in an ivy-covered wall or outbuilding can tempt them to breed',
      'Scatter mealworms on a flat, clear surface — they prefer to see their food from a distance before approaching',
    ],
    nestingNote: 'Open-fronted nest box in a sheltered wall, outbuilding ledge or behind ivy',
    goodWith: ['Robin', 'Blackbird'],
    seasonNote: 'Year-round resident; most common in gardens near water',
  },

}

// ─── Feeding guide ─────────────────────────────────────────────────────────────
// Organized by food type — which birds each attracts and how to offer it.

export interface FoodGuideEntry {
  food: string
  imageUrl: string
  description: string
  attractsBirds: string[]  // common names
  feederTip: string
  avoid?: string
}

export const FOOD_GUIDE: FoodGuideEntry[] = [
  {
    food: 'Sunflower Hearts',
    imageUrl: 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?w=240&h=240&fit=crop&auto=format&q=80',
    description: 'Dehulled sunflower seeds — the single most popular garden bird food. No mess, no waste.',
    attractsBirds: ['Robin', 'Blue Tit', 'Great Tit', 'Coal Tit', 'Chaffinch', 'Goldfinch', 'Greenfinch', 'House Sparrow', 'Nuthatch', 'Bullfinch', 'Great Spotted Woodpecker'],
    feederTip: 'Use a tube feeder with multiple ports. Also place some in a low tray feeder for robins and chaffinches.',
  },
  {
    food: 'Mealworms',
    imageUrl: 'https://images.unsplash.com/photo-1611547212043-c82dd1e8cff2?w=240&h=240&fit=crop&auto=format&q=80',
    description: 'Live or dried — irresistible to insect-eating birds. Live are best, especially in spring.',
    attractsBirds: ['Robin', 'Song Thrush', 'Blackbird', 'Dunnock', 'Wren', 'Blue Tit', 'Pied Wagtail'],
    feederTip: 'Place in a smooth-sided ceramic bowl (prevents escape if live) on or near the ground. A robin will find it within hours.',
    avoid: 'Do not put out dried mealworms without soaking in water first — dry ones can cause dehydration in chicks.',
  },
  {
    food: 'Niger Seeds',
    imageUrl: 'https://images.unsplash.com/photo-1598301257942-e6bde1d2149b?w=240&h=240&fit=crop&auto=format&q=80',
    description: 'Tiny black seeds (also called nyjer) from the African yellow daisy. Specialist finch food.',
    attractsBirds: ['Goldfinch', 'Siskin', 'Greenfinch'],
    feederTip: 'Use a dedicated niger feeder with very small ports — standard feeders let the tiny seeds fall straight through.',
  },
  {
    food: 'Suet / Fat Balls',
    imageUrl: 'https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?w=240&h=240&fit=crop&auto=format&q=80',
    description: 'High-energy food essential in cold weather. Available as balls, blocks, pellets or paste.',
    attractsBirds: ['Blue Tit', 'Great Tit', 'Coal Tit', 'Long-tailed Tit', 'Great Spotted Woodpecker', 'Starling', 'House Sparrow', 'Nuthatch', 'Treecreeper'],
    feederTip: 'Suet pellets in a tube feeder suit tits perfectly. Smear suet paste into bark for treecreepers and woodpeckers.',
    avoid: 'Remove fat balls from plastic mesh nets — birds can get legs and beaks trapped. Use a proper cage feeder instead.',
  },
  {
    food: 'Peanuts',
    imageUrl: 'https://images.unsplash.com/photo-1567015954601-84c57c9c5018?w=240&h=240&fit=crop&auto=format&q=80',
    description: 'High protein and fat — loved by tits, woodpeckers and nuthatches.',
    attractsBirds: ['Blue Tit', 'Great Tit', 'Coal Tit', 'Nuthatch', 'Great Spotted Woodpecker', 'Greenfinch', 'Siskin', 'Jay'],
    feederTip: 'Always use a mesh feeder so birds can only take small pieces — whole peanuts are a choking risk for nestlings.',
    avoid: 'Never use salted or flavoured peanuts. Only use peanuts from reputable suppliers tested for aflatoxin.',
  },
  {
    food: 'Mixed Seed',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=240&h=240&fit=crop&auto=format&q=80',
    description: 'A blend of seeds including millet, milo, wheat and canary seed. Broad appeal but avoid cheap mixes with barley filler.',
    attractsBirds: ['House Sparrow', 'Chaffinch', 'Collared Dove', 'Dunnock', 'Blackbird', 'Greenfinch'],
    feederTip: 'Best used on a ground feeding tray or table — many species that eat mixed seed prefer to feed lower down.',
  },
  {
    food: 'Fresh Berries & Fruit',
    imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=240&h=240&fit=crop&auto=format&q=80',
    description: 'Windfall apples, pears, and berry-bearing shrubs are as valuable as any feeder.',
    attractsBirds: ['Blackbird', 'Song Thrush', 'Mistle Thrush', 'Robin', 'Wren'],
    feederTip: 'Halve apples and leave on the ground or a low flat surface. Plant hawthorn, pyracantha, holly, rowan and cotoneaster.',
  },
  {
    food: 'Water (Bird Bath)',
    imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=240&h=240&fit=crop&auto=format&q=80',
    description: 'Often more valuable than food — especially in dry summers and frozen winters. Clean water for drinking and bathing.',
    attractsBirds: ['Blackbird', 'Song Thrush', 'Starling', 'Blue Tit', 'Robin', 'Pied Wagtail', 'House Sparrow', 'Chaffinch', 'Collared Dove'],
    feederTip: 'Keep at least 3cm deep, clean every few days, and use a tennis ball or a stick to stop it freezing solid in winter.',
    avoid: 'Never use antifreeze or glycerine to prevent freezing — both are toxic to birds.',
  },
]

// ─── Garden features guide ────────────────────────────────────────────────────

export interface GardenFeatureEntry {
  feature: string
  imageUrl: string
  benefitsBirds: string[]
  tip: string
}

export const GARDEN_FEATURES: GardenFeatureEntry[] = [
  {
    feature: 'Dense Hedge',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=240&h=240&fit=crop&auto=format&q=80',
    benefitsBirds: ['House Sparrow', 'Dunnock', 'Blackbird', 'Robin', 'Wren', 'Chaffinch'],
    tip: 'Hawthorn, hazel or privet are ideal. A hedge 1.5m+ tall with a gappy base gives nesting and roosting cover for multiple species simultaneously.',
  },
  {
    feature: 'Berry-bearing Shrubs',
    imageUrl: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=240&h=240&fit=crop&auto=format&q=80',
    benefitsBirds: ['Blackbird', 'Song Thrush', 'Mistle Thrush', 'Robin', 'Wren'],
    tip: 'Plant pyracantha, cotoneaster, holly, hawthorn and rowan. These feed birds from October through February when natural food is scarce.',
  },
  {
    feature: 'Bird Bath / Water',
    imageUrl: 'https://images.unsplash.com/photo-1518173918312-89add0fc5e77?w=240&h=240&fit=crop&auto=format&q=80',
    benefitsBirds: ['Blackbird', 'Starling', 'Song Thrush', 'House Sparrow', 'Blue Tit', 'Robin'],
    tip: 'The single highest-impact addition to a garden. Position it near cover (1–2m from a shrub) so birds can escape quickly if startled.',
  },
  {
    feature: 'Log Pile',
    imageUrl: 'https://images.unsplash.com/photo-1510924199351-4e9d94df18a6?w=240&h=240&fit=crop&auto=format&q=80',
    benefitsBirds: ['Wren', 'Robin', 'Song Thrush', 'Treecreeper'],
    tip: 'Leave logs to rot naturally — the insects inside (beetles, grubs, spiders) are prime food for wrens, robins and thrushes year-round.',
  },
  {
    feature: 'Mature Trees',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=240&h=240&fit=crop&auto=format&q=80',
    benefitsBirds: ['Nuthatch', 'Treecreeper', 'Great Spotted Woodpecker', 'Coal Tit', 'Jay', 'Long-tailed Tit'],
    tip: 'Older trees with rough bark and holes are irreplaceable. A single mature oak can support hundreds of species of insects, feeding dozens of garden birds.',
  },
  {
    feature: 'Nest Boxes',
    imageUrl: 'https://images.unsplash.com/photo-1595118216242-3a73e7a62b79?w=240&h=240&fit=crop&auto=format&q=80',
    benefitsBirds: ['Blue Tit', 'Great Tit', 'Coal Tit', 'House Sparrow', 'Robin', 'Wren', 'Nuthatch', 'Pied Wagtail'],
    tip: 'Put up boxes in February before the breeding season. Different hole sizes suit different species — offer a variety at different heights.',
  },
  {
    feature: 'Long Grass / Wildflower Patch',
    imageUrl: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=240&h=240&fit=crop&auto=format&q=80',
    benefitsBirds: ['Goldfinch', 'Chaffinch', 'Dunnock', 'Wren', 'Bullfinch'],
    tip: 'Let a corner go uncut. Grasses, thistles, nettles and knapweed seed heads feed finches from summer through winter.',
  },
  {
    feature: 'Lawn (short)',
    imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=240&h=240&fit=crop&auto=format&q=80',
    benefitsBirds: ['Blackbird', 'Song Thrush', 'Starling', 'Pied Wagtail', 'Mistle Thrush'],
    tip: 'Keep a patch of lawn short and damp — thrushes and blackbirds listen for earthworm movement in the soil. Avoid pesticides and herbicides.',
  },
]
