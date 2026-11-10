"""Close-up sheet from a lit board's renders: the two three-quarter views and the front view, each cropped
to the creature and enlarged (no Blender needed).

usage: python3 -I closeups.py RENDERS_DIR OUT.jpg "title"
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont


def crop_to_creature(im, pad=0.08, bg_tol=10):
    a = np.asarray(im.convert("RGB")).astype(int)
    bg = np.median(np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3)]), axis=0)
    m = np.abs(a - bg).max(axis=2) > bg_tol
    ys, xs = np.where(m)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    side = max(x1 - x0, y1 - y0) * (1 + 2 * pad)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    box = [int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2)]
    canvas = Image.new("RGB", (box[2] - box[0], box[3] - box[1]), tuple(int(v) for v in bg))
    canvas.paste(im.convert("RGB").crop((max(box[0], 0), max(box[1], 0), min(box[2], im.width), min(box[3], im.height))),
                 (max(-box[0], 0), max(-box[1], 0)))
    return canvas


def main():
    rdir, out, title = sys.argv[1], sys.argv[2], sys.argv[3]
    names = ["three_quarter_1.png", "three_quarter_2.png", "front.png"]
    tiles = []
    for n in names:
        im = Image.open(os.path.join(rdir, n))
        if im.mode == "RGBA":  # the board renders have a see-through background: put them on the board grey
            g = Image.new("RGB", im.size, (200, 200, 202))
            g.paste(im, mask=im.split()[3])
            im = g
        tiles.append(crop_to_creature(im).resize((600, 600), Image.LANCZOS))
    W = 20 + 3 * 600 + 2 * 10 + 20
    sheet = Image.new("RGB", (W, 680), (245, 245, 243))
    try:
        f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except Exception:
        f = ImageFont.load_default()
    ImageDraw.Draw(sheet).text((20, 18), title, fill=(20, 20, 20), font=f)
    for i, t in enumerate(tiles):
        sheet.paste(t, (20 + i * 610, 60))
    sheet.save(out, quality=90)
    print("wrote", out)


if __name__ == "__main__":
    main()
