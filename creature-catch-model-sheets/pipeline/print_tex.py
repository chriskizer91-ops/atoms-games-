"""Print the pictures onto the big model (numpy only).

usage: python3 -I print_tex.py grid.npz atlas.json views.json parts.json OUTDIR [--size 2048] [--power 3]

Each texel of the model's texture knows where it sits on the model (from the part's ring
grid). Each picture paints the texels that face it and that nothing hides (a depth test
per view). Where several pictures see a texel, the most head-on one counts most. Texels
no picture sees take the colour of the nearest painted texel of the same part.

Writes OUTDIR/albedo.png (the printed texture), OUTDIR/seen.png (which picture painted
each texel) and OUTDIR/texel.npz (position, normal, part id of every texel, for the
relief step).
"""
import json
import os
import sys
import time

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cc3d import Views  # noqa: E402


def arg(flag, default=None):
    if flag in sys.argv:
        return sys.argv[sys.argv.index(flag) + 1]
    return default


def load_grids(path):
    z = np.load(path)
    g = {}
    for k in z.files:
        nm, key = k.split("|")
        g.setdefault(nm, {})[key] = z[k]
    return g


def grid_normals(P):
    """Normals on a ring grid (N, K, 3), pointing away from the ring centre."""
    du = np.roll(P, -1, axis=1) - np.roll(P, 1, axis=1)
    dv = np.zeros_like(P)
    if len(P) > 2:
        dv[1:-1] = P[2:] - P[:-2]
    dv[0] = P[1] - P[0]
    dv[-1] = P[-1] - P[-2]
    n = np.cross(du, dv)
    out = P - P.mean(axis=1, keepdims=True)
    s = np.sign(np.einsum("ijk,ijk->ij", n, out))
    s[s == 0] = 1
    n *= s[..., None]
    return n / np.maximum(np.linalg.norm(n, axis=2, keepdims=True), 1e-12)


def texels_for_part(g, size):
    """Positions and normals of every texel inside a part's rectangle."""
    P, ps, pe, vr, rect = g["P"], g["ps"], g["pe"], g["vr"], g["rect"]
    N, K, _ = P.shape
    u0, v0, u1, v1 = rect
    c0, c1 = int(np.floor(u0 * size)), int(np.ceil(u1 * size))
    # image rows: row 0 is v = 1
    r0, r1 = int(np.floor((1 - v1) * size)), int(np.ceil((1 - v0) * size))
    cols = np.arange(c0, c1)
    rows = np.arange(r0, r1)
    uu = (cols + 0.5) / size
    vv = 1 - (rows + 0.5) / size
    jf = np.clip((uu - u0) / (u1 - u0), 0, 1) * K
    # ring index from v: v0 -> -1 (start pole), vr[i] -> i, v1 -> N (end pole)
    vk = np.concatenate([[v0], vr, [v1]])
    ik = np.concatenate([[-1.0], np.arange(N, dtype=float), [float(N)]])
    i_f = np.interp(vv, vk, ik)
    Nrm = grid_normals(P)
    axis = np.zeros(3)
    axis_name = str(g["axis"])
    axis["xyz".index(axis_name)] = 1.0
    # extended grid with pole rows
    Pe = np.concatenate([np.repeat(ps[None, None], K, axis=1), P, np.repeat(pe[None, None], K, axis=1)], axis=0)
    # cap normals point along -axis at the start and +axis at the end (outward from the part)
    dir_s = np.sign(np.dot(P[0].mean(0) - P[min(1, N - 1)].mean(0), axis)) or -1.0
    dir_e = -dir_s
    Ne = np.concatenate([np.repeat((axis * dir_s)[None, None], K, axis=1), Nrm, np.repeat((axis * dir_e)[None, None], K, axis=1)], axis=0)
    ii = i_f + 1  # index into the extended grid
    i0 = np.clip(np.floor(ii).astype(int), 0, N)
    ti = (ii - i0)[:, None]
    j0 = np.floor(jf).astype(int) % K
    j1 = (j0 + 1) % K
    tj = (jf - np.floor(jf))[None, :]
    A = Pe[i0][:, j0]
    B = Pe[i0][:, j1]
    C = Pe[i0 + 1][:, j0]
    D = Pe[i0 + 1][:, j1]
    pos = (A * (1 - tj)[..., None] + B * tj[..., None]) * (1 - ti)[..., None] + (C * (1 - tj)[..., None] + D * tj[..., None]) * ti[..., None]
    An, Bn, Cn, Dn = Ne[i0][:, j0], Ne[i0][:, j1], Ne[i0 + 1][:, j0], Ne[i0 + 1][:, j1]
    nrm = (An * (1 - tj)[..., None] + Bn * tj[..., None]) * (1 - ti)[..., None] + (Cn * (1 - tj)[..., None] + Dn * tj[..., None]) * ti[..., None]
    nrm /= np.maximum(np.linalg.norm(nrm, axis=-1, keepdims=True), 1e-12)
    return (r0, r1, c0, c1), pos, nrm


