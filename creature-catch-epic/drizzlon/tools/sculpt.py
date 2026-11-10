#!/usr/bin/env python3
"""Sculpt Drizzlon, the little water dragon, and write drizzlon.glb.

    python3 tools/sculpt.py [--h 0.002] [--tris 120000] [--out build/drizzlon.glb]

The body is one continuous sculpted surface (smooth-blended clay lumps turned into
a mesh), with a skeleton, skin weights, paint and baked soft shadowing that all
come from the sculpt itself. Wing and frill membranes, eyes and the tail droplet are
separate thin meshes on the same skeleton.

Axes: +Z is forward (nose), +Y is up, +X is the creature's left. Units are metres.
"""
import argparse
import json
import os
import sys
import time

import numpy as np
import scipy.sparse as sp
from skimage import measure

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sdf import V, F, Scene, Prim, ell, cone, flat_cone, rot_x, rot_y, rot_z, sd_round_cone, sd_ellipsoid, smin  # noqa: E402
from glb import GLB  # noqa: E402

T0 = time.time()


def log(*a):
    print('[%6.1fs]' % (time.time() - T0), *a, flush=True)


def srgb(hexs):
    hexs = hexs.lstrip('#')
    c = np.array([int(hexs[i:i + 2], 16) / 255.0 for i in (0, 2, 4)], F)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def mx(p):  # mirror a point / list of points to the right side
    p = np.array(p, F)
    p[..., 0] *= -1
    return p


# ---------------------------------------------------------------- palette (sRGB hex)
C_SKIN = srgb('#2c7be8')
C_SKIN_DARK = srgb('#1b55c4')
C_SKIN_LIGHT = srgb('#4b9bf5')
C_BELLY = srgb('#96efd6')
C_BELLY_DEEP = srgb('#5fd3bd')
C_PLATE = srgb('#35c9cf')
C_HORN = srgb('#d9f3ff')
C_HORN_BASE = srgb('#8fd0f4')
C_CLAW = srgb('#f6f9ff')
C_CREST = srgb('#1657cf')
C_CREST_TIP = srgb('#2f8df0')
C_MOUTH = srgb('#a02848')
C_TONGUE = srgb('#ff8fa8')
C_MEMBRANE = srgb('#7fe9d2')
C_BROW = srgb('#123f9e')

# ---------------------------------------------------------------- skeleton
J = {}        # name -> (parent, position)
ORDER = []


def joint(name, parent, pos):
    J[name] = (parent, V(*pos))
    ORDER.append(name)


joint('root', None, (0, 0, 0))
joint('hips', 'root', (0, 0.235, -0.115))
joint('spine', 'hips', (0, 0.235, -0.02))
joint('chest', 'spine', (0, 0.25, 0.07))
joint('neck1', 'chest', (0, 0.315, 0.125))
joint('neck2', 'neck1', (0, 0.375, 0.16))
joint('head', 'neck2', (0, 0.435, 0.19))
joint('jaw', 'head', (0, 0.452, 0.232))
joint('crest1', 'head', (0, 0.635, 0.24))
joint('crest2', 'crest1', (0, 0.70, 0.17))

TAIL = [(0, 0.225, -0.185), (0, 0.200, -0.240), (0, 0.205, -0.285), (0, 0.255, -0.315),
        (0, 0.320, -0.320), (0, 0.390, -0.312), (0, 0.455, -0.300), (0, 0.515, -0.292)]
TAIL_TIP = (0, 0.553, -0.288)
TAIL_R = [0.086, 0.073, 0.061, 0.051, 0.042, 0.034, 0.028, 0.023, 0.019]
for i, p in enumerate(TAIL):
    joint('tail%d' % (i + 1), 'hips' if i == 0 else 'tail%d' % i, p)
joint('drop', 'tail8', TAIL_TIP)

EAR_BASE = V(0.138, 0.512, 0.135)
EAR_TIPS = {'t': V(0.253, 0.648, -0.020), 'm': V(0.296, 0.515, -0.004), 'b': V(0.228, 0.412, 0.062)}
WING = {'sh': V(0.070, 0.352, 0.040), 'wr': V(0.160, 0.418, 0.018), 'f1m': V(0.275, 0.440, -0.004),
        't1': V(0.392, 0.386, -0.030), 't2': V(0.345, 0.226, -0.046), 't3': V(0.238, 0.158, -0.046),
        'bd': V(0.098, 0.215, -0.035)}
ARM = [V(0.085, 0.250, 0.095), V(0.098, 0.142, 0.076), V(0.100, 0.052, 0.094)]
LEG = [V(0.095, 0.240, -0.120), V(0.116, 0.142, -0.072), V(0.110, 0.056, -0.126)]

for s, sx in (('L', 1), ('R', -1)):
    m = (lambda p: p) if sx > 0 else mx
    joint('brow' + s, 'head', m(V(0.131, 0.552, 0.255)))
    joint('cheek' + s, 'head', m(V(0.112, 0.446, 0.262)))
    joint('ear' + s, 'head', m(EAR_BASE))
    for k in 'tmb':
        joint('ear%s_%s' % (s, k), 'ear' + s, m(EAR_BASE))
    joint('wing' + s, 'chest', m(WING['sh']))
    joint('wing%s_f1a' % s, 'wing' + s, m(WING['wr']))
    joint('wing%s_f1b' % s, 'wing%s_f1a' % s, m(WING['f1m']))
    joint('wing%s_f2' % s, 'wing' + s, m(WING['wr']))
    joint('wing%s_f3' % s, 'wing' + s, m(WING['wr']))
    joint('arm%s1' % s, 'chest', m(ARM[0]))
    joint('arm%s2' % s, 'arm%s1' % s, m(ARM[1]))
    joint('arm%s3' % s, 'arm%s2' % s, m(ARM[2]))
    joint('leg%s1' % s, 'hips', m(LEG[0]))
    joint('leg%s2' % s, 'leg%s1' % s, m(LEG[1]))
    joint('leg%s3' % s, 'leg%s2' % s, m(LEG[2]))

BI = {n: i for i, n in enumerate(ORDER)}

EYES = {}

# ---------------------------------------------------------------- the sculpt
S = Scene()


def _cr(pts, n):
    pts = [np.asarray(p, F) for p in pts]
    P = [pts[0] * 2 - pts[1]] + pts + [pts[-1] * 2 - pts[-2]]
    out = []
    segs = len(pts) - 1
    for i in range(n):
        x = i / (n - 1) * segs
        k = min(int(x), segs - 1)
        t = x - k
        p0, p1, p2, p3 = P[k], P[k + 1], P[k + 2], P[k + 3]
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    return np.array(out)


