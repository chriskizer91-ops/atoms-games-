# Brief: put Chapter 1 together

Build a playable Chapter 1 of Creature Catch 3D: the earlier 3D demo's game, with its models swapped for our
painted paint-and-bake models.
- **The towns** use the diorama look: the 2D game's own painted ground, with 3D buildings, props and
  characters on it.
- **Battles** use the 2D game's painted backgrounds.
- **Buildings, furniture and props** are re-skinned with our painted texture tiles.

You can play the whole chapter, except that creatures don't evolve.

The person you're working for can't code. Report in plain words, with screenshots.

## The rules

- **No git commands at all.** The lead commits your work.
- **Work only inside `creature-catch-model-sheets/chapter1/game/`.** Read anything else, but don't change
  it.
- **The machine is shared:**
  - It has 4 cores, and up to five model builders run Blender at the same time.
  - Run one headless browser at a time.
  - Keep screenshot runs short.
- **Tools:**
  - Node, and Playwright with Chromium, are installed. `require('playwright')` works from any folder.
  - Use `chromium.launch({args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']})`
    for WebGL.
  - Python 3 is available. npm packages can be fetched (`npm pack three@0.128.0` works through the proxy).

## Starting point

**The earlier demo's source:** `git show`/`git archive` from branch `origin/first-3d-demo`, folder
`first-3d-demo/source/`. An unpacked copy is at
`/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/demo1/src/first-3d-demo/source/`.

1. Copy it into `creature-catch-model-sheets/chapter1/game/source/`.
2. Read its `README.md` (one folder up on the branch: `first-3d-demo/README.md`) for the controls, dev
   links (`?at=village`, `meadow`, `grassland`, `battle`, `rival`, `moves&who=<id>`, `&town=diorama`,
   `&fights=painted`) and the build.

**An integration map of that code**, with file:line references, is in
`creature-catch-model-sheets/chapter1/GAME_INTEGRATION_MAP.md`. Read it first. It lists:
- the creature API and every body action the move code calls
- the person API
- the places and builder code
- units, cameras and the build
- a recommended smallest swap path, and its risks

## What to change

1. **Default looks:** the diorama town and the painted battles. Keep the Looks menu so the 3D clearing
   can still be chosen.
2. **Load our models.**
   - **Loaders:** add the classic-script GLTFLoader and SkeletonUtils for three.js r128 (from the npm
     package `three@0.128.0`, `examples/js/...`) to `vendor/` and to the build.
   - **Model files:** each model is a JSON file in the Creature Battle Bay format. Read
     `creature-catch-model-sheets/pipeline/battle_bay/pack_creature.py`. Each file holds:
     - `glb`: a base64 GLB
     - `textures`: file names for `map`, `normalMap`, `emissiveMap`
     - `manifest`: effect anchors, clip lengths, `events`
     - `moves`, `plan`, `body`
   - **Packing:** pack our animated models with that script into `game/assets/models/` and
     `game/assets/textures/`. Make **game-sized textures**: colour 1024 px, glow 512 px, and normal maps
     512 px or none, so the whole chapter stays light enough for a phone.
   - **Loading:** load the models at boot with a progress bar, then clone them when needed.
3. **Creatures.**
   - When a GLB exists for an id, `makeCreature` uses it instead of the code-built model, keeping the
     same API (see the map).
   - Map the game's body actions to our clips. Our creature clips are idle, walk, physical, special,
     strong_physical, strong_special, boost, boost_guard, status, hit, faint and send_out. Each
     creature's `animation_manifest.json` has its anchors (mouth, chest, paws, tail tip, wing tips).
   - Keep the hit timing: set `timeScale` so each move's hit moment still lands.
   - **Any creature without a GLB keeps its old model,** so the game is always playable.
4. **People.**
   - When a GLB exists for a person, use it with the same API as `makePerson`.
   - Our person clips are idle, walk, run, talk, wave, throw, cheer, lose and point. The throw releases
     the cube from `hand_R` at 0.5 s (`manifest.events.throw`), so adjust the game's waits.
   - Anchors: `hand_R`, `hand_L`, `mouth`, `chest`, `head_top`.
   - **The things people carry, modelled in code** with the painted tiles and put in their hand:
     - Elder Willow's staff: bark
     - Farmer Bramble's pitchfork: wood and iron
     - Tinker's bug net
     - Rosa's tray with a mug
     - Fern's basket
     - Pip's three cubes
