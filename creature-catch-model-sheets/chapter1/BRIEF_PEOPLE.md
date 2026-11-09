# Brief: the two heroes, the first people made with paint-and-bake

You are building game-ready 3D models of Creature Catch's two player characters with the **paint-and-bake
method, small-model-only route**: build the ~7,000-triangle game model directly, print the ChatGPT
pictures straight onto it, and make its normal map from the paint. This route has made eleven good
creatures. These are the first **people**, so this is also the test of how well people work. Aim for the
best model you can make.

The person you're working for can't code. Explain results in plain words and with pictures and simple
numbers.

## Read first

All paths are relative to the repo root, `/home/user/atoms-games-`.

1. `creature-catch-model-sheets/PAINT_AND_BAKE_METHOD.md`: the method and its rules.
2. `creature-catch-model-sheets/pipeline/README.md`: the tools and every `parts.json` option.
3. `creature-catch-model-sheets/round3/README.md`: what round 3 learned, and the builders' new tool
   options. They live in each creature's `tools/` folder there: `slab`, `droop`, `paint_shift`,
   `side_far`, `paint_solid`, a black-unless-asked glow map, and the `grain` and `fur_soft` reliefs.
   Read `round3/clovermouse/NOTES.md` and `round3/puffmunk/NOTES.md`; Clovermouse and Puffmunk are the
   closest finished examples (upright, with arms and feet).
4. `creature-catch-model-sheets/pipeline/cc3d.py` (top docstring): the world frame and how each picture
   maps to metres.

## Environment

- **Python** with Blender 5.2.3 as a module, plus numpy, scipy and Pillow:
  `/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python`.
  Run every tool with `-I`.
- **Node and Playwright** are installed globally if you need a browser screenshot.
- **The machine:** 4 cores and 15 GB of memory. The lead may be running Blender at the same time.

## Rules

