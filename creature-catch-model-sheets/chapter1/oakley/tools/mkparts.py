"""Writes oakley's parts.json (Ranger Oakley). Outlines are in picture pixels of the 1024 x 1536 source pictures.
kind: c centred, m mirrored pair (traced on his left, +X: image right in the front picture), one = single off-centre.
Part names carry the two-legged skeleton's words (BRIEF_PEOPLE.md + BRIEF_PEOPLE_2.md): `cloak` hangs from the
shoulders, `hat`/`hat_brim`/`hat_feather` move with the head, `belt_compass`/`belt_pouch` with the hips.
Built the heroes' way (../player-a/NOTES.md, ../player-b/NOTES.md): smooth hand-drawn outlines (nomask).
The top picture is another pose (arms out), so only the hat prints from it (its scale is set to the brim)."""
import json, sys, math
P = lambda s: [[int(a) for a in p.split(",")] for p in s.split()]
parts = []
def add(**k):
    k.setdefault("paint_skip", [])
    if not k["name"].startswith("hat") and "top" not in k["paint_skip"]:
        k["paint_skip"] = k["paint_skip"] + ["top"]
    parts.append(k)
UC = 510.5  # the front picture's centre line
def mir(s):  # right half of a centred front outline (top to bottom) -> closed symmetric outline
    pts = P(s)
    return pts + [[round(2 * UC - u), v] for u, v in pts[::-1] if u != 512]
# top picture mapping (set by redo_views.sh so its hat brim matches the front and side): metres -> pixels
TUC, TVC, TSX, TSY = 625, 553.5, 989, 950
def circle_top(cx, cy, r, n=24):  # an outline in the top picture: centre in pixels, radius in pixels
    return [[round(cx + r * math.cos(2 * math.pi * i / n)), round(cy + r * math.sin(2 * math.pi * i / n))] for i in range(n)]

# where the feather lies over the hat in the top, back and side pictures (it would print onto the hat)
FEATHER_SKIP = {"top": [[340, 400, 540, 610]], "back": [[300, 18, 448, 222]], "side": [[565, 25, 728, 158]]}
ARMS_FRONT = [[120, 585, 305, 910], [716, 585, 900, 910]]
ARMS_BACK = [[100, 585, 310, 910], [714, 585, 925, 910]]
ARM_SIDE = [[488, 585, 625, 912]]
COMPASS_SIDE = [[383, 640, 500, 812]]
# ---- head, ears, hair ---------------------------------------------------------------------------
add(name="head", kind="c", axis="z", n=2.2, relief="none", smooth=5, lo_weight=5.0, nomask=["front", "side"],
    round_ends={"start": 0.025, "end": 0.04},
    views={"front": mir("512,90 555,95 585,115 598,150 600,190 597,230 592,265 582,295 565,320 540,338 512,344"),
           "side": P("470,90 530,92 570,110 590,145 595,190 592,240 580,280 556,315 520,335 470,345 425,350 412,335 405,310 400,290 393,275 395,258 402,240 403,215 408,180 420,140 440,105")})
add(name="ear", kind="m", axis="z", n=2.2, relief="none", smooth=2, lo_weight=3.0, k_scale=1.4, n_scale=1.4,
    round_ends={"start": 0.008, "end": 0.01}, paint_skip=["back", "side_far"],
    views={"front": P("576,246 592,240 603,250 606,270 600,290 586,297 575,285"),
           "side": P("500,240 520,232 540,238 547,258 544,282 530,295 512,295 502,280 498,260")})
# messy brown hair under the hat: sliced upward, its front edge (side picture) steps back from the
# forehead to behind the ear so the face and ears stay clear
add(name="hair", kind="c", axis="z", n=2.2, relief="grain", smooth=6, lo_weight=2.6, nomask=["front", "side"],
    round_ends={"start": 0.015, "end": 0.0},
    views={"front": mir("512,165 600,168 628,195 640,225 641,260 633,290 615,318 590,333 512,336"),
           "side": P("430,170 480,163 560,163 620,172 642,200 652,245 645,290 625,322 600,337 560,337 546,318 550,290 549,255 500,248 462,240 440,218 422,195")})
add(name="neck", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=0.4, nomask=["front", "side"],
    views={"front": P("470,318 552,318 554,388 468,388"),
           "side": P("440,318 518,318 520,388 445,388")})
# ---- the hat: crown, a tilted brim (sliced front to back so it can tilt; its sides droop) and the feather
add(name="hat", kind="c", axis="z", n=2.4, relief="grain", smooth=4, lo_weight=1.8, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.03}, paint_box_skip=FEATHER_SKIP,
    views={"front": mir("512,68 560,75 585,100 595,140 600,185"),
           "side": P("470,62 560,58 610,80 630,120 638,160 642,222 500,198 408,176 416,140 433,100 450,75")})
add(name="hat_brim", kind="c", axis="y", n=2.0, relief="grain", smooth=3, lo_weight=1.5, nomask=["side", "top"],
    round_ends={"start": 0.0, "end": 0.0}, droop={"axis": "x", "w": 0.27, "dz": 0.05}, paint_box_skip=FEATHER_SKIP,
    views={"side": P("298,160 330,152 400,152 500,168 600,192 680,225 720,255 718,270 680,243 600,210 500,186 400,170 330,170 302,176"),
           "top": circle_top(TUC, 524, 266)})
