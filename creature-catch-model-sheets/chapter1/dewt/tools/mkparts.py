"""Writes Dewt's parts.json (outlines in picture pixels of the source pictures, 1536 x 1024).

usage: python3 -I mkparts.py parts.json
"""
import json
import math
import sys

FUC = 768.5   # front picture centre column
BUC = 768.0   # back picture centre column
TUC = 768.0   # top picture centre column
# picture scales (pixels per metre) from views.json, for drawing spheres the same size in two views
S_SIDE, S_FRONT, S_BACK, TSX, TSY, TVC = 2980.0, 3704.0, 3720.0, 2346.0, 2057.6, 506.5
SIDE_UC = 763.5


def sym(half, uc=FUC):
    """Full outline from the right half (top to bottom), mirrored about the centre column."""
    left = [[round(2 * uc - u, 1), v] for u, v in reversed(half)]
    return [[u, v] for u, v in half] + left


def circle(cx, cy, r, ry=None, n=28):
    ry = ry or r
    return [[round(cx + r * math.cos(2 * math.pi * k / n), 1), round(cy + ry * math.sin(2 * math.pi * k / n), 1)]
            for k in range(n)]


def P(s):
    return [[float(a) for a in p.split(",")] for p in s.split()]


parts = []
# ---- head: the big round face, sliced upward
head_front = sym(P("768,196 850,200 905,214 955,238 995,268 1025,302 1047,345 1058,390 1066,430 1070,470 "
                   "1066,505 1052,540 1025,575 980,602 915,622 850,634 768,642"))
head_side = P("57,500 62,478 85,466 108,452 118,415 135,360 165,315 205,285 250,268 300,262 360,262 420,275 "
              "470,305 505,345 520,390 527,440 528,490 520,540 495,590 450,625 380,640 300,640 230,640 165,630 "
              "115,612 80,585 62,555 55,530")
parts.append(dict(name="head", kind="c", axis="z", n=2.2, relief="none", smooth=10, lo_weight=2.6,
                  round_ends={"start": 0.012, "end": 0.008}, paint_skip=["top"], order=["side", "front"], remap=True,
                  views={"front": head_front, "side": head_side}))
# ---- bubbles on the head: one on top, a pair at the upper back corners
parts.append(dict(name="head_bubble", kind="c", axis="z", n=2.0, relief="none", smooth=2, lo_weight=1.6,
                  round_ends={"start": 0.006, "end": 0.008}, paint_skip=[],
                  views={"front": circle(768.5, 132, 108), "side": circle(364, 218, 100)}))
parts.append(dict(name="head_bubble_side", kind="m", axis="z", n=2.0, relief="none", smooth=2, lo_weight=1.6,
                  remap=True, round_ends={"start": 0.005, "end": 0.006}, paint_skip=["top", "side_far"],
                  views={"front": circle(982, 237, 76), "side": circle(471, 326, 76)}))
# ---- body: long, sliced front to back (side picture for heights, top picture for widths)
body_top = sym(P("700,200 668,240 645,290 630,340 622,400 620,450 622,500 628,550 638,600 655,650 680,700 "
                 "690,720"), TUC)
body_side = P("300,560 420,520 530,492 600,530 700,535 745,545 800,556 870,560 925,572 1000,578 1060,586 "
              "1060,793 1000,790 950,792 850,797 700,800 560,800 460,795 390,772 345,745 310,705 288,660 285,610")
parts.append(dict(name="body", kind="c", axis="y", n=2.2, relief="none", smooth=6, lo_weight=1.1,
                  round_ends={"start": 0.02}, paint_skip=["top"],
                  order=["side", "top"], nomask=["top"],
                  views={"side": body_side, "top": body_top}))
# ---- bubbles along the back (side picture for heights and places, a circle from above for widths)


def back_bubble(name, cx, cy, r, dv_top=None):
    yc = (cx - SIDE_UC) / S_SIDE
    rm = r / S_SIDE
    top = circle(TUC, TVC + yc * TSY, rm * TSX, rm * TSY)
    d = dict(name=name, kind="c", axis="y", n=2.0, relief="none", smooth=2, lo_weight=1.3,
             round_ends={"start": 0.004, "end": 0.004}, paint_skip=["back", "front"],
             order=["side", "top"], nomask=["top"], remap=True,
             views={"side": circle(cx, cy, r), "top": top})
    if dv_top is not None:
        d["paint_shift"] = {"top": [0, dv_top]}
    return d


