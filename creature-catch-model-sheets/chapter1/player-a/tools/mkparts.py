"""Writes player-a's parts.json (the boy). Outlines are in picture pixels of the 1024 x 1536 source pictures.
kind: c centred, m mirrored pair (traced on the hero's left, +X: image right in the front picture), one = single off-centre.
Part names carry the two-legged skeleton's words (see BRIEF_PEOPLE.md)."""
import json, sys
P = lambda s: [[int(a) for a in p.split(",")] for p in s.split()]
parts = []
def add(**k):
    parts.append(k)

# ---- head ------------------------------------------------------------------------------------
add(name="head", kind="c", axis="z", n=2.05, relief="none", smooth=4, lo_weight=4.0,
    round_ends={"start": 0.02, "end": 0.05}, paint_skip=["top", "back"],
    views={"front": P("512,100 545,104 576,120 596,150 604,190 603,230 598,262 597,290 592,318 578,345 552,371 530,384 512,388 494,384 472,371 446,345 432,318 427,290 426,262 421,230 420,190 428,150 448,120 479,104"),
           "side": P("470,92 540,86 600,104 640,140 656,190 656,240 645,290 620,325 580,342 535,345 500,362 470,377 440,382 420,377 408,366 400,350 393,325 388,295 389,262 393,232 398,200 405,170 420,135 440,108")})
add(name="ear", kind="m", axis="z", n=2.0, relief="none", smooth=2, lo_weight=2.0,
    round_ends={"start": 0.008, "end": 0.01}, paint_skip=["top", "back", "side_far"],
    views={"front": P("588,268 612,262 630,270 638,292 633,316 620,335 604,340 588,330"),
           "side": P("534,249 552,256 561,276 559,300 549,318 530,323 515,311 512,282 519,259")})
add(name="hair", kind="c", axis="z", n=2.1, relief="grain", smooth=10, lo_weight=2.4,
    round_ends={"start": 0.02, "end": 0.06},
    paint_box_skip={},
    views={"front": P("512,85 600,95 670,125 705,170 712,215 700,260 690,300 672,340 640,358 600,352 560,330 465,330 425,352 385,358 350,340 332,300 322,260 318,215 325,170 360,125 425,95"),
           "side": P("520,72 600,85 665,110 715,145 738,190 736,235 722,275 700,315 668,345 625,356 590,352 566,330 560,295 560,262 545,250 485,244 470,236 420,222 372,212 362,195 365,160 385,125 430,92")})
add(name="hair_spike", kind="one", axis="z", n=2.0, relief="grain", smooth=4, lo_weight=1.2,
    round_ends={"start": 0.01, "end": 0.012}, paint_skip=["back"],
    views={"front": P("446,24 480,30 520,48 548,72 565,100 570,130 470,130 490,95 480,70 460,45"),
           "side": P("452,32 490,36 525,52 552,72 572,98 580,130 470,130 485,100 478,70 465,48")})
# ---- neck, collar, torso, backpack -----------------------------------------------------------
add(name="neck", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=0.6,
    paint_skip=["top"],
    views={"front": P("470,330 555,330 556,440 468,440"),
           "side": P("440,330 535,330 535,440 440,440")})
add(name="collar", kind="c", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=1.1,
    round_ends={"start": 0.0, "end": 0.012}, paint_skip=["top"],
    views={"front": P("385,388 440,372 512,372 582,372 637,388 642,420 645,455 378,455 380,420"),
           "back": P("395,345 450,345 512,345 575,345 630,345 628,380 640,440 383,440 395,380"),
           "side": P("420,372 470,366 560,362 612,365 610,395 604,430 600,460 430,460 415,430 415,400")},
    order=["front", "side"])
add(name="torso", kind="c", axis="z", n=2.6, relief="grain", smooth=6, lo_weight=1.2,
    round_ends={"start": 0.0, "end": 0.03}, paint_skip=["top"],
    views={"front": P("390,425 512,420 634,425 655,455 653,500 652,600 653,650 656,700 652,735 372,735 368,700 370,650 372,600 371,500 367,455"),
           "side": P("408,425 500,415 600,420 607,450 608,500 610,600 608,700 606,740 383,740 383,700 384,650 383,560 388,500 396,450")})
