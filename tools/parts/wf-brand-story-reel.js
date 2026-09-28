export const meta = {
  name: 'sparkee-brand-story-reel',
  description: 'Portfolio-grade IG Reel "how the Sparkee brand was born" (procedural logo creation, no old concepts) + standalone logo open/sting: 3 concept pitches → judge → Remotion build (logo kit + sting, then reel) → 2 reviews → iterate + deliver',
  phases: [
    { title: 'Concept', detail: '3 creative directors pitch, 1 judge merges into the final storyboard' },
    { title: 'Build', detail: 'logo construction kit + logo open, then the Reel (Remotion)' },
    { title: 'Review', detail: 'motion director/virality + brand QA' },
    { title: 'Deliver', detail: 'apply notes, final renders, cover, caption, README' },
  ],
}
const ROOT = '/Users/martinwork/Downloads/lp-tracking-standard/sparkee-web'
const RM = ROOT + '/remotion'
const OUT = ROOT + '/social/instagram/reel-znacka'
const SK = '/Users/martinwork/Downloads/lp-tracking-standard/.claude/skills'
const SCR = '/private/tmp/claude-501/-Users-martinwork-Downloads-lp-tracking-standard/9ac86e71-2100-45ed-b455-ab6c65877598/scratchpad/story'
const BRIEF = `CLIENT BRIEF (Czech, from the brand owner): "Udělej mi reelsko, jak vznikla značka.. nějakej motion epickej, jako by si chtěl udělat fakt dojem na internetu a dosahu, i tvorba loga a tak by tam měla být, chci open loga jakože firmy nějak vymyslet."
In English:
- An Instagram Reel about HOW THE SPARKEE BRAND WAS BORN.
- The motion must be EPIC, the kind that impresses the internet and gets REACH.
- The LOGO CREATION PROCESS must be in it.
- He also wants a "logo open": a logo intro/reveal sting like big companies have (think Netflix, Intel, Pixar-style openers). This is a standalone asset AND the climax of the Reel.
TWO MORE CLIENT NOTES (they override anything else):
(a) "ty původní bych nebral v potaz to se přece nedělá": do NOT show the old concept images (the AI-generated first concepts, the silhouette sketches, the old brand boards, the early lockup). Professionals don't show that.
(b) "dělej to jakoby ses hlásil jako motion designer do velké firmy a měl bys tohle za úkol udělat": treat this as THE test assignment for a senior motion-designer job at a top studio or big-tech brand team (think Buck, ManvsMachine, Apple, Google, Spotify brand motion). It must be portfolio-grade craft: a clear concept, impeccable timing and easing, typographic finesse, restraint, and details that reward a second watch.
SPARKEE = a Czech social-media agency. Claim: "Dodáme jiskru vašim sociálním sítím". On Instagram the mascot speaks in first person and uses "ty"; its IG bio line is "Dodáme jiskru tvým sociálním sítím ✦". The mascot IS named Sparkee: a holographic star-head with a small flame on top, a white body and round arms.`
const RULES = `BRAND RULES (hard):
- Colours: ink #2C303C; pastels mint #A5EDC5, sky #9AD8F8, lilac #C49CF2, blush #F5B8DC; paper #F6F4EF; mist #F5F4FB.
- Fonts: Baloo 2 (headlines, weights 700-800) and Nunito (text). Both must render Czech diacritics (ř, ě, ů). The Remotion theme in ${RM}/src/lib/theme.ts still loads Plus Jakarta Sans: switch it to Baloo 2 + Nunito via @remotion/google-fonts.
- THE OFFICIAL LOGO = ${ROOT}/assets/img/logo.svg (Figma 124:3, viewBox 0 0 568 292): the "sparkee" wordmark in ink, with the mascot LYING on the letters "ar" (tilted head) and a ✦ sparkle at the top right.
  - The final logo must be EXACT, 1:1: same shapes, and the mascot in the same position, scale and tilt.
  - Never show the wordmark with the mascot cut out and broken letters. Never place the mascot on the wordmark any other way.
  - On dark backgrounds use ONLY ${ROOT}/assets/img/logo-dark.svg (mist letters die-cut around the mascot with a holo glow; logo-dark-flat.svg for tiny sizes). NEVER put the logo on a light plate or badge on dark.
- MASCOT:
  - Never deformed: uniform scale only, no squash and stretch, no non-uniform scaling, no redrawing of the face.
  - The head is straight when standing and tilted only in the lying logo pose.
  - Arms are round.
  - Poses: ${ROOT}/assets/img/poses/*.svg (stand, wave, phone, phone-wave, happy, surprised, peek, sticker, head, lie = the logo pose, rig). Swap poses only inside a motion moment (hop, flash, whip).
- GRADIENT TEXT: only on dark, pastel, on a 45° diagonal (linear-gradient(135deg,#A5EDC5 0%,#9AD8F8 38%,#C49CF2 72%,#F5B8DC 100%)), and only on one short accent word. On light backgrounds text is solid ink; an accent goes UNDER the word as a soft pastel holo marker bar.
- COPY: Czech; the mascot uses "ty" on IG. Say "zastaví scroll", never "palec". No em/en dashes. No invented facts or statistics: no "za 7 dní", no fake follower numbers, no fake client names. The brand was created in late September 2026.
- LAYOUT: never stick a visual onto text; keep at least 80px of air. IG safe zones: no text in the top ~220px, the bottom ~420px or the right ~120px. Every text must stay readable for at least ~1.2 s.`
const ASSETS = `THE LOGO CREATION PROCESS must be shown as crafted design work built FROM THE FINAL LOGO GEOMETRY. NEVER use the old concept images in ${ROOT}/assets/figma (raw-*.png, orig/, brand-board, overview, board-grid*, logo-a/b); the client forbade them.
Show a designer's process the way top studios do in "making of" films. Everything is generated procedurally from the real parts, so it all converges exactly on the official logo:
- rough pencil or marker sketch strokes (jittered, hand-drawn versions of the real outlines, drawn on);
- construction geometry (circles and tangents fitted to the star-head, a baseline, x-height and cap lines, the grid);
- bezier anchors and handles snapping into place;
- the clean outline;
- the holo colour flood and the face coming alive (a blink);
- the letterforms set, kerned and aligned;
- the mascot lying down on "ar";
- the ✦ flash.
LOGO CONSTRUCTION PARTS (clean, same coordinates as logo.svg, viewBox 0 0 568 292), in ${ROOT}/tools/logo-dark/parts/:
- letters.svg: all 7 letters as complete shapes;
- mascot_outline.svg and mascot_outline_underlap.svg (use the underlap version when stacking);
- mascot_fills.svg: holo head, face, body, limbs;
- mascot_silhouette.svg and mascot_silhouette_with_flame.svg;
- flame*.svg and sparkle.svg.
These let you animate the REAL logo being built: outlines drawing on (@remotion/paths evolvePath), fills flooding in, the flame igniting, the sparkle flashing. Recombining letters + mascot_outline_underlap + mascot_fills + flame + sparkle reproduces logo.svg almost pixel for pixel.
OTHER:
- The logo-dark geometry and build scripts are in ${ROOT}/tools/logo-dark/.
- The rig is described in ${ROOT}/tools/rig.py and ${ROOT}/assets/js/mascot-rig.js (joints).
- The previous Reel (a different piece, for reference only: do not repeat it) is ${ROOT}/social/instagram/_src/reel.html plus its MP4 in social/instagram/reel/.
- Tokens are in ${ROOT}/assets/css/site.css.`
const TECH = `TECH:
- Remotion project ${RM}: Remotion 4.0.526, React 19, with @remotion/paths and @remotion/google-fonts already installed. Existing lib: src/lib (theme, motion, shapes, ui, Phone, Post) and src/mascot/Mascot.tsx (pose-based mascot).
- If you need other official packages (@remotion/transitions, @remotion/motion-blur, @remotion/noise, @remotion/shapes), install them at EXACTLY version 4.0.526 with npm i --save-exact.
- BEFORE writing Remotion code, read ${SK}/remotion-best-practices/SKILL.md and ${SK}/remotion-markup/ (REFERENCE.md and rules). Use ${SK}/remotion-render for rendering.
- Use useCurrentFrame/interpolate/spring and <Sequence>/<Series>, never CSS transitions. Draw lines with evolvePath.
- Put the new code in src/comps/story/ and register the compositions in src/Root.tsx under Folder "BrandStory".
- Load images and SVGs with staticFile: point remotion.config.ts's public dir, or copy/symlink the needed assets into ${RM}/public/ (check how existing comps load assets/img).
- Render with npx remotion render <id> <out> --concurrency=4 (the machine has 8 CPUs; run one render at a time).
- Check with npx remotion still <id> --frame=N <out.png> and view the stills with Read.
- Scratch goes in ${SCR}/<your-step>/. Keep tsc clean (npm run lint).`
const REPORT = { type: 'object', properties: { done: { type: 'array', items: { type: 'string' } }, files: { type: 'array', items: { type: 'string' } }, open: { type: 'array', items: { type: 'string' } } }, required: ['done', 'open'] }
const PITCH = { type: 'object', properties: { title: { type: 'string' }, logline: { type: 'string' }, hook: { type: 'string' }, beats: { type: 'array', items: { type: 'object', properties: { t: { type: 'string' }, visual: { type: 'string' }, text: { type: 'string' }, motion: { type: 'string' } }, required: ['t', 'visual', 'motion'] } }, logo_open: { type: 'string' }, audio: { type: 'string' }, why_reach: { type: 'string' } }, required: ['title', 'logline', 'hook', 'beats', 'logo_open', 'why_reach'] }

