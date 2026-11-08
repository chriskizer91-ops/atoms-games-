"""Rig and animate any creature from its traced parts (Blender). The animation system's main tool.

usage: python3 -I animate.py model.blend rig.json OUT.glb [--albedo a.jpg] [--normal n.png] [--emit e.jpg]
                             [--no-materials] [--preview DIR] [--manifest OUT.json]

model.blend  the creature's game model with its parts as separate objects (build.py / route_small.sh)
rig.json     {"plan": "quad" | "round", "wings": true|false, "roles": {"<part>": "<role>"}}  (roles optional)

1. Every part gets a role from its name (legs, head, tail, wing, arm...), or from rig.json.
2. The body type's skeleton is fitted to where those parts actually are.
3. Each part is tied to its bones (legs blend at the knee, tails and wings along their length).
4. Every clip in motions.py is keyed in, scaled to the creature's size.
5. The model is exported with its skeleton and clips, plus a manifest (anchors for effects:
   mouth, chest, paws, wing tips; the clip list; the size).
"""
import json
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import motions  # noqa: E402

FPS = 30
ROLE_WORDS = [  # first match wins
    ("wing", "wing"), ("droplet", "tail"), ("tail", "tail"),
    ("front_leg", "leg_front"), ("fleg", "leg_front"), ("rear_leg", "leg_rear"), ("rleg", "leg_rear"),
    ("foot", "foot"), ("arm", "arm"), ("neck", "neck"), ("mane", "chest"), ("ruff", "chest"),
    ("head", "head"), ("muzzle", "head"), ("snout", "head"), ("ear", "head"), ("horn", "head"),
    ("tuft", "head"), ("cap", "head"), ("crest", "head"),
    ("vent", "back"), ("crag", "back"), ("ridge", "back"), ("spine", "back"),
    ("torso", "body"), ("body", "body"),
]


