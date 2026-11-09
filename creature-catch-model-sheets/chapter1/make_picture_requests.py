"""Build the Chapter 1 picture requests: two self-contained HTML files with prompts and embedded references.

usage: python3 -I make_picture_requests.py REFDIR OUTDIR
  OUTDIR/picture-request-main-characters.html   the two player characters
  OUTDIR/picture-request-chapter1.html          the 8 creatures you meet, the 10 other people, 8 texture sheets
"""
import base64
import html
import os
import sys

REF, OUT = sys.argv[1], sys.argv[2]

# ------------------------------------------------------------------ the looks
LOOK_CREATURE = (
    "THE LOOK (the same for every creature in this game): a friendly creature-collecting game. Chunky, rounded, "
    "cute-but-mighty proportions, big warm expressive eyes and simple shapes that read clearly. Stylised hand-painted "
    "surfaces with clear blocks of colour and gentle texture, not photoreal. Colours true to the original sprite. No black "
    "outlines around the creature or any of its parts. Soft, even, shadowless studio light with only small highlights. "
    "Glowing parts glow, with no halo onto the background. Plain flat light-grey background, exactly #C8C8CA, with no floor, "
    "shadow, reflection, border or watermark.")

LOOK_PERSON = (
    "THE LOOK (the same for every person in this game): a cosy creature-collecting adventure game. Friendly stylised "
    "proportions, about five heads tall (a slightly large head, big warm eyes), simple shapes that read clearly, like the "
    "hero of a modern cosy JRPG. Stylised hand-painted surfaces with clear blocks of colour and gentle cloth and leather "
    "texture, not photoreal, matching the game's painted creatures. Colours true to the original sprite. No black outlines. "
    "Soft, even, shadowless studio light with only small highlights. Plain flat light-grey background, exactly #C8C8CA, with "
    "no floor, shadow, reflection, border or watermark.")

LOOK_TEXTURE = (
    "THE LOOK (the same for every texture sheet): hand-painted game textures for a cosy creature-collecting game, in the "
    "same painted style as the game's creatures (the attached picture). Bright, warm, friendly colours, soft visible "
    "brushwork and clear simple shapes, not photoreal, no pixel art. Seen perfectly flat and straight-on, with no "
    "perspective. Even light with no shadows or highlights from any direction (a gentle darkening in deep grooves and gaps "
    "is fine). No text, letters, numbers, labels, logos or watermarks anywhere.")

