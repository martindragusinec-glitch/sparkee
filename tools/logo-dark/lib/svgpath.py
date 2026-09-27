"""Minimal SVG path parser/flattener (M L H V C Q Z, abs+rel) for analysis."""
import re, math
TOK = re.compile(r'[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?')

def parse(d):
    toks = TOK.findall(d); i = 0; cmd = None
    subs = []; cur = None; x = y = 0; sx = sy = 0
    def num():
        nonlocal i
        v = float(toks[i]); i += 1; return v
    while i < len(toks):
        t = toks[i]
        if re.match(r'[A-Za-z]', t):
            cmd = t; i += 1
            if cmd in 'Zz':
                if cur is not None:
                    cur['closed'] = True
                    subs.append(cur); cur = None
                x, y = sx, sy
                continue
        c = cmd
        if c in 'Mm':
            nx, ny = num(), num()
            if c == 'm': nx += x; ny += y
            if cur is not None: subs.append(cur)
            cur = {'start': (nx, ny), 'segs': [], 'closed': False}
            x, y = sx, sy = nx, ny
            cmd = 'L' if c == 'M' else 'l'
        elif c in 'Ll':
            nx, ny = num(), num()
            if c == 'l': nx += x; ny += y
            if cur is None: cur = {'start': (x, y), 'segs': [], 'closed': False}
            cur['segs'].append(('L', (x, y), (nx, ny))); x, y = nx, ny
        elif c in 'Hh':
            nx = num(); nx = nx + x if c == 'h' else nx
            cur['segs'].append(('L', (x, y), (nx, y))); x = nx
        elif c in 'Vv':
            ny = num(); ny = ny + y if c == 'v' else ny
            cur['segs'].append(('L', (x, y), (x, ny))); y = ny
        elif c in 'Cc':
            p = [num() for _ in range(6)]
            if c == 'c': p = [p[0]+x, p[1]+y, p[2]+x, p[3]+y, p[4]+x, p[5]+y]
            if cur is None: cur = {'start': (x, y), 'segs': [], 'closed': False}
            cur['segs'].append(('C', (x, y), (p[0], p[1]), (p[2], p[3]), (p[4], p[5]))); x, y = p[4], p[5]
        elif c in 'Qq':
            p = [num() for _ in range(4)]
            if c == 'q': p = [p[0]+x, p[1]+y, p[2]+x, p[3]+y]
            q0 = (x, y); q1 = (p[0], p[1]); q2 = (p[2], p[3])
            c1 = (q0[0]+2/3*(q1[0]-q0[0]), q0[1]+2/3*(q1[1]-q0[1])); c2 = (q2[0]+2/3*(q1[0]-q2[0]), q2[1]+2/3*(q1[1]-q2[1]))
            cur['segs'].append(('C', q0, c1, c2, q2)); x, y = q2
        else:
            raise ValueError('unsupported cmd ' + c)
    if cur is not None: subs.append(cur)
    return subs

def bez(p0, p1, p2, p3, t):
    mt = 1 - t
    return (mt**3*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t**3*p3[0],
            mt**3*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t**3*p3[1])

def flatten(sub, n=24):
    pts = [sub['start']]
    for s in sub['segs']:
        if s[0] == 'L': pts.append(s[2])
        else:
            for k in range(1, n+1): pts.append(bez(s[1], s[2], s[3], s[4], k/n))
    return pts

def fmt(v):
    s = ('%.3f' % v).rstrip('0').rstrip('.')
    return '0' if s == '-0' else s

def to_d(subs):
    out = []
    for sp in subs:
        out.append('M%s %s' % (fmt(sp['start'][0]), fmt(sp['start'][1])))
        for s in sp['segs']:
            if s[0] == 'L': out.append('L%s %s' % (fmt(s[2][0]), fmt(s[2][1])))
            else: out.append('C%s %s %s %s %s %s' % tuple(fmt(v) for v in (*s[2], *s[3], *s[4])))
        if sp.get('closed'): out.append('Z')
    return ''.join(out)
