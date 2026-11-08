# Creature Catch: first 3D demo

Chapter 1 of Creature Catch remade in 3D, in the cel-shaded, ink-outlined style of *What the Map Forgot in 3D*. It
covers everything the 2D v12 game plays today, from Home Village through Meadow Path to the Grassland, ending when
Farmer Bramble rolls the log off the Forest trail.

This folder is separate from the 2D game. The live v12 game and the Field Guide (on the `gh-pages` branch) are not
changed by anything here.

## Play it

Download `play/creature-catch-3d.html` and open it in a browser. It's one self-contained file, so it works offline, on
a computer or a phone.

- **Keys:** arrows to move, Z to talk or confirm (A), X to go back (B), Enter for the menu, and Q or E (L or R) to look
  around.
- **On a phone,** the on-screen pad has the same buttons.
- **On the title screen:** *New Game* starts the story, *Move Demo* plays any creature's moves on demand, and *Looks*
  switches styles.
- **Looks:** the town can be the full 3D world or a diorama (the 2D game's own painted ground with 3D buildings). Battles
  can use the 3D clearing or the 2D game's battle paintings. The game remembers your choice.

## What's in Chapter 1

- **35 creatures, all modeled in 3D:** the three starters and their evolutions, plus every Meadow Path and Grassland line.
  They walk with you, fight, and evolve after battles in a flickering-silhouette scene.
- **42 moves animated.** Basic moves are lunges and small type hits. Every line's signature move and the strong moves are
  their own little scenes. Shock, poison, burn, sleep, draining moves and double hits all work.
- **Places:** Home Village (v12's wider layout, with Rosa's Inn), Elder Willow's house, the Healing Hut, Pip's shop,
  Meadow Path, the Grassland with Farmer Bramble's barn and the Grassland Outpost.
- **Story:** choosing a starter, Juniper's battle, catching creatures, Ranger Oakley, Bramble's trail trial (Leaf Trail
  Charm and Vault Key), Rosa's Inn (rest until morning or night), and the Cube Vault.

## Folders

| Folder | What's in it |
| --- | --- |
| `play/` | The built game, one HTML file. |
| `source/` | The source. `src/` has one file per part. Creature batches live in `src/lines/` and their moves in `src/movesets/`. `tools/build.py` builds the game, `test/` has turnaround and pose pages, and `vendor/` has three.js r128, the pixel font and the v12 sound and music. |
| `reference-sheets/` | The turnaround sheets the models were built from, as zips. `first-round/` has the starters, Clovermouse, Hopsprout and the people; `chapter-1/` has the 30 newer creatures. |
| `model-checks/` | Each model next to its sheet. `<batch>-overview.jpg` shows a whole batch, and `<batch>/compare_<id>.jpg` shows one creature in five views. |
| `docs/` | The Chapter 1 game plan, every turnaround prompt (for the ChatGPT art chat), and the brief the model-building agents worked from. |
| `screenshots/` | Places, battles, the evolution scene, and the diorama and painted looks. |

## Building from source

The game is plain JavaScript with no install step. From `source/`:

```
python3 tools/build.py                        # writes dist/creature-catch-3d.html
python3 tools/build.py --lines meadow --out /tmp/meadow.html   # just one creature batch
```

Dev links for testing: add `?at=village`, `meadow`, `grassland`, `trial`, `battle`, `rival`, `evolve` or `moves` (with
`&who=<creature id>`) to the game's address. `&town=diorama` and `&fights=painted` pick the looks, `&lv=` sets your
starter's level, and `&lowres` renders at low resolution.

## How it was made

- The people, the five first creatures and the places were modeled by hand in code from the v12 art and the first-round
  turnaround sheets.
- The other 30 creatures were built in parallel by five agents, one batch each. They followed `docs/batch-brief.md` and
  matched each model to its sheet.
- Chris generated every turnaround sheet in the same ChatGPT chat that made the original Creature Catch art, so the
  3D models follow the game's own designs.

Known soft spots: Boulderhound is slimmer than its sheet, Clove Tastical's face looks pale under its hood, Dandylion's
face sits deep in its mane, Infernotoad is browner than the sheet's charcoal, and big final forms can poke out of the
battle frame during some leaps.
