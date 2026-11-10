"""The shared motion library: every clip for every body type (no Blender needed).

The 2D game animates every move with the same few motions, picked by the move's kind
(06-battle.js moveAnim): physical moves lunge, special moves fire a stream, strong moves charge
(the creature swells) then strike, status moves wobble, a hit flinches and shakes, fainting sinks,
and the send-out pops in. This file is the 3D version of that: one set of clips per body type,
played for any move of that kind. Effects (embers, droplets, rocks...) are added by the viewer
or the game by the move's type.

Clip names (the same for every creature body type; people have their own set, see biped()):
  idle, walk                                   loops
  physical, special, strong_physical, strong_special, boost, boost_guard, status
  hit, faint, send_out
A creature can also carry its own clips named after a move id (for example Coalossus's
coal_swipe); the viewer plays those instead of the shared clip for that move.

Keys: time (s) -> {bone: {"r": (x, y, z) degrees about armature axes, "l": (x, y, z) metres,
"s": (x, y, z)}}. The creature faces -Y, +X is its left, +Z up. A name with * means both sides
(the right side mirrors Y and Z rotation and X location). Locations are written for a creature
whose reference height is 1.0 and scaled by the caller.
"""
import math


def _tail(x=0.0, y=0.0, z=0.0, n=3):
    """Spread a tail curl over the tail chain (base moves least)."""
    share = [0.45, 0.33, 0.22][:n]
    return {f"tail{i + 1}": {"r": (x * s * 2.2, y * s * 2.2, z * s * 2.2)} for i, s in enumerate(share)}


def _merge(*dicts):
    out = {}
    for d in dicts:
        for k, v in d.items():
            out[k] = dict(out.get(k, {}), **v)
    return out


def _wings(pose, wings):
    """Add wing bones to a pose: pose is 'rest', 'up', 'half', 'down', 'back', 'droop', or a flap angle."""
    if not wings:
        return {}
    if isinstance(pose, (int, float)):
        a = float(pose)
        return {"wing_in_*": {"r": (0, -a, 0)}, "wing_out_*": {"r": (0, -a * 0.6, 0)}}
    table = {
        "rest": (0, 0, 0, 0), "up": (0, -32, 0, -18), "half": (0, -14, 0, -8), "down": (0, 22, 0, 14),
        "back": (18, -6, -24, -4), "droop": (6, 26, 10, 20),
    }
    rx, ry, rz, ry2 = table[pose]
    return {"wing_in_*": {"r": (rx, ry, rz)}, "wing_out_*": {"r": (0, ry2, 0)}}


def _quad_hop(W):
    """A frog's hop on the spot: crouch, push off with the back legs, front legs reach, land and squash."""
    return (0.9, [
        (0.0, {}),
        (0.12, _merge({"root": {"l": (0, 0, -0.08), "s": (1.04, 1.04, 0.95)}, "fl_up_*": {"r": (5, 0, 0)},
                       "fl_low_*": {"r": (15, 0, 0)}, "head": {"r": (6, 0, 0)}}, W("half"))),
        (0.3, _merge({"root": {"l": (0, 0, 0.45), "s": (0.96, 0.96, 1.06)}, "spine": {"r": (-10, 0, 0)},
                      "fl_up_*": {"r": (-30, 0, 0)}, "rl_up_*": {"r": (35, 0, 0)}, "rl_low_*": {"r": (-20, 0, 0)},
                      "rl_paw_*": {"r": (20, 0, 0)}, "head": {"r": (-6, 0, 0)}}, _tail(-10), W("up"))),
        (0.45, _merge({"root": {"l": (0, 0, 0.55)}, "spine": {"r": (-2, 0, 0)}, "fl_up_*": {"r": (-20, 0, 0)},
                       "rl_up_*": {"r": (15, 0, 0)}}, W("half"))),
        (0.62, _merge({"root": {"l": (0, 0, 0.02)}, "spine": {"r": (6, 0, 0)}, "fl_up_*": {"r": (-8, 0, 0)},
                       "fl_low_*": {"r": (10, 0, 0)}, "head": {"r": (8, 0, 0)}}, _tail(8), W("down"))),
        (0.72, _merge({"root": {"l": (0, 0, -0.06), "s": (1.07, 1.07, 0.9)}, "fl_low_*": {"r": (18, 0, 0)},
                       "head": {"r": (6, 0, 0)}}, W("half"))),
        (0.9, {}),
    ])


