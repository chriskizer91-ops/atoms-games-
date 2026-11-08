#!/usr/bin/env bash
# Small-model-only route: build the game model and print the pictures straight onto it (no big model).
# (changed copy: uses tools/emissive.py for the gold glow, and tools/build.py + parts.py for per-part k_scale / n_scale)
# usage: PY=/path/to/venv/bin/python bash route_small.sh PARTS.json VIEWS.json OUTDIR [TRIANGLES=7000] [NAME]
#   PARTS.json  traced parts (see coalossus/parts.json and pipeline/README.md)
#   VIEWS.json  from make_views.py (plus repair_view.py if a picture needed repairs)
#   OUTDIR      everything is written here; OUTDIR/<NAME>.glb is the game file
set -euo pipefail
P=/home/user/atoms-games-/creature-catch-model-sheets/pipeline
T="$(cd "$(dirname "$0")" && pwd)"
PY="${PY:-python3} -I"
PARTS="$1"; VIEWS="$2"; OUT="$3"; TRIS="${4:-7000}"; NAME="${5:-model}"
mkdir -p "$OUT"
# 1. model + texture layout (made fresh unless OUTDIR/atlas.json exists)
$PY "$T/build.py" "$PARTS" "$VIEWS" "$OUT/model.blend" --target "$TRIS" --atlas "$OUT/atlas.json" --grid "$OUT/grid.npz"
# 2. print the pictures onto it (2048)
$PY "$P/print_tex.py" "$OUT/grid.npz" "$OUT/atlas.json" "$VIEWS" "$PARTS" "$OUT/print" --size 2048
# 3. surface relief read from the paint -> normal map; glow map
$PY "$P/relief.py" "$OUT/grid.npz" "$OUT/atlas.json" "$OUT/print/albedo.png" "$PARTS" "$OUT/relief.npz" --height-out "$OUT/height.npy" --preview "$OUT/relief_preview.png"
$PY "$P/normal_from_relief.py" "$OUT/height.npy" "$OUT/atlas.json" "$OUT/grid.npz" "$OUT/normal.png"
$PY "$T/emissive.py" "$OUT/print/albedo.png" "$OUT/emissive.png" --size 1024
# 4. boards: shape only, then printed and lit
$PY "$P/board.py" "$OUT/model.blend" "$VIEWS" "$OUT/board_blank.jpg" "$NAME · shape only ($TRIS triangles)" --samples 16 --three-quarter
$PY "$P/board.py" "$OUT/model.blend" "$VIEWS" "$OUT/board_printed.jpg" "$NAME · printed and lit" --mode lit --tex "$OUT/print/albedo.png" --normal "$OUT/normal.png" --emit "$OUT/emissive.png" --samples 24 --three-quarter
# 5. game file: one mesh, one material
python3 -c "from PIL import Image; import sys; o=sys.argv[1]; Image.open(o+'/print/albedo.png').convert('RGB').save(o+'/albedo.jpg', quality=90); Image.open(o+'/emissive.png').convert('RGB').save(o+'/emissive.jpg', quality=88)" "$OUT"
$PY "$P/export.py" "$OUT/model.blend" "$OUT/$NAME.glb" --albedo "$OUT/albedo.jpg" --normal "$OUT/normal.png" --emit "$OUT/emissive.jpg"
echo "done: $OUT/$NAME.glb, boards in $OUT/board_*.jpg"
