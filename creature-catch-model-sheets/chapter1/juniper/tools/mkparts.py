"""Writes juniper's parts.json (Juniper, the rival kid). Outlines are in picture pixels of the 1024 x 1536 source pictures.
kind: c centred, m mirrored pair (traced on his left, +X: image right in the front picture), one = single off-centre.
Part names carry the two-legged skeleton's words (BRIEF_PEOPLE.md + BRIEF_PEOPLE_2.md): `collar_scarf` and
`collar_scarf_tail` ride the upper chest, `hips_cube` (the capture cube on his left hip) the hips.
Built the heroes' way (../player-a/NOTES.md, ../player-b/NOTES.md): smooth hand-drawn outlines (nomask); the
spiky hair is one upward-sliced mass through the spikes' bases, a fringe, the big top spike and two locks.
The top picture is another pose (arms out), so no part prints from it."""
import json, sys
P = lambda s: [[int(a) for a in p.split(",")] for p in s.split()]
parts = []
def add(**k):
    k.setdefault("paint_skip", [])
    if "top" not in k["paint_skip"]:
        k["paint_skip"] = k["paint_skip"] + ["top"]
    parts.append(k)
UC = 509  # the front picture's centre line
def mir(s):  # right half of a centred front outline (top to bottom) -> closed symmetric outline
    pts = P(s)
    return pts + [[round(2 * UC - u), v] for u, v in pts[::-1] if u != UC]

CUBE_SIDE = [[372, 692, 480, 795]]   # the cube in the side picture (printed mirrored on the right hip otherwise)
CUBE_BACK = [[342, 692, 438, 798]]   # the cube in the back picture (on the back of the left hip there)
HAND_SIDE = [[476, 770, 582, 952]]   # the side picture's hand hangs in front of the hip and thigh
TAIL_SIDE = [[598, 455, 742, 770]]   # the scarf's tail behind the back in the side picture
# ---- head, ears ---------------------------------------------------------------------------------
add(name="head", kind="c", axis="z", n=2.2, relief="none", smooth=5, lo_weight=4.0, nomask=["front", "side"],
    round_ends={"start": 0.025, "end": 0.05}, paint_skip=["back"],
    views={"front": mir("509,105 548,108 578,125 592,160 596,200 595,240 593,275 590,305 582,335 566,362 540,385 509,394"),
           "side": P("470,100 535,100 575,118 594,158 598,210 594,260 584,300 566,335 545,365 515,385 470,395 430,398 415,392 408,370 403,350 398,335 390,325 388,315 395,300 405,280 410,250 412,220 420,180 435,140 450,115")})
add(name="ear", kind="m", axis="z", n=2.2, relief="none", smooth=2, lo_weight=3.0, k_scale=1.4, n_scale=1.4,
    round_ends={"start": 0.008, "end": 0.01}, paint_skip=["back", "side_far"],
    views={"front": P("592,285 612,280 630,290 636,312 630,334 614,344 597,338 590,312"),
           "side": P("518,280 538,274 556,282 566,302 564,326 552,342 532,346 518,334 514,308")})
# ---- spiky red hair: one mass sliced upward through the spikes' bases, its front edge (side picture)
# stepping back from the forehead to behind the ears; a fringe; the big top spike; a lock at each temple
add(name="hair", kind="c", axis="z", n=2.2, relief="grain", smooth=8, lo_weight=2.4, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.05},
    views={"front": mir("509,70 570,78 615,98 648,125 672,158 688,195 692,235 686,270 670,305 645,335 618,360 509,368"),
           "side": P("430,90 500,66 575,68 640,92 680,128 705,170 720,215 718,260 702,300 675,338 640,364 600,382 572,380 570,345 572,300 568,276 530,262 485,252 455,232 430,200 415,160 418,120")})
add(name="hair_bangs", kind="c", axis="z", n=2.0, relief="grain", smooth=4, lo_weight=2.4, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.0}, paint_skip=["back"],
    views={"front": mir("509,140 560,145 588,162 596,200 592,232 578,252 556,262 530,280 509,284"),
           "side": P("402,150 428,135 465,140 470,200 467,250 460,286 446,286 428,268 412,240 404,205")})
add(name="hair_spike", kind="one", axis="z", n=2.0, relief="grain", smooth=3, lo_weight=2.5, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.012}, paint_skip=["back"],
    views={"front": P("440,28 475,32 510,45 540,62 558,85 565,115 478,115 482,90 472,62 455,42"),
           "side": P("452,22 485,26 520,42 548,62 565,85 575,115 495,115 498,90 488,62 470,38")})
add(name="hair_lock", kind="m", axis="z", n=2.0, relief="grain", smooth=3, lo_weight=1.8, nomask=["front", "side"],
    round_ends={"start": 0.004, "end": 0.0},
    views={"front": P("586,258 616,258 623,300 619,340 610,372 600,350 591,310"),
           "side": P("466,256 514,256 514,300 506,340 496,372 486,350 471,300")})
add(name="neck", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=0.4, nomask=["front", "side"],
    views={"front": P("468,365 550,365 552,432 466,432"),
           "side": P("448,365 530,365 532,432 452,432")})
