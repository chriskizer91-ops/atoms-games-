# Creature Catch: Extra Image Prompts

Everything the first four prompt files don't cover yet: the new vampire line, attack effect sheets, UI pieces, items, portraits, battle poses for people, interiors, outposts, and the world map. Every prompt is self-contained: copy one and paste it into the generator.

## Read this first: what the code draws, and what needs a picture

The game is one standalone HTML file. Each creature is **one still sprite**, and the code brings it to life:

| Done in code (no image needed) | Why |
|---|---|
| Idle breathing, bobbing, squash and stretch, wobble | The code bends the still sprite every frame |
| Lunges, recoils, shakes, flashes, fainting, shrinking into the cube | Same: movement and tint applied to the one sprite |
| Glows, auras, dust, sparkles, status drips (burn smoke, poison bubbles, sleep Zs) | Drawn as particles and soft light around the sprite |
| Battle transitions (pixel mosaic, spiral bars, flash, grass wipe) | Crisp, any size, and costs nothing to ship |
| Evolution (white silhouette pulsing between the two sprites) | Built from the sprites' own shapes |
| Shiny variants | A palette shift of the normal sprite |
| Back view of your own creature | The front sprite, mirrored and placed lower-left |
| Text, numbers, menus, bars | Drawn with a pixel font, so nothing is garbled |

**Where a picture really helps:** particle shapes for each type (a hand-drawn flame or ice shard looks far better than a code square), the big burst for each strong move, small icons (types, items, emotes), faces for dialogue, and places (interiors, outposts, the map). That's what this file asks for.

### Background color for everything in this file

Use a **solid flat magenta (#FF00FF) background** for every cut-out sprite in this file. White is a problem because many creatures and effects have white in them (Pengloo's belly, Bonecat's bones, sparkles), and removing a white background would eat those parts too. Magenta never shows up in the art, so the game's art tool can remove it cleanly.

Sprites you already made on white are fine. The tool removes white by flood-filling from the edges, so it stops at the bold dark outline.

### Size and format

Generators make large images (about 1024px) that only look like pixel art. The art tool finds the fake pixel grid, shrinks the image to its true size (64x64, 32x32, 16x16) with hard edges, cuts the palette back to 16 colors, and saves it as a lossless PNG inside the HTML file. Don't use lossy WebP or JPEG for pixel art, because it smears the hard edges. (The `shrink.js` size tester in `building-with-assets-` is built for painted maps. It's the right tool there, but not for these sprites.) For scale: all 67 creature sprites shrunk to true size come to well under 1 MB in total.

---

## 1. New Creature Line: the Vampire

**Fangling** (Shadow) evolves at **Lv 32** into **Rosferatu** (Shadow / Plant). It's a cute vampire bat with a rose motif: the rosebud on Fangling's head blooms on Rosferatu's chest. It's uncommon in the Night Ruins. Its signature move is **Thorn Kiss**, a Shadow drain move that heals half the damage dealt.

If you'd rather it be a 3-stage line like the starters, an optional middle form (**Duskfang**, Lv 20) is included. It's off by default.

**Line-up sheet (generate this first)**
> Pixel art evolution line sprite sheet of a vampire bat creature in 2 stages from left to right on one row: a small round baby vampire bat with dusty purple fur, a cape of wings with crimson lining, tiny fangs and a dark red rosebud on its head (Fangling), and a tall elegant vampire bat lord standing upright with huge crimson-lined cape wings, a high collar of dark red rose petals and a blooming crimson rose on its chest (Rosferatu), each clearly the same creature family, Game Boy Advance JRPG style, 64x64 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Fangling** (base, Shadow)
> Pixel art game sprite of a small round baby vampire bat called Fangling, dusty purple fur, oversized pointed ears, little wings wrapped around its body like a cape with crimson red lining, two tiny white fangs in a shy smile, big ruby red eyes, a small dark red rosebud growing on top of its head. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Rosferatu** (evolves from Fangling at Lv 32, Shadow / Plant)
> Pixel art game sprite of Rosferatu, the evolved form of Fangling the baby vampire bat: a tall elegant vampire bat lord standing upright, dusty purple fur, huge cape-like wings spread wide with crimson red lining, a high collar made of dark red rose petals, a fully bloomed crimson rose on its chest, thorny green vines curling around its wrists, long pointed ears, glowing ruby eyes, a confident fanged smirk. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Optional middle stage: Duskfang** (Lv 20, Shadow)
> Pixel art game sprite of Duskfang, the evolved form of Fangling the baby vampire bat: a lean teenage vampire bat, dusty purple fur, wings now half-open like a short cape with crimson lining, longer fangs, a half-open dark red rose on its head, pointed ears, sharp ruby eyes, a mischievous grin. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

