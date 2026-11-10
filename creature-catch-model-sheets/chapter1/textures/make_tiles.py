"""Cut the 8 Chapter 1 texture sheets into 48 tiles (python3 -I make_tiles.py).

Material tiles: trimmed to the pattern's own repeat, then the last seam blended away; rugs repeat side to side only;
the checker floor is rebuilt exactly. Detail tiles (furniture fronts, doors, windows, signs, machines) get a see-through
background so they can go on models as stickers. Writes tiles/<sheet>/<name>.png and tiles/index.json."""
NAMES = {
 "woods": [("planks_light", "floors, crates, signs"), ("planks_dark", "dark boards"), ("wood_polished", "tables, dressers, the piano"), ("bark", "tree trunks, the fallen log, staffs"), ("boards_grey", "fences"), ("wood_cream", "window and door frames, trim")],
 "roofs": [("roof_red", "your house"), ("roof_purple", "Pip's Cube Shop"), ("roof_orange", "Rosa's Inn"), ("shingles_barn", "Farmer Bramble's barn"), ("roof_moss", "Elder Willow's house"), ("stripes_mint", "the Healing Hut's roof")],
 "walls": [("plaster_cream", "plaster walls"), ("boards_white", "the Healing Hut's walls"), ("boards_red", "the barn's walls"), ("cobblestone", "footings"), ("brick_red", "chimneys"), ("stone_sandy", "fireplaces and hearths")],
 "floors": [("floorboards", "room floors"), ("checker_mint", "the Healing Hut's floor"), ("rug_red", "rugs"), ("rug_blue", "rugs"), ("quilt", "bed covers"), ("doormat", "doormats")],
 "nature": [("hay", "hay bales, the barn"), ("leaves", "bushes and trees"), ("leaves_berries", "berry bushes"), ("leaves_flowers", "flower bushes"), ("rock", "rocks and boulders"), ("iron_rivets", "the stove, lamps, barrel hoops")],
 "furniture-details": [("books", "the bookshelf"), ("herb_shelf", "the herb shelf"), ("clock_face", "the grandfather clock"), ("notice_board", "Rosa's notice board"), ("piano_front", "the piano"), ("stove_front", "the stove")],
 "building-details": [("door", "front doors"), ("door_round", "Elder Willow's door"), ("window", "windows"), ("window_round", "Elder Willow's windows"), ("sign_heart", "the Healing Hut's sign"), ("sign_inn", "Rosa's Inn sign")],
 "machines": [("healing_machine", "the healing machine"), ("cube_vault", "the Cube Vault"), ("mailbox", "the mailbox"), ("lamp_glass", "street lamps"), ("hay_bale_end", "hay bale ends"), ("barrel_top", "barrel tops")],
}
import json, os, numpy as np
from PIL import Image
from scipy import ndimage
SHEETS = "/home/user/atoms-games-/creature-catch-model-sheets/chapter1/textures/sheets"
OUT = "/home/user/atoms-games-/creature-catch-model-sheets/chapter1/textures/tiles"
DECAL_SHEETS = {"furniture-details", "building-details", "machines"}
X_ONLY = {"rug_red", "rug_blue"}  # borders at the top and bottom on purpose: repeat side to side only


def best_period(t, axis):
    """Crop length along an axis (380..504) whose wrap matches best, compared with no crop."""
    a = t if axis == 0 else t.transpose(1, 0, 2)
    raw = np.abs(a[-4:][::-1] - a[:4]).mean()
    best, bl = raw, a.shape[0]
    for L in range(380, a.shape[0] - 8):
        d = np.abs(a[L:L + 8] - a[:8]).mean()
        if d < best * 0.8 and d < best:
            best, bl = d, L
    return bl, raw, best


