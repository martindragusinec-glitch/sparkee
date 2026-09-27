# Sparkee za 20 vteřin – v2 (plynulá verze) – finální pohybový scénář

## Shrnutí
VERDICT: Director B ("One take, one spark, one Sparkee") is the backbone, with Director A's motion systems added to it. It fits the feedback "víc plynule a navazující, maskot skáče" better on every axis except spectacle.

Scores (1–5):
- Smoothness: A 2, B 4. A moves the world 110–150 cqw per 0.8 s leg, which peaks around 6 cqw per frame. Without motion blur those whip-pans strobe, and the zoom breath and roll make it worse.
- Clarity of the six lines: A 3, B 5. B keeps the captions in a screen-space rail that never travels. A's headlines leave with fast pans.
- Mascot charm: A 4, B 4. A has set-pieces (line ride, flip, dive into ✦). B has gestural acting: throw, slam, poke, thumb-stop, rotate phone, grab-and-whip.
- Answers "maskot skáče": A 2 (about 10 leaps, hops and a flip), B 5 (glides and floats, exactly one hop).
- 60 fps feasibility: A 2, B 4. A needs a 568-cqw world canvas with a world-space sky and three parallax depths. B uses one stage and one camera.
- Seamless loop: A 4, B 5.

TAKEN FROM A:
- A pure pose function with time-offset secondary motion (eyes lead, arms and flame trail) instead of springs, so every frame can be seeked exactly.
- A monotone-Hermite (C1) camera spline.
- Loop-safety fixes to the current code: twinkle scale uses sin(2.1t), which is 6.68 cycles in 20 s, so switch to ω = 2π·7/20. Twinkle rotation 24°/s becomes 22.5°/s. All idle periods complete whole cycles in 20 s.
- Comet trails.
- The world reacts when the mascot arrives (orbit punch).
- Move the "ilustrativní data" label.
- Realign chapters to the new beat starts.

FIXED IN B:
1. **Camera zoom.** The world camera is capped at z 1.00–1.08. The 1.25 bookend is a dolly on the small hero group only, so the vector mascot stays crisp and nothing outside the world rect is shown.
2. **Camera recentre.** B recentred the camera on the dashboard at 13.9 s, which would push the KPI column off-frame. Removed.
3. **Phone becoming the dashboard.** clip-path cannot grow the phone into the bigger landscape card, so the dashboard takes over with its own clip.
4. **Tile becoming the phone.** This uses translate plus clip, so it still works on mobile, where the hero tile lies outside the phone rect.
5. **Hit-stops and camera shake removed.** For a client already complaining about choppiness they read as dropped frames. Single pulses replace them.
6. **"Clap" is a both-paw slam.** The rig's arms can't meet in front of the body.
7. **Rig tap channel.** It moves only the right thumb, so left-paw presses are arm pulses.
8. **CTA timing.** Visible 18.15–19.45 s instead of about 1 s.
9. **Reduced-motion and End-key frame moves to 18.72 s.** At 19.4 s the claim is now mid roll-out.
10. **Mobile layout.** The mobile phone and dashboard are resized so the rotated phone fits inside the card and the paw can reach the screen.

FILES TO EDIT:
- /Users/martinwork/Downloads/lp-tracking-standard/sparkee-web/assets/js/story.js
- /Users/martinwork/Downloads/lp-tracking-standard/sparkee-web/assets/css/story.css
- /Users/martinwork/Downloads/lp-tracking-standard/sparkee-web/index.html (the STORY block, plus script order: story.js must load after mascot-rig.js and mascot.js)
- /Users/martinwork/Downloads/lp-tracking-standard/sparkee-web/assets/js/mascot.js (headless story API)
- /Users/martinwork/Downloads/lp-tracking-standard/sparkee-web/assets/js/mascot-rig.js (unchanged)

## Scénář
# SPARKEE ZA 20 VTEŘIN · v3 "One take, one spark, one Sparkee": final motion script

**Principle.**
- One camera and no cuts.
- One live rig mascot, on screen for the full 20 s. He never teleports and there are no pose-image swaps.
- Every scene change is caused by something Sparkee does to an object.
- The six lines sit in one screen-space caption rail and never move with the camera.
- The loop closes on a held bookend frame: t=20 ≡ t=0.

**The copy is unchanged:**
1. "Ahoj, tady Sparkee"
2. "Sociální sítě bez systému = chaos."
3. "…tak do toho dáme systém." (calendar + 4 services)
4. "Obsah, který zastaví scroll."
5. "Měřitelný posun, ne pocity."
6. "Dodáme jiskru vašim sociálním sítím ✦" + CTA "Chci jiskru"

**The baton chain:**
- The spark is thrown and bursts into the notification swarm and the light world.
- A slam turns the swarm into the calendar tiles.
- A poke unfolds one Reel tile into the phone.
- A thumb stops the feed, and a double-tap sends hearts up.
- The hearts dive into the chart bars; the comments become the KPI pills.
- The line's end dot is grabbed and becomes the spark again.
- The light world implodes into the spark, and the line flies up to underline "jiskru".

---
## 1. CONVENTIONS

### 1.1 Coordinates
- World = the existing stage. Desktop D is 100 × 56.25 cqw; mobile M (≤720 px) is 100 × 125 cqw. Mobile values are given in [brackets].
- ≈ marks a nominal value. The real value is solved once at build/applyLayout time from rig and DOM geometry, never per frame.
- "rank" means an index normalized 0…1 by sorting, so it does not depend on layout.

### 1.2 Layer stack inside .st__stage (back to front)
1. **.st-bg** – screen-space dark base (existing gradients). It never moves, so framing outside the 0–100 world can never show a seam.
2. **.st-par** – parallax layer holding 7 dark-sky ✦ twinkles at the existing L.tw positions. Its transform is 50 % of (camera ∘ dolly): z_p = 1 + .5(z·z_b − 1) about the same anchor, and half the translation.
3. **.st-cam** – world camera.
   - transform-origin 0 0; transform: translate(50 − z·cx, Hc − z·cy) scale(z), with Hc = 28.125 [62.5].
   - z is always in 1.00–1.08. will-change: transform.
   - Children in z-order:
     1. .st-plate A and B (paper world)
     2. burst, rings, 14 PTS
     3. calendar (z3)
     4. tiles and back-side swarm items (z4)
     5. phone and dashboard (z4)
     6. .st-hero (z5)
     7. front-side swarm items, chips, comments, KPI pills, badge, '!' tag (z6)
     8. hearts (z9)
4. **.st-hero** (inside .st-cam) – dolly group holding mglow, the mascot wrapper, sglow, spark and 8 trail particles.
   - transform-origin 0 0; transform = translate + uniform scale z_b in [1, 1.25] about the head point.
   - No will-change, so the vector mascot re-rasters crisply. The group is small.
   - Spark z-index flips behind the mascot on the back half of the halo orbit.
5. **.st-rail** – screen-space captions t1–t6 (z8).
6. **svg.st-over** – screen-space overlay, viewBox 0 0 100 H, holding the flying growth-line clone that becomes the "jiskru" swoosh.
7. **.st-cta** – stays outside the aria-hidden stage (existing), in screen space. Hover and focus hold playback (existing).

**REMOVE:**
- .st-light and .st-dark clip-path irises, and the IR iris rings used as wipes
- the .st-m &lt;img data-pose&gt; set, .st-m__hop and .st-m__bob
- the hop(), pose() and iris() helpers
- the block-fade txtOut

### 1.3 Mascot placement and units
- **Rig SVG.** One inline rig SVG, cloned from the hero svg.mascot with ids prefixed "stm-". viewBox 374 39 264 427; feet anchor FEET = (504, 446).
- **Unit.** U = 34/442 = .07692 [60/442 = .13575] cqw per rig unit at scale 1. The mascot uses one fixed uniform scale S = .74 [.60] for the whole piece.
  - 1 rig unit = .0569 [.0814] cqw; 1 cqw = 17.57 [12.28] rig units.
  - Figure from flame tip to feet ≈ 23.2 [33.2] cqw tall and ≈ 15 [21.5] cqw wide.