# ------------------------------------------------------------------ creatures (step 1)
CREATURES = [
    {
        "id": "hopsprout", "name": "Hopsprout", "where": "Meadow Path · common", "type": "Normal", "no": "11",
        "lore": "The two-leaf sprout on its head turns to follow the sun all day. It can leap ten times its own height to snatch a falling seed.",
        "size_line": "0.45 m tall to the tips of its antennae, 0.65 m long, 0.4 m wide",
        "bar": "a size bar in metres showing it stands 0.45 m tall and is 0.65 m long",
        "canvas": "Landscape, 1536 x 1024", "top_canvas": "Landscape, 1536 x 1024",
        "creature": """Hopsprout is a small, lively grasshopper, 0.45 m tall to the tips of its antennae, 0.65 m long and 0.4 m wide.
- Head: a big round lime-green head with large round shiny green eyes and a small smile. A little two-leaf sprout grows from the top: a short thick stem with two round leaves, each at least 6 cm across.
- Antennae: two smooth antennae curving up and back from the forehead, at least 3 cm thick and no longer than the head is tall.
- Body: a lime-green segmented body held level, with pale green wings folded flat along its back like a closed fan (solid, not see-through).
- Legs: four short front legs, and two big back legs folded beside the body with the knees pointing up, grasshopper-style. Every leg is chunky (at least 4 cm thick) with rounded feet.
- Build: cute and chunky, the head about a third of its length.""",
        "pose": "Standing on all six legs facing straight ahead, the back legs folded at its sides with the knees up, clear gaps of background between the legs. Antennae curving up and back. The same pose in every view.",
        "checks": ["Six chunky legs with clear gaps between them.", "The antennae are thick and smooth and curve the same way in every view.", "The wings are solid, folded flat along the back."],
        "skeleton": "bug (new)",
    },
    {
        "id": "tuftail", "name": "Tuftail", "where": "Grassland · common", "type": "Plant", "no": "12",
        "lore": "This fox's tail is a bundle of living grass. It hides in tall grass with only the tip showing, and you only spot it when the tail blinks.",
        "size_line": "0.55 m tall to the tips of its ears, 0.9 m long with its tail, 0.35 m wide",
        "bar": "a size bar in metres showing it stands 0.55 m tall and is 0.9 m long",
        "canvas": "Landscape, 1536 x 1024", "top_canvas": "Landscape, 1536 x 1024",
        "creature": """Tuftail is a small, bright fox, 0.55 m tall to its ear tips, 0.9 m long including its tail and 0.35 m wide.
- Head: an orange fox face with a cream muzzle and cheeks, big pointed ears with dark-brown tips (at least 4 cm thick), bright green eyes, a small black nose and a sly smile.
- Body: orange fur with a fluffy cream chest.
- Legs: four slim legs with dark-brown socks and cream toes.
- Tail: a big round bushy tail made of living grass, drawn as a few big chunky clumps of broad green grass blades (each clump at least 10 cm across), darker green in the folds. It curves up behind it, straight behind (not off to one side).
- Build: light and nimble, the tail almost as big as the body.""",
        "pose": "Standing on all four legs facing straight ahead, with clear gaps of background between the legs, ears up, tail curving up straight behind. The same pose in every view.",
        "checks": ["The grass tail is a few big chunky clumps, straight behind, the same shape in every view.", "The ear tips are dark in every view.", "Four legs with clear gaps between them."],
        "skeleton": "four-legged",
    },
    {
        "id": "pebblepup", "name": "Pebblepup", "where": "Grassland · common · Farmer Bramble's team", "type": "Earth", "no": "18",
        "lore": "A playful puppy with rocky patches in its fur and a pebble stuck to its nose that it refuses to let go of. It fetches anything, especially rocks.",
        "size_line": "0.45 m tall, 0.65 m long, 0.35 m wide",
        "bar": "a size bar in metres showing it stands 0.45 m tall and is 0.65 m long",
        "canvas": "Landscape, 1536 x 1024", "top_canvas": "Landscape, 1536 x 1024",
        "creature": """Pebblepup is a playful puppy, 0.45 m tall, 0.65 m long and 0.35 m wide.
- Head: a round puppy head with soft grey-brown fur, big shiny brown eyes, floppy ears hanging down beside its face (at least 4 cm thick), a short thick pink tongue poking out, and a small round grey pebble stuck on the tip of its nose.
- Body: grey-brown fur with a cream muzzle, chest and toes. Flat grey stone patches sit on its back, legs and ears like rocky spots, only slightly raised.
- Legs: four short sturdy legs with cream toes.
- Tail: a short thick tail curling up straight behind it.
- Build: chubby and happy, the head about 40% of its height.""",
        "pose": "Standing on all four legs facing straight ahead, with clear gaps of background between the legs, tongue out, tail curled up straight behind. The same pose in every view.",
        "checks": ["The stone patches are in the same places in every view.", "The pebble stays on the tip of its nose.", "Four legs with clear gaps between them."],
        "skeleton": "four-legged",
    },
    {
        "id": "bumblop", "name": "Bumblop", "where": "Grassland · uncommon", "type": "Bolt", "no": "14",
        "lore": "Half bee, half bunny, all fluff. It buzzes clumsily from flower to flower and gives off tiny sparks of static when it is excited.",
        "size_line": "0.5 m tall to the tips of its antennae, 0.45 m wide, 0.4 m deep",
        "bar": "a size bar in metres showing it stands 0.5 m tall",
        "canvas": "Square, 1024 x 1024", "top_canvas": "Square, 1024 x 1024",
        "creature": """Bumblop is a round, fluffy bee-bunny, 0.5 m tall to the tips of its antennae, 0.45 m wide and 0.4 m deep.
- Body: one chubby round ball of fluff with bold yellow and black bee stripes that wrap all the way around.
- Face: big round shiny black eyes, a tiny smile and rosy cheeks on the front.
- Ears: two long floppy bunny ears with black tips, hanging down at the sides of its body (soft and thick, at least 6 cm wide).
- Antennae: two short thick black antennae on top (at least 3 cm thick), with round yellow balls on the ends.
- Wings: two small rounded bee wings on its back, sticking out to the sides and a little up. Solid pale white with soft grey veins, chunky, not see-through.
- Feet: two tiny round feet under the body.""",
        "pose": "Sitting upright on its tiny feet facing straight ahead, ears hanging at its sides, wings out to the sides behind it. The same pose in every view.",
        "checks": ["The stripes wrap all the way round, in the same places in every view.", "The wings are solid, not see-through.", "The ears hang at its sides in every view."],
        "skeleton": "round",
    },
    {
        "id": "dewt", "name": "Dewt", "where": "Grassland · uncommon · daytime", "type": "Water", "no": "74",
        "lore": "A newt made of morning dew. It sparkles on the grass at sunrise and turns to mist if you startle it.",
        "size_line": "0.25 m tall, 0.75 m long with its tail, 0.3 m wide",
        "bar": "a size bar in metres showing it is 0.25 m tall and 0.75 m long",
        "canvas": "Landscape, 1536 x 1024", "top_canvas": "Landscape, 1536 x 1024",
        "creature": """Dewt is a small, glossy newt, 0.25 m tall, 0.75 m long including its tail and 0.3 m wide.
- Skin: it looks made of morning dew: glossy, smooth light-blue jelly with soft white highlights and a pale belly. Solid and opaque, not see-through.
- Head: a wide rounded head with big round dark-blue eyes and a small smile.
- Back: a row of round bubble bumps (each at least 4 cm) along its head, back and tail.
- Legs: four short legs splayed out to the sides, newt-style, with round toe pads.
- Tail: a long thick tail lying straight back along the ground behind it, curling up at the tip (at least 5 cm thick at the tip).
- Build: low and long, close to the ground.""",
        "pose": "Standing low on its four splayed legs facing straight ahead, with clear gaps of background between the legs and the body, tail straight behind it. The same pose in every view.",
        "checks": ["The skin is glossy but solid, not see-through.", "The tail lies straight behind it, the same in every view.", "The bubble bumps are in the same places in every view."],
        "skeleton": "four-legged (a newt walks on four legs, so the serpent skeleton isn't needed)",
    },
    {
        "id": "dandylion", "name": "Dandylion", "where": "Grassland · rare", "type": "Fire", "no": "16",
        "lore": "A lion cub with a mane of dandelion puffs. When it roars, the puffs scatter on the wind, and new dandelions sprout wherever they land.",
        "size_line": "0.65 m tall to the top of its mane, 0.95 m long with its tail, 0.5 m wide across the mane",
        "bar": "a size bar in metres showing it stands 0.65 m tall and is 0.95 m long",
        "canvas": "Landscape, 1536 x 1024", "top_canvas": "Landscape, 1536 x 1024",
        "creature": """Dandylion is a golden lion cub, 0.65 m tall to the top of its mane, 0.95 m long with its tail and 0.5 m wide across its mane.
- Head: a golden-yellow cub face with a cream muzzle, big friendly brown eyes and a small smile, framed by a big round mane.
- Mane: a big round ball of white dandelion seed puffs around the head, drawn as chunky clusters (each puff at least 8 cm), like a big fluffy dandelion clock.
- Body: golden-yellow with a cream belly.
- Legs: four sturdy legs with cream toes.
- Tail: a thick tail (at least 5 cm) curving up behind it, straight behind, ending in a round yellow dandelion-flower tuft (at least 12 cm across).
- Build: a cub, with a big head and mane and a sturdy body.""",
        "pose": "Standing on all four legs facing straight ahead, with clear gaps of background between the legs, tail curving up straight behind. The same pose in every view.",
        "checks": ["The mane is chunky puff clusters and looks round from every side.", "The tail ends in a yellow flower tuft, straight behind.", "Four legs with clear gaps between them."],
        "skeleton": "four-legged",
    },
    {
        "id": "wormapple", "name": "Wormapple", "where": "Willowbrook Orchard · optional", "type": "Plant · Normal", "no": "96",
        "lore": "A worm that lives inside a red apple and wears it like a house. It pops out to say hello and pops back in when it's shy.",
        "size_line": "0.45 m tall to the top of its leaf, 0.4 m wide",
        "bar": "a size bar in metres showing it stands 0.45 m tall",
        "canvas": "Square, 1024 x 1024", "top_canvas": "Square, 1024 x 1024",
        "creature": """Wormapple is a worm that lives inside a big shiny red apple, 0.45 m tall to the top of its leaf and 0.4 m wide.
- Apple: round and glossy red with a few soft yellow speckles, a thick brown stem on top (at least 4 cm thick) and one big green leaf (at least 12 cm long).
- Hole: a round hole in the FRONT of the apple, a little below the middle.
- Worm: a cute little green worm poking out of the hole, facing straight ahead: a thick round body (at least 7 cm thick) and a round head with big friendly eyes and a happy smile.
- The apple sits on the ground on its flat bottom.""",
        "pose": "The worm poking out of the front hole, facing straight ahead and smiling. The same pose in every view.",
        "checks": ["The hole and the worm are on the front in every view.", "The stem and leaf are in the same place in every view.", "No worm in the back view."],
        "skeleton": "round",
    },
    {
        "id": "scarecrowl", "name": "Scarecrowl", "where": "Willowbrook Orchard · night · optional", "type": "Shadow", "no": "97",
        "lore": "A crow wearing a tattered scarecrow hat. Marigold put up the scarecrow to keep it away, and it moved right in.",
        "size_line": "0.75 m tall to the tip of its hat, 1.0 m from wingtip to wingtip, 0.35 m deep",
        "bar": "a size bar in metres showing it stands 0.75 m tall and is 1.0 m from wingtip to wingtip",
        "canvas": "Landscape, 1536 x 1024", "top_canvas": "Landscape, 1536 x 1024",
        "creature": """Scarecrowl is a crow dressed as a scarecrow, 0.75 m tall to the tip of its hat, 1.0 m from wingtip to wingtip and 0.35 m deep.
- Hat: a tattered pointed straw-coloured hat with a wide floppy brim, a couple of stitched patches, and a soft tip bent to one side.
- Head: a dark-brown crow face under the brim, big glowing orange eyes and a short thick orange beak.
- Body: dark-brown feathers, chunky bundles of straw poking out at the neck and wings (each at least 5 cm), and a ragged orange scarf around its neck.
- Wings: held straight out to the sides like a scarecrow's arms, flat and facing forward. Dark-brown feathers with straw tufts at the tips, all chunky shapes, nothing thin.
- Legs: two thick orange bird legs with three toes, standing apart.""",
        "pose": "Standing on its two legs facing straight ahead, wings held straight out to the sides and flat, like a scarecrow. The same pose in every view.",
        "checks": ["The wings are straight out to the sides and flat: the whole wing shows in the front and back views, only a thick edge from the side and top.", "The hat's tip bends the same way in every view.", "Two legs with a clear gap between them."],
        "skeleton": "bird (new)",
    },
]

