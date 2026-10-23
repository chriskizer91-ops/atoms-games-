# Creature Catch Expansion: Image Prompts

> **Style check (v8):** these prompts were matched to the art already in the game. Cut-out art is on magenta (pink creatures on white); creatures have no loose sparkles, rings, ripples or see-through parts (the game adds those effects in code); legendaries and Keepers use the same 64x64 sprite line as every other creature (the game draws bosses bigger itself); trainer sheets match the old ones (32x48, each holding a cube); portraits are framed like the existing ones; tilesets are a 4 x 4 grid of full tiles (the game draws shores and path edges itself); stills use the same palette words as stills 1 to 6.

All the art for the expansion. Every prompt is self-contained: copy it, paste it into the image generator, done. The names here match `creature-catch-expansion-guide.md` exactly, so the building agent knows where each picture goes.

## How to use this file

**Best results: attach a picture from the game as a style reference.**
1. Open the Field Guide or the game's ZOO code and save a creature picture (Tuftail works well). For people, save an NPC like Ranger Oakley. For buildings, save the Inn.
2. Attach it in the image-generator chat.
3. Start your prompt with: **"Match the art style of the attached image exactly: same outline weight, shading, colors and level of detail."**
4. Paste the prompt from this file.

**Other tips**
- Keep one image-generator chat per section, so the style stays matched.
- Use the background each prompt asks for. Almost everything is on **solid magenta #FF00FF**: it cuts out cleanly, even around white fur, wool, snow, steam and paper, which a white background eats into. The few **pink creatures** (Shellbit, Conchord, Lotusprite, Lotusage, Pickaxolotl, Glimstar) stay on **white**, since pink and magenta blur together. Tilesets stay on white; battle backgrounds, stills and the world map fill the whole frame.
- Keep effects attached to the creature (a flame tail, a glowing crest, a cloud on its head). The game adds sparkles, rings, sleep Z's, glows and splashes in code during battles, so loose bits floating around the sprite end up as stray specks once it's shrunk to game size.
- Don't worry if the size isn't exact. The agent resizes everything.
- Name each saved file with the name in **bold** (for example, `puffmunk.png`) and hand them to the agent in batches.
- For evolved forms, attach the base form you already made and start with: **"Using the attached sprite for colors, markings and design, draw its evolved form:"**

## Checklist

| Section | What | Images |
|---|---|---|
| A | New creatures in existing regions | 26 |
| B | Side-area creatures | 32 |
| C | Legendaries | 2 (plus 2 optional) |
| D | New people (sprites + portraits) | 36 + 3 sheets |
| E | Buildings | 21 |
| F | Tilesets | 11 |
| G | Battle backgrounds | 13 |
| H | Landmarks and signposts | 11 + 1 sheet |
| I | Prop sheets | 11 |
| J | Interior furniture sheets | 16 |
| K | Kids' creature prompts (templates) | as needed |
| L | Cutscene stills | 8 |
| M | Items | 8 |
| N | World map | 1 |

You don't need everything at once. The guide's build order (section 0) says which batch comes first.

---

## A. New Creatures in Existing Regions

### Meadow Path

**Puffmunk**
> Pixel art game sprite of Puffmunk, a small brown chipmunk with cream and dark stripes down its back, huge round cheeks stuffed so full of red berries it can barely see over them, a big bushy tail, tiny paws holding one more berry, happy squinty eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Stashmunk** (evolves from Puffmunk)
> Pixel art game sprite of Stashmunk, the evolved form of Puffmunk the chipmunk: a bigger, sturdier brown chipmunk with cream and dark stripes, chubby cheeks, a leaf-woven satchel slung across its body overflowing with nuts and berries, an acorn cap worn like a helmet, a confident protective stance, big bushy tail. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Fleecling**
> Pixel art game sprite of Fleecling, a small white lamb whose wool is a real fluffy cloud, a tiny raindrop falling from the cloud wool, little black hooves and face, floppy ears, a sleepy content smile. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Cloudram** (evolves from Fleecling)
> Pixel art game sprite of Cloudram, the evolved form of Fleecling the cloud lamb: a strong ram whose wool is a dark gray-and-white thundercloud, big curled horns crackling with small yellow lightning bolts, black face and hooves, determined eyes, a charging stance. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Grassland

**Dewt**
> Pixel art game sprite of Dewt, a small newt made of morning dew, pale glassy blue body drawn solid with bright white highlights, shiny water droplets along its back, a tiny curled tail, big round sparkly eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Monsoonewt** (evolves from Dewt)
> Pixel art game sprite of Monsoonewt, the evolved form of Dewt the dew newt: a larger deep-blue newt with a frilled crest along its back, light blue belly, water droplets on its skin, and a small gray raincloud resting on top of its head, dripping a few drops. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Forest

**Burrhog**
> Pixel art game sprite of Burrhog, a round brown hedgehog whose spines are sticky green-brown seed burrs, a few seeds and leaves stuck in them, a cream face with a little black nose, tiny feet, partly rolled up and ready to tumble, cheerful eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Lakeshore

**Splotter**
> Pixel art game sprite of Splotter, a playful brown river otter sitting up on its tail, hugging a smooth round gray pebble to its chest, cream face and chest, whiskers, a big grin. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Tidotter** (evolves from Splotter)
> Pixel art game sprite of Tidotter, the evolved form of Splotter the otter: a sleek brown otter with blue-tipped fur standing on a small curling blue wave like a surfboard, its favorite smooth pebble tucked under one arm, confident grin. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Honkwave**
> Pixel art game sprite of Honkwave, a grumpy white goose with blue wingtips, an orange beak wide open mid-honk, angry slanted eyebrows, wings flared, orange feet. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Crystal Cave

**Rimeskink**
> Pixel art game sprite of Rimeskink, a small sleek lizard with frosty pale-blue and white scales, an icicle-shaped tail tip, little frost crystals on its back, tongue sticking out to lick, bright curious eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Shardling**
> Pixel art game sprite of Shardling, a small round creature made of a cluster of glowing cyan and lavender crystals, stubby gray rock legs, a cute face set in the middle crystal, soft glowing core. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Crystalwyrm** (evolves from Shardling)
> Pixel art game sprite of Crystalwyrm, the evolved form of Shardling the crystal creature: a long serpent-like dragon made of faceted glowing cyan and lavender crystals, gray rock segments between the crystals, a crystal crest on its head, coiled pose, a soft glow lighting its body. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Sunscorch Desert

**Kilnadillo**
> Pixel art game sprite of Kilnadillo, an armadillo with a banded shell like baked terracotta clay, glowing orange-hot cracks between the bands, a tan face with a small snout, half curled up as if about to roll. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Mirajack**
> Pixel art game sprite of Mirajack, a tan desert jackrabbit with extremely tall ears with pale gold insides, big amber eyes, a cream belly, and wavy pale-gold heat-haze stripes in its fur like a mirage. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Frostpeak Pass

**Flurrpaca**
> Pixel art game sprite of Flurrpaca, a super fluffy white-and-pale-blue alpaca with a huge pom-pom of fur on its head, rosy cheeks, a small red woven saddle blanket, snowflakes in its fur, a slightly smug face. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Aurorelly**
> Pixel art game sprite of Aurorelly, a floating jellyfish with a round glassy pale-blue bell drawn solid with highlights, long flowing tentacles that glow in northern-lights colors, green, teal, violet and pink, gentle sleepy eyes on its bell. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Murkmire Swamp