- **Wrapper .st-mascot.**
  - CSS box 264U × 427U cqw, margin-left −130U, margin-top −407U, transform-origin (130U, 407U).
  - TL writes translate(feetX, groundY) scale(S).
  - The wrapper only moves along the ground and never rotates. That keeps the rig's ground shadow flat.
- **Vertical offsets.** Bob, crouch, hover, float and the hop go into the rig channel y (rig units). The rig's own shadow therefore stays on the floor and shrinks with altitude.
- **Landmarks (sanity values only; always query the rig at build).** Offsets are rig units from FEET:
  - L paw tip: out (−84, −108), offer (−83, −113), cheer (−79, −125), lowOut (−80, −88)
  - head centre (−14, −201); flame base (1, −316); flame tip (1, −404)
  - In cqw, desktop: out (−4.78, −6.15), offer (−4.71, −6.42), cheer (−4.50, −7.11)
  - In cqw, mobile: out (−6.84, −8.80), offer (−6.74, −9.19), cheer (−6.43, −10.18)
- **Facing.** Sparkee faces screen-left for the whole piece.
  - All content sits on his left, and his L arm (screen-left) makes every contact.
  - His R paw keeps his own mini phone all 20 s.
  - Never mirror him.

### 1.4 Pose model (pure, seekable)
P(t) = idle·w_idle + authored kf tracks + action layers.
- Action layers are the rig's actions.wave and actions.hop called as pure functions of local time, crossfaded by ramp weights.
- No springs, no RNG and no rig scheduler. The same t always gives the same frame, for scrubbing, ?story=x and chapter jumps.

**Secondary motion by time-offset sampling (A):**
- **Eyes.** eyeX/Y = gaze(look(t + .06)). Head hr/hx/hy come from gaze(look(t)), so the eyes lead the head by .06 s.
- **Lean.** Sampled at t − .05 for turns only. Contact poses use the exact t.
- **Arm follow-through.** La += clamp(−vy(t − .08)·.045, ±20); Ra += .45 of that; Lb −= .25 of it. vy is the vertical velocity of rig y plus wrapper y, in rig units/s, by finite difference.
- **Flame.**
  - flameRot = clamp(−hr·.55 − vxHead(t−.10)·.06 − vaHead(t−.10)·.05, ±16).
  - flameDx = clamp(−vx(t−.12)·.012, ±4); flameDy = clamp(−vy(t−.12)·.012, ±6).
  - Head velocity includes wrapper travel, so the flame streams back on glides.
- **Contacts.** Poke, press, catch, grab and paw-on-screen are authored at exact t. w_idle ramps to 0 over .15 s, so the paw lands exactly.

**Idle** (weight w_idle; every period divides 20 s):
- rig y bob −.35 cqw·(1 − cos 2πt/2.5)/2
- lean 1.2·sin(2πt/5)
- hr 1.0·sin(2πt/4 + 1)
- La += 2.4·sin(2πt/2.5); Lb += 3·sin(2πt/2.5 − .8); Ra += .8·sin(2πt/5 + 2)
- phoneRot 1.5·sin(2πt/5)
- mini-phone heart "lub-dub" with period 2.5 s. The hero rig uses 2.6 s, which does not divide 20 s.

**Blinks** (fixed list, rig blinkCurve .2 s):
- 0.50, 3.40, 3.64, 4.90, 6.32, 8.10, 9.47, 10.27, 11.05, 15.40, 16.82, 18.77, 19.72
- Held squints: 2.40–2.62 (.35), 4.35 (.6 for .15 s), 14.72 (.9 for .15 s).

### 1.5 Motion grammar
- **GLIDE** (ground relocation):
  - feetX eases with io3.
  - Hover lift: rig y −.8 [−1.2] cqw over the first 25 %, set-down over the last 25 %. Without it the glide looks like skating.
  - Lean ∓ peak mid-glide, starting .08 s before x moves.
  - Arrival overshoot: lean −30 % of peak, then spring to 0 over .4 s. Arms trail through the follow-through term.
- **FLOAT** (vertical; he is a spark creature): rig y io3 or data-driven. The shadow shrinks automatically; flame 1.15–1.2.
- **CONTACT:**
  - Anticipation .08–.15 s (the 'cock' pose or an a1 dip).
  - Strike in ≤ .08 s, out3. Hold.
  - Release with recoil.
- **ONE hop only,** at 13.20. Crouch, duck and dodge are rig y translation plus lean.
- **Brand rule.** Never squash, never non-uniform scale any mascot part, never mirror. His apparent size changes only through the hero dolly.
- **No hit-stops, no oscillating shake.** Impacts are single pulses plus a ring or particles.
- **Easings** are the E set in story.js: lin in2 out2 io2 in3 out3 io3 outX back back2 flick spring.

### 1.6 Arm presets
Side-local polar: a1 = upper-arm angle (+ = down), b = elbow bend (− = forearm up). Blend a1, b, l1, l2 linearly.

| Preset | a1 | b | Use |
|---|---|---|---|
| rest | 30.3 | 0 | |
| down | 55 | 8.4 | |
| out | 4.8 | −9.7 | |
| wave | 5 | −37.5 | |
| cheer | −2.6 | −36.1 | |
| hold | 20 | −46.6 | R arm with phone |
| **offer** (new) | 8 | −28 | palm-up under the spark |
| **lowOut** (new) | 30 | −10 | slam |
| **cock** (new) | 35 | −75 | drawn back before a poke |
| **present** (new) | −2 | −14 | reaching toward the CTA |
| **yayL / yayR** (new) | −4 / 8 | −40 / −48 | from the rig's jump |

Bone lengths come only from presets, 22–26.1 rig units. Never stretch.

### 1.7 Loop safety
- Every periodic term completes a whole number of cycles in 20 s.
- The rig flicker frequencies are already integer-cycle: 1.1, 2.7, 5.3, 1.9, 4.3, 3.1, 6.7 and 2.2 Hz. Always pass t mod 20.
- Offset sampling wraps mod 20.
- **Fix in the current code:** twinkle s uses sin(2.1t + ph); change it to sin(2π·7t/20 + ph). Twinkle r is 24°/s; change it to 22.5°/s (450° ≡ 0 for a 4-point ✦).

### 1.8 Frame budget (60 fps)
**Per frame:**
- TL.render (writes only changed values)
- transforms on .st-cam, .st-par and .st-hero
- rig renderPose: ≤ 4 arm path d writes (ink + fill), 2 gradient updates and about 12 transform attributes

**Rules:**
- Clip-path only in these windows: chips 8.15–8.85, phone 10.35–11.10, dashboard 14.95–15.15, KPI pills 14.90–15.30.
- The light plate is transform-only.
- No layout reads in the frame loop. All rects, the chart LUT and contact points are measured in applyLayout/build.

**Target:** ≤ 8 ms script+style per frame at 4× CPU throttle, and paint flashing shows no full-stage repaint outside the clip windows.

---
## 2. STATIONS (mascot feet; ground y; float = rig y lift)

| Station | Desktop | Mobile |
|---|---|---|
| H home | (82, 51.5) | (72, 121) |
| C chaos | (66, 50.5) | (50, 116) |
| R poke (float) | solve pawTip(out) = hero-cell centre ≈ (77.9, 48.9), float 2.6 | ≈ (64.1, 112.5), float 8.5 |
| After pull | H | ≈ (55, 121), L paw on the phone's bottom-right edge |
| H5 | (87, 51.5) | (86, 121) |
| P lift (float) | solve pawTip(offer) = chart end dot ≈ (80.8, 36.4), float 15.1 | ≈ (74.8, 88.3), float 32.7 (about one body height) |

---
## 3. CAMERA

### 3.1 World camera .st-cam
- Monotone cubic Hermite (Fritsch–Carlson) per channel (z, cx, cy) through the keys below. Slope is 0 at t=0 and t=20; equal neighbouring keys give holds.
- An anchored zoom keeps anchor A where it already is on screen (sA): cx = A.x − (sA.x − 50)/z and cy = A.y − (sA.y − Hc)/z. Measure A from real rects at build.

