# Creature Catch

A Game Boy Advance–style monster-catching JRPG. Walk through tall grass, battle the creatures that jump out, and catch them with purple-and-blue capture cubes.

## Play

Open **`creature-catch.html`** in any browser. It's one file and works offline. On a phone, an on-screen pad appears.

| Keys | Pad | Does |
|---|---|---|
| Arrows / WASD | D-pad | Walk, move the cursor |
| Z / Space | A | Talk, confirm |
| X / Esc | B | Back. Hold it to run |
| Enter | MENU | Party, Bag, Vault, Fly, Save |
| Q / E | L / R | L: your party. R: Fly (once you can) |

## Field Guide

`companion/creature-catch-field-guide.html` is a separate offline page: lore, stats, moves and evolutions for every creature, plus the type chart, regions, and items. Rebuild it with `node tools/build-companion.mjs`.

## Dev codes

Hold L + R and press MENU (or press Up Up Down Down Left Right Left Right B A on the title screen). See `docs/creature-catch-dev-codes.md`.

## Versions

The current version is in `VERSION` and shows on the title screen. `CHANGELOG.md` lists what each version changed.

## What's in the first slice

- **Home Village:** Elder Willow gives you your starter, Juniper picks the one that beats yours and battles you, Pip runs the cube shop, Hazel's Healing Hut heals you and holds the Cube Vault, and you can rest at home.
- **Meadow Path:** the first route. Only Normal-type creatures live here (Clovermouse, Hopsprout), so no starter has an edge.
- **Grassland:** Tuftail, Pebblepup, Bumblop, and the rare Dandylion. There's an outpost Healing Hut with Vault access, and Farmer Bramble's trail trial, which opens the fallen log to the Forest and gives you the Vault Key.
- **Battles:** Fight / Cube / Swap / Run, the 8-type chart plus Normal, PP, status effects, stat stages, critical hits, XP, level-ups, learning moves, evolving after a battle, and the catch formula with a wobbling cube.
- **Code-drawn life:** creatures breathe, bob, lunge, flash, shake, and faint. Attacks throw type particles, strong moves charge up and burst, and status effects smoke, bubble, and spark.

## Art

Generated art goes through `tools/import-art.py`, which removes the white backgrounds, shrinks each picture back to its true pixel size, and cuts sheets (walk cycles, tilesets, props, villagers, icons) into pieces:

```
python3 tools/import-art.py <folder with the unzipped art packs>
node tools/build.mjs
```

The results land in `art/` (creatures, people, walk, tiles, bg, buildings, props, ui). Anything without art yet (most evolved forms, for now) uses a code-drawn stand-in.

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
  5. `creature-catch-full-game-prompts.md`: the image pack for the rest of the game (`creature-catch-missing-images.md` is done).
  6. Image prompts: `creature-catch-image-prompts.md` (40 base creatures), `creature-catch-evolution-prompts.md` (24 evolutions), `creature-catch-world-prompts.md` (people, places, UI), and `creature-catch-extra-prompts.md` (the vampire line, effects, icons, portraits, interiors, outposts, gates, map).
