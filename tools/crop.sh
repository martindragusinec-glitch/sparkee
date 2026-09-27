#!/bin/zsh
# usage: tools/crop.sh <png-under-sparkee-web> <y> <h> <out>   (šířka 1440)
cd "$(dirname $0)/.."
tools/shot.sh 1440 $3 $4 "http://localhost:8770/tools/parts/crop.html?src=/$1&y=$2"
