"""Writes bramble's parts.json (Farmer Bramble). Outlines are in picture pixels of the 1024 x 1536 source pictures.
kind: c centred, m mirrored pair (traced on his left, +X: image right in the front picture), one = single off-centre.
Part names carry the two-legged skeleton's words (BRIEF_PEOPLE.md + BRIEF_PEOPLE_2.md): `hat`/`hat_brim`,
`moustache` and `nose` move with the head, `collar_bandana`/`collar_knot` with the upper chest, the overalls bib is
paint on the `torso`, the overalls below the waist are `hips` + `leg_L/R`. Built the heroes' way
(../player-a/NOTES.md, ../player-b/NOTES.md): smooth hand-drawn outlines (nomask).
The top picture is another pose (arms out), so only the hat prints from it (its scale is set to the brim)."""
import json, sys, math
P = lambda s: [[int(a) for a in p.split(",")] for p in s.split()]
parts = []
def add(**k):
    k.setdefault("paint_skip", [])
    if not k["name"].startswith("hat") and "top" not in k["paint_skip"]:
        k["paint_skip"] = k["paint_skip"] + ["top"]
    parts.append(k)
UC = 511.5  # the front picture's centre line
def mir(s):  # right half of a centred front outline (top to bottom) -> closed symmetric outline
    pts = P(s)
    return pts + [[round(2 * UC - u), v] for u, v in pts[::-1] if u != 512]
# top picture mapping (set by redo_views.sh so its round brim matches the front and side): metres -> pixels
TUC, TVC, TSX, TSY = 622, 602, 860, 914
def circle_top(cx, cy, rx, ry, n=28):
    return [[round(cx + rx * math.cos(2 * math.pi * i / n)), round(cy + ry * math.sin(2 * math.pi * i / n))] for i in range(n)]

ARM_SIDE = [[405, 640, 622, 972]]
# ---- head, nose, moustache, ears, hair ---------------------------------------------------------
add(name="head", kind="c", axis="z", n=2.2, relief="none", smooth=5, lo_weight=4.6, nomask=["front", "side"],
    round_ends={"start": 0.03, "end": 0.04},
    views={"front": mir("512,70 560,72 595,90 610,130 612,180 612,230 610,270 605,305 595,335 575,362 545,382 512,390"),
           "side": P("450,75 530,72 580,92 605,135 612,200 610,260 600,310 582,350 555,378 510,396 460,402 400,405 368,400 348,380 340,355 342,335 350,310 356,290 360,260 365,230 372,200 382,160 400,115 420,90")})
add(name="nose", kind="c", axis="z", n=2.0, relief="none", smooth=2, lo_weight=1.6, nomask=["front", "side"],
    round_ends={"start": 0.015, "end": 0.015},
    views={"front": P("495,248 512,243 530,248 543,262 545,280 535,294 512,298 489,294 479,280 481,262"),
           "side": P("330,255 348,247 370,250 392,262 395,282 380,298 350,300 330,292 321,275")})
add(name="moustache", kind="c", axis="z", n=2.0, relief="grain", smooth=2, lo_weight=4.0, k_scale=1.5, n_scale=1.6, nomask=["front", "side"],
    round_ends={"start": 0.008, "end": 0.006},
    views={"front": mir("512,284 545,279 578,282 598,292 604,306 598,321 582,331 555,329 530,320 512,319"),
           "side": P("318,292 360,285 405,288 445,298 448,322 425,334 380,337 340,334 318,320")})
add(name="ear", kind="m", axis="z", n=2.2, relief="none", smooth=2, lo_weight=2.6, k_scale=1.4, n_scale=1.4,
    round_ends={"start": 0.008, "end": 0.01}, paint_skip=["back", "side_far"],
    views={"front": P("603,262 625,258 645,268 652,290 648,315 632,330 612,328 602,305"),
           "side": P("500,268 520,258 545,262 560,285 560,315 548,335 525,342 505,335 495,310 494,285")})
# curly brown hair under the hat: sliced upward, its front edge (side picture) steps back from the
# temple to behind the ear so the face and ears stay clear
add(name="hair", kind="c", axis="z", n=2.2, relief="grain", smooth=6, lo_weight=2.0, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.0},
    views={"front": mir("512,150 600,150 640,165 665,200 672,240 670,280 660,320 645,350 630,385 512,390"),
           "side": P("450,150 560,145 630,160 655,200 662,250 660,300 645,340 620,370 585,386 556,380 562,340 565,300 560,268 520,256 470,250 445,225 440,190")})
add(name="neck", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=0.4, nomask=["front", "side"],
    views={"front": P("440,360 584,360 586,430 438,430"),
           "side": P("405,360 560,360 565,430 410,430")})
# ---- the straw hat: crown, and a tilted brim sliced front to back (its sides droop) ------------
add(name="hat", kind="c", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=1.8, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.04},
    views={"front": mir("512,34 552,38 590,52 615,75 632,100 640,125 642,160 640,262"),
           "side": P("495,30 560,28 620,45 665,75 695,110 705,160 700,215 692,250 560,220 450,172 425,130 432,95 455,60")})
