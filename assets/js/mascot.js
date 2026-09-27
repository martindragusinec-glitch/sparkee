/* Sparkee – mascot.js
 * Real-time rig + behaviour controller for the inline hero mascot (index.html, <!-- MASCOT:START/END -->).
 * Needs assets/js/mascot-rig.js (SparkeeRig.limbInfo = JS port of tools/limb_sweep.py). No dependencies.
 *
 * Rig (SVG root units, y down). Brand rule: the figure is never deformed – only uniform scale,
 * rotation and translation; arms bend because their outline is regenerated from animated joints.
 *   .m-float       whole figure: float / hops / jumps (translate), tilt (rotate around CENTER) – never upside down
 *   .m-body        lean around the feet
 *   .m-head-rig    head (screen space): rides on the neck of the leaning body, turns around it
 *   .m-flame       secondary motion – lags behind the head, stays upright like a real flame, flickers
 *   .m-eye-l/r     gaze + blink (the face is drawn in logo space, tilted -24deg)
 *   .m-eyes-happy  ^^ eyes (scale-in while the normal eyes squeeze shut), .m-mouth, .m-cheek
 *   [data-limb]    arm outlines (ink + fill copies) rebuilt from joints: shoulder fixed, elbow + paw animated
 *   .m-hand        phone + thumb carried rigidly by the right paw; .m-thumb taps the screen
 *
 * Hero API:  window.SparkeeMascot = { play(), pause(), set(action, tSeconds), trigger(action), burst(n), state(), create(svg, opts), template }
 *   actions: idle, hello (page-load greeting), look, glance, tap, hop, wave, cheer, jump, hops (3rd click), hey (5th click)
 *            (+ point, present, nod: companion gestures)
 *   create(svg, { reactions, reduced, seed, lab, idSuffix, idle: {bag, phone, first, gap}, ambient, fxDir, onAir }) -> instance;
 *   all live instances share one requestAnimationFrame (ticker). template = un-rigged clone of the hero SVG.
 *   set() resets the rig, simulates the action deterministically (fixed 1/120 s steps, seeded RNG) up to t and freezes it.
 *   URL:  ?mascot=wave@0.8  -> frozen frame (screenshots),  ?mascot=hop  -> plays that action live once.
 *   Behaviour: hello at load, then idle actions from a weighted shuffle bag every 6-12 s, slowing down (x1.6 per action,
 *   max 18 s) while the visitor does nothing; hover = 3 swings then a happy hold with a mini-wave every ~4 s;
 *   CTA hover = 3 cheer hops then an excited idle. Page toggle [data-motion-toggle] pauses all of it (html.is-still).
 */
