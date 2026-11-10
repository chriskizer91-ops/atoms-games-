"""Writes Wormapple's parts.json (outlines in picture pixels of the source pictures, 1254 x 1254).

usage: python3 -I mkparts.py parts.json
"""
import json
import math
import sys


def circle(cx, cy, r, ry=None, n=32):
    ry = ry or r
    return [[round(cx + r * math.cos(2 * math.pi * k / n), 1), round(cy + ry * math.sin(2 * math.pi * k / n), 1)]
            for k in range(n)]


def P(s):
    return [[float(a) for a in p.split(",")] for p in s.split()]


parts = []
# ---- the apple (body): one round solid sliced upward; the hole and the stem dimple are paint only
apple_front = P("390,338 480,318 560,330 620,345 700,315 800,310 880,340 950,400 1010,500 1045,600 1053,700 "
                "1040,800 1000,900 940,1000 870,1080 800,1130 700,1141 620,1134 540,1141 430,1135 360,1100 "
                "300,1030 255,940 222,840 205,740 203,660 212,580 250,480 310,400")
apple_side = P("500,322 600,316 700,312 800,325 880,370 950,450 1000,550 1020,680 1010,800 970,920 910,1030 "
               "840,1100 750,1136 640,1132 520,1139 440,1120 360,1060 300,980 265,880 255,760 262,640 290,520 "
               "340,420 420,350")
parts.append(dict(name="body", kind="c", axis="z", n=2.0, relief="none", smooth=12, lo_weight=1.3,
                  round_ends={"start": 0.012, "end": 0.03}, paint_skip=[], nomask=["front", "side"],
                  # the side picture's worm and its slanted view of the hole would print a second hole and a
                  # green smear on the apple's flank; the top picture's stem and leaf are drawn elsewhere
                  # and the front, side and back pictures' dark stem dimple would print ghost dimples on the
                  # apple's top in front of, beside and behind the stem
                  paint_box_skip={"side": [[130, 500, 415, 925], [480, 350, 720, 420]],
                                  "top": [[780, 840, 1190, 1080]],
                                  # (and where the leaf hangs over the apple's shoulder in the front and back pictures)
                                  "front": [[520, 370, 760, 450], [370, 285, 615, 348]],
                                  "back": [[500, 370, 720, 455], [620, 285, 960, 352]]},
                  views={"front": apple_front, "side": apple_side}))
# ---- the stem (leans to the creature's left in the front and back pictures, upright from the side)
parts.append(dict(name="body_stem", kind="one", axis="z", n=2.0, relief="grain", relief_gain=0.6, smooth=3,
                  lo_weight=1.6, round_ends={"end": 0.012}, paint_skip=["top"],
                  views={"front": P("595,470 590,330 600,260 625,200 660,120 690,85 740,78 790,95 800,140 "
                                    "770,200 730,260 700,330 688,470"),
                         "side": P("520,90 560,77 630,75 668,90 665,150 655,220 650,300 652,470 545,470 545,300 "
                                   "535,200 520,140")}))
# ---- the leaf: a thin blade standing on edge, turned 45 degrees (it shows its face from the front and from
# the side), running from the stem out to the creature's right and back
parts.append(dict(name="body_leaf", kind="one", axis="z", n=2.0, relief="grain", relief_gain=0.5, smooth=3,
                  lo_weight=1.5, slab={"thick": 0.024, "dir": -1}, round_ends={"start": 0.006, "end": 0.006},
                  paint_skip=["top"],
                  views={"front": P("190,180 240,140 330,90 420,60 500,58 570,80 615,130 630,190 615,260 590,300 "
                                    "520,330 420,340 330,310 260,250 215,205"),
                         "side": P("660,300 670,180 700,120 770,70 850,55 930,65 1000,100 1060,150 1092,180 "
                                   "1050,220 980,280 900,320 820,335 740,330 680,322")}))
# ---- the worm: head (with the face), its body coming out of the hole, and the little waving nub
parts.append(dict(name="head", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=3.0,
                  round_ends={"start": 0.01, "end": 0.012}, paint_skip=[], order=["front", "side"], remap=True,
                  views={"front": circle(625, 630, 117, 112), "side": circle(240, 618, 92, 98)}))
parts.append(dict(name="head_worm", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=2.0,
                  round_ends={"start": 0.01}, paint_skip=["top", "back"],
                  views={"front": P("540,700 700,700 740,770 748,830 720,885 625,905 530,885 495,830 500,770"),
                         "side": P("220,690 300,670 360,690 400,720 430,800 420,860 340,850 280,822 235,790 "
                                   "215,740")}))
parts.append(dict(name="head_nub", kind="one", axis="z", n=2.0, relief="none", smooth=2, lo_weight=2.2,
                  round_ends={"start": 0.008, "end": 0.01}, paint_skip=["top", "back", "side_far"],
                  views={"front": P("705,690 735,660 775,650 800,670 795,720 760,770 720,780 705,740"),
                         "side": P("215,690 245,655 285,660 310,690 320,740 300,765 265,760 235,735")}))
d = {"item": "wormapple", "H": 0.45,
     "note": "Outlines in picture pixels of the source pictures (1254 x 1254). kind: c centred, one single "
             "off-centre part. Part names follow the animation system's round plan: the apple is body (with "
             "body_stem and body_leaf), the worm is head.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
