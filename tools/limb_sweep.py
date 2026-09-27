"""Varianta B – „clean sweep“: ruka jako tah štětcem (obálka kotoučů podél hladké páteře).

Konstrukce (jen obrys, klouby / délky / póza beze změny):
  1. Páteř = jediná kubická Bézierka kořen -> špička, která prochází loktem přesně v t = 0.5,
     s konvexním řídicím polygonem (viz SPINE_MU) – žádný Catmull-Rom překmit ani S-kmit.
  2. Páteř se parametrizuje obloukovou délkou (Gauss-Legendre + Newton), takže profil tloušťky
     je rovnoměrný bez ohledu na ohyb.
  3. Tloušťka r(s) = dvě paraboly spojené hladce ve vrcholu (C1, všude konkávní -> žádný „pas“
     ani boule u zápěstí). Bez bulge členu.
  4. Obrys = přesná obálka kotoučů c(s), r(s):  e± = c + r·(−r'·T ± √(1−r'²)·N).
     Díky tomu je napojení na koncové kruhy tečné (G1) – žádný zlom na zápěstí ani u kořene.
  5. Tlapka = přesný kruhový oblouk koncového kotouče (střed na páteři ve vzdálenosti r_e před
     špičkou, takže nejzazší bod obrysu = špička ruky -> délka ruky se nemění). Kořen = oblouk
     kořenového kotouče (schovaný v trupu). Oblouk tlapky má 2·acos(−r'), tj. ~160° místo 180°:
     přesný půlkruh nasazený na zužující se boky by na zápěstí udělal zlom ~10°.
  6. Poloměr se hlídá proti křivosti páteře (r ≤ 0.8·ρ), obálka se kontroluje na samoprotnutí.
  7. Boky se převádějí na kubické Bézierky Hermitovým fitem z přesných derivací obálky
     s adaptivním dělením (max. odchylka 0.02 jednotky); oblouky přesně po ≤ 90° kusech.
Výstup: jedna uzavřená cesta, vždy po směru hodin (na obrazovce).
"""
import math

# ---------- profil (jednotky maskota; hlava ~240 široká) ----------
ARM = dict(
    r0=12.0,        # u kořene (schované v trupu)
    r_max=13.2,     # nejširší místo
    t_peak=0.42,    # kde je nejširší (podíl délky páteře)
    r_end=11.8,     # poloměr kulaté tlapky
)
LEG = dict(r0=15.5, r_max=15.5, t_peak=0.0, r_end=12.8)
TOL = 0.02          # max. odchylka Bézier fitu od přesné obálky
# páteř = kubika přesně loktem (t = .5) s konvexním řídicím polygonem (bez inflexe / S-kmitu):
#   P1 = kořen + μ·(Q − kořen), P2 = špička + μ·(Q − špička), Q = střed + (loket − střed)·4/(3μ)
#   μ = 2/3 -> čistá kvadratika (ohyb rozprostřený, konce přetočené o ~12–18°)
#   μ = 1   -> zdvojený bod (konce skoro po kostech, ale ohyb nahuštěný v lokti -> r·κ až ~1)
SPINE_MU = 0.8
CURV_LIMIT = 0.8    # r <= CURV_LIMIT * poloměr křivosti páteře

# Gauss-Legendre 8 bodů na [0,1]
_GL = [(-0.9602898564975363, 0.1012285362903763), (-0.7966664774136267, 0.2223810344533745),
       (-0.5255324099163290, 0.3137066458778873), (-0.1834346424956498, 0.3626837833783620),
       (0.1834346424956498, 0.3626837833783620), (0.5255324099163290, 0.3137066458778873),
       (0.7966664774136267, 0.2223810344533745), (0.9602898564975363, 0.1012285362903763)]