---

## 2. Attack Effect Particle Sheets (8)

The code throws, sprays, and swirls these small shapes for every move of that type. One sheet per type, each with 8 separate 16x16 pieces in a row. Keep glow pieces outline-free so they blend.

**Fire**
> Pixel art game effect sprite sheet, one row of 8 separate 16x16 particle sprites for a fire attack: small flame tongue, tall flame, round ember, cluster of embers, smoke puff, spark star, curled fireball, flame ring, bright orange red and yellow, glowing pieces have no outline, Game Boy Advance JRPG style, limited 16-color palette, flat shading, evenly spaced, solid flat magenta #FF00FF background, no text.

**Water**
> Pixel art game effect sprite sheet, one row of 8 separate 16x16 particle sprites for a water attack: single droplet, splash crown, round bubble, small bubble cluster, curling wave crest, foam puff, ripple ring, spray burst, bright blue teal and white, glowing pieces have no outline, Game Boy Advance JRPG style, limited 16-color palette, flat shading, evenly spaced, solid flat magenta #FF00FF background, no text.

**Plant**
> Pixel art game effect sprite sheet, one row of 8 separate 16x16 particle sprites for a plant attack: green leaf, spinning leaf, thorn, short thorny vine, seed, spore puff, pink petal, sprouting bud, greens with pink accents, Game Boy Advance JRPG style, limited 16-color palette, flat shading, evenly spaced, solid flat magenta #FF00FF background, no text.

**Earth**
> Pixel art game effect sprite sheet, one row of 8 separate 16x16 particle sprites for an earth attack: small pebble, jagged rock chunk, dust puff, sand spray, cracked ground piece, crystal shard, dirt clod, boulder fragment, browns grays and tan, Game Boy Advance JRPG style, limited 16-color palette, flat shading, evenly spaced, solid flat magenta #FF00FF background, no text.

**Bolt**
> Pixel art game effect sprite sheet, one row of 8 separate 16x16 particle sprites for an electric attack: short zigzag bolt, forked bolt, spark star, round static orb, crackle arc, tiny spark dots, electric ring, flash burst, bright yellow and white with a little cyan, glowing pieces have no outline, Game Boy Advance JRPG style, limited 16-color palette, flat shading, evenly spaced, solid flat magenta #FF00FF background, no text.

**Frost**
> Pixel art game effect sprite sheet, one row of 8 separate 16x16 particle sprites for an ice attack: snowflake, ice shard, icicle, frost sparkle, snow puff, ice cube chunk, cold mist wisp, frozen ring, pale blue white and cyan, glowing pieces have no outline, Game Boy Advance JRPG style, limited 16-color palette, flat shading, evenly spaced, solid flat magenta #FF00FF background, no text.

**Shadow**
> Pixel art game effect sprite sheet, one row of 8 separate 16x16 particle sprites for a shadow attack: dark smoke wisp, curling shadow tendril, purple poison bubble, small skull-shaped puff, three-line claw slash, dark orb with purple rim, bat silhouette, crescent of darkness, deep purples and near-black with a soft violet glow, Game Boy Advance JRPG style, limited 16-color palette, flat shading, evenly spaced, solid flat magenta #FF00FF background, no text.

**Lumen**
> Pixel art game effect sprite sheet, one row of 8 separate 16x16 particle sprites for a light attack: four-point star sparkle, small moon crescent, glowing orb, light ray beam piece, halo ring, twinkle cross, soft glow dot, feather of light, pale gold cream and soft white, glowing pieces have no outline, Game Boy Advance JRPG style, limited 16-color palette, flat shading, evenly spaced, solid flat magenta #FF00FF background, no text.

