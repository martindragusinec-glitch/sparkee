# Sparkee ✦ Instagram: launch plán

Verze 1.2 · 27. 9. 2026 · finální plán sloučený ze dvou strategických návrhů, upravený po revizi statického kitu a po rozhodnutí klienta (tokeny barev, ty/vy, slovník „scroll“, gradient na textu jen na tmavé)

## Ve zkratce

- **Maskot je hvězda a mluví za profil.** B2B hodnota je v každém druhém postu. 9 příspěvků: 2 Reels, 3 carousely s hodnotou (5 chyb, Kolik stojí, Proces), karta postavy a 3 jednoobrázkové posty.
- **Grid je šachovnice tma / světlo, která drží po každém postu.** Světlé dlaždice jdou mint → sky → lilac → blush, takže celý profil je jeden rozprostřený holo přechod. Každá dlaždice sama drží pravidlo „holo jen na akcenty“.
- **Jedno klíčové slovo pro všechna CTA:** napiš **JISKRA** do zpráv.
- **Launch v úterý 6. 10. 2026** [DOPLNIT: potvrdit datum]. 9 postů za 17 dní, pak 3 posty týdně.
- **Tón (rozhodnuto klientem):** maskot Sparkee a Instagram (i ostatní sociální sítě) tykají, agentura na webu a v nabídkách vyká. Claim agentury zůstává „Dodáme jiskru **vašim** sociálním sítím“. Řádek v biu „Dodáme jiskru **tvým** sociálním sítím ✦“ je hlas maskota, proto na ty.
- **Slovník:** říkáme **scroll** („obsah, který zastaví scroll“, „zastavím scroll“), ne jiné obraty.
- **Žádné pomlčky** v textech na grafice ani v popiscích. Emoji max 1 na popisek, podpis je ✦.

### Co jsme vzali z kterého návrhu

| Oblast | Rozhodnutí |
|---|---|
| Hlas | Sparkee mluví v 1. osobě („já“), o práci týmu říká „my“ (návrh A). Obsah s hodnotou vychází z blogu (návrh B). |
| Hlavní Reel | Hook „Jiné agentury mají logo. Tahle má mě ✦“ (A) + tři pilíře systému: plán, natáčecí den, report (B). 19,7 s, smyčka. |
| Grid | Šachovnice + holo přechod + společný horizont maskotů (A). Ořezy 3:4 a safe zóny (B). |
| Posty | Osobnost z A (Reel, karta postavy, posuvník, virál Reel, bingo, CTA z Figmy) + hodnota z B (5 chyb s opravami, Kolik stojí, proces s cenou). |
| Vyřazeno | Mini case a highlight Výsledky, dokud nejsou reální klienti se svolením. „Jaký Sparkee jsi dnes?“, „Audit za 10 minut“ a „Tři balíčky“ jdou do zásobníku (post 10 a dál). |
| Rig | Jen akce, které v `mascot.js` opravdu existují: `idle hello look glance tap hop hops wave cheer jump hey point present nod`. Rig nemá `spin` ani salto (maskot je vždy nohama dolů) a tlapky se před tělem nesetkají, takže žádné tlesknutí. |

---

## 1. Profil

### Handle
1. **@sparkee.cz** (1. volba: kopíruje doménu a hned říká, že jde o českou značku)
2. @sparkee_cz
3. @sparkee.social
4. @ahoj.sparkee (hlas maskota)
5. @hello.sparkee

[DOPLNIT: ověřit dostupnost naráz na IG, TikToku, FB a LinkedInu. Vybraný handle předat webovému týmu do patičky webu a do `sameAs` (teď `https://www.instagram.com/[DOPLNIT]`). Tento plán web neupravuje.]

### Jméno (vyhledávatelné pole, 30/30 znaků)
**Sparkee: social media agentura**
Záloha: „Sparkee ✦ sociální sítě“ (23 znaků).

### Bio (150/150 znaků včetně zalomení)
```
Dodáme jiskru tvým sociálním sítím ✦
Správa sítí, obsah, influenceři, reklama.
Systém agentury, tempo freelancera.
Napiš JISKRA do zpráv nebo klikni ↓
```
Klíčové slovo JISKRA je přímo v biu, šipka míří na odkaz. První řádek je hlas maskota, proto na ty („tvým“). Claim agentury na webu a v nabídkách zůstává „Dodáme jiskru vašim sociálním sítím“ (rozhodnutí klienta).

### Odkazy v biu (IG povolí až 5, první je vidět hned)
1. **Nezávazná konzultace** (titulek odkazu „Nezávazná konzultace 20 min“, jinak IG ukáže dlouhou URL s UTM): `https://sparkee.cz/?utm_source=instagram&utm_medium=social&utm_campaign=ig_profil&utm_content=bio_konzultace#kontakt`
2. **Ceník:** `https://sparkee.cz/?utm_source=instagram&utm_medium=social&utm_campaign=ig_profil&utm_content=bio_cenik#cenik`
3. **Blog:** `https://sparkee.cz/blog/?utm_source=instagram&utm_medium=social&utm_campaign=ig_profil&utm_content=bio_blog`

[DOPLNIT: finální doména, UTM sjednotit s tracking standardem v2.1.]

### Nastavení účtu
- Profesionální účet typu **Firma**, kategorie **Marketingová agentura**, propojený s FB stránkou v Meta Business Suite.
- Tlačítka: **Zpráva**, **E-mail** ahoj@sparkee.cz [DOPLNIT: potvrdit], **Zavolat** [DOPLNIT: telefon].
- Automatická odpověď na klíčové slovo **JISKRA** (Meta Business Suite → Doručená pošta → Automatizace): „Ahoj ✦ díky za zprávu! Pošli mi odkaz na svůj profil a napiš, co tě na sítích nejvíc trápí. Ozveme se s termínem 20minutové konzultace.“ [DOPLNIT: nastavit, případně doplnit dobu odpovědi]
- Zapnuté automatické titulky u Reels. U každého postu vyplněný alt text (Pokročilé nastavení).

### Hlas profilu
- Sparkee mluví v 1. osobě („já“), práci týmu popisuje „my“ (já + lidi za mnou).
- Maskot a IG tykají, agentura (web, nabídky) vyká. Krátké věty, konkrétní čísla, čeština bez korporátní vaty.
- Říkáme „zastaví scroll“, žádné jiné obraty pro zastavení pozornosti.
- Emoji max 1 na popisek, podpis ✦. Žádné pomlčky.
- Hashtagy max 5 na post. Klíčová slova (správa sociálních sítí, social media agentura, Instagram pro firmy) patří do prvních řádků popisku, protože vyhledávání v IG čte text.
- Čísla z webu označená jako ilustrační (+1 248 sledujících, +42 %, 312 %, 30+ firem) na IG **nepoužíváme**, dokud nejsou reálná.

---

## 2. Profilovka

Tři varianty k výběru, všechny 1080×1080 PNG (IG si ořízne kruh). Test ve 32 až 150 px, ve světlém i tmavém režimu IG a s kroužkem Stories: `_preview/avatar-test.png`.

**Varianta A (doporučená): hlava maskota v tmavém kruhu s holo glow.** `avatar/sparkee-avatar-dark.png`
- Zdroj: `assets/img/poses/head.svg`, beze změny tvaru, jen rovnoměrné měřítko.
- Ink `#2C303C` + 3 bloby mint, sky, lilac (blur 120 px, cca 55 %) přímo za hlavou, jinak ink obrys na tmě zanikne.
- Hlava s plamínkem je vysoká 904 px (cca 84 % průměru), o 6 % víc než v první verzi. Špička plamínku je 90 px od hrany kruhu, spodek hlavy 86 px. Víc se do kruhu nevejde bez ořezu dolních cípů. Plamínek se k hlavě nepřisouvá, je to kresba klienta.
- Žádný text ani wordmark (profilovka se ukazuje i ve 32 px u komentářů).

**Varianta B: stejná hlava na světlém holo pozadí.** `avatar/sparkee-avatar-light.png`

**Varianta C: kruh s „s“ z Figmy (frame Aplikace).** `avatar/sparkee-avatar-s.png`: ink kruh s holo září a „s“ převzaté beze změny z wordmarku `assets/img/logo.svg`, v mist `#F5F4FB`. V 32 px nejčitelnější, ale bez maskota.

