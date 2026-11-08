#!/usr/bin/env bash
# round 3 copy of round 2 opus's route_small.sh (itself a copy of pipeline/route_small.sh). Uses this
# folder's tools where present: board.py (three-quarter views framed by size), print_tex.py (view_warp,
# paint_ellipse_skip), build.py + parts.py (n_scale, k_scale), emissive.py (black unless a part asks to glow),
# relief.py (relief kind "grain", per-part relief_gain).
# usage: PY=/path/to/venv/bin/python bash route_small.sh PARTS.json VIEWS.json OUTDIR [TRIANGLES=7000] [NAME]
set -euo pipefail
T="$(cd "$(dirname "$0")" && pwd)"
P="$(cd "$T/../../../pipeline" && pwd)"
pick() { if [ -f "$T/$1" ]; then echo "$T/$1"; else echo "$P/$1"; fi; }
PYB="${PY:-python3}"
PY="$PYB -I"
PARTS="$1"; VIEWS="$2"; OUT="$3"; TRIS="${4:-7000}"; NAME="${5:-model}"
mkdir -p "$OUT"
$PY "$(pick build.py)" "$PARTS" "$VIEWS" "$OUT/model.blend" --target "$TRIS" --atlas "$OUT/atlas.json" --grid "$OUT/grid.npz"
$PY "$(pick print_tex.py)" "$OUT/grid.npz" "$OUT/atlas.json" "$VIEWS" "$PARTS" "$OUT/print" --size 2048
$PY "$(pick relief.py)" "$OUT/grid.npz" "$OUT/atlas.json" "$OUT/print/albedo.png" "$PARTS" "$OUT/relief.npz" --height-out "$OUT/height.npy" --preview "$OUT/relief_preview.png"
$PY "$(pick normal_from_relief.py)" "$OUT/height.npy" "$OUT/atlas.json" "$OUT/grid.npz" "$OUT/normal.png"
$PY "$T/emissive.py" "$OUT/print/albedo.png" "$OUT/emissive.png" --size 1024 --parts "$PARTS" --texel "$OUT/print/texel.npz" --names "$OUT/print/print.json"
if [ -z "${SKIP_BLANK:-}" ]; then
$PY "$T/board.py" "$OUT/model.blend" "$VIEWS" "$OUT/board_blank.jpg" "$NAME · shape only ($TRIS triangles)" --samples 16 --three-quarter
fi
$PY "$T/board.py" "$OUT/model.blend" "$VIEWS" "$OUT/board_printed.jpg" "$NAME · printed and lit" --mode lit --tex "$OUT/print/albedo.png" --normal "$OUT/normal.png" --emit "$OUT/emissive.png" --samples 24 --three-quarter
$PY -c "from PIL import Image; import sys; o=sys.argv[1]; Image.open(o+'/print/albedo.png').convert('RGB').save(o+'/albedo.jpg', quality=90); Image.open(o+'/emissive.png').convert('RGB').save(o+'/emissive.jpg', quality=88)" "$OUT"
$PY "$(pick export.py)" "$OUT/model.blend" "$OUT/$NAME.glb" --albedo "$OUT/albedo.jpg" --normal "$OUT/normal.png" --emit "$OUT/emissive.jpg"
echo "done: $OUT/$NAME.glb, boards in $OUT/board_*.jpg"
