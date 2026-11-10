"""Pack our animated models for the Chapter 1 game.

usage:  python3 game/tools/pack_models.py            pack every model that's new or changed
        python3 game/tools/pack_models.py --force    pack them all again
        python3 game/tools/pack_models.py drizzlon player-a   only these ids
        options: --no-normal (leave the normal maps out), --list (just show what it finds)

Run it from anywhere. It looks for each id in the list below, in these folders (the first one found wins):
    chapter1/<id>/, round3/<id>/, round2/opus/<id>/, round2/sonnet/<id>/
and needs <id>_animated.glb and animation_manifest.json there.

Each model is packed with the Creature Battle Bay's own packer (pipeline/battle_bay/pack_creature.py), then its textures
are made game-sized for phones: colour 1024 px, glow 512 px, normal maps 512 px (or none). The results go to
game/assets/models/<id>.json and game/assets/textures/<id>_*.jpg|png, and game/assets/models/index.json lists them all
(the game reads that list at boot). Ids with no model keep their old built-in-code model in the game.

The packer needs the gltf-transform node tools. Set NODE_DIR to a folder whose node_modules holds @gltf-transform/core,
@gltf-transform/extensions and @gltf-transform/cli (npm install those three into any folder outside the repo).
"""
import glob, json, os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.dirname(HERE)
SHEETS = os.path.dirname(os.path.dirname(GAME))  # creature-catch-model-sheets/
PACKER = f"{SHEETS}/pipeline/battle_bay/pack_creature.py"
OUT = f"{GAME}/assets"

# every creature the game knows (CREATURE_DEFS ids), in the order the chapter meets them
CREATURES = ["drizzlon", "mossback", "embroak", "clovermouse", "hopsprout", "puffmunk", "fleecling",
             "tuftail", "bumblop", "pebblepup", "dewt", "dandylion", "wormapple", "scarecrowl",
             "rapidrake", "tsunadrake", "thornshell", "elderoak", "cinderfrog", "infernotoad",
             "clovetastical", "hoppinpop", "stashmunk", "cloudram", "tempestram",
             "verdantail", "sylvantail", "bumblazer", "queenbuzz", "boulderhound", "cragmastiff",
             "monsoonewt", "typhoonewt", "sunmane", "scarecrown"]
# people: our id -> (name, role). The game's person looks use the same ids (LOOKS in looks.js).
PEOPLE = {
    "player-a": ("Explorer", "player"), "player-b": ("Explorer", "player"), "juniper": ("Juniper", "rival"),
    "willow": ("Elder Willow", "elder"), "tinker": ("Tinker", "villager"), "rosa": ("Rosa", "innkeeper"),
    "hazel": ("Hazel", "healer"), "pip": ("Pip", "shopkeeper"), "fern": ("Fern", "healer"),
    "oakley": ("Ranger Oakley", "ranger"), "bramble": ("Farmer Bramble", "guide"), "farmkid": ("Farm Kid", "villager"),
}
SEARCH = ["chapter1/{id}", "round3/{id}", "round2/opus/{id}", "round2/sonnet/{id}"]
SIZES = {"map": 1024, "emissiveMap": 512, "normalMap": 512}


def find(cid):
    for pat in SEARCH:
        d = f"{SHEETS}/{pat.format(id=cid)}"
        glb, man = f"{d}/{cid}_animated.glb", f"{d}/animation_manifest.json"
        if os.path.isfile(glb) and os.path.isfile(man):
            return d, glb, man
    return None


def node_dir():
    cands = [os.environ.get("NODE_DIR", "")] + glob.glob("/tmp/claude-0/*/*/scratchpad/node")
    for c in cands:
        if c and os.path.isfile(f"{c}/node_modules/.bin/gltf-transform"):
            return c
    sys.exit("pack_models: can't find the gltf-transform tools. Set NODE_DIR to a folder with node_modules holding "
             "@gltf-transform/core, @gltf-transform/extensions and @gltf-transform/cli.")