phase('Concept')
const DIRS = [
  { k: 'A', d: 'REWIND: open on the finished logo, then "jak to vzniklo?" and a fast, satisfying REWIND (a scrub bar, VHS-free, clean motion-design rewind) back through every stage to the first spark. Then play forward in a tight montage of the real process, landing on the logo open.' },
  { k: 'B', d: 'DESIGNER\'S CANVAS / PROCESS ASMR: a Figma-like canvas from above. Show the brief words, a quick generated moodboard of brand tokens (the pastels, holo, ✦, type), procedural sketch strokes of the star-head exploring and then locking, and then construction circles, a grid and bezier handles, the outline drawing on, the holo flood, the letters kerning into place, the mascot lying down on "ar", and the logo open.' },
  { k: 'C', d: 'CINEMATIC BIG BANG: black void, a single spark ignites, particles fall into a star, the star becomes the head, the flame lights, the body grows, and the wordmark forms under it. Big kinetic typography between the beats and a camera that moves through depth. Ends with an iconic logo open.' },
]
const pitches = await parallel(DIRS.map(v => () => agent(`${BRIEF}\n\n${RULES}\n\n${ASSETS}\n\nYOU ARE CREATIVE DIRECTOR ${v.k}. Pitch a 20-30 s, 1080x1920 Reel in the direction: ${v.d}\nFirst view assets/img/logo.svg, logo-dark.svg and the parts rendered to PNG (qlmanage -t, or Chrome headless via ${ROOT}/tools/shot.sh), with scratch in ${SCR}/pitch${v.k}/.\nDeliver:\n- a beat-by-beat storyboard with timecodes (30 fps), the visual, the on-screen Czech text (short, in the mascot voice with "ty", readable) and the motion/easing notes;\n- the logo open design (3-4 s, iconic, reusable as a standalone sting in 16:9, 9:16 and 1:1, with light and dark versions);\n- an audio direction (tempo and beat grid, so the edit is beat-synced when the owner adds a trending sound);\n- why this gets reach: hook in the first second, watch-through, loop, shareability.\nBe ambitious but buildable in Remotion from our real assets. Do not write code.`, { label: `pitch:${v.k}`, phase: 'Concept', schema: PITCH })))

