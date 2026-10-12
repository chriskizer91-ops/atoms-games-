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
