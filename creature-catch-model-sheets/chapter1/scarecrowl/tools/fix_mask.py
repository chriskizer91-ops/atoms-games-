"""opus tool (round 3): add polygons to a view's outline mask, where make_views cut out pale paint.

usage: python3 -I fix_mask.py views.json VIEW "u,v u,v u,v ..." ["u,v ..." ...]

make_views.py finds the creature by its difference from the background grey. Very pale fur close to
that grey (Clovermouse's forehead in the side picture) is then taken for background and a notch is
cut into the outline. Each polygon (picture pixels) is added to the mask, small holes are filled,
and the printing copy (views.json "file") is rebuilt from the original picture with the new mask.
Run it before inpaint_view.py / repair_view.py, which edit the printing copy.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


def main():
    views_path, view = sys.argv[1], sys.argv[2]
    d = json.load(open(views_path))
    vd = d["views"][view]
    base = os.path.dirname(os.path.abspath(views_path))
    mpath = os.path.join(base, vd["mask"])
    m = Image.open(mpath).convert("L")
    dr = ImageDraw.Draw(m)
    for s in sys.argv[3:]:
        pts = [tuple(float(c) for c in p.split(",")) for p in s.split()]
        dr.polygon(pts, fill=255)
    a = ndimage.binary_fill_holes(np.asarray(m) > 127)
    Image.fromarray((a * 255).astype(np.uint8)).save(mpath)
    img = np.asarray(Image.open(os.path.join(base, vd["original"])).convert("RGB")).copy()
    img[~a] = (200, 200, 202)
    Image.fromarray(img).save(os.path.join(base, vd["file"]))
    print(f"{view}: mask now {int(a.sum())} px; printing copy rebuilt -> {vd['file']}")


if __name__ == "__main__":
    main()