**Snaptrap**
> Pixel art game sprite of Snaptrap, a Venus flytrap creature with a green trap head open in a toothy grin, red inside its mouth, purple tint along its leaf edges, two root feet, little leaf arms, mischievous eyes on top of the trap. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Gnashtrap** (evolves from Snaptrap)
> Pixel art game sprite of Gnashtrap, the evolved form of Snaptrap the flytrap: a big flytrap creature with one huge trap head with rows of teeth, two smaller trap heads on vines beside it, a thick twisted dark green and purple vine body rooted in swamp mud, glowing yellow eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Fireflink**
> Pixel art game sprite of Fireflink, a round little firefly with a glowing orange abdomen crackling with tiny yellow electric sparks, small pale wings, a dark brown head with two curly antennae, big happy eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Night Ruins

**Mimicube**
> Pixel art game sprite of Mimicube, a creature disguised as a small capture cube, top half bright purple, bottom half bright blue, the purple lid popped open like a mouth showing little white teeth and a pink tongue, two eyes on the lid, a glowing white seam, tiny stubby legs, a cheeky grin. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Mimichest** (evolves from Mimicube with a Moon Shard)
> Pixel art game sprite of Mimichest, the evolved form of Mimicube the cube mimic: an old wooden treasure chest with gold trim and a purple-and-blue gem on the front, its lid open like a big mouth with teeth, a purple glow inside, a gold coin balanced on its tongue, two eyes on the lid, four stubby wooden legs. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Glyphling**
> Pixel art game sprite of Glyphling, a floating glowing teal ancient rune symbol shaped like a curly letter, two small cute eyes in the middle of the rune, a small glowing dot at each curled end. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Moonlit Spire (post-game)

**Twinkit**
> Pixel art game sprite of Twinkit, a small kitten with dark navy blue fur speckled with tiny white stars, a glowing yellow star mark on its forehead, a tail that ends in a sparkle, big shining eyes, playful pounce pose. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Starlynx** (evolves from Twinkit)
> Pixel art game sprite of Starlynx, the evolved form of Twinkit the star kitten: a sleek navy-blue lynx whose fur is patterned with glowing constellation lines and stars, ear tufts tipped with little glowing stars, a glowing star on its forehead, calm proud stance looking up. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Comette**
> Pixel art game sprite of Comette, a tiny round comet creature with a glowing orange-and-yellow fiery star head, a big happy smile and shining eyes, a long sparkling tail of fire and stardust curving behind it. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

---

## B. Side-Area Creatures

### Willowbrook Orchard

**Wormapple**
> Pixel art game sprite of Wormapple, a shiny red apple with a green leaf and stem on top, and a cute little green worm poking out of a round hole in the side waving hello, big friendly eyes on the worm. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Scarecrowl**
> Pixel art game sprite of Scarecrowl, a black crow wearing a tattered patched straw scarecrow hat, tufts of straw sticking out from under its wings, a little patched scarf, faint orange glowing eyes, wings spread in a spooky-but-cute pose. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Whispering Grove

**Sprigkin**
> Pixel art game sprite of Sprigkin, a tiny forest spirit with a round green body, a big leaf worn as a pointed hat, twig arms and legs, glowing yellow-green eyes, a tiny glowing firefly perched on its leaf hat, singing with its mouth open. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Grovekin** (evolves from Sprigkin)
> Pixel art game sprite of Grovekin, the evolved form of Sprigkin the forest spirit: a taller graceful forest spirit with branch antlers sprouting leaves, a cloak made of overlapping green leaves, glowing yellow-green eyes, holding a wooden staff topped with a glowing white flower. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Snoozeloth**
> Pixel art game sprite of Snoozeloth, a sleepy sloth sitting and hugging a short mossy branch with its long claws, its fur covered in green moss with tiny pink and white flowers growing on the moss, eyes closed in a peaceful smile. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Driftwood Cove

**Shellbit**
> Pixel art game sprite of Shellbit, a small orange hermit crab peeking out of a pink spiral seashell, two little claws raised, eyes on short stalks. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a plain white background, no text, no shadow.

**Conchord** (evolves from Shellbit)
> Pixel art game sprite of Conchord, the evolved form of Shellbit the hermit crab: a big orange crab living in a giant pink-and-cream spiral conch shell shaped like a horn, holding the horn's mouthpiece up and blowing into it, proud eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a plain white background, no text, no shadow.

**Glimstar**
> Pixel art game sprite of Glimstar, a chubby orange-pink starfish with five rounded arms whose tips glow soft yellow, a sweet smiling face in the middle. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a plain white background, no text, no shadow.

### Lantern Isle

**Puffling**
> Pixel art game sprite of Puffling, a round fluffy puffin chick, black back and white belly, a big bright orange-and-yellow striped beak, orange feet, tiny wings, big shiny eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Puffcaptain** (evolves from Puffling)
> Pixel art game sprite of Puffcaptain, the evolved form of Puffling the puffin: a taller proud puffin with a black back, white puffed-out chest, a big orange-and-yellow striped beak, wearing a little navy blue sailor captain's cap with a gold anchor, one wing raised in a salute. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Krakling**
> Pixel art game sprite of Krakling, a baby kraken, a small purple octopus-squid with big curious eyes, glowing teal spots on its head, curly tentacles, one tentacle waving hello. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Kraketide** (evolves from Krakling)
> Pixel art game sprite of Kraketide, the evolved form of Krakling the baby kraken: a huge dark purple and deep blue kraken rising from swirling water, glowing teal spots along its body, many tentacles raised, a small old anchor caught in one tentacle, wise glowing eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Copperbell Town park

**Rustcoon**
> Pixel art game sprite of Rustcoon, a gray raccoon with a rust-orange mask around its eyes and rust-orange rings on its fluffy tail, holding up a shiny copper coin in its little hands, a sneaky happy grin. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Dingdove**
> Pixel art game sprite of Dingdove, a plump soft light-gray dove with a shiny copper bell-shaped crest on its head, rosy pink feet, a small yellow electric spark near the crest, round content eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Glimmer Mine

**Coalcub**
> Pixel art game sprite of Coalcub, a bear cub with fur as black as coal, warm glowing red-orange paws and nose like embers, a smudge of soot on its cheek, sitting with a happy face. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Coalossus** (evolves from Coalcub)
> Pixel art game sprite of Coalossus, the evolved form of Coalcub the coal bear: a large strong bear whose body is made of black coal rock with glowing orange cracks, ember-glowing shoulders and paws, a little smoke rising from its back, a gentle but powerful face. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Pickaxolotl**
> Pixel art game sprite of Pickaxolotl, a pink axolotl with frilly pink gills, a hard gray stone crest on top of its head shaped like a pickaxe head, a long tail, a big smile, water droplets. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a plain white background, no text, no shadow.

### Steamvent Springs

**Steamacaque**
> Pixel art game sprite of Steamacaque, a snow monkey with fluffy gray-tan fur and a red face, a small folded white towel on its head, sitting relaxed with eyes closed, soft white steam rising from its fur. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Geysape** (evolves from Steamacaque)
> Pixel art game sprite of Geysape, the evolved form of Steamacaque the snow monkey: a big strong ape with steaming gray fur tipped orange, a red face, two rocky geyser vents on its shoulders shooting up white steam, beating its chest happily. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Mittencub**
> Pixel art game sprite of Mittencub, a round white polar bear cub with warm glowing red paws shaped like mittens, rosy cheeks, a tiny knitted blue scarf, arms open for a hug, a little warm glow. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Firefly Bayou

**Lotusprite**
> Pixel art game sprite of Lotusprite, a tiny fairy with pale blue skin and dragonfly wings sitting inside an open pink lotus flower, the lotus petals glowing softly, sleepy happy eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a plain white background, no text, no shadow.

