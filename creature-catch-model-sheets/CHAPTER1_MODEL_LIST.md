# Chapter 1: everything to model

**The plan:** keep the earlier demo's game (`first-3d-demo` branch: its maps, story, battles, menus,
music and sound) and swap every hand-built, cel-shaded model for a painted paint-and-bake model, animated
by our animation system. This list covers every model that game uses, read from its source (`places.js`,
`story.js`, `data.js`, `battle.js`).

**Totals:**
- **Done:** 6 creatures (plus Lunarion, which appears in Elder Willow's legend story).
- **To model:** about 87 things:
  - 29 creatures
  - 12 people
  - 6 buildings
  - 19 pieces of furniture
  - 20 outdoor props
  - the capture cube
- **Not modelled:** the ground, water, sky, room walls and floors. They're made in code with painted
  textures, like the meadow stage.

## 1. Creatures: 35 in Chapter 1, 6 done, 29 to go

**Who you meet:**
- **Wild:**
  - Meadow Path: Clovermouse and Hopsprout (common), Puffmunk (uncommon), Fleecling (rare, daytime)
  - Grassland: Tuftail and Pebblepup (common), Bumblop and Dewt (uncommon), Dandylion (rare)
- **Trainer teams:**
  - Farmer Bramble: Hopsprout, Pebblepup, Tuftail
  - Juniper: the starter that beats yours
- **Evolutions:** the earliest is at level 14 (the starters), and Sunmane needs a Sunshard. Chapter 1's
  wild creatures are levels 2–7 and Bramble's team is levels 7–8, so a normal playthrough reaches no
  evolutions. The 21 evolved forms can come last.

| # | Creature | Where | Body type | Needed for | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Drizzlon | Starter | four-legged | starter, Juniper | ✅ done |
| 2 | Mossback | Starter | turtle | starter, Juniper | ✅ done |
| 3 | Embroak | Starter | frog | starter, Juniper | ✅ done |
| 4 | Clovermouse | Meadow Path, common | four-legged (sits up) | wild | ✅ done |
| 5 | Puffmunk | Meadow Path, uncommon | four-legged (sits up) | wild | ✅ done |
| 6 | Fleecling | Meadow Path, rare | four-legged | wild | ✅ done |
| 7 | **Hopsprout** | Meadow Path, common | bug | wild, Bramble's team | **needs the bug skeleton** |
| 8 | **Tuftail** | Grassland, common | four-legged | wild, Bramble's team | to do |
| 9 | **Pebblepup** | Grassland, common | four-legged | wild, Bramble's team | to do |
| 10 | **Bumblop** | Grassland, uncommon | round | wild | to do |
| 11 | **Dewt** | Grassland, uncommon (day) | serpent | wild | **needs the serpent skeleton** |
| 12 | **Dandylion** | Grassland, rare | four-legged | wild | to do |
| 13 | Wormapple | Orchard (east of the Grassland) | round | wild | to do |
| 14 | Scarecrowl | Orchard | bird | wild | **needs the bird skeleton** |
| 15 | Rapidrake | Drizzlon evolves | four-legged | evolution | to do |
| 16 | Tsunadrake | Rapidrake evolves | four-legged | evolution | to do |
| 17 | Thornshell | Mossback evolves | turtle | evolution | to do |
| 18 | Elderoak | Thornshell evolves | turtle | evolution | to do |
| 19 | Cinderfrog | Embroak evolves | frog | evolution | to do |
| 20 | Infernotoad | Cinderfrog evolves | frog | evolution | to do |
| 21 | Clove Tastical | Clovermouse evolves | four-legged | evolution | to do |
| 22 | Hoppin Pop | Hopsprout evolves | bug | evolution | needs the bug skeleton |
| 23 | Stashmunk | Puffmunk evolves | four-legged | evolution | to do |
| 24 | Cloudram | Fleecling evolves | four-legged | evolution | to do |
| 25 | Tempestram | Cloudram evolves | four-legged | evolution | to do |
| 26 | Verdantail | Tuftail evolves | four-legged | evolution | to do |
| 27 | Sylvantail | Verdantail evolves | four-legged | evolution | to do |
| 28 | Bumblazer | Bumblop evolves | round | evolution | to do |
| 29 | Queenbuzz | Bumblazer evolves | round | evolution | to do |
| 30 | Sunmane | Dandylion evolves | four-legged | evolution | to do |
| 31 | Boulderhound | Pebblepup evolves | four-legged | evolution | to do |
| 32 | Cragmastiff | Boulderhound evolves | four-legged | evolution | to do |
| 33 | Monsoonewt | Dewt evolves | serpent | evolution | needs the serpent skeleton |
| 34 | Typhoonewt | Monsoonewt evolves | serpent | evolution | needs the serpent skeleton |
| 35 | Scarecrown | Scarecrowl evolves | bird | evolution | needs the bird skeleton |
| + | Lunarion | Elder Willow's legend story | four-legged, wings | story scene | ✅ done (round 2) |

**Most important to do first:** the 8 you meet in play (rows 7–14). With them, every wild encounter and
trainer battle in Chapter 1 works.

## 2. People: 12

All are two-legged, so they need a **person skeleton** in the animation system: idle, walk, talk, wave,
throw a cube, cheer and lose.

| Person | Where | Role |
| --- | --- | --- |
| The player (boy look) | everywhere | you |
| The player (girl look) | everywhere | you |
| Juniper | Home Village, Elder Willow's house | your rival; the first trainer battle |
| Elder Willow | Elder Willow's house | gives you your starter; tells the legend |
| Tinker | Home Village | villager |
| Rosa | Rosa's Inn | innkeeper (rest until morning or night) |
| Hazel | Healing Hut | heals your creatures |
| Pip | Pip's Cube Shop | sells cubes |
| Fern | Grassland Outpost | heals your creatures |
| Ranger Oakley | Meadow Path | teaches catching |
| Farmer Bramble | Grassland | the guide; the trail trial battle; clears the log |
| Farm Kid | Grassland | villager |

The earlier demo's turnaround sheets already include the two player looks and Juniper
(`first-3d-demo/reference-sheets/first-round/`).

## 3. Buildings: 6 designs (7 buildings)

| Building | Where | Its look in the earlier demo |
| --- | --- | --- |
| Your house | Home Village | gabled house, red tiled roof, plaster walls |
| Elder Willow's house | Home Village | stone footing, plank walls, deep mossy roof, round windows and a round-topped door |
| Pip's Cube Shop | Home Village | gabled house, purple tiled roof |
| Healing Hut | Home Village | round, white walls with a wooden band, striped mint-and-white roof, a heart over the door |
| Grassland Outpost | Grassland | the same design as the Healing Hut |
| Rosa's Inn | Home Village | half-timbered cream walls, orange tiled roof, porch with its own little roof, hanging sign |
| Farmer Bramble's barn | Grassland | red barn, white trim, an X on the doors, a cupola with a rooster on top, hay by the door |

## 4. Furniture: 19 (for 6 rooms)

**The rooms:** your house, Elder Willow's house, the Healing Hut, Pip's Cube Shop, Rosa's Inn and the
Grassland Outpost. The walls, floors, windows, doormats and rugs are made in code.

| Furniture | In |
| --- | --- |
| Starter table (with the three starter cubes) | Elder Willow's house |
| Bookshelf | Elder Willow's house |
| Fireplace | Elder Willow's house, Rosa's Inn |
| Grandfather clock | Elder Willow's house |
| Potted plant | every room |
| Healing counter | Healing Hut, Outpost |
| Healing machine | Healing Hut |
| Cube Vault (the storage machine) | Healing Hut, Outpost |
| Herb shelf (jars of dried herbs) | Healing Hut, Outpost |
| Cot | Healing Hut |
| Shop counter | Pip's shop, Rosa's Inn |
| Cube shelf (rows of purple and blue cubes) | Pip's shop |
| Bed | your house, Rosa's Inn |
| Dresser | your house |
| Stove | your house |
| Table | your house, Rosa's Inn |
| Piano | Rosa's Inn |
| Stairs | Rosa's Inn |
| Notice board | Rosa's Inn |

## 5. Outdoor props: 20

| Prop | Where |
| --- | --- |
| Street lamp | Home Village |
| Barrel | Home Village, Grassland |
| Stack of crates | Home Village, Grassland |
| Mailbox | Home Village |
| Hay bale | Home Village, Grassland |
| Bench | Home Village |
| Flower pots | Home Village |
| Wheelbarrow | Home Village, Grassland |
| Bush | everywhere |
| Flower bush | everywhere |
| Berry bush | Home Village, Grassland |
| Rock | Meadow Path |
| Boulder | outdoor places |
| Lily pad | the village pond |
| Signpost | Meadow Path, Grassland |
| Flower patch | outdoor places |
| **The fallen log** (Farmer Bramble clears it at the end of the chapter) | Grassland, to the Forest |
| Leafy tree | everywhere |
| Pine tree | everywhere |
| Tall grass (where wild creatures hide) | Meadow Path, Grassland |

## 6. Battle and items

| Thing | Notes |
| --- | --- |
| **Capture cube** | Thrown, opens, wobbles, clicks and sparkles. One model, opened by a hinge. |
| Battle stages | Meadow Path clearing ✅ done. Still to make: a Grassland clearing and a Home Village yard (Juniper's battle). Both are made in code. |
| Leaf Trail Charm, Vault Key | Story items. Small pictures in the menu are enough; models only if we want a "you got it" scene. |

## How each kind gets made

| Kind | How | Pictures per thing |
| --- | --- | --- |
| Creatures, people | Paint-and-bake, as before | 5 (sheet, front, side, back, top) |
| Buildings | Paint-and-bake. Boxes and a roof are the easiest shape for the method. | 5 |
| Furniture, props, the cube | Paint-and-bake, but one picture each: a 4-view sheet (front, side, back, top on one picture, same scale). Simple things like crates, the bench or the stairs can also be made in code with painted textures. | 1 |
| Trees, tall grass, flower patches | In code, like the meadow stage | 0 |
| Ground, water, sky, room walls and floors | In code with painted textures | 0 |

**Picture count, roughly:**
- creatures and people: 41 × 5 = 205
- buildings: 6 × 5 = 30
- furniture, props and the cube: about 35 one-picture sheets

## New animation work

- **Person skeleton** (12 people): idle, walk, talk, wave, throw a cube, cheer, lose.
- **Bug skeleton** (Hopsprout and Hoppin Pop): hops on springy legs, buzzes.
- **Serpent skeleton** (the Dewt line): S-curve slither, coil, strike.
- **Bird skeleton** (Scarecrowl, Scarecrown): flap, hop, swoop.
- **Furniture and props:** no skeleton. A few small moving parts (the cube's lid, the healing machine's
  lights, the log rolling away).

## Suggested order

1. **The 8 creatures you meet** (Hopsprout, Tuftail, Pebblepup, Bumblop, Dewt, Dandylion, Wormapple,
   Scarecrowl), plus the bug, serpent and bird skeletons.
2. **The people:** the player, Juniper and Elder Willow first; then the person skeleton.
3. **The 6 buildings and the capture cube.**
4. **Furniture and props.**
5. **Put the chapter together:** the earlier demo's game with our models.
6. **The 21 evolutions,** as time allows. The chapter is playable without them.