# ---------------------------------------------------------------- four-legged (quad)
def quad(wings=False, gait="trot"):
    """Four-legged clips (Coalossus, Drizzlon, Lunarion...). Locations are per 1.0 of shoulder height.

    gait: "trot" (default), "plod" (slow, short steps: turtles) or "hop" (frogs: the walk is a hop)."""
    W = lambda p: _wings(p, wings)  # noqa: E731
    M = {}
    M["idle"] = (3.0, [
        (0.0, _merge(W(4))),
        (0.75, _merge(_tail(0, 0, 9), {"head": {"r": (-1.5, 0, 1)}}, W(-6))),
        (1.5, _merge({"root": {"l": (0, 0, -0.014)}, "spine": {"r": (1.5, 0, 0)}, "head": {"r": (-3, 0, 0)},
                      "fl_up_*": {"r": (-1.0, 0, 0)}, "rl_up_*": {"r": (1.0, 0, 0)}}, W(4))),
        (2.25, _merge(_tail(0, 0, -9), {"head": {"r": (-1.5, 0, -1)}}, W(-6))),
        (3.0, _merge(W(4))),
    ])
    if gait == "hop":
        M["walk"] = _quad_hop(W)
    else:
        dur, swing, knee, paw, bob, sway = (1.8, 12, 20, 12, 0.012, 4) if gait == "plod" else (1.1, 20, 32, 18, 0.03, 2.5)
        keys = []
        for i in range(9):
            t = i / 8.0
            k = {}
            for leg, ph in (("fl", 0.0), ("rl", 0.5)):
                for side, off in (("L", 0.0), ("R", 0.5)):
                    p = 2 * math.pi * (t + ph + off)
                    lift = max(0.0, math.cos(p))
                    k[f"{leg}_up_{side}"] = {"r": (-swing * math.sin(p), 0, 0)}
                    k[f"{leg}_low_{side}"] = {"r": (knee * lift, 0, 0)}
                    k[f"{leg}_paw_{side}"] = {"r": (-paw * lift, 0, 0)}
            b = abs(math.sin(2 * math.pi * t * 2))
            k = _merge(k, {"root": {"l": (0, 0, bob * b)}, "spine": {"r": (0, sway * math.sin(2 * math.pi * t), 0)},
                           "hips": {"r": (0, -sway * math.sin(2 * math.pi * t), 0)},
                           "head": {"r": (-2 * b, 0, 2 * math.sin(2 * math.pi * t))}},
                       _tail(0, 0, 12 * math.sin(2 * math.pi * t)), W(8 * math.sin(2 * math.pi * t * 2)))
            keys.append((t * dur, k))
        M["walk"] = (dur, keys)
    M["physical"] = (1.1, [  # Tackle: crouch, lunge, back
        (0.0, {}),
        (0.3, _merge({"root": {"l": (0, 0.19, -0.07)}, "spine": {"r": (6, 0, 0)}, "head": {"r": (8, 0, 0)},
                      "fl_up_*": {"r": (8, 0, 0)}, "rl_up_*": {"r": (-6, 0, 0)}}, W("half"))),
        (0.45, _merge({"root": {"l": (0, -0.65, 0.07)}, "spine": {"r": (-4, 0, 0)}, "head": {"r": (-8, 0, 0)},
                       "fl_up_*": {"r": (-26, 0, 0)}, "fl_low_*": {"r": (10, 0, 0)}, "rl_up_*": {"r": (22, 0, 0)}}, W("back"))),
        (0.6, _merge({"root": {"l": (0, -0.6, 0.02)}, "fl_up_*": {"r": (-20, 0, 0)}, "rl_up_*": {"r": (18, 0, 0)}}, W("back"))),
        (1.1, {}),
    ])
    M["special"] = (1.1, [  # a stream from the mouth: small squash, head thrust
        (0.0, {}),
        (0.18, _merge({"root": {"l": (0, 0.04, -0.05)}, "spine": {"r": (4, 0, 0)}, "head": {"r": (12, 0, 0)},
                       "neck": {"r": (6, 0, 0)}}, W("half"))),
        (0.32, _merge({"root": {"l": (0, -0.1, 0.01)}, "spine": {"r": (-3, 0, 0)}, "head": {"r": (-14, 0, 0)},
                       "neck": {"r": (-8, 0, 0)}}, W("up"))),
        (0.65, _merge({"root": {"l": (0, -0.07, 0)}, "head": {"r": (-10, 0, 0)}, "neck": {"r": (-6, 0, 0)}}, W("half"))),
        (1.1, {}),
    ])
    high = {"hips": {"r": (-40, 0, 0)}, "rl_up_*": {"r": (40, 0, 0)}, "rl_paw_*": {"r": (-6, 0, 0)},
            "fl_up_*": {"r": (-34, 0, 0)}, "fl_low_*": {"r": (48, 0, 0)}, "head": {"r": (14, 0, 0)},
            "spine": {"r": (-4, 0, 0)}, "root": {"l": (0, 0.07, 0.05)}}
    M["strong_physical"] = (2.0, [  # rear up high, hold, slam the front paws (Quake Stomp, Body Slam)
        (0.0, {}),
        (0.5, _merge(high, _tail(-12), W("up"))),
        (0.82, _merge(high, {"hips": {"r": (-43, 0, 0)}, "rl_up_*": {"r": (43, 0, 0)}}, _tail(-12), W("up"))),
        (1.0, _merge({"hips": {"r": (4, 0, 0)}, "fl_up_*": {"r": (-4, 0, 0)}, "fl_low_*": {"r": (6, 0, 0)},
                      "root": {"l": (0, -0.05, -0.07)}, "head": {"r": (8, 0, 0)}}, _tail(8), W("down"))),
        (1.2, _merge({"root": {"l": (0, -0.035, 0.01)}, "head": {"r": (-4, 0, 0)}}, W("half"))),
        (2.0, {}),
    ])
    M["strong_special"] = (2.1, [  # charge low and swell, rear back, burst forward (Flare Burst)
        (0.0, {}),
        (0.62, _merge({"root": {"l": (0, 0.06, -0.1), "s": (1.06, 1.06, 1.06)}, "spine": {"r": (6, 0, 0)}, "head": {"r": (14, 0, 0)},
                       "fl_up_*": {"r": (6, 0, 0)}, "fl_low_*": {"r": (14, 0, 0)}, "rl_up_*": {"r": (-6, 0, 0)},
                       "rl_low_*": {"r": (12, 0, 0)}}, W("up"))),
        (0.78, _merge({"root": {"l": (0, 0.14, 0.02), "s": (1.08, 1.08, 1.08)}, "hips": {"r": (-8, 0, 0)},
                       "rl_up_*": {"r": (8, 0, 0)}, "head": {"r": (-26, 0, 0)}, "neck": {"r": (-10, 0, 0)}}, W("up"))),
        (0.92, _merge({"root": {"l": (0, -0.45, 0.02), "s": (1, 1, 1)}, "spine": {"r": (-6, 0, 0)}, "head": {"r": (-12, 0, 0)},
                       "neck": {"r": (-6, 0, 0)}, "fl_up_*": {"r": (-22, 0, 0)}, "rl_up_*": {"r": (20, 0, 0)}}, W("down"))),
        (1.35, _merge({"root": {"l": (0, -0.36, 0)}, "head": {"r": (-8, 0, 0)}, "fl_up_*": {"r": (-16, 0, 0)},
                       "rl_up_*": {"r": (14, 0, 0)}}, W("half"))),
        (2.1, {}),
    ])
    M["boost"] = (1.6, [  # chest out, roar to the sky (Rally)
        (0.0, {}),
        (0.35, _merge({"head": {"r": (-34, 0, 0)}, "neck": {"r": (-12, 0, 0)}, "spine": {"r": (-8, 0, 0)},
                       "fl_up_*": {"r": (-8, 0, 0)}, "root": {"l": (0, 0, 0.035)}}, _tail(-14), W("up"))),
        (0.6, _merge({"head": {"r": (-36, 0, 3)}, "neck": {"r": (-12, 0, 0)}, "spine": {"r": (-8, 0, 0)}, "root": {"l": (0, 0, 0.035)}}, W("up"))),
        (0.8, _merge({"head": {"r": (-34, 0, -3)}, "neck": {"r": (-12, 0, 0)}, "spine": {"r": (-8, 0, 0)}, "root": {"l": (0, 0, 0.035)}}, W("up"))),
        (1.0, _merge({"head": {"r": (-32, 0, 0)}, "neck": {"r": (-10, 0, 0)}, "spine": {"r": (-7, 0, 0)}, "root": {"l": (0, 0, 0.025)}}, W("half"))),
        (1.6, {}),
    ])
    M["boost_guard"] = (1.5, [  # hunker down with legs braced (Guard Up)
        (0.0, {}),
        (0.35, _merge({"root": {"l": (0, 0, -0.12)}, "fl_up_*": {"r": (4, 0, 8)}, "rl_up_*": {"r": (-4, 0, -8)},
                       "fl_low_*": {"r": (18, 0, 0)}, "rl_low_*": {"r": (16, 0, 0)}, "head": {"r": (16, 0, 0)},
                       "neck": {"r": (8, 0, 0)}, "spine": {"r": (3, 0, 0)}}, W("droop"))),
        (1.05, _merge({"root": {"l": (0, 0, -0.12)}, "fl_low_*": {"r": (18, 0, 0)}, "rl_low_*": {"r": (16, 0, 0)},
                       "head": {"r": (16, 0, 0)}, "neck": {"r": (8, 0, 0)}}, W("droop"))),
        (1.5, {}),
    ])
    keys = [(0.0, {})]
    for i in range(8):  # status on the foe (Growl, Soak, Dazzle...): shakes, then thrusts its head at them
        sgn = 1 if i % 2 else -1
        keys.append((0.2 + i * 0.09, _merge({"root": {"l": (0.035 * sgn, 0, -0.02)}, "spine": {"r": (3, 3 * sgn, 0)},
                                             "head": {"r": (6, 0, 0)}}, W(10 * sgn))))
    keys += [(1.0, _merge({"spine": {"r": (-4, 0, 0)}, "head": {"r": (-10, 0, 0)}, "neck": {"r": (-6, 0, 0)}}, W("up"))), (1.5, {})]
    M["status"] = (1.5, keys)
    M["hit"] = (0.7, [
        (0.0, {}),
        (0.08, _merge({"root": {"l": (0, 0.1, 0.01)}, "spine": {"r": (-5, 0, 0)}, "head": {"r": (-12, 0, 0)}}, W("up"))),
        (0.18, {"root": {"l": (0.045, 0.08, 0)}, "head": {"r": (-8, 0, 0)}}),
        (0.28, _merge({"root": {"l": (-0.045, 0.07, 0)}, "head": {"r": (-6, 0, 0)}}, W("half"))),
        (0.38, {"root": {"l": (0.045, 0.05, 0)}}),
        (0.48, {"root": {"l": (-0.035, 0.02, 0)}}),
        (0.7, {}),
    ])
    fallen = {"fl_up_*": {"r": (30, 0, 8)}, "fl_low_*": {"r": (60, 0, 0)}, "rl_up_*": {"r": (-20, 0, -6)},
              "rl_low_*": {"r": (50, 0, 0)}, "head": {"r": (34, 0, 10)}, "neck": {"r": (14, 0, 0)},
              "root": {"r": (0, 18, 0), "l": (0, 0, -0.4)}}
    M["faint"] = (1.8, [
        (0.0, {}),
        (0.4, _merge({"fl_up_*": {"r": (18, 0, 0)}, "fl_low_*": {"r": (38, 0, 0)}, "rl_low_*": {"r": (25, 0, 0)},
                      "head": {"r": (24, 0, 0)}, "neck": {"r": (10, 0, 0)}, "root": {"l": (0, 0, -0.19)}}, _tail(20), W("droop"))),
        (1.0, _merge(fallen, _tail(28), W("droop"))),
        (1.8, _merge(fallen, {"head": {"r": (36, 0, 12)}, "root": {"r": (0, 20, 0), "l": (0, 0, -0.42)}}, _tail(30), W("droop"))),
    ])
    M["send_out"] = (0.9, [
        (0.0, _merge({"root": {"s": (0.02, 0.02, 0.02), "l": (0, 0, 0.7)}}, W("up"))),
        (0.32, {"root": {"s": (1.08, 1.08, 1.08), "l": (0, 0, 0)}}),
        (0.45, _merge({"root": {"s": (1.12, 1.12, 0.84)}}, W("down"))),
        (0.62, _merge({"root": {"s": (0.95, 0.95, 1.08), "l": (0, 0, 0.06)}}, W("up"))),
        (0.9, {}),
    ])
    return M


