# Juniper, the rival kid (juniper): small-model-only route (Opus 5.5)

![printed and lit](board_printed.jpg)

![close views](closeups.jpg)

**Result:** a TRIS-triangle game model (`juniper.glb`, SIZE MB) with one colour texture (2048), a normal
map (gentle grain on the cloth, hair and shoes, nothing on the skin) and an all-black glow map (nothing
glows). From the front and the front three-quarter view he reads as the rival on the sheet: the cocky
grin with its white teeth, red eyes under angry brows, the spiky red hair with the big spike on top and
the long lock between the eyes, the yellow scarf with its tail over his right chest, the open blue
jacket with grey rolled cuffs over the black shirt, the brown belt with the silver buckle and the purple
capture cube on his left hip, baggy dark trousers and red-and-white sneakers. From behind: the spiky
back of the hair, the scarf's tail hanging down his back on the right, the cube on his left hip.

The final game model's Blender file (the lead animates from it):
`/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/chapter1/juniper/OUT/model.blend`

## Numbers

| | Front | Side | Back | Top |
| --- | --- | --- | --- | --- |
| Blockout (60,000 triangles), outline overlap (`blockout.jpg`) | 89.9% | 86.3% | 89.8% | 52.7% |
| Game model (TRIS triangles), outline overlap | OVF% | OVS% | OVB% | OVT% |

- **Texture seen by a picture:** SEEN%. The rest (the inner sides of the arms and legs, the soles, the
  underside of the hair, hidden ends) is coloured from the nearest painted spot of the same part.
- **Why the top number is low:** the top picture is another pose (arms out, feet far in front, the
  scarf's tail lying flat behind). No part prints from it.
- **Why the overlaps are under the heroes':** most of the missing outline is the tips of the hair
  spikes. As the brief says, the hair is one smooth mass through the spikes' middles plus the biggest
  spike and locks, with the other spikes painted on, so their tips are lost (about 3 to 4% in each view).
- **Parts (16 kinds, 22 pieces), all named for the two-legged skeleton:**

  | Skeleton job | Pieces |
  | --- | --- |
  | head | `head`, `ear_L/R`, `hair`, `hair_bangs`, `hair_spike`, `hair_lock_L/R` |
  | neck | `neck` |
  | upper chest | `collar_scarf`, `collar_scarf_tail` |
  | chest and spine | `torso` (the open jacket and the black shirt) |
  | hips | `hips` (the belt is paint on it), `hips_cube` (the capture cube on his left hip) |
  | arm (shoulder to wrist, the sleeve and rolled cuff included) | `arm_L`, `arm_R` |
  | hand | `hand_L`, `hand_R` |
  | leg (hip to ankle, the baggy trouser leg included) | `leg_L`, `leg_R` |
  | foot | `shoe_L`, `shoe_R` |

  Arms, hands, legs and shoes are mirrored pairs. Each arm starts inside the torso at the shoulder and
  each leg 11 cm up inside the hips. The elbow is just under the rolled cuff and the knee where the
  trousers bunch, as the pictures put them.
- **Triangle budget:** BUDGET
- **Time:** about TIME minutes by the clock (11:28 to END): 2 blockouts and RUNS route runs.

## What I did and the problems I hit

1. **Pictures checked.** The front, side and back agree that the cube is on his left hip and that the
   scarf's front tail hangs over his right chest and its back tail down his right back (the side
   picture shows the back tail sticking out behind him). What the generator got wrong: the top picture
   is another pose (see above); otherwise the three main views agree closely (the same height to within
   1%).
2. **Views on one scale:** `make_views.py ... 1.55`.
3. **Ghost face:** the side picture's eye, eyebrow and grin are painted out of a print-only copy with
   skin colour only (`inpaint_skin.py`; the copy is `side_print_repaired.png`).
4. **The spiky hair**, the heroes' way:
   - one mass sliced upward, its outline a smooth hull through the middles of the spikes, its front
     edge (side picture) stepping back from the forehead to behind the ears;
   - a fringe pad over the forehead, down to the long lock between the eyes;
   - the big spike on top that curls forward as its own part;
   - a pointed lock at each temple, in front of the ears, so the lower edge breaks into points.
   The first blockout's hair stopped at the spikes' bases and left a lot of red (missing) round the
   head; the second goes through their middles (front overlap 87.9 to 89.9%).
5. **Too wide at the shoulders.** The first blockout's sleeves and jacket were 2 to 3 cm too wide at
   the shoulder (blue on both sides); they now follow the picture's shoulder line.
6. **The scarf** is a soft ring round the neck (`collar_scarf`) plus the tail that hangs down his back
   (`collar_scarf_tail`, a thin turned blade so it lies out from the back as the side picture shows).
   The front tail lies flat on his chest, so it is paint on the jacket.
7. **The capture cube** is a small boxy part moved 1.5 cm out from the hip so it isn't buried. The side
   picture is switched off on the right hip, trousers and jacket where it draws the cube (it is used
   mirrored for the right side), and the back picture where it draws the cube on the back of the left
   hip, so there's only one cube. The side picture's hand and the scarf's back tail are switched off on
   the hips, legs and jacket behind them too (`paint_box_skip`).
8. **Relief:** none on the face, ears, hands and cube; a gentle `grain` on everything else.
9. **Glow map:** all black. Checked: the exported glow texture is black.

## Changed tool copies (in `tools/`)

The heroes' set (see `../player-a/NOTES.md` and `../player-b/NOTES.md`), unchanged (`print_tex.py` is
the girl's copy with `paint_color_skip`). New for Juniper: `mkparts.py` writes this `parts.json`;
`redo_views.sh` rebuilds the views and makes the repaired side picture.

Rebuild (from the work folder): `bash tools/redo_views.sh`, then `python -I tools/mkparts.py parts.json`,
then `PY=... bash tools/route_small.sh parts.json views/views.json OUT 7000 juniper`.

## What still looks wrong

WRONG

## Compared with the heroes

COMPARE

## What the next people should know

- **Spiky hair:** trace the hair mass through the middles of the spikes, not their bases; it costs a
  little puffiness but gains outline and covers the scalp.
- **Check the shoulder line in the first blockout:** a sleeve traced from the cuff up tends to come out
  too wide at the shoulder.
