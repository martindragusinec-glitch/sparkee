import sys, re, os
sys.path.insert(0, os.path.dirname(__file__))
from svgpath import *; from logo_src import *
def fill_paths():
    g7 = group_inner('Group_7')
    out = []
    for m in re.finditer(r'<(path|circle|ellipse)([^>]*)/?>', g7):
        tag, attrs = m.group(1), m.group(2)
        if tag == 'path':
            d = re.search(r' d="([^"]*)"', attrs).group(1)
            out.append(('path', d, attrs))
        else:
            out.append((tag, None, attrs))
    return out
def fill_polys(n=24):
    polys = []
    seen = set()
    for tag, d, attrs in fill_paths():
        if tag != 'path' or d in seen: continue
        seen.add(d)
        for sp in parse(d): polys.append(flatten(sp, n))
    return polys
