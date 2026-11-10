"""Writes fern's parts.json (Fern, the Outpost healer). Outlines are in picture pixels of the 1024 x 1536 source pictures.
kind: c centred, m mirrored pair (traced on her left, +X: image right in the front picture, image LEFT in the back
picture), one = single part. Part names carry the two-legged skeleton's words (BRIEF_PEOPLE.md + BRIEF_PEOPLE_2.md).
Built like Rosa and Hazel (../rosa/tools/mkparts.py, ../hazel/tools/mkparts.py) and the heroes: smooth hand-drawn
outlines (nomask). The pinafore dress is split at the waist: `torso` above (blouse + bib), `skirt` below (dress +
petticoat ruffle); the sash's bow at the back is `skirt_bow` + `skirt_bow_tail`. The curly hair is one mass + a
fringe band + the curl on top (`hair_curl_top`) + two curl masses per side (`hair_lock`, `hair_lock_low`); the leaf
clip is `hair_leaf`."""
import json, sys
P = lambda s: [[int(a) for a in p.split(",")] for p in s.split()]
parts = []
def add(**k):
    parts.append(k)
# top picture mapping (set by redo_views.sh) for drawn top outlines: metres -> top picture pixels
TUC, TVC, TSX, TSY = 622, 586, 1120, 1000
def top(pts):
    return P(" ".join(f"{round(TUC - x * TSX)},{round(TVC + y * TSY)}" for x, y in pts))
def band(rows):  # rows of (x, y_front, y_back) -> top outline of a band running side to side
    return [(x, f) for x, f, b in rows] + [(x, b) for x, f, b in rows[::-1]]
HAIR_SKIP = ["skin", "green", "cream"]

# ---- head ------------------------------------------------------------------------------------
add(name="head", kind="c", axis="z", n=2.2, relief="none", smooth=5, lo_weight=4.0, nomask=["front", "side"],
    round_ends={"start": 0.02, "end": 0.05}, paint_skip=["top", "back"],
    paint_box_skip={"side": [[300, 100, 384, 300]]},
    views={"front": P("512,100 555,108 585,135 598,175 602,225 600,270 594,310 580,340 556,362 512,375 468,362 444,340 430,310 424,270 422,225 426,175 439,135 469,108"),
           "side": P("420,100 480,88 535,98 568,130 585,180 588,240 580,300 560,345 530,372 490,385 450,385 420,380 398,372 390,358 385,340 378,322 368,302 361,288 364,270 372,250 378,225 382,195 385,165 395,130")})
add(name="ear", kind="m", axis="z", n=2.2, relief="none", smooth=2, lo_weight=1.6, k_scale=1.6, n_scale=1.6,
    round_ends={"start": 0.008, "end": 0.01}, paint_skip=["top", "back", "side_far"], paint_color_skip=["hairbrown", "green"],
    views={"front": P("592,272 615,268 630,282 633,305 622,322 600,325 592,305"),
           "side": P("490,252 520,248 540,262 545,290 535,315 512,322 492,310 487,280")})
# main hair: one big upward-sliced mass of curls (the flicks and curls are paint); its front edge (side picture)
# steps back from the forehead to behind the ear
add(name="hair", kind="c", paint_color_skip=HAIR_SKIP, axis="z", n=2.2, relief="grain", smooth=8, lo_weight=2.6, nomask=["front", "side"],
    round_ends={"start": 0.03, "end": 0.04},
    views={"front": P("512,88 560,92 610,110 650,140 680,175 700,215 712,255 712,290 700,330 675,370 640,398 600,410 512,415 424,410 384,398 349,370 324,330 312,290 312,255 324,215 344,175 374,140 414,110 464,92"),
           "side": P("480,82 540,85 600,105 650,140 690,185 715,230 725,280 720,330 700,370 670,400 630,418 580,422 540,418 522,405 540,375 548,335 548,295 540,262 515,244 488,230 460,212 432,188 410,160 398,135 400,110 425,90")})