class Spine:
    """Jediná kubická Bézierka kořen -> loket (t = .5) -> špička, parametrizovaná obloukovou délkou."""

    def __init__(self, a, e, b, mu=None):
        mu = mu or SPINE_MU
        m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        q = (m[0] + (e[0] - m[0]) * 4 / (3 * mu), m[1] + (e[1] - m[1]) * 4 / (3 * mu))
        self.C = [a, (a[0] + mu * (q[0] - a[0]), a[1] + mu * (q[1] - a[1])),
                  (b[0] + mu * (q[0] - b[0]), b[1] + mu * (q[1] - b[1])), b]
        self.L = self._len(1.0)

    def q(self, t):
        return _bez(self.C, t)

    def d1(self, t):
        C, u = self.C, 1 - t
        return tuple(3 * (u * u * (C[1][j] - C[0][j]) + 2 * u * t * (C[2][j] - C[1][j]) + t * t * (C[3][j] - C[2][j]))
                     for j in range(2))

    def d2(self, t):
        C = self.C
        return tuple(6 * ((1 - t) * (C[2][j] - 2 * C[1][j] + C[0][j]) + t * (C[3][j] - 2 * C[2][j] + C[1][j]))
                     for j in range(2))

    def speed(self, t):
        return math.hypot(*self.d1(t))

    def _len(self, t, n=4):
        # složená Gauss-Legendre kvadratura
        tot = 0.0
        for k in range(n):
            a, b = t * k / n, t * (k + 1) / n
            h = (b - a) / 2
            m = (a + b) / 2
            tot += sum(w * self.speed(m + h * x) for x, w in _GL) * h
        return tot

    def t_of_s(self, s):
        t = min(1.0, max(0.0, s / self.L))
        for _ in range(30):
            f = self._len(t) - s
            t_new = min(1.0, max(0.0, t - f / (self.speed(t) or 1e-9)))
            if abs(t_new - t) < 1e-13:
                break
            t = t_new
        return t

    def frame(self, s):
        """(bod, tečna T, normála N, křivost κ) v obloukové délce s. N = T otočená o +90° (x,y)->(−y,x)."""
        t = self.t_of_s(s)
        p = self.q(t)
        d = self.d1(t)
        sp = math.hypot(*d) or 1e-9
        T = (d[0] / sp, d[1] / sp)
        N = (-T[1], T[0])
        dd = self.d2(t)
        kappa = (d[0] * dd[1] - d[1] * dd[0]) / sp ** 3      # >0 = páteř se stáčí k +N
        return p, T, N, kappa


def make_profile(pr, L, s_end):
    """r(s) a r'(s): dvě paraboly se společným vrcholem (C1, konkávní)."""
    r0, rm, re = pr["r0"], pr["r_max"], pr["r_end"]
    sp = max(1e-6, min(pr["t_peak"] * L, s_end - 1e-6))

    def r(s):
        if s <= sp:
            x = (sp - s) / sp
            return rm - (rm - r0) * x * x
        x = (s - sp) / (s_end - sp)
        return rm - (rm - re) * x * x

    def dr(s):
        if s <= sp:
            return 2 * (rm - r0) * (sp - s) / (sp * sp)
        return -2 * (rm - re) * (s - sp) / ((s_end - sp) ** 2)

    return r, dr, sp