parts.append(back_bubble("body_bubble_a", 612, 500, 80, -12))
parts.append(back_bubble("body_bubble_b", 806, 535, 64, -31))
parts.append(back_bubble("body_bubble_c", 978, 560, 52, 42))
parts.append(back_bubble("tail_bubble", 1130, 577, 43, 15))
# ---- tail in three pieces: lying back (sliced front to back), rising (sliced upward), the curl (front to back)
parts.append(dict(name="tail_a", kind="c", axis="y", n=2.1, relief="none", smooth=5, lo_weight=1.0,
                  round_ends={"end": 0.025},
                  paint_skip=["back", "front"], order=["side", "top"], nomask=["top"],
                  paint_box_skip={"top": [[700, 330, 836, 820]]},
                  views={"side": P("985,588 1100,590 1170,590 1220,580 1260,565 1295,545 1320,520 1340,490 "
                                   "1350,470 1420,470 1420,690 1400,712 1350,745 1300,770 1200,792 1100,796 1050,795 985,795"),
                         "top": sym(P("682,600 690,650 698,700 706,760 711,820 714,880 716,940 716,995"), TUC)}))
parts.append(dict(name="tail_b", kind="c", axis="z", n=2.1, relief="none", smooth=4, lo_weight=1.0,
                  paint_skip=["back", "front", "top"], order=["side", "back"], nomask=["back"],
                  views={"side": P("1320,690 1325,560 1322,480 1318,440 1310,410 1340,380 1400,370 1430,380 "
                                   "1452,410 1466,455 1471,505 1468,560 1458,605 1440,650 1415,690"),
                         "back": [[668, 760], [868, 760], [858, 285], [678, 285]]}))
parts.append(dict(name="tail_c", kind="c", axis="y", n=2.1, relief="none", smooth=3, lo_weight=1.0,
                  round_ends={"start": 0.012}, paint_skip=["back", "front"], order=["side", "top"], nomask=["top"],
                  views={"side": P("1238,459 1208,452 1188,430 1180,395 1186,358 1205,328 1240,307 1290,299 "
                                   "1340,304 1385,325 1420,352 1442,385 1452,415 1400,425 1340,420 1310,410 "
                                   "1290,404 1276,412 1270,435 1258,452"),
                         "top": [[712, 760], [824, 760], [824, 1005], [712, 1005]]}))
# ---- legs (traced on the creature's left: front picture right half, back picture left half)
parts.append(dict(name="front_leg", kind="m", axis="z", n=2.2, relief="none", smooth=3, lo_weight=1.3,
                  round_ends={"start": 0.004, "end": 0.02}, paint_skip=["back", "top", "side_far"],
                  views={"front": P("905,615 960,612 985,645 1000,700 1008,760 1006,815 1030,845 1075,862 "
                                    "1115,872 1135,895 1132,925 1105,945 1060,958 990,962 920,958 875,942 858,910 "
                                    "868,878 892,852 895,800 890,720 885,660"),
                         "side": P("430,640 480,625 525,632 542,665 540,720 528,780 532,805 533,850 505,877 "
                                   "420,879 330,879 275,868 250,840 258,808 290,792 340,790 366,770 376,720 "
                                   "390,670")}))
parts.append(dict(name="rear_leg", kind="m", axis="z", n=2.2, relief="none", smooth=3, lo_weight=1.3,
                  round_ends={"start": 0.004, "end": 0.02}, paint_skip=["front", "top", "side_far"],
                  order=["side", "back"], remap=True,
                  views={"back": P("522,640 560,645 585,680 588,740 578,800 568,830 562,868 540,898 480,902 "
                                   "400,900 345,887 332,857 348,826 400,814 420,790 420,730 430,685 465,650"),
                         "side": P("862,650 892,628 935,626 972,645 1005,695 1030,740 1050,790 1090,796 "
                                   "1120,815 1128,840 1115,863 1080,870 1040,879 960,880 900,880 884,868 "
                                   "884,840 893,812 878,790 858,760 848,720 850,690")}))
d = {"item": "dewt", "H": 0.25,
     "note": "Outlines in picture pixels of the source pictures (1536 x 1024). kind: c centred, m mirrored "
             "pair (traced on the creature's left, +X). Part names follow the animation system's four-legged plan.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
