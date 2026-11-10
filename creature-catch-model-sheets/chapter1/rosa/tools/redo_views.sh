# Rebuild player-b's views (one scale) and the print-only repair from the source pictures (run from the work folder)
set -e
PY=${PY:-/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python}
R=/home/user/atoms-games-/creature-catch-model-sheets
D=$R/chapter1/player-b/tools
S=$R/chapter1/source/player-b
$PY -I $R/pipeline/make_views.py views 1.55 $S/player-b_front.png $S/player-b_side.png $S/player-b_back.png $S/player-b_top.png
# the top picture is used only for the crown of the hair: scale it so its hair matches the front and side hair
$PY -I $D/set_view_map.py views/views.json top sx=1147 sy=976 uc=626 vc=619
# side picture: paint out the eye, eyebrow and mouth with skin colour (the front picture paints the face)
$PY -I $D/inpaint_skin.py views/views.json side "410,258,25,30" "401,218,24,13" "383,227,8,8" "391,329,17,18" --sigma 10
