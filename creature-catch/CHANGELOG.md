# Creature Catch: Versions

The newest version is at the top. Each version is the `creature-catch.html` built from the commit labeled with it.

## v10: a field guide in journey order
- **New numbering:** creatures are numbered in the order you can meet them on the journey, place by place: the starters first, then the Meadow Path, the Grassland, Willowbrook Orchard, and on to the Hollow Deep. A creature's evolutions sit right after it. The Creature Log in the game and the Field Guide use the same numbers.
- **The Field Guide has a tab for each place**, in the order you reach it, and opens on Home Village. Each place's page shows where it is, its wild levels, who to meet, the creatures first found there, and "Also found here" for creatures from earlier pages that live there too. Cards say how rare a creature is in that place and whether it only comes out by day or at night.
- **No spoilers:** the places after the story, and the "Every creature" page, ask before they open. The guardians at the end of the Night Ruins stay face down until you tap "Show it". The guide remembers which page you were on.
- The Field Guide's search and type filters look through the page you're on. Its map has a section of its own.

## v9: the expansion
Built from `docs/creature-catch-expansion-guide.md` and the 17-part expansion art pack (`docs/creature-catch-expansion-image-prompts.md`).

- **62 new creatures** (131 in all), each with its own special move (42 new moves) and Creature Log lore. Some join the old places (Puffmunk and Fleecling in the Meadow, Dewt in the Grassland, Glyphling and Mimicube in the Night Ruins, and more), and the rest live in the new places.
- **Day and night creatures:** some only come out by day, others only at dusk and night (the Field Guide marks them). A wild creature found above its evolution level shows up already evolved.
- **Copperbell Town**, on the main road between the Crystal Cave and the Sunscorch Desert: 12 buildings to walk into (the town hall, the museum and its plaques, Cubesmith Ada's workshop, the school and its type quiz, Baker Bun's bakery, the bell tower with the cracked Dusk Bell, houses and Grit's shack), townsfolk, and a park with trainers.
- **Nine side areas:** Willowbrook Orchard (off the Grassland), Whispering Grove (off the Forest), Driftwood Cove (off the Lakeshore) and Lantern Isle (by Gus's boat), Glimmer Mine (under Copperbell), Steamvent Springs (off Frostpeak Pass), Firefly Bayou (off Murkmire Swamp) and the Ancients' Archive (down the locked stairway in the Night Ruins). Each has its own people, landmark, wild creatures, trainers and secrets: the cider press, the fairy ring, tide-pool fishing, a three-floor lighthouse, flooded tunnels, a hot-spring bathhouse that heals, Boatman Bo's boat between the bayou islands, and the Glyphling wall.
- **The Lost Pages:** 12 pages of Elder Willow's book, The Long Dusk, are scattered across the land. Read them from your Bag or on the book in Willow's house, which also hints where the missing ones are. Willow gives 5 Great Cubes at 4 pages, 3 Ultra Cubes at 8, and 5 more Ultra Cubes for all 12 after the Balance. The Creature Log shows how many you have.
- **After the story: the Long Dusk.** With the moon restored and 8 pages found, Grandmother Amani opens the **Dawn Temple** under the oasis: a mirror light puzzle, then the Sun Altar, where the grumpy **Solarion** wakes up. Its Sun Ember lights the way through Glimmer Mine's Ancient Door into the **Hollow Deep**, where shy **Gloaming** hides at the Dusk Pool, a gentle battle to a lullaby. Then the Dusk Bell rings again in Copperbell, and the three guardians meet at the top of the Moonlit Spire for **the Balance**: a second credits roll, the title "Keeper of the Long Dusk", the Dusk Cube, and Moonborn creatures twice as often. Solarion and Gloaming can each be caught after they calm down, the same as Lunarion.
- **People talk with the story:** the guides, Elder Willow, Bramble, Pip, Hazel, Tinker, the outpost keepers and the new townsfolk say new things as the story moves on, some only at night.
- **Home Village:** Rosa's Inn (rest until morning or until night, for 30 coins). The guides' homes have their own furniture now, with things to look at and a few gifts: Gus's Boat Ticket, Corvin's Archive Key, Granny Moss's daily Cure Herb, Oakley's Sightings Board, and Corvin's telescope, which shows the real moon phase.
- **New items:** the Dusk Cube (better at dusk and night), Baker Bun's Copper Roll, Auntie Yuzu's Warm Soup (heals and thaws), and key items: the Boat Ticket, the Archive Key, the Sun Ember, the Lost Pages and the finished book. Coin Swipe, a new move, picks up extra coins after a win.
- **The kids' creatures:** `src/js/13b-family-creatures.js` can now make a creature **Moonborn** (`lives: 'anywhere'`: a 3% chance in any tall grass, 6% after the Balance) or the **Keeper** of a side area (`keeper: 'orchard'` and so on: a calm-then-catch battle at that area's landmark). It's ready for the kids' drawings; the list is empty until then. See `docs/creature-catch-new-creatures.md`.
- **New art:** the new creatures, people and portraits, 16 new trainers and 8 new villagers, every new building, tileset, landmark and signpost, prop and furniture sets for every new place, battle backgrounds, 8 new story stills, item icons, and a new world map with every place on it. Fly goes to all of them.
- **New music:** Copperbell, the seaside, the Dawn Temple, the Hollow Deep and Gloaming's lullaby.
- **New weather:** geyser steam, bayou fireflies, sunbeams in the temple, and the dark of the Hollow Deep, lit only by the Sun Ember.
- **New codes:** `GOTO` for every new place, `PAGES`, `KEYS`, `TEMPLE`, `EMBER` and `BALANCE`.
- **Renamed** so names don't clash with the new characters: the Lakeshore and Frostpeak outpost keepers are now Marina and Noelle, and trainers Sailor Bo, Herbalist Wren and Scholar Ada are now Sailor Finn, Herbalist Sage and Scholar Edith.
- **The Field Guide** has every new creature, place, item and the three guardians, and marks day and night creatures.

## v8: save files and family creatures
- **Three save files.** Continue and New Game open a file picker showing each file's place, lead creature, creatures caught, play time and trail charms. Files can be deleted, and starting over in a used file asks first. Your old save is File 1.
- **Your own creatures:** `src/js/13b-family-creatures.js` takes a simple block per creature (name, types, where it lives, rarity, what it evolves into and when, an optional special move, lore, and who drew it). Stats, moves, spawns, the Creature Log number and the Field Guide page are all worked out from it, and the art import tool finds each creature's picture by name. The how-to, with prompts that turn a child's drawing into a sprite in the game's style, is `docs/creature-catch-new-creatures.md`.

## v7: the polish pass
- **Music:** a chiptune soundtrack made in code, 16 tracks: title, village, outposts, routes, cave, snow, swamp, ruins, the Spire, wild, trainer, guide, rival and boss battles, victory, and the credits.
- **Options** (MENU > Options, or on the title screen): music volume, sound volume, text speed, the creature that follows you, and day and night.
- **The Bag in battle:** Cube became Bag, with a Cubes pocket and an Items pocket. Using an item takes your turn.
- **Items:** Tonic now restores 10 PP to each move, Full Tonic restores all HP and PP and cures status, and the new Mega Potion heals 150 HP. Pip sells Tonics after the Forest trial and Mega Potions and Revives after the Cave trial; Tobias sells them all.
- **XP:** catching a creature gives XP, and XP is split between every creature that fought.
- **Battle polish:** a VS splash before trainer, guide, rival and boss battles; CRITICAL!, SUPER EFFECTIVE!, MISS and stat words that pop up; a screen flash on big hits; a stat panel on level-up; a clearer EXP bar; sparkles on a catch; creatures that faint come apart into pixels.
- **Shiny creatures:** about 1 in 160 wild creatures has a different palette and arrives in sparkles. The Creature Log marks shiny catches.
- **Creature Log** (MENU > Log): every creature you've seen or caught, with its picture, types, field note and lore.
- **On the map:** your lead creature follows you (talk to it!); the side walk has a real "feet together" step; people without walk sheets bounce and sway as they walk; footprints in snow and sand, dust when you run, ripples by docks; day and night by your clock (lanterns and doorways glow); the place name hangs on a wooden or stone sign; the cave's hiding spots are glowing mushrooms.
- **New codes:** `SHINY`, `NIGHT`, `DAY`, `DUSK`, `CLOCK`.
- **The polish-pack art is in** (`docs/creature-catch-polish-prompts.md`): 4-frame side walks for you and Juniper, walk sheets for older Juniper and all eight guides (they walk now), the Mega Potion icon, the Creature Log journal, menu icons, the four VS backgrounds and the name plate, the wooden and stone place signs, the glowing cave mushrooms, and the footprint, splash, ripple, dust and sparkle effects. Walk sheets are cut on an even grid, so rods and staffs stay with their owners.

## v6: the full game
- **The whole world:** seven new regions in a straight line north of the Grassland: the Forest, Lakeshore, Crystal Cave, Sunscorch Desert, Frostpeak Pass, Murkmire Swamp and the Night Ruins. Each has its own tileset, hiding spots (tall grass, glowing moss, dry grass, snow drifts, reeds), weather drawn in code (falling leaves, gulls, cave dark with glowing crystals, desert heat and blowing sand, snowfall, swamp fog and fireflies, the night over the ruins), a landmark (the Elder Tree, the lighthouse, the oasis, the frozen falls, the Moon Altar), an outpost with a Healing Hut keeper and the Cube Vault, a guide's home with their journal, two route trainers, and treasure chests.
- **Guide trials:** Ranger Oakley (Lv 12), Fisher Gus (15), Dusty (20), Safi (24), Frida (28), Granny Moss (32) and Night Watchman Corvin (37). Each win gives a trail charm, a piece of the moon's story, and opens their gate: the rope bridge, the rockslide, the sandstorm, the ice wall, the boardwalk and the rune gate.
- **Fly in the story:** Dusty hands you the Wooden Whistle after the Cave trial. Every region is on the Fly map.
- **14 route trainers** spot you, walk over with a "!", and battle.
- **Juniper's rival battles** at the Forest (Lv 12), the Cave (22), the snow pass (32, older Juniper and the rivals still) and the Night Ruins (40). Her team covers your starter's weaknesses.
- **The Fading Moon:** story stills at the start, for Elder Willow's legend, on the mountain, at the ruins, for the guardian, and the ending. The finale is a boss battle with the Dimmed Lunarion on the Moon Altar; calm it, and Lunarion can be caught. Then the credits.
- **After the story:** the Moonlit Spire opens beside the altar, with wild creatures at Lv 38 to 48, rematches with all seven guides at Lv 44 to 47, a last battle with Juniper at Lv 50, and Lunarion waiting at the top if it got away.
- **New items:** Tonic, Full Tonic, Cure Herb, Revive, the Sun Shard (Desert chest) and Moon Shards (Swamp and Night Ruins chests), used from the Bag. Wandering Merchant Tobias sells Ultra Cubes at the outposts from the Desert on. Corvin gives you the Master Cube.
- **New codes:** `GOTO` any region, `TRIAL <region>` / `TRIAL ALL`, `FINALE` and `ENDING`.
- **Every creature has art now:** Mudgator, Mireling, Wispkin, Pebbleton, Bonecat and Moonlynx arrived in the repair pack.
- **The grass-spawn picture** shakes in the tall grass before a creature jumps out.
- **Fern** has her own art and portrait, and Bramble and Tinker have painted portraits.
- **The Field Guide** shows art for all 67 creatures.
- `docs/creature-catch-full-game-prompts.md`: the image pack for the rest of the game.

## v5
- **The vampire line is 3 stages:** Fangling → Duskfang (Lv 33) → Rosferatu (Lv 42). Duskfang has its own art and stats.
- **Fly follows the story rule:** you get the Wooden Whistle halfway through the game (after Dusty's Cave trial) and can only fly to places you've already been. It shows in your Bag as a key item. The `FLY` code opens every place on the map.
- **The Creature Catch Field Guide** (`companion/creature-catch-field-guide.html`): a separate offline page with lore, stats, signature moves and evolution chains for all 67 creatures, plus the type chart, regions, and cubes and items. Built by `tools/build-companion.mjs` from the game's own data and art.
- **Lore** for every creature now lives in the game data (`src/js/13-data-lore.js`), ready for an in-game Creature Log.
- `docs/creature-catch-missing-images.md` lists every image still needed, with prompts.

## v4
- **New art:** all 24 evolutions and the vampire line (Fangling, Rosferatu, and the optional Duskfang), attack particles and strong-move bursts in battle, painted portraits, Juniper's walk and battle pose, your explorer throwing the cube at the start of each battle, type badges, item icons, emotes, trail charms, cube tiers, the outpost hut, signposts, the log gate, and the world map.
- **Interiors:** walk into Elder Willow's house (with the starter table), the Healing Hut and the Grassland Outpost (talk across the counter; the Cube Vault is a machine), Pip's shop, and your home (rest in your bed). Juniper walks in through the door for the starter scene.
- **L and R buttons** (keys Q and E). L opens your party, and R opens Fly once you have it.
- **Codes are hidden:** hold L + R and press MENU, or use the title-screen combo.
- **Fly:** a world-map screen. Timberowl carries you to any place you've visited and drops you off. It's a later-game feature; the `FLY` code unlocks it now.
- **Old-school codes:** `MAX`, `RICH`, `STOCKUP`, `INFINITE`, `GODMODE`, `FLY`, `ZOOKEEPER`.
- **Cube tiers:** Great, Ultra and Master Cubes. Great Cubes and Super Potions go on sale at Pip's after Bramble's trial. You pick which cube to throw.
- Juniper wanders around the village between scenes.

## v3
- **Dev codes:** a Codes entry in the menu, and Up Up Down Down Left Right Left Right B A on the title screen. See `docs/creature-catch-dev-codes.md`.
- The version shows on the title screen.
- The creature zoo (`ZOO` code) shows every sprite and which ones still need art.

## v2
- **Your generated art:** 35 creatures, the player walk sheets (Player A or B), people, buildings, trees and props, terrain tiles, battle backgrounds, the title, the cube, and status icons. Made by `tools/import-art.py`.
- **Overworld polish:** textured paths with ragged grass edges, shorelines, tall-grass fringes, chimney smoke, butterflies, lantern glow, cloud shadows, and townsfolk who breathe and hop.
- Dialog portraits, a choice of explorer, and a pixel digit font for numbers.

## v1
- **The first playable slice:** Home Village, Meadow Path and Grassland. Starter pick, Juniper's battle, wild battles, catching, the Vault, Healing Huts, Farmer Bramble's trial, saving.
- **Data:** stats and movesets for every creature.
- Code-drawn stand-ins for all art.
