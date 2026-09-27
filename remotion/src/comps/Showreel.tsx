import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotAt, preloadMascots } from "../mascot/Mascot";
import { C, POSE, foreWave, jakarta, nunito } from "../lib/theme";
import { blinkAt, clamp, ease, easeInOut, loopSin } from "../lib/motion";
import { DotBg, SparkleBurst, SpeechBubble, hop } from "../lib/ui";
import { Phone } from "../lib/Phone";
import { Sparkle } from "../lib/shapes";

preloadMascots([POSE.stand, POSE.wave]);

/**
 * Showreel — mini brand story for the hero / "Výsledky".
 * 0–70   the mascot greets (whole-body hop + rock, ^^ eyes, "Ahoj! 👋", sparkle burst)
 * 30–150 the phone feed scrolls, result notifications stack up
 * 150–222 everything clears, the claim lands with the holo gradient, the mascot celebrates
 * 222–240 back to the opening state (seamless loop)
 * 1080×1350, 8 s.
 */
export const SHOWREEL_DUR = 240;
const DUR = SHOWREEL_DUR;

const PH = { x: 104, y: 214, w: 470, h: 940 };
const HOME = { x: 842, y: 1262 };
const CENTER = { x: 540, y: 1272 };
const MW = 330;
const MW_CLAIM = 330;

const NOTES = [
  { at: 58, title: "+1 248 sledujících", sub: "za poslední měsíc", icon: "follow", grad: "linear-gradient(135deg,#A5EDC5,#9AD8F8)" },
  { at: 88, title: "Engagement +42 %", sub: "oproti minulému měsíci", icon: "chart", grad: "linear-gradient(135deg,#9AD8F8,#C49CF2)" },
  { at: 118, title: "3 520 lajků", sub: "na posledním Reelu", icon: "heart", grad: "linear-gradient(135deg,#C49CF2,#F5B8DC)" },
];

const NoteIcon: React.FC<{ kind: string }> = ({ kind }) => (
  <svg viewBox="0 0 24 24" width={34} height={34}>
    {kind === "follow" ? (
      <>
        <circle cx="10" cy="8" r="4" fill={C.ink} />
        <path d="M3 21 C3 15.5 6 13 10 13 C14 13 17 15.5 17 21Z" fill={C.ink} />
        <path d="M19.5 6 V12 M16.5 9 H22.5" stroke={C.ink} strokeWidth="2.6" strokeLinecap="round" />
      </>
    ) : null}
    {kind === "chart" ? (
      <path d="M3 18 L9 12 L13 15 L21 6 M15 6 H21 V12" fill="none" stroke={C.ink} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    ) : null}
    {kind === "heart" ? (
      <path d="M12 21 C5 16 2 12.5 2 8.5 C2 5.5 4.5 3.2 7.3 3.2 C9.2 3.2 10.9 4.2 12 5.8 C13.1 4.2 14.8 3.2 16.7 3.2 C19.5 3.2 22 5.5 22 8.5 C22 12.5 19 16 12 21Z" fill={C.ink} />
    ) : null}
  </svg>
);