def arg(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def verts(ob):
    co = np.zeros(len(ob.data.vertices) * 3)
    ob.data.vertices.foreach_get("co", co)
    return co.reshape(-1, 3)


def base_name(n):
    return n[:-2] if n.endswith(("_L", "_R")) else n


def role_of(name, roles):
    b = base_name(name)
    if b in roles:
        return roles[b]
    for word, role in ROLE_WORDS:
        if word in b.lower():
            return role
    return "body"


def side_of(name, v):
    if name.endswith("_L"):
        return "L"
    if name.endswith("_R"):
        return "R"
    return "L" if np.median(v[:, 0]) >= 0 else "R"


def chain_points(v, start, n=3):
    """Polyline through a part's verts from the end nearest `start`, split into n equal segments."""
    d0 = np.linalg.norm(v - start, axis=1)
    base = v[d0 <= np.percentile(d0, 6)].mean(axis=0)
    tip_d = np.linalg.norm(v - base, axis=1)
    tip = v[tip_d >= np.percentile(tip_d, 94)].mean(axis=0)
    # centroids of slices along the base->tip distance
    t = tip_d / max(tip_d.max(), 1e-6)
    pts = [base]
    for k in range(1, n):
        m = np.abs(t - k / n) < 0.08
        pts.append(v[m].mean(axis=0) if m.sum() > 3 else base + (tip - base) * k / n)
    pts.append(tip)
    return np.array(pts)


def seg_weights(v, pts, sharp=0.35):
    """Soft weights of verts to each segment of a polyline (nearest segments win)."""
    d = []
    for a, b in zip(pts[:-1], pts[1:]):
        ab = b - a
        t = np.clip(((v - a) @ ab) / max(ab @ ab, 1e-9), 0, 1)
        d.append(np.linalg.norm(v - (a + t[:, None] * ab), axis=1))
    d = np.stack(d, 1)
    seg = np.mean([np.linalg.norm(b - a) for a, b in zip(pts[:-1], pts[1:])])
    w = np.exp(-(d - d.min(axis=1, keepdims=True)) / max(sharp * seg, 1e-4))
    return w / w.sum(axis=1, keepdims=True)


# ---------------------------------------------------------------- skeleton fitting
def fit_quad(P, wings):
    """P: {role: [(name, side, verts)]}. Returns joints {bone: (head, tail, parent)}, anchors, scale."""
    J = {"root": ((0, 0, 0), (0, 0, 0.3), None)}
    legs = {}
    for role, key in (("leg_front", "fl"), ("leg_rear", "rl")):
        for name, side, v in P.get(role, []):
            top = float(v[:, 2].max())
            m = (v[:, 2] > 0.3 * top) & (v[:, 2] < 0.6 * top)
            legs[(key, side)] = (float(np.median(v[m, 0])), float(np.median(v[m, 1])), top, float(v[:, 1].min()))
    fx, fy, ftop, ftoe = legs[("fl", "L")]
    rx, ry, rtop, rtoe = legs.get(("rl", "L"), (fx, fy + 0.6 * ftop, ftop, fy))
    head_v = np.concatenate([v for n, s, v in P.get("head", []) if base_name(n) == "head"] or [v for n, s, v in P["head"]])
    hy0, hy1 = float(head_v[:, 1].min()), float(head_v[:, 1].max())
    hz0, hz1 = float(head_v[:, 2].min()), float(head_v[:, 2].max())
    hj = (0, hy1 - 0.25 * (hy1 - hy0), hz0 + 0.35 * (hz1 - hz0))
    ymid = (fy + ry) / 2
    J["hips"] = ((0, ry, 0.95 * rtop), (0, ymid, 0.97 * (rtop + ftop) / 2), "root")
    J["spine"] = ((0, ymid, 0.97 * (rtop + ftop) / 2), (0, fy, 0.97 * ftop), "hips")
    J["neck"] = ((0, fy - 0.02 * ftop, 1.0 * ftop), hj, "spine")
    J["head"] = (hj, (0, hy0, (hz0 + hz1) / 2), "neck")
    for side, sx in (("L", 1), ("R", -1)):
        for key, (lx, ly, top, toe), par in (("fl", (fx, fy, ftop, ftoe), "spine"), ("rl", (rx, ry, rtop, rtoe), "hips")):
            J[f"{key}_up_{side}"] = ((sx * lx, ly, 0.92 * top), (sx * lx, ly - 0.02 * top, 0.5 * top), par)
            J[f"{key}_low_{side}"] = ((sx * lx, ly - 0.02 * top, 0.5 * top), (sx * lx, ly - 0.03 * top, 0.15 * top), f"{key}_up_{side}")
            J[f"{key}_paw_{side}"] = ((sx * lx, ly - 0.03 * top, 0.15 * top), (sx * lx, toe + 0.1 * top, 0.06 * top), f"{key}_low_{side}")
    tails = P.get("tail", [])
    tail_pts = None
    if tails:
        tv = np.concatenate([v for n, s, v in tails])
        tail_pts = chain_points(tv, np.array(J["hips"][0]))
        par = "hips"
        for k in range(3):
            J[f"tail{k + 1}"] = (tuple(tail_pts[k]), tuple(tail_pts[k + 1]), par)
            par = f"tail{k + 1}"
    wing_fit = {}
    if wings and P.get("wing"):
        for name, side, v in P["wing"]:
            ax = np.abs(v[:, 0])
            lo, hi = np.percentile(ax, 4), np.percentile(ax, 96)
            root = v[ax <= lo + 0.06 * (hi - lo)].mean(axis=0)
            tip = v[ax >= np.percentile(ax, 92)].mean(axis=0)
            mid_m = np.abs(ax - (lo + hi) / 2) < 0.06 * (hi - lo)
            mid = v[mid_m].mean(axis=0) if mid_m.sum() > 3 else (root + tip) / 2
            wing_fit[side] = (root, mid, tip, lo, hi)
            J[f"wing_in_{side}"] = (tuple(root), tuple(mid), "spine")
            J[f"wing_out_{side}"] = (tuple(mid), tuple(tip), f"wing_in_{side}")
    body_v = np.concatenate([v for n, s, v in P.get("body", [])])
    anchors = {
        "mouth": ("head", (0, hy0 + 0.02 * ftop, hz0 + 0.3 * (hz1 - hz0))),
        "chest": ("spine", (0, float(body_v[:, 1].min()) + 0.1 * ftop, 0.9 * ftop)),
        "paw_fl_L": ("fl_paw_L", (fx, ftoe + 0.08 * ftop, 0.05 * ftop)), "paw_fl_R": ("fl_paw_R", (-fx, ftoe + 0.08 * ftop, 0.05 * ftop)),
    }
    if tail_pts is not None:
        anchors["tail_tip"] = ("tail3", tuple(tail_pts[-1]))
    for side, (root, mid, tip, lo, hi) in wing_fit.items():
        anchors[f"wing_tip_{side}"] = (f"wing_out_{side}", tuple(tip))
    fit = dict(fx=fx, fy=fy, ftop=ftop, rx=rx, ry=ry, rtop=rtop, tail_pts=tail_pts, wing_fit=wing_fit)
    return J, anchors, ftop, fit


def fit_round(P):
    J = {"root": ((0, 0, 0), (0, 0, 0.2), None)}
    bv = np.concatenate([v for n, s, v in P["body"]])
    hv = np.concatenate([v for n, s, v in P["head"]])
    yc = float(np.median(bv[:, 1]))
    bz0, bz1 = float(bv[:, 2].min()), float(bv[:, 2].max())
    J["body"] = ((0, yc, bz0), (0, yc, bz1), "root")
    hz0 = float(hv[:, 2].min())
    J["head"] = ((0, float(np.median(hv[:, 1])), hz0), (0, float(np.median(hv[:, 1])), float(hv[:, 2].max())), "body")
    arm_pts = {}
    for name, side, v in P.get("arm", []):
        back = v[v[:, 1] >= np.percentile(v[:, 1], 88)].mean(axis=0)  # shoulder: the rear end
        front = v[v[:, 1] <= np.percentile(v[:, 1], 12)].mean(axis=0)  # hand: the front end
        mid_m = np.abs(v[:, 1] - (back[1] + front[1]) / 2) < 0.08 * abs(back[1] - front[1]) + 1e-3
        mid = v[mid_m].mean(axis=0) if mid_m.sum() > 3 else (back + front) / 2
        arm_pts[side] = np.array([back, mid, front])
        J[f"arm_up_{side}"] = (tuple(back), tuple(mid), "body")
        J[f"arm_low_{side}"] = (tuple(mid), tuple(front), f"arm_up_{side}")
    for name, side, v in P.get("foot", []):
        c = v.mean(axis=0)
        top = float(v[:, 2].max())
        J[f"foot_{side}"] = ((float(c[0]), float(v[:, 1].max()), 0.6 * top), (float(c[0]), float(v[:, 1].min()), 0.4 * top), "root")
    H = float(max(hv[:, 2].max(), bz1))
    face_z = bz1 - 0.25 * (bz1 - bz0)
    anchors = {"mouth": ("body", (0, float(bv[:, 1].min()), face_z)), "chest": ("body", (0, float(bv[:, 1].min()), bz0 + 0.45 * (bz1 - bz0))),
               "cap_top": ("head", (0, float(np.median(hv[:, 1])), float(hv[:, 2].max())))}
    for side in ("L", "R"):
        if f"foot_{side}" in J:
            anchors[f"paw_{side}"] = (f"foot_{side}", J[f"foot_{side}"][1])
    return J, anchors, H, dict(arm_pts=arm_pts, bz0=bz0, bz1=bz1)


# ---------------------------------------------------------------- weights
def weights_quad(name, role, side, v, fit):
    x, y, z = v[:, 0], v[:, 1], v[:, 2]
    fy, ry, ftop = fit["fy"], fit["ry"], fit["ftop"]
    L = max(ry - fy, 1e-3)
    W = {}
    if role in ("body", "back"):
        th = smooth((y - (fy + 0.1 * L)) / (0.8 * L))
        W["hips"], W["spine"] = th, 1 - th
    elif role == "chest":
        n = smooth((z - 0.86 * ftop) / (0.42 * ftop))
        W["neck"], W["spine"] = n, 1 - n
    elif role == "neck":
        n = smooth((z - 0.9 * ftop) / (0.25 * ftop))
        W["neck"], W["spine"] = 0.3 + 0.7 * n, 0.7 * (1 - n)
    elif role == "head":
        W["head"] = np.ones(len(v))
    elif role == "tail" and fit["tail_pts"] is not None:
        sw = seg_weights(v, fit["tail_pts"])
        base = smooth(np.linalg.norm(v - fit["tail_pts"][0], axis=1) / (0.25 * np.linalg.norm(fit["tail_pts"][1] - fit["tail_pts"][0]) + 1e-6))
        for k in range(3):
            W[f"tail{k + 1}"] = sw[:, k] * (base if k == 0 else 1)
        W["hips"] = 1 - base
    elif role in ("leg_front", "leg_rear"):
        key = "fl" if role == "leg_front" else "rl"
        top = fit["ftop"] if key == "fl" else fit["rtop"]
        up = smooth((z - 0.43 * top) / (0.21 * top))
        paw = 1 - smooth((z - 0.095 * top) / (0.14 * top))
        topb = smooth((z - 0.88 * top) / (0.19 * top)) * 0.7
        W[f"{key}_up_{side}"] = up * (1 - topb)
        W["spine" if key == "fl" else "hips"] = up * topb
        W[f"{key}_low_{side}"] = np.clip(1 - up - paw, 0, 1)
        W[f"{key}_paw_{side}"] = paw
    elif role == "wing" and side in fit["wing_fit"]:
        root, mid, tip, lo, hi = fit["wing_fit"][side]
        t = (np.abs(x) - lo) / max(hi - lo, 1e-6)
        w_out = smooth((t - 0.35) / 0.3)
        attach = 1 - smooth(t / 0.12)
        W[f"wing_out_{side}"] = w_out * (1 - attach)
        W[f"wing_in_{side}"] = (1 - w_out) * (1 - attach)
        W["spine"] = attach
    else:
        W["spine"] = np.ones(len(v))
    return W


def weights_round(name, role, side, v, fit):
    W = {}
    if role == "head":
        W["head"] = np.ones(len(v))
    elif role == "arm" and side in fit["arm_pts"]:
        pts = fit["arm_pts"][side]
        sw = seg_weights(v, pts)
        attach = 1 - smooth(np.linalg.norm(v - pts[0], axis=1) / (0.35 * np.linalg.norm(pts[1] - pts[0]) + 1e-6))
        W[f"arm_up_{side}"] = sw[:, 0] * (1 - attach)
        W[f"arm_low_{side}"] = sw[:, 1] * (1 - attach)
        W["body"] = attach
    elif role == "foot":
        W[f"foot_{side}"] = np.ones(len(v))
    else:
        W["body"] = np.ones(len(v))
    return W


# ---------------------------------------------------------------- keys
def expand(pose):
    out = {}
    for name, v in pose.items():
        if "*" in name:
            for side in ("L", "R"):
                vv = dict(v)
                if side == "R":
                    if "r" in vv:
                        vv["r"] = (vv["r"][0], -vv["r"][1], -vv["r"][2])
                    if "l" in vv:
                        vv["l"] = (-vv["l"][0], vv["l"][1], vv["l"][2])
                out[name.replace("*", side)] = vv
        else:
            out[name] = dict(out.get(name, {}), **v)
    return out


def main():
    import bpy
    from mathutils import Euler, Vector

    blend, rig_path, out = sys.argv[1:4]
    cfg = json.load(open(rig_path))
    plan, wings, roles = cfg["plan"], bool(cfg.get("wings")), cfg.get("roles", {})
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend))
    for o in list(bpy.data.objects):
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    parts = {o.name: o for o in bpy.data.objects if o.type == "MESH"}
    P = {}
    info = {}
    for n, o in parts.items():
        v = verts(o)
        r, s = role_of(n, roles), side_of(n, verts(o))
        P.setdefault(r, []).append((n, s, v))
        info[n] = (r, s, v)
    if plan == "quad":
        J, anchors, scale, fit = fit_quad(P, wings)
    else:
        J, anchors, scale, fit = fit_round(P)
    print("roles:", {n: info[n][0] + ("" if info[n][1] is None else "/" + info[n][1]) for n in info})
    arm_data = bpy.data.armatures.new("rig")
    arm = bpy.data.objects.new("rig", arm_data)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    for name, (h, t, par) in J.items():
        b = arm_data.edit_bones.new(name)
        b.head, b.tail = Vector(h), Vector(t)
        if (b.tail - b.head).length < 1e-3:
            b.tail = b.head + Vector((0, 0, 0.05))
        b.roll = 0.0
    for name, (h, t, par) in J.items():
        if par:
            arm_data.edit_bones[name].parent = arm_data.edit_bones[par]
    bpy.ops.object.mode_set(mode="OBJECT")
    for n, o in parts.items():
        r, s, v = info[n]
        W = (weights_quad if plan == "quad" else weights_round)(n, r, s, v, fit)
        tot = sum(W.values())
        for bone, w in W.items():
            if bone not in J:
                continue
            w = w / np.maximum(tot, 1e-6)
            vg = o.vertex_groups.get(bone) or o.vertex_groups.new(name=bone)
            q = np.round(w * 40) / 40
            for level in np.unique(q):
                if level > 0:
                    vg.add(np.where(q == level)[0].tolist(), float(level), "REPLACE")
        o.modifiers.new("rig", "ARMATURE").object = arm
        o.parent = arm
    # materials
    if "--no-materials" not in sys.argv and arg("--albedo"):
        m = bpy.data.materials.new("creature")
        m.use_nodes = True
        nt = m.node_tree
        bs = nt.nodes["Principled BSDF"]
        bs.inputs["Roughness"].default_value = 0.85

        def tex(path, colour=True):
            im = bpy.data.images.load(os.path.abspath(path))
            if not colour:
                im.colorspace_settings.name = "Non-Color"
            n_ = nt.nodes.new("ShaderNodeTexImage")
            n_.image = im
            return n_

        nt.links.new(tex(arg("--albedo")).outputs["Color"], bs.inputs["Base Color"])
        if arg("--emit"):
            nt.links.new(tex(arg("--emit")).outputs["Color"], bs.inputs["Emission Color"])
            bs.inputs["Emission Strength"].default_value = 1.0
        if arg("--normal"):
            nm = nt.nodes.new("ShaderNodeNormalMap")
            nt.links.new(tex(arg("--normal"), False).outputs["Color"], nm.inputs["Color"])
            nt.links.new(nm.outputs["Normal"], bs.inputs["Normal"])
        for o in parts.values():
            o.data.materials.clear()
            o.data.materials.append(m)
    bpy.ops.object.select_all(action="DESELECT")
    for o in parts.values():
        o.select_set(True)
    bpy.context.view_layer.objects.active = list(parts.values())[0]
    bpy.ops.object.join()
    mesh = bpy.context.view_layer.objects.active
    mesh.name = os.path.splitext(os.path.basename(out))[0]
    # clips
    arm.animation_data_create()
    rest = {b.name: b.matrix_local.to_quaternion() for b in arm_data.bones}
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
    clips = motions.clips(plan, wings)
    for cname, (dur, keys) in clips.items():
        act = bpy.data.actions.new(cname)
        act.use_fake_user = True
        arm.animation_data.action = act
        for t, pose in keys:
            pose = expand(pose)
            f = int(round(t * FPS)) + 1
            for pb in arm.pose.bones:
                spec = pose.get(pb.name, {})
                R = rest[pb.name]
                rx, ry, rz = spec.get("r", (0, 0, 0))
                qa = Euler((math.radians(rx), math.radians(ry), math.radians(rz)), "XYZ").to_quaternion()
                pb.rotation_quaternion = R.inverted() @ qa @ R
                pb.location = R.inverted() @ (Vector(spec.get("l", (0, 0, 0))) * scale)
                s = spec.get("s", (1, 1, 1))
                Rm = R.to_matrix()
                pb.scale = [s[max(range(3), key=lambda j: abs(Rm[j][i]))] for i in range(3)]
                for path in ("rotation_quaternion", "location", "scale"):
                    pb.keyframe_insert(path, frame=f, group=pb.name)
    arm.animation_data.action = bpy.data.actions["idle"]
    bpy.context.scene.render.fps = FPS
    if arg("--preview"):
        preview(bpy, arm, list(clips.items()), arg("--preview"), mesh)
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    mesh.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.abspath(out), export_format="GLB", export_image_format="AUTO",
                              export_tangents=bool(arg("--normal")), export_yup=True, use_selection=True,
                              export_materials="NONE" if "--no-materials" in sys.argv else "EXPORT",
                              export_animations=True, export_animation_mode="ACTIONS", export_skins=True,
                              export_def_bones=False, export_optimize_animation_size=True)
    if arg("--manifest"):
        to_gltf = lambda p: [round(float(p[0]), 4), round(float(p[2]), 4), round(float(-p[1]), 4)]  # noqa: E731
        man = {"plan": plan, "wings": wings, "scale": round(float(scale), 4),
               "anchors": {k: {"bone": b, "pos": to_gltf(p)} for k, (b, p) in anchors.items()},
               "clips": {c: d for c, (d, _) in clips.items()}}
        json.dump(man, open(arg("--manifest"), "w"), indent=1)
    print(f"exported {out}: {os.path.getsize(out) / 1e6:.2f} MB, {len(J)} bones, {len(clips)} clips: {', '.join(clips)}")


