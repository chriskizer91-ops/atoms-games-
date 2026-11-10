"""Changed copy (chapter 1, bramble): player-b's copy plus two more paint_color_skip colours: "red" (strong red:
the straw hat's band and the bandana), so the top picture's red hat band doesn't print onto the brim, and
"blue" (the overalls), so the side picture's overall strap doesn't print onto the shirt sleeves.

Changed copy (chapter 1, player-b): round 3's Puffmunk tools/print_tex.py plus a per-part
"paint_color_skip": ["skin", "orange", "dark"]. A picture does not print its pixels of those colours onto
that part (they are filled from the same part's other paint instead). On a person, the pictures show
forehead skin between the bangs, the ears and cheeks beside the hair, the orange hair tie and the orange
collar right next to the hair; wherever the model's hair is a little larger or placed a little
differently, those colours printed onto the hair as skin-coloured lines and orange spots. Rules:
skin = bright, warm, red > green > blue; orange = strong orange (vest, tie); dark = dark and grey (hair).
The colour mask is grown by 2 pixels so the soft edge between colours is skipped too.

Changed copy (round 3, puffmunk; clovermouse/tools has the same file minus "paint_solid"): Opus round-2 print_tex.py (per-part "decals" and "paint_power"),
plus a new per-part "paint_shift": {"side": [du, dv]} that reads that picture shifted by du, dv pixels
for this part only (used with parts.py "offset" when a picture draws a part higher than the others),
and "paint_skip" also takes a camera name ("side+x", "side-x") or "side_far": a mirrored part is not
printed by the side picture seen from the opposite side (it would print the outside of an ear onto
the back of the other ear where it sticks out behind the head).
Puffmunk's copy also has "paint_solid": {"color": "#rrggbb", "shade": 0.3}: the part takes one colour,
lightened and darkened a little by the pictures (the red berries in its cheeks, which the pictures
draw in three different places).

Print the pictures onto the big model (numpy only).

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
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "pipeline"))
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
    return (r0, r1, c0, c1), pos, nrm, np.repeat(i_f[:, None], len(cols), axis=1), N


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




# ---- opus addition: whole decals (spots) printed from one picture each ----------------------------
DECAL_RULES = {
    # cream / white spots on a red cap
    "cream": lambda R, G, B: (R > 200) & (G > 165) & (B > 115) & (R - B < 115),
}
SURROUND_RULES = {
    "red": lambda R, G, B: (R > 140) & (G < 120) & (B < 120) & (R - G > 70),
}


def decal_maps(img, msk, spec):
    """Per picture: label image of valid decals (dilated), soft decal alpha, and a decal-free copy."""
    a = img.astype(np.int32)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    m = DECAL_RULES[spec.get("rule", "cream")](R, G, B) & msk
    m = ndimage.binary_opening(m, iterations=2)
    sur = SURROUND_RULES[spec.get("surround", "red")](R, G, B)
    lab, n = ndimage.label(m)
    keep = np.zeros(n + 1, bool)
    min_area = spec.get("min_area", 150)
    for i, sl in enumerate(ndimage.find_objects(lab), start=1):
        if sl is None:
            continue
        pad = 8
        y0, y1 = max(sl[0].start - pad, 0), sl[0].stop + pad
        x0, x1 = max(sl[1].start - pad, 0), sl[1].stop + pad
        comp = lab[y0:y1, x0:x1] == i
        if comp.sum() < min_area:
            continue
        ring = ndimage.binary_dilation(comp, iterations=5) & ~comp & msk[y0:y1, x0:x1]
        if ring.sum() == 0:
            continue
        if sur[y0:y1, x0:x1][ring].mean() >= spec.get("surround_frac", 0.55):
            keep[i] = True
    lab = np.where(keep[lab], lab, 0)
    spot = lab > 0
    grow = spec.get("grow", 4)
    lab_d = ndimage.grey_dilation(lab, size=2 * grow + 1)
    lab_d = np.where(msk, lab_d, 0)
    alpha = ndimage.gaussian_filter(ndimage.binary_dilation(spot, iterations=1).astype(np.float32), 1.2)
    # decal-free copy: decal pixels (and their rim) take the nearest surrounding colour, softened
    hole = ndimage.binary_dilation(spot, iterations=grow + 2)
    idx = ndimage.distance_transform_edt(hole | ~msk, return_distances=False, return_indices=True)
    clean = img[idx[0], idx[1]].astype(np.float32)
    soft = np.stack([ndimage.gaussian_filter(clean[..., c], 6) for c in range(3)], -1)
    hb = ndimage.gaussian_filter(hole.astype(np.float32), 3)[..., None]
    clean = img.astype(np.float32) * (1 - hb) + soft * hb
    return lab_d, alpha, clean, int(keep.sum())


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
    decal_spec = {p["name"]: p["decals"] for p in pd["parts"] if p.get("decals")}
    power_part = {p["name"]: p["paint_power"] for p in pd["parts"] if p.get("paint_power")}
    # round-3 addition: per part, read a picture shifted by [du, dv] pixels (the picture draws that
    # part higher or lower than the model has it; pairs with parts.py "offset")
    shift_part = {p["name"]: p["paint_shift"] for p in pd["parts"] if p.get("paint_shift")}
    solid_part = {p["name"]: p["paint_solid"] for p in pd["parts"] if p.get("paint_solid")}
    colskip = {p["name"]: list(p["paint_color_skip"]) for p in pd["parts"] if p.get("paint_color_skip")}

    def colour_masks(img):
        a = img.astype(np.float32)
        R, G, B = a[..., 0], a[..., 1], a[..., 2]
        L = 0.299 * R + 0.587 * G + 0.114 * B
        m = {"skin": (R > 175) & (G > 115) & (B > 80) & (R > G + 15) & (G > B + 10) & (R - B > 45) & (L > 140),
             "orange": (R > 190) & (G > 70) & (G < 175) & (B < 100) & (R - G > 55),
             "dark": (L < 85) & (a.max(axis=2) - a.min(axis=2) < 45),
             # chapter 1 (bramble) addition: strong red (the hat band, the bandana)
             "red": (R > 140) & (G < 110) & (B < 100) & (R - G > 70),
             # and strong blue (the overalls and their straps)
             "blue": (B > 90) & (B > R + 30) & (B > G + 15)}
        return {k: ndimage.binary_dilation(v, iterations=2) for k, v in m.items()}
    names = list(grids.keys())
    # texel positions for every part
    P_all, N_all, where, pid, IF, NR = [], [], [], [], [], []
    for k, nm in enumerate(names):
        box, pos, nrm, i_f, nr = texels_for_part(grids[nm], size)
        P_all.append(pos.reshape(-1, 3))
        N_all.append(nrm.reshape(-1, 3))
        where.append(box)
        pid.append(np.full(pos.shape[0] * pos.shape[1], k, np.int16))
        IF.append(i_f.reshape(-1))
        NR.append(nr)
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
    base_of = lambda nm: nm.rsplit("_", 1)[0] if nm.endswith(("_L", "_R")) else nm
    dec_k = [k for k, nm in enumerate(names) if base_of(nm) in decal_spec]
    dec_sel = np.isin(PID, dec_k) if dec_k else np.zeros(len(P), bool)
    cands = []  # (quality, cam index, label, texel indices, colours, alphas)
    dmaps = {}
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
        fp = facing ** power
        for k, nm in enumerate(names):
            if base_of(nm) in power_part:
                sel = PID == k
                fp[sel] = facing[sel] ** power_part[base_of(nm)]
        wv = vis * fp * weight_view.get(vname, 1.0)
        for k, nm in enumerate(names):
            base = nm.rsplit("_", 1)[0] if nm.endswith(("_L", "_R")) else nm
            sk = skip.get(base, set())
            far = ("side_far" in sk) and ((nm.endswith("_L") and cname == "side-x") or (nm.endswith("_R") and cname == "side+x"))
            if vname in sk or cname in sk or far:
                wv[PID == k] = 0
        # per part: ignore this picture inside given boxes (picture pixels)
        for k, nm in enumerate(names):
            base = nm.rsplit("_", 1)[0] if nm.endswith(("_L", "_R")) else nm
            for box in boxskip.get(base, {}).get(vname, []):
                inb = (PID == k) & (pu >= box[0]) & (pu <= box[2]) & (pv >= box[1]) & (pv <= box[3])
                wv[inb] = 0
        if colskip:
            cm = colour_masks(img)
            for k, nm in enumerate(names):
                rules = colskip.get(base_of(nm))
                if not rules:
                    continue
                sel = np.where(PID == k)[0]
                iu_ = np.clip(pu[sel].astype(int), 0, w - 1)
                iv_ = np.clip(pv[sel].astype(int), 0, h - 1)
                bad = np.zeros(len(sel), bool)
                for r in rules:
                    bad |= cm[r][iv_, iu_]
                wv[sel[bad]] = 0
        su, sv = pu, pv
        if shift_part:
            su, sv = pu.copy(), pv.copy()
            for k, nm in enumerate(names):
                sh = shift_part.get(base_of(nm), {}).get(vname)
                if sh:
                    sel = PID == k
                    su[sel] += sh[0]
                    sv[sel] += sh[1]
        col = bilinear(ext, su, sv)
        # round-3 addition: "paint_solid" parts keep the picture's light and dark but take one colour
        for k, nm in enumerate(names):
            spec = solid_part.get(base_of(nm))
            if spec:
                sel = PID == k
                c = np.array([int(spec["color"][i:i + 2], 16) for i in (1, 3, 5)], float)
                L = col[sel] @ np.array([0.299, 0.587, 0.114])
                f = 1 + spec.get("shade", 0.3) * (L / max(float(np.median(L)) if L.size else 1.0, 1.0) - 1)
                col[sel] = np.clip(c[None] * np.clip(f, 0.75, 1.35)[:, None], 0, 255)
        if dec_sel.any():
            spec = next(iter(decal_spec.values()))
            if vname not in dmaps:
                dmaps[vname] = decal_maps(img, msk, spec)
                print(f"  {vname}: {dmaps[vname][3]} decals found")
            lab_d, alpha, clean, _ = dmaps[vname]
            cext = extend_image(clean, msk)
            col[dec_sel] = bilinear(cext, pu[dec_sel], pv[dec_sel])
            ok = dec_sel & (wv > 1e-4) & (facing > 0.05)
            lab_t = np.zeros(len(P), np.int32)
            lab_t[ok] = lab_d[jv[ok], ju[ok]]
            tpm_ = None
            for lab in np.unique(lab_t[lab_t > 0]):
                ti = np.where(lab_t == lab)[0]
                if len(ti) < 30:
                    continue
                q = float(np.median(facing[ti]))
                c_orig = bilinear(ext, pu[ti], pv[ti])
                al = bilinear(alpha[..., None], pu[ti], pv[ti])[:, 0]
                cands.append((q, ci, int(lab), ti, c_orig, al))
        acc += col * wv[:, None]
        wsum += wv
        better = wv > bestw
        best[better] = ci
        bestw[better] = wv[better]
        print(f"  {cname:7s} paints {int((wv > 0.01).sum()):,} texels")
    seen = wsum > 1e-4
    frac_pictures = float(seen.mean())
    col = np.zeros((len(P), 3))
    col[seen] = acc[seen] / wsum[seen, None]
    if cands:
        spec = next(iter(decal_spec.values()))
        minq = spec.get("min_facing", 0.45)
        owner = np.zeros(len(P), bool)
        acc_c = []
        kept = 0
        for q, ci, lab, ti, c_orig, al in sorted(cands, key=lambda c: -c[0]):
            if q < minq:
                continue
            cen = P[ti].mean(0)
            rad = np.sqrt(((P[ti] - cen) ** 2).sum(1).mean())
            if owner[ti].mean() > spec.get("max_overlap", 0.15):
                continue
            if any(np.linalg.norm(cen - c2) < spec.get("min_gap", 0.8) * (rad + r2) for c2, r2 in acc_c):
                continue
            acc_c.append((cen, rad))
            free = ~owner[ti]
            t2 = ti[free]
            a2 = np.clip(al[free] * 1.15, 0, 1)[:, None]
            col[t2] = c_orig[free] * a2 + col[t2] * (1 - a2)
            owner[t2] = True
            kept += 1
        print(f"  decals: {len(cands)} candidates, {kept} kept (each printed whole from one picture)")
    # caps no picture can see (e.g. the soles of the paws): a radial gradient (parts.json "cap_fill")
    capfill = {p["name"]: p.get("cap_fill", {}) for p in pd["parts"]}
    off = 0
    for k, nm in enumerate(names):
        n = len(IF[k])
        base = nm.rsplit("_", 1)[0] if nm.endswith(("_L", "_R")) else nm
        for end, spec in capfill.get(base, {}).items():
            i_f = IF[k]
            t = np.clip(-i_f, 0, 1) if end == "start" else np.clip(i_f - (NR[k] - 1), 0, 1)
            m = (t > 0) & ~seen[off:off + n]
            if m.any():
                c_in, c_out = (np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float) for h in spec)
                tt = t[m][:, None]
                col[off:off + n][m] = c_out * (1 - tt) + c_in * tt
                seen[off:off + n][m] = True
        off += n
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
    frac = frac_pictures
    stats = {"texels": int(len(P)), "seen_by_a_picture": round(100 * float(frac), 1),
             "painted_by": {c[0]: int((best == i).sum()) for i, c in enumerate(cams)}, "parts": names}
    with open(os.path.join(out, "print.json"), "w") as f:
        json.dump(stats, f, indent=1)
    print(f"seen by a picture: {100 * frac:.1f}% of texels; the rest filled from the same part. {time.time() - t0:.1f} s")


if __name__ == "__main__":
    main()
