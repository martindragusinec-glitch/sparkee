// Sound design of the Brand Story, synthesized from scratch (no samples, no third-party audio):
//   master B of the Reel "PŘETOČ"   → src/comps/story/audio/sparkee-reel-sfx.wav   (20.0 s, 600 f)
//   the sonic logo of "Zážeh"       → src/comps/story/audio/sparkee-sonic-logo.wav (5.0 s, 150 f)
// Every event sits on the storyboard cue sheet (30 fps, 120 BPM: 1 beat = 15 f, 1 bar = 60 f) and is
// placed sample-accurately. Key: A (the flash chime is E5 → A5), so a track in A at 120 BPM sits under it.
//   node scripts/build-audio.mjs           # writes both WAVs (48 kHz, 24-bit, stereo)
//   OUT=/tmp/x node scripts/build-audio.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = process.env.OUT ?? path.join(root, "src/comps/story/audio");
const SR = 48000;
const FPS = 30;
const f2s = (f) => f / FPS; // frame → seconds

// ------------------------------------------------------------------ tiny DSP kit
let seed = 0x5a17ee;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const white = () => rnd() * 2 - 1;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = (x) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = { E5: 659.25, A5: 880, Cs6: 1108.73, E6: 1318.51, A6: 1760, E4: 329.63, A4: 440, Cs5: 554.37, A3: 220, A2: 110, A1: 55, E2: 82.41 };

class Track {
  constructor(sec) {
    this.n = Math.ceil(sec * SR);
    this.L = new Float32Array(this.n);
    this.R = new Float32Array(this.n);
  }
  /** add a mono signal (Float32Array) at time t (s) with gain and equal-power pan (−1..1) */
  add(sig, t, gain = 1, pan = 0) {
    const i0 = Math.round(t * SR);
    const a = ((pan + 1) * Math.PI) / 4;
    const gl = Math.cos(a) * gain * Math.SQRT2;
    const gr = Math.sin(a) * gain * Math.SQRT2;
    for (let i = 0; i < sig.length; i++) {
      const j = i0 + i;
      if (j < 0 || j >= this.n) continue;
      this.L[j] += sig[i] * gl;
      this.R[j] += sig[i] * gr;
    }
  }
  /** add a stereo pair */
  add2(l, r, t, gain = 1) {
    const i0 = Math.round(t * SR);
    for (let i = 0; i < l.length; i++) {
      const j = i0 + i;
      if (j < 0 || j >= this.n) continue;
      this.L[j] += l[i] * gain;
      this.R[j] += r[i] * gain;
    }
  }
  mix(other, gain = 1) {
    for (let i = 0; i < Math.min(this.n, other.n); i++) {
      this.L[i] += other.L[i] * gain;
      this.R[i] += other.R[i] * gain;
    }
  }
}

/** biquad (RBJ) processing a signal with a per-sample (or per-block) cutoff function */
const biquad = (sig, type, fc, q = 0.707, gainDb = 0) => {
  const out = new Float32Array(sig.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let b0, b1, b2, a1, a2;
  const coef = (f) => {
    const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR;
    const cs = Math.cos(w);
    const sn = Math.sin(w);
    const al = sn / (2 * q);
    const A = Math.pow(10, gainDb / 40);
    let c;
    if (type === "lp") c = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2, 1 + al, -2 * cs, 1 - al];
    else if (type === "hp") c = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2, 1 + al, -2 * cs, 1 - al];
    else if (type === "bp") c = [al, 0, -al, 1 + al, -2 * cs, 1 - al];
    else if (type === "peak") c = [1 + al * A, -2 * cs, 1 - al * A, 1 + al / A, -2 * cs, 1 - al / A];
    else throw new Error(type);
    b0 = c[0] / c[3];
    b1 = c[1] / c[3];
    b2 = c[2] / c[3];
    a1 = c[4] / c[3];
    a2 = c[5] / c[3];
  };
  const dyn = typeof fc === "function";
  if (!dyn) coef(fc);
  for (let i = 0; i < sig.length; i++) {
    if (dyn && i % 32 === 0) coef(fc(i / SR));
    const x = sig[i];
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    out[i] = y;
  }
  return out;
};
const gen = (sec, fn) => {
  const n = Math.max(1, Math.round(sec * SR));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, i);
  return out;
};
const noise = (sec) => gen(sec, () => white());
const env = (sig, fn) => {
  for (let i = 0; i < sig.length; i++) sig[i] *= fn(i / SR);
  return sig;
};
const scale = (sig, g) => {
  for (let i = 0; i < sig.length; i++) sig[i] *= g;
  return sig;
};
const sum = (...sigs) => {
  const n = Math.max(...sigs.map((s) => s.length));
  const out = new Float32Array(n);
  for (const s of sigs) for (let i = 0; i < s.length; i++) out[i] += s[i];
  return out;
};
const sat = (sig, drive = 1.5) => {
  const k = Math.tanh(drive);
  for (let i = 0; i < sig.length; i++) sig[i] = Math.tanh(sig[i] * drive) / k;
  return sig;
};
/** attack / exponential decay envelope */
const ad = (atk, tau) => (t) => (t < atk ? t / atk : Math.exp(-(t - atk) / tau));
/** sine with a frequency function (Hz at time t) */
const sweep = (sec, freq, phase0 = 0) => {
  let ph = phase0;
  return gen(sec, (t) => {
    const v = Math.sin(ph);
    ph += (2 * Math.PI * freq(t)) / SR;
    return v;
  });
};