**Neutral hits (Tackle, Struggle, and every impact)**
> Pixel art game effect sprite sheet, one row of 8 separate 16x16 impact sprites: white hit star, small impact burst, three motion speed lines, curved slash arc, round dust cloud, sweat drop, up arrow sparkle for stat raise, down arrow for stat drop, white yellow and light gray, Game Boy Advance JRPG style, limited 16-color palette, flat shading, evenly spaced, solid flat magenta #FF00FF background, no text.

---

## 3. Strong Move Bursts (8)

The big finishing frame of each type's strong move. These are 4-frame strips at 64x64 per frame, growing then fading. The code plays them over the target and adds particles from the sheets above.

**Flare Burst (Fire)**
> Pixel art game effect animation strip, 4 frames in one row, 64x64 pixels each: a fire explosion growing from a small bright core to a huge round blast of orange and yellow flames, then breaking into embers and smoke, glowing with no outline, Game Boy Advance JRPG style, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Torrent Crash (Water)**
> Pixel art game effect animation strip, 4 frames in one row, 64x64 pixels each: a big blue wave rising, curling over, crashing down in a white foam splash, then scattering into droplets, Game Boy Advance JRPG style, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Thorn Barrage (Plant)**
> Pixel art game effect animation strip, 4 frames in one row, 64x64 pixels each: thorny green vines bursting up from the ground, lashing outward in a spiky tangle with flying leaves, then withering into falling petals, Game Boy Advance JRPG style, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Quake Stomp (Earth)**
> Pixel art game effect animation strip, 4 frames in one row, 64x64 pixels each: the ground cracking open, jagged rock spikes erupting upward with a dust cloud, then rocks crumbling back down into rubble, Game Boy Advance JRPG style, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Thunder Snap (Bolt)**
> Pixel art game effect animation strip, 4 frames in one row, 64x64 pixels each: a thick yellow lightning bolt striking down from the top, a bright white flash burst at the bottom, crackling electric rings spreading out, then fading sparks, glowing with no outline, Game Boy Advance JRPG style, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Blizzard Rush (Frost)**
> Pixel art game effect animation strip, 4 frames in one row, 64x64 pixels each: a swirl of snow and ice shards spinning into a whirlwind, jagged ice crystals forming in the center, then shattering into sparkling frost, pale blue and white, Game Boy Advance JRPG style, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Night Pounce (Shadow)**
> Pixel art game effect animation strip, 4 frames in one row, 64x64 pixels each: a dark purple shadow shape with glowing eyes lunging forward, three huge claw slashes tearing across, then dissolving into dark smoke wisps, Game Boy Advance JRPG style, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Radiant Beam (Lumen)**
> Pixel art game effect animation strip, 4 frames in one row, 64x64 pixels each: a pale gold light orb gathering, firing a wide beam of white-gold light, a starburst flash on impact, then fading twinkles, glowing with no outline, Game Boy Advance JRPG style, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

---

## 4. UI Icons

**Type badges (8)**
> Pixel art sprite sheet of 8 small rounded game type badges in one row, each a colored rounded rectangle with a simple white symbol and no letters: red-orange badge with a flame, blue badge with a water drop, green badge with a leaf, brown badge with a rock, yellow badge with a lightning bolt, pale cyan badge with a snowflake, dark purple badge with a crescent eye, cream-gold badge with a four-point star, bold dark outline, Game Boy Advance JRPG style, 32x16 pixels each, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Overworld emote bubbles**
> Pixel art sprite sheet of 8 small speech-bubble emotes in one row, white bubbles with dark outline: red exclamation mark, blue question mark, pink heart, three dots, yellow music note, angry red vein mark, sweat drop, sleepy z, Game Boy Advance JRPG style, 16x16 pixels each, limited 16-color palette, flat shading, solid flat magenta #FF00FF background.

