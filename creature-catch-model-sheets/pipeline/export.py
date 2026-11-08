"""Export a model as a game file (GLB) with its textures (Blender).

usage: python3 -I export.py model.blend OUT.glb --albedo a.jpg [--normal n.png] [--emit e.jpg] [--emit-strength 2]

All parts are joined into one mesh with one material, so a game draws it in one call.
"""
import os
import sys


def arg(flag, default=None):
    if flag in sys.argv:
        return sys.argv[sys.argv.index(flag) + 1]
    return default


def main():
    import bpy

    blend, out = sys.argv[1], sys.argv[2]
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend))
    only = arg("--only")
    if only:  # keep only parts whose names start with one of these (comma list)
        keep = tuple(only.split(","))
        for o in list(bpy.data.objects):
            if o.type == "MESH" and not o.name.startswith(keep):
                bpy.data.objects.remove(o, do_unlink=True)
    obs = [o for o in bpy.data.objects if o.type == "MESH"]
    for o in list(bpy.data.objects):
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    m = bpy.data.materials.new("coalossus")
    m.use_nodes = True
    nt = m.node_tree
    bs = nt.nodes["Principled BSDF"]
    bs.inputs["Roughness"].default_value = 0.85
    bs.inputs["Metallic"].default_value = 0.0

    def tex(path, colour=True):
        im = bpy.data.images.load(os.path.abspath(path))
        if not colour:
            im.colorspace_settings.name = "Non-Color"
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = im
        return n

    a = tex(arg("--albedo"))
    nt.links.new(a.outputs["Color"], bs.inputs["Base Color"])
    if arg("--emit"):
        e = tex(arg("--emit"))
        nt.links.new(e.outputs["Color"], bs.inputs["Emission Color"])
        bs.inputs["Emission Strength"].default_value = float(arg("--emit-strength", "1.0"))
    if arg("--normal"):
        n = tex(arg("--normal"), colour=False)
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(n.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], bs.inputs["Normal"])
    for o in obs:
        o.data.materials.clear()
        o.data.materials.append(m)
    bpy.ops.object.select_all(action="DESELECT")
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = os.path.splitext(os.path.basename(out))[0]
    bpy.ops.export_scene.gltf(filepath=os.path.abspath(out), export_format="GLB", export_image_format="AUTO",
                              export_tangents=bool(arg("--normal")), export_yup=True, export_apply=True,
                              export_materials="NONE" if "--no-materials" in sys.argv else "EXPORT")
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    print(f"exported {out}: {tris} triangles, {os.path.getsize(out) / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
