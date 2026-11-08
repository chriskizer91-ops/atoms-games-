"""Turn traced parts into rounded solids (numpy only, no Blender).

A part has an outline in two views. It is sliced along one world axis ("axis"); at each
slice the first view gives the extent along one other axis and the second view gives the
extent along the remaining axis. The slice is a superellipse that fills that rectangle
(roundness n: 2 = ellipse, 4+ = boxy), so the solid is exactly as wide as one outline
and as deep as the other.

Each part is stored as a grid of rings (N rings x K points) plus a pole at each end,
which is also its texture layout: u runs around the ring, v runs along the axis.
"""
import json
import math
import os
import sys

import numpy as np
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cc3d import VIEW_AXES, Views, poly_mask  # noqa: E402

AX = {"x": 0, "y": 1, "z": 2}
# (p, q) axes for each slicing axis, chosen so (p, q, axis) is right-handed
PQ = {"z": ("x", "y"), "y": ("z", "x"), "x": ("y", "z")}


def view_profile(vw, view, poly, slice_axis, nomask=False):
    """Extent of the outline along the view's other axis, for each pixel line across slice_axis.

    Returns (c, lo, hi): world coordinate of each line along slice_axis and the extent
    [lo, hi] along the other axis, sorted by c.
    """
    sil = vw.mask(view)
    m = poly_mask(sil.shape, poly)
    if not nomask:
        m &= sil
    ua, va = VIEW_AXES[view]
    if slice_axis == va:      # rows
        idx = np.where(m.any(axis=1))[0]
        cs, los, his = [], [], []
        for v in idx:
            us = np.where(m[v])[0]
            a0, c0 = vw.px_to_world(view, us.min(), v + 0.5)
            a1, _ = vw.px_to_world(view, us.max() + 1, v + 0.5)
            cs.append(float(c0))
            los.append(float(min(a0, a1)))
            his.append(float(max(a0, a1)))
    elif slice_axis == ua:    # columns
        idx = np.where(m.any(axis=0))[0]
        cs, los, his = [], [], []
        for u in idx:
            vs = np.where(m[:, u])[0]
            c0, b0 = vw.px_to_world(view, u + 0.5, vs.min())
            _, b1 = vw.px_to_world(view, u + 0.5, vs.max() + 1)
            cs.append(float(c0))
            los.append(float(min(b0, b1)))
            his.append(float(max(b0, b1)))
    else:
        raise ValueError(f"view {view} does not show slicing axis {slice_axis}")
    o = np.argsort(cs)
    return np.array(cs)[o], np.array(los)[o], np.array(his)[o]


def other_axis(view, slice_axis):
    ua, va = VIEW_AXES[view]
    return va if slice_axis == ua else ua