Proč A: maskot je v mikro velikosti rozpoznatelnější než písmeno a tmavý kruh vynikne v obou režimech. Stejná profilovka na TikToku, FB i LinkedInu. [DOPLNIT: klient vybere A, B, nebo C]

---

## 3. Highlighty (5)

**Covery:** `highlights/hl-1-ahoj.png` až `hl-5-tipy.png`, 1080×1920 PNG, ink `#2C303C`, jedna pastelová glow louže uprostřed (blur 120 px, cca 55 %), motiv v prostředních 660 px (IG ořízne kruh), ikona v mist nebo pastelu, žádný text kromě „Kč“. Názvy max 10 znaků.

**Highlight se na profilu ukáže, jen když obsahuje aspoň 1 story.** Proto stálý obsah, 12 stories v `highlights/stories/`, jde ven **Den −2 (ne 4. 10.)**, kdy profil ještě nikdo nesleduje. Pořadí, postup a odkazy s UTM (`utm_campaign=ig_profil`, `utm_content=ig_highlight_…`) jsou v `highlights/highlights.txt`, náhled se safe zónami v `_preview/stories-guide.png`.

Pořadí zleva: **Ahoj ✦ · Služby · Ceník · Kontakt · Tipy** (první 4 jsou vidět bez scrollu).

| # | Název | Cover | Stálý obsah (Den −2) | Přibude |
|---|---|---|---|---|
| 1 | **Ahoj ✦** | hlava maskota, mint glow | „Pro firmy, které chtějí systém ✦“ (3 situace) · „Od chaosu k číslům“ (audit týden 1, plán týden 2, tvorba a report každý měsíc) | S1, S2 (Den 0), vítězné jméno plamínku |
| 2 | **Služby** | 4 pastelové dlaždice s ✦, sky glow | 4 snímky: správa sítí, tvorba obsahu, influencer marketing, paid social pro dosah, každý s odkazem na `sluzby/…` | |
| 3 | **Ceník** | „Kč“ v Baloo 2 ExtraBold, lilac glow | Spark / Glow (nejoblíbenější) / Blaze s obsahem balíčku, od 14 900 / 24 900 / 39 900 Kč měsíčně bez DPH, odkaz `#cenik` · FAQ „Musím se zavázat na dlouho?“ a „Je v ceně i reklama?“ | |
| 4 | **Kontakt** | bublina zprávy s ✦, blush glow | „Napiš JISKRA do zpráv ✦“ (napiš, 20 minut konzultace, první obsah do 14 dnů), odkaz `#kontakt` · FAQ „Kdo schvaluje obsah?“ a „Jak rychle začneme?“ | S5 (Den 16) |
| 5 | **Tipy** | samotná ✦ (highlight cover z Figmy), mint glow | odkazy na blog: Kolik stojí správa sociálních sítí, Influencer marketing pro malé firmy | S4a kvíz a S4b odkaz (Den 2), sdílené P4 a P6 |

E-mail, telefon a výpovědní lhůta na snímcích zatím nejsou, dokud je klient nepotvrdí (kap. 11).

Později jako 6.: **Výsledky** (rostoucí sloupce, sky glow), až s reálnými klienty, čísly a písemným svolením. Pro oznámení použít Figma story „Nová spolupráce ✨“ + CTA „zjistit víc“.

---

## 4. Grid koncept

**Šachovnice tma / světlo, která drží po každém postu.** Liché posty (P1, P3, P5, P7, P9) jsou tmavé: ink `#2C303C` + 2 až 3 rozmazané holo bloby (blur 100 až 140 px, opacita cca 50 %), text mist. Sudé (P2, P4, P6, P8) jsou světlé: mist `#F5F4FB` + pastelová karta nebo celoplošná kompozice, ink text. Ve 3 sloupcích dává prosté střídání šachovnici po každém novém postu, ne až na konci.

**Holo přes celý grid:** světlé dlaždice jdou v pořadí gradientu **mint (P2) → sky (P4) → lilac (P6) → blush (P8)**. Holo gradient nikdy jako plná plocha dlaždice, jen ✦, pilulky, linky a podtržení.

**Maskot na každé dlaždici, pokaždé jiná póza** (9 póz = 9 nálad = osobnost): P1 `wave` · P2 `stand` · P3 `sticker` · P4 `lie` · P5 rig `hey` · P6 `surprised` · P7 `head` · P8 `peek` · P9 `happy`. Stojí na **společném horizontu**: nejnižší bod v cca 91 % výšky náhledu (u postu 4:5 y ≈ 1230 z 1350, u Reel coveru y ≈ 1550 z 1920). V gridu tak stojí postavičky v řadě jako parta. Výjimky: bingo P7 (hlava ve středovém poli), ležící P4 a peek P8 na hraně reportu.

**Telefon střídmě:** živý rig drží v pravé tlapce vždy telefon. Proto je telefon jen na 1 dlaždici gridu (P5, kde maskot čte zprávu od klienta) a v carouselu max 2×. Zmrazené snímky rigu jen tam, kde gesto čte i ve stojícím obrázku: `tap` 2,0 s (srdíčko vyletí, mrknutí), `present` 0,5 s (poskok s rukama od těla), `point` 0,3 s (náklon a ruka k seznamu), `glance` 1,0 s (čte v telefonu), `hey` 0,5 s (široké oči). Jinak originální pózy bez telefonu.

**Maskot a hrany karet:** žádné tečování. Obrys je buď aspoň 40 px uvnitř karty, nebo hranu rozhodně přetíná (hlava nad kartou, tělo v ní). `peek.svg` jen tam, kde tlapky leží na viditelné hraně (horní hrana karty nebo reportu, spodní hrana karty), nikdy volně v prostoru. Nic se neořezává okrajem plátna. `build.mjs` to kontroluje z pixelů obrysu (i vykřičník a srdíčko) a hlásí upozornění.

**Na tmavé vždy glow:** ink obrys maskota na ink pozadí zaniká, proto za každou postavičkou na tmavé pastelová glow louže (radiální, blur 100+, cca 55 %), nebo póza `sticker.svg` s bílým obrysem.

**Maskot se nikdy nedeformuje:** originální SVG póza z `assets/img/poses/*.svg`, nebo zmrazený snímek rigu `SparkeeMascot.create(svg, {lab:true, seed}).set(akce, t)` vybraný v `tools/parts/mascot-lab.html`. Jen rovnoměrné měřítko, posun a rotace. Žádné natahování, zrcadlení, přebarvování ani ořez přes tělo.

**Opakované prvky:**
- ✦ podpis vpravo nahoře (44 px, holo na tmavé) jen na jednoobrázkových postech P3, P7, P9. Na obálkách carouselů a Reels by ho zakryla ikona IG, tam je ✦ v pilulce. Vlastní počítadlo slidů nepoužíváme, IG při listování kreslí své.
- „Přejeď →“ na všech obálkách carouselů na stejném místě vpravo dole.
- Nadpis Baloo 2 ExtraBold 96 až 136 px, vlevo nahoře, odsazení 72 px, max 6 slov a 3 řádky na obálce.
- **Akcent v nadpisu (pravidlo klienta 27. 9.):** jen jedno krátké slovo nebo sousloví na jednom řádku (`<em>` v `content.mjs`).
  - **Na světlé dlaždici (mist, bílá, pastelová karta) nikdy gradient na textu**, ani pastelový, ani sytý. Slovo zůstává ink `#2C303C` a akcent nese pastelový holo „zvýrazňovač“ ZA spodní částí slova jako hero na webu (výška 0,3 em, spodní hrana na účaří, aby nekřížil dotahy j, p, y, g, zkosení 8°, opacita 0,55). ✦ v nadpisu a v pilulce je na světlé taky ink.
  - **Na tmavé dlaždici** je slovo v pastelovém holo přechodu úhlopříčně 45° zleva nahoře doprava dolů jako originál ve Figmě („Aa“, „sparkee.cz“): `linear-gradient(135deg, #A5EDC5 0%, #9AD8F8 38%, #C49CF2 72%, #F5B8DC 100%)`, přechod přesně přes slovo, bez zvýrazňovače. Jen krátké slovo, velké číslo nebo malý brand řádek, nikdy celý nadpis ani běžný text.
