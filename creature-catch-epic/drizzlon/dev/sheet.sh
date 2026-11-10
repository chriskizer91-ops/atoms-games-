#!/bin/bash
# dev/sheet.sh move t0 t1 n cols cam out.png [w h]
SP=${OUT_DIR:-/tmp}
NODE_PATH=/opt/node22/lib/node_modules node dev/shot.cjs "move=$1&t0=$2&t1=$3&n=$4&cols=$5&cam=$6" $SP/$7 ${8:-1800} ${9:-1200} dev/anim.html
