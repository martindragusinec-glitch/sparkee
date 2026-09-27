export const meta = {
  name: 'sparkee-brand-manual-v3',
  description: 'Brand manual v3: chapter openers = client-chosen V1 → implement Slide/Chapter + cover; finish chapters 00-15 (gradient rule, no plates, no clip content); pass; review; fix + finish; export the whole manual to PDF',
  phases: [
    { title: 'Openers', detail: 'V1 (client choice) → implement Slide/Chapter + cover → air fix' },
    { title: 'Chapters', detail: '7 owners continue 00-15 with corrected rules' },
    { title: 'Pass', detail: 'final pass over every chapter opener + gradient/plate/clip sweeps' },
    { title: 'Review', detail: 'one combined reviewer (rate-limit aware)' },
    { title: 'Fix', detail: 'apply notes, index links, brand-kit, final sweeps' },
    { title: 'PDF', detail: 'export every slide as vector PDF, merge in order' },
  ],
}
const ROOT = '/Users/martinwork/Downloads/lp-tracking-standard/sparkee-web'
const OUTLINE = ROOT + '/tools/brand/OUTLINE.md'
const FOUND = ROOT + '/tools/brand/foundations.json'
const SCR = '/private/tmp/claude-501/-Users-martinwork-Downloads-lp-tracking-standard/9ac86e71-2100-45ed-b455-ab6c65877598/scratchpad/brand3'
const FIGMA = `FIGMA: file 4OdxiJ5jvTf0SMYucdkwtK (the editable working copy).
- Load the tools via ToolSearch: select:mcp__c821381b-133f-4d7f-8513-e5c3a5701901__get_figma_skill,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__use_figma,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__upload_assets,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__get_screenshot,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__get_metadata.
- Before any use_figma call, read get_figma_skill uri "skill://figma/figma-use/SKILL.md" (plus figma-generate-library / figma-generate-design SKILL.md if needed). Pass skillNames "resource:figma-use" on every use_figma call.
- Uploads: upload_assets gives single-use URLs that expire in 10 min, so use batches of at most 15. Create sized rectangles and pass nodeIds + scaleMode FIT for PNGs, then POST with curl -s -X POST -H "Content-Type: image/png" --data-binary @file "<url>". For SVG, use -F "file=@path;type=image/svg+xml" to get editable vectors.
- CONCURRENCY: several agents work in this file at the same time: 4 chapter owners on "📘 Brand Manual" (197:286), an opener designer on "🧱 Knihovna" (197:287), and a separate dark-logo workflow on "🧪 Logo dark" and "🌟 Brand Identity" (47:2). Touch ONLY what you own. Switch pages at most once per script. Screenshots: get_screenshot, scratch PNGs in ${SCR}/.`
const GRAD = `GRADIENT TEXT, THE CLIENT'S RULE. The client has complained twice ("gradient na textu máš špatně"). This overrides every earlier note, including the old paint styles "Holo/Text na světlé" and "Holo/Ink" (both now renamed "⛔ Vyřazeno ...", never use them):
- Match the client's own original exactly (page "🌟 Brand Identity" 47:2: "Aa" 50:26 and "sparkee.cz" 59:11). It is a PASTEL holo gradient on a 45° DIAGONAL, top-left to bottom-right: mint #A5EDC5 0% → sky #9AD8F8 38% → lilac #C49CF2 72% → blush #F5B8DC 100%. In Figma this is the paint style "Holo/Text · jen na tmavé" (gradientTransform [[0.7071,0.7071,0],[-0.7071,0.7071,0.5]]); apply it as the whole node's fill so it spans exactly the word or number.
- Use it ONLY on dark ink backgrounds (#2C303C, the Canvas/Dark canvas, near-black), and only on one short accent word, a big chapter number, or a small brand line like "sparkee.cz". Never on whole headlines or body text.
- On LIGHT backgrounds, NEVER put a gradient on text. That means no pastel gradient, and no saturated/darker gradient such as #1FA37A→#2A92D6→#7C5CE0→#D25A9E (that was our mistake). Text on light is solid ink #2C303C (Sparkee/Ink).
  - If an accent is needed on light, put the holo UNDER the text as a fill: a soft pastel holo marker bar behind the lower half of the word (like a highlighter, not crossing descenders), or a holo pill with ink text (the client's CTA style).
  - The client's own light layouts use no gradient text at all, and even their dark IG mockup headline is plain white.
- Zoom in on every gradient with get_screenshot to verify it.`
const PLATE = `LOGO ON DARK, THE CLIENT'S RULE (27. 9.): "takhle přesně logo na tmavý nechci dávat" means NEVER put the logo on a light plate/badge/štítek on a dark background.
- A true dark variant is being designed right now by another workflow: a die-cut version with mist letters cut out evenly around the mascot. It will appear as the Figma component "Logo/Dark" on page 47:2 (and ${ROOT}/assets/img/logo-dark.svg).
- Where a logo must sit on dark:
  - use Logo/Dark if it already exists;
  - if not, move the logo to a light area (the official Primary 124:3 / library clone 200:2 directly on paper or mist, with no plate);
  - or else leave a clearly named empty frame "Logo/Dark slot" and list it under open.
- Remove every existing plate in your scope. One example is the cover 00.00 (202:18), whose frame 208:1557 "Logo · světlá podložka" holds instance 202:23.`
const CLIP = `CLIP CONTENT, THE CLIENT'S RULE (27. 9.): "často dáváš na sekce clip content a nejde pak vidět shadows". Figma createFrame()/createAutoLayout() default to clipsContent = true, which cuts shadows, glows and overhangs.
- Set clipsContent = false on EVERY container you create or touch: boards, cards, auto-layout groups and component frames.
- Keep clipsContent = true only where the crop is intentional: the 1920x1080 slide frames themselves (glows ending at the slide edge), image/phone-screen masks, a mascot deliberately peeking from an edge, and dark cards whose inner glow must stay inside.
- Verify that no drop shadow is cut. Note that absoluteRenderBounds is already clipped by the parent, so compute the shadow extent from the effects.
- A ready sweep script is ${ROOT}/tools/figma/unclip_sweep.js (one page per use_figma call; set PAGE).`
const AIR = `LAYOUT AIR + ALIGNMENT, THE CLIENT'S RULE (27. 9.). On the 07.00 opener the client wrote: "ještě pozor na zarovnání, vzduch.. teď je to naplácané na tom textu ty obrázky", and then "je to globálně". The images and visuals were stuck onto the text blocks, and this happens across the whole manual.
- Every slide is 1920x1080 on the 12-column grid: 80px margins, 132px columns, 16px gutters. The header sits in the top band (y 28-60) and the footer at y 1008. Content lives in y 140-940.
- Visuals (images, mascot, logos, mockups, shapes, cards) NEVER touch or overlap text blocks. Keep at least 80px of clear space between a visual and any text block, 48px between sibling cards, and 24px between a caption and its image.
- Give each visual its own slot. Centre it in the slot with inner padding, instead of pinning it to the slot edge next to text.
- Align blocks to shared edges and baselines: equal column tops, equal bottoms, consistent card heights in a row.
- Whitespace should be intentional and balanced, never cramped. If content does not fit, reduce or scale the visual, or split the slide into two. Never squeeze.
- Verify programmatically on every slide you build or touch: collect the absoluteBoundingBox of every text node and every visual block (frames/instances/images/vectors that are not text containers). Report any text-vs-visual intersection or gap under 80px, and any card-vs-card gap under 48px. Fix them, then screenshot.`
const RATE = `FIGMA RATE LIMIT (critical): this account's Figma MCP allows about 15 calls per minute across ALL agents, and there may be a daily cap. At 22:45 the whole run stalled on it.
- Be frugal. Batch many edits into ONE use_figma script.
- Take screenshots inside that same script with await node.screenshot({scale:0.5}); do not use separate get_screenshot/get_metadata calls unless you have to.
- Never poll.
- If a call fails with a rate-limit or "tool call limit" error, wait 60-90 s (Bash sleep in the background, or a Monitor) and retry up to 5 times. If it still fails, stop and report exactly what is left.
- If writes fail with "read-only file or mode", report it immediately; do not retry for minutes.`
const BRAND = `SPARKEE BRAND MANUAL in Figma, "modelled on big companies (GitHub, Duolingo, Mailchimp, Slack), with everything that's needed". THE PLAN: ${OUTLINE} (Czech). Read it: chapters 00-15, slide lists, 1920x1080 grid.
FOUNDATIONS ALREADY BUILT (reuse them, do not rebuild): read ${FOUND}. It covers:
- the pages "📘 Brand Manual" (197:286) and "🧱 Knihovna" (197:287);
- the variable collections, the text/paint/effect styles and the grid styles;
- the components Slide/Base, Slide/Chapter (200:230), Slide/Header, Slide/Footer, Doc/*, Logo, Jiskra and Doc/Status badge;
- one Section per chapter (00 · Úvod 202:2 … 15 · Ke stažení 202:17).
FINAL CLIENT DECISIONS:
- Colours: ink #2C303C; web pastels mint #A5EDC5, sky #9AD8F8, lilac #C49CF2, blush #F5B8DC; paper #F6F4EF for the web, mist #F5F4FB for social.
- The mascot is named Sparkee. Tone: the mascot uses "ty" (IG/social), the agency uses "vy" (web, offers, contracts). Claim: "Dodáme jiskru vašim sociálním sítím". Say "zastaví scroll", never "zastaví palec".
- The mascot is never deformed. Its head is straight when standing and tilted only in the lying logo pose. Its arms are round.
- LOGO:
  - The ONLY official logo is Figma node 124:3 (Logo / Primary on 47:2).
  - Mono = 124:208; Mono Holo = 124:311. Library clones: Logo Primární 200:2, Mono ink 206:463, Mono Holo 207:2267.
  - "Světlá" (200:3) and "Mono bílá" (206:566) are retired: never use them.
  - Never recolour the logo, never cut the mascot out of the wordmark, and never place the mascot on the wordmark differently from 124:3.
- NO status badges: no Doc/Status badge, no "K potvrzení" footer variant (footers = Standard). Remove any you find.
- Czech copy in the brand tone, no em/en dashes, real content (no lorem ipsum), premium and consistent.
${GRAD}
${PLATE}
SOURCE ASSETS in ${ROOT}:
- assets/img/logo.svg, logo-mono.svg;
- poses assets/img/poses/*.svg (prefer the Maskot/* component instances on page 186:2);
- tokens in assets/css/site.css;
- motion in assets/js/mascot.js and story.js;
- OG images assets/img/og/*.jpg;
- Instagram kit social/instagram;
- videos assets/video/*.mp4;
- previews tools/preview-*.png.
Other Figma pages: 186:2 "🧩 Maskot – pózy", 191:3 "🎬 Animace 20 s", 191:2 "📱 Instagram".`
const REPORT = { type: 'object', properties: { done: { type: 'array', items: { type: 'string' } }, node_ids: { type: 'string' }, open: { type: 'array', items: { type: 'string' } } }, required: ['done', 'open'] }
const OPENER_CTX = `THE CLIENT ASKED: "úvodní stránky pozicuj hezčeji" about the chapter opener slide 04.00 · Maskot · Kapitola (207:3171). It is an instance of the component Slide/Chapter (200:230, on page "🧱 Knihovna" 197:287; children: glow ellipses, Hlavička, Kapitola, V kostce, Patička). Other openers: 03.00 · Logo · V kostce (213:1531) and 07.00 · Grafické prvky · Kapitola (215:4452). The cover is 00.00 (202:18).
WHAT IS WRONG NOW (1920x1080 dark canvas):
- The layout is a weak grid. The big gradient number + title + lede sit in the upper-left and leave the lower-left empty.
- The three "V kostce" cards float at vertical centre on the right, aligned to nothing, too wide for their short lines.
- There is no chapter visual at all (a Maskot chapter without the mascot!), so it reads templated, not premium.
GOAL: chapter openers that look like a top brand manual (Mailchimp, Duolingo, Slack, GitHub Primer brand): a confident grid (80px margins, 12 columns), everything anchored to shared baselines/edges, clear hierarchy, generous but intentional whitespace, and a strong per-chapter visual from real assets (Maskot/* pose instances from 186:2, the Logo component, Jiskra, colour swatches, "Aa" type specimen, UI bits, IG tiles). It must work as ONE reusable system for all 16 chapters (00-15) with short and long titles ("Ke stažení a správa značky").`
const VARS = [
  { k: 'V1', d: 'ANCHORED SPLIT: left 6 columns hold the text block anchored to a common bottom baseline above the footer (eyebrow "Kapitola 04", a huge chapter number, the title, the lede at max ~620px). The right 6 columns hold a large chapter visual on a soft holo glow that may bleed off the right/bottom edge. "V kostce" is a compact numbered list (no big boxes) aligned to the same baseline as the lede.' },
  { k: 'V2', d: 'POSTER: the chapter number as a giant watermark (very low opacity, or an outline) behind everything; the title very large, left, vertically centred; the visual on the right; the three key points as 3 columns along the bottom with hairline dividers, sitting just above the footer.' },
]
const PICK = { type: 'object', properties: { winner: { type: 'string' }, ranking: { type: 'array', items: { type: 'string' } }, why: { type: 'string' }, grafts: { type: 'string' }, spec: { type: 'string' } }, required: ['winner', 'ranking', 'why', 'spec'] }

