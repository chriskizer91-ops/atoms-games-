"""Writes player-b's parts.json (the girl). Outlines are in picture pixels of the 1024 x 1536 source pictures.
kind: c centred, m mirrored pair (traced on the hero's left, +X: image right in the front picture), one = single off-centre.
Part names carry the two-legged skeleton's words (see BRIEF_PEOPLE.md). Built the same way as player-a's
(see ../player-a/NOTES.md): smooth hand-drawn outlines (nomask) for the head, hair, torso, arms and legs."""
import json, sys
P = lambda s: [[int(a) for a in p.split(",")] for p in s.split()]
parts = []
def add(**k):
    parts.append(k)
# top picture mapping (set by redo_views.sh) for drawn top outlines: metres -> top picture pixels
TUC, TVC, TSX, TSY = 626, 619, 1147, 976
def top(pts):
    return P(" ".join(f"{round(TUC - x * TSX)},{round(TVC + y * TSY)}" for x, y in pts))
def sym(rows):  # rows of (y, half-width) -> symmetric top outline
    return [(-h, y) for y, h in rows] + [(h, y) for y, h in rows[::-1]]

# ---- head ------------------------------------------------------------------------------------
add(name="head", kind="c", axis="z", n=2.2, relief="none", smooth=5, lo_weight=4.0, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.05}, paint_skip=["top", "back"],
    views={"front": P("512,95 545,99 574,115 592,145 600,185 599,225 596,255 595,285 589,312 576,338 550,358 530,368 512,371 494,368 474,358 448,338 435,312 429,285 428,255 425,225 424,185 432,145 450,115 479,99"),
           "side": P("440,80 510,78 556,94 582,124 592,168 591,228 582,278 562,312 538,328 505,338 480,346 450,360 420,368 400,365 388,355 380,335 374,310 369,285 369,255 371,225 375,195 385,160 400,125 415,100")})
add(name="ear", kind="m", paint_color_skip=["dark"], axis="z", n=2.2, relief="none", smooth=2, lo_weight=4.0, k_scale=1.6, n_scale=1.6,
    round_ends={"start": 0.008, "end": 0.01}, paint_skip=["top", "back", "side_far"],
    views={"front": P("596,270 615,264 630,272 637,292 633,314 621,326 607,328 596,318"),
           "side": P("505,243 518,250 524,268 522,292 512,308 496,313 486,300 485,270 492,250")})
# The main hair is sliced upward; its front edge (side picture) steps back from the forehead to behind
# the ears, so it frames the face with no brim. The outline is a smooth hull through the strands' bases.
add(name="hair", kind="c", paint_color_skip=["skin", "orange"], axis="z", n=2.2, relief="grain", smooth=8, lo_weight=2.4, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.05},
    views={"front": P("512,66 553,72 603,88 638,110 661,135 675,165 685,200 689,235 680,265 668,295 648,322 625,345 600,360 423,360 398,345 375,322 355,295 343,265 334,235 338,200 348,165 362,135 385,110 420,88 470,72"),
           "side": P("430,72 480,64 540,68 590,85 625,110 648,150 655,200 650,250 638,290 615,325 580,345 545,358 500,358 492,345 520,330 528,300 527,270 524,250 490,240 455,236 425,226 400,212 386,195 378,170 385,140 400,110")})
# the fringe: a pad in front of the forehead, sliced front-to-back so its lower edge arcs up at the temples
add(name="hair_bangs", kind="c", paint_color_skip=["skin", "orange"], axis="y", n=2.2, relief="grain", smooth=3, lo_weight=2.5, nomask=["side", "top"],
    round_ends={"start": 0.012, "end": 0.0}, paint_skip=["back"],
    views={"side": P("344,145 354,122 372,106 395,96 424,90 424,222 395,222 372,218 356,210 344,196"),
           "top": top(sym([(-0.232, 0.06), (-0.22, 0.085), (-0.2, 0.10), (-0.175, 0.115), (-0.15, 0.12), (-0.138, 0.12)]))})
