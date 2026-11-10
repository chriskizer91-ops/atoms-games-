# Rebuild fern's views (one scale) and the print-only repair from the source pictures (run from the work folder)
set -e
PY=${PY:-/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python}
R=/home/user/atoms-games-/creature-catch-model-sheets
D=$R/chapter1/fern/tools
S=$R/chapter1/source/fern
$PY -I $R/pipeline/make_views.py views 1.6 $S/fern_front.png $S/fern_side.png $S/fern_back.png $S/fern_top.png
# the top picture is used only for the crown of the hair: scale it so its hair matches the front and side hair
$PY -I $D/set_view_map.py views/views.json top sx=1120 sy=1000 uc=622 vc=586
# side picture: paint out the eye, eyebrow and open mouth with skin colour (the front picture paints the face)
$PY -I $D/inpaint_skin.py views/views.json side "421,248,30,37" "413,197,29,17" "394,326,25,21" --sigma 10
