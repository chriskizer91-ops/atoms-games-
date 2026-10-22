# Creature Catch: Versions

The newest version is at the top. Each version is the `creature-catch.html` built from the commit labeled with it.

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
