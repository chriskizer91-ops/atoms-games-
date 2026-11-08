# Paint-and-Bake Modeling Method

Nov 7, 2026 · @Chris

## The idea in plain words

Copy the shape from the pictures, model only the shape, print the pictures on as paint, then bake that paint onto a light model for the game. Nothing is sculpted by hand: the drawing supplies the detail. This is how every Ironhowl 4 model was made (Wraith V2 HD, the kit, the FORGE machines), and none of it is tied to that game.

&#91;embedded content: paint-and-bake flow · 6 steps, 2 models out\]

1. **Get the pictures.** One object, drawn dead-on from the front, side and back (and from the top when needed), at the same size in every view.
2. **Trace the parts.** Each part gets an outline in two views. The part becomes the solid that fits inside both outlines at once, so it is exactly as wide as the front view and as deep as the side view.
3. **Build the big model, shape only** (700,000 to 1,000,000 triangles). Bolts, panel lines, numbers, stripes and wear are not modelled.
4. **Sharpen the pictures.** ChatGPT redraws each view crisper without moving anything. This roughly triples the detail per metre.
5. **Print the pictures onto the big model.** Each picture paints the surfaces that face it and that nothing hides. Surfaces no picture sees get colour from the same part nearby.
6. **Build the small model and bake.** The same traces at a coarser setting give a light model (5,000 to 10,000 triangles). The big model's paint and surface bumps are baked onto it.
7. **Use both.** The big model is for close-up screens (an upgrade bay, an intel brief, a showcase). The small model is what the game runs in play.

Why it works: the model matches the drawing from every side it was drawn, every triangle goes into shape, and a printed detail looks sharper than a modelled one at the same cost. The small model looks like the big one because it wears the big one's paint.

## What you need

You need the pictures (next section) and the tool folder `pipeline/` from the GitHub repo `chriskizer91-ops/iron-howler-4` (version 2.3, 6 Nov 2026). Claude runs everything; you don't install anything.

- **Software Claude uses:** Blender 5.2 run as a Python module, Python 3.13, numpy and Pillow; Playwright with Chromium for phone-size screenshots; three.js to show models in a web page.
- **For a new game:** copy `pipeline/` into the new game's repo, or tell the new chat to clone the Ironhowl 4 repo and use its `pipeline/` folder. Read `pipeline/CHANGELOG.md` for what changed between versions.
- **Ironhowl names in the tools:** a few tools carry Wraith names in their help text, and `fit_check.py` and the mounts (`fa`, `sh`, `bk`) are Ironhowl's. The core steps (make the sheet, build, print, bake, export) work for any object.

| Tool | What it does |
| --- | --- |
| `make_views.py` | Puts separate front / side / back / top pictures on one sheet at one shared scale; writes the outline and `views.json` |
| `sheet_views.py` | Cuts the views out of an existing concept sheet at ChatGPT's portrait size, for sharpening |
| `trace_aid.py` | Zoomed, gridded crops of the sheet with the traced outlines drawn on top |
| `build_v2.py` | Builds the model from the traces: blockout, big model (`--fine`) or small model (`--lo`), with joints and mounts |
| `v2_board.py`, `sheetfit.py` | The comparison board: sheet vs model per view, red/blue difference, outline overlap % |
| `v2_print.py`, `project_sheet.py` | Gives the big model one texture layout and prints the pictures onto it |
| `v2_bake.py` | Bakes the printed colour and surface bumps from the big model onto the small model; exports the game file |
| `v2_export.py` | Exports the printed big model with its joints |
| `glb_quant.py`, `glbinfo.py` | Shrinks a model file with no visible loss; counts triangles and bytes |
| `mirror_item.py` | Makes the left/right twin of an item |
| `pack.py`, `game_pack.py` | Packs models for a web page (parts under 20 MB), or every model into one offline HTML file |
| `phone_shot.py`, `walk_video.py` | Phone-size screenshot (390 × 844) and a walk test recording |
| `web/model_bay.html`, `walk/index.html` | The model viewer page and the walk test page |