# ------------------------------------------------------------------ people (step 2)
MAIN = [
    {
        "id": "player-a", "name": "The player: boy", "pname": "the boy hero", "label": "HERO (BOY)", "short": "the boy", "role": "the hero you play (boy look)", "where": "Everywhere",
        "height": "1.55", "turn": True,
        "person": """A young adventurer, 1.55 m tall: a teenager with friendly hero proportions.
- Hair: messy, spiky brown hair in big chunky locks.
- Face: warm brown eyes and a confident, friendly smile.
- Clothes: a green explorer jacket worn open over a cream shirt, sleeves pushed up a little; a brown belt with a purple-and-blue capture cube clipped on the LEFT hip; khaki cargo trousers; brown lace-up boots.
- Backpack: a small brown leather backpack with a flap and two shoulder straps.
- Hands: bare, fingers together.""",
        "item": None,
        "checks": ["The capture cube is on the left hip: it shows in the front and side views.", "The backpack shows in the side and back views, the same shape in both."],
    },
    {
        "id": "player-b", "name": "The player: girl", "pname": "the girl hero", "label": "HERO (GIRL)", "short": "the girl", "role": "the hero you play (girl look)", "where": "Everywhere",
        "height": "1.55", "turn": True,
        "person": """A young adventurer, 1.55 m tall: a teenager with friendly hero proportions.
- Hair: black hair in a high ponytail tied with an orange band, with chunky bangs. The ponytail is one thick solid shape (at least 8 cm across).
- Face: warm brown eyes and a bright, confident smile.
- Clothes: an orange explorer vest over a white short-sleeved shirt; dark fingerless gloves; a brown belt with a purple-and-blue capture cube clipped on the LEFT hip; khaki cargo trousers; brown boots with orange trim.
- Backpack: a small brown leather backpack with two shoulder straps.""",
        "item": None,
        "checks": ["The capture cube is on the left hip: it shows in the front and side views.", "The ponytail is the same shape and height in every view."],
    },
]