def curve_tube(name, pts, radii, bones, sub=3, flat=None, k0=0.02, k=0.006, **kw):
    """A smooth tapered tube through control points; bones[i] moves the span from point i to i+1."""
    spans = len(pts) - 1
    c = _cr(pts, spans * sub + 1)
    rr = _cr([np.array([r, 0, 0]) for r in radii], spans * sub + 1)[:, 0]
    for i in range(spans * sub):
        kk = k0 if i == 0 else k
        if flat:
            S.add(flat_cone(name, c[i], c[i + 1], rr[i], rr[i + 1], flat, k=kk, bone=bones[i // sub], **kw))
        else:
            S.add(cone(name, c[i], c[i + 1], rr[i], rr[i + 1], k=kk, bone=bones[i // sub], **kw))

SKIN = dict(mat='skin', color=C_SKIN)


def add(p):
    return S.add(p)


# torso
add(ell('chest', (0, 0.240, 0.075), (0.112, 0.112, 0.100), k=0.05, bone='chest', **SKIN))
add(ell('mid', (0, 0.215, -0.025), (0.122, 0.118, 0.112), k=0.05, bone='spine', **SKIN))
add(ell('rump', (0, 0.225, -0.125), (0.113, 0.108, 0.096), k=0.05, bone='hips', **SKIN))
# neck
add(cone('neck1', (0, 0.290, 0.118), (0, 0.345, 0.150), 0.078, 0.075, k=0.05, bone='neck1', **SKIN))
add(cone('neck2', (0, 0.345, 0.150), (0, 0.410, 0.185), 0.075, 0.071, k=0.03, bone='neck2', **SKIN))
# tail
tp = [V(0, 0.228, -0.150)] + [V(*p) for p in TAIL] + [V(*TAIL_TIP)]
curve_tube('tail', tp, [0.094] + TAIL_R, ['hips'] + ['tail%d' % i for i in range(1, 9)], sub=3, k0=0.03, k=0.01,
           tau=0.010, **SKIN)

# ---- belly: a stencil that follows the underside, used for paint and for the plate creases
VENTRAL = [  # (centre, body radius there, direction to the belly side, width factor)
    (V(0, 0.412, 0.190), 0.070, V(0, -0.42, 0.91), 0.62),
    (V(0, 0.345, 0.150), 0.077, V(0, -0.49, 0.87), 0.80),
    (V(0, 0.270, 0.100), 0.098, V(0, -0.30, 0.95), 0.92),
    (V(0, 0.232, 0.062), 0.112, V(0, -0.72, 0.69), 1.0),
    (V(0, 0.215, -0.025), 0.118, V(0, -1, 0.0), 1.0),
    (V(0, 0.225, -0.125), 0.108, V(0, -1, -0.05), 0.98),
    (V(0, 0.228, -0.165), 0.092, V(0, -0.93, -0.36), 0.95),
]
for i in range(len(TAIL)):
    a = tp[i + 1]
    tan = tp[min(i + 2, len(tp) - 1)] - tp[i]
    tan /= np.linalg.norm(tan)
    v = V(0, -tan[2], tan[1])            # perpendicular in the YZ plane
    if v @ V(0, -1, -1) < 0:
        v = -v
    VENTRAL.append((a, TAIL_R[i], v, 0.95 if i < 6 else 0.8))
ST_P, ST_R = [], []
for c, R, v, wf in VENTRAL:
    v = v / np.linalg.norm(v)
    rho = 0.80 * R
    pen = 0.30 * R * wf
    ST_P.append(c + v * (R + rho - pen))
    ST_R.append(rho)
ST_P = np.array(ST_P)
ST_R = np.array(ST_R)
ST_LEN = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(ST_P, axis=0), axis=1) / (0.5 * (ST_R[1:] + ST_R[:-1])))])


def stencil(P):
    """Returns (signed distance to the belly stencil, plate coordinate along it, local size)."""
    best = np.full(len(P), 1e3)
    u = np.zeros(len(P))
    rho = np.zeros(len(P))
    for i in range(len(ST_P) - 1):
        a, b = ST_P[i], ST_P[i + 1]
        d = sd_round_cone(P, a, b, ST_R[i], ST_R[i + 1])
        ba = b - a
        t = np.clip(((P - a) @ ba) / (ba @ ba), 0, 1)
        better = d < best
        best = np.where(better, d, best)
        u = np.where(better, ST_LEN[i] + t * (ST_LEN[i + 1] - ST_LEN[i]), u)
        rho = np.where(better, ST_R[i] + t * (ST_R[i + 1] - ST_R[i]), rho)
    return best, u, rho


PLATE_PERIOD = 0.62


def belly_disp(P):
    d, u, rho = stencil(P)
    inside = smoothstep(0.004, -0.006, d)
    f = (u / PLATE_PERIOD) % 1.0
    notch = np.exp(-(np.minimum(f, 1 - f) / 0.075) ** 2)
    hump = np.sin(np.pi * f) ** 0.7
    sc = rho / 0.07
    edge = np.exp(-((d + 0.001) / 0.0035) ** 2)
    return (inside * (0.0030 * notch - 0.0022 * hump) * sc + 0.0011 * edge * sc).astype(F)


st_lo = (ST_P - ST_R[:, None]).min(0)
st_hi = (ST_P + ST_R[:, None]).max(0)
add(Prim('belly_plates', belly_disp, st_lo, st_hi, op='disp', k=0.0))

# ---- head
HEAD = dict(mat='skin', color=C_SKIN, bone='head')
add(ell('skull', (0, 0.512, 0.225), (0.140, 0.120, 0.105), k=0.035, **HEAD))
for sx in (1, -1):
    add(ell('cheek', (sx * 0.066, 0.450, 0.248), (0.064, 0.054, 0.066), k=0.035, **HEAD))
    # brow ridge that shades the eye and runs back toward the horn
    curve_tube('brow', [(sx * 0.042, 0.532, 0.324), (sx * 0.088, 0.551, 0.307), (sx * 0.131, 0.545, 0.262), (sx * 0.128, 0.575, 0.214)],
               [0.011, 0.0175, 0.0165, 0.012], ['brow' + ('L' if sx > 0 else 'R')] * 2 + ['head'], sub=3, k0=0.022, k=0.022,
               mat='skin', color=C_SKIN, tau=0.016)
    # cheekbone under the eye
    add(ell('cheekbone', (sx * 0.112, 0.446, 0.262), (0.026, 0.013, 0.032), R=rot_y(sx * 0.5), k=0.028, mat='skin', color=C_SKIN,
            bone='cheek' + ('L' if sx > 0 else 'R'), tau=0.016))
add(ell('snout', (0, 0.468, 0.334), (0.053, 0.039, 0.064), k=0.03, **HEAD))
add(ell('snout_tip', (0, 0.471, 0.374), (0.037, 0.028, 0.030), k=0.02, **HEAD))
add(ell('snout_bridge', (0, 0.506, 0.322), (0.026, 0.020, 0.052), R=rot_x(0.5), k=0.03, **HEAD))
for sx in (1, -1):
    add(ell('nostril_rim', (sx * 0.020, 0.488, 0.386), (0.012, 0.0095, 0.012), k=0.012, **HEAD))
add(ell('jaw', (0, 0.404, 0.280), (0.062, 0.035, 0.074), k=0.022, mat='skin', color=C_SKIN, bone='jaw', tau=0.008))
add(ell('chin', (0, 0.397, 0.332), (0.037, 0.023, 0.030), k=0.02, mat='skin', color=C_SKIN, bone='jaw', tau=0.008))

# ---- legs
for s, sx in (('L', 1), ('R', -1)):
    m = (lambda p: p) if sx > 0 else mx
    a0, a1, a2 = [m(p) for p in ARM]
    add(ell('shoulder' + s, a0 + V(sx * 0.006, -0.01, 0), (0.060, 0.075, 0.066), k=0.045, bone='arm%s1' % s, **SKIN))
    add(cone('arm1' + s, a0, a1, 0.056, 0.047, k=0.03, bone='arm%s1' % s, **SKIN))
    add(cone('arm2' + s, a1, a2, 0.047, 0.043, k=0.02, bone='arm%s2' % s, **SKIN))
    paw = a2 + V(0, -0.020, 0.022)
    add(ell('paw' + s, paw, (0.052, 0.032, 0.058), k=0.018, bone='arm%s3' % s, **SKIN))
    for j, off in enumerate((-0.031, 0.0, 0.031)):
        toe = paw + V(off, -0.006, 0.040 - abs(off) * 0.25)
        add(ell('toe', toe, (0.019, 0.022, 0.026), k=0.008, bone='arm%s3' % s, **SKIN))
        dirv = V(off * 0.2, -0.009, 0.024)
        add(cone('claw', toe + V(0, 0.000, 0.012), toe + V(0, 0.000, 0.012) + dirv, 0.0155, 0.0060, k=0.004,
                 bone='arm%s3' % s, mat='claw', color=C_CLAW))

    l0, l1, l2 = [m(p) for p in LEG]
    add(ell('haunch' + s, l0 + V(sx * 0.012, -0.035, 0.020), (0.066, 0.094, 0.088), R=rot_x(-0.35), k=0.045,
            bone='leg%s1' % s, **SKIN))
    add(cone('leg1' + s, l0, l1, 0.064, 0.050, k=0.03, bone='leg%s1' % s, **SKIN))
    add(cone('leg2' + s, l1, l2, 0.049, 0.041, k=0.022, bone='leg%s2' % s, **SKIN))
    foot = l2 + V(0, -0.024, 0.040)
    add(cone('heel' + s, l2 + V(0, -0.014, 0.0), foot, 0.040, 0.036, k=0.02, bone='leg%s3' % s, **SKIN))
    add(ell('foot' + s, foot, (0.053, 0.032, 0.060), k=0.018, bone='leg%s3' % s, **SKIN))
    for j, off in enumerate((-0.032, 0.0, 0.032)):
        toe = foot + V(off, -0.006, 0.042 - abs(off) * 0.25)
        add(ell('toe', toe, (0.020, 0.022, 0.027), k=0.008, bone='leg%s3' % s, **SKIN))
        dirv = V(off * 0.2, -0.009, 0.025)
        add(cone('claw', toe + V(0, 0.000, 0.013), toe + V(0, 0.000, 0.013) + dirv, 0.016, 0.0060, k=0.004,
                 bone='leg%s3' % s, mat='claw', color=C_CLAW))

# ---- horns
HORN = [V(0.092, 0.598, 0.200), V(0.121, 0.664, 0.146), V(0.127, 0.716, 0.074), V(0.112, 0.750, 0.000)]
HORN_R = [0.033, 0.027, 0.017, 0.0045]
HORN_LEN = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(np.array(HORN), axis=0), axis=1))])