add(name="backpack", kind="c", axis="z", n=3.2, relief="grain", smooth=4, lo_weight=0.9,
    round_ends={"start": 0.015, "end": 0.02}, paint_skip=["front", "top"],
    views={"back": P("385,440 512,432 640,440 645,520 642,600 640,660 620,690 512,695 405,690 385,660 380,600 380,520"),
           "side": P("588,432 640,430 680,440 700,480 708,560 712,640 700,690 660,706 610,704 588,700")},
    order=["back", "side"])
# ---- arms and hands ------------------------------------------------------------------------
add(name="arm", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=1.3,
    round_ends={"start": 0.012, "end": 0.035}, paint_skip=["top"],
    views={"front": P("630,440 668,450 692,480 715,530 733,575 745,592 770,595 782,615 782,660 772,672 785,720 800,745 812,775 770,780 750,745 725,705 705,695 680,693 660,682 652,660 648,630 635,600 628,560 625,500 625,455"),
           "side": P("485,428 535,424 588,430 598,450 600,500 600,580 606,600 605,650 592,668 578,672 578,700 582,780 505,780 507,700 505,672 484,660 477,620 480,585 479,500 478,450")})
add(name="hand", kind="m", axis="z", n=2.3, relief="none", smooth=3, lo_weight=1.6,
    round_ends={"start": 0.008, "end": 0.02}, paint_skip=["top"],
    views={"front": P("762,762 812,762 832,800 850,838 863,872 866,896 856,909 838,906 822,890 806,880 794,890 782,880 776,845 766,808"),
           "side": P("505,755 582,755 590,800 590,850 582,890 562,906 532,906 510,885 488,858 487,820 494,790")})
# ---- hips, cube, legs, boots ------------------------------------------------------------------
add(name="hips", kind="c", axis="z", n=2.5, relief="grain", smooth=4, lo_weight=0.9,
    round_ends={"start": 0.03, "end": 0.0}, paint_skip=["top"],
    paint_box_skip={"back": [[320, 680, 395, 795]]},
    views={"front": P("376,705 512,700 648,705 656,760 650,800 640,850 512,860 384,850 374,800 370,760"),
           "side": P("380,700 500,698 605,700 602,760 600,800 600,860 395,860 393,800 388,760 378,730")})
add(name="cube", kind="one", axis="z", n=3.5, relief="none", smooth=1, lo_weight=0.7,
    round_ends={"start": 0.006, "end": 0.006}, paint_skip=["top"],
    views={"front": P("592,700 660,700 668,710 668,785 660,795 592,795 585,785 585,710"),
           "side": P("422,690 498,690 505,700 505,778 498,786 422,786 415,778 415,700")})
add(name="leg", kind="m", axis="z", n=2.2, relief="grain", smooth=5, lo_weight=1.1,
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    views={"front": P("518,780 640,780 700,830 707,900 716,1000 725,1100 722,1150 705,1250 572,1250 566,1150 554,1100 542,1000 528,900 514,845"),
           "side": P("392,780 600,780 600,830 590,900 578,1000 588,1100 590,1150 578,1250 445,1250 440,1150 428,1100 418,1000 405,900 397,830")})
add(name="boot", kind="m", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=1.1,
    round_ends={"start": 0.006, "end": 0.01}, paint_skip=["top"],
    views={"front": P("562,1160 735,1160 740,1230 714,1236 712,1330 760,1370 776,1420 774,1462 574,1462 572,1400 580,1340 585,1240 564,1232"),
           "side": P("425,1160 597,1160 596,1230 579,1236 580,1330 600,1380 607,1420 606,1455 318,1455 310,1410 330,1370 380,1345 420,1320 440,1236 426,1230")})

d = {"item": "player-a", "H": 1.55,
     "note": "Outlines in picture pixels of the source pictures (1024 x 1536). kind: c centred, m mirrored pair (traced on the hero's left, +X), one single off-centre. Names follow the two-legged skeleton's words.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
