"""Repair a picture from itself for printing only (the outline masks are not touched).

usage: python3 -I repair_view.py views.json VIEW "x0,y0,x1,y1:dx,dy" ["x0,y0,x1,y1:dx,dy" ...] [--feather 10]

Each box is painted over with the same-size patch found dx, dy pixels away in the same
picture, blended in with soft edges. Used when a picture shows something in a place the 3D
model can't use, e.g. the side view's eye, which would otherwise print onto the cheek.
Reads the view's *_original.png and writes the printing copy (views.json "file").
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cc3d import BG_EXACT, load_rgb  # noqa: E402


def main():
    views_path, view = sys.argv[1], sys.argv[2]
    feather = 10
    jobs = []
    args = sys.argv[3:]
    i = 0
    while i < len(args):
        if args[i] == "--feather":
            feather = int(args[i + 1])
            i += 2
            continue
        box, off = args[i].split(":")
        jobs.append((tuple(int(v) for v in box.split(",")), tuple(int(v) for v in off.split(","))))
        i += 1
    d = json.load(open(views_path))
    vd = d["views"][view]
    base = os.path.dirname(os.path.abspath(views_path))
    img = load_rgb(os.path.join(base, vd["original"])).astype(np.float32)
    mask = np.asarray(Image.open(os.path.join(base, vd["mask"]))) > 127
    out = img.copy()
    for (x0, y0, x1, y1), (dx, dy) in jobs:
        w = np.zeros(img.shape[:2], np.float32)
        w[y0:y1, x0:x1] = 1
        # soft edge: fully replaced well inside the box, fading out across its border
        w = np.clip(ndimage.gaussian_filter(w, feather / 2.0) * 1.8, 0, 1)
        src = np.roll(np.roll(img, -dy, axis=0), -dx, axis=1)
        out = out * (1 - w[..., None]) + src * w[..., None]
    out = np.clip(out, 0, 255).astype(np.uint8)
    out[~mask] = BG_EXACT
    Image.fromarray(out).save(os.path.join(base, vd["file"]))
    print(f"repaired {view}: {len(jobs)} patch(es) -> {vd['file']}")


if __name__ == "__main__":
    main()
