"""Writes hazel's parts.json (Hazel, the healer). Outlines are in picture pixels of the 1024 x 1536 source pictures.
kind: c centred, m mirrored pair (traced on her left, +X: image right in the front picture, image LEFT in the back
picture), one = single part. Part names carry the two-legged skeleton's words (BRIEF_PEOPLE.md + BRIEF_PEOPLE_2.md).
Built like Rosa (../rosa/tools/mkparts.py) and the heroes: smooth hand-drawn outlines (nomask). The dress is split at
the waist: `torso` above, `skirt` below (the apron and the petticoat ruffle below the waist are paint on the skirt; the
apron's bow at the back is `skirt_bow` + `skirt_bow_tail`). The long back hair is `ponytail_long` so it sways; the pink
bow on it is `hair_bow` + `hair_bow_tail` (head). The satchel is `satchel` (hips); its strap is paint."""
import json, sys
P = lambda s: [[int(a) for a in p.split(",")] for p in s.split()]
parts = []
def add(**k):
    parts.append(k)
# top picture mapping (set by redo_views.sh) for drawn top outlines: metres -> top picture pixels
TUC, TVC, TSX, TSY = 632, 552, 880, 880
def top(pts):
    return P(" ".join(f"{round(TUC - x * TSX)},{round(TVC + y * TSY)}" for x, y in pts))
def band(rows):  # rows of (x, y_front, y_back) -> top outline of a band running side to side
    return [(x, f) for x, f, b in rows] + [(x, b) for x, f, b in rows[::-1]]
HAIR_SKIP = ["skin", "pink", "cream"]
# the front picture draws the pink bow at her right temple (the side and back pictures put it at the back of the head)
BOW_BOX = [[280, 105, 380, 305]]

# ---- head ------------------------------------------------------------------------------------
add(name="head", kind="c", axis="z", n=2.2, relief="none", smooth=5, lo_weight=5.0, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.05}, paint_skip=["top", "back"],
    paint_box_skip={"side": [[296, 50, 371, 205], [322, 258, 372, 338]]},
    views={"front": P("512,88 560,95 598,120 615,160 620,205 619,240 610,265 592,285 565,298 512,305 459,298 432,285 414,265 405,240 404,205 409,160 426,120 464,95"),
           "side": P("410,85 470,70 525,78 560,105 578,150 580,205 572,255 552,290 520,310 480,316 440,312 405,306 386,298 374,285 366,265 360,250 354,238 356,222 360,200 363,175 366,150 375,120 390,98")})
add(name="ear", kind="m", axis="z", n=2.2, relief="none", smooth=2, lo_weight=1.6, k_scale=1.6, n_scale=1.6,
    round_ends={"start": 0.008, "end": 0.01}, paint_skip=["top", "back", "side_far"], paint_color_skip=["hairbrown"],
    views={"front": P("608,205 628,203 640,220 640,245 630,262 612,262"),
           "side": P("482,207 505,203 520,215 523,240 515,262 498,268 484,258 479,232")})
# main hair on the head: sliced upward; its front edge (side picture) steps back from the forehead to behind the ear
add(name="hair", kind="c", paint_color_skip=HAIR_SKIP, axis="z", n=2.2, relief="grain", smooth=8, lo_weight=2.4, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.04}, paint_skip=["back"],
    paint_box_skip={"front": BOW_BOX, "top": [[300, 250, 950, 398]]},
    views={"front": P("512,28 560,32 600,50 630,80 650,115 660,150 665,190 666,230 664,270 658,305 512,312 366,305 360,270 358,230 359,190 364,150 374,115 394,80 424,50 464,32"),
           "side": P("500,22 560,28 610,50 640,90 650,140 648,200 640,260 630,310 600,332 530,332 522,300 524,250 515,224 486,212 460,195 440,170 412,142 386,118 370,95 375,68 400,45 450,28")})
# the centre-parted fringe: a band that wraps around the forehead from temple to temple, sliced side to side (axis x)
add(name="hair_bangs", kind="one", paint_color_skip=HAIR_SKIP, axis="x", n=2.0, relief="grain", smooth=3, lo_weight=2.4,
    nomask=["front", "top"], round_ends={"start": 0.012, "end": 0.012}, paint_skip=["top", "back"], paint_box_skip={"front": BOW_BOX},
    views={"front": P("366,200 376,150 400,105 440,75 490,62 540,65 590,85 630,120 655,165 662,215 660,252 "
                      "630,252 620,215 606,170 582,135 545,112 505,102 478,108 452,128 430,158 414,195 405,252 370,252"),
           "top": top(band([(-0.17, -0.06, 0.01), (-0.15, -0.085, -0.01), (-0.12, -0.115, -0.04), (-0.10, -0.135, -0.06), (-0.07, -0.158, -0.085),
                             (-0.03, -0.172, -0.10), (0.0, -0.175, -0.105), (0.03, -0.172, -0.10), (0.07, -0.158, -0.085), (0.10, -0.135, -0.06),
                             (0.12, -0.115, -0.04), (0.15, -0.085, -0.01), (0.17, -0.06, 0.01)]))})
