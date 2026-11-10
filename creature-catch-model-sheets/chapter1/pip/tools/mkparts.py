"""Writes pip's parts.json (Pip, the shopkeeper). Outlines are in picture pixels of the 1024 x 1536 source pictures.
kind: c centred, m mirrored pair (traced on Pip's left, +X: image right in the front picture, image left in the
back picture), one = single off-centre. Part names carry the two-legged skeleton's words (BRIEF_PEOPLE.md and
BRIEF_PEOPLE_2.md): `glasses` (head), `skirt_apron` (the apron below the waist), `belt_bow` (hips).
Built the heroes' way (../player-a/NOTES.md, ../player-b/NOTES.md): smooth hand-drawn outlines (nomask) for the
head, hair, torso, skirt, arms and legs; one upward-sliced hair mass plus a fringe and the biggest curl."""
import json, sys
P = lambda s: [[int(a) for a in p.split(",")] for p in s.split()]
parts = []
def add(**k):
    parts.append(k)
# top picture mapping (set by redo_views.sh) for drawn top outlines: metres -> top picture pixels
TUC, TVC, TSX, TSY = 625, 561, 1129, 1030
def top(pts):
    return P(" ".join(f"{round(TUC - x * TSX)},{round(TVC + y * TSY)}" for x, y in pts))
def sym(rows):  # rows of (y, half-width) -> symmetric top outline
    return [(-h, y) for y, h in rows] + [(h, y) for y, h in rows[::-1]]
def glass_y(x):  # front edge of the glasses (metres): about 2 cm in front of the round face, out to the hinges
    xs = [0.0, 0.03, 0.06, 0.08, 0.10, 0.112, 0.13, 0.146]
    ys = [-0.2125, -0.210, -0.199, -0.1875, -0.167, -0.146, -0.125, -0.11]
    x = abs(x)
    for i in range(len(xs) - 1):
        if x <= xs[i + 1]:
            t = (x - xs[i]) / (xs[i + 1] - xs[i]); return ys[i] + t * (ys[i + 1] - ys[i])
    return ys[-1]
def glasses_front():  # the front outline of the glasses: two round rims, the bridge and the hinges (front picture pixels)
    import math
    shapes_e = [(446, 308, 55, 59), (581, 308, 56, 59)]  # lens rims: centre and radii
    rects = [(365, 295, 396, 321), (630, 295, 662, 321), (494, 296, 532, 313)]  # hinges and bridge
    tops, bots = [], []
    for u in range(365, 663, 3):
        zs = []
        for cx, cy, rx, ry in shapes_e:
            if abs(u - cx) < rx:
                h = ry * math.sqrt(1 - ((u - cx) / rx) ** 2); zs += [cy - h, cy + h]
        for x0, y0, x1, y1 in rects:
            if x0 <= u <= x1: zs += [y0, y1]
        if zs: tops.append((u, min(zs))); bots.append((u, max(zs)))
    pts = tops + bots[::-1]
    return [[int(round(a)), int(round(b))] for a, b in pts]
def band(x0, x1, f, t, n=13):  # a thin curved band seen from above: front edge y = f(x), t metres thick
    xs = [x0 + (x1 - x0) * i / (n - 1) for i in range(n)]
    return [(x, f(x)) for x in xs] + [(x, f(x) + t) for x in xs[::-1]]

# ---- head ------------------------------------------------------------------------------------
# a broad round face (25 cm wide); the skull's top and back are hidden in the hair, so they are kept short
add(name="head", kind="c", axis="z", n=2.2, relief="none", smooth=5, lo_weight=4.0, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.05}, paint_skip=["top", "back"],
    views={"front": P("512,130 560,134 600,152 625,188 636,240 640,290 642,340 638,385 625,420 600,450 565,470 512,478 459,470 424,450 399,420 386,385 382,340 384,290 388,240 399,188 424,152 464,134"),
           "side": P("440,128 505,126 545,138 570,165 582,215 584,280 578,340 562,390 534,430 495,462 455,476 400,478 368,470 350,454 343,430 342,400 338,375 333,345 331,310 332,270 336,230 345,195 362,163 395,140")})
