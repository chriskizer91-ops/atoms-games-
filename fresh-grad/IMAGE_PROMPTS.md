# Fresh Grad — Image Generation Master File

> **Superseded (October 2026): the art plan was cut to [`ART_SHORTLIST.md`](ART_SHORTLIST.md), and that list is complete.** All planned art is finished (87 images in the game, see `v2-visual-upgrade/notes/art-drops.md`); nothing is left to generate. This file stays as the full reference for style, cast, sizes and prompt wording.

One self-contained brief for the image-generation session. It contains the **style rules**, **every prompt** (about 500 images in priority order), the **file naming**, and the **packaging into zip files of at most 20 MB each**. Read §0–§3 once, then work through the packs in §5 in order.

*Fresh Grad* is a small, warm life-sim about your first real job: you graduate, pick a degree, rent an apartment in the town of Maple Court, walk its streets, eat three meals a day, work shifts, make friends, fish, watch movies and try to get some sleep. The pictures below replace or enrich parts of the game's own hand-drawn graphics: the opening graduation cutscene, the title screen, character faces, dream and scene backdrops, icons, textures. Every colour, name and prop here comes from the game itself, so the art slots straight in.

---

## 0. Mission and order of work

1. **Generate the style anchors first (P00).** Three images that lock the look. Use them as style references for everything after (§3.3).
2. **Lock the cast (P03).** The Graduate and the Dean must look like the same people in every image. Generate their model sheets, then attach them as character references to every later image they appear in.
3. **Work the packs in §5 in order (P01 → P12).** Within a pack, any order. Tier A packs are used by the game as soon as the files exist; Tier B and C follow.
4. **Two takes for hero art** (P01, P04): save the best as the real file and the runner-up as `<name>-b`.
5. **Package** with the script in §2 as you go. Hand over zips, not loose files. Tell me which zips are done; I wire them into the game in that order.

| Tier | Packs | Why |
|---|---|---|
| **A: wired already** | P00, P01, P02, P03, P04 | The game already looks for these exact files (opening cutscene, title, diploma). |
| **B: wired next** | P05, P06, P07, P08, P11 | Faces for conversations, backdrops, icons, fish, plus reference boards I use to polish. |
| **C: nice to have** | P09, P10, P12 | Textures, light and particle sprites, movie posters, paper-doll parts. |

---

## 1. Delivery specification

**One image = one file.** The file path under `assets/` (or `reference-art/`) is the image's *key*; the game loads `assets/<key>.webp` (or `.png` if no WebP). Keys are lower-case with hyphens, no spaces.

| Class | Size (px) | Background | Final format | Typical size |
|---|---|---|---|---|
| Full-frame scenes: cutscene stills, backdrops, title art, reference boards | **1920×1080** (2560×1440 if your tool makes it natively; never upscale) | opaque | WebP q88 | 0.3–0.9 MB |
| Tall title art | 1080×1920 | opaque | WebP q88 | 0.4–0.8 MB |
| Cutscene plates (crowd, podium, hats) | 1920×1080 | **transparent** | WebP lossless-alpha | 0.4–1.2 MB |
| Character poses | **1024×1536** (portrait) | **transparent** | WebP alpha | 0.15–0.4 MB |
| Portraits | 1024×1024 | **transparent** | WebP alpha | 0.08–0.25 MB |
| Icons, badges, logos, food, fish, mini-game pieces | **512×512** (fish 768×384) | **transparent** | WebP alpha | 20–70 KB |
| Seamless textures | 1024×1024, **tileable** | opaque | WebP q90 | 0.06–0.2 MB |
| Light and particle sprites | 512×512 or 1024×1024 | transparent | WebP alpha | 20–150 KB |
| Posters | 1024×1536 | opaque | WebP q88 | 0.1–0.3 MB |

**Transparent images.** Output real alpha if your tool can. If it cannot, render the subject on a **flat pure magenta `#FF00FF` background** with no shadow, no gradient, no magenta anywhere in the subject; the packaging script (§2) keys it out. Never leave a white or grey background on a transparent-class image.

**Text.** **No text anywhere**: no letters, numbers, signs, banners, book titles, diploma wording, logos with words. The game draws all text itself. Where a sign, banner, diploma or poster appears, paint it **blank** (clean panel, trim and ornament only). Blank white sign boards in a crowd are fine.

**Folder layout** (mirror this exactly under your working folder `art/`):

```
art/assets/cutscene/…     art/assets/chars/…     art/assets/title/…     art/assets/ui/…
art/assets/portraits/…    art/assets/bg/…        art/assets/icons/…     art/assets/badges/…
art/assets/logos/…        art/assets/fish/…      art/assets/food/…      art/assets/mini/…
art/assets/tex/…          art/assets/fx/…        art/assets/posters/…
art/reference-art/…       (boards for me to look at; the game never loads these)
```

---

## 2. Packaging into zip files of 20 MB or less

Save every finished image (PNG, JPG or WebP, at the sizes above) under `art/` using the keys in §5. When you want to hand over (or when a pack is finished) run:

```
python3 package_art.py art out_zips
```

The script converts everything to WebP (keeping alpha), keys out magenta backgrounds on cut-out images, shrinks anything over its size cap, **packs each top-level group into zips that never exceed 19 MB**, and writes `MANIFEST.csv` listing every file, its zip and its size. Zip names are `freshgrad-art-<group>-<NN>.zip`. Inside a zip the paths start with `assets/` or `reference-art/`, so unzipping needs no renaming:

- unzip `assets/…` into `fresh-grad/v2-visual-upgrade/` (creates `assets/`),
- unzip `reference-art/…` into `fresh-grad/`.

If a single file is ever over 19 MB the script stops and names it; reduce that image and run again. Test the splitting any time with `FG_LIMIT_MB=3 python3 package_art.py art test_out`.

**Expected zips** (about 14; sizes are estimates at the specs above):

| Group (folder) | Pack | Images | Est. size | Zips |
|---|---|---|---|---|
| `cutscene` | P01, P02 | 19 | 14–18 MB | 1–2 |
| `chars` | P03, P12 | 15 (+45 optional) | 6–8 MB | 1 |
| `title`, `ui` | P04 | 8 | 4–6 MB | 1 |
| `portraits` | P05 | ~80 | 8–12 MB | 1 |
| `bg` | P06 | 36 | 15–25 MB | 2 |
| `icons`, `badges`, `logos`, `food` | P07 | ~140 | 6–9 MB | 1 each |
| `fish`, `mini` | P08 | ~60 | 3–5 MB | 1 each |
| `tex`, `fx` | P09 | ~44 | 4–7 MB | 1 each |
| `posters` | P10 | 9 | 1–2 MB | 1 |
| `reference` | P11 | ~62 | 18–30 MB | 2 |

### `package_art.py` (save this file next to `art/`; needs `pip install pillow`)

```python
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
```

### `slice_parts.py` (only for P12 paper-doll sheets)

```python
#!/usr/bin/env python3
"""Cut a paper-doll parts sheet (parts on a transparent or flat #FF00FF background) into one PNG per part.

    python3 slice_parts.py <sheet.png> <out_dir> <name1,name2,...>

Parts are found as separate blobs, ordered left-to-right within rows, rows top-to-bottom, and named in that order.
Check the count matches the names; if blobs merge, increase the gap between parts and regenerate the sheet."""
import os, sys
from collections import deque
from PIL import Image

def main(sheet, out, names):
    im = Image.open(sheet).convert('RGBA'); w, h = im.size; px = im.load()
    def solid(x, y):
        r, g, b, a = px[x, y]
        return a > 24 and not (r > 230 and g < 40 and b > 230)
    seen = bytearray(w * h); blobs = []
    for y in range(h):
        for x in range(w):
            if seen[y * w + x] or not solid(x, y): continue
            q = deque([(x, y)]); seen[y * w + x] = 1; x0 = x1 = x; y0 = y1 = y; n = 0
            while q:
                cx, cy = q.popleft(); n += 1
                x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                for nx, ny in ((cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and solid(nx, ny):
                        seen[ny * w + nx] = 1; q.append((nx, ny))
            if n > 400: blobs.append((x0, y0, x1 + 1, y1 + 1))
    blobs.sort(key=lambda b: (round(b[1] / (h / 6)), b[0]))
    if len(blobs) != len(names): sys.exit(f'found {len(blobs)} parts but {len(names)} names; adjust spacing')
    os.makedirs(out, exist_ok=True)
    for (x0, y0, x1, y1), name in zip(blobs, names):
        part = im.crop((x0, y0, x1, y1))
        pp = part.load()
        for yy in range(part.height):
            for xx in range(part.width):
                r, g, b, a = pp[xx, yy]
                if r > 230 and g < 40 and b > 230: pp[xx, yy] = (0, 0, 0, 0)
        part.save(os.path.join(out, name + '.png'))
    print(f'wrote {len(names)} parts to {out}')

if __name__ == '__main__':
    if len(sys.argv) != 4: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2], sys.argv[3].split(','))
```

---

## 3. Style bible

### 3.1 North star
**Cozy golden-hour small-town storybook, drawn for a game.** Think of the key art of a modern indie life-sim (the warmth of *A Short Hike* and *Unpacking*, the clean readable shapes of a good editorial illustration). Everything should feel **hand-made, warm, slightly funny, and kind**. People are friendly. Light is the star: warm sun and lamp light against cool, deep-navy shadows. The world is a little tidy and a little lived-in at once (flower boxes, scuffed pavement, a taped-up poster).