add(name="hat_feather", kind="one", axis="z", n=2.0, relief="none", smooth=3, lo_weight=1.2, nomask=["front", "side"],
    slab={"thick": 0.014, "dir": 1}, round_ends={"start": 0.01, "end": 0.02},
    views={"front": P("572,182 580,150 600,110 625,75 660,45 700,28 710,35 708,70 690,100 660,130 625,160 590,185"),
           "side": P("535,182 560,150 600,110 640,75 680,45 715,32 722,45 712,80 690,110 650,140 610,160 560,185")})
# ---- cloak: hood and cape over the shoulders, hanging behind the arms; open in front --------------
# Sliced upward. Below the chest its front edge (side picture) sits behind the middle of the body, so
# the tunic and legs stay in front and the cloak wraps round the sides and the back.
add(name="cloak", kind="c", axis="z", n=2.2, relief="grain", smooth=7, lo_weight=0.6, nomask=["front", "side"],
    round_ends={"start": 0.015, "end": 0.02},
    paint_box_skip={"front": ARMS_FRONT, "back": ARMS_BACK, "side": ARM_SIDE},
    views={"front": mir("512,330 580,332 625,345 650,370 672,400 695,450 718,500 750,560 760,600 765,700 772,800 797,900 826,1000 845,1100 838,1140 812,1165 512,1168"),
           "side": P("452,333 520,328 590,334 625,355 645,390 655,450 655,520 662,600 680,700 700,800 722,900 745,1000 765,1100 768,1140 740,1165 640,1170 540,1170 540,1000 535,800 500,700 476,620 452,560 425,500 405,450 400,415 420,375")})
# ---- tunic (torso), belt things, arms -----------------------------------------------------------
add(name="torso", kind="c", axis="z", n=2.2, relief="grain", smooth=6, lo_weight=1.0, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.03},
    paint_box_skip={"side": ARM_SIDE + COMPASS_SIDE},
    views={"front": mir("512,340 570,342 610,360 640,400 650,450 650,520 648,600 650,680 660,760 675,820 672,848 600,850 512,852"),
           "side": P("450,338 520,332 565,340 598,380 612,450 610,550 602,650 596,750 592,862 346,862 352,780 360,700 368,640 372,550 385,470 410,410 430,370")})
add(name="belt_compass", kind="one", axis="z", n=2.0, relief="none", smooth=2, lo_weight=0.8, nomask=["front", "side"],
    slab={"thick": 0.03, "dir": 1}, offset=[0.02, -0.02, 0.0], round_ends={"start": 0.01, "end": 0.01},
    views={"front": P("622,688 650,700 668,725 672,750 665,775 645,795 622,800 598,792 580,772 575,748 580,722 598,700"),
           "side": P("440,695 470,705 488,728 492,752 485,780 465,800 440,806 415,800 397,780 390,752 395,725 412,705")})
add(name="belt_pouch", kind="one", axis="z", n=3.0, relief="grain", smooth=2, lo_weight=0.5, nomask=["front", "side"],
    offset=[-0.02, -0.02, 0.0], round_ends={"start": 0.006, "end": 0.004}, paint_skip=["side"],
    views={"front": P("350,660 430,652 440,665 440,760 430,770 352,772 343,760 345,670"),
           "side": P("405,655 470,655 472,770 402,770")})
add(name="arm", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=1.8, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.012},
    views={"front": P("595,440 650,440 700,470 730,520 765,565 788,605 785,640 800,665 812,672 842,748 800,770 775,772 755,745 737,705 715,678 690,660 675,630 650,590 625,540 605,490"),
           "side": P("480,440 560,430 610,445 618,520 618,595 612,640 600,665 605,700 603,765 560,775 510,770 508,700 515,662 505,640 500,600 478,520")})
add(name="hand", kind="m", axis="z", n=2.3, relief="none", smooth=3, lo_weight=2.0, nomask=["front", "side"],
    round_ends={"start": 0.015, "end": 0.008}, paint_skip=["back"],
    paint_solid={"color": "#f2b076", "shade": 0.5},
    views={"front": P("785,762 835,748 860,790 887,835 890,875 880,898 865,895 850,870 835,855 825,850 815,820 800,790"),
           "side": P("512,762 598,762 594,820 588,860 575,895 560,905 545,895 538,860 520,850 498,845 495,820 505,790")})
# ---- legs and tall boots ------------------------------------------------------------------------
add(name="leg", kind="m", axis="z", n=2.2, relief="grain", smooth=5, lo_weight=0.8, nomask=["front", "side"],
    paint_box_skip={"side": ARM_SIDE},
    views={"front": P("515,780 640,780 672,850 680,900 678,960 680,1020 676,1070 668,1110 548,1110 540,1060 530,1000 522,940 515,880 510,830"),
           "side": P("390,780 590,780 575,850 563,920 566,1000 568,1060 565,1110 425,1110 420,1060 415,1000 405,940 395,880 385,830")})
add(name="boot", kind="m", axis="z", n=2.5, relief="grain", smooth=3, lo_weight=1.0, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.0},
    views={"front": P("545,1060 695,1060 702,1100 700,1150 678,1165 673,1230 680,1290 700,1320 725,1350 736,1380 736,1410 568,1410 563,1380 568,1340 572,1290 568,1230 560,1165 548,1150 542,1100"),
           "side": P("418,1065 582,1065 588,1110 585,1160 565,1175 558,1240 560,1300 572,1340 578,1380 580,1422 312,1422 310,1395 318,1370 345,1345 390,1325 430,1300 442,1240 438,1175 420,1160 414,1110")})

d = {"item": "oakley", "H": 1.85, "ring_ease": 0.35,
     "note": "Outlines in picture pixels of the source pictures (1024 x 1536). kind: c centred, m mirrored pair (traced on his left, +X), one single off-centre. Names follow the two-legged skeleton's words.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
