export const meta = {
  name: 'sparkee-dark-logo',
  description: 'Design a proper dark-background Sparkee logo from the official 124:3 vectors: separate geometry, 3 die-cut variants (výřez do textu kolem maskota), judge panel, deliver to repo + Figma + OG (no plates)',
  phases: [
    { title: 'Geometry', detail: 'separate letters vs mascot outline from 124:3' },
    { title: 'Variants', detail: '3 die-cut directions in parallel' },
    { title: 'Judge', detail: '3 judges: brand fidelity, small-size legibility, craft' },
    { title: 'Deliver', detail: 'refine winner, assets, Figma, OG' },
  ],
}
const ROOT = '/Users/martinwork/Downloads/lp-tracking-standard/sparkee-web'
const W = ROOT + '/tools/logo-dark'
const SCR = '/private/tmp/claude-501/-Users-martinwork-Downloads-lp-tracking-standard/9ac86e71-2100-45ed-b455-ab6c65877598/scratchpad/logodark'
const FIGMA = `FIGMA: file 4OdxiJ5jvTf0SMYucdkwtK (the editable working copy).
- Load the tools via ToolSearch: select:mcp__c821381b-133f-4d7f-8513-e5c3a5701901__get_figma_skill,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__use_figma,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__upload_assets,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__get_screenshot,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__download_assets.
- Before any use_figma call, read get_figma_skill uri "skill://figma/figma-use/SKILL.md", and pass skillNames "resource:figma-use" on every call.
- Other agents are building a brand manual and an Instagram page in the same file. Work only on a page named "🧪 Logo dark" (create it) and, at the end, next to the logo boards on "🌟 Brand Identity" (47:2). Do not touch other pages.`
const CTX = `CLIENT: Sparkee (Czech social media agency).
THE OFFICIAL LOGO is Figma node 124:3 (Logo / Primary on page 47:2), exported 1:1 as ${ROOT}/assets/img/logo.svg (viewBox 0 0 568 292). It is the "sparkee" wordmark in ink #2C303C, with the holographic star-head mascot lying on the letters "ar", plus a ✦ sparkle at the top right. Mono = 124:208 (assets/img/logo-mono.svg) and Mono Holo = 124:311.
PROBLEM: there is no dark-background logo. The client says: "the logo on a dark background: redraw it and come up with something better, right now it's a bit clunky." Two earlier attempts were rejected:
(a) a hack that turned the letters white while leaving the ink outline (it looked broken where the ink mascot outline fuses with the letters "a" and "r");
(b) the logo on a light badge/plate (clunky).
KEY GEOMETRY FACT: in the source vectors, the mascot's ink outline and the letters "a" and "r" are ONE merged shape: the boolean node "Mascot outline + ar" (123:4 / its copy under 124:3). Any recolouring must first separate the letters from the mascot outline cleanly.
BRAND RULES:
- Colours: ink #2C303C; pastels mint #A5EDC5, sky #9AD8F8, lilac #C49CF2, blush #F5B8DC; paper #F6F4EF; mist #F5F4FB.
- "On dark always a glow."
- The mascot is the star: never deform, redraw or restyle its face or body shapes, and keep its holo fills.
- Only colour/outline treatment may change for the dark context, plus rims, glows and outline colour.
- The letterforms must stay exactly the official ones.
- The dark variant must feel like the SAME logo: clean, crafted, no jagged or double edges ("kostrbaté" = jagged/clunky is exactly what to avoid). It must work at large sizes (hero, video end card) and small sizes (header 120px wide, social avatar-ish 40px), and on ink #2C303C, on near-black #1E2029 and on a dark holo glow.
TOOLS: SVG files, headless Chrome renders via ${ROOT}/tools/shot.sh <w> <h> <out.png> <url> (the local server http://localhost:8770 serves ${ROOT}), and Figma boolean ops (figma.union/subtract/intersect/flatten, outlineStroke) for precise geometry. Python is available (no shapely unless you pip install it offline; prefer Figma booleans). Save work files in ${W}/ (mkdir -p) and scratch in ${SCR}/. Use ONE Chrome at a time.`
const REPORT = { type: 'object', properties: { files: { type: 'array', items: { type: 'string' } }, notes: { type: 'string' } }, required: ['files', 'notes'] }