(function () {
  'use strict';
  const Rig = window.SparkeeRig;
  if (!Rig) return;

  /* ---------------- math helpers ---------------- */
  const D2R = Math.PI / 180;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sat = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = {
    lin: x => x,
    sine: x => 0.5 - 0.5 * Math.cos(Math.PI * x),
    io: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    o: x => 1 - Math.pow(1 - x, 3),
    o2: x => 1 - (1 - x) * (1 - x),
    i2: x => x * x,
    back: x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
    soft: x => { const c = 0.8; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
    sback: x => E.back(E.sine(x))                     // overshoot that starts from rest (no velocity kink at the key)
  };
  /* keyframes [[t, v, ease?], ...] – ease belongs to the segment that ends at that key */
  function kf(t, K) {
    if (t <= K[0][0]) return K[0][1];
    for (let i = 1; i < K.length; i++) {
      const k1 = K[i];
      if (t <= k1[0]) {
        const k0 = K[i - 1];
        return lerp(k0[1], k1[1], (E[k1[2]] || E.sine)((t - k0[0]) / ((k1[0] - k0[0]) || 1e-9)));
      }
    }
    return K[K.length - 1][1];
  }
  /* 0 before a, eased up to 1 at b, hold until c, eased down to 0 at d */
  function ramp(t, a, b, c, d, e) {
    const f = E[e || 'sine'];
    if (t <= a || t >= d) return 0;
    if (t < b) return f((t - a) / (b - a));
    if (t <= c) return 1;
    return f((d - t) / (d - c));
  }
  /* half-sine: starts / stops with velocity – only for snaps and impacts (take-off, landing dips) */
  function bump(x, len) { return x <= 0 || x >= len ? 0 : Math.sin(Math.PI * x / len); }
  /* C1-smooth bump (zero velocity at both ends) – for gestures (nods, jabs, "yes!" arms) */
  function sbump(x, len) { return x <= 0 || x >= len ? 0 : 0.5 - 0.5 * Math.cos(TAU * x / len); }
  const has = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  /* damped spring (semi-implicit Euler, called with dt <= 1/120) */
  const spring = () => ({ x: 0, v: 0 });
  function spr(s, target, w, z, dt) {
    s.v += (w * w * (target - s.x) - 2 * z * w * s.v) * dt;
    s.x += s.v * dt;
    return s.x;
  }
  /* 2D affine [a b c d e f] like SVG matrix() */
  const M = {
    id: () => [1, 0, 0, 1, 0, 0],
    mul: (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3],
      m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]],
    tr: (x, y) => [1, 0, 0, 1, x, y],
    rot: (deg, cx, cy) => {
      const a = deg * D2R, c = Math.cos(a), s = Math.sin(a);
      cx = cx || 0; cy = cy || 0;
      return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy];
    },
    ap: (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]]
  };
  const f2 = v => (Math.abs(v) < 5e-3 ? '0' : v.toFixed(2));
  const f3 = v => (Math.abs(v) < 5e-4 ? '0' : v.toFixed(3));

  /* ---------------- geometry (mascot units) ---------------- */
  const SH = { l: [467, 338], r: [541, 338] };         // shoulders (tools/rig.py SH_L / SH_R)
  const NECK = [504, 334];                              // head pivot
  const FEET = [504, 446];                              // body lean pivot
  const CENTER = [504, 262];                            // whole-figure spin pivot
  const UPA = 24 * D2R, CU = Math.cos(UPA), SU = Math.sin(UPA);
  const toLogoV = (x, y) => [x * CU + y * SU, -x * SU + y * CU];   // screen vector -> head (logo) space
  const EYE = { l: [455, 278.5], r: [528.75, 246.25] };            // logo space
  const MOUTH = [498, 281];
  const CHEEK = [[549.25, 264.55], [457.05, 305.7]];               // logo space (DOM order)
  // flame: its inner group is counter-rotated, so raw flame coords map to the screen by a pure translation
  const FLAME_BASE = [425, 139];                         // raw coords (screen ~ 513,130)
  const FLAME_CORE = [430, 131];                         // inner highlight base (raw)
  const THUMB = [584, 331, -20];
  const PHONE_HEART = [602.86, 331.79];                  // heart on the screen, hand space (hold pose)
  const TAP_POINT = [595.5, 327.5];
  const ARM_GRAD = { l: [[456, 340], [410, 372]], r: [[552, 340], [596, 372]] };

  /* arm poses: side-local polar (x = outward, y down): a1 = upper arm angle, b = elbow bend, l1/l2 bone lengths.
     Key poses come straight from tools/rig.py arm_joints() so the static poses are reproduced exactly. */
  const KEYJ = {
    rest: [[20.5, 12], [41, 24]], down: [[14, 20], [24, 40]], out: [[24, 2], [47, 0]],
    wave: [[23, 2], [45, -12]], cheer: [[22, -1], [42, -17]], hold: [[22, 8], [42, -2]]
  };
  const ARM = {};
  for (const k in KEYJ) {
    const e = KEYJ[k][0], t = KEYJ[k][1];
    const a1 = Math.atan2(e[1], e[0]) / D2R, a2 = Math.atan2(t[1] - e[1], t[0] - e[0]) / D2R;
    ARM[k] = { a1, b: a2 - a1, l1: Math.hypot(e[0], e[1]), l2: Math.hypot(t[0] - e[0], t[1] - e[1]) };
  }
  function armJoints(side, a1, b, l1, l2) {
    const sx = side === 'l' ? -1 : 1, s = SH[side];
    const u = a1 * D2R, w = (a1 + b) * D2R;
    const ex = Math.cos(u) * l1, ey = Math.sin(u) * l1;
    const tx = ex + Math.cos(w) * l2, ty = ey + Math.sin(w) * l2;
    return [[s[0], s[1]], [s[0] + sx * ex, s[1] + ey], [s[0] + sx * tx, s[1] + ty]];
  }
  const restTip = side => armJoints(side, ARM.rest.a1, ARM.rest.b, ARM.rest.l1, ARM.rest.l2)[2];
  const REST_TIP = { l: restTip('l'), r: restTip('r') };
  const PAW0 = Rig.limbInfo(armJoints('r', ARM.hold.a1, ARM.hold.b, ARM.hold.l1, ARM.hold.l2)).paw;

  /* ---------------- pose ---------------- */
  const KEYS = ['x', 'y', 'rot', 'lean', 'hr', 'hx', 'hy', 'lookX', 'lookY', 'eyeX', 'eyeY', 'blink', 'wink', 'eyeS', 'happy', 'mouth',
    'cheek', 'flame', 'La', 'Lb', 'L1', 'L2', 'Ra', 'Rb', 'R1', 'R2', 'phoneRot', 'tap', 'heart'];
  const newPose = () => { const P = {}; for (const k of KEYS) P[k] = 0; return P; };
  const copyPose = (src, dst) => { for (const k of KEYS) dst[k] = src[k]; return dst; };
  const blendPose = (P, Q, w) => { for (const k of KEYS) P[k] += (Q[k] - P[k]) * w; };
  function arm(P, side, a1, b, k, l1, l2) {
    if (k === 0) return;
    const p = side === 'l' ? 'L' : 'R';
    P[p + 'a'] = lerp(P[p + 'a'], a1, k);
    P[p + 'b'] = lerp(P[p + 'b'], b, k);
    if (l1 != null) P[p + '1'] = lerp(P[p + '1'], l1, k);
    if (l2 != null) P[p + '2'] = lerp(P[p + '2'], l2, k);
  }
  const PHONE_LOOK = [0.9, 0.75];                  // gaze vector towards the phone

  /* ---------------- actions ----------------
     apply(P, t, layer, S) edits a copy of the base pose; the layer weight crossfades it in/out.
     lock = seconds during which the action cannot be interrupted (in the air); air = the feet leave the ground
     (the companion hides its × meanwhile).
     Expression budget: ^^ eyes only for the hello / wave, the jump, the triple-hop finale and the cheer;
     hop + present get wide eyes (uniform eye scale), tap pays off with a wink, nod with a smile. */
  const tapPulse = x => (x <= 0 || x >= 0.2 ? 0 : x < 0.07 ? E.o2(x / 0.07) : 1 - E.sine((x - 0.07) / 0.13));
  const winkCurve = x => (x <= 0 || x >= 0.35 ? 0 : x < 0.08 ? E.i2(x / 0.08) : x < 0.2 ? 1 : 1 - E.o2((x - 0.2) / 0.15));
  const arc = (u, y0, H) => y0 * (1 - u) - H * 4 * u * (1 - u);              // ballistic air phase from a crouch y0
  const settle = (x, d) => kf(x, [[0, 0], [0.08, d, 'o2'], [0.25, -d * 0.3, 'sine'], [0.44, 0, 'sine']]);   // landing dip + overshoot
  /* "yay!" left arm: out and up with a longer forearm, so the paw ends beside the head lobe, never under it */
  const YAY_L = [11, -41, 23.4, 29.5];
  const YAY_R = [12, -50];

  function jumpApply(P, t, S) {
    const c0 = 0.14, air = 0.58, tl = c0 + air, H = Math.min(54, S.headroom);
    let y;
    if (t < c0) y = 8 * E.sine(t / c0);                                   // anticipation: crouch (translate, no squash)
    else if (t < tl) y = arc((t - c0) / air, 8, H);                        // ballistic arc
    else y = settle(t - tl, 7);                                            // land + settle
    P.y += y;
    const down = ramp(t, 0, c0, c0, c0 + 0.12);
    const up = ramp(t, c0 - 0.02, c0 + 0.16, tl - 0.04, tl + 0.42);
    arm(P, 'l', 54, 6, down); arm(P, 'r', 40, -40, down);
    arm(P, 'l', YAY_L[0], YAY_L[1], up, YAY_L[2], YAY_L[3]); arm(P, 'r', YAY_R[0], YAY_R[1], up);
    P.phoneRot += 16 * up;
    P.hr += -2 * up;                                                       // right lobe lifts off the raised phone
    P.hy += 3.5 * down;
    const joy = ramp(t, 0.02, 0.16, tl + 0.3, tl + 0.7);
    P.happy = lerp(P.happy, 1, joy);
    P.mouth = lerp(P.mouth, 1.32, joy);
    P.cheek = lerp(P.cheek, 1.2, joy);
    P.flame = lerp(P.flame, 1.14, ramp(t, c0, c0 + 0.2, tl, tl + 0.4));
    const inAir = ramp(t, c0, c0 + 0.1, tl - 0.1, tl);
    P.rot += 6 * Math.sin(TAU * (t - c0) / air) * inAir;
    P.lookX *= 1 - joy * 0.7; P.lookY = lerp(P.lookY, -0.35, joy * 0.7);
  }

  /* 3rd click in a row: three quick hops (18 / 24 / 34 u), alternating tilt, the last one with "yay!" + a bigger burst */
  const HOPS = { c0: 0.1, per: 0.3, air: 0.24 };
  HOPS.tl = HOPS.c0 + 2 * HOPS.per + HOPS.air;                             // final landing (0.94 s)
  function hopsApply(P, t, S) {
    const { c0, per, air, tl } = HOPS, hs = Math.min(1, S.headroom / 34);
    let y = 0, k = -1, u = 0;
    if (t < c0) y = 4 * E.sine(t / c0);
    else if (t < tl) {
      k = Math.min(2, Math.floor((t - c0) / per));
      const tc = t - c0 - k * per;
      if (tc < air) { u = tc / air; y = arc(u, k ? 0 : 4, [18, 24, 34][k] * hs); }
      else { y = 3 * bump(tc - air, per - air); k = -1; }                 // short ground contact: dip (impact)
    } else y = settle(t - tl, 6);
    P.y += y;
    const inAir = k >= 0 ? Math.sin(Math.PI * u) : 0;
    const pump = k >= 0 ? 0.5 - 0.5 * Math.cos(TAU * u) : 0;             // arms: smooth up to the apex and back
    const side = k === 1 ? -1 : 1;
    P.rot += side * 6 * inAir;
    P.hr += side * 2.5 * inAir;
    const act = ramp(t, 0, 0.08, tl, tl + 0.3);
    const fin = ramp(t, c0 + 2 * per - 0.02, c0 + 2 * per + 0.1, tl + 0.25, tl + 0.6);
    arm(P, 'l', lerp(34, 6, pump), lerp(4, -34, pump), act * (1 - fin), 23.4, 27);   // arms pump with the hops
    arm(P, 'r', lerp(32, 18, pump), lerp(-40, -48, pump), act * (1 - fin));
    arm(P, 'l', YAY_L[0], YAY_L[1], fin, YAY_L[2], YAY_L[3]); arm(P, 'r', YAY_R[0], YAY_R[1], fin);
    P.phoneRot += 10 * act + 6 * fin;
    const wide = ramp(t, 0.03, 0.14, c0 + 2 * per, c0 + 2 * per + 0.1);
    P.eyeS = lerp(P.eyeS, 1.12, wide);
    P.mouth = lerp(P.mouth, 1.25, wide);
    P.happy = lerp(P.happy, 1, fin);
    P.mouth = lerp(P.mouth, 1.34, fin);
    P.cheek = lerp(P.cheek, 1.2, Math.max(wide, fin));
    P.flame = lerp(P.flame, 1.14, ramp(t, c0, c0 + 0.2, tl, tl + 0.4));
    P.lookX *= 1 - act * 0.6; P.lookY = lerp(P.lookY, -0.3, act * 0.6);
  }

  /* wave: anticipation dip, arm up with overshoot, forearm swings from the elbow (3 full swings), head tilts away.
     loop (hovered): after the 3 swings the arm settles into a happy hold, with a 1.5-swing mini-wave every ~4 s */
  const WAVE_F = 2.4, WAVE_END = 0.3 + 3 / WAVE_F;
  function waveApply(P, t, loop) {
    if (t <= 0) return;
    const antic = sbump(t, 0.2);
    let raise = E.back(E.sine(sat((t - 0.08) / 0.34)));
    let ph = Math.max(0, t - 0.3) * WAVE_F * TAU;
    let amp = E.sine(sat((t - 0.24) / 0.22));
    let g = 1, hold = 0;                                                   // g = greeting intensity (tilt, lean)
    if (loop && t > WAVE_END) {
      const tt = t - WAVE_END;
      hold = E.sine(sat(tt / 0.5));
      raise *= 1 - hold;
      amp *= 1 - E.sine(sat(tt / 0.25));
      g = 1 - 0.55 * hold;
      if (tt > 3.2) {
        const tm = (tt - 3.2) % 4.1, end = 0.2 + 1.5 / WAVE_F;
        const mk = ramp(tm, 0, 0.26, end, end + 0.35);
        if (mk > 0) {
          raise = Math.max(raise, E.back(mk) * (tm < 0.26 ? 1 : 1));
          amp = ramp(tm, 0.12, 0.26, end - 0.06, end + 0.12);
          ph = Math.max(0, tm - 0.2) * WAVE_F * TAU;
          g = Math.max(g, 0.45 + 0.35 * mk);
        }
      }
    }
    const sw = Math.sin(ph) * amp;
    arm(P, 'l', 34, 14, antic * 0.7);                                      // dips before it rises
    if (hold) arm(P, 'l', 24, -10, hold);                                  // relaxed happy hold
    arm(P, 'l', -10 + 4 * Math.sin(ph - 1) * amp, -26 + 22 * sw, raise, 23.4, 26);
    const k = E.sine(sat(t / 0.3));
    P.happy = lerp(P.happy, 1, sat(t / 0.2));
    P.mouth = lerp(P.mouth, 1.3, k);
    P.cheek = lerp(P.cheek, 1.16, k);
    P.hr += (9 * g + 1.8 * Math.sin(ph + 0.4) * amp) * k;                  // friendly tilt away from the waving arm
    P.hy += -3 * g * k; P.hx += 4 * g * k;
    P.lean += (-3 * g + 0.8 * Math.sin(ph + 0.8) * amp) * k;               // body leans into the wave
    P.rot += -1.5 * g * k;
    arm(P, 'r', ARM.hold.a1 + 14 * g, ARM.hold.b + 6 * g, k);              // phone drops so the tilted lobe never covers it
    P.phoneRot += 9 * g * k;
    const lk = 0.6 * k * (1 - hold);
    P.lookX *= 1 - lk; P.lookY *= 1 - lk;
    P.y += -1.6 * Math.abs(Math.sin(ph)) * amp;                            // bouncy body in the wave rhythm
  }

  /* cheer: hops with real ground contact (weight without squash), 3 full hops, then an "excited idle" while held */
  const CH = { T: 0.54, C: 0.12, N: 3 };
  CH.E = CH.N * CH.T + CH.C;                                               // excited idle from 1.74 s
  function cheerApply(P, t) {
    const k = E.sine(sat(t / 0.2));
    let y = 0, up = 0, rot = 0;
    if (t < CH.E) {
      const n = Math.floor(t / CH.T), tc = t - n * CH.T;
      if (tc < CH.C) y = tc < 0.05 ? 3 * E.o2(tc / 0.05) : 3 * (1 - E.sine((tc - 0.05) / 0.07));   // contact dip
      else if (n < CH.N) {
        const u = (tc - CH.C) / (CH.T - CH.C);
        y = -16 * 4 * u * (1 - u);
        up = 0.5 - 0.5 * Math.cos(TAU * u);                                // arms: smooth, highest at the apex
        rot = (n % 2 ? 1 : -1) * 5 * Math.sin(Math.PI * u);                // alternate the tilt per hop
      }
    }
    const te = Math.max(0, t - CH.E), ex = E.sine(sat(te / 0.3));
    const pump = Math.sin(TAU * 1.6 * te);
    y = lerp(y, -5 * (0.5 - 0.5 * Math.cos(TAU * 1.6 * te)), ex);          // excited idle: small 1.6 Hz bounce
    rot = lerp(rot, 2 * Math.sin(Math.PI * 1.6 * te), ex);
    const ak = E.o(sat(t / 0.22));
    arm(P, 'l', lerp(lerp(10, 6, up), 8 + 7 * pump, ex), lerp(lerp(-10, -46, up), -34, ex), ak, 23.4, 29);   // down on contact, up at the apex
    arm(P, 'r', lerp(lerp(17, 12, up), 13 + 4 * pump, ex), -46, ak);      // phone paw stays below the lobe
    P.phoneRot += 12 * k;
    P.y += y * k;
    P.rot += rot * k;
    P.hr += -0.3 * rot * k;                                                // head counter-tilts (overlap), lobe off the phone
    P.happy = lerp(P.happy, 1, sat(t / 0.16));
    P.mouth = lerp(P.mouth, 1.32, k);
    P.cheek = lerp(P.cheek, 1.2, k);
    P.flame = lerp(P.flame, 1.12, k);
    P.lookY = lerp(P.lookY, -0.2, k);
  }

  const A = {
    /* look around: left, right, up at the flame, back – the eyes lead, a blink on each big gaze shift */
    look: {
      dur: 3.3, fadeIn: 0.2, fadeOut: 0.45, blinks: [0.06, 1.02],
      apply(P, t) {
        P.lookX = kf(t, [[0, P.lookX], [0.3, -1, 'io'], [0.95, -0.95], [1.32, 1, 'io'], [2.0, 0.95], [2.32, 0.1, 'io'], [2.8, 0.05], [3.2, 0, 'sine']]);
        P.lookY = kf(t, [[0, P.lookY], [0.3, -0.12, 'io'], [0.95, -0.1], [1.32, -0.3, 'io'], [2.0, -0.3], [2.32, -1, 'io'], [2.8, -1], [3.2, 0, 'sine']]);
        P.flame = lerp(P.flame, 1.1, ramp(t, 2.3, 2.5, 2.75, 3.0));      // looks up at his flame -> it flares
        P.hr += kf(t, [[0, 0], [0.3, -2.5, 'io'], [1.0, -2.5], [1.35, 0, 'io'], [2.0, 0], [2.35, 0, 'io']]);
      }
    },
    /* glance at the phone and back: the phone comes out and down to be read, the head tilts away from it */
    glance: {
      dur: 2.2, fadeIn: 0.25, fadeOut: 0.45, blinks: [0.08],
      apply(P, t) {
        const k = ramp(t, 0.05, 0.42, 1.35, 1.85);
        P.lookX = lerp(P.lookX, PHONE_LOOK[0], k); P.lookY = lerp(P.lookY, PHONE_LOOK[1], k);
        P.hr -= 1.5 * k; P.hy += 1.2 * k;
        arm(P, 'r', 31, -34, k * 0.9);
        P.phoneRot -= 3 * k;
        P.mouth = lerp(P.mouth, 1.12, ramp(t, 0.9, 1.1, 1.4, 1.7));      // little smile at the feed
      }
    },
    /* tap the phone twice with the thumb -> a like pops out of the screen; a beat later he winks */
    tap: {
      dur: 2.5, fadeIn: 0.25, fadeOut: 0.45, blinks: [0.08, 1.95],
      events: [[0.95, (S, api) => { api.like(true); if (api.ambient) api.react(1); }]],
      apply(P, t) {
        const look = ramp(t, 0.04, 0.38, 1.4, 1.85);
        P.lookX = lerp(P.lookX, PHONE_LOOK[0], look); P.lookY = lerp(P.lookY, PHONE_LOOK[1], look);
        P.hr -= 1.5 * look; P.hy += 1.5 * look;
        const raise = ramp(t, 0, 0.36, 1.55, 2.1);
        arm(P, 'r', 32, -36, raise);                    // phone out & low, screen towards the face
        P.phoneRot -= 4 * raise;
        P.tap = Math.max(tapPulse(t - 0.62), tapPulse(t - 0.9));
        P.heart = Math.max(P.heart, bump(t - 0.93, 0.34));
        const joy = ramp(t, 1.12, 1.26, 1.55, 1.85);    // 0.2 s "take" after the heart, then the payoff
        P.wink = Math.max(P.wink, winkCurve(t - 1.12));
        P.mouth = lerp(P.mouth, 1.28, joy);
        P.cheek = lerp(P.cheek, 1.15, joy);
        P.y += -3 * sbump(t - 1.12, 0.42);              // tiny happy bounce
        arm(P, 'l', 20, -14, sbump(t - 1.1, 0.56) * 0.6);   // free arm does a small "yes!"
      }
    },
    /* small hop: anticipation, air, landing settle; wide eyes (^^ are saved for the big beats) */
    hop: {
      dur: 1.2, fadeIn: 0.05, fadeOut: 0.22, lock: 0.62, air: true,
      apply(P, t) {
        const c0 = 0.18, air = 0.4, H = 26, tl = c0 + air;
        let y;
        if (t < c0) y = 5.5 * E.sine(t / c0);
        else if (t < tl) y = arc((t - c0) / air, 5.5, H);
        else y = kf(t - tl, [[0, 0], [0.08, 4.5, 'o2'], [0.23, -1.2, 'sine'], [0.4, 0, 'sine']]);
        P.y += y;
        const down = ramp(t, 0, c0, c0, c0 + 0.1);
        const up = ramp(t, c0 - 0.02, c0 + 0.14, tl - 0.05, tl + 0.3);
        arm(P, 'l', 46, 4, down); arm(P, 'r', 30, -44, down);
        arm(P, 'l', 4, -32, up, 23.4, 27); arm(P, 'r', 16, -46, up);
        P.phoneRot += 8 * up;
        P.hy += 2.5 * down;
        const joy = ramp(t, c0, c0 + 0.1, tl + 0.1, tl + 0.45);
        P.eyeS = lerp(P.eyeS, 1.12, joy);
        P.mouth = lerp(P.mouth, 1.25, joy);
        P.cheek = lerp(P.cheek, 1.12, joy);
        P.rot += kf(t, [[c0, 0], [c0 + air * 0.5, -5, 'sine'], [tl, 3, 'sine'], [tl + 0.3, 0, 'sine']]);
        P.hr += kf(t, [[c0, 0], [c0 + air * 0.5, -2, 'sine'], [tl, 1.5, 'sine'], [tl + 0.35, 0, 'sine']]);
      }
    },
    /* page-load greeting: looks up from the phone, double blink, snaps to the visitor, 3-swing wave */
    hello: {
      dur: 2.75, fadeIn: 0.05, fadeOut: 0.42, blinks: [0.1, 0.34],
      apply(P, t) {
        const s = E.io(sat((t - 0.1) / 0.22));
        P.lookX = lerp(PHONE_LOOK[0], 0, s); P.lookY = lerp(PHONE_LOOK[1], 0.05, s);
        const ca = sbump(t, 0.16);                      // 0.08 s counter-anticipation (-2 deg, a touch down) before the snap
        P.hy += 1.2 * ca; P.hr += -2 * ca;
        P.mouth = lerp(P.mouth, 1.2, ramp(t, 0.2, 0.34, 0.62, 0.8));   // "oh, hi!" – eye contact before the smile
        P.eyeS = lerp(P.eyeS, 1.08, ramp(t, 0.36, 0.44, 0.62, 0.74));
        P.flame = lerp(P.flame, 1.12, ramp(t, 0.12, 0.3, 0.6, 1.0));
        P.y += -2.5 * sbump(t - 0.1, 0.4);              // perks up
        waveApply(P, t - 0.68, false);
      }
    },
    /* wave hello (hover / companion): 3 swings; looped while hovered -> happy hold + occasional mini-wave */
    wave: { dur: 2.0, fadeIn: 0.1, fadeOut: 0.42, blinks: [0.02], apply: (P, t, L) => waveApply(P, t, L && L.loop) },
    /* CTA hover: excited hopping with arms pumping (phone raised), then an excited idle while hovered */
    cheer: { dur: 2.3, fadeIn: 0.12, fadeOut: 0.35, blinks: [0.02], air: true, apply: (P, t) => cheerApply(P, t) },
    /* click / tap: joyful jump; the reaction burst pops on landing */
    jump: { dur: 1.55, fadeIn: 0.05, fadeOut: 0.3, lock: 0.8, air: true, events: [[0.74, (S, api) => api.burst(7)]], apply: (P, t, L, S) => jumpApply(P, t, S) },
    /* 3rd click in a row: triple hop, bigger burst on the last landing */
    hops: { dur: 1.7, fadeIn: 0.05, fadeOut: 0.3, lock: 0.98, air: true, events: [[HOPS.tl + 0.02, (S, api) => api.burst(10)]], apply: (P, t, L, S) => hopsApply(P, t, S) },
    /* 5+ clicks: sassy "hey!" head shake, wide eyes, small mouth */
    hey: {
      dur: 1.15, fadeIn: 0.08, fadeOut: 0.3, blinks: [0.02],
      apply(P, t) {
        const k = ramp(t, 0, 0.12, 0.8, 1.1);
        const sh = ramp(t, 0.1, 0.16, 0.64, 0.72);
        P.hr += 7 * Math.sin(TAU * 3.5 * (t - 0.1)) * sh;
        P.hx += 1.2 * Math.sin(TAU * 3.5 * (t - 0.13)) * sh;
        P.eyeS = lerp(P.eyeS, 1.12, k);
        P.mouth = lerp(P.mouth, 0.85, k);
        P.lookX *= 1 - k; P.lookY *= 1 - k;             // straight at you
        P.y += -2 * k;
        arm(P, 'l', 40, 20, k);
        arm(P, 'r', ARM.hold.a1 + 12, ARM.hold.b + 6, k);   // phone out of the shaking lobe's way
        P.phoneRot += 8 * k;
        P.flame = lerp(P.flame, 1.08, k);
      }
    },

    /* ---- gestures used by the scroll companion (assets/js/companion.js); driven by body channels so they read small ---- */
    /* point at the content on the left: sharp, then held – counter-lean, lean + tilt into it, two small jabs */
    point: {
      dur: 2.5, fadeIn: 0.05, fadeOut: 0.42, blinks: [0.04],
      apply(P, t) {
        const up = E.back(E.sine(sat((t - 0.08) / 0.22)));
        const jab = sbump(t - 0.62, 0.26) + sbump(t - 0.98, 0.26);
        arm(P, 'l', 4 - 6 * jab, -8 + 6 * jab, up, 25, 28);
        const k = E.sine(sat(t / 0.3));
        P.lean += kf(t, [[0, 0], [0.1, 2, 'sine'], [0.32, -7, 'sback'], [2.5, -6, 'sine']]) - 1.2 * jab;
        P.rot += kf(t, [[0, 0], [0.1, 0.8, 'sine'], [0.32, -4, 'sback']]);
        P.hr += -3 * k; P.hx += -3 * k; P.hy += -1.5 * k;
        P.mouth = lerp(P.mouth, 1.2, k);
        P.cheek = lerp(P.cheek, 1.1, k);
        arm(P, 'r', ARM.hold.a1 + 6, ARM.hold.b + 4, k);
        P.phoneRot += 5 * k;
        P.y += -2.5 * jab;
      }
    },
    /* "ta-da!": slow open of both arms during a 20 u hop, proud ±5° wiggle */
    present: {
      dur: 2.7, fadeIn: 0.05, fadeOut: 0.45, blinks: [0.02], air: true,
      apply(P, t, L, S) {
        const open = E.io(sat((t - 0.04) / 0.55));
        arm(P, 'l', YAY_L[0] + 2, -36, open, YAY_L[2], YAY_L[3]);
        arm(P, 'r', YAY_R[0], -46, open);
        P.phoneRot += 16 * open;
        const c0 = 0.12, air = 0.4, tl = c0 + air, H = Math.min(20, S.headroom);
        let y;
        if (t < c0) y = 3.5 * E.sine(t / c0);
        else if (t < tl) y = arc((t - c0) / air, 3.5, H);
        else y = settle(t - tl, 4.5);
        P.y += y;
        const k = E.sine(sat(t / 0.25));
        P.eyeS = lerp(P.eyeS, 1.1, k);
        P.mouth = lerp(P.mouth, 1.32, k);
        P.cheek = lerp(P.cheek, 1.2, k);
        P.flame = lerp(P.flame, 1.14, ramp(t, 0.1, 0.35, 1.3, 1.9));
        const wig = ramp(t, 0.6, 0.75, 1.5, 2.0);
        P.rot += 5 * Math.sin(TAU * 1.7 * (t - 0.6)) * wig;
        P.hr += 3 * Math.sin(TAU * 1.7 * (t - 0.66)) * wig;
        P.lookY = lerp(P.lookY, -0.25, k * 0.5);
      }
    },
    /* "yes, yes": two smooth nods with a blink at each bottom, content smile */
    nod: {
      dur: 1.8, fadeIn: 0.1, fadeOut: 0.35, blinks: [0.2, 0.64],
      apply(P, t) {
        const n = sbump(t - 0.06, 0.42) + 0.85 * sbump(t - 0.48, 0.42);
        P.hy += 9 * n; P.hx += -2 * n; P.hr += -3 * n;
        P.y += 2 * n;
        P.lookY = lerp(P.lookY, P.lookY + 0.35, n);
        const k = ramp(t, 0.04, 0.3, 1.15, 1.55);
        P.mouth = lerp(P.mouth, 1.26, k);
        P.cheek = lerp(P.cheek, 1.18, k);
        arm(P, 'l', ARM.rest.a1 - 8, ARM.rest.b - 14, k * 0.7);
      }
    }
  };
  /* idle choice: weighted shuffle bags (wave is saved for the hello + hover so it stays meaningful) */
  const IDLE_BAG = { look: 0.35, glance: 0.25, tap: 0.25, hop: 0.15 };
  const PHONE_BAG = { tap: 0.45, glance: 0.35, look: 0.2 };                // visitor idle: busy with the phone

  /* one shared requestAnimationFrame for every live instance (hero + scroll companion) */
  const ticker = {
    subs: new Set(), raf: 0,
    add(f) { this.subs.add(f); if (!this.raf) this.raf = requestAnimationFrame(tick); },
    remove(f) { this.subs.delete(f); if (!this.subs.size && this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; } }
  };
  function tick(now) {
    ticker.raf = requestAnimationFrame(tick);          // next frame first: one failing instance can never stall the others
    ticker.subs.forEach(f => {
      try { f(now); } catch (e) { if (f.fail) f.fail(e); else ticker.subs.delete(f); }
    });
    if (!ticker.subs.size && ticker.raf) { cancelAnimationFrame(ticker.raf); ticker.raf = 0; }
  }

  /* ---------------- instance ---------------- */
  let instances = 0;

  function create(svg, opts) {
    opts = opts || {};
    const q = s => svg.querySelector(s);
    const el = {
      float: q('.m-float'), body: q('.m-body'), head: q('.m-head-rig'), flame: q('.m-flame'),
      eyes: q('.m-eyes'), eyeL: q('.m-eye-l'), eyeR: q('.m-eye-r'), happy: q('.m-eyes-happy'),
      mouth: q('.m-mouth'), cheeks: [...svg.querySelectorAll('.m-cheek')], shadow: q('.m-shadow'),
      inkL: q('.m-body-ink [data-limb="arm-l"]'), fillL: q('.m-body-fill [data-limb="arm-l"]'),
      inkR: q('.m-body-ink [data-limb="arm-r"]'), fillR: q('.m-body-fill [data-limb="arm-r"]'),
      hand: q('.m-hand'), thumb: q('.m-thumb'), heart: q('.m-phone-heart')
    };
    if (!el.float || !el.body || !el.head || !el.inkL || !el.fillL || !el.inkR || !el.fillR) return null;
    const uid = ++instances;
    const NS = 'http://www.w3.org/2000/svg';
    const sfx = opts.idSuffix || '';                    // a cloned SVG with renamed ids (companion) -> '#bd-arm-l' + sfx
    const DX = opts.fxDir || 1;                         // horizontal multiplier for particles / reactions (< 0: drift left, companion at the right edge)
    /* idle: bag = weights of the idle actions, first/gap = [min, random extra] seconds; after 3 idle actions without
       any visitor input every gap grows x1.6 (cap 18 s) so he calms down while the visitor reads */
    const IDLE = Object.assign({ bag: IDLE_BAG, phone: PHONE_BAG, first: [6, 6], gap: [6, 6] }, opts.idle);
    const ENTRANCE = opts.entrance || 0;                // hero: scripted hello this many seconds after he is first seen

    // per-instance arm gradients (they follow the arm direction)
    const grads = {};
    for (const side of ['l', 'r']) {
      const g = q('#bd-arm-' + side + sfx);
      const fill = side === 'l' ? el.fillL : el.fillR;
      if (!g) continue;
      const c = g.cloneNode(true);
      c.id = 'bd-arm-' + side + '-rig' + uid;
      g.parentNode.appendChild(c);
      fill.setAttribute('fill', 'url(#' + c.id + ')');
      grads[side] = c;
    }
    const flameInner = el.flame && el.flame.firstElementChild;          // <g transform="rotate(-24 425 97)">
    const flameT0 = flameInner ? (flameInner.getAttribute('transform') || '') : '';
    const flamePaths = el.flame ? el.flame.querySelectorAll('path') : [];
    const flameCore = flamePaths.length > 1 ? flamePaths[flamePaths.length - 1] : null;
    const happyPaths = el.happy ? [...el.happy.children] : [];
    const happyT0 = happyPaths.map(p => p.getAttribute('transform') || '');
    const happyC = [EYE.l, EYE.r];

    // fx layer (hearts / sparkles / ripples) on top of everything, in root space
    const fx = document.createElementNS(NS, 'g');
    fx.setAttribute('class', 'm-fx');
    fx.setAttribute('aria-hidden', 'true');
    svg.appendChild(fx);
    const HEART_D = 'M0 8c-5-3.6-8.5-6.4-8.5-10 0-2.6 2-4.4 4.4-4.4 1.8 0 3.3 1.1 4.1 2.6.8-1.5 2.3-2.6 4.1-2.6 2.4 0 4.4 1.8 4.4 4.4 0 3.6-3.5 6.4-8.5 10z';
    const SPARK_D = 'M0 -10C2.8 -2.8 2.8 -2.8 10 0C2.8 2.8 2.8 2.8 0 10C-2.8 2.8 -2.8 2.8 -10 0C-2.8 -2.8 -2.8 -2.8 0 -10Z';
    const pool = { heart: [], spark: [], ring: [] };
    function fxNode(type) {
      const g = document.createElementNS(NS, 'g');
      if (type === 'heart') g.innerHTML = `<path d="${HEART_D}" fill="#F09BA5" stroke="#2C303C" stroke-width="2.4" stroke-linejoin="round"/><circle cx="-4" cy="-2.2" r="1.7" fill="#fff" opacity=".9"/>`;
      else if (type === 'spark') g.innerHTML = `<path d="${SPARK_D}" fill="url(#sp-holo${sfx})" stroke="#2C303C" stroke-width="1.6" stroke-linejoin="round"/>`;
      else g.innerHTML = '<circle r="7" fill="none" stroke="#fff" stroke-width="2.4"/>';
      g.setAttribute('display', 'none');
      fx.appendChild(g);
      return g;
    }

    const S = {};
    const api = {};

    S.headroom = 54;                                    // jump apex limit (units), set from the layout (api.setHeadroom)

    function reset(seed) {
      const sd = seed == null ? 0x5ee4 : seed;
      S.rng = mulberry32(sd);
      S.frng = mulberry32(sd ^ 0x2545f491);             // own stream for the float periods (never shifts other draws)
      S.t = 0;
      S.layers = [];
      S.queued = null;
      S.nextIdle = IDLE.first[0] + S.rng() * IDLE.first[1];
      S.bags = {}; S.idleRun = 0;
      S.hover = false; S.excite = false; S.exciteEdge = false; S.waved = false;
      S.look = [0, 0]; S.lookAct = 0; S.away = false;
      S.touchLook = null;
      S.idleK = 0;
      S.scrollV = 0;
      S.blinks = []; S.nextBlink = 2.8 + S.rng() * 3.7;
      S.sacc = [0, 0]; S.nextSacc = 1.5 + S.rng();
      S.gE = [spring(), spring()]; S.gH = [spring(), spring()]; S.sac = [spring(), spring()];
      S.drag = spring(); S.hlag = spring(); S.fa = spring(); S.fx = spring(); S.fy = spring();
      S.prevY = null; S.prevHead = null;
      S.particles = [];
      S.auto = true;
      S.combo = 0; S.lastPoke = -9;
      if (S.air && opts.onAir) opts.onAir(false);
      S.entrance = 0; S.air = false; S.errors = 0;
      S.fc = [{ t0: 0, r: 1.6, f: 2.3 }];
      S.P = newPose(); S.Q = newPose(); S.F = newPose();
      base(S.P); copyPose(S.P, S.F);
    }
    /* hero load: he starts busy with his phone and greets the visitor `at` s after he is first seen */
    function armEntrance(at) {
      S.entrance = at;
      S.idleK = 1;
      S.gE[0].x = S.gH[0].x = PHONE_LOOK[0]; S.gE[1].x = S.gH[1].x = PHONE_LOOK[1];
      S.nextIdle = at + A.hello.dur + IDLE.gap[0] + S.rng() * IDLE.gap[1];
    }

    /* ---- base pose: idle life (float/breath with overlapping lags, sway, gaze, blinks) ---- */
    /* float: asymmetric (rise 1.6 s, fall 2.3 s), each cycle ±10 % (seeded) so it never phase-locks with the CSS loops */
    function floatY(t) {
      if (t <= 0) return 0;
      const C = S.fc;
      let last = C[C.length - 1];
      while (last.t0 + last.r + last.f <= t) {
        const k = 0.9 + 0.2 * S.frng();
        last = { t0: last.t0 + last.r + last.f, r: 1.6 * k, f: 2.3 * k };
        C.push(last);
        if (C.length > 48) C.splice(0, 24);
      }
      let i = C.length - 1;
      while (i > 0 && C[i].t0 > t) i--;
      const c = C[i], x = Math.max(0, t - c.t0);
      if (x < c.r) return -8 * E.sine(Math.pow(x / c.r, 0.75));          // rise: quick start, soft arrival (C1 at both ends)
      return -8 * (1 - E.sine(Math.min(1, (x - c.r) / c.f)));              // fall: slow ease in-out
    }
    function base(P) {
      const t = S.t;
      P.x = 0; P.y = floatY(t); P.rot = 0;
      const lagH = floatY(t - 0.24) - P.y, lagA = floatY(t - 0.36) - P.y;   // > 0 while rising
      P.lean = 0.9 * Math.sin(t * 0.83) + 0.35 * Math.sin(t * 1.9 + 1);
      P.hr = 1.7 * Math.sin(t * 0.61) + 0.6 * Math.sin(t * 1.37 + 1);
      P.hx = 0; P.hy = lagH * 0.9;
      // gaze: pointer / touch point / phone when idle
      let lx = S.look[0], ly = S.look[1];
      if (S.touchLook) {
        const L = S.touchLook, k = ramp(t, L.t0, L.t0 + 0.2, L.t0 + L.hold, L.t0 + L.hold + 0.6);
        lx = lerp(lx, S.touchLook.x, k); ly = lerp(ly, S.touchLook.y, k);
      }
      P.lookX = lerp(lx, PHONE_LOOK[0], S.idleK); P.lookY = lerp(ly, PHONE_LOOK[1], S.idleK);
      const sv = clamp(S.scrollV / 1800, -1, 1);      // scrolling: glance along, lean + head inertia
      P.lookY += sv * 0.6; P.lean += sv * 1.6; P.hy += sv * 2.5;
      P.eyeX = S.sac[0].x; P.eyeY = S.sac[1].x;
      P.blink = 0; P.wink = 0; P.eyeS = 1; P.happy = 0; P.mouth = 1; P.cheek = 1; P.flame = 1;
      P.La = ARM.rest.a1 + lagA * 1.8 + 2.4 * Math.sin(t * 1.3); P.Lb = ARM.rest.b + 3 * Math.sin(t * 1.3 - 0.8);
      P.L1 = ARM.rest.l1; P.L2 = ARM.rest.l2;
      P.Ra = ARM.hold.a1 + lagA * 0.8 + 0.8 * Math.sin(t * 0.9 + 2); P.Rb = ARM.hold.b + 1.5 * Math.sin(t * 0.9 + 1.2);
      P.R1 = ARM.hold.l1; P.R2 = ARM.hold.l2;
      P.phoneRot = 1.5 * Math.sin(t * 0.9);
      P.tap = 0;
      const hb = t % 5.2;                                // the like on the screen beats softly now and then: lub-dub
      P.heart = 0.3 * Math.max(bump(hb, 0.16), 0.7 * bump(hb - 0.22, 0.16));
    }

    const blinkCurve = x => (x <= 0 || x >= 0.2 ? 0 : x < 0.06 ? E.i2(x / 0.06) : x < 0.085 ? 1 : 1 - E.o2((x - 0.085) / 0.115));
    function blink(double) {
      S.blinks.push(S.t);
      if (double) S.blinks.push(S.t + 0.24);
    }

    function activeTop() {
      for (let i = S.layers.length - 1; i >= 0; i--) if (S.layers[i].state !== 'out') return S.layers[i];
      return null;
    }
    function idleGap() {
      const g = IDLE.gap[0] + S.rng() * IDLE.gap[1];
      return Math.min(Math.max(18, g), g * Math.pow(1.6, Math.max(0, S.idleRun - 2)));
    }
    function start(name, loop, t0) {
      if (!has(A, name)) return;                        // own keys only (?mascot=toString must not reach Object.prototype)
      const act = A[name];
      for (const L of S.layers) if (L.state !== 'out') L.state = 'out';
      S.layers.push({ name, act, t: t0 || 0, w: 0, state: 'in', loop: !!loop, fired: 0, blinked: 0 });
      while (S.layers.length > 4) S.layers.shift();
      S.nextIdle = S.t + (loop ? 0 : act.dur) + idleGap();
    }
    function release(L) { if (L && L.state !== 'out') { L.state = 'out'; S.nextIdle = S.t + idleGap(); } }
    /* weighted shuffle bag: every action gets its share, in a random order, no long streaks */
    function draw(w) {
      const key = w === IDLE.phone ? 'phone' : 'idle';
      let bag = S.bags[key];
      if (!bag || !bag.length) {
        bag = [];
        for (const n of Object.keys(w)) if (has(A, n)) for (let i = Math.round(w[n] * 20); i > 0; i--) bag.push(n);
        for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(S.rng() * (i + 1)); const x = bag[i]; bag[i] = bag[j]; bag[j] = x; }
        S.bags[key] = bag;
      }
      return bag.pop();
    }
    const input = () => { S.idleRun = 0; };

    function schedule() {
      const top = activeTop();
      if (top && top.act.lock && top.t < top.act.lock) return;      // in the air: wait
      if (S.queued) { const n = S.queued; S.queued = null; start(n); return; }
      if (top && (top.name === 'jump' || top.name === 'hops' || top.name === 'hey')) return;   // let the landing / take finish
      const want = S.excite ? 'cheer' : S.hover ? 'wave' : null;
      if (want) {
        if (top && top.name === want) {
          top.loop = true;
          if (want === 'cheer' && S.exciteEdge && top.t > CH.E) start('cheer', true);   // a new hover / focus: full cheer again
        } else start(want, true, want === 'wave' && S.waved ? WAVE_END + 0.6 : 0);   // after a click: straight to the happy hold
        if (want === 'wave') S.waved = true;
        S.exciteEdge = false;
        return;
      }
      S.exciteEdge = false;
      if (top && top.loop) release(top);
      if (!S.auto || top || S.t < S.nextIdle) return;
      const name = draw(S.idleK > 0.5 ? IDLE.phone : IDLE.bag);
      S.idleRun++;
      start(name);
    }

    /* ---- one simulation step (dt <= 1/120) ---- */
    function step(dt) {
      S.t += dt;
      const t = S.t;
      // gaze mode: before the hello / idle cursor (8 s) / cursor away -> look at the phone
      const pre = S.entrance > 0 && t < S.entrance;
      const idle = S.auto && (pre || S.away || t - S.lookAct > 8);
      S.idleK += ((idle ? 1 : 0) - S.idleK) * (1 - Math.exp(-dt / (idle ? 0.9 : 0.25)));
      S.scrollV *= Math.exp(-dt * 3.5);
      if (S.touchLook && t > S.touchLook.t0 + S.touchLook.hold + 0.8) S.touchLook = null;
      if (S.entrance > 0 && t >= S.entrance) {
        S.entrance = 0;
        if (!activeTop() && !S.hover && !S.excite) start('hello');
      }
      schedule();
      // layers
      for (const L of S.layers) {
        L.t += dt;
        const ev = L.act.events;
        while (ev && L.fired < ev.length && L.t >= ev[L.fired][0]) { ev[L.fired][1](S, api); L.fired++; }
        const bl = L.act.blinks;
        while (bl && L.blinked < bl.length && L.t >= bl[L.blinked]) { blink(false); L.blinked++; }
        if (L.state === 'in') { L.w = Math.min(1, L.w + dt / L.act.fadeIn); if (L.w >= 1) L.state = 'hold'; }
        if (!L.loop && L.state !== 'out' && L.t >= L.act.dur - L.act.fadeOut) L.state = 'out';
        if (L.state === 'out') L.w = Math.max(0, L.w - dt / L.act.fadeOut);
      }
      S.layers = S.layers.filter(L => !(L.state === 'out' && L.w <= 0));
      const air = S.layers.some(L => L.act.air && L.w > 0.05);
      if (air !== S.air) { S.air = air; if (opts.onAir) opts.onAir(air); }
      // spontaneous blinks (~13 / min, 12 % doubles) + slow saccades while the cursor is not being tracked
      if (S.auto && t >= S.nextBlink) { blink(S.rng() < 0.12); S.nextBlink = t + 2.8 + S.rng() * 3.7; }
      S.blinks = S.blinks.filter(b => t - b < 0.3);
      if (t >= S.nextSacc) {
        const tracked = !S.away && t - S.lookAct < 2 && S.idleK < 0.5;
        S.sacc = S.auto && !tracked ? [(S.rng() - 0.5) * 2.8, (S.rng() - 0.5) * 1.6] : [0, 0];
        S.nextSacc = t + 1.2 + S.rng() * 1.8;
      }
      spr(S.sac[0], S.sacc[0], 45, 1, dt); spr(S.sac[1], S.sacc[1], 45, 1, dt);

      // pose = base + action layers
      const P = S.P, Q = S.Q;
      base(P);
      for (const L of S.layers) {
        if (L.w <= 0) continue;
        copyPose(P, Q);
        L.act.apply(Q, L.t, L, S);
        blendPose(P, Q, E.sine(L.w));
      }
      let bv = 0;
      for (const b of S.blinks) bv = Math.max(bv, blinkCurve(t - b));
      P.blink = Math.max(P.blink, bv);

      // gaze springs: eyes lead (fast), head follows (slower, slight overshoot)
      const F = S.F;
      copyPose(P, F);
      const ex = spr(S.gE[0], clamp(P.lookX, -1.2, 1.2), 26, 1, dt), ey = spr(S.gE[1], clamp(P.lookY, -1.2, 1.2), 26, 1, dt);
      const hx = spr(S.gH[0], clamp(P.lookX, -1.1, 1.1), 9.5, 0.72, dt), hy = spr(S.gH[1], clamp(P.lookY, -1.1, 1.1), 9.5, 0.72, dt);
      // looking right (the phone side, level or up as well as down): the head barely rolls or shifts – the eyes, a small
      // lift and a lean to the left carry the look, and the paw drops a little, so the right lobe stays off the phone
      const rgt = sat(hx), dr = 1 - 0.75 * rgt;
      F.hr = P.hr + clamp(hx, -1, 1) * 6 * dr;
      F.hx = P.hx + hx * 3.2 * dr;
      F.hy = P.hy + hy * 2.6 - 1.2 * rgt;
      F.eyeX = P.eyeX + clamp(ex, -1, 1) * 2.4;
      F.eyeY = P.eyeY + clamp(ey, -1, 1) * 2.1;
      F.lean = P.lean - clamp(hx, -1, 1) * 1.6 - 1.2 * rgt;   // body leans opposite to the head

      // secondary motion from the vertical velocity of the figure
      const vy = S.prevY == null ? 0 : (P.y - S.prevY) / dt;
      S.prevY = P.y;
      const drag = spr(S.drag, clamp(-vy * 0.045, -20, 20), 15, 0.42, dt);     // arms trail / float
      F.La = P.La + drag; F.Ra = P.Ra + drag * 0.45 + 5 * rgt; F.Lb = P.Lb - drag * 0.25;
      F.hy += spr(S.hlag, clamp(-vy * 0.014, -5, 5), 17, 0.45, dt);           // head overlaps the body

      // flame: stays upright (lags the head turn), drags behind head motion, wobbles
      const n = rotAbout(NECK, FEET, F.lean);
      const hwx = F.x + n[0] + F.hx, hwy = F.y + n[1] + F.hy, hwa = F.hr + F.rot;
      if (!S.prevHead) S.prevHead = [hwx, hwy, hwa];
      const hvx = (hwx - S.prevHead[0]) / dt, hvy = (hwy - S.prevHead[1]) / dt, hva = (hwa - S.prevHead[2]) / dt;
      S.prevHead = [hwx, hwy, hwa];
      spr(S.fa, clamp(-F.hr * 0.55 - hvx * 0.06 - hva * 0.05, -16, 16), 9, 0.45, dt);   // settles after ~1 wobble
      spr(S.fx, clamp(-hvx * 0.012, -7, 7), 13, 0.35, dt);
      spr(S.fy, clamp(-hvy * 0.02, -12, 12), 11, 0.4, dt);   // real follow-through on jumps

      // particles
      for (const p of S.particles) {
        p.age += dt;
        if (p.age < 0) continue;                         // staggered launch
        const drg = Math.exp(-dt * p.drag);
        p.vx *= drg; p.vy = p.vy * drg - p.lift * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      }
      S.particles = S.particles.filter(p => p.age < p.life);

    }

    function rotAbout(p, c, deg) {
      const a = deg * D2R, cs = Math.cos(a), sn = Math.sin(a), dx = p[0] - c[0], dy = p[1] - c[1];
      return [c[0] + dx * cs - dy * sn, c[1] + dx * sn + dy * cs];
    }

    /* ---- world transforms (for fx spawn points) ---- */
    function rootM() { const F = S.F; return M.mul(M.tr(F.x, F.y), M.rot(F.rot, CENTER[0], CENTER[1])); }
    function bodyM() { return M.mul(rootM(), M.rot(S.F.lean, FEET[0], FEET[1])); }
    function handRot(paw) { return (paw.angle - PAW0.angle) / D2R * 0.55 + S.F.phoneRot + 2.5 * S.F.tap; }
    function handM() {
      const F = S.F;
      const paw = Rig.limbInfo(armJoints('r', F.Ra, F.Rb, F.R1, F.R2)).paw;
      return M.mul(bodyM(), M.mul(M.tr(paw.x, paw.y), M.mul(M.rot(handRot(paw)), M.tr(-PAW0.x, -PAW0.y))));
    }
    api.phoneWorld = () => M.ap(handM(), PHONE_HEART);
    api.pawWorld = () => {                               // left paw centre (root space)
      const F = S.F, paw = Rig.limbInfo(armJoints('l', F.La, F.Lb, F.L1, F.L2)).paw;
      return M.ap(bodyM(), [paw.x, paw.y]);
    };

    function spawn(type, x, y, o) {
      S.particles.push(Object.assign({ type, x, y, vx: 0, vy: 0, rot: 0, vr: 0, s: 1, age: 0, life: 1.2, drag: 2.2, lift: 0 }, o));
      if (S.particles.length > 26) S.particles.shift();
    }
    api.like = big => {
      const hm = handM(), p = M.ap(hm, PHONE_HEART), tp = M.ap(hm, TAP_POINT), r = S.rng;
      spawn('ring', tp[0], tp[1], { life: 0.45, s: 1 });
      spawn('heart', p[0] + 4, p[1] - 6, { vx: DX * (95 + r() * 25), vy: -125 - r() * 25, rot: 10, vr: 40 + r() * 30, s: big ? 1.6 : 1.2, life: 1.5, drag: 1.7, lift: 35 });
      spawn('spark', p[0] + 10, p[1] - 12, { vx: DX * (130 + r() * 30), vy: -60 - r() * 30, vr: 200, s: 0.8, life: 0.8, drag: 2.6 });
      spawn('spark', p[0] + 2, p[1] - 16, { vx: DX * (60 + r() * 20), vy: -170 - r() * 30, vr: -200, s: 0.62, life: 0.75, drag: 2.6 });
    };
    /* celebration burst (fired on landing): a fan out of both paws – phone side up-right, free paw up-left – so the
       hearts leave the head silhouette within ~0.3 s instead of hovering beside it; 35 ms stagger */
    api.burst = n => {
      if (api.live && !running()) return;              // hero off-screen: nothing to celebrate with
      const pr = api.phoneWorld(), pl = api.pawWorld(), r = S.rng;
      n = Math.min(n || 6, 10);
      const rs = DX > 0 ? DX : Math.abs(DX) * 0.6;       // at the right screen edge the phone side fans out less
      for (let i = 0; i < n; i++) {
        const right = i % 2 === 0, heart = (i >> 1) % 2 === 0 || i < 2, o = right ? pr : pl;
        const vx = (80 + r() * 120) * (right ? rs : -1), vy = -340 - r() * 100;
        spawn(heart ? 'heart' : 'spark', o[0] + (r() - 0.5) * 8, o[1] - 6, {
          age: -i * 0.035, vx, vy, vr: (r() - 0.5) * 320, rot: (r() - 0.5) * 30,
          s: heart ? 1.0 + r() * 0.5 : 0.6 + r() * 0.35, life: heart ? 1.1 : 0.85, drag: 1.4, lift: heart ? 20 : -60
        });
      }
      api.react(Math.max(1, n - 5));
    };
    api.react = n => {                                      // DOM emoji/bubble reactions (hero only)
      const box = opts.reactions;
      if (!box || !api.live || opts.reduced) return;
      const p = api.phoneWorld(), ctm = svg.getScreenCTM(), br = box.getBoundingClientRect();
      if (!ctm || !br.width) return;
      const cx = ctm.a * p[0] + ctm.c * p[1] + ctm.e, cy = ctm.b * p[0] + ctm.d * p[1] + ctm.f;
      const EMOJI = ['❤️', '💜', '✨', '🔥', '👏'], BUB = ['+1 like', 'Wow!', '+12 ❤', 'Sdíleno', '+1 follow'];
      for (let i = 0; i < n; i++) {
        const e = document.createElement('span'), bub = Math.random() < 0.3;
        e.className = 'reaction' + (bub ? ' reaction--bubble' : '');
        e.textContent = bub ? BUB[Math.random() * BUB.length | 0] : EMOJI[Math.random() * EMOJI.length | 0];
        e.style.left = ((cx - br.left) / br.width * 100 + (Math.random() - 0.5) * 6).toFixed(2) + '%';
        e.style.top = ((cy - br.top) / br.height * 100 - 4 + (Math.random() - 0.5) * 5).toFixed(2) + '%';
        e.style.setProperty('--dx', DX * (Math.random() * 120 - 40) + 'px');
        e.style.setProperty('--rot', (Math.random() * 40 - 20) + 'deg');
        e.style.animationDelay = (i * 0.09) + 's';
        box.appendChild(e);
        e.addEventListener('animationend', () => e.remove());
      }
    };

    /* ---- render (transform attributes + arm path d) ---- */
    const setA = (node, name, v) => {
      if (!node) return;
      const key = '_' + name;
      if (node[key] !== v) { node[key] = v; node.setAttribute(name, v); }
    };
    const setT = (node, v) => setA(node, 'transform', v);
    const lastJ = { l: null, r: null };
    const same = (a, b) => b && Math.abs(a[1][0] - b[1][0]) < 0.004 && Math.abs(a[1][1] - b[1][1]) < 0.004 &&
      Math.abs(a[2][0] - b[2][0]) < 0.004 && Math.abs(a[2][1] - b[2][1]) < 0.004;
    function drawArm(side, J) {
      if (same(J, lastJ[side])) return lastJ[side].info;
      const info = Rig.limbInfo(J);
      const ink = side === 'l' ? el.inkL : el.inkR, fill = side === 'l' ? el.fillL : el.fillR;
      ink.setAttribute('d', info.d); fill.setAttribute('d', info.d);
      const g = grads[side];
      if (g) {                                          // gradient follows shoulder -> paw
        const sh = J[0], rt = REST_TIP[side], tip = J[2];
        const v0x = rt[0] - sh[0], v0y = rt[1] - sh[1], v1x = tip[0] - sh[0], v1y = tip[1] - sh[1];
        const d0 = v0x * v0x + v0y * v0y, a = (v1x * v0x + v1y * v0y) / d0, b = (v1y * v0x - v1x * v0y) / d0;
        const G = ARM_GRAD[side];
        const mp = p => { const dx = p[0] - sh[0], dy = p[1] - sh[1]; return [sh[0] + a * dx - b * dy, sh[1] + b * dx + a * dy]; };
        const p1 = mp(G[0]), p2 = mp(G[1]);
        g.setAttribute('x1', p1[0].toFixed(1)); g.setAttribute('y1', p1[1].toFixed(1));
        g.setAttribute('x2', p2[0].toFixed(1)); g.setAttribute('y2', p2[1].toFixed(1));
      }
      J.info = info;
      lastJ[side] = J;
      return info;
    }

    function render() {
      const F = S.F, t = S.t;
      setT(el.float, `translate(${f2(F.x)} ${f2(F.y)})` + (Math.abs(F.rot) > 1e-3 ? ` rotate(${f2(F.rot)} ${CENTER[0]} ${CENTER[1]})` : ''));
      setT(el.body, `rotate(${f3(F.lean)} ${FEET[0]} ${FEET[1]})`);
      const n = rotAbout(NECK, FEET, F.lean);
      setT(el.head, `translate(${f2(n[0] + F.hx)} ${f2(n[1] + F.hy)}) rotate(${f3(F.hr)}) translate(${-NECK[0]} ${-NECK[1]}) rotate(24 490 300)`);

      // flame (raw coords are screen-oriented): lag offset + upright/drag angle + flicker, uniform scale only
      if (flameInner) {
        const fl = S.fa.x + 2.2 * Math.sin(TAU * 1.1 * t) + 1.2 * Math.sin(TAU * 2.7 * t + 1.3) + 0.5 * Math.sin(TAU * 5.3 * t);
        const fs = F.flame * (1 + 0.025 * Math.sin(TAU * 1.9 * t) + 0.012 * Math.sin(TAU * 4.3 * t + 0.5));
        const b = FLAME_BASE;
        setT(flameInner, `${flameT0} translate(${f2(S.fx.x)} ${f2(S.fy.x)}) translate(${b[0]} ${b[1]}) rotate(${f2(fl)}) scale(${f3(fs)}) translate(${-b[0]} ${-b[1]})`);
        if (flameCore) {
          const c = FLAME_CORE, cs = 1 + 0.06 * Math.sin(TAU * 3.1 * t + 0.4) + 0.03 * Math.sin(TAU * 6.7 * t);
          setT(flameCore, `translate(0 ${f2(-1.2 * Math.sin(TAU * 2.2 * t))}) translate(${c[0]} ${c[1]}) scale(${f3(cs)}) translate(${-c[0]} ${-c[1]})`);
        }
      }

      // eyes: gaze + blink (vertical on screen) ; happy ^^ eyes pop in while normal eyes squeeze shut
      const ev = toLogoV(F.eyeX, F.eyeY);
      // uniform eye scale (wide eyes) x blink squeeze; a short squeeze (happy 0..0.3) hands over to the ^^ eyes
      const open = Math.max(0.04, (1 - F.blink) * (1 - 0.96 * E.sine(sat(F.happy / 0.3))));
      const es = F.eyeS || 1;
      for (const [node, c, o] of [[el.eyeL, EYE.l, open], [el.eyeR, EYE.r, Math.max(0.04, open * (1 - F.wink))]]) {
        setT(node, `translate(${f2(ev[0] + c[0])} ${f2(ev[1] + c[1])}) rotate(-24) scale(${f3(es)} ${f3(es * o)}) rotate(24) translate(${-c[0]} ${-c[1]})`);
      }
      setA(el.eyes, 'opacity', f2(1 - sat((F.happy - 0.28) / 0.06)));
      if (el.happy) {                                   // ...then the ^^ eyes pop open with a little overshoot
        setA(el.happy, 'opacity', f2(sat((F.happy - 0.26) / 0.08)));
        const s = 0.35 + 0.65 * E.back(sat((F.happy - 0.26) / 0.74));
        happyPaths.forEach((p, i) => {
          const c = happyC[i];
          setT(p, `translate(${f2(ev[0] * 0.6)} ${f2(ev[1] * 0.6)}) translate(${c[0]} ${c[1]}) scale(${f3(s)}) translate(${-c[0]} ${-c[1]}) ${happyT0[i]}`);
        });
      }
      setT(el.mouth, `translate(${MOUTH[0]} ${MOUTH[1]}) scale(${f3(F.mouth)}) translate(${-MOUTH[0]} ${-MOUTH[1]})`);
      el.cheeks.forEach((c, i) => {
        const p = CHEEK[i] || CHEEK[0];
        setT(c, `translate(${p[0]} ${p[1]}) scale(${f3(F.cheek)}) translate(${-p[0]} ${-p[1]})`);
      });

      // arms (joints -> outline), phone rides on the right paw
      drawArm('l', armJoints('l', F.La, F.Lb, F.L1, F.L2));
      const ir = drawArm('r', armJoints('r', F.Ra, F.Rb, F.R1, F.R2));
      const paw = ir.paw;
      setT(el.hand, `translate(${f2(paw.x)} ${f2(paw.y)}) rotate(${f2(handRot(paw))}) translate(${f2(-PAW0.x)} ${f2(-PAW0.y)})`);
      const tp = F.tap;
      setT(el.thumb, `translate(${f2(THUMB[0] + 9 * tp)} ${f2(THUMB[1] - 3.5 * tp)}) rotate(${f2(THUMB[2] - 16 * tp)}) scale(${f3(1 - 0.12 * tp)})`);
      setT(el.heart, `translate(0 0.8) scale(${f3(1 + 0.5 * F.heart)}) translate(0 -0.8)`);

      // ground shadow shrinks as he rises
      if (el.shadow) {
        const k = clamp(1 + F.y / 150, 0.5, 1.06);
        setT(el.shadow, `translate(${f2(504 + F.x)} 452) scale(${f3(k)}) translate(-504 -452)`);
        setA(el.shadow, 'opacity', f3(0.12 * (0.35 + 0.65 * k)));
      }

      // particles
      const used = { heart: 0, spark: 0, ring: 0 };
      for (const p of S.particles) {
        if (p.age < 0) continue;
        const list = pool[p.type];
        const node = list[used[p.type]] || (list[used[p.type]] = fxNode(p.type));
        used[p.type]++;
        const a = p.age / p.life;
        let s, op;
        if (p.type === 'ring') { s = p.s * (0.4 + 1.6 * E.o(a)); op = 0.9 * (1 - a); }
        else { s = p.s * E.back(sat(p.age / 0.22)); op = 1 - sat((a - 0.62) / 0.38); }
        setA(node, 'display', 'inline');
        setT(node, `translate(${f2(p.x + (p.type === 'heart' ? 5 * Math.sin(p.age * 7) : 0))} ${f2(p.y)}) rotate(${f2(p.rot)}) scale(${f3(s)})`);
        setA(node, 'opacity', f2(op));
      }
      for (const k in pool) for (let i = used[k]; i < pool[k].length; i++) setA(pool[k][i], 'display', 'none');
    }

    /* ---- loop (driven by the shared ticker: one rAF for all instances) ---- */
    let lastNow = 0, ticking = false;
    S.want = false; S.visible = true;
    const running = () => S.want && S.visible && !document.hidden;
    function stop() { if (ticking) { ticker.remove(frame); ticking = false; } }
    function frame(now) {
      if (!running()) { stop(); return; }
      let dt = lastNow ? (now - lastNow) / 1000 : 1 / 60;
      lastNow = now;
      dt = Math.min(dt, 0.05);
      const n = Math.max(1, Math.ceil(dt * 120 - 1e-6)), h = dt / n;
      for (let i = 0; i < n; i++) step(h);
      render();
      S.errors = 0;
    }
    let logged = false;
    frame.fail = e => {                                 // called by the ticker when this instance throws
      if (!logged) { logged = true; console.error('[SparkeeMascot] frame failed, dropping the running actions', e); }
      S.layers = []; S.queued = null; S.particles = [];
      if (++S.errors > 3) stop();                       // broken beyond one action: freeze this figure, the rest keeps going
    };
    function kick() { if (running() && !ticking) { ticking = true; lastNow = 0; ticker.add(frame); } }

    api.play = () => { S.want = true; api.live = !opts.lab; kick(); };
    api.pause = () => { S.want = false; stop(); };
    api.setVisible = v => { S.visible = v; if (!running()) stop(); kick(); };
    api.ticking = () => ticking;
    api.render = render;
    api.step = step;

    /* deterministic freeze for screenshots: set('wave', 0.8); prep(api) runs after the reset (e.g. api.lookAt) */
    api.set = (action, time, prep) => {
      api.pause();
      api.live = false;
      reset(0x5ee4);
      S.auto = false;
      S.lookAct = 0;
      if (prep) prep(api);
      time = Math.max(0, +time || 0);
      if (action === 'wave' || action === 'cheer') { if (action === 'wave') S.hover = true; else S.excite = true; }
      else if (action === 'hello') {
        S.gE[0].x = S.gH[0].x = PHONE_LOOK[0]; S.gE[1].x = S.gH[1].x = PHONE_LOOK[1];
        start('hello');
      } else if (action && action !== 'idle') start(action);
      const H = 1 / 120, n = Math.round(time / H);
      for (let i = 0; i < n; i++) step(H);
      render();
      return api;
    };
    api.trigger = name => {
      if (name === 'jump' || name === 'hops') return api.poke(name);
      if (has(A, name)) start(name);
    };
    /* click / tap: jump; 3rd click in a row -> triple hop; 5th -> "hey!" (never a flip: he stays upright, on stage) */
    api.poke = forced => {
      input();
      const t = S.t;
      S.combo = t - S.lastPoke < 1.6 ? S.combo + 1 : 1;
      S.lastPoke = t;
      const name = has(A, forced) ? forced : S.combo >= 5 ? 'hey' : S.combo === 3 ? 'hops' : 'jump';
      if (name === 'hey') S.combo = 0;
      const top = activeTop();
      if (top && top.act.lock && top.t < top.act.lock) { S.queued = name; return; }
      start(name);
    };
    api.hover = on => {
      S.hover = on;
      if (on) { input(); S.lookAct = S.t; S.away = false; } else S.waved = false;   // a new hover greets with the full wave again
    };
    api.excite = on => { if (on && !S.excite) { S.exciteEdge = true; input(); } S.excite = on; };
    api.pointer = (nx, ny) => {
      if (S.idleK > 0.6 && !S.hover && !(S.entrance > 0)) blink(true);   // "oh, hi!" when the cursor comes back
      S.look[0] = nx; S.look[1] = ny; S.lookAct = S.t; S.away = false;
      input();
    };
    api.away = () => { S.away = true; };
    api.touchAt = (nx, ny) => { S.touchLook = { x: nx, y: ny, t0: S.t, hold: 2.2 }; S.lookAct = S.t; input(); };
    api.lookAt = (nx, ny, hold) => {                  // turn to a point (eyes lead, head follows) for `hold` s, then back
      S.touchLook = { x: clamp(nx, -1.1, 1.1), y: clamp(ny, -1.1, 1.1), t0: S.t, hold: hold == null ? 2.2 : hold };
      S.lookAct = S.t; S.away = false;
      input();
    };
    api.scroll = v => { S.scrollV = lerp(S.scrollV, v, 0.35); if (Math.abs(v) > 60) input(); };
    api.setHeadroom = u => { S.headroom = clamp(u, 24, 54); };
    api.entrance = at => { armEntrance(at); step(1 / 120); render(); };   // show the on-the-phone pose right away
    /* motion pause (page toggle): calm rest pose, no ticking; resume() continues live */
    api.still = () => { api.set('idle', 0); };
    api.resume = () => { S.auto = true; api.play(); };
    api.ambient = opts.ambient !== false;
    api.state = () => ({ t: +S.t.toFixed(3), layers: S.layers.map(L => `${L.name}${L.loop ? '(loop)' : ''}:${L.state}@${L.t.toFixed(2)} w${L.w.toFixed(2)}`), idleK: +S.idleK.toFixed(2), particles: S.particles.length, next: +S.nextIdle.toFixed(2), idleRun: S.idleRun, air: S.air, combo: S.combo });
    api.S = S;

    reset(opts.seed != null ? opts.seed : (Math.random() * 1e9) | 0);
    svg.classList.add('is-rigged');
    render();
    return api;
  }

  /* ---------------- hero wiring ---------------- */
  const hero = { create };
  window.SparkeeMascot = hero;

  /* page-level motion pause (WCAG 2.2.2): [data-motion-toggle] freezes the hero + companion (calm rest pose) and pauses
     every CSS animation outside the story (it has its own pause); remembered per visitor. Other scripts listen to the
     'sparkee:motion' event (detail.still) or read html.is-still. */
  const MOTION_KEY = 'sparkee-motion';
  const motion = {
    get() { try { return localStorage.getItem(MOTION_KEY) === 'still'; } catch (e) { return false; } },
    set(v) { try { if (v) localStorage.setItem(MOTION_KEY, 'still'); else localStorage.removeItem(MOTION_KEY); } catch (e) { /* storage blocked */ } }
  };
  hero.still = () => document.documentElement.classList.contains('is-still');

  function initHero() {
    const wrap = document.querySelector('[data-mascot]');
    const svg = wrap && wrap.querySelector('svg.mascot');
    if (!svg) return;
    const stage = wrap.closest('[data-stage]') || wrap.parentElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    hero.template = svg.cloneNode(true);              // pristine copy (before rigging) for other instances, e.g. the scroll companion
    const reactions = stage && stage.querySelector('[data-reactions]');
    const m = create(svg, { reactions, reduced });
    if (!m) return;
    Object.assign(hero, { play: m.play, pause: m.pause, set: m.set, trigger: m.trigger, burst: m.burst, state: m.state, instance: m });

    const toggle = document.querySelector('[data-motion-toggle]');
    let still = !reduced && motion.get();
    const setStill = (on, save) => {
      still = on;
      document.documentElement.classList.toggle('is-still', on);
      if (toggle) toggle.setAttribute('aria-pressed', String(on));
      if (save) motion.set(on);
      if (on) { m.still(); if (reactions) reactions.textContent = ''; } else if (!frozen) m.resume();
      document.dispatchEvent(new CustomEvent('sparkee:motion', { detail: { still: on } }));
    };
    if (toggle) {
      if (reduced) toggle.hidden = true;                // nothing moves anyway
      else toggle.addEventListener('click', () => setStill(!still, true));
    }

    /* jump headroom (layout only, also for frozen frames): at the apex the flame tip (root y ~44 at rest) must stay
       6 px below the text of any nav item above it (the nav band is transparent at the top of the page);
       12 u margin for the float peak + flame follow-through */
    const nav = document.querySelector('[data-nav]');
    const headroom = () => {
      const ctm = svg.getScreenCTM();
      if (!ctm || !ctm.d) return;
      const k = ctm.d, fx = ctm.a * 513 + ctm.e, half = 40 * k;
      let clear = 4;
      if (nav) for (const it of nav.querySelectorAll('a, button')) {
        const r = it.getBoundingClientRect();
        if (r.width && r.right > fx - half && r.left < fx + half) clear = Math.max(clear, r.top + r.height / 2 + 10);
      }
      const tip = k * 44 + ctm.f + scrollY;               // document y (the nav sits at the top when scrollY = 0)
      m.setHeadroom((tip - clear - 6) / k - 12);
    };
    headroom();
    addEventListener('load', headroom);
    let rsT = 0;
    addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(headroom, 200); });

    const param = new URLSearchParams(location.search).get('mascot');
    const frozen = !!(param && param.includes('@'));
    if (frozen) {                                       // frozen test frame
      const [a, t] = param.split('@');
      m.set(a, parseFloat(t));
      return;
    }

    let seen = false;
    const io = 'IntersectionObserver' in window;
    if (reduced) {                                      // static friendly pose, only an occasional blink while on screen
      m.S.auto = false;
      m.set('idle', 0);
      svg.classList.add('is-static');
      const blinkOnce = () => {
        if (document.hidden || !seen) return;
        const t0 = performance.now();
        const tick = now => {
          const x = (now - t0) / 1000;
          m.S.F.blink = x < 0.06 ? x / 0.06 : x < 0.085 ? 1 : Math.max(0, 1 - (x - 0.085) / 0.115);
          m.render();
          if (x < 0.2) requestAnimationFrame(tick); else { m.S.F.blink = 0; m.render(); }
        };
        requestAnimationFrame(tick);
      };
      let blinkT = 0;
      const vis = on => { seen = on; clearInterval(blinkT); blinkT = on ? setInterval(blinkOnce, 5200) : 0; };
      if (io) new IntersectionObserver(([e]) => vis(e.isIntersecting)).observe(stage || svg); else vis(true);
      return;
    }

    const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
    const headClient = () => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      return [ctm.a * 504 + ctm.c * 250 + ctm.e, ctm.b * 504 + ctm.d * 250 + ctm.f];
    };
    const toLook = (x, y) => {
      const h = headClient();
      if (!h) return [0, 0];
      return [clamp((x - h[0]) / (innerWidth * 0.42), -1, 1), clamp((y - h[1]) / (innerHeight * 0.42), -1, 1)];
    };
    addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' || !m.ticking()) return;    // off-screen / paused: no layout reads
      const l = toLook(e.clientX, e.clientY);
      m.pointer(l[0], l[1]);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') m.away(); });   // touch "leaves" after every tap
    addEventListener('blur', () => m.away());

    if (!coarse) {
      wrap.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') m.hover(true); });
      wrap.addEventListener('pointerleave', () => m.hover(false));
      document.querySelectorAll('[data-excite]').forEach(b => {
        b.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') m.excite(true); });
        b.addEventListener('pointerleave', () => m.excite(false));
        b.addEventListener('focus', () => m.excite(true));
        b.addEventListener('blur', () => m.excite(false));
      });
    }
    wrap.addEventListener('click', () => { if (!still) m.poke(); });
    if (stage) stage.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch' || wrap.contains(e.target)) return;
      const l = toLook(e.clientX, e.clientY);
      m.touchAt(l[0], l[1]);
    });

    let lastY = scrollY, lastT = performance.now();
    addEventListener('scroll', () => {
      const now = performance.now(), dt = Math.max(16, now - lastT);
      if (m.ticking()) m.scroll((scrollY - lastY) / dt * 1000);
      lastY = scrollY; lastT = now;
    }, { passive: true });

    if (io) new IntersectionObserver(([e]) => m.setVisible(e.isIntersecting)).observe(stage || svg);
    document.addEventListener('visibilitychange', () => m.setVisible(m.S.visible));
    const trig = param && has(A, param) ? param : null;
    if (!trig) m.entrance(0.8);                         // on the phone, then the hello once he is on screen
    if (still) setStill(true, false);
    else m.play();
    if (trig) setTimeout(() => m.trigger(trig), 400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHero);
  else initHero();
})();
