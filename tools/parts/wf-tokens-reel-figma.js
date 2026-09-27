export const meta = {
  name: 'sparkee-tokens-reel-figma',
  description: 'Unify tokens + replace "zastaví palec" copy, fix the Reel logo and refine its animation (reviewed), re-record, then import the Instagram kit into Figma',
  phases: [
    { title: 'Tokens', detail: 'web+OG and Instagram in parallel (tokens + copy)' },
    { title: 'Reel', detail: 'logo fix + animation refinement, 2 reviewers, iterate, re-record' },
    { title: 'Figma', detail: 'import IG kit into 📱 Instagram' },
    { title: 'Check', detail: 'verify' },
  ],
}
const ROOT = '/Users/martinwork/Downloads/lp-tracking-standard/sparkee-web'
const IG = ROOT + '/social/instagram'
const SCR = '/private/tmp/claude-501/-Users-martinwork-Downloads-lp-tracking-standard/9ac86e71-2100-45ed-b455-ab6c65877598/scratchpad/tok'
const FF = '/Users/martinwork/Downloads/lp-tracking-standard/lions-liga-voiceover/node_modules/@remotion/compositor-darwin-arm64/ffmpeg (DYLD_LIBRARY_PATH = that dir; input codec png; limited filters, use -ss + -frames:v 1)'
const DEC = `CLIENT DECISIONS (final):
- Official ink = #2C303C (from the logo vectors). Replace #272A33 everywhere.
- Official pastels = the WEB set: mint #A5EDC5, sky #9AD8F8, lilac #C49CF2, blush #F5B8DC. Replace the Figma set: #8BEFD6→#A5EDC5, #92D8F8→#9AD8F8, #B9A9EC→#C49CF2, #F4B8CB→#F5B8DC. Clearly derived tints may stay.
- Tone: the mascot uses "ty" (Instagram and social), the agency uses "vy" (website, offers). The claim stays "Dodáme jiskru vašim sociálním sítím"; the IG bio line "Dodáme jiskru tvým sociálním sítím ✦" is the mascot's voice, so keep it.
- The mascot's name is Sparkee.
- Leave background neutrals as they are: paper #F6F4EF on the web, mist #F5F4FB on IG.
- NEW COPY RULE: the client does not say "zastaví palec" ("stops the thumb"); they say SCROLL. Replace every "zastaví palec" / "zastavím palec" / "co zastaví palec" phrase with the scroll wording, e.g. "Obsah, který zastaví scroll." / "Superschopnost: zastavím scroll." Adapt the grammar naturally. This applies to visible text, meta descriptions, alt texts, JSON-LD, captions and PLAN.md. Code comments about the mascot's thumb (palec) are NOT copy; leave them.`
const REPORT = { type: 'object', properties: { done: { type: 'array', items: { type: 'string' } }, open: { type: 'array', items: { type: 'string' } } }, required: ['done', 'open'] }

phase('Tokens')
const [web, ig] = await parallel([
  () => agent(`${DEC}\n\nPROJECT ${ROOT} (static site at http://localhost:8770).\nTASK (website + OG):
- Apply the tokens: assets/css/site.css :root (--ink, --ink-2 derived, holo gradients vs the web pastels), pages.css, story.css, mascot.css, companion.css, inline colours in index.html (theme-color, JSON-LD), the build_pages.py HEAD partial, site.webmanifest, tools/og/template.html + cards.json.
- Apply the SCROLL copy rule. Locations include index.html (the story beat caption "Obsah, který zastaví palec." at the st-h line, the storyboard li, and the services tile text), tools/build_pages.py (tvorba obsahu: desc, h1, short), tools/og/cards.json (title + alt), and assets/js/story.js COPY if it contains the phrase.
- Grep for "palec" to find them all, then regenerate: python3 tools/build_pages.py and node tools/og_build.mjs.
- In the story, the highlighted mark word changes from "palec." to "scroll."; keep the underline mark working.
Verify with screenshots (tools/shot.sh 1440 900 <out> <url>; tools/mshot.sh 844 <out> </path>; one Chrome at a time; scratch in ${SCR}/web/) and view the new tvorba-obsahu OG image. Use small Edit replacements; other agents edit story.js. Report.`, { label: 'tokens:web+og', phase: 'Tokens', schema: REPORT }),
  () => agent(`${DEC}\n\nINSTAGRAM KIT: ${IG} (generators in _src/: kit.css, kit.js, kit.html, preview.html, build.mjs; PLAN.md; captions in feed/*/caption.txt and alt.txt, highlights.txt, stories.txt, reel/caption.txt).\nTASK: apply the tokens and the SCROLL copy rule to every static template, caption, alt text and PLAN.md (also fix where PLAN.md says the ty/vy question is open: the mascot and IG use ty, the agency uses vy). Then regenerate ALL static PNGs and _preview images EXCEPT the Reel: another agent now owns _src/reel.html, _src/record_reel.mjs and reel/, so do not touch those. Verify by viewing the profile-grid preview, a few posts and the avatar at 110px. One Chrome at a time; scratch in ${SCR}/ig/. Report.`, { label: 'tokens:instagram', phase: 'Tokens', schema: REPORT }),
])

