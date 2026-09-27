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

## OG obrázky
Jeden sdílecí obrázek 1200×630 (JPEG) na stránku: homepage, přehled služeb, 4 služby, blog, 3 články; 404 používá homepage. K tomu ikony a `favicon.ico`.
- Regenerace: `node tools/og_build.mjs` a potom `python3 tools/build_pages.py`. První příkaz vyrenderuje `assets/img/og/*.jpg`, ikony v `assets/img/icons/`, `/favicon.ico` a `assets/img/logo-light.svg`. Druhý zapíše do podstránek `og:image` s `?v=<hash souboru>` a v ruční `index.html` srovná jen URL a alt obrázku homepage.
- Data: `tools/og/cards.json` (cesta stránky → soubor, varianta `home | page | article`, póza z `assets/img/poses/`, akcent `mint | sky | lav | pink | holo`, nadpis s `<em>` pro zvýraznění, samolepka, alt). Každá dvojice póza + akcent je jen jednou. Česká „vlna“ po jednopísmenných předložkách se doplní sama.
- Rodiny: `home` (velký maskot, claim, pilulka sparkee.cz), `page` pro služby (logo nahoře, štítek, nadpis, maskot v kruhu se samolepkou) a `article` pro blog a články (štítek kategorie nahoře, široký nadpis, logo dole, maskot vykukuje z rohu a mluví bublinou).
- Šablona: `tools/og/template.html`. Náhled: http://localhost:8770/tools/og/template.html?all, `?card=home` nebo ikona `?icon=180`. Tvrdé stíny štítků a samolepek jsou v barvě akcentu. Vykřičník pózy `surprised` je na tmavé bílý (úprava se dělá jen v šabloně).
- Kontroly při renderu: počká na `document.fonts.ready` a ověří Baloo 2 a Nunito včetně latin-ext (háčky a čárky), jinak skončí chybou. Nadpis musí být aspoň 24 px od maskota (po pixelech), od kruhu i od samolepek. Soubor musí mít do 300 kB.
- Přepínače: `--only home,blog` (jen vybrané karty, ikony se pak negenerují), `--no-icons`, `--out <adresář>` na zkoušku, `--logo badge` (původní logo na bílém štítku).
- Požadavky: Node 22+ (se starším Node `npm i` v `remotion/` kvůli balíčku `ws`), Chrome, internet (Google Fonts), `python3` s Pillow (JPEG q88 4:4:4 a favicon.ico).
- Světlé logo `assets/img/logo-light.svg` se generuje z `logo.svg`: bílá písmena, maskot si nechává ink obrys a jemně lila tělo. Needitovat ručně. [DOPLNIT] odsouhlasit s klientem.
- Po změně obrázku na produkci: v [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) a [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) dát u dotčených URL znovu načíst. `?v=` zajistí, že si stáhnou nový obrázek, ale samotnou stránku mají v cache.
- Ořezy: WhatsApp v malém náhledu bere prostřední čtverec (x 285 až 915). Homepage má obličej maskota uvnitř. U podstránek je vidět část nadpisu a maskota, to je záměr.
- Ikony a manifest: `site.webmanifest` v kořeni, odkazy v `index.html` a v partialu `HEAD` v `build_pages.py`. SVG favicona (`mascot-head.svg`) zůstává hlavní; `/favicon.ico` je jen pro crawlery a čtečky, které ho hledají napřímo.

## [DOPLNIT]
- počet klientů v hero, KPI čísla, case studies (foto/video, názvy, čísla)
- ceny balíčků (`data-price` v ceníku), ceny doplňků, výpovědní lhůta ve FAQ
- reference (citace, jména, fotky), loga klientů
- kontakty ve footeru, IČO, odkazy na sítě, GDPR stránka
- napojení formuláře (endpoint + tracking standard)
- finální SVG wordmark (teď se používá logo z Figmy)