PEOPLE = [
    {
        "id": "juniper", "name": "Juniper", "short": "Juniper", "role": "your rival, and your first trainer battle", "where": "Home Village",
        "height": "1.55", "turn": True,
        "person": """A confident young rival, 1.55 m tall: a teenager with friendly hero proportions.
- Hair: spiky red hair in big chunky spikes.
- Face: a cocky, cheerful grin.
- Clothes: a yellow scarf with one thick end hanging in front and one behind; a blue jacket worn open over a dark shirt; dark-blue jeans; red sneakers with white soles; a purple-and-blue capture cube clipped to the belt on the LEFT hip.""",
        "item": None,
        "checks": ["The scarf's two ends hang the same way in every view (one in front, one behind).", "The capture cube is on the left hip."],
    },
    {
        "id": "willow", "name": "Elder Willow", "short": "Elder Willow", "role": "the village elder; gives you your first creature and tells the legend", "where": "Elder Willow's house",
        "height": "1.6", "turn": True,
        "person": """A kind elderly village elder, 1.6 m tall and slightly stooped.
- Hair: bald on top, with white hair at the sides and back; bushy white eyebrows.
- Face: eyes closed in a warm smile; a long white beard and moustache hanging to the middle of his chest, as one chunky soft shape.
- Clothes: a long green robe with lighter green leaf patterns, reaching his ankles, over a cream under-robe; a brown belt; brown shoes.""",
        "item": "his gnarled wooden walking staff with a curled top",
        "checks": ["The beard is one chunky shape, the same length in every view.", "The leaf pattern on the robe is in the same places in every view."],
    },
    {
        "id": "tinker", "name": "Tinker", "short": "Tinker", "role": "a village kid", "where": "Home Village",
        "height": "1.2", "turn": True,
        "person": """A cheerful young kid, 1.2 m tall.
- Hair: messy blond hair with a small tuft tied on top, in chunky locks.
- Face: freckles and a big grin.
- Clothes: a yellow t-shirt, brown shorts, brown shoes.""",
        "item": "a bug-catching net on a wooden handle",
        "checks": ["The tuft on top is the same in every view."],
    },
    {
        "id": "rosa", "name": "Rosa", "short": "Rosa", "role": "the innkeeper (rest until morning or night)", "where": "Rosa's Inn",
        "height": "1.6", "turn": True,
        "person": """A warm, smiling village woman, 1.6 m tall.
- Hair: brown hair in a round bun.
- Face: rosy cheeks and a warm, welcoming smile.
- Clothes: a red dress with short puffed sleeves, a white apron, brown shoes.""",
        "item": "a wooden tray with a mug on it",
        "checks": ["The bun is the same shape in every view.", "The apron ties show at the back."],
    },
    {
        "id": "hazel", "name": "Hazel", "short": "Hazel", "role": "the healer at the Healing Hut", "where": "Healing Hut",
        "height": "1.62", "turn": True,
        "person": """A gentle young healer, 1.62 m tall.
- Hair: long wavy brown hair down her back, tied with a pink ribbon, drawn as big chunky waves.
- Face: kind green eyes and a gentle smile.
- Clothes: a white and mint-green dress with a white apron; a small brown satchel of herbs worn on a strap across her body; brown shoes.""",
        "item": None,
        "checks": ["The hair is the same length in every view.", "The satchel and its strap are in the same place in every view."],
    },
    {
        "id": "pip", "name": "Pip", "short": "Pip", "role": "runs Pip's Cube Shop", "where": "Pip's Cube Shop",
        "height": "1.35", "turn": True,
        "person": """A cheerful, short, round shopkeeper, 1.35 m tall.
- Hair: curly lavender-grey hair in chunky curls.
- Face: round glasses, rosy cheeks and a big friendly smile.
- Clothes: a white shirt with the sleeves rolled up, a striped purple-and-blue apron, brown trousers and brown shoes.""",
        "item": "a stack of three small purple-and-blue capture cubes",
        "checks": ["The glasses are the same in every view.", "The apron's stripes run the same way in every view."],
    },
    {
        "id": "fern", "name": "Fern", "short": "Fern", "role": "the healer at the Grassland Outpost", "where": "Grassland Outpost",
        "height": "1.6", "turn": False,
        "person": """A cheerful young herbalist, 1.6 m tall.
- Hair: curly red hair to her shoulders, in big chunky curls, with a small green leaf clip.
- Face: bright green eyes, freckles and a happy smile.
- Clothes: a light-green dress over a white blouse with puffed sleeves, a darker green waist sash, brown boots.""",
        "item": "a woven basket of herbs",
        "checks": ["The curls are the same shape in every view.", "The leaf clip is on the same side in every view."],
    },
    {
        "id": "oakley", "name": "Ranger Oakley", "short": "Ranger Oakley", "role": "the ranger who teaches catching", "where": "Meadow Path",
        "height": "1.85", "turn": True,
        "person": """A forest ranger, 1.85 m tall to the top of his hat.
- Hat: a wide-brimmed green hat with a feather tucked in the band (the feather at least 4 cm wide).
- Hair and face: short brown hair, stubble, a calm smile.
- Clothes: a long dark-green cloak over a green tunic, a brown belt with a round brass compass, khaki trousers, tall brown boots.""",
        "item": None,
        "checks": ["The hat brim and feather are the same in every view.", "The cloak hangs the same length in every view."],
    },
    {
        "id": "bramble", "name": "Farmer Bramble", "short": "Farmer Bramble", "role": "the Grassland guide; his trail trial ends the chapter", "where": "Grassland",
        "height": "1.75", "turn": False,
        "person": """A big, friendly farmer, 1.75 m tall to the top of his hat, broad and sturdy.
- Hat: a wide straw hat.
- Face: a big bushy brown moustache, rosy cheeks, a hearty grin.
- Clothes: a red bandana around his neck, a white shirt with rolled-up sleeves, blue denim overalls, brown work boots.""",
        "item": "his pitchfork",
        "checks": ["The hat brim is the same width in every view.", "The overall straps cross the same way at the back."],
    },
    {
        "id": "farmkid", "name": "Farm Kid", "short": "the farm kid", "role": "a kid on the Grassland farm", "where": "Grassland",
        "height": "1.25", "turn": False,
        "person": """A friendly farm kid, 1.25 m tall.
- Hair: short, messy light-brown hair in chunky locks.
- Face: a curious, happy smile.
- Clothes: a blue tunic shirt with a laced collar, brown trousers, brown boots.""",
        "item": None,
        "checks": ["The hair is the same shape in every view."],
    },
]

