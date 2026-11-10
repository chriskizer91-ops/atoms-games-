# Rebuild rosa's views (one scale) and the print-only repair from the source pictures (run from the work folder)
set -e
PY=${PY:-/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python}
R=/home/user/atoms-games-/creature-catch-model-sheets
D=$R/chapter1/rosa/tools
S=$R/chapter1/source/rosa
$PY -I $R/pipeline/make_views.py views 1.6 $S/rosa_front.png $S/rosa_side.png $S/rosa_back.png $S/rosa_top.png
# the top picture is used only for the crown of the hair and the bun: scale it so its hair matches the front and side hair
$PY -I $D/set_view_map.py views/views.json top sx=930 sy=930 uc=628 vc=541
# side picture: paint out the eye, eyebrow and mouth with skin colour (the front picture paints the face)
$PY -I $D/inpaint_skin.py views/views.json side "415,271,31,36" "408,221,32,17" "381,346,23,10" --sigma 10
