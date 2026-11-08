"""opus tool: print-only repair that paints over ellipses in a picture with the smooth surrounding colour.

usage: python3 -I inpaint_view.py views.json VIEW "cx,cy,rx,ry" ["cx,cy,rx,ry" ...] [--sigma 18] [--grain 0.6]

Unlike repair_view.py (copies a patch from elsewhere in the picture), this fills each ellipse with
the blurred colour of what surrounds it, plus a little of the picture's own fine grain, so a feature
(e.g. the side view's eye and blush, which belong on the front of the face) disappears without a seam.
Reads and writes the view's printing copy (views.json "file"); the outline mask is not touched.
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def main():
    views_path, view = sys.argv[1], sys.argv[2]
    sigma, grain = 18.0, 0.6
    ells = []
    a = sys.argv[3:]
    i = 0
    while i < len(a):
        if a[i] == "--sigma":
            sigma = float(a[i + 1]); i += 2; continue
        if a[i] == "--grain":
            grain = float(a[i + 1]); i += 2; continue
        ells.append(tuple(float(v) for v in a[i].split(","))); i += 1
    d = json.load(open(views_path))
    vd = d["views"][view]
    base = os.path.dirname(os.path.abspath(views_path))
    path = os.path.join(base, vd["file"])
    img = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    msk = np.asarray(Image.open(os.path.join(base, vd["mask"]))) > 127
    h, w = msk.shape
    yy, xx = np.mgrid[0:h, 0:w]
    hole = np.zeros((h, w), bool)
    for cx, cy, rx, ry in ells:
        hole |= ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
    known = (msk & ~hole).astype(np.float32)
    fill = np.zeros_like(img)
    # normalised convolution at a few scales: the smallest scale that has support wins
    wsum = ndimage.gaussian_filter(known, sigma)
    for c in range(3):
        fill[..., c] = ndimage.gaussian_filter(img[..., c] * known, sigma) / np.maximum(wsum, 1e-6)
    # fine grain borrowed from the surrounding texture, shifted in from the right
    hp = img - np.stack([ndimage.gaussian_filter(img[..., c], 3) for c in range(3)], -1)
    shift = int(max(rx for _, _, rx, _ in ells) * 2.2)
    fill += grain * np.roll(hp, -shift, axis=1)
    wgt = ndimage.gaussian_filter(hole.astype(np.float32), 4)
    wgt = np.clip(wgt * 1.6, 0, 1)[..., None]
    out = img * (1 - wgt) + fill * wgt
    out[~msk] = (200, 200, 202)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(path)
    print(f"inpainted {view}: {len(ells)} ellipse(s) -> {vd['file']}")


if __name__ == "__main__":
    main()