# ------------------------------------------------------------------ texture sheets (steps 3 and 4)
TEXTURES = [
    {"id": "woods", "name": "Woods", "tile": True, "for": "doors, crates, signs, furniture, the barn, trunks, the fallen log, staffs",
     "cells": ["light honey-coloured wooden planks running across (floors, crates, signs)",
               "dark walnut planks running across",
               "polished furniture wood: warm reddish-brown fine grain, no plank lines (tables, dressers, the piano)",
               "brown tree bark (tree trunks, the fallen log, Elder Willow's staff)",
               "weathered grey fence boards running up and down",
               "painted cream wood with soft brush marks (window and door frames, the barn's trim)"]},
    {"id": "roofs", "name": "Roofs", "tile": True, "for": "the six buildings' roofs",
     "cells": ["red clay roof tiles in neat overlapping rows (your house)",
               "purple roof tiles in neat overlapping rows (Pip's Cube Shop)",
               "orange roof tiles in neat overlapping rows (Rosa's Inn)",
               "dark red wooden barn shingles (Farmer Bramble's barn)",
               "a thick, soft green moss roof with a few tiny white flowers (Elder Willow's house)",
               "mint-green and white painted stripes running up and down, like canvas (the Healing Hut's roof)"]},
    {"id": "walls", "name": "Walls and stone", "tile": True, "for": "the buildings' walls, footings, chimneys and fireplaces",
     "cells": ["cream lime-plaster wall with faint trowel marks",
               "white-washed wooden boards running up and down (the Healing Hut's walls)",
               "red barn boards running up and down, slightly worn paint",
               "a footing of rounded grey cobblestones with mortar between them",
               "red brick in neat rows (chimneys)",
               "sandy stone blocks (fireplaces and hearths)"]},
    {"id": "floors", "name": "Floors and fabrics", "tile": True, "for": "room floors, rugs, the beds, the doormats",
     "cells": ["warm wooden floorboards running across",
               "mint-green and white checker tiles (the Healing Hut's floor)",
               "a red woven rug pattern with a cream border motif",
               "a blue woven rug pattern with a cream border motif",
               "a soft patchwork quilt of cream, green, blue and red squares (bed covers)",
               "a woven straw doormat"]},
    {"id": "nature", "name": "Nature and metal", "tile": True, "for": "hay, bushes, trees, rocks, the stove, lamps, barrel hoops",
     "cells": ["golden hay and straw",
               "bright green leaf clusters (bushes and trees)",
               "green leaf clusters with small round red berries (berry bushes)",
               "green leaf clusters with small pink and white flowers (flower bushes)",
               "soft grey rock with gentle cracks (rocks and boulders)",
               "dark iron with a row of rivets (the stove, street lamps, barrel hoops)"]},
    {"id": "furniture-details", "name": "Furniture details", "tile": False, "for": "the bookshelf, herb shelf, clock, notice board, piano and stove fronts",
     "cells": ["a row of colourful book spines standing on a shelf, filling the square",
               "a shelf of glass jars of dried herbs and hanging herb bundles, filling the square",
               "a cream grandfather-clock face with simple tick marks and two hands (no numbers)",
               "a cork notice board with pinned papers, little drawings and a creature sketch (no readable writing)",
               "the front of a small upright piano: warm wood with the white and black keys across the middle",
               "the front of a black iron kitchen stove with two small oven doors and brass knobs"]},
    {"id": "building-details", "name": "Building details", "tile": False, "for": "doors, windows and signs on the buildings",
     "cells": ["a wooden front door with iron hinges and a round brass knob",
               "a round-topped wooden door with a little round window (Elder Willow's house)",
               "a square window with four panes, a cream frame and curtains inside",
               "a round window with a wooden frame (Elder Willow's house)",
               "a round white plaque with a pink heart (the Healing Hut's sign)",
               "a wooden hanging sign with a painted mug of cider (Rosa's Inn; no writing)"]},
    {"id": "machines", "name": "Machines and small things", "tile": False, "for": "the healing machine, the Cube Vault, the mailbox, lamps, hay bales and barrels",
     "cells": ["the front panel of the healing machine: white, with a round tray of six cube slots, a pink heart and soft green lights",
               "the front of the Cube Vault: a friendly wooden cabinet with a glowing screen showing little cube icons and a few round buttons",
               "the front of a red village mailbox with a small flag",
               "a street lamp's glass panes glowing warm yellow, seen straight on",
               "the cut end of a square hay bale",
               "the round wooden top of a barrel with an iron hoop around the edge"]},
]

# ------------------------------------------------------------------ prompt text
def creature_sheet(c):
    return f"""We're starting a new creature for the same game. Make a character design sheet for an original creature called {c['name']}, for a creature-collecting game. The attached images are the original pixel-art sprite and a pixel-art turnaround sheet showing it from every angle. Keep the same design, colours and personality, but redraw it as clean, high-definition painted concept art, not pixel art. Where the two pictures differ, follow the sprite.

THE PAGE
Landscape, 1536 x 1024. On the left, a large three-quarter hero view. On the right, small front, side and back views in a row, all the same size and standing on the same ground line, with the side view facing left. Below them, three or four close-ups of its most important details. Next to the small views, {c['bar']}. The name "{c['name'].upper()}" at the top. No other text.

THE CREATURE
{c['creature']}

POSE
{c['pose']}

{LOOK_CREATURE}"""


def creature_front(c):
    return f"""Now make the HD views of {c['name']} from this sheet, one picture per view. Start with the FRONT view.

Rules for every view:
- True orthographic, like a technical drawing: no perspective and no tilt. For this one, the camera looks dead at its front from mid-height.
- {c['canvas']}. The whole creature in frame with about a 5% margin, centred left to right, nothing cut off. In every view, at the same scale: its lowest point on the same pixel row, and its highest point on the same pixel row.
- Exactly the same creature as the sheet: same shapes, same markings, same colours on the same parts in every view. Its left and right halves mirror each other.
- The same pose in every view, with clear gaps of background between separate parts (legs, arms, wings).
- Nothing hair-thin: every part, spike, feather and tuft at least 5 cm across. Nothing see-through, smoky, blurred or flashing. No sparkles or particles in the air.
- No text.

{LOOK_CREATURE}"""


def creature_side(c):
    return f"Same again for the SIDE view of {c['name']}: the camera dead at its side, the creature facing LEFT (its nose toward the left edge of the picture). Same scale, same ground line and same top line as the front view, same paint and detail. All the same rules."


def creature_back(c):
    return f"Same again for the BACK view of {c['name']}: the camera dead behind it, looking at its back and tail. Same scale, same ground line and same top line as the front view, same paint and detail. All the same rules."


def creature_top(c):
    return f"Same again for the TOP view of {c['name']}: the camera straight down from above, with its head at the TOP of the picture and its tail at the bottom. {c['top_canvas']}, with the whole creature in frame. Same paint and detail. All the same rules."


