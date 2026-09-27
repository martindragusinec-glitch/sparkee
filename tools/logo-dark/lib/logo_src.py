import re, os
SRC = os.path.join(os.path.dirname(__file__), '../../../assets/img/logo.svg')
S = open(os.path.abspath(SRC)).read()
def path_d(pid):
    m = re.search(r'<path id="%s" d="([^"]*)"' % re.escape(pid), S)
    return m.group(1)
def group_inner(gid):
    i = S.index('<g id="%s">' % gid)
    # find matching </g>
    depth = 0; j = i
    for m in re.finditer(r'<g[ >]|</g>', S[i:]):
        if m.group(0).startswith('<g'): depth += 1
        else:
            depth -= 1
            if depth == 0:
                return S[i:i+m.end()]
DEFS = re.search(r'<defs>[\s\S]*</defs>', S).group(0)