**Lotusage** (evolves from Lotusprite)
> Pixel art game sprite of Lotusage, the evolved form of Lotusprite the lotus fairy: a tall graceful bayou spirit with pale blue skin, a flowing dress made of pink lotus petals, dragonfly wings, floating on a green lily pad, holding a lantern made from a glowing lotus bud, wise calm eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a plain white background, no text, no shadow.

**Mudtusk**
> Pixel art game sprite of Mudtusk, a chunky brown boar caked in dried mud like cracked armor plates, two small ivory tusks, a pink snout blowing a mud bubble, happy little eyes, stubby legs. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Ancients' Archive

**Inkwing**
> Pixel art game sprite of Inkwing, a small black raven made of shiny ink, little ink drips at the tips of its wings, tail feathers shaped like a writing quill, a purple shine on its feathers, clever bright eyes, holding a small rolled letter in its beak. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Tomeraven** (evolves from Inkwing)
> Pixel art game sprite of Tomeraven, the evolved form of Inkwing the ink raven: a larger dignified black raven with a purple sheen, wearing tiny round reading glasses, perched in a large open book that floats in the air, glowing purple runes on the pages, quill-shaped tail feathers. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Clocktoise**
> Pixel art game sprite of Clocktoise, an ancient tortoise whose shell is a round brass clock face with roman-style tick marks and two clock hands, small brass gears around the shell's edge, wrinkly green-gray skin, sleepy wise eyes, a tiny electric spark near a gear. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Dawn Temple (post-game)

**Sphinxie**
> Pixel art game sprite of Sphinxie, a small sandstone-colored kitten wearing a golden and blue striped royal headdress, golden eyes lined in dark kohl, a glowing gold sun mark on its chest, sitting upright in a proud pose. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Sphinxar** (evolves from Sphinxie)
> Pixel art game sprite of Sphinxar, the evolved form of Sphinxie the temple kitten: a great sphinx cat with a sandstone body, a gold and blue striped headdress, large golden feathered wings folded at its sides, a glowing sun mark on its chest, lying in a regal guardian pose. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Mummoth**
> Pixel art game sprite of Mummoth, a baby woolly mammoth wrapped head to toe in old tan bandages, one big eye peeking out from between the wraps, its trunk poking out and curled up happily, two small ivory tusks, a loose bandage end trailing. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Hollow Deep (post-game)

**Echoling**
> Pixel art game sprite of Echoling, a round dark gray stone creature with a huge round open mouth in the middle of its body, small glowing violet eyes above the mouth, little stone feet. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Echolith** (evolves from Echoling)
> Pixel art game sprite of Echolith, the evolved form of Echoling the echo stone: a tall dark stone pillar creature with three big round mouths stacked one above another, glowing violet eyes at the top, thick rocky arms, mossy patches. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Umbramoth**
> Pixel art game sprite of Umbramoth, a fluffy moth with deep violet and black wings covered in dim purple eye-spot patterns, a soft lavender fluffy collar, feathery antennae, gentle dreamy eyes. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

---

## C. Legendaries

**Solarion**
> Pixel art game sprite of Solarion, the legendary guardian of the sun: a majestic golden lion with a huge mane of sun rays in orange, yellow and gold, large feathered wings of gold and orange, a glowing sun crest on its forehead, warm amber eyes, a noble standing pose. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, majestic and powerful, filling the frame, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Gloaming**
> Pixel art game sprite of Gloaming, the legendary guardian of dusk: a small shy wolf-shaped creature made of soft violet smoke, its edges glowing faint orange and pink like the last light of a sunset, two soft glowing pale-gold eyes, wisps of smoke trailing from its tail and paws, curled slightly as if unsure, gentle and sad rather than scary. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, mysterious and gentle, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Optional battle forms** (only if the agent wants a different look for the calming battles, like Dimmed Lunarion):

**Groggy Solarion**
> Pixel art game sprite of Solarion the golden winged sun lion just woken up: its sun-ray mane dim and messy, wings half folded, one eye squinting, glowing sun crest flickering, a grumpy sleepy face. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Hiding Gloaming**
> Pixel art game sprite of Gloaming the dusk wolf made of violet smoke, curled up small and trying to hide, its sunset-colored edges dim, face half-hidden behind its smoky tail, one soft glowing eye peeking out. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

---

## D. New People

Each person needs an **overworld sprite** (full body) and a **portrait** (for dialogue). For portraits, attach the overworld sprite you made and start with: "Make a dialogue portrait of the attached character."

### Overworld sprites

**marigold**
> Pixel art overworld NPC sprite of Marigold, a cheerful sturdy woman orchard farmer with curly red hair tied in a scarf, rosy cheeks, a green checked shirt, brown overalls, holding a basket of red apples, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**russet**
> Pixel art overworld NPC sprite of Russet, a young boy with messy copper-red hair, freckles, round glasses, an orange t-shirt and brown shorts, holding a small notebook, a know-it-all grin, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**fennick**
> Pixel art overworld NPC sprite of Old Fennick, a skinny old hermit with a long tangled white beard with a leaf stuck in it, a patched moss-green cloak, a walking stick made from a crooked branch, a bird's nest on his hat, a happy confused smile, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**coral**
> Pixel art overworld NPC sprite of Coral, a dreamy young woman beachcomber with long wavy sea-green hair, a shell necklace, a loose white shirt and rolled-up blue pants, barefoot, holding a glass bottle, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**wren**
> Pixel art overworld NPC sprite of Keeper Wren, a small elderly woman lighthouse keeper with short silver hair, a thick navy wool sweater, a yellow rain scarf, round spectacles, holding a brass lantern, a sharp knowing smile, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**barnaby**
> Pixel art overworld NPC sprite of Mayor Barnaby, a round kind middle-aged man with a gray mustache, a tall copper-colored top hat, a dark green suit with a gold mayor's sash and a copper chain, a worried friendly face, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**hollis**
> Pixel art overworld NPC sprite of Professor Hollis, a tall thin excited museum curator with wild gray hair, a brown tweed jacket with elbow patches, a bow tie, round glasses, holding a magnifying glass, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**ada**
> Pixel art overworld NPC sprite of Cubesmith Ada, a strong practical woman craftsperson with dark skin, short black hair, brass goggles pushed up on her forehead, a leather work apron over a purple shirt, holding a small purple-and-blue capture cube and a tiny hammer, a proud smile, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**poppy**
> Pixel art overworld NPC sprite of Ms. Poppy, a young cheerful schoolteacher with a brown bun of hair held by a pencil, a red cardigan over a yellow dress, holding a stack of books, a warm smile, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**bun**
> Pixel art overworld NPC sprite of Baker Bun, a jolly round baker with flour on his cheeks and a white chef's hat, a white apron, rolled-up sleeves, holding a tray of golden bread rolls, a big laugh, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**pim**
> Pixel art overworld NPC sprite of Pim, a short cheerful young shopkeeper who looks like a younger brother of a shopkeeper, round glasses, a striped purple and blue apron, a tidy side part, a confident grin, holding a single capture cube, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**holly**
> Pixel art overworld NPC sprite of Nurse Holly, a kind young healer with a blonde braid tied with a mint-green ribbon, a white and mint-green dress with a small red heart badge, a satchel of herbs, a gentle smile, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**toll**
> Pixel art overworld NPC sprite of Old Toll, a very old stooped bell-ringer with a bald head, big white eyebrows, a hearing horn in one hand, a long brown coat with copper buttons, a rope coiled over his shoulder, a gentle face, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**grit**
> Pixel art overworld NPC sprite of Grit, a gruff stocky retired miner with a big bushy gray beard, a battered dented miner's helmet with an unlit lamp, a patched brown vest over a gray shirt, suspenders, arms crossed, a grumpy but kind face, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**yuzu**
> Pixel art overworld NPC sprite of Auntie Yuzu, a warm plump middle-aged innkeeper with black hair in a bun held by chopsticks, a cozy orange quilted jacket over a dark blue robe, holding a steaming bowl of soup, a huge welcoming smile, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**bo**
> Pixel art overworld NPC sprite of Boatman Bo, a tall slow gentle man with a wide straw hat, a long gray beard, a loose faded green shirt and rolled-up pants, barefoot, holding a long wooden boat pole, a sleepy kind smile, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**ilsa**
> Pixel art overworld NPC sprite of Archivist Ilsa, an excitable young woman scholar with messy dark navy hair in two buns, big round glasses, a long dark blue scholar's robe with teal rune embroidery, arms full of scrolls, ink on her fingers, a delighted grin, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**amani**
> Pixel art overworld NPC sprite of Grandmother Amani, a calm dignified elderly desert woman with warm brown skin, a flowing sand-colored robe and a deep red head wrap with gold sun embroidery, gold hoop earrings, a carved wooden staff topped with a small golden sun, a wise wry smile, front-facing standing pose, Game Boy Advance JRPG style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

