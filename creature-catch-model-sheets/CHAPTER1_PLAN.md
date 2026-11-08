# Chapter 1 in 3D, in the painted style

This plan takes the **chapter idea and the places** from the earlier attempt (branch `first-3d-demo`,
folder `first-3d-demo/`). It does **not** use that attempt's models, code or animation style. Those were
hand-built, cel-shaded and ink-outlined. Here every creature is a painted paint-and-bake model, animated
by the shared animation system (`pipeline/ANIMATION.md`).

## What Chapter 1 covers (from the first demo)

From Home Village through Meadow Path to the Grassland. It ends when Farmer Bramble rolls the log off the
Forest trail.

- **Places:**
  - Home Village (v12's wider layout), with Rosa's Inn, Elder Willow's house, the Healing Hut and Pip's
    shop
  - Meadow Path
  - the Grassland, with Farmer Bramble's barn and the Grassland Outpost
- **Story beats:** choosing a starter, Juniper's battle, catching creatures, Ranger Oakley, Bramble's
  trail trial (Leaf Trail Charm and Vault Key), resting at Rosa's Inn, and the Cube Vault.
- **Battles:** a clearing with two grassy pads. Your creature has its back to you, and the foe faces you.

## The 35 creatures (14 lines)

| Line | Where | Body type | Done in the painted style |
| --- | --- | --- | --- |
| Drizzlon > Rapidrake > Tsunadrake | Starter | four-legged | Drizzlon (round 2) |
| Mossback > Thornshell > Elderoak | Starter | turtle (four-legged, plodding) | Mossback (round 3) |
| Embroak > Cinderfrog > Infernotoad | Starter | frog (four-legged, hopping) | Embroak (round 3) |
| Clovermouse > Clove Tastical | Meadow Path | four-legged (sits up) | Clovermouse (round 3) |
| Hopsprout > Hoppin Pop | Meadow Path | bug | |
| Puffmunk > Stashmunk | Meadow Path | four-legged (sits up) | Puffmunk (round 3) |
| Fleecling > Cloudram > Tempestram | Meadow Path | four-legged | Fleecling (round 3) |
| Tuftail > Verdantail > Sylvantail | Grassland | four-legged | |
| Bumblop > Bumblazer > Queenbuzz | Grassland | round | |
| Dandylion > Sunmane | Grassland | four-legged | |
| Pebblepup > Boulderhound > Cragmastiff | Grassland | four-legged | |
| Dewt > Monsoonewt > Typhoonewt | Grassland | serpent | |
| Wormapple | Grassland | round | |
| Scarecrowl > Scarecrown | Grassland | bird | |

**Animation:**
- **28 of the 35 can be animated today:**
  - four-legged: 18
  - round: 4
  - turtle and frog: 6, using the four-legged skeleton with a plod or hop walk
- **7 need a new skeleton first:** bird (2), bug (2) and serpent (3). Each is a one-time job.

**Pictures:**
- **Starting point:** the first demo's turnaround sheets
  (`first-3d-demo/reference-sheets/`) cover all 35 creatures. They're pixel art on magenta, so they can't
  be printed onto a model. They show every angle, though, which makes them a better reference to attach
  to prompt 1 than a single sprite.
- **What to make:** five pictures per creature as before, using the round 3 prompts
  (`round3/picture-request.html`).

## The places, in the same painted style

1. **Battle stages:**
   - **Done:** a Meadow Path clearing in the Creature Battle Bay, all made in code: sky, painted grass, the
     worn path, a battle pad, trees, swaying tufts and tall grass, flowers, hills.
   - **Next:** a Grassland stage (barn in the distance, hay bales) and a Home Village yard.
2. **Buildings:**
   - **Method:** the same paint-and-bake method. A house is boxes and a roof, which is exactly the kind of
     shape the method builds best.
   - **Pictures:** front, side, back and top views of each building, like a creature.
   - **The list:** the player's house, Elder Willow's house, the Healing Hut, Pip's shop, Rosa's Inn,
     Bramble's barn and the Grassland Outpost.
3. **Props:** Bramble's log, fences, barrels, hay bales, signposts, trees and bushes. Some are made in
   code like the meadow; some are paint-and-bake.
4. **Ground:** painted grass, dirt path and tall-grass textures, made in code or from seamless ChatGPT
   tiles.
5. **People** (the player, Juniper, Elder Willow, Ranger Oakley, Farmer Bramble, Pip, Rosa): paint-and-bake
   models, and a two-legged skeleton for the animation system (to do).

## Suggested order

1. **Finish the creatures that already animate:**
   - the rest of the starter lines
   - the rest of the Meadow Path lines
   - the four-legged and round Grassland lines
2. **Add the bird, bug and serpent skeletons,** then do those 7 creatures.
3. **Build the places:**
   - battle stages first
   - then the buildings for Home Village, then Meadow Path and the Grassland
4. **Do the people,** then put the chapter together as a playable demo.