- **Don't edit shared files.** Don't change anything in `pipeline/`, `coalossus/`, `round2/`, `round3/` or
  the source pictures. If a tool needs a change, copy it into `<your output folder>/tools/` (start from
  round 3's improved copies), change the copy, use it, and say so in your notes.
- **No git commands at all**, not even `git status`. The lead collects your work.
- **Keep work files in your own work folder** (below). Only the deliverables go in your output folder.

## Inputs

The pictures are in `creature-catch-model-sheets/chapter1/source/<id>/`, where `<id>` is `player-a` (the
boy) or `player-b` (the girl): `<id>_sheet.png`, `_front.png`, `_side.png` (facing left, so we see the
character's left side), `_back.png`, and `_top.png` (looking straight down, face and toes toward the top).
The front, side and back views are portrait 1024 x 1536; the top is 1254 x 1254. The lead has checked all
ten. The prompts that made them are in `chapter1/picture-request-main-characters.html`.

| Hero | Height H for make_views (lowest to highest point) | Notes |
| --- | --- | --- |
| Boy (`player-a`) | 1.55 m (soles to the tips of the hair) | Spiky brown hair, green jacket open over a cream shirt, backpack, cube on the left hip, cargo trousers, boots |
| Girl (`player-b`) | 1.55 m (soles to the top of the ponytail) | Black hair, a big high ponytail, orange vest over a white shirt, fingerless gloves, backpack, cube on the left hip, cargo trousers, boots |

Build the boy first, then the girl.

## Name the parts for the two-legged skeleton

After you finish, the lead animates both heroes with a new two-legged skeleton in `pipeline/animate.py`
(walk, run, talk, wave, throw a cube, cheer, and so on). The tool finds each part's job from words in
its name, so **name every part with one of these words**. The first match in this order wins:

| Word in the name | Moves with |
| --- | --- |
| `ponytail` | a two-bone chain hanging from the head |
| `hand`, `glove` | the hand |
| `foot`, `boot`, `shoe` | the foot |
| `arm` | the arm: **one part per arm from the shoulder to the wrist**, sleeve included (`arm_L`, `arm_R`). It bends at the elbow by itself. |
| `leg` | the leg: **one part per leg from the hip to the ankle**, trouser leg included (`leg_L`, `leg_R`). It bends at the knee by itself. |
| `hips`, `belt`, `cube` | the hips (`hips`, `belt`, the belt `cube`) |
| `neck` | the neck |
| `head`, `hair`, `face`, `nose`, `ear` | the head |
| `backpack`, `collar` | the upper chest |
| `torso`, `jacket`, `vest`, `shirt` (or no match) | the chest and the spine, bending at the waist |

- **Arms, hands, legs and feet** must be mirrored pairs (`kind: "m"`).
- **Put a hidden joint inside each limb part:** each arm should go a little way into the torso at the
  shoulder, and each leg a little way into the hips. That way nothing opens a gap when they bend.
- **Keep the elbows and knees where the pictures put them.** Don't make an arm or a leg one stiff tube
  with a bulge in the middle.

## Steps for each hero

1. **Check the pictures** against each other. The front and back must agree with the side view about
   anything that's only on one side (the cube is on the left hip). Note anything the generator got
   wrong.
2. **Views on one scale:**
   `python -I pipeline/make_views.py WORK/views 1.55 front.png side.png back.png top.png`.
3. **Print-only repairs**, when a picture shows a feature where the 3D model can't use it. For example,
   if the side picture's eye would print as a second eye, or an arm drawn over the body would print onto
   the body.
4. **Trace the parts into `parts.json`.**
5. **Blockout and board** (`--target 60000`, `board.py ... --three-quarter`).
   - Aim for outline overlap of about 92% front and back, and 88% side, or better.
   - Look hard at the three-quarter renders. A face that reads well from three-quarter matters more than
     a number.
6. **Small-model route** (about 7,000 triangles; give the head and face a bigger share with
   `lo_weight`). Use your `tools/` copy of `route_small.sh`.
7. **Review and fix.** Look closely at `board_printed.jpg`, the three-quarter renders and a close crop of
   the face. Fix ghost features, smears, paint on the wrong part, flat caps and stacked rings, then run
   the route again. Stop when it looks right, or when you've done what you can. Say which.

## Watch out for these on people

- **The face is everything.**
  - Make the head round and the face a smooth curve, so the front picture's eyes, brows and mouth print
    cleanly.
  - Check for ghost eyes from the side picture.
  - From the front three-quarter view the face should read like the sheet's hero view.
- **Arms drawn in front of the body.**
  - In the side picture the near arm hangs in front of the torso, and the far arm is hidden.
  - Make sure each picture only prints onto the parts it really shows: the side picture's arm onto the
    arm, not the torso.
  - Use `paint_box_skip`, `side_far` or print-only repairs as needed.
- **Hair:**
  - Big spiky or wavy hair makes a bumpy outline. Smooth it so it doesn't turn into stacked rings, and
    let the paint carry the spikes and strands.
  - Give the outline's biggest shapes their own parts if needed: the boy's spikes at the top, the girl's
    bangs and ponytail.
  - The girl's ponytail must be its own part (`ponytail`) so it can sway.
- **Thin things:**
  - Backpack straps, the belt, laces and trouser pockets are paint only.
  - The backpack and the belt cube are their own small boxy parts (`backpack`, `cube`).
- **Hands:**
  - Fingers together, so each hand is one soft mitten shape with the fingers painted on.
  - The girl's fingerless gloves: one hand part per side named `hand_L`/`hand_R`; the gloves are paint.
- **Glow:** none on either hero. Export with a black glow map.
- **Relief:** `none` for skin and faces. For cloth, hair and leather, use a gentle `grain` or `fur_soft`,
  or `none`, whichever looks cleanest. Nothing should draw crack lines.

## Lessons from the creatures

- **Bumpy outlines become rings around a part.** Smooth them (`smooth`: 5 to 14 pixels on big parts).
- **Flat ends show.** Use `round_ends`, and taper hidden ends inside other parts.
- **Slanted edges hidden inside other parts make thin shelves.** Make those edges horizontal.
- **Parts that stick out need their own part.**
- **Pictures that disagree:** the front picture wins for widths and the side picture for depths. Most of
  the work is finding which picture painted the wrong thing onto which part, and switching it off.
- **`lo_weight`** gives faces and heads more of the triangle budget.

## Deliverables

Put these in `creature-catch-model-sheets/chapter1/<id>/`:

- `<id>.glb`: the game model (about 7,000 triangles, colour + normal + a black glow map).
- `albedo.jpg`, `normal.png`, `emissive.jpg`: the exact textures in the `.glb`.
- `parts.json`, `views.json`, any repaired pictures, and changed tool copies (`tools/`).
- `board_blank.jpg`, `board_printed.jpg`, the blockout board you finished with, and `closeups.jpg` (front
  three-quarter, back three-quarter, and a big face close-up).
- `NOTES.md`, in plain words:
  - what you did, and the problems and how you fixed them
  - the numbers: triangles, outline overlap per view, % of texture seen by a picture
  - what still looks wrong
  - roughly how long it took
  - anything about people that the next ten people should know

Leave the final `model.blend` in your work folder and give its path in your reply. The lead animates
from it.

Your work folder is `/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/chapter1/<id>/`.

**When the boy's first blockout `block.blend` exists, write its path to
`/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/chapter1/boy_block_ready.txt`**
(one line). The lead uses it to test the new skeleton while you carry on.

When you finish, reply with a short summary per hero: the numbers, the paths, your honest view of how
it compares with the best creatures, and what's hardest about people.
