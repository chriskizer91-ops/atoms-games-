#!/usr/bin/env python3
"""Pack generated art into zip files that are each <= 19 MB.

    python3 package_art.py <art_dir> <out_dir>

<art_dir> holds two folders that mirror the keys in IMAGE_PROMPTS.md:
    <art_dir>/assets/<key>.(png|webp|jpg)        e.g. assets/cutscene/still-05-handshake.png
    <art_dir>/reference-art/<name>.(png|webp|jpg)
Every file is converted to WebP (alpha kept), downscaled if larger than its cap, then packed. Files in "cut-out" folders
(chars, portraits, icons, badges, logos, fish, food, mini, fx, posters, cutscene plates/sprites) that arrive on a flat
#FF00FF background instead of real transparency are keyed out automatically. File names are lower-cased. A zip never mixes
top-level groups, never exceeds the limit, and keeps the same relative paths, so unzipping needs no renaming.
Writes freshgrad-art-<group>-<NN>.zip and MANIFEST.csv (key, group, zip, bytes, width, height, alpha).
Needs Pillow with WebP support (pip install pillow)."""
import csv, io, os, sys, warnings, zipfile
warnings.filterwarnings('ignore')
from PIL import Image

LIMIT = int(float(os.environ.get('FG_LIMIT_MB', '19')) * 1024 * 1024)   # set FG_LIMIT_MB to test
LONG_SIDE_CAP = {            # max long side in px, by folder (longest match wins)
    'assets/cutscene/still': 2560, 'assets/cutscene/plate': 2560, 'assets/bg': 1920, 'assets/title': 2560,
    'assets/chars': 2048, 'assets/portraits': 1024, 'assets/icons': 512, 'assets/badges': 512, 'assets/logos': 1024,
    'assets/fish': 768, 'assets/food': 512, 'assets/mini': 512, 'assets/tex': 1024, 'assets/fx': 1024,
    'assets/posters': 1024, 'assets/ui': 2048, 'reference-art': 1920,
}
EXT = ('.png', '.webp', '.jpg', '.jpeg')
CUTOUT = ('assets/chars/', 'assets/portraits/', 'assets/icons/', 'assets/badges/', 'assets/logos/', 'assets/fish/',
          'assets/food/', 'assets/mini/', 'assets/fx/', 'assets/cutscene/plate-crowd', 'assets/cutscene/plate-podium',
          'assets/cutscene/sprites')

def key_magenta(im):
    """If the picture has no alpha and its corners are magenta, make magenta transparent (soft edge)."""
    px = im.convert('RGB'); w, h = px.size
    corners = [px.getpixel(p) for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    if not all(abs(r - 255) < 40 and g < 60 and abs(b - 255) < 40 for r, g, b in corners): return im
    out = px.convert('RGBA'); data = list(out.getdata()); res = []
    for r, g, b, _ in data:
        d = ((255 - r) ** 2 + g ** 2 + (255 - b) ** 2) ** 0.5       # distance from pure magenta
        a = 0 if d < 45 else 255 if d > 110 else int((d - 45) / 65 * 255)
        if a < 255 and a > 0:                                         # despill the pink fringe
            r, b = min(r, g + 60), min(b, g + 60)
        res.append((r, g, b, a))
    out.putdata(res); return out

def cap_for(rel):
    best, n = 2048, -1
    for k, v in LONG_SIDE_CAP.items():
        if rel.startswith(k) and len(k) > n: best, n = v, len(k)
    return best

def group_of(rel):
    parts = rel.split('/')
    if parts[0] == 'reference-art': return 'reference'
    return parts[1] if len(parts) > 2 else 'misc'

def encode(path, rel):
    im = Image.open(path); im.load()
    if rel.startswith(CUTOUT) and im.mode in ('RGB', 'P', 'L'): im = key_magenta(im.convert('RGB'))
    has_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
    im = im.convert('RGBA' if has_alpha else 'RGB')
    cap = cap_for(rel)
    if max(im.size) > cap:
        k = cap / max(im.size); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    buf = io.BytesIO()
    if has_alpha: im.save(buf, 'WEBP', quality=92, alpha_quality=100, method=6)
    else: im.save(buf, 'WEBP', quality=88, method=6)
    return buf.getvalue(), im.size, has_alpha

def main(src, out):
    os.makedirs(out, exist_ok=True)
    items = []
    for root, _, files in os.walk(src):
        for f in sorted(files):
            if not f.lower().endswith(EXT): continue
            p = os.path.join(root, f); rel = os.path.relpath(p, src).replace(os.sep, '/').lower().replace(' ', '-')
            data, size, alpha = encode(p, rel)
            items.append((group_of(rel), os.path.splitext(rel)[0] + '.webp', data, size, alpha))
    items.sort(key=lambda t: (t[0], t[1]))
    rows, zips, cur, cur_bytes, cur_group, idx = [], [], None, 0, None, {}
    def close():
        if cur: cur.close()
    for g, rel, data, size, alpha in items:
        if len(data) > LIMIT - 200_000: sys.exit(f'{rel} alone is {len(data)/1e6:.1f} MB; shrink it')
        if cur is None or g != cur_group or cur_bytes + len(data) > LIMIT - 200_000:
            close(); idx[g] = idx.get(g, 0) + 1
            name = f'freshgrad-art-{g}-{idx[g]:02d}.zip'
            cur = zipfile.ZipFile(os.path.join(out, name), 'w', zipfile.ZIP_DEFLATED, compresslevel=6)
            cur_group, cur_bytes = g, 0; zips.append(name)
        cur.writestr(rel, data); cur_bytes += len(data)
        rows.append([rel, g, zips[-1], len(data), size[0], size[1], int(alpha)])
    close()
    with open(os.path.join(out, 'MANIFEST.csv'), 'w', newline='') as fh:
        w = csv.writer(fh); w.writerow(['key', 'group', 'zip', 'bytes', 'width', 'height', 'alpha']); w.writerows(rows)
    for z in zips: print(f'{z}  {os.path.getsize(os.path.join(out, z))/1e6:.1f} MB')
    print(f'{len(rows)} files in {len(zips)} zips; MANIFEST.csv written')

if __name__ == '__main__':
    if len(sys.argv) != 3: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
