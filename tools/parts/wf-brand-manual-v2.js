export const meta = {
  name: 'sparkee-brand-manual-v2',
  description: 'Relaunch brand manual chapters (foundations reused) with one owner per chapter, official-logo + gradient rules; review; fix; navigation',
  phases: [
    { title: 'Chapters', detail: '4 owners in parallel (00-15)' },
    { title: 'Review', detail: 'art director + completeness/accuracy' },
    { title: 'Fix', detail: 'apply notes, cover, index links, brand-kit' },
  ],
}
const ROOT = '/Users/martinwork/Downloads/lp-tracking-standard/sparkee-web'
const OUTLINE = ROOT + '/tools/brand/OUTLINE.md'
const FOUND = ROOT + '/tools/brand/foundations.json'
const SCR = '/private/tmp/claude-501/-Users-martinwork-Downloads-lp-tracking-standard/9ac86e71-2100-45ed-b455-ab6c65877598/scratchpad/brand2'
const FIGMA = `FIGMA: file 4OdxiJ5jvTf0SMYucdkwtK (the editable working copy).
- Load the tools via ToolSearch: select:mcp__c821381b-133f-4d7f-8513-e5c3a5701901__get_figma_skill,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__use_figma,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__upload_assets,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__get_screenshot,mcp__c821381b-133f-4d7f-8513-e5c3a5701901__get_metadata.
- Before any use_figma call, read get_figma_skill uri "skill://figma/figma-use/SKILL.md" (plus figma-generate-library / figma-generate-design SKILL.md if needed). Pass skillNames "resource:figma-use" on every use_figma call.
- Uploads: upload_assets gives single-use URLs that expire in 10 min, so use batches of at most 15. Create sized rectangles and pass nodeIds + scaleMode FIT for PNGs, then POST with curl -s -X POST -H "Content-Type: image/png" --data-binary @file "<url>". For SVG, use -F "file=@path;type=image/svg+xml" to get editable vectors.
- CONCURRENCY: other agents work in this file at the same time, on the "📱 Instagram" page, on a "🧪 Logo dark" page, and on the other chapters of this manual. Touch ONLY your own chapter sections. Switch pages at most once per script.
- An earlier, interrupted run left partial slides and duplicates: some sections may contain half-built slides from two agents. For YOUR chapters, first inspect what exists, keep good slides, delete broken or duplicate ones, and rebuild so that exactly one clean set remains.`
const BRAND = `SPARKEE BRAND MANUAL in Figma, "modelled on big companies (GitHub, Duolingo, Mailchimp, Slack), with everything that's needed". THE PLAN: ${OUTLINE} (Czech). Read it: chapters 00-15, slide lists, 1920x1080 grid.
FOUNDATIONS ALREADY BUILT (reuse them, do not rebuild): read ${FOUND}. It covers the pages "📘 Brand Manual" and "🧱 Knihovna"; the variable collections, text/paint/effect styles and grid styles; the components (Slide/Base, Slide/Chapter, Slide/Header, Slide/Footer, Doc/*, Logo, Jiskra, Doc/Status badge); and one Section per chapter.
FINAL CLIENT DECISIONS:
- Colours: ink #2C303C; web pastels mint #A5EDC5, sky #9AD8F8, lilac #C49CF2, blush #F5B8DC; paper #F6F4EF for the web, mist #F5F4FB for social.
- The mascot is named Sparkee.
- Tone: the mascot uses "ty" (IG/social), the agency uses "vy" (web, offers, contracts). Claim: "Dodáme jiskru vašim sociálním sítím". Say "zastaví scroll", never "zastaví palec".
- The mascot is never deformed. Its head is straight when standing and tilted only in the lying logo pose. Its arms are round.
- LOGO (critical):
  - The ONLY official logo is Figma node 124:3 (Logo / Primary on page "🌟 Brand Identity" 47:2); Mono = 124:208/124:209; Mono Holo = 124:311 (the Mono logo on the holo gradient). Repo files: assets/img/logo.svg (from 124:3) and assets/img/logo-mono.svg.
  - In the library there are 1:1 clones: Logo Primární 200:2, Mono ink 206:463, Mono Holo 207:2267.
  - The "Světlá" variant (200:3) and "Mono bílá" (206:566) are NOT official: VYŘAZENO. Never use them. The cover 00.00 (202:18) currently uses Světlá, so fix it.
  - The DARK-background logo is being designed right now by another agent (it will appear as component "Logo/Dark" on 47:2 and as assets/img/logo-dark.svg). In chapter 03 reserve a slide "Logo na tmavém pozadí": use the component Logo/Dark if it already exists when you get there; otherwise leave the frame with a neutral placeholder area (no status badge) that the dark-logo agent's result will fill. Never present a light-plate or badge solution as the recommendation.
  - Never recolour the logo, never cut the mascot out of the wordmark, and never place the mascot on the wordmark differently from 124:3.
- GRADIENT TEXT (the client warned about this specifically):
  - Holo is for single accent words only, never whole headlines or body text.
  - On LIGHT backgrounds use the readable text gradient (paint style "Holo/Text na světlé"): ~100°, #1FA37A 0%, #2A92D6 30%, #7C5CE0 62%, #D25A9E 88%, #7C5CE0 100%, spanning the whole word.
  - On DARK backgrounds use the pastel holo.
  - Never put pastel gradient text on a light background.
  - Verify every gradient word with get_screenshot, zoomed in.
  - Document these rules as do/don't in chapters 05 and 06.
- All other open questions (K03-K45): use the outline's recommended default and present it as the FINAL rule. The client said: DELETE the "k potvrzení" badges. NO status badges anywhere: do not use Doc/Status badge or the Slide/Footer "K potvrzení" variant, and remove every existing "k potvrzení" badge/footer variant from all slides (switch footers to Standard). Also fix the Slide/Chapter default text "Na tmavé ploše vždy světlá verze loga." (the light version is retired) and the retired-logo description on Světlá 200:3 (no light plate recommendation).
SOURCE ASSETS in ${ROOT}:
- assets/img/logo.svg, logo-mono.svg;
- poses assets/img/poses/*.svg (use the Maskot/* component instances from page 186:2 where possible);
- tokens in assets/css/site.css;
- motion in assets/js/mascot.js and story.js;
- OG images assets/img/og/*.jpg;
- Instagram kit social/instagram;
- videos assets/video/*.mp4;
- previews tools/preview-*.png.
Other Figma pages: 186:2 "🧩 Maskot – pózy", 191:3 "🎬 Animace 20 s", 191:2 "📱 Instagram" (being filled).
Czech copy in the brand tone, no em/en dashes, real content (no lorem ipsum), premium and consistent.`
const REPORT = { type: 'object', properties: { done: { type: 'array', items: { type: 'string' } }, node_ids: { type: 'string' }, open: { type: 'array', items: { type: 'string' } } }, required: ['done', 'open'] }
const GROUPS = [
  { key: 'A', ch: '00 Úvod (cover with the OFFICIAL logo, how to use, a quick start one-pager), 01 Značka (story, mission, values, positioning, audience), 02 Hlas a tón (voice pillars, the ty/vy rule per channel, before/after examples, vocabulary incl. "scroll", CTA wording, emoji/✦ rules)' },
  { key: 'B', ch: '03 Logo (Primary, Mono, Mono Holo, the dark slot, clear space, minimum size, backgrounds, 12 misuse examples built from the real logo, the logo + mascot relationship), 05 Barvy (palette HEX/RGB/CMYK approx, holo gradient spec, text-gradient rules as do/don\'t, usage ratio, contrast matrix, don\'ts), 06 Typografie (Baloo 2 + Nunito, scale, hierarchy, Czech diacritics sample, gradient-word rules, web fallbacks)' },
  { key: 'C', ch: '04 Maskot (who Sparkee is, anatomy/proportions from the real vectors, rig map with joints, pose library from the Maskot/* instances, expressions normal/happy/surprised, do/don\'t: deformation, head tilt, arm shape, colours, when not to use him, standing vs lying rule with the logo lying pose = 124:3, scale relationship with UI/text, sticker usage)' },
  { key: 'D', ch: '07 Grafické prvky, 08 Ikony, 09 UI komponenty webu (buttons, cards, chips, forms, website screenshots), 10 Fotografie a video (P2 placeholders + rules), 11 Motion (principles, easing/duration tokens, mascot behaviours, 20 s story frames, reduced motion, export specs), 12 Sociální sítě (IG grid system, templates from the kit, safe zones, Reel rules, OG images), 13 Aplikace (business card front/back, e-mail signature, presentation slide template, offer header, stickers; on dark use the dark-logo slot), 14 Přístupnost, 15 Ke stažení a správa (downloads, file naming, owner/contact, changelog, versioning)' },
]
phase('Chapters')
const chapters = await parallel(GROUPS.map(g => () => agent(`${BRAND}\n\n${FIGMA}\n\nYOU OWN ONLY THESE CHAPTERS: ${g.ch}.\nBuild every slide as instances of Slide/Base or Slide/Chapter inside your chapter Sections on "📘 Brand Manual", following the outline's slide lists (P1 is mandatory, P2 where sensible). Use real assets, bind colours to variables and use the text styles. Verify each chapter with get_screenshot (scratch in ${SCR}/${g.key}/), and fix clipped text, overlaps and empty areas. Report the slide counts and node ids.`, { label: `chapters:${g.key}`, phase: 'Chapters', schema: REPORT })))

