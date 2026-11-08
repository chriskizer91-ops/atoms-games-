"""Changed copy (round 3, clovermouse / puffmunk): glow map.

usage: python3 -I emissive.py albedo.png emissive.png [--size 1024] [--off]

--off   writes an all-black glow map: nothing on this creature glows (the round-3 brief: only
        Embroak's ember bead glows). The shared rule would light up orange-brown fur and pink
        paws and tails, so it is not used.
Without --off it uses Opus's round-2 stricter lava/gold rule.
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def glow_mask(a):
    a = a.astype(np.float32)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    g = np.clip((R - 185) / 45, 0, 1) * np.clip((R - B - 135) / 50, 0, 1) * np.clip((G - 95) / 45, 0, 1)
    return ndimage.gaussian_filter(g, 0.8)


def main():
    src, out = sys.argv[1], sys.argv[2]
    im = Image.open(src).convert("RGB")
    if "--size" in sys.argv:
        s = int(sys.argv[sys.argv.index("--size") + 1])
        im = im.resize((s, s), Image.LANCZOS)
    a = np.asarray(im)
    if "--off" in sys.argv:
        Image.fromarray(np.zeros_like(a)).save(out)
        print("glow map: all black (nothing glows)")
        return
    g = glow_mask(a)
    e = np.clip(a.astype(np.float32) * (0.35 + 0.9 * g[..., None]) * g[..., None], 0, 255)
    Image.fromarray(e.astype(np.uint8)).save(out)
    print(f"glow covers {100 * (g > 0.3).mean():.1f}% of the texture")


if __name__ == "__main__":
    main()