def horn_color(sx):
    def f(P):
        base = V(sx * HORN[0][0], HORN[0][1], HORN[0][2])
        t = np.clip(np.linalg.norm(P - base, axis=1) / 0.20, 0, 1)
        ring = 0.5 + 0.5 * np.cos(t * 46.0)
        c = C_HORN_BASE[None, :] * (1 - t[:, None]) + C_HORN[None, :] * t[:, None]
        return c * (1.0 - 0.10 * (ring ** 4)[:, None] * (1 - t[:, None]))
    return f


for sx in (1, -1):
    pts = HORN if sx > 0 else [mx(p) for p in HORN]
    for i in range(3):
        add(cone('horn', pts[i], pts[i + 1], HORN_R[i], HORN_R[i + 1], k=0.010 if i == 0 else 0.004, bone='head', mat='horn',
                 color=horn_color(sx)))
    # sculpted growth rings on the horn
    def horn_rings(P, pts=pts):
        best = np.full(len(P), 1e3)
        u = np.zeros(len(P))
        for i in range(3):
            a, b = pts[i], pts[i + 1]
            d = sd_round_cone(P, a, b, HORN_R[i], HORN_R[i + 1])
            t = np.clip(((P - a) @ (b - a)) / ((b - a) @ (b - a)), 0, 1)
            better = d < best
            best = np.where(better, d, best)
            u = np.where(better, HORN_LEN[i] + t * (HORN_LEN[i + 1] - HORN_LEN[i]), u)
        near = smoothstep(0.006, 0.0, np.abs(best))
        fade = smoothstep(0.2, 0.03, u) * smoothstep(0.012, 0.03, u)
        return near * fade * 0.0011 * np.cos(u * 300.0)
    lo = np.min(np.array(pts), 0) - 0.04
    hi = np.max(np.array(pts), 0) + 0.04
    add(Prim('horn_rings', horn_rings, lo, hi, op='disp', k=0.0))

# ---- crest: a tuft of swept-back fin locks
CREST = dict(mat='crest')


def crest_color(P):
    t = smoothstep(0.60, 0.74, P[:, 1])[:, None]
    return C_CREST[None, :] * (1 - t) + C_CREST_TIP[None, :] * t


LOCKS = [
    ([(0, 0.600, 0.262), (0, 0.665, 0.262), (0, 0.715, 0.225), (0, 0.738, 0.165), (0, 0.730, 0.105), (0.004, 0.705, 0.060)],
     [0.040, 0.040, 0.035, 0.026, 0.014, 0.003]),
    ([(0, 0.605, 0.205), (0, 0.660, 0.185), (0, 0.685, 0.135), (0, 0.678, 0.085), (-0.004, 0.655, 0.050)],
     [0.034, 0.030, 0.022, 0.012, 0.003]),
    ([(0, 0.600, 0.292), (0, 0.640, 0.305), (0, 0.672, 0.292), (0.003, 0.685, 0.265)], [0.028, 0.024, 0.015, 0.004]),
    ([(0.030, 0.600, 0.245), (0.048, 0.650, 0.225), (0.060, 0.680, 0.180), (0.062, 0.682, 0.130)], [0.028, 0.024, 0.014, 0.003]),
    ([(-0.030, 0.600, 0.245), (-0.048, 0.650, 0.225), (-0.060, 0.680, 0.180), (-0.062, 0.682, 0.130)], [0.028, 0.024, 0.014, 0.003]),
]
for pts, rr in LOCKS:
    nb = len(pts) - 1
    curve_tube('crest', pts, rr, ['crest1'] + ['crest2'] * (nb - 1), sub=3, flat=0.9, k0=0.016, k=0.005, color=crest_color,
               tau=0.02, **CREST)

