#!/bin/bash
# dev/pose.sh '{"tailLift":2}' out.png [cam] — render one frame of a held pose
SP=/tmp/claude-0/-home-user-atoms-games-/12656eed-1f57-5aa0-a0e6-76323602acd8/scratchpad
P=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$1")
NODE_PATH=/opt/node22/lib/node_modules node dev/shot.js "n=${4:-1}&cols=${4:-1}&t0=1.2&t1=1.2&cam=${3:-q}&P=$P" $SP/$2 ${5:-900} ${6:-700} dev/anim.html