# ---------------------------------------------------------------- round (Mushling and other blob-shaped creatures)
def round_(gait="waddle"):
    """Round-body clips: squash and stretch, hops, little arms and feet. Locations per 1.0 of height.

    Also used for creatures that sit up on their hind feet (Clovermouse, Puffmunk), which can have a
    tail (tail1..3). gait: "waddle" (default) or "hop" (the walk is a bunny hop)."""
    M = {}
    M["idle"] = (2.4, [
        (0.0, {}),
        (0.6, _merge({"body": {"s": (1.03, 1.03, 0.96)}, "head": {"r": (0, 2.5, 0)}}, _tail(0, 0, 8))),
        (1.2, {"body": {"s": (0.98, 0.98, 1.03)}, "head": {"r": (-2, 0, 0)}, "arm_up_*": {"r": (-4, 0, 0)}}),
        (1.8, _merge({"body": {"s": (1.03, 1.03, 0.96)}, "head": {"r": (0, -2.5, 0)}}, _tail(0, 0, -8))),
        (2.4, {}),
    ])
    if gait == "hop":
        M["walk"] = (0.8, [  # a bunny hop on the spot: squash, spring up with the feet tucked, land
            (0.0, {}),
            (0.12, _merge({"root": {"s": (1.08, 1.08, 0.88)}, "head": {"r": (5, 0, 0)}}, _tail(-6))),
            (0.3, _merge({"root": {"l": (0, 0, 0.3), "s": (0.94, 0.94, 1.08)}, "foot_*": {"l": (0, 0.03, 0.03)},
                          "arm_up_*": {"r": (-15, 0, 0)}, "head": {"r": (-4, 0, 0)}}, _tail(10))),
            (0.45, _merge({"root": {"l": (0, 0, 0.34)}, "foot_*": {"l": (0, 0.02, 0.02)}}, _tail(6))),
            (0.62, _merge({"root": {"l": (0, 0, 0.0), "s": (1.1, 1.1, 0.86)}, "head": {"r": (6, 0, 0)}}, _tail(-8))),
            (0.8, {}),
        ])
    else:
        keys = []
        for i in range(9):  # a waddle: rock side to side, feet step in turn
            t = i / 8.0
            p = 2 * math.pi * t
            s = math.sin(p)
            keys.append((t * 0.9, _merge({
                "root": {"r": (0, 7 * s, 0), "l": (0, 0, 0.04 * abs(math.sin(2 * p)))},
                "head": {"r": (0, -4 * s, 0)},
                "foot_L": {"l": (0, -0.07 * max(0.0, math.cos(p)), 0.06 * max(0.0, math.cos(p)))},
                "foot_R": {"l": (0, -0.07 * max(0.0, -math.cos(p)), 0.06 * max(0.0, -math.cos(p)))},
                "arm_up_*": {"r": (8 * s, 0, 0)},
            }, _tail(0, 0, 10 * s))))
        M["walk"] = (0.9, keys)
    M["physical"] = (1.1, [  # crouch, hop forward into the foe, bounce back
        (0.0, {}),
        (0.25, {"root": {"s": (1.12, 1.12, 0.82)}, "head": {"r": (8, 0, 0)}}),
        (0.42, _merge({"root": {"l": (0, -0.55, 0.28), "s": (0.92, 0.92, 1.12), "r": (-12, 0, 0)}, "arm_up_*": {"r": (-30, 0, 0)}}, _tail(12))),
        (0.55, {"root": {"l": (0, -0.7, 0.0), "s": (1.1, 1.1, 0.88)}, "head": {"r": (10, 0, 0)}}),
        (0.75, {"root": {"l": (0, -0.3, 0.12)}}),
        (1.1, {}),
    ])
    M["special"] = (1.1, [  # squash, then stretch forward with a shake of the head (spores / a stream)
        (0.0, {}),
        (0.2, {"root": {"s": (1.1, 1.1, 0.86)}, "head": {"r": (10, 0, 0)}}),
        (0.36, {"root": {"s": (0.94, 0.94, 1.1), "l": (0, -0.08, 0)}, "head": {"r": (-14, 0, 0)}, "arm_up_*": {"r": (-40, 0, 0)}}),
        (0.5, {"head": {"r": (-10, 6, 0)}, "arm_up_*": {"r": (-40, 0, 0)}}),
        (0.64, {"head": {"r": (-10, -6, 0)}, "arm_up_*": {"r": (-36, 0, 0)}}),
        (1.1, {}),
    ])
    M["strong_physical"] = (1.8, [  # big jump and a slam (Body Slam)
        (0.0, {}),
        (0.4, {"root": {"s": (1.18, 1.18, 0.74)}, "head": {"r": (10, 0, 0)}}),
        (0.75, {"root": {"l": (0, -0.4, 0.9), "s": (0.9, 0.9, 1.16), "r": (-10, 0, 0)}, "arm_up_*": {"r": (-70, 0, 0)}}),
        (1.0, {"root": {"l": (0, -0.75, 0.0), "s": (1.26, 1.26, 0.7)}}),
        (1.2, {"root": {"l": (0, -0.55, 0.06), "s": (0.95, 0.95, 1.06)}}),
        (1.8, {}),
    ])
    M["strong_special"] = (2.0, [  # charge, shaking and swelling, then burst
        (0.0, {}),
        (0.25, {"root": {"s": (1.04, 1.04, 1.0), "l": (0.02, 0, 0)}}),
        (0.4, {"root": {"s": (1.08, 1.08, 1.02), "l": (-0.02, 0, 0)}}),
        (0.55, {"root": {"s": (1.12, 1.12, 1.04), "l": (0.02, 0, 0)}, "head": {"r": (8, 0, 0)}}),
        (0.75, {"root": {"s": (1.16, 1.16, 1.0), "l": (-0.02, 0, 0)}, "head": {"r": (12, 0, 0)}}),
        (0.92, {"root": {"s": (0.9, 0.9, 1.2), "l": (0, -0.12, 0.05)}, "head": {"r": (-18, 0, 0)}, "arm_up_*": {"r": (-80, 0, 0)}}),
        (1.3, {"root": {"l": (0, -0.08, 0)}, "arm_up_*": {"r": (-50, 0, 0)}}),
        (2.0, {}),
    ])
    M["boost"] = (1.4, [  # arms up, stretch tall, bounce
        (0.0, {}),
        (0.3, _merge({"root": {"s": (0.94, 0.94, 1.12), "l": (0, 0, 0.12)}, "arm_up_*": {"r": (-110, 0, 0)}, "head": {"r": (-8, 0, 0)}}, _tail(0, 0, 14))),
        (0.55, _merge({"root": {"s": (1.08, 1.08, 0.9)}, "arm_up_*": {"r": (-100, 0, 0)}}, _tail(0, 0, -14))),
        (0.8, _merge({"root": {"s": (0.96, 0.96, 1.08), "l": (0, 0, 0.08)}, "arm_up_*": {"r": (-110, 0, 0)}}, _tail(0, 0, 10))),
        (1.4, {}),
    ])
    M["boost_guard"] = (1.4, [  # duck under the cap, hold
        (0.0, {}),
        (0.3, {"root": {"s": (1.1, 1.1, 0.82)}, "head": {"r": (6, 0, 0)}, "arm_up_*": {"r": (20, 0, 0)}}),
        (1.0, {"root": {"s": (1.1, 1.1, 0.82)}, "head": {"r": (6, 0, 0)}, "arm_up_*": {"r": (20, 0, 0)}}),
        (1.4, {}),
    ])
    keys = [(0.0, {})]
    for i in range(8):  # status on the foe: wiggle, then lean in
        sgn = 1 if i % 2 else -1
        keys.append((0.15 + i * 0.09, _merge({"root": {"r": (0, 9 * sgn, 0)}, "head": {"r": (0, 5 * sgn, 0)}}, _tail(0, 0, 12 * sgn))))
    keys += [(1.0, {"root": {"r": (-10, 0, 0), "l": (0, -0.06, 0)}, "head": {"r": (-8, 0, 0)}, "arm_up_*": {"r": (-50, 0, 0)}}), (1.4, {})]
    M["status"] = (1.4, keys)
    M["hit"] = (0.7, [
        (0.0, {}),
        (0.08, {"root": {"l": (0, 0.14, 0.02), "s": (0.9, 0.9, 1.1), "r": (10, 0, 0)}}),
        (0.18, _merge({"root": {"l": (0.05, 0.1, 0), "s": (1.08, 1.08, 0.92)}}, _tail(0, 0, 12))),
        (0.28, _merge({"root": {"l": (-0.05, 0.08, 0)}}, _tail(0, 0, -12))),
        (0.38, {"root": {"l": (0.04, 0.05, 0)}}),
        (0.7, {}),
    ])
    M["faint"] = (1.6, [
        (0.0, {}),
        (0.35, {"root": {"s": (1.1, 1.1, 0.85)}, "head": {"r": (12, 0, 0)}}),
        (0.9, {"root": {"r": (75, 0, 10), "l": (0, 0.18, 0.05)}, "head": {"r": (10, 0, 0)}, "arm_up_*": {"r": (-40, 0, 0)}}),
        (1.6, _merge({"root": {"r": (82, 0, 12), "l": (0, 0.22, 0.02)}, "head": {"r": (14, 0, 0)}, "arm_up_*": {"r": (-50, 0, 0)}}, _tail(-10, 0, 10))),
    ])
    M["send_out"] = (0.9, [
        (0.0, {"root": {"s": (0.02, 0.02, 0.02), "l": (0, 0, 0.7)}}),
        (0.32, {"root": {"s": (1.1, 1.1, 1.1), "l": (0, 0, 0)}}),
        (0.45, {"root": {"s": (1.16, 1.16, 0.8)}}),
        (0.62, {"root": {"s": (0.94, 0.94, 1.1), "l": (0, 0, 0.08)}}),
        (0.9, {}),
    ])
    return M


