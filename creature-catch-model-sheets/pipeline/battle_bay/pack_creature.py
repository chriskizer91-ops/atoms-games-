"""Pack an animated creature for the Creature Battle Bay viewer.

usage: NODE_DIR=<folder with node_modules holding @gltf-transform/core, /extensions and /cli>
       python3 pack_creature.py ID ANIMATED.glb ANIM_MANIFEST.json "BUILDER" '[{"anchor": "mouth", "kind": "ember"}]' OUTDIR
Writes OUTDIR/models/ID.json (quantized GLB in base64 + effect anchors + the creature's moves from the game) and
OUTDIR/textures/ID_* (colour, normal, glow). Normal maps over 1.5 MB are halved for phones.
Ambient kinds the viewer knows: smoke, spores, drip, sparkle, ember, rain, petal; anchor "top" = above the creature.
"""
import base64, json, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
NODE = os.environ.get("NODE_DIR", HERE)
sys.path.insert(0, f"{REPO}/pipeline")
import motions  # noqa: E402

cid, glb, man_path, builder = sys.argv[1:5]
ambient = json.loads(sys.argv[5]) if len(sys.argv) > 5 else []
out = sys.argv[6]
split = f"{out}/split"
os.makedirs(split, exist_ok=True); os.makedirs(f"{out}/models", exist_ok=True); os.makedirs(f"{out}/textures", exist_ok=True)
glb, split = os.path.abspath(glb), os.path.abspath(split)
shutil.copy(f"{HERE}/split_glb.mjs", f"{NODE}/split_glb.mjs") if NODE != HERE else None
subprocess.run(["node", f"{NODE}/split_glb.mjs", glb, split, cid, "keep-anims"], check=True, cwd=NODE)
subprocess.run([f"{NODE}/node_modules/.bin/gltf-transform", "quantize", f"{split}/{cid}_geo.glb", f"{split}/{cid}_q.glb"], check=True, cwd=NODE, stdout=subprocess.DEVNULL)
sm = json.load(open(f"{split}/{cid}.manifest.json"))
for slot, f in sm["textures"].items():
    shutil.copy(f"{split}/{f}", f"{out}/textures/{f}")
    if slot == "normalMap" and os.path.getsize(f"{out}/textures/{f}") > 1.5e6:  # phone-friendly: half-size normal maps
        from PIL import Image
        im = Image.open(f"{out}/textures/{f}")
        im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(f"{out}/textures/{f}", optimize=True)
gd = json.load(open(f"{REPO}/pipeline/game_data.json"))
cr = gd["creatures"][cid]
moves = []
for e in cr["learn"]:
    m = gd["moves"][e["move"]]
    clip = motions.move_clip(m)
    moves.append({"id": e["move"], "name": m["name"], "type": m["type"], "tier": m["tier"], "power": m.get("power", 0), "lv": e["lv"], "clip": clip, "cat": clip})
am = json.load(open(man_path))
d = {"id": cid, "name": cr["name"], "types": cr["types"], "body": cr.get("body"), "glb": base64.b64encode(open(f"{split}/{cid}_q.glb", "rb").read()).decode(),
     "textures": sm["textures"], "manifest": am, "moves": moves, "ambient": ambient, "builder": builder, "plan": am["plan"]}
json.dump(d, open(f"{out}/models/{cid}.json", "w"))
sizes = {f"textures/{f}": os.path.getsize(f"{out}/textures/{f}") for f in sm["textures"].values()}
sizes[f"models/{cid}.json"] = os.path.getsize(f"{out}/models/{cid}.json")
print(cid, {k: f"{v / 1e6:.2f} MB" for k, v in sizes.items()}, f"{len(moves)} moves")
