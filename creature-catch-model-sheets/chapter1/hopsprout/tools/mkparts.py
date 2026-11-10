"""Writes Hopsprout's parts.json (outlines in picture pixels of the 1536 x 1024 source pictures).

usage: python3 -I mkparts.py parts.json
"""
import json
import sys

P = lambda s: [[float(a) for a in p.split(",")] for p in s.split()]

parts = []
# ---- head ---------------------------------------------------------------------------------------
parts.append(dict(
    name="head", kind="c", axis="z", n=2.0, relief="none", smooth=4, lo_weight=2.4,
    round_ends={"start": 0.03, "end": 0.04}, paint_box_skip={"top": [[0, 0, 1536, 350]]},  # face and sprout in the top picture
    views={"front": P("768,295 860,315 920,360 955,430 958,500 940,560 890,610 820,632 768,636 716,632 646,610 596,560 "
                      "578,500 581,430 616,360 676,315"),
           "side": P("500,300 580,310 640,340 690,390 710,450 712,510 695,565 650,605 580,632 500,640 440,628 390,600 "
                     "350,555 330,500 330,440 355,385 400,335 450,310")}))
parts.append(dict(
    name="head_sprout", kind="c", axis="z", n=2.0, relief="none", smooth=2, lo_weight=1.2,
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    views={"front": P("750,215 788,215 790,260 790,315 746,315 746,260"),
           "side": P("592,215 632,215 628,260 622,320 580,320 585,260")}))
parts.append(dict(
    name="head_sprout_leaf", kind="m", axis="z", n=2.0, relief="none", smooth=3, lo_weight=1.6,
    round_ends={"start": 0.012, "end": 0.012}, paint_skip=["side_far"],
    paint_shift={"top": [0, -129]},  # the top picture draws the sprout 6 cm further forward than the side picture
    views={"front": P("772,240 790,200 820,160 860,138 893,140 895,165 870,205 835,235 800,252 776,256"),
           "side": P("548,190 560,160 590,142 630,140 680,145 730,150 765,160 760,190 720,225 670,248 620,255 575,240")}))
parts.append(dict(
    name="head_antenna", kind="m", axis="z", n=2.0, relief="none", smooth=3, lo_weight=1.6,
    round_ends={"start": 0.0, "end": 0.02}, paint_skip=["side_far"],
    views={"front": P("835,375 885,375 892,320 910,250 940,190 980,140 1030,105 1090,98 1094,62 1060,40 1010,45 960,80 "
                      "920,130 880,190 855,250 838,310"),
           "side": P("468,365 528,360 522,280 510,200 490,140 460,95 420,55 370,45 348,65 360,97 405,112 440,142 "
                     "462,200 470,280")}))
# ---- body: thorax (front) and abdomen (back), and the folded wings --------------------------------
parts.append(dict(
    name="body_front", kind="c", axis="z", n=2.0, relief="none", smooth=5, lo_weight=1.2,
    round_ends={"start": 0.015, "end": 0.03}, paint_skip=["top", "back"],
    views={"front": P("768,590 850,598 915,635 940,690 935,750 895,800 840,830 768,838 696,830 641,800 601,750 596,690 "
                      "621,635 686,598"),
           "side": P("600,520 700,490 790,505 850,540 870,600 860,700 830,780 760,800 680,780 600,740 530,700 490,650 "
                     "500,600 540,555")}))
parts.append(dict(
    name="body_back", kind="c", axis="z", n=2.0, relief="none", smooth=5, lo_weight=1.2,
    round_ends={"start": 0.015, "end": 0.03}, paint_skip=["front"], nomask=["back", "side"],
    # the back and top pictures draw the folded wings over the abdomen
    paint_ellipse_skip={"back": [[675, 615, 85, 160], [860, 615, 85, 160]],
                        "top": [[690, 640, 70, 190], [845, 640, 70, 190]]},
    views={"back": P("768,505 820,510 860,560 890,640 900,720 885,790 850,835 768,852 686,835 651,790 636,720 646,640 "
                     "676,560 716,510"),
           "side": P("780,560 880,560 960,585 1040,605 1085,650 1092,720 1065,790 1000,828 900,832 820,815 760,780 "
                     "740,700 750,620")}))
