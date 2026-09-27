#!/bin/zsh
# shot.sh wrapper: delete the old PNG first (shot.sh only waits for the file), ignore its temp-dir cleanup exit code
rm -f "$3"; "${0:A:h}/../../../shot.sh" "$@" 2>/dev/null; [ -s "$3" ]
