"""Writes Bumblop's parts.json (outlines in picture pixels of the 1254 x 1254 source pictures).

usage: python3 -I mkparts.py parts.json
"""
import json
import math
import sys

P = lambda s: [[float(a) for a in p.split(",")] for p in s.split()]


def circle(cx, cy, r, n=20):
    return [[cx + r * math.cos(2 * math.pi * k / n), cy + r * math.sin(2 * math.pi * k / n)] for k in range(n)]


# where the pictures draw the wings over the body (the body under them takes no paint from those pictures)
WING_BACK = [[320, 468, 175, 165], [933, 468, 175, 165]]
WING_SIDE = [[808, 456, 165, 172]]
WING_TOP = [[296, 760, 160, 128], [958, 760, 160, 128]]
# where the top picture draws the antennae over the body
ANT_TOP = [[450, 410, 115, 110], [805, 410, 115, 110]]
WING_BACKSET = 0.03  # metres: the wings sit this much further back than the side picture draws them

parts = []
parts.append(dict(
    name="body", kind="c", axis="z", n=2.0, relief="fur_soft", smooth=14, lo_weight=1.7, paint_power=4,
    round_ends={"start": 0.04, "end": 0.06}, nomask=["front", "side"],
    paint_box_skip={"top": [[380, 120, 880, 300]]},
    paint_ellipse_skip={"back": WING_BACK, "side": WING_SIDE, "top": WING_TOP + ANT_TOP},
    views={"front": P("624,248 720,252 800,268 870,305 930,370 980,460 1012,560 1025,660 1027,760 1018,860 995,950 "
                      "955,1035 900,1100 820,1140 624,1155 428,1140 348,1100 293,1035 253,950 230,860 221,760 "
                      "223,660 236,560 268,460 318,370 378,305 448,268 528,252"),
           "side": P("420,252 520,240 620,250 720,285 800,335 860,400 905,470 940,560 970,650 992,740 998,820 990,900 "
                     "965,980 925,1040 870,1090 800,1125 700,1145 600,1145 500,1125 420,1085 350,1020 290,950 255,880 "
                     "240,800 240,720 258,660 246,600 233,540 245,480 272,420 300,360 345,300")}))
parts.append(dict(
    name="ear", kind="m", axis="z", n=2.0, relief="fur_soft", smooth=5, lo_weight=1.6,
    round_ends={"start": 0.03, "end": 0.02}, paint_skip=["top", "side_far"],
    paint_box_skip={"back": [[0, 0, 1254, 640]]},  # the back picture's wings cover the tops of the ears
    views={"front": P("740,290 800,280 860,290 920,380 1000,470 1060,580 1090,700 1095,800 1080,880 1040,920 990,932 "
                      "940,912 905,860 880,780 862,680 850,580 830,480 800,400 762,330"),
           "side": P("480,290 560,275 630,290 645,350 650,450 652,550 650,650 645,750 630,850 600,920 550,950 480,950 "
                     "420,920 390,860 385,780 400,700 430,600 460,500 470,400 470,330")}))
parts.append(dict(
    name="head_antenna", kind="m", axis="z", n=2.0, relief="none", smooth=3, lo_weight=1.6,
    round_ends={"start": 0.0, "end": 0.01}, paint_skip=["side_far"],
    views={"front": P("700,300 748,300 770,230 800,175 835,135 862,112 862,78 830,82 795,105 760,140 730,190 705,240"),
           "side": P("560,300 618,300 620,230 610,180 590,140 560,105 520,80 470,75 455,100 500,115 535,140 560,180 "
                     "568,230")}))
parts.append(dict(
    name="head_antenna_tip", kind="m", axis="z", n=2.0, relief="none", smooth=2, lo_weight=4.0,
    round_ends={"start": 0.025, "end": 0.025}, paint_skip=["side_far"],
    # one yellow, lightly shaded: each picture's white highlight sat in a different place (lumpy-looking balls)
    paint_solid={"color": "#fcc010", "shade": 0.3},
    views={"front": circle(903, 117, 67), "side": circle(386, 113, 70)}))
parts.append(dict(
    name="wing", kind="m", axis="z", n=2.0, relief="none", smooth=4, lo_weight=1.4,
    # dir -1: each wing runs from its root high on the back out and a little forward to its tip beside
    # the ear, so the back picture sees the whole wing standing off the round back (with dir 1 the root
    # half sank into the ball) and the front picture sees the tips beside the ears, as both draw them
    # the front picture's ears and head tufts overlap the wings, and the top picture draws the wings
    # elsewhere (over the ears and fur), so neither is printed on them
    slab={"thick": 0.03, "dir": -1}, round_ends={"start": 0.02, "end": 0.02}, paint_skip=["side_far", "front", "top"],
    paint_power=4,
    # moved back a little; the side picture is read shifted the same amount so its wing paint stays on the wing
    offset=[0, WING_BACKSET, 0], paint_shift={"side": [-WING_BACKSET * 2260, 0]},
    # the wing tips reach down beside the ears, where the back picture draws ear fur
    paint_box_skip={"back": [[0, 590, 262, 1254], [991, 590, 1254, 1254]]},
    views={"back": P("142,380 186,318 255,300 330,306 400,338 450,390 485,460 490,530 470,592 420,628 350,634 "
                     "262,605 186,545 142,472 128,420"),
           "side": P("650,560 660,480 700,400 760,330 830,290 900,290 950,320 970,380 965,450 930,520 870,575 "
                     "800,610 720,625 670,615")}))
parts.append(dict(
    name="foot", kind="m", axis="z", n=2.4, relief="fur_soft", smooth=3, lo_weight=1.4,
    round_ends={"start": 0.01, "end": 0.02}, paint_skip=["top", "side_far"], cap_fill={"start": ["#e0a810", "#c99510"]},
    views={"front": P("700,1100 740,1080 800,1078 850,1090 870,1130 865,1170 830,1182 720,1182 698,1160"),
           "side": P("430,1090 480,1068 560,1070 600,1100 605,1140 590,1168 450,1172 422,1150 420,1115")}))

d = {"item": "bumblop", "H": 0.5,
     "note": "Outlines in picture pixels of the source pictures (1254 x 1254). kind: c centred, m mirrored pair "
             "(traced on the creature's left, +X). Part names follow the round plan with wings (body, ear, "
             "head_antenna, wing, foot).",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
