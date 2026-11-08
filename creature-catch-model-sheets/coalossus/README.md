# Coalossus 3D model (paint-and-bake)

Built from the five pictures in `source/` with the Paint-and-Bake Modeling Method:
copy the shape from the pictures, model only the shape, print the pictures on as paint,
then bake that paint onto a light model for the game.

![The three stages](previews/coalossus_stages.jpg)

| | Big model | Small model |
| --- | --- | --- |
| Triangles | **699,772** | **6,000** |
| Texture | 4096 colour + 2048 glow | 2048 colour + 2048 normal map + 1024 glow |
| Game file | `models/coalossus_full.glb`, 4.4 MB (meshopt-compressed) | `models/coalossus_small.glb`, 2.8 MB |
| Use | close-up screens (Field Guide page, catch/evolve scenes) | battles and the overworld |
| Size | 1.5 m wide × 2.4 m long × 1.8 m tall | same |

## Check-ins

Outline overlap is how much of the creature's outline in each picture the model covers.
The method's target is about 90% front and 85% side.

| Check-in | Front | Side | Back | Top | Picture |
| --- | --- | --- | --- | --- | --- |
| 0. Blockout (60,000 triangles) | 96.5% | 98.5% | 93.4% | 91.9% | `previews/0_blockout.jpg` |
| 1. Big model, shape only | 95.6% | 97.3% | 92.2% | 91.9% | `previews/1_big_blank.jpg` |
| 2. Big model, printed | 95.6% | 97.3% | 92.2% | 91.9% | `previews/2_big_printed_lit.jpg`, `previews/2b_big_printed_flat.jpg` |
| 3. Small model, baked | 95.9% | 96.8% | 93.2% | 93.1% | `previews/3_small_baked.jpg` |
| 4. Phone screen (390 × 844) | – | – | – | – | `previews/4_phone_big_and_small.jpg` |

The back view scores lowest because the back picture draws the body a little narrower than the front
picture does. The method lets the front view win for widths, so the model follows the front.

**Printing:** 45% of the texture is seen directly by a picture. The rest is surfaces hidden inside other
parts (the tops of the legs inside the body, the base of the head) or underneath (the belly). Those take
their colour from the nearest painted spot on the same part.

## How it was made

1. **Pictures to one scale.** The front, side and back are scaled to its 1.8 m height. The top view came
   back about 14% short, so it's stretched to the front's width and the side's length ("remap").
2. **Traced parts** (`parts.json`): 13 parts, 18 with the left/right twins. They are the body, head,
   muzzle, ears, mane, chest fur, three vents, shoulder crags, back ridge, tail, and front and back legs.
   Each part has an outline in two views and is sliced along its long axis: up for the legs and head,
   front-to-back for the body, ridge, tail and muzzle. Each slice is a rounded shape exactly as wide as
   one outline and as deep as the other.
3. **Blockout and board.** These were fixed until the outlines matched: the vent bases hidden behind the
   head, the leg tops tapered into the body, and rounded ends instead of flat ones.
4. **Big model, smooth**, at 700,000 triangles.
5. **Print.** Every texture pixel knows where it sits on the model. Each picture paints the spots that
   face it and that nothing hides (a depth test per view), and the most head-on picture counts most. The
   top picture is skipped on the legs, and near the vents for everything but the vents, because its
   vents sit a little off.
6. **Relief from the paint** (an addition to the method). The pictures already show the plates, cracks
   and fur, so the big model's surface is pushed out and in to match: rock plates bulge about 1 cm,
   lava cracks sink about 2 cm, fur tufts move about ±1 cm, and the vent mouths become craters. This is
   what gives the small model's normal map real bumps.
7. **Small model** from the same parts at 6,000 triangles, weighted toward the head, muzzle and legs.
   The two models share one texture layout.
8. **Bake**, part by part, so a leg never picks up colour from the body it pokes into. The bake gives
   the colour and a normal map of the big model's surface.
9. **Glow map** (also an addition). The lava-bright colours (cracks, eyes, inner ears, paws, vent mouths)
   are pulled out of the paint as an emissive texture, so they light up in a game.
10. **Export.** Each model is one mesh with one material, so a game draws it in one call. The big file is
    compressed with meshopt (21.5 MB → 4.4 MB, no visible loss).

## Files

| Path | What |
| --- | --- |
| `source/` | The five pictures from ChatGPT, plus its prompts and notes |
| `parts.json` | The traced parts: outlines, roundness, budgets |
| `build/atlas.json` | The shared texture layout (keep it, or the textures won't line up) |
| `build/checks.json` | All the numbers above |
| `models/` | The two game files |
| `textures/` | The same textures as loose files |
| `previews/` | The boards and the phone screenshot |
| `viewer.html` | A 3D viewer: big and small, paint on/off, drag to turn. Open it through a web server (for example GitHub Pages), not as a local file. |
| `rebuild.sh` | Every command, in order, to rebuild from the pictures |
| `../pipeline/` | The tools (Blender 5.2 as a Python module, numpy, scipy, Pillow) |

## Using the files in a game

- **three.js:** load with `GLTFLoader` and `loader.setMeshoptDecoder(MeshoptDecoder)` (needed for the
  big file). The small file loads with no extras.
- **The big file is meshopt-compressed.** Some tools can't read that. For an uncompressed copy, run
  step 8 of `rebuild.sh` without the last line.
- **Forward and up:** it faces +Z with Y up (the glTF standard), feet at y = 0, 1.8 m tall.

## Not done yet

- **No skeleton or joints**, so there's no walk test yet. Its parts were traced with joints in mind
  (`j` in `parts.json`), so rigging is the natural next step.
- **Smoke from the vents** was left out on purpose. It belongs in the game as an effect.
- **The underside and inner leg surfaces** aren't in any picture, so their colour is filled from
  nearby. Fine for normal camera angles.
