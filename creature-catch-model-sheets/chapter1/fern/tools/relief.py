"""Changed copy (chapter 1, player-a): round 3's Puffmunk copy ("fur_soft") plus Mossback's "grain" kind and
per-part "relief_gain"; "grain" here is gentler (see below). Earlier notes:

Changed copy (round 3, clovermouse / puffmunk): adds the relief kind "fur_soft".

"fur" reads every light/dark change in the paint as fur tufts and gaps, so painted features (eye
outlines, eyebrows, the mouth line, the edges of pink paws and blush) come out as deep carved
grooves, and the face looks engraved. "fur_soft" keeps the fur tufts at about 60% height and fades
the relief out on red, pink and green paint (berries, nose, tongue, inner ears, eyes) and across
strong edges (outlines, stripe borders), so only the fur strokes get bumps. (Puffmunk's copy tells
"not fur" by colour family; Clovermouse's copy used low saturation, which suits grey fur but would
switch off all of Puffmunk's orange fur.)

Surface relief for the big model, read from the printed paint (numpy only).

usage: python3 -I relief.py grid.npz atlas.json albedo.png parts.json OUT.npz [--preview relief.png] [--height-out height.npy]

--height-out also saves the height map itself at texture resolution (lightly smoothed), for
normal_from_relief.py: the small-model-only route turns it straight into a normal map.

The pictures already show where the rock plates, lava cracks and fur tufts are. This turns
the printed texture into a height map per part and samples it at the big model's vertices:
  rock  plates bulge up to ~2 cm away from the cracks, cracks sink ~1 cm, fine rock grain
  fur   light tufts stand out, dark gaps sink (about +-1 cm)
  vent  smooth cone with grain; the glowing mouth becomes a crater
Large glowing areas (the paws) count as smooth bulges, not cracks.
Writes a (N, K) height grid (metres, outward) for every part instance.
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from print_tex import load_grids  # noqa: E402

KIND_DEFAULT = {"head": "fur", "muzzle": "fur", "ear": "fur", "mane": "fur", "ruff": "fur",
                "vent": "vent", "vent_side": "vent"}


def arg(flag, default=None):
    if flag in sys.argv:
        return sys.argv[sys.argv.index(flag) + 1]
    return default


def relief_map(rgb, kind, tpm):
    """Height (metres) for one part's texture rectangle."""
    a = rgb.astype(np.float32)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    L = 0.299 * R + 0.587 * G + 0.114 * B
    glow = np.clip((R - 170) / 60, 0, 1) * np.clip((R - B - 110) / 70, 0, 1) * np.clip((G - 60) / 50, 0, 1)
    px = lambda m: max(m * tpm, 0.5)  # metres -> texels
    hp = L - ndimage.gaussian_filter(L, px(0.012))
    grain = np.clip(hp / 40.0, -1, 1)
    if kind == "rock":
        g = glow > 0.35
        # thick glowing areas (paws, vent mouths) are not cracks
        blob = ndimage.binary_opening(g, iterations=int(px(0.022)))
        crack = g & ~blob
        d = ndimage.distance_transform_edt(~crack) / tpm
        plate = 0.022 * (1 - np.exp(-d / 0.028)) - 0.011  # centred on the traced surface
        h = plate - 0.010 * ndimage.gaussian_filter(crack.astype(np.float32), px(0.004))
        din = ndimage.distance_transform_edt(blob) / tpm
        h = np.where(blob, 0.001 + 0.010 * (1 - np.exp(-din / 0.03)), h)
        h += 0.0035 * grain
    elif kind == "fur":
        hpf = L - ndimage.gaussian_filter(L, px(0.018))
        tuft = np.clip(hpf / 35.0, -1, 1)
        smooth = ndimage.gaussian_filter(np.clip((glow - 0.2) * 3, 0, 1), px(0.006))  # eyes, inner ears
        h = 0.010 * tuft * (1 - smooth)
        # eyes (bright, glowing on fur) get a gentle dome so they catch the light
        eye = ndimage.gaussian_filter((glow > 0.35).astype(np.float32), px(0.012))
        h += 0.012 * np.clip(eye * 1.6, 0, 1)
    elif kind == "fur_soft":
        hpf = L - ndimage.gaussian_filter(L, px(0.018))
        tuft = np.clip(hpf / 35.0, -1, 1)
        # not fur: red (berries), pink (nose, tongue, inner ears, blush), green (eyes, leaves)
        Rr = np.maximum(R, 1.0)
        red = np.clip((0.45 - G / Rr) / 0.1, 0, 1) * np.clip((R - 90) / 40, 0, 1)
        pink = np.clip((B / Rr - 0.40) / 0.08, 0, 1) * np.clip((R - G - 35) / 20, 0, 1)
        green = np.clip((G - R - 5) / 15, 0, 1)
        Ls = ndimage.gaussian_filter(L, max(px(0.0015), 0.7))
        edge = np.hypot(ndimage.sobel(Ls, 0), ndimage.sobel(Ls, 1)) / 8.0
        furry = (1 - red) * (1 - pink) * (1 - green) * np.clip(1 - (edge - 8.0) / 8.0, 0, 1)
        furry = ndimage.grey_erosion(furry, size=5)
        furry = ndimage.gaussian_filter(furry, max(px(0.003), 1.0))
        # finer tufts than "fur", so the borders between colour blocks (stripes, eye patches) give
        # only a thin line, which the edge fade above then removes
        hpf2 = L - ndimage.gaussian_filter(L, px(0.008))
        h = 0.0035 * np.clip(hpf2 / 25.0, -1, 1) * furry
    elif kind == "vent":
        mouth = ndimage.gaussian_filter((glow > 0.4).astype(np.float32), px(0.01))
        h = 0.003 * grain - 0.035 * mouth
    elif kind == "grain":
        # round 3 (Mossback): only the fine grain of the paint, no cracks or blobs. Chapter 1: fades out
        # across strong painted edges (seams, straps, buckle outlines) so cloth never shows carved lines
        hp2 = L - ndimage.gaussian_filter(L, px(0.008))
        Ls = ndimage.gaussian_filter(L, max(px(0.0015), 0.7))
        edge = np.hypot(ndimage.sobel(Ls, 0), ndimage.sobel(Ls, 1)) / 8.0
        calm = ndimage.gaussian_filter(np.clip(1 - (edge - 10.0) / 10.0, 0, 1), max(px(0.002), 0.8))
        h = 0.0025 * np.clip(hp2 / 40.0, -1, 1) * calm
    else:
        h = np.zeros_like(L)
    return h


