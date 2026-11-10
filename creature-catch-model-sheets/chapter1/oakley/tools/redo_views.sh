# Rebuild oakley's views (one scale) and the print-only repair from the source pictures (run from the work folder)
set -e
PY=${PY:-/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python}
R=/home/user/atoms-games-/creature-catch-model-sheets
D=$R/chapter1/oakley/tools
S=$R/chapter1/source/oakley
$PY -I $R/pipeline/make_views.py views 1.85 $S/oakley_front.png $S/oakley_side.png $S/oakley_back.png $S/oakley_top.png
# the top picture is used only for the hat: scale it so its round brim matches the front and side brim
$PY -I $D/set_view_map.py views/views.json top sx=989 sy=950 uc=625 vc=553.5
# side picture: paint out the eye, eyebrow and mouth with skin colour (the front picture paints the face)
$PY -I $D/inpaint_skin.py views/views.json side "438,238,16,20" "435,210,24,10" "420,293,18,8" --sigma 10