add(name="hat_brim", kind="c", axis="y", n=2.0, relief="grain", smooth=3, lo_weight=1.4, nomask=["side", "top"],
    round_ends={"start": 0.0, "end": 0.0}, droop={"axis": "x", "w": 0.34, "dz": 0.045}, paint_color_skip=["red"],
    views={"side": P("262,130 300,108 400,122 500,160 600,205 700,262 750,300 762,322 745,352 700,330 600,282 500,236 400,198 320,180 272,165"),
           "top": circle_top(TUC, TVC, 292, 282)})
# ---- bandana, torso (shirt + overalls bib), arms ------------------------------------------------
add(name="collar_bandana", kind="c", axis="z", n=2.2, relief="grain", smooth=3, lo_weight=0.9, nomask=["front", "side"],
    round_ends={"start": 0.01, "end": 0.0},
    views={"front": mir("512,366 600,366 650,380 670,410 664,442 512,446"),
           "side": P("390,380 500,372 620,376 668,396 676,420 655,446 500,452 362,452 342,432 352,402")})
add(name="collar_knot", kind="one", axis="z", n=2.0, relief="grain", smooth=3, lo_weight=0.6, nomask=["front", "side"],
    round_ends={"start": 0.01, "end": 0.01},
    views={"front": P("632,372 680,352 735,345 728,372 700,385 735,425 728,440 690,425 650,410"),
           "side": P("600,385 640,378 700,385 706,405 690,420 660,432 610,430 596,410")})
add(name="torso", kind="c", axis="z", n=2.3, relief="grain", smooth=7, lo_weight=1.1, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.03},
    paint_box_skip={"side": ARM_SIDE},
    views={"front": mir("512,380 585,383 640,400 680,430 700,470 705,520 700,580 692,640 686,680 690,720 700,760 705,790"),
           "side": P("420,380 520,375 600,385 640,410 655,450 655,500 640,550 636,600 622,660 618,700 630,740 640,790 304,790 288,740 287,700 292,650 305,600 318,540 330,490 350,440 380,400")})
add(name="arm", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=1.6, nomask=["front", "side"], paint_color_skip=["blue"],
    round_ends={"start": 0.0, "end": 0.015},
    views={"front": P("640,440 700,445 745,468 775,498 805,532 835,568 852,605 850,645 866,665 885,700 905,735 925,762 880,782 840,785 818,762 790,730 760,705 730,690 707,662 690,630 670,570 650,500"),
           "side": P("420,445 520,435 590,450 612,500 615,560 610,620 600,670 575,690 575,760 568,790 450,790 445,700 420,680 395,640 380,580 378,520 390,475")})
add(name="hand", kind="m", axis="z", n=2.3, relief="none", smooth=3, lo_weight=2.0, nomask=["front", "side"],
    round_ends={"start": 0.018, "end": 0.008},
    views={"front": P("822,765 925,758 945,800 957,840 963,880 958,910 945,935 925,930 912,915 895,890 880,880 860,875 848,850 832,810"),
           "side": P("452,782 570,782 560,840 555,900 540,940 510,965 490,960 475,930 440,905 418,895 415,860 430,820")})
# ---- overalls below the waist (hips + legs) and big boots ---------------------------------------
add(name="hips", kind="c", axis="z", n=2.4, relief="grain", smooth=5, lo_weight=0.8, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.0},
    paint_box_skip={"side": ARM_SIDE},
    views={"front": mir("512,740 700,740 722,800 730,860 734,900 728,925 512,932"),
           "side": P("300,740 635,740 641,800 635,860 622,925 335,930 318,860 305,800")})
add(name="leg", kind="m", axis="z", n=2.3, relief="grain", smooth=6, lo_weight=1.0, nomask=["front", "side"],
    paint_box_skip={"side": ARM_SIDE},
    views={"front": P("515,800 700,800 728,860 735,920 732,980 742,1030 760,1070 752,1120 765,1160 755,1210 745,1240 560,1240 552,1200 545,1150 540,1100 548,1060 540,1000 525,950 512,900"),
           "side": P("330,800 630,800 622,880 614,960 617,1020 618,1100 624,1160 622,1240 380,1240 372,1200 368,1100 360,1040 345,1000 338,940 330,880")})
add(name="boot", kind="m", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=1.0, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.0},
    views={"front": P("568,1225 740,1225 745,1280 742,1320 770,1340 795,1370 800,1410 798,1447 566,1447 566,1400 575,1340 582,1290"),
           "side": P("400,1225 602,1225 600,1300 606,1340 612,1380 620,1420 618,1448 288,1448 286,1405 296,1360 320,1330 360,1312 388,1295 395,1260")})

d = {"item": "bramble", "H": 1.75, "ring_ease": 0.35,
     "note": "Outlines in picture pixels of the source pictures (1024 x 1536). kind: c centred, m mirrored pair (traced on his left, +X), one single off-centre. Names follow the two-legged skeleton's words.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
