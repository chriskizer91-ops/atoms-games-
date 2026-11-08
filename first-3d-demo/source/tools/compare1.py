# python3 tools/compare1.py OUT.jpg NAME=SHEET.png,RENDER.png [NAME=...]
#   puts each sheet's first five views (front, 3/4, side / back 3/4, back) above the 3D render of the same five views
import sys
from PIL import Image, ImageDraw, ImageFont
def sheet_row(path):
    im = Image.open(path).convert('RGB'); w, h = im.size; cw, ch = w // 3, h // 2
    cells = [im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)) for (c, r) in [(0, 0), (1, 0), (2, 0), (0, 1), (1, 1)]]
    row = Image.new('RGB', (sum(c.width for c in cells), max(c.height for c in cells)), (255, 0, 255)); x = 0
    for c in cells: row.paste(c, (x, 0)); x += c.width
    return row
W = 1500; rows = []
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
for item in sys.argv[2:]:
    name, paths = item.split('='); sheet, render = paths.split(',')
    a = sheet_row(sheet); a = a.resize((W, int(a.height * W / a.width)))
    b = Image.open(render).convert('RGB'); b = b.resize((W, int(b.height * W / b.width)))
    lab = Image.new('RGB', (W, 40), (40, 34, 56)); ImageDraw.Draw(lab).text((12, 6), name + ':  sheet (top), 3D model (bottom)', fill=(255, 244, 216), font=font)
    rows += [lab, a, b]
img = Image.new('RGB', (W, sum(r.height for r in rows)), (40, 34, 56)); y = 0
for r in rows: img.paste(r, (0, y)); y += r.height
img.save(sys.argv[1], quality=85); print(sys.argv[1], img.size)
