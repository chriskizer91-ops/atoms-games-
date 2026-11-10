# Rebuild farmkid's views (one scale) and the print-only repair from the source pictures (run from the work folder)
set -e
PY=${PY:-/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python}
R=/home/user/atoms-games-/creature-catch-model-sheets
D=$R/chapter1/farmkid/tools
S=$R/chapter1/source/farmkid
$PY -I $R/pipeline/make_views.py views 1.25 $S/farmkid_front.png $S/farmkid_side.png $S/farmkid_back.png $S/farmkid_top.png
# the back picture's body lines up row for row with the front picture, but its boots are drawn shorter (soles
# 18 px higher), so make_views' height fit would scale it 0.6% too big: use the front picture's numbers
$PY -I $D/set_view_map.py views/views.json back s=1128 vg=1452 uc=511.5
# the top picture is another pose (arms out, feet forward); it paints only the crown of the hair
$PY -I $D/set_view_map.py views/views.json top sx=1348 sy=1132 uc=617 vc=719
# side picture: paint out the eye, eyebrow and mouth with skin colour (the front picture paints the face)
$PY -I $D/inpaint_skin.py views/views.json side "437,290,24,34" "437,247,33,13" "412,365,19,15" --sigma 10