const openersFlow = async () => {
  const variants = await parallel(VARS.map((v, i) => () => agent(`${BRAND}\n\n${FIGMA}\n\n${OPENER_CTX}\n\nYOU ARE OPENER DESIGNER ${v.k}. Direction: ${v.d}\nTASK:
- On page "🧱 Knihovna" (197:287), create a Section "🧪 Úvod kapitoly · varianta ${v.k}". Place it below all existing content (lowest bottom edge of the existing nodes that are not "🧪 Úvod kapitoly" sections, + 400), at x = ${i * 6600}.
- Inside the section, build three 1920x1080 frames as plain frames (do NOT edit the Slide/Chapter component or the real slides): your redesigned openers for 03 Logo, 04 Maskot and 07 Grafické prvky.
  - Use the real copy from the existing openers (213:1531, 207:3171, 215:4452; read their texts) and real assets (instances of Maskot/* from 186:2, the Logo component, Jiskra).
  - Use the library styles and variables (Canvas/Dark, text styles, Slide/Header + Slide/Footer instances).
  - The big chapter number: gradient text on dark follows the rule (paint style "Holo/Text · jen na tmavé").
  - Any logo on this dark canvas: follow the logo-on-dark rule (no plate).
- Add a 4th small frame "Pravidla systému" that explains the fixed parts vs. what changes per chapter (the visual slot, the long-title behaviour).
- Screenshot every frame and iterate until it is premium: alignment, spacing and hierarchy, with no clipped text and no overlaps.
- Report the section id, the frame ids and your layout spec (grid columns, sizes, positions, text styles).`, { label: `opener:${v.k}`, phase: 'Openers', schema: REPORT })))
  const pick = { winner: 'V1', ranking: ['V1', 'V2'], why: 'THE CLIENT CHOSE V1 (27. 9. 2026: "v1 úvodky mi přijdou fajn"). V1 is final; do not redesign it, implement it faithfully.', grafts: 'None, unless a detail clearly improves V1 without changing its look.', spec: 'Use the V1 layout spec from the V1 report exactly (grid, fixed lines, the text column anchored to the bottom, the number style, the visual slot, the V kostce list). The V1 reference frames are in the section "🧪 Úvod kapitoly · varianta V1" on 197:287 (for example 04.00 Maskot V1 = 221:4867, 03.00 Logo V1 = 221:7970, 07.00 V1 = 221:6570, and the long-title demo 221:11126).' }
  const impl = await agent(`${BRAND}\n\n${FIGMA}\n\n${OPENER_CTX}\n\nYOU OWN: the component Slide/Chapter (200:230), every chapter opener slide "NN.00" in the manual (currently 03.00 213:1531, 04.00 207:3171, 07.00 215:4452; chapter owners are creating more right now), and the cover 00.00 (202:18).
CLIENT DECISION: ${JSON.stringify(pick)}
${CLIP}
VARIANTS: ${JSON.stringify(variants.filter(Boolean))}
TASK:
1) Rebuild the component Slide/Chapter (200:230) to match V1 exactly (the client's choice). Compare your result side by side with the V1 reference frames.
   - KEEP the existing text layer names and hierarchy wherever possible, so the overrides on the existing instances survive. Check the instances before and after.
   - Add a visual slot as an INSTANCE_SWAP component property "Vizuál". Create small components "Kapitola/Vizuál/NN · <name>" in Knihovna for chapters whose visual is not already a component (for example colour swatches for 05, an "Aa" specimen for 06, icons for 08, a UI card for 09, an IG tile for 12, a business card for 13, a download stack for 15). Use Maskot/* poses for 00, 01, 02, 04 and 11, the Logo component for 03, Jiskra/elements for 07, and so on, one fitting visual per chapter.
   - Chapter numbers use the paint style "Holo/Text · jen na tmavé".
2) Update the existing opener instances: reset any overrides that fight the new layout, set the right Vizuál, and verify the texts.
3) Redesign the cover 00.00 (202:18) in the same visual language. It is a real brand-manual cover: title "Brand manuál", version 1.0, 27. 9. 2026, the claim, and the official logo following the logo-on-dark rule. Remove the plate frame 208:1557. If Logo/Dark does not exist on 47:2 yet, compose the cover so the official Primary logo sits on a light area with no plate, or leave a "Logo/Dark slot"; say which in open.
4) Delete every "🧪 Úvod kapitoly · varianta" section (V1, V2 and a partial V3 from a stopped run) once the component matches V1.
5) Screenshot the component, the cover and each existing opener at maxDimension 1600, and fix issues.
Report the node ids and the list of Vizuál components.`, { label: 'opener:implement', phase: 'Openers', schema: REPORT })
  const air = await agent(`${BRAND}\n\n${FIGMA}\n\n${CLIP}\n\n${AIR}\n\nYOU OWN the component set Slide/Chapter (240:17841, including all its variants such as the dark 200:230) and the "Vizuál kapitoly" / "Kapitola/Vizuál/*" components the implementer just built (report: ${JSON.stringify(impl)}).
CLIENT FEEDBACK on 07.00 · Grafické prvky · Kapitola (215:4452): the visual (the shapes and the "Chci jiskru" pill) sits right on the "V kostce" list. The measured cause, in 200:230: the instance "Vizuál kapitoly" is at x 968, y 100, 872x650, so it ends at y 750, while the frame "V kostce" starts at y 741. That is 9px of overlap, and the visuals are bottom-heavy inside the slot.
TASK:
1) Re-layout the right column in EVERY variant of the component:
   - The visual slot ends at least 80px above the V kostce block (for example slot y 120 to 640, or whatever keeps the V1 look balanced).
   - V kostce stays anchored at the bottom, with its last line on the same baseline as the left text column.
2) Make every Kapitola/Vizuál/* component fit the new slot:
   - its content is centred optically, with inner padding of at least 40px;
   - nothing bleeds out of the slot bottom;
   - glows may extend, but must stay behind and soft;
   - no hard shape comes closer than 80px to the text.
3) Check all 16 openers (00-15) and the cover:
   - collect their bboxes and prove, per opener, that there is no visual/text intersection and that every gap is at least 80px;
   - then screenshot them all at maxDimension 1200 and view them.
Report the new geometry and the per-opener gap table.`, { label: 'opener:air', phase: 'Openers', schema: REPORT })
  return { variants: variants.filter(Boolean), pick, impl, air }
}