// ------------------------------------------------------------------ instruments
/** glass bell: inharmonic partials, the upper ones die faster; `bright` 0..1 */
const bell = (f, dur = 2.2, bright = 0.6) => {
  const P = [
    [1, 1, 1],
    [2.0, 0.42, 0.55],
    [2.76, 0.32 * bright, 0.38],
    [4.07, 0.2 * bright, 0.26],
    [5.4, 0.13 * bright, 0.18],
    [8.93, 0.06 * bright, 0.1],
  ];
  const out = new Float32Array(Math.round(dur * SR));
  for (const [r, a, d] of P) {
    const fr = f * r * (1 + (rnd() - 0.5) * 0.002);
    const tau = dur * d * 0.55;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      out[i] += a * Math.sin(2 * Math.PI * fr * t) * (t < 0.002 ? t / 0.002 : Math.exp(-t / tau));
    }
  }
  // strike transient
  const tr = env(biquad(noise(0.02), "hp", 3000), ad(0.0005, 0.004));
  for (let i = 0; i < tr.length; i++) out[i] += tr[i] * 0.25 * bright;
  return scale(out, 0.35);
};
/** tiny high "tink" */
const tink = (f = 3520, dur = 0.35) => scale(bell(f, dur, 0.35), 0.8);
/** a mechanical click: bandpassed noise snap + a small body thump */
const click = (fc = 3200, body = 180, len = 0.05) =>
  sum(
    env(biquad(noise(len), "bp", fc, 2.2), ad(0.0004, 0.006)),
    scale(env(sweep(len * 1.5, (t) => body * (1 - 0.3 * t / len)), ad(0.001, 0.018)), 0.5),
  );
/** a soft whoosh: noise through a sweeping bandpass, shaped by `shape(u)` (u = 0..1 over dur) */
const whoosh = (dur, f0, f1, shape = (u) => Math.sin(Math.PI * u), q = 1.2) =>
  env(biquad(noise(dur), "bp", (t) => f0 * Math.pow(f1 / f0, clamp01(t / dur)), q), (t) => shape(clamp01(t / dur)));
/** sub drop: sine from f0 to f1 with a long decay (+ a little harmonic for small speakers) */
const sub = (f0, f1, dur, tau) => {
  const s = sweep(dur, (t) => f1 + (f0 - f1) * Math.exp(-t / (tau * 0.35)));
  const h = sweep(dur, (t) => 2 * (f1 + (f0 - f1) * Math.exp(-t / (tau * 0.35))));
  return env(sum(s, scale(h, 0.25)), ad(0.004, tau));
};
/** graphite on paper: bandpassed noise with grain, loudness `amp(u)` over the stroke */
const pencil = (dur, amp = () => 1) => {
  const base = biquad(biquad(noise(dur), "bp", 3800, 0.9), "hp", 1500);
  const grain = gen(dur, () => (rnd() < 0.004 ? white() * 3 : 0));
  const g = biquad(grain, "bp", 2500, 1.5);
  return env(sum(base, scale(g, 0.6)), (t) => amp(clamp01(t / dur)) * smooth(t / 0.012) * smooth((dur - t) / 0.02));
};
/** crackle (fuse sizzle): sparse impulses through a bright bandpass, density per second */
const crackle = (dur, density = 220, amp = () => 1) => {
  const imp = gen(dur, (t) => (rnd() < (density * amp(t / dur)) / SR ? white() * (0.5 + rnd()) : 0));
  const hiss = scale(biquad(noise(dur), "hp", 5000), 0.12);
  return env(sum(biquad(imp, "bp", 4200, 0.8), hiss), (t) => amp(clamp01(t / dur)));
};

