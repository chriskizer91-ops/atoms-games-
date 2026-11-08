# Paint-and-bake tools for Creature Catch

Written for Coalossus, the first creature, and usable for any creature with front, side, back and top
pictures. Blender scripts run as `python3 -I` with the `bpy` module (Blender 5.2.3 from PyPI), plus
numpy, scipy and Pillow. `../coalossus/rebuild.sh` runs them all in order.

| Tool | What it does |
| --- | --- |
| `cc3d.py` | Shared helpers: the world frame, how each picture maps to metres, outline masks |
| `make_views.py` | Puts the four pictures on one shared scale; stretches the top view to fit ("remap") |
| `trace_aid.py` | Gridded copies of the pictures with traced outlines drawn on, for tracing |
| `parts.py` | Turns traced parts into rounded solids: each slice fills both outlines (superellipse, roundness `n`) |
| `build.py` | Builds the model in Blender: blockout, big model or small model, by triangle target; texture layout; relief |
| `board.py` | Comparison board: picture vs model per view, red/blue difference, outline overlap %, three-quarter views |
| `print_tex.py` | Prints the pictures onto the big model's texture, with a depth test per view; fills unseen spots from the same part |
| `relief.py` | Reads plates, cracks and fur from the printed paint and turns them into surface relief for the big model |
| `emissive.py` | Glow map: keeps only the lava-bright colours |
| `bake.py` | Bakes colour and a normal map from the big model onto the small one, part by part |
| `export.py` | Game file (GLB) without a skeleton: one mesh, one material, with colour, normal and glow textures |
| `repair_view.py` | Print-only repair of a picture from itself (e.g. paints the side view's eye over with fur) |
| `rig.py` | Skeleton, skin weights and the battle animations; exports the game file (GLB) with them |

## Parts file options (`parts.json`)

| Key | Meaning |
| --- | --- |
| `kind` | `c` centred and symmetric, `m` mirrored pair (traced on the creature's left, +X) |
| `axis` | The direction the part is sliced along: `z` up, `y` front-to-back, `x` side-to-side |
| `views` | Outline per view, in picture pixels. Two views: they must show the slicing axis |
| `n` | Roundness of each slice: 2 round, 4+ boxy |
| `remap` | Stretch the second view's outline to the first view's length (for the short top view) |
| `smooth` | Smooths outline bumps (in pixels) so rock plates don't turn into rings |
| `round_ends` | `{"start": m, "end": m}`: domed ends instead of flat caps |
| `paint_skip` | Pictures not to print on this part (e.g. `["top"]` for the legs) |
| `paint_box_skip` | Per picture, boxes (picture pixels) not to print from |
| `cap_fill` | `{"start": [centre, rim]}`: a radial colour gradient for an end cap no picture sees (the paw soles) |
| `relief` | `rock`, `fur`, `vent` or `none` (defaults by part name) |
| `lo_weight` | Gives this part more (>1) or fewer (<1) of the small model's triangles |
| `j` | Joint the part moves with (rig.py ties parts to bones by part name) |

The top level of `parts.json` also has `repairs`: the patches `repair_view.py` applies per picture.