## Getting the pictures

The pictures are measurements, not illustrations: Claude traces their outlines and then paints them onto the model, so they must follow strict rules. Do all of one game's pictures in a single ChatGPT chat so the style matches.

**Order:** for each object, first a **character sheet** (a landscape 1536 × 1024 design page: three-quarter hero view, small front / side / back views, close-ups, a size bar in metres, the name). Then the **HD views** made from that sheet, one picture per view.

**Rules for every HD view** (paste these into the ChatGPT request):

- True orthographic, like a technical drawing: no perspective, no tilt, camera dead front, dead side, dead back, or straight down for the top.
- Same object, same scale and same position in every view: the lowest point on the same pixel row, the highest point too, centred left to right.
- The whole object in frame with about a 5% margin. Nothing cut off.
- A plain, flat light-grey background (#C8C8CA). No floor, shadow, reflection, text, border or watermark.
- Soft, even, shadowless light, the same in every view. Lighting gets painted onto the model, so keep highlights small. Glowing lights may glow, with no halo onto the background.
- The same paint, wear, numbers and decals on the same parts in every view. Left and right halves mirror unless noted.
- Clear gaps between parts. Nothing hair-thin (at least 5 cm across), see-through, smoky, blurred, or flashing.
- The same pose in every view. Side views face LEFT; top views have the front at the TOP.
- Picture shape: portrait 1024 × 1536 for tall things (a mech, a person), landscape 1536 × 1024 for long things (a car, a four-legged animal), square 1024 × 1024 for compact things.
- A README with each object's real size in metres (width × length × height).

**Sharper pictures.** If a picture comes from a small concept sheet, Claude cuts each view out at 1024 × 1536. In one ChatGPT chat, upload the front with the prompt below, then the side and back with “Same again for this view, same paint and detail as the front.”

> Make a sharper, higher-detail version of this exact image. Same object, same pose, same position and size on the canvas, same camera, same colours, markings and numbers, same plain light-grey background. Do not move, resize, add, remove or redesign any part, and keep its outline exactly the same. Only make it crisper and add fine surface detail on the existing surfaces: panel lines, bolts, small scratches and wear. Soft, even studio light.

If ChatGPT shifts or shrinks the object a little, that's fine: Claude measures the shift and corrects it before printing. The full Ironhowl 4 request (40 pictures) is a worked example: project doc `ironhowl4/IMAGE-REQUEST-KIT-AND-FOES.md`.

## The steps, with commands

This is the route for a new object that arrives as separate view pictures (the usual case). `<item>` is the object's short name, `H` its real height in metres. Blender scripts run as `python3 -I`; the times are from Claude's workspace (2 cores).

1. **Check the views agree.** Side views face left; the front and back must not be mirror images of what the side shows. ChatGPT often puts a one-sided part (a clamp, a door) on opposite sides in front and back, so flip the view that disagrees.
2. **Make the sheet.** All views onto one sheet at one scale, with the outline and the mapping: `python3 pipeline/make_views.py work/<item> <item> <H> front.png side.png back.png [top.png] [--px 1200] [--flip front,back] [--sideR]` `--sideR` with `--flip side` when the side picture shows the right side.
3. **Trace the parts** into a parts file, using `trace_aid.py` for gridded zooms. Each part has a front outline and a side outline (and a top one if useful), a kind (`c` centre and symmetric, `m` mirrored pair, `one` single off-centre), the joint it moves with (`j`) and a roundness (`n`: 2 round to 6 boxy). The file also lists the joints (skeleton, parent first), the mounts, and the triangle budgets (`target`, `lo_target`). Trace loosely against the background (the sheet's own outline trims it) and carefully where parts meet.
4. **Blockout and board** (about 6 s). Plain solids, compared with the sheet: `python3 -I pipeline/build_v2.py parts.json sheet.png work/block.blend --board work/b1` `python3 -I pipeline/v2_board.py work/block.blend parts.json sheet.png work/blockout.jpg "title"` Red = on the sheet but missing on the model; blue = on the model but not on the sheet. Fix traces until the overlap is about 90% front and 85% side. **Show it.**
5. **Big model, blank** (about 30 s): `python3 -I pipeline/build_v2.py parts.json sheet.png work/full.blend --fine`. Board it plain grey. **Show it.**
6. **Print** (about 30 s to 3.5 min): `python3 -I pipeline/v2_print.py work/full.blend print.json work/print <item> 2048`. `print.json` names the pictures, the height, `"fill": "nearest"` (or `"tint"`), and `unmirror` boxes over lettering so text never reads backwards. Board it. **Show it.**
7. **Small model and bake** (about 8 s + 25 s): `python3 -I pipeline/build_v2.py parts.json sheet.png work/lo.blend --lo` `python3 -I pipeline/v2_bake.py work/print/<item>_uv.blend work/print/<item>_albedo.png work/lo.blend work/combat <item> 2048` The small model gets one texture with the printed colour and a normal map of the big model's surface.
8. **Export and check.** `python3 -I pipeline/v2_export.py work/print/<item>_uv.blend work/full.glb` `python3 -I pipeline/glb_quant.py work/full.glb models/<item>/<item>_full.glb` (same for the combat file) Then a phone screenshot in the viewer page (`phone_shot.py`) and, for anything that walks, a walk test (`walk_video.py`). **Show both.**

**Extras when needed.** Left/right twins: build one, then `mirror_item.py left.blend right.blend`, and print the twin from its own pictures. Several versions in one model (tiers): name the copies `t1_` to `t4_` and show one at a time. Fit check on a host model: `fit_check.py`.

**If the object starts as one concept sheet** (like the Wraith's sheet 90): measure each view's box and ground line on the sheet instead of step 2, trace on the sheet itself, then `sheet_views.py sheet.png parts.json src <name>` cuts the views out for ChatGPT to sharpen before step 6.

## Sizes to start from

Pick the budgets per object before tracing; Ironhowl 4's worked well on a phone and are a good starting point. Big models are for one object on screen at a time; small models are what fills a level.

| Kind of object | Big model (triangles) | Small model (triangles) | Texture | Ironhowl 4 example (download big / small) |
| --- | --- | --- | --- | --- |
| Hero or large enemy (5–7 m) | 700,000–1,000,000 | 5,000–10,000 | 2048 | Wraith 949,948 / 7,464 (15.8 MB / 0.2 MB) |
| Mid enemy (2–4 m) | 700,000–900,000 | 5,000–8,000 | 2048 | Hound 899,956 / 7,570 (12.8 MB / 0.2 MB) |
| Small creature or drone (about 1 m) | about 300,000 | under 2,000 | 1024 | Skitter 299,974 / 1,986 (4.4 MB / 59 KB) |
| Prop or set piece (2–3 m) | about 150,000 | under 2,000 | 1024 | spawner pod 149,992 / 1,792 (2.9 MB / 47 KB) |
| Attachment (weapon, pack) | 60,000–100,000 | under 2,000 | 1024 | jet pack 99,986 / 1,936 |

- A big texture of 4096 ran out of memory in Claude's workspace (7 GB); 2048 carries the sharpened pictures' detail.
- A phone like the Pixel 7a handled about 1 to 1.5 million triangles on screen; the shipped Ironhowl 4 field drew about 300,000 to 455,000 per frame.
- Bosses or variants need no new model: reuse the files scaled up and recoloured, with one change done in code.

## Checks and check-ins

Every step is proved with a picture and a simple number before the next one starts.

| Check-in | What you see | Number to look for |
| --- | --- | --- |
| 1. Blockout | Sheet vs plain model per view, red/blue difference | Outline overlap about 90% front, 85% side or better (Wraith 91 / 86 / back 83%) |
| 2. Big model, blank | Plain grey model from each view and two three-quarter views | Triangles inside the budget |
| 3. Printed | The painted big model from each view | Sharper pictures' overlap after lining up (Wraith 96 / 92 / 96%) |
| 4. Small model | Phone-size screenshot (390 × 844) in the viewer, big and small side by side | Small triangles inside the budget; download sizes |
| 5. Walk test (anything with legs) | A short recording: stand, walk, run | Feet stay planted |

Each finished model is saved to the game's repo with its source files, previews and a README of how it was made, and the project notes are updated.

## Problems we hit, and the fixes

AI pictures never agree perfectly between views; most problems come from that. The general rule: **the front view wins for heights and widths, the side view for depths.**

| Problem | Fix |
| --- | --- |
| Front and side disagree on a part's height | `"zfrom": "side"` takes heights from the side view; `"remap": true` stretches the other view to fit. Draw the front outline a little taller, or that face sinks about 1 cm and a gap opens |
| A part sits higher or lower in one view, so its paint lands on the wrong part | Stretch that picture for that part only (`part_remap`, in `models/fgunner/source/tools/`), or move it in a print-only copy of the picture (`models/fhound/source/tools/spear_fix.py`) |
| One-sided part on opposite sides in front and back views | Flip the view that disagrees with the side view before tracing |
| Pale paint or white letters cut off or read as holes | Use the exact background grey (200, 200, 202) for the outline; small holes are filled as paint (built in since v2.2) |
| Hidden surfaces smeared with colours from other parts | `"fill": "nearest"` takes colour only from the same part (v2.3); `"tint"` is the plain alternative |
| Numbers and text backwards on the mirrored side | `unmirror` boxes over the lettering in `print.json` (add the view's name for a flipped front or back) |
| Round things come out square | An ellipse as the front outline, or the `round` option (`models/spod/source/tools/build_round.py`) |
| A part hidden in the front view gets its tips cut off | The `nomask` option (`models/fskitter/source/tools/`) |
| Diagonal legs fill a whole corner | Give each leg segment a third outline from the top view; fix a top view that disagrees with `top_fix.py` |
| Two separate pieces in one row collapse into the middle | Make them a mirrored pair (`m`), not a centre part |
| A part named like a joint gets renamed (`paw_R.001`) | Never name a part the same as a joint |
| ChatGPT draws one part wrong in one view | Repair that picture from itself (copy a matching part) and keep the script with the item |
| The small model has many separate parts (many draw calls) | Merge the parts that share a joint when the model goes into the game |

The options marked with a `models/...` path live in session copies of the tools, not yet in `pipeline/`. A new game should copy them in (or ask Claude to merge them into `pipeline/` first).

## Starting a new game with this method

Decide four things for the new game, then hand a new chat this document plus the prompt below.

1. **The look:** colours, wear, emblems, lights. This goes into every ChatGPT request so all objects match.
2. **The object list** with real sizes in metres and a budget row from the sizes table for each.
3. **The joints** each object needs to move (legs, wheels, doors, turret), and any mount points where parts attach.
4. **Where models are shown:** close-up screens get the big model; play uses the small one. A phone game may want only small models plus one big model at a time.

**Paste into the new chat** (change the parts in brackets):

> I'm making \[game name\]. Build its 3D models with the paint-and-bake method in the attached document. Clone the GitHub repo chriskizer91-ops/iron-howler-4 and copy its pipeline/ folder (and the extra tools listed in the problems table) into \[new repo\]. Start with \[object\]: its pictures are attached, and its real size is \[W × L × H\] m. Budgets: big \[number\] triangles, small \[number\]. I can't code, so explain in plain words, show each check-in (blockout, blank, printed, small model on a phone screen) with pictures and simple numbers, and keep phone screens uncluttered.

The Ironhowl 4 version of this method, with the Wraith's exact numbers, is `MODEL-PLAN.md` in the same repo.
