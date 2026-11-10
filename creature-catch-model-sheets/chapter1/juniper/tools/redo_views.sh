# Rebuild juniper's views (one scale) and the print-only repair from the source pictures (run from the work folder)
set -e
PY=${PY:-/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python}
R=/home/user/atoms-games-/creature-catch-model-sheets
D=$R/chapter1/juniper/tools
S=$R/chapter1/source/juniper
$PY -I $R/pipeline/make_views.py views 1.55 $S/juniper_front.png $S/juniper_side.png $S/juniper_back.png $S/juniper_top.png
# side picture: paint out the eye, eyebrow and grin with skin colour (the front picture paints the face)
$PY -I $D/inpaint_skin.py views/views.json side "442,286,24,32" "437,246,28,12" "425,352,22,18" --sigma 10