phase('Geometry')
const geo = await agent(`${CTX}\n\n${FIGMA}\n\nTASK: produce clean SEPARATED geometry of the official logo 124:3 as SVG parts in ${W}/parts/, all in the SAME coordinate system as assets/img/logo.svg (viewBox 0 0 568 292):
- letters.svg: ALL wordmark letters "s p a r k e e" as solid shapes, including the "a" and "r" parts separated out of the merged "Mascot outline + ar" shape. The letters must be complete and continuous: where the mascot covers a letter, the letter shape simply continues underneath, exactly as the designer's letterform. Reconstruct hidden letter parts from the letterform logic (Baloo-like geometric rounded sans; compare with how the letters look in the Figma IG story mockup "sparkee" text 129:2 in Baloo 2 ExtraBold if helpful). Verify against the original at 800% zoom.
- mascot_outline.svg: the mascot's ink outline ONLY, i.e. the silhouette band around head, body and limbs, WITHOUT any letter parts.
- mascot_fills.svg: all the mascot's fills and details (head holo, face, highlights, body, limbs, flame), unchanged.
- flame and sparkle as separate files if they are not already part of the above.
- mascot_silhouette.svg: the outer silhouette of the whole mascot, including its outline, as one solid shape (for rims and glows).
Method: duplicate 124:3 onto the page "🧪 Logo dark", then use Figma booleans (intersect/subtract with the mascot silhouette, flatten) and export the SVGs (download_assets or exportAsync via the plugin API). Check that recombining letters + mascot_outline + mascot_fills reproduces the official logo pixel-identically. Render the diff at 4x and look at it. Report the file list and any reconstruction decisions.`, { label: 'geometry', phase: 'Geometry', schema: REPORT })

const USER2 = `NEW CLIENT DIRECTION (27. 9. 2026, overrides the open brief above). The client saw the logo on a light plate on a dark background and wrote: "takhle přesně logo na tmavý nechci dávat.. musíš udělat variantu na tmavé pozadí.. musíš nějak udělat výřez do textu hezky okolo maskota!"
Meaning:
- NEVER put the logo on a light plate/badge/štítek on dark again.
- Make a true dark-background variant: the letters become light (mist #F5F4FB), and the letters are CUT OUT (knocked out) around the lying mascot with a smooth, EVEN gap that follows the mascot silhouette. The mascot sits in the wordmark exactly as in 124:3 (same position, scale, tilt) but reads cleanly on dark.
- The cut must look designed:
  - even gap width all around;
  - rounded, intentional letter ends where a letter is cut (like the letters' own rounded terminals, not a sharp sliver);
  - no tiny leftover letter fragments or hairline slivers (remove islands and snap cuts to clean shapes);
  - the "a", "r" and "k" must stay readable;
  - no double edges.
- The mascot's shapes, holo head, white body and face stay unchanged. Only its outer outline/rim treatment may adapt to the dark background.
- The ✦ sparkle is pastel holo.`
const GAP = 'Start the cut as an offset of mascot_silhouette.svg (Figma outlineStroke / boolean subtract, or a precise path offset). Try gap widths of 0.5x, 0.8x and 1.1x the official outline stroke width, and pick the best one for 900px and 120px. Round the cut corners (radius about the gap width).'

phase('Variants')
const DIRS = [
  { k: 'D1-cut-clean', d: `CLEAN CUT: mist letters knocked out around the mascot with an even dark gap. The mascot keeps its ink outline, which merges with the dark background, so the gap and outline read as one quiet band. No rim, no glow. ${GAP}` },
  { k: 'D2-cut-rim', d: `CUT + RIM: the clean cut from D1, but the mascot's outer ink outline becomes a crisp mist (or very light holo) rim of even width, like a die-cut sticker edge. The mascot's silhouette is defined even on near-black #1E2029, and a clear even dark gap separates the rim from the letters. Internal ink lines (face, limb separations) stay ink. ${GAP}` },
  { k: 'D3-cut-glow', d: `CUT + GLOW: the clean cut from D1, plus a soft pastel holo glow behind the mascot, contained so it does not muddy the letters (brand rule "on dark always a glow"). Provide a flat fallback without blur (logo-dark-flat) for sizes of 120px and below. ${GAP}` },
]
const variants = await parallel(DIRS.map(v => () => agent(`${CTX}\n\n${USER2}\n\nGEOMETRY from the previous step: ${JSON.stringify(geo)}\n\nDESIGN direction ${v.k}: ${v.d}\nBuild ${W}/variants/${v.k}.svg (viewBox as logo.svg, self-contained, no external refs).\nRender a board ${W}/variants/${v.k}-board.png showing:\n- the logo on #2C303C, on #1E2029 and on a dark holo glow;\n- at 900px, 300px, 120px and 40px wide;\n- a 4x zoom of every cut junction (a, r, k and the sparkle area);\n- a side-by-side with the official light logo (assets/img/logo.svg on paper #F6F4EF) at 900px, to prove the mascot position, scale and tilt are identical.\nIterate until every cut edge is perfectly clean and even, and it looks crafted. Report.`, { label: `variant:${v.k}`, phase: 'Variants', schema: REPORT })))

