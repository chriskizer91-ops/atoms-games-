"""Make game-sized copies of the painted Chapter 1 texture tiles (python3 game/tools/pack_tiles.py).

Reads chapter1/textures/tiles/index.json and writes game/assets/tiles/:
  materials (walls, roofs, wood, floors, leaves...)  256 px JPEG, they repeat across buildings and props
  stickers (doors, windows, signs, furniture fronts)  cropped to the painted part, stretched to 256 x 256 px WebP with their
                                                     see-through background; "aspect" (width / height) keeps their shape
and game/assets/tiles/index.json, the list the game loads at boot. Rerun it if the tiles change.
"""
import json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.dirname(HERE)
SRC = os.path.join(os.path.dirname(GAME), "textures", "tiles")
OUT = os.path.join(GAME, "assets", "tiles")
SIZE = {"tile": 256, "tile_x": 256, "decal": 256}

os.makedirs(OUT, exist_ok=True)
idx = {}
for e in json.load(open(os.path.join(SRC, "index.json"))):
    im = Image.open(os.path.join(SRC, e["file"]))
    n = SIZE[e["kind"]]
    aspect = 1.0
    if e["kind"] == "decal":
        im = im.convert("RGBA")
        box = im.getchannel("A").point(lambda a: 255 if a > 10 else 0).getbbox()
        if box:
            im = im.crop(box)
        aspect = round(im.width / im.height, 3)
    im = im.resize((n, n), Image.LANCZOS)
    if e["kind"] == "decal":
        name = e["name"] + ".webp"
        im.convert("RGBA").save(os.path.join(OUT, name), quality=88, method=6)
    else:
        name = e["name"] + ".jpg"
        im.convert("RGB").save(os.path.join(OUT, name), quality=86, optimize=True)
    idx[e["name"]] = {"file": name, "kind": e["kind"], "use": e["use"], "aspect": aspect}
json.dump(idx, open(os.path.join(OUT, "index.json"), "w"), indent=1)
total = sum(os.path.getsize(os.path.join(OUT, v["file"])) for v in idx.values())
print(f"{len(idx)} tiles, {total / 1e6:.2f} MB in {OUT}")