// ------------------------------------------------------------------ reverb (Freeverb-ish, stereo)
const reverb = (tr, { room = 0.82, damp = 0.35, wet = 0.3, pre = 0.012 } = {}) => {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const aps = [556, 441, 341, 225];
  const run = (inp, spread) => {
    const out = new Float32Array(inp.length);
    const preN = Math.round(pre * SR);
    for (const c of combs) {
      const N = Math.round(((c + spread) * SR) / 44100);
      const buf = new Float32Array(N);
      let idx = 0;
      let store = 0;
      for (let i = 0; i < inp.length; i++) {
        const x = i >= preN ? inp[i - preN] : 0;
        const y = buf[idx];
        store = y * (1 - damp) + store * damp;
        buf[idx] = x + store * room;
        idx = (idx + 1) % N;
        out[i] += y;
      }
    }
    for (const a of aps) {
      const N = Math.round(((a + spread) * SR) / 44100);
      const buf = new Float32Array(N);
      let idx = 0;
      for (let i = 0; i < out.length; i++) {
        const b = buf[idx];
        const x = out[i];
        buf[idx] = x + b * 0.5;
        out[i] = b - x;
        idx = (idx + 1) % N;
      }
    }
    return out;
  };
  const l = run(tr.L, 0);
  const r = run(tr.R, 23);
  const o = new Track(tr.n / SR);
  for (let i = 0; i < tr.n; i++) {
    o.L[i] = tr.L[i] + l[i] * wet * 0.12;
    o.R[i] = tr.R[i] + r[i] * wet * 0.12;
  }
  return o;
};

// ------------------------------------------------------------------ the sonic logo "Zážeh" (open clock o, 150 f)
/** IGNITE times of the letters (o): r 40, a/k 44, p/e 47–48, s/e2 51 (Zazeh.tsx) */
const IGNITE = [51.1, 47.3, 42.8, 40.4, 43.6, 47.0, 51.1];
/**
 * writes the open into `dry` (sparkles/chimes also into `wet` for the reverb) at time offset t0 (s).
 * `hero` = the Reel's cut: a bigger strike (the macro light event).
 */
const sonicLogo = (dry, wet, t0, { hero = false } = {}) => {
  const at = (o) => t0 + f2s(o);
  // o0–o5: silence. o6: STRIKE on the downbeat
  const strikeT = at(6);
  dry.add(env(biquad(noise(0.14), "hp", 2600), ad(0.0008, 0.035)), strikeT, 0.55);
  dry.add(sat(sub(150, 42, 1.1, hero ? 0.36 : 0.28), 1.2), strikeT, hero ? 0.85 : 0.7);
  dry.add(whoosh(0.5, 900, 300, (u) => Math.pow(1 - u, 2)), strikeT, 0.25);
  wet.add(bell(NOTE.A4 * 2, 1.2, 0.8), strikeT, 0.18, 0);
  if (hero) {
    // the ring that crosses the frame: an airy sweep outward
    wet.add(whoosh(0.4, 2000, 8000, (u) => Math.pow(1 - u, 1.5), 0.8), strikeT + 0.01, 0.22, 0);
  }
  // flame ignition (o6–o11): a soft rising flutter
  dry.add(whoosh(0.2, 500, 2200, (u) => Math.sin(Math.PI * u) * 0.9), at(6.5), 0.18);
  // o8–o34: the fuse, two sparks panned (A clockwise → right, B counter-clockwise → left)
  const fuseDur = f2s(26);
  const speed = (u) => {
    // DRAW is fast in the middle: loud in the middle, soft at both ends
    const x = clamp01(u);
    return 0.35 + 0.65 * Math.sin(Math.PI * Math.pow(x, 0.8));
  };
  const cA = crackle(fuseDur + 0.05, 260, speed);
  const cB = crackle(fuseDur + 0.05, 240, speed);
  // pan automation: A travels to the right, B to the left, both come back to the paw (right of centre)
  const panA = (u) => lerp(0.1, 0.75, Math.sin(Math.PI * Math.min(1, u * 1.2))) * (u < 0.9 ? 1 : 0.6);
  const panB = (u) => -lerp(0.1, 0.7, Math.sin(Math.PI * Math.min(1, u * 1.2))) + (u > 0.85 ? 0.5 : 0);
  const iA = Math.round(at(8) * SR);
  for (let i = 0; i < cA.length; i++) {
    const u = i / cA.length;
    for (const [sig, pan] of [[cA, panA(u)], [cB, panB(u)]]) {
      const a = ((pan + 1) * Math.PI) / 4;
      const j = iA + i;
      if (j >= dry.n) continue;
      dry.L[j] += sig[i] * Math.cos(a) * 0.55;
      dry.R[j] += sig[i] * Math.sin(a) * 0.55;
    }
  }
  // the flood (o22–o34): a glassy up-shimmer
  wet.add(env(sum(...[0, 4, 7, 12].map((st, k) => scale(sweep(0.5, (t) => mtof(81 + st) * (1 + 0.04 * t)), 0.25 / (k + 1)))), ad(0.12, 0.2)), at(22), 0.14);
  // o34: the halves meet (tink), o36–o40: the drip (a falling bloop)
  wet.add(tink(NOTE.A6), at(34), 0.3, 0.3);
  dry.add(env(sweep(0.16, (t) => 1400 * Math.pow(0.3, t / 0.16)), ad(0.004, 0.06)), at(36.5), 0.3, 0.25);
  // o40–o52: letters ignite (ticks, fanning out from the paw), the baseline zing
  const LET_PAN = [-0.7, -0.45, -0.2, 0.05, 0.25, 0.45, 0.7];
  IGNITE.forEach((o, i) => dry.add(click(4200 + i * 180, 240, 0.03), at(o), 0.22, LET_PAN[i]));
  wet.add(env(sweep(0.45, (t) => 2600 + 400 * t), (t) => 0.5 * Math.sin(Math.PI * clamp01(t / 0.45))), at(40), 0.05, 0);
  // o58–o63: the leap (a rising whistle + air), o63 E5 grace, o66 A5 + the flash
  dry.add(whoosh(f2s(6), 800, 5000, (u) => smooth(u) * (1 - Math.pow(u, 6))), at(57.5), 0.3, 0.6);
  dry.add(env(sweep(f2s(6), (t) => 700 * Math.pow(1300 / 700, t / f2s(6))), (t) => 0.4 * Math.sin(Math.PI * clamp01(t / f2s(6)))), at(57.5), 0.12, 0.6);
  wet.add(bell(NOTE.E5, 1.6, 0.7), at(63), 0.34, 0.45);
  wet.add(bell(NOTE.A5, 2.6, 0.85), at(66), 0.62, 0.45);
  wet.add(scale(bell(NOTE.A5 * 2, 2.2, 0.5), 0.5), at(66), 0.3, 0.45);
  dry.add(sub(70, NOTE.A1, 1.3, 0.38), at(66), 0.5);
  wet.add(env(biquad(noise(1.8), "hp", 7000), ad(0.01, 0.45)), at(66), 0.12, 0);
  // o81: the blink
  wet.add(tink(4186, 0.3), at(81), 0.14, 0.2);
};

