"""Load the separated logo parts (tools/logo-dark/parts/*.svg) as reusable markup for variant builds."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
PARTS = os.path.join(HERE, '..', 'parts')
def _read(name): return open(os.path.join(PARTS, name)).read()
def body(name):
    s = _read(name)
    s = re.sub(r'<svg[^>]*>', '', s); s = s.replace('</svg>', '')
    s = re.sub(r'<!--[\s\S]*?-->', '', s)
    s = re.sub(r'<defs>[\s\S]*?</defs>', '', s)
    return s.strip()
def defs(name):
    m = re.search(r'<defs>([\s\S]*?)</defs>', _read(name))
    return m.group(1).strip() if m else ''
def d_of(name, pid=None):
    s = _read(name)
    if pid: return re.search(r'id="%s" d="([^"]+)"' % re.escape(pid), s).group(1)
    return re.search(r' d="([^"]+)"', s).group(1)
def letter_d(k): return d_of('letters.svg', 'letter-' + k)
SIL = d_of('mascot_silhouette.svg')
FLAME_SIL = d_of('flame_silhouette.svg')
