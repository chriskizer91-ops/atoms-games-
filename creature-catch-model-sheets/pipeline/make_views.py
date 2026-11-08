"""Put the front / side / back / top pictures on one shared scale in metres.

usage: python3 -I make_views.py OUTDIR H front.png side.png back.png top.png

Writes OUTDIR/views.json, a mask per view, and a copy of each picture with its
background replaced by the exact method grey. Front, side and back are scaled by the
creature's height H. The top view is stretched to the front view's width and the side
view's length ("remap"), because image generators rarely keep its scale.
"""
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cc3d import BG_EXACT, load_rgb, silhouette  # noqa: E402


def bbox(m):
    ys, xs = np.where(m)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def main():
    out, H = sys.argv[1], float(sys.argv[2])
    files = dict(zip(["front", "side", "back", "top"], sys.argv[3:7]))
    os.makedirs(out, exist_ok=True)
    views = {}
    boxes = {}
    for name, f in files.items():
        a = load_rgb(f)
        m, bg = silhouette(a)
        x0, y0, x1, y1 = bbox(m)
        boxes[name] = (x0, y0, x1, y1)
        clean = a.copy()
        clean[~m] = BG_EXACT
        Image.fromarray(clean).save(os.path.join(out, f"{name}.png"))
        Image.fromarray((m * 255).astype(np.uint8)).save(os.path.join(out, f"{name}_mask.png"))
        shutil.copy(f, os.path.join(out, f"{name}_original.png"))
        views[name] = {"file": f"{name}.png", "mask": f"{name}_mask.png", "original": f"{name}_original.png",
                       "size": [int(a.shape[1]), int(a.shape[0])], "bg": [int(c) for c in bg],
                       "bbox": [int(x0), int(y0), int(x1), int(y1)]}
    for name in ["front", "side", "back"]:
        x0, y0, x1, y1 = boxes[name]
        s = (y1 - y0) / H
        views[name].update({"s": s, "uc": (x0 + x1) / 2.0, "vg": float(y1)})
    fx0, _, fx1, _ = boxes["front"]
    width_m = (fx1 - fx0) / views["front"]["s"]
    sx0, _, sx1, _ = boxes["side"]
    length_m = (sx1 - sx0) / views["side"]["s"]
    tx0, ty0, tx1, ty1 = boxes["top"]
    views["top"].update({"sx": (tx1 - tx0) / width_m, "sy": (ty1 - ty0) / length_m,
                         "uc": (tx0 + tx1) / 2.0, "vc": (ty0 + ty1) / 2.0})
    d = {"H": H, "width_m": width_m, "length_m": length_m, "views": views}
    with open(os.path.join(out, "views.json"), "w") as f:
        json.dump(d, f, indent=1)
    print(f"size {width_m:.2f} wide x {length_m:.2f} long x {H:.2f} tall (m)")
    for k, v in views.items():
        print(k, {kk: (round(vv, 2) if isinstance(vv, float) else vv) for kk, vv in v.items() if kk in ("s", "sx", "sy", "uc", "vg", "vc", "bbox")})


if __name__ == "__main__":
    main()