add(name="ear", kind="m", axis="z", n=2.2, relief="none", smooth=2, lo_weight=4.0, k_scale=1.6, n_scale=1.6,
    round_ends={"start": 0.008, "end": 0.01}, paint_skip=["top", "back", "side_far"], paint_color_skip=["dark"],
    views={"front": P("634,318 660,312 680,320 690,345 688,375 676,400 655,410 634,400"),
           "side": P("497,308 520,305 538,318 546,345 543,380 530,402 510,410 495,400 491,360")})
# the round button nose
add(name="nose", kind="c", axis="z", n=2.0, relief="none", smooth=2, lo_weight=2.0,
    round_ends={"start": 0.008, "end": 0.008}, paint_skip=["top", "back"],
    views={"front": P("512,322 530,326 541,340 543,356 535,370 512,376 489,370 481,356 483,340 494,326"),
           "side": P("318,324 330,322 340,326 345,345 342,368 330,377 312,376 300,366 298,348 305,332")})
# the round glasses: one curved plate in front of the eyes, sliced side to side (axis x). The front picture
# gives both rings and the bridge; a drawn top outline makes it a thin band that curves back at the hinges
# (the side picture draws the hinge about 8 cm behind the bridge). The front picture paints the frames and
# the eyes onto the plate, like seeing them through the lenses.
add(name="glasses", kind="c", axis="x", n=4.0, relief="none", smooth=1.5, lo_weight=2.2, nomask=["front", "top"],
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top", "back", "side"],
    views={"front": glasses_front(),
           "top": top(band(-0.146, 0.146, glass_y, 0.009, n=17))})
# The main hair is sliced upward; its front edge (side picture) steps back from the forehead to behind the
# ear, so it frames the face with no brim. The outline is a smooth hull through the curls' bases.
add(name="hair", kind="c", axis="z", n=2.2, relief="grain", smooth=8, lo_weight=2.4, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.05}, paint_color_skip=["skin"],
    views={"front": P("512,95 580,100 632,120 672,150 702,188 730,226 748,265 755,302 750,342 735,382 715,418 690,450 334,450 309,418 289,382 274,342 269,302 276,265 294,226 322,188 352,150 392,120 444,100"),
           "side": P("470,95 560,98 620,112 680,140 725,175 752,215 768,260 772,300 768,345 752,390 725,428 690,455 640,470 590,468 562,450 550,420 545,390 543,340 538,310 505,288 470,262 430,245 392,228 360,212 346,190 350,160 372,130 412,108")})
# the fringe: a pad of curls in front of the forehead, sliced front-to-back so its lower edge arcs up at the temples
add(name="hair_bangs", kind="c", axis="y", n=2.2, relief="grain", smooth=3, lo_weight=2.5, nomask=["side", "top"],
    round_ends={"start": 0.012, "end": 0.0}, paint_skip=["back"], paint_color_skip=["skin"],
    views={"side": P("330,175 336,150 352,128 378,112 420,104 450,104 450,196 400,198 355,198 335,192 329,184"),
           "top": top(sym([(-0.192, 0.05), (-0.186, 0.08), (-0.175, 0.105), (-0.158, 0.122), (-0.135, 0.13), (-0.08, 0.13)]))})
# the big hooked curl on top of the head
add(name="hair_curl", kind="c", axis="z", n=2.0, relief="grain", smooth=4, lo_weight=2.2, nomask=["front", "side"],
    round_ends={"start": 0.01, "end": 0.012}, paint_skip=["back"],
    views={"front": P("446,40 470,30 500,28 520,38 505,52 492,72 488,100 492,125 432,125 428,95 432,65"),
           "side": P("392,52 420,34 455,28 486,40 480,62 466,72 452,95 455,122 395,122 386,95 386,72")})
# ---- neck, torso (shirt and apron bib), apron skirt, bow -----------------------------------------
add(name="neck", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=0.5, paint_skip=["top"],
    views={"front": P("458,430 566,430 570,505 454,505"),
           "side": P("412,440 505,440 508,505 408,505")})
add(name="torso", kind="c", axis="z", n=2.6, relief="grain", smooth=6, lo_weight=1.1, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.035}, paint_skip=["top"],
    views={"front": P("512,478 580,482 640,498 680,522 694,560 692,610 683,660 678,700 676,760 674,800 350,800 348,760 346,700 341,660 332,610 330,560 344,522 384,498 444,482"),
           "side": P("420,473 500,470 560,476 600,496 622,528 633,580 636,640 634,700 632,800 338,800 337,740 332,690 334,640 342,600 360,570 386,540 398,515 405,492")})
