"""Changed copy (chapter 1 creatures) of chapter1/player-a/tools/closeups.py: frames the whole-body views
by the creature's biggest size (length, width or height), not its height, so long and wide creatures fit,
and lays the four views out as a 2 x 2 sheet (no cropped upper-body panels).

New tool (chapter 1): close views of a printed small model, for review and for closeups.jpg.

usage: python3 -I closeups.py model.blend albedo.png normal.png OUT.jpg [--emit e.png] [--samples 24]
                              [--face z0,z1] [--title "..."]

Renders, lit like board.py's "lit" mode: a front three-quarter view, a back three-quarter view (the
whole hero), and a big face close-up from the front three-quarter (the head between heights z0 and z1
in metres, default the top 22% of the model), plus a straight-on face view.
"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from board import add_sun, font, set_materials, setup_scene, world  # noqa: E402


def arg(flag, default=None):
    if flag in sys.argv:
        return sys.argv[sys.argv.index(flag) + 1]
    return default


def main():
    import bpy
    from mathutils import Vector

    blend, alb, nrm, out = sys.argv[1:5]
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend))
    sc = setup_scene(bpy, int(arg("--samples", "24")))
    set_materials(bpy, "lit", alb, nrm, arg("--emit"))
    world(bpy, 0.35)
    pts = [ob.matrix_world @ Vector(c) for ob in bpy.data.objects if ob.type == "MESH" for c in ob.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    Hm = hi.z - lo.z
    if arg("--face"):
        z0, z1 = (float(v) for v in arg("--face").split(","))
    else:
        z0, z1 = hi.z - 0.22 * Hm, hi.z
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.type = "PERSP"
    suns = []

    def shot(az, el, target, dist, lens, res, name):
        nonlocal suns
        for s_ in suns:
            bpy.data.objects.remove(s_, do_unlink=True)
        suns = []
        cam.data.lens = lens
        sc.render.resolution_x, sc.render.resolution_y = res
        azr, elr = math.radians(az), math.radians(el)
        pos = target + Vector((math.sin(azr) * math.cos(elr), -math.cos(azr) * math.cos(elr), math.sin(elr))) * dist
        cam.location = pos
        cam.rotation_euler = (target - pos).to_track_quat("-Z", "Y").to_euler()
        vd = (pos - target).normalized()
        suns.append(add_sun(bpy, (vd.x + 0.4, vd.y - 0.3, vd.z + 0.7), 3.2, "key"))
        suns.append(add_sun(bpy, (-vd.x, -vd.y, 0.8), 1.2, "rim"))
        path = os.path.splitext(out)[0] + f"_{name}.png"
        sc.render.filepath = path
        bpy.ops.render.render(write_still=True)
        a = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)
        rgb = a[..., :3] * (a[..., 3:] / 255) + np.array([200, 200, 202], np.float32) * (1 - a[..., 3:] / 255)
        return Image.fromarray(rgb.astype(np.uint8))

    mid = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z + 0.5 * Hm))
    size = max(Hm, hi.y - lo.y, hi.x - lo.x)
    body_d = float(arg("--body-dist", "2.0")) * size
    a = shot(-35, 15, mid, body_d, 50, (1000, 750), "front34")
    b = shot(145, 18, mid, body_d, 50, (1000, 750), "back34")
    fy = float(arg("--face-y", str(lo.y + 0.25 * (hi.y - lo.y))))
    fc = Vector((0, fy, (z0 + z1) / 2))
    fd = 2.2 * (z1 - z0) * 50 / 36
    c = shot(-30, 8, fc, fd, 50, (1000, 750), "face34")
    d = shot(0, 4, fc, fd, 50, (1000, 750), "face")
    W = 1000 + 1000 + 30
    sheet = Image.new("RGB", (W, 60 + 750 + 10 + 750 + 10), (245, 245, 243))
    dr = ImageDraw.Draw(sheet)
    dr.text((20, 15), arg("--title", "close views"), fill=(20, 20, 20), font=font(30))
    y = 60
    sheet.paste(a, (10, y)); sheet.paste(b, (1020, y))
    sheet.paste(c, (10, y + 760)); sheet.paste(d, (1020, y + 760))
    sheet.save(out, quality=90)
    print(out)


if __name__ == "__main__":
    main()
