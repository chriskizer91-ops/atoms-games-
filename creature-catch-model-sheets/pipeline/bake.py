"""Bake the big model's printed colour and surface bumps onto the small model (Blender).

usage: python3 -I bake.py big.blend albedo.png small.blend OUTDIR [--size 2048]

Part by part, rays from each small part find the same big part (so a leg never picks up
colour from the body it pokes into). Two bakes per part: the printed colour (EMIT) and a
tangent-space normal map of the big model's surface (NORMAL).
Writes OUTDIR/small_albedo.png, OUTDIR/small_normal.png and OUTDIR/small_baked.blend.
"""
import os
import sys
import time


def arg(flag, default=None):
    if flag in sys.argv:
        return sys.argv[sys.argv.index(flag) + 1]
    return default


def main():
    import bpy

    big, albedo, small, out = sys.argv[1:5]
    size = int(arg("--size", "2048"))
    os.makedirs(out, exist_ok=True)
    t0 = time.time()
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(big))
    for ob in list(bpy.data.objects):
        ob.name = "hi_" + ob.name
    # big model material: the printed texture as emission
    img = bpy.data.images.load(os.path.abspath(albedo))
    mhi = bpy.data.materials.new("hi_print")
    mhi.use_nodes = True
    nt = mhi.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    o = nt.nodes.new("ShaderNodeOutputMaterial")
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = img
    t.interpolation = "Cubic"
    e = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(t.outputs["Color"], e.inputs["Color"])
    nt.links.new(e.outputs["Emission"], o.inputs["Surface"])
    for ob in bpy.data.objects:
        ob.data.materials.clear()
        ob.data.materials.append(mhi)
    # append the small model
    with bpy.data.libraries.load(os.path.abspath(small)) as (src, dst):
        dst.objects = list(src.objects)
    lo = []
    for ob in dst.objects:
        bpy.context.scene.collection.objects.link(ob)
        lo.append(ob)
    alb = bpy.data.images.new("small_albedo", size, size, alpha=False)
    nrm = bpy.data.images.new("small_normal", size, size, alpha=False, float_buffer=False)
    nrm.colorspace_settings.name = "Non-Color"
    alb.generated_color = (0.3, 0.2, 0.15, 1)
    nrm.generated_color = (0.5, 0.5, 1.0, 1)
    mlo = bpy.data.materials.new("lo_bake")
    mlo.use_nodes = True
    nt = mlo.node_tree
    na = nt.nodes.new("ShaderNodeTexImage")
    na.image = alb
    nn = nt.nodes.new("ShaderNodeTexImage")
    nn.image = nrm
    for ob in lo:
        ob.data.materials.clear()
        ob.data.materials.append(mlo)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 4
    bk = sc.render.bake
    bk.use_selected_to_active = True
    bk.use_cage = False
    bk.cage_extrusion = 0.035
    bk.max_ray_distance = 0.09
    bk.margin = 6
    bk.use_clear = False
    bk.normal_space = "TANGENT"
    for ob in lo:
        hi = bpy.data.objects.get("hi_" + ob.name)
        if hi is None:
            print("no big part for", ob.name)
            continue
        bpy.ops.object.select_all(action="DESELECT")
        hi.select_set(True)
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        for node, kind in ((na, "EMIT"), (nn, "NORMAL")):
            nt.nodes.active = node
            bpy.ops.object.bake(type=kind, use_selected_to_active=True, cage_extrusion=0.035,
                                max_ray_distance=0.09, margin=6, use_clear=False, normal_space="TANGENT")
        print(f"  baked {ob.name} ({time.time() - t0:.0f} s)")
    alb.filepath_raw = os.path.join(os.path.abspath(out), "small_albedo.png")
    alb.file_format = "PNG"
    alb.save()
    nrm.filepath_raw = os.path.join(os.path.abspath(out), "small_normal.png")
    nrm.file_format = "PNG"
    nrm.save()
    # keep only the small model in the saved file
    for ob in list(bpy.data.objects):
        if ob.name.startswith("hi_"):
            bpy.data.objects.remove(ob, do_unlink=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(os.path.abspath(out), "small_baked.blend"))
    print(f"bake done in {time.time() - t0:.0f} s")


if __name__ == "__main__":
    main()