# ---- dorsal plates (teal scutes down the back and tail)
PLATES = [  # (position on the back, size, lean back in radians, bone)
    (V(0, 0.352, 0.045), 1.00, 0.55, 'chest'),
    (V(0, 0.338, -0.030), 1.10, 0.75, 'spine'),
    (V(0, 0.335, -0.105), 1.05, 0.80, 'hips'),
    (V(0, 0.312, -0.172), 0.95, 1.05, 'hips'),
    (V(0, 0.272, -0.232), 0.85, 1.25, 'tail2'),
    (V(0, 0.262, -0.262), 0.0, 0, 'tail3'),
]
PLATE_PRIMS = []
for pos, sz, lean, bone in PLATES:
    if sz <= 0:
        continue
    Rm = rot_x(lean)
    r = V(0.0145, 0.040, 0.048) * sz
    c = pos + Rm @ V(0, r[1] * 0.2, 0)
    PLATE_PRIMS.append(add(ell('plate', c, r, R=Rm, k=0.006, bone=bone, mat='plate', color=C_PLATE)))
# plates up the tail are placed from the tail curve itself
for i in (3, 4, 5):
    a = tp[i + 1]
    tan = tp[i + 2] - tp[i]
    tan /= np.linalg.norm(tan)
    dors = V(0, tan[2], -tan[1])
    if dors @ V(0, 1, 1) < 0:
        dors = -dors
    sz = [0.72, 0.6, 0.48][i - 3]
    r = V(0.014, 0.036, 0.044) * sz
    ang = np.arctan2(tan[1], -tan[2])    # lean the plate along the tail
    Rm = rot_x(-ang + 0.35)
    c = a + dors * (TAIL_R[i] + r[1] * 0.2)
    add(ell('plate', c, r, R=Rm, k=0.005, bone='tail%d' % (i + 1), mat='plate', color=C_PLATE))

# ---- carves: mouth, nostrils, eye sockets
MOUTH_C = V(0, 0.4315, 0.352)
MOUTH_R = V(0.056, 0.0150, 0.088)


def mouth_sd(P, grow=0.0):
    Q = P.copy()
    Q[:, 1] = Q[:, 1] - 4.4 * Q[:, 0] ** 2 + 0.10 * (Q[:, 2] - 0.35)
    d1 = sd_ellipsoid(Q, MOUTH_C, MOUTH_R + grow)
    d2 = sd_ellipsoid(Q, V(0, 0.428, 0.285), V(0.040, 0.021, 0.046) + grow)
    return smin(d1, d2, 0.01)


add(Prim('mouth', mouth_sd, V(-0.07, 0.39, 0.23), V(0.07, 0.47, 0.45), op='sub', k=0.007))
add(ell('tongue', (0, 0.4175, 0.312), (0.029, 0.011, 0.050), R=rot_x(-0.12), k=0.005, mat='tongue', color=C_TONGUE, bone='jaw'))
EYE_RAD = V(0.0420, 0.0480, 0.0340)
EYE_DEPTH = 0.0250
for s_, sx in (('L', 1), ('R', -1)):
    axis = V(sx * 0.50, 0.03, 0.86)
    axis /= np.linalg.norm(axis)
    surf = V(sx * 0.0935, 0.497, 0.2985)
    right = np.cross(V(0, 1, 0), axis)
    right /= np.linalg.norm(right)
    up = np.cross(axis, right)
    EYES[s_] = dict(center=surf - axis * EYE_DEPTH, surf=surf, R=np.stack([right, up, axis], 1), radii=EYE_RAD, axis=axis, up=up, right=right)
for sx in (1, -1):
    add(ell('nostril', (sx * 0.0205, 0.4915, 0.3935), (0.0050, 0.0045, 0.008), R=rot_y(sx * 0.4), op='sub', k=0.004))
    e = EYES['L' if sx > 0 else 'R']
    add(ell('socket', e['center'], e['radii'] + 0.0012, R=e['R'], op='sub', k=0.005))

# ---------------------------------------------------------------- mesh the sculpt


def build_body(h, target_tris):
    lo = V(-0.215, -0.012, -0.385)
    hi = V(0.215, 0.775, 0.430)
    log('evaluating field, cell %.2f mm' % (h * 1000))
    D, glo, n = S.grid(lo, hi, h)
    log('grid', tuple(n), 'marching cubes')
    v, f, _, _ = measure.marching_cubes(D, 0.0, spacing=(h, h, h))
    v = v.astype(F) + glo
    del D
    log('raw mesh', len(v), 'verts', len(f), 'tris')
    if target_tris and len(f) > target_tris:
        import pyfqmr
        ms = pyfqmr.Simplify()
        ms.setMesh(v, f.astype(np.int32))
        ms.simplify_mesh(target_count=target_tris, aggressiveness=4, preserve_border=True, verbose=False)
        v, f, _ = ms.getMesh()
        v = np.asarray(v, F)
        f = np.asarray(f, np.int64)
        log('decimated to', len(v), 'verts', len(f), 'tris')
    # pull every vertex exactly onto the surface, then take analytic normals
    for _ in range(2):
        nrm = S.normal(v)
        v = v - nrm * S.eval_chunked(v)[:, None]
    nrm = S.normal(v, eps=0.0008)
    # drop degenerate / unused
    a, b, c = v[f[:, 0]], v[f[:, 1]], v[f[:, 2]]
    area = np.linalg.norm(np.cross(b - a, c - a), axis=1)
    f = f[area > 1e-12]
    # outward-facing triangles
    a, b, c = v[f[:, 0]], v[f[:, 1]], v[f[:, 2]]
    fn = np.cross(b - a, c - a)
    if (fn * (nrm[f[:, 0]] + nrm[f[:, 1]] + nrm[f[:, 2]])).sum() < 0:
        f = f[:, ::-1].copy()
    bad = ~np.isfinite(v).all(1) | ~np.isfinite(nrm).all(1)
    log('bad verts', int(bad.sum()), 'bounds', v.min(0).round(3), v.max(0).round(3))
    return v, nrm, f