# the long locks that hang in front of each ear down to the jaw (a mirrored pair)
add(name="hair_lock", kind="m", paint_color_skip=["skin", "orange"], axis="z", n=2.0, relief="grain", smooth=3, lo_weight=2.0, nomask=["front", "side"],
    round_ends={"start": 0.004, "end": 0.0}, paint_skip=["top"],
    views={"front": P("578,236 614,236 616,280 610,318 600,352 590,330 581,290"),
           "side": P("452,226 497,226 495,270 487,320 473,368 463,348 456,300 450,262")})
# strands hanging at each side behind the ear (a mirrored pair), so the hair's lower edge ends in points
add(name="hair_lock_low", kind="m", paint_color_skip=["skin", "orange"], axis="z", n=2.0, relief="grain", smooth=3, lo_weight=1.6, nomask=["front", "side"],
    round_ends={"start": 0.004, "end": 0.0}, paint_skip=["top"],
    views={"front": P("636,250 680,250 682,280 676,305 664,334 650,312 640,285"),
           "side": P("530,250 612,250 606,285 590,318 574,346 560,346 546,318 534,285")})
# the ponytail: its own part so it can sway (a two-bone chain hanging from the head). It rises from the
# orange tie at the top of the head, fans up and back, and hangs down behind her left shoulder.
add(name="ponytail", kind="one", paint_color_skip=["skin"], axis="z", n=2.0, relief="grain", smooth=7, lo_weight=2.4, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.012}, paint_skip=["top"],
    views={"front": P("586,18 626,15 660,28 668,55 650,80 636,108 640,135 676,150 712,168 740,195 746,240 740,295 727,345 705,392 682,412 664,400 652,352 636,300 616,250 600,205 588,170 566,146 538,128 532,98 545,68 568,38"),
           "side": P("560,26 600,15 646,20 676,40 690,70 690,100 700,128 744,140 778,160 790,200 784,240 768,280 744,325 716,372 690,414 660,420 648,380 638,330 624,280 612,232 606,190 598,158 566,148 548,118 550,72")})
# the plume at the top of the ponytail that curls over to her left and back: sliced sideways (axis x)
# with a drawn top outline (a band running back and to her left), so it is a curved lock, not a block
add(name="ponytail_plume", kind="one", paint_color_skip=["skin"], axis="x", n=2.0, relief="grain", smooth=3, lo_weight=2.0,
    nomask=["front", "top"], round_ends={"start": 0.0, "end": 0.01}, paint_skip=["top"],
    views={"front": P("596,44 630,22 668,30 704,56 732,88 748,122 744,140 716,142 690,128 660,108 628,92 600,86"),
           "top": top([(0.09, -0.01), (0.26, 0.15), (0.26, 0.27), (0.09, 0.11)])})
# ---- neck, collar, torso (vest), backpack ----------------------------------------------------
add(name="neck", kind="c", paint_color_skip=["orange", "dark"], axis="z", n=2.0, relief="none", smooth=3, lo_weight=0.5, paint_skip=["top"],
    views={"front": P("474,320 550,320 552,425 472,425"),
           "side": P("415,320 497,320 497,425 415,425")})
add(name="collar", kind="c", paint_color_skip=["dark"], axis="z", n=2.2, relief="grain", smooth=4, lo_weight=1.0,
    round_ends={"start": 0.0, "end": 0.012}, paint_skip=["top"],
    views={"front": P("405,372 450,360 512,356 575,360 640,372 634,400 628,438 398,438 392,400"),
           "side": P("410,362 470,352 540,348 576,352 572,390 562,430 420,436 404,400")})
add(name="vest", kind="c", axis="z", n=2.6, relief="grain", smooth=6, lo_weight=1.0, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.03}, paint_skip=["top"],
    paint_box_skip={"back": [[330, 660, 405, 735]], "side": [[355, 668, 455, 765]]},
    views={"front": P("400,420 512,414 623,420 640,445 642,500 640,560 640,620 645,650 646,680 378,680 377,650 382,620 384,560 382,500 384,445"),
           "side": P("420,418 500,410 552,415 556,450 558,520 556,600 554,680 360,680 362,640 364,600 368,540 374,500 390,462 405,436")})
