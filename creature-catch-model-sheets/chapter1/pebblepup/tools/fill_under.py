"""opus tool (round 3): print-only fill of fur under a hat that the picture draws face-on.

usage: python3 -I fill_under.py views.json VIEW --hole "u,v u,v ..." --from-row R --known "u,v ..."
                                [--sigma 24] [--grain 0.8] [--grain-src u0,v0,u1,v1] [--grow 3] [--min-lum 150]
                                [--protect "cx,cy,rx,ry;..."] [--feather 2]

Clovermouse's front and back pictures draw the clover hat face-on, as if seen from above, so it
covers the forehead and the back of the head. The model's clover is a flat hat (as the side and
top pictures show), so below its rim those picture pixels would print green leaves onto the head.
This paints the hat's pixels at and below row R with the colour of the fur in the "known" area
(normalised blur; pixels darker than --min-lum, e.g. eyebrows, are left out), plus fine fur grain
tiled from a clean patch of fur elsewhere in the same picture (--grain-src). The hat outline is grown
by --grow pixels so its shadow on the fur goes too. Rows above R (the hat's rim on the model) keep
their paint. --protect ellipses (e.g. eyebrows next to the hat's shadow) are never painted over.
Reads and writes the view's printing copy (views.json "file"); the outline mask is not touched.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


def arg(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def poly(shape, s):
    im = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(im).polygon([tuple(float(c) for c in p.split(",")) for p in s.split()], fill=255)
    return np.asarray(im) > 127


def main():
    views_path, view = sys.argv[1], sys.argv[2]
    d = json.load(open(views_path))
    vd = d["views"][view]
    base = os.path.dirname(os.path.abspath(views_path))
    path = os.path.join(base, vd["file"])
    img = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    msk = np.asarray(Image.open(os.path.join(base, vd["mask"]))) > 127
    h, w = msk.shape
    hole = ndimage.binary_dilation(poly(msk.shape, arg("--hole")), iterations=int(arg("--grow", "3")))
    row0 = float(arg("--from-row"))
    sigma = float(arg("--sigma", "24"))
    grain = float(arg("--grain", "0.8"))
    L = img @ np.array([0.299, 0.587, 0.114], np.float32)
    known = msk & ~hole & poly(msk.shape, arg("--known")) & (L > float(arg("--min-lum", "150")))
    k = known.astype(np.float32)
    ws = ndimage.gaussian_filter(k, sigma)
    # normalised blur of the known fur, fading smoothly to the known area's mean colour far from it
    mean = img[known].mean(axis=0)
    eps = 0.03
    fill = (np.stack([ndimage.gaussian_filter(img[..., c] * k, sigma) for c in range(3)], -1) + eps * mean) / (ws + eps)[..., None]
    hp = img - np.stack([ndimage.gaussian_filter(img[..., c], 2.5) for c in range(3)], -1)
    yy, xx = np.mgrid[0:h, 0:w]
    g = np.zeros_like(img)
    if arg("--grain-src"):
        u0, v0, u1, v1 = (int(c) for c in arg("--grain-src").split(","))
        patch = hp[v0:v1, u0:u1]
        g = patch[yy % (v1 - v0), xx % (u1 - u0)]
    write = hole & msk & (yy >= row0)
    prot = np.zeros_like(write)
    if arg("--protect"):
        for e in arg("--protect").split(";"):
            cx, cy, rx, ry = (float(c) for c in e.split(","))
            prot |= ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
    fe = float(arg("--feather", "2"))
    wt = np.clip(ndimage.gaussian_filter(write.astype(np.float32), fe) * 1.5, 0, 1) * msk
    wt *= 1 - np.clip(ndimage.gaussian_filter(prot.astype(np.float32), 1.5) * 2, 0, 1)
    wt = wt[..., None]
    out = img * (1 - wt) + (fill + grain * g) * wt
    out[~msk] = (200, 200, 202)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(path)
    print(f"filled {view}: {int(write.sum())} px under the hat from row {row0:.0f}")


if __name__ == "__main__":
    main()
