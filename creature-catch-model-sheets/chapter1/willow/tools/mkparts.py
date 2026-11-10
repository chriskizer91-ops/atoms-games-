"""Writes willow's parts.json (Elder Willow). Outlines are in picture pixels of the 1024 x 1536 source pictures.
kind: c centred, m mirrored pair (traced on his left, +X: image right in the front picture), one = single off-centre.
Part names carry the two-legged skeleton's words (BRIEF_PEOPLE.md + BRIEF_PEOPLE_2.md): the robe is `torso`
(above the waist) plus `skirt_robe` (below it); the beard is `beard` (head). Built the heroes' way
(../player-a/NOTES.md, ../player-b/NOTES.md): smooth hand-drawn outlines (nomask) for the big parts.
The top picture is another pose (seen at a slant, arms out), so no part prints from it."""
import json, sys
P = lambda s: [[int(a) for a in p.split(",")] for p in s.split()]
parts = []
def add(**k):
    k.setdefault("paint_skip", [])
    if "top" not in k["paint_skip"]:
        k["paint_skip"] = k["paint_skip"] + ["top"]
    parts.append(k)
def mir(s):  # right half of a centred front outline (top to bottom) -> closed symmetric outline
    pts = P(s)
    return pts + [[1024 - u, v] for u, v in pts[::-1] if u != 512]

# ---- head: the bald dome and the face -----------------------------------------------------------
add(name="head", kind="c", axis="z", n=2.2, relief="none", smooth=5, lo_weight=4.0, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.075},
    views={"front": mir("512,32 612,32 620,60 628,85 630,110 627,140 626,175 624,210 620,245 612,275 596,300 572,318 540,326 512,328"),
           "side": P("505,32 625,32 650,60 668,90 678,118 678,140 670,165 656,195 642,230 628,265 605,292 565,310 510,318 450,318 412,305 390,285 380,260 378,235 380,205 380,175 377,150 380,125 388,95 395,60 400,32")})
add(name="nose", kind="c", axis="z", n=2.0, relief="none", smooth=2, lo_weight=2.0, nomask=["front", "side"],
    round_ends={"start": 0.012, "end": 0.012},
    views={"front": P("490,205 500,195 513,192 527,195 538,205 541,220 535,234 520,241 506,241 492,234 487,220"),
           "side": P("340,207 350,196 368,192 386,196 400,205 402,225 398,236 370,241 350,238 340,226")})
add(name="ear", kind="m", axis="z", n=2.2, relief="none", smooth=2, lo_weight=3.0, k_scale=1.4, n_scale=1.4,
    round_ends={"start": 0.008, "end": 0.01}, paint_skip=["back", "side_far"],
    views={"front": P("606,202 630,193 650,200 660,220 660,250 652,272 635,282 616,278 606,255"),
           "side": P("510,195 530,186 552,190 565,210 566,240 558,265 540,278 520,276 508,255 505,225")})
# ---- white hair: a mane round the back and sides of the head, plus the two puffs above the ears -----
# The main mass is sliced upward; its front edge (side picture) sits behind the ears, so the face and
# ears stay clear. Its top is low enough to leave the bald crown bare from behind.
add(name="hair", kind="c", axis="z", n=2.2, relief="grain", smooth=8, lo_weight=2.2, nomask=["front", "side"],
    paint_color_skip=["skin"], round_ends={"start": 0.02, "end": 0.05},
    views={"front": mir("512,150 600,146 650,155 688,178 712,208 726,240 730,270 720,300 700,322 670,338 620,348 512,352"),
           "side": P("560,148 620,140 670,148 700,170 712,200 720,230 722,262 712,290 698,318 672,345 640,362 592,352 562,330 550,300 547,270 550,230 555,190")})
# the puff above each ear that curls up and out beside the bald dome (a mirrored pair)
add(name="hair_puff", kind="m", axis="z", n=2.0, relief="grain", smooth=4, lo_weight=1.6, nomask=["front", "side"],
    paint_color_skip=["skin"], round_ends={"start": 0.0, "end": 0.025},
    views={"front": P("598,150 605,115 625,90 650,80 675,85 695,100 706,125 708,160 700,200 680,235 640,240 608,225"),
           "side": P("494,122 520,102 560,92 610,92 650,100 675,120 685,150 690,190 680,240 600,240 578,215 560,185 520,165")})