| t | z | D cx, cy | M cx, cy | Purpose |
|---|---|---|---|---|
| 0.00 | 1.00 | 50, 28.125 | 50, 62.5 | identity; the dolly does the bookend |
| 2.50 | 1.00 | 50, 28.125 | 50, 62.5 | |
| 2.95 | 1.00 | 48.5, 28.125 | 49, 61.5 | lead the throw toward the burst |
| 3.30 | 1.00 | 48.5, 28.125 | 49, 61.5 | |
| 6.80 | 1.045 | 48.22, 28.13 | 49.04, 60.57 | tension push anchored at the rail edge D (42, 28.1) / M (50, 40), so world objects never slide into the captions |
| 7.60 | 1.00 | 50, 28.125 | 50, 62.5 | release |
| 8.20 | 1.00 | 50, 28.125 | 50, 62.5 | |
| 10.20 | 1.02 | 50.45, 28.41 | 50.14, 63.31 | creep toward the hero cell D (73.1, 42.7) / M (57.3, 103.7) |
| 10.90 | 1.08 | 51.24, 28.08 | 48.59, 63.48 | dive with the unfolding phone; anchor = phone centre D (66.75, 27.45) / M (31, 75.7) |
| 11.60 | 1.03 | 50.49, 28.11 | 49.45, 62.88 | settle |
| 12.20 | 1.03 | 50.49, 28.11 | 49.45, 62.88 | |
| 13.90 | 1.00 | 50, 28.125 | 50, 62.5 | |
| 15.30 | 1.00 | 50, 28.125 | 50, 62.5 | |
| 16.80 | 1.02 | 50.60, 27.17 | 50.56, 61.09 | tilt up with the rising mascot; anchor his head at P; world moves down .9 [1.5] |
| 17.40 | 1.06 | 51.48, 28.23 | 51.25, 63.15 | suck-in toward the spark during the implosion |
| 18.20 | 1.00 | 50, 28.125 | 50, 62.5 | release |
| 20.00 | 1.00 | 50, 28.125 | 50, 62.5 | |

**Additive pulses** (0 outside their windows; one direction only, never a shake):
- 2.92: z +.012 (.08 s out2 up, .30 s spring back)
- 6.80: z +.008 (.06 s / .30 s)
- 12.00: cy −.2 (.06 s / .15 s spring)

### 3.2 Hero dolly .st-hero (bookend)
Uniform z_b about the head point h = the head centre at H, ≈ D (81.2, 40.1) / M (70.9, 104.6). Transform = translate(s_h − z_b·h) scale(z_b), where s_h moves with the same progress as z_b.

| t | z_b | Head on screen, D / M |
|---|---|---|
| 0.00 | 1.25 | (72, 34) / (58, 70) |
| 0.60 | 1.25 | same (hold) |
| 2.50 | 1.00 | at its own world position |
| 18.20 | 1.00 | own |
| 19.25 | 1.04 | own (head stays fixed) |
| 20.00 | 1.25 | (72, 34) / (58, 70), zero velocity; matches the 0–0.60 hold |

Only the mascot, spark and glows are visible during the dolly, and the background is screen-space. The result looks like a real camera push-in while the world raster stays at z ≤ 1.08.

---
## 4. MASCOT ACTION SHEET

Coordinates are desktop, with mobile in brackets. Each entry covers five channels:
- **Body:** feetX / rig y / lean / rot
- **L arm**
- **R arm + mini phone**
- **Face:** look / happy / mouth / cheek / blinks
- **Flame / glow / shadow**

A channel that is not mentioned holds its previous value.

**0.00–0.55 · Bookend hold**
- Body: at H, idle.
- L arm: offer. The spark hovers 3.0 [3.5] cqw above the paw.
- R arm: hold.
- Face: look (−.5, −.4) at the spark. At 0.42, lookY → −.6. Blink at 0.50.
- Flame 1.0, mglow .45, shadow 0.

**0.55–0.90 · Spark to flame**
- Body: H. L arm: offer. R arm: hold.
- Face:
  - 0.55: look (.1, −1), following the spark up to the flame.
  - 0.62: look (0, 0), to camera.
  - 0.70: happy 0→1 (.22 s io2), mouth 1→1.28, cheek 1→1.14, hr +4 (.3 s).
- Flame and glow:
  - 0.62 (spark touches the flame): flame 1→1.25 (.15 s out2), easing to 1.08 by 1.00.
  - mglow .45→1 (.6 s out3).

**0.90–2.05 · WAVE hello**
- Body: H.
- L arm: rig actions.wave with local t = t − 0.90. Layer weight in over .10 s, out over .20 s from 1.85.
- R arm: hold (the wave action lowers it by 7°).
- Face: happy 1, to camera.

**2.05–2.30 · Catch**
- L arm: wave → offer (.20 s io2).
- 2.30 CATCH: a1 +6 (.08 s out2), then back (.30 s spring). The paw dips about .4 cqw to show weight.
- Face: happy 1→0 over 2.10–2.30; look (−.4, −.6) at the incoming spark.

**2.35–2.60 · Wind-up**
- Body: lean 0→+9 (io2), away from the throw.
- L arm: offer → cheer (io2); the spark rides the paw.
- Face: squint .35 from 2.40 to 2.62; look (−.8, −.5).

**2.60–2.72 · RELEASE at 2.60**
- Body: lean +9 → −11 (.14 s out2), then −3 (.45 s spring).
- L arm: cheer → out (.09 s out3).
- Face: look (−1, −.3) tracking the spark; head follows .06 s later.
- Flame whips right through its lag.

**2.72–3.45 · GLIDE H→C**
- Body: glide (io3), lean −8 (curious, toward the burst).
- L arm: out → rest, trailing.
- Face: eyes wide, look (−.6, −.5).
- mglow 1→0 over 2.95–3.35; shadow 0→1 over 3.15–3.45.

**3.30–3.80 · SURPRISED TAKE**
- Body: lean −8 → +12 (.10 s out2), then +2 (.50 s spring).
- L arm: → cheer, hands up (.12 s out2).
- R arm: → yayR (.12 s), phoneRot +12.
- Face: mouth .7; blinks at 3.40 and 3.64.
- Flame 1.3, flicker amplitude ×1.6 over 3.30–4.30.

**3.80–4.40 · Nervous**
- Body: at C, w_idle .6.
- L arm: cheer → rest (.5 s io2) with flinches a1 −8 at 3.95 and 4.20 (.10 s each).
- R arm: yayR → hold (.5 s).
- Face: saccades to the front-most swarm item, targets sampled from the item paths at 3.60, 4.00, 4.60, 5.20 and 5.80 (.10 s io2 moves). The head follows .06 s later with hr ±7.

**4.35–4.70 · DODGE**
- Body: lean +8, rig y +.6 cqw (.10 s out2), then back (.35 s spring).
- L arm: guard, a1 −6.
- Face: squint .6.

**4.90** · Blink.

**5.45–5.80 · Mirrored dodge**
- Body: lean −8, rig y +.6 cqw.

**6.30–6.45 · Still beat**
- Body: w_idle .3. L arm: rest. R arm: hold.
- Face: look (0, 0), to camera; blink 6.32.

**6.45–6.75 · Wind-up**
- Body: rig y +.8 cqw (io2), lean +6.
- L arm: → cheer. R arm: → yayR.
- Face: determined, to camera. Flame .9.

**6.80–7.00 · SLAM at 6.80**
- Body: rig y +.8 → 0 (.35 s spring); lean +6 → −4 (.08 s), then 0 (.40 s spring).
- L arm: cheer → lowOut (.07 s out3).
- R arm: yayR → hold, lowered (a1 +10).
- Face: 6.95 look at the calendar (−.6, −.3).
- Flame 1.2 (arrives through the .1 s lag).

**7.00–7.60 · GLIDE C→H backwards**
- Body: glide (io3), lean +6; on arrival lean −3 → 0 (.35 s spring).
- L arm: lowOut → rest (trailing); at 7.50 → offer, presenting the calendar.
- Face: eyes stay on the calendar (−.8, −.2) while the body travels, with the head lagging. 7.55: happy → 1 (.2 s), mouth 1.25, cheek 1.12.

**7.60–8.45 · Nods**
- Body: H, idle.
- L arm: offer → rest at 8.20.
- Face: nods hr +2.5 → 0 at 7.65 and 7.85 (.15 s each), in time with tile landings. Blink 8.10. Happy → 0 at 8.30.

