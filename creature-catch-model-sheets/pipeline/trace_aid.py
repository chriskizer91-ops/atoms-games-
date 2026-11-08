"""Gridded copies of each view, with traced part outlines drawn on top.

usage: python3 -I trace_aid.py views.json OUTDIR [parts.json] [--crop view:x0,y0,x1,y1 ...] [--step 50]
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cc3d import Views  # noqa: E402

COLS = [(230, 30, 30), (30, 120, 230), (20, 160, 60), (200, 40, 200), (230, 140, 0), (0, 170, 170),
        (120, 60, 200), (160, 100, 40), (255, 0, 120), (90, 90, 90)]


def font(sz):
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", sz)
    except Exception:
        return ImageFont.load_default()


def main():
    args = sys.argv[1:]
    vw = Views(args[0])
    out = args[1]
    parts = None
    crops = []
    step = 50
    i = 2
    while i < len(args):
        a = args[i]
        if a == "--crop":
            v, box = args[i + 1].split(":")
            crops.append((v, tuple(int(c) for c in box.split(","))))
            i += 2
        elif a == "--step":
            step = int(args[i + 1])
            i += 2
        else:
            with open(a) as f:
                parts = json.load(f)["parts"]
            i += 1
    os.makedirs(out, exist_ok=True)
    jobs = crops or [(n, None) for n in vw.names()]
    for name, box in jobs:
        im = Image.fromarray(vw.image(name)).convert("RGB")
        w, h = im.size
        ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        for x in range(0, w, step):
            d.line([(x, 0), (x, h)], fill=(0, 0, 0, 110 if x % (2 * step) == 0 else 45), width=1)
        for y in range(0, h, step):
            d.line([(0, y), (w, y)], fill=(0, 0, 0, 110 if y % (2 * step) == 0 else 45), width=1)
        if parts:
            for k, p in enumerate(parts):
                poly = p.get("views", {}).get(name)
                if not poly:
                    continue
                c = COLS[k % len(COLS)]
                d.line([tuple(q) for q in poly] + [tuple(poly[0])], fill=c + (255,), width=2)
                cx = sum(q[0] for q in poly) / len(poly)
                cy = sum(q[1] for q in poly) / len(poly)
                d.text((cx - 20, cy - 8), p["name"], fill=c + (255,), font=font(16))
        im = Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")
        if box:
            im = im.crop(box)
            scale = max(1, int(1400 / max(im.size)))
            im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
            x0, y0 = box[0], box[1]
        else:
            scale, x0, y0 = 1, 0, 0
        d2 = ImageDraw.Draw(im)
        f = font(14)
        for x in range((x0 // step + 1) * step, x0 + im.width // scale, 2 * step if not box else step):
            d2.text(((x - x0) * scale + 2, 2), str(x), fill=(0, 0, 160), font=f)
        for y in range((y0 // step + 1) * step, y0 + im.height // scale, 2 * step if not box else step):
            d2.text((2, (y - y0) * scale + 2), str(y), fill=(0, 0, 160), font=f)
        tag = name if not box else f"{name}_{box[0]}_{box[1]}"
        im.save(os.path.join(out, f"{tag}.png"))
        print(os.path.join(out, f"{tag}.png"))


if __name__ == "__main__":
    main()