# the apron below the waist: a flared skirt all round (the stripes run down the side and back too)
add(name="skirt_apron", kind="c", axis="z", n=2.4, relief="grain", smooth=6, lo_weight=1.3, nomask=["front", "side"],
    round_ends={"start": 0.025, "end": 0.0}, paint_skip=["top"],
    paint_box_skip={"side": [[425, 790, 572, 1000]]},
    views={"front": P("512,772 600,772 682,778 702,820 727,900 752,1000 763,1060 760,1078 742,1088 512,1092 282,1088 264,1078 261,1060 271,1000 296,900 321,820 342,778 424,772"),
           "side": P("330,768 636,768 646,820 658,900 670,980 679,1050 679,1075 664,1088 306,1090 290,1075 288,1050 294,980 304,900 316,830 326,790")})
# the bow at the back of the waistband (its loops and knot), and its two tails
add(name="belt_bow", kind="c", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=0.9,
    round_ends={"start": 0.01, "end": 0.012}, paint_skip=["front", "top"],
    views={"back": P("382,730 400,712 440,710 492,722 548,722 600,710 640,712 658,735 655,780 640,810 590,815 548,792 492,792 430,815 390,810 378,780"),
           "side": P("620,716 668,712 712,722 734,742 732,770 712,790 668,800 620,800")},
    order=["back", "side"])
add(name="belt_bow_tail", kind="m", axis="z", n=2.4, relief="grain", smooth=2, lo_weight=0.6,
    round_ends={"start": 0.0, "end": 0.006}, paint_skip=["front", "top"],
    views={"back": P("497,772 532,776 512,820 498,870 486,935 452,942 412,908 440,852 470,800"),
           "side": P("632,780 690,790 712,850 732,912 724,942 700,958 682,935 664,875 646,820")},
    order=["back", "side"])
# ---- arms and hands ---------------------------------------------------------------------------
add(name="arm", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=2.2, nomask=["front", "side"],
    round_ends={"start": 0.012, "end": 0.0}, paint_skip=["top"],
    views={"front": P("640,492 680,505 715,535 745,570 775,610 805,650 825,690 840,730 855,770 868,812 790,816 770,792 740,764 710,746 690,725 678,690 668,650 655,600 640,560 630,520"),
           "side": P("470,495 540,490 590,505 612,540 615,600 612,650 605,700 560,712 555,760 556,814 468,814 470,760 475,712 430,700 424,650 426,590 436,540 450,510")})
add(name="hand", kind="m", axis="z", n=2.3, relief="none", smooth=3, lo_weight=2.5, nomask=["front", "side"],
    round_ends={"start": 0.008, "end": 0.02}, paint_skip=["top"],
    views={"front": P("790,800 866,796 890,836 912,878 928,918 925,950 905,962 880,948 860,930 835,900 812,868 795,838"),
           "side": P("468,800 556,800 562,850 560,920 548,975 520,990 490,985 465,960 440,935 435,880 450,840")})
# ---- legs and boots (the legs start hidden inside the skirt) ------------------------------------
add(name="leg", kind="m", axis="z", n=2.2, relief="grain", smooth=5, lo_weight=0.9, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    views={"front": P("522,900 700,900 716,1000 721,1100 720,1160 729,1200 727,1260 731,1290 722,1318 560,1318 556,1280 548,1220 540,1160 532,1110 524,1000"),
           "side": P("382,895 628,895 626,1000 614,1095 617,1180 613,1240 613,1313 408,1313 405,1240 392,1180 386,1095 384,1000")})
add(name="boot", kind="m", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=1.0,
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    views={"front": P("565,1298 735,1298 755,1330 772,1360 781,1395 782,1435 565,1435 562,1395 568,1340"),
           "side": P("400,1293 605,1293 615,1340 622,1380 624,1430 290,1430 288,1395 298,1360 318,1328 360,1305")})

d = {"item": "pip", "H": 1.35, "ring_ease": 0.35,
     "note": "Outlines in picture pixels of the source pictures (1024 x 1536). kind: c centred, m mirrored pair (traced on Pip's left, +X), one single off-centre. Names follow the two-legged skeleton's words.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