class Part:
    def __init__(self, d, vw):
        self.d = d
        self.name = d["name"]
        self.kind = d.get("kind", "c")
        self.axis = d["axis"]
        self.n = float(d.get("n", 2.5))
        self.joint = d.get("j", "root")
        self.vw = vw
        names = list(d["views"].keys())
        if d.get("order"):
            names = d["order"]
        self.va, self.vb = names[0], names[1]
        self._build_profile()

    def _build_profile(self):
        d, vw, ax = self.d, self.vw, self.axis
        nomask = d.get("nomask", [])
        ca, loa, hia = view_profile(vw, self.va, d["views"][self.va], ax, self.va in nomask)
        cb, lob, hib = view_profile(vw, self.vb, d["views"][self.vb], ax, self.vb in nomask)
        oa, ob = other_axis(self.va, ax), other_axis(self.vb, ax)
        if d.get("remap"):
            cb = ca.min() + (cb - cb.min()) * (ca.max() - ca.min()) / max(cb.max() - cb.min(), 1e-9)
        # smooth out pixel stair-steps (sigma in pixel lines)
        sig = d.get("smooth", 1.5)
        if sig > 0:
            loa, hia = ndimage.gaussian_filter1d(loa, sig), ndimage.gaussian_filter1d(hia, sig)
            lob, hib = ndimage.gaussian_filter1d(lob, sig), ndimage.gaussian_filter1d(hib, sig)
        self.c0 = max(ca.min(), cb.min())
        self.c1 = min(ca.max(), cb.max())
        if "crange" in d:
            self.c0 = max(self.c0, d["crange"][0])
            self.c1 = min(self.c1, d["crange"][1])
        self.prof = {oa: (ca, loa, hia), ob: (cb, lob, hib)}
        self.p_axis, self.q_axis = PQ[ax]
        assert set(self.prof) == {self.p_axis, self.q_axis}, (self.name, list(self.prof), PQ[ax])

    def extents(self, c, axis):
        cc, lo, hi = self.prof[axis]
        return np.interp(c, cc, lo), np.interp(c, cc, hi)

    def ring_frame(self, c):
        """Centre and half-size along p and q at slice positions c."""
        out = {}
        for a in (self.p_axis, self.q_axis):
            lo, hi = self.extents(c, a)
            half = np.maximum((hi - lo) / 2.0, 1e-4)
            cen = (hi + lo) / 2.0
            if a == "x" and self.kind == "c":
                # centred parts are symmetric about x = 0
                cen = np.zeros_like(cen)
                half = np.maximum((np.abs(lo) + np.abs(hi)) / 2.0, 1e-4)
            out[a] = (cen, half)
        # rounded ends: shrink the slice toward a dome within r metres of an end
        re = self.d.get("round_ends")
        if re:
            c = np.asarray(c, dtype=np.float64)
            f = np.ones_like(c)
            for end, r in (("start", re.get("start", 0)), ("end", re.get("end", 0))):
                if r > 0:
                    dist = (c - self.c0) if end == "start" else (self.c1 - c)
                    t = np.clip(dist / r, 0, 1)
                    f = np.minimum(f, np.sqrt(np.clip(1 - (1 - t) ** 2, 0, 1)))
            f = np.maximum(f, 0.02)
            for a in list(out):
                cen, half = out[a]
                out[a] = (cen, half * f)
        cap = self.d.get("cap", {})
        for a, mx in cap.items():
            if a in out:
                cen, half = out[a]
                out[a] = (cen, np.minimum(half, mx / 2.0))
        return out

    def length(self):
        return self.c1 - self.c0

    def mean_circ(self, samples=64):
        c = np.linspace(self.c0, self.c1, samples)
        f = self.ring_frame(c)
        a = f[self.p_axis][1]
        b = f[self.q_axis][1]
        # Ramanujan ellipse perimeter (good enough for budgeting)
        h = ((a - b) ** 2) / np.maximum((a + b) ** 2, 1e-12)
        per = math.pi * (a + b) * (1 + 3 * h / (10 + np.sqrt(4 - 3 * h)))
        return float(per.mean()), float(per.max())

    def grid(self, N, K, mirror=False, ring_c=None):
        """Ring grid (N, K, 3) plus start/end poles. Rings at c spaced evenly (or ring_c)."""
        if ring_c is None:
            # rings at even arc length along the profile so caps get rings too
            c = np.linspace(self.c0, self.c1, N)
        else:
            c = np.asarray(ring_c)
        f = self.ring_frame(c)
        th = np.linspace(0.0, 2 * math.pi, K, endpoint=False)
        e = 2.0 / self.n
        cp, sp = np.cos(th), np.sin(th)
        sx = np.sign(cp) * np.abs(cp) ** e
        sy = np.sign(sp) * np.abs(sp) ** e
        P = np.zeros((len(c), K, 3))
        pc, ph = f[self.p_axis]
        qc, qh = f[self.q_axis]
        P[:, :, AX[self.p_axis]] = pc[:, None] + ph[:, None] * sx[None, :]
        P[:, :, AX[self.q_axis]] = qc[:, None] + qh[:, None] * sy[None, :]
        P[:, :, AX[self.axis]] = c[:, None]
        ps = np.zeros(3)
        pe = np.zeros(3)
        ps[AX[self.p_axis]], ps[AX[self.q_axis]], ps[AX[self.axis]] = pc[0], qc[0], c[0]
        pe[AX[self.p_axis]], pe[AX[self.q_axis]], pe[AX[self.axis]] = pc[-1], qc[-1], c[-1]
        if mirror:
            P[..., 0] *= -1
            ps[0] *= -1
            pe[0] *= -1
        return P, ps, pe


