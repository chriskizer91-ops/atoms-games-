"""Glow map for Lunarion (changed copy of pipeline/emissive.py).

The stock tool keeps only lava-bright orange (R-B > 100), which never fires on Lunarion's pale
moon-gold, so nothing glowed. This copy keeps the gold: the crescent crest, the stars, the eyes,
and (more softly) the flowing gold markings. Silver fur and the navy night sky never glow.

usage: python3 -I emissive.py albedo.png emissive.png [--size 1024]
"""
import colorsys
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def glow_mask(a):
    a = a.astype(np.float32) / 255.0
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(axis=2)
    mn = a.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1e-4)
    # hue of a warm yellow-gold: red on top, green close behind, blue lowest
    warm = (R >= G) & (G > B) & ((R - B) > 0.18) & ((G - B) > 0.10) & (mx > 0.70)
    strong = np.clip((sat - 0.22) / 0.14, 0, 1)      # saturated gold: stars, crest, eyes
    soft = np.clip((sat - 0.15) / 0.12, 0, 1) * 0.35  # paler gold: the flowing markings
    g = warm * np.maximum(strong, soft)
    return ndimage.gaussian_filter(g, 0.8)


def main():
    src, out = sys.argv[1], sys.argv[2]
    im = Image.open(src).convert("RGB")
    if "--size" in sys.argv:
        s = int(sys.argv[sys.argv.index("--size") + 1])
        im = im.resize((s, s), Image.LANCZOS)
    a = np.asarray(im)
    g = glow_mask(a)
    e = np.clip(a.astype(np.float32) * g[..., None] * 0.75, 0, 255)
    Image.fromarray(e.astype(np.uint8)).save(out)
    print(f"glow covers {100 * (g > 0.3).mean():.1f}% of the texture (strong {100 * (g > 0.7).mean():.1f}%)")


if __name__ == "__main__":
    main()