const GROUPS = [
  { key: 'A', ch: '00 Úvod (NOT the cover 00.00, which the opener designer owns; you own the other intro slides: how to use the manual, the quick start one-pager, the index), 01 Značka (story, mission, values, positioning, audience), 02 Hlas a tón (voice pillars, the ty/vy rule per channel, before/after examples, vocabulary including "scroll", CTA wording, emoji/✦ rules)' + ' ' + RATE },
  { key: 'B', ch: '03 Logo (Primary, Mono, Mono Holo, a "Logo na tmavém pozadí" slide that uses Logo/Dark when it exists and otherwise a named "Logo/Dark slot", clear space, minimum size, backgrounds, 12 misuse examples built from the real logo INCLUDING "logo on a light plate on dark" as a DON\'T, the logo + mascot relationship), 05 Barvy (palette HEX/RGB/CMYK approx, holo gradient spec, the GRADIENT TEXT RULE as a clear do/don\'t with real rendered examples: DO pastel diagonal "jiskra" on ink; DO ink word + holo marker on light; DON\'T any gradient text on light, showing the saturated one crossed out; DON\'T a gradient on a whole headline; plus usage ratio, contrast matrix, don\'ts), 06 Typografie (Baloo 2 + Nunito, scale, hierarchy, Czech diacritics sample, the gradient-word rule, web fallbacks). Also FIX the existing slide 03.01: the claim "Jedna kresba, celá jiskra." (frame 213:1911, word node 213:1915) has a saturated gradient on light; make it solid ink with a holo marker behind "jiskra.", or move the claim onto a dark area and use the pastel diagonal.' + ' ' + RATE },
  { key: 'C', ch: '04 Maskot (who Sparkee is, anatomy/proportions from the real vectors, rig map with joints, pose library from the Maskot/* instances, expressions normal/happy/surprised, do/don\'t: deformation, head tilt, arm shape, colours, when not to use him, the standing vs lying rule with the logo lying pose = 124:3, scale relationship with UI/text, sticker usage). Delete your old staging frame "c04 staging" (207:1824) when you no longer need it.' + ' ' + RATE },
  { key: 'D1', ch: '07 Grafické prvky (9 slides, largely built: finish and fix them), 08 Ikony (4 slides), 09 UI komponenty webu (6 slides: buttons, cards, chips, forms, website screenshots from tools/preview-*.png and live screenshots of http://localhost:8770). Also clean the leftovers of the interrupted run: the icons section 207:2571 and UI web components 207:2981 (reuse them if good, delete them if broken or duplicate).' + ' ' + RATE },
  { key: 'D2', ch: `10 Fotografie a video (5 slides exist) and 11 Motion (10 slides exist). These are built: VERIFY them against the outline, the gradient rule, AIR and CLIP, fix what is off, and fill any P1 gap. Keep Figma calls minimal. ${RATE}` },
  { key: 'D3', ch: `12 Sociální sítě (13 slides exist: verify and fix quickly) and 13 Aplikace (EMPTY: build all 10 slides from the outline: the opener 13.00 from Slide/Chapter variant Tmavá with Vizuál#240:8 = 239:15777 and \'Číslo od 10\' = true, then business card front/back, e-mail signature, presentation slide template, offer header, stickers and the rest of the outline list; on dark use the component Logo/Dark 242:18881 from page 47:2, which now exists). ${RATE}` },
  { key: 'D4', ch: `14 Přístupnost (5 slides exist: verify) and 15 Ke stažení a správa značky (4 of 6 exist: build the missing ones from the outline: downloads, file naming, owner/contact, changelog, versioning; the downloads point to the repo folder brand-kit/ and to the PDF brand-kit/Sparkee-brand-manual-v1.0.pdf). ${RATE}` },
]
const chapterAgent = g => agent(`${BRAND}\n\n${FIGMA}\n\nYOU OWN ONLY THESE CHAPTERS: ${g.ch}.
CONTEXT: a previous run was stopped mid-way (20:44), because its gradient rule was wrong. Current slide counts (21:35): 00=6, 01=9, 02=10, 03=13, 04=15, 05=13, 07=9; 06 and 08-15 are EMPTY (the outline plans 06=9, 08=4, 09=6, 10=4, 11=10, 12=13, 13=10, 14=4, 15=6). Earlier runs also left duplicates. Work fast but premium: the client is waiting for the finished manual and its PDF.
- Inspect your sections first and keep the good slides.
- Fix every gradient text and every logo plate in your slides to the rules above.
- Remove status badges, then finish the rest.
- Build slides as instances of Slide/Base inside your chapter Sections on "📘 Brand Manual", following the outline's slide lists (P1 is mandatory, P2 where sensible). Use real assets, bind colours to variables and use the text styles.
CHAPTER OPENERS: each chapter starts with "NN.00 · <Name> · Kapitola", an instance of Slide/Chapter.
- The opener designer is rebuilding that component right now to the client-approved V1 layout (text anchored to the bottom left, a big chapter visual on the right, V kostce as a compact numbered list), and owns the openers' layout.
- For your chapters, create the opener instance if it is missing, set only its texts (number, title, lede, the 3 V kostce points), and set the "Vizuál" property if the component already has it.
- Do not move, resize or restyle opener internals, and never edit the component.
${CLIP}
${AIR}
FIRST re-space every EXISTING slide in your chapters to the AIR rule (the client flagged it globally), then build the missing ones to the same standard.
Verify each chapter with get_screenshot (scratch in ${SCR}/${g.key}/), and fix clipped text, overlaps, cut shadows and empty areas. Report the slide counts and node ids.`, { label: `chapters:${g.key}`, phase: 'Chapters', schema: REPORT })
// two waves of 3 agents each, to respect the Figma MCP limit (about 15 calls/min)
const WAVE1 = ['D3', 'D4', 'D2'], WAVE2 = ['A', 'C', 'D1', 'B']
const chaptersFlow = async () => {
  const w1 = await parallel(GROUPS.filter(g => WAVE1.includes(g.key)).map(g => () => chapterAgent(g)))
  const w2 = await parallel(GROUPS.filter(g => WAVE2.includes(g.key) && g.key !== 'B').map(g => () => chapterAgent(g)))
  return [...w1, ...w2]
}

