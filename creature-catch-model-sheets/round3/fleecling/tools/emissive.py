"""Glow map, round 3 copy: nothing glows unless parts.json says so, part by part.

usage: python3 -I emissive.py albedo.png emissive.png --texel print/texel.npz --names print/print.json
                              --parts parts.json [--size 1024]

The shared emissive.py keeps every bright orange colour, which lights up orange skin and fur. This
copy starts from a black map and only lights the parts that carry a "glow" entry in parts.json:
  "glow": {"rule": "all", "gain": 1.0}        the whole part glows in its own printed colour
  "glow": {"rule": "yellow", "gain": 0.2}     only pale yellow / gold paint on the part glows, softly
  "glow": {"rule": "flame", "gain": 0.12}     only saturated yellow flame markings glow (not cream, not orange)
A creature with no "glow" entries gets an all-black map (no glow).
"""
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def arg(flag, default=None):
    if flag in sys.argv:
        return sys.argv[sys.argv.index(flag) + 1]
    return default


def rule_mask(a, rule):
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    if rule == "all":
        return np.ones(R.shape, np.float32)
    if rule == "yellow":
        # pale yellow / gold markings: bright, red and green both high, blue well below
        return (np.clip((R - 200) / 30, 0, 1) * np.clip((G - 150) / 40, 0, 1) * np.clip((R - B - 70) / 40, 0, 1)
                * np.clip((G - B - 50) / 40, 0, 1))
    if rule == "flame":
        # saturated yellow / yellow-orange flame markings only: not the pale cream belly or jaw (blue too high),
        # not the orange skin or toe pads (green too low)
        return (np.clip((R - 210) / 30, 0, 1) * np.clip((G - 160) / 35, 0, 1) * np.clip((110 - B) / 40, 0, 1)
                * np.clip((G - B - 90) / 40, 0, 1))
    if rule == "bright":
        L = 0.299 * R + 0.587 * G + 0.114 * B
        return np.clip((L - 170) / 50, 0, 1)
    raise ValueError(rule)


def main():
    src, out = sys.argv[1], sys.argv[2]
    a = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    size = a.shape[0]
    parts = json.load(open(arg("--parts")))["parts"]
    spec = {p["name"]: p["glow"] for p in parts if p.get("glow")}
    g = np.zeros(a.shape[:2], np.float32)
    if spec:
        part_img = np.load(arg("--texel"))["part"]
        names = json.load(open(arg("--names")))["parts"]
        assert part_img.shape[0] == size, (part_img.shape, size)
        for k, nm in enumerate(names):
            base = nm[:-2] if nm.endswith(("_L", "_R")) else nm
            if base not in spec:
                continue
            s = spec[base]
            sel = part_img == k
            m = rule_mask(a, s.get("rule", "all")) * float(s.get("gain", 1.0))
            g[sel] = np.maximum(g[sel], m[sel])
        # spread a few texels into the gutters so mipmaps don't darken the edges
        g = np.maximum(g, ndimage.grey_dilation(g, size=5) * (np.load(arg("--texel"))["part"] < 0))
        g = ndimage.gaussian_filter(g, 0.8)
    e = np.clip(a * np.clip(g, 0, 1.5)[..., None], 0, 255).astype(np.uint8)
    im = Image.fromarray(e)
    if arg("--size"):
        s = int(arg("--size"))
        im = im.resize((s, s), Image.LANCZOS)
    im.save(out)
    print(f"glow covers {100 * (g > 0.3).mean():.2f}% of the texture (strong), {100 * ((g > 0.02) & (g <= 0.3)).mean():.2f}% (faint); parts: {sorted(spec) or 'none'}")


if __name__ == "__main__":
    main()
