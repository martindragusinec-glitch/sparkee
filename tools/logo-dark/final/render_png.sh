#!/bin/zsh
# Transparent PNG of an SVG logo via headless Chrome (one Chrome at a time).
# usage: tools/logo-dark/final/render_png.sh <in.svg> <out.png> <width> <height>
set -e
IN=$1; OUT=$2; W=$3; H=$4
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
P=$(mktemp -d); HTML=$P/page.html
print -r -- "<html><head><style>html,body{margin:0;background:transparent}img{display:block;width:${W}px;height:${H}px}</style></head><body><img src=\"file://${IN:A}\"></body></html>" > $HTML
rm -f $OUT
"$C" --headless=new --disable-gpu --hide-scrollbars --force-color-profile=srgb --default-background-color=00000000 \
  --allow-file-access-from-files --user-data-dir=$P/prof --window-size=$W,$H --screenshot=${OUT:A} "file://$HTML" >/dev/null 2>&1 &
PID=$!; for i in {1..60}; do [ -s "$OUT" ] && break; sleep 0.5; done; sleep 1; kill $PID 2>/dev/null || true; wait $PID 2>/dev/null || true
rm -rf $P 2>/dev/null || true
[ -s "$OUT" ] && echo "$OUT ${W}x${H}"
