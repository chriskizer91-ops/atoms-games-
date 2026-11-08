# Round 3 brief: five chapter 1 creatures, small-model-only route

You are building game-ready 3D models of Creature Catch creatures with the **paint-and-bake method,
small-model-only route**: build the ~7,000-triangle game model directly, print the ChatGPT pictures
straight onto it, and make its normal map from the paint. Round 2 proved this route (see
`creature-catch-model-sheets/round2/README.md`). This round is production, not a test: aim for the
best model you can make, as good as Coalossus and Mushling.

The person you're working for can't code. Explain results in plain words and with pictures and simple
numbers.

## Read first

All paths are relative to the repo root, `/home/user/atoms-games-`.

1. `creature-catch-model-sheets/PAINT_AND_BAKE_METHOD.md`: the method and its rules.
2. `creature-catch-model-sheets/pipeline/README.md`: the tools and every `parts.json` option.
3. `creature-catch-model-sheets/round2/README.md`: what round 2 learned, and which helpers' tool
   improvements exist.
4. A finished example close to yours: `round2/opus/mushling/` (`parts.json`, `NOTES.md`, `tools/`) for a
   round, sitting creature; `coalossus/parts.json` for a four-legged one.
5. `creature-catch-model-sheets/pipeline/cc3d.py` (top docstring): the world frame and how each picture
   maps to metres.

## Environment

- **Python** with Blender 5.2.3 as a module, plus numpy, scipy and Pillow:
  `/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python`.
  Run every tool with `-I`.
- **Node and Playwright** are installed globally if you need a browser screenshot.
- **The machine:** 4 cores and 15 GB of memory. Another agent will be rendering at the same time, so a
  board can take 1 to 3 minutes. Don't run more than one Blender job at once yourself.

## Rules

- **Don't edit shared files.** Don't change anything in `pipeline/`, `coalossus/`, `round2/`, the source
  pictures, or another creature's folder. If a tool needs a change, copy it into
  `<your output folder>/tools/`, change the copy, use it, and say so in your notes. Round 2's changed
  copies (`round2/opus/*/tools/`, `round2/sonnet/lunarion/tools/`) are yours to copy from:
  - Opus's `board.py` frames the three-quarter views by the creature's size.
  - Opus's `inpaint_view.py` paints a feature out of a print-only picture.
  - Sonnet's `parts.py` and `build.py` add `n_scale` and `k_scale` (more rows or columns per part).
- **No git commands.** Don't commit or push; the lead collects your work.
- **Keep work files in your own work folder** (below). Only the deliverables go in your output folder.

## Inputs

The pictures for each creature are in `creature-catch-model-sheets/round3/source/<creature>/`:
`<creature>_sheet.png`, `_front.png`, `_side.png` (facing left), `_back.png` and `_top.png` (head at the
top). All twenty views have been checked: the sides face left and the tops have the head up. The prompts
that made them, with sizes and descriptions, are in `round3/picture-request.html`. Clovermouse's and
Puffmunk's views are square (1254 x 1254); the others are 1536 x 1024.

| Creature | Height H for make_views (lowest to highest point) | Notes |
| --- | --- | --- |
| Mossback | 0.5 m (to the top of the flower) | Turtle, 0.8 m long. Shell with a leafy bush and one pink flower on top |
| Embroak | 0.45 m | Fire frog sitting up, 0.55 m long. Tongue out with a glowing ember bead on its tip; head crest |
| Fleecling | 0.6 m | Lamb, 0.75 m long. Body is big round cloud puffs; dark brown face, ears and legs |
| Clovermouse | 0.45 m (to the top of the clover) | Mouse sitting up on its hind feet, paws together at its chest, tail curling up behind |
| Puffmunk | 0.45 m | Chipmunk sitting up, huge cheeks, holds a red berry at its mouth, big striped tail curling up behind |

## Name the parts for the animation system

After you finish, the lead animates every model with `pipeline/animate.py`. It finds each part's job from
words in the part's name, so **name every part with one of these words** (the first match in this list
wins, so check for accidental matches: "h**ear**t" or "b**ear**d" would count as `ear`, i.e. head):

| Word in the name | Moves with |
| --- | --- |
| `tail` | the tail chain (split a curling tail into pieces: `tail_a`, `tail_b`, `tail_c`) |
| `front_leg`, `rear_leg` | the legs (four-legged plan) |
| `foot`, `arm` | the feet and arms (sitting plan) |
| `neck` | the neck |
| `head`, `muzzle`, `snout`, `ear`, `horn`, `tuft`, `cap`, `crest` | the head |
| `body`, `torso` (or no match) | the body |

So, for example: `head_tongue` and `head_ember` (Embroak), `head_cheek` and `head_berry` (Puffmunk),
`cap_clover` (Clovermouse), `body_shell`, `body_bush` and `body_flower` (Mossback). The plans:

| Creature | Plan | Parts it needs |
| --- | --- | --- |
| Mossback | four-legged | `head`, `body_*`, `front_leg` and `rear_leg` pairs, `tail` |
| Embroak | four-legged (it hops) | `head`, `body`, `front_leg` and `rear_leg` pairs (the folded back legs, feet included) |
| Fleecling | four-legged | `head`, ears, `body` (the wool), `front_leg` and `rear_leg` pairs, `tail` |
| Clovermouse | sitting | `body`, `head` (+ ears, clover), `arm` pair, `foot` pair, `tail` pieces |
| Puffmunk | sitting | `body`, `head` (+ cheeks, ears, berry), `arm` pair, `foot` pair, `tail` pieces |