- Text Nunito Bold min. 30 px (popisky os a štítky), běžný text 36 až 46 px, max cca 20 slov na slide.
- Pilulka nahoře (✦ KARTA POSTAVY / ✦ TIP / ✦ ČÍSLA / ✦ SYSTÉM) v Nunito Black 30 px.
- Obálky P4 a P8 jsou bez rámu (celoplošná kompozice), P2 a P6 s kartou, takže světlé dlaždice v gridu nejsou čtyřikrát stejné.
- Poslední slide každého carouselu je jiný předmět místo prázdné karty: P2 náhled profilu se záložkou, P4 okno zpráv s JISKRA, P6 cena s účtenkou, P8 kalendář se 14. dnem. sparkee.cz jen tam a na P9.

**Ořez v gridu:** profil ukazuje náhledy 3:4. Post 1080×1350 se ořízne na střed cca 1012×1350, takže 60 px od bočních hran nic důležitého. Reel cover 1080×1920 se v gridu ořízne na y 240 až 1680, text coveru dát do y 380 až 700. Puzzle grid záměrně ne: rozbije ho každý nový post i pin a ve feedu musí každá dlaždice fungovat sama.

### Grid po P9 (nejnovější vlevo nahoře)
```
[P9 CTA, tma]           [P8 Proces, blush]       [P7 Bingo, tma]
[P6 Kolik stojí, lilac] [P5 Reel virál, tma]     [P4 5 chyb, sky]
[P3 Posuvník, tma]      [P2 Karta postavy, mint] [P1 Reel Ahoj, tma]
```
Uprostřed Reel s velkým obličejem maskota jako kotva gridu.

### Po připnutí P1, P2, P9
```
[P1 Reel Ahoj, tma] [P2 Karta, mint]    [P9 CTA, tma]
[P8 Proces, blush]  [P7 Bingo, tma]     [P6 Kolik stojí, lilac]
[P5 Reel virál, tma][P4 5 chyb, sky]    [P3 Posuvník, tma]
```
Horní řada = kdo jsem / co umím / ozvi se. Šachovnice sedí přesně.

**Pravidlo pro další posty:** barva vždy opačná než u nejnovějšího **nepřipnutého** postu (P10 tedy tmavý). Pod připnutou řadou se u každého druhého dalšího postu objeví šev (fáze šachovnice se střídá). Akceptujeme, po launch kampani můžeme piny zredukovat.

---

## 5. Příspěvky 1 až 9

Popisky, hashtagy a alt texty jsou jen v `_src/content.mjs` a build je zapíše do `feed/<post>/caption.txt` a `alt.txt`. Níže jsou stejné texty pro kontrolu. V textech k vložení nesmí zůstat [DOPLNIT] (build skončí chybou). První řádek popisku je vidět před „…více“, proto v něm je háček a klíčové slovo, ne kopie nadpisu z grafiky.

### P1 · Reel „Jiné agentury mají logo. Tahle má mě ✦“ · TMA · připnout
- **Formát:** Reel 1080×1920, 19,7 s, 30 fps, H.264, vlastní cover 1080×1920. Detailní scénář v kapitole 6.
- **Idea:** logo ožije, maskot z něj vyletí a za 19,7 s ukáže, kdo je a co s týmem dělá: chaos → plán → obsah → čísla → jiskra. Na konci skočí zpátky do loga, smyčka navazuje.
- **Maskot:** snímek 0 a konec = oficiální `assets/img/logo.svg` celé na mist, mezi tím živý rig: jump → wave → hop → hey → present → nod → tap → nod → cheer → tap → jump.
- **Soubory:** video `reel/sparkee-reel.mp4`, cover a popisek **jen z `feed/01_reel-ahoj/`** (viz README tam). `reel/cover.png` a `reel/caption.txt` jsou pracovní verze, nepoužívat.
- **Cover:** tma + glow, `wave.svg` (^^ oči, bez telefonu), „Ahoj, jsem Sparkee ✦“ + štítek „tvář social media agentury“ v y 400 až 790, chodidla na horizontu y ≈ 1550, vše ve výřezu y 240 až 1680.
- **CTA:** hlavní je slovo JISKRA do zpráv (stejně jako koncová karta Reelu), sledování je vedlejší.
- **Popisek:**
```
Jiné agentury mají logo. Tahle má mě ✦

Ahoj, jsem Sparkee. Tvář social media agentury, která dělá z chaosu na sítích systém.

Co s týmem děláme pro firmy:
✦ plán obsahu na měsíc dopředu
✦ Reels, carousely a Stories, které zastaví scroll
✦ každý měsíc čísla, ne pocity

Tady budu jiskřit každý týden. Tipy k uložení, zákulisí a trochu legrace ze života na sítích. Sleduj mě, ať ti nic neuteče.

Chceš systém i pro svoje sítě? Napiš JISKRA do zpráv a domluvíme 20 minut nezávazné konzultace.
```
- **Hashtagy:** #sparkee #socialnisite #spravasocialnichsiti #socialmediaagentura #marketingcz
- **Alt text:** IG u Reels pole pro alt text nemá. Text v `alt.txt` je pro FB a TikTok: Animovaný maskot Sparkee seskočí z loga, zamává a ukáže, jak z chaosu na sítích dělá plán, obsah a měsíční report.

### P2 · Carousel „Seznam se: Sparkee“ (karta postavy) · SVĚTLO mint · připnout
- **Formát:** carousel 8 × 1080×1350. Mist pozadí + mint karta, každý slide jiná póza, telefon jen 2× (slidy 3 a 6). Cíl: uložení a komentáře.
- **Slidy:**
  1. Obálka: štítek „karta postavy“, „Seznam se: Sparkee ✦“, herní karta s holo fólií, `stand.svg` (odhalení postavy), „Přejeď →“.
  2. Profil postavy: jméno Sparkee, druh jiskra s nohama, věk čerstvě spuštěný, bydliště tvůj feed · `wave.svg`
  3. „Superschopnost: zastavím scroll. Dělám obsah, u kterého lidi zůstanou až do konce.“ + štítky Líbí se mi / Uloženo / Posláno dál · rig `tap` 2,0 s (srdíčko vyletí, mrkne), hlava vědomě nad hranou karty
  4. Statistiky jako ve hře: Energie 100 · Nápady 99 · Pravidelnost 100 · Trpělivost s posty „ať tam něco je“ 2 · `peek.svg` vykukuje přes horní hranu karty (tlapky na hraně)
  5. „Co mě naštve: posty na poslední chvíli. Zprávy bez odpovědi. Report, kterému nerozumí ani autor.“ · `surprised.svg` celý v kartě i s vykřičníkem
  6. „Co umím (s týmem)“: 4 pastelové dlaždice Správa sítí / Tvorba obsahu / Influenceři / Paid social pro dosah · rig `present` 0,5 s (poskok s rukama od těla)
  7. „Moje pravidla: Nic nevyjde bez tvého souhlasu. Jeden kontakt, rychlé odpovědi. Paušál bez hodin navíc.“ · `lie.svg` v klidu pod nimi
  8. CTA: „Sleduj mě. Každý týden nová jiskra ✦“ + „Ulož si kartu, ať mě neztratíš.“ Náhled profilu sparkee.cz se záložkou, sparkee.cz · `happy.svg`
- **Popisek:**
```
Energie 100. Nápady 99. Trpělivost s posty „ať tam něco je“? Dva body ✦

Seznam se se Sparkee, tváří social media agentury.

S týmem za zády se starám o to, aby sítě firem žily každý den. Plánujeme, tvoříme obsah, hledáme influencery a reklamou pomáháme k většímu dosahu.

Která statistika je nejvíc tvoje? Energie, nápady, nebo pravidelnost? 👇
```
- **Hashtagy:** #sparkee #socialmediaagentura #socialnisite #maskot #marketingcz
- **Alt texty:** v `feed/02_karta-postavy/alt.txt` (po slidech).

