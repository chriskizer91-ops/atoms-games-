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

`companion/creature-catch-field-guide.html` is a separate offline page: lore, stats, moves and evolutions for every creature, plus the type chart, regions, and items. Rebuild it with `node tools/build-companion.mjs`.

## Dev codes

Hold L + R and press MENU (or press Up Up Down Down Left Right Left Right B A on the title screen). See `docs/creature-catch-dev-codes.md`.

## Versions

The current version is in `VERSION` and shows on the title screen. `CHANGELOG.md` lists what each version changed.

## What's in the game (v6, the full game)

**The Fading Moon.** The moon over the land is dimming, and frightened creatures hide in the tall grass. Elder Willow gives you your first creature and sends you north to find out why.

- **10 places in a straight line:** Home Village, Meadow Path, Grassland, Forest, Lakeshore, Crystal Cave, Sunscorch Desert, Frostpeak Pass, Murkmire Swamp and the Night Ruins. Each region has its own tiles, weather and landmark, an outpost (Healing Hut keeper and Cube Vault), a guide's home, route trainers and treasure chests.
- **8 guide trials** (Bramble, Oakley, Gus, Dusty, Safi, Frida, Granny Moss, Corvin). Each gives a trail charm and a piece of the story, and opens the gate north.
- **Juniper**, your rival, battles you five times with a team built against your starter.
- **Fly** comes from Dusty after the Cave trial: the Wooden Whistle takes you to any place you've been.
- **The finale** at the Moon Altar: calm the Dimmed Lunarion, then try to catch it. Then the credits, and the **Moonlit Spire** after the story (Lv 38 to 48 wilds, guide rematches, Juniper at Lv 50).
- **Music and options:** a chiptune soundtrack made in code, and an Options screen for volumes, text speed, the follower, and day and night.
- **Battles:** Fight / Bag / Swap / Run, the 8-type chart plus Normal, PP, status effects, stat stages, critical hits, XP, level-ups, learning moves, evolving after a battle (or with the Sun and Moon Shards), four cube tiers, and the catch formula with a wobbling cube.
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
```

## Layout

- `creature-catch.html`: the built game.
- `src/shell.html`: the page around the game. `src/js/`: the game, in load order. `src/fonts/`: Pixelify Sans (SIL Open Font License).
- `art/`: game-ready pictures made by `tools/import-art.py` (`MANIFEST.json` lists them).
- `tools/`: build and doc scripts.
- `docs/`: design and prompts. Read in this order:
  1. `creature-catch-decisions-2.md`: the latest decisions. It wins over everything below.
  2. `creature-catch-handoff.md`: the full design.
  3. `creature-catch-roster.md`: every creature's stats, learnset, and moves (generated).
  4. `creature-catch-design-doc.md`: the first draft, partly replaced.
  5. `creature-catch-polish-prompts.md`: the polish pack (side walks, guide walk sheets, Mega Potion, Creature Log, menu icons, VS intros, region signs). The full-game pack (`creature-catch-full-game-prompts.md`) and `creature-catch-missing-images.md` are done.
  6. Image prompts: `creature-catch-image-prompts.md` (40 base creatures), `creature-catch-evolution-prompts.md` (24 evolutions), `creature-catch-world-prompts.md` (people, places, UI), and `creature-catch-extra-prompts.md` (the vampire line, effects, icons, portraits, interiors, outposts, gates, map).
