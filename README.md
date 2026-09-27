# Sparkee – web

Čisté HTML + CSS + vanilla JS. Jedna stránka (CZ).

- `index.html` – celý web (maskot je inline SVG mezi `<!-- MASCOT:START/END -->`)
- `assets/css/site.css` – brand tokeny v `:root` (ink `#2C303C`, mint/sky/lav/pink, holo gradient), fonty Fredoka + Plus Jakarta Sans
- `assets/js/site.js` – nav, parallax karet v hero, reveal, počítadla, přepínač ceníku, formulář
- `assets/js/mascot-rig.js` + `assets/js/mascot.js` + `assets/css/mascot.css` – živý hero maskot (JS rig, viz níže)
- `assets/img/` – `mascot.svg` (póza s telefonem), `mascot-head.svg` (hlava/favicon), `logo.svg`
- `assets/figma/` – exporty z Figmy (soubor 4OdxiJ5jvTf0SMYucdkwtK)

## Maskot
Hlava, obličej, oči a plamínek jsou vektory z loga ve Figmě (`tools/parts/`), tělo, ruce a telefon jsou dokreslené.
Úprava pózy: `tools/compose_mascot.py` → `python3 tools/compose_mascot.py` (přegeneruje SVG i vloží do index.html).
Hero maskota oživuje JS rig (60 fps, jen SVG transformace + `d` rukou, nikdy nedeformuje postavičku):
- `mascot-rig.js` – `SparkeeRig.limb(joints)` = JS port `tools/limb_sweep.py` (obrys ruky z kloubů, odchylka od Pythonu < 0,01 j.)
- `mascot.js` – kostra (ruce z kloubů rameno→loket→tlapka, telefon drží pravá tlapka), pružiny (pohled hlavy/očí, náklon těla, plamínek se zpožděním), idle život (dýchání, mrkání, rozhlížení, pohled do mobilu, ťuknutí → srdíčko, poskok, mávání; akce se neopakují), interakce (kurzor nad maskotem → mává s ^^ očima, hover na `[data-excite]` → jásá a poskakuje, klik/tap → výskok + reakce z telefonu, 3× klik → salto, scroll → náklon, 8 s bez kurzoru → kouká do mobilu), pauza mimo obrazovku, `prefers-reduced-motion` = statická póza + mrknutí.
- Háčky v SVG (generuje `compose_mascot.py` / `rig.py`): `.m-head-rig .m-flame .m-eye-l/r .m-eyes-happy .m-mouth .m-cheek [data-limb=arm-l|r] .m-hand .m-thumb`.
- Scroll companion (`assets/js/companion.js` + `assets/css/companion.css`): malá živá kopie hero maskota (stejný engine `SparkeeMascot.create` na klonu SVG s přejmenovanými id, jeden sdílený rAF s hero). Vyskočí vpravo dole, když hero zmizí z obrazovky; v každé sekci se otočí k nadpisu, udělá gesto (`point`, `present`, `nod`, `hop`, `glance`, `tap`, `look`, u kontaktu mává) a jednou řekne krátkou bublinu (texty v `SECTIONS`). Po odeslání formuláře jásá + srdíčka. Nikdy nezakrývá CTA ani pole formuláře (IntersectionObserver s rootem ve tvaru jeho boxu → schová se pod okraj), schová se při fokusu ve formuláři a u patičky, × ho skryje natrvalo (`localStorage` `sparkee-companion`), `prefers-reduced-motion` = statická póza bez bublin. Test: `SparkeeCompanion.show('cenik', 1.1)` / `SparkeeCompanion.play()` / `.state()`, URL `/?companion=cenik@1.1#cenik` (sekce nebo `sent`), `?companion=reset` zruší skrytí.
- Test/QA: `SparkeeMascot.set('wave', 0.8)` nebo URL `/?mascot=wave@0.8` zmrazí akci v čase (akce: idle look glance tap hop wave cheer jump spin); `SparkeeMascot.play()/pause()/trigger('hop')`; laboratoř snímků `/tools/parts/mascot-lab.html?f=wave@0.2,hop@0.4&w=240`.

## Náhled
`node tools/serve.js` → http://localhost:8770 (launch config „sparkee“)

## [DOPLNIT]
- počet klientů v hero, KPI čísla, case studies (foto/video, názvy, čísla)
- ceny balíčků (`data-price` v ceníku), ceny doplňků, výpovědní lhůta ve FAQ
- reference (citace, jména, fotky), loga klientů
- kontakty ve footeru, IČO, odkazy na sítě, GDPR stránka
- napojení formuláře (endpoint + tracking standard)
- finální SVG wordmark (teď se používá logo z Figmy)