### Portraits
Make one portrait for each person above. Attach the overworld sprite and use this prompt, filling in the name and mood:

> Make a dialogue portrait of the attached character, [NAME]: head and shoulders, three-quarter view, [MOOD], same outfit, hair and colors as the attached sprite, in a square frame, Game Boy Advance JRPG style, 48x48 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

| Portrait | Mood |
|---|---|
| marigold | cheerful and bossy |
| russet | smug know-it-all |
| fennick | happily confused |
| coral | dreamy |
| wren | sharp and amused |
| barnaby | worried but kind |
| hollis | wide-eyed excitement |
| ada | proud and practical |
| poppy | warm and patient |
| bun | laughing |
| pim | confident grin |
| holly | gentle |
| toll | gentle and tired |
| grit | gruff, a hint of a smile |
| yuzu | huge welcoming smile |
| bo | sleepy and kind |
| ilsa | delighted |
| amani | calm and wise |

### Trainer sheets

**Side-area trainers, sheet 1** (`trainer-15` to `trainer-22`)
> Pixel art sprite sheet of 8 different young RPG trainers in one row, evenly spaced with a gap between each figure, full body, front-facing standing pose, consistent size: an orchard kid in overalls with a straw hat, a beekeeper in a white veiled hat, a bug-catcher kid with a net, a swimmer in a striped swimsuit with goggles, a sandcastle kid with a bucket and spade, a sailor in a striped shirt and cap, a bird watcher with binoculars, a young miner with a helmet and pickaxe. each holding a purple-and-blue capture cube, Game Boy Advance JRPG style, 32x48 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Side-area trainers, sheet 2** (`trainer-23` to `trainer-30`)
> Pixel art sprite sheet of 8 different RPG trainers in one row, evenly spaced with a gap between each figure, full body, front-facing standing pose, consistent size: an old miner with a lantern, a hiker with a big backpack and woolly hat, a snowboarder in a puffy jacket, a bayou fisher with waders and a fishing rod, a firefly-catcher kid holding a glowing jar, a young scholar in a robe holding a book, a temple explorer in a safari hat and khaki outfit, a second temple explorer with a torch and a scarf. each holding a purple-and-blue capture cube, Game Boy Advance JRPG style, 32x48 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Copperbell villagers** (`villager-9` to `villager-16`)
> Pixel art sprite sheet of 8 different townsfolk NPCs in a row, all full body, front-facing standing, consistent size and spacing, from a copper mining hill town: a flower seller with a basket, a lamplighter with a long pole, a grandpa with a cane and flat cap, a girl with pigtails and a kite, a market stall merchant in an apron, a town guard in a copper-buttoned coat, a schoolboy with a satchel, a woman in a long coat walking a small dog. Game Boy Advance JRPG style, 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

---

## E. Buildings

All buildings use this style ending: *Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.*

**marigold-farmhouse**
> Pixel art top-down 3/4 view building sprite of a cozy orchard farmhouse with a red-brown shingled roof, cream walls, a wooden porch with baskets of red apples, an apple pie cooling on the windowsill, a wooden door, flower boxes, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**orchard-barn**
> Pixel art top-down 3/4 view building sprite of a classic red barn with white trim and a big double door, a wooden cider press with barrels beside it, a hay loft opening, a small beehive at the side, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**fennick-treehouse**
> Pixel art top-down 3/4 view building sprite of a ramshackle little tree house built around the trunk of a big oak tree, patched wooden walls, a round door, a rope ladder hanging down, wind chimes, a bird house on the roof, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**coral-beach-hut**
> Pixel art top-down 3/4 view building sprite of a small beach hut on short stilts with a thatched straw roof, pale blue painted wooden walls, strings of seashells hanging by the door, glass bottles lined on a shelf outside, a little sand path, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**lighthouse**
> Pixel art top-down 3/4 view building sprite of a tall red-and-white striped lighthouse on rocks, a round glass lamp room at the top glowing warm yellow, a black iron balcony around the top, a wooden door at the base, tall and narrow, Game Boy Advance JRPG overworld style, 64x128 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**wren-cottage**
> Pixel art top-down 3/4 view building sprite of a small stone seaside cottage with a gray slate roof, a chimney with smoke, blue shutters, a fishing net and a life ring hanging on the wall, a cat sitting on the step, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**small-healing-hut**
> Pixel art top-down 3/4 view building sprite of a very small round healing hut with a white and mint-green roof, a glowing pink heart sign above the door, hanging herb bundles, a wooden door, Game Boy Advance JRPG overworld style, 48x48 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**copperbell-town-hall**
> Pixel art top-down 3/4 view building sprite of a grand two-story red brick town hall with a shiny copper-green roof, a small clock above the door, stone steps, two flag banners in copper orange, tall windows, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**museum**
> Pixel art top-down 3/4 view building sprite of a stone museum with white columns at the front, a copper roof, a big carved ancient rune over the door glowing faint teal, a small stone creature statue beside the steps, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**cubesmith-workshop**
> Pixel art top-down 3/4 view building sprite of a brick workshop with a tall chimney puffing smoke, a big glowing forge window, a hanging sign shaped like a purple-and-blue capture cube, crates of cubes and tools outside, a copper roof, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**school**
> Pixel art top-down 3/4 view building sprite of a small schoolhouse with red brick walls, a white wooden bell cupola on the roof, a chalkboard sign by the door, a little playground swing beside it, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**bakery**
> Pixel art top-down 3/4 view building sprite of a cozy bakery with a striped orange awning, a big front window full of bread loaves and rolls, a hanging sign shaped like a bread loaf, warm light, a copper roof, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**bell-tower**
> Pixel art top-down 3/4 view building sprite of a tall square brick bell tower with a copper-green pointed roof, an open arched belfry at the top holding a big copper bell with a visible crack, a wooden door at the base, tall and narrow, Game Boy Advance JRPG overworld style, 64x128 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**copperbell-house-1**
> Pixel art top-down 3/4 view building sprite of a narrow two-story town house with red brick walls, a copper roof, a green door, flower boxes with red flowers, a small lamp by the door, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**copperbell-house-2**
> Pixel art top-down 3/4 view building sprite of a cozy town cottage with tan stone walls, a copper roof with a chimney, a blue door, ivy on one wall, a bicycle leaning by the door, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**mine-entrance**
> Pixel art top-down 3/4 view sprite of an old mine entrance cut into a rocky hillside, heavy wooden support beams, a "closed" wooden barrier half pushed aside, minecart tracks leading in, two hanging lanterns, copper ore glinting in the rock, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**grit-shack**
> Pixel art top-down 3/4 view building sprite of a small rough wooden miner's shack with a tin roof, a stovepipe chimney, a pickaxe leaning by the door, a rocking chair on a tiny porch, an old minecart used as a flower planter, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**hot-spring-inn**
> Pixel art top-down 3/4 view building sprite of a cozy wooden hot spring inn in the snow, a curved dark tiled roof covered in snow, warm glowing paper windows, red cloth banners by the sliding door, stone lanterns, steam rising from behind a bamboo fence, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**bo-boathouse**
> Pixel art top-down 3/4 view building sprite of a weathered wooden stilt house over dark bayou water, a mossy tin roof, nets and paper lanterns hanging on the porch, a small flat-bottomed wooden boat tied to the stilts, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**archive-stairs**
> Pixel art top-down 3/4 view sprite of an ancient stone stairway leading down into the ground in moonlit ruins, a carved stone arch over the stairs with glowing teal runes, a heavy stone door at the bottom, broken pillars on each side, ivy, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**dawn-temple-entrance**
> Pixel art top-down 3/4 view sprite of hidden sandstone temple stairs opening beneath a desert oasis pool, the water parted to reveal golden carved steps going down, a sandstone archway with a big golden sun carving glowing warmly, palm trees around it, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