def shrink(src, dst_dir, cid, slot):
    """Make a texture game-sized; colour and glow as JPEG, normal maps as PNG. Returns the new file name."""
    from PIL import Image
    im = Image.open(src)
    lo, hi = zip(*im.convert("RGB").getextrema())
    if slot == "emissiveMap" and max(hi) < 12:  # no glow anywhere: leave it out
        return None
    if slot == "normalMap" and max(h - l for l, h in zip(lo, hi)) < 6:  # flat: leave it out
        return None
    n = SIZES[slot]
    if max(im.size) > n:
        im = im.resize((n, round(im.height * n / im.width)) if im.width >= im.height else (round(im.width * n / im.height), n), Image.LANCZOS)
    if slot == "normalMap":
        name = f"{cid}_normal.png"
        im.convert("RGB").save(f"{dst_dir}/{name}", optimize=True)
    else:
        name = f"{cid}_{'color' if slot == 'map' else 'glow'}.jpg"
        im.convert("RGB").save(f"{dst_dir}/{name}", quality=88 if slot == "map" else 85, optimize=True)
    return name


def pack(cid, src, no_normal):
    d, glb, man = src
    env = dict(os.environ, NODE_DIR=node_dir())
    if cid in PEOPLE:
        env["PERSON"] = "|".join(PEOPLE[cid])
    else:
        env.pop("PERSON", None)
    with tempfile.TemporaryDirectory(prefix="ccpack_") as tmp:
        subprocess.run([sys.executable, PACKER, cid, glb, man, os.path.basename(os.path.dirname(d)) or "builder", "[]", tmp],
                       check=True, env=env, stdout=subprocess.DEVNULL)
        data = json.load(open(f"{tmp}/models/{cid}.json"))
        os.makedirs(f"{OUT}/models", exist_ok=True); os.makedirs(f"{OUT}/textures", exist_ok=True)
        for old in glob.glob(f"{OUT}/textures/{cid}_*"):
            os.remove(old)
        tex = {}
        for slot, f in data["textures"].items():
            if slot == "normalMap" and no_normal:
                continue
            name = shrink(f"{tmp}/textures/{f}", f"{OUT}/textures", cid, slot)
            if name:
                tex[slot] = name
        data["textures"] = tex
        data["kind"] = "person" if cid in PEOPLE else "creature"
        data["source"] = os.path.relpath(glb, SHEETS)
        json.dump(data, open(f"{OUT}/models/{cid}.json", "w"), separators=(",", ":"))


def write_index():
    idx = {"creatures": [], "people": [], "bytes": {}}
    for f in sorted(glob.glob(f"{OUT}/models/*.json")):
        cid = os.path.basename(f)[:-5]
        if cid == "index":
            continue
        d = json.load(open(f))
        files = [f"models/{cid}.json"] + [f"textures/{t}" for t in d["textures"].values()]
        idx["bytes"][cid] = sum(os.path.getsize(f"{OUT}/{x}") for x in files if os.path.isfile(f"{OUT}/{x}"))
        idx["people" if d.get("kind") == "person" else "creatures"].append(cid)
    json.dump(idx, open(f"{OUT}/models/index.json", "w"), indent=1)
    return idx


def main():
    args = sys.argv[1:]
    force, no_normal, list_only = "--force" in args, "--no-normal" in args, "--list" in args
    only = [a for a in args if not a.startswith("--")]
    ids = only or (CREATURES + list(PEOPLE))
    done, missing = [], []
    for cid in ids:
        src = find(cid)
        if not src:
            missing.append(cid); continue
        out = f"{OUT}/models/{cid}.json"
        fresh = os.path.isfile(out) and os.path.getmtime(out) > max(os.path.getmtime(src[1]), os.path.getmtime(src[2]), os.path.getmtime(__file__))
        if list_only:
            print(f"{cid:14s} {os.path.relpath(src[1], SHEETS)}{'  (packed)' if fresh else ''}"); continue
        if fresh and not force:
            print(f"{cid}: up to date"); continue
        print(f"{cid}: packing {os.path.relpath(src[1], SHEETS)}", flush=True)
        pack(cid, src, no_normal)
        done.append(cid)
    if list_only:
        print("no model yet (the game keeps the old one):", " ".join(missing)); return
    idx = write_index()
    total = sum(idx["bytes"].values())
    print(f"packed {len(done)}; in the game now: {len(idx['creatures'])} creatures, {len(idx['people'])} people, {total / 1e6:.1f} MB")
    print("no model yet (the game keeps the old one):", " ".join(missing) or "none")


if __name__ == "__main__":
    main()