# the fringe: a band wrapping round the forehead from temple to temple, sliced side to side (axis x), so its lower
# edge follows the front picture's hairline (the locks crossing her forehead)
add(name="hair_bangs", kind="one", paint_color_skip=HAIR_SKIP, axis="x", n=2.0, relief="grain", smooth=3, lo_weight=2.4,
    nomask=["front", "top"], round_ends={"start": 0.012, "end": 0.012}, paint_skip=["top", "back"],
    views={"front": P("332,250 346,190 380,140 430,110 480,96 530,96 580,106 625,130 660,170 680,220 690,272 "
                      "660,290 628,292 604,268 598,205 585,162 560,149 532,152 516,175 510,224 500,236 480,216 456,206 442,250 432,300 400,298 350,280"),
           "top": top(band([(-0.205, -0.01, 0.05), (-0.17, -0.035, 0.03), (-0.14, -0.06, 0.01), (-0.11, -0.09, -0.02), (-0.09, -0.12, -0.05),
                             (-0.07, -0.145, -0.075), (-0.04, -0.165, -0.095), (0.0, -0.172, -0.10), (0.04, -0.165, -0.095), (0.07, -0.145, -0.075),
                             (0.09, -0.12, -0.05), (0.11, -0.09, -0.02), (0.14, -0.06, 0.01), (0.17, -0.035, 0.03), (0.205, -0.01, 0.05)]))})
# two curl masses per side break the hair's lower edge into curls (a mushroom-cap edge otherwise): one beside each
# cheek in front of the ear, one hanging behind each ear (mirrored pairs)
add(name="hair_lock", kind="m", paint_color_skip=HAIR_SKIP, axis="z", n=2.0, relief="grain", smooth=3, lo_weight=1.6, nomask=["front", "side"],
    round_ends={"start": 0.012, "end": 0.0}, paint_skip=["top", "back"],
    views={"front": P("598,316 640,314 654,348 650,385 632,407 612,402 602,370"),
           "side": P("468,316 526,314 534,350 527,390 506,407 486,402 472,365")})
add(name="hair_lock_low", kind="m", paint_color_skip=HAIR_SKIP, axis="z", n=2.0, relief="grain", smooth=3, lo_weight=1.6, nomask=["front", "side"],
    round_ends={"start": 0.012, "end": 0.0}, paint_skip=["top"],
    views={"front": P("640,296 690,296 707,330 707,366 692,396 666,410 648,392 640,350"),
           "side": P("540,296 625,296 632,340 616,386 584,422 552,422 538,380")})
# the curl standing up on top of her head (curving forward and to her right): a flat curved lock, sliced side to side
add(name="hair_curl_top", kind="one", paint_color_skip=HAIR_SKIP, axis="x", n=2.0, relief="grain", smooth=2, lo_weight=1.0,
    nomask=["front", "top"], round_ends={"start": 0.008, "end": 0.0}, paint_skip=["top"],
    views={"front": P("520,108 548,102 552,80 540,58 515,45 485,42 458,48 440,62 437,80 446,95 452,86 466,72 490,65 514,73 527,92"),
           "top": top([(0.05, 0.005), (-0.02, -0.05), (-0.085, -0.095), (-0.085, -0.13), (-0.02, -0.085), (0.05, -0.03)])})
# the leaf clip on her left side, above the ear (the side and back pictures agree on its height; the front draws it lower)
add(name="hair_leaf", kind="one", axis="z", n=2.2, relief="none", smooth=2, lo_weight=0.8, nomask=["front", "side"],
    round_ends={"start": 0.004, "end": 0.004}, paint_skip=["top", "front"],
    views={"front": P("690,208 712,204 728,220 730,250 720,272 698,272 688,240"),
           "side": P("536,222 560,210 600,204 630,212 618,236 608,270 590,272 560,250 540,240")})
# ---- neck, torso (blouse + pinafore bib) -----------------------------------------------------
add(name="neck", kind="c", axis="z", n=2.0, relief="none", smooth=3, lo_weight=0.5, paint_skip=["top", "back"], paint_color_skip=["hairbrown"],
    views={"front": P("475,340 548,340 552,445 471,445"),
           "side": P("440,340 520,340 525,445 438,445")})
add(name="torso", kind="c", axis="z", n=2.6, relief="grain", smooth=6, lo_weight=1.1, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.03}, paint_skip=["top"],
    paint_box_skip={"side": [[535, 585, 640, 680]]},
    views={"front": P("440,430 475,424 512,422 550,424 585,430 600,445 600,500 597,560 590,640 434,640 427,560 424,500 424,445"),
           "side": P("440,425 495,420 535,430 555,460 560,520 552,580 545,640 400,640 396,600 390,560 384,510 388,470 410,440")})
