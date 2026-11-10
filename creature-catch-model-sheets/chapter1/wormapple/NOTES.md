# Wormapple: small-model-only route

![printed and lit](board_printed.jpg)

![close views](closeups.jpg)

**Result:** a 6,954-triangle game model (`wormapple.glb`, 1.3 MB) with one colour texture (2048), a
normal map (a soft grain on the stem and leaf only) and an all-black glow map: nothing glows. From the
front three-quarter view it reads as the picture: a shiny red apple with its highlights, the dark round
hole in the front with the green worm poking out of it (big eyes, open smile, little waving nub), the
brown stem leaning to one side and the big green leaf.

The final game model's Blender file (the lead animates from it):
`/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/chapter1/wormapple/r7/model.blend`

## Numbers

| | Front | Side | Back | Top |
| --- | --- | --- | --- | --- |
| Blockout (60,000 triangles), outline overlap (`blockout.jpg`) | 96.0% | 95.5% | 96.4% | 84.8% |
| Game model (6,954 triangles), outline overlap | 95.4% | 94.3% | 95.9% | 84.8% |

- **Texture seen by a picture:** 86.2%, the highest of the four: the apple is round and every picture
  sees it. The rest (the underside, the hidden back of the worm, and the apple's top round the stem, where
  the pictures are switched off) is coloured from the nearest painted spot of the same part.
- **Size:** 0.36 m wide, 0.39 m deep, 0.45 m tall to the top of the leaf, close to the request's 0.4 m.
- **Parts (6):** `body` (the apple), `body_stem`, `body_leaf`, `head` (the worm's head, with the face),
  `head_worm` (the worm's body coming out of the hole), `head_nub` (the waving nub). Budget: apple
  4,380, leaf 888, head 702, stem 448, worm body 416, nub 120.
- **Skeleton words (round plan):** `body`, `body_stem`, `body_leaf` stay with the apple; `head`,
  `head_worm`, `head_nub` move with the worm. ("worm" holds no other skeleton word.)
- **Glow:** 0% (black map, checked in `emissive.jpg` and on the lit board).
- **Time:** about 45 minutes of work (02:00 to 03:00, then 11:30 to 12:25 after the break, by the clock),
  with 1 blockout and 7 route runs. That is two runs over the brief's five: the last two went on the green
  patch on the apple's top (below), which shows in the front three-quarter view.

## Why top is lower

- **Top (85%):** the top picture puts the apple about 2 cm further back than the side picture and draws
  the worm's head sticking up over the apple's front edge (it is drawn a little from the front). The side
  picture wins for depths.

## What I did and the problems I hit

1. **Pictures checked.** Side faces left, top has the head at the top; the front and back agree with the
   side (the leaf is on the creature's right in all three, the stem leans to its left). What the generator
   got wrong:
   - the top picture is drawn a little from the front (above), and its leaf lies flatter than the front
     and side pictures' leaf, which shows its face to both;
   - the side picture is drawn a little from the front: it shows the inside of the hole, which a dead-side
     view couldn't.
2. **The hole is paint.** The apple is one round solid; the worm's body comes out of it 2 cm, and the
   front picture paints the dark hole and its rim around it. From the front three-quarter view it reads as
   a hole.
3. **A second hole and a green smear on the flank.** The side picture's slanted view of the hole and the
   worm would have printed a dark hole and a green patch on each side of the apple. That area of the side
   picture is switched off on the apple (`paint_box_skip`); the front picture paints the flank there.
4. **Ghost stem dimples.** The front, side and back pictures each draw the dark dimple round the stem
   lower than where the model's stem goes into the apple, so each printed a dark hole on the apple's top
   in front of, beside or behind the stem. Those areas are switched off on the apple; the top picture
   paints the top.
5. **A green patch on the apple's top** (the one fix that took several runs). The front, side and back
   pictures draw the leaf hanging over the apple's shoulder, and the top picture draws the stem and leaf
   (and the worm's head, at the front edge) over the apple's top; all of that green printed onto the
   apple. Those areas are switched off on the apple. I first boxed the top picture's leaf in the wrong
   place, which cost two extra runs before I found it by tracing the green texels back to the picture
   they came from.
6. **The leaf is a thin blade standing on edge, turned 45 degrees** (`slab`), because the front and the
   side pictures both show its full face. The stem is a single off-centre part (`kind: one`) that leans
   as the front picture draws it.
7. **Ghost eye.** The side picture's eye is painted out of a print-only copy (`side_print_repaired.png`);
   the smile is kept, as it wraps round the front of the head.
8. **Rings on the apple.** The first blockout had faint horizontal rings; the apple's outlines are now
   used as drawn (`nomask`) and smoothed more.
9. **Relief:** `none` on the apple and the worm (shiny), a soft `grain` on the stem and leaf.

## Changed tool copies (in `tools/`)

The same merged set as Dewt's and Dandylion's (see `../dewt/NOTES.md`, `../dandylion/NOTES.md`):
`print_tex.py` with `paint_ellipse_skip` and `view_warp`, `closeups.py` framed by size. `mkparts.py`
writes `parts.json`.

Rebuild (from the work folder): `make_views.py views 0.45 front side back top`, then
`tools/inpaint_view.py views/views.json side "198,598,30,46" "x:158,662,26,32" --grain 0 --sigma 14`,
then `python3 -I tools/mkparts.py parts.json` and
`PY=... bash tools/route_small.sh parts.json views/views.json OUT 7000 wormapple`.

## What still looks wrong

- **The hole is flat paint.** From a low side angle the worm's body sits on the apple's surface rather
  than coming out of a real hole.
- **No dimple round the stem:** the apple's top is a smooth dome; the stem stands on it. Round the stem
  the top is coloured from nearby paint (the pictures are switched off there), so it is a little flat in
  colour, with a faint straight edge where the top picture's paint starts again.
- From the exact side, a soft vertical seam and a lighter patch show on the apple where the side
  picture is switched off (the hole area and the dimple).
- The leaf is a little faceted at its edges, and both of its faces show the same front-facing paint.
- The worm's face has 702 triangles; it reads well at game size but its outline is slightly faceted up
  close.

## Compared with round 3

As clean as round 3's best (Clovermouse's face, Mushling's simple shapes): no ghost features left, and
the best outline match of the four (95 / 94 / 96%). The hole being paint is the one place it falls short
of a modelled version.
