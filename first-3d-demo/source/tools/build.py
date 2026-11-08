# python3 tools/build.py [--lines a,b] [--out path]
#   --lines: only these creature/move batches (src/lines/a.js, src/movesets/a.js); default: every file in both folders
#   --out:   where the single-file game goes; default dist/creature-catch-3d.html
import os, sys, glob
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # the project folder (the one holding src/ and tools/)
args = sys.argv[1:]
opt = lambda k: args[args.index(k) + 1] if k in args else None
only = opt('--lines'); only = only.split(',') if only else None
out_path = opt('--out') or root + '/dist/creature-catch-3d.html'
def batch(folder):
    fs = sorted(glob.glob(root + '/src/' + folder + '/*.js'))
    if only is not None: fs = [f for f in fs if os.path.basename(f)[:-3] in only]
    return fs
order = ['core.js', 'ui.js', 'kit.js', 'fx.js', 'person.js', 'looks.js', 'creatures.js', '@lines', 'data.js', 'places.js', 'world.js', 'paintings.js', 'moves.js', '@movesets', 'battle.js', 'story.js', 'main.js']
code = []
code.append(open(root + '/vendor/cc-sfx.js').read().replace('(function () {', '// ---------- Creature Catch\'s own sound effects (ported as they are) ----------\n(function () {', 1))
code.append('// ---------- Creature Catch\'s own music (ported as it is) ----------\n' + open(root + '/vendor/cc-music.js').read())
for f in order:
    if f.startswith('@'):
        for p in batch(f[1:]): code.append('// ==== ' + f[1:] + '/' + os.path.basename(p) + ' ====\n' + open(p).read())
    else: code.append('// ==== ' + f + ' ====\n' + open(root + '/src/' + f).read())
shell = open(root + '/src/shell.html').read()
core = code.pop(2)  # core.js defines CC; it must come before the sound code
code.insert(0, core)
out = shell.replace('/*FONT*/', open(root + '/vendor/font.css').read()).replace('/*THREE*/', open(root + '/vendor/three.min.js').read()).replace('/*CODE*/', '\n'.join(code))
os.makedirs(os.path.dirname(out_path), exist_ok=True)
open(out_path, 'w').write(out)
print('built', out_path, len(out))