# ---------------------------------------------------------------- birds (two legs, wings spread)
def bird():
    """Two-legged birds with wings held out (Scarecrowl). The same clip names as every creature.
    Locations are per 1.0 of height. Wings use the same poses as the four-legged plan's wings."""
    W = lambda p: _wings(p, True)  # noqa: E731
    M = {}
    M["idle"] = (2.4, [
        (0.0, W(3)),
        (0.6, _merge({"chest": {"r": (-1.5, 0, 0)}, "head": {"r": (0, 0, 6)}}, _tail(0, 0, 6), W(-5))),
        (1.2, _merge({"root": {"l": (0, 0, -0.006)}, "head": {"r": (4, 0, 0)}}, W(3))),
        (1.8, _merge({"chest": {"r": (-1.5, 0, 0)}, "head": {"r": (0, 0, -6)}}, _tail(0, 0, -6), W(-5))),
        (2.4, W(3)),
    ])
    keys = []
    for i in range(9):  # a waddling walk: legs step in turn, the body rolls, the head bobs
        t = i / 8.0
        p = 2 * math.pi * t
        sw_l, sw_r = max(0.0, math.cos(p)), max(0.0, -math.cos(p))
        keys.append((t * 0.8, _merge({
            "thigh_L": {"r": (-20 * math.sin(p), 0, 0)}, "thigh_R": {"r": (20 * math.sin(p), 0, 0)},
            "shin_L": {"r": (30 * sw_l, 0, 0)}, "shin_R": {"r": (30 * sw_r, 0, 0)},
            "foot_L": {"r": (-15 * sw_l, 0, 0)}, "foot_R": {"r": (-15 * sw_r, 0, 0)},
            "hips": {"r": (0, 6 * math.sin(p), 0)}, "root": {"l": (0, 0, 0.012 * math.cos(2 * p))},
            "head": {"r": (6 * math.sin(2 * p), 0, 0)}}, _tail(0, 0, 8 * math.sin(p)), W(8 * math.sin(2 * p)))))
    M["walk"] = (0.8, keys)
    M["physical"] = (1.1, [
        (0.0, {}),
        (0.28, _merge({"root": {"l": (0, 0.1, -0.05)}, "chest": {"r": (-8, 0, 0)}, "head": {"r": (-6, 0, 0)},
                       "thigh_L": {"r": (-10, 0, 0)}, "thigh_R": {"r": (-10, 0, 0)}, "shin_L": {"r": (25, 0, 0)}, "shin_R": {"r": (25, 0, 0)}}, W("up"))),
        (0.45, _merge({"root": {"l": (0, -0.5, 0.08)}, "chest": {"r": (14, 0, 0)}, "head": {"r": (14, 0, 0)}}, W("back"))),
        (0.62, _merge({"root": {"l": (0, -0.45, 0.02)}, "chest": {"r": (10, 0, 0)}}, W("back"))),
        (1.1, {}),
    ])
    M["special"] = (1.1, [
        (0.0, {}),
        (0.2, _merge({"chest": {"r": (-6, 0, 0)}, "head": {"r": (-12, 0, 0)}, "neck": {"r": (-6, 0, 0)}}, W("half"))),
        (0.36, _merge({"root": {"l": (0, -0.08, 0)}, "chest": {"r": (8, 0, 0)}, "head": {"r": (16, 0, 0)}, "neck": {"r": (8, 0, 0)}}, W("up"))),
        (0.7, _merge({"root": {"l": (0, -0.06, 0)}, "head": {"r": (12, 0, 0)}}, W("half"))),
        (1.1, {}),
    ])
    crouch = {"thigh_L": {"r": (-25, 0, 0)}, "thigh_R": {"r": (-25, 0, 0)}, "shin_L": {"r": (45, 0, 0)}, "shin_R": {"r": (45, 0, 0)},
              "foot_L": {"r": (-20, 0, 0)}, "foot_R": {"r": (-20, 0, 0)}, "root": {"l": (0, 0, -0.06)}}
    M["strong_physical"] = (1.9, [  # leap up flapping, then dive forward onto the foe
        (0.0, {}),
        (0.3, _merge(crouch, W("up"))),
        (0.55, _merge({"root": {"l": (0, 0.05, 0.45)}}, W("down"))),
        (0.75, _merge({"root": {"l": (0, 0.05, 0.6)}}, W("up"))),
        (0.95, _merge({"root": {"l": (0, 0, 0.55)}, "chest": {"r": (20, 0, 0)}}, W("down"))),
        (1.15, _merge({"root": {"l": (0, -0.6, 0.0)}, "chest": {"r": (24, 0, 0)}, "head": {"r": (10, 0, 0)}}, W("back"))),
        (1.35, _merge(crouch, {"root": {"l": (0, -0.5, -0.04)}}, W("half"))),
        (1.9, {}),
    ])
    M["strong_special"] = (2.0, [  # wings spread high, swell, then burst forward
        (0.0, {}),
        (0.55, _merge({"root": {"s": (1.06, 1.06, 1.06)}, "chest": {"r": (-12, 0, 0)}, "head": {"r": (-16, 0, 0)}}, W("up"))),
        (0.8, _merge({"root": {"s": (1.1, 1.1, 1.1), "l": (0, 0.06, 0)}, "chest": {"r": (-16, 0, 0)}, "head": {"r": (-20, 0, 0)}}, W(-40))),
        (0.95, _merge({"root": {"s": (1, 1, 1), "l": (0, -0.3, 0.02)}, "chest": {"r": (16, 0, 0)}, "head": {"r": (14, 0, 0)}}, W("down"))),
        (1.35, _merge({"root": {"l": (0, -0.22, 0)}, "chest": {"r": (8, 0, 0)}}, W("half"))),
        (2.0, {}),
    ])
    M["boost"] = (1.5, [
        (0.0, {}),
        (0.35, _merge({"chest": {"r": (-12, 0, 0)}, "head": {"r": (-22, 0, 0)}, "root": {"l": (0, 0, 0.03)}}, _tail(-10), W("up"))),
        (0.6, _merge({"chest": {"r": (-12, 0, 0)}, "head": {"r": (-22, 0, 4)}, "root": {"l": (0, 0, 0.03)}}, W(-38))),
        (0.85, _merge({"chest": {"r": (-12, 0, 0)}, "head": {"r": (-22, 0, -4)}, "root": {"l": (0, 0, 0.03)}}, W("up"))),
        (1.5, {}),
    ])
    wrap = {"wing_in_*": {"r": (0, 12, -55)}, "wing_out_*": {"r": (0, 8, -35)}}
    M["boost_guard"] = (1.4, [(0.0, {}), (0.35, _merge(crouch, wrap, {"head": {"r": (14, 0, 0)}})), (1.0, _merge(crouch, wrap, {"head": {"r": (14, 0, 0)}})), (1.4, {})])
    keys = [(0.0, {})]
    for i in range(8):
        sgn = 1 if i % 2 else -1
        keys.append((0.18 + i * 0.09, _merge({"root": {"l": (0.03 * sgn, 0, 0)}, "chest": {"r": (0, 4 * sgn, 0)}, "head": {"r": (0, 0, 8 * sgn)}}, W(14 * sgn))))
    keys += [(1.0, _merge({"chest": {"r": (8, 0, 0)}, "head": {"r": (12, 0, 0)}}, W("up"))), (1.5, {})]
    M["status"] = (1.5, keys)
    M["hit"] = (0.7, [
        (0.0, {}),
        (0.08, _merge({"root": {"l": (0, 0.1, 0.01)}, "chest": {"r": (-10, 0, 0)}, "head": {"r": (-12, 0, 0)}}, W("up"))),
        (0.18, {"root": {"l": (0.04, 0.08, 0)}}), (0.28, _merge({"root": {"l": (-0.04, 0.06, 0)}}, W("half"))),
        (0.38, {"root": {"l": (0.03, 0.04, 0)}}), (0.7, {}),
    ])
    fallen = _merge({"root": {"r": (0, 70, 0), "l": (0.1, 0, -0.1)}, "head": {"r": (20, 0, 0)}}, crouch, W("droop"))
    M["faint"] = (1.8, [(0.0, {}), (0.45, _merge(crouch, {"head": {"r": (24, 0, 0)}}, W("droop"))), (1.1, fallen), (1.8, _merge(fallen, {"head": {"r": (26, 0, 0)}}))])
    M["send_out"] = (0.9, [
        (0.0, _merge({"root": {"s": (0.02, 0.02, 0.02), "l": (0, 0, 0.7)}}, W("up"))),
        (0.32, {"root": {"s": (1.08, 1.08, 1.08), "l": (0, 0, 0)}}),
        (0.45, _merge({"root": {"s": (1.12, 1.12, 0.84)}}, W("down"))),
        (0.62, _merge({"root": {"s": (0.95, 0.95, 1.08), "l": (0, 0, 0.06)}}, W("up"))),
        (0.9, {}),
    ])
    return M