5. **The look of our models:** painted, not cel-shaded.
   - **No ink outlines** on the GLB creatures and people.
   - **Materials:** use materials that show the painted textures with soft, even light, so the models
     look like the Creature Battle Bay (`creature-catch-model-sheets/round2/animation/creature-battle-bay.html`).
     Tune the lights so they don't look dark.
6. **Buildings, furniture and props.**
   - **Re-skin** them with the painted tiles in `creature-catch-model-sheets/chapter1/textures/tiles/`.
     `index.json` says what each tile is for:
     - materials: `roof_red`/`purple`/`orange`, `shingles_barn`, `roof_moss`, `stripes_mint`, plaster,
       boards, cobblestone, brick, floorboards, `checker_mint`, rugs, quilt, hay, leaves, rock, iron
     - see-through detail stickers: doors, windows, signs, furniture fronts, the healing machine, the
       Cube Vault, the mailbox, lamps
   - **Each house kind gets its own wall and roof material,** matching the earlier demo's colours.
   - **Put the stickers on as flat panels:** doors, windows, signs, the bookshelf, the clock face, the
     notice board, the piano and stove fronts, the healing machine, the Cube Vault and the mailbox.
   - **Drop the ink outlines** on buildings, so they match the painted models.
   - **Keep the see-through effect near the player.**
7. **The capture cube** stays made in code (purple lid, blue base, glowing seam, white button), as the
   earlier demo and the Battle Bay do.

## Models available now

The rest arrive over the next hours; the lead adds them.

| id in the game | Our animated model |
| --- | --- |
| `drizzlon` | `creature-catch-model-sheets/round2/opus/drizzlon/drizzlon_animated.glb` (+ `animation_manifest.json`) |
| `mossback`, `embroak`, `clovermouse`, `puffmunk`, `fleecling` | `creature-catch-model-sheets/round3/<id>/<id>_animated.glb` (+ `animation_manifest.json`) |
| the player (both looks) | `creature-catch-model-sheets/chapter1/player-a/` and `player-b/` (`*_animated.glb`, `animation_manifest.json`) |

Check how the game names its player looks and person looks (`LOOKS` in `person.js`), and map our ids
(`player-a`, `player-b`, `juniper`, `willow`, `tinker`, `rosa`, `hazel`, `pip`, `fern`, `oakley`,
`bramble`, `farmkid`) to them.

**Write the packing as a script, `game/tools/pack_models.py`,** that packs every model it finds in a
list. The lead can then rerun it as new models arrive. Paths per id:
- round 2: `round2/opus/<id>/` and `round2/sonnet/<id>/`
- round 3: `round3/<id>/`
- Chapter 1: `chapter1/<id>/`

## Done means

- **A build of the game** (`game/dist/`): the HTML plus `assets/`. It runs from a local web server, and
  the whole chapter plays:
  - the title screen
  - choosing a starter at Elder Willow's
  - Juniper's battle
  - the Meadow Path and its wild battles and catching
  - Ranger Oakley
  - the Grassland
  - Farmer Bramble's trial, ending when he clears the log
  - healing at the Healing Hut, Pip's shop and Rosa's Inn
- **Our models appear wherever they exist.** Missing ones fall back to the old models.
- **Screenshots in `game/screenshots/`** (phone-shaped, 390 x 844, and one wide shot each where useful):
  - the title
  - the village (diorama)
  - an interior
  - the Meadow Path
  - a wild battle (painted)
  - Juniper's battle
  - the cube throw
  - the Grassland
  - Bramble's trial
- **`game/README.md`** in plain words:
  - how to run it
  - what was changed
  - what's still the old model
  - what doesn't work yet

**Reply with:**
- a short summary
- the paths to the build and screenshots
- what works, what doesn't, and what you'd do next
