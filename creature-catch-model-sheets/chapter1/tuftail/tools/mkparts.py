"""Writes Tuftail's parts.json (outlines in picture pixels of the 1536 x 1024 source pictures).

usage: python3 -I mkparts.py parts.json
"""
import json
import sys

P = lambda s: [[float(a) for a in p.split(",")] for p in s.split()]
UC = 768.0  # centre column of the front and back pictures


def mirror_half(half, uc=UC):
    """A symmetric outline from its right half (top to bottom), in picture pixels."""
    left = [[2 * uc - u, v] for u, v in reversed(half) if abs(u - uc) > 0.5]
    return half + left


def scale_u(poly, f, uc=UC):
    return [[uc + (u - uc) * f, v] for u, v in poly]


parts = []
# ---- head -------------------------------------------------------------------------------------
parts.append(dict(
    name="head", kind="c", axis="z", n=2.0, relief="fur_soft", smooth=5, lo_weight=2.6,
    round_ends={"start": 0.02, "end": 0.03}, paint_skip=["top"],
    paint_ellipse_skip={"side": [[605, 290, 120, 95]]},
    views={"front": P("768,225 840,232 900,258 940,298 965,345 1000,388 1015,420 1005,460 975,490 920,514 850,525 "
                      "768,528 686,525 616,514 561,490 531,460 521,420 536,388 571,345 596,298 636,258 696,232"),
           "side": P("365,300 377,270 402,250 440,236 500,227 560,224 620,236 668,265 698,310 708,370 703,420 680,460 "
                     "640,494 590,512 520,515 460,505 410,497 375,485 360,460 358,400 360,340")}))
parts.append(dict(
    name="muzzle", kind="c", axis="z", n=2.0, relief="none", smooth=2, lo_weight=3.0,
    round_ends={"start": 0.012, "end": 0.01}, paint_skip=["top", "back"],
    views={"front": P("768,398 810,402 840,420 848,450 838,485 810,510 768,520 726,510 698,485 688,450 696,420 726,402"),
           "side": P("312,405 330,392 365,385 410,390 430,410 432,460 415,488 385,495 355,482 332,460 316,435")}))
parts.append(dict(
    name="ear", kind="m", axis="z", n=2.0, relief="fur_soft", smooth=3, lo_weight=2.2,
    slab={"thick": 0.045, "dir": 1}, round_ends={"start": 0.01, "end": 0.012},
    paint_skip=["top", "side_far"],
    views={"front": P("850,245 890,185 950,115 1000,62 1028,38 1048,60 1058,110 1062,170 1058,240 1040,300 1005,350 "
                      "965,385 925,360 895,320 865,285"),
           "side": P("485,215 510,150 545,90 580,45 605,25 630,35 660,75 690,130 708,190 714,260 708,320 690,375 "
                     "640,380 590,360 540,320 500,270")}))
# ---- body -------------------------------------------------------------------------------------
parts.append(dict(
    name="body", kind="c", axis="z", n=2.2, relief="fur_soft", smooth=8, lo_weight=1.0,
    round_ends={"start": 0.03, "end": 0.03}, nomask=["front"],
    paint_box_skip={"top": [[0, 0, 1536, 400]]},
    views={"front": P("660,470 876,470 920,520 940,600 942,700 930,760 890,790 768,800 646,790 606,760 594,700 "
                      "596,600 616,520"),
           "side": P("470,470 560,470 640,520 720,525 790,515 860,530 910,555 945,585 960,630 962,690 950,740 "
                     "900,765 800,752 700,752 600,755 520,750 470,730 450,680 445,600 455,520")}))
parts.append(dict(
    name="body_chest", kind="c", axis="z", n=2.0, relief="fur_soft", smooth=8, nomask=["front", "side"], lo_weight=1.2,
    round_ends={"start": 0.02, "end": 0.02}, paint_skip=["top", "back"],
    views={"front": P("768,500 896,520 935,580 938,610 916,640 886,690 836,740 768,785 700,740 650,690 620,640 "
                      "597,610 600,580 640,520"),
           "side": P("450,480 540,470 600,500 610,560 600,620 570,680 540,740 505,765 470,750 425,710 395,660 "
                     "385,600 400,540 425,500")}))
# ---- legs -------------------------------------------------------------------------------------
sole = ["#5e301c", "#4e2816"]
parts.append(dict(
    name="front_leg", kind="m", axis="z", n=2.3, relief="fur_soft", smooth=3, lo_weight=1.5,
    round_ends={"start": 0.008, "end": 0.03}, paint_skip=["top", "side_far"], cap_fill={"start": sole},
    views={"front": P("792,600 900,600 905,650 900,700 895,760 890,830 888,900 900,930 905,960 895,985 855,990 "
                      "810,985 800,960 805,925 805,860 800,780 795,700"),
           "side": P("520,630 655,630 650,700 640,750 632,800 624,850 620,900 615,960 605,985 500,985 482,960 "
                     "488,930 520,915 540,900 538,850 532,800 525,750 520,700")}))
parts.append(dict(
    name="rear_leg", kind="m", axis="z", n=2.3, relief="fur_soft", smooth=3, lo_weight=1.5,
    round_ends={"start": 0.008, "end": 0.04}, paint_skip=["top", "side_far"], cap_fill={"start": sole},
    views={"back": P("555,620 690,620 692,700 680,770 668,820 664,880 666,930 660,965 640,980 560,980 552,960 "
                     "560,935 572,915 578,880 580,830 574,785 562,755 553,710 550,660"),
           "side": P("800,600 880,580 950,600 965,650 975,710 1000,750 1012,800 1015,850 1017,900 1017,950 "
                     "1012,975 900,975 888,950 895,925 920,905 925,860 920,815 880,795 830,765 800,725 790,680")}))
# ---- tail: one bushy piece, a smooth outline; the paint carries the grass clumps ----------------
TAIL_W = 1.15  # the back picture draws the tail narrower than the front and top pictures; this is between
back_half = P("768,22 820,26 850,50 852,120 872,190 940,215 985,300 1010,380 1035,460 1036,540 1010,600 "
              "985,670 940,720 870,760 768,778")
parts.append(dict(
    name="tail", kind="c", axis="z", n=2.1, relief="none", smooth=12, lo_weight=1.0,
    round_ends={"start": 0.03, "end": 0.03}, nomask=["side", "back"], paint_power=5,
    view_warp={"back": {"u": [[0, UC - UC / TAIL_W], [1536, UC + UC / TAIL_W]]},
               "front": {"u": [[0, UC - UC * 1.14], [1536, UC + UC * 1.14]]},
               "top": {"u": [[0, 767.5 - 767.5 * 1.12], [1536, 767.5 + 768.5 * 1.12]]}},
    views={"back": scale_u(mirror_half(back_half), TAIL_W),
           "side": P("800,505 760,480 750,430 752,370 765,320 800,275 850,240 868,190 890,140 930,100 990,60 "
                     "1060,40 1130,40 1165,60 1220,110 1265,170 1283,240 1295,320 1297,410 1285,490 1260,560 "
                     "1230,630 1185,690 1130,735 1060,752 1000,745 965,700 960,640 940,590 900,550 850,525")}))

d = {"item": "tuftail", "H": 0.55,
     "note": "Outlines in picture pixels of the source pictures (1536 x 1024). kind: c centred, m mirrored pair "
             "(traced on the creature's left, +X). Part names follow the four-legged plan (head, muzzle, ear, body*, "
             "front_leg, rear_leg, tail).",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
