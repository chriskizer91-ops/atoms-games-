"""Glow map from the printed paint: keeps only the lava-bright colours (cracks, eyes, paws, vents).

usage: python3 -I emissive.py albedo.png emissive.png [--size 2048]
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def glow_mask(a):
    a = a.astype(np.float32)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    # opus change: stricter, so plain red (cap, low green) and pink cheeks do not glow; gold/orange still does
    g = np.clip((R - 185) / 45, 0, 1) * np.clip((R - B - 135) / 50, 0, 1) * np.clip((G - 95) / 45, 0, 1)
    return ndimage.gaussian_filter(g, 0.8)


def main():
    src, out = sys.argv[1], sys.argv[2]
    im = Image.open(src).convert("RGB")
    if "--size" in sys.argv:
        s = int(sys.argv[sys.argv.index("--size") + 1])
        im = im.resize((s, s), Image.LANCZOS)
    a = np.asarray(im)
    g = glow_mask(a)
    e = np.clip(a.astype(np.float32) * (0.35 + 0.9 * g[..., None]) * g[..., None], 0, 255)
    Image.fromarray(e.astype(np.uint8)).save(out)
    print(f"glow covers {100 * (g > 0.3).mean():.1f}% of the texture")


if __name__ == "__main__":
    main()