const FINAL = { type: 'object', properties: { chosen: { type: 'string' }, grafts: { type: 'string' }, storyboard: { type: 'string' }, logo_open_spec: { type: 'string' }, copy: { type: 'array', items: { type: 'string' } }, audio: { type: 'string' }, risks: { type: 'string' } }, required: ['chosen', 'storyboard', 'logo_open_spec', 'copy'] }
const board = await agent(`${BRIEF}\n\n${RULES}\n\n${ASSETS}\n\nYOU ARE THE EXECUTIVE CREATIVE DIRECTOR. Three pitches: ${JSON.stringify(pitches.filter(Boolean))}\nScore them for:\n- reach potential (the 1 s hook, watch-through, loop, share);\n- epicness;\n- craft and concept clarity (senior-level, portfolio-grade);\n- brand fidelity;\n- buildability in Remotion.\nJudge them as the hiring panel of a top motion studio would judge a test assignment. Pick the strongest spine, graft the best moments from the others, and write THE FINAL STORYBOARD:\n- 22-28 s at 30 fps, 1080x1920;\n- exact frame ranges per beat, with visuals, text, motion and easing;\n- beat-synced on a stated BPM grid;\n- a seamless loop from the last frame to the first.\nAlso write the LOGO OPEN spec (3.5 s: 16:9, 9:16 and 1:1, light on paper with logo.svg and dark on ink with logo-dark.svg), the final Czech copy list, the audio direction and the risks. Check every line against the brand rules.`, { label: 'concept:judge', phase: 'Concept', schema: FINAL })