### 3.2 Rules that apply to every image
- **Shapes:** clean, confident, simplified shapes. Edges are soft-lit, **not** heavy black outlines. A subtly darker tone of the fill is the only "line".
- **Shading:** soft cel shading with gentle painterly gradients. One clear key light (warm, from the upper left unless the prompt says otherwise), one cool bounce/ambient from the opposite side, and a soft ambient-occlusion shadow where things touch.
- **Colour:** rich but slightly desaturated. Recurring accents are **marigold gold `#ffc247`** and **coral `#ff7a59`** against **deep navy `#0b131e → #1d2e6b`**. Never pure black or pure white: shadows are navy-violet, highlights warm cream.
- **Detail density:** every surface has a small amount of texture or wear. Nothing is a flat empty fill over a large area. No tiny noisy detail that would vanish at game scale.
- **Faces:** simple and expressive: round dark eyes with a small white highlight, soft brows, small mouth, a faint cheek blush. Proportions slightly chibi (head ≈ ¼ of body height). Diverse ages, skin tones and body types; always friendly.
- **Grain:** a very light film grain / dither. No plastic "AI sheen", no over-smoothed skin, no glossy 3D look.
- **Avoid:** photorealism, 3D-render look, anime big-eyes, heavy outlines, horror, gore, text, logos, watermarks, brand names, cluttered micro-detail, extra fingers, cropped heads.

### 3.3 Style anchors (generate first, P00)
Pick the best of each and attach them as **style references** to everything afterward (use them as an image reference input if your tool supports it; otherwise paste the matching text block). If a later image drifts from the anchors, regenerate it.

### 3.4 Style blocks (paste at the start of each prompt)

