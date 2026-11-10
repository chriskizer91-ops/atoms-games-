# Rebuild bramble's views (one scale) and the print-only repair from the source pictures (run from the work folder)
set -e
PY=${PY:-/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python}
R=/home/user/atoms-games-/creature-catch-model-sheets
D=$R/chapter1/bramble/tools
S=$R/chapter1/source/bramble
$PY -I $R/pipeline/make_views.py views 1.75 $S/bramble_front.png $S/bramble_side.png $S/bramble_back.png $S/bramble_top.png
# the top picture is used only for the hat: scale it so its round brim matches the front and side brim
$PY -I $D/set_view_map.py views/views.json top sx=860 sy=914 uc=622 vc=602
# side picture: paint out the eye and eyebrow with skin colour (the front picture paints the face)
$PY -I $D/inpaint_skin.py views/views.json side "408,242,15,24" "410,200,28,14" --sigma 10