def limb(joints, kind):
    joints = [tuple(map(float, p)) for p in joints]
    a, e, b = joints[0], joints[len(joints) // 2], joints[-1]
    pr = ARM if kind == "arm" else LEG
    sp = Spine(a, e, b)
    r_end = pr["r_end"]
    s_end = sp.L - r_end                 # střed koncového kotouče -> nejzazší bod = špička
    r_raw, dr_raw, s_peak = make_profile(pr, sp.L, s_end)

    # --- ochrana proti samoprotnutí vnitřní strany ohybu: r <= CURV_LIMIT·ρ (hladké oříznutí) ---
    kmax = max(abs(sp.frame(s_end * i / 200)[3]) for i in range(201))
    scale = 1.0
    if kmax > 0 and max(r_raw(s_end * i / 200) for i in range(201)) * kmax > CURV_LIMIT:
        scale = CURV_LIMIT / (kmax * max(r_raw(s_end * i / 200) for i in range(201)))
    r = lambda s: r_raw(s) * scale
    dr = lambda s: dr_raw(s) * scale

    def env(s, side):
        p, T, N, _ = sp.frame(s)
        q = max(-0.95, min(0.95, dr(s)))
        c = math.sqrt(1 - q * q)
        u = (-q * T[0] + side * c * N[0], -q * T[1] + side * c * N[1])
        rr = r(s)
        return (p[0] + rr * u[0], p[1] + rr * u[1])

    def denv(s, side, s_lo, s_hi):
        """de/ds, jen z bodů uvnitř [s_lo, s_hi] (profil není C2 ve vrcholu)."""
        h = 1e-4
        if s - 2 * h < s_lo:
            f0, f1, f2 = env(s, side), env(s + h, side), env(s + 2 * h, side)
            return tuple((-3 * f0[j] + 4 * f1[j] - f2[j]) / (2 * h) for j in range(2))
        if s + 2 * h > s_hi:
            f0, f1, f2 = env(s, side), env(s - h, side), env(s - 2 * h, side)
            return tuple((3 * f0[j] - 4 * f1[j] + f2[j]) / (2 * h) for j in range(2))
        f1, f2 = env(s + h, side), env(s - h, side)
        return tuple((f1[j] - f2[j]) / (2 * h) for j in range(2))

    def fit_side(side):
        """Obálka jedné strany od kořene ke špičce -> seznam kubik (adaptivní Hermite)."""
        knots = [0.0, s_peak, s_end] if 0.5 < s_peak < s_end - 0.5 else [0.0, s_end]
        segs = []

        def seg(s0, s1, lo, hi, depth=0):
            p0, p3 = env(s0, side), env(s1, side)
            d0, d3 = denv(s0, side, lo, hi), denv(s1, side, lo, hi)
            k = (s1 - s0) / 3
            p1 = (p0[0] + d0[0] * k, p0[1] + d0[1] * k)
            p2 = (p3[0] - d3[0] * k, p3[1] - d3[1] * k)
            err = 0.0
            for i in range(1, 12):
                tt = i / 12
                bz = _bez((p0, p1, p2, p3), tt)
                ex = env(s0 + (s1 - s0) * tt, side)
                err = max(err, math.hypot(bz[0] - ex[0], bz[1] - ex[1]))
            if err > TOL and depth < 8:
                m = (s0 + s1) / 2
                seg(s0, m, lo, hi, depth + 1)
                seg(m, s1, lo, hi, depth + 1)
            else:
                segs.append((p0, p1, p2, p3))

        for lo, hi in zip(knots, knots[1:]):
            seg(lo, hi, lo, hi)
        return segs

    left = fit_side(+1)
    right = fit_side(-1)

    # koncové oblouky
    def arc(c, rad, a0, a1):
        """Kruhový oblouk z úhlu a0 do a1 (radiány, libovolný směr) po kusech <= 90°."""
        n = max(1, math.ceil(abs(a1 - a0) / (math.pi / 2) - 1e-9))
        out = []
        for i in range(n):
            t0 = a0 + (a1 - a0) * i / n
            t1 = a0 + (a1 - a0) * (i + 1) / n
            k = 4 / 3 * math.tan((t1 - t0) / 4) * rad
            q0 = (c[0] + rad * math.cos(t0), c[1] + rad * math.sin(t0))
            q3 = (c[0] + rad * math.cos(t1), c[1] + rad * math.sin(t1))
            q1 = (q0[0] - k * math.sin(t0), q0[1] + k * math.cos(t0))
            q2 = (q3[0] + k * math.sin(t1), q3[1] - k * math.cos(t1))
            out.append((q0, q1, q2, q3))
        return out

    # tlapka: z levé obálky přes špičku na pravou obálku (úhel klesá)
    pe, Te, Ne, _ = sp.frame(s_end)
    phi = math.atan2(Te[1], Te[0])
    alpha = math.acos(max(-1, min(1, -max(-0.95, min(0.95, dr(s_end))))))
    cap = arc(pe, r(s_end), phi + alpha, phi - alpha)
    # kořen: z pravé obálky kolem zadní strany na levou (úhel dál klesá)
    p0_, T0, N0, _ = sp.frame(0.0)
    phi0 = math.atan2(T0[1], T0[0])
    alpha0 = math.acos(max(-1, min(1, -max(-0.95, min(0.95, dr(0.0))))))
    root = arc(p0_, r(0.0), phi0 - alpha0, phi0 + alpha0 - 2 * math.pi)

    rev = lambda segs: [(s[3], s[2], s[1], s[0]) for s in reversed(segs)]
    loop = left + cap + rev(right) + root

    # jednotný směr: po směru hodin na obrazovce (kladná „shoelace“ plocha v y-dolů)
    area = 0.0
    for s in loop:
        for tt in range(8):
            p, q = _bez(s, tt / 8), _bez(s, (tt + 1) / 8)
            area += p[0] * q[1] - q[0] * p[1]
    if area < 0:
        loop = rev(loop)

    # kontrola samoprotnutí (hustý polygon)
    poly = []
    for s in loop:
        for tt in range(10):
            poly.append(_bez(s, tt / 10))
    if _self_intersects(poly):
        import sys
        print("WARN arm_sweep2: self-intersection", joints, file=sys.stderr)

    d = f"M{loop[0][0][0]:.3f} {loop[0][0][1]:.3f}"
    for s in loop:
        d += f"C{s[1][0]:.3f} {s[1][1]:.3f} {s[2][0]:.3f} {s[2][1]:.3f} {s[3][0]:.3f} {s[3][1]:.3f}"
    return d + "Z"


def _bez(c, t):
    u = 1 - t
    return tuple(u ** 3 * c[0][j] + 3 * u * u * t * c[1][j] + 3 * u * t * t * c[2][j] + t ** 3 * c[3][j] for j in range(2))


def _self_intersects(P):
    n = len(P)

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    for i in range(n):
        a, b = P[i], P[(i + 1) % n]
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            c, d = P[j], P[(j + 1) % n]
            d1, d2 = cross(c, d, a), cross(c, d, b)
            d3, d4 = cross(a, b, c), cross(a, b, d)
            if ((d1 > 0) != (d2 > 0)) and ((d3 > 0) != (d4 > 0)) and d1 * d2 < 0 and d3 * d4 < 0:
                return True
    return False
