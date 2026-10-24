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
    for d, _, fs in os.walk(src, followlinks=True):
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
    MARK = (1, 254, 3)  # a fill color no picture uses (not white or magenta, which are the backgrounds)
    ImageDraw.floodfill(pad, (0, 0), MARK, thresh=tol)
    a = np.asarray(pad)[1:-1, 1:-1]
    mask = ~((a[:, :, 0] == MARK[0]) & (a[:, :, 1] == MARK[1]) & (a[:, :, 2] == MARK[2]))
    c = rgb.getpixel((0, 0))
    if c[0] > 200 and c[1] < 90 and c[2] > 200:
        # on a magenta background, magenta inside the art (rings, gaps, frames) is background too
        px = np.asarray(rgb).astype(int)
        mask &= ~((px[:, :, 0] > 190) & (px[:, :, 1] < 100) & (px[:, :, 2] > 190))
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
        pale = ((rgb.min(axis=2) > 205) & (rgb.max(axis=2) - rgb.min(axis=2) < 40)) | \
               ((rgb[:, :, 0] > 170) & (rgb[:, :, 2] > 170) & (rgb[:, :, 1] < 120))  # white or magenta leftovers
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

# ---------- the expansion pack (docs/creature-catch-expansion-image-prompts.md) ----------
def sheet_pieces(path, gap=10, min_area=0.0008, scale=4):
    """A keyed sheet and its pieces in reading order."""
    sheet = key_white(Image.open(path))
    return sheet, [b for r in rows_then_cols(merge_close(components(sheet, min_area, scale), gap)) for b in r]

def shrink_piece(piece, block=None, height=None, colors=32):
    w, h = piece.size
    size = (max(1, round(w * height / h)), height) if height else (max(1, round(w / block)), max(1, round(h / block)))
    out = pixelize(piece, size, colors)
    return out.crop(bbox(out)) if bbox(out) else out

def grid_cells(im, n=4):
    """The n x n cells of a tile sheet: the white gaps between tiles are found as the whitest lines near where
    they should be (the gaps are too thin and broken to cut the sheet by its shapes)."""
    a = np.asarray(im.convert('RGB')).astype(int)
    white = a.min(axis=2) > 225
    ys, xs = np.where(~white)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    def cuts(frac, lo, hi):
        out = [lo]
        for i in range(1, n):
            c = lo + (hi - lo) * i / n; r = int((hi - lo) * 0.06)
            seg = frac[int(c - r):int(c + r)]
            best = seg.max()
            idx = np.where(seg >= best - 0.08)[0]  # the whole gap band around the whitest line
            out.append((int(c - r) + idx.min(), int(c - r) + idx.max() + 1))
        out.append(hi)
        return out
    cx = cuts(white[y0:y1].mean(axis=0), x0, x1)
    cy = cuts(white[:, x0:x1].mean(axis=1), y0, y1)
    edges = lambda c: [(c[0] if i == 0 else c[i][1], c[i + 1] if i + 1 == n else c[i + 1][0]) for i in range(n)]
    return [(l, t, r, b) for (t, b) in edges(cy) for (l, r) in edges(cx)]

def defringe_magenta(img):
    """Clears magenta left on a sprite's edge (the dark rim some pieces keep from the magenta background)."""
    if img.mode != 'RGBA': return img
    a = np.asarray(img).copy(); al = a[:, :, 3] > 0; px = a[:, :, :3].astype(int)
    if al.all(): return img  # a picture with no see-through edge (a portrait on its backing)
    for _ in range(2):
        inner = np.zeros_like(al)
        inner[1:-1, 1:-1] = al[:-2, 1:-1] & al[2:, 1:-1] & al[1:-1, :-2] & al[1:-1, 2:]
        pink = (px[:, :, 0] > 120) & (px[:, :, 2] > 120) & (px[:, :, 1] < px[:, :, 0] - 50) & (px[:, :, 1] < px[:, :, 2] - 50) & (abs(px[:, :, 0] - px[:, :, 2]) < 60)
        drop = al & ~inner & pink
        if not drop.any(): break
        al = al & ~drop
    a[:, :, 3] = np.where(al, a[:, :, 3], 0)
    out = Image.fromarray(a, 'RGBA')
    return out.crop(bbox(out)) if bbox(out) else out

