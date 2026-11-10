"""Writes tinker's parts.json (Tinker, a village kid). Outlines are in picture pixels of the 1024 x 1536 source pictures.
kind: c centred, m mirrored pair (traced on Tinker's left, +X: image right in the front picture, image left in the
back picture), one = single off-centre. Part names carry the two-legged skeleton's words (BRIEF_PEOPLE.md and
BRIEF_PEOPLE_2.md): the tuft tied on top is `ponytail` (a swaying two-bone chain from the head).
Built the heroes' way (../player-a/NOTES.md, ../player-b/NOTES.md): smooth hand-drawn outlines (nomask) for the
head, hair, torso, arms and legs; one upward-sliced hair mass plus a fringe; the spikes are paint."""
import json, sys
P = lambda s: [[int(a) for a in p.split(",")] for p in s.split()]
parts = []
def add(**k):
    parts.append(k)
# top picture mapping (set by redo_views.sh) for drawn top outlines: metres -> top picture pixels
TUC, TVC, TSX, TSY = 620, 670, 1490, 1490
def top(pts):
    return P(" ".join(f"{round(TUC - x * TSX)},{round(TVC + y * TSY)}" for x, y in pts))
def sym(rows):  # rows of (y, half-width) -> symmetric top outline
    return [(-h, y) for y, h in rows] + [(h, y) for y, h in rows[::-1]]
HAIR_SKIP = ["skin_pale"]  # blond hair is close to skin; this skin test leaves the pale yellow hair alone

# ---- head ------------------------------------------------------------------------------------
add(name="head", kind="c", axis="z", n=2.2, relief="none", smooth=5, lo_weight=4.0, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.045}, paint_skip=["top", "back"],
    views={"front": P("510,200 560,205 600,230 618,280 622,340 620,390 612,425 592,455 560,475 510,483 460,475 428,455 408,425 400,390 398,340 402,280 420,230 460,205"),
           "side": P("440,190 500,185 545,200 572,240 580,300 577,360 562,410 530,450 482,474 440,481 405,478 384,467 373,450 367,428 361,407 357,390 361,370 368,345 372,310 376,270 390,232 410,205")})
add(name="ear", kind="m", axis="z", n=2.2, relief="none", smooth=2, lo_weight=4.0, k_scale=1.6, n_scale=1.6,
    round_ends={"start": 0.007, "end": 0.009}, paint_skip=["top", "back", "side_far"],
    views={"front": P("610,382 632,372 650,380 657,405 652,428 638,442 620,440 610,425"),
           "side": P("492,368 510,360 530,366 542,390 540,418 528,435 508,438 494,425 489,395")})
# The main hair is sliced upward; its front edge (side picture) steps back from the forehead to behind the
# ear, so it frames the face with no brim. The outline is a smooth hull through the spikes' bases.
add(name="hair", kind="c", axis="z", n=2.2, relief="grain", smooth=8, lo_weight=2.4, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.04}, paint_color_skip=HAIR_SKIP,
    views={"front": P("510,160 570,165 625,185 655,220 675,260 692,300 697,345 685,390 665,430 640,460 610,475 410,475 380,460 355,430 330,390 312,345 310,300 322,255 345,215 390,183 450,165"),
           "side": P("450,165 520,160 580,170 630,195 672,230 700,270 715,315 712,360 695,400 665,435 630,462 590,470 560,457 550,430 545,400 540,365 505,335 470,312 440,290 410,262 385,240 380,215 395,190 420,173")})
# the fringe: a pad of spikes in front of the forehead, sliced front-to-back so its lower edge arcs up at the temples
add(name="hair_bangs", kind="c", axis="y", n=2.2, relief="grain", smooth=3, lo_weight=2.5, nomask=["side", "top"],
    round_ends={"start": 0.012, "end": 0.0}, paint_skip=["back"], paint_color_skip=HAIR_SKIP,
    views={"side": P("350,235 356,210 370,190 395,176 440,170 470,170 470,272 420,276 380,278 360,272 351,258"),
           "top": top(sym([(-0.143, 0.04), (-0.137, 0.065), (-0.125, 0.09), (-0.105, 0.104), (-0.08, 0.108), (-0.04, 0.108)]))})