# ---- arms (puffed sleeve + cuff + forearm in one part) and hands -----------------------------
add(name="arm", kind="m", axis="z", n=2.2, relief="grain", smooth=4, lo_weight=2.0, nomask=["front", "side"],
    round_ends={"start": 0.015, "end": 0.0}, paint_skip=["top"],
    views={"front": P("590,430 630,432 670,448 705,475 722,515 722,560 726,595 745,640 770,690 790,730 806,770 760,780 745,735 715,690 690,650 662,610 640,600 618,580 605,540 595,490"),
           "side": P("455,425 520,422 555,440 570,480 570,530 560,570 548,600 548,630 525,640 525,776 455,776 456,640 445,628 430,590 422,540 425,480 435,445")})
add(name="hand", kind="m", axis="z", n=2.3, relief="none", smooth=3, lo_weight=2.2, nomask=["front", "side"],
    round_ends={"start": 0.008, "end": 0.02}, paint_skip=["top"],
    views={"front": P("745,742 798,736 815,790 835,820 843,845 832,853 815,840 800,815 782,800 765,785 750,765"),
           "side": P("430,724 512,724 512,780 508,830 495,860 470,866 448,852 425,810 420,760")})
# ---- below the waist: skirt (dress + petticoat), the sash's bow, legs, boots --------------------
add(name="skirt", kind="c", axis="z", n=2.2, relief="grain", smooth=6, lo_weight=1.1, nomask=["front", "side"],
    round_ends={"start": 0.012, "end": 0.0}, paint_skip=["top"],
    paint_box_skip={"side": [[418, 595, 532, 872], [535, 585, 665, 805]]},
    views={"front": P("445,618 580,618 600,650 620,700 645,750 668,800 692,850 716,900 735,950 745,990 752,1035 742,1062 680,1080 512,1086 344,1080 282,1062 272,1035 279,990 289,950 308,900 332,850 356,800 379,750 404,700 424,650"),
           "side": P("400,622 545,622 560,660 578,710 600,770 622,830 645,890 668,950 680,1000 684,1040 668,1065 600,1080 450,1084 330,1080 290,1065 284,1035 288,995 296,950 310,890 325,830 342,770 360,710 382,660")})
add(name="skirt_bow", kind="c", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=0.9, nomask=["back", "side"],
    round_ends={"start": 0.012, "end": 0.012}, paint_skip=["front", "top"], order=["back", "side"],
    views={"back": P("400,602 430,590 490,595 512,593 535,595 595,590 622,602 620,650 605,682 575,686 540,650 512,645 484,650 450,686 418,682 402,650"),
           "side": P("540,588 590,588 620,600 632,630 625,660 600,672 540,672")})
add(name="skirt_bow_tail", kind="m", axis="z", n=2.4, relief="grain", smooth=3, lo_weight=0.6, nomask=["back", "side"],
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["front", "top"], order=["back", "side"],
    views={"back": P("496,640 512,640 508,700 498,760 492,800 478,800 430,778 455,720 480,670"),
           "side": P("560,650 592,650 620,700 648,750 656,795 636,800 618,760 590,710")})
add(name="leg", kind="m", axis="z", n=2.2, relief="none", smooth=5, lo_weight=0.35, nomask=["front", "side"],
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    paint_box_skip={"front": [[540, 1040, 670, 1086], [349, 1040, 479, 1086]], "back": [[540, 1040, 670, 1086], [349, 1040, 479, 1086]]},
    views={"front": P("518,765 612,765 640,900 652,1000 650,1100 648,1200 645,1300 640,1395 575,1395 572,1300 570,1200 562,1100 550,1000 532,900"),
           "side": P("448,765 572,765 570,900 566,1000 565,1100 562,1200 556,1300 552,1395 470,1395 466,1300 460,1200 456,1100 452,1000 450,900")})
add(name="boot", kind="m", axis="z", n=2.6, relief="grain", smooth=3, lo_weight=1.1,
    round_ends={"start": 0.0, "end": 0.0}, paint_skip=["top"],
    views={"front": P("560,1202 685,1202 688,1240 682,1285 682,1340 700,1370 716,1400 720,1452 568,1452 566,1400 572,1340 572,1285 562,1250"),
           "side": P("455,1205 590,1205 592,1250 586,1285 592,1350 596,1450 352,1450 350,1420 360,1395 395,1378 440,1362 456,1330 458,1285 452,1250")})

d = {"item": "fern", "H": 1.6, "ring_ease": 0.35,
     "note": "Outlines in picture pixels of the source pictures (1024 x 1536). kind: c centred, m mirrored pair (traced on her left, +X), one single part. Names follow the two-legged skeleton's words (skirt = pinafore dress below the waist).",
     "budget": {"small": 7000, "texture": 2048}, "parts": parts}
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(len(parts), "parts")