const [openers, chapters] = await parallel([openersFlow, chaptersFlow])

phase('Pass')
const pass = await agent(`${BRAND}\n\n${FIGMA}\n\nFINAL PASS on "📘 Brand Manual" (197:286). ${RATE}
Logo/Dark now EXISTS: the component 242:18881 on 47:2 (file assets/img/logo-dark.svg). Put it into every "Logo/Dark slot" and onto any dark slide that needs a logo. The opener designer rebuilt Slide/Chapter (report: ${JSON.stringify(openers && openers.impl)}; client-chosen spec: ${JSON.stringify(openers && openers.pick)}). The chapter owners reported: ${JSON.stringify((chapters || []).filter(Boolean))}.
TASK:
1) Every chapter 00-15 must have exactly one opener "NN.00 · <Name> · Kapitola" (the cover is 00.00). Each opener must be an instance of the new Slide/Chapter with the right texts and Vizuál, no override that breaks the layout, the number using "Holo/Text · jen na tmavé", and the long titles fitting. Screenshot all 16 at maxDimension 1200 and fix them.
2) GRADIENT SWEEP of the whole manual page and "🧱 Knihovna":
- Run a use_figma script that finds EVERY text node (including inside instances) whose fills or styled segments contain a GRADIENT paint. For each, find the effective background behind it (the nearest ancestor or underlying sibling with a solid or gradient fill) and classify it light or dark by luminance.
- On light: replace the gradient with solid Sparkee/Ink and add a holo marker behind the word if it was an accent.
- On dark: make the paint exactly "Holo/Text · jen na tmavé".
- Also flag gradients on whole headlines or body text.
- Detach nothing unnecessarily; fix main components when the gradient comes from a component.
- Return the before/after counts.
3) PLATE SWEEP: find any logo instance sitting on a light plate over a dark background, and fix it by the logo-on-dark rule.
4) Remove any leftover staging frames, duplicates and status badges, and set every footer to Standard.
5) CLIP SWEEP: run tools/figma/unclip_sweep.js on 197:286 and 197:287. ${CLIP}
6) AIR SWEEP over EVERY slide on 197:286:
   - run the programmatic AIR check per slide and list the violations;
   - fix each one by moving, resizing or rebalancing, never by squeezing;
   - re-run until there are 0 violations, then screenshot the slides you changed.
   ${AIR}
Report the counts, the ids and whatever is still open.`, { label: 'pass', phase: 'Pass', schema: REPORT })

