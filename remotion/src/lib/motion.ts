import { Easing, interpolate, spring } from "remotion";

const TAU = Math.PI * 2;

/** Seamless sine: `cycles` whole periods over `dur` frames. */
export const loopSin = (frame: number, dur: number, cycles = 1, phase = 0) =>
  Math.sin((frame / dur) * TAU * cycles + phase);

/** 0..1..0 blink pulse at each listed frame (6 frames long). */
export const blinkAt = (frame: number, at: number[]) =>
  at.reduce((m, f) => Math.max(m, interpolate(frame, [f, f + 3, f + 6], [0, 1, 0], clamp)), 0);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Idle life: bob, flame wiggle, gentle head sway — loops over `dur`. */
export const idle = (frame: number, dur: number, amp = 1) => ({
  bob: loopSin(frame, dur, Math.max(1, Math.round(dur / 60)), 0) * 4 * amp,
  flameWiggle: loopSin(frame, dur, Math.max(2, Math.round(dur / 22)), 0.7) * 7,
  headTilt: loopSin(frame, dur, Math.max(1, Math.round(dur / 90)), 1.3) * 2.5 * amp,
});

/** Spring pop 0->1 starting at `start`. */
export const pop = (frame: number, fps: number, start: number, damping = 11, stiffness = 170) =>
  spring({ frame: frame - start, fps, config: { damping, stiffness, mass: 0.7 } });

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** Czech thousands formatting with a narrow no-break space. */
export const czNum = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
