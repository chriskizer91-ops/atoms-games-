# Rebuild player-a's views (one scale) and the print-only repair from the source pictures (run from the work folder)
set -e
PY=${PY:-/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python}
R=/home/user/atoms-games-/creature-catch-model-sheets
D=$R/chapter1/player-a/tools
S=$R/chapter1/source/player-a
$PY -I $R/pipeline/make_views.py views 1.55 $S/player-a_front.png $S/player-a_side.png $S/player-a_back.png $S/player-a_top.png
# the top picture is used only for the crown of the hair: scale it so its hair matches the front and side hair
$PY -I $D/set_view_map.py views/views.json top sx=1293 sy=972 uc=636.2 vc=563.6
# side picture: paint out the eye, eyebrow and mouth (the front picture paints the face; these would print ghosts)
$PY -I $D/inpaint_skin.py views/views.json side "432,266,25,32" "435,226,30,11" "416,335,21,18" --sigma 10
