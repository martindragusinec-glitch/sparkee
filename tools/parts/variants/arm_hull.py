"""Varianta A – „tečnový obal kružnic“ (tangent hull of circles).

Každá kost = konvexní obal dvou kružnic spojených přesnými vnějšími tečnami:
  kořen (rameno) r0  ->  loket r1  ->  tlapka r2
Na vypouklé straně ohybu jde obrys po kružnici lokte, na vnitřní (vyduté) straně je hladký
oblouk (fillet) tečný k oběma tečnám. Tlapka i kořen jsou přesné kruhové oblouky.

Klouby se nemění: konec končetiny (nejzazší bod tlapky) leží přesně v kloubu špičky,
střed kružnice tlapky je tedy o r2 zpět podél předloktí.

Výstup: jedna uzavřená cesta (M, L, C…, Z), vždy stejná struktura příkazů pro všechny pózy
(šlo by ji i plynule morfovat) a vždy stejný směr obíhání (po směru hodin na obrazovce).
"""
import math

# poloměry (poloviční tloušťka) v jednotkách maskota
RADII = {
    "arm": (12.4, 13.0, 11.6),      # rameno, loket, tlapka
    "leg": (15.5, 14.4, 12.8),      # kyčel, koleno, chodidlo
}
FILLET = {"arm": 13.0, "leg": 12.0}  # poloměr vyduté křivky ve vnitřní straně ohybu
SOFT = {"arm": 20.0, "leg": 20.0}     # None = vypouklý loket přesně po kružnici lokte (čistý obal);
                                      # číslo = měkčí oblouk tohoto poloměru tečný k oběma tečnám
N_END = 4                           # kubik na půlkruh tlapky / kořene
N_ELB = 2                           # kubik na loket (oblouk nebo fillet)


# ---------- vektory ----------
def _sub(a, b): return (a[0] - b[0], a[1] - b[1])
def _add(a, b): return (a[0] + b[0], a[1] + b[1])
def _mul(a, k): return (a[0] * k, a[1] * k)
def _dot(a, b): return a[0] * b[0] + a[1] * b[1]
def _cross(a, b): return a[0] * b[1] - a[1] * b[0]
def _len(a): return math.hypot(a[0], a[1])
def _unit(a):
    l = _len(a) or 1.0
    return (a[0] / l, a[1] / l)
def _ang(a): return math.atan2(a[1], a[0])
def _dir(t): return (math.cos(t), math.sin(t))


def _wrap(d):
    """úhel do (-pi, pi]"""
    while d <= -math.pi:
        d += 2 * math.pi
    while d > math.pi:
        d -= 2 * math.pi
    return d


def _tan_normal(a, ra, b, rb, side):
    """Jednotková normála vnější tečny dvou kružnic na straně side (+1/-1).
    Tečna se dotýká v a + ra*n a b + rb*n."""
    d = _len(_sub(b, a))
    u = _unit(_sub(b, a))
    c = max(-0.999, min(0.999, (ra - rb) / d))
    s = math.sqrt(1 - c * c)
    p = (-u[1], u[0])
    return (u[0] * c + p[0] * s * side, u[1] * c + p[1] * s * side)


def _arc(c, r, t0, sweep, n):
    """Oblouk kolem c jako n kubik (seznam ('C', p0, c1, c2, p3))."""
    out = []
    step = sweep / n
    k = 4.0 / 3.0 * math.tan(step / 4.0)
    for i in range(n):
        a0, a1 = t0 + step * i, t0 + step * (i + 1)
        p0 = _add(c, _mul(_dir(a0), r))
        p3 = _add(c, _mul(_dir(a1), r))
        t0v = (-math.sin(a0), math.cos(a0))
        t1v = (-math.sin(a1), math.cos(a1))
        out.append(("C", p0, _add(p0, _mul(t0v, k * r)), _sub(p3, _mul(t1v, k * r)), p3))
    return out


def _elbow(c1, r1, n_in, n_out, line_in, line_out, rf, soft=None):
    """Přechod v lokti na jedné straně.
    n_in/n_out = normály tečen (přicházející / odcházející), line_* = (start, konec) tečných úseček.
    Vypouklá strana -> oblouk po kružnici lokte; vydutá -> fillet tečný k oběma přímkám.
    Vrací (segmenty, upravený konec line_in, upravený začátek line_out)."""
    t_in, t_out = _ang(n_in), _ang(n_out)
    d = _wrap(t_out - t_in)
    if d <= 0 and not (soft and soft > r1):     # vypouklé (obrys obíhá se zápornou orientací)
        return _arc(c1, r1, t_in, d, N_ELB), line_in[1], line_out[0]
    if d <= 0:
        rf = soft
    # vyduté: průsečík tečen + fillet
    a0, a1 = line_in
    b0, b1 = line_out
    d1 = _unit(_sub(a1, a0))
    d2 = _unit(_sub(b1, b0))
    den = _cross(d1, d2)
    alpha = abs(math.atan2(den, _dot(d1, d2)))     # úhel vychýlení
    if abs(den) < 1e-9 or alpha < 1e-6:
        mid = _mul(_add(a1, b0), 0.5)
        return [("C", mid, mid, mid, mid)] * N_ELB, mid, mid
    t = _cross(_sub(b0, a0), d2) / den
    X = _add(a0, _mul(d1, t))
    room1 = max(0.0, _dot(_sub(X, a0), d1))      # kolik rovné úsečky je před průsečíkem
    room2 = max(0.0, _dot(_sub(b1, X), d2))      # a za ním
    T = rf * math.tan(alpha / 2)
    T = min(T, 0.92 * room1, 0.92 * room2)
    rr = T / math.tan(alpha / 2)
    A = _sub(X, _mul(d1, T))
    B = _add(X, _mul(d2, T))
    turn = 1 if den > 0 else -1
    nrm = (-d1[1] * turn, d1[0] * turn)
    ctr = _add(A, _mul(nrm, rr))
    t0 = _ang(_sub(A, ctr))
    return _arc(ctr, rr, t0, alpha * turn, N_ELB), A, B