# ---- the beard (moustache included): hangs from the cheeks to a point on the chest ----------------
add(name="beard", kind="c", axis="z", n=2.2, relief="grain", smooth=6, lo_weight=2.6, nomask=["front", "side"],
    round_ends={"start": 0.03, "end": 0.01},
    views={"front": mir("512,232 560,231 600,237 625,250 633,270 628,295 618,330 605,370 592,410 578,450 562,495 545,540 528,575 512,592"),
           "side": P("345,234 400,226 460,232 505,250 520,280 518,320 495,350 465,380 440,420 415,460 395,500 380,540 365,575 345,592 330,570 322,530 318,480 317,430 318,380 320,330 326,290 333,258")})
add(name="neck", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=0.4, nomask=["front", "side"],
    views={"front": P("468,285 556,285 558,348 466,348"),
           "side": P("440,282 518,282 520,348 445,348")})
# ---- robe: torso (above the waist), sleeves (arms), skirt_robe (below the waist) -------------------
add(name="torso", kind="c", axis="z", n=2.4, relief="grain", smooth=6, lo_weight=1.0, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.03},
    paint_box_skip={"side": [[455, 630, 662, 905]]},
    views={"front": mir("512,318 570,320 612,332 645,352 668,380 678,420 678,470 672,530 667,600 668,665"),
           "side": P("470,318 540,315 610,321 645,336 660,370 665,420 664,480 660,540 652,600 646,665 346,665 350,600 362,540 382,480 410,420 440,370 455,336")})
add(name="arm", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=1.6, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.012},
    views={"front": P("600,345 645,348 690,400 725,480 760,525 795,565 830,610 852,648 876,688 860,725 820,742 790,760 750,786 727,745 712,700 695,650 678,610 662,575 640,520 620,460 605,400"),
           "side": P("470,380 520,370 590,372 630,385 645,420 650,500 652,580 650,640 655,700 645,745 610,762 560,766 500,760 470,745 462,700 465,640 462,560 460,480 462,420")})
add(name="hand", kind="m", axis="z", n=2.3, relief="none", smooth=3, lo_weight=2.2, nomask=["front", "side"],
    round_ends={"start": 0.015, "end": 0.008},
    views={"front": P("790,722 855,705 880,760 910,810 927,860 925,895 910,910 895,905 880,880 860,860 845,855 832,825 810,770"),
           "side": P("498,690 597,690 600,740 597,800 590,850 575,885 555,898 535,890 520,862 505,842 484,836 481,810 492,770 495,730")})
add(name="skirt_robe", kind="c", axis="z", n=2.2, relief="grain", smooth=6, lo_weight=0.9, nomask=["front", "side"],
    round_ends={"start": 0.008, "end": 0.0},
    paint_box_skip={"side": [[455, 630, 662, 905]]},
    views={"front": mir("512,630 668,630 683,700 705,800 731,920 746,1000 766,1100 786,1200 806,1300 812,1330 800,1350 760,1362 700,1368 512,1372"),
           "side": P("348,630 645,630 658,700 675,800 692,900 709,1000 726,1100 743,1200 762,1300 768,1330 760,1345 700,1352 600,1356 480,1360 360,1360 310,1350 300,1320 304,1250 309,1200 318,1100 326,1000 333,900 334,800 340,700")})
# ---- legs (short hidden stubs under the robe, for the walk) and boots ------------------------------
add(name="leg", kind="m", axis="z", n=2.2, relief="grain", smooth=3, lo_weight=0.3, nomask=["front", "side"],
    views={"front": P("600,1150 700,1150 705,1300 702,1388 600,1388 596,1300"),
           "side": P("440,1150 580,1150 585,1388 432,1388")})
add(name="boot", kind="m", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=1.0,
    round_ends={"start": 0.0, "end": 0.0},
    views={"front": P("580,1355 740,1355 755,1380 762,1420 762,1457 578,1457 576,1420 580,1390"),
           "side": P("360,1348 630,1348 636,1380 638,1420 636,1452 305,1452 303,1420 312,1395 330,1372")})

d = {"item": "willow", "H": 1.6, "ring_ease": 0.35,
     "note": "Outlines in picture pixels of the source pictures (1024 x 1536). kind: c centred, m mirrored pair (traced on his left, +X), one single off-centre. Names follow the two-legged skeleton's words.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
