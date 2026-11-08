# Round 2 brief: small-model-only Creature Catch models

You are building game-ready 3D models of Creature Catch creatures with the **paint-and-bake method,
small-model-only route**. There is no 700,000-triangle model this round. You build the ~7,000-triangle
game model directly, print the ChatGPT pictures straight onto it, and make its normal map from the paint.
The question being tested is whether this looks as good as Coalossus, which was baked from a big model.
On Coalossus itself the answer was yes (`round2/coalossus_route_compare.jpg`).

The person you're working for can't code. Explain results in plain words and with pictures and simple
numbers.

## Read first

All paths are relative to the repo root, `/home/user/atoms-games-`.

1. `creature-catch-model-sheets/PAINT_AND_BAKE_METHOD.md`: the method and its rules.
2. `creature-catch-model-sheets/pipeline/README.md`: the tools and every `parts.json` option.
3. `creature-catch-model-sheets/coalossus/README.md` and `coalossus/parts.json`: a finished worked example
   (13 traced parts).
4. `creature-catch-model-sheets/pipeline/cc3d.py` (top docstring): the world frame and how each picture
   maps to metres.

## Environment

- **Python** with Blender 5.2.3 as a module, plus numpy, scipy and Pillow:
  `/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python`.
  Run every tool with `-I`.
- **Node and Playwright** are installed globally if you need a browser screenshot.
- **The machine:** 4 cores and 15 GB of memory. Another agent may be rendering at the same time, so a
  board can take 1 to 2 minutes.

## Rules

- **Don't edit shared files.** Don't change anything in `pipeline/`, `coalossus/`, the source pictures, or
  another agent's folder. If a tool needs a change, copy it into `<your output folder>/tools/`, change the
  copy, use it, and say so in your notes.
- **No git commands.** Don't commit or push; the lead collects your work.
- **Keep work files in your own work folder** (below). Only the deliverables go in your output folder.

## Inputs

The pictures for each creature are in `creature-catch-model-sheets/round2/source/<creature>/`:
`<creature>_sheet.png`, `_front.png`, `_side.png` (facing left), `_back.png` and `_top.png` (head at the
top). The prompts that made them, with sizes and descriptions, are in `round2/picture-request.html`.

| Creature | Height H for make_views (lowest to highest point) | Notes |
| --- | --- | --- |
| Mushling | 0.6 m | Cap 0.55 m wide; hands held to its mouth |
| Drizzlon | 0.75 m (to the horn tips) | 1.0 m long; fin wings out to the sides, flat; tail curls up straight behind |
| Lunarion | 2.6 m (to the raised wingtips) | 2.6 m long, wings 3.4 m tip to tip, held flat facing forward |

## Steps for each creature

1. **Check the pictures.**
   - The side view must face left, and the top view must have the head at the top.
   - The front and back must agree with the side view about any part that's only on one side.
   - Note anything the generator got wrong.
2. **Views on one scale:**
   `python -I pipeline/make_views.py WORK/views H front.png side.png back.png top.png`.
3. **Print-only repairs** (`pipeline/repair_view.py`), when a picture shows a feature in a place the 3D
   model can't use. On Coalossus, the side view's eye would have printed a second pair of eyes onto the
   cheeks.
4. **Trace the parts into `parts.json`**, in picture pixels of the source pictures. Use
   `pipeline/trace_aid.py` for gridded views, plus zoomed crops with `--crop`.
5. **Blockout and board.**
   - Build with `pipeline/build.py parts.json views.json block.blend --target 60000`.
   - Board it with `pipeline/board.py block.blend views.json blockout.jpg "title" --samples 8 --three-quarter`.
   - Aim for outline overlap of about 90% front and 85% side or better.
   - Look hard at the three-quarter renders too. The numbers can be fine while the shape is wrong.
6. **Small-model route** (about 7,000 triangles):
   `PY=<python> bash pipeline/route_small.sh parts.json views.json OUT 7000 <creature>`.
   It builds the model, prints the pictures (2048), makes the relief, normal map and glow map, renders
   both boards and exports `OUT/<creature>.glb`.
7. **Review and fix.**
   - Look at `board_printed.jpg` and its three-quarter renders closely, including close crops of the face.
   - Fix ghost features, smears, wrong paint, flat caps and stacked rings, then run the route again.
   - Stop when it looks right, or when you've done what you can. Say which.

## Lessons from Coalossus

- **Bumpy outlines become rings around a part.** Rock plates or tufts in a drawn outline turn into full
  rings. Smooth the outlines (`smooth`: 5 to 14 pixels on big parts).
- **Flat ends show.** Use `round_ends`. Where a part goes into another part (leg tops into the body),
  taper its hidden part inside the other one. Polygon areas inside the silhouette are where you shape
  the hidden parts.
- **A slanted top or bottom edge makes a thin shelf.** That edge produces wide, shallow slices that stick
  out, so make edges hidden inside other parts horizontal.
- **Parts that stick out need their own part.** A snout, chest fur or an ear needs its own part, or it
  gets as wide as the head.
- **Split curling or bending shapes.** A curling tail or a bent limb should be split into pieces that are
  each simple along one axis, or the slicing fills in the curl.
- **Thin flat wings facing forward** work as a part with `"axis": "z"`. Use the front view (the full wing
  shape) and the side view (the thin edge); `kind` is `"m"` for a pair.
- **Parts that only show in some views:**
  - The front views of the rear legs are hidden, so use the `back` view for them.
  - The top view is often drawn shorter, so use `"remap": true`.
  - When a picture paints the wrong thing onto a part, use `paint_skip` or `paint_box_skip`.
  - For an end cap no picture sees (paw soles), use `cap_fill`.
- **Set `relief` on every part.** Choose `rock`, `fur`, `vent` or `none`; unknown names default to
  `rock`. `rock` reads bright orange-yellow lines as lava cracks, which is wrong for most creatures. Use
  `none` for smooth skin, shell or cap, and `fur` for fur and feathers.
- **The glow map keeps bright orange and gold colours.** On Lunarion, the gold markings, crest and eyes
  will glow, which suits it. If a creature glows where it shouldn't, change a copy of `emissive.py`.
- **`lo_weight`** gives faces and heads more of the triangle budget.

## Deliverables

Put these in `creature-catch-model-sheets/round2/<agent>/<creature>/`, where `<agent>` is `opus` or
`sonnet` as you're told:

- `<creature>.glb`: the game model (about 7,000 triangles, colour + normal + glow).
- `parts.json`, `views.json` and any repaired pictures or changed tool copies.
- `board_blank.jpg`, `board_printed.jpg`, and the blockout board you finished with.
- `NOTES.md`, in plain words:
  - what you did, and the problems and how you fixed them
  - the numbers: triangles, outline overlap per view, % of texture seen by a picture
  - what still looks wrong
  - roughly how long it took

Your work folder is `/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/round2-<agent>/<creature>/`.

When you finish, reply with a short summary per creature: the numbers, the paths, and your honest view
of how it compares with the Coalossus small model.