### P3 · „Někde mezi. Přesně tady ✦“ (posuvník) · TMA
- **Formát:** single 1080×1350.
- **Idea:** pozicování jedním obrázkem. Vodorovný posuvník „Freelancer ↔ Velká agentura“ v y ≈ 1230, dráha jako tenká holo linka (akcent). Uprostřed zářící jezdec s ✦, nad ním maskot. Nadpis „Někde mezi. Přesně tady ✦“, pod ním „Systém agentury. Tempo freelancera.“ Popisky konců: Freelancer „levnější, ale bez systému“ · Velká agentura „velký tým, ale pomalý“ (texty z webu).
- **Maskot:** `sticker.svg` (bílý obrys čte na tmě) nad jezdcem, ✦ podpis vpravo nahoře.
- **Popisek:**
```
Freelancer, nebo velká agentura? My jsme přesně mezi ✦

Freelancer je rychlý, dokud stíhá. Když onemocní, tvoje sítě mlčí.
Velká agentura má tým, ale na schválení čekáš týdny.

U nás máš sehraný tým, jasný měsíční paušál bez hodin navíc a jeden kontakt, který odpovídá rychle.

A kde jsi teď ty? Freelancer, agentura, nebo sítě po večerech?
```
- **Hashtagy:** #sparkee #socialmediaagentura #spravasocialnichsiti #podnikani #malefirmy
- **Alt text:** Maskot Sparkee stojí uprostřed posuvníku mezi freelancerem a velkou agenturou. Text: Někde mezi. Přesně tady. Systém agentury, tempo freelancera.

### P4 · Carousel „Tvůj Instagram se jen válí? 5 chyb, které ho brzdí“ · SVĚTLO sky
- **Formát:** carousel 8 × 1080×1350. Obsah z článku „Jak často postovat na Instagram v roce 2026“. Každá chyba = jiná nálada maskota + hned oprava, maskot střídá stranu karty.
- **Proč „válí“, ne „spí“:** `lie.svg` má otevřené oči, jako spící by nečetl. Ležící maskot s úsměvem je přesně „válí se“.
- **Slidy:**
  1. Obálka bez rámu: pilulka ✦ TIP, „Tvůj Instagram se jen válí?“ + „5 chyb, které ho brzdí“, velký `lie.svg` přes spodní polovinu, štítky „Poslední post: před 47 dny“ a „Stories tento týden: 0“, „Přejeď →“.
  2. Chyba 1: „Start na plný plyn. První měsíc denně, pak ticho.“ Oprava: „Tempo na 6 měsíců, ne na 2 týdny.“ · `happy.svg` vpravo
  3. Chyba 2: „Postování, ať tam něco je. Slabý post učí lidi, že tě nemusí sledovat.“ Oprava: „Radši 3 dobré týdně než 7 průměrných.“ · `surprised.svg` vlevo
  4. Chyba 3: „Všude stejný obsah. Reel z IG na TikToku jde, ale popisek, hudba a tón musí sedět síti.“ Oprava: „Jedno video, tři verze textu.“ · `peek.svg` tlapkami na spodní hraně karty
  5. Chyba 4: „Komentáře bez odpovědi. Konverzace je taky obsah.“ Oprava: „Odpovídej hlavně první hodinu po publikaci.“ · `phone-wave.svg` vlevo
  6. Chyba 5: „Nikdo nečte statistiky. Bez čísel nevíš, co přidat a co škrtnout.“ Oprava: „Jednou měsíčně: dosah, uložení, sdílení a noví sledující.“ · rig `glance` 1,0 s (čte čísla v telefonu)
  7. „Budíček ✦ Začni na 3 postech týdně. Aspoň 1 Reel a Stories většinu dní.“ Týden: Po post, St Reel, Pá post, pod dny kroužky Stories Po až So (6 ze 7), Ne volno · `stand.svg`
  8. CTA: „Ulož si to na chvíli, kdy budeš plánovat.“ + „Nebo to nech na nás:“ a okno zpráv s odeslaným JISKRA, sparkee.cz · `wave.svg`
- Na slidech 2 až 6 jen velké číslo a „Chyba“, bez dalšího počítadla.
- **Popisek:**
```
Tvůj Instagram se jen válí? Tady je 5 nejčastějších důvodů ✦

Dobrá zpráva: žádný z nich nepotřebuje větší rozpočet. Jen systém.

Ke každé chybě máš v carouselu i opravu. Ulož si ho na chvíli, kdy budeš plánovat další měsíc.

Která chyba je tvoje? Napiš číslo do komentářů, nesoudíme.

Celý článek o tom, jak často postovat, najdeš na blogu. Odkaz v biu.
```
- **Hashtagy:** #instagramtipy #instagramprofirmy #socialnisite #obsahovymarketing #malefirmy
- **Alt texty:** v `feed/04_5-chyb/alt.txt`.

### P5 · Reel „Můžete to udělat víc virální?“ · TMA · střed gridu
- **Formát:** Reel 1080×1920, 8,0 s smyčka, 30 fps, vlastní cover. Stejný engine a nahrávání jako P1. **Video zatím chybí** (patří do práce na Reelech), bez něj P5 publikovat nejde. Hotové uložit do `feed/05_reel-viral/reel.mp4`.
- **Maskot:** rig `glance` → `hey` → `nod` → `tap` → zpět do klidu. Akce v plných délkách, takže smyčka nemá skok. Maskot uprostřed, výška cca 760 px, chodidla y ≈ 1400, glow louže.
- **Scénář:**
  - 0,00 až 2,20 s: od snímku 0 nahoře obecná bublina zprávy (ne kopie IG UI) „Můžete to udělat víc virální?“ + malé „klient, pátek 16:58“ v y 280 až 480. Maskot `glance`, čte telefon.
  - 2,20 až 3,35 s: `hey` (drzé zavrtění hlavou, široké oči, plamínek vzplane), velký pastelový „!“ vedle hlavy. SFX pop.
  - 3,35 až 5,15 s: `nod`, bublina odjede, text „Virál neslíbíme.“ (Baloo 2 ExtraBold 100 px).
  - 5,15 až 7,65 s: `tap`, v 6,10 s vyskočí z telefonu srdíčko, text „Systém, co roste? To jo ✦“ („To jo ✦“ v holo).
  - 7,65 až 8,00 s: klid, bublina se vrátí do polohy ze snímku 0, plynulá smyčka.
  - Text jen v x 72 až 952, y 240 až 1480.
- **Cover:** „Když klient chce virál ✦“ + bublina zprávy, rig `hey` 0,5 s (široké oči, jediná dlaždice gridu s telefonem, tady dává smysl), chodidla y ≈ 1550.
- **Popisek:**
```
Zpráva, kterou zná každý, kdo dělá sítě ✦
„Můžete to udělat víc virální?“

Upřímně: virál neslíbí nikdo, kdo to myslí vážně. My slibujeme něco lepšího. Pravidelný obsah, jasný plán a každý měsíc čísla, ze kterých je vidět posun.

Označ kolegu, který chce virál do pátku.
```
- **Hashtagy:** #sparkee #marketinghumor #socialnisite #instagramtipy #marketingcz
- **Alt text:** jen FB a TikTok: Maskot Sparkee čte zprávu Můžete to udělat víc virální?, zavrtí hlavou a odpoví: Virál neslíbíme. Systém, co roste? To jo.

### P6 · Carousel „Kolik stojí správa sociálních sítí?“ · SVĚTLO lilac
- **Formát:** carousel 7 × 1080×1350. Obsah z článku „Kolik stojí správa sociálních sítí v roce 2026?“. Transparentnost staví důvěru a nenásilně vede k ceníku.
- **Slidy:**
  1. Obálka: pilulka ✦ ČÍSLA, „Kolik stojí správa sociálních sítí?“ (holo jen „sítí?“) + „Čísla bez mlžení, 2026“, cenovky „? Kč“, `surprised.svg` celý v kartě, „Přejeď →“.
  2. „Nejdřív rozsah, pak cena. Kompletní správa obsahuje: strategii, kalendář, tvorbu obsahu, publikaci, komunitu, report.“ · `wave.svg`
  3. „Orientačně za měsíc, bez DPH a bez rozpočtu na reklamu“: pruhy Freelancer 5 000 až 20 000 Kč · Praktická agentura 15 000 až 40 000 Kč (zvýrazněný řádek se štítkem „✦ to jsme my“) · Velká agentura 60 000 Kč a víc (pruh končí šipkami ›››) · Interní člověk 45 000 až 70 000 Kč, pod názvem „celkové náklady firmy“. Osa 0 Kč až 80 tis. (32 px), poznámka „Orientační rozpětí, český trh.“ Bez maskota, graf potřebuje místo.
  4. „Co cenu posouvá nejvíc: počet sítí · frekvence · video, nebo grafika · natáčecí dny · komunita i o víkendu · reklama · kolik lidí schvaluje.“ · `peek.svg` na horní hraně karty
  5. „Co paušál obvykle nezahrnuje: rozpočet na reklamu · honoráře influencerů · velké produkce · licence na hudbu, fotobanky a fonty · krizovou komunikaci. Nech si to potvrdit před podpisem.“ · rig `point` 0,3 s (náklon a ruka k seznamu)
  6. „6 otázek do každé nabídky: Kolik přesně postů, videí a Stories? Kdo tvoří a kdo natáčí? Kolik kol úprav? Jak rychle odpovídáte? Jaký report? Výpověď a komu patří obsah?“ · rig `glance` 1,0 s (čte nabídku v telefonu), stejné měřítko jako slide 5
  7. CTA: „U nás paušál od 14 900 Kč měsíčně bez DPH“ + účtenka: přesný počet výstupů, žádné hodiny navíc, reklamu platíš přímo platformám, „Celý ceník najdeš v biu ✦“, sparkee.cz · `happy.svg`