def body_attributes(v, nrm, f):
    N = len(v)
    adds = [p for p in S.prims if p.op == 'add']
    dist = np.full((len(adds), N), 1e3, np.float32)
    for i, p in enumerate(adds):
        inside = np.all((v >= p.lo - 0.05) & (v <= p.hi + 0.05), axis=1)
        idx = np.nonzero(inside)[0]
        if len(idx):
            dist[i, idx] = p.fn(v[idx])
    # ---- skin weights
    dmin = dist.min(0)
    W = np.zeros((N, len(ORDER)), np.float32)
    for i, p in enumerate(adds):
        e = np.maximum(dist[i] - dmin, 0)
        w = np.exp(-e / p.tau)
        W[:, BI[p.bone]] = np.maximum(W[:, BI[p.bone]], w)
    W[W < 0.02] = 0
    W /= W.sum(1, keepdims=True)
    # smooth over the surface
    ii = np.concatenate([f[:, 0], f[:, 1], f[:, 2], f[:, 1], f[:, 2], f[:, 0]])
    jj = np.concatenate([f[:, 1], f[:, 2], f[:, 0], f[:, 0], f[:, 1], f[:, 2]])
    A = sp.coo_matrix((np.ones(len(ii), np.float32), (ii, jj)), shape=(N, N)).tocsr()
    A.data[:] = 1
    deg = np.asarray(A.sum(1)).ravel()
    Dinv = sp.diags(1.0 / np.maximum(deg, 1))
    Lp = Dinv @ A
    for _ in range(6):
        W = 0.5 * W + 0.5 * (Lp @ W)
    # ---- paint
    skin_i = [i for i, p in enumerate(adds) if p.mat in ('skin', 'crest', 'tongue')]
    over_i = [i for i, p in enumerate(adds) if p.mat in ('horn', 'claw', 'plate')]
    d_skin = dist[skin_i].min(0)
    d_over = dist[over_i].min(0)
    over_arg = np.array(over_i)[dist[over_i].argmin(0)]
    col = np.zeros((N, 3))
    wsum = np.zeros(N)
    scale_amt = np.zeros(N)
    gloss = np.zeros(N)
    md = mouth_sd(v, grow=0.004)
    m_in = smoothstep(0.004, -0.004, md)
    for i in skin_i:
        p = adds[i]
        w = np.exp(-np.maximum(dist[i] - d_skin, 0) / 0.004)
        w[dist[i] > 0.5] = 0
        c = p.color(v) if callable(p.color) else np.broadcast_to(p.color, (N, 3))
        sc, gl = 1.0, 0.35
        if p.mat == 'crest':
            sc, gl = 0.0, 0.62
        if p.mat == 'tongue':
            sc, gl = 0.0, 0.85
        if p.mat == 'skin' and p.bone in ('head', 'jaw', 'cheekL', 'cheekR', 'browL', 'browR'):
            c = c * (1 - m_in[:, None]) + C_MOUTH[None, :] * m_in[:, None]
            scv = sc * (1 - m_in)
            glv = gl * (1 - m_in) + 0.8 * m_in
        else:
            scv, glv = np.full(N, sc), np.full(N, gl)
        col += c * w[:, None]
        scale_amt += scv * w
        gloss += glv * w
        wsum += w
    wsum = np.maximum(wsum, 1e-9)
    col /= wsum[:, None]
    scale_amt /= wsum
    gloss /= wsum
    # counter-shading: deeper blue on top, lighter low on the flanks; a little variation by part
    top = smoothstep(-0.2, 0.9, nrm[:, 1])
    is_mouthy = np.clip(m_in + (1 - np.clip(scale_amt * 4, 0, 1)), 0, 1)
    shade = (C_SKIN_DARK[None, :] * top[:, None] + C_SKIN_LIGHT[None, :] * (1 - top[:, None]))
    mixk = 0.55 * (1 - is_mouthy)
    col = col * (1 - mixk[:, None]) + shade * mixk[:, None]
    # toes and muzzle a touch lighter
    low = smoothstep(0.09, 0.0, v[:, 1]) * (1 - is_mouthy)
    col = col * (1 - 0.18 * low[:, None]) + C_SKIN_DARK[None, :] * 0.18 * low[:, None]

    # overlay layer: horn / claw / plate, or painted belly / brows
    hard = (d_skin - d_over) / 0.004
    col2 = np.zeros((N, 3))
    gloss2 = np.zeros(N)
    for i in over_i:
        p = adds[i]
        sel = over_arg == i
        if sel.any():
            c = p.color(v[sel]) if callable(p.color) else np.broadcast_to(p.color, (int(sel.sum()), 3))
            col2[sel] = c
            gloss2[sel] = {'horn': 0.82, 'claw': 0.9, 'plate': 0.7}[p.mat]
    # belly paint (only on torso / neck / tail lumps)
    belly_names = ('chest', 'mid', 'rump', 'neck1', 'neck2', 'tail')
    bel_i = [i for i, p in enumerate(adds) if p.name in belly_names]
    oth_i = [i for i in skin_i if i not in bel_i]
    allowed = (dist[oth_i].min(0) - dist[bel_i].min(0)) / 0.004
    sd_st, u_st, rho_st = stencil(v)
    belly = np.minimum(-sd_st / 0.004, allowed + 1.5)
    fpl = (u_st / PLATE_PERIOD) % 1.0
    groove = np.exp(-(np.minimum(fpl, 1 - fpl) / 0.09) ** 2)
    belly_col = C_BELLY[None, :] * (1 - 0.45 * groove[:, None]) + C_BELLY_DEEP[None, :] * 0.45 * groove[:, None]
    edge_dark = smoothstep(-0.02, 0.0, sd_st)[:, None]
    belly_col = belly_col * (1 - 0.25 * edge_dark) + C_BELLY_DEEP[None, :] * 0.25 * edge_dark
    amix = hard.copy()
    use_belly = belly > amix
    amix = np.where(use_belly, belly, amix)
    col2[use_belly] = belly_col[use_belly]
    gloss2[use_belly] = 0.5
    amix = np.clip(amix, -6, 6)

    # ---- baked soft shadowing from the sculpt
    ao = np.ones(N)
    for dist_s, wt in ((0.004, 0.25), (0.010, 0.25), (0.024, 0.28), (0.050, 0.30)):
        Pq = v + nrm * dist_s
        dd = np.minimum(S.eval_chunked(Pq, skip_disp=True), Pq[:, 1] * 1.0 + 0.004)
        ao -= wt * (1 - np.clip(dd / dist_s, 0, 1))
    ao = np.clip(ao, 0.0, 1.0)
    sss = np.zeros(N)
    return dict(W=W, col=col, col2=col2, gloss=gloss, gloss2=gloss2, amix=amix, scale=scale_amt, ao=ao, sss=sss)


# ---------------------------------------------------------------- explicit thin parts

def catmull(pts, n):
    pts = [np.asarray(p, F) for p in pts]
    P = [pts[0] * 2 - pts[1]] + pts + [pts[-1] * 2 - pts[-2]]
    out = []
    segs = len(pts) - 1
    for i in range(n):
        x = i / (n - 1) * segs
        k = min(int(x), segs - 1)
        t = x - k
        p0, p1, p2, p3 = P[k], P[k + 1], P[k + 2], P[k + 3]
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    return np.array(out)


def sweep(pts, radii, rings=18, sides=10):
    """A tapered tube along a smooth curve. Returns verts, normals, faces, t(0..1)."""
    c = catmull(pts, rings)
    rr = np.interp(np.linspace(0, 1, rings), np.linspace(0, 1, len(radii)), radii)
    tan = np.gradient(c, axis=0)
    tan /= np.linalg.norm(tan, axis=1, keepdims=True)
    ref = V(0, 0, 1) if abs(tan[0] @ V(0, 0, 1)) < 0.9 else V(1, 0, 0)
    nx = np.cross(tan[0], ref)
    nx /= np.linalg.norm(nx)
    vs, ns, ts = [], [], []
    for i in range(rings):
        nx = nx - tan[i] * (nx @ tan[i])
        nx /= np.linalg.norm(nx)
        ny = np.cross(tan[i], nx)
        for j in range(sides):
            a = 2 * np.pi * j / sides
            d = np.cos(a) * nx + np.sin(a) * ny
            vs.append(c[i] + d * rr[i])
            ns.append(d)
            ts.append(i / (rings - 1))
    fs = []
    for i in range(rings - 1):
        for j in range(sides):
            a, b = i * sides + j, i * sides + (j + 1) % sides
            c2, d2 = a + sides, b + sides
            fs += [(a, c2, b), (b, c2, d2)]
    # caps
    for end, idx in ((0, 0), (1, rings - 1)):
        vs.append(c[idx] + tan[idx] * rr[idx] * (0.7 if end else -0.7))
        ns.append(tan[idx] * (1 if end else -1))
        ts.append(float(end))
        ci = len(vs) - 1
        for j in range(sides):
            a, b = idx * sides + j, idx * sides + (j + 1) % sides
            fs.append((ci, a, b) if end else (ci, b, a))
    vs, ns, fs = np.array(vs), np.array(ns), np.array(fs)
    # make sure triangles face outward
    a, b, cc = vs[fs[:, 0]], vs[fs[:, 1]], vs[fs[:, 2]]
    fn = np.cross(b - a, cc - a)
    flip = (fn * (ns[fs[:, 0]] + ns[fs[:, 1]] + ns[fs[:, 2]])).sum(1) < 0
    fs[flip] = fs[flip][:, ::-1]
    return vs, ns, fs, np.array(ts)