def person_refs_line(p):
    return ("The attached images are the original pixel-art sprite with a close-up of the face, and a pixel-art turnaround sheet showing the character from every angle. Where they differ, follow the sprite."
            if p["turn"] else "The attached image is the original pixel-art sprite with a close-up of the face.")


def person_sheet(p, first=False):
    intro = ("We're making the people for the same creature-collecting game as the creatures in this chat." if not first else
             "We're making the people for a cosy creature-collecting game. The creatures are already done as painted 3D-style art; now the people need to match them.")
    item_close = f", and {p['item']} drawn on its own" if p["item"] else ""
    hands = (f"Hands empty: {p['item']} is NOT in their hands in any view (it's drawn on its own in a close-up, and the game puts it in their hand later)."
             if p["item"] else "Hands empty.")
    return f"""{intro} Make a character design sheet for {p.get('pname', p['name'])}, {p['role']}. {person_refs_line(p)} Keep the same design, outfit, colours and personality, but redraw them as clean, high-definition painted concept art, not pixel art.

THE PAGE
Landscape, 1536 x 1024. On the left, a large front three-quarter hero view. On the right, small front, side and back views in a row, all the same size with the feet on the same ground line, with the side view facing left. Below them, close-ups of the face, a hand and a shoe{item_close}. Next to the small views, a height bar in metres showing {p['height']} m. The name "{p.get('label', p['name'].upper())}" at the top. No other text.

THE CHARACTER
{p['person']}

POSE
Standing straight in a relaxed A-pose, the same in every view: arms straight down and held about 30 degrees out from the body, so there is a clear gap of background between each arm and the body; hands relaxed with the fingers together; feet about shoulder-width apart with a clear gap between the legs; looking straight ahead with a friendly expression. {hands}

{LOOK_PERSON}"""


def person_front(p):
    return f"""Now make the HD views of {p['short']} from this sheet, one picture per view. Start with the FRONT view.

Rules for every view:
- True orthographic, like a technical drawing: no perspective and no tilt. For this one, the camera looks dead at their front from chest height.
- Portrait, 1024 x 1536. The whole person in frame with about a 5% margin, centred left to right, nothing cut off. In every view, at the same scale: the soles of the feet on the same pixel row, and the top of the head (or hat) on the same pixel row.
- Exactly the same person as the sheet: same shapes, same clothes, same colours on the same parts in every view.
- The same relaxed A-pose in every view, with clear gaps of background between the arms and the body and between the legs. Hands empty, fingers together.
- Nothing hair-thin: hair in chunky locks at least 3 cm across; straps, laces and belts at least 2 cm wide. Nothing see-through, blurred or flashing. No sparkles or particles in the air.
- No text.

{LOOK_PERSON}"""


def person_side(p):
    return f"Same again for the SIDE view of {p['short']}: the camera dead at their side, the person facing LEFT (their nose toward the left edge of the picture), so we see their left side. Same scale, same ground line and same top line as the front view, same paint and detail. All the same rules."


def person_back(p):
    return f"Same again for the BACK view of {p['short']}: the camera dead behind them, looking at their back. Same scale, same ground line and same top line as the front view, same paint and detail. All the same rules."


def person_top(p):
    return f"Same again for the TOP view of {p['short']}: the camera straight down from above, looking at the top of their head and shoulders, with their face and toes pointing toward the TOP edge of the picture. Square, 1024 x 1024, with the whole person in frame. Same paint and detail. All the same rules."


def texture_prompt(t, first):
    cells = "\n".join(f"{i + 1}. {c}" for i, c in enumerate(t["cells"]))
    attach = ("Attach one of the finished creature pictures (for example mossback_sheet.png) so the paint style matches. "
              if first else "")
    if t["tile"]:
        kind = ("Each square is one material, and each must tile seamlessly: its left edge continues into its right edge, "
                "and its top edge into its bottom edge, with no visible seam and no single feature that stands out when "
                "repeated. Fill each square completely, edge to edge.")
    else:
        kind = ("Each square holds one object detail seen straight on, filling the square, on a plain flat light-grey "
                "background exactly #C8C8CA where the object doesn't reach.")
    return f"""{attach}Make a texture sheet called "{t['name']}" for the game's 3D buildings, furniture and props.

THE PAGE
Landscape, 1536 x 1024: a grid of 3 columns and 2 rows of six square tiles, each exactly 512 x 512, edge to edge, with no gaps, borders, labels or text between them. Reading order: top row left to right, then bottom row left to right.

THE SIX TILES
{cells}

{kind}

{LOOK_TEXTURE}"""


# ------------------------------------------------------------------ page parts
def img64(path):
    mime = "image/jpeg" if path.endswith(".jpg") else "image/png"
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode("ascii")


def block(label, text, pid):
    return f"""<div class="prompt">
  <div class="phead"><span class="plabel">{html.escape(label)}</span><button class="copy" data-target="{pid}" type="button">Copy</button></div>
  <pre id="{pid}">{html.escape(text)}</pre>
</div>"""


def refs(items):
    figs = "".join(f"""<figure class="ref"><img src="{img64(path)}" alt="{html.escape(alt)}" class="{cls}" loading="lazy"><figcaption>{html.escape(cap)}</figcaption></figure>"""
                   for path, alt, cap, cls in items)
    return f'<div class="refs">{figs}</div>'


CREATURE_CHECKS = ["The side view faces LEFT.", "The top view is straight down, with the head at the top.",
                   "No face or eyes in the back view.", "No perspective (near parts drawn bigger than far parts).",
                   "No black outlines, floor shadow, smoke or sparkles crept back in.", "The background is plain light grey."]
PERSON_CHECKS = ["The side view faces LEFT.", "The arms are clear of the body, and the legs apart, in the front and back views.",
                 "The hands are empty.", "The top view is straight down, with the face toward the top.",
                 "No face in the back view.", "No perspective (near parts drawn bigger than far parts).",
                 "No black outlines or floor shadow.", "The background is plain light grey."]