const buildSonic = () => {
  const dur = f2s(150);
  const dry = new Track(dur);
  const wet = new Track(dur);
  sonicLogo(dry, wet, 0);
  const out = reverb(wet, { wet: 0.5, room: 0.8, damp: 0.45 });
  out.mix(dry);
  // the tail settles into silence by the end of the hold (o120 → o150)
  const a = Math.round(f2s(118) * SR);
  for (let i = a; i < out.n; i++) {
    const u = Math.pow(1 - (i - a) / (out.n - a), 2);
    out.L[i] *= u;
    out.R[i] *= u;
  }
  return out;
};

// ------------------------------------------------------------------ the Reel (600 f)
const buildReel = () => {
  const dur = f2s(600);
  const dry = new Track(dur);
  const wet = new Track(dur);
  const F = (f) => f2s(f);

  // --- f596–f599 → f0–f4: the ✦ plucked out of its seat, hooks the playhead (CLICK)
  wet.add(tink(NOTE.A6, 0.5), F(596), 0.22, 0.6);
  wet.add(tink(NOTE.A6, 0.5), F(596) - F(600), 0.22, 0.6); // the same pluck, heard at f0 when the loop restarts mid-note
  dry.add(whoosh(F(4), 1200, 3500, (u) => Math.sin(Math.PI * u)), F(0), 0.12, 0.5);
  dry.add(click(3000, 160, 0.06), F(4), 0.45, 0.55);

  // --- f3–f44: tape rewind whir (speed-driven), stutters on the holds, a clunk at the stop
  const RW = [
    [3, 330],
    [6, 290],
    [14, 195],
    [18, 195],
    [26, 100],
    [30, 100],
    [36, 45],
    [40, 45],
    [44, 0],
  ];
  const speedAt = (f) => {
    for (let i = 0; i < RW.length - 1; i++) {
      const [f0, b0] = RW[i];
      const [f1, b1] = RW[i + 1];
      if (f >= f0 && f < f1) return Math.abs(b1 - b0) / (f1 - f0);
    }
    return 0;
  };
  const whirDur = F(42);
  let ph = 0;
  let sp = 0;
  const whirTone = gen(whirDur, (t) => {
    const f = 3 + t * FPS;
    sp += (speedAt(f) - sp) * 0.0025; // tape inertia
    const hz = 90 + 14 * sp + 3 * Math.sin(2 * Math.PI * 7 * t);
    ph += (2 * Math.PI * hz) / SR;
    // a buzzy tone (odd harmonics) that rises with speed
    return (Math.sin(ph) + 0.4 * Math.sin(3 * ph) + 0.2 * Math.sin(5 * ph)) * clamp01(sp / 10);
  });
  let sp2 = 0;
  const whirNoise = biquad(
    noise(whirDur),
    "bp",
    (t) => {
      const f = 3 + t * FPS;
      sp2 += (speedAt(f) - sp2) * 0.08;
      return 700 + 170 * sp2;
    },
    1.1,
  );
  let sp3 = 0;
  env(whirNoise, (t) => {
    const f = 3 + t * FPS;
    sp3 += (speedAt(f) - sp3) * 0.002;
    return clamp01(sp3 / 11);
  });
  dry.add(scale(biquad(whirTone, "lp", 1800), 0.16), F(3), 1, 0.1);
  dry.add(whirNoise, F(3), 0.5, -0.1);
  // chapter ticks passing under the playhead (p crossings of the rewind clock)
  for (const [f, pan] of [[7.4, 0.5], [11.3, 0.35], [13.7, 0.2], [20.2, 0.05], [22.8, -0.1], [27, -0.25]]) dry.add(click(5200, 400, 0.02), F(f), 0.14, pan);
  dry.add(sum(click(1400, 90, 0.12), scale(sub(120, 60, 0.3, 0.08), 0.6)), F(44), 0.7, -0.55);

  // --- f45: lights off (a deep thoom), f45–f89: the spark (a glass pad, breaths on the beats)
  dry.add(sat(sub(110, 38, 1.2, 0.35), 1.3), F(45), 0.8);
  dry.add(env(biquad(noise(0.6), "lp", 400), ad(0.002, 0.15)), F(45), 0.25);
  const padDur = F(47);
  const pad = sum(
    ...[NOTE.A5, NOTE.E6, NOTE.A6, NOTE.Cs6].map((f, k) =>
      scale(sweep(padDur, (t) => f * (1 + 0.003 * Math.sin(2 * Math.PI * (0.3 + 0.1 * k) * t))), [0.5, 0.3, 0.18, 0.12][k]),
    ),
  );
  env(pad, (t) => {
    const f = 45 + t * FPS;
    const breath = [60, 75].reduce((a, b0) => a + (f >= b0 ? 0.9 * Math.exp(-(f - b0) / 5) : 0), 0);
    return smooth((f - 46) / 10) * (0.5 + 0.2 * Math.sin(2 * Math.PI * 1.1 * t) + breath) * (1 - smooth((f - 88) / 3)) + (f > 83 && f < 90 ? 0.6 * smooth((f - 83) / 6) : 0);
  });
  wet.add(pad, F(45), 0.1, 0);
  for (const b of [60, 75]) {
    dry.add(sub(95, 58, 0.5, 0.12), F(b), 0.4);
    wet.add(tink(NOTE.E6 * 2, 0.4), F(b), 0.06, 0);
  }
  dry.add(whoosh(F(7), 300, 3000, (u) => Math.pow(u, 2)), F(83), 0.22);

  // --- f89: lights on (a soft switch + air), then 01 skica: pencil strokes (from the SKETCH schedule)
  dry.add(click(2600, 140, 0.05), F(89), 0.3, 0);
  wet.add(bell(NOTE.A5, 0.8, 0.4), F(89.5), 0.1, 0);
  dry.add(whoosh(0.35, 3000, 600, (u) => Math.pow(1 - u, 2)), F(89), 0.16);
  const SK = [
    [0, 6.5, 0.8],
    [7.4, 12.4, 0.5],
    [13.3, 17, 0.6],
    [17.4, 19.9, 0.55],
    [20.3, 23, 0.55],
    [23.4, 27, 0.6],
    [27.4, 29.9, 0.55],
    [31, 37, 1],
    [37.3, 43, 1],
    [43.6, 47, 0.9],
    [47.3, 50.3, 0.9],
    [50.6, 53.6, 0.9],
    [54, 57, 0.9],
  ];
  const bF = (b) => 90 + 0.75 * b; // 01–02: b 0–120 over f90–f179
  SK.forEach(([b0, b1, g], i) => {
    const d = F(bF(b1) - bF(b0));
    dry.add(pencil(d, (u) => 0.4 + 0.6 * Math.sin(Math.PI * clamp01(u * 1.1))), F(bF(b0)), 0.3 * g, ((i % 5) - 2) * 0.12);
  });

  // --- 02 řád: compass ticks as each fitted circle closes (ring ends on 16ths), the angle tool
  [71.25, 75, 78.75, 82.5, 86.25].forEach((b, i) => {
    dry.add(click(4600, 520, 0.025), F(bF(b)), 0.24, -0.3 + 0.15 * i);
    wet.add(tink(NOTE.E6 * 2, 0.25), F(bF(b)), 0.05, -0.3 + 0.15 * i);
  });
  dry.add(click(3800, 300, 0.03), F(bF(84)), 0.18, 0.1); // inscribed circle
  dry.add(click(4000, 320, 0.03), F(bF(98)), 0.18, -0.2); // flame circle
  dry.add(whoosh(F(bF(92) - bF(78)), 900, 2400, (u) => 0.5 * Math.sin(Math.PI * u), 3), F(bF(78)), 0.08, 0.4); // the protractor sweep

  // --- 03 křivky (b = f − 60): the anchor zip, the handle pull (a rubber stretch), the release snap, the clean line
  const zipDur = F(20);
  dry.add(
    env(
      biquad(gen(zipDur, () => (rnd() < 110 / SR ? white() : 0)), "bp", (t) => 2500 + 3000 * (t / zipDur), 1.5),
      (t) => 0.8 + 0.2 * Math.sin(t * 40),
    ),
    F(180),
    0.55,
    0.15,
  );
  dry.add(env(sweep(F(6), (t) => 160 + 260 * (t / F(6))), (t) => 0.5 * smooth(t / 0.03)), F(202), 0.18, 0.45); // the stretch
  dry.add(click(2200, 200, 0.05), F(208), 0.5, 0.45); // release: snap
  dry.add(env(sweep(0.25, (t) => 420 * Math.exp(-t * 6) + 180 + 60 * Math.sin(2 * Math.PI * 18 * t) * Math.exp(-t * 10)), ad(0.002, 0.08)), F(208), 0.22, 0.45);
  dry.add(whoosh(F(18), 500, 1600, (u) => 0.7 * Math.sin(Math.PI * u), 0.8), F(206), 0.14, 0);

  // --- 04 barva: the tap (on the chapter downbeat) + a liquid shimmer, the face comes alive on the bar-5 downbeat
  dry.add(sum(click(1800, 220, 0.06), scale(sub(160, 90, 0.2, 0.05), 0.5)), F(225), 0.5, -0.35);
  const liq = gen(0.55, (t) => {
    let v = 0;
    for (let k = 0; k < 5; k++) v += Math.sin(2 * Math.PI * mtof(72 + [0, 4, 7, 12, 16][k]) * (1 + 0.5 * t) * t + k) * Math.exp(-t * (3 + k));
    return v * 0.2;
  });
  wet.add(env(sum(liq, scale(whoosh(0.55, 600, 3000, (u) => Math.sin(Math.PI * u), 2), 0.5)), (t) => smooth(t / 0.02)), F(225.5), 0.22, -0.2);
  wet.add(bell(NOTE.Cs6, 0.7, 0.5), F(240), 0.2, 0); // eyes open (downbeat)
  dry.add(env(sweep(0.09, (t) => 500 + 1500 * t / 0.09), ad(0.002, 0.03)), F(240), 0.12, 0.1); // mouth pop
  wet.add(tink(4700, 0.3), F(249), 0.12, -0.3); // highlight glint
  wet.add(tink(4186, 0.25), F(258), 0.08, 0); // first ^^ blink

  // --- 05 jméno: the swoop down, typewriter clacks (b 226 + 2i → f286 + 2i), the kerning slide
  dry.add(whoosh(F(16), 2400, 500, (u) => Math.sin(Math.PI * u)), F(268), 0.2, -0.2);
  for (let i = 0; i < 7; i++) {
    const t = F(286 + 2 * i);
    dry.add(sum(click(2600 + 200 * (i % 3), 150, 0.05), scale(env(biquad(noise(0.04), "lp", 700), ad(0.001, 0.012)), 0.8)), t, 0.36, -0.6 + 0.2 * i);
  }
  dry.add(whoosh(F(10), 1500, 4500, (u) => 0.6 * Math.sin(Math.PI * u), 2), F(302), 0.12, 0);

  // --- 06 já: rise, fall, the THUD on contact (f330) with the letters' springy ripple, the contented blink
  dry.add(whoosh(F(6), 900, 1800, (u) => 0.5 * Math.sin(Math.PI * u)), F(315), 0.1, 0);
  dry.add(whoosh(F(9), 2200, 500, (u) => Math.pow(u, 1.5)), F(321), 0.2, 0);
  dry.add(sat(sum(sub(120, 48, 0.5, 0.12), scale(env(biquad(noise(0.1), "lp", 900), ad(0.001, 0.02)), 0.7)), 1.4), F(330), 0.9, -0.1);
  dry.add(env(sweep(0.4, (t) => 150 + 30 * Math.sin(2 * Math.PI * 14 * t) * Math.exp(-t * 8)), ad(0.004, 0.1)), F(331), 0.18, 0);
  wet.add(tink(4186, 0.3), F(347), 0.1, 0);

  // --- pre-drop: a riser (f360–f393), 16th-note charges (f381/385/389), the wind-up suck, the dive whoosh, SILENCE f412–f419
  const riseDur = F(33);
  const riser = sum(
    whoosh(riseDur, 300, 4000, (u) => Math.pow(u, 1.6), 0.9),
    scale(env(sweep(riseDur, (t) => NOTE.A3 * Math.pow(4, t / riseDur)), (t) => Math.pow(clamp01(t / riseDur), 1.3)), 0.35),
  );
  dry.add(riser, F(360), 0.3, 0);
  [381, 385, 389].forEach((f, i) => {
    const hz = [NOTE.A4, NOTE.Cs5, NOTE.E5][i] * 2;
    const stab = env(sum(sweep(0.18, () => hz), scale(sweep(0.18, () => hz * 2.01), 0.4), scale(sweep(0.18, () => hz * 0.5), 0.5)), ad(0.002, 0.06));
    dry.add(sat(stab, 1.6), F(f), 0.22 + 0.04 * i, 0);
    wet.add(tink(hz * 2, 0.3), F(f), 0.08, 0);
  });
  // wind-up: a reversed swell (sucks in)
  dry.add(env(biquad(noise(F(3)), "bp", (t) => 3000 - 2000 * (t / F(3)), 1), (t) => Math.pow(t / F(3), 2)), F(390), 0.3, 0);
  // the dive: a big whoosh into the lens, rising, then cut dead at f412
  const diveDur = F(19);
  const dive = sum(
    whoosh(diveDur, 300, 7000, (u) => Math.pow(u, 1.8), 0.7),
    scale(env(sweep(diveDur, (t) => 200 * Math.pow(12, Math.pow(t / diveDur, 1.6))), (t) => Math.pow(clamp01(t / diveDur), 2)), 0.3),
    scale(sub(60, 30, diveDur, 1), 0.3),
  );
  const cutN = Math.round(diveDur * SR);
  for (let i = cutN - 96; i < cutN; i++) dive[i] *= (cutN - i) / 96; // 2 ms fade to hard silence
  dry.add(dive, F(393), 0.42, 0);

  // --- f414: the open (hero cut): the sonic logo, with the bigger strike
  sonicLogo(dry, wet, F(414), { hero: true });

  // --- f510: the ✦ switches the light on (switch click + the iris air), f524 marker swish, f540 twinkle + ^^
  dry.add(sum(click(3400, 260, 0.03), scale(click(1600, 120, 0.05), 0.7)), F(510), 0.55, 0.5);
  dry.add(whoosh(F(6), 5000, 900, (u) => Math.pow(1 - u, 1.5)), F(510), 0.18, 0.3);
  wet.add(bell(NOTE.E6, 1.2, 0.5), F(510.5), 0.12, 0.5);
  dry.add(whoosh(F(9), 1800, 5000, (u) => 0.6 * Math.sin(Math.PI * u), 1.5), F(524), 0.1, -0.2); // the highlighter
  wet.add(bell(NOTE.A6, 1.0, 0.4), F(540), 0.14, 0.2); // the ✦ twinkle on the bar-10 downbeat
  wet.add(tink(4186, 0.3), F(540), 0.07, -0.1); // ^^

  // --- the seam: the claim rolls out, the question rolls in (soft ticks), the bar returns (a zip)
  for (let i = 0; i < 4; i++) dry.add(click(5000, 500, 0.015), F(576 + 2 * i), 0.07, -0.4);
  dry.add(env(biquad(gen(F(14), () => (rnd() < 160 / SR ? white() : 0)), "bp", (t) => 2000 + 4000 * (t / F(14)), 1.4), () => 0.8), F(576), 0.3, 0);

  const out = reverb(wet, { wet: 0.45, room: 0.8, damp: 0.45 });
  out.mix(dry);
  return out;
};

