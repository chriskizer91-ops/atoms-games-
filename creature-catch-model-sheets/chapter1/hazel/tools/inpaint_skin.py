"""New tool (chapter 1, player-a): print-only repair that paints over ellipses in a picture with the
surrounding SKIN colour only.

usage: python3 -I inpaint_skin.py views.json VIEW "cx,cy,rx,ry" ["cx,cy,rx,ry" ...] [--sigma 14]

Like round 2's inpaint_view.py (fills each ellipse with the blurred colour of what surrounds it), but
only skin-coloured pixels count as the surroundings. On a person the side picture's eyebrow touches
the hair, and inpaint_view.py blends brown hair into the fill, which prints a brown smear on the
temple. Skin here: bright, warm, red > green > blue. Reads and writes the view's printing copy.
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def main():
    views_path, view = sys.argv[1], sys.argv[2]
    sigma = 14.0
    ells = []
    a = sys.argv[3:]
    i = 0
    while i < len(a):
        if a[i] == "--sigma":
            sigma = float(a[i + 1]); i += 2; continue
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
    R, G, B = img[..., 0], img[..., 1], img[..., 2]
    skin = (R > 205) & (G > 150) & (B > 105) & (R > G + 15) & (G > B + 10)
    skin = ndimage.binary_erosion(skin, iterations=2)
    known = (msk & ~hole & skin).astype(np.float32)
    fill = np.zeros_like(img)
    wsum = ndimage.gaussian_filter(known, sigma)
    for c in range(3):
        fill[..., c] = ndimage.gaussian_filter(img[..., c] * known, sigma) / np.maximum(wsum, 1e-6)
    # a wider pass where the narrow one has no skin nearby
    wsum2 = ndimage.gaussian_filter(known, sigma * 3)
    fill2 = np.stack([ndimage.gaussian_filter(img[..., c] * known, sigma * 3) / np.maximum(wsum2, 1e-6) for c in range(3)], -1)
    t = np.clip(wsum / 0.15, 0, 1)[..., None]
    fill = fill * t + fill2 * (1 - t)
    wgt = np.clip(ndimage.gaussian_filter(hole.astype(np.float32), 3) * 1.6, 0, 1)[..., None]
    out = img * (1 - wgt) + fill * wgt
    out[~msk] = (200, 200, 202)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(path)
    print(f"skin-inpainted {view}: {len(ells)} ellipse(s) -> {vd['file']}")


if __name__ == "__main__":
    main()
