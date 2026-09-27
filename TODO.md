# Sparkee web – TODO

## Hotovo
- [x] 20s animace v2 – jeden záběr, jeden živý maskot (story.js), průvodce se během ní schová
- [x] Živý maskot v hero (JS kostra, pružiny, idle akce, interakce; mascot.js) + průvodce při scrollu (companion.js) – recenze 3× „good“, zapracováno
- [x] Doladění webu: 116 nálezů z 5 auditů → opravy → 3 ověření → 2 polish kola (kontejner 1320 px, hero na 1. screenu, podstránky na plnou šířku, a11y, taste-skill)
- [x] Ruce maskota kulaté a hladké (vítěz „sweep2“ → tools/limb_sweep.py), pózy + Figma
- [x] Sekce „Sparkee za 20 vteřin“ – verze 1 (výstřižky, pózy jako obrázky)

## Probíhá

## Další
- [ ] 20s animace v2: čeká na zpětnou vazbu klienta (recenze „meh“ → zapracováno; zbývá: hod jiskrou 2,6–2,9 s nejrychlejší pohyb, zvednutá ruka částečně za hlavou)

## Probíhá (2026-09-27)
- [x] 20s animace – nová desktopová kompozice (větší maskot, vyvážené scény) + přenahrát MP4 (desktop + mobil)
- [x] OG obrázky pro všechny stránky + apple-touch-icon, PNG favicony, manifest; logo na kartách = logo-dark.svg bez štítku (27. 9.)
- [x] Instagram launch kit (social/instagram): plán + bio, avatar, highlighty, 9 prvních příspěvků, stories, Reel s živým maskotem (MP4)
- [x] Oficiální logo 124:3 (logo.svg), mono 124:208; „logo-light“ zrušeno; tokeny sjednocené (ink #2C303C, webové pastely, „zastaví scroll“)
- [x] Ležící maskot u „Každý měsíc.“ = poměr a poloha jako v logu (tělo za písmeny), mobil nadpis na 1 řádek
- [ ] Gradient na textu podle originálu klienta: pastel holo 45° JEN na tmavé, na světlé nikdy (ink + holo marker) – web, OG, IG kit, Reel (workflow sparkee-gradient-code)
- [ ] Reel: oficiální logo 1:1 + lepší animace + gradient pravidlo → recenze → iterace
- [x] Logo na tmavé pozadí = VÝŘEZ do textu kolem maskota, žádný štítek: D3 (výřez + záře) vyhrál porotu 2:1, zaoblení konců r 5 → assets/img/logo-dark.svg (+ flat, onglow, @2x.png), Figma komponenta Logo/Dark 242:18881 + board 242:18882 (47:2), OG přegenerované
- [ ] ⛔ Figma MCP limit (200/den) vyčerpán 27. 9. ~22:45 + soubor read-only od 22:37 → po resetu: resume tools/parts/wf-brand-manual-v3.js (resumeFromRunId wf_8c99631a-bc1), zbývá 09–15 dostavět, pass/recenze/fix, PDF
- [ ] Brand manual ve Figmě v3: hezčí úvodní stránky kapitol (3 varianty → porota → komponenta Slide/Chapter + obálka), kapitoly 00–15, gradient + štítky pryč
- [ ] Po všem: Figma IG stránka s novými PNG + Reel, logo-dark všude místo štítků, brand-kit/, znovu tools/figma/unclip_sweep.js na všech stránkách (clip content pryč), commit + push
- [ ] Po doběhnutí IG kitu: import do Figmy, stránka „📱 Instagram“ (191:2, sekce Profil / Feed / Stories / Reel už připravené) – avatar, highlighty, 9 příspěvků vč. carouselů, stories, Reel cover + klíčové snímky, popisky
- [x] Figma „🎬 Animace 20 s“ (191:3): snímky desktop + mobil
- [ ] Po doběhnutí: commit + push na GitHub

## Potom (zadání 2026-09-27)
- [ ] **Brand manual ve Figmě po vzoru velkých firem** (až bude vše ostatní hotové): úvod a příběh značky, mise a hodnoty, pozicování, tone of voice, logo (varianty, ochranná zóna, min. velikost, zakázané použití), maskot (character sheet, pózy, kostra, výrazy, do/don't), barvy (paleta, holo gradient, poměry, kontrast), typografie, grafické prvky (jiskra, záře, obrysy, stíny), ikony, UI komponenty, motion principy, sociální sítě (IG šablony, stories, Reels, OG), aplikace (web, vizitka, e-mail podpis, prezentace), ke stažení
  - osnova a benchmark se připravují předem (tools/brand/OUTLINE.md)

## Potom (zadání klienta 2026-09-26)
- [x] **Hero vždy celé na 1. screenu** (headline, perex, CTA, maskot) – ověřit 1440×900, 1280×720, 390×844
- [x] **Podstránky (služby, blog) jsou moc úzké** – rozšířit layout, víc využít šířku, vizuálně sjednotit s homepage
- [x] **Doladit design se skilly** taste-skill + ui-ux-pro-max (+ web-design-guidelines audit) – celý web i podstránky
- [ ] Tón ty/vy – čeká na rozhodnutí klienta (brand „tykáme“ vs claim „vašim“)

## [DOPLNIT] od klienta
- ceny, reference, loga, kontakty, IČO, doména, napojení formuláře, reálná čísla

## Zbývá po auditu (vlastní úprava)
- [ ] 20s sekce: split header → pod sebe, šířka 1100 → 1320 (pomlčky opraveny)
- [ ] Sjednotit CTA texty (6 různých labelů na #kontakt) – rozhodnout jeden
- [ ] Počet eyebrow štítků nad sekcemi (taste-skill limit)
