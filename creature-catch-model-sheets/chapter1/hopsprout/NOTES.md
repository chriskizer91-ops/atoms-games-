# Hopsprout: small-model-only route

![printed and lit](board_printed.jpg)

![close views](closeups.jpg)

**Result:** a 6,958-triangle game model (`hopsprout.glb`, 0.6 MB) with one colour texture (2048), a flat
normal map (smooth, shiny skin) and an all-black glow map (nothing glows). It reads as the grasshopper in
the pictures: a big round lime head with large green eyes and a small smile, the two-leaf sprout on top,
two thick antennae curving up and out, a segmented body, pale wings folded along the back like a roof,
four short legs and two big folded back legs with the knees up.

The final game model's Blender file (the lead animates from it):
`/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/chapter1/hopsprout/out2/model.blend`

## Numbers

| | Front | Side | Back | Top |
| --- | --- | --- | --- | --- |
| Blockout (60,000 triangles), outline overlap (`blockout.jpg`) | 87.3% | 79.2% | 77.8% | 58.3% |
| Game model (6,958 triangles), outline overlap | 86.7% | 78.5% | 77.8% | 59.0% |

The blockout board is the first one. After it I widened the back thighs and shins; that changed the
scores very little, because most of what is missing is drawn differently in each picture (below).

- **Texture seen by a picture:** 76.7%. The rest (undersides, the inner sides of the legs and wings,
  the hidden backs of the sprout leaves) is coloured from the nearest painted spot of the same part.
- **Parts (18 pieces):** `head`, `head_sprout` (the stem), `head_sprout_leaf` pair, `head_antenna` pair,
  `body_front` (thorax), `body_back` (abdomen), `body_wing` pair, `front_leg` pair, `mid_leg` pair,
  `rear_leg_thigh` pair, `rear_leg` pair (shin and foot). Budget: head 1,496, body 1,062 (thorax 522,
  abdomen 540), wings 448 each, shins 460 each, thighs 364 each, antennae 280 each, front legs 240 each,
  middle legs 200 each, sprout leaves 168 each, stem 80.
- **Skeleton words (bug plan):** `head`, `head_sprout*`, `head_antenna` ride the head; `body_front`,
  `body_back` and `body_wing` the body; `front_leg`, `mid_leg` and the big back legs `rear_leg` (two
  pieces each side, `rear_leg_thigh` and `rear_leg`, both with the word `rear_leg`) are mirrored pairs.
- **Glow:** 0% (black map, checked in `emissive.jpg` and on the lit board).
- **Time:** about 40 minutes of my own work (tracing from about 01:35, blockout, then two route runs
  after the break, ending 12:08), 2 route runs and 1 blockout.

## Why the scores are low

- **Side:** the side picture draws four short legs on the near side (a far leg peeks through) and the far
  back thigh higher and further forward than the near one (a perspective slip). Legs are mirrored pairs,
  so the model has one of each. Those two account for most of the red.
- **Back:** the back picture draws the antennae closer together than the front picture (front wins), and
  its middle legs in other places.
- **Top (about 59%):** the top picture is a different drawing: the legs stick straight out sideways like
  a bug pinned flat, and the face shows. It is used only for the wings and the top of the body.

## What I did and the problems I hit

1. **Pictures checked.** Side faces left, top has the head at the top. What the generator got wrong:
   see above, plus: the sprout's two leaves point left and right in the front picture but forward and
   back in the side picture, and the top picture draws the sprout 6 cm further forward. Each leaf is a
   chunky round blob on the stem; the top picture is read shifted for them (`paint_shift`).
2. **Ghost eye.** The side picture's eye, its pale ring and the smile are painted out of a print-only
   copy (`side_print_repaired.png`; a wide blur, so no dark dot is left in the middle).
3. **Folded wings** (`body_wing`): each is a thick plate (`slab`) sliced front to back, tilted like a
   roof (high at the spine, low at the sides), rising toward the back as in the side picture.
4. **The big back legs** are two pieces each side: a broad flat thigh rising from the body to the knee
   (as a grasshopper's is; the side picture fills the space between thigh and shin) and the shin with its
   foot coming down. One piece would have filled the whole triangle between them.
5. **Shiny highlights.** The pictures are glossy, and each draws its white highlight streaks along the
   legs and antennae in a different place, so they printed as pale blotches. The legs, thighs, stem and
   antennae now take one lime (or dark green) colour, only lightly shaded by the pictures
   (`paint_solid`), and the head, body and wings take each spot's colour from the most head-on picture
   (`paint_power` 5 to 6).
6. **Wing paint on the head and abdomen.** The back and top pictures draw the wings over the abdomen and
   the head; those pictures are switched off there (`paint_ellipse_skip`).
7. **Relief:** `none` everywhere (smooth, shiny skin).

## Changed tool copies (in `tools/`)

The same set as Tuftail's (see `../tuftail/NOTES.md`). `mkparts.py` writes `parts.json`; `closeups.py`
makes `closeups.jpg`.

Rebuild: `make_views.py WORK/views 0.45 front side back top`, then
`tools/inpaint_view.py views.json side "460,468,78,96" --grain 0 --sigma 34` and
`tools/inpaint_view.py views.json side "362,558,26,22" --grain 0 --sigma 12`, then
`tools/mkparts.py parts.json` and `PY=... bash tools/route_small.sh parts.json views.json OUT 7000 hopsprout`.

## What still looks wrong

- **The scores are the lowest of the four** (side 78.5%, back 77.8%) because the pictures disagree (see
  above); from the front three-quarter view it still reads as the picture.
- **The head and abdomen are a little mottled** (paler and darker patches) from the glossy highlights in the
  pictures; only the legs, antennae and stem could be made one colour.
- **From behind** the abdomen's tip shows the back picture's segment lines plus a soft blotch on each side
  where the wings were switched off, and the folded wings look smaller than in the back picture (the side
  picture holds them higher than the back picture does).
- Two darker smudges on the top of the head, where the front picture's antennae cross it.
- The far back thigh the side picture draws above the wing, and the fourth short leg it shows, are not
  modelled (mirrored pairs only).
- The sprout leaves are rounded blobs, not flat leaves; the legs have 10 sides, so they are faceted up close.

## Compared with round 3

Below round 3. The face, sprout, antennae and legs read well from the front three-quarter view and the legs
are clean, but the outline scores are 10 to 15 points under round 3's, the body paint is a little blotchy, and
the wings and back thighs are a compromise between pictures that disagree. It is the one of my four that would
gain most from a second set of pictures (a less glossy finish, the same pose in the top view, and one back
thigh drawn per side).