class Bag:
    """Collects mesh pieces that share one material."""

    def __init__(self):
        self.v, self.n, self.f, self.w, self.extra = [], [], [], [], {}
        self.count = 0

    def add(self, v, n, f, w, **extra):
        self.v.append(v)
        self.n.append(n)
        self.f.append(np.asarray(f) + self.count)
        self.w.append(w)
        for k, a in extra.items():
            self.extra.setdefault(k, []).append(np.asarray(a))
        self.count += len(v)

    def done(self):
        out = dict(v=np.concatenate(self.v), n=np.concatenate(self.n), f=np.concatenate(self.f), W=np.concatenate(self.w))
        for k, a in self.extra.items():
            out[k] = np.concatenate(a)
        return out


def wts(n, pairs):
    """pairs: list of (bone, weights array or scalar)."""
    W = np.zeros((n, len(ORDER)), np.float32)
    for b, w in pairs:
        W[:, BI[b]] += w
    W /= np.maximum(W.sum(1, keepdims=True), 1e-9)
    return W


def patch(railA, railB, boneA, boneB, nu=14, nv=12, scallop=0.2, billow=0.012, normal_hint=None):
    """Membrane stretched between two rails that start at the same point."""
    A = catmull(railA, 40)
    Bc = catmull(railB, 40)

    def at(curve, u):
        x = np.clip(u, 0, 1) * (len(curve) - 1)
        i = np.minimum(x.astype(int), len(curve) - 2)
        t = (x - i)[:, None]
        return curve[i] * (1 - t) + curve[i + 1] * t
    us = np.linspace(0, 1, nu)
    vs_ = np.linspace(0, 1, nv)
    U, Vv = np.meshgrid(us, vs_, indexing='ij')
    U, Vv = U.ravel(), Vv.ravel()
    u2 = U * (1 - scallop * np.sin(np.pi * Vv) ** 0.85 * U ** 1.5)
    P = at(A, u2) * (1 - Vv[:, None]) + at(Bc, u2) * Vv[:, None]
    nh = np.cross(A[-1] - A[0], Bc[-1] - A[0])
    nh /= np.linalg.norm(nh)
    if normal_hint is not None and nh @ normal_hint < 0:
        nh = -nh
    P = P + nh[None, :] * (billow * np.sin(np.pi * Vv) * np.sin(np.pi * np.clip(U, 0, 1) ** 0.8))[:, None]
    fs = []
    for i in range(nu - 1):
        for j in range(nv - 1):
            a, b, c, d = i * nv + j, i * nv + j + 1, (i + 1) * nv + j, (i + 1) * nv + j + 1
            fs += [(a, c, b), (b, c, d)]
    fs = np.array(fs)
    # normals
    nrm = np.zeros_like(P)
    fn = np.cross(P[fs[:, 1]] - P[fs[:, 0]], P[fs[:, 2]] - P[fs[:, 0]])
    for k in range(3):
        np.add.at(nrm, fs[:, k], fn)
    nrm /= np.maximum(np.linalg.norm(nrm, axis=1, keepdims=True), 1e-12)
    if (nrm @ nh).mean() < 0:
        fs = fs[:, ::-1]
        nrm = -nrm
    W = np.zeros((len(P), len(ORDER)), np.float32)
    for bone_fn, wv in ((boneA, 1 - Vv), (boneB, Vv)):
        for b, w in bone_fn(u2):
            W[:, BI[b]] += w * wv
    W /= W.sum(1, keepdims=True)
    return P, nrm, fs, W, np.stack([U, Vv], 1)


