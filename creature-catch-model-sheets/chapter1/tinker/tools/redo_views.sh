# Rebuild tinker's views (one scale) and the print-only repair from the source pictures (run from the work folder)
set -e
PY=${PY:-/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python}
R=/home/user/atoms-games-/creature-catch-model-sheets
D=$R/chapter1/tinker/tools
S=$R/chapter1/source/tinker
$PY -I $R/pipeline/make_views.py views 1.2 $S/tinker_front.png $S/tinker_side.png $S/tinker_back.png $S/tinker_top.png
# make_views scales each picture by its own lowest-to-highest height, but the tuft's tip and the shoe soles
# differ between the pictures; the bodies line up row for row with the front picture, so use the front's scale
$PY -I $D/set_view_map.py views/views.json side s=1178.33 vg=1430
$PY -I $D/set_view_map.py views/views.json back s=1178.33 vg=1431 uc=510.5
# the top picture is another pose (arms out, feet forward); it paints only the crown of the hair and the tuft
$PY -I $D/set_view_map.py views/views.json top sx=1490 sy=1490 uc=620 vc=670
# side picture: paint out the eye, eyebrow and mouth with skin colour (the front picture paints the face)
$PY -I $D/inpaint_skin.py views/views.json side "402,357,23,39" "397,296,23,11" "383,435,23,27" --sigma 10