**8.45–8.95 · Badge toss**
- L arm:
  - 8.45: the badge pops at the paw.
  - 8.50: dip, a1 +8 (.08 s).
  - 8.58: → cheer (.12 s out3).
  - 8.62: RELEASE.
- Face: look up-left (−.5, −.9), then follow the arc.

**8.95–9.45**
- L arm: cheer → rest (.4 s io2).
- Face: happy → 1; double nod hr +3 → 0 over 8.95–9.40.

**9.45–9.75 · Finds the hero cell**
- Face: look at the hero cell (−.7, .5), head .06 s later. Blink 9.47. Happy → 0.

**9.75–10.20 · FLOAT-REACH**
- Body: feetX H → R and rig y float (io3); lean −8.
- L arm: rest → out by 10.05; → cock over 10.12–10.22.
- Face: locked on the cell. Flame 1.15.

**10.25 · POKE**
- L arm: cock → out (.08 s out3); pawTip = cell centre.
- Face: blink 10.27 hides the tile lift.

**10.35–10.85 · Pull**
- Desktop:
  - The L paw is pinned to the unfolding phone's bottom-right corner; the feet follow in x and float → 0 (in2).
  - 10.70: lets go, recoil lean +6 (.35 s spring), arm → rest (.25 s).
  - 10.85: lands at H.
- Mobile: contact is kept to the end, finishing at ≈ (55, 121).
- Face: look at the phone.

**10.85–11.25**
- Body: idle. L arm: rest.
- Face: look at the phone (−.6, −.2); blink 11.05.

**11.25–11.40 · Paw to screen**
- Body: w_idle → 0.
- L arm: pawTip → the screen's lower-right, phone-local (.9w, .92h) (.15 s io2), with an a1 +8 dip.

**11.40–11.55 · FLICK**
- Body: lean −3 → +4, following the gesture.
- L arm: → cheer (.12 s out3); the paw sweeps up the screen edge.
- Face: eyes whip up (lookY −.8), then track the feed.

**12.00 · THUMB-STOP**
- Body: lean −5 (.06 s), then −2 (.3 s).
- L arm: pawTip → the Reel stop point (measured at build) (.06 s in2), and holds.
- Face: locked on the Reel (−.7, −.1).

**12.30 · Tap play**
- L arm: a1 +4 pulse (.08 s).

**12.88 and 13.00 · Double-tap**
- L arm: two a1 +4 pulses (.07 s each).

**13.02–14.00 · THE ONE HOP**
- Body: rig actions.hop with local t = t − 13.02. Crouch, take-off at 13.20, land at 13.60, settle by 14.00. Apex ≈ 1.5 cqw.
- Arms: the hop's own arms; the R phone is raised.
- Face: happy → 1, cheek 1.2, mouth 1.32 over 13.02–13.95. Flame 1.15.

**13.60–13.90**
- Face: watches the counter (−.6, .3).

**13.90–14.00**
- Face: glances at his own phone (.9, .75), hr −1.2.

**14.00–14.45 [M 13.95–14.50] · Backstep GLIDE → H5**
- Body: lean +5.
- R arm: hold → out, presenting the mini phone.
- Face: look at the mini phone.