# ---------------------------------------------------------------- people (biped)
def biped():
    """Two-legged clips for people. Locations are per 1.0 of height. The pictures' A-pose is the rest pose;
    most clips first relax the arms down to the sides (REL). Rotations are about the armature axes: X
    negative swings a limb forward, Y raises the left arm when negative (the right arm when positive,
    written out per side), Z turns the body."""
    import math as m
    REL_L, REL_R = (3, 20, 0), (3, -20, 0)

    def arms(l=(0, 0, 0), r=(0, 0, 0), fl=-10, fr=-10):
        return {"upper_arm_L": {"r": (REL_L[0] + l[0], REL_L[1] + l[1], REL_L[2] + l[2])},
                "upper_arm_R": {"r": (REL_R[0] + r[0], REL_R[1] + r[1], REL_R[2] + r[2])},
                "forearm_L": {"r": (fl, 0, 0)}, "forearm_R": {"r": (fr, 0, 0)}}

    M = {}
    M["idle"] = (3.0, [
        (0.0, arms()),
        (0.75, _merge(arms(), {"chest": {"r": (-1.5, 0, 0)}, "head": {"r": (0, 0, 3)}, "pony1": {"r": (0, 0, 3)}})),
        (1.5, _merge(arms(l=(-2, 0, 0), r=(-2, 0, 0)), {"root": {"l": (0.004, 0, -0.003)}, "head": {"r": (2, 0, 0)}})),
        (2.25, _merge(arms(), {"chest": {"r": (-1.5, 0, 0)}, "head": {"r": (0, 0, -3)}, "pony1": {"r": (0, 0, -3)}})),
        (3.0, arms()),
    ])

    def cycle(dur, thigh, knee, arm, fore, bob, lean, n=9):
        keys = []
        for i in range(n):
            t = i / (n - 1)
            p = 2 * m.pi * t
            sw_l, sw_r = max(0.0, m.cos(p)), max(0.0, -m.cos(p))
            k = arms(l=(arm * m.sin(p), 0, 0), r=(-arm * m.sin(p), 0, 0), fl=fore, fr=fore)
            k = _merge(k, {
                "thigh_L": {"r": (-thigh * m.sin(p), 0, 0)}, "thigh_R": {"r": (thigh * m.sin(p), 0, 0)},
                "shin_L": {"r": (knee * sw_l ** 1.5, 0, 0)}, "shin_R": {"r": (knee * sw_r ** 1.5, 0, 0)},
                "foot_L": {"r": (-12 * sw_l, 0, 0)}, "foot_R": {"r": (-12 * sw_r, 0, 0)},
                "root": {"l": (0.008 * m.sin(p), 0, bob * m.cos(2 * p))},
                "hips": {"r": (0, 0, 6 * m.sin(p))}, "spine": {"r": (lean, 0, -3 * m.sin(p))},
                "chest": {"r": (0, 0, -6 * m.sin(p))}, "head": {"r": (-lean * 0.6, 0, 2 * m.sin(p))},
                "pony1": {"r": (6 * m.sin(2 * p), 0, 10 * m.sin(p))}, "pony2": {"r": (5 * m.sin(2 * p), 0, 8 * m.sin(p - 0.6))},
            })
            keys.append((t * dur, k))
        return (dur, keys)

    M["walk"] = cycle(1.0, 22, 38, 18, -14, 0.010, 2)
    M["run"] = cycle(0.66, 38, 75, 35, -70, 0.030, 12)
    M["talk"] = (2.0, [
        (0.0, arms()),
        (0.35, _merge(arms(r=(-22, 8, 0), fr=-62), {"head": {"r": (3, 0, 0)}, "chest": {"r": (0, 0, 3)}})),
        (0.7, _merge(arms(r=(-26, 10, 0), fr=-72), {"head": {"r": (-2, 3, 0)}, "chest": {"r": (0, 0, 4)}})),
        (1.05, _merge(arms(r=(-20, 6, 0), fr=-58), {"head": {"r": (4, -2, 0)}, "chest": {"r": (0, 0, 2)}})),
        (1.4, _merge(arms(r=(-24, 9, 0), fr=-68), {"head": {"r": (0, 2, 0)}})),
        (2.0, arms()),
    ])
    up_r = lambda y, x=0: {"upper_arm_R": {"r": (x, y, 0)}}  # noqa: E731  raised right arm (rest A-pose + y)
    M["wave"] = (1.8, [
        (0.0, arms()),
        (0.3, _merge(arms(), up_r(105), {"forearm_R": {"r": (0, 25, 0)}, "head": {"r": (0, -4, 0)}, "chest": {"r": (0, -3, 0)}})),
        (0.55, _merge(arms(), up_r(110), {"forearm_R": {"r": (0, 45, 0)}, "head": {"r": (0, -4, 0)}, "chest": {"r": (0, -3, 0)}})),
        (0.8, _merge(arms(), up_r(108), {"forearm_R": {"r": (0, 12, 0)}, "head": {"r": (0, -4, 0)}, "chest": {"r": (0, -3, 0)}})),
        (1.05, _merge(arms(), up_r(110), {"forearm_R": {"r": (0, 45, 0)}, "head": {"r": (0, -4, 0)}, "chest": {"r": (0, -3, 0)}})),
        (1.3, _merge(arms(), up_r(105), {"forearm_R": {"r": (0, 20, 0)}})),
        (1.8, arms()),
    ])
    M["throw"] = (1.3, [  # overhand cube throw with the right hand; the cube leaves the hand at 0.5 s
        (0.0, arms()),
        (0.28, _merge(arms(l=(-40, 0, 0)), {"upper_arm_R": {"r": (38, 92, 0)}, "forearm_R": {"r": (-95, 0, 0)},
                      "chest": {"r": (0, 0, -18)}, "spine": {"r": (-4, 0, -6)}, "hips": {"r": (0, 0, -6)},
                      "thigh_L": {"r": (-16, 0, 0)}, "shin_L": {"r": (12, 0, 0)}, "head": {"r": (0, 0, 10)}})),
        (0.5, _merge(arms(l=(25, 10, 0)), {"upper_arm_R": {"r": (-80, 40, 0)}, "forearm_R": {"r": (-18, 0, 0)},
                     "chest": {"r": (0, 0, 16)}, "spine": {"r": (10, 0, 6)}, "hips": {"r": (0, 0, 6)},
                     "thigh_L": {"r": (-24, 0, 0)}, "shin_L": {"r": (6, 0, 0)}, "thigh_R": {"r": (14, 0, 0)},
                     "root": {"l": (0, -0.04, -0.01)}, "head": {"r": (4, 0, -8)}})),
        (0.75, _merge(arms(l=(20, 5, 0)), {"upper_arm_R": {"r": (-48, 12, 0)}, "forearm_R": {"r": (-30, 0, 0)},
                      "chest": {"r": (0, 0, 22)}, "spine": {"r": (14, 0, 6)}, "hips": {"r": (0, 0, 6)},
                      "thigh_L": {"r": (-20, 0, 0)}, "shin_L": {"r": (8, 0, 0)}, "thigh_R": {"r": (12, 0, 0)},
                      "root": {"l": (0, -0.05, -0.012)}})),
        (1.3, arms()),
    ])
    crouch = {"root": {"l": (0, 0, -0.035)}, "thigh_L": {"r": (-25, 0, 0)}, "thigh_R": {"r": (-25, 0, 0)},
              "shin_L": {"r": (45, 0, 0)}, "shin_R": {"r": (45, 0, 0)}, "foot_L": {"r": (-20, 0, 0)}, "foot_R": {"r": (-20, 0, 0)}}
    arms_up = {"upper_arm_L": {"r": (-10, -125, 0)}, "upper_arm_R": {"r": (-10, 125, 0)},
               "forearm_L": {"r": (0, -15, 0)}, "forearm_R": {"r": (0, 15, 0)}}
    M["cheer"] = (1.5, [
        (0.0, arms()),
        (0.16, _merge(arms(), crouch)),
        (0.36, _merge(arms_up, {"root": {"l": (0, 0, 0.07)}, "head": {"r": (-8, 0, 0)}, "pony1": {"r": (-14, 0, 0)}})),
        (0.56, _merge(arms_up, crouch, {"root": {"l": (0, 0, -0.02)}, "pony1": {"r": (10, 0, 0)}})),
        (0.8, _merge(arms_up, {"root": {"l": (0, 0, 0.05)}, "head": {"r": (-6, 0, 0)}, "pony1": {"r": (-10, 0, 0)}})),
        (1.0, _merge(arms_up, {"root": {"l": (0, 0, 0)}})),
        (1.5, arms()),
    ])
    slump = _merge(arms(l=(4, 6, 0), r=(4, -6, 0), fl=-4, fr=-4), {"head": {"r": (26, 0, 0)}, "neck": {"r": (8, 0, 0)},
                   "spine": {"r": (12, 0, 0)}, "chest": {"r": (6, 0, 0)}, "root": {"l": (0, 0, -0.02)},
                   "thigh_L": {"r": (-8, 0, 0)}, "thigh_R": {"r": (-8, 0, 0)}, "shin_L": {"r": (14, 0, 0)}, "shin_R": {"r": (14, 0, 0)},
                   "pony1": {"r": (12, 0, 0)}})
    M["lose"] = (2.0, [(0.0, arms()), (0.6, slump), (2.0, _merge(slump, {"head": {"r": (30, 0, 0)}}))])
    M["point"] = (1.2, [  # sending a creature in: point straight ahead with the right arm
        (0.0, arms()),
        (0.3, _merge(arms(), {"upper_arm_R": {"r": (-82, -8, 0)}, "forearm_R": {"r": (-4, 0, 0)}, "chest": {"r": (0, 0, 10)}, "head": {"r": (-3, 0, 0)}})),
        (0.85, _merge(arms(), {"upper_arm_R": {"r": (-84, -8, 0)}, "forearm_R": {"r": (-4, 0, 0)}, "chest": {"r": (0, 0, 10)}, "head": {"r": (-3, 0, 0)}})),
        (1.2, arms()),
    ])
    return M


PLANS = {"quad": quad, "round": round_, "biped": biped, "bird": bird}
EVENTS = {"biped": {"throw": {"release": 0.5, "anchor": "hand_R"}}}  # timed moments the viewer or game hooks into


def clips(plan, wings=False, gait=None):
    if plan == "quad":
        return quad(wings, gait or "trot")
    return round_(gait or "waddle") if plan == "round" else PLANS[plan]()


def move_clip(move):
    """Which shared clip a game move plays, following the 2D game's rules (06-battle.js moveAnim)."""
    fx = move.get("fx") or {}
    if not move.get("power"):
        if fx.get("self") or fx.get("heal"):
            return "boost_guard" if fx.get("stat") == "def" else "boost"
        return "status"
    physical = move.get("type") in ("Normal", "Earth") or (move.get("tier") == "sig" and (fx.get("crit") or fx.get("hits")))
    if move.get("tier") == "strong" or move.get("power", 0) >= 70:
        return "strong_physical" if physical else "strong_special"
    return "physical" if physical else "special"
