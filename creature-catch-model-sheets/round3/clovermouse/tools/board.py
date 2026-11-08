"""Changed copy (round 3, clovermouse): Opus round-2 board.py (frames the three-quarter views by size); only the path to pipeline/ changed.

Comparison board: picture vs model per view, red/blue difference, outline overlap %.

usage: python3 -I board.py model.blend views.json OUT.jpg "title" [--mode clay|print|lit]
                           [--samples 16] [--tex albedo.png] [--normal normal.png] [--renders DIR]
                           [--three-quarter] [--res 1.0]

clay   plain grey, lit (shape check)
print  the printed texture shown flat, unlit (should reproduce the pictures)
lit    the printed texture under soft light (how it looks in a game)
Red = in the picture but missing on the model. Blue = on the model but not in the picture.
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "pipeline"))
from cc3d import Views  # noqa: E402


def arg(flag, default=None):
    if flag in sys.argv:
        return sys.argv[sys.argv.index(flag) + 1]
    return default


def font(sz):
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", sz)
    except Exception:
        return ImageFont.load_default()


def setup_scene(bpy, samples, transparent=True):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_adaptive_sampling = True
    try:
        sc.cycles.use_denoising = samples >= 8
        sc.cycles.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        sc.cycles.use_denoising = False
    sc.render.film_transparent = transparent
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.cycles.max_bounces = 4
    return sc


def set_materials(bpy, mode, tex=None, normal=None, emit=None):
    if mode == "clay":
        return
    img = bpy.data.images.load(os.path.abspath(tex))
    nimg = bpy.data.images.load(os.path.abspath(normal)) if normal else None
    if nimg:
        nimg.colorspace_settings.name = "Non-Color"
    m = bpy.data.materials.new("printed")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    ti = nt.nodes.new("ShaderNodeTexImage")
    ti.image = img
    ti.interpolation = "Cubic"
    if mode == "print":
        em = nt.nodes.new("ShaderNodeEmission")
        nt.links.new(ti.outputs["Color"], em.inputs["Color"])
        nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    else:
        bs = nt.nodes.new("ShaderNodeBsdfPrincipled")
        bs.inputs["Roughness"].default_value = 0.85
        nt.links.new(ti.outputs["Color"], bs.inputs["Base Color"])
        if emit:
            eimg = bpy.data.images.load(os.path.abspath(emit))
            te = nt.nodes.new("ShaderNodeTexImage")
            te.image = eimg
            nt.links.new(te.outputs["Color"], bs.inputs["Emission Color"])
            bs.inputs["Emission Strength"].default_value = float(arg("--emit-strength", "2.0"))
        if nimg:
            tn = nt.nodes.new("ShaderNodeTexImage")
            tn.image = nimg
            nm = nt.nodes.new("ShaderNodeNormalMap")
            nt.links.new(tn.outputs["Color"], nm.inputs["Color"])
            nt.links.new(nm.outputs["Normal"], bs.inputs["Normal"])
        nt.links.new(bs.outputs["BSDF"], out.inputs["Surface"])
    for ob in bpy.data.objects:
        if ob.type == "MESH":
            ob.data.materials.clear()
            ob.data.materials.append(m)


def world(bpy, strength):
    w = bpy.data.worlds.new("w")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (1, 1, 1, 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = strength
    bpy.context.scene.world = w


def add_sun(bpy, direction, energy, name):
    from mathutils import Vector

    lt = bpy.data.lights.new(name, "SUN")
    lt.energy = energy
    lt.angle = math.radians(25)
    ob = bpy.data.objects.new(name, lt)
    bpy.context.scene.collection.objects.link(ob)
    d = Vector(direction).normalized()
    ob.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
    return ob


def ortho_camera(bpy, vw, name):
    """Camera matching a view picture pixel-for-pixel. Returns (camera, y_scale for top)."""
    cam = bpy.data.objects.get("cam") or bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    if cam.name not in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    d = vw.v(name)
    w, h = d["size"]
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.resolution_percentage = 100
    sc.camera = cam
    yscale = 1.0
    if name in ("front", "back", "side"):
        s = d["s"]
        cam.data.ortho_scale = max(w, h) / s
        zc = (d["vg"] - h / 2) / s
        if name == "front":
            cam.location = ((w / 2 - d["uc"]) / s, -30, zc)
            cam.rotation_euler = (math.pi / 2, 0, 0)
        elif name == "back":
            cam.location = (-(w / 2 - d["uc"]) / s, 30, zc)
            cam.rotation_euler = (math.pi / 2, 0, math.pi)
        else:
            cam.location = (30, (w / 2 - d["uc"]) / s, zc)
            cam.rotation_euler = (math.pi / 2, 0, math.pi / 2)
    else:
        sx, sy = d["sx"], d["sy"]
        yscale = sy / sx
        cam.data.ortho_scale = max(w, h) / sx
        cam.location = (-(w / 2 - d["uc"]) / sx, (h / 2 - d["vc"]) / sx, 30)
        cam.rotation_euler = (0, 0, math.pi)
    cam.data.clip_start = 0.1
    cam.data.clip_end = 100
    return cam, yscale


def render(bpy, path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return np.asarray(Image.open(path).convert("RGBA"))


def main():
    import bpy

    blend, views_path, out = sys.argv[1:4]
    title = sys.argv[4] if len(sys.argv) > 4 else ""
    mode = arg("--mode", "clay")
    samples = int(arg("--samples", "16"))
    rdir = arg("--renders", os.path.splitext(out)[0] + "_renders")
    os.makedirs(rdir, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend))
    vw = Views(views_path)
    sc = setup_scene(bpy, samples)
    set_materials(bpy, mode, arg("--tex"), arg("--normal"), arg("--emit"))
    world(bpy, 0.0 if mode == "print" else 0.35)
    root = bpy.data.objects.new("root", None)
    sc.collection.objects.link(root)
    for ob in list(bpy.data.objects):
        if ob.type == "MESH":
            ob.parent = root
    suns = []
    results = {}
    panels = []
    for name in ["front", "side", "back", "top"]:
        for s_ in suns:
            bpy.data.objects.remove(s_, do_unlink=True)
        suns = []
        cam, ys = ortho_camera(bpy, vw, name)
        root.scale = (1, ys, 1)
        if mode != "print":
            vd = {"front": (0, -1, 0), "back": (0, 1, 0), "side": (1, 0, 0), "top": (0, 0, 1)}[name]
            right = {"front": (1, 0, 0), "back": (-1, 0, 0), "side": (0, 1, 0), "top": (-1, 0, 0)}[name]
            up = (0, 0, 1) if name != "top" else (0, -1, 0)
            key = 0.7 * np.array(vd, float) - 0.55 * np.array(right, float) + 0.7 * np.array(up, float)
            suns.append(add_sun(bpy, key, 3.0, "key"))
            suns.append(add_sun(bpy, -np.array(vd, float) + np.array([0, 0, 0.8]), 1.2, "rim"))
        img = render(bpy, os.path.join(rdir, f"{name}.png"))
        root.scale = (1, 1, 1)
        model = img[..., 3] > 127
        pic = vw.mask(name)
        inter = (model & pic).sum()
        union = (model | pic).sum()
        iou = inter / max(union, 1)
        results[name] = {"overlap": round(100 * iou, 1), "missing": int((pic & ~model).sum()), "extra": int((model & ~pic).sum())}
        diff = np.full(pic.shape + (3,), 235, np.uint8)
        diff[pic & model] = (150, 150, 150)
        diff[pic & ~model] = (230, 40, 40)
        diff[model & ~pic] = (40, 90, 230)
        rgb = img[..., :3].astype(np.float32)
        a = img[..., 3:4].astype(np.float32) / 255
        comp = (rgb * a + np.array([200, 200, 202], np.float32) * (1 - a)).astype(np.uint8)
        panels.append((name, vw.image(name), comp, diff, iou))
    # 3/4 views
    extra = []
    if "--three-quarter" in sys.argv:
        cam = bpy.data.objects["cam"]
        cam.data.type = "PERSP"
        cam.data.lens = 60
        sc.render.resolution_x, sc.render.resolution_y = 1200, 1000
        for k, (az, el) in enumerate([(-35, 18), (145, 22)]):
            for s_ in suns:
                bpy.data.objects.remove(s_, do_unlink=True)
            suns = []
            from mathutils import Vector

            # opus change: frame the creature by its own size (the shared tool assumes a 1.8 m creature)
            pts = [ob.matrix_world @ Vector(c) for ob in bpy.data.objects if ob.type == "MESH" for c in ob.bound_box]
            lo_ = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
            hi_ = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
            ext = max(hi_ - lo_)
            dist = 3.0 * ext * float(arg("--dist-scale", "1.0"))
            azr, elr = math.radians(az), math.radians(el)
            target = Vector(((lo_.x + hi_.x) / 2, (lo_.y + hi_.y) / 2, lo_.z + 0.47 * (hi_.z - lo_.z)))
            pos = target + Vector((math.sin(azr) * math.cos(elr), -math.cos(azr) * math.cos(elr), math.sin(elr))) * dist
            cam.location = pos
            cam.rotation_euler = (target - pos).to_track_quat("-Z", "Y").to_euler()
            if mode != "print":
                vd = (pos - target).normalized()
                suns.append(add_sun(bpy, (vd.x + 0.4, vd.y - 0.3, vd.z + 0.7), 3.2, "key"))
                suns.append(add_sun(bpy, (-vd.x, -vd.y, 0.8), 1.2, "rim"))
            img = render(bpy, os.path.join(rdir, f"three_quarter_{k + 1}.png"))
            rgb = img[..., :3].astype(np.float32)
            a = img[..., 3:4].astype(np.float32) / 255
            extra.append((rgb * a + np.array([200, 200, 202], np.float32) * (1 - a)).astype(np.uint8))
    # assemble the board
    ph = 330
    rows = []
    for name, pic, comp, diff, iou in panels:
        cells = []
        for im in (pic, comp, diff):
            I = Image.fromarray(im)
            I = I.resize((int(I.width * ph / I.height), ph), Image.LANCZOS)
            cells.append(I)
        rows.append((name, iou, cells))
    W = max(sum(c.width for c in cells) + 40 for _, _, cells in rows) + 40
    extra_h = 0
    if extra:
        eh = 520
        extra_imgs = [Image.fromarray(e).resize((int(e.shape[1] * eh / e.shape[0]), eh), Image.LANCZOS) for e in extra]
        extra_h = eh + 60
        W = max(W, sum(e.width for e in extra_imgs) + 60)
    H = 90 + len(rows) * (ph + 50) + extra_h + 20
    board = Image.new("RGB", (W, H), (245, 245, 243))
    d = ImageDraw.Draw(board)
    d.text((20, 18), title, fill=(20, 20, 20), font=font(30))
    tri = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == "MESH")
    d.text((20, 56), f"{tri:,} triangles   ·   picture  |  model  |  difference (red = missing on model, blue = extra on model)", fill=(70, 70, 70), font=font(18))
    y = 90
    for name, iou, cells in rows:
        d.text((20, y + 4), f"{name.upper()}   outline overlap {100 * iou:.1f}%", fill=(20, 20, 20), font=font(22))
        x = 20
        for c in cells:
            board.paste(c, (x, y + 36))
            x += c.width + 20
        y += ph + 50
    if extra:
        d.text((20, y + 4), "three-quarter views", fill=(20, 20, 20), font=font(22))
        x = 20
        for e in extra_imgs:
            board.paste(e, (x, y + 40))
            x += e.width + 20
    board.save(out, quality=90)
    res = {"triangles": tri, "views": results}
    with open(os.path.splitext(out)[0] + ".json", "w") as f:
        json.dump(res, f, indent=1)
    print(json.dumps(res))


if __name__ == "__main__":
    main()
