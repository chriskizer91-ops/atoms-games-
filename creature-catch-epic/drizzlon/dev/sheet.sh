#!/bin/bash
# dev/sheet.sh move t0 t1 n cols cam out.png [w h]
SP=/tmp/claude-0/-home-user-atoms-games-/12656eed-1f57-5aa0-a0e6-76323602acd8/scratchpad
NODE_PATH=/opt/node22/lib/node_modules node dev/shot.js "move=$1&t0=$2&t1=$3&n=$4&cols=$5&cam=$6" $SP/$7 ${8:-1800} ${9:-1200} dev/anim.html
