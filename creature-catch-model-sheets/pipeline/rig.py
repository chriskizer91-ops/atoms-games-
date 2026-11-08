"""Skeleton, skin weights and the battle animations for Coalossus (Blender).

usage: python3 -I rig.py model.blend OUT.glb [--albedo a.jpg] [--normal n.png] [--emit e.jpg]
                         [--no-materials] [--preview DIR] [--save rigged.blend]

Bones (L = the creature's left, +X): root, hips, spine, neck, head, tail, and for each leg
up / low / paw (fl_ = front legs, rl_ = rear legs). Each part is tied to its bones by name;
legs blend upper/lower at the knee and into the body at the top, the body blends hips/spine.

Animations follow the 2D game's battle code (06-battle.js): physical moves lunge, Fire moves
spit embers, strong moves charge (swell) then lunge, boosts wobble, a hit flinches and shakes,
fainting sinks, the send-out pops in with a squash. Effects (embers, rocks, rings, flashes) are
added by the viewer at the times listed in the animation's name table there.
"""
import math
import os
import sys

import numpy as np

FPS = 30


def arg(flag, default=None):
    if flag in sys.argv:
        return sys.argv[sys.argv.index(flag) + 1]
    return default


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def verts(ob):
    co = np.zeros(len(ob.data.vertices) * 3)
    ob.data.vertices.foreach_get("co", co)
    return co.reshape(-1, 3)