phase('Review')
const NOTES = { type: 'object', properties: { verdict: { type: 'string' }, notes: { type: 'array', items: { type: 'object', properties: { where: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['where', 'problem', 'fix'] } } }, required: ['verdict', 'notes'] }
const revs = await parallel([
  'ART DIRECTOR + COMPLETENESS (one reviewer, to save Figma calls): screenshot every section in ONE use_figma call per section (node.screenshot at scale 0.25 of the whole section, then zoom only into suspicious slides). Judge it against top brand manuals and the client-approved V1 openers: grid, air (no visual within 80px of text), typography, hierarchy, do/don\'t clarity, cut shadows, gradient rule, plates, tone, "scroll", mascot rules, leftover badges or duplicates, lorem ipsum, dashes and typos. Check completeness against OUTLINE.md (every P1 slide present in 00-15?). Give concrete fixes per slide.',
].map((l, i) => () => agent(`${BRAND}\n\n${FIGMA}\n\n${RATE}\n\nRead-only review of the brand manual (pass report: ${JSON.stringify(pass)}). Lens: ${l}\nDo not edit. Scratch in ${SCR}/review${i}/.`, { label: `review:${i + 1}`, phase: 'Review', schema: NOTES })))

phase('Fix')
const fix = await agent(`${BRAND}\n\n${FIGMA}\n\n${CLIP}\n\n${AIR}\n\n${RATE}\n\nThe client asked: "dokonči brandmanual a pošli mi PDF". This is the finishing pass, so make it complete and premium.
Apply these review notes (JSON): ${JSON.stringify(revs.filter(Boolean))}. Build any missing P1 slides.
Then finish:
(1) The cover 00.00 is final: version 1.0, 27. 9. 2026, the official logo. If the component "Logo/Dark" now exists on 47:2 (the dark-logo workflow may have delivered it), use it in every "Logo/Dark slot" and on dark slides, and delete the slots.
(2) The index slide (00.0x Obsah) lists every chapter, with prototype links to every chapter divider and back-to-index links (the header "OBSAH" pill).
(3) A flow starting point for presentation mode on the cover.
(4) Export settings on the logo and mascot asset frames.
(5) In the repo, create ${ROOT}/brand-kit/ containing:
   - logo SVG/PNG: logo.svg, logo-mono.svg, and logo-dark.svg if it exists;
   - mascot poses SVG/PNG from assets/img/poses;
   - colour tokens as JSON, CSS and an ASE-compatible list;
   - font links;
   - a Czech README.
   Reference the kit on the "Ke stažení" slide.
(6) Final sweeps: the gradient rule, plates, status badges, the AIR check on every slide (0 violations), and tools/figma/unclip_sweep.js on 197:286 and 197:287.
Take final screenshots of the cover, the index and one slide per chapter, and report the node ids.`, { label: 'fix+finish', phase: 'Fix', schema: REPORT })

phase('PDF')
const pdf = await agent(`${FIGMA}\n\n${RATE}\n\nTASK: export the finished Sparkee brand manual (page "📘 Brand Manual" 197:286, file 4OdxiJ5jvTf0SMYucdkwtK) to ONE PDF for the client. The client is waiting, so be efficient: about 20 Figma calls in total.
1) In ONE use_figma call (read-only), list for each chapter Section (00 · Úvod … 15 · Ke stažení, in chapter order):
   - the section id and its absoluteBoundingBox;
   - every 1920x1080 slide frame inside it, with its id, name and absoluteBoundingBox, sorted by the "NN.MM" name prefix (the cover 00.00 first);
   - skip anything that is not a 1920x1080 slide.
2) PRIMARY, vector: for each Section, call download_assets (ToolSearch select:mcp__c821381b-133f-4d7f-8513-e5c3a5701901__download_assets) with nodeId = the section and defaultFormat "pdf". Download the export URL immediately with curl.
   - Then, with python3 pypdf, make one page per slide: take the section page, set its mediabox/cropbox to the slide's rectangle (in PDF points relative to the section origin; check the scale and the y-axis flip), and reuse the same content (copy the page object per slide, no re-rendering).
   - Check the file size. Shared content streams can bloat it; if the result is over 150 MB or looks wrong, use the fallback.
   FALLBACK, raster: get_screenshot of each Section at a maxDimension that gives a 1.5x slide scale. Crop every slide by its rectangle with PIL, then save it as a JPEG page of 1920x1080 pt at quality 92.
3) Merge in order into ${ROOT}/brand-kit/Sparkee-brand-manual-v1.0.pdf. Add bookmarks per chapter ("00 · Úvod" …) and metadata (Title "Sparkee · Brand manuál v1.0", Author "Sparkee").
4) Verify:
   - the page count equals the slide count;
   - render pages 1, 2, one per chapter and the last page to PNG (pypdf split + qlmanage -t -s 1600, or sips) and view them with Read: correct crop, fonts, gradients, images, nothing shifted;
   - report the file size, and also make a light web version (JPEG 85, 1920 px) if the main one is over 60 MB.
Report the path(s), the page count, the size and the per-chapter page ranges.`, { label: 'pdf', phase: 'PDF', schema: REPORT })
return { openers, chapters: (chapters || []).filter(Boolean), pass, reviews: revs.filter(Boolean), fix, pdf }