phase('Judge')
const VERD = { type: 'object', properties: { ranking: { type: 'array', items: { type: 'string' } }, winner: { type: 'string' }, scores: { type: 'object', additionalProperties: { type: 'number' } }, issues: { type: 'object', additionalProperties: { type: 'string' } }, tweaks: { type: 'string' } }, required: ['ranking', 'winner', 'issues', 'tweaks'] }
const boards = variants.filter(Boolean).map(v => v.files.join(', ')).join('\n')
const judges = await parallel([
  'CLIENT REQUEST + BRAND FIDELITY: does it do exactly what the client asked ("výřez do textu hezky okolo maskota", no plate)? Does it still feel like the official 124:3 logo, with the mascot position/scale/tilt identical and the letterforms unchanged apart from the cut?',
  'SMALL-SIZE LEGIBILITY: at 120px and 40px, can you still read "sparkee" (especially a, r, k near the cut) and recognise the mascot? Is anything muddy or does the gap close up?',
  'CRAFT: zoom in on every cut. Is the gap even? Are the cut letter ends rounded and intentional? Any slivers, islands, jaggies, double edges or uneven rims ("kostrbaté")? Would a top identity studio ship it?',
].map((l, i) => () => agent(`${CTX}\n\n${USER2}\n\nJudge the three dark-logo die-cut variants (open each board and SVG with Read; render extra views if needed with tools/shot.sh). Files:\n${boards}\nLens: ${l}\nScore 1-10, rank them, name a winner and give concrete tweaks for the winner. Do not edit files.`, { label: `judge:${i + 1}`, phase: 'Judge', schema: VERD })))

phase('Deliver')
const deliver = await agent(`${CTX}\n\n${USER2}\n\n${FIGMA}\n\nVARIANTS: ${JSON.stringify(variants.filter(Boolean))}\nJUDGES: ${JSON.stringify(judges.filter(Boolean))}\nTASK:
1) Take the judges' winner (by majority, or merge the best ideas) and apply their tweaks. Produce the final ${ROOT}/assets/img/logo-dark.svg (clean, optimised, self-contained, viewBox matching logo.svg) plus a PNG at 2x. If the winner uses blur, also make logo-dark-flat.svg for tiny sizes. Copy the final files to ${ROOT}/assets/figma/ as well.
2) In Figma, on "🌟 Brand Identity" (47:2), add a board "Logo / Dark" matching the style of the existing Logo / Primary, Mono and Mono Holo boards (the frames 49:3, 49:5, 49:6 inside 48:16 / 111:27 / 111:28), with the logo imported as editable vectors (upload the SVG), on an ink background. Also make it a component named "Logo/Dark" (on 47:2, next to the board). Take a screenshot to verify.
3) Update the OG generator to use logo-dark.svg on dark cards, with NO plate/badge anywhere: tools/og/template.html (the brand element) and tools/og_build.mjs (default logo mode "dark"; delete the badge mode). Regenerate with node tools/og_build.mjs, then python3 tools/build_pages.py. View home.jpg and one service card.
4) grep the repo for any other place where the logo sits on a light plate/badge on a dark background (web footer, site.webmanifest icons, social/instagram/_src kit.css/kit.js/reel.html, README). List them in the report under "plates", and fix the web ones (assets/, index.html, tools/build_pages.py) by using logo-dark.svg. Leave social/instagram to its owner.
5) Update README.md (logo section: Primary, Mono, Mono Holo, Dark) and add a short note to ${ROOT}/tools/brand/OUTLINE.md, logo chapter.
Report the files, the Figma node ids (board + component) and the plates list.`, { label: 'deliver', phase: 'Deliver', schema: REPORT })
return { geo, variants: variants.filter(Boolean), judges: judges.filter(Boolean), deliver }
