// assemble_d1.mjs - build a self-contained dark-logo SVG from a cut JSON (build_d1_cut.mjs) + the separated parts.
// usage: node assemble_d1.mjs <cut.json> <out.svg> [--letters #F5F4FB] [--outline #2C303C] [--title "..."]
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const [,, CUT, OUT, ...rest] = process.argv;
const A = Object.fromEntries(rest.join(' ').split('--').filter(Boolean).map(s => { const [k, ...v] = s.trim().split(/\s+/); return [k, v.join(' ')]; }));
const LETTER = A.letters || '#F5F4FB', OUTLINE = A.outline || '#2C303C';
const cut = JSON.parse(fs.readFileSync(CUT, 'utf8'));
const part = f => fs.readFileSync(path.join(HERE, 'parts', f), 'utf8');
const body = s => s.replace(/^[\s\S]*?<svg[^>]*>\s*(<!--[\s\S]*?-->\s*)?/, '').replace(/<defs>[\s\S]*<\/defs>\s*/, '').replace(/<\/svg>\s*$/, '').trim();
const grads = s => [...s.matchAll(/<(linearGradient|radialGradient)\s+id="([^"]+)"[\s\S]*?<\/\1>/g)].map(m => [m[2], m[0]]);
const defs = new Map(); for (const f of ['mascot_fills.svg', 'flame_fills.svg', 'sparkle.svg']) for (const [id, g] of grads(part(f))) defs.set(id, g);
const geo = JSON.parse(fs.readFileSync(path.join(HERE, 'geometry.json'), 'utf8'));
const flameSil = part('flame_silhouette.svg').match(/ d="([^"]+)"/)[1];
const order = ['s', 'p', 'a', 'r', 'k', 'e1', 'e2'];
const svg = `<svg viewBox="0 0 568 292" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sparkee">
<!-- ${A.title || 'Sparkee logo, dark-background variant'} | letters knocked out around the mascot: gap ${cut.g}, cut-end radius ${cut.r} (logo units, viewBox of assets/img/logo.svg). Built by tools/logo-dark/build_d1_cut.mjs + assemble_d1.mjs -->
<g id="wordmark" fill="${LETTER}">
${order.map(k => `<path id="letter-${k}" d="${cut.letters[k]}"/>`).join('\n')}
</g>
<g id="flame">
<path id="flame-outline" d="${flameSil}" fill="${OUTLINE}"/>
${body(part('flame_fills.svg'))}
</g>
<g id="mascot">
<path id="mascot-outline" d="${geo.silhouette}" fill="${OUTLINE}"/>
${body(part('mascot_fills.svg'))}
</g>
<g id="sparkle">
${body(part('sparkle.svg'))}
</g>
<defs>
${[...defs.values()].join('\n')}
</defs>
</svg>
`;
fs.writeFileSync(OUT, svg);
console.log('wrote', OUT, svg.length, 'bytes; gradients', defs.size);
