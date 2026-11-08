#!/usr/bin/env bash
# Rebuild Lunarion (small model, ~7,000 triangles) from the pictures. Run from anywhere.
#   PY=/path/to/python bash rebuild.sh OUTDIR
# Steps: tools/gen_parts.py writes parts.json (or edit parts.json by hand); tools/route_small.sh builds the
# model, prints the pictures, makes the normal and glow maps, renders both boards and exports the .glb.
set -euo pipefail
H="$(cd "$(dirname "$0")" && pwd)"
PY="${PY:-python3}"
OUT="${1:-$H/rebuild_out}"
R="$H/../../.."          # creature-catch-model-sheets
# views.json came from:  pipeline/make_views.py WORK/views 2.6 front.png side.png back.png top.png   (H = 2.6 m)
PY="$PY" bash "$H/tools/route_small.sh" "$H/parts.json" "$H/views.json" "$OUT" 7000 lunarion
# blockout board (60,000 triangles), the shape check
$PY -I "$H/tools/build.py" "$H/parts.json" "$H/views.json" "$OUT/block.blend" --target 60000
$PY -I "$R/pipeline/board.py" "$OUT/block.blend" "$H/views.json" "$OUT/blockout.jpg" "Lunarion blockout" --samples 8 --three-quarter