---

## F. Tilesets

**orchard**
> Pixel art top-down tileset sheet for a sunny apple orchard, arranged as a 4 by 4 grid of 16 separate square tiles with thin white gaps between them, each tile filled edge to edge, 16x16 tiles including short green grass, TALL SWAYING GRASS tiles where creatures hide, rows of apple tree bases, fallen red apples on grass, a plain dirt path tile, clover patches, wooden fence pieces and a hay patch, Game Boy Advance JRPG overworld style, limited 16-color palette, flat shading, plain white background, no text.

**grove**
> Pixel art top-down tileset sheet for an ancient forest grove, arranged as a 4 by 4 grid of 16 separate square tiles with thin white gaps between them, each tile filled edge to edge, 16x16 tiles including deep green mossy ground, TALL FERNS where creatures hide, giant tree root pieces, a ring of small mushrooms, patches of sunlight on moss, soft glowing flowers, a narrow dirt trail, and a clear stream with stepping stones, Game Boy Advance JRPG overworld style, limited 16-color palette, flat shading, plain white background, no text.

**cove**
> Pixel art top-down tileset sheet for a sunny sandy beach cove, arranged as a 4 by 4 grid of 16 separate square tiles with thin white gaps between them, each tile filled edge to edge, 16x16 tiles including pale sand, wet sand, a gentle surf tile, shallow turquoise water, tide pool pieces with rocks, TALL BEACH GRASS clumps where creatures hide, driftwood, seashells and starfish on sand, Game Boy Advance JRPG overworld style, limited 16-color palette, flat shading, plain white background, no text.

**isle**
> Pixel art top-down tileset sheet for a small rocky sea island, arranged as a 4 by 4 grid of 16 separate square tiles with thin white gaps between them, each tile filled edge to edge, 16x16 tiles including gray sea rocks, short windswept grass, TALL SEA GRASS where creatures hide, a rocky cliff-face tile, deep blue sea water, crashing white foam pieces, puffin burrow holes, and a stone path, Game Boy Advance JRPG overworld style, limited 16-color palette, flat shading, plain white background, no text.

**copperbell**
> Pixel art top-down tileset sheet for a copper mining hill town, arranged as a 4 by 4 grid of 16 separate square tiles with thin white gaps between them, each tile filled edge to edge, 16x16 tiles including warm gray cobblestone streets, red brick plaza tiles, a round copper fountain piece, flower beds, short park grass, a small patch of TALL GRASS for the town park, stone steps, iron lamp post bases and stone walls, Game Boy Advance JRPG overworld style, limited 16-color palette, flat shading, plain white background, no text.

**mine**
> Pixel art top-down tileset sheet for an old copper mine, arranged as a 4 by 4 grid of 16 separate square tiles with thin white gaps between them, each tile filled edge to edge, 16x16 tiles including dark brown rock floor, wooden plank walkways, a straight minecart track tile, wooden support beam walls, glinting copper ore in rock, dark flooded water pieces, piles of rubble, and PATCHES OF GLITTERING GRAVEL where creatures hide, Game Boy Advance JRPG overworld style, limited 16-color palette, flat shading, plain white background, no text.

**springs**
> Pixel art top-down tileset sheet for a hot spring valley in the snow, arranged as a 4 by 4 grid of 16 separate square tiles with thin white gaps between them, each tile filled edge to edge, 16x16 tiles including fresh snow, warm dark rock, steaming turquoise hot spring water, bamboo fence pieces, flat stepping stones, a wooden boardwalk, and TALL FROSTY GRASS where creatures hide, Game Boy Advance JRPG overworld style, limited 16-color palette, flat shading, plain white background, no text.

**bayou**
> Pixel art top-down tileset sheet for a nighttime firefly bayou, arranged as a 4 by 4 grid of 16 separate square tiles with thin white gaps between them, each tile filled edge to edge, 16x16 tiles including dark muddy ground, still dark water with reflections, cypress tree root pieces, hanging moss, glowing lotus flowers on lily pads, wooden dock planks, TALL REEDS where creatures hide, and tiny floating firefly lights, Game Boy Advance JRPG overworld style, limited 16-color palette with deep blue-green night colors and warm yellow glows, flat shading, plain white background, no text.

**archive**
> Pixel art top-down tileset sheet for an underground ancient library, arranged as a 4 by 4 grid of 16 separate square tiles with thin white gaps between them, each tile filled edge to edge, 16x16 tiles including blue stone floor tiles, carved rune floor tiles glowing teal, a dark stone wall tile with bookshelf faces, worn red carpet runners, scattered paper, GLOWING RUNE MOSS patches where creatures hide, and stone stair pieces, Game Boy Advance JRPG overworld style, limited 16-color palette, flat shading, plain white background, no text.

**dawn-temple**
> Pixel art top-down tileset sheet for an ancient golden sun temple underground, arranged as a 4 by 4 grid of 16 separate square tiles with thin white gaps between them, each tile filled edge to edge, 16x16 tiles including warm sandstone floor, carved sun pattern floor tiles, a sandstone wall tile with sun carvings, shafts of sunlight on the floor, sliding stone block tiles, drifts of sand, DRY GOLDEN GRASS TUFTS where creatures hide, and small water channels, Game Boy Advance JRPG overworld style, limited 16-color palette, flat shading, plain white background, no text.

**hollow-deep**
> Pixel art top-down tileset sheet for a deep dark quiet cavern, arranged as a 4 by 4 grid of 16 separate square tiles with thin white gaps between them, each tile filled edge to edge, 16x16 tiles including very dark purple-gray rock floor, a dark cave wall tile, dim violet crystals, still black water pools with faint reflections, soft shadow wisps, PATCHES OF DIM VIOLET MOSS where creatures hide, and old carved stone path pieces, Game Boy Advance JRPG overworld style, limited 16-color palette, dark but readable, flat shading, plain white background, no text.

---

## G. Battle Backgrounds

All battle backgrounds use: *no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.*