- **Popisek:**
```
Kolik stojí správa sociálních sítí v roce 2026? Čísla bez mlžení ✦

Orientačně, bez DPH a bez rozpočtu na reklamu:
✦ freelancer: 5 000 až 20 000 Kč měsíčně
✦ menší praktická agentura: 15 000 až 40 000 Kč
✦ velká agentura: 60 000 Kč a víc
✦ interní člověk: 45 000 až 70 000 Kč celkových nákladů firmy

Než začneš porovnávat ceny, porovnej rozsah. Kolik postů a videí? Kdo natáčí? Kolik kol úprav? Komu patří obsah?

V carouselu máš i seznam věcí, které paušál obvykle nezahrnuje. Právě tam vznikají nepříjemná překvapení.

Ulož si to na chvíli, kdy ti přijdou dvě nabídky lišící se o polovinu.
```
- **Hashtagy:** #spravasocialnichsiti #socialmediaagentura #marketingprofirmy #podnikani #sparkee
- **Alt texty:** v `feed/06_kolik-stoji/alt.txt`.

### P7 · „Firemní Instagram bingo ✦“ · TMA
- **Formát:** single 1080×1350. Sdílecí post do DM (sdílení je nejsilnější signál dosahu).
- **Vizuál:** ink + bloby, nadpis „Firemní Instagram bingo ✦“, pod ním mřížka 3×3 zaoblených pastelových karet (mint, sky, lilac, blush) s ink textem Nunito Black 34 px. Dole „Kolik máš? Napiš do komentářů ✦“.
- **Pole:** 1 „Dáme tam něco, ať to žije.“ · 2 Poslední post: před 3 měsíci · 3 Instagram dělá synovec · 4 „Proč to nemá víc lajků?“ · 5 **✦ FREE** · 6 Stories? Ty jsou taky? · 7 Na zprávy odpovídáš za týden · 8 „Dej tam leták.“ (místo „30 hashtagů, 3 lajky“, IG dnes pustí max 5 hashtagů) · 9 Post v neděli ve 23:47
- **Maskot:** `head.svg` ve středovém poli FREE na holo glow (výjimka z horizontu).
- **Popisek:**
```
Firemní Instagram bingo ✦
Zakroužkuj, co znáš. Buď upřímný, nikdo to neuvidí. Teda kromě nás.

0 až 2: jiskra tam je
3 až 5: chce to systém
6 a víc: napiš JISKRA do zpráv, dáme to dohromady

Kolik máš? A pošli to kolegovi, který má sítě „na starosti“ 😅
```
- **Hashtagy:** #sparkee #instagramprofirmy #socialnisite #podnikani #marketinghumor
- **Alt text:** Bingo 3x3 s typickými chybami firemního Instagramu, uprostřed hlava maskota Sparkee jako volné pole.

### P8 · Carousel „Od chaosu k číslům: jak to u nás běží“ · SVĚTLO blush
- **Formát:** carousel 8 × 1080×1350. Konverzní post pro ty, kdo už sledují. Kroky přesně podle webu.
- **Slidy:**
  1. Obálka bez rámu: pilulka ✦ SYSTÉM, „Od chaosu k číslům“ + „Jak to u nás běží, krok za krokem“. Čárkovaná cesta od klubka chaosu přes 1 Audit, 2 Plán, 3 Tvorba ke kartě 4 Report s rostoucími sloupci, `peek.svg` vykukuje přes horní hranu reportu, „Přejeď →“.
  2. Audit a poznání (týden 1): „Projdeme tvoje sítě, konkurenci a cíle. Zjistíme, kde je jiskra a kde chybí.“ Výstup: audit s doporučením · `surprised.svg`
  3. Strategie a plán (týden 2): „Content pilíře, tón komunikace a obsahový kalendář ke schválení.“ Výstup: plán na měsíc · `stand.svg`
  4. Tvorba a publikace (každý měsíc): „Natočíme, nafotíme, napíšeme, naplánujeme. Ty jen schválíš.“ Výstup: obsah ke schválení · rig `tap` 2,0 s
  5. Report a ladění (každý měsíc): „Čísla na jedné stránce. Na rovinu, co funguje a co změníme.“ Výstup: report na 1 stránce · rig `present` 0,5 s
  6. „Co dostaneš každý měsíc: plán a kalendář ke schválení · posty, Reels a Stories podle balíčku · odpovědi na komentáře a zprávy · report na 1 stránce a další krok.“ (výstupy, ne opakování pravidel z P2) · `happy.svg`
  7. „Kolik to stojí?“ Spark 2 sítě, 12 postů, od 14 900 Kč · Glow 3 sítě, 16 postů, od 24 900 Kč (holo štítek „✦ nejoblíbenější“ jako na webu) · Blaze 4+ sítě, 24 postů, od 39 900 Kč. „Měsíčně, bez DPH. Reklamu platíš přímo platformám.“ + sleva 10 % při závazku na 6 měsíců · `wave.svg` (sticker.svg jen na tmavé)
  8. CTA: „První obsah do 14 dnů od podpisu ✦ Napiš JISKRA do zpráv.“ Kalendář 1 až 14 (1 = podpis, 14 = obsah ✦), `lie.svg` se na něm válí, sparkee.cz
- Pozici v sérii nese jen horní stepper (bez velkého čísla a počítadla).
- **Popisek:**
```
Jak vypadá spolupráce s námi? Žádná magie. Systém ✦

Týden 1: audit. Týden 2: plán. Pak každý měsíc tvoříme, publikujeme a vyhodnocujeme. Ty jen schvaluješ a nic nevyjde bez tvého souhlasu.

První obsah vychází do 14 dnů od podpisu.

Chceš vědět, kde je na tvých sítích největší potenciál? Napiš nám do zpráv slovo JISKRA.
```
- **Hashtagy:** #sparkee #spravasocialnichsiti #socialmediaagentura #marketingprofirmy #podnikani
- **Alt texty:** v `feed/08_od-chaosu-k-cislum/alt.txt`.

### P9 · „Máš nápad? Přidáme jiskru.“ (CTA z Figmy) · TMA · připnout
- **Formát:** single 1080×1350. Figma post „Aplikace“ (1080×1080) převedený na 4:5.
- **Vizuál:** ink + bloby, „Máš nápad? Přidáme jiskru.“ (Baloo 2 ExtraBold 122 px), mist štítek „20 minut nezávazné konzultace“, holo pilulka „Pojďme na to →“, sparkee.cz, ✦ podpis vpravo nahoře.
- **Maskot:** `happy.svg` (jásá) s ✦ kolem, na holo glow louži, chodidla na horizontu y ≈ 1230.
- **Popisek** (kapacita typu „V říjnu bereme 3 nové firmy.“ se doplní až po potvrzení, viz kap. 11):
```
20 minut nad tvým Instagramem. Nezávazně a na rovinu ✦

Máš nápad? Přidáme jiskru. Řekneme ti, co funguje, co ne a kde je největší potenciál. Bez prodejní omáčky.

Napiš JISKRA do zpráv nebo klikni na odkaz v biu.
```
- **Hashtagy:** #sparkee #spravasocialnichsiti #socialmediaagentura #marketingcz #podnikani
- **Alt text:** Jásající maskot Sparkee. Text: Máš nápad? Přidáme jiskru. 20 minut nezávazné konzultace. Pojďme na to. sparkee.cz

