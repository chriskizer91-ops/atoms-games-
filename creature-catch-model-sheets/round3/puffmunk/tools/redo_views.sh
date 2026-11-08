# rebuild Puffmunk's print copies from the originals (run from the work folder)
set -e
PY=/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python; D=/home/user/atoms-games-/creature-catch-model-sheets/round3/puffmunk/tools
$PY -I $D/fix_mask.py views/views.json side "352,392 353,392 353,393"
$PY -I $D/inpaint_view.py views/views.json side "298,424,21,21" "306,410,21,21" "316,394,21,21" "330,382,21,21" "345,376,21,21" "360,374,21,21" "375,375,21,21" "390,380,21,21" "401,388,21,21" "409,398,21,21" "413,405,21,21" --grain 0 --sigma 10
