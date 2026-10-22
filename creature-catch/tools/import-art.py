#!/usr/bin/env python3
"""Turns the generated art packs into game-ready pixel art in creature-catch/art/.

    python3 tools/import-art.py <folder with the unzipped packs>

The generator draws "pixel art" at about 1254 px with each art pixel 4 to 13 real pixels wide, on white.
For each picture this removes the white background (flood fill from the edges, so white inside the dark
outline stays), shrinks it back to its true pixel size, snaps it to a small palette, and crops it.
Sheets (walk cycles, tilesets, props, villagers, icons) are cut into their pieces.
Files are found by name anywhere under the folder, so the packs' folder layout doesn't matter.
Needs Pillow and numpy.
"""
import os, sys, json
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ART = os.path.join(ROOT, 'art')

def find_all(src):
    out = {}
    for d, _, fs in os.walk(src):
        for f in fs:
            if f.lower().endswith('.png'): out[f.lower()] = os.path.join(d, f)
    return out

# ---------- background removal ----------
def key_white(im, tol=48):
    """RGBA with the background (connected to the edges, close to the corner color) made transparent."""
    rgb = im.convert('RGB')
    w, h = rgb.size
    pad = Image.new('RGB', (w + 2, h + 2), rgb.getpixel((0, 0)))
    pad.paste(rgb, (1, 1))
    ImageDraw.floodfill(pad, (0, 0), (255, 0, 255), thresh=tol)
    a = np.asarray(pad)[1:-1, 1:-1]
    mask = ~((a[:, :, 0] == 255) & (a[:, :, 1] == 0) & (a[:, :, 2] == 255))
    out = np.dstack([np.asarray(rgb), (mask * 255).astype(np.uint8)])
    return Image.fromarray(out, 'RGBA')

def bbox(rgba):
    return rgba.getchannel('A').point(lambda v: 255 if v > 0 else 0).getbbox()

# ---------- shrinking to true pixels ----------
def pixelize(rgba, size, colors=32, outline=False):
    """Shrink an RGBA picture to `size` (w, h): average each block, hard alpha, small palette."""
    a = np.asarray(rgba).astype(np.float32)
    alpha = a[:, :, 3:4] / 255.0
    pre = Image.fromarray(np.clip(np.dstack([a[:, :, :3] * alpha, a[:, :, 3]]), 0, 255).astype(np.uint8), 'RGBA')
    small = np.asarray(pre.resize(size, Image.BOX)).astype(np.float32)
    al = small[:, :, 3]
    rgb = np.where(al[:, :, None] > 0, small[:, :, :3] / np.maximum(al[:, :, None], 1) * 255.0, 0)
    keep = al >= 110
    # defringe: drop pale pixels on the edge (left over from the white background)
    for _ in range(2):
        inner = np.zeros_like(keep)
        inner[1:-1, 1:-1] = keep[:-2, 1:-1] & keep[2:, 1:-1] & keep[1:-1, :-2] & keep[1:-1, 2:]
        pale = (rgb.min(axis=2) > 205) & (rgb.max(axis=2) - rgb.min(axis=2) < 40)
        keep = keep & ~(keep & ~inner & pale)
    rgb_img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), 'RGB')
    q = rgb_img.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    out = np.dstack([np.asarray(q), (keep * 255).astype(np.uint8)])
    if outline:  # a 1 px dark rim where the shape meets the background (tiny sprites lose their outline)
        k = keep
        edge = np.zeros_like(k)
        edge[1:, :] |= k[:-1, :]; edge[:-1, :] |= k[1:, :]; edge[:, 1:] |= k[:, :-1]; edge[:, :-1] |= k[:, 1:]
        rim = edge & ~k
        out[rim] = [30, 22, 38, 255]
    return Image.fromarray(out, 'RGBA')

def sprite(path, block, colors=32, pad=0):
    """A single sprite on white: key, crop, shrink by the art's block size."""
    im = key_white(Image.open(path))
    bb = bbox(im)
    im = im.crop(bb)
    w, h = im.size
    out = pixelize(im, (max(1, round(w / block)), max(1, round(h / block))), colors)
    return out.crop(bbox(out)) if bbox(out) else out

