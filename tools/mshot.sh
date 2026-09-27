#!/bin/zsh
# Mobilní screenshot přes iframe (holé úzké okno Chrome renderuje šířeji).
# usage: tools/mshot.sh <height> <out.png> [path, např. /sluzby/ – '#' zapiš jako %23] [width=390]
cd "$(dirname $0)/.."
W=${4:-390}
tools/shot.sh $W $1 $2 "http://localhost:8770/tools/parts/mobile.html?w=$W&src=${3:-/}"