def blend_seamless(t, ramp=56, axes=(0, 1)):
    h, w = t.shape[:2]
    o = np.roll(t, (h // 2 if 0 in axes else 0, w // 2 if 1 in axes else 0), axis=(0, 1))
    wy = np.ones(h) if 0 not in axes else np.clip(np.minimum(np.arange(h), h - 1 - np.arange(h)) / ramp, 0, 1)
    wx = np.ones(w) if 1 not in axes else np.clip(np.minimum(np.arange(w), w - 1 - np.arange(w)) / ramp, 0, 1)
    m = np.minimum(wy[:, None], wx[None, :])
    m = m * m * (3 - 2 * m)
    return t * m[..., None] + o * (1 - m[..., None])


def decal_alpha(t, bg=(200, 200, 202), tol=16):
    d = np.abs(t - np.array(bg, np.float32)).max(axis=2)
    near = d < tol
    lab, _ = ndimage.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(border))
    alpha = 1 - ndimage.gaussian_filter(bgmask.astype(np.float32), 0.8)
    alpha[~ndimage.binary_dilation(bgmask, iterations=2)] = 1
    return np.clip(alpha, 0, 1)


index = []
os.makedirs(OUT, exist_ok=True)
for sheet, names in NAMES.items():
    a = np.asarray(Image.open(f"{SHEETS}/texture-{sheet}.png").convert("RGB")).astype(np.float32)
    os.makedirs(f"{OUT}/{sheet}", exist_ok=True)
    for i, (n, use) in enumerate(names):
        r, c = divmod(i, 3)
        t = a[r * 512:(r + 1) * 512, c * 512:(c + 1) * 512]
        path = f"{sheet}/{n}.png"
        if sheet in DECAL_SHEETS:
            t = t[4:-4, 4:-4]
            al = decal_alpha(t)
            im = Image.fromarray(np.dstack([t, al * 255]).astype(np.uint8), "RGBA").resize((512, 512), Image.LANCZOS)
            im.save(f"{OUT}/{path}")
            index.append({"name": n, "sheet": sheet, "file": path, "kind": "decal", "use": use})
            continue
        t = t[6:-6, 6:-6]  # stay clear of the neighbouring tile's edge
        ly, ry, by = best_period(t, 0) if n not in X_ONLY else (t.shape[0], 0, 0)
        lx, rx, bx = best_period(t, 1)
        t = t[:ly, :lx]
        t = np.asarray(Image.fromarray(t.astype(np.uint8)).resize((512, 512), Image.LANCZOS)).astype(np.float32)
        t = blend_seamless(t, axes=(1,) if n in X_ONLY else (0, 1))
        Image.fromarray(np.clip(t, 0, 255).astype(np.uint8)).save(f"{OUT}/{path}")
        e_lr = float(np.abs(t[:, :2] - t[:, -2:][:, ::-1]).mean()); e_tb = float(np.abs(t[:2] - t[-2:][::-1]).mean())
        index.append({"name": n, "sheet": sheet, "file": path, "kind": "tile_x" if n in X_ONLY else "tile", "use": use,
                      "seam_after": [round(e_lr, 1), round(e_tb, 1)], "period_crop": [int(lx), int(ly)]})
json.dump(index, open(f"{OUT}/index.json", "w"), indent=1)
print(len(index), "tiles")
for e in index:
    if e["kind"] != "decal":
        print(e["name"], e["period_crop"], e["seam_after"])

# ---- the checker floor: the painted squares aren't even, so rebuild an exact 4x4 checker in its two colours,
# keeping the painting's brush texture (its fine light-and-dark detail) on top
src = np.asarray(Image.open(f"{SHEETS}/texture-floors.png").convert("RGB")).astype(np.float32)[6:506, 518:1018]
lum = src.mean(axis=2)
mint = src[lum < np.percentile(lum, 35)].mean(axis=0); cream = src[lum > np.percentile(lum, 70)].mean(axis=0)
detail = np.clip(lum - ndimage.gaussian_filter(lum, 2.5), -9, 9)
detail = np.asarray(Image.fromarray(np.clip(detail + 128, 0, 255).astype(np.uint8)).resize((512, 512), Image.LANCZOS)).astype(np.float32) - 128
detail = blend_seamless(detail[..., None])[..., 0]
yy, xx = np.mgrid[0:512, 0:512]
chk = ((xx // 128 + yy // 128) % 2).astype(np.float32)
edge = np.minimum(np.abs((xx % 128) - 64), np.abs((yy % 128) - 64))  # soft painted edges
col = mint[None, None] * chk[..., None] + cream[None, None] * (1 - chk[..., None])
col = col + detail[..., None] * 0.8
Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).save(f"{OUT}/floors/checker_mint.png")
for e in index:
    if e["name"] == "checker_mint":
        e["note"] = "rebuilt as an exact checker in the painting's two colours, with its brush texture on top"
json.dump(index, open(f"{OUT}/index.json", "w"), indent=1)
print("checker rebuilt", mint.round(), cream.round())
