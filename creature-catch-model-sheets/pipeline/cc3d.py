"""Shared helpers for the Creature Catch paint-and-bake tools.

World frame (metres, Blender convention): the creature faces -Y, +X is the creature's
left, +Z is up, the ground is z = 0, x = 0 is the centre line, y = 0 is the middle of
its length.

Views and how a picture pixel (u, v) maps to the world:
  front  camera at -Y looking +Y   image right = +X   x = (u - uc) / s,  z = (vg - v) / s
  back   camera at +Y looking -Y   image right = -X   x = -(u - uc) / s, z = (vg - v) / s
  side   camera at +X looking -X   image right = +Y   y = (u - uc) / s,  z = (vg - v) / s
         (the creature faces LEFT, so this shows its left (+X) side)
  top    camera at +Z looking down head at the top    x = -(u - uc) / sx, y = (v - vc) / sy
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw

BG_EXACT = (200, 200, 202)  # the method's background grey (#C8C8CA)

# Which world axes each view shows, as (axis along u, axis along v)
VIEW_AXES = {"front": ("x", "z"), "back": ("x", "z"), "side": ("y", "z"), "top": ("x", "y")}
# Direction from the creature toward each camera
VIEW_DIR = {
    "front": (0.0, -1.0, 0.0),
    "back": (0.0, 1.0, 0.0),
    "side": (1.0, 0.0, 0.0),   # the +X side; the -X side reuses the side picture mirrored
    "top": (0.0, 0.0, 1.0),
}


def load_rgb(path):
    return np.asarray(Image.open(path).convert("RGB"))


def silhouette(a, thresh=18):
    """Mask of the creature: pixels that differ from the border background colour."""
    from scipy import ndimage

    a = a.astype(np.int32)
    border = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3),
                             a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    m = np.abs(a - bg).max(axis=2) > thresh
    m = ndimage.binary_opening(m, iterations=1)
    lab, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        keep = [i + 1 for i, s in enumerate(sizes) if s >= 0.02 * sizes.max()]
        m = np.isin(lab, keep)
    m = ndimage.binary_fill_holes(m)
    return m, bg


class Views:
    """Loads views.json and converts between picture pixels and metres."""

    def __init__(self, path):
        self.path = path
        self.dir = os.path.dirname(os.path.abspath(path))
        with open(path) as f:
            self.d = json.load(f)
        self.H = self.d["H"]
        self._img = {}
        self._mask = {}

    def v(self, name):
        return self.d["views"][name]

    def names(self):
        return list(self.d["views"].keys())

    def image(self, name):
        if name not in self._img:
            self._img[name] = load_rgb(os.path.join(self.dir, self.v(name)["file"]))
        return self._img[name]

    def mask(self, name):
        if name not in self._mask:
            self._mask[name] = np.asarray(Image.open(os.path.join(self.dir, self.v(name)["mask"]))) > 127
        return self._mask[name]

    # pixel -> world (the two axes the view shows)
    def px_to_world(self, name, u, v):
        d = self.v(name)
        u = np.asarray(u, dtype=np.float64)
        v = np.asarray(v, dtype=np.float64)
        if name == "front":
            return (u - d["uc"]) / d["s"], (d["vg"] - v) / d["s"]
        if name == "back":
            return -(u - d["uc"]) / d["s"], (d["vg"] - v) / d["s"]
        if name == "side":
            return (u - d["uc"]) / d["s"], (d["vg"] - v) / d["s"]
        if name == "top":
            return -(u - d["uc"]) / d["sx"], (v - d["vc"]) / d["sy"]
        raise KeyError(name)

    # world -> pixel. p is an (..., 3) array of x, y, z
    def world_to_px(self, name, p):
        d = self.v(name)
        x, y, z = p[..., 0], p[..., 1], p[..., 2]
        if name == "front":
            return d["uc"] + x * d["s"], d["vg"] - z * d["s"]
        if name == "back":
            return d["uc"] - x * d["s"], d["vg"] - z * d["s"]
        if name == "side":
            return d["uc"] + y * d["s"], d["vg"] - z * d["s"]
        if name == "top":
            return d["uc"] - x * d["sx"], d["vc"] + y * d["sy"]
        raise KeyError(name)

    def px_per_m(self, name):
        d = self.v(name)
        if name == "top":
            return d["sx"], d["sy"]
        return d["s"], d["s"]


def poly_mask(shape, poly):
    """Rasterise a polygon given in picture pixels into a boolean mask."""
    im = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(im).polygon([tuple(map(float, p)) for p in poly], fill=255)
    return np.asarray(im) > 127