def _hull(joints, kind):
    r0, r1, r2 = RADII[kind]
    rf = FILLET[kind]
    if len(joints) == 2:
        joints = [joints[0], _mul(_add(joints[0], joints[1]), 0.5), joints[1]]
    J0, J1, J2 = [tuple(map(float, p)) for p in joints[:3]]
    u2 = _unit(_sub(J2, J1))
    C0, C1 = J0, J1
    C2 = _sub(J2, _mul(u2, r2))               # konec tlapky zůstává v kloubu špičky

    nA01 = _tan_normal(C0, r0, C1, r1, +1)
    nA12 = _tan_normal(C1, r1, C2, r2, +1)
    nB01 = _tan_normal(C0, r0, C1, r1, -1)
    nB12 = _tan_normal(C1, r1, C2, r2, -1)
    P = lambda c, r, n: _add(c, _mul(n, r))

    # strana A (kořen -> tlapka)
    lA1 = (P(C0, r0, nA01), P(C1, r1, nA01))
    lA2 = (P(C1, r1, nA12), P(C2, r2, nA12))
    soft = SOFT.get(kind)
    elbA, a_end, a_start = _elbow(C1, r1, nA01, nA12, lA1, lA2, rf, soft)
    # strana B (tlapka -> kořen)
    lB1 = (P(C2, r2, nB12), P(C1, r1, nB12))
    lB2 = (P(C1, r1, nB01), P(C0, r0, nB01))
    elbB, b_end, b_start = _elbow(C1, r1, nB12, nB01, lB1, lB2, rf, soft)

    tA, tB = _ang(nA12), _ang(nB12)
    paw = _wrap(tB - tA)
    paw = paw - 2 * math.pi if paw > 0 else paw     # kolem špičky = záporná orientace
    rA, rB = _ang(nB01), _ang(nA01)
    root = _wrap(rB - rA)
    root = root - 2 * math.pi if root > 0 else root

    segs = [("L", lA1[0], a_end)] + elbA + [("L", a_start, lA2[1])]
    segs += _arc(C2, r2, tA, paw, N_END)
    segs += [("L", lB1[0], b_end)] + elbB + [("L", b_start, lB2[1])]
    segs += _arc(C0, r0, rA, root, N_END)
    return segs


def _area(segs):
    pts = [s[1] for s in segs]
    return sum(_cross(a, b) for a, b in zip(pts, pts[1:] + pts[:1])) / 2


def _reverse(segs):
    out = []
    for s in reversed(segs):
        if s[0] == "L":
            out.append(("L", s[2], s[1]))
        else:
            out.append(("C", s[4], s[3], s[2], s[1]))
    return out


def _d(segs):
    f = lambda p: f"{p[0]:.2f} {p[1]:.2f}"
    out = "M" + f(segs[0][1])
    for s in segs:
        if s[0] == "L":
            out += "L" + f(s[2])
        else:
            out += "C" + f(s[2]) + " " + f(s[3]) + " " + f(s[4])
    return out + "Z"


def limb(joints, kind="arm"):
    segs = _hull(joints, kind if kind in RADII else "arm")
    if _area(segs) < 0:              # vždy po směru hodin na obrazovce (y dolů)
        segs = _reverse(segs)
    return _d(segs)


def outline_points(joints, kind="arm", per=12):
    """Vzorky obrysu (pro kontrolu / měření)."""
    segs = _hull(joints, kind)
    pts = []
    for s in segs:
        if s[0] == "L":
            for i in range(per):
                t = i / per
                pts.append(_add(s[1], _mul(_sub(s[2], s[1]), t)))
        else:
            p0, c1, c2, p3 = s[1:]
            for i in range(per):
                t = i / per
                mt = 1 - t
                pts.append(tuple(mt ** 3 * p0[j] + 3 * mt * mt * t * c1[j] + 3 * mt * t * t * c2[j] + t ** 3 * p3[j]
                                 for j in range(2)))
    return pts