**bg/orchard**
> Pixel art battle background of a sunny apple orchard, a grassy circular platform with fallen red apples in the foreground, rows of apple trees heavy with fruit, a red barn far behind, blue sky with fluffy clouds, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**bg/grove**
> Pixel art battle background of an ancient forest grove, a mossy circular platform ringed with small mushrooms in the foreground, giant ancient trees with huge roots, soft beams of golden light, floating glowing specks, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**bg/cove**
> Pixel art battle background of a sunny beach cove, a sandy platform with seashells in the foreground, gentle turquoise waves, an old shipwreck on a sandbar in the distance, bright sky with seagulls, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**bg/isle**
> Pixel art battle background of a windswept rocky island, a grassy rock platform in the foreground, crashing waves against cliffs, a red-and-white striped lighthouse in the distance, a dramatic cloudy sky, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**bg/copperbell**
> Pixel art battle background of a copper mining hill town park, a grassy platform with a cobblestone edge in the foreground, red brick buildings with copper roofs behind, a tall bell tower in the middle distance, a warm sunny sky, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**bg/mine**
> Pixel art battle background inside an old copper mine, a rocky platform with a minecart track in the foreground, wooden support beams, hanging lanterns casting warm light, glinting copper ore in the walls, a dark tunnel behind, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**bg/springs**
> Pixel art battle background of a hot spring valley in the snow, a flat rocky platform beside a steaming turquoise pool in the foreground, snowy pine trees, a wooden inn with a glowing window in the distance, a big geyser steaming, soft falling snow, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**bg/bayou**
> Pixel art battle background of a firefly bayou at night, a muddy platform with glowing lotus flowers in the foreground, dark water reflecting hundreds of tiny glowing fireflies, giant cypress trees draped in moss, a deep blue night sky, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**bg/archive**
> Pixel art battle background inside an underground ancient library, a blue stone platform with a glowing teal rune circle in the foreground, towering bookshelves, floating glowing runes, a giant brass orrery model of the sun and moon in the distance, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**bg/dawn-temple**
> Pixel art battle background inside an ancient sandstone sun temple, a carved sandstone platform in the foreground, golden sun carvings on the walls, shafts of warm sunlight falling from openings above, burning braziers, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**bg/hollow-deep**
> Pixel art battle background deep inside a dark quiet cavern, a dark rock platform in the foreground, dim violet crystals, a still black pool reflecting faint light, soft drifting shadow wisps, a gentle sad mood, dark but readable, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**bg/sun-altar** (Solarion battle)
> Pixel art battle background of a great golden sun altar inside an ancient temple, a round golden altar platform with sun-ray carvings in the foreground, a huge glowing sun disc carved on the back wall, bright beams of light, sandstone pillars, dramatic and warm, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**bg/dusk-pool** (Gloaming battle)
> Pixel art battle background of a still pool at the very bottom of a deep cavern, a smooth stone ledge platform in the foreground, a glassy pool reflecting a soft violet and orange sunset glow from nowhere, dim crystals, wisps of violet smoke, quiet and gentle, no characters, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

---

## H. Landmarks and Signposts

Landmarks are big map pieces, and they're also where each area's Keeper waits. All use: *top-down 3/4 view, Game Boy Advance JRPG overworld style, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.*

**landmark-oldest-apple-tree**
> Pixel art top-down 3/4 view landmark sprite of a giant ancient gnarled apple tree, a thick twisted trunk, a huge wide canopy full of red apples with a few glowing golden apples, golden apples lying on the grass around its roots, Game Boy Advance JRPG overworld style, 96x96 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**landmark-grandmother-oak**
> Pixel art top-down 3/4 view landmark sprite of an enormous ancient oak tree with a kind wrinkled face formed in its bark, eyes gently closed, huge roots spreading out, moss and tiny glowing flowers on the roots, a wide leafy canopy, Game Boy Advance JRPG overworld style, 96x96 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**landmark-shipwreck**
> Pixel art top-down 3/4 view landmark sprite of an old wooden shipwreck tilted on a sandbar, a broken mast with a torn sail, barnacles and seaweed on the hull, a hole in the side, small waves lapping around it, Game Boy Advance JRPG overworld style, 96x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**landmark-great-geode**
> Pixel art top-down 3/4 view landmark sprite of a giant cracked-open geode in a mine, a rough brown rock shell with an inside full of huge glowing purple and cyan crystals, sparkles, Game Boy Advance JRPG overworld style, 96x96 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**landmark-great-geyser**
> Pixel art top-down 3/4 view landmark sprite of a big geyser in a ring of warm orange and white mineral rock, a tall column of white steam and water shooting up, a small rainbow in the spray, snow around the edges, Game Boy Advance JRPG overworld style, 64x96 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**landmark-lantern-tree**
> Pixel art top-down 3/4 view landmark sprite of a giant cypress tree in dark bayou water, long hanging moss, its branches covered in hundreds of tiny glowing yellow fireflies so the whole tree glows like a lantern, glowing reflections in the water, Game Boy Advance JRPG overworld style, 96x96 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**landmark-forbidden-shelf**
> Pixel art top-down 3/4 view landmark sprite of a huge ancient bookshelf sealed with glowing teal rune chains, old books glowing softly behind the chains, a carved stone frame with a crescent moon and sun on top, Game Boy Advance JRPG overworld style, 64x96 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**landmark-sun-altar**
> Pixel art top-down 3/4 view landmark sprite of a round golden sun altar on sandstone steps, a big carved sun disc standing behind it, a soft cushion of golden light on top where a guardian sleeps, braziers on each side, Game Boy Advance JRPG overworld style, 96x96 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**landmark-dusk-pool**
> Pixel art top-down 3/4 view landmark sprite of a small perfectly still pool in a dark cavern, the water glowing faint violet and orange like a sunset, smooth stones around the edge, dim crystals, a few wisps of violet smoke, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**landmark-ancient-door**
> Pixel art top-down 3/4 view landmark sprite of a huge round ancient stone door set in a mine wall, carved with a wolf made of smoke curled around a crescent moon and a sun, rows of small carved runes around the edge, faint cold blue glow in the cracks, Game Boy Advance JRPG overworld style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**landmark-dusk-bell**
> Pixel art sprite of a big old copper bell hanging from a wooden beam, green patina on the copper, a visible crack down one side, and a second version beside it with the crack healed and the bell glowing softly orange, two separate sprites side by side, Game Boy Advance JRPG style, 48x48 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Signposts** (one sheet, 11 signs)
> Pixel art sprite sheet of 11 small wooden signposts in a row, each with a different small picture painted on the sign and no words: a red apple, an oak leaf, a seashell, a lighthouse, a copper bell, a pickaxe, a steam cloud, a firefly, an open book, a golden sun, a violet crescent of smoke. Consistent size and spacing, Game Boy Advance JRPG overworld style, 16x16 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

(In order: orchard, grove, cove, isle, copperbell, mine, springs, bayou, archive, dawn-temple, hollow-deep.)

---

## I. Prop Sheets

All prop sheets use: *each item a separate sprite in a grid, top-down 3/4 view, Game Boy Advance JRPG overworld style, 16x16 to 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.*