**`[SCENE]`**
> Stylized 2D digital illustration for a cozy small-town life-sim game. Clean confident shapes with soft cel-shading and painterly gradient lighting, gentle atmospheric depth, warm golden-hour light against cool deep-navy shadows, rich yet slightly desaturated palette with marigold gold (#ffc247) and coral (#ff7a59) accents, deep navy (#0b131e to #1d2e6b) shadows, subtle film grain, crisp readable silhouettes, charming and quietly funny. Not a photograph, not a 3D render. No text, no letters, no logos.

**`[CHAR]`** (full-body characters and poses)
> Stylized 2D character illustration for a cozy life-sim game, same world as the scene style: slightly chibi-leaning proportions (head about one quarter of body height), simple expressive faces (round dark eyes with a small white highlight, soft eyebrows, small mouth, faint cheek blush), soft cel-shading with one warm rim light from the upper left, clean shapes with subtly darker-tone edges instead of heavy outlines, rich fabric folds, even neutral lighting suited to animation reference, full body, no text. Transparent background (or flat #FF00FF), no ground shadow.

**`[PORTRAIT]`**
> Stylized 2D character bust portrait for a cozy life-sim game: head and shoulders, three-quarter turn toward the viewer's right, warm friendly expression, round dark eyes with a small white highlight, soft brows, faint cheek blush, soft cel-shading with a warm rim light from the upper left, clean shapes without heavy outlines, framing identical for every portrait (head top at 12 % from the top, shoulders cut by the bottom edge, face centred). Transparent background (or flat #FF00FF). No text.

**`[ICON]`**
> A single flat-shaded game icon centred on a transparent background (or flat #FF00FF), bold simple silhouette readable at 48 px, soft top-left highlight and a gentle darker lower edge, rich colour with one warm accent, subtle rim, no outline, no text, no background shape unless stated, generous empty margin (the icon fills about 70 % of the frame).

**`[TEXTURE]`**
> A seamless, perfectly tileable top-down texture, flat even lighting, no baked shadows, no vignette, no perspective, mid-tone neutral colours so a game can tint it, hand-painted look with fine natural variation, no recognisable focal point and no text.

**`[FX]`**
> A single light or particle sprite for a game, centred, soft falloff, on a transparent background (or flat #FF00FF), additive-friendly (bright centre fading to fully transparent), no text.

**`[REF]`** (reference boards)
> Flat, orthographic, straight-on reference illustration in the game's cozy 2D style, even soft daylight, no people and no cars, every shape clearly readable, generous spacing between objects, no text.

**Negative (add wherever your tool allows):** `text, letters, words, numbers, logo, watermark, signature, caption, photorealistic, 3D render, plastic look, anime eyes, heavy black outline, extra fingers, malformed hands, cropped head, duplicated limbs, blurry, low detail, muddy colours, gore, horror`

### 3.5 Palette (keep recurring colours exact)

| Role | Hex |
|---|---|
| Ink navy (deep shadow, UI) | `#0b131e` `#121d2b` `#1c2b3d` |
| Marigold gold (trim, tassels, money, primary) | `#ffc247` · graduation gold `#f0b429` · dean gold `#d4a017` |
| Coral (the Graduate's tee, warm accent) | `#ff7a59` |
| Gown royal navy | `#1d2e6b` |
| Dean's gown / mortarboard | `#1b1b21` / `#0f1626` |
| Curtain wine | `#7a1f33` (shadow `#5c1526`) |
| Diploma cream / ribbon red | `#f6f0dc` / `#c9402f` |
| Hunger / thirst / energy / mood | `#ff9a3d` / `#47b8ff` / `#a393ff` / `#ff7eb6` |
| Good / warning / bad | `#5be3a0` / `#ffb54a` / `#ff6b6b` |
| Sky day | `#54a0e8` → `#cee8f8` |
| Golden hour | `#ffd08c` amber → `#ff8a5c` orange |
| Dusk / night | `#824e80` plum / `#080c22` `#18224e` |

**The six jobs** (wall / roof / accent): Computer Science · Software Developer, Northgate Software `#5f7fa8 / #2f3f5a / #6fd1ff` · Engineering · Design Engineer, Keller Dynamics `#8a8f98 / #444a55 / #ffb347` · Nursing · Registered Nurse, Mercy General Hospital `#e8eef0 / #c9444f / #ff6b7a` · Business · Account Manager, Harlan & Pike `#9b7bb0 / #4a3560 / #e0b0ff` · Education · Third Grade Teacher, Lakeview Elementary `#e3b04f / #9a3b2e / #fff1b0` · Culinary Arts · Line Cook, The Copper Pan `#c46a3b / #5b2a1d / #ffd08a`.

**The seasons** (7 days each): spring = blossom pink and fresh green; summer = lush deep green with warm light; autumn = rust `#c8552a`, gold `#d98f22`, crimson `#b0402f`, olive `#9a8f2c`; winter = white snow `#eef4fa` with blue shadows and frozen water.

### 3.6 Camera and composition by class
- **Cutscene stills:** cinematic 16:9, focal point in the centre third, **bottom 18 % calm** (captions sit there), top-left or top-right kept uncluttered for the "Skip" button.
- **Backdrops (dreams, scenes, fishing, jobs):** composition is calm in the **centre and lower third** (game UI sits there); the interesting detail sits in the upper two-thirds and edges.
- **Poses, portraits, icons:** identical framing inside a set (see each prompt), so pieces swap cleanly.
- **Reference boards:** flat, orthographic, straight-on or true top-down; no mood lighting.
- **Textures:** perfectly tileable; check by tiling 2×2 before delivering.

### 3.7 Consistency tips
- Attach the **style anchors** (P00) to every prompt, and the **Graduate / Dean sheets** to every prompt with those characters.
- Re-use the same wording for recurring characters (copy their line from §4).
- If your tool supports a fixed seed or a "character reference" feature, use it for the Graduate.
- Review each image against the checklist in §7 before it goes into `art/`.

---

## 4. Recurring cast and set (paste the relevant block into any prompt with them)

**THE GRADUATE** (the player; gender unspecified, so draw a friendly, androgynous young adult; if you prefer a specific look, edit this single line once and keep it identical everywhere): *warm light-medium skin (#e8b48f), short neat dark-brown hair (#2a1f18) with two small side tufts, dark round eyes, gentle smile, ordinary build.* **Graduation outfit:** royal-navy gown (#1d2e6b), loose, ending at the shin; **gold stole (#f0b429)** hanging down both lapels; flat black-navy mortarboard (#0f1626) with a **gold tassel**; dark trousers and plain dark shoes below the hem. **Everyday outfit:** **coral tee (#ff7a59)**, dark-blue jeans (#2c3e57), dark shoes (#20242c).

**THE DEAN:** *older, kind, lined face with laugh lines, silver hair (#cfcfd4) under the cap, warm light skin (#e6b995), slightly stooped, dignified.* Black gown (#1b1b21), **gold stole (#d4a017)**, black mortarboard with a short gold tassel.

**CLASSMATES** (eight fellow graduates, same navy gown and gold stole): skin tones `#e0ac86` `#f2c9a5` `#8f5d3d` `#d99d77`; hair `#2b2118` `#7a4a2a` `#1a1a1a` `#d8c27a`; varied builds and heights, some curly, some long, one with glasses.

**THE STAGE:** an outdoor commencement stage on a university lawn: warm wooden plank floor (#8b6a4a, front fascia #6b4d35), **wine-red velvet curtains** (#7a1f33) with a **gold valance** (#f0b429), a **navy banner panel with gold trim, left completely blank**, **bunting** in coral #ff6b6b / marigold #ffc247 / sky #47b8ff / green #5bd39b, a **wooden podium** (#6b4a30) with a **round gold medallion** and a gooseneck microphone, soft green hills and a tree line behind, blue sky with clouds, audience in dark navy silhouette in front holding blank coloured sign boards (green, blue, yellow, red).

**THE TOWN (Maple Court):** warm brick and painted-stucco shopfronts with scalloped awnings and flower boxes, iron lamp-posts with cream glass lanterns, blue bus shelters with a lit poster, zebra crossings, a green park with a stone fountain, a pond with ducks and a small green-roofed bandstand. Two parallel main streets, three cross streets, a skyline of towers beyond.

---

## 5. The prompt packs

**Item format.** `ID · key · size · alpha · style` then the prompt. Final prompt sent to the generator = **style block** + any **cast block** + the item prompt + **Negative**. Keys have no extension (save as `.png`/`.webp`; the packager converts). "alpha" = transparent background.

### P00 — Style anchors (Tier A · generate first · reference only)
Save to `art/reference-art/P00-*`.

**P00-A · `reference-art/p00-a-street` · 1920×1080 · opaque · [SCENE]**
> A warm golden-hour view down a charming small-town main street: brick and painted-stucco shopfronts with scalloped awnings and flower boxes, glowing windows just turning on, iron lamp-posts, a blue bus shelter with a lit poster, a zebra crossing, a few pedestrians in simple clothes, long soft shadows, a skyline of towers at the end of the street. Calm lower third.

**P00-B · `reference-art/p00-b-character-stage` · 1920×1080 · opaque · [SCENE] + the Graduate + the stage**
> The Graduate in graduation outfit mid-stride across the commencement stage toward the Dean at the gold-medallion podium, warm follow-spot light, eight classmates in navy gowns at the left, wine-red curtains, blank navy banner, bunting, audience silhouettes below.

**P00-C · `reference-art/p00-c-icons-faces` · 1920×1080 · opaque · [ICON] + [PORTRAIT]**
> A tidy board showing the game's small-asset look: left half, a 4×3 grid of twelve flat game icons (sun, moon, plate and fork, water drop, speech bubble, shopping basket, open book, bicycle, star, briefcase, coin, fish); right half, six bust portraits of different friendly townspeople (varied age, skin tone, hair), same framing, on a soft navy ground.

---

### P01 — Opening cutscene stills (Tier A · `cutscene/` · wired)
The cutscene runs ~20 s. The game plays these as slow push-ins and drifts, cross-faded over its own animated scene, with its own confetti, light and captions on top. All `1920×1080 · opaque · [SCENE]`, characters per §4. Keep the bottom 18 % calm.

**CS-01 · `cutscene/still-01-quad`** — *beat 0.7–3.4 s: "Commencement day. Four years of lectures, group projects and cheap coffee."*
> Wide establishing shot of a university quad on commencement morning. Hundreds of white folding chairs in neat rows filled with families, a temporary stage with wine-red curtains and a blank navy banner at the far end, strings of colourful bunting between old iron lamp-posts, a brick clock tower and big oak trees, low sun raking across dewy grass with long soft shadows, small figures in navy gowns forming a line at the left, balloons tied to chairs, soft cumulus clouds, a feeling of nervous excitement. Slightly high wide-angle, strong depth, no close figures.

**CS-02a · `cutscene/still-02a-lecture`** · **CS-02b · `cutscene/still-02b-group`** · **CS-02c · `cutscene/still-02c-coffee`** · **CS-02d · `cutscene/still-02d-allnighter`** — *four quick "memory" cutaways during the same line; slightly faded, warm-vignetted.*
> **a (lecture):** a vast tiered lecture hall seen from the back row, rows of half-asleep students, a tiny professor at a distant whiteboard, a big wall clock, dust in slanted window light.
> **b (group project):** a cluttered library table at dusk: laptops, pizza boxes, sticky notes, highlighters, four tired but laughing students (generic faces), a half-built cardboard model.
> **c (cheap coffee):** extreme close-up of a chipped paper coffee cup on a dorm desk at 2 a.m., laptop glow, a crumpled to-do list, rain on the window behind.
> **d (all-nighter):** a desk-lamp pool in a dark room, a tower of textbooks, an alarm clock, a sleepy head resting on folded arms.

**CS-03 · `cutscene/still-03-wings`** — *beat 3.7–6.3 s: "And now, our final graduate of the day!"* · ref: Graduate sheet
> View from backstage: the Graduate seen from behind in gown and cap, holding the tassel nervously, a line of classmates ahead, a bright slit of stage light and cheering crowd beyond the curtain edge, wine-red velvet in the foreground, dust motes in the light, a stage-manager's hand pointing the way. Tension and a hopeful glow.

**CS-04 · `cutscene/still-04-walk`** — *beat 3.7–6.9 s: the walk* · ref: Graduate, Dean, classmates
> Wide shot from the audience, slightly low angle. The Graduate walks across the wooden stage toward the Dean at the gold-medallion podium, two warm follow-spot beams crossing with floating dust, eight classmates in navy gowns lined at the left, the blank navy banner behind, bunting, wine-red curtains. Foreground: dark silhouettes of audience heads with phones raised and blank coloured signs.

**CS-05 · `cutscene/still-05-handshake`** — *beat 7.0–9.7 s: "Congratulations. Go do something wonderful."* · ref: Graduate, Dean
> Medium shot at stage level, shallow depth of field. The Graduate and the Dean shake hands, the Dean's other hand holding a rolled diploma with a red ribbon, gold stoles catching the light, a tassel mid-swing, both smiling genuinely, soft bokeh of the audience and a camera-flash sparkle behind. Warm rim light.

**CS-06 · `cutscene/still-06-diploma`** — *beat 9.9–12.2 s: "A diploma. Heavy paper, a gold seal and no idea what happens next."*
> Extreme close-up of the diploma passing between hands: a rolled scroll of heavy cream paper (#f6f0dc) with a red ribbon (#c9402f) and a raised gold wax seal, visible paper fibres, a gold tassel dangling across the frame, beautifully blurred stage and crowd in warm bokeh. Reverent, a little overwhelming.

**CS-07 · `cutscene/still-07-hats`** — *beat 12.4–15.0 s: "Hats in the air!"* · ref: Graduate, classmates
> Joyful wide low-angle shot: dozens of black mortarboards mid-air against bright blue sky, gold tassels trailing, confetti and streamers in coral, marigold, sky-blue and green, the whole graduating class on stage with arms up, the Graduate in the centre foreground holding the diploma overhead, sun flare through the confetti, audience on their feet in silhouette. Peak of the emotion.

**CS-08 · `cutscene/still-08-face`** — *beat ≈ 15.0 s (the quiet after the cheer)* · ref: Graduate
> Medium close-up of the Graduate laughing with the cap gone and hair slightly messy, diploma pressed to their chest, confetti drifting past, eyes bright with happy tears and a flicker of "what happens now?". Golden light from the upper left, shallow depth of field, the stage out of focus.

**CS-09 · `cutscene/still-09-sunset`** — *beat 15.4–19.6 s: cards "Diploma in hand." → "Now, what does it say?"* · ref: Graduate
> Quiet final frame: the Graduate seen from behind in the empty quad at golden hour, gown over one arm, diploma in hand, walking toward a softly glowing small-town skyline (brick buildings, a bus stop, lamp-posts just switching on) at the end of a path, long shadow, a few stray confetti pieces on the grass, deep navy sky at the top fading to amber at the horizon. Hopeful, a little lonely.

**CS-10 · `cutscene/still-10-family`** — *optional cutaway; not wired yet*
> Audience rows seen from the stage: relatives cheering and crying, blank coloured sign boards, a balloon bouquet, a toddler on someone's shoulders, a grandparent with a camera, warm afternoon light, joyful chaos, generic faces.

---

### P02 — Cutscene plates and sprites (Tier A · `cutscene/` · wired)
Layers the game composites so the cutscene can move a camera through a real set. No people except the crowd silhouettes.

**PL-01 · `cutscene/plate-stage-empty` · 1920×1080 · opaque · [SCENE]**
> Straight-on view of the empty commencement stage at standing eye height: wooden stage-floor edge at 72 % from the top, wine-red curtains with gold valance at left and right, a **completely blank navy banner panel with gold trim** high at centre (about 40 % wide), bunting in coral/marigold/sky-blue/green swagged across the top, soft green hills and tree line, blue sky with clouds, no podium, no people, no foreground. Soft late-morning light from the upper left.

**PL-02 · `cutscene/plate-crowd-front` · 1920×1080 · alpha · [SCENE]**
> Foreground layer only: rear views of audience heads and shoulders in deep navy silhouettes filling the bottom 30 % of the frame in two overlapping rows, some with arms raised, some holding phones, some holding blank rectangular sign boards (green #5bd39b, blue #47b8ff, marigold #ffc247, red #ff6b6b) on sticks, subtle rim light on hair. Everything above the heads transparent.

**PL-03 · `cutscene/plate-crowd-back` · 1920×1080 · alpha · [SCENE]**
> Distant audience rows in dusty blue-navy, smaller scale, standing and cheering, a few hats in the air, lawn chairs, balloons; transparent above the crowd; slightly desaturated for depth.

**PL-04 · `cutscene/plate-podium` · 1024×1536 · alpha · [SCENE]**
> A wooden speaker's podium (#6b4a30 with lighter top #8b6240) with a round **gold medallion** on the front and a gooseneck microphone, front-on, resting on the bottom edge, no ground shadow.

**PL-05 · `cutscene/sprites-hats-confetti` · 2048×2048 · alpha · [SCENE]**
> A sprite sheet on a transparent background, widely spaced: twelve black mortarboard caps (#0f1626) at varied tilts and rotations seen from slightly below with gold tassels (some trailing), six rolled diplomas with red ribbons at varied angles, and forty paper confetti pieces and eight curling streamers in coral, marigold, sky-blue, green, violet and white.

---

### P03 — The cast: model sheets and animation poses (Tier A · `chars/`)
**Generate CH-01 and CH-04 first.** Then attach them to everything else.

**CH-01 · `reference-art/ch-01-grad-sheet` · 1920×1280 · opaque light grey · [CHAR]**
> Turnaround model sheet of THE GRADUATE in graduation outfit: four full-body views side by side at identical scale and ground line (front, three-quarter front, side, back), relaxed standing pose, arms slightly away from the body, no props. Beneath: close-ups of the cap with tassel (front and side) and the gold stole detail. Even neutral lighting.

**CH-02 · `reference-art/ch-02-grad-faces` · 1920×1080 · opaque · [CHAR]**
> A 4×2 grid of head-and-shoulder portraits of THE GRADUATE (gown and cap): neutral, big happy laugh, nervous, proud, surprised, teary-joyful, tired, sleeping. Same camera and scale.

**CH-03 · `chars/grad/pose-<name>` · 1024×1536 each · alpha · [CHAR] · ref: CH-01**
Eight separate images. **Identical framing for all eight: camera at waist height, feet touching the bottom edge, body centred, head top at 10 % from the top, same scale**, so poses can be swapped frame to frame. Base prompt: *THE GRADUATE in graduation outfit, full body, transparent background, no ground shadow, pose:*
| key | pose |
|---|---|
| `chars/grad/pose-idle` | standing relaxed, arms at sides, cap on, soft smile |
| `chars/grad/pose-walk-a` | mid-stride, left foot forward, right arm forward, confident |
| `chars/grad/pose-walk-b` | mid-stride, right foot forward, left arm forward (opposite phase of walk-a) |
| `chars/grad/pose-handshake` | right hand extended to shake, other hand gripping the tassel, leaning in slightly, smiling |
| `chars/grad/pose-diploma-up` | right arm straight up holding the rolled diploma overhead, head tilted up, mouth open in a cheer |
| `chars/grad/pose-cap-toss` | both arms thrown upward, cap just leaving the head (cap in the image, slightly above), joyful |
| `chars/grad/pose-wave` | right hand waving to the crowd, diploma in the left hand against the chest |
| `chars/grad/pose-nervous` | hands clasped at the front, shoulders up, glancing sideways, tassel swaying |

**CH-04 · `reference-art/ch-04-dean-sheet` + `chars/dean/pose-<name>` · [CHAR]**
Sheet (1920×1280, opaque light grey): turnaround of THE DEAN (front, 3/4, side, back). Poses (1024×1536 alpha, same framing rule as CH-03): `chars/dean/pose-idle` (hands folded, dignified) · `chars/dean/pose-handshake` (hand extended, other hand holding a rolled diploma with red ribbon, warm smile) · `chars/dean/pose-clap` (applauding) · `chars/dean/pose-point-announce` (one arm extended toward the Graduate as if announcing).

**CH-05 · `chars/ch-05-classmates-stand`, `chars/ch-05-classmates-cheer`, `chars/ch-05-classmates-toss` · 1920×1080 each · alpha · [CHAR]**
> A lineup of eight distinct graduating classmates in navy gowns with gold stoles and mortarboards, evenly spaced on a shared ground line at identical scale, **varied skin tones, hair, builds and heights** (see CLASSMATES in §4). Three images: (1) standing politely, hands at sides; (2) cheering with both arms raised, mouths open; (3) caps just thrown from their heads, arms up, caps in the air above each head.

**CH-06 · `reference-art/ch-06-grad-everyday-sheet` · 1920×1280 · opaque · [CHAR]**
> Turnaround sheet (front, 3/4, side, back) of THE GRADUATE in the everyday outfit (coral tee, dark jeans, dark shoes), plus a small row showing customisation options: five hairstyles (short and neat, long and loose, top knot, curly crop, cycling cap) and seven shirt colours (coral, teal #2a9d8f, navy button-down #3d5a80, mustard sweater #e9c46a, white shirt, violet polo #7b6fd0, red flannel #c0392b).

---

### P04 — Title screen, diploma and ceremony art (Tier A · `title/`, `ui/` · wired)

**UI-01 · `title/hero-wide` · 1920×1080 · opaque · [SCENE] · ref: CH-06**
> Golden-hour view down a charming small-town main street (brick and painted-stucco shopfronts with awnings, glowing windows just turning on, a bus stop, lamp-posts, a park fountain in the distance, a skyline of towers at the horizon), the Graduate in the **everyday coral tee** with a rolled diploma under one arm and the graduation cap in the other hand, walking toward us on the right third, **leaving the left 45 % of the frame calm and low-detail** for the title lettering. Warm amber sky fading to navy at the top, long shadows, a few birds.

**UI-02 · `title/hero-tall` · 1080×1920 · opaque · [SCENE]**
> The same scene recomposed vertically for phones: the Graduate in the lower third, the top 40 % a calm sunset sky.

**UI-03 · `ui/diploma` · 1600×1200 · alpha · [SCENE]**
> A formal diploma lying flat, seen straight-on: heavy cream paper (#f6f0dc) with subtle fibres, an ornate engraved navy double border with corner flourishes, a **large blank central area** for text (no words), a **raised gold wax seal with a red ribbon** at the lower right, a faint crest watermark (a laurel and an open book, no letters) at the centre, soft paper shadow around the edge, one slightly curled corner at top-left.

**UI-04 · `ui/paper-cream`, `ui/paper-navy-card`, `ui/paper-kraft` · 1024×1024 · opaque · [TEXTURE]**
> Three seamless textures: warm cream cotton paper; deep navy velvet-paper with a faint gold fleck; kraft cardboard. No text.

**UI-05 · `ui/phone-wallpaper` · 1170×2532 · opaque · [SCENE]**
> Soft abstract illustration of the town at dusk: layered rooftops in navy and plum, a few warm lit windows, a crescent moon, gradient sky from marigold to indigo. Calm enough to put icons on.

**UI-06 · `ui/passport-cover` · 1024×1536 · alpha · [SCENE]**
> A worn navy booklet cover seen straight-on, gold embossed emblem (a small town skyline over a laurel, no letters), slightly scuffed corners and a soft cloth texture.


---

### P05 — Speaking portraits (Tier B · `portraits/` · every conversation currently has no face)

**Prompt for each:** `[PORTRAIT]` + the row below. Format `portraits/<slug>`, 1024×1024, alpha. **Identical framing for all** (see `[PORTRAIT]`). Clothing colours are the game's; "hair" gives colour and style (*short, long, top-knot, cap, curly, plain*). Warm friendly neutral expression unless a trait says otherwise.

**The Graduate (six):** all in the coral tee `#ff7a59`, skin `#e8b48f`, hair `#2a1f18` unless stated · `grad-short` (short and neat) · `grad-long` (long and loose) · `grad-topknot` · `grad-curly` (curly crop) · `grad-cap` (cycling cap, brim in a darker coral) · `grad-gown` (graduation gown, gold stole, mortarboard with gold tassel). Also `dean` (THE DEAN, kind smile).

| slug | who | shirt | hair | skin | traits |
|---|---|---|---|---|---|
| `maya` | Maya, jogger | `#4f9d7a` | top-knot `#2b2118` | `#e0ac86` | sweatband, bright smile |
| `rosa` | Rosa, dog walker | `#c05d8a` | cap, brown `#7a4a2a` | `#f2c9a5` | friendly, one hand holding a leash |
| `mr-bell` | Mr. Bell, mail carrier | `#e7b64a` | curly black `#1a1a1a` | `#8f5d3d` | mail carrier's cap, mailbag strap, twenty-year grin |
| `theo` | Theo, sleepless student | `#6f7bd4` hoodie | curly blond `#d8c27a` | `#f0c7a4` | sleepy eyes, a paper coffee cup |
| `priya` | Priya, barista on break | `#d0603f` | top-knot `#3b2a20` | `#b87b55` | apron strap, iced coffee |
| `walt` | Walt, retired bench regular | `#5ab0c9` | plain grey-streaked `#222` | `#e6b995` | flat cap, white stubble, easy grin |
| `june` | June, sketch artist | `#9bb86a` | long auburn `#8a5a2b` | `#d99d77` | pencil behind ear, sketchbook edge |
| `officer-cole` | Officer Cole, traffic officer | `#e86f68` | top-knot `#1c1410` | `#a8714f` | thermos, whistle lanyard, calm |
| `ines` | Ines, florist | `#f4a261` | short blond `#c9a24a` | `#f3d0b0` | armful of lilies |
| `lena` | Lena, tourist | `#7b6fd0` | long dark `#4a2a1a` | `#c68a62` | folded map, camera strap |
| `sam-musician` | Sam, street musician | `#2a9d8f` | plain black `#111` | `#74492f` | guitar neck over shoulder |
| `kofi` | Kofi, bike courier | `#e5c7e8` | cap, brown `#6a3a2a` | `#efc3a0` | courier cap, bag strap, grin |
| `mrs-reyes` | Mrs. Reyes, landlord | `#6f7bd4` cardigan | curly blond `#d8c27a` | `#f0c7a4` | warm, reading glasses on a chain |
| `dev` | Dev, night-owl neighbour | `#7b6fd0` | long `#4a2a1a` | `#c68a62` | headphones round neck, drumsticks |
| `mr-tanaka` | Mr. Tanaka, grocery cashier | `#e7b64a` apron | curly black `#1a1a1a` | `#8f5d3d` | name badge, patient smile |
| `ms-odell` | Ms. Odell, shopper | `#c05d8a` | cap, brown `#7a4a2a` | `#f2c9a5` | basket on arm |
| `dot` | Dot, diner owner | `#f4a261` uniform | short golden `#c9a24a` | `#f3d0b0` | apron, big warm "hon" smile |
| `gus` | Gus, diner regular | `#9bb86a` | long auburn `#8a5a2b` | `#d99d77` | weathered, mug of black coffee |
| `nurse-imani` | Nurse Imani, clinic desk | `#e5c7e8` scrubs | cap, brown `#6a3a2a` | `#efc3a0` | lanyard, calm |
| `dr-chen` | Dr. Chen, physician | `#5ab0c9` scrubs, white coat | plain `#222` | `#e6b995` | stethoscope |
| `mr-okafor` | Mr. Okafor, pharmacist | white coat `#f4f7f9` | short `#1a1a1a` | `#7a4a2c` | gentle, precise |
| `greta` | Greta, bank teller | `#2a6f97` blazer | top-knot blond `#d8c27a` | `#f0c7a4` | lollipop jar glimpsed |
| `mr-hale` | Mr. Hale, financial advisor | `#3a3340` suit and tie | short grey `#6a6a6a` | `#e0ac86` | serious but kind |
| `agnes` | Agnes, bookshop owner | `#9b7bb0` | silver top-knot `#c9c9cf` | `#f2c9a5` | reading glasses, mischievous |
| `milo` | Milo, reader in the nook | `#4f9d7a` | curly `#3b2a20` | `#b87b55` | holding a book |
| `luc` | Luc, baker | cream `#f6f1e7` apron | baker's cap over `#7a4a2a` | `#f3d0b0` | flour on one cheek |
| `tess` | Tess, waiting for a cinnamon roll | `#ff7a59` | top-knot `#8a5a2b` | `#d99d77` | eager |
| `hank` | Hank, hardware owner | `#c0392b` | grey cap `#8a8a8a` | `#d99d77` | grey beard, tool-belt strap |
| `zoe-cinema` | Zoe, cinema concessions | `#7a1f33` vest | long black `#111` | `#74492f` | cinema vest, popcorn scoop |
| `ike` | Ike, ticket booth | `#e9c46a` | short `#3b2a20` | `#8f5d3d` | bored but friendly |
| `bianca` | Bianca, stylist | `#c05d8a` | **long teal** `#2a9d8f` | `#efc3a0` | scissors in hand |
| `gwen` | Gwen, mid-highlights | `#e5c7e8` | long honey `#d9b46a` with foils | `#efc3a0` | cheerful, a little "half foil" |
| `mrs-kim` | Mrs. Kim, laundromat | `#2a9d8f` | top-knot `#1a1a1a` | `#e6b995` | brisk, knowing |
| `nadia` | Nadia, folding laundry | `#e9c46a` | long `#1a1a1a` | `#8f5d3d` | calm |
| `rafa` | Rafa, bike mechanic | `#e76f51` | cap, brown `#3b2a20` | `#a8714f` | oil smudge on cheek |
| `luna` | Luna, cafe owner | `#3d5a80` | long chestnut `#5a3825` | `#c68a62` | apron, moon-pendant |
| `otis` | Otis, screenwriter | `#6f7bd4` | curly blond `#d8c27a` | `#f0c7a4` | laptop glow on face |
| `sal` | Sal, pizza maker | `#f6f1e7` | short `#1c1410` | `#d99d77` | floury apron, proud |
| `ruby-dental` | Ruby, dental receptionist | `#8ecae6` scrubs | top-knot auburn `#8b3a1e` | `#f0c7a4` | cheerful |
| `dr-patel` | Dr. Patel, dentist | `#e8f4f8` coat | short `#2b2118` | `#c68a62` | mask pulled down, gentle |
| `noor` | Noor, senior developer | `#d0603f` hoodie | top-knot `#3b2a20` | `#b87b55` | headphones, focused |
| `felix` | Felix, QA tester | `#e86f68` | top-knot `#1c1410` | `#a8714f` | sceptical eyebrow |
| `dana-whitlock` | Dana Whitlock, engineering manager | `#2a9d8f` | plain `#111` | `#74492f` | lanyard, calm authority |
| `olga` | Olga, machinist | `#9bb86a` coveralls | long auburn `#8a5a2b` | `#d99d77` | safety glasses on forehead |
| `pavel` | Pavel, junior engineer | `#7b6fd0` | long `#4a2a1a` | `#c68a62` | hard-hat hair, eager |
| `mr-keller` | Mr. Keller, founder | `#4f9d7a` | top-knot `#2b2118` | `#e0ac86` | worn vest, "one lathe, one loan" pride |
| `dr-amari` | Dr. Amari, attending physician | `#5ab0c9` scrubs, white coat | plain `#222` | `#e6b995` | tired, kind |
| `tomas` | Tomas, orderly | `#e86f68` scrubs | top-knot `#1c1410` | `#a8714f` | easy grin |
| `head-nurse-rosalind` | Head Nurse Rosalind | `#6f7bd4` scrubs | curly blond `#d8c27a` | `#f0c7a4` | 22 years, unflappable |
| `carter` | Carter, account analyst | `#2a9d8f` shirt, loosened tie | plain `#111` | `#74492f` | spreadsheet-tired |
| `imogen` | Imogen, receptionist | `#c05d8a` | cap, brown `#7a4a2a` | `#f2c9a5` | headset |
| `ms-pike` | Ms. Pike, partner | `#f4a261` blazer | short blond `#c9a24a` | `#f3d0b0` | sharp, warm |
| `dmitri` | Dmitri, sous chef | `#d0603f` chef's whites | top-knot `#3b2a20` | `#b87b55` | towel on shoulder |
| `beto` | Beto, prep cook | `#e7b64a` apron | curly `#1a1a1a` | `#8f5d3d` | big grin |
| `chef-marisol` | Chef Marisol | chef's whites, tall hat | cap-style, brown `#6a3a2a` | `#efc3a0` | stern then proud |
| `ms-park` | Ms. Park, second-grade teacher | `#c05d8a` | cap, brown `#7a4a2a` | `#f2c9a5` | shares coffee, kind |
| `mr-alvarez` | Mr. Alvarez, PE teacher | `#d0603f` | top-knot `#3b2a20` | `#b87b55` | whistle on lanyard |
| `mrs-okafor` | Mrs. Okafor, cafeteria manager | `#e7b64a` apron | curly `#1a1a1a` | `#8f5d3d` | hairnet, tater-tot smile |
| `principal-dawson` | Principal Dawson | `#6f7bd4` | curly blond `#d8c27a` | `#f0c7a4` | tie, reassuring |
| `mr-kim` | Mr. Kim, music teacher | `#f4a261` | short blond `#c9a24a` | `#f3d0b0` | recorder in pocket |
| `nurse-reed` | Nurse Reed, school nurse | `#e5c7e8` | cap, brown `#6a3a2a` | `#efc3a0` | band-aid sticker |
| `ms-lin` | Ms. Lin, librarian | `#7b6fd0` | long `#4a2a1a` | `#c68a62` | glasses, finger to lips |

**Kids** (eight-year-olds, pastel tees; same framing; friendly): `kid-mia` pink `#ff8fa3` curly `#2b2118` skin `#e0ac86` · `kid-noah` sky `#74c0fc` top-knot `#7a4a2a` skin `#f2c9a5` · `kid-ava` yellow `#ffd43b` long `#1a1a1a` skin `#8f5d3d` · `kid-leo` mint `#8ce99a` curly `#d8c27a` skin `#f0c7a4` · `kid-zoe` lavender `#b197fc` curly `#3b2a20` skin `#b87b55` · `kid-eli` orange `#ffa94d` plain `#222` skin `#e6b995` · `kid-ruby` aqua `#63e6be` top-knot `#8a5a2b` skin `#d99d77` · `kid-max` red `#ff6b6b` cap `#1c1410` skin `#a8714f` · `kid-ivy` blue `#4dabf7` short `#c9a24a` skin `#f3d0b0` · `kid-sam` rose `#f783ac` curly `#4a2a1a` skin `#c68a62`.

*Optional extras for the main ten recurring faces (`dot`, `sal`, `bianca`, `hank`, `mrs-reyes`, `luna`, `agnes`, `dr-chen`, `ms-park`, `greta`):* `<slug>-happy` (big laugh) and `<slug>-worried` (concerned).

---

### P06 — Full-screen backdrops (Tier B · `bg/`)
All `1920×1080 · opaque · [SCENE]`, **no people unless stated, no text**. The game draws animation, light and UI over them, so keep the **centre and lower third calm**.

**Dreams** — `bg/dream-<id>`. Good dreams: luminous, pink-and-amber glows. Bad dreams: unsettling but gentle (red vignette, long shadows), never gory.
| key | dream | prompt |
|---|---|---|
| `bg/dream-fly` | Above the Rooftops | A luminous dusk sky, clouds like pillows, a tiny glowing town far below, a sense of weightless flight. |
| `bg/dream-feast` | The Feast at Dot's | A diner counter and booths heaped with pancakes, pie and a never-empty milkshake, warm glow, nobody drawn. |
| `bg/dream-grad` | Graduation Encore | An impossibly vast auditorium full of smiling faces, caps rising in golden light. |
| `bg/dream-perfect` | The Perfect Day | A flawless sunny day, a huge sun with soft rays over a tidy sparkling town. |
| `bg/dream-pond` | Picnic by the Pond | A still pond at golden hour, ducks in a row, a picnic blanket and basket on the bank. |
| `bg/dream-late` | Late for Day One | A street stretching away, a giant clock face looming, buildings sliding backward, red-tinted. |
| `bg/dream-hall` | The Endless Hallway | A corridor of locked doors in receding red-lit frames, the far end always further. |
| `bg/dream-rent` | Notice on the Door | Paper pouring under a door, the long shadow of feet in the gap, red tint. |
| `bg/dream-empty` | Empty Plates | A long table of empty plates under flickering light, every other place closed and dark. |
| `bg/dream-alarm` | The Alarm That Won't Stop | A room where an alarm-clock face looms from the walls, pulsing rings, hallucinatory. |
| `bg/dream-dry` | Dry Mouth | A cracked dry fountain and a shrinking pond, sand, harsh amber light. |
| `bg/dream-calm` | A Quiet Nap | A warm quiet dark with soft floating particles and a faint horizon glow. |

**Scenes** — `bg/scene-<kind>` (the game animates people and effects on top):
`bg/scene-cinema` a cinema auditorium from the back, rows of maroon seats, silhouettes, a huge glowing blank screen · `bg/scene-laundry` washers with round windows, steam and soap bubbles, window light · `bg/scene-read` a warm reading nook, lamp pool, steaming mug, an open book · `bg/scene-salon` a large gold oval mirror on a blush striped wall (nobody drawn) · `bg/scene-dentist` a ceiling view with a round surgical lamp and a clouds poster · `bg/scene-music` a small stage, spotlight cone, silhouetted crowd · `bg/scene-hang` a small round table with two mugs, cosy cafe light.

**Fishing** — `bg/fishing-day`, `bg/fishing-dusk`, `bg/fishing-night`, `bg/fishing-ice`: a pond seen from the bank, sky with clouds, a far bank of round trees, water with depth and sun glints, lily pads, reeds with cattails in the foreground; keep the water surface open for the game's bobber. The ice version: a pale ice sheet, snow mounds, a dark fishing hole with a white rim, bare snowy trees.

**Workplace heroes for the shift intro** — `bg/job-<id>` (ids `cs eng nurse biz edu cook`): a cosy illustration of that workplace, the job's colours, **no people**: `cs` a bright open-plan office with server racks glowing, beanbags and a whiteboard (blue-grey `#5f7fa8`, cyan `#6fd1ff`) · `eng` a machine shop with a CNC mill, lathe, blueprint board and amber work lights (`#8a8f98`, `#ffb347`) · `nurse` a hospital ward with beds, a nurses' station and soft teal light (`#e8eef0`, `#c9444f`) · `biz` a boardroom with a long table, a view over the city and a targets board (`#9b7bb0`, plum) · `edu` a sunny classroom with small desks, a chalkboard and kids' paintings (`#e3b04f`, `#9a3b2e`) · `cook` a busy restaurant kitchen at rush with ranges, pans, flames and a ticket rail (`#c46a3b`, copper).

**Celebrations and cards** — `bg/levelup` a violet-and-gold radial burst with ribbons and sparkles · `bg/promotion` a gold-and-purple laurel burst · `bg/recap-spring`, `bg/recap-summer`, `bg/recap-autumn`, `bg/recap-winter` a morning window sill with a coffee cup, a folded paper and the season outside (blossom, bright green, falling leaves, snow) · `bg/evicted` a worn apartment door with a new padlock, a few cardboard boxes and a lamp on the pavement at dusk in the rain, gentle melancholy (no person) · `bg/blackout` a quiet clinic waiting-room corner with a chair, a glass of water and a wrapped snack on a table, soft warm light.

---

### P07 — Icons, badges, logos and food (Tier B · `icons/`, `badges/`, `logos/`, `food/`)
Every item: **`[ICON]`**, 512×512, alpha. One image per file. **Perks, stamps and trophies share one medallion style** so each set reads as a family: a round navy disc `#1b1636` with a thin lavender ring, the glyph in white and gold; stamps instead use a rubber-stamp ink look with a dashed inner ring; trophies are gold-foil medals/cups/ribbons.

**Perks (16)** — `icons/perks/<id>` · medallion style
`early` sun rising over a mug · `owl` crescent moon with a tiny owl · `stomach` plate with a shield · `camel` water drop with a camel hump · `social` pink speech bubble · `coupon` shopping basket with a coupon · `napper` a "Zz" on a pillow · `sleeper` moon and a small bed · `bookworm` open book with a tiny worm · `feet` bicycle with small wings · `lucky` four-leaf clover star · `workhorse` briefcase with a horseshoe · `sunny` smiling sun · `saver` coin and piggy bank · `charm` speech bubble with a heart · `angler` blue fish on a hook.

**Passport stamps (18)** — `icons/stamps/<id>` · rubber-stamp ink
`apartment` house (coral `#e07a5f`) · `work` briefcase (blue `#4f8fe0`) · `grocery` basket (green `#3fbf7a`) · `diner` plate and fork (red `#e8505b`) · `clinic` red cross (`#d63b4b`) · `park` tree (green `#2f7d4f`) · `pharmacy` pill (`#2f9d6a`) · `bank` coin (blue `#2a6f97`) · `books` open book (brown `#8a5a3c`) · `bakery` loaf (`#d08a3a`) · `hardware` hammer (red `#c0392b`) · `cinema` film frame (burgundy `#7a1f33`) · `salon` scissors (pink `#c05d8a`) · `laundry` washing machine (teal `#2a9d8f`) · `bikes` bicycle (tomato `#e76f51`) · `cafe` steaming cup (navy `#3d5a80`) · `pizza` slice (green `#2f7d4f`) · `dentist` tooth (teal `#3aa6b9`).

**Trophies (24)** — `icons/trophies/<id>` · gold-foil medal/cup/ribbon, a small glyph in the centre
`pay1` first paycheck (envelope and coin) · `srank` flawless (gold star ribbon) · `s5` on a roll (flame) · `promo1` moving up (up-arrow ribbon) · `promo3` top of the field (crown) · `lvl5` getting the hang of it (rising bars) · `lvl10` pillar of the community (column) · `week` one week down (calendar 7) · `seasons` four seasons (four-leaf in four seasonal colours) · `rent4` model tenant (house key) · `save1k` rainy day fund (umbrella and coin) · `passport` regular (stamped booklet) · `friends5` popular (three speech bubbles) · `book3` bookworm (stack of books) · `films5` cinephile (film strip and ticket) · `look` fresh look (scissors and comb) · `bike` two wheels (bicycle) · `home` home sweet home (cosy house) · `fish10` angler (fish) · `moonfin` legend of the pond (glowing lavender fish under a moon) · `deliver10` rush hour (pizza box and clock) · `stage` brave (microphone) · `goals10` go-getter (checklist) · `hang3` good company (two mugs).

**Weather (7)** — `icons/weather/<id>` · soft glossy-flat: `sun` sun with rays `#ffd34d` · `partly` sun peeking from a cloud · `cloud` cloud `#e6edf4` · `rain` rain cloud with cyan drops `#6fd1ff` · `storm` dark cloud `#7d8796` with a yellow bolt · `snow` snow cloud with white flakes · `fog` sun with two grey fog bars.

**Shop door badges (12)** — `badges/<shop>` · round cream ring `#f6f1e7`, coloured disc, **white line glyph, no text**
`pharmacy` pill (green `#2f9d6a`) · `bank` coin mark (blue `#2a6f97`) · `books` open book (brown `#8a5a3c`) · `bakery` loaf (`#d08a3a`) · `hardware` hammer (red `#c0392b`) · `salon` scissors (pink `#c05d8a`) · `laundry` washing machine (teal `#2a9d8f`) · `bikes` bicycle (tomato `#e76f51`) · `cafe` steaming cup (navy `#3d5a80`) · `pizza` slice (green `#2f7d4f`) · `dentist` tooth (teal `#3aa6b9`) · `cinema` film frame (burgundy `#7a1f33`).

**Employer marks (6)** — `logos/<id>` · 1024×1024 alpha · symbol only, **no lettering**, simple flat marks in each employer's colours:
`cs` Northgate Software (blue-grey `#5f7fa8` + cyan `#6fd1ff`, a compass-needle north-star) · `eng` Keller Dynamics (grey + amber `#ffb347`, a gear with a bolt) · `nurse` Mercy General (white + red `#c9444f`, a heart-cross) · `biz` Harlan & Pike (plum `#4a3560` + lavender `#e0b0ff`, two interlocking pillars) · `edu` Lakeview Elementary (mustard `#e3b04f` + brick `#9a3b2e`, an eagle head in a shield) · `cook` The Copper Pan (copper `#c46a3b` + cream, a frying pan with a flame).

**Food and drink (about 60)** — `food/<slug>` · `[ICON]` 512×512 alpha, warm painterly-flat, soft highlight
- Diner: `diner-breakfast-plate` eggs, hash browns, toast · `diner-lunch-special` burger, fries and a pickle · `diner-dinner-plate` meatloaf, mash and gravy · `diner-fries-pie` · `diner-pie-slice` · `diner-coffee` · `diner-milkshake` · `diner-ice-water` · `diner-jukebox-song` a vinyl record
- Grocery: `grocery-breakfast-pack` oats, eggs, bread · `grocery-lunch-pack` sandwich fixings · `grocery-dinner-pack` pasta, veg, sauce · `grocery-snack-bar` · `grocery-water` · `grocery-orange-juice` · `grocery-soda` · `grocery-energy-drink`
- Bakery and cafe: `bakery-croissant-coffee` · `bakery-cinnamon-roll` · `bakery-cake-slice` lemon · `bakery-croissant` · `bakery-loaf` · `bakery-day-old-bag` · `cafe-latte` · `cafe-iced-tea` · `cafe-hot-chocolate` · `cafe-panini` mozzarella, tomato, basil · `cafe-muffin` blueberry
- Pizza and cinema: `pizza-cheese-slice` · `pizza-garlic-knots` · `pizza-whole-pie` · `pizza-soda` · `cinema-popcorn` striped red-and-cream bucket · `cinema-candy` · `cinema-soda` · plush toys `plush-otter`, `plush-penguin`, `plush-frog`, `plush-red-panda`, `plush-whale`, `plush-dinosaur`
- Pharmacy and market: `pharm-vitamins` · `pharm-pain-reliever` · `pharm-sleep-aid` · `pharm-protein-bar` · `pharm-electrolyte` · `pharm-cough-drops` honey lemon · `market-farm-box` · `market-lemonade` · `market-cider` · `market-honey` · `market-bouquet`
- Hardware and goods: `hw-coffee-maker` · `hw-mattress` · `hw-curtains` · `hw-reading-chair-lamp` · `hw-record-player` · `hw-houseplant` · `hw-rug` · `hw-fishing-rod` · `hw-umbrella` · `bike-commuter` · `bike-cap`

---

### P08 — Fish and mini-game pieces (Tier B · `fish/`, `mini/`)

**Fish (11)** — `fish/<id>` · **768×384 alpha**, side view, facing right, painterly-flat with a soft belly gradient, scales suggested not drawn, fins, a bright eye highlight, no water.
`bluegill` `#4f8fc0` · `perch` yellow perch `#d9b13a` · `carp` `#b08a4a` · `catfish` `#6b6a60` with whiskers · `trout` rainbow trout `#e88aa0` with a red stripe `#e04a6a` · `pumpkinseed` `#f08a3a` · `pike` northern pike `#5a8a4a` long and toothy · `koi` golden koi `#ffb020` with white patches · `icecod` `#a9d6ea` pale and frosty · `boot` an old brown boot `#5a3d27` with weed, humorous · `moonfin` legendary, lavender `#c9b6ff`, softly glowing, tiny crescent markings.

**Account Manager clients (12)** — `mini/client-<slug>` · `[PORTRAIT]` 512×512 alpha, friendly business people of mixed ages and backgrounds, dressed for their industry: `priya-nair` Brightleaf Studio (design) · `marcus-cole` Cole & Sons Hardware · `dana-whitfield` Orbit Logistics · `tomas-rivera` Rivera Foods · `yuki-tanaka` Tanaka Tech · `grace-okoye` Okoye Capital · `sam-ellery` Ellery Print Co. · `lena-fischer` Fischer Dental · `raj-patel` Patel Freight · `ines-duarte` Duarte Design · `walt-henley` Henley Motors · `ola-brandt` Brandt Bakery.

**Triage patients (optional, 14)** — `mini/patient-<slug>` · `[PORTRAIT]` 512×512 alpha, hospital-gown or everyday clothes, ages spread from 6 to 84 (youngest `pia` to oldest `walt-g`): `maya-r` `tom-b` `aisha-k` `leo-m` `grace-w` `omar-h` `nina-p` `hal-s` `rosa-d` `ben-t` `iris-c` `jun-l` `pia` `walt-g`.

**The Line (line cook)** — `mini/pan` an empty black cast-iron frying pan, top-down, with handle at the right · `mini/food-<name>-<state>` for five foods × three states (`raw`, `done`, `burnt`), top-down, **sitting on a transparent background without the pan**: `burger-patty` (pink `#e0a0a0` → brown `#7b4a2e` → char `#1c1511`) · `egg` fried egg (white `#f6f3ec`, yolk `#ffc83d`; raw = clear/translucent white) · `ribeye` (`#d0636d` → `#6d3c29`) · `veg-medley` (green `#9bc87a`, red `#e86a5a`, yellow `#f4d35e` pieces) · `shrimp` (curled, grey `#bfaaa8` → orange `#ff8f50`).

**Echo Clap (teacher)** — `mini/kid-<color>-<state>` for four desk pads (`pink` `#ff8fa3`, `blue` `#74c0fc`, `yellow` `#ffd43b`, `green` `#8ce99a`) × states `idle`, `clap`: a cheerful cartoon kid's bust behind a small desk, hands down vs hands clapping together, 512×512 alpha.

---

### P09 — Seamless textures and light sprites (Tier C · `tex/`, `fx/`)

**Textures** — `tex/<name>` · **`[TEXTURE]`**, 1024×1024, tileable, opaque. Mid-tone neutrals so the game can tint them.
`brick-red` · `brick-sand` · `siding-green` · `siding-cream` · `panel-metal` (grey-blue paneled walls) · `stucco` · `paver-sidewalk` (warm grey slabs with fine joints) · `asphalt` · `asphalt-wet` (dark with soft sky sheen) · `grass-summer` · `grass-autumn` (with leaf litter) · `snow` (soft drifts, blue shadows) · `gravel-path` · `dirt-path` · `pond-water` (calm, depth, no reflections of objects) · `ice` (pale with hairline cracks) · `wood-plank-honey` · `wood-plank-warm` · `wood-parquet` · `tile-cream` · `tile-checker-red` (red-and-cream diner checker) · `tile-white-grout` · `carpet-burgundy` · `carpet-grey-blue` · `lino-speckle` · `concrete-floor` · `marble-cream` · `velvet-maroon` · `wallpaper-pink-stripe` · `fabric-linen` · `leather-red`.

**Light and particle sprites** — `fx/<name>` · **`[FX]`**, alpha, bright centre fading to transparent:
`bokeh-disc` (1024, soft edge ring) · `flare-star` (six-point lens star) · `flare-ring` (thin ring flare) · `flare-hex` (hexagonal flare ghost) · `godray` (a soft diagonal shaft of light, 1024×1024) · `dust-mote` · `window-light` (a skewed window-pane light patch for floors, soft edges) · `lamp-pool` (soft round warm pool) · `rain-streak` · `snowflake-a`, `snowflake-b`, `snowflake-c` · `leaf-autumn-a`…`-f` (six varied leaves: rust, gold, crimson, olive) · `petal-a`…`-d` (pink and white blossom petals) · `grain-tile` (seamless fine film-grain, opaque neutral-grey noise, 512×512).

---

### P10 — Movie posters (Tier C · `posters/`)
`2:3 · 1024×1536 · opaque`, abstract poster art, **no text**. Slugs and looks: `paper-moon` (*Paper Moon Bakery*, comedy: peach/yellow/pink, a crescent moon over a tiny bakery) · `long-fuse` (*The Long Fuse*, action: orange/red/amber, a lit fuse across a skyline) · `seven-rooms` (*Seven Quiet Rooms*, drama: slate blues, seven lit windows) · `lantern` (*Night of the Lantern*, horror, gentle: near-black, one red lantern in fog) · `small-town` (*Small Town, Big Sky*, romance: rose/mauve, two silhouettes under a huge sky) · `robo-pup` (*Robo-Pup Returns*, animated: cyan/magenta, a friendly robot dog) · `orbit-nine` (*Orbit Station Nine*, sci-fi: indigo/blue, a ring station and stars) · `pie-detective` (*The Pie Detective*, mystery: ochre/olive, a magnifying glass over a pie) · `kickoff` (*Kickoff*, sports: green/gold, a ball mid-air).

---

### P11 — Reference boards (Tier B · `reference-art/`)
Not loaded by the game; I look at them while polishing so every place and person reads as different. All **`[REF]`, 1920×1080, opaque**, saved under `reference-art/<id>`. Camera rule: flat orthographic, straight-on, even soft daylight, **no people, no cars**.

**Buildings (front elevations)** — `rf-b1` … `rf-b8`. Each board shows three buildings side by side with a small gap, ground line 8 % from the bottom, each with roof band, **blank** sign band, windows, door, awning and a few street props.
- `rf-b1` *Maple Court Apartments* (terracotta brick `#b9684f`, roof `#5b3a33`, two rows of five windows with flower boxes, ivy on the west corner, green fabric canopy over a brown door, two wall lanterns) · *St. Anne Clinic* (white panels `#eef3f5`, steel-blue roof `#4d86a8`, lit white square with a red cross, red EMERGENCY bar over glass doors, no words) · *Corner Grocery* (sage siding `#86b894`, green roof, green-and-white scalloped awning, windows crammed with produce, four fruit crates).
- `rf-b2` *Dot's Diner* (coral-red siding `#d95f59`, chrome trim, rooftop neon plaque with pink outline, black-and-cream checker band, booths glimpsed through windows, kitchen vent with steam) · *Main Street Pharmacy* (sand brick `#e0cfa0`, roof `#5b4a3a`, green round pill badge) · *First Bank* (sand brick, blue round coin badge, formal door).
- `rf-b3` *Dog-Ear Books* (tan brick `#d9b48a`, coral-and-cream awning, round brown open-book badge) · *Rise & Shine Bakery* (tan brick, yellow awning, round bread badge, warm glow) · *Hank's Hardware* (grey-tan brick `#c9b79c`, green roof `#3f5b4a`, red hammer badge, tools on the pavement).
- `rf-b4` *Starlight Cinema* (sage stucco `#b4c7a8`, marquee with chasing bulbs, two framed abstract posters flanking the door) · *Bianca's Salon* (sage brick, pink scissors badge, gold-framed window) · *Suds Laundromat* (tan siding, teal washer badge, big windows showing washers).
- `rf-b5` *Spoke & Sprocket Bikes* (cream siding, tomato bike badge, bikes on the pavement) · *Cafe Luna* (cream siding, violet awning, blue coffee-cup badge, crescent motif, string lights) · *Sal's Pizza Place* (blue-grey stucco `#a7b6c4`, purple roof, green slice badge, brick-oven chimney) · *Bright Smile Dental* (sage stucco, teal tooth badge, calm) — four across.
- `rf-b6` *Northgate Software* (blue-grey panels `#5f7fa8`, dark roof `#2f3f5a`, glass lobby, glowing server-room strip) · *Keller Dynamics* (concrete grey `#8a8f98`, amber accent, a roll-up workshop door, sawtooth roof) · *Mercy General Hospital* (white with red roof band `#c9444f`, ambulance bay, glass atrium).
- `rf-b7` *Harlan & Pike* (lavender glass-and-stone `#9b7bb0`, plum roof, revolving door) · *Lakeview Elementary* (mustard brick `#e3b04f`, brick-red roof `#9a3b2e`, small bell tower, kids' paintings in windows) · *The Copper Pan* (terracotta `#c46a3b`, copper-clad awning, kitchen exhaust fans with steam, a blank chalkboard).
- `rf-b8` park structures: the park gate (two stone pillars with glowing globes, green arch `#2c4d3c`), the bandstand (low round stone dais, four cream posts, green pyramid roof `#2f7d4f`, gold ball finial), market stalls (striped canopies coral/teal/violet with cream, wood posts), a bus shelter (glass, dark frame, blue roof bar, lit poster, blue route sign on a pole).

**Interiors (cut-away, top-down three-quarter)** — `rf-i01` … `rf-i22`. One image per room: top-down three-quarter "dollhouse" cutaway, camera 60° above, back and left walls visible, floor fully visible, soft window light, every furniture piece clearly readable and distinct, **no people**.
`i01` apartment: lobby on the left (grey tile, brass mailboxes, landlord's desk, indigo rug, bench, plants, a door tag with no digits) and Apt 12 on the right (honey wood floor; kitchen row: white fridge, steel sink, black stove with orange burner; dining table with four chairs; TV above a brick-red rug and cranberry sofa; double bed with blue quilt, nightstand, bookshelf) · `i02` grocery (sage tile with green diamonds; shelves of colourful packages, three drinks coolers, two registers, fresh-produce table, bakery table) · `i03` diner (cream tile with red checker; chrome strip, red counter with eight stools, four red vinyl booths, chrome jukebox with rainbow arch, grill and fryer) · `i04` clinic (pale blue lino, red cross on wall, reception counter, vending machines, waiting benches on a teal rug, two hospital beds in an exam area) · `i05` pharmacy (mint lino, green counter, pill-bottle wall, blood-pressure machine, aisle shelves) · `i06` bank (cream tile, round steel vault door, teller counter with brass bars and glass, red velvet rope posts, ATM, blue sofa) · `i07` bookshop (honey wood, rainbow-spined shelves floor to ceiling, staff-picks table, reading nook with violet rug and two armchairs, register) · `i08` bakery (cream tile with orange check, twin ovens, pastry display case, chalkboard, three small cafe tables) · `i09` hardware (concrete floor, two pegboards of tools, shelves of paint and plumbing, a showroom platform with bed, armchair and lamp) · `i10` cinema lobby (burgundy carpet, gold trim, popcorn machine, soda machine, ticket booth, claw machine, arcade cabinet, two theatre doors, rope posts) · `i11` salon (blush tile with pink check, three round gold-framed mirrors with stations, two black shampoo sinks, pink sofa) · `i12` laundromat (pale tile, six white washers with round windows, three beige dryers, folding table, yellow chairs, thrift clothes rack, snack machine) · `i13` bike shop (grey concrete, wall of hanging wheels, rows of commuter bikes in five colours, repair counter) · `i14` cafe (warm wood floor, string lights, blue counter with espresso machine, round tables, big brown rug, bookshelf, tiny open-mic stage with mic and speaker) · `i15` pizza place (green-tinted cream tile, big brick oven with glowing mouth, display case, red-and-white gingham tables, green booths) · `i16` dentist (waiting room with fish tank and benches; exam room with teal dental chair and lamp arm) · `i17` Northgate Software floor (server racks with LEDs, whiteboard, six desks with monitors, two bean bags, plus a break room with water cooler and coffee machine) · `i18` Keller Dynamics floor (CNC mill, 3D printer, lathe, workbench, drafting tables, parts shelf, blueprint board) · `i19` Mercy General ward (six hospital beds with blue blankets, nurses' station, supply cabinet) · `i20` Harlan & Pike (plum carpet, conference table with six chairs, cubicle desks, targets board) · `i21` The Copper Pan kitchen (two ranges, grill, fridge, steel sink, prep tables, the pass counter, three red staff tables) · `i22` Lakeview Elementary (long hallway with red stripe and blue/green/rust lockers; a classroom with whiteboard and twelve wooden desks; the gym with honey-wood court and two hoops; the cafeteria with checker floor).

**Props, vehicles, nature** — `rf-p1` … `rf-p6`:
`p1` street furniture sheet on a flat light-grey ground (fire hydrant `#d0453c`, green slatted bin, planter, blue mailbox, newspaper boxes, bike rack with a bike, sandwich-board A-frame, iron-and-wood benches, lamp-posts, traffic lights, manhole cover) · `p2` vehicles top-down and side (sedans, wagon, van, yellow taxi with a roof sign and black checker dashes, in red `#d64545`, blue `#3d7ea6`, mustard `#e9c46a`, white, teal `#2a9d8f`, violet, charcoal, orange) · `p3` one broadleaf tree in spring (some pink blossom), summer, autumn (rust, gold, crimson, olive) and winter (bare, snow on branches), plus a pine in summer and in snow · `p4` the park fountain (round stone basin, central pedestal, upper bowl, spray) in summer and frozen; the pond with lily pads, lotus, reeds with brown cattails and three ducks (one white, two mallard-brown with green heads), plus a winter version with a dark ice-fishing hole · `p5` park life (picnic blankets white with coral/blue/yellow checks with wicker baskets, flower beds, a band on the bandstand: guitarist, singer at a mic stand, drummer with a red drum; a Saturday market stall with produce) · `p6` the Graduate's customisation: five hairstyles and shirt/pants colour swatches on neutral mannequins.

**Light and weather studies** — `rf-l1` … `rf-l9`: the **same main-street corner** (brick buildings, awnings, lamp-posts, a bus stop, a crosswalk with a traffic light) in nine conditions, same camera, only light and weather change: `l1` dawn · `l2` noon · `l3` golden hour · `l4` sunset · `l5` dusk · `l6` night with lit windows and dry pavement · `l7` rain with reflections · `l8` snow · `l9` morning fog. Show how lamps, windows, neon and headlights glow and how shadows tint.

**Seasons** — `rf-s1` … `rf-s4`: the park at the fountain plaza in spring (blossoms, petals, butterflies), summer (lush, dappled shade), autumn (leaf-covered, four tree palettes), winter (snow banks, frozen fountain, bare snowy trees, footprints).

**Town cast sheets** — `rf-c1` … `rf-c8`: rows of full-body characters at identical scale on one ground line, neutral standing poses, each clearly different in silhouette, age, build and clothing; use the P05 rows for clothing. `c1` street cast I (Maya, Rosa, Mr. Bell, Theo, Priya, Walt) · `c2` street cast II (June, Officer Cole, Ines, Lena, Sam, Kofi) · `c3` home and errands (Mrs. Reyes, Dev, Mr. Tanaka, Ms. Odell, Dot, Gus, Nurse Imani, Dr. Chen) · `c4` shopkeepers I (Mr. Okafor, Greta, Mr. Hale, Agnes, Luc, Hank) · `c5` shopkeepers II (Zoe, Ike, Bianca, Mrs. Kim, Rafa, Luna) · `c6` shopkeepers III (Otis, Sal, Ruby, Dr. Patel, Milo, Tess) · `c7` workplace casts, five rows of three (Software, Engineering, Nursing, Business, Culinary) · `c8` school staff (seven) and the ten kids.

---

### P12 — Paper-doll parts for skeletal animation (Tier C · `chars/`, optional)
Only if you want smooth limb animation instead of pose swapping. Generate **one parts sheet per character**, then cut it with `slice_parts.py` (§2) into one PNG per part.

**Rig convention (follow exactly):** parts drawn **straight and un-posed (A-pose, arms hanging, legs straight)**, all at the same scale, on **transparent or flat `#FF00FF`**, **spaced well apart so nothing touches**. Each limb is a vertical strip whose **joint end touches the top edge of its own bounding box**; extend each joint end ~8 % past the joint (rounded overlap) so there is no gap when rotated. The head has a short neck stub at its bottom edge. Layout, left to right, top to bottom:

- Row 1: `head` (front, hair on, cap **off**) · `hair-back` · `cap` (mortarboard with tassel) · `tassel` (hanging straight) · `diploma` (rolled, red ribbon)
- Row 2: `torso` (bodice and stole, shoulders to hips) · `skirt` (gown lower part to the shin, flaring slightly)
- Row 3: `upper-arm-l` · `forearm-hand-l` · `upper-arm-r` · `forearm-hand-r` (wide gown sleeves, hands open and relaxed)
- Row 4: `shin-shoe-l` · `shin-shoe-r` (just the lower legs and shoes below the hem)

**PD-01 · `reference-art/pd-01-grad-parts-sheet` (2048×2048)** then slice to `chars/grad/part-<name>` — the Graduate in graduation outfit, `[CHAR]`, laid out per the rig convention, ref: CH-01.
**PD-02 · `reference-art/pd-02-dean-parts-sheet`** → `chars/dean/part-<name>` — the Dean (no separate tassel; cap with short tassel), ref: CH-04.
**PD-03 · `reference-art/pd-03-classmate-parts-sheet`** → `chars/classmate/part-<name>` — a plain generic classmate with a desaturated white-grey gown and neutral skin and hair (so the game can tint); add four alternative `head` + `hair-back` pairs in row 1 (`head-2`…`head-5`).
**PD-04 · `reference-art/pd-04-grad-everyday-parts-sheet`** → `chars/grad/part-everyday-<name>` — coral tee, jeans and shoes; no cap, tassel or skirt; add `thigh-l`, `thigh-r`, `shin-shoe-l`, `shin-shoe-r` in row 4.

---

## 6. Where each pack goes in the game (so you know what each image is for)

| Pack | Used by | Status |
|---|---|---|
| P01 cutscene stills | Opening cutscene: cross-fades in at the matching beat with a slow push-in, grain and letterbox | **wired** |
| P02 plates and sprites | Cutscene stage background, crowd layers, podium, hats and confetti | **wired** |
| P03 poses, classmate lineups | Cutscene characters (swapped in for the hand-drawn figures) | **wired** |
| P04 title, diploma, paper | Title backdrop, degree-picker diploma, card paper | **wired** (`ui/paper-kraft`, `ui/phone-wallpaper`, `ui/passport-cover`: next) |
| P05 portraits | Conversation panels, phone texts, coworker intros | next |
| P06 backdrops | Dreams, activity scenes, fishing, shift-intro heroes, level-up/promotion/recap/eviction/blackout cards | next |
| P07 icons, badges, logos, food | Perk cards, passport, trophies, forecast, shop doors, option rows | next |
| P08 fish and mini-game pieces | Catch card, Account Manager calls, The Line, Echo Clap | next |
| P09 textures, light sprites | Replace procedural materials, richer bloom/flares/particles | later |
| P10 posters | Cinema walls and marquee | later |
| P11 reference boards | Not loaded; guides my polishing | reference |
| P12 parts | Skeletal cutscene animation | optional |

## 7. Checklist before an image goes into `art/`
- [ ] **No text anywhere** (banners, signs, diploma, book spines: abstract only).
- [ ] The **Graduate** is clearly the same person in every image (hair, skin, gown, gold stole, cap, coral tee).
- [ ] The **Dean** looks the same everywhere (silver hair, black gown, gold stole).
- [ ] Gown navy ≈ `#1d2e6b`, stole gold ≈ `#f0b429`, coral tee ≈ `#ff7a59`.
- [ ] Transparent images have **clean edges**, no halo, no ground shadow, no leftover magenta.
- [ ] Pose images share **identical framing and scale** (feet at the bottom edge); portraits share identical framing.
- [ ] Hands have five fingers; no melted limbs; faces friendly.
- [ ] Stills keep the **bottom 18 % calm**; backdrops keep the **centre and lower third calm**.
- [ ] Textures **tile seamlessly** (check a 2×2 tiling).
- [ ] The style matches the three anchors (P00): warm, soft, navy shadows, no plastic sheen.
- [ ] File is saved under the correct key, lower-case with hyphens.

**Hand-over.** Run `package_art.py`, then give me the `freshgrad-art-*.zip` files and `MANIFEST.csv`. Unzip `assets/` into `fresh-grad/v2-visual-upgrade/` and `reference-art/` into `fresh-grad/`, or just tell me where the zips are and I will place them and wire them in.
