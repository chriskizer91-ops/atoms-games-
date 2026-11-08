# rebuild Clovermouse's print copies from the originals (run from the work folder)
set -e
PY=/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/venv/bin/python; D=/home/user/atoms-games-/creature-catch-model-sheets/round3/clovermouse/tools
$PY -I $D/fix_mask.py views/views.json side "345,232 330,250 320,270 305,290 298,320 287,350 281,390 276,430 268,452 300,470 500,470 500,232"
$PY -I $D/inpaint_view.py views/views.json side "382,447,72,88" "386,318,46,28" --grain 0.5 --sigma 26
$PY -I $D/fix_mask.py views/views.json front "626,600 627,600 627,601"
$PY -I $D/fill_under.py views/views.json front --hole "380,130 626,100 872,130 875,200 872,300 852,335 802,352 752,358 702,352 652,348 600,348 550,352 500,358 450,352 400,335 380,300 378,200" --from-row 208 --grow 13 --feather 4 --protect "492,378,44,19;761,378,44,19" --known "420,368 840,368 860,440 400,440" --sigma 30 --grain 1.4 --grain-src 345,880,465,1060 --min-lum 150
$PY -I $D/fix_mask.py views/views.json back "626,600 627,600 627,601"
$PY -I $D/fill_under.py views/views.json back --hole "376,130 400,90 450,55 520,25 580,35 626,80 670,35 735,25 800,55 850,90 878,130 882,200 890,260 875,310 835,352 780,362 720,355 670,345 626,342 580,345 530,355 470,362 420,352 380,310 365,260 372,200" --from-row 120 --grow 14 --feather 4 --known "390,368 865,368 880,450 375,450" --sigma 30 --grain 1.4 --grain-src 380,880,540,1060 --min-lum 140
