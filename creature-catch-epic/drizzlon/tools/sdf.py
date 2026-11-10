"""Tiny signed-distance-field sculpting kit (numpy).

A creature is a list of primitives ("clay lumps"). Each lump is added with a
smooth blend, or carved away. The surface is where the field is zero.
Every lump remembers which bone moves it and what it is made of, so skin
weights and paint come straight from the sculpt.
"""
import numpy as np

F = np.float64


def V(*a):
    return np.array(a, dtype=F)


def smin(a, b, k):
    if k <= 0:
        return np.minimum(a, b)
    h = np.maximum(k - np.abs(a - b), 0.0) / k
    return np.minimum(a, b) - h * h * k * 0.25


def smax(a, b, k):
    return -smin(-a, -b, k)


def rot_x(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]], dtype=F)


def rot_y(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]], dtype=F)


def rot_z(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], dtype=F)


def sd_round_cone(P, a, b, r1, r2):
    ba = b - a
    l2 = float(ba @ ba)
    rr = r1 - r2
    a2 = l2 - rr * rr
    il2 = 1.0 / l2
    pa = P - a
    y = pa @ ba
    z = y - l2
    w = pa * l2 - y[:, None] * ba[None, :]
    x2 = (w * w).sum(1)
    y2 = y * y * l2
    z2 = z * z * l2
    k = np.sign(rr) * rr * rr * x2
    d1 = np.sqrt(x2 + z2) * il2 - r2
    d2 = np.sqrt(x2 + y2) * il2 - r1
    d3 = (np.sqrt(np.maximum(x2 * a2 * il2, 0)) + y * rr) * il2 - r1
    return np.where(np.sign(z) * a2 * z2 > k, d1, np.where(np.sign(y) * a2 * y2 < k, d2, d3))


def sd_ellipsoid(P, c, r, R=None):
    q = P - c
    if R is not None:
        q = q @ R  # into local axes (R columns are the local axes)
    k0 = np.sqrt(((q / r) ** 2).sum(1))
    k1 = np.sqrt(((q / (r * r)) ** 2).sum(1))
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


class Prim:
    """One lump of clay (or one carve)."""

    def __init__(self, name, fn, lo, hi, op='add', k=0.02, mat='skin', bone='root', color=(1, 1, 1), tau=0.012):
        self.name, self.fn, self.op, self.k = name, fn, op, k
        self.lo, self.hi = np.asarray(lo, F), np.asarray(hi, F)
        self.mat, self.bone, self.color, self.tau = mat, bone, color, tau


def ell(name, c, r, R=None, **kw):
    c, r = V(*c), V(*r)
    m = float(r.max())
    return Prim(name, lambda P: sd_ellipsoid(P, c, r, R), c - m, c + m, **kw)


def cone(name, a, b, r1, r2, **kw):
    a, b = V(*a), V(*b)
    lo = np.minimum(a - r1, b - r2)
    hi = np.maximum(a + r1, b + r2)
    return Prim(name, lambda P: sd_round_cone(P, a, b, r1, r2), lo, hi, **kw)


def flat_cone(name, a, b, r1, r2, sx, **kw):
    """Round cone squashed sideways (in x) by sx < 1, for fins and locks."""
    a, b = V(*a), V(*b)
    S = V(1.0 / sx, 1, 1)
    a2, b2 = a * S, b * S
    lo = np.minimum(a - r1, b - r2)
    hi = np.maximum(a + r1, b + r2)
    return Prim(name, lambda P: sd_round_cone(P * S, a2, b2, r1, r2) * sx, lo, hi, **kw)


class Scene:
    def __init__(self):
        self.prims = []

    def add(self, p):
        self.prims.append(p)
        return p

    # ---- evaluation at free points -------------------------------------------------
    def eval(self, P, margin=0.06, skip_disp=False):
        P = np.asarray(P, F)
        D = np.full(len(P), 1e3, F)
        for p in self.prims:
            m = p.k + margin
            inside = np.all((P >= p.lo - m) & (P <= p.hi + m), axis=1)
            if not inside.any():
                continue
            idx = np.nonzero(inside)[0]
            d = p.fn(P[idx])
            if p.op == 'add':
                D[idx] = smin(D[idx], d, p.k)
            elif p.op == 'sub':
                D[idx] = smax(D[idx], -d, p.k)
            elif p.op == 'disp' and not skip_disp:
                D[idx] = D[idx] + d
        return D

    def eval_chunked(self, P, chunk=400000, **kw):
        out = np.empty(len(P), F)
        for i in range(0, len(P), chunk):
            out[i:i + chunk] = self.eval(P[i:i + chunk], **kw)
        return out

    def normal(self, P, eps=0.0006):
        # tetrahedron trick: 4 evaluations
        k = np.array([[1, -1, -1], [-1, -1, 1], [-1, 1, -1], [1, 1, 1]], F)
        n = np.zeros_like(P)
        for kk in k:
            n += kk[None, :] * self.eval_chunked(P + kk[None, :] * eps)[:, None]
        n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
        return n

    # ---- evaluation on a regular grid ----------------------------------------------
    def grid(self, lo, hi, h, margin=0.03, log=None):
        lo, hi = np.asarray(lo, F), np.asarray(hi, F)
        n = np.ceil((hi - lo) / h).astype(int) + 1
        ax = [lo[i] + h * np.arange(n[i]) for i in range(3)]
        D = np.full(tuple(n), 1e3, np.float32)
        for p in self.prims:
            m = p.k + margin
            i0 = np.clip(np.floor((p.lo - m - lo) / h).astype(int), 0, n - 1)
            i1 = np.clip(np.ceil((p.hi + m - lo) / h).astype(int) + 1, 1, n)
            if np.any(i1 <= i0):
                continue
            # slab along x to bound memory
            step = max(1, int(3e6 // max(1, (i1[1] - i0[1]) * (i1[2] - i0[2]))))
            for xs in range(i0[0], i1[0], step):
                xe = min(i1[0], xs + step)
                X, Y, Z = np.meshgrid(ax[0][xs:xe], ax[1][i0[1]:i1[1]], ax[2][i0[2]:i1[2]], indexing='ij')
                P = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
                d = p.fn(P).reshape(X.shape)
                blk = D[xs:xe, i0[1]:i1[1], i0[2]:i1[2]]
                if p.op == 'add':
                    blk[...] = smin(blk, d, p.k)
                elif p.op == 'sub':
                    blk[...] = smax(blk, -d, p.k)
                elif p.op == 'disp':
                    blk[...] = blk + d
        return D, lo, n