# the wavy locks hanging beside each cheek, in front of the ear (a mirrored pair). The side picture draws them far in
# front of the face; they are kept against the cheek (front picture's widths)
add(name="hair_lock", kind="m", paint_color_skip=HAIR_SKIP, axis="z", n=2.0, relief="grain", smooth=3, lo_weight=1.8, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.012}, paint_skip=["top", "back"], paint_box_skip={"front": BOW_BOX},
    views={"front": P("602,150 630,140 655,165 665,210 668,260 662,300 650,335 632,346 618,330 612,290 610,250 605,200"),
           "side": P("420,180 470,190 478,230 475,280 466,330 450,348 430,340 418,300 410,250 408,210")})
# the long hair down her back: its own part so it sways (a two-bone chain hanging from the head)
add(name="ponytail_long", kind="c", paint_color_skip=HAIR_SKIP + ["green"], axis="z", n=2.2, relief="grain", smooth=8, lo_weight=2.0, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.03}, paint_skip=["top"], paint_box_skip={"front": BOW_BOX},
    views={"front": P("512,225 600,226 645,240 664,280 690,330 718,400 732,480 722,550 690,600 620,632 512,640 404,632 334,600 302,550 292,480 306,400 334,330 360,280 379,240 424,226"),
           "side": P("540,225 600,222 640,250 670,300 698,360 720,430 728,480 720,540 700,585 650,603 580,603 545,590 522,560 517,500 520,430 530,360 532,300")},
    order=["front", "side"])
# the pink bow on the back of the head (loops and knot), and its two tails
add(name="hair_bow", kind="c", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=1.0, nomask=["back", "side"],
    round_ends={"start": 0.012, "end": 0.012}, paint_skip=["front", "top"], order=["back", "side"],
    views={"back": P("410,178 440,166 490,170 512,168 535,170 585,166 615,178 613,220 596,250 560,246 530,216 512,212 494,216 464,246 428,250 409,222"),
           "side": P("622,140 650,122 690,120 706,140 706,190 690,216 650,224 622,212")})
add(name="hair_bow_tail", kind="m", axis="z", n=2.4, relief="grain", smooth=3, lo_weight=0.6, nomask=["back", "side"],
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["front", "top"], order=["back", "side"],
    views={"back": P("497,212 513,214 506,262 484,322 470,386 455,386 420,362 455,302 480,250"),
           "side": P("632,214 666,214 702,262 730,310 736,386 712,386 690,322 650,264")})
# ---- neck, torso (bodice with the white collar, as paint) -----------------------------------
add(name="neck", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=0.5, paint_skip=["top", "back"], paint_color_skip=["hairbrown"],
    views={"front": P("472,262 553,262 556,362 469,362"),
           "side": P("418,262 492,262 496,362 416,362")})
add(name="torso", kind="c", axis="z", n=2.6, relief="grain", smooth=6, lo_weight=1.1, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.03}, paint_skip=["top"],
    views={"front": P("420,352 465,342 512,340 560,342 605,352 618,372 615,420 612,480 610,540 608,610 416,610 414,540 412,480 409,420 406,372"),
           "side": P("420,336 480,332 515,345 528,380 530,450 527,520 522,610 385,610 378,560 370,500 368,450 375,400 395,358")})
# ---- arms (puffed sleeve + forearm in one part) and hands ------------------------------------
add(name="arm", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=2.0, nomask=["front", "side"],
    round_ends={"start": 0.015, "end": 0.0}, paint_skip=["top"],
    views={"front": P("600,425 640,432 680,450 715,475 732,505 738,540 742,556 775,620 805,670 830,698 830,708 778,712 777,698 730,636 685,593 668,585 640,575 620,550 606,505 600,470"),
           "side": P("440,430 500,428 532,445 542,480 540,520 528,555 506,572 505,702 432,702 433,576 418,556 408,520 410,470 420,445")})