def load_parts(parts_path, views_path):
    vw = Views(views_path)
    with open(parts_path) as f:
        pd = json.load(f)
    parts = [Part(d, vw) for d in pd["parts"]]
    return pd, parts, vw


def instances(parts):
    """Expand mirrored pairs: yields (instance_name, part, mirror)."""
    out = []
    for p in parts:
        if p.kind == "m":
            out.append((p.name + "_L", p, False))
            out.append((p.name + "_R", p, True))
        else:
            out.append((p.name, p, False))
    return out


def plan_resolution(parts, target_tris, min_k=8, min_n=3, max_k=4096):
    """Pick (N, K) per instance so the total triangles is close to target_tris."""
    inst = instances(parts)
    info = []
    small = target_tris < 20000
    for nm, p, mir in inst:
        circ, _ = p.mean_circ()
        # the small model can favour parts that matter on screen ("lo_weight")
        w = math.sqrt(p.d.get("lo_weight", 1.0)) if small else 1.0
        info.append((nm, p, mir, circ * w, max(p.length(), 1e-3) * w))

    def total(edge):
        t = 0
        res = []
        for nm, p, mir, circ, ln in info:
            K = int(min(max_k, max(min_k, round(circ / edge))))
            N = int(max(min_n, round(ln / edge) + 1))
            res.append((nm, p, mir, N, K))
            t += 2 * N * K
        return t, res

    lo, hi = 1e-4, 1.0
    for _ in range(60):
        mid = math.sqrt(lo * hi)
        t, _ = total(mid)
        if t > target_tris:
            lo = mid
        else:
            hi = mid
    t, res = total(hi)
    return hi, t, res


def mesh_arrays(P, ps, pe, uv_rect=None):
    """Vertices, triangles and UVs for a ring grid with poles (UV seam + per-segment poles).

    Returns verts (V,3), tris (T,3) int, uvs (V,2), and (N, K) for the grid layout.
    Faces are wound so normals point outward.
    """
    N, K, _ = P.shape
    ring = np.concatenate([P, P[:, :1]], axis=1)  # seam copy: (N, K+1, 3)
    verts = [ring.reshape(-1, 3)]
    nring = N * (K + 1)
    vs = np.repeat(ps[None], K, axis=0)
    ve = np.repeat(pe[None], K, axis=0)
    verts += [vs, ve]
    V = np.concatenate(verts)
    idx = np.arange(nring).reshape(N, K + 1)
    a = idx[:-1, :-1]
    b = idx[:-1, 1:]
    c = idx[1:, 1:]
    d = idx[1:, :-1]
    tris = [np.stack([a, b, c], -1).reshape(-1, 3), np.stack([a, c, d], -1).reshape(-1, 3)]
    j = np.arange(K)
    tris.append(np.stack([nring + j, idx[0, j + 1], idx[0, j]], -1))
    tris.append(np.stack([nring + K + j, idx[-1, j], idx[-1, j + 1]], -1))
    T = np.concatenate(tris).astype(np.int64)
    # orient outward: positive signed volume
    vol = np.einsum("ij,ij->i", V[T[:, 0]], np.cross(V[T[:, 1]], V[T[:, 2]])).sum()
    if vol < 0:
        T = T[:, [0, 2, 1]]
    if uv_rect is None:
        uv_rect = (0.0, 0.0, 1.0, 1.0)
    u0, v0, u1, v1 = uv_rect
    uu = u0 + (np.arange(K + 1) / K) * (u1 - u0)
    vv = v0 + ((np.arange(N) + 1) / (N + 1)) * (v1 - v0)
    UVr = np.stack(np.meshgrid(uu, vv), -1).reshape(-1, 2)
    up = u0 + ((j + 0.5) / K) * (u1 - u0)
    UVs = np.stack([up, np.full(K, v0)], -1)
    UVe = np.stack([up, np.full(K, v1)], -1)
    UV = np.concatenate([UVr, UVs, UVe])
    return V, T, UV, (N, K)