# ---- scarf, jacket (torso), belt cube, arms -----------------------------------------------------
add(name="collar_scarf", kind="c", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=1.0, nomask=["front", "side"],
    round_ends={"start": 0.012, "end": 0.01},
    views={"front": mir("509,376 580,378 625,390 640,414 633,450 509,458"),
           "side": P("410,394 470,380 560,378 620,386 640,410 632,442 600,470 500,472 420,466 400,440")})
# the tail hanging down his back on the right; a thin turned blade (slab) so it lies out from the back
add(name="collar_scarf_tail", kind="one", axis="z", n=2.0, relief="grain", smooth=4, lo_weight=0.8, nomask=["back", "side"],
    slab={"thick": 0.025, "dir": -1}, round_ends={"start": 0.006, "end": 0.0}, order=["back", "side"],
    views={"back": P("546,470 600,468 640,555 660,648 662,702 640,692 600,640 560,560"),
           "side": P("600,468 640,498 690,558 720,620 735,680 722,745 702,760 690,720 662,650 632,590 600,540")})
add(name="torso", kind="c", axis="z", n=2.3, relief="grain", smooth=6, lo_weight=1.0, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.03},
    paint_box_skip={"side": CUBE_SIDE + TAIL_SIDE, "back": CUBE_BACK},
    views={"front": mir("509,420 565,424 600,438 620,465 628,510 630,560 630,610 632,660 642,715"),
           "side": P("450,420 540,415 598,425 618,452 622,500 602,540 596,600 596,660 590,715 395,715 385,660 390,600 400,540 405,480 415,440")})
add(name="hips", kind="c", axis="z", n=2.3, relief="grain", smooth=5, lo_weight=0.8, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.0},
    paint_box_skip={"side": CUBE_SIDE + HAND_SIDE, "back": CUBE_BACK},
    views={"front": mir("509,700 640,700 655,740 660,790 662,840 665,870 509,876"),
           "side": P("398,700 575,700 578,760 578,820 575,872 405,872 400,820 398,760")})
add(name="hips_cube", kind="one", axis="z", n=3.5, relief="none", smooth=1, lo_weight=1.0, n_scale=1.5,
    nomask=["front", "side"], offset=[0.015, -0.015, 0.0], round_ends={"start": 0.0, "end": 0.0},
    views={"front": P("580,705 645,705 657,718 657,755 645,766 580,766 572,755 572,718"),
           "side": P("386,700 462,700 472,712 472,775 462,787 386,787 378,775 378,712")})
add(name="arm", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=1.6, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.012},
    views={"front": P("600,445 630,455 656,480 669,500 680,520 694,540 716,560 730,580 745,600 760,620 772,640 776,680 790,705 812,740 830,770 773,790 760,765 740,735 715,710 690,695 668,680 652,650 640,610 625,560 610,510"),
           "side": P("470,440 545,430 595,445 605,500 605,560 600,615 598,665 580,690 575,740 572,785 508,785 505,740 505,695 478,680 470,640 468,580 466,520")})
add(name="hand", kind="m", axis="z", n=2.3, relief="none", smooth=3, lo_weight=2.0, nomask=["front", "side"],
    round_ends={"start": 0.015, "end": 0.008},
    views={"front": P("773,778 835,770 850,800 862,830 872,860 878,885 870,902 855,900 845,880 830,870 815,865 800,850 785,820"),
           "side": P("505,780 575,780 572,830 568,880 560,920 545,940 530,945 515,930 505,900 492,895 480,880 482,840 495,810")})
# ---- baggy trousers (legs) and sneakers ---------------------------------------------------------
add(name="leg", kind="m", axis="z", n=2.2, relief="grain", smooth=6, lo_weight=0.9, nomask=["front", "side"],
    paint_box_skip={"side": CUBE_SIDE + HAND_SIDE, "back": CUBE_BACK},
    views={"front": P("512,770 655,770 665,840 676,900 680,980 692,1040 702,1080 712,1130 726,1180 740,1230 740,1290 588,1290 576,1240 580,1200 566,1120 562,1060 548,1000 535,940 525,880 512,830"),
           "side": P("395,770 585,770 578,850 572,950 574,1000 596,1060 592,1120 600,1180 612,1240 602,1290 440,1290 430,1240 425,1180 432,1100 432,1060 415,1000 408,920 400,850")})
add(name="shoe", kind="m", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=1.0, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.0},
    views={"front": P("600,1285 735,1285 750,1330 775,1370 790,1400 797,1430 797,1472 600,1472 597,1430 597,1380 602,1330"),
           "side": P("440,1285 610,1285 612,1340 616,1380 620,1420 620,1468 318,1468 318,1420 330,1395 360,1365 405,1340 432,1315")})

d = {"item": "juniper", "H": 1.55, "ring_ease": 0.35,
     "note": "Outlines in picture pixels of the source pictures (1024 x 1536). kind: c centred, m mirrored pair (traced on his left, +X), one single off-centre. Names follow the two-legged skeleton's words.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
