# python3 game/tools/make_artifact_page.py game/dist/index.html OUT.html  (then publish OUT.html with game/dist/assets/* as its files)
# make the artifact copy of the Chapter 1 game page: the publish step adds its own doctype/html/head/body,
# so drop the page's own wrapper tags; the frame pads top and bottom by the safe areas, so the page pads only the sides
import sys, re
src, out = sys.argv[1], sys.argv[2]
h = open(src, encoding='utf-8').read()
h = h.replace('<!doctype html>\n', '', 1).replace('<html lang="en">\n', '', 1).replace('<head>\n', '', 1)
h = h.replace('</head>\n<body>\n', '', 1)
assert h.rstrip().endswith('</body>\n</html>') or h.rstrip().endswith('</html>')
h = re.sub(r'</body>\s*</html>\s*$', '\n', h)
h = h.replace('<title>Creature Catch 3D</title>', '<title>Creature Catch Chapter 1</title>', 1)
h = h.replace('padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }',
              'padding: 0 env(safe-area-inset-right) 0 env(safe-area-inset-left); }\nhtml { box-sizing: border-box; }', 1)
open(out, 'w', encoding='utf-8').write(h)
print('ok', len(h))
