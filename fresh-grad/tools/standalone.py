#!/usr/bin/env python3
"""Build one self-contained HTML file of the game with its illustrated art inside it.

    python3 tools/standalone.py [out.html]        (default: dist/FreshGrad_Seasons.html, run from fresh-grad/)

Reads v2-visual-upgrade/index.html (run tools/build.js first) and v2-visual-upgrade/assets/, re-encodes every image the game can show
to WebP at the size it is shown at (rules below), and injects them as data: URLs in window.FG_ART ahead of the game script. In that mode
ART fetches nothing; keys the file does not carry are simply missing. Left out on purpose: the -b runner-up takes, and the cutscene
plates, poses and classmate lineups (they only show when a cutscene still is missing, and every still is inside the file).
Needs Pillow with WebP support."""
import base64, io, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME = os.path.join(ROOT, 'v2-visual-upgrade', 'index.html')
ASSETS = os.path.join(ROOT, 'v2-visual-upgrade', 'assets')
# key prefix -> (max long side in px, WebP quality); the longest matching prefix wins. Sizes follow how big each picture is drawn.
RULES = {
    'cutscene/still': (1672, 84), 'cutscene/sprites-hats-confetti': (800, 90), 'title/': (1672, 84),
    'bg/dream': (1672, 82), 'bg/recap': (1600, 80), 'bg/levelup': (1600, 80), 'bg/promotion': (1600, 80),
    'bg/scene': (1280, 82), 'bg/fishing': (1440, 82), 'bg/job': (1024, 82),
    'ui/diploma': (1024, 88), 'portraits/': (320, 90),
}
SKIP = ('cutscene/plate', 'chars/')

def rule(key):
    best, n = None, -1
    for k, v in RULES.items():
        if key.startswith(k) and len(k) > n: best, n = v, len(k)
    return best

def main(out):
    html = open(GAME, encoding='utf-8').read()
    marker = "<script>\n'use strict';"
    if marker not in html: sys.exit('game script marker not found; rebuild with tools/build.js')
    art, total = {}, 0
    for root, _, files in os.walk(ASSETS):
        for f in sorted(files):
            if not f.lower().endswith(('.webp', '.png')): continue
            key = os.path.relpath(os.path.join(root, f), ASSETS).replace(os.sep, '/').rsplit('.', 1)[0]
            r = rule(key)
            if key.endswith('-b') or key.startswith(SKIP) or not r or key in art: continue
            im = Image.open(os.path.join(root, f)); im.load()
            alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
            im = im.convert('RGBA' if alpha else 'RGB')
            if max(im.size) > r[0]:
                k = r[0] / max(im.size); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
            buf = io.BytesIO(); im.save(buf, 'WEBP', quality=r[1], method=6, **({'alpha_quality': 90} if alpha else {}))
            data = buf.getvalue(); total += len(data)
            art[key] = 'data:image/webp;base64,' + base64.b64encode(data).decode('ascii')
    blob = ',\n'.join('%s:%s' % (repr(k).replace("'", '"'), '"' + v + '"') for k, v in sorted(art.items()))
    inject = '<script>window.FG_ART={\n' + blob + '\n};</script>\n'
    html = html.replace(marker, inject + marker, 1)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(html)
    print('%d images (%.1f MB of WebP) -> %s (%.1f MB)' % (len(art), total / 1e6, out, os.path.getsize(out) / 1e6))

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'dist', 'FreshGrad_Seasons.html'))