def main():
    grid_path, atlas_path, albedo_path, parts_path, out = sys.argv[1:6]
    grids = load_grids(grid_path)
    with open(atlas_path) as f:
        atlas = json.load(f)
    with open(parts_path) as f:
        pd = json.load(f)
    kinds = {p["name"]: p.get("relief", KIND_DEFAULT.get(p["name"], "rock")) for p in pd["parts"]}
    gains = {p["name"]: float(p.get("relief_gain", 1.0)) for p in pd["parts"]}
    tex = np.asarray(Image.open(albedo_path).convert("RGB"))
    size = tex.shape[0]
    tpm = atlas["texels_per_m"] * size / atlas["size"]
    full = np.zeros(tex.shape[:2], np.float32)
    fine = np.zeros(tex.shape[:2], np.float32)
    res = {}
    for nm, g in grids.items():
        base = nm[:-2] if nm.endswith(("_L", "_R")) else nm
        kind = kinds.get(base, "rock")
        u0, v0, u1, v1 = g["rect"]
        c0, c1 = int(np.floor(u0 * size)), int(np.ceil(u1 * size))
        r0, r1 = int(np.floor((1 - v1) * size)), int(np.ceil((1 - v0) * size))
        h = relief_map(tex[r0:r1, c0:c1], kind, tpm) * gains.get(base, 1.0)
        P = g["P"]
        N, K, _ = P.shape
        # low-pass to the vertex spacing before sampling
        circ = np.linalg.norm(np.roll(P, -1, axis=1) - P, axis=2).sum(axis=1).mean()
        spacing = circ / K * tpm
        hs = ndimage.gaussian_filter(h, max(spacing * 0.5, 0.5))
        full[r0:r1, c0:c1] = hs
        fine[r0:r1, c0:c1] = ndimage.gaussian_filter(h, 0.8)
        # sample at each ring vertex (i, j)
        uu = u0 + (np.arange(K) / K) * (u1 - u0)
        vv = g["vr"]
        col = np.clip(uu * size - c0 - 0.5, 0, (c1 - c0) - 1.001)
        row = np.clip((1 - vv) * size - r0 - 0.5, 0, (r1 - r0) - 1.001)
        C, Rr = np.meshgrid(col, row)
        hv = ndimage.map_coordinates(hs, [Rr, C], order=1)
        # keep thin parts from folding: limit inward moves to 30% of the local radius
        cen = P.mean(axis=1, keepdims=True)
        rad = np.linalg.norm(P - cen, axis=2)
        hv = np.maximum(hv, -0.3 * rad)
        # leave the first and last rings (cap edges) unmoved
        hv[0] = 0
        hv[-1] = 0
        res[nm] = hv.astype(np.float64)
        print(f"  {nm:18s} {kind:5s} relief {hv.min() * 100:+.1f} .. {hv.max() * 100:+.1f} cm")
    np.savez_compressed(out, **res)
    if arg("--height-out"):
        np.save(arg("--height-out"), fine)
    prev = arg("--preview")
    if prev:
        v = np.clip((full + 0.03) / 0.06, 0, 1)
        Image.fromarray((v * 255).astype(np.uint8)).resize((1024, 1024), Image.LANCZOS).save(prev)


if __name__ == "__main__":
    main()
