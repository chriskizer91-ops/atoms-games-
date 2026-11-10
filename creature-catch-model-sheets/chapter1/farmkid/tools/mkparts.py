"""Writes farmkid's parts.json (the farm kid). Outlines are in picture pixels of the 1024 x 1536 source pictures.
kind: c centred, m mirrored pair (traced on the kid's left, +X: image right in the front picture, image left in the
back picture), one = single off-centre. Part names carry the two-legged skeleton's words (BRIEF_PEOPLE.md and
BRIEF_PEOPLE_2.md). Built the heroes' way (../player-a/NOTES.md, ../player-b/NOTES.md): smooth hand-drawn outlines
(nomask) for the head, hair, torso, arms and legs; one upward-sliced hair mass plus a fringe and the biggest spike.

The front picture draws the face about 13 pixels (1.2 cm) to the kid's left of the body's centre line (the hair,
neck and body are centred). The head and ears are traced centred and read the front picture 13 pixels to the
right ("paint_shift"), so the face sits in the middle of the head."""
import json, sys
P = lambda s: [[int(a) for a in p.split(",")] for p in s.split()]
parts = []
def add(**k):
    parts.append(k)
# top picture mapping (set by redo_views.sh) for drawn top outlines: metres -> top picture pixels
TUC, TVC, TSX, TSY = 617, 719, 1348, 1132
def top(pts):
    return P(" ".join(f"{round(TUC - x * TSX)},{round(TVC + y * TSY)}" for x, y in pts))
def sym(rows):  # rows of (y, half-width) -> symmetric top outline
    return [(-h, y) for y, h in rows] + [(h, y) for y, h in rows[::-1]]
FACE_SHIFT = {"front": [13, 0]}
HAND_BOX = {"side": [[465, 788, 588, 952]]}  # the side picture's hand hangs in front of the hem and the trousers

# ---- head ------------------------------------------------------------------------------------
add(name="head", kind="c", axis="z", n=2.2, relief="none", smooth=5, lo_weight=4.0, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.045}, paint_skip=["top", "back"], paint_shift=FACE_SHIFT,
    views={"front": P("511,140 555,145 590,165 603,205 611,260 612,310 610,350 604,380 590,395 572,405 545,414 511,419 477,414 450,405 432,395 418,380 412,350 411,310 412,260 420,205 432,165 467,145"),
           "side": P("450,135 520,130 570,145 600,180 612,230 610,290 598,335 572,370 530,395 480,408 440,410 412,404 401,390 396,372 393,352 389,332 388,312 390,285 394,255 398,225 407,190 425,158")})
add(name="ear", kind="m", axis="z", n=2.2, relief="none", smooth=2, lo_weight=4.0, k_scale=1.6, n_scale=1.6,
    round_ends={"start": 0.007, "end": 0.009}, paint_skip=["top", "back", "side_far"], paint_shift=FACE_SHIFT,
    views={"front": P("605,302 625,294 640,302 645,328 638,352 622,366 608,360 603,330"),
           "side": P("528,282 548,278 565,290 572,315 568,340 552,352 535,350 527,320")})
# The main hair is sliced upward; its front edge (side picture) steps back from the forehead to behind the
# ear, so it frames the face with no brim. The outline is a smooth hull through the spikes' bases.
add(name="hair", kind="c", axis="z", n=2.2, relief="grain", smooth=8, lo_weight=2.4, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.04},
    views={"front": P("511,105 570,108 620,120 655,145 685,175 700,210 705,250 698,290 680,325 660,350 630,374 392,374 362,350 342,325 324,290 318,250 322,210 338,175 368,145 405,120 455,108"),
           "side": P("470,95 560,92 630,105 680,130 715,165 735,210 740,255 733,300 715,335 690,365 650,386 600,390 578,372 573,345 570,315 552,282 512,262 475,248 440,232 410,215 392,195 388,165 400,135 430,110")})
# the fringe: a pad of locks in front of the forehead, sliced front-to-back so its lower edge arcs up at the
# temples. As learned on Tinker: only about 1 cm in front of the forehead, its lower edge sloping up toward the
# front (so its underside takes the fringe's paint, not a pale line of forehead skin), and it skips skin colours.
add(name="hair_bangs", kind="c", axis="y", n=2.2, relief="grain", smooth=3, lo_weight=2.5, nomask=["side", "top"],
    round_ends={"start": 0.01, "end": 0.0}, paint_skip=["back"], paint_color_skip=["skin_pale"],
    views={"side": P("384,222 388,195 400,170 420,150 450,138 482,135 482,242 450,240 415,234 395,229 386,226"),
           "top": top(sym([(-0.136, 0.04), (-0.13, 0.07), (-0.118, 0.092), (-0.10, 0.104), (-0.075, 0.108), (-0.04, 0.108)]))})
# the big swept spike on top
add(name="hair_spike", kind="c", axis="z", n=2.0, relief="grain", smooth=4, lo_weight=4.0, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.03}, paint_skip=["back"],
    views={"front": P("470,140 478,100 492,75 515,60 545,58 562,72 568,100 575,140"),
           "side": P("480,140 495,95 525,65 565,47 605,48 630,72 636,110 630,140")})
