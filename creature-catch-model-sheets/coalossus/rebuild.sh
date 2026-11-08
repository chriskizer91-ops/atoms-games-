#!/usr/bin/env bash
# Rebuild Coalossus from its pictures with the paint-and-bake tools.
# Needs: Python 3.13 with bpy==5.2.3 numpy scipy pillow (PY), and Node with @gltf-transform/cli (for the last step).
# Usage: PY=/path/to/venv/bin/python WORK=/tmp/coalossus bash rebuild.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
P="$HERE/../pipeline"
PY="${PY:-python3} -I"
WORK="${WORK:-/tmp/coalossus-work}"
mkdir -p "$WORK"
SRC="$HERE/source"

# 1. All four views on one scale (1.8 m tall); the top view is stretched to fit ("remap")
$PY "$P/make_views.py" "$WORK/views" 1.8 "$SRC/coalossus_front.png" "$SRC/coalossus_side.png" "$SRC/coalossus_back.png" "$SRC/coalossus_top.png"

# 1b. Print-only repair of the side picture: paint over the eye and ear (they belong on the front of the face)
$PY "$P/repair_view.py" "$WORK/views/views.json" side "208,238,292,326:120,60" "322,96,506,282:30,186" --feather 24

# 2. Blockout + board (outline overlap per view)
$PY "$P/build.py" "$HERE/parts.json" "$WORK/views/views.json" "$WORK/block.blend" --target 60000
$PY "$P/board.py" "$WORK/block.blend" "$WORK/views/views.json" "$WORK/blockout.jpg" "Coalossus blockout" --samples 8 --three-quarter

# 3. Big model, smooth (700,000 triangles), with the shared texture layout
cp "$HERE/build/atlas.json" "$WORK/atlas.json"
$PY "$P/build.py" "$HERE/parts.json" "$WORK/views/views.json" "$WORK/full_smooth.blend" --target 700000 --atlas "$WORK/atlas.json" --grid "$WORK/grid_smooth.npz"

# 4. Print the pictures onto it (4096 texture), then read surface relief from the paint
$PY "$P/print_tex.py" "$WORK/grid_smooth.npz" "$WORK/atlas.json" "$WORK/views/views.json" "$HERE/parts.json" "$WORK/print" --size 4096
$PY "$P/relief.py" "$WORK/grid_smooth.npz" "$WORK/atlas.json" "$WORK/print/albedo.png" "$HERE/parts.json" "$WORK/relief.npz"

# 5. Big model with relief (same triangles, same texture layout) + glow map
$PY "$P/build.py" "$HERE/parts.json" "$WORK/views/views.json" "$WORK/full.blend" --target 700000 --atlas "$WORK/atlas.json" --relief "$WORK/relief.npz"
$PY "$P/emissive.py" "$WORK/print/albedo.png" "$WORK/print/emissive.png" --size 2048

# 6. Small model (6,000 triangles) and the bake (colour + normal map), part by part
$PY "$P/build.py" "$HERE/parts.json" "$WORK/views/views.json" "$WORK/lo.blend" --target 6000 --atlas "$WORK/atlas.json"
$PY "$P/bake.py" "$WORK/full.blend" "$WORK/print/albedo.png" "$WORK/lo.blend" "$WORK/bake" --size 2048
$PY "$P/emissive.py" "$WORK/bake/small_albedo.png" "$WORK/bake/small_emissive.png" --size 1024

# 7. Boards
$PY "$P/board.py" "$WORK/full.blend" "$WORK/views/views.json" "$WORK/1_big_blank.jpg" "Big model, shape only" --samples 24 --three-quarter
$PY "$P/board.py" "$WORK/full.blend" "$WORK/views/views.json" "$WORK/2_big_printed.jpg" "Big model, printed" --mode lit --tex "$WORK/print/albedo.png" --emit "$WORK/print/emissive.png" --samples 24 --three-quarter
$PY "$P/board.py" "$WORK/bake/small_baked.blend" "$WORK/views/views.json" "$WORK/3_small_baked.jpg" "Small model, baked" --mode lit --tex "$WORK/bake/small_albedo.png" --normal "$WORK/bake/small_normal.png" --emit "$WORK/bake/small_emissive.png" --samples 24 --three-quarter

# 8. Game files: skeleton, skin weights and the 14 animations; one mesh, one material each; the big one meshopt-compressed
python3 -c "from PIL import Image; import sys; w=sys.argv[1]; Image.open(w+'/print/albedo.png').convert('RGB').save(w+'/full_albedo.jpg',quality=90); Image.open(w+'/print/emissive.png').convert('RGB').save(w+'/full_emissive.jpg',quality=88); Image.open(w+'/bake/small_albedo.png').convert('RGB').save(w+'/small_albedo.jpg',quality=90); Image.open(w+'/bake/small_emissive.png').convert('RGB').save(w+'/small_emissive.jpg',quality=88)" "$WORK"
$PY "$P/rig.py" "$WORK/full.blend" "$WORK/coalossus_full_raw.glb" --albedo "$WORK/full_albedo.jpg" --emit "$WORK/full_emissive.jpg"
$PY "$P/rig.py" "$WORK/bake/small_baked.blend" "$WORK/coalossus_small.glb" --albedo "$WORK/small_albedo.jpg" --normal "$WORK/bake/small_normal.png" --emit "$WORK/small_emissive.jpg" --preview "$WORK/poses"
npx --yes @gltf-transform/cli@4 meshopt "$WORK/coalossus_full_raw.glb" "$WORK/coalossus_full.glb"
echo "done: $WORK"