Legs and feet must be mirrored pairs (`kind: "m"`).

## Steps for each creature

1. **Check the pictures** against each other. The front and back must agree with the side view about any
   part that's only on one side. Note anything the generator got wrong.
2. **Views on one scale:**
   `python -I pipeline/make_views.py WORK/views H front.png side.png back.png top.png`.
3. **Print-only repairs** (`pipeline/repair_view.py`, or Opus's `inpaint_view.py`), when a picture shows
   a feature where the 3D model can't use it (on Coalossus, the side view's eye would have printed a second
   pair of eyes onto the cheeks).
4. **Trace the parts into `parts.json`**, in picture pixels of the source pictures. Use
   `pipeline/trace_aid.py` for gridded views, plus zoomed crops with `--crop`.
5. **Blockout and board.**
   - Build with `pipeline/build.py parts.json views.json block.blend --target 60000`.
   - Board it with `pipeline/board.py block.blend views.json blockout.jpg "title" --samples 8 --three-quarter`.
   - Aim for outline overlap of about 92% front and 88% side or better.
   - Look hard at the three-quarter renders too. The numbers can be fine while the shape is wrong.
6. **Small-model route** (about 7,000 triangles):
   `PY=<python> bash pipeline/route_small.sh parts.json views.json OUT 7000 <creature>`
   (or your `tools/` copy). It builds the model, prints the pictures (2048), makes the relief, normal map
   and glow map, renders both boards and exports `OUT/<creature>.glb`.
7. **Review and fix.**
   - Look at `board_printed.jpg` and its three-quarter renders closely, including close crops of the face.
   - Fix ghost features, smears, wrong paint, flat caps and stacked rings, then run the route again.
   - Stop when it looks right, or when you've done what you can. Say which.

## Watch out for these on this round

- **The glow map.** The shared `emissive.py` makes bright orange glow. That is wrong for Embroak's and
  Puffmunk's orange skin and fur. Only these should glow:
  - **Embroak:** the ember bead on its tongue (strongly), and at most a faint glow on the yellow flame
    markings.
  - **Everyone else:** nothing. Export with a black glow map, or none.
  Check `emissive.png` and the lit board for every creature.
- **Relief.** Use `none` for smooth skin (Embroak, faces, tongue, berry, clover), `fur` for fur
  (Clovermouse, Puffmunk), and `none` or a gentle `fur` for Fleecling's cloud wool (try both and pick the
  softer one). Mossback's shell plates and leaves: try `rock` and `none`, and pick whichever doesn't draw
  lava-crack lines.
- **Thin parts:** Embroak's tongue, Clovermouse's tail and the ears need their own parts, or they come out
  as wide as what they're attached to. Keep the tongue and the ember bead as their own parts so the bead
  can glow.
- **Cloud puffs and leaf clumps** make bumpy outlines. Smooth the outlines so they don't turn into stacked
  rings; let the paint carry the puffs and leaves.
- **Puffmunk's cheeks** bulge out on both sides: make them their own mirrored part.
- **Mossback's bush and flower** on top: the top view sees them best.

## Lessons from Coalossus and round 2

- **Bumpy outlines become rings around a part.** Smooth the outlines (`smooth`: 5 to 14 pixels on big
  parts).
- **Flat ends show.** Use `round_ends`. Where a part goes into another part (leg tops into the body),
  taper its hidden part inside the other one.
- **A slanted top or bottom edge makes a thin shelf.** Make edges hidden inside other parts horizontal.
- **Parts that stick out need their own part** (snout, chest fur, ears, cheeks).
- **Split curling or bending shapes** into pieces that are each simple along one axis, or the slicing
  fills in the curl.
- **Parts that only show in some views:** the rear legs' front view is hidden, so use the `back` view; the
  top view is often drawn shorter, so use `"remap": true`; when a picture paints the wrong thing onto a
  part, use `paint_skip` or `paint_box_skip`; for an end cap no picture sees (paw soles), use `cap_fill`.
- **Pictures that disagree:** the method lets the front picture win for widths and the side picture for
  depths. Most of round 2's effort went into finding which picture painted the wrong thing onto which
  part, and switching it off.
- **`lo_weight`** gives faces and heads more of the triangle budget.

## Deliverables

Put these in `creature-catch-model-sheets/round3/<creature>/`:

- `<creature>.glb`: the game model (about 7,000 triangles, colour + normal (+ glow for Embroak)).
- `albedo.jpg`, `normal.png`, `emissive.jpg`: the exact textures in the `.glb`. Leave the final
  `model.blend` in your work folder and give its path in your reply (the lead animates from it).
- `parts.json`, `views.json` and any repaired pictures or changed tool copies (`tools/`).
- `board_blank.jpg`, `board_printed.jpg`, and the blockout board you finished with.
- `NOTES.md`, in plain words:
  - what you did, and the problems and how you fixed them
  - the numbers: triangles, outline overlap per view, % of texture seen by a picture
  - what still looks wrong
  - roughly how long it took

Your work folder is `/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/round3/<creature>/`.

When you finish, reply with a short summary per creature: the numbers, the paths, and your honest view
of how it compares with Coalossus and Mushling.