/** Square post art in brand gradients. */
const Media: React.FC<{ kind: number; size: number; frame: number }> = ({ kind, size, frame }) => {
  const bgs = [
    "linear-gradient(160deg,#FCE6F2,#F5B8DC 55%,#C49CF2)",
    "linear-gradient(160deg,#DDF8E8,#A5EDC5 45%,#9AD8F8)",
    "linear-gradient(160deg,#EDE2FB,#C49CF2 50%,#F5B8DC)",
    "linear-gradient(115deg,#A5EDC5,#9AD8F8 34%,#C49CF2 68%,#F5B8DC)",
  ];
  return (
    <div style={{ position: "relative", width: size, height: size, background: bgs[kind % 4], overflow: "hidden" }}>
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        {kind % 4 === 0 ? (
          <g transform="translate(100 118)">
            <ellipse cx="0" cy="44" rx="62" ry="13" fill="#fff" stroke={C.ink} strokeWidth="3.5" />
            <path d="M-44 4 C-42 46 -24 58 0 58 C24 58 42 46 44 4Z" fill="#fff" stroke={C.ink} strokeWidth="3.8" strokeLinejoin="round" />
            <path d="M42 14 C62 11 64 36 40 36" fill="none" stroke={C.ink} strokeWidth="3.8" strokeLinecap="round" />
            <ellipse cx="0" cy="4" rx="44" ry="11" fill="#E9CBA8" stroke={C.ink} strokeWidth="3.8" />
            <path d="M0 11 C-8 6 -13 3 -13 -1 C-13 -4 -10 -6 -7 -5 C-4 -5 -2 -3 0 -1 C2 -3 4 -5 7 -5 C10 -6 13 -4 13 -1 C13 3 8 6 0 11Z" fill="#fff" />
          </g>
        ) : null}
        {kind % 4 === 1 ? (
          <g>
            <circle cx="140" cy="62" r="20" fill="#fff" stroke={C.ink} strokeWidth="3.5" />
            <path d="M0 170 L62 96 L98 138 L124 112 L200 170 V200 H0Z" fill="#fff" stroke={C.ink} strokeWidth="3.5" strokeLinejoin="round" />
          </g>
        ) : null}
        {kind % 4 === 2 ? (
          <g transform={`translate(100 92) rotate(${(frame / DUR) * 90})`}>
            <path d="M0 -52 C6 -15 15 -6 52 0 C15 6 6 15 0 52 C-6 15 -15 6 -52 0 C-15 -6 -6 -15 0 -52Z" fill="#fff" stroke={C.ink} strokeWidth="4" strokeLinejoin="round" />
          </g>
        ) : null}
        {kind % 4 === 3 ? (
          <path d="M100 150 C66 126 50 108 50 88 C50 72 62 62 76 62 C86 62 95 68 100 76 C105 68 114 62 124 62 C138 62 150 72 150 88 C150 108 134 126 100 150Z" fill="#fff" stroke={C.ink} strokeWidth="4" strokeLinejoin="round" />
        ) : null}
      </svg>
      {kind % 4 === 2 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: size * 0.12,
            textAlign: "center",
            fontFamily: nunito,
            fontWeight: 900,
            fontSize: size * 0.085,
            color: C.ink,
          }}
        >
          Nová kolekce ✦
        </div>
      ) : null}
    </div>
  );
};