const FIGMA = `Figma file key 4OdxiJ5jvTf0SMYucdkwtK (editable working copy).
- First load the tools via ToolSearch: select:mcp__c821381b-133f-4d7f-8513-e5c3a5701901__get_figma_skill,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__use_figma,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__upload_assets,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__get_screenshot.
- Before any use_figma call you MUST read the skill: get_figma_skill uri "skill://figma/figma-use/SKILL.md", and pass skillNames "resource:figma-use" on every use_figma call.
- UPLOADING: create correctly sized rectangles (exact pixel sizes) with use_figma, then call upload_assets with count N, currentPageId and nodeIds (one per rectangle), scaleMode FIT, and POST each file immediately with curl -s -X POST -H "Content-Type: image/png" --data-binary @file "<submitUrl>". URLs are single-use and expire in 10 minutes, so work in batches of at most 15.`

phase('Reel')
const REEL = `${DEC}\n\nTHE REEL: ${IG}/_src/reel.html (seekable, window.ReelSeek(t), 1080x1920, live mascot rig), recorded by ${IG}/_src/record_reel.mjs to ${IG}/reel/sparkee-reel.mp4 plus reel/cover.png and reel/caption.txt. See ${IG}/_preview/reel-contact-sheet.png for the current version (18.4 s: the hook "Jiné agentury mají logo. Tahle má mě ✦", the mascot hops out of the logo, then chaos → plan → content → numbers → "Sleduj mě ✦", looping back to the logo). ffmpeg: ${FF}.
CLIENT FEEDBACK on the Reel:
(1) "You put the logo in wrong, the final one where he is lying." The logo moments must use the OFFICIAL logo exactly: assets/img/logo-light.svg on dark, or the original assets/img/logo.svg / assets/figma/logo-full.svg vectors. The mascot lies on the wordmark exactly as in the logo, with the same position, scale and tilt, and pixel-identical.
- The official wordmark shares outline shapes with the lying mascot (the "a"/"r" letters join the mascot outline). NEVER show the wordmark with the mascot cut out and broken letters. NEVER show a mascot lying at a wrong spot or scale on the wordmark.
- The opening frame and the final/loop frame must be the true logo.
- When the live mascot leaves the logo, or returns to it, hide the swap inside a motion moment (a sparkle burst, a hop at peak speed, a quick glow) so the logo is always either complete or not shown.
(2) Copy: no "zastaví palec". Use the SCROLL wording, e.g. "Obsah, který zastaví scroll.".
(3) "Still refine the animation." Make it feel as polished as a top motion studio: clear pacing (every text readable for at least ~1.2 s), stronger transitions between beats (continuous, no pops), more mascot acting (anticipation, follow-through, secondary motion), better use of the frame (bigger mascot and props, balanced), IG safe zones (no text in the top ~220px, the bottom ~420px or the right ~120px), a punchy hook in the first second, a satisfying end card and a seamless loop.
The brand rule stays: never deform the mascot (uniform scale only).`
const STATIC_FIG = `${FIGMA}\n\nTASK (part 1 of 2, STATIC): import the (regenerated) Instagram kit from ${IG} into the Figma page "📱 Instagram" (page id 191:2). It already has 4 sections, each with a title and a placeholder description text: Profil 191:4, Feed · prvních 9 příspěvků 191:7, Stories 191:10, Reel 191:13.
- Replace the placeholders in Profil, Feed and Stories, and resize the sections to fit. Do NOT touch the Reel section yet; another step fills it later.
- Profil: the avatar variants plus a circular 110px preview; the 5 highlight covers with names; the _preview profile-grid image(s); a text block with the handle ideas, name, bio and links from PLAN.md.
- Feed: the posts P1-P9 in order, each labelled (e.g. "P4 · Carousel 5 chyb"). Show covers at their native size. For P1 (the Reel), use its current cover and label it "P1 · Reel Ahoj (cover se aktualizuje)". Lay carousel slides out in a row. Place caption.txt (and alt.txt) next to each post in a readable text box (Inter 20px, width 800).
- Stories: all PNGs in order with labels, plus the notes from stories.txt.
Layout: auto-layout frames with 40px gaps and white cards with 24px radius on a Mist background. At the end, take get_screenshot of each filled section and fix any overlap, cropping or missing items. Report node ids, including the P1 cover node id.`
const [reelOut, figStatic] = await parallel([
  async () => {
    const refine = await agent(`${REEL}\n\nTASK: fix the logo moments, apply the copy, and refine the animation in reel.html. Then re-record the MP4 and cover and update caption.txt. Verify by extracting frames every 0.5 s (and every 1/30 s around the logo transitions) and viewing them. Save scratch in ${SCR}/reel/. Report exactly how the logo is now handled.`, { label: 'reel:refine', phase: 'Reel', schema: REPORT })
    const NOTES = { type: 'object', properties: { verdict: { type: 'string', enum: ['great', 'good', 'meh', 'broken'] }, notes: { type: 'array', items: { type: 'object', properties: { t: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['problem', 'fix'] } } }, required: ['verdict', 'notes'] }
    const revs = await parallel([
      'LOGO + BRAND QA: compare the logo frames (the first frame, the last frame, and every frame where the wordmark is visible) against assets/img/logo-light.svg rendered at the same size. Any broken letters, a mismatched mascot position/scale/tilt, a wrong logo file, or a pop at the swap? Also check the palette (ink #2C303C, web pastels) and that "palec" no longer appears.',
      'MOTION DIRECTOR: pacing, readability, transitions, mascot acting, composition, safe zones, hook, end card, loop. Extract frames every 0.25 s. Be demanding and give concrete timing/easing fixes.',
    ].map((l, i) => () => agent(`${REEL}\n\nReview the refined Reel (report: ${JSON.stringify(refine)}). Lens: ${l}\nDo not edit files. Scratch in ${SCR}/reelrev${i}/.`, { label: `reel:review${i + 1}`, phase: 'Reel', schema: NOTES })))
    const reel = await agent(`${REEL}\n\nApply these review notes (JSON): ${JSON.stringify(revs.filter(Boolean))}. Re-record the MP4 and cover, regenerate ${IG}/_preview/reel-contact-sheet.png, update the Reel P1 grid cover in feed/01_* if it derives from reel/cover.png, verify, and report.`, { label: 'reel:iterate', phase: 'Reel', schema: REPORT })
    
    return { refine, revs, reel }
  },
  () => agent(STATIC_FIG, { label: 'figma:static', phase: 'Figma', schema: REPORT }),
])
const { refine, revs, reel } = reelOut
phase('Figma')
const figma = await agent(`${FIGMA}\n\nTASK (part 2 of 2, REEL): the static kit is already imported into page 191:2 (report: ${JSON.stringify(figStatic)}). Now fill the Reel section 191:13, replacing its placeholder:
- the new cover;
- 8 key frames extracted from the final MP4 ${IG}/reel/sparkee-reel.mp4 (ffmpeg: ${FF});
- the caption from reel/caption.txt;
- the audio suggestion from reel/README.txt;
- a note that the MP4 is at social/instagram/reel/sparkee-reel.mp4 in GitHub repo martindragusinec-glitch/sparkee.
Also replace the image fill of the P1 cover in the Feed section with the new feed/01_* cover (or reel/cover.png), and remove the "(cover se aktualizuje)" note. Use the same layout style. Finish with get_screenshot of the Reel section and the Feed section, and fix any issues. Report.`, { label: 'figma:reel', phase: 'Figma', schema: REPORT })

phase('Check')
const check = await agent(`${FIGMA}\n\nRead-only adversarial check. Do not edit.
1) Screenshot each Figma section on page 191:2 and confirm: all 9 posts, the carousel slides, 5 highlights, avatar, stories and the reel frames are present and labelled; nothing cropped or overlapping; captions readable; no "palec" in the captions.
2) grep ${ROOT} (excluding node_modules) for #272A33, the old Figma pastels, and copy "zastaví palec" / "zastavím palec".
3) Extract the first and last frames of the Reel MP4 and compare them with the official logo.
Report the gaps.`, { label: 'check', phase: 'Check', schema: REPORT })
return { web, ig, refine, reviews: revs.filter(Boolean), reel, figStatic, figma, check }