### Zásobník (post 10 a dál)
„Jaký Sparkee jsi dnes?“ (nálady 2×3, tma) · „Audit Instagramu za 10 minut“ (checklist, lead magnet) · „Jak často postovat“ (carousel z blogu) · „Tři balíčky“ (nabídka) · „Jak jsem vznikl“ (skica → Figma → kostra rig.svg) · mini case (jen se svolením klienta).

---

## 6. Hlavní Reel: „Jiné agentury mají logo. Tahle má mě ✦“

### Koncept
Snímek 0 je oficiální logo Sparkee (`assets/img/logo.svg`, celé a beze změny) na světlém mist `#F5F4FB`. V 0,58 s logo „vybuchne“: v bílém záblesku zmizí celé najednou, písmena se rozletí jako jiskry ✦ a živý maskot vyletí ven. Z maskota se jako kruhová clona otevře tmavý svět a v něm jeden souvislý záběr, jeden živý maskot a svět se mění kolem něj: chaos → plán → obsah → čísla → jiskra. Na konci se tma zavře zpátky do maskota, ten skočí do pózy loga a v záblesku se vrátí celé logo. Poslední snímek = snímek 0, smyčka působí jako jeden pohyb.

**Pravidla loga (klient):** logo jen oficiální a celé, jen na světlém mist; maskot ležící na wordmarku je vždy ten z loga (stejná pozice, měřítko, náklon, pixely), žádný druhý maskot přes něj. Wordmark bez maskota nikdy. Logo a živý maskot nikdy spolu: výměna leží přesně mezi dvěma snímky (17/18 a 574/575) uvnitř bílého záblesku 0,97 v obou sousedních snímcích.

### Hook (první sekunda)
- **0,0 s:** celé logo na mist a nahoře text „Jiné agentury mají logo.“ (ink) už od snímku 0 (žádný fade in).
- **0,3 s:** logo se nabíjí (nádech, chvění, jiskry se stahují do maskota), **0,58 s** výbuch: maskot vyletí a z něj se otevře tma (pattern interrupt).
- **1,14 s:** pointa „Tahle má mě ✦“ dopadne spolu s maskotem.
- Alternativní hooky na Trial Reels: „Tohle logo má nohy.“ · „Postuješ, až když si vzpomeneš?“

### Technika
- 1080×1920, 30 fps, 19,7 s = 591 snímků, H.264 yuv420p (bt709), CRF 14, +faststart. Seekovatelná stránka `_src/reel.html`, nahrává `_src/record_reel.mjs`.
- **Safe zóna pro text:** x 72 až 952, y 300 až 1500 (IG: nahoře 220 px, dole 420 px, vpravo 120 px bez textu). `record_reel.mjs --check` kontroluje každý snímek: text v zóně, žádné překryvy, maskot mimo text, každý text celý vidět ≥ 1,2 s, logo × maskot, záblesk ve výměně.
- **Pozadí:** světlá fáze mist `#F5F4FB` jen kolem loga. Tmavý svět ink `#2C303C` + 4 holo bloby (mint, sky, lilac, blush), drift s periodou přesně 19,7 s, zrno 2,8 %; otevírá a zavírá se kruhovou clonou z maskota s tenkým holo lemem. Text přes hranu clony přepne barvu (ink venku, mist uvnitř).
- **Typo:** nadpisy Baloo 2 ExtraBold (mist na tmě, ink na světle), doplňky Nunito Bold 44 px, holo na klíčová slova a ✦, holo zvýrazňovač pod „scroll“ a „čísla“.
- **Pohyb:** slova naskočí zdola s přestřelem a odjedou nahoru (dřív, než přijde další blok); pilulka kroku se protáčí 1 PLÁN → 2 OBSAH → 3 ČÍSLA; rekvizity přecházejí jedna v druhou (čipy → kalendář → feed → sloupce → jiskry → plamínek). Kamera jen nádech do loga a jemné chvění světa v chaosu.
- **Rig:** živý rig z webu, deterministická simulace 1/120 s, nikdy se nedeformuje (jen uniformní měřítko). Velikosti: hrdina ≈ 660 px (Tahle, Ahoj, CTA), chaos ≈ 600 px, s rekvizitami ≈ 555 px.
- **Logo:** `assets/img/logo.svg` jako obrázek, x 92 až 932, y 860 až 1292; jen celé, jen uniformní měřítko (nádech, dopad). Geometrie se měří za běhu (logo.svg = původní vektor loga × 0,5695), rig v póze loga má hlavu přesně na hlavě loga (kontrola `reel.html?ov=1`).

### Scénář po sekundách

| Čas (s) | Obraz a maskot | Text na obrazovce (safe zóna) | Zvuk |
|---|---|---|---|
| 0,00 až 0,30 | **HOOK.** Mist, celé logo.svg, jemná pastelová záře. Kamera nádech 1,00 → 1,035. | „Jiné agentury / mají logo.“ ink, Baloo 2 ExtraBold 100 px, y 300 až 516, od snímku 0. | tichý nádech |
| 0,30 až 0,58 | Logo se nabíjí jako celek (0,984 → 1,014, chvění 1,6 px), 9 jisker se stáhne do maskota, bílé světlo logo rozpálí. | drží | riser |
| 0,58 | **VÝMĚNA** (snímky 17/18) v bílém záblesku: logo zmizí celé, rig v plné rychlosti výskoku, písmena se rozletí jako jiskry ✦ z jejich obrysu, prstenec. | drží | jiskřivý cink |
| 0,60 až 1,20 | Z maskota se otevře tma (kruhová clona s holo lemem). Maskot vyletí, narovná se s přestřelem, přiblíží se (≈ 660 px) a v 1,16 dopadne, burst srdíček. | Text přes hranu clony přepne ink → mist. 1,14: **„Tahle má mě ✦“** 120 px dopadne s maskotem. | whoosh, dopad 1,16 |
| 1,20 až 2,72 | ^^ radost, pohled do kamery. | drží | |
| 2,50 až 4,40 | `wave` (3 mávnutí, hlava se naklání). | 2,86: „Ahoj, jsem / Sparkee ✦“ 120 px | |
| 4,22 až 6,86 | **CHAOS.** `hop` dozadu (≈ 600 px). 6 pastelových čipů vlétne ze stran a krouží vpředu i za maskotem („deadline dnes!“, „3 nepřečtené“, „kde je post?“, „Po? Út?“, „0 lajků“, „!!!“). Uh-oh výraz, oči těkají, 5,7 `hey` (zavrtí hlavou), jemné chvění světa. | 4,6: „Sítě bez systému?“ 100 px + „Žádný plán. Nula čísel.“ 44 px | 3 notifikace |
| 6,90 až 9,80 | **PLÁN.** `present` (ta-da, poskok do pozice s rekvizitami). 7,22 čipy zacvaknou do 7 dlaždic Po až Ne, 7. dlaždici vyplní jiskra z plamínku. „✓ Naplánováno“, 8,34 `nod`. | Pilulka „1 PLÁN“ mint + „Plán na měsíc / dopředu.“ 88 px + „Žádné ‚co dáme dnes?‘“ 44 px | 7 cvaknutí |
| 9,80 až 12,70 | **OBSAH.** Kalendář se rozjede doleva jako feed, proletí Reels (rozmazání pohybem, počítadlo 0 → 12). Na první ťuk maskota (`tap`) v 10,8 se feed s přestřelem zastaví přesně na naší holo kartě ✦ (pop, prstenec, záře), ostatní ustoupí. Srdíčka z telefonu, mrknutí. | Pilulka se protočí na „2 OBSAH“ sky + „Obsah, který / zastaví scroll.“ (zvýrazňovač pod „scroll“ v okamžiku zastavení) + „Jeden natáčecí den = 8 až 12 Reels“ | swoosh, stop 10,8, ťuk, pop |
| 12,70 až 14,60 | **ČÍSLA.** Karty propadnou, za maskotem vyrostou 3 sloupce „dosah“, „uložení“, „sledující“, holo linka zakončená ✦, štítek UKÁZKA (žádná vymyšlená čísla), `nod`. 14,56 se sloupce rozpadnou na jiskry, které vletí do plamínku (vzplane). | „3 ČÍSLA“ lilac + „Každý měsíc čísla. / Ne pocity.“ (zvýrazňovač pod „čísla“) | arpeggio, jiskření |
| 14,60 až 18,40 | **CTA.** `cheer` (poskoky, přiblíží se na ≈ 660 px). 16,5 `tap`: z telefonu vyskočí DM bublina „JISKRA ✦“ a vletí do CTA pilulky (pulz). | 14,8: „Sleduj mě ✦“ 120 px + holo pilulka „Napiš JISKRA do zpráv ✦“ + „sparkee.cz“, y 300 až 634 | dopady, pop |
| 18,40 až 19,15 | Tma se zavře kruhovou clonou do maskota. Maskot se odrazí a skočí do pózy loga (zmenšuje se, naklání na −24°), jiskry se slétnou do obrysu písmen. | CTA odjede nahoru | whoosh |
| 19,15 | **VÝMĚNA** (snímky 574/575) v bílém záblesku: rig zmizí, celé logo se vynoří ze světla a chytí náraz (1,024 → 1), prstenec. | 19,18: „Jiné agentury / mají logo.“ znovu naskočí (ink) | cink |
| 19,15 až 19,70 | Klid. Poslední snímek = snímek 0. | drží | |