def build_thin_parts():
    tubes = Bag()      # goes into the body material
    memb = Bag()
    for s, sx in (('L', 1), ('R', -1)):
        m = (lambda p: p) if sx > 0 else mx
        # ---------- wing
        sh, wr, f1m, t1, t2, t3, bd = [m(WING[k]) for k in ('sh', 'wr', 'f1m', 't1', 't2', 't3', 'bd')]
        wn = 'wing' + s
        f2m = (wr + t2) / 2 + m(V(0.022, 0.012, 0.004))
        f3m = (wr + t3) / 2 + m(V(0.022, -0.004, 0.004))

        def tube(pts, radii, bones, rings=16, sides=10, color=C_SKIN, gloss=0.4):
            v, n, f, t = sweep(pts, radii, rings, sides)
            W = np.zeros((len(v), len(ORDER)), np.float32)
            for b, fn in bones:
                W[:, BI[b]] += fn(t)
            W /= W.sum(1, keepdims=True)
            k = len(v)
            tubes.add(v, n, f, W, col=np.broadcast_to(color, (k, 3)), col2=np.zeros((k, 3)), amix=np.full(k, -6.0),
                      gloss=np.full(k, gloss), gloss2=np.zeros(k), scale=np.full(k, 0.6), ao=np.full(k, 0.95), sss=np.zeros(k))
        one = lambda t: np.ones_like(t)
        tube([sh - m(V(0.03, 0.03, 0)), sh, (sh + wr) / 2 + V(0, 0.012, 0), wr], [0.021, 0.019, 0.015, 0.0125],
             [('chest', lambda t: smoothstep(0.45, 0.15, t)), (wn, lambda t: smoothstep(0.15, 0.45, t))])
        tube([wr, f1m, t1], [0.012, 0.0085, 0.0028],
             [(wn + '_f1a', lambda t: smoothstep(0.62, 0.42, t)), (wn + '_f1b', lambda t: smoothstep(0.42, 0.62, t))], rings=20)
        tube([wr, f2m, t2], [0.0105, 0.0075, 0.0026], [(wn + '_f2', one)], rings=18)
        tube([wr, f3m, t3], [0.0105, 0.0075, 0.0026], [(wn + '_f3', one)], rings=18)
        # wrist knob and thumb claw
        tube([wr + V(0, 0.004, 0.004), wr + m(V(0.006, 0.024, 0.020)), wr + m(V(0.014, 0.034, 0.040))], [0.0105, 0.0075, 0.0018],
             [(wn, one)], rings=8, color=C_CLAW, gloss=0.9)
        back = V(0, 0, -1)
        f1 = lambda u: [(wn + '_f1a', smoothstep(0.62, 0.42, u)), (wn + '_f1b', smoothstep(0.42, 0.62, u))]
        f2 = lambda u: [(wn + '_f2', np.ones_like(u))]
        f3 = lambda u: [(wn + '_f3', np.ones_like(u))]
        inner = lambda u: [(wn, smoothstep(0.75, 0.35, u)), ('chest', smoothstep(0.35, 0.75, u) * 0.6),
                           ('spine', smoothstep(0.35, 0.75, u) * 0.4)]
        for railA, railB, bA, bB, sc in (([wr, f1m, t1], [wr, f2m, t2], f1, f2, 0.22),
                                         ([wr, f2m, t2], [wr, f3m, t3], f2, f3, 0.24),
                                         ([wr, f3m, t3], [wr, (wr + sh) / 2, sh, (sh + bd) / 2 + m(V(0.01, 0, 0)), bd], f3, inner, 0.26)):
            P, n, f, W, uv = patch(railA, railB, bA, bB, scallop=sc, billow=0.013, normal_hint=back)
            memb.add(P, n, f, W, uv=uv, kind=np.zeros(len(P)))
        # ---------- ear frill
        eb = m(EAR_BASE)
        en = 'ear' + s
        tips = {k: m(EAR_TIPS[k]) for k in 'tmb'}
        mids = {}
        bow = {'t': V(0.010, 0.022, 0.018), 'm': V(0.016, 0.0, 0.020), 'b': V(0.010, -0.020, 0.012)}
        for k in 'tmb':
            mids[k] = (eb + tips[k]) / 2 + m(bow[k])
            tube([eb - m(V(0.02, 0, -0.012)), eb, mids[k], tips[k]], [0.013, 0.012, 0.0085, 0.0034],
                 [('head', lambda t: smoothstep(0.3, 0.1, t)), (en + '_' + k, lambda t: smoothstep(0.1, 0.3, t))], rings=18)
        for ka, kb in (('t', 'm'), ('m', 'b')):
            bA = lambda u, ka=ka: [('head', smoothstep(0.2, 0.0, u)), (en + '_' + ka, smoothstep(0.0, 0.2, u))]
            bB = lambda u, kb=kb: [('head', smoothstep(0.2, 0.0, u)), (en + '_' + kb, smoothstep(0.0, 0.2, u))]
            P, n, f, W, uv = patch([eb, mids[ka], tips[ka]], [eb, mids[kb], tips[kb]], bA, bB, nu=12, nv=10, scallop=0.2,
                                   billow=0.008, normal_hint=V(0, 0, -1))
            memb.add(P, n, f, W, uv=uv, kind=np.ones(len(P)))
    # ---------- teeth: small ivory cones along both jaws, with a pair of longer fangs
    def tooth(base, tip, r, bone):
        sides = 8
        ax = tip - base
        L = np.linalg.norm(ax)
        ax = ax / L
        ref = V(1, 0, 0) if abs(ax[0]) < 0.9 else V(0, 0, 1)
        nx = np.cross(ax, ref); nx /= np.linalg.norm(nx)
        ny = np.cross(ax, nx)
        vs, ns, fs = [], [], []
        rings = [(0.0, 1.0), (0.45, 0.82), (0.8, 0.45), (1.0, 0.08)]
        for t, rr in rings:
            for j in range(sides):
                a = 2 * np.pi * j / sides
                d = np.cos(a) * nx + np.sin(a) * ny
                vs.append(base + ax * L * t + d * r * rr)
                n = d + ax * 0.35
                ns.append(n / np.linalg.norm(n))
        for i in range(len(rings) - 1):
            for j in range(sides):
                a, b = i * sides + j, i * sides + (j + 1) % sides
                fs += [(a, b, a + sides), (b, b + sides, a + sides)]
        vs.append(tip); ns.append(ax); ci = len(vs) - 1
        for j in range(sides):
            fs.append(((len(rings) - 1) * sides + j, (len(rings) - 1) * sides + (j + 1) % sides, ci))
        vs, ns, fs = np.array(vs), np.array(ns), np.array(fs)
        a, b, c = vs[fs[:, 0]], vs[fs[:, 1]], vs[fs[:, 2]]
        if ((np.cross(b - a, c - a)) * (ns[fs[:, 0]])).sum() < 0:
            fs = fs[:, ::-1]
        k = len(vs)
        ivory = srgb('#f4f1e4')
        tubes.add(vs, ns, fs, wts(k, [(bone, 1.0)]), col=np.broadcast_to(ivory, (k, 3)), col2=np.zeros((k, 3)), amix=np.full(k, -6.0),
                  gloss=np.full(k, 0.9), gloss2=np.zeros(k), scale=np.zeros(k), ao=np.full(k, 0.85), sss=np.zeros(k))

    def gum(x, z, upper):
        q = 1 - (x / MOUTH_R[0]) ** 2 - ((z - MOUTH_C[2]) / MOUTH_R[2]) ** 2
        h = MOUTH_R[1] * np.sqrt(max(q, 0.0))
        return MOUTH_C[1] + (h if upper else -h) + 4.4 * x * x - 0.10 * (z - 0.35)
    for upper in (True, False):
        n = 11 if upper else 10
        for i in range(n):
            a = np.radians(-78 + 156 * (i + (0.0 if upper else 0.5)) / (n - 1 + (0 if upper else 1)))
            rx, rz = (0.0405, 0.054) if upper else (0.0350, 0.046)
            x, z = rx * np.sin(a), (0.337 if upper else 0.300) + rz * np.cos(a)
            y = gum(x, z, upper)
            fang = upper and i in (3, 7)
            ln = (0.0160 if fang else 0.0090) if upper else 0.0070
            rad = 0.0042 if fang else 0.0032
            ln *= 0.75 + 0.25 * np.cos(a)       # back teeth are smaller
            base = V(x, y + (0.003 if upper else -0.003), z)
            tip = V(x * 0.97, y + (-ln if upper else ln), z - 0.001)
            tooth(base, tip, rad, 'head' if upper else 'jaw')
    return tubes.done(), memb.done()


def build_eyes():
    out = {}
    for s in 'LR':
        e = EYES[s]
        nu, nv = 40, 16
        vs, ns, uvs, fs = [], [], [], []
        for i in range(nv + 1):
            th = (i / nv) * np.radians(84)
            for j in range(nu):
                ph = 2 * np.pi * j / nu
                q = V(np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th))
                vs.append(e['center'] + e['R'] @ (q * e['radii']))
                nq = q / e['radii']
                ns.append(e['R'] @ (nq / np.linalg.norm(nq)))
                uvs.append((q[0], q[1]))
        for i in range(nv):
            for j in range(nu):
                a, b = i * nu + j, i * nu + (j + 1) % nu
                c, d = a + nu, b + nu
                fs += [(a, c, b), (b, c, d)]
        vs, ns, fs = np.array(vs), np.array(ns), np.array(fs)
        a, b, c = vs[fs[:, 0]], vs[fs[:, 1]], vs[fs[:, 2]]
        if (np.cross(b - a, c - a) @ e['axis']).mean() < 0:
            fs = fs[:, ::-1]
        out[s] = dict(v=vs, n=ns, f=fs, uv=np.array(uvs), W=wts(len(vs), [('head', 1.0)]))
    return out


