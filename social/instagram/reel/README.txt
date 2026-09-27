Sparkee IG Reel P1 „Jiné agentury mají logo. Tahle má mě ✦“

Finální soubory k publikaci:
  video:    sparkee-reel.mp4 (1080×1920, 30 fps, 19,7 s = 591 snímků, H.264, bez zvuku, smyčka)
  cover:    cover.png = přesná kopie ../feed/01_reel-ahoj/cover.png (jediný cover, z IG kitu)
  popisek:  caption.txt = přesná kopie ../feed/01_reel-ahoj/caption.txt (zdroj: _src/content.mjs, P1)
  alt text: IG u Reels pole nemá; ../feed/01_reel-ahoj/alt.txt je pro FB a TikTok

Logo ve videu: jen oficiální /assets/img/logo.svg, celé a beze změny, na světlém mist #F5F4FB
(snímek 0 a konec smyčky). Maskot ležící na wordmarku je ten z loga, žádný druhý maskot přes něj.
Logo a živý maskot nejsou nikdy vidět zároveň: výměna leží mezi snímky 17/18 (0,58 s) a 574/575 (19,15 s)
uvnitř krátkého bílého záblesku (0,97 přesně ve 2 sousedních snímcích, doznění 0,10 / 0,12 s).
Na začátku se tmavý svět otevře jako kruhová clona z maskota na čisté ink (záblesk svítí jen kolem clony).
Na konci clona obkrouží postavu (18,42 až 18,78 s, drží r 420 px se mrknutím), zavře se do ní (19,06 s)
a maskot doskočí přesně do pózy loga (19,10 s) ještě před výměnou; logo pak viditelně chytí náraz.
Nabíjecí jiskry kolem loga krouží už od 19,40 s přes šev smyčky, logo samo je na snímku 0 v klidu.
Poslední snímek = snímek 0.
Logo na tmavém se v Reelu neukazuje nikde (žádný světlý štítek ani podklad pod logem na tmě). Kdyby bylo
potřeba logo na tmě, patří tam jedině vyříznutá tmavá varianta /assets/img/logo-dark.svg (mist písmena vyříznutá
kolem maskota, dodává ji úkol loga). V Reelu se zatím nepoužívá, protože tu žádné logo na tmě není. Když se přidá
(např. na koncovou kartu), musí být celé nebo vůbec, nikdy zároveň se živým maskotem, a znovu projít ReelCheck.

Akcenty (pravidlo klienta k přechodu na textu, 27. 9.):
  - Na tmě jen jedno krátké slovo v záběru v pastelovém holo přechodu 135° (zleva shora doprava dolů,
    #A5EDC5 → #9AD8F8 38 % → #C49CF2 72 % → #F5B8DC, box přechodu = přesně inkoust slova):
    „mě“ v „Tahle má mě ✦“, „Sparkee“ v „Ahoj, jsem Sparkee ✦“, „scroll“, „čísla“, „mě“ v „Sleduj mě ✦“.
  - „scroll“ a „čísla“ jsou nejdřív mist, přechod je zleva doprava přebarví (10,80 až 11,08 s, kdy se feed
    zastaví; 13,55 až 13,85 s, kdy rostou sloupce) a na konci blikne malá ✦. Stejná konvence jako `.dark .hl`
    v IG kitu. Zvýrazňovač pod slovem je jen pro světlé pozadí.
  - Světlá fáze (mist, začátek a konec): žádný přechod na textu, hook „Jiné agentury mají logo.“ je ink #2C303C.
  - ReelCheck hlídá „holo-text-on-light“ (přechod na textu mimo tmavou clonu).

IG zóny: žádný text nahoře 220 px, dole 420 px a vpravo 120 px. ReelCheck to hlídá u nadpisů i u každého
textu ve světě (čipy chaosu, pilulky, štítek UKÁZKA, DM bublina, popisky sloupců a dlaždic; přílet čipů
zvenku se nepočítá). Každý text je celý vidět aspoň 1,3 s, nadpisy se nikdy nepřekrývají (další přijde,
až předchozí zmizí; pilulka kroku se překlopí až potom).

Zvuk: do videa se nic nezapéká. V aplikaci přidat instrumentál z Meta Sound Collection
(happy upbeat, playful pop, ukulele nebo pluck, 115 až 125 BPM, hlasitost 25 až 30 %).
Hlavní střihy: 0,58 s (výbuch loga) · 1,16 s (dopad + „Tahle má mě ✦“) · 2,86 s (Ahoj) · 4,4 s (chaos)
· 7,06 s (plán) · 9,98 s (obsah, feed) · 10,8 s (feed zastaví) · 12,8 s (čísla) · 14,6 s (jiskra, CTA)
· 17,3 s (JISKRA doletí do pilulky) · 19,15 s (návrat do loga).

Přegenerování (z kořene sparkee-web, musí běžet node tools/serve.js na :8770):
  node social/instagram/_src/record_reel.mjs            video
  node social/instagram/_src/record_reel.mjs --check    kontrola všech 591 snímků (logo × maskot, záblesk ve výměně,
                                                        text v IG zónách vč. textu ve světě, překryvy, čitelnost ≥ 1,2 s)
  node social/instagram/_src/record_reel.mjs --sheet    ../_preview/reel-contact-sheet.png
  node social/instagram/_src/record_reel.mjs --cover    zkopíruje cover a popisek po novém buildu kitu