**14.45–15.10 · Phone rotation and DUCK**
- R arm: out; phoneRot 0 → +8 (14.45, .10 s io2) → −90 (14.55–15.00 io3) → −96 (15.02) → −90 (15.10 spring).
- Body, 14.72 DUCK (the big phone's corner swings past): rig y +.8 cqw, lean +10 (.10 s out2); back up at 15.00 (.30 s spring).
- Face: squint .9 at 14.72 (.15 s); 15.10 look at the dashboard (−.8, −.1).

**15.10–15.45**
- R arm: out → hold; phoneRot −90 → 0 (15.15–15.55 io2).
- Face: blink 15.40.

**15.45–16.70 · LIFT**
- Body:
  - rig y = float × normalized progress of the line head's y, sampled at t − .10.
  - feetX H5 → P over 16.20–16.70 (io2); lean −4.
- L arm: rest → out (15.90) → cheer (16.45) → offer (16.62, io2), solved so pawTip = end dot at 16.70.
- Face: eyes track the line head (look −1 → −.3).
- Flame 1.2; shadow shrinks automatically.

**16.80 · GRAB**
- L arm: b −10 → −30 → −10 (.08 s).
- Face: blink 16.82 hides the dot → spark swap.

**16.95–17.25 · WHIP**
- Body: lean +8 (.06 s) → −6 (.12 s) → 0 (.45 s spring).
- L arm: cheer → out (.15 s out3); the spark stays on the paw.
- Face: look at the line flight (−1, −.4).

**17.25–17.90 · FLOAT DOWN P→H**
- Body: io3; landing dip at 17.90, rig y +.3 cqw (.35 s spring).
- L arm: offer, spark on the paw.
- Face: look toward the claim (−1, −.2).
- mglow 0→1 over 17.30–17.80; shadow 1→0 over 17.20–17.50.

**18.00–18.15**
- Face: 18.00 to camera; 18.05 happy → 1 (.2 s), cheek 1.14, mouth 1.28.

**18.15–18.70 · PRESENT**
- Body: lean −2.
- L arm: → present, toward the CTA (.25 s io2), held.
- Face: 18.12 look at the CTA (−1, −.1), head .06 s later.

**18.75–19.25 · WAVE**
- L arm: rig actions.wave with local t = t − 18.75; in over .10 s, out over .20 s from 19.05. The spark on the paw leaves a sparkler trail.
- Face: to camera; blink 18.77; happy 1. Flame 1.1.

**19.25–19.55**
- L arm: wave → offer (.25 s io2).
- Face: 19.50 look (−.5, −.4) at the spark.

**19.55–20.00**
- Body: H, w_idle 1.
- L arm: offer; the spark lifts off.
- Face: blink 19.72 hides happy 1 → 0.
- Flame → 1.0; mglow → .45 over 19.40–19.90.

---
## 5. ELEMENT TIMING (world objects, desktop [mobile])

### BEAT 1 · Ahoj (0–2.92)

**Spark ✦**
- **0–0.55 hover:** pos = pawTip(L) + (0, −3.0 [−3.5]); s = .35 + .04·sin(2πt); r = 8·sin(2πt/2.5).
- **0.35–0.55 anticipation:** pulse amplitude .04 → .07.
- **0.55–0.85:** flare s .35 → .5 (back2, .3 s) while it arcs to flameTip() with apex −3 (x out2, y parabola). Contact at 0.62.
- **0.85–0.95:** slides onto the halo ellipse at its front-right point (io2).
- **0.95–2.15 halo orbit:**
  - Centre = flame base: rig (505, 130) mapped to world ≈ (82.1, 33.2) [(72.1, 94.8)].
  - rx 8.5 [12], ry 2.5 [3.5], tilt −12°.
  - θ −30° → 330° (io2); s .5 → .38.
  - Drawn behind the mascot while sinθ < 0.
  - Trail: 5 particles, one every .08 s, life .4 s.
- **2.15–2.30:** drops to pawTip + (0, −1.2) (in2). Attached until 2.60.
- **2.60–2.92 THROW** to burst point B (50, 24) [(46, 56)]:
  - x out2; y parabola with apex at y 20 [50].
  - r +360; s .38 → .28.
  - Trail: 6 particles, one every .05 s, life .35 s.
- **2.92 BURST:** s .28 → 2.2, r +140 (outX .5 s); o → 0 over 2.96–3.12. Hidden until 16.80.

**Pure trail formula.** Particle k shows the spark position at τk = t0 + dt·(n − k), with n = floor((t − t0)/dt). It fades o and s over its life.

**sglow**
- 0–0.62: follows the spark, s .5, o .55.
- 0.62–0.90: s 1.2, o .9 (.15 s), then s .8, o .6.
- At B (existing burst values): 2.92 s .6 → 1.6, o 1 (.25 s out2), then s 2.4, o 0 (.6 s out2).

**Other**
- **st-burst** at B: s 0 → 1, o 1 (.45 s outX); o → 0 over 3.40–4.40 (io2).
- **2 rings** at B, starting 2.92 and 3.04: s .05 → 1 / 1.5 (.85 s outX); o 1 → 0 (.6 s out2).
- **14 PTS:** the existing radial burst function with t0 = 2.93.
- **Dark twinkles** (.st-par), 0–20: loop-safe functions (§1.7).

### BEAT 2 · Chaos (2.92–6.80)

**Light plate A** (bloom centre B, radius Rc 86 [108])
- .st-plate is a 2Rc circle with border-radius 50 %, overflow hidden and transform scale(k).
- .st-plate__in is counter-scaled 1/k about the same centre, so the paper sits at identity with 8 cqw bleed. It holds the paper, the existing light blobs, the dot grid and the light-world twinkles.
- will-change on both. k = r/Rc, clamped ≥ .002; visibility hidden when r < .05.
- **2.94–3.50:** r 0 → Rc (outX).
- **Edge ring** (existing .st-iring style): s ∝ r; o 1 from 2.96, → 0 over 3.25–3.50.

**Swarm of 15 items**
- **2.94–3.30:** they spawn at B (s .2, o 0 → 1 in .06 s) and shoot out radially 6–14 [10–20] cqw (outX), spinning ±90.
- **3.20–3.80:** smoothstep blend into the existing pseudo-3D orbit.
  - Centre = flame base at C ≈ (66, 32) [(50, 94)]; rx 14–22 [18–36]; ry 9–15 [10–19].
  - Depth decides front or back of the mascot (existing).
- **3.30–3.82 orbit punch** (the world reacts to his arrival): Rm ×1.15 (.12 s out2), back to 1 (.4 s out2).
- **3.60–6.30:** angular speed ×1.0 → ×1.35; Rm 1 → .9 (io2).
- **6.36–6.80 "inhale":** Rm .9 → .82 (in2).

**'!' tag** (above his head, flame base + (3.5, −1))
- 3.32: s 0 → 1 (back2 .3 s), then a wobble r ±8° for 2 cycles.
- 4.30: s → 0 (.2 s in2).

### BEAT 3 · Systém (6.80–10.25)

**Slam**
- **Shock ring** at the slam point (midpoint of the two lowOut paw tips ≈ (66, 45.5) [(50, 108.8)]), 6.80: s .05 → .6 (.5 s outX), o 1 → 0.

**Calendar** (rect D x44 y13 w38, height 33.6 [M x5 y50 w68, height 60.4]; z below the mascot)
- **6.82–7.30 bloom:** transform-origin = slam point; s .25 → 1 (back, peak 1.03); o 0 → 1 over 6.82–6.94.
- **≈7.25:** at the first tile landing it "receives": y +.3 → 0 (.25 s spring).
- **8.95:** badge-impact jolt, y +.3 → 0 (.25 s spring).

**Items → tiles**
- Snap start ts_i = 6.85 + .65·rank_i. Rank is by distance from the slam point, nearest first, so the last item starts at 7.50 and lands at 7.95.
- **Flight** (.45 s E.back): from orbit(ts_i) to cellWorld(t). Apply the calendar's live bloom transform so tiles land exactly on their cells. r → 0.
- **Mess → tidy at 60 % of the flight:**
  - mess: o → 0, s → .5 (.12 s)
  - tidy: o → 1, s .4 → 1 (back2 .3 s)
- **Landing:** tile s 1.08 → 1 (.3 s spring); cell flash o .6 → 0 (.25 s).
- **Data change:** item '3 lajky za týden' moves from day 9 to **day 31 as a Reel tile**. This is the hero cell (Saturday, last row, beside his paw).

**4 colour beads → chips** (7.70–8.40)
- Beads (2.4 [4] cqw circles) leave these tiles, in this colour order: Post mint (day 1), Story sky (day 5), Collab pink (day 8), Reel lav (day 2).
- Each arcs to its chip icon slot: Správa sítí, Content, Influenceři, Paid social. .45 s io3, apex −4, start 7.70 + i·.1.

**4 chips** (D x6 y31.5, 2×2, w17.4 h4.6, gaps 1.4 [M x7 y32.5, w41.5 h6.6, gaps 2.5 / 2.2])
- On bead arrival (≈8.15 + i·.1): icon circle s 0 → 1 (back2 .3 s).
- The pill unrolls from the icon: clip-path inset(0 100% 0 0 round 99px) → inset(0 round 99px) (.35 s out3).
- Final r −2 / 1.5 / 1.2 / −1.6.

**Badge "Vše naplánováno"**
- 8.45: appears at pawTip(L), s 0 → .45 (back2 .12 s).
- 8.62–8.95: arcs to the calendar's top-right corner (existing −86% / −48% offset) with apex y 8 [44]. r 0 → 354 (one spin, landing at −6°); s .45 → 1 (back2).

**Tiles**
- 9.00–9.60 shimmer: s 1 → 1.04 → 1 (.3 s), delay .03·(row + col).
- 9.50 hero tile pulse: s 1 → 1.06 → 1, plus a lav ring s .8 → 1.6, o .8 → 0.
- 10.25 contact ring at the cell: s .2 → 1, o 1 → 0 (.35 s out2).
- 10.25–10.40 hero tile lift: s 1 → 1.12 (.15 s out2); shadow layer o 0 → 1; z above the calendar.

### BEAT 4 · Obsah (10.25–14.20)

**Tile unfolds into the phone**
- **10.35:** the hero tile goes to o 0. The phone takes over in the same frame with an identical rect.
- **Phone** (D x56 y5.5 w21.5 h43.9 [M x14 y41 w34 h69.4]), 10.35–11.10, io3:
  - translate Δ = tileBottomRight − phoneBottomRight → 0
  - clip-path inset(h − c, 0, 0, w − c round rTile) → inset(0 round rPhone), with c = cell size
  - The phone's bottom-right corner stays under his paw the whole time: "he pulls the phone open".
- **11.10–11.35:** phone s 1.015 → 1 (spring), origin at the bottom-right corner.

**Phone children** (new)
- .st-phone__tile (lav, play icon, pinned to the clip rect): o 1 until 10.80, → 0 by 11.02.
- .st-phone__bezel (the ink frame as its own child): o 0 → 1 over 10.65–10.90.
- Feed order: the first post uses st-media--b (lav → pink), so the lav tile's colour continues into the feed.

**Exits**
- Calendar, 10.35–10.80: s → .94, y +2, o → 0 (in2).
- Other tiles ripple out, 10.35 + .25·rank from the hero cell: s → .6, o → 0 (.22 s in2).
- Chips are sucked into the phone screen centre: arc, s → .3, o → 0 (.3 s in2), starting 10.40 + i·.05.
- Badge, 10.35: s → 0, r +30 (.2 s in2).

**Feed**
- 11.42–12.00: y 0 → −scrollTo·1.008 (flick).
- 12.00–12.18: → −scrollTo (back). The Reel stops under the paw: its media ends ≈ y 45 on desktop; on mobile it ends at the screen's bottom edge.
- 12.00: contact ring at the paw.

**Reel**
- Play button: 12.10 pops (o .1 s; s 0 → 1, back2 .45 s). 12.30 squeezes to s .8 (.08 s out2). From 12.38 bursts to s 1.6, o 0 (.3 s out2).
- Progress bar: sx 0 → 1 over 12.38–14.30 (lin).
- Reel head bounce, 12.38–14.40: y = −|sin(π·2.2·(t − 12.38))|·w·.05.
- **Big double-tap heart** (new, media centre): 13.01 s 0 → 1.25 → 1 (back2 .4 s); rises −3 and fades out over 13.45–13.80.
- Like icon, 13.02: o .06 s; s .4 → 1 (back2 .5 s).
- Like count 184 → 2 480 over 13.05–14.30 (out3).

**12 hearts** (was 8; one per future bar)
- Spawn at the like icon at 13.10 + .07i.
- Rise with sway ±1.2 cqw to their cloud slots (.8 s out3, back-in scale .16 s):
  - D: column x47–55, y8–26 (2 × 6 slots)
  - M: cloud x71–95, y84–96
- Then bob y ±.4 with a 1.25 s period until they dive. They do not fade.

**4 comments** (order unchanged)
- Pop at 13.30 + .28i: o .12 s; s .5 → 1 (back2 .5 s); y 1.2 → 0. Then drift y −.9 until they fly.
- Slots: D left-anchored (31, 27.5), (33.5, 33.5), (30, 39.5), (32.5, 45.5). M x52 at y 36 / 47 / 58 / 69.

### BEAT 5 · Čísla (14.20–16.90)

**Big phone → dashboard**
- 14.55–15.00: r = mini-phone phoneRot(t − .03), so it mirrors his gesture (0 → +8 → −90 → −96 → −90). Centre moves (66.75, 27.45) → (58, 37.5) [(31, 75.7) → (40, 89)] (io3).
- White overlay inside the screen: o 0 → 1 over 14.73–14.82. The swap is hidden at the fastest part of the rotation.
- Bezel: o → 0 over 14.78–14.95.
- 14.95: phone o → 0. In the same frame the dashboard (D x36 y23 w44 h29 [M x5 y66 w70 h46]) appears with o 1.
- Dashboard clip: inset = the rotated phone's landscape rect in dashboard coordinates, round rPhone → inset(0 round rDash) over 14.95–15.15 (io3). Then s 1.015 → 1 over 15.15–15.35 (spring).
- The dashboard header slides in over 15.05–15.35: y −1.5 → 0, o 0 → 1 (out3).
- Move "ilustrativní data" into the header's left group, or below the x-axis at bottom-left. It must never sit in the card's right 35 %, because the mascot's lift covers that area.

**Comments → KPI pills**
- Comments fly in this order and mapping, arc .55 s io3:
  - 14.60: '+1 nový sledující' → KPI 1 (users icon)
  - 14.68: 'Tohle chci vidět!' → KPI 2 (heart)
  - 14.76: 'Kdo to točil?!' → KPI 3 (eye)
- Slots: D x6 at y 27 / 33.6 / 40.2, w27 h5.6 [M x7 at y 33 / 42.5 / 52, w55 h8]. Use the non-tile .st-kpi row style on desktop too.
- At 50 % of each flight the KPI pill fades in (o .15 s) and its width opens from the comment's width via clip inset (.25 s out3). The comment fades out.
- 14.70–15.10: 'Uloženo do sbírky' flies into the card centre, s → .3, o → 0 (in2).

**Hearts → bars**
- Heart i dives from its slot to the foot of bar i (in2, .35 s), starting 14.95 + .05i.
- On impact at 15.30 + .05i: the heart goes s → 0 (.15 s) with one PTS sparkle. The bar grows sy 0 → 1 (back .5 s). The last bar is done ≈ 16.35.

**KPI counters** (illustrative numbers)
- From 15.20 / 15.35 / 15.50, 1.2 s each, out3:
  - +1 → +1 248 (KPI 1 starts at 1: set kpis[0].from = 1)
  - +0 % → +42 %
  - 1× → 3×

**Chart**
- Line draws d 0 → 1 over 15.45–16.70 (io3). The head position comes from a 64-sample getPointAtLength LUT built at layout time.
- Area o 0 → 1 over 15.90–16.50.
- End dot, 16.70: s 0 → 1 (back2 .25 s), right at his paw. Pulse ring from 16.75: s 1 → 2.8, o .8 → 0 (.8 s out2).
- **16.80 dot → spark:** dot o → 0. The spark appears at the dot's position: s .3, r 0 → 45 (.3 s out2). sglow flash o .8 → 0 (.4 s).

**Line clone**
- 16.85: the clone appears in svg.st-over with identical geometry (transform = camera · chart matrix). The chart's own line goes to o 0 in the same frame.
- 16.85–17.00: stays attached to the chart through the camera.
- 17.00–17.72: flies to the "jiskru" underline slot (measured from the .st-jiskru box: bottom + .1em, ≈ x28–45.5 y19 [x47–72 y24.5]). io3 translate; scaleX to the word width; scaleY → .18, flattening it into a rising swoosh; r −3°.
- Styling: vector-effect non-scaling-stroke, applied in SVG user space. Stroke width in px equals the chart stroke at hand-over (±.5 px). Same holo-ink gradient as the chart.

**Implosion** (16.90–17.40)
- Plate B (centre = the spark position at 16.80) is swapped in for plate A at t = 10.00. Both are fully open and world-aligned, so the swap is invisible.
- Plate B: r Rc → 0 (in3).
- The dashboard and the three KPI pills are sucked into the spark: translate → spark, s → .06, r ±20, o → 0 over the last 35 % (in3, .42 s). Start = 16.90 + .08·rank, nearest first.
- sglow flares s .5 → .7 → .5 over 17.30–17.60 as it absorbs them.

### BEAT 6 · Jiskra (16.90–20)

**Spark**
- 17.25–19.55: attached at pawTip(L) + (0, −1.2).
  - s .3 → .35 over 17.25–17.60, then .35 + .04·sin(2πt).
  - r eases 45 → 0 over 17.25–17.60, then 8·sin(2πt/2.5).
- 18.75–19.25: sparkler trail, 6 particles, one every .06 s, life .4 s.
- 19.55–19.90: lifts to pawTip + (0, −3.0 [−3.5]) (out3). This is the same formula as at t = 0.
- sglow settles to s .5, o .55 by 19.90.

**Other**
- Dark twinkles are visible again once the plate has closed (≥17.40).
- **CTA "Chci jiskru":**
  - 18.15: o 0 → 1 (.15 s lin); s .6 → 1 (back2 .55 s); y 1.5 → 0.
  - 19.45–19.70: s → .8, o → 0 (in2), unless hover or focus is holding playback.
- **Swoosh:** optional holo shimmer over 17.72–19.40 (gradient offset). Retracts over 19.40–19.70 with scaleX → 0 toward the right (origin right, in2).

---
## 6. CAPTION RAIL (screen space; never moves with the camera)

**Rail positions**
- t1: D (6, 14), left-aligned (was centred at 51, 18.5) [M (7, 10); drop the .st-txt--c centring and the mobile text-align:center]
- t2–t5: D (6, 6.2) [M (7, 7)]
- t6: D (6, 10.5) [M (7, 9)]; the CTA sits under t6 with the existing gap

**Reveal and exit rules**
- **Word IN:** existing txtIn. o .2 s lin; y wy → 0, r 5 → 0, s 1 (back .55 s). The big variant is r −7, s .7 (back2 .65 s).
- **Word OUT:** new per-word roll-out. y −1.5 [−2.5], o → 0, .28 s in2, stagger .025 (t1 and t6 use .03). The kicker exits with y −1, o 0 (.2 s).
- The next kicker enters ≥ .1 s after the previous roll-out starts. Sub-lines stay hidden on mobile (existing CSS).

**Timing per line**
- **t1**
  - Kicker "Social Media with a Spark": in 0.85 (y 1 → 0, .45 s out3); out 2.45.
  - Words "Ahoj, tady Sparkee": in from 0.95, stagger .09, big; "Sparkee" in holo glow. Out 2.45–2.75.
- **t2**
  - Kicker "02 · Realita": 3.05.
  - Words: from 3.20, stagger .07. Sub-line ≈ 3.75 (y .8 → 0, .45 s out3).
  - The letters of "chaos." jitter over 3.80–6.40 (existing).
  - Out: from 6.85.
- **t3**
  - Kicker "03 · Systém": 6.95.
  - Words: from 7.10. Sub-line ≈ 7.75.
  - "systém." holo underline sx 0 → 1 at 7.95 (.5 s out3), on the frame the last tile lands.
  - Out: from 10.45.
- **t4**
  - Kicker "04 · Obsah": 10.75.
  - Words: from 10.85, overlapping the phone's settle. Sub-line ≈ 11.45.
  - "scroll." underline at 12.00, on the Reel-stop frame.
  - Out: from 13.95.
- **t5**
  - Kicker "05 · Výsledky": 14.15.
  - Words: from 14.25. Sub-line ≈ 14.80.
  - "pocity." pink strike at 15.50, with the line's first stroke.
  - Out: 16.85–17.15. This is gone before the paper plate leaves the rail area.
- **t6**
  - Kicker "Praktická social media agentura": 17.40.
  - Words: from 17.45, stagger .075, big 1.5. "jiskru" starts at 17.53; its back2 overshoot peaks ≈ 17.72, on the swoosh impact. All words settle ≈ 18.45.
  - The 3 .st-cs sparkles on "jiskru": 18.00 + .1i, s 0 → 1, r −90 → 0 (back2 .5 s). Pulse s 1 ± .25 over 18.90–19.40.
  - Out: words 19.35–19.75; kicker o → 0 at 19.60.

---
## 7. LOOP CLOSURE (t = 20 ≡ t = 0)

At t = 20 every track equals its t = 0 value:
- **World camera:** identity with zero slope.
- **Hero dolly:** z_b 1.25, head at (72, 34) [(58, 70)], zero slope into the 0–0.60 hold.
- **Mascot:**
  - At H; rig y = bob(0) = 0.
  - offer / hold, look (−.5, −.4), happy 0, mouth 1, cheek 1, flame 1.0, w_idle 1.
  - All idle and flicker phases complete whole cycles.
- **Spark:** at pawTip(offer) + (0, −3.0); s = .35 + .04·sin(40π) = .35; r = 0. sglow s .5, o .55. mglow .45. Shadow 0.
- **Plates** k = 0.
- **Hidden:** all light-world objects are at o 0. TL base values are the t = 0 state and reapply while hidden (17.40 → 2.92), so no explicit reset is needed. Captions, underline, strike, swoosh and CTA are all hidden by 19.75.
- **Twinkles** are periodic with the fixed ω.

**Acceptance tests** (window.SparkeeStory.seek, both breakpoints):
1. **Seam.** Compare t = 19.999 with t = 0: Δpos < .02 cqw, Δr < .2°, Δs and Δo < .005, rig channels Δ < .01 (angles < .2°).
2. **No teleports.** Sample every 1/120 s. No element with o > .05 may jump > 1.5 [2] cqw between samples, except spawns at the 2.92 burst.
3. **Mascot.**
   - Exactly 1 hop (rig y apex < −1 cqw with the ground under him).
   - feetX changes only inside the glide/float windows: 2.72, 7.00, 9.75, 10.35, 14.00, 16.20 and 17.25.
   - S is constant; no non-uniform scale anywhere in the rig.
4. **Rail safety.** While any caption word has o > .5, no world object's screen rect overlaps its text rect, except swarm items during 2.94–3.30.
5. **Contacts.** |pawTip − target| < .3 cqw at 2.30, 10.25, 12.00 and 16.70.
6. **Performance.** Chrome trace at 4× CPU throttle: no long frames outside the clip windows, and no full-stage repaints in paint flashing.
7. **Posters.** At ?story=1.9, 5.2, 9.2, 13.5, 16.6 and 18.72 each headline is complete and unoccluded, on desktop and mobile.

---
## 8. CHAPTERS AND FILE EDITS

**Chapters**
- CHAPTERS: Ahoj t 0 (poster 1.9), Chaos 2.9 (5.2), Systém 6.8 (9.2), Obsah 10.2 (13.5), Čísla 14.2 (16.6), Jiskra 16.9 (18.72).
- index.html --at values: 0 / 2.9 / 6.8 / 10.2 / 14.2 / 16.9.

**Reduced motion**
- The poster and the once-stop frame move to 18.72 (19.4 is now mid roll-out).
- The End key seeks 18.72.
- Restart when t ≥ 18.7.

**story.js**
- Remove the pose imgs, pose(), hop(), iris(), the cr clip track and the block txtOut.
- Add:
  - camera and dolly Hermite tracks (TL fn writing x, y, s on .st-cam, .st-hero and .st-par)
  - a TL property "ci" (inset clip), written only inside its windows
  - the pure P(t) and a per-frame rig.renderPose(P(t), t mod 20) after T.render
  - two plates, the overlay line clone, 8 trail particles, the big double-tap heart, the '!' tag, 4 beads and the phone bezel/tile/white children
- COPY changes:
  - '3 lajky za týden' moves from day 9 to day 31 (Reel)
  - kpis[0].from = 1
  - hearts: 12
  - first feed post: st-media--b
  - new comment slots
- Apply the twinkle loop fix.
- Measure all geometry in applyLayout/build.

**story.css**
- Add .st-par, .st-cam, .st-hero, .st-plate and .st-plate__in, .st-rail, .st-over, .st-mascot, .st-phone__bezel, .st-phone__tile, .st-phone__white.
- Remove .st-dark, the .st-light clip and the .st-p--* pose classes.
- Make t1 left-aligned on the rail.
- Use desktop KPI pills (non-tile) and apply the new dashboard label position.

**index.html (STORY block)**
- Restructure the stage into bg / par / cam(plates, world, hero) / rail / over.
- Remove the &lt;img data-pose&gt; set. The story mascot SVG is cloned at init from the hero's svg.mascot, or from a &lt;template&gt; when no hero is present.
- Load story.js AFTER mascot-rig.js and mascot.js. Today it loads first.
- Optionally update the storyboard descriptions to the new actions. The titles stay as they are.

## Desktop
Desktop 16:9, world 100 × 56.25 cqw. Mascot uses S .74, so 1 rig unit = .0569 cqw. The figure is ≈ 23.2 cqw tall and 15 cqw wide. Home H box ≈ x74.6–89.4, y28–51.5.

**Caption rail (screen space)**
- t1 (6, 14), w46, left-aligned
- t2–t5 (6, 6.2), w40; rail text reaches ≈ x40, y≤24
- t6 (6, 10.5), w62; the CTA sits under it (gap 3.4)
- "jiskru" underline slot ≈ x28–45.5, y19, measured at runtime

**Stations**
- H (82, 51.5); C (66, 50.5); H5 (87, 51.5)
- R ≈ (77.9, 48.9) with float 2.6
- P ≈ (80.8, 36.4) with float 15.1

**Spark and plates**
- Spark hover ≈ (77.3, 42.1)
- Halo orbit centre ≈ (82.1, 33.2), rx 8.5, ry 2.5, tilt −12°
- Burst point B (50, 24), throw apex y20
- Plate radius Rc 86 (covers every corner from both centres); plate A centred on B, plate B on the chart end dot ≈ (76.1, 30)

**Chaos**
- Swarm orbit centre (66, 32), rx 14–22, ry 9–15. The left-most items then stay clear of the t2 sub-line, which ends ≈ x40.

**Calendar**
- x44 y13 w38 (height 33.6). y moves down from 8.5 so the hero cell is within paw reach.
- Cell 4.54; hero cell = day 31 (Saturday, last row), centre ≈ (73.1, 42.7), bottom-right corner ≈ (75.3, 45.0)
- Slam point ≈ (66, 45.5)
- Badge at the calendar's top-right (82, 13), existing −86% / −48% offset
- Sundays are empty, so the mascot at H covering the Sunday column hides nothing

**Chips**
- x6 y31.5, 2×2, w17.4 h4.6, gaps 1.4; they end at x42.2, 1.8 before the calendar

**Phone**
- x56 y5.5 w21.5 h43.9 (was x51 y4.5); bottom-right corner (77.5, 49.4) at paw height
- The Reel stops with its media ending ≈ y45 under the L paw ('out' tip ≈ (77.2, 45.4))

**Beat 4 extras**
- Comments, left-anchored: (31, 27.5), (33.5, 33.5), (30, 39.5), (32.5, 45.5)
- Heart column x47–55, y8–26 (2×6 slots)

**Report**
- Dashboard x36 y23 w44 h29; KPI pills x6 at y 27 / 33.6 / 40.2, w27 h5.6 (row pills, no longer tiles)
- Chart end dot ≈ (76.1, 30)
- Move "ilustrativní data" into the header's left group, or bottom-left below the x-axis. It must stay out of the card's right 35 %, because the lifted mascot covers x ≈ 73–88, y ≈ 13–36.

**Camera**
- World camera z 1.00–1.08 only. The 1.25 bookend frames the head at screen (72, 34) through the hero dolly.

## Mobil
Mobile ≤720 px, 4:5, world 100 × 125 cqw. Mascot uses S .60, so 1 rig unit = .0814 cqw. The figure is ≈ 33.2 cqw tall and 21.5 cqw wide. Home box ≈ x61.4–82.9, y87.8–121.

**Caption rail**
- t1 (7, 10), left-aligned: remove .st-txt--c and the mobile .st-h--xl text-align:center
- t2–t5 (7, 7), w86
- t6 (7, 9); the CTA sits under it (gap 6)
- Rail bottoms: ≈ y30 for 2-line headlines; ≈ y39 for t2, which has 3 lines. Sub-lines stay hidden on mobile.
- "jiskru" underline slot ≈ x47–72, y24.5

**Stations**
- H (72, 121); C (50, 116); H5 (86, 121)
- R ≈ (64.1, 112.5) with float 8.5
- After the pull ≈ (55, 121)
- P ≈ (74.8, 88.3) with float 32.7, about one body height

**Spark and plates**
- Spark hover ≈ pawTip + (0, −3.5)
- Halo orbit centre ≈ (72.1, 94.8), rx 12, ry 3.5
- Burst point B (46, 56), throw apex y50
- Plate radius Rc 108; plate B centred on the chart end dot ≈ (68.1, 79.1)

**Chaos**
- Swarm centre (50, 94), rx 18–36, ry 10–19; this stays below the 3-line t2 rail

**Calendar and chips**
- Calendar x5 y50 w68 (height 60.4, cell 8.11)
- Hero cell ≈ x53.2–61.3, y99.6–107.7 (centre (57.3, 103.7)); slam point ≈ (50, 108.8)
- Badge at the calendar's top-right (73, 50)
- Chips x7 y32.5, 2×2, w41.5 h6.6, gaps 2.5 / 2.2; they end ≈ y48.2, before the calendar at y50

**Phone**
- x14 y41 w34 h69.4. This is narrower and lower than director B's x14 y33 w38, for two reasons:
  - Rotated to landscape (69.4 × 34) it fits inside the dashboard, which a clip can then open.
  - The paw at ground level reaches the screen's bottom edge.
- Its bottom-right corner (48, 110.4) is the pull/contact point.
- The hero tile lies OUTSIDE the phone rect on mobile, so the unfold must use translate Δ plus the clip, not the clip alone.
- The flick and the thumb-stop happen at the screen's bottom-right edge (the paw tip at 'out' is ≈ (48.2, 112.2)).

**Beat 4 extras**
- Comments in a right column at x52, y 36 / 47 / 58 / 69, max width ≈ 44
- Hearts cloud x71–95, y84–96 (2 rows × 6), clear of the mascot at (55, 121)

**Report**
- Dashboard x5 y66 w70 h46 (narrowed from 90). The mascot at H5 (box x75–97) then never covers the tallest bars.
- KPI pills x7 at y 33 / 42.5 / 52, w55 h8; they end at x62, clear of the lifted mascot at x ≥ 64
- The rotated phone's centre moves (31, 75.7) → (40, 89)

**Timing and camera**
- The backstep glide to H5 is 31 cqw on mobile, so it runs 13.95–14.50 instead of 14.00–14.45.
- Camera keys are listed separately for M in the script. The bookend dolly puts the head at screen (58, 70) at z_b 1.25; the empty world below y125 shows the screen-space dark base.
- Touch has no hover, so the CTA hold applies on focus only (existing behaviour).

## Požadavky na rig
- Headless story instance: SparkeeMascot.create(svg, {auto:false, fx:false, reactions:null, idPrefix:'stm-'}).
- No requestAnimationFrame loop, no RNG idle scheduler, no saccade RNG, no springs.
- No global listeners (pointer, scroll, hover, IntersectionObserver).
- It only renders when the story calls it.
- Pure render: api.renderPose(F, t).
- F is a complete pose object.
- t (story time mod 20) is used only for the flame and flame-core flicker, whose frequencies (1.1, 2.7, 5.3, 1.9, 4.3, 3.1, 6.7, 2.2 Hz) already complete whole cycles in 20 s. Any new flicker term must also complete whole cycles in 20 s.
- The same (F, t) always produces identical DOM, for scrubbing, chapter jumps and ?story=x.
- Pose channels:
- Body: x, y, rot (about CENTER 504,262), lean (about FEET 504,446).
- Head: hr, hx, hy.
- Eyes: eyeX, eyeY (final eye offsets).
- Face: blink 0–1, happy 0–1 (^^ eyes), mouth (uniform scale .7–1.32), cheek.
- Flame: flame (uniform scale), plus flameRot, flameDx, flameDy. These three are explicit lag inputs that replace the internal S.fa/S.fx/S.fy springs.
- Arms: La, Lb, L1, L2, Ra, Rb, R1, R2.
- Phone: phoneRot, tap (right thumb only), heart (mini-phone like pulse, supplied by the caller with a 2.5 s period).
- Shadow: a multiplier 0–1 applied on top of the existing altitude-based shrink and fade, so the shadow can be off in the dark scenes and on in the light world.
- Gaze helper: api.gaze(lookX, lookY) returns the steady-state deltas the hero reaches through its springs:
- hr += clamp(x)·6·dr; hx += x·3.2·dr; hy += y·2.6
- eyeX = 2.4·clamp(x); eyeY = 2.1·clamp(y)
- lean −= 1.6·clamp(x), including the dr factor that keeps the head lobe off the phone
This lets the story sample eyes and head at different time offsets (eyes lead the head by .06 s).
- Arm presets exported as {a1, b, l1, l2}:
- Existing: rest, down, out, wave, cheer, hold.
- New: offer (8, −28), lowOut (30, −10), cock (35, −75), present (−2, −14), yayL (−4, −40), yayR (8, −48).
Also export an armBlend(P, side, preset or {a1, b, l1, l2}, weight) helper. Bone lengths may only come from the presets (22–26.1 units); no free stretching.
- Existing actions exported as pure layer functions: actions.wave.apply(P, localT), actions.hop.apply(P, localT) and actions.glance.apply(P, localT), with their dur, fadeIn and fadeOut values. The caller applies crossfade weights. Blink lists and events (like, burst, react) are NOT fired in story mode; the story owns its blink list.
- Pure geometry queries from a pose F, in rig units, with no DOM reads:
- pawTip(side, F) = joints[2], and pawFrame(side, F) = {x, y, angle, r} from limbInfo, both including rot, lean and wrapper-independent transforms.
- handMatrix(F) for the mini phone, and phoneScreenQuad(F) for the 4 screen corners. Used to mirror the big phone's rotation at 14.55.
- headCentre(F), flameBase(F), flameTip(F), crown(F).
- Constants: FEET, CENTER, NECK, SH, and viewBox 374 39 264 427.
- Export blinkCurve(x), the existing .2 s lid curve, so the story's fixed blink list uses the identical lid motion.
- SVG cloning with id prefixing: when the story clones the hero svg.mascot, rewrite every id plus url(#…) and href="#…" / xlink:href references (gradients such as bd-*, paint*, arm gradients, clipPaths, symbols) with the prefix. Otherwise the story instance resolves fills from the hero SVG and breaks if the hero is display:none at some breakpoint. Strip role="img" and aria-label from the clone, since the story stage is aria-hidden.
- Performance:
- Keep skipping the arm rebuild when joints move less than .004 units (existing same() check).
- Per frame, at most 4 path d writes (ink + fill × 2 arms) and 2 arm-gradient updates; everything else is transform or opacity attribute writes cached by value.
- limbInfo ≤ .3 ms per arm, and renderPose ≤ 2 ms per frame on a mid-range phone.
- No getScreenCTM, getBBox or layout reads inside renderPose.
- Brand-rule enforcement inside the rig:
- Only uniform scale on the mouth, cheeks and flame.
- The only non-uniform transform allowed is the existing eyelid blink (eyes scale(1, open)).
- No mirroring and no bone stretching.
- Whole-figure uniform scale comes only from the story wrapper (fixed S) and the hero dolly.
- Phone and thumb: keep the mini phone permanently in the right paw (story mode never hides it). tap animates only the right thumb on the mini phone; left-paw presses on the big phone are done by the story through arm-angle pulses.
- Reduced motion: renderPose can be called once with the static poster pose (t = 18.72) and must produce a clean still frame, with happy eyes and no mid-blink.
- Instance isolation: the hero instance and the story instance must run independently on the same page. Per-instance cloned arm gradients (existing uid scheme) stay in place. The hero keeps pausing when off-screen (existing IntersectionObserver), so the two never animate at the same time on small screens.
