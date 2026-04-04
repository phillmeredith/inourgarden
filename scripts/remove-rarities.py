#!/usr/bin/env python3
"""Remove genuinely rare vagrant birds from data files.
These are birds that have barely occurred in the UK or are American/Asian
vagrants with no realistic chance of a typical birdwatcher seeing them.
"""

import re, os

# Birds to KEEP (not genuinely rare — regular UK birds or well-known species)
KEEP = {
    'puffin',
    'dartford-warbler',
    'dotterel',
    'great-skua',
    'grey-partridge',
    'grey-plover',
    'little-gull',
    'pochard',
    'red-legged-partridge',
    'roseate-tern',
    'ruff',
    'short-eared-owl',
    'turnstone',
    'taiga-bean-goose',
    'smew',
    'velvet-scoter',
    'jack-snipe',
    'curlew-sandpiper',
    'purple-sandpiper',
    'little-stint',
    'pomarine-skua',
    'long-tailed-skua',
    'iceland-gull',
    'caspian-gull',
    'grey-phalarope',
    'black-scoter',
    'american-wigeon',
    'yellow-browed-warbler',
    'kentish-plover',
    'golden-pheasant',
    'leach-storm-petrel',
    'sabine-gull',
    'arctic-warbler',
}

# All IDs from the missing-sounds list that are NOT in KEEP → remove
ALL_MISSING = [
    'egyptian-vulture', 'short-toed-eagle', 'spotted-eagle', 'northern-harrier',
    'lesser-grey-shrike', 'long-tailed-shrike', 'brown-shrike',
    'bimaculated-lark', 'black-lark', 'calandra-lark',
    'thick-billed-warbler', 'booted-warbler', 'eastern-olivaceous-warbler',
    'western-olivaceous-warbler', 'lanceolated-warbler', 'sulphur-bellied-warbler',
    'eastern-crowned-warbler', 'pale-legged-leaf-warbler', 'eastern-orphean-warbler',
    'asian-desert-warbler', 'spectacled-warbler', 'sardinian-warbler',
    'rose-coloured-starling', 'varied-thrush', 'red-throated-thrush',
    'black-throated-thrush', 'dusky-thrush', 'eyebrowed-thrush',
    'asian-brown-flycatcher', 'rufous-tailed-robin', 'rock-thrush',
    'western-black-eared-wheatear', 'pied-wheatear', 'eastern-black-eared-wheatear',
    'isabelline-wheatear', 'white-crowned-black-wheatear', 'alpine-accentor',
    'spanish-sparrow', 'citrine-wagtail', 'eastern-yellow-wagtail',
    'blyth-pipit', 'pechora-pipit', 'olive-backed-pipit', 'red-throated-pipit',
    'trumpeter-finch', 'citril-finch', 'pallas-reed-bunting',
    'yellow-browed-bunting', 'chestnut-bunting', 'yellow-breasted-bunting',
    'little-bunting', 'rustic-bunting', 'black-faced-bunting',
    'red-headed-bunting', 'chestnut-eared-bunting',
    'ruddy-duck', 'king-eider', 'harlequin-duck', 'surf-scoter',
    'white-winged-scoter', 'bufflehead', 'ring-necked-duck', 'falcated-duck',
    'black-duck', 'pied-billed-grebe', 'black-billed-cuckoo', 'american-coot',
    'little-crake', 'american-golden-plover', 'pacific-golden-plover',
    'grey-headed-lapwing', 'white-tailed-lapwing', 'caspian-plover',
    'tibetan-sand-plover', 'siberian-sand-plover', 'greater-sand-plover',
    'eskimo-curlew', 'little-whimbrel', 'hudsonian-whimbrel', 'hudsonian-godwit',
    'long-billed-dowitcher', 'short-billed-dowitcher', 'terek-sandpiper',
    'solitary-sandpiper', 'grey-tailed-tattler', 'marsh-sandpiper',
    'lesser-yellowlegs', 'great-knot', 'sharp-tailed-sandpiper',
    'broad-billed-sandpiper', 'stilt-sandpiper', 'red-necked-stint',
    'long-toed-stint', 'buff-breasted-sandpiper',
    'black-winged-pratincole', 'collared-pratincole',
    'south-polar-skua', 'tufted-puffin', 'ancient-murrelet', 'long-billed-murrelet',
    'aleutian-tern', 'sooty-tern', 'bridled-tern', 'least-tern',
    'whiskered-tern', 'white-winged-black-tern', 'elegant-tern', 'royal-tern',
    'lesser-crested-tern', 'franklin-gull', 'kelp-gull', 'american-herring-gull',
    'glaucous-winged-gull', 'slaty-backed-gull',
    'red-billed-tropicbird', 'white-billed-diver', 'pacific-diver',
    'black-browed-albatross', 'white-faced-storm-petrel', 'band-rumped-storm-petrel',
    'swinhoe-storm-petrel', 'white-chinned-petrel',
    'mediterranean-shearwater', 'barolo-shearwater', 'soft-plumaged-petrel',
    'black-capped-petrel', 'zino-petrel',
    'little-bittern', 'snowy-egret', 'chinese-pond-heron', 'squacco-heron',
    'egyptian-nightjar', 'white-throated-needletail', 'white-rumped-swift',
]

