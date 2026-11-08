"""Normal map straight from the relief height map (the small-model-only route, no big model).

usage: python3 -I normal_from_relief.py height.npy atlas.json grid.npz OUT.png [--strength 1.0]

The height map (metres, from relief.py --height-out) is laid out in the model's texture, where
u runs around each part and v runs along it. Its slopes give a tangent-space normal map in the
same convention Blender bakes (red = +u, green = +v, OpenGL style), so it drops in where the
baked normal map used to go.
"""
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
from print_tex import load_grids  # noqa: E402


def main():
    hpath, atlas_path, grid_path, out = sys.argv[1:5]
    strength = float(sys.argv[sys.argv.index("--strength") + 1]) if "--strength" in sys.argv else 1.0
    h = np.load(hpath).astype(np.float64)
    size = h.shape[0]
    atlas = json.load(open(atlas_path))
    tpm = atlas["texels_per_m"] * size / atlas["size"]  # texels per metre, the same along u and v
    grids = load_grids(grid_path)
    nrm = np.zeros((size, size, 3))
    nrm[..., 2] = 1.0
    cover = np.zeros((size, size), bool)
    for nm, g in grids.items():
        u0, v0, u1, v1 = g["rect"]
        c0, c1 = int(np.floor(u0 * size)), int(np.ceil(u1 * size))
        r0, r1 = int(np.floor((1 - v1) * size)), int(np.ceil((1 - v0) * size))
        hh = h[r0:r1, c0:c1]
        # wrap around the seam in u so the slope is continuous there
        hp = np.concatenate([hh[:, -1:], hh, hh[:, :1]], axis=1)
        dhdu = (hp[:, 2:] - hp[:, :-2]) / 2.0 * tpm
        dhdrow = np.gradient(hh, axis=0) * tpm
        dhdv = -dhdrow  # image rows run down, v runs up
        n = np.stack([-dhdu * strength, -dhdv * strength, np.ones_like(hh)], -1)
        n /= np.linalg.norm(n, axis=-1, keepdims=True)
        nrm[r0:r1, c0:c1] = n
        cover[r0:r1, c0:c1] = True
    idx = ndimage.distance_transform_edt(~cover, return_distances=False, return_indices=True)
    nrm = nrm[idx[0], idx[1]]
    img = np.clip((nrm * 0.5 + 0.5) * 255 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(img).save(out)
    tilt = np.degrees(np.arccos(np.clip(nrm[cover][:, 2], -1, 1)))
    print(f"normal map {size}x{size}: median tilt {np.median(tilt):.1f} deg, 95th percentile {np.percentile(tilt, 95):.1f} deg")


if __name__ == "__main__":
    main()
