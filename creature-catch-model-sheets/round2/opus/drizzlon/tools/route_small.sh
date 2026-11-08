#!/usr/bin/env bash
# opus copy of pipeline/route_small.sh. Changes: uses this folder's board.py (frames the three-quarter
# views by the creature's size) and, if present, this folder's emissive.py / print_tex.py; the PIL step
# runs with $PY instead of the system python3.
# usage: PY=/path/to/venv/bin/python bash route_small.sh PARTS.json VIEWS.json OUTDIR [TRIANGLES=7000] [NAME]
set -euo pipefail
T="$(cd "$(dirname "$0")" && pwd)"
P="$(cd "$T/../../../../pipeline" && pwd)"
pick() { if [ -f "$T/$1" ]; then echo "$T/$1"; else echo "$P/$1"; fi; }
PYB="${PY:-python3}"
PY="$PYB -I"
PARTS="$1"; VIEWS="$2"; OUT="$3"; TRIS="${4:-7000}"; NAME="${5:-model}"
mkdir -p "$OUT"
$PY "$(pick build.py)" "$PARTS" "$VIEWS" "$OUT/model.blend" --target "$TRIS" --atlas "$OUT/atlas.json" --grid "$OUT/grid.npz"
$PY "$(pick print_tex.py)" "$OUT/grid.npz" "$OUT/atlas.json" "$VIEWS" "$PARTS" "$OUT/print" --size 2048
$PY "$(pick relief.py)" "$OUT/grid.npz" "$OUT/atlas.json" "$OUT/print/albedo.png" "$PARTS" "$OUT/relief.npz" --height-out "$OUT/height.npy" --preview "$OUT/relief_preview.png"
$PY "$(pick normal_from_relief.py)" "$OUT/height.npy" "$OUT/atlas.json" "$OUT/grid.npz" "$OUT/normal.png"
$PY "$(pick emissive.py)" "$OUT/print/albedo.png" "$OUT/emissive.png" --size 1024
if [ -z "${SKIP_BLANK:-}" ]; then
$PY "$T/board.py" "$OUT/model.blend" "$VIEWS" "$OUT/board_blank.jpg" "$NAME · shape only ($TRIS triangles)" --samples 16 --three-quarter
fi
$PY "$T/board.py" "$OUT/model.blend" "$VIEWS" "$OUT/board_printed.jpg" "$NAME · printed and lit" --mode lit --tex "$OUT/print/albedo.png" --normal "$OUT/normal.png" --emit "$OUT/emissive.png" --samples 24 --three-quarter
$PY -c "from PIL import Image; import sys; o=sys.argv[1]; Image.open(o+'/print/albedo.png').convert('RGB').save(o+'/albedo.jpg', quality=90); Image.open(o+'/emissive.png').convert('RGB').save(o+'/emissive.jpg', quality=88)" "$OUT"
$PY "$(pick export.py)" "$OUT/model.blend" "$OUT/$NAME.glb" --albedo "$OUT/albedo.jpg" --normal "$OUT/normal.png" --emit "$OUT/emissive.jpg"
echo "done: $OUT/$NAME.glb, boards in $OUT/board_*.jpg"