# the tuft tied on top (its own part so it can sway): the brown tie and the fountain of spikes above it
add(name="ponytail", kind="c", axis="z", n=2.0, relief="grain", smooth=5, lo_weight=2.4, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.02}, paint_color_skip=HAIR_SKIP,
    views={"front": P("432,190 558,190 572,155 605,125 648,112 686,128 690,100 660,70 612,45 562,26 520,30 482,55 442,62 416,78 424,112 434,145"),
           "side": P("478,198 563,203 590,172 640,152 700,142 735,150 736,112 700,88 652,60 602,40 560,50 520,80 482,110 470,150")})
# ---- neck, torso (t-shirt), hips (shorts) -------------------------------------------------------
add(name="neck", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=0.5, paint_skip=["top"],
    views={"front": P("474,440 546,440 548,530 472,530"),
           "side": P("430,450 515,450 518,530 428,530")})
add(name="torso", kind="c", axis="z", n=2.6, relief="grain", smooth=6, lo_weight=1.1, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.03}, paint_skip=["top"],
    views={"front": P("510,512 560,515 610,530 640,555 650,600 646,660 643,720 648,780 656,830 655,858 365,858 363,830 372,780 377,720 374,660 370,600 380,555 410,530 460,515"),
           "side": P("430,512 490,508 530,515 552,540 560,600 565,660 570,720 576,780 580,830 575,852 352,852 350,820 356,780 362,720 370,660 382,600 400,555 418,530")})
add(name="hips", kind="c", axis="z", n=2.5, relief="grain", smooth=4, lo_weight=0.8,
    round_ends={"start": 0.03, "end": 0.0}, paint_skip=["top"],
    paint_box_skip={"side": [[455, 800, 565, 950]]},
    views={"front": P("366,838 654,838 668,880 676,930 640,946 510,952 380,946 343,930 352,880"),
           "side": P("354,834 580,834 578,880 576,945 358,945 356,880")})
# ---- arms and hands ---------------------------------------------------------------------------
add(name="arm", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=2.2, nomask=["front", "side"],
    round_ends={"start": 0.012, "end": 0.0}, paint_skip=["top"],
    views={"front": P("598,522 630,528 668,560 700,595 715,625 712,640 722,665 740,700 760,735 780,765 800,804 742,810 722,780 700,752 680,728 662,705 640,700 628,660 622,600 610,560"),
           "side": P("470,515 530,512 562,535 575,580 577,640 572,690 540,700 538,750 540,806 472,806 472,750 474,700 445,690 438,640 440,580 450,540")})
add(name="hand", kind="m", axis="z", n=2.3, relief="none", smooth=3, lo_weight=2.5, nomask=["front", "side"],
    round_ends={"start": 0.008, "end": 0.018}, paint_skip=["top"],
    views={"front": P("742,796 802,792 815,830 830,860 840,895 838,920 822,928 805,915 790,895 770,870 752,840 744,815"),
           "side": P("470,796 542,796 552,830 557,870 552,910 540,940 515,948 490,940 470,915 460,880 462,840")})
# ---- legs (shorts leg, bare leg, sock) and shoes --------------------------------------------------
add(name="leg", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=1.0, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"], paint_box_skip={"side": [[455, 800, 565, 950]]},
    views={"front": P("515,880 670,880 680,940 684,985 672,998 645,1002 650,1040 660,1080 670,1120 674,1160 690,1175 700,1200 705,1250 700,1296 585,1296 580,1250 576,1200 580,1175 590,1160 580,1120 572,1080 562,1040 560,1002 522,998 517,950"),
           "side": P("362,880 574,880 576,940 576,985 560,998 527,1002 532,1040 542,1080 549,1120 552,1150 566,1170 572,1200 572,1250 568,1295 420,1295 424,1250 430,1200 436,1165 446,1140 440,1100 430,1060 420,1030 413,1002 370,998 358,985 357,940")})
add(name="shoe", kind="m", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=1.0,
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    views={"front": P("590,1250 700,1250 712,1290 722,1320 740,1345 752,1370 758,1400 756,1431 580,1431 576,1390 583,1340 588,1290"),
           "side": P("428,1250 560,1250 570,1290 578,1320 585,1360 591,1400 590,1430 302,1430 300,1395 310,1360 330,1325 370,1300 405,1278")})

d = {"item": "tinker", "H": 1.2, "ring_ease": 0.35,
     "note": "Outlines in picture pixels of the source pictures (1024 x 1536). kind: c centred, m mirrored pair (traced on Tinker's left, +X), one single off-centre. Names follow the two-legged skeleton's words.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