# ---- neck, collar, torso (tunic and the cream shirt hem below it), hips ---------------------------
add(name="neck", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=0.5, paint_skip=["top"],
    views={"front": P("480,390 545,390 548,455 478,455"),
           "side": P("455,395 545,395 548,455 452,455")})
add(name="collar", kind="c", axis="z", n=2.2, relief="grain", smooth=3, lo_weight=1.0,
    round_ends={"start": 0.0, "end": 0.008}, paint_skip=["top"],
    views={"front": P("434,424 594,424 604,445 608,474 418,474 422,445"),
           "side": P("446,428 584,424 592,450 594,478 440,480 438,455")})
add(name="torso", kind="c", axis="z", n=2.6, relief="grain", smooth=6, lo_weight=1.1, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.03}, paint_skip=["top"],
    # the side picture's laces stick out in front of the chest and printed cream marks on its sides
    paint_box_skip={"side": HAND_BOX["side"] + [[392, 470, 452, 580]]},
    views={"front": P("511,445 570,450 625,472 650,505 655,550 640,600 622,640 627,680 635,700 632,725 640,745 652,765 668,800 670,840 672,872 350,872 352,840 354,800 370,765 383,745 390,725 387,700 396,680 401,640 382,600 367,550 372,505 397,472 452,450"),
           "side": P("440,450 520,445 580,455 608,490 615,550 622,620 620,700 626,780 630,840 626,866 365,866 362,840 368,780 378,720 392,660 402,600 410,540 420,490")})
add(name="hips", kind="c", axis="z", n=2.5, relief="grain", smooth=4, lo_weight=0.8,
    round_ends={"start": 0.03, "end": 0.0}, paint_skip=["top"], paint_box_skip=HAND_BOX,
    views={"front": P("360,858 662,858 672,900 680,960 640,975 512,980 384,975 345,960 352,900"),
           "side": P("372,852 625,852 624,900 622,970 388,970 390,900")})
# ---- arms and hands ---------------------------------------------------------------------------
add(name="arm", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=2.2, nomask=["front", "side"],
    round_ends={"start": 0.012, "end": 0.0}, paint_skip=["top"],
    views={"front": P("605,470 640,488 668,515 688,540 716,560 726,580 748,600 760,620 770,645 768,672 775,690 782,705 795,735 812,765 830,802 765,808 748,770 728,742 705,715 680,700 652,690 640,650 632,600 622,540 610,500"),
           "side": P("480,465 560,460 600,475 615,520 620,580 622,640 618,668 585,678 582,740 578,802 498,802 500,740 505,678 478,668 474,620 470,560 470,500")})
add(name="hand", kind="m", axis="z", n=2.3, relief="none", smooth=3, lo_weight=2.5, nomask=["front", "side"],
    round_ends={"start": 0.008, "end": 0.018}, paint_skip=["top"],
    views={"front": P("765,795 835,795 850,830 862,860 872,895 870,920 850,928 832,912 815,890 795,865 778,835 768,812"),
           "side": P("482,796 575,796 578,840 575,880 565,915 548,940 520,945 498,930 482,900 472,860 472,820")})
# ---- legs (baggy trouser leg gathered below the knee, bare shin) and boots -------------------------
add(name="leg", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=1.0, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    paint_box_skip=dict(HAND_BOX, back=[[250, 1165, 780, 1300]]),  # the back picture's boot tops are 3 cm higher
    views={"front": P("515,885 665,885 676,940 682,1000 692,1040 706,1065 708,1090 698,1120 694,1145 686,1160 688,1200 690,1260 580,1260 583,1200 578,1160 560,1145 543,1125 533,1100 538,1065 536,1020 526,970 516,930"),
           "side": P("390,880 602,880 603,960 604,1020 612,1060 622,1085 622,1105 614,1125 602,1142 590,1160 592,1200 594,1255 452,1255 452,1200 454,1160 432,1142 405,1125 396,1100 402,1065 398,1020 391,960")})
add(name="boot", kind="m", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=1.0,
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    paint_shift={"back": [0, -22]},  # the back picture draws the boots shorter and higher: read it 22 px higher
    views={"front": P("562,1205 718,1205 718,1270 708,1300 710,1335 730,1358 748,1385 752,1420 758,1452 572,1452 572,1400 580,1360 582,1310 568,1275"),
           "side": P("434,1203 612,1203 611,1270 600,1290 600,1330 610,1350 614,1400 617,1451 315,1451 316,1400 328,1365 350,1340 412,1322 438,1300 446,1280 434,1265")})

d = {"item": "farmkid", "H": 1.25, "ring_ease": 0.35,
     "note": "Outlines in picture pixels of the source pictures (1024 x 1536). kind: c centred, m mirrored pair (traced on the kid's left, +X), one single off-centre. Names follow the two-legged skeleton's words.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