phase('Build')
const kit = await agent(`${BRIEF}\n\n${RULES}\n\n${ASSETS}\n\n${TECH}\n\nFINAL STORYBOARD + LOGO OPEN SPEC: ${JSON.stringify(board)}\nTASK 1 of 2: THE LOGO CONSTRUCTION KIT + THE LOGO OPEN.
(1) Fix theme.ts: Baloo 2 + Nunito, and the official colour tokens.
(2) Build reusable components in src/comps/story/kit/ that assemble the REAL logo from the parts:
   - letters drawing on or popping in;
   - the mascot outline drawing on (evolvePath);
   - the fills flooding in with a holo sweep;
   - the flame igniting;
   - the sparkle flash and burst;
   - construction overlays (circles, grid, bezier anchors and handles, measurement lines), in the Figma-like style from the storyboard.
   Every component takes a progress/frame input so the Reel can reuse it. The fully assembled end state must match logo.svg: render logo.svg and your final frame at the same size, diff them with python3 PIL, and report the max/mean difference. The dark variant uses logo-dark.svg.
(3) Build the compositions LogoOpen16x9 (1920x1080), LogoOpen9x16 (1080x1920) and LogoOpen1x1 (1080x1080), each in a Light and a Dark variant (props or separate ids), about 3.5 s at 30 fps, iconic and premium.
(4) Render all six to ${ROOT}/assets/video/logo-open/ as MP4 (h264, yuv420p), plus a poster PNG of each final frame.
(5) Verify: stills every 0.25 s, contact sheets, and a zoom on the final logo.
Report the component API (props), the files and the diff numbers.`, { label: 'build:kit+logo-open', phase: 'Build', schema: REPORT })
const reel = await agent(`${BRIEF}\n\n${RULES}\n\n${ASSETS}\n\n${TECH}\n\nFINAL STORYBOARD: ${JSON.stringify(board)}\nLOGO KIT (already built, reuse it; do not duplicate it): ${JSON.stringify(kit)}\nTASK 2 of 2: build the REEL composition "BrandStoryReel" (1080x1920, 30 fps, the storyboard duration) in src/comps/story/, exactly per the storyboard, ending in the logo open, with a seamless loop.
- Use NO old concept images (forbidden). Build every process stage procedurally from the real logo parts and poses.
- Make it EPIC: depth and parallax, camera moves, easing with anticipation and overshoot (never on the mascot's shape), light sweeps, particles, beat-synced cuts on the stated BPM grid, and kinetic typography in Baloo 2.
- Respect the safe zones and the minimum reading times.
- Render it to ${OUT}/sparkee-reel-znacka.mp4 (h264, yuv420p), plus cover.png (1080x1920, the most thumb-stopping frame) and cover-4x5.png (1080x1350 crop for the grid). Also make ${OUT}/_preview/contact-sheet.png with a frame every 0.5 s.
- Verify by viewing stills every 0.5 s, and every 1/30 s around transitions and the logo moments.
Report the beat timings, the files and anything you had to deviate from.`, { label: 'build:reel', phase: 'Build', schema: REPORT })