def two_lists(files, checks):
    f = "".join(f"<li><code>{html.escape(x)}</code></li>" for x in files)
    c = "".join(f"<li>{html.escape(x)}</li>" for x in checks)
    return f"""<div class="two"><div><h3>Bring back</h3><ul class="files">{f}</ul></div><div><h3>Re-roll any picture that breaks one of these</h3><ul>{c}</ul></div></div>"""


def creature_section(c):
    i = c["id"]
    r = refs([(f"{REF}/{i}-sprite.png", f"{c['name']} sprite, enlarged", "Sprite: attach to prompt 1.", "pix sq"),
              (f"{REF}/{i}-turnaround.jpg", f"{c['name']} pixel turnaround sheet", "Turnaround: attach to prompt 1 too.", "pix wide")])
    return f"""<section class="card" id="{i}">
  <p class="eyebrow">{html.escape(c['where'])} · No. {c['no']} · {html.escape(c['type'])}</p>
  <h3 class="name">{html.escape(c['name'])}</h3>
  <p class="lore">{html.escape(c['lore'])}</p>
  <p class="size">{html.escape(c['size_line'])} · skeleton: {html.escape(c['skeleton'])}</p>
  {r}
  {block('1 · Character sheet (attach both pictures)', creature_sheet(c), f'{i}-1')}
  {block('2 · HD front view', creature_front(c), f'{i}-2')}
  {block('3 · HD side view (facing left)', creature_side(c), f'{i}-3')}
  {block('4 · HD back view', creature_back(c), f'{i}-4')}
  {block('5 · HD top view', creature_top(c), f'{i}-5')}
  {two_lists([f'{i}_{v}.png' for v in ['sheet', 'front', 'side', 'back', 'top']], c['checks'] + CREATURE_CHECKS)}
</section>"""


def person_section(p, first=False):
    i = p["id"]
    items = [(f"{REF}/{i}-sprite.png", f"{p['name']} sprite and face, enlarged", "Sprite and face: attach to prompt 1.", "pix wide")]
    if p["turn"]:
        items.append((f"{REF}/{i}-turnaround.jpg", f"{p['name']} pixel turnaround sheet", "Turnaround: attach to prompt 1 too.", "pix wide"))
    item_line = f" · held item made in code: {p['item']}" if p["item"] else ""
    return f"""<section class="card" id="{i}">
  <p class="eyebrow">{html.escape(p['where'])} · {html.escape(p['role'])}</p>
  <h3 class="name">{html.escape(p['name'])}</h3>
  <p class="size">{p['height']} m tall{html.escape(item_line)}</p>
  {refs(items)}
  {block('1 · Character sheet (attach the pictures)', person_sheet(p, first), f'{i}-1')}
  {block('2 · HD front view', person_front(p), f'{i}-2')}
  {block('3 · HD side view (facing left)', person_side(p), f'{i}-3')}
  {block('4 · HD back view', person_back(p), f'{i}-4')}
  {block('5 · HD top view', person_top(p), f'{i}-5')}
  {two_lists([f'{i}_{v}.png' for v in ['sheet', 'front', 'side', 'back', 'top']], p['checks'] + PERSON_CHECKS)}
</section>"""


def texture_section(t, first):
    i = t["id"]
    checks = (["Exactly six squares in a 3 by 2 grid, edge to edge.", "Each square repeats without a visible seam.", "Flat and straight-on, no light from one side.", "No text anywhere."]
              if t["tile"] else ["Exactly six squares in a 3 by 2 grid, edge to edge.", "Each detail seen straight on and filling its square.", "No readable text anywhere."])
    return f"""<section class="card" id="tex-{i}">
  <p class="eyebrow">Texture sheet · {'tiling materials' if t['tile'] else 'details'}</p>
  <h3 class="name">{html.escape(t['name'])}</h3>
  <p class="lore">For {html.escape(t['for'])}.</p>
  {block('Prompt' + (' (attach one finished creature picture)' if first else ''), texture_prompt(t, first), f'tex-{i}')}
  {two_lists([f'texture-{i}.png'], checks)}
</section>"""


CSS = """
  :root {
    --bg: #f5f1ea; --card: #fffdf8; --ink: #241a14; --muted: #6d5f55; --line: #e2d8cc; --accent: #c2531c; --code: #f1ebe2;
    --font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; --mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  }
  @media (prefers-color-scheme: dark) { :root { --bg: #17120f; --card: #211a15; --ink: #f2e9e0; --muted: #b3a294; --line: #3a2e26; --accent: #ff8a3a; --code: #2a211b; color-scheme: dark; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 var(--font); }
  main { max-width: 860px; margin: 0 auto; padding: 24px max(16px, env(safe-area-inset-left)) 64px max(16px, env(safe-area-inset-right)); display: grid; gap: 22px; }
  h1 { margin: 0; font-size: 28px; line-height: 1.15; text-wrap: balance; }
  h2 { margin: 18px 0 0; font-size: 22px; }
  h3 { margin: 0 0 6px; font-size: 15px; }
  h3.name { margin: 2px 0 4px; font-size: 24px; }
  .intro p, .intro li { max-width: 65ch; }
  .intro ol, .intro ul { padding-left: 20px; margin: 8px 0 0; }
  .eyebrow { margin: 0; font: 600 12px/1.3 var(--font); letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
  .lore { margin: 0 0 4px; color: var(--muted); max-width: 60ch; }
  .size { margin: 0; font: 13px/1.4 var(--mono); }
  nav { display: flex; gap: 8px; flex-wrap: wrap; }
  nav a { color: var(--ink); background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 6px 12px; text-decoration: none; font-size: 14px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; display: grid; gap: 12px; min-width: 0; }
  .refs { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
  .ref { margin: 0; text-align: center; min-width: 0; }
  .ref img { display: block; border-radius: 10px; border: 1px solid var(--line); background: #fff; image-rendering: pixelated; max-width: 100%; height: auto; }
  .ref img.sq { width: 180px; }
  .ref img.wide { width: 300px; }
  .ref figcaption { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .prompt { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
  .phead { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 8px 10px; background: var(--code); border-bottom: 1px solid var(--line); }
  .plabel { font-weight: 600; font-size: 14px; }
  .copy { font: 600 13px/1 var(--font); color: var(--card); background: var(--accent); border: 0; border-radius: 8px; padding: 8px 12px; cursor: pointer; flex: none; }
  .copy:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  pre { margin: 0; padding: 12px; white-space: pre-wrap; word-wrap: break-word; font: 13px/1.5 var(--mono); max-height: 300px; overflow: auto; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .two > div { min-width: 0; }
  .two ul { margin: 0; padding-left: 18px; font-size: 14px; }
  code { font: 13px var(--mono); }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  .tablewrap { overflow-x: auto; }
  @media (max-width: 620px) { .two { grid-template-columns: 1fr; } .ref img.wide { width: 100%; } }
"""