def preview(bpy, arm, clips, outdir, mesh):
    from mathutils import Vector

    os.makedirs(outdir, exist_ok=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.samples = 4
    sc.cycles.use_denoising = False
    sc.render.resolution_x, sc.render.resolution_y = 420, 340
    sc.render.film_transparent = True
    bb = [mesh.matrix_world @ Vector(c) for c in mesh.bound_box]
    lo = Vector((min(p.x for p in bb), min(p.y for p in bb), min(p.z for p in bb)))
    hi = Vector((max(p.x for p in bb), max(p.y for p in bb), max(p.z for p in bb)))
    size = (hi - lo).length
    target = (lo + hi) / 2
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = 40
    pos = target + Vector((-0.55, -0.75, 0.32)).normalized() * size * 1.9
    cam.location = pos
    cam.rotation_euler = (target - pos).to_track_quat("-Z", "Y").to_euler()
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3
    sun.rotation_euler = (0.8, 0.2, -0.6)
    sc.collection.objects.link(sun)
    w = bpy.data.worlds.new("w")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.45
    sc.world = w
    for cname, (dur, keys) in clips:
        arm.animation_data.action = bpy.data.actions[cname]
        for i in range(5):
            sc.frame_set(int(round(dur * FPS * i / 4)) + 1)
            sc.render.filepath = os.path.join(outdir, f"{cname}_{i}.png")
            bpy.ops.render.render(write_still=True)
    arm.animation_data.action = bpy.data.actions["idle"]


if __name__ == "__main__":
    main()
