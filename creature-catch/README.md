# Creature Catch

A Game Boy Advance–style monster-catching JRPG. Walk through tall grass, battle the creatures that jump out, and catch them with purple-and-blue capture cubes.

## Play

Open **`creature-catch.html`** in any browser. It's one file and works offline. On a phone, an on-screen pad appears.

| Keys | Pad | Does |
|---|---|---|
| Arrows / WASD | D-pad | Walk, move the cursor |
| Z / Space | A | Talk, confirm |
| X / Esc | B | Back. Hold it to run |
| Enter | MENU | Party, Bag, Vault, Save |

## What's in the first slice

- **Home Village:** Elder Willow gives you your starter, Juniper picks the one that beats yours and battles you, Pip runs the cube shop, Hazel's Healing Hut heals you and holds the Cube Vault, and you can rest at home.
- **Meadow Path:** the first route. Only Normal-type creatures live here (Clovermouse, Hopsprout), so no starter has an edge.
- **Grassland:** Tuftail, Pebblepup, Bumblop, and the rare Dandylion. There's an outpost Healing Hut with Vault access, and Farmer Bramble's trail trial, which opens the fallen log to the Forest and gives you the Vault Key.
- **Battles:** Fight / Cube / Swap / Run, the 8-type chart plus Normal, PP, status effects, stat stages, critical hits, XP, level-ups, learning moves, evolving after a battle, and the catch formula with a wobbling cube.
- **Code-drawn life:** creatures breathe, bob, lunge, flash, shake, and faint. Attacks throw type particles, strong moves charge up and burst, and status effects smoke, bubble, and spark.

## Art

There are no images yet: every creature is drawn by code as a stand-in. To use real art, drop a sprite in `art/creatures/<id>.png` (for example `art/creatures/drizzlon.png`) and rebuild. White or magenta backgrounds are removed automatically. The ids are the lowercase names in `docs/creature-catch-roster.md`.

## Building

```
node tools/build.mjs        # writes creature-catch.html from src/ and art/
node tools/roster-doc.mjs   # writes docs/creature-catch-roster.md from the game data
```

## Layout

- `creature-catch.html`: the built game.
- `src/shell.html`: the page around the game. `src/js/`: the game, in load order. `src/fonts/`: Pixelify Sans (SIL Open Font License).
- `art/`: sprites to pack into the game.
- `tools/`: build and doc scripts.
- `docs/`: design and prompts. Read in this order:
  1. `creature-catch-decisions-2.md`: the latest decisions. It wins over everything below.
  2. `creature-catch-handoff.md`: the full design.
  3. `creature-catch-roster.md`: every creature's stats, learnset, and moves (generated).
  4. `creature-catch-design-doc.md`: the first draft, partly replaced.
  5. Image prompts: `creature-catch-image-prompts.md` (40 base creatures), `creature-catch-evolution-prompts.md` (24 evolutions), `creature-catch-world-prompts.md` (people, places, UI), and `creature-catch-extra-prompts.md` (the vampire line, effects, icons, portraits, interiors, outposts, gates, map).