phase('Review')
const NOTES = { type: 'object', properties: { verdict: { type: 'string', enum: ['epic', 'great', 'good', 'meh', 'broken'] }, notes: { type: 'array', items: { type: 'object', properties: { t: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['problem', 'fix'] } } }, required: ['verdict', 'notes'] }
const revs = await parallel([
  'MOTION DIRECTOR + REACH, judging it as a senior-hire test assignment at a top studio: is it truly EPIC, portfolio-grade and scroll-stopping? Check the hook in the first second, pacing, watch-through, the loop, camera, easing, beat sync, readability (1.2 s), safe zones, the cover frame and the logo open impact. Extract frames every 0.25 s from the MP4 (ffmpeg at /Users/martinwork/Downloads/lp-tracking-standard/lions-liga-voiceover/node_modules/@remotion/compositor-darwin-arm64/ffmpeg with DYLD_LIBRARY_PATH set to that dir, -ss per frame, -c:v png). Be demanding and give concrete frame/easing fixes.',
  'BRAND QA: compare the final logo frames with assets/img/logo.svg (and logo-dark.svg on dark) at the same size. Any broken letters, or a mascot in the wrong position, scale or tilt? Any mascot deformation or wrong head tilt? Check that no old concept image appears (forbidden), then the gradient rule, the colours, the fonts (Baloo 2 / Nunito, Czech diacritics), the copy (ty, scroll, no invented facts, no dashes) and the layout air. Also check the 6 logo-open files.',
].map((l, i) => () => agent(`${BRIEF}\n\n${RULES}\n\nReview (read-only, do not edit): the Reel ${OUT}/sparkee-reel-znacka.mp4 and the logo opens in ${ROOT}/assets/video/logo-open/. Build reports: ${JSON.stringify({ kit, reel })}.\nLens: ${l}\nScratch in ${SCR}/review${i}/.`, { label: `review:${i + 1}`, phase: 'Review', schema: NOTES })))

phase('Deliver')
const deliver = await agent(`${BRIEF}\n\n${RULES}\n\n${ASSETS}\n\n${TECH}\n\nApply these review notes (JSON): ${JSON.stringify(revs.filter(Boolean))}.\nApply every note that improves the piece; if a note conflicts with the brand rules, the rules win. Re-render the Reel and any logo opens you touched.\nThen deliver into ${OUT}/:
- sparkee-reel-znacka.mp4;
- cover.png and cover-4x5.png;
- caption.txt: a Czech IG caption in the mascot voice (ty), with a hook line, 2-4 short lines, a soft CTA "Sleduj ✦" and 5-8 relevant Czech/EN hashtags, no dashes;
- README.txt: what it is, the duration, the beat/BPM grid and 3 audio suggestions (trending-style descriptions, no copyrighted tracks bundled), where the logo opens are, and how to re-render (the npx commands);
- _preview/contact-sheet.png.
Also add a short section to ${ROOT}/social/instagram/PLAN.md. Verify the final MP4 plays (ffprobe-equivalent via the bundled ffmpeg -i) and view the frames around the logo open and the loop point. Report the files and durations.`, { label: 'deliver', phase: 'Deliver', schema: REPORT })
return { pitches: pitches.filter(Boolean), board, kit, reel, reviews: revs.filter(Boolean), deliver }