const Feed: React.FC<{ frame: number; w: number; h: number; fps: number }> = ({ frame, w, fps }) => {
  // thumb-like scroll: three flicks with pauses
  const scroll =
    interpolate(frame, [30, 56], [0, 360], { ...clamp, easing: Easing.bezier(0.3, 0, 0.1, 1) }) +
    interpolate(frame, [78, 104], [0, 340], { ...clamp, easing: Easing.bezier(0.3, 0, 0.1, 1) }) +
    interpolate(frame, [124, 150], [0, 360], { ...clamp, easing: Easing.bezier(0.3, 0, 0.1, 1) });
  const media = w;
  const like = spring({ frame: frame - 96, fps, config: { damping: 9, stiffness: 180, mass: 0.7 } });
  const likeOut = interpolate(frame, [112, 124], [0, 1], clamp);
  const posts = [
    { kind: 0, name: "kavarna.jiskra", likes: "2 418" },
    { kind: 1, name: "horske.chaty", likes: "1 906" },
    { kind: 2, name: "studio.lumen", likes: "3 520" },
    { kind: 3, name: "sparkee", likes: "4 102" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily: jakarta, color: C.ink }}>
      {/* scrolling content */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, translate: `0 ${-scroll}px` }}>
        {/* app bar + stories */}
        <div style={{ height: 62 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", height: 58 }}>
          <div style={{ fontFamily: nunito, fontWeight: 900, fontSize: 34, letterSpacing: -0.5 }}>sparkee</div>
          <div style={{ display: "flex", gap: 16 }}>
            {[0, 1].map((i) => (
              <svg key={i} viewBox="0 0 24 24" width={30} height={30}>
                {i === 0 ? (
                  <path d="M12 21 C5 16 2 12.5 2 8.5 C2 5.5 4.5 3.2 7.3 3.2 C9.2 3.2 10.9 4.2 12 5.8 C13.1 4.2 14.8 3.2 16.7 3.2 C19.5 3.2 22 5.5 22 8.5 C22 12.5 19 16 12 21Z" fill="none" stroke={C.ink} strokeWidth="2.2" />
                ) : (
                  <path d="M3 12 L21 4 L14 21 L11 13Z" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
                )}
              </svg>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, padding: "10px 18px 16px", borderBottom: "2px solid #EFECE4" }}>
          {["#A5EDC5", "#9AD8F8", "#C49CF2", "#F5B8DC", "#A5EDC5"].map((c, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 99,
                  padding: 4,
                  background: "linear-gradient(115deg,#A5EDC5,#9AD8F8 34%,#C49CF2 68%,#F5B8DC)",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ width: "100%", height: "100%", borderRadius: 99, border: "3px solid #fff", background: c, boxSizing: "border-box" }} />
              </div>
              <div style={{ width: 46, height: 8, borderRadius: 8, background: "#EFECE4" }} />
            </div>
          ))}
        </div>
        {posts.map((p, i) => (
          <div key={i} style={{ paddingBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
              <div style={{ width: 42, height: 42, borderRadius: 99, border: `2.5px solid ${C.ink}`, background: ["#A5EDC5", "#9AD8F8", "#C49CF2", "#F5B8DC"][i], boxSizing: "border-box" }} />
              <div style={{ fontWeight: 800, fontSize: 21 }}>{p.name}</div>
              <div style={{ marginLeft: "auto", fontWeight: 800, fontSize: 24, color: "#8A8E99" }}>···</div>
            </div>
            <div style={{ position: "relative" }}>
              <Media kind={p.kind} size={media} frame={frame} />
              {i === 1 && frame >= 96 && likeOut < 1 ? (
                <svg
                  viewBox="0 0 100 100"
                  width={170}
                  height={170}
                  style={{
                    position: "absolute",
                    left: media / 2 - 85,
                    top: media / 2 - 85,
                    scale: String(like * (1 + 0.3 * likeOut)),
                    opacity: 1 - likeOut,
                  }}
                >
                  <path d="M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C39 8 46 13 50 20 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88Z" fill="#fff" stroke={C.ink} strokeWidth="5" strokeLinejoin="round" />
                </svg>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: 18, padding: "14px 18px 6px" }}>
              {[0, 1, 2].map((k) => (
                <svg key={k} viewBox="0 0 24 24" width={32} height={32}>
                  {k === 0 ? (
                    <path d="M12 21 C5 16 2 12.5 2 8.5 C2 5.5 4.5 3.2 7.3 3.2 C9.2 3.2 10.9 4.2 12 5.8 C13.1 4.2 14.8 3.2 16.7 3.2 C19.5 3.2 22 5.5 22 8.5 C22 12.5 19 16 12 21Z" fill={i === 1 && frame >= 97 ? C.pink : "none"} stroke={C.ink} strokeWidth="2.2" />
                  ) : k === 1 ? (
                    <path d="M4 5 H20 A2 2 0 0 1 22 7 V15 A2 2 0 0 1 20 17 H10 L5 21 V17 H4 A2 2 0 0 1 2 15 V7 A2 2 0 0 1 4 5Z" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
                  ) : (
                    <path d="M3 12 L21 4 L14 21 L11 13Z" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
                  )}
                </svg>
              ))}
            </div>
            <div style={{ padding: "4px 18px 0", fontWeight: 800, fontSize: 19 }}>{p.likes} To se mi líbí</div>
            <div style={{ display: "flex", gap: 8, padding: "10px 18px 0" }}>
              <div style={{ width: 180, height: 10, borderRadius: 10, background: "#EFECE4" }} />
              <div style={{ width: 110, height: 10, borderRadius: 10, background: "#EFECE4" }} />
            </div>
          </div>
        ))}
      </div>
      {/* status bar (fixed) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 58,
          background: "rgba(255,255,255,.96)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 34px 0",
          boxSizing: "border-box",
          fontWeight: 800,
          fontSize: 20,
        }}
      >
        <span>9:41</span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ width: 22, height: 12, borderRadius: 3, border: `2px solid ${C.ink}`, display: "inline-block" }} />
        </span>
      </div>
    </div>
  );
};

export const Showreel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── mascot choreography ────────────────────────────────────────────────
  const fr = frame < 10 ? frame + DUR : frame; // return-hop landing wraps over the loop point
  let mx = HOME.x;
  let my = HOME.y;
  let lift = 0;
  let squash = 1 + loopSin(frame, DUR, 4) * 0.01;
  let width = MW;
  let spin = 0;
  const greet = hop(frame, 14, 28, HOME.x, HOME.x, 70);
  if (frame >= 10 && frame < 36) {
    lift = greet.lift;
    squash = greet.squash;
  }
  const toCenter = hop(frame, 152, 174, HOME.x, CENTER.x, 170);
  const celebrate = hop(frame, 196, 208, CENTER.x, CENTER.x, 60);
  const back = hop(fr, 224, 240, CENTER.x, HOME.x, 110);
  if (frame >= 148 && frame < 190) {
    mx = toCenter.x;
    lift = toCenter.lift;
    squash = toCenter.squash;
    spin = 360 * interpolate(toCenter.air, [0.1, 0.9], [0, 1], { ...clamp, easing: ease });
  }
  const sizeK = interpolate(frame, [152, 174, 224, 240], [0, 1, 1, 0], { ...clamp, easing: easeInOut });
  width = MW + (MW_CLAIM - MW) * sizeK;
  my = HOME.y + (CENTER.y - HOME.y) * sizeK;
  if (frame >= 174 && frame < 222) {
    mx = CENTER.x;
    if (frame >= 190) {
      lift = celebrate.lift;
      squash = celebrate.squash;
    }
  }
  if (fr >= 220) {
    mx = back.x;
    lift = back.lift;
    squash = back.squash;
  }
  const rockAmp = interpolate(frame, [26, 32, 58, 66], [0, 7, 7, 0], clamp);
  const rock = Math.sin(((frame - 26) / 20) * Math.PI * 2) * rockAmp;
  const rock2Amp = interpolate(frame, [206, 210, 218, 222], [0, 5, 5, 0], clamp);
  const lean = rock + Math.sin(((frame - 206) / 16) * Math.PI * 2) * rock2Amp;
  const happy = (frame >= 16 && frame < 74) || (frame >= 176 && frame < 226);
  const waving = frame >= 12 && frame < 70;
  const noteLook = NOTES.some((n) => frame >= n.at - 2 && frame < n.at + 24);
  const s = width / 264;

  // ── claim ──────────────────────────────────────────────────────────────
  const claimOut = interpolate(frame, [222, 234], [0, 1], { ...clamp, easing: ease });
  const words = [
    { t: "Dodáme", line: 0, at: 164 },
    { t: "jiskru", line: 0, at: 170, holo: true },
    { t: "vašim", line: 1, at: 178 },
    { t: "sociálním", line: 1, at: 183 },
    { t: "sítím", line: 2, at: 190 },
  ];
  const star = spring({ frame: frame - 198, fps, config: { damping: 9, stiffness: 160, mass: 0.8 } });
  const underline = interpolate(frame, [176, 196], [0, 1], { ...clamp, easing: ease });
  const pill = spring({ frame: frame - 158, fps, config: { damping: 12, stiffness: 180 } });

  // ── phone + notifications ──────────────────────────────────────────────
  const phoneOut = interpolate(frame, [148, 166], [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.75, 0) });
  const phoneIn = interpolate(frame, [222, 240], [0, 1], { ...clamp, easing: ease });
  const phoneVis = frame >= 222 ? phoneIn : 1 - phoneOut;
  const phoneDy = frame >= 222 ? 80 * (1 - phoneIn) : 120 * phoneOut;

  return (
    <AbsoluteFill style={{ fontFamily: jakarta, color: C.ink }}>
      <DotBg gap={34} />
      {/* soft holo blobs */}
      <div
        style={{
          position: "absolute",
          left: -160,
          top: 120,
          width: 760,
          height: 760,
          borderRadius: 999,
          background: "radial-gradient(closest-side, rgba(165,237,197,.45), rgba(165,237,197,0))",
          translate: `${loopSin(frame, DUR, 1) * 20}px 0`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 520,
          top: 560,
          width: 700,
          height: 700,
          borderRadius: 999,
          background: "radial-gradient(closest-side, rgba(196,156,242,.35), rgba(196,156,242,0))",
          translate: `0 ${loopSin(frame, DUR, 1, 1) * 20}px`,
        }}
      />

      {/* phone with feed */}
      {phoneVis > 0.001 ? (
        <Phone
          w={PH.w}
          h={PH.h}
          shadow={10}
          style={{
            left: PH.x,
            top: PH.y + phoneDy + loopSin(frame, DUR, 2) * 6,
            rotate: `${-3 + phoneOut * -4}deg`,
            opacity: phoneVis,
          }}
        >
          <Feed frame={frame >= 222 ? 0 : frame} w={PH.w - 2 * 9 * (PH.w / 216)} h={PH.h} fps={fps} />
        </Phone>
      ) : null}

      {/* stacked notifications */}
      {NOTES.map((n, i) => {
        if (frame < n.at) return null;
        const inP = spring({ frame: frame - n.at, fps, config: { damping: 13, stiffness: 170, mass: 0.8 } });
        const slot = NOTES.filter((m) => m.at > n.at).reduce(
          (acc, m) => acc + spring({ frame: frame - m.at, fps, config: { damping: 14, stiffness: 160 } }),
          0,
        );
        const out = interpolate(frame, [146 + (2 - i) * 3, 162 + (2 - i) * 3], [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.75, 0) });
        if (out >= 1) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 470,
              top: 252 + slot * 142,
              width: 574,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "20px 24px",
              boxSizing: "border-box",
              background: C.white,
              border: `3.5px solid ${C.ink}`,
              borderRadius: 30,
              boxShadow: `7px 7px 0 ${C.ink}`,
              translate: `${(1 - inP) * 260}px ${-out * 120}px`,
              opacity: Math.min(1, inP * 1.4) * (1 - out),
              rotate: `${(1 - inP) * 6}deg`,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                flexShrink: 0,
                borderRadius: 99,
                background: n.grad,
                border: `3px solid ${C.ink}`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <NoteIcon kind={n.icon} />
            </div>
            <div>
              <div style={{ fontFamily: nunito, fontWeight: 900, fontSize: 42, lineHeight: 1.05, letterSpacing: -0.5, whiteSpace: "nowrap" }}>
                {n.title}
              </div>
              <div style={{ fontWeight: 600, fontSize: 25, color: "#5A5F6E", marginTop: 4 }}>{n.sub}</div>
            </div>
          </div>
        );
      })}

      {/* claim */}
      {frame >= 156 ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 176,
            textAlign: "center",
            opacity: 1 - claimOut,
            translate: `0 ${-30 * claimOut}px`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 26px 12px 20px",
              borderRadius: 99,
              border: `3px solid ${C.ink}`,
              background: C.white,
              boxShadow: `5px 5px 0 ${C.ink}`,
              fontWeight: 700,
              fontSize: 30,
              scale: String(pill),
            }}
          >
            <Sparkle size={26} color={C.lavender} stroke={C.ink} /> Social Media with a Spark
          </div>
          <div style={{ marginTop: 40, fontFamily: nunito, fontWeight: 900, fontSize: 110, lineHeight: 1.04, letterSpacing: -2 }}>
            {[0, 1, 2].map((line) => (
              <div key={line} style={{ whiteSpace: "nowrap" }}>
                {words
                  .filter((w) => w.line === line)
                  .map((w) => {
                    const p = spring({ frame: frame - w.at, fps, config: { damping: 12, stiffness: 170, mass: 0.8 } });
                    return (
                      <span
                        key={w.t}
                        style={{
                          display: "inline-block",
                          position: "relative",
                          margin: "0 0.12em",
                          translate: `0 ${(1 - p) * 60}px`,
                          opacity: Math.min(1, p * 1.5),
                          scale: String(0.8 + 0.2 * p),
                        }}
                      >
                        {w.holo ? (
                          <>
                            <span
                              style={{
                                position: "absolute",
                                left: -6,
                                right: -6,
                                bottom: 10,
                                height: 30,
                                borderRadius: 99,
                                background: "linear-gradient(115deg,#A5EDC5,#9AD8F8 34%,#C49CF2 68%,#F5B8DC)",
                                transformOrigin: "0% 50%",
                                scale: `${underline} 1`,
                              }}
                            />
                            <span
                              style={{
                                position: "relative",
                                backgroundImage: "linear-gradient(115deg,#3FB985 0%,#3E9FD8 38%,#8B5FD9 70%,#D9679F 100%)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                color: "transparent",
                              }}
                            >
                              {w.t}
                            </span>
                          </>
                        ) : (
                          w.t
                        )}
                      </span>
                    );
                  })}
                {line === 2 ? (
                  <span style={{ display: "inline-block", width: 96, height: 96, marginLeft: 10, verticalAlign: "-0.05em" }}>
                    <Sparkle
                      size={96}
                      color={C.lavender}
                      stroke={C.ink}
                      style={{ scale: String(star), rotate: `${(1 - star) * -120 + loopSin(frame, DUR, 2) * 6}deg` }}
                    />
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <SparkleBurst frame={frame} start={26} x={HOME.x - 30} y={HOME.y - 330} radius={200} rays={10} stars={6} strokeWidth={7} />
      <SparkleBurst frame={frame} start={200} x={CENTER.x - 16} y={CENTER.y - 330} radius={200} rays={12} stars={7} strokeWidth={7} seed={0.3} />

      <MascotAt
        src={waving ? POSE.wave : POSE.stand}
        x={mx}
        y={my}
        width={width}
        bob={lift / s}
        squash={squash}
        spin={spin}
        lean={lean}
        happy={happy}
        mouthScale={happy ? 1.3 : 1}
        lookX={noteLook ? -10 : 0}
        lookY={noteLook ? -8 : 0}
        blink={blinkAt(frame, [96, 140])}
        headTilt={loopSin(frame, DUR, 2, 0.4) * 2}
        flameWiggle={loopSin(frame, DUR, 10) * 6}
        parts={waving ? foreWave(Math.sin(((frame - 14) / 12) * Math.PI * 2) * 22 * interpolate(frame, [12, 20, 58, 68], [0, 1, 1, 0], clamp)) : undefined}
      />

      <SpeechBubble frame={frame} fps={fps} start={18} end={76} x={HOME.x - 150} y={HOME.y - 470} text="Ahoj! 👋" size={50} side="left" />
    </AbsoluteFill>
  );
};