Hlavní střihy: 0,58 · 2,9 · 4,4 · 7,1 · 9,8 · 10,8 · 12,9 · 14,6 · 19,15 s. Bez voiceoveru, veškerá informace je v textu (většina lidí kouká bez zvuku). Volitelně později dabing hlasem maskota (ElevenLabs [DOPLNIT hlas]) a pak zapnout automatické titulky.

### Cover
Jediný platný cover je `feed/01_reel-ahoj/cover.png`: „Ahoj, jsem Sparkee ✦“ + štítek „tvář social media agentury“, tma + glow, `wave.svg` s ^^ očima (bez telefonu), text v y 400 až 790, chodidla na horizontu y ≈ 1550, vše ve výřezu 3:4 (y 240 až 1680). Sedí na společný horizont gridu a je v náhledu profilu.

### Popisek Reelu
Stejný jako P1 (viz kapitola 5, soubor `feed/01_reel-ahoj/caption.txt`). Hlavní CTA je stejné jako na koncové kartě: napiš JISKRA do zpráv.

### Zvuk
Firemní účet smí v aplikaci použít jen bezlicenční hudbu z Meta Sound Collection, ne trendy popové skladby. Proto do MP4 zapéct jen vlastní SFX (cink 0,58 s, dopad 1,16 s, 3 notifikace, 7 cvaknutí, ťuk + pop, arpeggio, whoosh, dopad, závěrečný cink) a v aplikaci přidat veselý instrumentál z Meta Sound Collection (hledat „happy upbeat“, „playful pop“, ukulele nebo pluck, 115 až 125 BPM) na 25 až 30 % hlasitosti a doladit střihy na nejbližší dobu. Zvuk pojmenovat jako originální audio „Sparkee jiskra ✦“, ať se dá znovu použít jako zvuková značka. [DOPLNIT: licence, pokud se hudba zapéká přímo do videa]

---

## 7. Launch stories (6 snímků)

Technika: 1080×1920, text a stickery v y 250 až 1580 a x 64 až 1016 (nahoře lišta profilu, dole pole odpovědi). Ve PNG je v ploše pro nativní sticker jen měkká pastelová záře bez rámečku, takže kolem menšího stickeru nic nevykukuje. Obrys plochy a nákres stickeru ukazuje jen `_preview/stories-guide.png`. Link stickery vždy s UTM `utm_source=instagram&utm_medium=social&utm_campaign=ig_launch&utm_content=story_sN`. Přesné plochy a odkazy: `stories/stories.txt`.

| # | Kdy | Obsah | Highlight |
|---|---|---|---|
| S1 | Den 0, 10:15 (po oznámení mimo IG) | Ink + bloby, `wave.svg` (živá 5s smyčka z rigu může přijít jako MP4). „Ahoj, jsem Sparkee ✦ Ode dneška i na Instagramu.“ + ručně psaná poznámka „Tohle je můj plamínek. Jak by se měl jmenovat?“ + otázkový sticker **„Pojmenuj můj plamínek“**. Nejlepší jména pak jako anketa, vítěz do highlightu. | Ahoj ✦ |
| S2 | Den 0, 10:30 | Sdílení Reelu P1: nadpis „Můj první Reel ✦“, pod plochou pro Reel stojí `sticker.svg` na glow louži. Postup v `stories/stories.txt`: P1 → Sdílet → Přidat do příběhu, PNG přidat jako fotku přes celou plochu, náhled Reelu dát dopředu do plochy x 360 až 720, y 560 až 1200. Předem vyzkoušet na soukromém testovacím účtu, záloha je automatické pozadí + nativní text. | Ahoj ✦ |
| S3 | Den 0, 14:00 | Ink + bloby, `surprised.svg`. Anketa **„Co tě na firemních sítích štve nejvíc?“** Nemám čas / Nevím, co postovat / Nevidím výsledky / Nikdo nereaguje. Výsledky = témata dalších carouselů. | ne |
| S4a | Den 2 (čt 8. 10., s P4) | Mist + sky, `phone.svg`. Kvíz **„Kolik Reels týdně dává firmám smysl?“** A) 0 B) 2 až 4 C) 20, správně B. | Tipy |
| S4b | Den 2, po kvízu | Štítek „Ideál 2 až 4, na start stačí 1 ✦“ (sedí s P4: 3 posty týdně, aspoň 1 Reel), karta článku s jediným maskotem v náhledu, link sticker „Celý článek“ na `blog/jak-casto-postovat-na-instagram.html` (utm_content=story_s4). | Tipy |
| S5 | Den 16 (čt 22. 10., s P9) | Figma story CTA: „Máš nápad? Přidáme jiskru.“ + link sticker **„zjistit víc“** na `#kontakt` (utm_content=story_s5) + „nebo napiš JISKRA do zpráv“, `happy.svg`. | Kontakt |

Stálý obsah highlightů (12 snímků) je v kap. 3.

**Pravidla dál:** každý nový post sdílet do Stories. Denně 3 až 5 snímků, aspoň 1 interaktivní sticker denně. Šablona na později: Figma „Nová spolupráce ✨“ + CTA „zjistit víc“ [DOPLNIT: reální klienti se svolením].

---

## 8. Harmonogram

### Před spuštěním (čt 1. 10. až po 5. 10.)
1. Firemní profesionální účet, handle, jméno, bio, odkazy (s titulky), kategorie, profilovka, tlačítka.
2. **Den −2 (ne 4. 10.):** 12 stories z `highlights/stories/` jako běžné stories, pak do 5 highlightů s covery (postup v `highlights/highlights.txt`). Bez nich se highlighty na profilu neukážou.
3. Automatická odpověď na JISKRA, automatické titulky, alt texty (u Reels IG pole nemá).
4. P1 až P9 připravit a naplánovat v Meta Business Suite. P5 jen s hotovým videem.
5. Sledovat 30 až 50 relevantních českých účtů (podnikatelské komunity, coworkingy, lokální firmy, marketingová komunita).
6. Tým si připraví osobní profily na sdílení launch Reelu. Jednou vyzkoušet postup S2 na soukromém testovacím účtu.

### Launch

| Den | Datum a čas | Post | Stories |
|---|---|---|---|
| Den 0 | út 6. 10., 09:00 | **P1** Reel „Tahle má mě“ (tma) | |
| Den 0 | út 6. 10., 09:20 | **P2** Karta postavy (mint) | |
| Den 0 | út 6. 10., 09:40 | **P3** Posuvník (tma). První řada je plná dřív, než přijdou první návštěvníci. | |
| Den 0 | út 6. 10., od 10:00 | oznámení mimo IG | S1 10:15, S2 10:30, S3 14:00 |
| Den 2 | čt 8. 10., 07:30 | **P4** 5 chyb (sky) | S4a, S4b |
| Den 6 | po 12. 10., 12:00 | **P5** Reel virál (tma), jen s hotovým videem | sdílení P5 |
| Den 8 | st 14. 10., 07:30 | **P6** Kolik stojí (lilac) | sdílení P6 |
| Den 10 | pá 16. 10., 12:00 | **P7** Bingo (tma) | sdílení P7 + anketa „Kolik máš? Méně než 3 / 3 a víc“ |
| Den 14 | út 20. 10., 07:30 | **P8** Od chaosu k číslům (blush) | sdílení P8 |
| Den 16 | čt 22. 10., 19:00 | **P9** CTA (tma) | S5 |

