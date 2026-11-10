# Rebuild hazel's views (one scale) and the print-only repair from the source pictures (run from the work folder)
set -e
PY=${PY:-/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python}
R=/home/user/atoms-games-/creature-catch-model-sheets
D=$R/chapter1/hazel/tools
S=$R/chapter1/source/hazel
$PY -I $R/pipeline/make_views.py views 1.62 $S/hazel_front.png $S/hazel_side.png $S/hazel_back.png $S/hazel_top.png
# the top picture is used only for the crown of the hair: scale it so its hair matches the front and side hair
$PY -I $D/set_view_map.py views/views.json top sx=880 sy=880 uc=632 vc=552
# side picture: paint out the eye, eyebrow and mouth with skin colour (the front picture paints the face)
$PY -I $D/inpaint_skin.py views/views.json side "405,212,28,32" "397,167,27,14" "383,274,19,10" --sigma 10
