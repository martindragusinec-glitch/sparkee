"""Varianta C – „kulatý palčák“ (round mitten).

Ruka = dřík + kulatá tlapka o chlup širší než zápěstí; všechna konkávní místa (krček, vnitřek lokte)
zaoblená kutálející se koulí (morfologické uzavření poloměrem CLOSE_R = G1 kruhové fillety).
Obrys se počítá přímo z geometrie, bez RDP a bez vyhlazování lomené čáry:
  * kosti: rameno -> loket -> špička jako rovné úsečky, loket zaoblený obloukem ELBOW_R
    (klouby se nemění; předloktí u tlapky je rovné, takže tlapka sedí souměrně na své kosti),
  * dřík: sjednocení spojité řady kružnic podél kostí (tečná obálka), poloměr r(s):
      R_ROOT u ramene -> R_MID (nejširší, buclaté nadloktí) -> kosinově k R_END pod středem tlapky,
  * tlapka: kružnice R_PAW, její nejvzdálenější bod leží přesně na kloubu špičky,
  * uzavření: obrys = body ve vzdálenosti CLOSE_R od obrysu ruky rozšířené o CLOSE_R
    -> konvexní části (tlapka, loket zvenku) zůstanou beze změny, konkávní dostanou oblouk poloměru >= CLOSE_R;
    vnější hrana 12jednotkového tahu tak má v konkávních místech poloměr >= CLOSE_R - 6 (žádný zub),
  * kořen: půlkruh kolem ramene (schovaný v trupu).
Výstup = jediná uzavřená cesta M + C… + Z (kubiky proložené hustým přesným obrysem, odchylka < FIT_TOL,
sdílené tečny => G1), stejný směr oběhu jako rig.sweep; ~25–30 úseků jako dosud.
"""
import math
import rig as _R

_ORIG_SWEEP = _R.sweep          # nohy necháme původní konstrukci (harness sem posílá jen ruce)

# ---- ladění tvaru (jednotky maskota) ----
R_ROOT = 12.0     # u ramene (schované v trupu)
R_MID = 13.2      # nejširší místo – buclaté nadloktí/loket
MID_AT = 0.42     # poloha nejširšího místa (podíl délky kostí)
R_END = 10.8      # dřík pod středem tlapky (kosinové zúžení z R_MID; schované v tlapce, krček vyplní zaoblení)
R_PAW = 12.4      # tlapka (o chlup širší než zápěstí)
SHAFT_TRIM = 3.0  # dřík končí tolik před středem tlapky (schovaný v ní)
CLOSE_R = 18.0    # poloměr zaoblení všech konkávních míst (krček, vnitřek lokte); vnější hrana tahu má CLOSE_R - 6
ELBOW_R = 18.0    # zaoblení kostí v lokti (> poloměr ruky => hladký vnitřní ohyb)
FIT_TOL = 0.02    # max. odchylka kubik od přesného obrysu (jednotky maskota)

_LAST = {}        # ladicí informace z posledního volání limb()