JS = """
document.addEventListener("click", async e => {
  const b = e.target.closest(".copy"); if (!b) return;
  const pre = document.getElementById(b.dataset.target);
  try { await navigator.clipboard.writeText(pre.textContent); b.textContent = "Copied"; }
  catch { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected"; }
  setTimeout(() => b.textContent = "Copy", 1600);
});
"""


def page(title, body):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
<style>{CSS}</style>
</head>
<body>
<main>
{body}
</main>
<script>{JS}</script>
</body>
</html>
"""


# ------------------------------------------------------------------ page 1: the two main characters
main_body = f"""<section class="intro">
  <p class="eyebrow">Creature Catch · Chapter 1 · people</p>
  <h1>Picture request: the two main characters</h1>
  <p>The hero you play, as the boy and as the girl. They're the first people made with the paint-and-bake method, so they're also the test of how well people work. Each one needs five pictures: a character sheet, then four HD views made from it.</p>
  <ol>
    <li>Use the same ChatGPT chat as the creatures, so the paint style matches.</li>
    <li>For each character: save both reference pictures, attach them to prompt 1, then send prompts 2 to 5 in order.</li>
    <li>Check each view against the list under it, and re-roll any view that breaks a rule.</li>
    <li>Bring back all 10 pictures, named as listed (a zip per character is fine).</li>
  </ol>
  <p><b>Why the A-pose:</b> arms a little out from the body and feet apart, the same in every view, so every arm and leg can be traced on its own and the skeleton can move it.</p>
  <nav aria-label="Characters"><a href="#player-a">The boy</a><a href="#player-b">The girl</a></nav>
</section>
{person_section(MAIN[0], first=True)}
{person_section(MAIN[1])}"""

# ------------------------------------------------------------------ page 2: everything else
n_cre = len(CREATURES) * 5
n_ppl = len(PEOPLE) * 5
nav_c = "".join(f'<a href="#{c["id"]}">{c["name"]}</a>' for c in CREATURES)
nav_p = "".join(f'<a href="#{p["id"]}">{p["name"]}</a>' for p in PEOPLE)
nav_t = "".join(f'<a href="#tex-{t["id"]}">{t["name"]}</a>' for t in TEXTURES)
all_body = f"""<section class="intro">
  <p class="eyebrow">Creature Catch · Chapter 1 · picture list</p>
  <h1>Picture request: everything else for Chapter 1</h1>
  <p>Every picture the playable Chapter 1 demo still needs, apart from the two main characters, who have their own page. Evolutions aren't included, because a normal Chapter 1 playthrough never reaches them.</p>
  <div class="tablewrap"><table>
    <tr><th>Part</th><th>What</th><th>Pictures</th></tr>
    <tr><td>1 · Creatures</td><td>The 8 you meet: Hopsprout, Tuftail, Pebblepup, Bumblop, Dewt and Dandylion, plus Wormapple and Scarecrowl (optional: they live in the Orchard, which the earlier demo didn't build)</td><td>{n_cre} (5 each)</td></tr>
    <tr><td>2 · People</td><td>The other 10: Juniper, Elder Willow, Tinker, Rosa, Hazel, Pip, Fern, Ranger Oakley, Farmer Bramble, the farm kid</td><td>{n_ppl} (5 each)</td></tr>
    <tr><td>3 · Texture sheets</td><td>Woods, roofs, walls, floors and fabrics, nature and metal, and three sheets of details, for the buildings, furniture and props</td><td>{len(TEXTURES)} (1 each)</td></tr>
  </table></div>
  <p><b>Not needed:</b></p>
  <ul>
    <li><b>The towns' ground and the battle backgrounds:</b> they use the game's own pictures, in the diorama and painted looks.</li>
    <li><b>Buildings, furniture, props and the capture cube:</b> modelled straight from the game's own art and covered with the texture sheets, with no reference photo of each object. The things people carry are made the same way: Elder Willow's staff, Farmer Bramble's pitchfork, Tinker's net, Rosa's tray, Fern's basket and Pip's cubes.</li>
  </ul>
  <p><b>How to run it:</b></p>
  <ol>
    <li><b>Creatures and people:</b> as before, one at a time in the creature chat. Attach both reference pictures to prompt 1, then send prompts 2 to 5.</li>
    <li><b>Texture sheets:</b> one chat for all eight. Attach a finished creature picture to the first sheet so the paint matches.</li>
    <li>Check each picture against the list under it, and re-roll any that breaks a rule.</li>
    <li>Bring the pictures back named as listed. A zip per creature or person, and one for the texture sheets, is fine.</li>
  </ol>
  <h2>Creatures</h2><nav aria-label="Creatures">{nav_c}</nav>
  <h2>People</h2><nav aria-label="People">{nav_p}</nav>
  <h2>Texture sheets</h2><nav aria-label="Texture sheets">{nav_t}</nav>
</section>
<h2>1 · Creatures</h2>
{''.join(creature_section(c) for c in CREATURES)}
<h2>2 · People</h2>
{''.join(person_section(p) for p in PEOPLE)}
<h2>3 · Texture sheets</h2>
{''.join(texture_section(t, k == 0) for k, t in enumerate(TEXTURES))}"""

os.makedirs(OUT, exist_ok=True)
for name, title, body in (("picture-request-main-characters.html", "Main Characters Request", main_body),
                          ("picture-request-chapter1.html", "Chapter 1 Picture List", all_body)):
    p = os.path.join(OUT, name)
    open(p, "w").write(page(title, body))
    print(p, f"{os.path.getsize(p) / 1e6:.2f} MB")