def build_droplet():
    base = V(*TAIL_TIP) + V(0, -0.016, 0)
    H = 0.152
    nu, nv = 36, 30
    vs, ns, fs = [], [], []
    prof = []
    for i in range(nv + 1):
        th = np.pi * i / nv
        r = 0.0775 * np.sin(th) * np.sin(th / 2) ** 1.35
        y = H * (1 + np.cos(th)) / 2
        prof.append((r, y))
    prof = np.array(prof)
    dr = np.gradient(prof[:, 0])
    dy = np.gradient(prof[:, 1])
    for i in range(nv + 1):
        r, y = prof[i]
        nn = V(-dy[i], dr[i])  # outward normal in (r, y)
        nn /= np.linalg.norm(nn) + 1e-12
        lean = 0.012 * (y / H) ** 2   # the tip leans forward a touch
        for j in range(nu):
            a = 2 * np.pi * j / nu
            vs.append(base + V(r * np.cos(a), y, r * np.sin(a) + lean))
            ns.append(V(nn[0] * np.cos(a), nn[1], nn[0] * np.sin(a)) if r > 1e-6 else V(0, 1 if i == 0 else -1, 0))
    for i in range(nv):
        for j in range(nu):
            a, b = i * nu + j, i * nu + (j + 1) % nu
            c, d = a + nu, b + nu
            fs += [(a, b, c), (b, d, c)]
    vs, ns, fs = np.array(vs), np.array(ns), np.array(fs)
    ns /= np.maximum(np.linalg.norm(ns, axis=1, keepdims=True), 1e-9)
    cen = vs.mean(0)
    a, b, c = vs[fs[:, 0]], vs[fs[:, 1]], vs[fs[:, 2]]
    fn = np.cross(b - a, c - a)
    if ((a - cen) * fn).sum() < 0:
        fs = fs[:, ::-1]
    if ((vs - cen) * ns).sum() < 0:
        ns = -ns
    return dict(v=vs, n=ns, f=fs, W=wts(len(vs), [('drop', 1.0)]), center=base + V(0, H * 0.38, 0), height=H)


# ---------------------------------------------------------------- export

def top4(W):
    idx = np.argsort(-W, axis=1)[:, :4]
    w = np.take_along_axis(W, idx, 1).astype(np.float32)
    w /= w.sum(1, keepdims=True)
    idx = np.where(w > 0, idx, 0)
    return idx.astype(np.uint8), w


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--h', type=float, default=0.002)
    ap.add_argument('--tris', type=int, default=130000)
    ap.add_argument('--out', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'model', 'drizzlon.glb'))
    a = ap.parse_args()
    os.makedirs(os.path.dirname(a.out), exist_ok=True)

    v, nrm, f = build_body(a.h, a.tris)
    log('painting and weighting the body')
    at = body_attributes(v, nrm, f)
    tubes, memb = build_thin_parts()
    eyes = build_eyes()
    drop = build_droplet()

    # merge tubes into the body mesh
    nb = len(v)
    bv = np.concatenate([v, tubes['v']])
    bn = np.concatenate([nrm, tubes['n']])
    bf = np.concatenate([f, tubes['f'] + nb])
    cat = lambda k: np.concatenate([at[k], tubes[k]])
    Wb = np.concatenate([at['W'], tubes['W']])
    j4, w4 = top4(Wb)

    g = GLB()
    joints = [(n, -1 if J[n][0] is None else BI[J[n][0]], J[n][1], None) for n in ORDER]
    skin = g.skeleton(joints)
    f32 = lambda x: np.asarray(x, np.float32)
    u8 = lambda x: np.clip(np.round(np.asarray(x) * 255), 0, 255).astype(np.uint8)

    def n16(n):  # normals as 16-bit, padded to 4 components
        n = np.asarray(n)
        out = np.zeros((len(n), 4), np.int16)
        out[:, :3] = np.clip(np.round(n * 32767), -32767, 32767)
        return out

    def w8(w):   # weights as bytes that still add up to exactly 255
        q = np.floor(w * 255).astype(np.int32)
        q[np.arange(len(q)), np.argmax(q, 1)] += 255 - q.sum(1)
        return q.astype(np.uint8)
    lin2srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, 1) ** (1 / 2.4) - 0.055)
    m_body = g.material('skin', color=[0.03, 0.2, 0.8, 1], rough=0.5)
    # colours travel as sRGB bytes (finer steps in the darks); the skin shader converts them back
    g.mesh('body', {
        'POSITION': f32(bv), 'NORMAL': n16(bn),
        '_COLOR1': u8(np.concatenate([lin2srgb(cat('col')), cat('ao')[:, None]], 1)),
        '_COLOR2': u8(np.concatenate([lin2srgb(cat('col2')), cat('gloss2')[:, None]], 1)),
        '_SURF': u8(np.stack([(cat('amix') + 6) / 12, cat('scale'), cat('gloss'), cat('sss')], 1)),
        'JOINTS_0': j4, 'WEIGHTS_0': w8(w4)}, bf, m_body, skin)
    j4, w4 = top4(memb['W'])
    m_mem = g.material('membrane', color=[float(x) for x in C_MEMBRANE] + [1], rough=0.45, double=True)
    g.mesh('membrane', {'POSITION': f32(memb['v']), 'NORMAL': n16(memb['n']), 'TEXCOORD_0': f32(memb['uv']),
                        '_KIND': f32(memb['kind']), 'JOINTS_0': j4, 'WEIGHTS_0': w8(w4)}, memb['f'], m_mem, skin)
    m_eye = g.material('eye', color=[1, 1, 1, 1], rough=0.1)
    for s in 'LR':
        e = eyes[s]
        j4, w4 = top4(e['W'])
        g.mesh('eye' + s, {'POSITION': f32(e['v']), 'NORMAL': n16(e['n']), 'TEXCOORD_0': f32(e['uv']), 'JOINTS_0': j4, 'WEIGHTS_0': w8(w4)},
               e['f'], m_eye, skin)
    j4, w4 = top4(drop['W'])
    m_drop = g.material('water', color=[0.15, 0.55, 1.0, 0.85], rough=0.05, blend=True)
    g.mesh('droplet', {'POSITION': f32(drop['v']), 'NORMAL': n16(drop['n']), 'JOINTS_0': j4, 'WEIGHTS_0': w8(w4)}, drop['f'], m_drop, skin)

    extras = {
        'eyes': {s: {'center': EYES[s]['center'].tolist(), 'surf': EYES[s]['surf'].tolist(), 'axis': EYES[s]['axis'].tolist(), 'up': EYES[s]['up'].tolist(),
                     'right': EYES[s]['right'].tolist(), 'radii': EYES[s]['radii'].tolist()} for s in 'LR'},
        'mouth': [0, 0.432, 0.365],
        'dropCenter': drop['center'].tolist(), 'dropHeight': drop['height'],
        'tailRadii': TAIL_R,
        'tris': {'body': int(len(bf)), 'membrane': int(len(memb['f'])), 'eyes': int(len(eyes['L']['f']) * 2), 'droplet': int(len(drop['f']))},
    }
    size = g.save(a.out, extras)
    log('wrote', a.out, '%.2f MB' % (size / 1e6), json.dumps(extras['tris']))


if __name__ == '__main__':
    main()