def expansion(src, made, log):
    """The expansion pack. Its folders are named by section (A-creatures, F-tilesets, D-people/portraits ...) and some
    names repeat across them (orchard.png is a tileset and a battle background), so files are found by folder and name."""
    import re
    ex = {}
    for d, _, fs in os.walk(src, followlinks=True):
        parts = os.path.relpath(d, src).lower().split(os.sep)
        sec = next((p for p in reversed(parts) if re.match(r'^[a-n]-[a-z-]+$', p)), None)
        if not sec: continue
        sub = 'portrait/' if parts[-1] == 'portraits' else ''
        for f in fs:
            if f.lower().endswith('.png'): ex[sec[0] + '/' + sub + f.lower()[:-4]] = os.path.join(d, f)
    save = lambda img, rel: globals()['save'](defringe_magenta(img), rel)
    flat = lambda k, colors: Image.open(ex[k]).convert('RGB').resize((240, 160), Image.BOX).quantize(colors, dither=Image.Dither.NONE).convert('RGB')
    n0 = len(made)
    for k in sorted(ex):
        sec, name = k[0], k[2:]
        if sec in 'abc':  # creatures, and the legendaries' calming-battle forms
            name = name.replace('groggy-solarion', 'groggysolarion').replace('hiding-gloaming', 'hidinggloaming')
            made.append(save(sprite(ex[k], 13), f'creatures/{name}.png'))
        elif sec == 'd' and name.startswith('portrait/'):  # 48 px tall on the portrait blue
            im = key_white(Image.open(ex[k])); im = im.crop(bbox(im))
            face = shrink_piece(im, height=48, colors=40)
            back = Image.new('RGBA', face.size, (206, 224, 240, 255)); back.alpha_composite(face)
            made.append(save(back, f'portraits/{name[9:]}.png'))
        elif sec == 'd' and not re.match(r'(trainers|villagers)-', name):
            made.append(save(sprite(ex[k], 13), f'people/{name}.png'))
        elif sec == 'e': made.append(save(sprite(ex[k], 13, 48), f'buildings/{name}.png'))
        elif sec in 'gln': made.append(save(flat(k, 64 if sec == 'g' else 96), f'bg/{name}.png'))
        elif sec == 'f':  # tilesets: 4 x 4 tiles on white -> a 128 x 128 atlas, like the main pack's
            im = Image.open(ex[k]).convert('RGB')
            atlas = Image.new('RGB', (128, 128))
            for i, c in enumerate(grid_cells(im)):
                inset = int((c[2] - c[0]) * 0.035)
                atlas.paste(im.crop((c[0] + inset, c[1] + inset, c[2] - inset, c[3] - inset)).resize((32, 32), Image.BOX), ((i % 4) * 32, (i // 4) * 32))
            made.append(save(atlas.quantize(48, dither=Image.Dither.NONE).convert('RGB'), f'tiles/{name}.png'))
        elif sec == 'h' and name == 'landmark-dusk-bell':  # cracked, then mended
            sheet, boxes = sheet_pieces(ex[k], 12, 0.01)
            for n, b in zip(['landmark-dusk-bell', 'landmark-dusk-bell-mended'], boxes): made.append(save(shrink_piece(sheet.crop(b), 10, colors=48), f'props/{n}.png'))
            log('dusk bell', len(boxes), 'for 2')
        elif sec == 'h' and name == 'signposts':
            sheet, boxes = sheet_pieces(ex[k], 4)
            for n, b in zip(['orchard', 'grove', 'cove', 'isle', 'copperbell', 'mine', 'springs', 'bayou', 'archive', 'dawn-temple', 'hollow-deep'], boxes):
                made.append(save(shrink_piece(sheet.crop(b), height=18, colors=24), f'props/signpost-{n}.png'))
            log('signposts', len(boxes), 'for 11')
        elif sec == 'h': made.append(save(sprite(ex[k], 10, 48), f'props/{name}.png'))
        elif sec == 'i':  # prop sheets: props/<area>-props-<n>, in reading order (Copperbell's lamp post nearly touches the stall below it)
            sheet, boxes = sheet_pieces(ex[k], 4 if name == 'copperbell-props' else 10)
            for i, b in enumerate(boxes): made.append(save(shrink_piece(sheet.crop(b), 10, colors=24), f'props/{name}-{i + 1}.png'))
            log('props', name, len(boxes))
        elif sec == 'j':  # furniture sheets: furniture/<set>-<n>, 40 px tall like the main pack's
            sheet, boxes = sheet_pieces(ex[k], 8, 0.002)
            for i, b in enumerate(boxes): made.append(save(shrink_piece(sheet.crop(b), height=40), f'furniture/{name}-{i + 1}.png'))
            log('furniture', name, len(boxes))
        elif sec == 'm' and name == 'cube-dusk': made.append(save(sprite(ex[k], 13, 40), 'ui/cube-dusk.png'))
        elif sec == 'm':
            im = key_white(Image.open(ex[k])); im = im.crop(bbox(im))
            made.append(save(shrink_piece(im, height=16, colors=24), f'items/{name}.png'))
    # trainer and villager sheets: 8 evenly spaced figures each, cut into 8 equal columns
    for k, first, prefix in (('d/trainers-15-22', 15, 'trainer'), ('d/trainers-23-30', 23, 'trainer'), ('d/villagers-9-16', 9, 'villager')):
        if k not in ex: continue
        sheet = key_white(Image.open(ex[k])); bb = bbox(sheet); cw = (bb[2] - bb[0]) / 8
        for j in range(8):
            col = sheet.crop((round(bb[0] + j * cw), bb[1], round(bb[0] + (j + 1) * cw), bb[3]))
            parts = components(col, 0.0005, 4)  # keep the biggest shape: drops slivers of the neighbors
            big = max(parts, key=lambda q: (q[2] - q[0]) * (q[3] - q[1])) if parts else bbox(col)
            made.append(save(shrink_piece(col.crop(big), height=84 if prefix == 'trainer' else 80), f'people/{prefix}-{first + j}.png'))
    log('expansion', len(made) - n0, 'files')

def main(src):
    files = find_all(src)
    made = []
    log = lambda *a: print(*a)

    # creatures: "<number>-<id>.png" or "<id>.png" for any id in the game data (plus the optional Duskfang)
    import re
    data = open(os.path.join(ROOT, 'src', 'js', '12-data-creatures.js')).read()
    ids = set(re.findall(r"^  \['(\w+)', '", data, re.M)) | {'duskfang'}
    final = os.path.join(ROOT, 'src', 'js', '12c-data-final.js')  # the final creatures' rows, and Crescub
    if os.path.exists(final): ids |= set(re.findall(r"^    \['(\w+)', '", open(final).read(), re.M)) | {'crescub'}
    # family creatures: every name: '...' in src/js/13b-family-creatures.js that isn't in a comment
    fam = os.path.join(ROOT, 'src', 'js', '13b-family-creatures.js')
    if os.path.exists(fam):
        for line in open(fam).read().splitlines():
            m = re.match(r"\s*(?:\{\s*)?name:\s*'([^']+)'", line)
            if m and not line.strip().startswith('//'):
                own = re.search(r"\bid:\s*'(\w+)'", line)  # a name with symbols in it (? Pop) gives its id
                ids.add(own.group(1) if own else re.sub(r'[^a-z0-9]', '', m.group(1).lower()))
    alias = {'optional-middle-stage-duskfang': 'duskfang', 'lunarion-dimmed': 'lunariond'}
    for name, path in sorted(files.items()):
        base = alias.get(name[:-4], name[:-4])
        if '-' in base and base.split('-')[0].isdigit(): base = base.split('-', 1)[1]
        if base in ids:
            made.append(save(sprite(path, 13), f'creatures/{base}.png'))
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

    # ---------- pack 09 to 15 ----------
    def pieces(f, gap=10, min_area=0.0008, scale=4):
        sheet = key_white(Image.open(files[f]))
        return sheet, [b for r in rows_then_cols(merge_close(components(sheet, min_area, scale), gap)) for b in r]
    def shrink(piece, block=None, height=None, colors=32, outline=False):
        w, h = piece.size
        size = (max(1, round(w * height / h)), height) if height else (max(1, round(w / block)), max(1, round(h / block)))
        out = pixelize(piece, size, colors, outline)
        return out.crop(bbox(out)) if bbox(out) else out
    def strip(f, key, block, frames=None):
        """A row of animation frames -> one strip of equal cells, each frame centered, feet on the bottom."""
        sheet, boxes = pieces(f, 14, 0.002)
        fr = [shrink(sheet.crop(b), block) for b in boxes][:frames or 99]
        cw = max(x.width for x in fr); ch = max(x.height for x in fr)
        out = Image.new('RGBA', (cw * len(fr), ch), (0, 0, 0, 0))
        for i, x in enumerate(fr): out.paste(x, (i * cw + (cw - x.width) // 2, ch - x.height))
        made.append(save(out, key)); log('strip', key, len(fr), cw, ch)

    # attack particles: 8 per type
    for t in ['fire', 'water', 'plant', 'earth', 'bolt', 'frost', 'shadow', 'lumen', 'neutral-hits-tackle-struggle-and-every-impact']:
        f = f'{t}.png'
        if f not in files: continue
        sheet, boxes = pieces(f, 6, 0.0004)
        key = 'normal' if t.startswith('neutral') else t
        for i, b in enumerate(boxes[:10]): made.append(save(shrink(sheet.crop(b), height=16, colors=24), f'fx/{key}-{i + 1}.png'))
        log('particles', key, len(boxes))
    # strong move bursts: 4 frames each
    for f, t in [('flare-burst-fire.png', 'fire'), ('torrent-crash-water.png', 'water'), ('thorn-barrage-plant.png', 'plant'), ('quake-stomp-earth.png', 'earth'),
                 ('thunder-snap-bolt.png', 'bolt'), ('blizzard-rush-frost.png', 'frost'), ('night-pounce-shadow.png', 'shadow'), ('radiant-beam-lumen.png', 'lumen')]:
        if f in files: strip(f, f'burst/{t}.png', 6, 4)
    # people: Juniper walking, the explorers' throw, Juniper's battle pose, a second Player B walk
    for f, key in (('juniper-walk.png', 'juniper'), ('player-b-walk-magenta.png', 'player-b-alt')):
        if f not in files: continue
        sheet, boxes = pieces(f, 6, 0.0015)
        rows = rows_then_cols(boxes)
        frames = [shrink(sheet.crop(b), 4.6, colors=24) for r in rows[:4] for b in r[:3]]
        cw = max(x.width for x in frames); ch = max(x.height for x in frames)
        out = Image.new('RGBA', (cw * 3, ch * 4), (0, 0, 0, 0))
        for i, x in enumerate(frames): out.paste(x, ((i % 3) * cw + (cw - x.width) // 2, (i // 3) * ch + ch - x.height))
        made.append(save(out, f'walk/{key}.png')); log('walk', key, [len(r) for r in rows])
    for who in ('player-a', 'player-b'):
        if f'{who}-back-view-throwing.png' in files: strip(f'{who}-back-view-throwing.png', f'throw/{who}.png', 6, 3)
    if 'fern-full-body.png' in files: made.append(save(sprite(files['fern-full-body.png'], 13), 'people/fern.png'))
    if 'bonus-grass-spawn-effect.png' in files: made.append(save(sprite(files['bonus-grass-spawn-effect.png'], 13), 'fx/grass-spawn.png'))
    if 'juniper-battle-pose.png' in files: made.append(save(sprite(files['juniper-battle-pose.png'], 13), 'people/juniper-battle.png'))
    # dialogue portraits: 4 faces a sheet
    for f, names in (('sheet-a-the-player-and-the-rival.png', ['player-a', 'player-b', 'juniper', 'juniper-cross']),
                     ('sheet-b-village.png', ['willow', 'hazel', 'pip', 'tobias']),
                     ('sheet-c-region-guides-1.png', ['oakley', 'gus', 'dusty', 'safi']),
                     ('sheet-d-region-guides-2.png', ['frida', 'moss', 'corvin', 'rosa']),
                     ('portrait-sheet-e.png', ['bramble', 'tinker', 'fern', 'tobias-2'])):
        if f not in files: continue
        sheet, boxes = pieces(f, 6, 0.004)
        for n, b in zip(names, boxes):
            face = shrink(sheet.crop(b), height=48, colors=40)
            back = Image.new('RGBA', face.size, (206, 224, 240, 255)); back.alpha_composite(face)
            made.append(save(back, f'portraits/{n}.png'))
        log('portraits', f, len(boxes))
    # icons
    for f, names, h in (('type-badges-8.png', ['Fire', 'Water', 'Plant', 'Earth', 'Bolt', 'Frost', 'Shadow', 'Lumen'], 12),
                        ('item-icons.png', ['potion', 'super-potion', 'tonic', 'full-tonic', 'cure-herb', 'revive', 'sun-shard', 'moon-shard', 'coin-pouch', 'map', 'vault-key', 'whistle'], 16),
                        ('overworld-emote-bubbles.png', ['exclaim', 'question', 'heart', 'dots', 'note', 'anger', 'sweat', 'sleep'], 14),
                        ('region-trail-charms-8-earned-from-region-guides.png', ['grassland', 'forest', 'water', 'cave', 'desert', 'snow', 'swamp', 'ruins'], 16),
                        ('outpost-signposts-one-per-region.png', ['grassland', 'forest', 'water', 'cave', 'desert', 'snow', 'swamp', 'ruins'], 18)):
        if f not in files: continue
        sheet, boxes = pieces(f, 4, 0.0008)
        folder = {'type-badges-8.png': 'ui/type-', 'item-icons.png': 'items/', 'overworld-emote-bubbles.png': 'ui/emote-',
                  'region-trail-charms-8-earned-from-region-guides.png': 'ui/charm-', 'outpost-signposts-one-per-region.png': 'props/signpost-'}[f]
        for n, b in zip(names, boxes): made.append(save(shrink(sheet.crop(b), height=h, colors=24), f'{folder}{n}.png'))
        log('icons', f, len(boxes), 'for', len(names))
    # cubes, the outpost hut, the starter table
    for f, key, block in (('great-cube.png', 'ui/cube-great.png', 13), ('ultra-cube.png', 'ui/cube-ultra.png', 13), ('master-cube.png', 'ui/cube-master.png', 13),
                          ('outpost-healing-hut.png', 'buildings/outpost-hut.png', 13), ('elder-s-starter-table.png', 'props/starter-table.png', 13)):
        if f in files: made.append(save(sprite(files[f], block, 40), key))
    # gates between regions
    if '9-gates-between-regions.png' in files:
        sheet, boxes = pieces('9-gates-between-regions.png', 8, 0.004)
        for n, b in zip(['log', 'bridge', 'boulders', 'sandstorm', 'ice', 'boardwalk', 'runes'], boxes):
            made.append(save(shrink(sheet.crop(b), 8, 40), f'props/gate-{n}.png'))
        log('gates', len(boxes))
    # interiors: furniture pieces and the interior tileset (one atlas of 32 px tiles, 8 across)
    for f, key in (('furniture-sheet.png', 'furniture/furn'), ('healing-hut-interior-pieces.png', 'furniture/heal')):
        if f not in files: continue
        sheet, boxes = pieces(f, 6, 0.002)
        for i, b in enumerate(boxes): made.append(save(shrink(sheet.crop(b), 6.5, 40), f'{key}-{i + 1}.png'))
        log('furniture', f, len(boxes))
    if 'interior-tileset.png' in files:
        im = Image.open(files['interior-tileset.png']).convert('RGB')
        rows = rows_then_cols(components(key_white(im, 30), 0.003, 4))
        cols = max(len(r) for r in rows)
        atlas = Image.new('RGB', (32 * cols, 32 * len(rows)))
        for ri, r in enumerate(rows):
            for ci, b in enumerate(r):
                inset = int((b[2] - b[0]) * 0.03)
                atlas.paste(im.crop((b[0] + inset, b[1] + inset, b[2] - inset, b[3] - inset)).resize((32, 32), Image.BOX), (ci * 32, ri * 32))
        made.append(save(atlas.quantize(64, dither=Image.Dither.NONE).convert('RGB'), 'tiles/interior.png'))
        log('interior tiles', [len(r) for r in rows])
    if '10-world-map.png' in files:
        im = Image.open(files['10-world-map.png']).convert('RGB')
        made.append(save(im.resize((240, 160), Image.BOX).quantize(96, dither=Image.Dither.NONE).convert('RGB'), 'bg/world-map.png'))

    # ---------- the full-game pack ----------
    for name in ['bramble-farmhouse', 'oakley-ranger-station', 'gus-dock-shack', 'dusty-mine-office', 'safi-nomad-tent',
                 'frida-log-cabin', 'granny-moss-hut', 'corvin-watchtower', 'moonlit-spire']:
        if name + '.png' in files: made.append(save(sprite(files[name + '.png'], 13, 48), f'buildings/{name}.png'))
    for name in ['landmark-elder-tree', 'landmark-lighthouse', 'landmark-oasis', 'landmark-frozen-falls', 'landmark-moon-altar']:
        if name + '.png' in files: made.append(save(sprite(files[name + '.png'], 10, 48), f'props/{name}.png'))
    for f, key in (('timberowl-flying.png', 'fx/timberowl-flying.png'), ('juniper-older.png', 'people/juniper-older.png'),
                   ('juniper-older-battle-pose.png', 'people/juniper-older-battle.png')):
        if f in files: made.append(save(sprite(files[f], 13), key))
    for i, f in enumerate(['trainers-sheet-1.png', 'trainers-sheet-2.png']):
        if f not in files: continue
        # the figures are evenly spaced but some hands touch, so cut the sheet into 7 equal columns
        sheet = key_white(Image.open(files[f])); cw = sheet.width / 7
        for j in range(7):
            col = sheet.crop((round(j * cw), 0, round((j + 1) * cw), sheet.height))
            parts = components(col, 0.0005, 4)  # keep the biggest shape: drops slivers of the neighbor's cube
            bb = max(parts, key=lambda q: (q[2] - q[0]) * (q[3] - q[1])) if parts else bbox(col)
            if bb: made.append(save(shrink(col.crop(bb), height=84, colors=32), f'people/trainer-{i * 7 + j + 1}.png'))
        log('trainers', f, 7)
    for f, key in (('interior-rustic-pieces.png', 'furniture/rustic'), ('interior-stone-pieces.png', 'furniture/stone'), ('interior-inn-pieces.png', 'furniture/inn')):
        if f not in files: continue
        sheet, boxes = pieces(f, 6, 0.002)
        for i, b in enumerate(boxes): made.append(save(shrink(sheet.crop(b), 6.5, 40), f'{key}-{i + 1}.png'))
        log('furniture', f, len(boxes))
    for f, key in [('battle-moon-altar.png', 'moon-altar'), ('battle-moonlit-spire.png', 'moonlit-spire')] + [(f'still-{n}.png', f'still-{n.split("-")[0]}') for n in
                   ['1-opening', '2-willow-story', '3-rivals', '4-the-ruins', '5-the-guardian', '6-ending']]:
        if f in files:
            im = Image.open(files[f]).convert('RGB')
            made.append(save(im.resize((240, 160), Image.BOX).quantize(96, dither=Image.Dither.NONE).convert('RGB'), f'bg/{key}.png'))
    if 'moonlit-spire-tileset.png' in files:
        im = Image.open(files['moonlit-spire-tileset.png']).convert('RGB')
        rows = rows_then_cols(components(key_white(im, 30), 0.003, 4))
        cols = max(len(r) for r in rows)
        atlas = Image.new('RGB', (32 * cols, 32 * len(rows)))
        for ri, r in enumerate(rows):
            for ci, b in enumerate(r):
                inset = int((b[2] - b[0]) * 0.03)
                atlas.paste(im.crop((b[0] + inset, b[1] + inset, b[2] - inset, b[3] - inset)).resize((32, 32), Image.BOX), (ci * 32, ri * 32))
        made.append(save(atlas.quantize(64, dither=Image.Dither.NONE).convert('RGB'), 'tiles/moonlit-spire.png'))
        log('spire tiles', [len(r) for r in rows])

    # ---------- the polish pack (docs/creature-catch-polish-prompts.md) ----------
    def pick(key):
        """The file for a prompt name: exactly <key>.png, else a name ending in it, else one containing it."""
        if key + '.png' in files: return files[key + '.png']
        ends = [f for f in files if f[:-4].endswith(key)]
        if ends: return files[sorted(ends)[0]]
        has = [f for f in files if key in f[:-4] and not f[:-4].split(key, 1)[1].startswith('-older')]
        return files[sorted(has)[0]] if has else None
    def cells(frames, n_cols):
        """Frames in equal cells, centered, feet on the bottom."""
        cw = max(x.width for x in frames); ch = max(x.height for x in frames)
        rows_n = (len(frames) + n_cols - 1) // n_cols
        out = Image.new('RGBA', (cw * n_cols, ch * rows_n), (0, 0, 0, 0))
        for i, x in enumerate(frames): out.paste(x, ((i % n_cols) * cw + (cw - x.width) // 2, (i // n_cols) * ch + ch - x.height))
        return out
    # side walks: one row of 4 frames facing left -> walk/side-<who>.png, the figures as tall as the old walk sheet's
    for who in ('player-a', 'player-b', 'juniper', 'juniper-older'):
        f = pick(f'side-walk-{who}')
        if not f: continue
        files['__side'] = f
        sheet, boxes = pieces('__side', 6, 0.002)
        old = os.path.join(ART, 'walk', f'{who}.png')
        fig = Image.open(old).height // 4 - 2 if os.path.exists(old) else 62
        frames = [shrink(sheet.crop(b), height=fig, colors=24) for b in boxes[:4]]
        made.append(save(cells(frames, len(frames)), f'walk/side-{who}.png')); log('side walk', who, len(boxes), 'frames, height', fig)
    # walk sheets for older Juniper and the guides: 4 rows x 3 frames like the others
    for who in ('juniper-older', 'bramble', 'oakley', 'gus', 'dusty', 'safi', 'frida', 'moss', 'corvin'):
        f = pick(f'walk-{who}')
        if not f or 'side-walk' in os.path.basename(f).lower(): continue
        # the figures are evenly spaced, but rods and staffs come apart into separate shapes, so cut a 3 x 4 grid
        sheet = key_white(Image.open(f)); bb = bbox(sheet)
        gw = (bb[2] - bb[0]) / 3; gh = (bb[3] - bb[1]) / 4
        frames = []
        for r in range(4):
            for c in range(3):
                cell = sheet.crop((round(bb[0] + c * gw), round(bb[1] + r * gh), round(bb[0] + (c + 1) * gw), round(bb[1] + (r + 1) * gh)))
                parts = [q for q in components(cell, 0.002, 4)]  # drop specks and slivers of the neighbors
                if not parts: continue
                big = max((q[2] - q[0]) * (q[3] - q[1]) for q in parts)
                keep = [q for q in parts if (q[2] - q[0]) * (q[3] - q[1]) > big * 0.04]
                frames.append(shrink(cell.crop((min(q[0] for q in keep), min(q[1] for q in keep), max(q[2] for q in keep), max(q[3] for q in keep))), 4.6, colors=24))
        made.append(save(cells(frames, 3), f'walk/{who}.png')); log('walk', who, len(frames), 'frames')
    f = pick('mega-potion')
    if f: made.append(save(shrink(key_white(Image.open(f)).crop(bbox(key_white(Image.open(f)))), height=16, colors=24), 'items/mega-potion.png'))
    for key, out_key in (('creature-log-book', 'ui/creature-log-book.png'), ('vs-trainer', 'bg/vs-trainer.png'), ('vs-guide', 'bg/vs-guide.png'),
                         ('vs-rival', 'bg/vs-rival.png'), ('vs-boss', 'bg/vs-boss.png')):
        f = pick(key)
        if f: made.append(save(Image.open(f).convert('RGB').resize((240, 160), Image.BOX).quantize(96, dither=Image.Dither.NONE).convert('RGB'), out_key))
    f = pick('name-plate')
    if f:
        im = key_white(Image.open(f)); im = im.crop(bbox(im))
        made.append(save(shrink(im, height=20, colors=24), 'ui/name-plate.png'))
    for key, out_key, n, h in (('menu-icons', 'ui/menu-icon', 8, 14), ('region-signs', 'ui/region-sign', 2, 24), ('field-fx', 'fx/field', 6, 12)):
        f = pick(key)
        if not f: continue
        files['__sheet'] = f
        sheet, boxes = pieces('__sheet', 6, 0.0008)
        for i, b in enumerate(boxes[:n]): made.append(save(shrink(sheet.crop(b), height=h, colors=24), f'{out_key}-{i + 1}.png'))
        log(key, len(boxes), 'for', n)
    f = pick('cave-mushroom-patch')
    if f:
        im = Image.open(f).convert('RGB'); bb = bbox(key_white(im, 30)) or (0, 0, im.width, im.height)
        inset = int((bb[2] - bb[0]) * 0.035)
        tile = im.crop((bb[0] + inset, bb[1] + inset, bb[2] - inset, bb[3] - inset)).resize((32, 32), Image.BOX)
        made.append(save(tile.quantize(32, dither=Image.Dither.NONE).convert('RGB'), 'tiles/cave-mushroom-patch.png'))

    expansion(src, made, log)

    made = sorted(set(made))
    with open(os.path.join(ART, 'MANIFEST.json'), 'w') as fh:
        json.dump(sorted(made), fh, indent=1)
    total = sum(os.path.getsize(os.path.join(ART, m)) for m in made)
    log(f'{len(made)} files, {total / 1024:.0f} KB')

if __name__ == '__main__':
    if '--expansion' in sys.argv:  # just the expansion pack, added to the art already in the manifest
        mf = os.path.join(ART, 'MANIFEST.json')
        made = json.load(open(mf)) if os.path.exists(mf) else []
        expansion(sys.argv[1], made, print)
        json.dump(sorted(set(made)), open(mf, 'w'), indent=1)
    else:
        main(sys.argv[1])
