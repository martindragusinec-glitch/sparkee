"""Read the separated parts (tools/logo-dark/parts) as SVG fragments for composing dark variants."""
import os, re, json
HERE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # tools/logo-dark
PARTS = os.path.join(HERE, 'parts')
def _read(n): return open(os.path.join(PARTS, n)).read()
def body(n):
    s = _read(n)
    s = re.sub(r'<svg[^>]*>\s*', '', s, count=1); s = s.replace('</svg>', '')
    s = re.sub(r'<!--[\s\S]*?-->\s*', '', s)
    defs = ''
    m = re.search(r'<defs>([\s\S]*?)</defs>', s)
    if m: defs = m.group(1); s = s.replace(m.group(0), '')
    return s.strip(), defs.strip()
GEO = json.load(open(os.path.join(HERE, 'geometry.json')))
LETTERS = dict(re.findall(r'<path id="letter-([^"]+)" d="([^"]*)"', _read('letters.svg')))
SIL = GEO['silhouette']
FLAME_SIL = re.search(r' d="([^"]*)"', _read('flame_silhouette.svg')).group(1)
