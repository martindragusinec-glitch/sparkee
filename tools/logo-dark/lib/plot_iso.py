import sys,json; sys.path.insert(0,'lib')
from svgpath import *; from logo_src import *
from logo_src import S as SRC
def plot(out_svg, layers, extra=''):
    body = SRC[SRC.index('<g id="01'):SRC.rindex('<defs>')]
    out=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 568 292" fill="none">','<rect width="568" height="292" fill="#fff"/>',body]
    for lines,color,w in layers:
        for l in lines:
            out.append('<polyline points="%s" stroke="%s" stroke-width="%s"/>'%(' '.join('%.3f,%.3f'%tuple(p) for p in l[::2]),color,w))
    M=parse(path_d('Mascot outline + ar'))[0]
    nodes=[M['start']]+[s[-1] for s in M['segs']]
    for k in [16,27,28,37]:
        x,y=nodes[k]; out.append('<circle cx="%.3f" cy="%.3f" r="0.3" fill="#ff0"/>'%(x,y))
    for x in range(0,568,5): out.append('<line x1="%d" y1="0" x2="%d" y2="292" stroke="#0c0" stroke-width="0.04"/>'%(x,x))
    for y in range(0,292,5): out.append('<line x1="0" y1="%d" x2="568" y2="%d" stroke="#0c0" stroke-width="0.04"/>'%(y,y))
    out.append(extra)
    out.append(DEFS+'</svg>')
    open(out_svg,'w').write('\n'.join(out))