# ---------- cutting sheets into pieces ----------
def components(rgba, min_area=0.002, scale=8):
    """Bounding boxes of the separate shapes in a keyed sheet, found on a shrunken mask."""
    a = np.asarray(rgba.getchannel('A').resize((rgba.width // scale, rgba.height // scale), Image.BOX)) > 20
    h, w = a.shape
    seen = np.zeros_like(a)
    boxes = []
    for y in range(h):
        for x in range(w):
            if not a[y, x] or seen[y, x]: continue
            stack = [(y, x)]; seen[y, x] = True; ys = []; xs = []
            while stack:
                cy, cx = stack.pop(); ys.append(cy); xs.append(cx)
                for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1), (cy + 1, cx + 1), (cy - 1, cx - 1), (cy + 1, cx - 1), (cy - 1, cx + 1)):
                    if 0 <= ny < h and 0 <= nx < w and a[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; stack.append((ny, nx))
            if len(ys) >= min_area * w * h:
                boxes.append((min(xs) * scale, min(ys) * scale, (max(xs) + 1) * scale, (max(ys) + 1) * scale))
    return boxes

def rows_then_cols(boxes, tol=None):
    """Sorts boxes into reading order: rows by their middles, then left to right."""
    if not boxes: return []
    hs = sorted(b[3] - b[1] for b in boxes)
    tol = tol or hs[len(hs) // 2] * 0.5
    boxes = sorted(boxes, key=lambda b: (b[1] + b[3]) / 2)
    rows, cur = [], [boxes[0]]
    for b in boxes[1:]:
        if abs((b[1] + b[3]) / 2 - (cur[-1][1] + cur[-1][3]) / 2) < tol: cur.append(b)
        else: rows.append(cur); cur = [b]
    rows.append(cur)
    return [sorted(r, key=lambda b: b[0]) for r in rows]

def merge_close(boxes, gap):
    """Joins boxes that overlap or nearly touch (a sprite whose parts are separated by white)."""
    boxes = list(boxes); changed = True
    while changed:
        changed = False
        for i in range(len(boxes)):
            for j in range(i + 1, len(boxes)):
                a, b = boxes[i], boxes[j]
                if a[0] - gap < b[2] and b[0] - gap < a[2] and a[1] - gap < b[3] and b[1] - gap < a[3]:
                    boxes[i] = (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))
                    del boxes[j]; changed = True; break
            if changed: break
    return boxes

def save(img, rel):
    p = os.path.join(ART, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p, optimize=True)
    return rel

# ---------- what goes where ----------
PEOPLE = {
    'player-a.png': 'player-a', 'player-b.png': 'player-b', 'elder-willow.png': 'willow', 'farmer-bramble.png': 'bramble',
    'fisher-gus.png': 'gus', 'frida-the-explorer.png': 'frida', 'hazel-the-healer.png': 'hazel', 'juniper.png': 'juniper',
    'pip-the-shopkeeper.png': 'pip', 'ranger-oakley.png': 'oakley', 'safi-the-nomad.png': 'safi', 'dusty-the-miner.png': 'dusty',
    'granny-moss.png': 'moss', 'innkeeper-rosa.png': 'rosa', 'night-watchman-corvin.png': 'corvin', 'village-kid-tinker.png': 'tinker',
    'wandering-merchant-tobias.png': 'tobias',
}
BUILDINGS = ['player-house', 'cube-shop', 'elder-s-house', 'healing-hut', 'inn', 'cave-entrance', 'ruins-gate']
BACKGROUNDS = ['grassland', 'forest', 'water', 'cave', 'desert', 'snow', 'swamp', 'night-ruins', 'village-training']
TILESETS = ['home-village', 'grassland-spawn-zone', 'forest', 'water-shoreline', 'cave', 'desert', 'snow', 'swamp', 'night-ruins']
PROP_SHEETS = ['trees-sheet', 'village-props-sheet', 'rocks-and-bushes-sheet', 'water-props-sheet', 'cave-and-ruins-props-sheet', 'treasure-chest-and-pickups']

def main(src):
    files = find_all(src)
    made = []
    log = lambda *a: print(*a)

    # creatures: "<number>-<id>.png"
    for name, path in sorted(files.items()):
        base = name[:-4]
        if '-' in base and base.split('-')[0].isdigit():
            cid = base.split('-', 1)[1]
            made.append(save(sprite(path, 13), f'creatures/{cid}.png'))
    log('creatures', sum(1 for m in made if m.startswith('creatures/')))

    for f, key in (('capture-cube.png', 'cube'), ('optional-cube-open-capturing.png', 'cube-open')):
        if f in files: made.append(save(sprite(files[f], 13), f'ui/{key}.png'))

    # people: a full picture (battle intros, portraits) and a small one for walking around
    for f, key in PEOPLE.items():
        if f not in files: continue
        made.append(save(sprite(files[f], 13), f'people/{key}.png'))
    if 'generic-villager-sheet-for-quick-filler-npcs.png' in files:
        sheet = key_white(Image.open(files['generic-villager-sheet-for-quick-filler-npcs.png']))
        boxes = [b for r in rows_then_cols(merge_close(components(sheet, 0.001, 4), 8)) for b in r]
        for i, b in enumerate(boxes):
            piece = sheet.crop(b)
            w, h = piece.size
            made.append(save(pixelize(piece, (max(1, round(w / 4.6)), max(1, round(h / 4.6))), 24), f'people/villager-{i + 1}.png'))
        log('villagers', len(boxes))

    # walk sheets: 4 rows (down, left, right, up) x 3 steps, each step put in the same size cell, feet at the bottom
    for who in ('player-a', 'player-b'):
        f = f'{who}-walk-sheet.png'
        if f not in files: continue
        sheet = key_white(Image.open(files[f]))
        rows = rows_then_cols(merge_close(components(sheet, 0.0015, 4), 6))
        frames = []
        for r in rows[:4]:
            for b in r[:3]:
                piece = sheet.crop(b); w, h = piece.size
                frames.append(pixelize(piece, (max(1, round(w / 4.3)), max(1, round(h / 4.3))), 24))
        cw = max(fr.width for fr in frames); ch = max(fr.height for fr in frames)
        out = Image.new('RGBA', (cw * 3, ch * 4), (0, 0, 0, 0))
        for i, fr in enumerate(frames):
            out.paste(fr, ((i % 3) * cw + (cw - fr.width) // 2, (i // 3) * ch + ch - fr.height))
        made.append(save(out, f'walk/{who}.png'))
        log('walk', who, len(rows), [len(r) for r in rows], 'cell', cw, ch)

    # battle backgrounds and the title: 240 x 160
    for bg in BACKGROUNDS:
        f = f'{bg}-battle.png'
        if f in files:
            im = Image.open(files[f]).convert('RGB')
            made.append(save(im.resize((240, 160), Image.BOX).quantize(64, dither=Image.Dither.NONE).convert('RGB'), f'bg/{bg}.png'))
    if '8-title-screen-optional.png' in files:
        im = Image.open(files['8-title-screen-optional.png']).convert('RGB')
        made.append(save(im.resize((240, 160), Image.BOX).quantize(64, dither=Image.Dither.NONE).convert('RGB'), 'bg/title.png'))

    # tilesets: a 4 x 4 grid of tiles on white -> a 128 x 128 atlas of 32 px tiles (drawn at 16 in the game)
    for ts in TILESETS:
        f = f'{ts}.png'
        if f not in files: continue
        im = Image.open(files[f]).convert('RGB')
        keyed = key_white(im, 30)
        rows = rows_then_cols(components(keyed, 0.01, 6))
        atlas = Image.new('RGB', (128, 128))
        n = 0
        for ri, r in enumerate(rows[:4]):
            for ci, b in enumerate(r[:4]):
                inset = int((b[2] - b[0]) * 0.035)  # skip the soft rounded rim
                piece = im.crop((b[0] + inset, b[1] + inset, b[2] - inset, b[3] - inset)).resize((32, 32), Image.BOX)
                atlas.paste(piece, (ci * 32, ri * 32)); n += 1
        made.append(save(atlas.quantize(48, dither=Image.Dither.NONE).convert('RGB'), f'tiles/{ts}.png'))
        log('tiles', ts, n, [len(r) for r in rows])

    # buildings
    for bname in BUILDINGS:
        f = f'{bname}.png'
        if f in files: made.append(save(sprite(files[f], 13, 40), f'buildings/{bname}.png'))

    # prop sheets: every separate piece, in reading order (props/<sheet>-<n>.png)
    for ps in PROP_SHEETS:
        f = f'{ps}.png'
        if f not in files: continue
        sheet = key_white(Image.open(files[f]))
        boxes = [b for r in rows_then_cols(merge_close(components(sheet, 0.0008, 4), 10)) for b in r]
        for i, b in enumerate(boxes):
            piece = sheet.crop(b); w, h = piece.size
            made.append(save(pixelize(piece, (max(1, round(w / 10)), max(1, round(h / 10))), 24), f'props/{ps.replace("-sheet", "")}-{i + 1}.png'))
        log('props', ps, len(boxes))

    # status icons: burn, freeze, shock, poison, sleep, caught
    if 'status-icons.png' in files:
        sheet = key_white(Image.open(files['status-icons.png']))
        boxes = [b for r in rows_then_cols(merge_close(components(sheet, 0.0008, 4), 10)) for b in r]
        names = ['burn', 'freeze', 'shock', 'poison', 'sleep', 'caught']
        for i, b in enumerate(boxes[:6]):
            piece = sheet.crop(b); w, h = piece.size
            made.append(save(pixelize(piece, (max(1, round(w * 14 / h)), 14), 16, outline=True), f'ui/status-{names[i]}.png'))
        log('status icons', len(boxes))

    with open(os.path.join(ART, 'MANIFEST.json'), 'w') as fh:
        json.dump(sorted(made), fh, indent=1)
    total = sum(os.path.getsize(os.path.join(ART, m)) for m in made)
    log(f'{len(made)} files, {total / 1024:.0f} KB')

if __name__ == '__main__':
    main(sys.argv[1])