**Item icons**
> Pixel art sprite sheet of 12 game item icons in a grid of 4 columns and 3 rows: red potion bottle, large red potion bottle with a gold cap, small blue tonic vial, large blue tonic flask, green herb bundle, gold feather (revive), warm orange glowing sun-shaped crystal shard, pale silver glowing moon-crescent crystal shard, small leather coin pouch, rolled paper map, small glowing purple-and-blue cube on a key ring (portable vault key), wooden whistle, bold dark outline, Game Boy Advance JRPG style, 16x16 pixels each, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Region trail charms (8, earned from region guides)**
> Pixel art sprite sheet of 8 small round metal charms in one row, each with a simple engraved symbol: a leaf (Grassland), an acorn (Forest), a wave (Water), a crystal (Cave), a sun (Desert), a snowflake (Snow), a lily pad (Swamp), a crescent moon (Night Ruins), bronze silver and gold tones, bold dark outline, Game Boy Advance JRPG style, 16x16 pixels each, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Battle info plates**
> Pixel art RPG battle info panel frames, two empty panels: a wide cream panel with a dark brown pixel border and a slanted left edge for the enemy creature, and a slightly larger cream panel with a slanted right edge for the player creature, each with an empty thin slot for a health bar, Game Boy Advance JRPG style, 104x32 pixels each, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

---

## 5. Dialogue Portraits

These are faces shown beside the dialog box, at 48x48 each. Generate four per sheet so they match.

**Sheet A: the player and the rival**
> Pixel art sprite sheet of 4 RPG dialogue face portraits in one row, head and shoulders, each in a square frame: a young adventurer with messy brown hair and a green explorer jacket smiling, a young adventurer with a short black ponytail and an orange explorer vest smiling, a cocky rival with spiky red hair and a yellow scarf grinning, the same red-haired rival looking frustrated, Game Boy Advance JRPG style, 48x48 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Sheet B: village**
> Pixel art sprite sheet of 4 RPG dialogue face portraits in one row, head and shoulders, each in a square frame: a kind elderly village elder with a long white beard and green leaf-pattern robe, a gentle young healer with a pink hair ribbon and mint-green dress, a cheerful shopkeeper with round glasses and a striped purple and blue apron, a traveling merchant with a purple hat and curly mustache winking, Game Boy Advance JRPG style, 48x48 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Sheet C: region guides 1**
> Pixel art sprite sheet of 4 RPG dialogue face portraits in one row, head and shoulders, each in a square frame: a forest ranger in a wide-brimmed hat with a feather, an old fisherman in a floppy blue hat and yellow raincoat with gray stubble, a miner with a yellow hard hat lamp and orange beard, a desert traveler in a tan head wrap with a red sash, Game Boy Advance JRPG style, 48x48 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Sheet D: region guides 2**
> Pixel art sprite sheet of 4 RPG dialogue face portraits in one row, head and shoulders, each in a square frame: a snow explorer in a blue parka with goggles on her forehead and rosy cheeks, a friendly swamp witch with a pointed green hat and wild gray hair, a tall pale night watchman with a high navy collar holding a lantern, a warm innkeeper with a brown bun and white apron, Game Boy Advance JRPG style, 48x48 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

---

## 6. People in Battle

These are shown at the start of rival and guide battles, with the player throwing the cube.

**Player A, back view throwing**
> Pixel art battle sprite strip, 3 frames in one row, of a young adventurer seen from behind with messy brown hair, green explorer jacket and small backpack: standing ready, winding up an overhand throw, and arm forward after throwing a purple-and-blue capture cube, Game Boy Advance JRPG style, 64x64 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Player B, back view throwing**
> Pixel art battle sprite strip, 3 frames in one row, of a young adventurer seen from behind with a short black ponytail, orange explorer vest and small backpack: standing ready, winding up an overhand throw, and arm forward after throwing a purple-and-blue capture cube, Game Boy Advance JRPG style, 64x64 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Juniper, battle pose**
> Pixel art battle sprite of a confident young rival with spiky red hair, a yellow scarf and a blue jacket, front-facing, one hand on hip and the other holding up a purple-and-blue capture cube, cocky grin, full body, Game Boy Advance JRPG style, 64x64 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Walk sheets (Player B and Juniper)**
> Pixel art walking sprite sheet of a young adventurer with a short black ponytail, orange explorer vest and small backpack, 4 rows (down, left, right, up) with 3 walking frames each, consistent size and spacing, Game Boy Advance JRPG style, 32x32 pixels per frame, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

> Pixel art walking sprite sheet of a confident young rival with spiky red hair, a yellow scarf and a blue jacket, 4 rows (down, left, right, up) with 3 walking frames each, consistent size and spacing, Game Boy Advance JRPG style, 32x32 pixels per frame, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