phase('Review')
const NOTES = { type: 'object', properties: { verdict: { type: 'string' }, notes: { type: 'array', items: { type: 'object', properties: { where: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['where', 'problem', 'fix'] } } }, required: ['verdict', 'notes'] }
const revs = await parallel([
  'ART DIRECTOR: screenshot every section and judge it against top brand manuals: grid consistency, typography, hierarchy, whitespace, image quality, do/don\'t clarity. Premium or templated? Zoom into every gradient word. Give concrete fixes per slide.',
  'COMPLETENESS + ACCURACY: check against OUTLINE.md (every P1 slide present?) and the client decisions (hex values; official logo only, with no Světlá/Mono bílá usage; the dark-logo slot; tone rules; scroll wording; mascot rules; gradient rules). Also look for leftover duplicate or partial slides from the interrupted run, lorem ipsum, em/en dashes, Czech typos, broken instances and any remaining "k potvrzení" badges or K potvrzení footer variants (they must be gone).',
].map((l, i) => () => agent(`${BRAND}\n\n${FIGMA}\n\nRead-only review of the brand manual (chapter reports: ${JSON.stringify(chapters.filter(Boolean))}). Lens: ${l}\nDo not edit. Scratch in ${SCR}/review${i}/.`, { label: `review:${i + 1}`, phase: 'Review', schema: NOTES })))

phase('Fix')
const fix = await agent(`${BRAND}\n\n${FIGMA}\n\nApply these review notes (JSON): ${JSON.stringify(revs.filter(Boolean))}. Then finish:
(1) The cover: version 1.0, date 27. 9. 2026, status, the official logo.
(2) The index slide with prototype links to every chapter divider, plus back-to-index links.
(3) A flow starting point for presentation mode.
(4) Export settings on the logo and mascot asset frames.
(5) In the repo, create ${ROOT}/brand-kit/ containing: logo SVG/PNG (logo.svg, logo-mono.svg, and logo-dark.svg if it exists by then); mascot poses SVG/PNG; colour tokens as JSON, CSS and an ASE-compatible list; font links; and a Czech README. Reference the kit on the "Ke stažení" slide.
Take final screenshots of the cover, the index and one slide per chapter, and report the page URL node ids.`, { label: 'fix+finish', phase: 'Fix', schema: REPORT })
return { chapters: chapters.filter(Boolean), reviews: revs.filter(Boolean), fix }