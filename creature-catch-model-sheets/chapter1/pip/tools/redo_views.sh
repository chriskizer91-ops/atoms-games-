# Rebuild pip's views (one scale) and the print-only repair from the source pictures (run from the work folder)
set -e
PY=${PY:-/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python}
R=/home/user/atoms-games-/creature-catch-model-sheets
D=$R/chapter1/pip/tools
S=$R/chapter1/source/pip
$PY -I $R/pipeline/make_views.py views 1.35 $S/pip_front.png $S/pip_side.png $S/pip_back.png $S/pip_top.png
# the top picture is another pose (arms out); it is used only for the crown of the hair: scale it so its hair
# matches the front and side hair
$PY -I $D/set_view_map.py views/views.json top sx=1129 sy=1030 uc=625 vc=561
# side picture: paint out the eye, eyebrow and mouth with skin colour (the front picture paints the face)
$PY -I $D/inpaint_skin.py views/views.json side "361,302,17,33" "352,221,26,13" "357,405,19,26" --sigma 10
