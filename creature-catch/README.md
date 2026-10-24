# Creature Catch

A Game Boy Advance–style monster-catching JRPG. Walk through tall grass, battle the creatures that jump out, and catch them with purple-and-blue capture cubes.

## Play

Open **`creature-catch.html`** in any browser. It's one file and works offline. On a phone, an on-screen pad appears.

| Keys | Pad | Does |
|---|---|---|
| Arrows / WASD | D-pad | Walk, move the cursor |
| Z / Space | A | Talk, confirm |
| X / Esc | B | Back. Hold it to run |
| Enter | MENU | Party, Bag, Creature Log, Vault, Fly, Save, Options |
| Q / E | L / R | L: your party. R: Fly (once you can) |

## Field Guide

`companion/creature-catch-field-guide.html` is a separate offline page: lore, stats, moves and evolutions for every creature, with a tab for each place in the order you reach it (the places after the story ask before they open, so nothing is spoiled), plus the map, the type chart, and items. Creatures are numbered the same way as the Creature Log in the game. Rebuild it with `node tools/build-companion.mjs`.

## Dev codes

Hold L + R and press MENU (or press Up Up Down Down Left Right Left Right B A on the title screen). See `docs/creature-catch-dev-codes.md`.

## Versions

The current version is in `VERSION` and shows on the title screen. `CHANGELOG.md` lists what each version changed.

## What's in the game (v12)

**The Fading Moon.** The moon over the land is dimming, and frightened creatures hide in the tall grass. Elder Willow gives you your first creature and sends you north to find out why.

- **The main road:** Home Village, Meadow Path, Grassland, Forest, Lakeshore, Crystal Cave, Copperbell Town, Sunscorch Desert, Frostpeak Pass, Murkmire Swamp and the Night Ruins. Each region has its own tiles, weather and landmark, an outpost (Healing Hut keeper and Cube Vault), a guide's home, route trainers and treasure chests.
- **Side areas** off the road: Willowbrook Orchard, Whispering Grove, Driftwood Cove, Lantern Isle, Glimmer Mine, Steamvent Springs, Firefly Bayou and the Ancients' Archive, each with its own people, landmark and secrets.
- **175 creatures**, some only out by day and some only at night, including families the kids designed.
- **8 guide trials** (Bramble, Oakley, Gus, Dusty, Safi, Frida, Granny Moss, Corvin). Each gives a trail charm and a piece of the story, and opens the gate north.
- **Juniper**, your rival, battles you five times with a team built against your starter.
- **Fly** comes from Dusty after the Cave trial: the Wooden Whistle takes you to any place you've been.
- **The finale** at the Moon Altar: calm the Dimmed Lunarion, then try to catch it. Then the credits, and the **Moonlit Spire** after the story (Lv 38 to 48 wilds, guide rematches, Juniper at Lv 47 to 50).
- **The Lost Pages and the Long Dusk:** find the 12 missing pages of Elder Willow's book. Eight of them open the Dawn Temple, where Solarion sleeps; its Sun Ember lights the way to the Hollow Deep and shy Gloaming; and the three guardians meet at the top of the Spire for the Balance.
- **The Creature Log** shows every creature you've met, and the shadows of the ones still to find. **The Cube Vault** has its own scrolling screen.
- **Music and options:** a chiptune soundtrack made in code, and an Options screen for volumes, text speed, the follower, and day and night.
- **Battles:** Fight / Bag / Swap / Run, the 8-type chart plus Normal, PP, status effects, stat stages, critical hits, XP (more for beating stronger creatures, and a share for the rest of the team), level-ups, learning moves, evolving after a battle or from the party menu (or with the Sun and Moon Shards), five kinds of cube, and the catch formula with a wobbling cube.
- **Your own creatures:** draw one and add it in `src/js/13b-family-creatures.js`, as a creature of any place, a Moonborn that can show up anywhere, or the Keeper of a side area (`docs/creature-catch-new-creatures.md`).
- **Code-drawn life:** creatures breathe, bob, lunge, flash, shake and faint; attacks throw type particles and bursts; the maps have smoke, butterflies, falling leaves, snow, fog, fireflies, heat shimmer and glowing crystals.

## Art

Generated art goes through `tools/import-art.py`, which removes the white backgrounds, shrinks each picture back to its true pixel size, and cuts sheets (walk cycles, tilesets, props, villagers, icons) into pieces:

```
python3 tools/import-art.py <folder with the unzipped art packs>
node tools/build.mjs
```

The results land in `art/` (creatures, people, walk, tiles, bg, buildings, props, ui). Every creature has art; the code-drawn stand-ins only show if a picture is missing.

What's drawn in code on top of the art: path edges and shorelines, NPC breathing and hops, chimney smoke, butterflies, lantern glow, cloud shadows, every battle animation, and the dialog portraits (cut from the character art).

## Building

```
node tools/build.mjs        # writes creature-catch.html from src/ and art/
node tools/roster-doc.mjs   # writes docs/creature-catch-roster.md from the game data
node tools/build-companion.mjs  # writes companion/creature-catch-field-guide.html
node tests/run-all.mjs     # the browser tests (tests/README.md)
```

## Layout

- `creature-catch.html`: the built game.
- `src/shell.html`: the page around the game. `src/js/`: the game, in load order. `src/fonts/`: Pixelify Sans (SIL Open Font License).
- `art/`: game-ready pictures made by `tools/import-art.py` (`MANIFEST.json` lists them).
- `tools/`: build and doc scripts.
- `tests/`: browser tests and their runner (`tests/README.md`).
- `docs/`: design and prompts. **Starting a bug run? Read `creature-catch-handoff-bug-run.md` first:** the code map, the tests, the known issues and a plan. Otherwise, read in this order:
  1. `creature-catch-decisions-2.md`: the latest decisions. It wins over everything below.
  2. `creature-catch-lore-bible.md`: the whole world in one place: the story, the Lost Pages, every place with its people, and all 175 creatures (made from the game's data). How the v11 creatures' pictures were asked for is in `creature-catch-final-creature-prompts.md`.
  3. `creature-catch-expansion-guide.md`: the v9 expansion (places, people, the Lost Pages, the post-game arc, the kids' creatures), with its art in `creature-catch-expansion-image-prompts.md`. `creature-catch-future-creatures.md` holds 19 more creature ideas, not in the game.
  4. `creature-catch-handoff.md`: the full design.
  5. `creature-catch-roster.md`: every creature's stats, learnset, and moves (generated).
  6. `creature-catch-design-doc.md`: the first draft, partly replaced.
  7. `creature-catch-new-creatures.md`: how to add your own creatures (drawing to game art to `src/js/13b-family-creatures.js`).
  8. `creature-catch-polish-prompts.md`: the polish pack (side walks, guide walk sheets, Mega Potion, Creature Log, menu icons, VS intros, region signs). The full-game pack (`creature-catch-full-game-prompts.md`) and `creature-catch-missing-images.md` are done.
  9. Image prompts: `creature-catch-image-prompts.md` (40 base creatures), `creature-catch-evolution-prompts.md` (24 evolutions), `creature-catch-world-prompts.md` (people, places, UI), and `creature-catch-extra-prompts.md` (the vampire line, effects, icons, portraits, interiors, outposts, gates, map).