add(name="hand", kind="m", axis="z", n=2.3, relief="none", smooth=3, lo_weight=2.2, nomask=["front", "side"],
    round_ends={"start": 0.008, "end": 0.02}, paint_skip=["top"],
    views={"front": P("778,700 828,693 850,730 868,775 876,808 870,825 858,830 845,815 835,800 822,795 808,785 792,768 782,740"),
           "side": P("430,690 500,690 508,740 505,800 495,836 475,846 450,838 425,800 420,745")})
# ---- below the waist: skirt (dress + apron + petticoat), the apron's bow, satchel, legs, shoes ---
add(name="skirt", kind="c", axis="z", n=2.2, relief="grain", smooth=6, lo_weight=1.1, nomask=["front", "side"],
    round_ends={"start": 0.012, "end": 0.0}, paint_skip=["top"],
    paint_box_skip={"side": [[415, 560, 512, 852], [520, 590, 665, 925], [285, 585, 470, 855], [244, 850, 372, 1000]],
                    "front": [[548, 570, 742, 846]], "back": [[262, 660, 405, 840]]},
    views={"front": P("440,572 585,572 620,620 660,700 700,790 740,880 775,960 795,1010 800,1045 780,1075 700,1095 512,1102 324,1095 244,1075 224,1045 229,1010 249,960 284,880 324,790 364,700 404,620"),
           "side": P("380,575 522,575 545,640 570,720 600,800 630,880 655,960 668,1010 672,1050 660,1080 600,1095 450,1100 300,1095 252,1080 246,1050 250,1010 253,985 262,930 285,860 310,790 335,710 358,640")})
add(name="skirt_bow", kind="c", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=0.9, nomask=["back", "side"],
    round_ends={"start": 0.012, "end": 0.012}, paint_skip=["front", "top"], order=["back", "side"],
    views={"back": P("412,632 440,618 495,624 520,622 545,624 595,618 610,632 606,690 590,738 560,735 535,690 520,684 505,690 480,735 430,738 414,690"),
           "side": P("512,590 552,590 565,610 568,650 560,690 540,700 512,700")})
add(name="skirt_bow_tail", kind="m", axis="z", n=2.4, relief="grain", smooth=3, lo_weight=0.6, nomask=["back", "side"],
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["front", "top"], order=["back", "side"],
    views={"back": P("500,672 516,672 508,740 495,810 480,915 470,918 396,905 410,840 440,760 478,700"),
           "side": P("530,665 560,665 600,750 632,830 656,912 636,918 612,850 580,770 545,705")})
# the satchel on her left hip (the leaves and the flower poking out of it are paint on a rounded top)
add(name="satchel", kind="one", axis="z", n=3.2, relief="grain", smooth=3, lo_weight=1.2, nomask=["front", "side"],
    round_ends={"start": 0.01, "end": 0.03}, paint_skip=["top", "back"],
    paint_box_skip={"side": [[416, 685, 512, 852]]},
    views={"front": P("562,600 600,578 650,590 700,612 712,660 730,690 738,760 735,815 720,838 600,842 572,830 560,780 557,700"),
           "side": P("330,600 370,586 420,600 445,650 458,690 463,760 458,820 440,848 312,850 294,830 292,760 300,700 318,650")})
add(name="leg", kind="m", axis="z", n=2.2, relief="grain", smooth=5, lo_weight=0.35, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    paint_box_skip={"front": [[540, 1040, 670, 1102], [354, 1040, 484, 1102]], "back": [[540, 1040, 670, 1102], [354, 1040, 484, 1102]]},
    views={"front": P("520,700 610,700 640,850 655,1000 656,1100 652,1200 648,1352 560,1352 557,1200 555,1100 545,1000 530,850"),
           "side": P("440,700 565,700 560,850 550,1000 548,1100 545,1200 542,1415 450,1415 443,1200 438,1100 437,1000 440,850")})
add(name="shoe", kind="m", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=1.6,
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    views={"front": P("575,1340 680,1338 690,1360 695,1400 696,1440 695,1472 566,1472 564,1440 566,1395 570,1360"),
           "side": P("450,1352 545,1345 560,1355 568,1400 570,1468 335,1468 330,1440 338,1415 365,1395 410,1380 440,1365")})

d = {"item": "hazel", "H": 1.62, "ring_ease": 0.35,
     "note": "Outlines in picture pixels of the source pictures (1024 x 1536). kind: c centred, m mirrored pair (traced on her left, +X), one single part. Names follow the two-legged skeleton's words (skirt = dress/apron below the waist, ponytail_long = the long back hair).",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
