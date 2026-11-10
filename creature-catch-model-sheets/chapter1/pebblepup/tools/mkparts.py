"""Writes Pebblepup's parts.json (outlines in picture pixels of the 1536 x 1024 source pictures).

usage: python3 -I mkparts.py parts.json
"""
import json
import sys

P = lambda s: [[float(a) for a in p.split(",")] for p in s.split()]

parts = []
# ---- head ---------------------------------------------------------------------------------------
parts.append(dict(
    name="head", kind="c", axis="z", n=2.0, relief="fur_soft", smooth=5, lo_weight=2.4, paint_power=5,
    round_ends={"start": 0.02, "end": 0.02}, paint_skip=["top"],
    paint_ellipse_skip={"back": [[770, 400, 100, 185]]},  # the back picture's tail covers the back of the head
    views={"front": P("767,58 830,62 880,90 925,140 950,200 962,260 965,330 958,390 940,440 900,480 840,500 767,505 "
                      "694,500 634,480 594,440 576,390 569,330 572,260 584,200 609,140 654,90 704,62"),
           "side": P("365,150 390,105 430,75 500,50 580,40 660,45 730,80 780,130 805,200 810,280 795,350 760,410 "
                     "700,455 620,485 540,492 460,488 400,470 370,430 360,370 358,300 358,220")}))
parts.append(dict(
    name="muzzle", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=2.6, remap=True,
    paint_shift={"side": [0, -20]},  # the side picture draws the snout about 1 cm higher than the front one
    round_ends={"start": 0.015, "end": 0.012}, paint_skip=["top", "back"],
    views={"front": P("767,300 812,306 845,330 880,365 895,400 885,435 850,462 767,474 684,462 649,435 639,400 654,365 "
                      "689,330 722,306"),
           "side": P("320,262 370,250 430,258 470,290 480,350 470,410 440,440 400,440 360,420 320,385 295,345 290,300")}))
parts.append(dict(
    name="head_pebble", kind="c", axis="z", n=2.0, relief="none", smooth=2, lo_weight=3.0, remap=True,
    paint_shift={"side": [0, -34]},  # ... and the pebble about 1.7 cm higher
    round_ends={"start": 0.012, "end": 0.012}, paint_skip=["top", "back"],
    views={"front": P("768,305 805,310 822,335 818,370 795,390 768,393 741,390 718,370 714,335 731,310"),
           "side": P("290,258 325,262 342,285 345,320 330,345 300,352 268,345 250,320 248,290 262,268")}))
parts.append(dict(
    name="head_tongue", kind="c", axis="z", n=2.0, relief="none", smooth=2, lo_weight=2.6, remap=True,
    paint_shift={"side": [0, -10]},
    round_ends={"start": 0.01, "end": 0.004}, paint_skip=["top", "back"],
    views={"front": P("768,418 805,420 820,445 822,480 812,510 790,524 768,526 746,524 724,510 714,480 716,445 731,420"),
           "side": P("330,400 395,395 405,415 385,440 350,470 330,495 305,503 287,492 285,465 300,430")}))
parts.append(dict(
    name="ear", kind="m", axis="z", n=2.0, relief="fur_soft", smooth=4, lo_weight=1.8,
    cap={"x": 0.075}, round_ends={"start": 0.02, "end": 0.02}, paint_skip=["top", "side_far"],
    views={"front": P("845,50 900,30 950,60 1000,110 1060,160 1110,200 1138,250 1130,300 1110,360 1080,410 1040,432 "
                      "1000,425 975,390 960,330 950,250 930,170 900,110 860,80"),
           "side": P("545,90 560,55 600,40 650,45 720,80 770,130 810,190 828,250 825,320 800,380 760,420 700,442 "
                     "640,440 590,410 560,360 548,300 545,220 542,150")}))
# ---- body ---------------------------------------------------------------------------------------
parts.append(dict(
    name="body", kind="c", axis="z", n=2.2, relief="fur_soft", smooth=8, lo_weight=1.0, paint_power=5,
    round_ends={"start": 0.03, "end": 0.015}, nomask=["front"],
    views={"front": P("767,440 880,445 950,480 990,530 1010,600 1015,680 1005,740 960,775 870,790 767,795 664,790 "
                      "574,775 529,740 519,680 524,600 544,530 584,480 654,445"),
           "side": P("520,430 650,420 760,405 900,398 1020,405 1080,430 1130,480 1150,540 1155,620 1150,690 1120,740 "
                     "1000,745 900,740 800,745 700,750 600,750 520,730 470,690 445,630 445,560 470,490")}))
