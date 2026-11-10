# Rebuild willow's views (one scale) and the print-only repair from the source pictures (run from the work folder)
set -e
PY=${PY:-/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python}
R=/home/user/atoms-games-/creature-catch-model-sheets
D=$R/chapter1/willow/tools
S=$R/chapter1/source/willow
$PY -I $R/pipeline/make_views.py views 1.6 $S/willow_front.png $S/willow_side.png $S/willow_back.png $S/willow_top.png
# side picture: paint out the closed eye with skin colour (the front picture paints the face)
$PY -I $D/inpaint_skin.py views/views.json side "405,183,20,14" --sigma 10