Other villagers don't need walk sheets: the code turns their standing sprite to face you and bobs it a little.

---

## 7. Interiors

**Interior tileset**
> Pixel art top-down tileset sheet for cozy house interiors, a grid of separate 16x16 tiles including wooden plank floor, checkered tile floor, woven rug center and edge pieces, cream plaster back wall, wooden wall with window, wall corner pieces, doormat, and staircase, Game Boy Advance JRPG overworld style, limited 16-color palette, flat shading, plain white background, no text.

**Furniture sheet**
> Pixel art top-down 3/4 view sprite sheet of interior furniture: single bed, wooden table with two stools, bookshelf, kitchen stove, potted plant, fireplace with fire, wall clock, wooden chest of drawers, shop counter, shelf stacked with purple-and-blue cubes, each as a separate sprite, Game Boy Advance JRPG overworld style, 16x16 and 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Healing Hut interior pieces**
> Pixel art top-down 3/4 view sprite sheet of healing hut furniture: a white and mint-green healing counter with a glowing pink heart, a round healing machine with four cube slots glowing pink, a tall storage machine of stacked glowing purple-and-blue cubes with a small screen (the Cube Vault), a cot with a mint blanket, a shelf of herb jars, hanging dried herb bundles, each as a separate sprite, Game Boy Advance JRPG overworld style, 16x16 and 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Elder's starter table**
> Pixel art top-down 3/4 view sprite of a round wooden table with a green leaf-pattern cloth and three purple-and-blue capture cubes resting on it in a row, each cube with a small colored gem on top (blue, green, orange), Game Boy Advance JRPG overworld style, 32x32 pixels, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text.

---

## 8. Region Outposts

Every region gets a small outpost with a Healing Hut and Vault access. One shared building, plus a small marker per region, keeps it cheap.

**Outpost healing hut**
> Pixel art top-down 3/4 view building sprite of a small wooden trail outpost hut with a mint-green canvas roof, a glowing pink heart sign above the door, a lantern on a post, a small purple-and-blue cube emblem on the door, Game Boy Advance JRPG overworld style, 48x48 pixels, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

**Outpost signposts, one per region**
> Pixel art top-down sprite sheet of 8 small wooden signposts in one row, each with a carved symbol on the board: leaf, acorn, wave, crystal, sun, snowflake, lily pad, crescent moon, Game Boy Advance JRPG overworld style, 16x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

---

## 9. Gates Between Regions

The world is a straight line of 8 regions. Each exit is blocked until that region's guide opens it.

> Pixel art top-down 3/4 view sprite sheet of 7 path blockers, each a separate sprite: a huge fallen mossy log across a trail, a broken rope bridge over water, a dark cave tunnel blocked by a pile of boulders, a wall of swirling sandstorm, a frozen ice wall across a mountain pass, a sunken boardwalk with missing planks over murky water, a tall stone ruins gate shut with glowing blue runes, Game Boy Advance JRPG overworld style, 32x32 pixels each, bold dark outline, limited 16-color palette, flat shading, solid flat magenta #FF00FF background, no text.

---

## 10. World Map

The map screen and its "you are here" view.

> Pixel art top-down world map of a small island continent for a monster-catching game, a single winding road connecting 9 places in order: a cozy village at the bottom left, sunny green grassland, a deep forest, a big blue lake, a rocky mountain with a cave entrance, an orange desert, snowy peaks, a murky green swamp, and dark moonlit ruins at the top right, small icons for each place, ocean around the edges, Game Boy Advance JRPG style, 240x160 pixels, limited 16-color palette, flat shading, no text, no labels.

---

## Totals

| Group | Images |
|---|---|
| Vampire line (line-up + 2 sprites, + optional middle) | 3 (+1) |
| Type particle sheets + neutral hits | 9 |
| Strong move bursts | 8 |
| UI icons (types, emotes, items, charms, plates) | 5 |
| Portrait sheets | 4 |
| People in battle + walk sheets | 5 |
| Interiors | 4 |
| Outposts | 2 |
| Gates | 1 |
| World map | 1 |
| **Total** | **42 (+1 optional)** |