// ------------------------------------------------------------------ master + WAV
/** feed-forward bus compressor (stereo-linked, RMS-ish detector): lifts the small sounds under the hits */
const compress = (tr, { thr = -26, ratio = 2.6, atk = 0.006, rel = 0.14, makeup = 0 } = {}) => {
  const aA = Math.exp(-1 / (atk * SR));
  const aR = Math.exp(-1 / (rel * SR));
  let e = 0;
  const mk = Math.pow(10, makeup / 20);
  for (let i = 0; i < tr.n; i++) {
    const x = Math.max(Math.abs(tr.L[i]), Math.abs(tr.R[i]));
    e = x > e ? aA * e + (1 - aA) * x : aR * e + (1 - aR) * x;
    const lvl = 20 * Math.log10(Math.max(e, 1e-6));
    const over = lvl - thr;
    const gDb = over > 0 ? -over * (1 - 1 / ratio) : 0;
    const g = Math.pow(10, gDb / 20) * mk;
    tr.L[i] *= g;
    tr.R[i] *= g;
  }
  return tr;
};

const master = (tr, peakDb = -1.5) => {
  // gentle bus glue: soft knee saturation, then normalise to a true-peak ceiling (−1.5 dBTP)
  let peak = 0;
  for (let i = 0; i < tr.n; i++) peak = Math.max(peak, Math.abs(tr.L[i]), Math.abs(tr.R[i]));
  let pre = 0.9 / (peak || 1);
  for (let i = 0; i < tr.n; i++) {
    tr.L[i] *= pre;
    tr.R[i] *= pre;
  }
  compress(tr);
  peak = 0;
  for (let i = 0; i < tr.n; i++) peak = Math.max(peak, Math.abs(tr.L[i]), Math.abs(tr.R[i]));
  pre = 0.9 / (peak || 1);
  peak = 0;
  for (let i = 0; i < tr.n; i++) {
    tr.L[i] = Math.tanh(tr.L[i] * pre * 1.2) / Math.tanh(1.2);
    tr.R[i] = Math.tanh(tr.R[i] * pre * 1.2) / Math.tanh(1.2);
    peak = Math.max(peak, Math.abs(tr.L[i]), Math.abs(tr.R[i]));
  }
  // true peak (ITU-R BS.1770 style): 4× oversampled with a windowed-sinc interpolator
  const TAPS = 16;
  const tp = (x) => {
    let m = 0;
    for (let i = TAPS; i < x.length - TAPS; i++) {
      for (let ph = 1; ph < 4; ph++) {
        const frac = ph / 4;
        let acc = 0;
        for (let k = -TAPS + 1; k <= TAPS; k++) {
          const d = k - frac;
          const w = 0.5 + 0.5 * Math.cos((Math.PI * d) / TAPS);
          acc += x[i + k] * (Math.sin(Math.PI * d) / (Math.PI * d)) * w;
        }
        if (Math.abs(acc) > m) m = Math.abs(acc);
      }
      if (Math.abs(x[i]) > m) m = Math.abs(x[i]);
    }
    return m;
  };
  peak = Math.max(peak, tp(tr.L), tp(tr.R));
  const g = Math.pow(10, peakDb / 20) / peak;
  for (let i = 0; i < tr.n; i++) {
    tr.L[i] *= g;
    tr.R[i] *= g;
  }
  // 5 ms fades at both ends (no clicks at the loop point)
  const fN = Math.round(0.005 * SR);
  for (let i = 0; i < fN; i++) {
    const u = i / fN;
    tr.L[i] *= u;
    tr.R[i] *= u;
    tr.L[tr.n - 1 - i] *= u;
    tr.R[tr.n - 1 - i] *= u;
  }
  return tr;
};
const writeWav = (file, tr) => {
  const bytes = 3;
  const n = tr.n;
  const b = Buffer.alloc(44 + n * 2 * bytes);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n * 2 * bytes, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2 * bytes, 28);
  b.writeUInt16LE(2 * bytes, 32);
  b.writeUInt16LE(bytes * 8, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 2 * bytes, 40);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (const v of [tr.L[i], tr.R[i]]) {
      const s = Math.max(-8388608, Math.min(8388607, Math.round(v * 8388607)));
      b.writeIntLE(s, o, 3);
      o += 3;
    }
  }
  writeFileSync(file, b);
};

mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
seed = 0x5a17ee;
writeWav(path.join(OUT, "sparkee-sonic-logo.wav"), master(buildSonic()));
seed = 0x1c0ffee;
writeWav(path.join(OUT, "sparkee-reel-sfx.wav"), master(buildReel()));
console.log(`✓ audio in ${((Date.now() - t0) / 1000).toFixed(1)} s → ${OUT}`);