Den 0 až **po P3 (od 10:00)** oznámení mimo IG: osobní profily týmu, LinkedIn, newsletter, e-mailové podpisy. Kdo přijde, najde plnou první řadu (dark / light / dark) a hned otázku S1. Webový tým doplní odkaz na IG do patičky a do `sameAs`.

**Připnutí (hned po P9):** připnout v pořadí P9, pak P2, pak P1 (naposledy připnutý bývá vlevo; náhled profilu zkontrolovat a případně přepnout), aby horní řada byla P1 | P2 | P9.

**Proč tohle pořadí:** osobnost dřív než prodej (Reel a karta postavy), pak pozice, pak hodnota a humor pro uložení a sdílení, až nakonec proces, cena a CTA pro ty, kdo už sledují. Tma a světlo se striktně střídají, takže šachovnice drží po každém postu. Stories až po oznámení, aby otázka a anketa měly publikum.

---

## 9. Po launchi

- **Rytmus:** 3 posty týdně (min. 2), aspoň 1 Reel týdně, Stories denně 3 až 5 snímků. Časy (7 až 9 h, 12 až 13 h, 19 až 21 h) po 2 až 3 týdnech upravit podle Statistiky → Publikum.
- **Trial Reels:** alternativní hooky P1 („Tohle logo má nohy.“, „Postuješ, až když si vzpomeneš?“) a P4 převedený na 12s Reel publikovat jako Trial Reels. Vidí je jen nesledující a neobjeví se v gridu, šachovnici nerozbijí.
- **Engagement rutina:** 15 min před a 45 min po publikaci odpovídat na všechny komentáře hlasem maskota a psát smysluplné komentáře u 20 až 30 cílových účtů. DM JISKRA do 24 h osobně dotáhnout na call.
- **Crossposting:** P1 a P5 i na TikTok a FB, P3, P6 a P8 na LinkedIn.
- **Paid podpora dosahu:** od Dne 3 propagovat P1, od Dne 9 P6. Cíl návštěvy profilu, majitelé a marketéři malých a středních firem v ČR, 25 až 55 let. Rozpočet [DOPLNIT, návrh 3 000 až 5 000 Kč za 3 týdny], UTM `utm_campaign=ig_launch`.
- **KPI po 30 dnech** [DOPLNIT: cílové hodnoty]: uložení a sdílení vůči dosahu (hlavní signál), podíl diváků Reelu po 3 s a průměrná doba sledování, návštěvy profilu → kliky na odkaz v biu, počet zpráv JISKRA, domluvené konzultace (kontrola přes UTM v GA4).

---

## 10. Výroba

Výstupy do `social/instagram/`, generátory do `social/instagram/_src/`. Web se jen čte, `story.js` a OG obrázky neupravovat (pracují na nich jiní).

```
social/instagram/
  PLAN.md
  avatar/        sparkee-avatar-dark.png (A), sparkee-avatar-light.png (B), sparkee-avatar-s.png (C)
  highlights/    hl-1-ahoj.png … hl-5-tipy.png (covery 1080×1920), highlights.txt (pořadí, Den −2, odkazy)
    stories/     12 snímků stálého obsahu (ahoj-*, sluzby-*, cenik-*, kontakt-*, tipy-*)
  feed/          01_reel-ahoj/{cover.png, caption.txt, alt.txt, README.txt}   video: reel/sparkee-reel.mp4
                 02_karta-postavy/01…08.png
                 03_posuvnik/01.png
                 04_5-chyb/01…08.png
                 05_reel-viral/{cover.png, …, README.txt}                       video zatím chybí
                 06_kolik-stoji/01…07.png
                 07_bingo/01.png
                 08_od-chaosu-k-cislum/01…08.png
                 09_cta/01.png
                 (u každého postu caption.txt + alt.txt)
  stories/       s1-ahoj.png … s5-cta.png, stories.txt (kdy, sticker, plocha, odkaz, postup S2)
  reel/          sparkee-reel.mp4 (+ pracovní cover a popisek Reel agenta, nepoužívat)
  _preview/      profile-grid(-pinned, -dark).png, feed-overview.png, stories-guide.png, avatar-test.png
  _src/          content.mjs (všechny texty), kit.html/.css/.js (šablony), rig.html + rig/ (zmrazený rig),
                 preview.html (náhledy), build.mjs (PNG), reel.html + record_reel.mjs (MP4)
```

- **Build:** `node social/instagram/_src/build.mjs` přegeneruje vše (cca 4 min, jeden headless Chrome, po doběhnutí se vždy zabije). `--only p04,hs` jen vybrané joby, `--no-preview`, `--no-rig`.
- **Kontroly v buildu:** fonty s češtinou, safe zóny, text a štítky proti obrysu maskota, obrys maskota proti hranám karet (40 px, nebo rozhodně přes hranu), okraji plátna a kruhu profilovky. Popisky a alt texty nesmí obsahovat [DOPLNIT], bio max 150 znaků.
- **Šablony:** HTML + CSS s tokeny značky: ink `#2C303C` (z vektorů loga), pastely z webu mint `#A5EDC5`, sky `#9AD8F8`, lilac `#C49CF2`, blush `#F5B8DC`, pozadí mist `#F5F4FB` (web má paper `#F6F4EF`), Baloo 2 + Nunito z Google Fonts, pózy z `assets/img/poses/*.svg`, rig z `assets/js/mascot-rig.js` + `assets/js/mascot.js` (jen načíst).
- **Reels:** seekovatelná stránka (`window.seek(t)`), časová osa podle TL třídy ze `story.js` (zkopírovat do `_src`, originál needitovat), `SparkeeMascot.create(svg, {lab:true, seed})` + `set(akce, t)`.
- **Nahrávání:** `_src/record_reel.mjs`: snímek po snímku přes Chrome DevTools → ffmpeg (`lions-liga-voiceover/node_modules/@remotion/compositor-darwin-arm64/ffmpeg`, `DYLD_LIBRARY_PATH` = ta složka, vstup png, libx264, yuv420p, +faststart).
- **Stroj:** vždy jen jeden Chrome na agenta a po exportu ho zabít. Scratch do `scratchpad/ig/`.
- **Kontrola před publikací:** grid náhled 3:4, safe zóny Reelu (overlay IG UI), čitelnost ve 40 px, žádné pomlčky v textech, maskot nedeformovaný.

---

## 11. DOPLNIT (otevřené body pro klienta)

- [ ] Handle: ověřit dostupnost na IG, TikToku, FB a LinkedInu.
- [x] Tykání vs. vykání: rozhodnuto. Maskot a IG „ty“, agentura (web, nabídky) „vy“. Claim „Dodáme jiskru vašim sociálním sítím“, řádek v biu „…tvým sociálním sítím ✦“ je hlas maskota.
- [ ] Profilovka: varianta A, B, nebo C.
- [ ] Datum launche (návrh út 6. 10. 2026, highlight stories Den −2 = ne 4. 10.).
- [ ] Ceny Spark / Glow / Blaze, obsah balíčků a sleva 10 % za 6 měsíců (P6, P8, highlight Ceník).
- [ ] Tržní rozpětí cen v P6 (freelancer, agentura, interní člověk jako celkové náklady firmy).
- [ ] Doba odpovědi (SLA), výpovědní lhůta, e-mail a telefon (zatím nejsou na žádném snímku).
- [ ] Finální doména a UTM podle tracking standardu v2.1.
- [ ] Automatická odpověď na JISKRA: nástroj, text a kdo zprávy do 24 h osobně dotáhne na call. JISKRA je hlavní CTA v biu, P1, P4, P7, P8, P9 a na koncové kartě Reelu.
- [ ] Kapacita na P9 (např. „V říjnu bereme 3 nové firmy.“): do popisku až po potvrzení.
- [ ] P5 Reel: chybí video (reel.mp4), bez něj P5 nepublikovat.
- [ ] Rozpočet na paid podporu a cílové KPI.
- [ ] Hudba: licence, pokud se zapéká do videa. Hlas maskota pro případný dabing.
- [ ] Reální klienti se svolením pro highlight Výsledky a mini case.
- [ ] Webový tým: odkaz na IG do patičky a do `sameAs`.