# ---------------- moves ----------------
# Each key: time (s) -> {bone: {"r": (x, y, z) degrees about armature axes, "l": (x, y, z) m, "s": (x, y, z)}}
# Armature axes: the creature faces -Y, +X is its left, +Z up.
#   leg swings forward = negative X rotation; knee bend = positive X on the lower leg
#   body / head pitch up = negative X; lean left = positive Y; turn left = positive Z
# Names with * apply to both sides (Y and Z rotation and X location mirror on the right).
def moves():
    M = {}
    N = {}
    M["idle"] = (3.0, [
        (0.0, {}),
        (0.75, {"tail": {"r": (0, 0, 9)}, "head": {"r": (-1.5, 0, 1)}}),
        (1.5, {"root": {"l": (0, 0, -0.012)}, "spine": {"r": (1.5, 0, 0)}, "head": {"r": (-3, 0, 0)}, "tail": {"r": (0, 0, 0)},
               "fl_up_*": {"r": (-1.0, 0, 0)}, "rl_up_*": {"r": (1.0, 0, 0)}}),
        (2.25, {"tail": {"r": (0, 0, -9)}, "head": {"r": (-1.5, 0, -1)}}),
        (3.0, {}),
    ])
    # walk: diagonal pairs (front left with rear right)
    keys = []
    for i in range(9):
        t = i / 8.0
        k = {}
        for leg, ph in (("fl", 0.0), ("rl", 0.5)):
            for side, off in (("L", 0.0), ("R", 0.5)):
                p = 2 * math.pi * (t + ph + off)
                swing = -20 * math.sin(p)
                lift = max(0.0, math.cos(p))
                k[f"{leg}_up_{side}"] = {"r": (swing, 0, 0)}
                k[f"{leg}_low_{side}"] = {"r": (32 * lift, 0, 0)}
                k[f"{leg}_paw_{side}"] = {"r": (-18 * lift, 0, 0)}
        b = abs(math.sin(2 * math.pi * t * 2))
        k["root"] = {"l": (0, 0, 0.025 * b)}
        k["spine"] = {"r": (0, 2.5 * math.sin(2 * math.pi * t), 0)}
        k["hips"] = {"r": (0, -2.5 * math.sin(2 * math.pi * t), 0)}
        k["head"] = {"r": (-2 * b, 0, 2 * math.sin(2 * math.pi * t))}
        k["tail"] = {"r": (0, 0, 12 * math.sin(2 * math.pi * t))}
        keys.append((t * 1.1, k))
    M["walk"] = (1.1, keys)
    # Tackle (Normal, physical): crouch, lunge, back
    M["tackle"] = (1.1, [
        (0.0, {}),
        (0.3, {"root": {"l": (0, 0.16, -0.06)}, "spine": {"r": (6, 0, 0)}, "head": {"r": (8, 0, 0)},
               "fl_up_*": {"r": (8, 0, 0)}, "rl_up_*": {"r": (-6, 0, 0)}}),
        (0.45, {"root": {"l": (0, -0.55, 0.06)}, "spine": {"r": (-4, 0, 0)}, "head": {"r": (-8, 0, 0)},
                "fl_up_*": {"r": (-26, 0, 0)}, "fl_low_*": {"r": (10, 0, 0)}, "rl_up_*": {"r": (22, 0, 0)}}),
        (0.6, {"root": {"l": (0, -0.5, 0.02)}, "spine": {"r": (-2, 0, 0)}, "fl_up_*": {"r": (-20, 0, 0)}, "rl_up_*": {"r": (18, 0, 0)}}),
        (1.1, {}),
    ])
    # Ember Tap (Fire, basic special): small squash, head thrusts, embers from the mouth
    M["ember_tap"] = (1.1, [
        (0.0, {}),
        (0.18, {"root": {"l": (0, 0.03, -0.04)}, "spine": {"r": (4, 0, 0)}, "head": {"r": (12, 0, 0)}, "neck": {"r": (6, 0, 0)}}),
        (0.32, {"root": {"l": (0, -0.08, 0.01)}, "spine": {"r": (-3, 0, 0)}, "head": {"r": (-14, 0, 0)}, "neck": {"r": (-8, 0, 0)}}),
        (0.65, {"root": {"l": (0, -0.06, 0.0)}, "head": {"r": (-10, 0, 0)}, "neck": {"r": (-6, 0, 0)}}),
        (1.1, {}),
    ])
    # Pebble Toss (Earth, physical): the right front paw scoops and flings rocks
    M["pebble_toss"] = (1.3, [
        (0.0, {}),
        (0.32, {"fl_up_R": {"r": (24, 0, 0)}, "fl_low_R": {"r": (45, 0, 0)}, "fl_paw_R": {"r": (20, 0, 0)},
                "spine": {"r": (3, -4, -6)}, "head": {"r": (6, 0, -8)}, "root": {"l": (0, 0.04, -0.03)}}),
        (0.5, {"fl_up_R": {"r": (-62, 0, 0)}, "fl_low_R": {"r": (-8, 0, 0)}, "fl_paw_R": {"r": (-25, 0, 0)},
               "spine": {"r": (-4, 3, 4)}, "head": {"r": (-6, 0, 4)}, "root": {"l": (0, -0.08, 0.02)}}),
        (0.78, {"fl_up_R": {"r": (-48, 0, 0)}, "fl_low_R": {"r": (4, 0, 0)}, "spine": {"r": (-2, 2, 2)}}),
        (1.3, {}),
    ])
    # Coal Swipe (signature, Fire): rear up, big swipe with the right paw trailing fire, drop down
    rear = {"hips": {"r": (-30, 0, 0)}, "rl_up_*": {"r": (30, 0, 0)}, "rl_paw_*": {"r": (-4, 0, 0)},
            "spine": {"r": (-6, 0, 0)}, "head": {"r": (22, 0, 0)}, "root": {"l": (0, 0.05, 0.02)}}
    M["coal_swipe"] = (1.7, [
        (0.0, {}),
        (0.38, dict(rear, **{"fl_up_L": {"r": (-28, 0, 0)}, "fl_low_L": {"r": (40, 0, 0)},
                             "fl_up_R": {"r": (-10, -38, -20)}, "fl_low_R": {"r": (30, 0, 0)}, "tail": {"r": (-10, 0, 0)}})),
        (0.58, dict(rear, **{"fl_up_L": {"r": (-26, 0, 0)}, "fl_low_L": {"r": (38, 0, 0)},
                             "fl_up_R": {"r": (-78, 28, 30)}, "fl_low_R": {"r": (2, 0, 0)}, "fl_paw_R": {"r": (-20, 0, 0)},
                             "spine": {"r": (-6, 0, 14)}, "head": {"r": (18, 0, 10)}})),
        (0.76, dict(rear, **{"fl_up_L": {"r": (-24, 0, 0)}, "fl_low_L": {"r": (36, 0, 0)},
                             "fl_up_R": {"r": (-60, 34, 40)}, "fl_low_R": {"r": (10, 0, 0)}, "spine": {"r": (-6, 0, 18)}})),
        (1.0, {"root": {"l": (0, -0.05, -0.04)}, "fl_up_*": {"r": (-6, 0, 0)}, "spine": {"r": (3, 0, 6)}, "head": {"r": (4, 0, 4)}}),
        (1.15, {"root": {"l": (0, -0.04, 0.0)}}),
        (1.7, {}),
    ])
    # Flare Burst (Fire, strong): charge low and swell, rear back, burst forward roaring
    M["flare_burst"] = (2.1, [
        (0.0, {}),
        (0.62, {"root": {"l": (0, 0.05, -0.09), "s": (1.06, 1.06, 1.06)}, "spine": {"r": (6, 0, 0)}, "head": {"r": (14, 0, 0)},
                "fl_up_*": {"r": (6, 0, 0)}, "fl_low_*": {"r": (14, 0, 0)}, "rl_up_*": {"r": (-6, 0, 0)}, "rl_low_*": {"r": (12, 0, 0)}}),
        (0.78, {"root": {"l": (0, 0.12, 0.02), "s": (1.08, 1.08, 1.08)}, "hips": {"r": (-8, 0, 0)}, "rl_up_*": {"r": (8, 0, 0)},
                "head": {"r": (-26, 0, 0)}, "neck": {"r": (-10, 0, 0)}}),
        (0.92, {"root": {"l": (0, -0.38, 0.02), "s": (1.0, 1.0, 1.0)}, "spine": {"r": (-6, 0, 0)}, "head": {"r": (-12, 0, 0)},
                "neck": {"r": (-6, 0, 0)}, "fl_up_*": {"r": (-22, 0, 0)}, "rl_up_*": {"r": (20, 0, 0)}}),
        (1.35, {"root": {"l": (0, -0.3, 0.0)}, "head": {"r": (-8, 0, 0)}, "fl_up_*": {"r": (-16, 0, 0)}, "rl_up_*": {"r": (14, 0, 0)}}),
        (2.1, {}),
    ])
    # Quake Stomp (Earth, strong): rear up high, hold, slam the front paws down
    high = {"hips": {"r": (-42, 0, 0)}, "rl_up_*": {"r": (42, 0, 0)}, "rl_paw_*": {"r": (-6, 0, 0)},
            "fl_up_*": {"r": (-34, 0, 0)}, "fl_low_*": {"r": (48, 0, 0)}, "head": {"r": (14, 0, 0)},
            "spine": {"r": (-4, 0, 0)}, "root": {"l": (0, 0.06, 0.04)}, "tail": {"r": (-12, 0, 0)}}
    M["quake_stomp"] = (2.0, [
        (0.0, {}),
        (0.5, high),
        (0.82, dict(high, hips={"r": (-45, 0, 0)}, rl_up_L={"r": (45, 0, 0)}, rl_up_R={"r": (45, 0, 0)})),
        (1.0, {"hips": {"r": (4, 0, 0)}, "fl_up_*": {"r": (-4, 0, 0)}, "fl_low_*": {"r": (6, 0, 0)}, "root": {"l": (0, -0.04, -0.06)},
               "head": {"r": (8, 0, 0)}, "tail": {"r": (8, 0, 0)}}),
        (1.2, {"root": {"l": (0, -0.03, 0.01)}, "head": {"r": (-4, 0, 0)}}),
        (2.0, {}),
    ])
    # Guard Up (boost defence): hunker down with legs braced, glow
    M["guard_up"] = (1.5, [
        (0.0, {}),
        (0.35, {"root": {"l": (0, 0, -0.1)}, "fl_up_*": {"r": (4, 0, 8)}, "rl_up_*": {"r": (-4, 0, -8)},
                "fl_low_*": {"r": (18, 0, 0)}, "rl_low_*": {"r": (16, 0, 0)},
                "head": {"r": (16, 0, 0)}, "neck": {"r": (8, 0, 0)}, "spine": {"r": (3, 0, 0)}}),
        (1.05, {"root": {"l": (0, 0, -0.1)}, "fl_low_*": {"r": (18, 0, 0)}, "rl_low_*": {"r": (16, 0, 0)},
                "head": {"r": (16, 0, 0)}, "neck": {"r": (8, 0, 0)}}),
        (1.5, {}),
    ])
    # Rally (boost attack): chest out, roar to the sky
    M["rally"] = (1.6, [
        (0.0, {}),
        (0.35, {"head": {"r": (-34, 0, 0)}, "neck": {"r": (-12, 0, 0)}, "spine": {"r": (-8, 0, 0)},
                "fl_up_*": {"r": (-8, 0, 0)}, "root": {"l": (0, 0, 0.03)}, "tail": {"r": (-14, 0, 0)}}),
        (0.6, {"head": {"r": (-36, 0, 3)}, "neck": {"r": (-12, 0, 0)}, "spine": {"r": (-8, 0, 0)}, "root": {"l": (0, 0, 0.03)}}),
        (0.8, {"head": {"r": (-34, 0, -3)}, "neck": {"r": (-12, 0, 0)}, "spine": {"r": (-8, 0, 0)}, "root": {"l": (0, 0, 0.03)}}),
        (1.0, {"head": {"r": (-32, 0, 0)}, "neck": {"r": (-10, 0, 0)}, "spine": {"r": (-7, 0, 0)}, "root": {"l": (0, 0, 0.02)}}),
        (1.6, {}),
    ])
    # Cinder Haze (Fire status): shakes, vents blast a cloud of ash and embers
    keys = [(0.0, {})]
    for i in range(8):
        t = 0.2 + i * 0.09
        keys.append((t, {"root": {"l": (0.03 * (1 if i % 2 else -1), 0, -0.02)}, "spine": {"r": (3, 3 * (1 if i % 2 else -1), 0)},
                         "head": {"r": (6, 0, 0)}}))
    keys += [(1.0, {"spine": {"r": (-4, 0, 0)}, "head": {"r": (-6, 0, 0)}}), (1.5, {})]
    M["cinder_haze"] = (1.5, keys)
    # Hit: knocked back, shakes (the game flashes white three times while shaking)
    M["hit"] = (0.7, [
        (0.0, {}),
        (0.08, {"root": {"l": (0, 0.09, 0.01)}, "spine": {"r": (-5, 0, 0)}, "head": {"r": (-12, 0, 0)}}),
        (0.18, {"root": {"l": (0.04, 0.07, 0)}, "head": {"r": (-8, 0, 0)}}),
        (0.28, {"root": {"l": (-0.04, 0.06, 0)}, "head": {"r": (-6, 0, 0)}}),
        (0.38, {"root": {"l": (0.04, 0.04, 0)}}),
        (0.48, {"root": {"l": (-0.03, 0.02, 0)}}),
        (0.7, {}),
    ])
    # Faint: legs buckle, sinks and tips over (the viewer dissolves it into glowing embers)
    M["faint"] = (1.8, [
        (0.0, {}),
        (0.4, {"fl_up_*": {"r": (18, 0, 0)}, "fl_low_*": {"r": (38, 0, 0)}, "rl_low_*": {"r": (25, 0, 0)},
               "head": {"r": (24, 0, 0)}, "neck": {"r": (10, 0, 0)}, "root": {"l": (0, 0, -0.16)}, "tail": {"r": (20, 0, 0)}}),
        (1.0, {"fl_up_*": {"r": (30, 0, 8)}, "fl_low_*": {"r": (60, 0, 0)}, "rl_up_*": {"r": (-20, 0, -6)}, "rl_low_*": {"r": (50, 0, 0)},
               "head": {"r": (34, 0, 10)}, "neck": {"r": (14, 0, 0)}, "root": {"r": (0, 18, 0), "l": (0, 0, -0.34)}, "tail": {"r": (28, 0, 0)}}),
        (1.8, {"fl_up_*": {"r": (30, 0, 8)}, "fl_low_*": {"r": (60, 0, 0)}, "rl_up_*": {"r": (-20, 0, -6)}, "rl_low_*": {"r": (50, 0, 0)},
               "head": {"r": (36, 0, 12)}, "neck": {"r": (14, 0, 0)}, "root": {"r": (0, 20, 0), "l": (0, 0, -0.36)}, "tail": {"r": (30, 0, 0)}}),
    ])
    # Send out: pops in from the capture cube with a squash and stretch
    M["send_out"] = (0.9, [
        (0.0, {"root": {"s": (0.02, 0.02, 0.02), "l": (0, 0, 0.6)}}),
        (0.32, {"root": {"s": (1.08, 1.08, 1.08), "l": (0, 0, 0.0)}}),
        (0.45, {"root": {"s": (1.12, 1.12, 0.84)}}),
        (0.62, {"root": {"s": (0.95, 0.95, 1.08), "l": (0, 0, 0.05)}}),
        (0.9, {}),
    ])
    return M


