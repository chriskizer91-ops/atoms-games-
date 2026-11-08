"""Build the model from the traced parts (runs inside Blender's Python module).

usage: python3 -I build.py parts.json views.json OUT.blend --target TRIS [--atlas atlas.json]
                           [--grid grid.npz] [--glb out.glb] [--relief relief.npz]

--target   total triangles (blockout ~ 60000, big model 700000, small model 6000)
--atlas    texture layout shared by the big and small models (made if missing)
--grid     save every part's ring grid (used by the printing step)
--relief   displace the big model's surface with a relief map made from the printed paint
"""
import json
import math
import os
import sys
import time

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(1, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "pipeline"))
from parts import instances, load_parts, mesh_arrays, plan_resolution  # noqa: E402


def arg(flag, default=None):
    if flag in sys.argv:
        return sys.argv[sys.argv.index(flag) + 1]
    return default


def meridian(P, ps, pe):
    """Cumulative length along the part (pole -> rings -> pole), per ring."""
    cen = P.mean(axis=1)
    rad = np.linalg.norm(P - cen[:, None], axis=2).mean(axis=1)
    s = [rad[0]]
    for i in range(1, len(P)):
        s.append(s[-1] + math.hypot(np.linalg.norm(cen[i] - cen[i - 1]), rad[i] - rad[i - 1]))
    total = s[-1] + rad[-1]
    return np.array(s), total


def make_atlas(parts, path, size=2048, gutter=6):
    """Shelf-pack one rectangle per part instance, sized by its surface (metres)."""
    rects = []
    for nm, p, mir in instances(parts):
        P, ps, pe = p.grid(96, 64, mir)
        _, total = meridian(P, ps, pe)
        circ, _ = p.mean_circ()
        rects.append((nm, circ, total))

    def pack(scale):
        x = y = gutter
        shelf_h = 0
        out = {}
        for nm, w, h in sorted(rects, key=lambda r: -r[2]):
            pw, ph = int(math.ceil(w * scale)), int(math.ceil(h * scale))
            if x + pw + gutter > size:
                x = gutter
                y += shelf_h + gutter
                shelf_h = 0
            if pw + 2 * gutter > size:
                return None
            out[nm] = (x, y, x + pw, y + ph)
            x += pw + gutter
            shelf_h = max(shelf_h, ph)
        if y + shelf_h + gutter > size:
            return None
        return out

    lo, hi = 1.0, 5000.0
    for _ in range(50):
        mid = (lo + hi) / 2
        if pack(mid):
            lo = mid
        else:
            hi = mid
    px = pack(lo)
    atlas = {"size": size, "texels_per_m": lo, "rects": {nm: [r[0] / size, r[1] / size, r[2] / size, r[3] / size] for nm, r in px.items()}}
    with open(path, "w") as f:
        json.dump(atlas, f, indent=1)
    return atlas


def main():
    import bpy

    parts_path, views_path, out_blend = sys.argv[1:4]
    target = int(arg("--target", "60000"))
    atlas_path = arg("--atlas")
    grid_path = arg("--grid")
    glb_path = arg("--glb")
    relief_path = arg("--relief")
    t0 = time.time()
    pd, parts, vw = load_parts(parts_path, views_path)
    atlas = None
    if atlas_path:
        if os.path.exists(atlas_path):
            with open(atlas_path) as f:
                atlas = json.load(f)
        else:
            atlas = make_atlas(parts, atlas_path)
    edge, total, plan = plan_resolution(parts, target, min_k=10 if target < 20000 else 16, min_n=3)
    relief = dict(np.load(relief_path)) if relief_path else None

    bpy.ops.wm.read_factory_settings(use_empty=True)
    mat = bpy.data.materials.new("clay")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.55, 0.55, 0.56, 1)
    bsdf.inputs["Roughness"].default_value = 0.8
    grids = {}
    tri_total = 0
    for nm, p, mir, N, K in plan:
        P, ps, pe = p.grid(N, K, mir)
        s, tot = meridian(P, ps, pe)
        rect = atlas["rects"][nm] if atlas else (0, 0, 1, 1)
        V, T, UV, _ = mesh_arrays(P, ps, pe, rect)
        # even texture density along the part: ring v from meridian length
        u0, v0, u1, v1 = rect
        vr = v0 + (s / tot) * (v1 - v0)
        nring = N * (K + 1)
        UV[:nring, 1] = np.repeat(vr, K + 1)
        if relief is not None and nm in relief:
            # displace ring vertices along their normals by the relief height (metres)
            h = relief[nm]  # (N, K) heights on this grid
            Pn = P + h[..., None] * ring_normals(P)
            V[:nring] = np.concatenate([Pn, Pn[:, :1]], axis=1).reshape(-1, 3)
            P = Pn
        grids[nm] = dict(P=P, ps=ps, pe=pe, vr=vr, rect=np.array(rect), axis=p.axis)
        me = bpy.data.meshes.new(nm)
        me.vertices.add(len(V))
        me.vertices.foreach_set("co", V.astype(np.float32).ravel())
        nt = len(T)
        me.loops.add(nt * 3)
        me.loops.foreach_set("vertex_index", T.astype(np.int32).ravel())
        me.polygons.add(nt)
        me.polygons.foreach_set("loop_start", np.arange(0, nt * 3, 3, dtype=np.int32))
        me.polygons.foreach_set("loop_total", np.full(nt, 3, dtype=np.int32))
        uvl = me.uv_layers.new(name="UVMap")
        uvl.data.foreach_set("uv", UV[T].astype(np.float32).ravel())
        me.update(calc_edges=True)
        me.validate(clean_customdata=False)
        me.polygons.foreach_set("use_smooth", np.ones(nt, dtype=bool))
        ob = bpy.data.objects.new(nm, me)
        ob["part"] = p.name
        ob["joint"] = p.joint
        ob["mirror"] = bool(mir)
        me.materials.append(mat)
        bpy.context.scene.collection.objects.link(ob)
        tri_total += nt
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(out_blend))
    if grid_path:
        flat = {}
        for nm, g in grids.items():
            for k, v in g.items():
                flat[f"{nm}|{k}"] = v
        np.savez_compressed(grid_path, **flat)
    if glb_path:
        bpy.ops.export_scene.gltf(filepath=os.path.abspath(glb_path), export_format="GLB")
    print(f"built {len(plan)} parts, {tri_total} triangles (target {target}), edge {edge * 100:.2f} cm, {time.time() - t0:.1f} s")
    for nm, p, mir, N, K in plan:
        print(f"  {nm:18s} N {N:4d} K {K:4d} tris {2 * N * K}")


def ring_normals(P):
    """Outward-ish normals of a ring grid (N, K, 3) from finite differences."""
    du = np.roll(P, -1, axis=1) - np.roll(P, 1, axis=1)
    dv = np.zeros_like(P)
    dv[1:-1] = P[2:] - P[:-2]
    dv[0] = P[1] - P[0]
    dv[-1] = P[-1] - P[-2]
    n = np.cross(du, dv)
    # make it point away from the ring centre
    cen = P.mean(axis=1, keepdims=True)
    out = P - cen
    flip = np.sign(np.einsum("ijk,ijk->ij", n, out))
    flip[flip == 0] = 1
    n *= flip[..., None]
    n /= np.maximum(np.linalg.norm(n, axis=2, keepdims=True), 1e-12)
    return n


if __name__ == "__main__":
    main()
