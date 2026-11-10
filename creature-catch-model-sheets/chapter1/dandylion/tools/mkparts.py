"""Writes Dandylion's parts.json (outlines in picture pixels of the source pictures, 1536 x 1024).

usage: python3 -I mkparts.py parts.json
"""
import json
import math
import sys

FUC, BUC, TUC = 768.0, 764.0, 767.5   # centre columns of the front, back and top pictures


def sym(half, uc=FUC):
    """Full outline from the right half (top to bottom), mirrored about the centre column."""
    left = [[round(2 * uc - u, 1), v] for u, v in reversed(half)]
    return [[u, v] for u, v in half] + left


def circle(cx, cy, r, ry=None, n=32):
    ry = ry or r
    return [[round(cx + r * math.cos(2 * math.pi * k / n), 1), round(cy + ry * math.sin(2 * math.pi * k / n), 1)]
            for k in range(n)]


def P(s):
    return [[float(a) for a in p.split(",")] for p in s.split()]


parts = []
# ---- head: the cub's face, sliced upward (the side picture sets heights; the front one is stretched to fit)
parts.append(dict(name="head", kind="c", axis="z", n=2.3, relief="fur_soft", smooth=6, lo_weight=2.6,
                  round_ends={"start": 0.02, "end": 0.02}, paint_skip=["top"], order=["side", "front"], remap=True,
                  views={"side": P("338,505 345,488 372,478 388,455 396,415 402,375 415,345 440,318 480,300 "
                                   "540,295 600,320 640,380 640,460 610,540 560,585 500,598 440,592 405,590 "
                                   "375,576 355,552 340,527"),
                         "front": sym(P("768,360 840,368 880,392 905,428 922,468 920,520 905,560 870,592 "
                                        "830,610 768,618"))}))
# ---- ears: thin discs turned to face forward and a little outward, set 7 cm forward of where the side
# picture draws them so they stand in front of the mane (the side picture's ear is painted out, see NOTES)
parts.append(dict(name="head_ear", kind="m", axis="z", n=2.0, relief="fur_soft", smooth=3, lo_weight=2.0,
                  slab={"thick": 0.04, "dir": 1}, remap=True, round_ends={"start": 0.012, "end": 0.012},
                  paint_skip=["side"], nomask=["side"],
                  views={"front": circle(945, 400, 64), "side": circle(495, 352, 45, 80)}))
# ---- the mane of seed puffs: one smooth ball (the paint carries the puffs), set back at face height so
# the face stands in front of it, coming forward above and below the face
mane_front = sym(P("768,172 850,178 930,210 990,260 1030,320 1062,380 1075,440 1070,520 1055,580 1030,640 "
                   "990,690 930,730 850,750 768,754"))
mane_side = P("660,100 750,115 830,160 880,220 915,300 928,380 925,450 905,520 870,575 800,610 720,640 "
              "640,700 570,745 480,754 420,735 395,690 400,640 440,600 478,560 485,450 478,350 465,300 430,262 "
              "450,210 500,160 570,118")
parts.append(dict(name="head_puffs", kind="c", axis="z", n=2.0, relief="none", smooth=12, lo_weight=1.4,
                  round_ends={"start": 0.04, "end": 0.05}, nomask=["front", "side"],
                  paint_skip=[], paint_box_skip={"top": [[400, 0, 1150, 150]]},
                  # the top picture draws the mane shorter front to back than the side picture: read it
                  # squeezed so its puffs cover the whole mane and its body yellow stays off it
                  view_warp={"top": {"v": [[104, 120], [675, 555]]}},
                  views={"front": mane_front, "side": mane_side}))
# ---- body: sliced front to back (side picture for heights, top picture for widths)
# ---- cheek puffs: a pair of puff balls beside the face, coming forward so they frame it as in the front
# picture (the side picture is read where it draws its own cheek puff)
parts.append(dict(name="head_puffs_cheek", kind="m", axis="z", n=2.0, relief="none", smooth=4, lo_weight=1.6,
                  round_ends={"start": 0.02, "end": 0.02}, order=["side", "front"], remap=True, nomask=["side"],
                  paint_skip=["top", "side_far"], paint_shift={"side": [129, -25]},
                  views={"side": circle(486, 545, 100), "front": circle(942, 575, 96)}))
parts.append(dict(name="body", kind="c", axis="y", n=2.3, relief="fur_soft", smooth=6, lo_weight=1.0,
                  round_ends={"start": 0.03, "end": 0.04}, paint_skip=[], order=["side", "top"], nomask=["top"],
                  views={"side": P("545,620 620,600 700,595 780,575 850,560 950,572 1000,598 1022,640 1035,700 "
                                   "1030,760 960,775 860,790 780,797 700,792 620,770 560,740 540,680"),
                         "top": sym(P("720,260 682,320 662,400 652,480 650,560 652,620 662,680 680,740 700,795"), TUC)}))
# ---- legs (traced on the creature's left: front picture right half, back picture left half)
parts.append(dict(name="front_leg", kind="m", axis="z", n=2.3, relief="fur_soft", smooth=3, lo_weight=1.2,
                  round_ends={"start": 0.006, "end": 0.03}, paint_skip=["back", "top", "side_far"],
                  order=["side", "front"], remap=True,
                  views={"front": P("830,690 955,690 975,760 982,850 990,890 1005,920 1003,960 985,980 900,983 "
                                    "830,980 815,955 815,915 822,880 825,800 828,740"),
                         "side": P("555,650 700,650 698,720 690,800 682,855 680,900 676,945 650,951 520,951 "
                                   "468,945 460,910 470,875 500,858 540,852 546,800 550,720")}))
parts.append(dict(name="rear_leg", kind="m", axis="z", n=2.3, relief="fur_soft", smooth=3, lo_weight=1.2,
                  round_ends={"start": 0.006, "end": 0.04}, paint_skip=["front", "top", "side_far"],
                  order=["side", "back"], remap=True,
                  views={"back": P("600,610 700,640 722,700 715,800 708,860 730,890 735,930 715,946 640,948 "
                                   "545,945 528,925 532,885 545,860 552,790 565,710 580,650"),
                         "side": P("860,600 960,590 1010,620 1040,690 1050,770 1052,850 1052,920 1045,948 "
                                   "980,951 850,951 835,935 836,890 850,860 862,820 855,760 850,700 852,640")}))
# ---- tail rising behind, and the yellow flower tuft on its tip
parts.append(dict(name="tail", kind="c", axis="z", n=2.1, relief="fur_soft", smooth=4, lo_weight=1.0,
                  round_ends={"start": 0.01}, paint_skip=["front"], order=["side", "back"], remap=True,
                  nomask=["back"],
                  views={"side": P("995,660 1000,600 1040,570 1070,530 1085,480 1088,430 1112,420 1125,450 "
                                   "1132,510 1122,570 1098,625 1062,655 1010,670"),
                         "back": [[722, 410], [808, 410], [812, 690], [718, 690]]}))
parts.append(dict(name="tail_tuft", kind="c", axis="z", n=2.0, relief="none", smooth=4, lo_weight=1.6,
                  round_ends={"start": 0.02, "end": 0.02}, paint_skip=["front"], order=["side", "back"], remap=True,
                  views={"side": circle(1083, 311, 121), "back": circle(765, 298, 123)}))
d = {"item": "dandylion", "H": 0.65,
     "note": "Outlines in picture pixels of the source pictures (1536 x 1024). kind: c centred, m mirrored "
             "pair (traced on the creature's left, +X). Part names follow the animation system's four-legged plan; "
             "the mane is head_puffs (moves with the head), the tail flower is tail_tuft.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