def expand(pose):
    out = {}
    for name, v in pose.items():
        if "*" in name:
            for side in ("L", "R"):
                vv = dict(v)
                if side == "R":
                    if "r" in vv:
                        x, y, z = vv["r"]
                        vv["r"] = (x, -y, -z)
                    if "l" in vv:
                        x, y, z = vv["l"]
                        vv["l"] = (-x, y, z)
                out[name.replace("*", side)] = vv
        else:
            out[name] = v
    return out


def main():
    import bpy
    from mathutils import Euler, Matrix, Quaternion, Vector

    blend, out = sys.argv[1], sys.argv[2]
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend))
    for o in list(bpy.data.objects):
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    parts = {o.name: o for o in bpy.data.objects if o.type == "MESH"}
    V = {n: verts(o) for n, o in parts.items()}

    def leg_axis(name):
        v = V[name]
        m = (v[:, 2] > 0.3) & (v[:, 2] < 0.6)
        return float(np.median(v[m, 0])), float(np.median(v[m, 1])), float(v[:, 1].min())

    fx, fy, ftoe = leg_axis("front_leg_L")
    rx, ry, rtoe = leg_axis("rear_leg_L")
    hv = V["head"]
    hy, hz = float((hv[:, 1].min() + hv[:, 1].max()) / 2), float((hv[:, 2].min() + hv[:, 2].max()) / 2)
    tv = V["tail"]
    ty0, ty1, tz = float(tv[:, 1].min()), float(tv[:, 1].max()), float(np.median(tv[:, 2]))
    ymid = (fy + ry) / 2
    J = {  # name: (head, tail, parent)
        "root": ((0, 0, 0), (0, 0, 0.35), None),
        "hips": ((0, ry, 0.88), (0, ymid, 0.92), "root"),
        "spine": ((0, ymid, 0.92), (0, fy, 0.98), "hips"),
        "neck": ((0, fy - 0.02, 1.02), (0, hy + 0.22, hz - 0.12), "spine"),
        "head": ((0, hy + 0.22, hz - 0.12), (0, hy - 0.3, hz + 0.05), "neck"),
        "tail": ((0, ty0 - 0.02, tz), (0, ty1 + 0.02, tz + 0.02), "hips"),
    }
    for side, sx in (("L", 1), ("R", -1)):
        J[f"fl_up_{side}"] = ((sx * fx, fy, 0.84), (sx * fx, fy - 0.02, 0.44), "spine")
        J[f"fl_low_{side}"] = ((sx * fx, fy - 0.02, 0.44), (sx * fx, fy - 0.03, 0.13), f"fl_up_{side}")
        J[f"fl_paw_{side}"] = ((sx * fx, fy - 0.03, 0.13), (sx * fx, ftoe + 0.08, 0.06), f"fl_low_{side}")
        J[f"rl_up_{side}"] = ((sx * rx, ry, 0.84), (sx * rx, ry - 0.02, 0.44), "hips")
        J[f"rl_low_{side}"] = ((sx * rx, ry - 0.02, 0.44), (sx * rx, ry - 0.03, 0.13), f"rl_up_{side}")
        J[f"rl_paw_{side}"] = ((sx * rx, ry - 0.03, 0.13), (sx * rx, rtoe + 0.08, 0.06), f"rl_low_{side}")

    arm_data = bpy.data.armatures.new("rig")
    arm = bpy.data.objects.new("rig", arm_data)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    for name, (h, t, par) in J.items():
        b = arm_data.edit_bones.new(name)
        b.head, b.tail = Vector(h), Vector(t)
        b.roll = 0.0
    for name, (h, t, par) in J.items():
        if par:
            arm_data.edit_bones[name].parent = arm_data.edit_bones[par]
            arm_data.edit_bones[name].use_connect = False
    bpy.ops.object.mode_set(mode="OBJECT")

    # ---- weights ----
    def weights(name, v):
        base = name[:-2] if name.endswith(("_L", "_R")) else name
        side = name[-1] if name.endswith(("_L", "_R")) else None
        x, y, z = v[:, 0], v[:, 1], v[:, 2]
        W = {}
        if base in ("body", "ridge"):
            th = smooth((y - (fy + 0.1)) / ((ry - 0.1) - (fy + 0.1)))
            W["hips"], W["spine"] = th, 1 - th
        elif base in ("vent", "vent_side", "shoulder_crag"):
            W["spine"] = np.ones(len(v))
        elif base == "mane":
            n = smooth((z - 0.95) / 0.3)
            W["neck"], W["spine"] = n, 1 - n
        elif base == "ruff":
            n = smooth((z - 0.72) / 0.35)
            W["neck"], W["spine"] = n, 1 - n
        elif base in ("head", "muzzle", "ear"):
            W["head"] = np.ones(len(v))
        elif base == "tail":
            n = smooth((y - ty0) / 0.08)
            W["tail"], W["hips"] = n, 1 - n
        elif base in ("front_leg", "rear_leg"):
            p = "fl" if base == "front_leg" else "rl"
            body = "spine" if p == "fl" else "hips"
            up = smooth((z - 0.36) / 0.18)
            paw = 1 - smooth((z - 0.08) / 0.12)
            top = smooth((z - 0.74) / 0.16) * 0.7
            low = np.clip(1 - up - paw, 0, 1)
            W[f"{p}_up_{side}"] = up * (1 - top)
            W[body] = up * top
            W[f"{p}_low_{side}"] = low
            W[f"{p}_paw_{side}"] = paw
        tot = sum(W.values())
        return {k: w / np.maximum(tot, 1e-6) for k, w in W.items()}

    for name, ob in parts.items():
        W = weights(name, V[name])
        for bone, w in W.items():
            vg = ob.vertex_groups.get(bone) or ob.vertex_groups.new(name=bone)
            q = np.round(w * 40) / 40
            for level in np.unique(q):
                if level <= 0:
                    continue
                idx = np.where(q == level)[0].tolist()
                vg.add(idx, float(level), "REPLACE")
        mod = ob.modifiers.new("rig", "ARMATURE")
        mod.object = arm
        ob.parent = arm

    # ---- materials (optional) and join ----
    if "--no-materials" not in sys.argv and arg("--albedo"):
        m = bpy.data.materials.new("coalossus")
        m.use_nodes = True
        nt = m.node_tree
        bs = nt.nodes["Principled BSDF"]
        bs.inputs["Roughness"].default_value = 0.85

        def tex(path, colour=True):
            im = bpy.data.images.load(os.path.abspath(path))
            if not colour:
                im.colorspace_settings.name = "Non-Color"
            n = nt.nodes.new("ShaderNodeTexImage")
            n.image = im
            return n

        nt.links.new(tex(arg("--albedo")).outputs["Color"], bs.inputs["Base Color"])
        if arg("--emit"):
            nt.links.new(tex(arg("--emit")).outputs["Color"], bs.inputs["Emission Color"])
            bs.inputs["Emission Strength"].default_value = 1.0
        if arg("--normal"):
            nm = nt.nodes.new("ShaderNodeNormalMap")
            nt.links.new(tex(arg("--normal"), False).outputs["Color"], nm.inputs["Color"])
            nt.links.new(nm.outputs["Normal"], bs.inputs["Normal"])
        for ob in parts.values():
            ob.data.materials.clear()
            ob.data.materials.append(m)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in parts.values():
        ob.select_set(True)
    first = list(parts.values())[0]
    bpy.context.view_layer.objects.active = first
    bpy.ops.object.join()
    mesh = bpy.context.view_layer.objects.active
    mesh.name = "coalossus"

    # ---- animations ----
    arm.animation_data_create()
    rest = {b.name: b.matrix_local.to_quaternion() for b in arm_data.bones}
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
    acts = []
    for mname, (dur, keys) in moves().items():
        act = bpy.data.actions.new(mname)
        act.use_fake_user = True
        arm.animation_data.action = act
        for t, pose in keys:
            pose = expand(pose)
            f = int(round(t * FPS)) + 1
            for pb in arm.pose.bones:
                spec = pose.get(pb.name, {})
                R = rest[pb.name]
                rx, ry_, rz = spec.get("r", (0, 0, 0))
                qa = Euler((math.radians(rx), math.radians(ry_), math.radians(rz)), "XYZ").to_quaternion()
                pb.rotation_quaternion = R.inverted() @ qa @ R
                loc = Vector(spec.get("l", (0, 0, 0)))
                pb.location = R.inverted() @ loc
                s = spec.get("s", (1, 1, 1))
                Rm = R.to_matrix()
                ls = [1.0, 1.0, 1.0]
                for i in range(3):
                    j = max(range(3), key=lambda jj: abs(Rm[jj][i]))
                    ls[i] = s[j]
                pb.scale = ls
                pb.keyframe_insert("rotation_quaternion", frame=f, group=pb.name)
                pb.keyframe_insert("location", frame=f, group=pb.name)
                pb.keyframe_insert("scale", frame=f, group=pb.name)
        acts.append((mname, dur))
    arm.animation_data.action = bpy.data.actions["idle"]
    bpy.context.scene.render.fps = FPS

    if arg("--save"):
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(arg("--save")))
    if arg("--preview"):
        preview(bpy, arm, mesh, acts, arg("--preview"))
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    mesh.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.abspath(out), export_format="GLB", export_image_format="AUTO",
                              export_tangents=bool(arg("--normal")), export_yup=True, use_selection=True,
                              export_materials="NONE" if "--no-materials" in sys.argv else "EXPORT",
                              export_animations=True, export_animation_mode="ACTIONS", export_skins=True,
                              export_def_bones=False, export_optimize_animation_size=True)
    print(f"exported {out}: {os.path.getsize(out) / 1e6:.1f} MB, {len(acts)} animations: {', '.join(a for a, _ in acts)}")


def preview(bpy, arm, mesh, acts, outdir):
    """Small 3/4 renders of a few frames of every animation (for checking poses)."""
    from mathutils import Vector

    os.makedirs(outdir, exist_ok=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.samples = 4
    sc.cycles.use_denoising = False
    sc.render.resolution_x, sc.render.resolution_y = 640, 500
    sc.render.film_transparent = True
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = 40
    target = Vector((0, 0, 0.8))
    pos = target + Vector((-3.0, -4.0, 1.5))
    cam.location = pos
    cam.rotation_euler = (target - pos).to_track_quat("-Z", "Y").to_euler()
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3
    sun.rotation_euler = (0.8, 0.2, -0.6)
    sc.collection.objects.link(sun)
    w = bpy.data.worlds.new("w")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.4
    sc.world = w
    for mname, dur in acts:
        arm.animation_data.action = bpy.data.actions[mname]
        n = 5
        for i in range(n):
            f = int(round(dur * FPS * i / (n - 1))) + 1
            sc.frame_set(f)
            sc.render.filepath = os.path.join(outdir, f"{mname}_{i}.png")
            bpy.ops.render.render(write_still=True)
    arm.animation_data.action = bpy.data.actions["idle"]


if __name__ == "__main__":
    main()