parts.append(dict(
    name="body_wing", kind="m", axis="y", n=2.0, relief="none", smooth=4, lo_weight=1.5,
    slab={"thick": 0.025, "dir": -1}, round_ends={"start": 0.02, "end": 0.025}, paint_skip=["front", "side_far"],
    nomask=["top"],
    views={"side": P("725,610 760,540 840,470 930,420 1020,385 1080,375 1102,395 1080,450 1000,520 920,580 840,630 "
                     "770,655 735,645"),
           "top": P("700,452 740,455 757,500 757,600 745,700 725,790 700,830 670,825 640,760 625,660 625,560 640,490 "
                    "665,460")}))
# ---- legs (mirrored pairs) ------------------------------------------------------------------------
parts.append(dict(
    name="front_leg", kind="m", axis="z", n=2.0, relief="none", smooth=3, lo_weight=1.3,
    round_ends={"start": 0.012, "end": 0.02}, paint_skip=["top", "side_far"],
    views={"front": P("890,615 935,605 965,650 990,720 1010,790 1015,860 1035,900 1050,935 1045,965 1000,972 955,965 "
                      "950,930 960,890 960,830 945,760 920,700 895,660"),
           "side": P("500,640 560,650 565,700 530,760 510,790 507,880 507,915 500,945 470,952 400,948 390,925 400,895 "
                     "440,880 440,800 460,750 490,700")}))
parts.append(dict(
    name="mid_leg", kind="m", axis="z", n=2.0, relief="none", smooth=3, lo_weight=1.3,
    round_ends={"start": 0.012, "end": 0.02}, paint_skip=["top", "side_far"],
    views={"front": P("835,690 880,680 905,720 925,800 930,880 937,920 935,960 890,972 845,965 840,930 850,880 848,800 "
                      "840,740"),
           "side": P("735,700 790,700 830,740 830,800 831,880 855,910 852,945 800,953 750,948 748,915 755,880 753,800 "
                     "740,750")}))
parts.append(dict(
    name="rear_leg_thigh", kind="m", axis="z", n=2.0, relief="none", smooth=3, lo_weight=1.4,
    round_ends={"start": 0.02, "end": 0.025}, paint_skip=["top", "side_far"],
    views={"back": P("505,410 545,395 585,405 620,450 650,520 662,600 660,690 630,710 600,680 570,600 540,520 510,460 "
                     "498,430"),
           "side": P("835,745 845,700 900,620 980,530 1060,440 1120,370 1150,345 1180,345 1192,375 1185,430 1140,500 "
                     "1080,580 1010,660 940,730 890,760 850,762")}))
parts.append(dict(
    name="rear_leg", kind="m", axis="z", n=2.0, relief="none", smooth=3, lo_weight=1.5,
    round_ends={"start": 0.012, "end": 0.025}, paint_skip=["top", "side_far"],
    views={"back": P("490,400 560,395 565,450 560,560 555,700 550,800 545,860 545,880 545,920 530,948 440,950 418,930 "
                     "425,895 462,870 465,800 462,650 465,500 475,430"),
           "side": P("1135,380 1190,375 1190,450 1175,550 1160,650 1140,750 1127,830 1125,870 1170,885 1188,915 1180,948 "
                     "1100,953 1045,950 1036,920 1040,880 1040,820 1060,720 1085,600 1110,480 1125,420")}))

d = {"item": "hopsprout", "H": 0.45,
     "note": "Outlines in picture pixels of the source pictures (1536 x 1024). kind: c centred, m mirrored pair "
             "(traced on the creature's left, +X). Part names follow the bug plan (head, head_sprout, head_antenna, "
             "body_front, body_back, body_wing, front_leg, mid_leg, rear_leg).",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