# ---------- kosti ----------
def _bones(joints, n=500):
    """Hustě navzorkované kosti: úsečky rameno -> loket -> špička, loket zaoblený kruhovým obloukem."""
    J0, J1, J2 = [tuple(map(float, j)) for j in joints]
    d1 = (J1[0] - J0[0], J1[1] - J0[1]); l1 = math.hypot(*d1)
    d2 = (J2[0] - J1[0], J2[1] - J1[1]); l2 = math.hypot(*d2)
    u1, u2 = (d1[0] / l1, d1[1] / l1), (d2[0] / l2, d2[1] / l2)
    turn = math.atan2(u1[0] * u2[1] - u1[1] * u2[0], u1[0] * u2[0] + u1[1] * u2[1])
    step = (l1 + l2) / n
    line = lambda a, b, last: [(a[0] + (b[0] - a[0]) * i / k, a[1] + (b[1] - a[1]) * i / k)
                               for k in [max(2, int(math.hypot(b[0] - a[0], b[1] - a[1]) / step))]
                               for i in range(k + (1 if last else 0))]
    if abs(turn) < 1e-3:
        return line(J0, J1, False) + line(J1, J2, True)
    t = min(ELBOW_R * math.tan(abs(turn) / 2), 0.45 * min(l1, l2))      # délka tečny od lokte
    rad = t / math.tan(abs(turn) / 2)
    A = (J1[0] - u1[0] * t, J1[1] - u1[1] * t)
    B = (J1[0] + u2[0] * t, J1[1] + u2[1] * t)
    sg = 1 if turn > 0 else -1
    O = (A[0] - u1[1] * rad * sg, A[1] + u1[0] * rad * sg)
    a0 = math.atan2(A[1] - O[1], A[0] - O[0])
    k = max(2, int(rad * abs(turn) / step))
    arc = [(O[0] + rad * math.cos(a0 + turn * i / k), O[1] + rad * math.sin(a0 + turn * i / k)) for i in range(k)]
    return line(J0, A, False) + arc + line(B, J2, True)