**orchard-props**
> Pixel art sprite sheet of orchard props: a wooden crate of red apples, a wooden ladder leaning, a cider barrel, a beehive box, a scarecrow with a straw hat, a wheelbarrow of apples, a hay bale, a basket of golden apples, a wooden apple stand, each item a separate sprite in a grid, top-down 3/4 view, Game Boy Advance JRPG overworld style, 16x16 to 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**grove-props**
> Pixel art sprite sheet of ancient grove props: a huge mossy fallen log, a giant fern, a ring of red-and-white mushrooms, a mossy stone with an old carving, a glowing flower cluster, a hollow tree stump, a small wooden footbridge, a bird house on a post, each item a separate sprite in a grid, top-down 3/4 view, Game Boy Advance JRPG overworld style, 16x16 to 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**cove-props**
> Pixel art sprite sheet of beach props: a sandcastle, a striped beach umbrella, a glass message bottle half buried in sand, a pile of seashells, a driftwood log, a beach towel, a bucket and spade, a tide pool rock with a starfish, a wooden dock post, each item a separate sprite in a grid, top-down 3/4 view, Game Boy Advance JRPG overworld style, 16x16 to 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**isle-props**
> Pixel art sprite sheet of island props: a red-and-white buoy, a coil of rope, a fishing net hung on posts, a lobster trap, a mossy sea rock, a puffin burrow, an old anchor, a small rowboat pulled onto rocks, a wooden crate, each item a separate sprite in a grid, top-down 3/4 view, Game Boy Advance JRPG overworld style, 16x16 to 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**copperbell-props**
> Pixel art sprite sheet of copper mining town props: an iron street lamp post, a wooden park bench, a round fountain with a copper creature statue, a market stall with a striped awning, a flower barrel, a notice board, a copper mailbox, a stack of crates, a hanging copper shop sign, each item a separate sprite in a grid, top-down 3/4 view, Game Boy Advance JRPG overworld style, 16x16 to 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**mine-props**
> Pixel art sprite sheet of old mine props: an empty minecart, a minecart full of copper ore, a hanging lantern, a wooden support beam, a pile of ore, a pickaxe in a rock, a broken wooden barrier, a miner's metal lunchbox, a small glowing crystal cluster, each item a separate sprite in a grid, top-down 3/4 view, Game Boy Advance JRPG overworld style, 16x16 to 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**springs-props**
> Pixel art sprite sheet of hot spring props: a stone lantern with snow on top, a small steam vent in rock, a bamboo water spout, a stack of folded towels, a wooden bucket, a snow-covered bamboo fence section, a red paper lantern, a small wooden bench, each item a separate sprite in a grid, top-down 3/4 view, Game Boy Advance JRPG overworld style, 16x16 to 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**bayou-props**
> Pixel art sprite sheet of bayou props: cypress knees sticking out of water, a flat-bottomed wooden boat, a hanging glowing paper lantern, a glass jar of fireflies, a mossy old stump, a wooden dock with a post, a clump of cattails, a glowing lotus flower, each item a separate sprite in a grid, top-down 3/4 view, Game Boy Advance JRPG overworld style, 16x16 to 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**archive-props**
> Pixel art sprite sheet of ancient library props: a tall bookshelf, a toppling pile of books, a pile of scrolls, a reading desk with an open book and candle, a stone pillar carved with glowing teal runes, a floating glowing rune, a ladder on wheels, a globe of the night sky, a blank stone wall tablet, each item a separate sprite in a grid, top-down 3/4 view, Game Boy Advance JRPG overworld style, 16x16 to 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**dawn-temple-props**
> Pixel art sprite sheet of sun temple props: a sandstone pillar with sun carvings, a burning golden brazier, a sandstone cat statue, a turnable bronze mirror on a stand, a sliding sandstone block, a golden urn, a pile of sand, a sun-symbol floor switch, each item a separate sprite in a grid, top-down 3/4 view, Game Boy Advance JRPG overworld style, 16x16 to 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**hollow-deep-props**
> Pixel art sprite sheet of deep cavern props: a dim violet crystal cluster, a drifting wisp of shadow smoke, a stalagmite, a smooth dark boulder, a still small dark pool, an old carved stone with a sun and moon, a faint glowing mushroom, a broken ancient lantern, each item a separate sprite in a grid, top-down 3/4 view, Game Boy Advance JRPG overworld style, 16x16 to 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

---

## J. Interior Furniture Sheets

For every building that can be entered. All use: *3/4 top-down view, each item a separate sprite in a grid, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.* For the best match, attach a furniture picture from the game (like the Inn counter).