add(name="backpack", kind="c", axis="z", n=3.2, relief="grain", smooth=4, lo_weight=0.8,
    round_ends={"start": 0.015, "end": 0.02}, paint_skip=["front", "top"],
    views={"back": P("420,442 512,435 605,442 625,480 628,560 625,630 605,662 512,668 418,662 398,630 395,560 398,480"),
           "side": P("548,442 600,440 635,452 655,490 664,560 660,620 640,660 600,670 552,668 546,560")},
    order=["back", "side"])
# ---- arms and gloved hands ---------------------------------------------------------------------
add(name="arm", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=2.2, nomask=["front", "side"],
    round_ends={"start": 0.012, "end": 0.0}, paint_skip=["top"],
    views={"front": P("612,432 640,432 655,450 668,480 681,505 684,540 692,560 707,580 728,615 748,645 768,672 786,702 722,702 704,675 684,645 664,615 650,585 645,565 638,545 626,520 612,495"),
           "side": P("460,420 505,412 548,420 556,450 557,520 555,560 536,572 535,640 538,702 468,702 470,640 470,572 450,560 447,500 450,445")})
add(name="hand", kind="m", axis="z", n=2.3, relief="none", smooth=3, lo_weight=2.5, nomask=["front", "side"],
    round_ends={"start": 0.008, "end": 0.02}, paint_skip=["top"],
    views={"front": P("722,688 770,672 798,680 808,700 815,740 840,780 852,820 860,858 858,882 838,882 820,862 800,850 785,820 765,785 745,745 728,712"),
           "side": P("462,684 545,684 549,750 552,800 550,860 540,895 520,905 490,900 470,870 455,840 458,790 462,750")})
# ---- hips, cube, legs, boots ------------------------------------------------------------------
add(name="hips", kind="c", axis="z", n=2.5, relief="grain", smooth=4, lo_weight=0.8,
    round_ends={"start": 0.03, "end": 0.0}, paint_skip=["top"],
    paint_box_skip={"back": [[330, 660, 405, 765]], "side": [[355, 668, 455, 765], [440, 676, 562, 912]]},
    views={"front": P("395,662 512,658 628,662 640,700 648,740 651,780 645,830 512,845 380,830 372,780 380,740 388,700"),
           "side": P("363,658 560,658 568,700 572,740 572,780 568,840 380,840 378,780 362,740 360,700")})
add(name="cube", kind="one", axis="z", n=3.5, relief="none", smooth=1, lo_weight=1.0, n_scale=1.5,
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    views={"front": P("590,680 660,680 668,690 668,752 660,762 590,762 582,752 582,690"),
           "side": P("368,675 442,675 450,684 450,752 442,762 368,762 360,752 360,684")})
add(name="leg", kind="m", axis="z", n=2.2, relief="grain", smooth=5, lo_weight=0.9, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"], paint_box_skip={"side": [[355, 668, 455, 765], [440, 676, 562, 912]]},
    views={"front": P("518,770 650,770 676,820 680,900 686,1000 694,1060 705,1110 718,1140 720,1196 702,1206 700,1262 607,1262 606,1206 572,1196 570,1140 562,1100 562,1060 555,1000 540,940 528,880 518,840 512,810"),
           "side": P("380,770 570,770 560,850 555,950 558,1000 575,1060 580,1100 588,1130 588,1192 560,1202 560,1262 450,1262 450,1202 412,1192 412,1120 406,1060 403,1000 392,950 382,850")})
add(name="boot", kind="m", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=1.0,
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    views={"front": P("592,1226 724,1226 727,1290 736,1330 755,1370 763,1410 761,1445 592,1445 588,1400 592,1340 596,1290"),
           "side": P("436,1222 560,1220 578,1240 580,1300 585,1360 588,1400 587,1426 325,1426 322,1395 330,1360 360,1340 400,1320 430,1290 436,1255")})

d = {"item": "player-b", "H": 1.55, "ring_ease": 0.35,
     "note": "Outlines in picture pixels of the source pictures (1024 x 1536). kind: c centred, m mirrored pair (traced on the hero's left, +X), one single off-centre. Names follow the two-legged skeleton's words.",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
