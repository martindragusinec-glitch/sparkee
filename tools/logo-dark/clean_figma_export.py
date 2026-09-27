"""Take a Figma SVG export of a PART frame, keep only the part's paths, drop numerical crumbs (< 0.15 units)."""
import re, sys
TOK = re.compile(r'[MmLlHhVvCcZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?')
def subpaths(d):
    return [s for s in re.split(r'(?=M)', d) if s.strip()]
def bbox(sp):
    toks = TOK.findall(sp); xs = []; ys = []; cmd = None; nums = []; cx = cy = 0
    i = 0
    while i < len(toks):
        t = toks[i]
        if t.isalpha(): cmd = t; i += 1; continue
        if cmd in 'HV':
            v = float(t); (xs if cmd == 'H' else ys).append(v); i += 1; continue
        x, y = float(toks[i]), float(toks[i+1]); xs.append(x); ys.append(y); i += 2
    return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else (0, 0, 0, 0)
def clean(svg_in, group_id_substr, min_size=0.15):
    s = open(svg_in).read()
    gi = s.index(group_id_substr)
    gstart = s.rindex('<g', 0, gi)
    # take everything until the matching </g>
    depth = 0; end = None
    for m in re.finditer(r'<g[ >]|</g>', s[gstart:]):
        depth += 1 if m.group(0).startswith('<g') else -1
        if depth == 0: end = gstart + m.end(); break
    block = s[gstart:end]
    kept = []; dropped = 0
    for m in re.finditer(r'<path([^>]*?)d="([^"]*)"([^>]*)/>', block):
        attrs = m.group(1) + m.group(3)
        subs = subpaths(m.group(2)); keep = []
        for sp in subs:
            b = bbox(sp)
            if max(b[2]-b[0], b[3]-b[1]) >= min_size: keep.append(sp)
            else: dropped += 1
        if keep:
            fr = ' fill-rule="evenodd" clip-rule="evenodd"' if 'evenodd' in attrs else ''
            kept.append('<path%s d="%s" fill="#2C303C"/>' % (fr, ''.join(keep)))
    return kept, dropped
if __name__ == '__main__':
    src, gid, out, title = sys.argv[1:5]
    kept, dropped = clean(src, gid)
    svg = ('<svg viewBox="0 0 568 292" fill="none" xmlns="http://www.w3.org/2000/svg">\n'
           '<!-- Sparkee logo 124:3 part: %s. Coordinates identical to assets/img/logo.svg. Exported from Figma boolean (4OdxiJ5jvTf0SMYucdkwtK, page Logo dark). -->\n'
           '<g id="%s">\n%s\n</g>\n</svg>\n') % (title, out.split('/')[-1].replace('.svg',''), '\n'.join(kept))
    open(out, 'w').write(svg)
    print(out, 'paths', len(kept), 'dropped crumbs', dropped)
