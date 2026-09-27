#!/bin/zsh
# usage: tools/shot.sh <width> <height> <out.png> [url]
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
P=$(mktemp -d)
"$C" --headless=new --disable-gpu --hide-scrollbars --user-data-dir=$P --window-size=$1,$2 --screenshot=$3 "${4:-http://localhost:8770/}" >/dev/null 2>&1 &
PID=$!; for i in {1..40}; do [ -s "$3" ] && break; sleep 0.5; done; sleep 1; kill $PID 2>/dev/null; rm -rf $P
