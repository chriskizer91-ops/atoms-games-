"""Writes Scarecrowl's parts.json (outlines in picture pixels of the source pictures, 1536 x 1024).

usage: python3 -I mkparts.py parts.json
"""
import json
import sys

FUC, BUC, TUC = 768.5, 768.0, 767.5   # centre columns of the front, back and top pictures


def sym(half, uc=FUC):
    """Full outline from the right half (top to bottom), mirrored about the centre column."""
    left = [[round(2 * uc - u, 1), v] for u, v in reversed(half)]
    return [[u, v] for u, v in half] + left


def P(s):
    return [[float(a) for a in p.split(",")] for p in s.split()]


parts = []
# ---- body: the feathered trunk, sliced upward
parts.append(dict(name="body", kind="c", axis="z", n=2.2, relief="fur_soft", smooth=6, lo_weight=1.2,
                  round_ends={"start": 0.03, "end": 0.03}, paint_skip=["top"],
                  views={"front": sym(P("768,425 860,432 912,470 935,540 942,620 935,700 905,760 860,800 "
                                        "800,822 768,826")),
                         "side": P("700,430 800,438 870,470 912,540 928,620 922,700 900,760 860,805 800,815 "
                                   "730,800 680,760 650,700 640,620 642,540 660,470")}))
# ---- the orange scarf: a collar round the neck and the ragged flap hanging at the front
parts.append(dict(name="body_scarf", kind="c", axis="z", n=2.0, relief="none", smooth=4, lo_weight=1.3,
                  round_ends={"start": 0.012, "end": 0.012}, paint_skip=["top"],
                  views={"front": sym(P("768,425 850,425 885,445 892,480 875,515 830,532 768,538")),
                         "side": P("640,448 720,436 800,436 860,445 882,475 875,515 820,528 720,528 650,515 "
                                   "625,480")}))
parts.append(dict(name="body_scarf_flap", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=1.2,
                  round_ends={"end": 0.006}, paint_skip=["top", "back"],
                  views={"front": sym(P("768,480 850,480 866,540 855,600 825,665 798,712 768,700")),
                         "side": P("606,490 690,490 700,560 690,640 662,700 636,748 612,742 600,660 598,570")}))
# ---- head: the crow's round head under the brim, with its beak
parts.append(dict(name="head", kind="c", axis="z", n=2.0, relief="none", smooth=4, lo_weight=2.2,
                  round_ends={"start": 0.02, "end": 0.02}, paint_skip=["top"],
                  glow={"rule": "eye_orange", "gain": 0.6},
                  views={"front": sym(P("768,268 840,275 880,305 893,350 885,400 855,435 810,452 768,456")),
                         "side": P("700,262 800,268 860,300 885,350 880,400 850,440 780,455 700,452 650,430 "
                                   "625,390 622,340 640,295")}))
parts.append(dict(name="head_beak", kind="c", axis="y", n=2.0, relief="none", smooth=2, lo_weight=1.6,
                  round_ends={"start": 0.006}, paint_skip=["top", "back"], order=["side", "top"], nomask=["top"],
                  views={"side": P("540,420 548,392 570,365 605,348 640,340 660,345 662,420 640,425 600,420 560,428"),
                         "top": sym(P("767.5,30 785,40 800,80 815,150 830,220 838,268"), TUC)}))
# ---- the hat: brim and cone (sliced upward), the bent tip, and the straw fringe hanging at each side
parts.append(dict(name="head_hat", kind="c", axis="z", n=2.0, relief="grain", relief_gain=0.7, smooth=6,
                  lo_weight=1.6, round_ends={"start": 0.01}, paint_skip=[],
                  paint_box_skip={"top": [[760, 150, 960, 330]]},
                  views={"front": sym(P("768,85 815,90 860,140 885,195 960,212 1030,240 1055,275 1050,310 "
                                        "1010,330 900,336 768,338")),
                         "side": P("790,82 860,78 905,130 935,190 990,215 1025,265 1030,320 960,334 800,338 "
                                   "660,330 575,300 548,262 580,222 660,205 735,190 760,130")}))
# the tip runs sideways (to the creature's right) and back, so it is sliced along its run: the front picture
# gives its thickness, and a drawn band from above (following the side picture: it bends back 21 cm) its place
parts.append(dict(name="head_hat_tip", kind="one", axis="x", n=2.0, relief="grain", relief_gain=0.7, smooth=3,
                  lo_weight=1.4, round_ends={"start": 0.012}, paint_skip=["top"], nomask=["front", "top"],
                  order=["front", "top"],
                  views={"front": P("448,195 455,165 480,135 520,105 570,70 620,40 670,20 720,18 780,40 800,80 "
                                    "760,100 700,105 650,115 600,135 560,160 520,185 480,205"),
                         "top": P("690,422 1220,917 1220,1053 690,558")}))
parts.append(dict(name="head_hat_fringe", kind="m", axis="z", n=2.2, relief="grain", relief_gain=0.6, smooth=4,
                  lo_weight=1.2, round_ends={"start": 0.015}, paint_skip=["top", "side_far"],
                  views={"front": P("880,250 1000,265 1010,330 985,375 960,420 925,442 895,440 885,380 880,320"),
                         "side": P("700,260 900,262 960,300 975,340 950,385 900,420 860,440 800,445 760,430 "
                                   "720,400 700,340")}))
# ---- wings: flat plates held straight out, sliced along the span (front picture for height, a thin drawn
# outline from above for thickness)
parts.append(dict(name="wing", kind="m", axis="x", n=2.0, relief="fur_soft", smooth=4, lo_weight=1.6,
                  round_ends={"end": 0.02}, paint_skip=["top", "side_far"], order=["front", "top"], nomask=["top"],
                  views={"front": P("880,452 950,440 1030,425 1110,410 1180,425 1250,440 1270,462 1265,505 "
                                    "1255,560 1240,600 1205,640 1180,665 1100,695 1000,712 930,712 880,700"),
                         "top": P("680,455 560,455 400,452 250,450 120,455 72,470 72,500 120,512 250,520 400,522 560,522 680,522")}))
# ---- legs and three-toed feet
parts.append(dict(name="leg", kind="m", axis="z", n=2.0, relief="none", smooth=2, lo_weight=1.0,
                  round_ends={"end": 0.02}, paint_skip=["top", "side_far"],
                  views={"front": P("838,740 885,740 892,800 896,850 905,905 858,910 848,860 842,800"),
                         "side": P("738,740 800,740 802,820 792,870 788,905 740,905 735,860 736,800")}))
parts.append(dict(name="foot", kind="m", axis="z", n=2.4, relief="none", smooth=2, lo_weight=1.4,
                  round_ends={"start": 0.004, "end": 0.012}, paint_skip=["top", "side_far"],
                  views={"front": P("860,893 920,898 980,913 1012,938 1012,962 945,976 900,979 860,976 800,962 "
                                    "797,940 830,908"),
                         "side": P("622,942 660,915 720,897 790,898 840,918 849,950 832,963 720,966 660,973 "
                                   "625,962")}))
d = {"item": "scarecrowl", "H": 0.75,
     "note": "Outlines in picture pixels of the source pictures (1536 x 1024). kind: c centred, m mirrored "
             "pair (traced on the creature's left, +X), one single off-centre part. Part names follow the new "
             "bird plan: body, body_scarf, head, head_hat, head_beak, wing, leg, foot.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