REMOVE = set(id_ for id_ in ALL_MISSING if id_ not in KEEP)

def remove_birds_from_file(filepath):
    content = open(filepath, encoding='utf-8').read()

    # Find the bounds of the array literal [ ... ]
    array_start = content.index('[')
    array_end = content.rindex(']')
    header = content[:array_start + 1]      # everything up to and including [
    footer = content[array_end:]            # ] and anything after
    inner = content[array_start + 1:array_end]

    # Parse bird blocks by tracking brace depth
    # Each top-level { ... } (possibly followed by ,) is one bird
    blocks = []   # list of (raw_string, id_or_None)
    i = 0
    n = len(inner)
    current_text = []   # characters before the first bird (whitespace/newlines)

    while i < n:
        # Skip whitespace between blocks
        if inner[i] in ' \t\n\r':
            current_text.append(inner[i])
            i += 1
            continue

        if inner[i] != '{':
            current_text.append(inner[i])
            i += 1
            continue

        # Start of a bird block
        pre = ''.join(current_text)
        current_text = []
        depth = 0
        start = i
        while i < n:
            c = inner[i]
            # Skip string literals to avoid counting braces inside strings
            if c in ('"', "'"):
                quote = c
                i += 1
                while i < n:
                    if inner[i] == '\\':
                        i += 2
                        continue
                    if inner[i] == quote:
                        i += 1
                        break
                    i += 1
                continue
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    i += 1
                    # consume optional trailing comma
                    end = i
                    if i < n and inner[i] == ',':
                        i += 1
                        end = i
                    block_text = inner[start:end]
                    # Extract id
                    id_match = re.search(r"id:\s*'([^']+)'", block_text)
                    bird_id = id_match.group(1) if id_match else None
                    blocks.append((pre, block_text, bird_id))
                    break
            i += 1

    removed = 0
    kept = []
    for (pre, block_text, bird_id) in blocks:
        if bird_id in REMOVE:
            removed += 1
            print(f'  ✗ removing {bird_id}')
        else:
            kept.append((pre, block_text))

    # Reconstruct: join kept blocks, strip trailing comma from last bird
    result_parts = []
    for idx, (pre, block_text) in enumerate(kept):
        result_parts.append(pre)
        if idx == len(kept) - 1 and block_text.endswith(','):
            result_parts.append(block_text[:-1])  # remove trailing comma
        else:
            # ensure comma present (except last)
            if not block_text.endswith(',') and idx < len(kept) - 1:
                result_parts.append(block_text + ',')
            else:
                result_parts.append(block_text)

    new_inner = ''.join(result_parts)
    new_content = header + new_inner + footer

    open(filepath, 'w', encoding='utf-8').write(new_content)
    return removed

if __name__ == '__main__':
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'data')
    files = (
        [os.path.join(data_dir, 'birds.ts')] +
        [os.path.join(data_dir, f'birds_batch{i}.ts') for i in range(1, 13)]
    )

    total_removed = 0
    for f in files:
        if not os.path.exists(f):
            continue
        r = remove_birds_from_file(f)
        if r:
            print(f'{os.path.basename(f)}: removed {r}')
        total_removed += r

    print(f'\nTotal removed: {total_removed} genuinely rare birds')
    print(f'Kept: {len(KEEP)} non-rare species from the missing-sounds list')