class _Spine:
    def __init__(self, joints):
        pts = _bones(joints)
        L = [0.0]
        for a, b in zip(pts, pts[1:]):
            L.append(L[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
        self.pts, self.L, self.total = pts, L, L[-1]

    def pt(self, s):
        pts, L = self.pts, self.L
        if s <= 0 or s >= L[-1]:          # prodloužení po tečně za konce
            a, b = (pts[0], pts[1]) if s <= 0 else (pts[-2], pts[-1])
            base, e = (pts[0], s) if s <= 0 else (pts[-1], s - L[-1])
            d = (b[0] - a[0], b[1] - a[1])
            dl = math.hypot(*d) or 1
            return (base[0] + d[0] / dl * e, base[1] + d[1] / dl * e)
        lo, hi = 0, len(L) - 1
        while hi - lo > 1:
            mid = (lo + hi) // 2
            if L[mid] <= s:
                lo = mid
            else:
                hi = mid
        k = (s - L[lo]) / ((L[hi] - L[lo]) or 1)
        return (pts[lo][0] + (pts[hi][0] - pts[lo][0]) * k, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * k)

    def frame(self, s, h=0.3):
        a, b = self.pt(s - h), self.pt(s + h)
        tx, ty = b[0] - a[0], b[1] - a[1]
        tl = math.hypot(tx, ty) or 1
        return self.pt(s), (tx / tl, ty / tl)


def _profile(s_m, s_c):
    """Poloměr dříku r(s): smoothstep R_ROOT -> R_MID do s_m, pak kosinově R_MID -> R_END do s_c."""
    def r(s):
        if s <= 0:
            return R_ROOT
        if s <= s_m:
            u = s / s_m
            return R_ROOT + (R_MID - R_ROOT) * u * u * (3 - 2 * u)
        if s <= s_c:
            u = (s - s_m) / (s_c - s_m)
            return R_END + (R_MID - R_END) * (1 + math.cos(math.pi * u)) / 2
        return R_END
    return r


def _fmt(p):
    return f"{p[0]:.2f} {p[1]:.2f}"


def _fit_closed(Q, tol=None):
    """Uzavřená hustá lomená čára Q -> kubické Bézierky. Tečny v uzlech = centrální diference (±1 jednotka),
    délky ramen metodou nejmenších čtverců; úsek se dělí v místě největší chyby, dokud chyba > tol."""
    tol = FIT_TOL if tol is None else tol
    m = len(Q)

    def tan(i, reach=1.0):
        ia, la = i, 0.0                       # sousedé ve vzdálenosti ~reach po obrysu na obě strany
        while la < reach:
            la += math.hypot(Q[ia % m][0] - Q[(ia - 1) % m][0], Q[ia % m][1] - Q[(ia - 1) % m][1]); ia -= 1
        ib, lb = i, 0.0
        while lb < reach:
            lb += math.hypot(Q[(ib + 1) % m][0] - Q[ib % m][0], Q[(ib + 1) % m][1] - Q[ib % m][1]); ib += 1
        a, b = Q[ia % m], Q[ib % m]
        dx, dy = b[0] - a[0], b[1] - a[1]
        dl = math.hypot(dx, dy) or 1
        return (dx / dl, dy / dl)

    def pts(i0, i1):
        return [Q[i % m] for i in range(i0, i1 + 1)]

    def fit(i0, i1):
        P = pts(i0, i1)
        t0, t1 = tan(i0 % m), tan(i1 % m)
        L = [0.0]
        for u, v in zip(P, P[1:]):
            L.append(L[-1] + math.hypot(v[0] - u[0], v[1] - u[1]))
        U = [x / (L[-1] or 1) for x in L]
        A, Bp = P[0], P[-1]
        c00 = c01 = c11 = x0 = x1 = 0.0
        for u, q in zip(U, P):
            b0, b1, b2, b3 = (1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u ** 3
            a1 = (t0[0] * b1, t0[1] * b1)
            a2 = (-t1[0] * b2, -t1[1] * b2)
            c00 += a1[0] * a1[0] + a1[1] * a1[1]
            c01 += a1[0] * a2[0] + a1[1] * a2[1]
            c11 += a2[0] * a2[0] + a2[1] * a2[1]
            tmp = (q[0] - (A[0] * (b0 + b1) + Bp[0] * (b2 + b3)), q[1] - (A[1] * (b0 + b1) + Bp[1] * (b2 + b3)))
            x0 += a1[0] * tmp[0] + a1[1] * tmp[1]
            x1 += a2[0] * tmp[0] + a2[1] * tmp[1]
        det = c00 * c11 - c01 * c01
        chord = math.hypot(Bp[0] - A[0], Bp[1] - A[1])
        al = (x0 * c11 - x1 * c01) / det if abs(det) > 1e-12 else chord / 3
        be = (c00 * x1 - c01 * x0) / det if abs(det) > 1e-12 else chord / 3
        if al < chord * 0.05 or be < chord * 0.05:
            al = be = chord / 3
        c1 = (A[0] + t0[0] * al, A[1] + t0[1] * al)
        c2 = (Bp[0] - t1[0] * be, Bp[1] - t1[1] * be)
        err, worst = 0.0, (i0 + i1) // 2
        for j, (u, q) in enumerate(zip(U, P)):
            b0, b1, b2, b3 = (1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u ** 3
            x = b0 * A[0] + b1 * c1[0] + b2 * c2[0] + b3 * Bp[0]
            y = b0 * A[1] + b1 * c1[1] + b2 * c2[1] + b3 * Bp[1]
            e = math.hypot(x - q[0], y - q[1])
            if e > err and 0 < j < len(P) - 1:
                err, worst = e, i0 + j
        return (A, c1, c2, Bp), err, worst

    out = []

    def rec(i0, i1):
        seg, err, worst = fit(i0, i1)
        if err <= tol or i1 - i0 < 6:
            out.append(seg)
        else:
            worst = min(max(worst, i0 + 3), i1 - 3)
            rec(i0, worst)
            rec(worst, i1)
    n0 = max(3, int(m / 16))
    nodes = [round(i * m / n0) for i in range(n0 + 1)]
    for i0, i1 in zip(nodes, nodes[1:]):
        rec(i0, i1)
    return out


def limb(joints, kind="arm"):
    if kind != "arm":
        return _ORIG_SWEEP(joints, _R.LEG_W, _R.LEG_CAP)
    sp = _Spine(joints)
    total = sp.total
    s_c = total - R_PAW                       # střed tlapky na kosti (R_PAW před ním = kloub špičky)
    C, Tc = sp.frame(s_c)
    r = _profile(total * MID_AT, s_c)

    # ---- přesná vzdálenost od ruky (venku): dřík = sjednocení kruhů, tlapka = kružnice ----
    s_end = s_c - SHAFT_TRIM
    nd = int(s_end / 0.3) + 1
    disks = [(sp.pt(s_end * i / nd), r(s_end * i / nd)) for i in range(nd + 1)]

    def field(X):
        a = min(math.hypot(X[0] - p[0], X[1] - p[1]) - rv for p, rv in disks)
        return min(a, math.hypot(X[0] - C[0], X[1] - C[1]) - R_PAW)

    # ---- paprsky (v pořadí obrysu): bok +N, čelo tlapky, bok -N, kořen ----
    rays = []
    n_s = max(8, int(s_c / 0.5))
    for i in range(n_s + 1):
        p, T = sp.frame(s_c * i / n_s)
        rays.append((p, (-T[1], T[0])))
    ac = math.atan2(Tc[1], Tc[0])
    nc = int(math.pi * R_PAW / 0.5)
    for i in range(1, nc):                                  # +90° -> -90°
        a = ac + math.pi / 2 - math.pi * i / nc
        rays.append((C, (math.cos(a), math.sin(a))))
    for i in range(n_s, -1, -1):
        p, T = sp.frame(s_c * i / n_s)
        rays.append((p, (T[1], -T[0])))
    p0, T0 = sp.frame(0.0)
    a0 = math.atan2(T0[1], T0[0])
    nr = int(math.pi * R_ROOT / 0.8)
    for i in range(1, nr):                                  # -90° -> -270° (za ramenem)
        a = a0 - math.pi / 2 - math.pi * i / nr
        rays.append((p0, (math.cos(a), math.sin(a))))

    def cross(o, d, g, level, t0=0.0, step=1.0, it=26):
        """První t, kde g(o + t d) >= level (pochod + půlení)."""
        f = lambda t: g((o[0] + d[0] * t, o[1] + d[1] * t))
        lo, hi = t0, t0 + step
        while f(hi) < level:
            lo, hi = hi, hi + step
        for _ in range(it):
            mid = (lo + hi) / 2
            if f(mid) < level:
                lo = mid
            else:
                hi = mid
        return (lo + hi) / 2

    # 1) ruka rozšířená o CLOSE_R (mračno bodů na její hranici)
    t_dil = [cross(o, d, field, CLOSE_R, t0=8.0) for o, d in rays]
    D = [(o[0] + d[0] * t, o[1] + d[1] * t) for (o, d), t in zip(rays, t_dil)]
    n = len(rays)
    W = 70                                                  # okno paprsků pro hledání nejbližších bodů D

    # 2) uzavření: bod patří dovnitř, když je od rozšířené hranice dál než CLOSE_R
    ring = []
    rr = CLOSE_R * CLOSE_R
    for k, ((o, d), td) in enumerate(zip(rays, t_dil)):
        cand = [D[(k + j) % n] for j in range(-W, W + 1)]

        def outside(t):
            x, y = o[0] + d[0] * t, o[1] + d[1] * t
            return any((x - q[0]) ** 2 + (y - q[1]) ** 2 < rr for q in cand)
        lo, hi = 0.0, td
        for _ in range(26):
            mid = (lo + hi) / 2
            if outside(mid):
                hi = mid
            else:
                lo = mid
        t = (lo + hi) / 2
        ring.append((o[0] + d[0] * t, o[1] + d[1] * t))

    # ---- hustý obrys -> kubiky (Schneiderovo prokládání se sdílenými tečnami => G1, chyba < FIT_TOL) ----
    segs = _fit_closed(ring)

    _LAST.clear()
    _LAST.update(C=C, s_c=s_c, ring=[q[0] for q in segs], dense=ring, D=D, spine=sp.pts, r=r)
    out = "M" + _fmt(segs[0][0])
    for a, c1, c2, b in segs:
        out += "C" + _fmt(c1) + " " + _fmt(c2) + " " + _fmt(b)
    return out + "Z"