def extend_image(img, mask, rim=2):
    """Replace the anti-aliased rim and the background with the nearest solid creature colour."""
    solid = ndimage.binary_erosion(mask, iterations=rim)
    idx = ndimage.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    return img[idx[0], idx[1]]


def bilinear(img, u, v):
    h, w, _ = img.shape
    u = np.clip(u - 0.5, 0, w - 1.001)
    v = np.clip(v - 0.5, 0, h - 1.001)
    u0 = np.floor(u).astype(int)
    v0 = np.floor(v).astype(int)
    fu = (u - u0)[..., None]
    fv = (v - v0)[..., None]
    I = img.astype(np.float32)
    return (I[v0, u0] * (1 - fu) + I[v0, u0 + 1] * fu) * (1 - fv) + (I[v0 + 1, u0] * (1 - fu) + I[v0 + 1, u0 + 1] * fu) * fv


def main():
    grid_path, atlas_path, views_path, parts_path, out = sys.argv[1:6]
    size = int(arg("--size", "2048"))
    power = float(arg("--power", "3"))
    tol = float(arg("--tol", "0.015"))
    os.makedirs(out, exist_ok=True)
    t0 = time.time()
    vw = Views(views_path)
    grids = load_grids(grid_path)
    with open(parts_path) as f:
        pd = json.load(f)
    skip = {p["name"]: set(p.get("paint_skip", [])) for p in pd["parts"]}
    boxskip = {p["name"]: p.get("paint_box_skip", {}) for p in pd["parts"]}
    weight_view = pd.get("view_weight", {"top": 0.6})
    names = list(grids.keys())
    # texel positions for every part
    P_all, N_all, where, pid = [], [], [], []
    for k, nm in enumerate(names):
        box, pos, nrm = texels_for_part(grids[nm], size)
        P_all.append(pos.reshape(-1, 3))
        N_all.append(nrm.reshape(-1, 3))
        where.append(box)
        pid.append(np.full(pos.shape[0] * pos.shape[1], k, np.int16))
    P = np.concatenate(P_all)
    Nn = np.concatenate(N_all)
    PID = np.concatenate(pid)
    print(f"{len(P):,} texels on {len(names)} parts ({time.time() - t0:.1f} s)")
    # dense surface points for the depth buffers: texels plus grid vertices
    G = np.concatenate([P] + [g["P"].reshape(-1, 3) for g in grids.values()])
    # views: (name, picture, direction toward camera)
    cams = [("front", "front", np.array([0, -1.0, 0])), ("back", "back", np.array([0, 1.0, 0])),
            ("side+x", "side", np.array([1.0, 0, 0])), ("side-x", "side", np.array([-1.0, 0, 0])),
            ("top", "top", np.array([0, 0, 1.0]))]
    acc = np.zeros((len(P), 3), np.float64)
    wsum = np.zeros(len(P), np.float64)
    best = np.full(len(P), -1, np.int8)
    bestw = np.zeros(len(P))
    for ci, (cname, vname, d) in enumerate(cams):
        img = vw.image(vname)
        msk = vw.mask(vname)
        ext = extend_image(img, msk)
        h, w = msk.shape

        def project(X):
            u, v = vw.world_to_px(vname, X)
            return u, v

        # depth buffer at picture resolution from the dense points (closest = largest X.d)
        gu, gv = project(G)
        gd = G @ d
        iu = np.clip(gu.astype(int), 0, w - 1)
        iv = np.clip(gv.astype(int), 0, h - 1)
        zb = np.full(h * w, -1e9)
        np.maximum.at(zb, iv * w + iu, gd)
        zb = zb.reshape(h, w)
        zb = ndimage.maximum_filter(zb, size=3)  # close pinholes between splatted points
        pu, pv = project(P)
        pdp = P @ d
        ju = np.clip(pu.astype(int), 0, w - 1)
        jv = np.clip(pv.astype(int), 0, h - 1)
        vis = pdp >= zb[jv, ju] - tol
        facing = np.clip(Nn @ d, 0, 1)
        wv = vis * facing ** power * weight_view.get(vname, 1.0)
        for k, nm in enumerate(names):
            base = nm.rsplit("_", 1)[0] if nm.endswith(("_L", "_R")) else nm
            if vname in skip.get(base, set()):
                wv[PID == k] = 0
        # per part: ignore this picture inside given boxes (picture pixels)
        for k, nm in enumerate(names):
            base = nm.rsplit("_", 1)[0] if nm.endswith(("_L", "_R")) else nm
            for box in boxskip.get(base, {}).get(vname, []):
                inb = (PID == k) & (pu >= box[0]) & (pu <= box[2]) & (pv >= box[1]) & (pv <= box[3])
                wv[inb] = 0
        col = bilinear(ext, pu, pv)
        acc += col * wv[:, None]
        wsum += wv
        better = wv > bestw
        best[better] = ci
        bestw[better] = wv[better]
        print(f"  {cname:7s} paints {int((wv > 0.01).sum()):,} texels")
    seen = wsum > 1e-4
    col = np.zeros((len(P), 3))
    col[seen] = acc[seen] / wsum[seen, None]
    # assemble the texture, fill unseen texels from the same part, then the gutters
    tex = np.zeros((size, size, 3), np.float32)
    seen_img = np.zeros((size, size), bool)
    part_img = np.full((size, size), -1, np.int16)
    best_img = np.full((size, size), -1, np.int8)
    off = 0
    for k, nm in enumerate(names):
        r0, r1, c0, c1 = where[k]
        n = (r1 - r0) * (c1 - c0)
        c = col[off:off + n].reshape(r1 - r0, c1 - c0, 3)
        s = seen[off:off + n].reshape(r1 - r0, c1 - c0)
        b = best[off:off + n].reshape(r1 - r0, c1 - c0)
        if s.any() and not s.all():
            idx = ndimage.distance_transform_edt(~s, return_distances=False, return_indices=True)
            c = c[idx[0], idx[1]]
        tex[r0:r1, c0:c1] = c
        seen_img[r0:r1, c0:c1] = s
        part_img[r0:r1, c0:c1] = k
        best_img[r0:r1, c0:c1] = b
        off += n
    cover = part_img >= 0
    idx = ndimage.distance_transform_edt(~cover, return_distances=False, return_indices=True)
    tex = tex[idx[0], idx[1]]
    Image.fromarray(np.clip(tex, 0, 255).astype(np.uint8)).save(os.path.join(out, "albedo.png"))
    pal = np.array([[230, 60, 60], [60, 120, 230], [60, 170, 80], [40, 150, 150], [230, 170, 40]], np.uint8)
    dbg = np.full((size, size, 3), 30, np.uint8)
    m = best_img >= 0
    dbg[m] = pal[best_img[m]]
    dbg[cover & ~seen_img] = (255, 255, 255)
    Image.fromarray(dbg).save(os.path.join(out, "seen.png"))
    np.savez_compressed(os.path.join(out, "texel.npz"), part=part_img, seen=seen_img)
    frac = seen.mean()
    stats = {"texels": int(len(P)), "seen_by_a_picture": round(100 * float(frac), 1),
             "painted_by": {c[0]: int((best == i).sum()) for i, c in enumerate(cams)}, "parts": names}
    with open(os.path.join(out, "print.json"), "w") as f:
        json.dump(stats, f, indent=1)
    print(f"seen by a picture: {100 * frac:.1f}% of texels; the rest filled from the same part. {time.time() - t0:.1f} s")


if __name__ == "__main__":
    main()