**farmhouse** (Bramble's farmhouse, Marigold's farmhouse)
> Pixel art sprite sheet of farmhouse interior furniture: a wood-burning kitchen stove, a big wooden dining table with a pie, wooden chairs, a dog bed, a shelf of jam jars, a rocking chair, a woven rug, a cupboard of plates, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**barn**
> Pixel art sprite sheet of barn interior props: a big wooden cider press, a stack of hay bales, a row of cider barrels, a hayloft ladder, a pitchfork rack, a feed trough, wooden stall walls, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**ranger-station** (Oakley)
> Pixel art sprite sheet of ranger station interior furniture: a big wall map of the forest, a sightings board with pinned notes and drawings of creatures, a desk with binoculars and a lantern, a rack of walking sticks, a stuffed backpack, a potted fern, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**dock-shack** (Gus, Coral's beach hut)
> Pixel art sprite sheet of seaside shack interior furniture: a fishing rod rack, a tackle box, a bucket of fish, framed photos of big fish, a hammock, a shelf of glass bottles and seashells, a ship's wheel on the wall, a small stove with a kettle, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**mine-office** (Dusty's office, Grit's shack)
> Pixel art sprite sheet of miner's office interior furniture: a desk covered in mine blueprints, a pegboard of tools, a pot-bellied stove with a pot of beans, a framed photo of two miners, a crate of ore samples, a lantern on a hook, a lumpy old armchair, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**nomad-tent** (Safi)
> Pixel art sprite sheet of desert tent interior furniture: patterned red and gold floor rugs, large floor cushions, a low table with a brass teapot, a star chart scroll on a stand, a brass lantern, a woven basket of dates, a folded letter on a small chest, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**log-cabin** (Frida)
> Pixel art sprite sheet of mountain log cabin interior furniture: a stone fireplace with a fire, a bear-skin-style rug, climbing ropes and ice axes on a rack, a bunk bed with quilts, a wooden table with a map of the mountains, snow boots by the door, a mug of cocoa, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**witch-hut** (Granny Moss)
> Pixel art sprite sheet of friendly swamp witch hut interior furniture: a bubbling green cauldron, shelves of colorful potion jars, hanging dried herbs, a cat sleeping on a cushion, a spell book on a stand, a mushroom-shaped stool, a cozy patchwork armchair, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**watchtower** (Corvin)
> Pixel art sprite sheet of night watchtower interior furniture: a large brass telescope on a stand, a desk with an open journal and candle, a moon phase chart on the wall, a rack of lanterns, a spiral staircase piece, a narrow cot, a stack of old books, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**museum**
> Pixel art sprite sheet of museum interior furniture: a glass display case with an ancient capture cube, a display case with stone runes, a stone creature statue on a plinth, three wall plaques, a velvet rope barrier, a large ancient map on the wall, a fossil skeleton of a creature, a curator's desk, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**workshop** (Cubesmith Ada)
> Pixel art sprite sheet of cube workshop interior furniture: a glowing forge, an anvil, a workbench covered in half-finished purple-and-blue capture cubes, a shelf of colored cube parts, a big copper vat of glowing liquid, a rack of tools, a crate of finished cubes, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**school**
> Pixel art sprite sheet of schoolroom interior furniture: a big chalkboard with creature drawings, a teacher's desk with an apple, rows of small wooden student desks, a type chart poster on the wall, a bookshelf, a globe, a cubby shelf with backpacks, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**bakery**
> Pixel art sprite sheet of bakery interior furniture: a brick bread oven glowing warm, a glass counter full of pastries, wooden shelves of bread loaves, a flour sack, a kneading table with dough, a tray of golden rolls, a small cafe table and chairs, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**town-hall** (Mayor Barnaby, plus the Copperbell houses)
> Pixel art sprite sheet of town hall and town house interior furniture: a grand wooden mayor's desk, a tall portrait painting of the town's founders, a red carpet runner, a copper bell model on a stand, a coat rack with a top hat, a bookcase, a cozy family dining table, a small bed with a quilt, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**lighthouse** (lighthouse floors, Wren's cottage, the bell tower)
> Pixel art sprite sheet of lighthouse and tower interior furniture: a large glowing lighthouse lamp with a brass frame, a spiral staircase piece, a shelf of old logbooks, a captain's chair, a ship in a bottle, a coil of rope, a big bell rope hanging down, a teapot on a small table, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**bathhouse** (Auntie Yuzu's inn, Bo's boathouse)
> Pixel art sprite sheet of cozy inn interior furniture: an indoor steaming hot spring bath with a wooden edge, a low table with bowls of soup, floor cushions, a folding paper screen, a shelf of folded towels, a hanging net with glowing paper lanterns, a sleeping mat with a quilt, each item a separate sprite in a grid, 3/4 top-down view, Game Boy Advance JRPG style, about 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

---

## K. Kids' Creature Prompts

Use these when the kids finish their drawings. Take a clear photo of each drawing in good light. Attach the **photo** and, if you can, **one creature sprite from the game** as a style reference.

**K1. A kid's drawing into a creature sprite (lives in one area)**
> Turn the first attached image, a child's drawing of a creature called [NAME], into a pixel art game sprite. Keep the child's design exactly: the same shapes, colors, features and personality. Don't change it into a different creature or make it more "realistic"; just clean it up into polished game art. Match the art style of the second attached image (a sprite from the game). It is a [TYPE] type creature. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**K2. Moonborn version** (a creature that can show up anywhere)
Use K1, and add this sentence before "Game Boy Advance":
> Add a small glowing pale-gold crescent-moon mark on its [forehead / chest / tail / wing], like a birthmark.

**K3. Keeper version** (an epic guardian of a side area)
> Turn the first attached image, a child's drawing of a creature called [NAME], into an epic guardian creature for a pixel art game. Keep the child's design, colors and features exactly, but make it bigger, older and more majestic: a powerful stance, glowing accents, and a glowing teal ancient rune mark somewhere on its body. It guards [LANDMARK, for example "the Oldest Apple Tree in an orchard"]. Match the art style of the second attached image (a sprite from the game). It is a [TYPE] type creature. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, majestic and powerful, filling the frame, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**K4. Evolution from a second drawing**
> The first attached image is a game sprite of [NAME]. The second attached image is a child's drawing of what it evolves into, called [EVOLVED NAME]. Turn the drawing into a pixel art game sprite that clearly belongs to the same creature family as the first sprite: keep the child's design for the evolved form, and carry over the first sprite's colors and markings. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**K5. Evolution without a second drawing**
> Using the attached sprite of [NAME] for colors, markings and design, draw its evolved form, called [EVOLVED NAME]: bigger and stronger, the same creature grown up, [ONE OR TWO NEW DETAILS THE KID WANTS, for example "longer horns and fire on its tail"]. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**What to send the agent with each picture:** the name, type(s), Moonborn or Keeper or a home area, what it evolves into, a special move name, one sentence about it, and who drew it.

---

## L. Cutscene Stills

These are the full-screen story pictures, like the moon scenes in v8. All use: *Pixel art cutscene illustration, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.* For the best match, attach one of the existing stills from the game.

**still-7: Arriving in Copperbell**
> Pixel art cutscene illustration of a young adventurer with a backpack standing at the top of a road looking down at a hill town of red brick houses and shiny copper roofs, a tall bell tower with a copper bell in the middle of town, chimneys puffing smoke, mountains behind, warm afternoon light, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**still-8: Boat to Lantern Isle**
> Pixel art cutscene illustration of a small wooden boat crossing a sparkling blue sea, an old fisherman in a yellow raincoat rowing, a young adventurer at the front pointing ahead, a small rocky island with a red-and-white striped lighthouse in the distance, puffins flying, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**still-9: The Dawn Temple Opens**
> Pixel art cutscene illustration of a desert oasis at sunset, the pool's water parting to reveal glowing golden stairs leading down beneath it, an elderly desert woman with a sun-topped staff raising her hand, a young adventurer and a young woman in a desert cloak watching in awe, palm trees, a warm orange sky, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**still-10: Solarion Wakes**
> Pixel art cutscene illustration inside a sandstone temple, a majestic golden winged lion with a sun-ray mane rising from a golden altar, opening its eyes, beams of warm light bursting out, sand and dust swirling, a tiny adventurer silhouette in the foreground looking up, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**still-11: The Sealed Door Opens**
> Pixel art cutscene illustration deep in an old mine, a huge round stone door carved with a smoke wolf, sun and moon, its seal melting away in golden light from a glowing ember held up by a young adventurer, two old miners watching from behind with lanterns, dark tunnel beyond the door, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**still-12: Gloaming in the Dark**
> Pixel art cutscene illustration of a small wolf-shaped creature made of soft violet smoke with sunset-colored edges, curled up alone beside a still glowing pool in a vast dark cavern, dim violet crystals, a sad and gentle quiet mood, a faint warm light approaching from the side, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**still-13: The Dusk Bell Rings**
> Pixel art cutscene illustration of a copper hill town at dusk, the tall bell tower's big copper bell swinging and glowing softly, golden sound rings spreading over the rooftops, townspeople in the streets looking up and cheering, a pink and orange dusk sky with the first stars, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

**still-14: The Three Guardians**
> Pixel art cutscene illustration at the top of a tall moonlit tower at dusk, three legendary guardians together in the sky: a golden winged sun lion on one side, a silver winged star-filled wolf on the other, and a small violet smoke wolf with sunset-colored edges between them, the sun setting on the left and a full moon rising on the right, a young adventurer and their creatures watching from the tower top, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.

---

## M. Items

All use: *Game Boy Advance JRPG style, 16x16 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.*

**lost-page**
> Pixel art game item icon of a single torn old parchment page with faded writing lines and a small sun and moon doodle in the corner, slightly curled, Game Boy Advance JRPG style, 16x16 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**long-dusk-book**
> Pixel art game item icon of an old leather-bound book with a deep purple cover, a gold crescent moon, sun and small smoke swirl on the front, pages sticking out, Game Boy Advance JRPG style, 16x16 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**boat-ticket**
> Pixel art game item icon of a small paper boat ticket with a tiny boat and lighthouse drawing on it and a torn edge, Game Boy Advance JRPG style, 16x16 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**archive-key**
> Pixel art game item icon of an ornate old stone-and-bronze key with a glowing teal rune on its handle, Game Boy Advance JRPG style, 16x16 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**sun-ember**
> Pixel art game item icon of a small glowing golden ember shaped like a tiny sun, with soft orange flames and a bright warm glow, Game Boy Advance JRPG style, 16x16 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**cube-dusk**
> Pixel art game item icon of a small capture cube, top half deep violet, bottom half deep twilight blue, a glowing orange-pink sunset seam in the middle, tiny star sparkles, Game Boy Advance JRPG style, 16x16 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**copper-roll**
> Pixel art game item icon of a round golden-brown bread roll with a shiny copper-colored glaze on top and a little steam, Game Boy Advance JRPG style, 16x16 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**warm-soup**
> Pixel art game item icon of a small wooden bowl of steaming orange soup with a spoon, Game Boy Advance JRPG style, 16x16 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

---

## N. World Map

Attach the current world map from the game (`bg/world-map`, visible in the Field Guide's Regions section) and use:

> Using the attached world map for style and the existing places, redraw it as a pixel art fantasy world map with these new places added, no text or labels: an apple orchard east of the grassland; an ancient grove of giant trees west of the forest; a sandy beach cove south of the lake with a small rocky island and a lighthouse offshore; a copper-roofed hill town with a bell tower between the crystal cave and the desert, with an old mine beside the town; hot spring steam in a valley beside the snowy mountain pass; a glowing firefly bayou beside the swamp; a stairway down into the earth under the night ruins. Keep every existing place where it is. Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text.