parts.append(dict(
    name="body_chest", kind="c", axis="z", n=2.0, relief="fur_soft", smooth=8, lo_weight=1.0,
    round_ends={"start": 0.02, "end": 0.02}, paint_skip=["top", "back"], nomask=["front", "side"],
    views={"front": P("767,480 860,490 900,540 905,600 880,660 840,720 800,755 767,762 734,755 694,720 654,660 "
                      "629,600 634,540 674,490"),
           "side": P("470,480 540,470 580,520 590,600 570,680 530,735 490,730 455,690 430,630 422,570 440,510")}))
# ---- legs ---------------------------------------------------------------------------------------
sole = ["#d9b48a", "#c79f76"]
parts.append(dict(
    name="front_leg", kind="m", axis="z", n=2.3, relief="fur_soft", smooth=3, lo_weight=1.4,
    round_ends={"start": 0.01, "end": 0.03}, paint_skip=["top", "side_far"], cap_fill={"start": sole},
    views={"front": P("800,600 1010,600 1025,680 1028,760 1028,830 1045,870 1060,910 1058,950 1040,972 900,975 "
                      "840,970 825,945 812,900 805,840 802,770 800,700"),
           "side": P("520,640 720,640 722,720 718,800 714,860 712,900 707,930 690,955 500,955 450,940 440,900 "
                     "455,862 510,845 520,800 522,740")}))
parts.append(dict(
    name="rear_leg", kind="m", axis="z", n=2.3, relief="fur_soft", smooth=3, lo_weight=1.4,
    round_ends={"start": 0.01, "end": 0.04}, paint_skip=["top", "side_far"], cap_fill={"start": sole},
    views={"back": P("515,560 700,560 705,640 690,720 682,800 680,860 682,900 678,940 660,968 500,968 478,950 "
                     "475,910 490,880 510,850 512,780 515,700 512,620"),
           "side": P("930,600 1100,560 1150,600 1160,680 1185,720 1195,780 1200,840 1205,900 1200,945 1180,955 "
                     "1000,955 950,940 943,900 958,862 990,840 990,780 960,720 935,660")}))
# ---- tail: the rising part (sliced upward) and the curl over the top (sliced front to back) -------
parts.append(dict(
    name="tail_a", kind="c", axis="z", n=2.0, relief="fur_soft", smooth=5, lo_weight=1.3,
    round_ends={"start": 0.02, "end": 0.0}, paint_skip=["front"], nomask=["back"],
    views={"back": P("700,300 740,262 800,255 840,290 845,350 835,420 830,480 810,540 768,575 726,540 700,480 "
                     "690,420 685,350"),
           "side": P("1040,430 1090,400 1120,330 1130,270 1150,230 1210,240 1245,280 1255,340 1250,400 1235,450 "
                     "1200,500 1150,535 1100,535 1060,500")}))
parts.append(dict(
    name="tail_b", kind="c", axis="y", n=2.0, relief="fur_soft", smooth=4, lo_weight=1.3,
    round_ends={"start": 0.025, "end": 0.02}, paint_skip=["front"], nomask=["top", "side"],
    views={"side": P("990,230 1000,195 1035,170 1090,152 1150,150 1200,170 1235,205 1252,250 1250,295 1215,285 "
                     "1170,262 1130,255 1090,268 1060,274 1020,274 995,262"),
           "top": P("710,730 826,730 834,800 838,900 830,960 800,986 736,986 706,960 698,900 702,800")}))

d = {"item": "pebblepup", "H": 0.45,
     "note": "Outlines in picture pixels of the source pictures (1536 x 1024). kind: c centred, m mirrored pair "
             "(traced on the creature's left, +X). Part names follow the four-legged plan (head, muzzle, head_pebble, "
             "head_tongue, ear, body*, front_leg, rear_leg, tail_a, tail_b).",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
