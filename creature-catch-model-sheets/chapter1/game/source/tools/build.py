# python3 tools/build.py [--lines a,b] [--out path]
#   --lines: only these creature/move batches (src/lines/a.js, src/movesets/a.js); default: every file in both folders
#   --out:   where the game's page goes; default game/dist/index.html. game/assets/ (our packed models, their textures
#            and the painted tiles) is copied next to it as assets/; the page loads them from there, so serve the folder
#            over http (python3 -m http.server) rather than opening the file directly.
import os, sys, glob, shutil
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # the project folder (the one holding src/ and tools/)
game = os.path.dirname(root)  # chapter1/game: assets/ and dist/
args = sys.argv[1:]
opt = lambda k: args[args.index(k) + 1] if k in args else None
only = opt('--lines'); only = only.split(',') if only else None
out_path = opt('--out') or game + '/dist/index.html'
def batch(folder):
    fs = sorted(glob.glob(root + '/src/' + folder + '/*.js'))
    if only is not None: fs = [f for f in fs if os.path.basename(f)[:-3] in only]
    return fs
order = ['core.js', 'ui.js', 'kit.js', 'fx.js', 'person.js', 'looks.js', 'creatures.js', '@lines', 'models.js', 'data.js', 'tiles.js', 'places.js', 'world.js', 'paintings.js', 'moves.js', '@movesets', 'battle.js', 'story.js', 'main.js']
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
out = shell.replace('/*FONT*/', open(root + '/vendor/font.css').read()).replace('/*THREE*/', '\n'.join(open(root + '/vendor/' + f).read() for f in ('three.min.js', 'GLTFLoader.js', 'SkeletonUtils.js'))).replace('/*CODE*/', '\n'.join(code))
os.makedirs(os.path.dirname(out_path), exist_ok=True)
open(out_path, 'w').write(out)
print('built', out_path, len(out))
# our models, their textures and the painted tiles go next to the page
if os.path.isdir(game + '/assets'):
    dst = os.path.join(os.path.dirname(out_path), 'assets')
    if os.path.isdir(dst): shutil.rmtree(dst)
    shutil.copytree(game + '/assets', dst)
    n = sum(len(fs) for _, _, fs in os.walk(dst)); mb = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(dst) for f in fs) / 1e6
    print('copied assets:', n, 'files,', round(mb, 2), 'MB')
