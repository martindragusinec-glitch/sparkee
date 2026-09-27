# Sparkee ✦ Brand manuál ve Figmě: osnova a plán stavby

Verze osnovy 0.1 · 27. 9. 2026 · stav: **příprava, nic se zatím nezapisuje do Figmy**
Stavět se začne až po dokončení Instagram kitu (viz `TODO.md`, sekce „Potom“).

Podklady:
- benchmark: GitHub, Slack, Uber, Discord, Mailchimp, Duolingo, Headspace, Monzo, Spotify, Atlassian, IBM Carbon. Zdroje jsou v části 9.
- inventura značky: Figma `4OdxiJ5jvTf0SMYucdkwtK` (pracovní kopie) a repo `sparkee-web/`.

Legenda v tabulkách:
- **P1**: patří do verze 1.0, bez toho manuál nepředáme.
- **P2**: přijde ve verzi 1.1 nebo později.
- `[E]`: podklad už existuje.
- `[N]`: podklad se musí vytvořit.
- `[K]`: čeká na rozhodnutí klienta. Čísla otázek `K01` až `K45` jsou v části 7.

---

## 0. Ve zkratce

- **Forma:**
  - slidy **1920×1080** ve stávajícím pracovním souboru. Stejný formát mají dnešní rámy 48:16 až 48:20.
  - Všechny slidy manuálu leží na **jedné stránce „📘 Brand Manual“**, rozdělené do sekcí po kapitolách. Díky tomu fungují odkazy z obsahu, jeden prezentační flow a export do jednoho PDF.
- **Rozsah:**
  - 16 kapitol (00 až 15), zhruba 130 slidů.
  - Verze 1.0 (P1) má asi 85 slidů. Zbytek (P2) doplní verze 1.1.
- **Manuál je zároveň knihovna:**
  - obsahuje proměnné (barvy, rozměry, typografie, motion), textové a efektové styly, gridy a komponenty;
  - každý swatch, ukázka písma i šablona je navázaná na proměnnou, nic není natvrdo.
  - Zdroj pravdy pro kód je `tools/brand/tokens.json`. Z něj se generují CSS proměnné i Figma variables.
- **Co blokuje stavbu:** 8 rozhodnutí (K01 až K08). Týkají se jednoho inku, jedné sady pastelů, jednoho holo přechodu, světlého pozadí, wordmarku, ty/vy, UI stylu a jiskry. Bez nich by manuál uzákonil dnešní nekonzistence.
- **Co v manuálu nejvíc chybí:**
  - příběh, mise, hodnoty a pozicování;
  - ochranná zóna a zakázané použití loga;
  - kontrastní tabulka;
  - pravidla „kdy maskot ne“ a „správně / špatně“;
  - motion tokeny;
  - ikonová sada;
  - vizitka, e-mailový podpis, šablona prezentace a měsíčního reportu;
  - balík ke stažení;
  - správa značky.

---

## 1. Forma, soubor a navigace

### 1.1 Kde manuál stavíme

**Doporučení:** stavět v pracovním souboru `4OdxiJ5jvTf0SMYucdkwtK`. Originál `2mgwg0vr373tHNFX5yh9JP` je jen pro čtení.
- Komponenty maskota (190:747 až 190:777), animace (191:3) a Instagram (191:2) už jsou tady. Manuál je tak použije přímo, bez publikování knihovny.
- Pokud to tým ve Figmě dovolí (Professional a vyšší), soubor publikujeme jako knihovnu „Sparkee Brand“. Šablony v jiných souborech pak berou proměnné a komponenty odsud. [K40]

### 1.2 Stránky souboru (nové pořadí)

| # | Stránka | Obsah | Stav |
|---|---|---|---|
| 1 | `📘 Brand Manual` | Všechny slidy 1920×1080. Jedna sekce na kapitolu, kapitoly v řádcích pod sebou. Úplně nahoře rám `Thumbnail` 1600×960 nastavený jako náhled souboru. | [N] |
| 2 | `🎨 Tokeny a styly` | Pracovní přehled proměnných, textových a efektových stylů a gridů. Pro designéry, ne pro klienta. | [N] |
| 3 | `🧩 Komponenty` | Logo, jiskra, záře, UI, ikony, dokumentační komponenty (swatch, do/don't, specimen…). | [N] |
| 4 | `🧩 Maskot · pózy` (186:2) | Stávající zdroj 11 komponent maskota. Přibude 6 póz ze snímků riggu a výrazy. Dnešní název obsahuje pomlčku, přejmenovat. | [E] + [N] |
| 5 | `📐 Šablony` | IG post, carousel, story, Reel cover, highlight, OG, vizitka, e-mailový podpis, prezentace, report, nabídka. | [N] |
| 6 | `📱 Instagram` (191:2) | Hotový launch kit, sekce Profil / Feed / Stories / Reel se už připravují. Manuál z něj bere ukázky. | [E] po kitu |
| 7 | `🎬 Animace 20 s` (191:3) | Beze změny, manuál na ni odkazuje z kapitoly Motion. | [E] |
| 8 | `📦 Ke stažení` | Rámy assetů s export presety (SVG/PNG/PDF), pojmenované podle konvence z části 15.02. | [N] |
| 9 | `📝 Changelog` | Tabulka verzí a změn. | [N] |
| 10 | `🗄 Archiv` | Sem se přesunou `Page 1` (0:1, koncepty z AI) a `🌟 Brand Identity` (47:2, verze 0). Obojí dostane štítek „Nahrazeno manuálem v1.0, nepoužívat“. | přesun |

Pořadí stránek se mění až při stavbě. Dnes se v seznamu stránek zobrazuje jen „Page 1“, ostatní stránky jdou přečíst podle id.

### 1.3 Rozměr slidu, grid, hlavička a patička

- **Slide 1920×1080.**
  - Stejný rozměr mají dnešní 48:16 až 48:20.
  - Funguje v prezentačním režimu a exportuje se do PDF 1:1, podobně jako Slack Brand Guidelines v PDF.
  - Dlouhé 1440 stránky nepoužíváme: nejdou prezentovat po krocích a hůř se tisknou.
- **Grid:**
  - okraje 80 px, 12 sloupců po 132 px, mezera 16 px;
  - 6 sloupců = 280 px, což odpovídá dnešním swatchům 48:17;
  - obsahová zóna y 180 až 1000.
- **Hlavička** (komponenta `Slide/Header`, y 0 až 140):
  - vlevo číslo a název kapitoly (Nunito Bold 13, velká písmena, tracking 14 %);
  - vpravo „Sparkee Brand Manual · v1.0“ a odkaz „Obsah“ zpět na index;
  - pod ní titulek slidu v Baloo 2 ExtraBold 56, stejná pozice jako dnes (x 80, y 64).
- **Patička** (komponenta `Slide/Footer`, y 1016 až 1080):
  - vlevo ✦ a číslo slidu (`03.04`);
  - uprostřed štítek stavu `Schváleno / Návrh / Čeká na klienta`;
  - vpravo datum poslední změny.
- **Pozadí:**
  - obsahové slidy mají mist `#F5F4FB`;
  - úvodní slide každé kapitoly (`XX.00`) je tmavý: ink, holo záře a velké číslo kapitoly. Manuál tak sám ukazuje oba režimy značky („na tmavé vždy záře“).
- **Pojmenování rámů:** `03.04 · Logo · Ochranná zóna`. Bez pomlček, stejně jako všechny texty značky.

### 1.4 Navigace

- **`00.01 Obsah`:** 16 dlaždic kapitol. Každá je komponenta `Doc/Index tile` s prototypovým odkazem „Navigate to“ na úvodní slide kapitoly.
- **Úvodní slide kapitoly `XX.00`:** obsahuje „V kostce“ (3 hlavní pravidla) a malý obsah kapitoly s odkazy na její slidy.
- **Prototyp:**
  - jeden flow „Brand Manual“ od Coveru, šipky vpřed a vzad;
  - další flow začínají na každé kapitole, takže jde prezentovat jen část (například „Logo“ tiskárně).
- **Odkaz „Obsah“ v hlavičce** vede z každého slidu zpět na index.
- **Sekce Figmy** mají názvy kapitol a tvoří tak levý panel i mapu na plátně.
- **Export:**
  - celé PDF manuálu, plus PDF po kapitolách;
  - jednostránkový „Sparkee na jedné stránce“ také jako A4 PDF.

---

## 2. Rozhodnutí, která musí padnout před stavbou

Tyto rozpory našla inventura. Každý má doporučení. Bez rozhodnutí by manuál musel ukazovat dvě pravdy.

| ID | Rozpor | Stav dnes | Doporučení |
|---|---|---|---|
| **K01** | Jeden ink | Figma: `#272A33`. Všechny vektory (logo, pózy, rig, `mascot.js`) a 31 míst v CSS (29× `rgba(44,48,60,…)` v `site.css` a `pages.css`, 2× hex v `site.css`): `#2C303C`. | **`#272A33`** všude. Rozdíl je okem skoro neviditelný (kontrast mezi nimi 1,09:1). Vektory a CSS přebarvit skriptem. Konstanty v `rig.py`, `compose_mascot.py`, `mascot.js` a `og_build.mjs` sjednotit. |
| **K02** | Jedna sada pastelů | Figma a IG: mint `#8BEFD6`, sky `#92D8F8`, lilac `#B9A9EC`, blush `#F4B8CB`. Web, OG, Remotion a SVG maskota: `#A5EDC5` / `#9AD8F8` / `#C49CF2` / `#F5B8DC`. | **Sada z Figmy** a jména **mint / sky / lilac / blush**. Je v oficiální Brand Identity, na IG i v avataru. Web přejde z `lav/pink` na `lilac/blush`, IG kit zruší `mint2` a `lilac2`. Klient vybírá ze dvou vzorníků vedle sebe. |
| **K03** | Jeden holo přechod | 7 definic s různým úhlem, barvami i polohami stopů. | **Holo** = 115°, mint 0 % → sky 33 % → lilac 66 % → blush 100 %. K tomu **Holo soft** (pozadí). **Gradient na textu (rozhodnutí klienta 27. 9.):** jen pastelová diagonála 135° (mint 0 % → sky 38 % → lilac 72 % → blush 100 %) a **jen na tmavém** podkladu; na světlém text nikdy v přechodu (plný ink + holo zvýrazňovač pod slovem). „Holo ink“ na text je vyřazené. |
| **K04** | Světlé pozadí | Figma: Mist `#F5F4FB` (studené) + Paper `#FFFFFF`. Web: `#F6F4EF` (teplé), včetně `theme-color`. | **Mist `#F5F4FB`** jako plocha a Paper `#FFFFFF` na karty. Studená mist ladí s holo, teplá paper vedle pastelů působí špinavě. |
| **K05** | Wordmark | Logo má trasovaný wordmark (jednopatrové „a“). Cover 183:3 a IG story 129:2 mají „sparkee“ vysázené v Baloo 2 (dvoupatrové „a“). | Oficiální je **jen trasovaný wordmark z loga**. Sázený text jako logo zakázat. Vyrobit čistý vektorový wordmark bez maskota ([N]); dnes neexistuje, v `logo-light.svg` jsou písmena „ar“ slitá s obrysem maskota. |
| **K06** | Ty / vy | Figma tone: „Tykáme“. Web vyká (claim „vašim“). Bubliny průvodce tykají, IG tyká, bio mění „vašim“ na „tvým“. | **Maskot tyká, agentura vyká.** Maskot mluví v 1. osobě a tyká (IG, bubliny, stories). Agentura v textech webu, nabídkách, smlouvách a e-mailech klientům vyká. Odpovídá dnešnímu stavu, takže není co přepisovat. Varianta B „tykáme všude“ znamená přepsat celý web. |
| **K07** | UI styl | Web, IG kit a OG: neo-brutal (ink linka 2 až 2,5 px + tvrdý stín). Figma CTA: holo pilulka bez linky a bez stínu. Barva stínu se liší (ink / akcent / mist). | **Neo-brutal je podpis značky.** Na světlé: linka 2 px ink a stín ink 4/6 px. Na tmavé: linka ink, stín v barvě akcentu (jako OG). CTA ve Figmě předělat. |
| **K08** | Jedna jiskra ✦ | 4 tvary v oběhu: jiskra v logu, rovná 4cípá „Star“ ve Figmě, zakřivená webová `M12 0c1 7 5 11 12 12…`, kubická jiskra maskota (k = .28r). | **Zakřivená webová jiskra** jako jediný master mimo logo (měkká, bez ostrých hran, sedí k tvarovému jazyku). Jiskra v logu zůstává jen v logu. Rovnou „Star“ vyřadit. |
| K09 | Tmavý nebo světlý základ | Figma říká „tmavá + záře je základ všech postů“. Web je světlý s tmavými pásy. | Dva režimy, jedna značka. Sociální sítě, OG, video a obálky jsou tmavé. Web a dokumenty jsou světlé s tmavými pásy. Poměry v 5.05. |
| K10 | Emoji | Pravidlo „✦ je naše“, ale Figma story používá ✨ a web reakce ✨❤️💜🔥👏. | V grafice značky jen ✦, ✨ nikdy. Reakce maskota na webu smí z pevné sady ❤️💜🔥👏 (✨ nahradit ✦). |
| K11 | Jedno CTA | Na `#kontakt` míří 6 různých popisků. | Hlavní CTA **„Chci jiskru“**. Na IG klíčové slovo **JISKRA**. Sekundární „Nezávazná konzultace“ jen v patičce a ve formuláři. |

Rozhodnutí se zapíšou do `tools/brand/DECISIONS.md` (datum, kdo, co) a teprve potom se staví. Migrace webu, SVG a IG kitu na nové hodnoty je samostatný úkol mimo manuál (viz 6.3).

---

## 3. Kapitoly a slidy

U každé kapitoly je uvedeno:
- tabulka slidů,
- co **použít** z existujících podkladů,
- co **vytvořit** nově,
- co **rozhodne klient**.

Každá kapitola začíná slidem `XX.00`: tmavý podklad, číslo kapitoly, 3 pravidla „V kostce“ a odkazy na slidy.

### 00 Úvod (6 slidů)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 00.00 | Cover | Primární logo na ink s holo září, maskot „Mává“, titulek „Brand manuál“, verze, datum a stav. Varianta 1600×960 jako náhled souboru. | P1 |
| 00.01 | Obsah | 16 dlaždic kapitol s odkazy a mini náhledem. | P1 |
| 00.02 | Jak s manuálem pracovat | Pro koho je (tým Sparkee, externí grafici, tiskárny, média, klienti při co-brandingu). Jak se orientovat (prezentační režim, odkazy, knihovna). Legenda stavů. Kde jsou assety. Na koho se obrátit. | P1 |
| 00.03 | Sparkee na jedné stránce | Logo, 7 barev, 2 písma, jiskra, maskot, 5 principů, 3 pravidla hlasu, 5 největších chyb a odkaz ke stažení. Exportovat i jako A4 PDF. Benchmark: nejčastěji chybějící věc. | P1 |
| 00.04 | Principy značky | Pět principů z 53:15, bez pomlček: Maskot je hvězda. Holo jen na akcenty. Ink na text, pastely na plochy. Hravost v tvarech, čistota v layoutu. Na tmavé vždy záře. Ke každému principu malá ukázka. | P1 |
| 00.05 | Verze a kontakt | Vlastník značky, správce manuálu, verze, datum, odkaz na changelog. | P1 |

- **Použít:**
  - `55:2` Cover: jen text straplinu. Vektor 183:3 je sázený wordmark, podle K05 ho nahradí logo.
  - Principy `53:15`.
  - Komponenta `Maskot/Mává` (190:756).
  - `assets/img/logo.svg`.
- **Vytvořit:**
  - kompozice coveru;
  - `Doc/Index tile`;
  - one-pager (slide i A4);
  - Principy s obrázky.
- **Klient:** K41 (vlastník značky a kontakt).

### 01 Značka (9 slidů)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 01.00 | Kapitola · V kostce | 3 věty: kdo jsme, pro koho, čím se lišíme. | P1 |
| 01.01 | Příběh | Proč Sparkee vznikl. Firmy potřebují na sítích pravidelnost a systém, freelancer nestíhá, velká agentura je drahá a pomalá. Původ jména (spark = jiskra) a maskota. | P1 |
| 01.02 | Mise a vize | Jedna věta mise, jedna věta vize. **Návrh** k připomínkám: mise „Dodáváme firmám jiskru na sociálních sítích: systém agentury v tempu freelancera.“ | P1 |
| 01.03 | Hodnoty | 3 až 4 hodnoty, u každé „v praxi to znamená“. **Návrh:** Jiskra (nápad, ne šablona) · Systém (plán, natáčecí den, report) · Tempo (rychlé reakce, obsah vychází včas) · Upřímnost (reálná čísla, ilustrativní čísla vždy označená). | P1 |
| 01.04 | Pozicování | Mapa ve dvou osách (cena / kapacita × osobní přístup / systém): freelancer, velká agentura, interní člověk a Sparkee „někde mezi, přesně tady“ (IG P3). Positioning statement: „Pro [koho] je Sparkee [kategorie], která [přínos], protože [důkaz].“ Důkazy: 3 pilíře (plán, natáčecí den, report). | P1 |
| 01.05 | Pro koho | 2 až 3 persony: malé a střední firmy, „které chtějí systém místo chaosu“. U každé bolesti, cíle, kanály a co od nás čeká. | P2 |
| 01.06 | Osobnost | Atributy ve formě „Jsme / Nejsme“: hraví, ne dětinští · sebevědomí, ne arogantní · konkrétní, ne technokratičtí · rychlí, ne zbrklí · upřímní, ne drzí. K tomu posuvníky (hravý ↔ vážný, lidový ↔ odborný, hlasitý ↔ tichý) s polohou Sparkee. | P1 |
| 01.07 | Architektura značky | Sparkee (agentura) → maskot Sparkee (hlas na sítích) → balíčky Spark / Glow / Blaze → klíčové slovo JISKRA → claim a tagline. Pravidla psaní jmen: „Sparkee“ s velkým S v textu, malými písmeny jen v logu. Spark, Glow a Blaze vždy anglicky s velkým písmenem. | P1 |
| 01.08 | Claim a tagline | Claim CZ „Dodáme jiskru vašim sociálním sítím“ (hlas agentury). Tagline EN „Social Media with a Spark“ (pilulka, nepřekládat). Display hláška „Sparkni to!“. Kde se co používá a kde ne. | P1 |

- **Použít:**
  - fragmenty z webu: „praktická social media agentura…“, „mezi freelancerem a velkou agenturou“, „Systém agentury, tempo freelancera“;
  - IG `PLAN.md`: persony z highlightu Ahoj, 3 pilíře;
  - IG P3 posuvník (`social/instagram/feed/03_posuvnik`).
- **Vytvořit:**
  - všechny texty kapitoly;
  - diagram pozicování;
  - diagram architektury;
  - posuvníky osobnosti.
- **Klient:**
  - schválení textů: K12 (příběh), K13 (mise a vize), K14 (hodnoty);
  - K15 (persony a data o zákaznících);
  - K16 (skloňování „Sparkee“).

### 02 Hlas a tón (10 slidů)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 02.00 | Kapitola · V kostce | Hravě, ale srozumitelně · Krátké věty, konkrétní čísla · Žádné pomlčky. | P1 |
| 02.01 | Náš hlas | 4 pilíře, které se nemění. U každého „zní to jako / nezní to jako“. Hravě, ale srozumitelně · Konkrétně (čísla, příklady) · Lidsky (čeština bez korporátní vaty) · S jiskrou (pointa na konci). | P1 |
| 02.02 | Kdo mluví | Matice podle K06. Maskot („já“, tyká) proti agentuře („my“, vyká). Kanály v řádcích: IG, TikTok, LinkedIn, web, bubliny průvodce, nabídka, smlouva, e-mail klientovi, reklamace, report. | P1 |
| 02.03 | Tón podle situace | Hlas je stálý, tón se mění (model Mailchimp). Situace: oslava a launch, tip, ceník, odpověď v DM, chyba nebo omluva (klidně, bez vtipu, bez maskota), krize, 404, potvrzení formuláře. U každé posuvník hravosti. | P1 |
| 02.04 | Před a po | 8 dvojic „takhle ne / takhle ano“: web hero, IG popisek, DM odpověď, e-mail klientovi, chybová hláška, potvrzení formuláře, úryvek nabídky, komentář v reportu. | P1 |
| 02.05 | Česká pravidla psaní | Viz 02.05 níže. | P1 |
| 02.06 | Jiskra, emoji, hashtagy | ✦ jako podpis a tečka. Max 1 emoji na popisek. ✨ v grafice nikdy (K10). Povolená sada reakcí. Max 5 hashtagů. Klíčová slova do prvních řádků popisku. Značkový hashtag [K17]. | P1 |
| 02.07 | CTA a slovník | Hlavní CTA (K11), JISKRA, seznam sekundárních CTA. Tabulka **Používáme / Nepoužíváme**: „obsah“ místo „content“, bez „komplexní řešení“, „360°“, „synergie“, „garantujeme virál“. Anglické termíny platforem (Reel, story, carousel) jsou v pořádku. | P1 |
| 02.08 | Maskot mluví | 1. osoba, krátce, v bublině max 8 slov. Hlášky („Sparkni to!“, „Přidáme jiskru.“). Nikdy tvrdě neprodává. Nemluví ve smlouvách, fakturách, reklamacích ani v krizi. O cenách jen informativně a s nadsázkou (IG P6) [K18]. | P1 |
| 02.09 | Přístupné psaní | Vzorec alt textu: „Maskot Sparkee [co dělá], text: „…““. Titulky u všech videí. Hashtagy v CamelCase. Emoji na konci věty, ne uprostřed. Popisné odkazy. | P1 |

**02.05 Česká pravidla psaní** (obsah slidu):
- Žádné pomlčky v textech na grafice, v popiscích ani v manuálu. Rozsah se píše slovem „až“ („5 000 až 20 000 Kč“). Místo pauzy použij tečku, čárku nebo dvojtečku.
- Uvozovky „takhle“. Čísla s mezerou po tisících („1 248“). Mezera před „%“ a „Kč“ („42 %“, „14 900 Kč“). Datum „6. 10. 2026“, čas „14:30“.
- Nezlomitelná mezera po jednopísmenných předložkách a spojkách (v, k, s, z, o, u, a, i) a mezi číslem a jednotkou.
- Nadpisy velkým písmenem jen na začátku věty, ne každé slovo.
- Ilustrativní čísla vždy označená „ilustrativní“. Na IG je nepoužíváme vůbec.

- **Použít:**
  - „Jak mluvíme“ 54:47 (opravit pomlčku);
  - IG `PLAN.md` §1 „Hlas profilu“;
  - bubliny `companion.js` (SECTIONS);
  - `404.html`;
  - popisky IG `feed/*/caption.txt` a `alt.txt`.
- **Vytvořit:**
  - 8 dvojic před a po;
  - matice kanálů;
  - slovník;
  - posuvníky tónu.
- **Klient:** K06, K11, K16, K17, K18.

### 03 Logo (13 slidů)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 03.00 | Kapitola · V kostce | Logo neměníme · Dýchá (ochranná zóna 1X) · Na tmavé světlá verze. | P1 |
| 03.01 | Primární logo | Logo na mist a na ink, velké. Jedna věta, co logo nese. | P1 |
| 03.02 | Anatomie | Popisky: trasovaný wordmark „sparkee“ (jednopatrové „a“), maskot ležící na wordmarku (hlava hvězda naklopená o −24°, plamínek), jiskra ✦ (Union 124:102). Proč je hlava naklopená jen tady a v póze Leží. | P1 |
| 03.03 | Varianty | Tabulka „kdy použít“: Primární barevná (světlá plocha) · Dark (tmavá plocha, komponenta „Logo/Dark“, `logo-dark.svg`) · Mono ink · Mono holo (49:6) · Mono bílá [N] · Horizontální lockup [K20] · Wordmark samostatně [N][K05] · Symbol = hlava maskota. | P1 |
| 03.04 | Ochranná zóna | **X = výška písmene „s“ ve wordmarku**. Vektor 124:7 je vysoký cca 78 j. při šířce loga 568 j., tedy X ≈ 13,7 % šířky loga. Minimum 1X ze všech stran, ideálně 2X. Diagram s kótami. | P1 |
| 03.05 | Minimální velikost | Celé logo: web min. 100 px šířky (≈ 52 px výšky, jako logo v navigaci), tisk min. 25 mm šířky. Symbol: min. 16 px (favicon) / 5 mm. Pod tím jen symbol. Zkušební arch 100 / 64 / 32 / 16 px. | P1 |
| 03.06 | Umístění ve formátech | Velikost loga vůči formátu: prezentace (1/8 šířky, vlevo nahoře), A4 (1/5 šířky), OG (podle šablony `page`), vizitka. Na IG postech logo **není**, podpisem je ✦ (x≈970, y≈110, 44 px). Logo jen na CTA slidu a ve story „Ahoj“. | P1 |
| 03.07 | Logo na pozadí | Matice povolených pozadí: mist ✓, paper ✓, ink (světlá verze) ✓, mint / sky / blush ✓, lilac (ověřit obrys) ?, holo přechod (jen mono ink) ✓, fotka (jen klidné místo nebo ink překryv 60 %). | P1 |
| 03.08 | Zakázané použití | 12 dlaždic ✕: roztažení, otočení, přebarvení písmen, přidaný stín nebo obrys, logo přepsané v Baloo 2, maskot v logu nahrazený jinou pózou, rozházené části, oříznutí, rušná fotka, jiná jiskra, efekty na logu (záře patří za logo, ne na něj), logo v obrysovém stylu. | P1 |
| 03.09 | Logo a maskot | Logo už maskota obsahuje. V jedné kompozici je hlavním prvkem buď logo, nebo samostatný maskot. Obojí jen na obálkách a v outro, maskot aspoň 2X od loga [K21]. | P1 |
| 03.10 | Co-branding | Lockup „Sparkee × Klient“: stejná optická výška, „×“ nebo linka 2 px ink, rozestup 2X. Kreditní řádek „Vyrobil Sparkee ✦“ u práce pro klienty. V obsahu klienta má přednost jeho manuál, Sparkee je jen v kreditu. Partnerské odznaky (např. Meta) podle jejich pravidel. | P2 |
| 03.11 | Favicon, avatar, ikona aplikace | Hlava maskota: SVG favicon, 32 px, 180 (apple-touch), 192, 512, `favicon.ico`. IG avatar tmavý a světlý. Mřížka ikony aplikace. | P1 |
| 03.12 | Vyřazená loga | Nepoužívat: text „sparkee“ v Baloo Bhai (1:89), koncepty image 5 až 12, sázený wordmark 183:3 a 129:2, `og-sparkee.png`, staré barvy v Remotion. Horizontální lockupy 38:2 a 39:96, pokud je klient neschválí. | P2 |

- **Použít:**
  - `49:3` Logo / Primary (vektor 124:3), `49:5` Mono, `49:6` Mono Holo;
  - master `45:201`;
  - `assets/img/logo.svg`, `logo-mono.svg`, `logo-dark.svg` (+ `logo-dark-flat.svg`, `logo-dark-onglow.svg`, `logo-dark@2x.png`);
  - komponenta `Logo/Dark` 242:18881 a board `Logo / Dark` 242:18882 na 47:2;
  - `assets/figma/logo-parts/*.svg`, `logo-horizontal.svg`;
  - `mascot-head.svg`;
  - ikony `assets/img/icons/*`;
  - avatary `social/instagram/avatar/*`.
- **Vytvořit:**
  - komponenta `Logo` s variantami;
  - čistý wordmark;
  - mono bílá verze;
  - diagram ochranné zóny;
  - zkušební arch minimálních velikostí;
  - 12 ukázek zakázaného použití (generovat skriptem ze SVG, viz 6.2);
  - matice pozadí;
  - co-branding lockup.
  - Mimo manuál: přebarvit logo na ink podle K01.
- **Klient:** K05, K19, K20, K21, K22 (ochranná známka).
- **Poznámka (27. 9. 2026), logo na tmavé:** klient zamítl logo na světlém štítku na tmavém pozadí („takhle přesně logo na tmavý nechci dávat“) i „bílá písmena + ink obrys“ (`logo-light.svg`, zrušeno; K19 tím odpadá). Platí **Logo / Dark** (Figma komponenta `Logo/Dark` 242:18881, board 242:18882 na 47:2 vlevo od „01 · Logo“, pod boardy Logo / Primary a Mono Holo; `assets/img/logo-dark.svg`): stejná geometrie a poloha jako 124:3, písmena mist `#F5F4FB`, „a“ a „r“ vyříznutá kolem ležícího maskota rovnoměrnou mezerou 1,45 j. od siluety, konce řezu zaoblené r = 5 (jako zakončení písmen), maskot, plamínek a ✦ beze změny, ink obrys maskota vyříznutý (ukazuje podklad), jemná holo záře za hlavou. Od 300 px `logo-dark.svg`, do 120 px `logo-dark-flat.svg` (bez blur), na silnou záři (video end card) `logo-dark-onglow.svg`; wordmark min. 120 px šířky, menší = hlava maskota. Do 03.03, 03.07 a 03.08 (✕ „logo na světlém štítku na tmavé“) doplnit podle toho. Postup a porota: `tools/logo-dark/`.

### 04 Maskot (15 slidů)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 04.00 | Kapitola · V kostce | Maskot je hvězda · Nikdy ho nedeformujeme · Vždy nohama dolů. | P1 |
| 04.01 | Seznam se | Karta postavy: jméno [K23], co je zač (hvězda s plamínkem jiskry), povaha (zvídavý, nadšený, ochotný, trochu šibal), role (hlas IG, hostitel webu, průvodce), hláška „Sparkni to!“, zajímavost (tlapky se před tělem nepotkají, takže netleská, ale bouchne). | P1 |
| 04.02 | Kdy ano, kdy ne | **Ano:** sociální sítě, hero a průvodce webu, onboarding, 404, oslavy, tipy, CTA. **Ne:** smlouvy, faktury, reklamace, krizová komunikace, citlivá témata, výplň prázdného místa, logo podznačky, obsah klienta bez souhlasu. Frekvence na IG [K24]. | P1 |
| 04.03 | Anatomie | Popisky: hlava hvězda, plamínek, oči z loga, tváře `#C6F7D7`, ústa `#F09BA5`, tělo v holo přechodu, ruce a tlapky, nohy, obrys ink 12 j. pod všemi výplněmi (jedna silueta jako logo), stín na podlaze ink 12 %. | P1 |
| 04.04 | Proporce a konstrukce | Hlava s plamínkem tvoří cca 72 % výšky postavy, tělo s nohama cca 28 % (z riggu: krk y 334, chodidla y 446, vrchol plamínku cca y 39; ověřit na `stand.svg`). Tělo zúžené SXT 0,80. Ve stoje je hlava narovnaná o +24° (pivot 490, 300), plamínek zůstává svisle. Tvarový jazyk: vše zaoblené, i cípy hvězdy. Diagram s výškovými linkami. | P1 |
| 04.05 | Kostra (rig) | Mapa kloubů: ramena SH_L 467,338 a SH_R 541,338, boky 483/525,396, krk 504,334, chodidla 504,446. Ruka = jedna kubická páteř přes loket, profil tloušťky 12 → 13,2 → 11,2 j., kulatá tlapka, hladké napojení (sweep2). Předvolby rukou: rest, down, out, wave, cheer, hold. Limity pohybu (viz 04.12). | P1 |
| 04.06 | Pohledy | Kanonický je **2D čelní pohled**. Model sheet: stojí, leží (póza loga), vykukuje, hlava. Pohled 3/4 a z boku jen jako [K25]: nakreslí ilustrátor podle kresby klienta, žádná improvizace. | P2 |
| 04.07 | Knihovna póz | 11 komponent (Kostra, Stojí, S telefonem, Mává, Mává s telefonem, Jásá, Překvapený, Sticker, Leží, Vykukuje, Hlava). K tomu 6 póz ze snímků riggu: wave, point, tap, hey, nod, present. U každé póza, k čemu je a kdy ne. | P1 |
| 04.08 | Výrazy | Existující: normální (oči z loga + úsměv), šťastný ^^ (ink oblouky 7 j.), překvapený (bílé oči r13 až 14, obrys 5,5, ústa „o“). Návrhy [K26]: mrknutí, zamyšlený, ospalý (pro „Tvůj Instagram spí?“). Stavět jen z existujících prvků. | P2 |
| 04.09 | Barvy maskota | Stopy přechodu těla (`#FFFFFF`, `#FBFAFE`, `#EEEBF8`, `#D5DCF5`, `#DDD0F5`, `#E0F6EB`, `#F3FAF6`, `#EAE3F7`, `#F5E8F0`). Obrys = ink (K01). Ústa, tváře, displej telefonu v holo. Na tmavé záře za maskotem a „!“ bíle. Sticker: bílý obrys 40 j. (plamínek 30). | P1 |
| 04.10 | Maskot v kompozici | Velikost na IG 45 až 60 % dlaždice, horizont v 91 % výšky. Minimum: celá postava 64 px výšky, pod tím jen hlava. Hlava min. 16 px. Pohled a gesto míří k textu nebo CTA. Kolem volno aspoň 0,25 šířky hlavy. Text přes maskota nikdy. Jeden maskot na kompozici. | P1 |
| 04.11 | Maskot a text | Bublina (komponenta `Maskot/Bublina`): neo-brutal, Nunito ExtraBold, max 8 slov, ocásek k ústům, vlevo nebo vpravo. | P1 |
| 04.12 | Správně / špatně | 12 dvojic ✓/✕: roztažení · zrcadlení · přebarvení · ořez přes tělo (kromě pózy Vykukuje) · hlavou dolů, salto, rotace · tleskání · ruce „tyčka s kuličkou“ · ruka přes obličej · přerenderování v 3D nebo AI · doplňky a oblečení [K27] · maskot jako výplň · maskot v krizové komunikaci. | P1 |
| 04.13 | Nové pózy a AI | Nové pózy vznikají **jen z riggu nebo z vektorů**: rovnoměrné měřítko, posun a rotace, nikdy tah ani deformace. Generování maskota v AI nástrojích je zakázané, protože rozbíjí konzistenci (lefthd test). Postup a schválení nové pózy. | P1 |
| 04.14 | Samolepky a emoji sada | Existující Sticker. Návrh sady 8 až 12 samolepek pro stories a merch: mává, jásá, srdce, „!“, s telefonem, JISKRA, ✦ [K28]. Formát PNG / WebP 512 px, bílý obrys. | P2 |

- **Použít:**
  - komponenty `190:747` až `190:777`;
  - `assets/img/poses/*.svg` (zdroj pravdy);
  - snímky riggu `social/instagram/_src/rig/*.svg`;
  - `tools/rig.py`, `tools/limb_sweep.py`, `assets/js/mascot-rig.js`;
  - skrytý originál 1:89 Frame 3 (pro slide „Příběh“ jen se souhlasem klienta);
  - IG P2 karta postavy.
- **Vytvořit:**
  - 6 nových komponent póz ze snímků riggu;
  - diagram anatomie;
  - diagram proporcí a kloubů;
  - bublina;
  - 12 dvojic správně / špatně (skriptem transformovat `stand.svg`);
  - případně výrazy a samolepky.
  - Mimo manuál: opravit hlavičku `compose_mascot.py` a README (salto, spin, „3× klik“).
- **Klient:** K23 až K28.

### 05 Barvy (12 slidů)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 05.00 | Kapitola · V kostce | Ink na text · Pastely na plochy · Holo jen na akcenty. | P1 |
| 05.01 | Hlavní paleta | Ink, Mist, Paper + mint, sky, lilac, blush (hodnoty po K01 až K04). Swatch: jméno, role, HEX, RGB, CMYK, Pantone [K29], jméno tokenu. | P1 |
| 05.02 | Tónové škály | Ke každému pastelu 100 (soft) / 300 (základ) / 500 (ilustrace, linky) / 700 (text na světlé, AA). Ink škála. Tabulka níže. | P1 |
| 05.03 | Holo přechod | Kanonická definice (K03). Pořadí vždy mint → sky → lilac → blush. Povolené úhly: 115° (výchozí), 90° a 180° (pásy). Min. plocha. Nikdy na odstavcový text, nikdy další barva, nikdy přes fotku. | P1 |
| 05.04 | Holo záře | 2 až 3 pastelové bloby, rozostření 120 (Figma) / 70 px (CSS), krytí 50 až 55 %. Umístění: za maskotem, v rozích. Tmavé plátno: `#2D313D` → `#272A33` → `#1C1E26` + radiální `#363B53`. Na tmavé vždy, na světlé jen holo soft. | P1 |
| 05.05 | Poměry | Proužky poměrů. Světlé: mist 60 / paper 15 / ink 15 / pastely 8 / holo 2 %. Tmavé: ink 70 / záře 15 / mist text 10 / holo 5 %. | P1 |
| 05.06 | Světlý a tmavý režim | Kde je který (K09). Tabulka sémantických tokenů Light / Dark. | P1 |
| 05.07 | Kontrast a kombinace | Matice kontrastu (tabulka níže). Povolené dvojice text / pozadí se značkou AA / AAA. | P1 |
| 05.08 | Barvy pro grafy | Kategorické pořadí mint / sky / lilac / blush. Popisky v tónech 700. Pro reporty klientům. | P2 |
| 05.09 | Tisk | CMYK přes ICC (PSO Coated v3 / FOGRA51, případně FOGRA39 podle tiskárny) lokálním gs, stejně jako v Growtix pipeline. Pastely jsou mimo gamut, nutný nátisk. Pantone podle vzorníku [K29]. Volitelně holografická fólie [K30]. | P2 |
| 05.10 | Zakázané | Barvy mimo paletu (`#FCE6C8`, `#E8F7A8`, `#4A3F6B`, `#FFF4E6`, `#FCEFD8`, `#F5EEFD` převést na tokeny nebo zrušit). Bílý text na pastelu. Pastelový text na světlé. Čistá černá `#000`. Holo na odstavcích. Přechody z jiných barev. | P1 |
| 05.11 | Tokeny | Tabulka primitivní → sémantický token → CSS proměnná (`site.css`, `kit.css`). | P1 |

**05.02 Návrh tónových škál** (100 = holo soft z IG kitu, 300 = Figma, 700 = text AA; 500 se dopočítá při stavbě):

| Barva | 100 soft | 300 základ | 500 | 700 text (kontrast na mist / bílé) |
|---|---|---|---|---|
| mint | `#DDF9EF` | `#8BEFD6` | [N] | `#117E63` (4,59 / 5,01) |
| sky | `#DDF1FC` | `#92D8F8` | [N] | `#1874B3` (4,59 / 5,01) |
| lilac | `#ECE4FB` | `#B9A9EC` | [N] | `#6346CC` (5,86 / 6,41) |
| blush | `#FCE6EE` | `#F4B8CB` | [N] | `#BC3A74` (4,81 / 5,26) |
| ink | line `#E8E6E1` | ink-soft `#5A5F6E` | ink `#272A33` | ink-900 `#1F222C` |

Dnešní IG mint `#11855F` má na mist jen 4,23:1, proto se nahradí `#117E63`. **Holo ink** = mint 700 → sky 700 → lilac 700 → blush 700. Každý stop má na mist aspoň 4,5:1, přesto se holo text používá jen pro display od 32 px.

**05.07 Kontrast (WCAG 2.x, spočítáno pro navrženou paletu):**

| Text ↓ / pozadí → | paper | mist | mint | sky | lilac | blush | ink |
|---|---|---|---|---|---|---|---|
| ink `#272A33` | 14,33 | 13,11 | 10,52 | 9,15 | 6,79 | 8,58 | · |
| ink-soft `#5A5F6E` | 6,37 | 5,83 | 4,68 | 4,06 ✕ | 3,02 ✕ | 3,81 ✕ | · |
| bílá / paper | · | 1,09 ✕ | 1,36 ✕ | 1,57 ✕ | 2,11 ✕ | 1,67 ✕ | 14,33 |
| mist na ink | | | | | | | 13,11 |
| pastely na ink | | | mint 10,52 | sky 9,15 | lilac 6,79 | blush 8,58 | |

Pravidla, která z tabulky plynou:
- Text vždy ink.
- ink-soft jen na paper, mist a mint.
- Na tmavé mist nebo pastely.
- Bílý text na pastelu nikdy.

- **Použít:**
  - swatche 48:17;
  - `:root` v `site.css` a `kit.css`;
  - `theme.ts` (jako přehled starých hodnot);
  - bloby 53:9;
  - tmavé plátno z IG kitu.
- **Vytvořit:**
  - komponenta `Doc/Swatch` navázaná na proměnné;
  - škály;
  - proužky poměrů;
  - kontrastní matice (komponenta `Doc/Contrast pair`);
  - CMYK převody;
  - ukázky zakázaného.
- **Klient:** K01 až K04, K09, K29, K30.

### 06 Typografie (9 slidů)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 06.00 | Kapitola · V kostce | Baloo 2 na nadpisy · Nunito na text · Holo text jen ve velkém. | P1 |
| 06.01 | Písma | Baloo 2 (display) a Nunito (text): specimen „Aa“, abeceda s háčky a čárkami, proč právě ona. Google Fonts, licence OFL 1.1, latin-ext. | P1 |
| 06.02 | Řezy | Baloo 2: 600 / 700 / 800. Nunito: 400 / 500 / 700 / 800. Řez 900 z IG kitu zrušit [K31]. Kdy který řez. | P1 |
| 06.03 | Typová škála | Tři tabulky podle média (viz 06.03 níže). Hodnoty jsou navázané na proměnné `type/*` s módy Web / Social / Slides. | P1 |
| 06.04 | Hierarchie v praxi | 3 ukázkové kompozice: web sekce, IG carousel, slide prezentace. | P1 |
| 06.05 | Pravidla sazby | Řádkování: nadpisy 1,05 až 1,1, text 1,45 až 1,6. Tracking: nadpisy −1 až −2,5 %, eyebrow a caption +14 % verzálkami. Řádek 60 až 75 znaků. Zarovnání vlevo, na středu jen krátké headliny na sítích. Max 3 úrovně na jednom vizuálu. Holo text jen display od 48 px (na sítích od 96 px). | P1 |
| 06.06 | Česká typografie | Nezlomitelné mezery (v, k, s, z, o, u, a, i; číslo + jednotka), „uvozovky“, žádné pomlčky, „Kč“ za číslem, telefon „+420 777 123 456“. Kontrola latin-ext při renderu (jako `og_build.mjs`). | P1 |
| 06.07 | Náhradní písma | Web: `ui-rounded, system-ui`. Google Slides: obě písma jsou k dispozici. PowerPoint / Keynote: vložit písma, jinak Arial Rounded / Arial [K32]. E-mail: Arial / Helvetica. | P2 |
| 06.08 | Zakázané | Fredoka, Plus Jakarta Sans, Baloo Bhai (staré podklady) · Baloo 2 na odstavce · falešná kurzíva a tučnost (Baloo 2 kurzívu nemá) · obrysový text · celé nadpisy verzálkami · wordmark sázený písmem. | P1 |

**06.03 Typová škála (návrh ke sjednocení):**

| Styl | Web (px) | Social 1080 (px) | Slides 1920 (px) | Písmo |
|---|---|---|---|---|
| Display | clamp 36 až 64 | 96 až 128 (Reel 92 až 120) | 96 / 1,1 | Baloo 2 800 |
| H1 | clamp 34 až 58 | 72 | 56 / 1,1 | Baloo 2 800 |
| H2 | 36 | 56 | 40 / 1,15 | Baloo 2 800 |
| H3 | 26 | 44 | 28 / 1,2 | Baloo 2 700 |
| H4 / titulek karty | 20 | 36 | 24 / 1,25 | Baloo 2 700 |
| Text L | 19 / 1,6 | 40 | 24 / 1,45 | Nunito 500 |
| Text | 17 / 1,6 | 36 (minimum) | 20 / 1,45 | Nunito 400 web / 500 ostatní [K31] |
| Text S | 15 / 1,5 | · | 16 / 1,45 | Nunito 400 |
| Eyebrow / caption | 13, +14 %, verzálky | 24 | 13 až 16 | Nunito 700 |
| Tlačítko | 17 (S: 15) | pilulka 32 | 20 | Baloo 2 800 / Nunito 800 |

Poznámka k H2: dnes je ve Figmě H2 Baloo 2 **Bold** 36 a na webu 800. Návrh je 800 pro H1 a H2, 700 pro H3 a H4.

- **Použít:**
  - specimen 48:18;
  - `site.css` (`--f-display`, `--f-body`, clamp hodnoty);
  - IG `PLAN.md` (pravidla headline max 6 slov, text min. 36 px, max cca 20 slov na slide);
  - kontrola písem v `tools/og_build.mjs`.
- **Vytvořit:**
  - textové styly (část 4.2);
  - proměnné `type/*` s módy;
  - 3 ukázky hierarchie;
  - ukázky zakázaného.
- **Klient:** K31, K32.

### 07 Grafické prvky (9 slidů)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 07.00 | Kapitola · V kostce | Jiskra je podpis · Vše zaoblené · Tvrdý stín, ne rozmazaný. | P1 |
| 07.01 | Jiskra ✦ | Master tvar (K08) na konstrukční mřížce. Použití: bullet (velikost verzálky), tečka za headlinem, podpis na IG (44 px na 1080), eyebrow, podpis popisku. Barvy: holo na tmavé, ink na světlé, mist v malých velikostech na tmavé. Zakázané: jiný tvar, ✨ místo ✦, otáčení, obrys. | P1 |
| 07.02 | Holo záře v praxi | Kompozice s bloby: IG dlaždice, OG, avatar, highlight. Odkaz na 05.04. | P1 |
| 07.03 | Tvary a zaoblení | Škála rádiusů 12 / 20 / 28 / 40 / pilulka. Žádné ostré rohy. Tvarový jazyk: kruh, zaoblený obdélník, pilulka, zaoblená hvězda. | P1 |
| 07.04 | Neo-brutal systém | Linka 2 px ink. Stín pop 4/4/0 a pop-lg 6/6/0. Hover posun −2 px + pop-lg, stisk +3 px bez stínu. OG: linka 2,5 px + stín 6 px v barvě akcentu. Tmavá verze podle K07. Měkký stín `0 20 50 −20` jen pod velké karty, nikdy spolu s tvrdým. | P1 |
| 07.05 | Samolepky a štítky | Holo pilulka natočená −3° nebo 6° s pop stínem. Tagline pilulka „Social Media with a Spark“. Max 2 na kompozici. | P1 |
| 07.06 | Vzory a pozadí | IG vzor z jisker (převést na master jiskru), tmavé plátno, holo soft plochy. Žádný šum ani textury. | P2 |
| 07.07 | Layout a grid | Web: wrap 1320, gutter clamp(16, 3,2vw, 48), 12 sloupců, navigace 80 / 66 px. Sociální sítě: 1080 šířka, okraj 72 px (safe 60 px na 4:5). Slidy: 12 × 132 / 16 / 80. A4: [N]. | P1 |
| 07.08 | Ilustrace | Ilustrací je jen maskot, jiskry a ikony. Žádné stock ilustrace, 3D ani AI obrázky. Grafy podle 05.08. | P2 |

- **Použít:**
  - 53:3 Jiskra (jen jako ukázka vyřazeného tvaru);
  - 53:9 Holo záře;
  - `site.css` (`--r-*`, `--line`, `--pop`, `--pop-lg`, stavy tlačítek, `.sticker`);
  - `tools/og/template.html`;
  - IG vzor v `kit.js`.
- **Vytvořit:**
  - komponenta `Jiskra` (velikost, barva);
  - `Glow/Blob` a `Glow/Set`;
  - efektové styly;
  - diagram rádiusů;
  - ukázky neo-brutal stavů;
  - A4 grid.
- **Klient:** K07, K08.

### 08 Ikony (4 slidy)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 08.01 | Styl | Mřížka 24 px, vnitřní okraj 2 px, tah 2,2, kulaté konce a spoje, ink na světlé, mist na tmavé. Plná varianta jen pro aktivní stav. | P1 |
| 08.02 | Sada | Sloučení 19 webových symbolů a 18 ikon z IG kitu do jedné sady (cca 30 unikátních): spark, heart, heart-o, play, bell, chat, at, mail, img, ring, mega, chart, cal, cam, users, send, save, check, eye, star, up, x, minus, post, reel, story, msg, link, arrow, q, moon. | P1 |
| 08.03 | Velikosti a zarovnání | 16 / 20 / 24 / 32 / 48. Zarovnání k textu. Dotyková plocha 44 px. Loga platforem vždy oficiální, podle jejich pravidel. | P2 |
| 08.04 | Nová ikona | Postup kreslení a kontrola. Zakázané: emoji místo ikon, míchání obrysových a plných, jiný tah. | P2 |

- **Použít:**
  - symboly `st-i-*` v `index.html`;
  - `ICONS` v `social/instagram/_src/kit.js`.
- **Vytvořit:**
  - komponenty `Icon/<name>`;
  - soubor `assets/img/icons/sprite.svg` pro web (mimo manuál);
  - export SVG.

### 09 UI komponenty webu (6 slidů)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 09.01 | Tlačítka | Primární (holo + linka + pop), sekundární (paper + linka), textové. Velikosti L / M / S. Stavy default, hover, stisk, disabled, focus. Popisky Baloo 2 800. | P1 |
| 09.02 | Štítky a eyebrow | Eyebrow s holo ✦, pilulka, samolepka, štítek kategorie. Pravidlo max počtu eyebrow na stránce. | P1 |
| 09.03 | Karty | Služba, ceník Spark / Glow / Blaze (karta „hot“ `#F5EEFD` převést na token), blog, reference. | P1 |
| 09.04 | Formuláře a stavy | Input, select, checkbox, chyba, úspěch. Stavové barvy (úspěch, chyba, upozornění) zatím chybí [N][K33]. Callout `#FFF4E6` převést na token. | P2 |
| 09.05 | Navigace a patička | Výška 80 / 66 px, logo 52 px, přilepená navigace zmenšená na 0,86. | P2 |
| 09.06 | Maskot na webu | Hero rig, průvodce s bublinami, reakce, přepínač pohybu, reduced motion. | P1 |

- **Použít:**
  - `site.css`, `pages.css`, `index.html`;
  - náhledy `tools/preview-*.png`;
  - `companion.js`.
- **Vytvořit:**
  - komponenty `UI/*` s variantami (část 4.5);
  - stavové barvy.

### 10 Fotografie a video (4 slidy, P2)

Dnes neexistuje žádná fotografie. Vše je návrh a musí ho schválit klient [K34].

| ID | Slide | Obsah | P |
|---|---|---|---|
| 10.01 | Kdy fotka | Reference, tým, zákulisí natáčecího dne. Přirozené světlo, skuteční lidé, klidné pozadí, chladně neutrální gradace k mist a ink. Žádné stockové „business“ fotky. | P2 |
| 10.02 | Úprava fotek | Rádius 20 / 28, volitelně linka 2 px. Text přes fotku jen s ink překryvem 60 %. Holo nikdy přes obličeje. Maskot přes fotku jen jako Sticker s bílým obrysem. | P2 |
| 10.03 | Video a titulky | Titulky Nunito ExtraBold v pilulce (ink na světlé, mist na tmavé), max 2 řádky, v safe zóně. Intro a outro z logo stingu (11.06). Licence hudby. | P2 |
| 10.04 | Portréty týmu | Pozadí mist, stejný ořez a výška očí [K34]. | P2 |

### 11 Motion (10 slidů)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 11.00 | Kapitola · V kostce | Plynule, bez trhnutí · Scénu mění maskot · Vždy jde vypnout. | P1 |
| 11.01 | Principy | 1. **Živý, ale klidný** (dýchání, mrkání, idle). 2. **Plynulý**: žádné hit-stopy, otřesy kamery ani švihové přechody (klient: „víc plynule“). 3. **Pružný**: spring na reakce a tlačítka, nikdy na text. 4. **Maskot řídí scénu**: každou změnu scény způsobí on. 5. **Ohleduplný**: reduced motion a pauza. | P1 |
| 11.02 | Délky | Tokeny: instant 100 ms, fast 150, base 250 (tlačítko), slow 400, reveal 800. Ambientní: twinkle 3,4 s, float 4,2 s, holoShift 9 s, marquee 28 s. | P1 |
| 11.03 | Křivky | `ease` cubic-bezier(.2,.8,.2,1), `spring` cubic-bezier(.34,1.56,.64,1). Easingy riggu: sine, cubic in-out, out-cubic, back 1.70158, soft 0,8. Grafy křivek [N]. Co kdy použít. | P1 |
| 11.04 | Kamera a přechody | Jedna kamera bez střihů, zoom 1,00 až 1,08 (monotónní Hermite), bookend 1,25 jen jako dolly na skupině maskota. Reel: střihy na 120 BPM, push-in 1,00 → 1,04, text na obrazovce min. 1,8 s. | P1 |
| 11.05 | Knihovna akcí maskota | Tabulka 14 akcí s délkou a použitím: look 3,3 s · glance 2,2 · tap 2,5 · hop 1,2 · hello 2,75 · wave 2,0 · cheer 2,3 · jump 1,55 (7 jisker) · hops 1,7 · hey 1,15 · point 2,5 · present 2,7 · nod 1,8 · idle. Idle mix a hover reakce. Pásy snímků po 0,5 s ze 191:20. | P1 |
| 11.06 | Logo sting | [N] Intro 2 s / outro 1,5 s: maskot dopadne v póze Leží na wordmark, jiskra zablikne. Tmavá a světlá verze. Nahrát z riggu stejně jako `record_reel.mjs`. | P2 |
| 11.07 | Text a UI v pohybu | Reveal 0,8 s, posun 28 px s postupným zpožděním. Hover tlačítka spring 0,25 s. Holo shift. Marquee s pauzou z klávesnice. | P2 |
| 11.08 | Přístupnost pohybu | `prefers-reduced-motion` = statická póza + mrknutí. Přepínač pauzy na stránce (WCAG 2.2.2). Nic nebliká víc než 3× za sekundu. Poster snímek 18,72 s. Smyčka 20 s. | P1 |
| 11.09 | Export | Web: živý kód, ne MP4 (přání klienta). Video: MP4 H.264 1920×1080 a mobilní verze. Reels 1080×1920. GIF do e-mailu do 1 MB. WebM s alfou pro samolepky. Pojmenování souborů. | P2 |

- **Použít:**
  - `site.css` (`--ease`, `--spring`, keyframes);
  - `assets/js/mascot.js` (akce, délky, idle mix);
  - `story.js`;
  - `tools/parts/story-v2-script.md`;
  - stránka `🎬 Animace 20 s` (191:20, 191:22);
  - `assets/video/sparkee-20s*.mp4`;
  - IG `reel.html` a `record_reel.mjs`.
- **Vytvořit:**
  - grafy křivek (komponenta `Doc/Easing curve`);
  - tabulka akcí se snímky;
  - logo sting;
  - intro a outro pro Reels.
- **Klient:** K35 (logo sting ano / ne, zvuk).

### 12 Sociální sítě (13 slidů, stavět po dokončení IG kitu)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 12.00 | Kapitola · V kostce | Maskot mluví za profil · Šachovnice tma / světlo · ✦ je podpis, ne logo. | P1 |
| 12.01 | Principy na sítích | Hodnota pro firmy v každém druhém postu, holo jen akcenty, jedno klíčové slovo JISKRA, ilustrativní čísla ne. | P1 |
| 12.02 | Profil | Avatar (hlava na ink s září, 62 % průměru, test 40 a 110 px), bio pravidla, handle [K36], odkazy, 5 coverů highlightů (Ahoj ✦, Služby, Ceník, Kontakt, Tipy). | P1 |
| 12.03 | Formáty a safe zóny | Feed 4:5 1080×1350 (nativně i 3:4 1080×1440). Grid profilu ořezává na 3:4. Stories a Reels 1080×1920: nahoře cca 270, dole cca 672, po stranách cca 65 px. Vlastní pravidla Sparkee: text v Reelu x 72 až 952, y 240 až 1480. Okraje 60 px na 4:5. Komponenty overlay safe zón (zamčené). | P1 |
| 12.04 | Grid | Šachovnice, světlé dlaždice mint → sky → lilac → blush, horizont maskota 91 %, maskot 45 až 60 % dlaždice, ✦ na x≈970, y≈110, 44 px. Náhled gridu s připnutými posty. | P1 |
| 12.05 | Šablona: jednoobrázkový post | Komponenta `IG/Post` (Tmavý / Světlý × akcent). Ukázky P3, P7, P9. | P1 |
| 12.06 | Šablona: carousel | Hook (max 6 slov, 3 řádky) → obsah (max cca 20 slov, text min. 36 px) → CTA (JISKRA). Vizuální návaznost, počítadlo slidů. Ukázky P2, P4, P6, P8. | P1 |
| 12.07 | Šablona: Reel | Cover, textové overlaye, intro a outro, pravidla z 11.04. Ukázky P1 a P5. | P1 |
| 12.08 | Šablona: stories | Ahoj, sdílení Reelu, anketa, kvíz, odkaz na článek, CTA. Nativní nálepky IG v safe zóně. | P1 |
| 12.09 | Popisky | Stavba: háček s klíčovými slovy → obsah → CTA JISKRA → podpis ✦. Max 5 hashtagů, 1 emoji, žádné pomlčky. Alt text u každého postu, automatické titulky. | P1 |
| 12.10 | Další sítě | TikTok, Facebook, LinkedIn (případně YouTube): profilovka, cover, formáty postů a safe zóny. Rozměry ověřit v době stavby [K37]. | P2 |
| 12.11 | OG a sdílení odkazů | 1200×630, 3 rodiny (home / page / article). Headline min. 24 px od maskota. Soubor do 300 kB. Každá dvojice póza + akcent jen jednou. „!“ bíle na tmavé. Ořez WhatsApp. | P1 |
| 12.12 | Kontrola před publikací | Checklist: náhled gridu 3:4, safe zóny, čitelnost ve 40 px, žádné pomlčky, maskot nedeformovaný, alt text, titulky, žádná ilustrativní čísla. | P1 |

- **Použít (po dokončení kitu):**
  - `social/instagram/PLAN.md`;
  - `avatar/`, `highlights/`, `stories/`;
  - `feed/01…09/` (PNG, `caption.txt`, `alt.txt`);
  - `_preview/*` (feed-overview, profile-grid, stories-guide, avatar-test);
  - `_src/kit.css` a `kit.js`;
  - Figma `📱 Instagram` (191:2);
  - OG `assets/img/og/*.jpg`, `tools/og/template.html` a `cards.json`.
- **Vytvořit:**
  - komponenty šablon s variantami (část 4.6);
  - overlay safe zón;
  - specifikace dalších sítí.
- **Klient:** K36, K37.

### 13 Aplikace (10 slidů)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 13.01 | Web | Náhledy homepage 1440 a 390, podstránky, odkaz na živý web. | P1 |
| 13.02 | Vizitka | [N] Formát [K38]: 90×50 mm (v ČR nejběžnější) nebo 85×55. Líc: ink, holo záře, světlé logo. Rub: mist, jméno Baloo 2, kontakt Nunito. Spadávka 3 mm, CMYK. Volitelně holografická fólie na jiskru [K30]. | P1 |
| 13.03 | E-mailový podpis | [N] HTML tabulka, max šířka 600 px, logo PNG @2x, písmo Arial / Helvetica, ink text, ✦, jméno, role, telefon, web, IG. Test v Gmailu, Outlooku, Apple Mailu a v tmavém režimu. Návod k vložení. | P1 |
| 13.04 | Šablona prezentace | [N] 1920×1080: titulní, oddělovač, text, 2 sloupce, velké číslo, citace a reference, slide s maskotem, obrázek, ceník Spark / Glow / Blaze, poděkování a kontakt. Nástroj [K39]. | P1 |
| 13.05 | Měsíční report pro klienty | [N] Obálka, KPI, grafy v datové paletě, nejlepší posty, plán na další měsíc. Report je jeden ze 3 pilířů služby. | P1 |
| 13.06 | Nabídka a dokumenty | [N] A4 nabídka, hlavičkový papír, šablona v Google Docs / Wordu [K39]. | P2 |
| 13.07 | Reference / case study | [N] Šablona pro chvíli, kdy budou reální klienti se svolením. | P2 |
| 13.08 | Co-branding v praxi | Kredit „Vyrobil Sparkee ✦“, story „Nová spolupráce“ (přepsat ✨ na ✦), společné posty. | P2 |
| 13.09 | Merch a samolepky | [N, volitelně] Vysekávané samolepky maskota (holo fólie), tričko, taška, hrnek, mockupy. | P2 |
| 13.10 | Akce a prostředí | [volitelně] Roll-up 850×2000, jmenovky, pozadí na akce. | P2 |

- **Použít:**
  - `tools/preview-hero-1440.png`, `preview-hero-mobile.png`, `preview-sluzby.png`;
  - mockupy 54:3 a 54:22. Post 54:3 je 1080×1080, převést na 4:5.
- **Vytvořit:** všechny šablony výše.
- **Klient:** K30, K38, K39.

### 14 Přístupnost (4 slidy)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 14.01 | Kontrast a velikosti | Odkaz na 05.07. Minimum textu: web 16 px, sociální sítě 36 px na 1080, caption 13 px jen tučně a verzálkami. | P1 |
| 14.02 | Obsah | Alt text, titulky, hashtagy v CamelCase, emoji na konci, popisné odkazy, barva nikdy jako jediný nositel informace. | P1 |
| 14.03 | Pohyb | Odkaz na 11.08. | P1 |
| 14.04 | Checklist | Jeden seznam pro web, sítě a tisk. | P1 |

### 15 Ke stažení a správa značky (6 slidů)

| ID | Slide | Obsah | P |
|---|---|---|---|
| 15.01 | Ke stažení | Dlaždice s odkazy: logo, maskot, barvy (ASE, tokeny), písma (odkazy Google Fonts), ikony, šablony, motion, PDF manuálu. Odkaz na knihovnu Figmy. Kde leží ZIP [K42]. | P1 |
| 15.02 | Soubory a formáty | Viz konvence níže. | P1 |
| 15.03 | Tokeny pro vývoj | `tools/brand/tokens.json` → `tokens.css` a Figma variables. Mapování na `site.css` a `kit.css`. Postup změny. | P1 |
| 15.04 | Správa značky | Vlastník, kdo schvaluje nové šablony, jak požádat o nový asset. Verze: velká změna (logo, barvy) = 2.0, nové šablony = 1.x. Changelog. | P1 |
| 15.05 | Právní | Stav ochranné známky [K22]. Licence písem (OFL). Licence hudby. Práva k maskotovi [K43]. Jak mohou logo použít média a partneři. | P1 |
| 15.06 | Kontakt a verze | Kontakt, verze, datum, odkaz na changelog. | P1 |

**15.02 Soubory a formáty** (obsah slidu):
- Pojmenování souborů: `sparkee_{prvek}_{varianta}_{barva}[_{velikost}].{ext}`, malá písmena, bez diakritiky, například `sparkee_logo_primary_color.svg` nebo `sparkee_maskot_mava_color_1080.png`.
- Formáty podle použití:
  - web: SVG;
  - sítě: PNG s průhledností;
  - tisk: PDF vektor v CMYK;
  - video: MP4.

**Struktura ZIP balíku:**
```
Sparkee_Brand_Assets_v1.0/
  01_logo/{svg,png,pdf}/
  02_maskot/{svg,png}/          11 + 6 póz, hlava, samolepky
  03_barvy/                     sparkee_barvy.ase, tokens.json, tokens.css
  04_pisma/README.txt           odkazy na Google Fonts, licence OFL
  05_ikony/svg/
  06_sablony/                   odkazy na Figmu, PPTX/Keynote/Google Slides, e-mailový podpis HTML
  07_motion/                    logo sting MP4/WebM, intro a outro pro Reels
  Sparkee_Brand_Manual_v1.0.pdf
  Sparkee_na_jedne_strance.pdf
```

---

## 4. Figma knihovna: proměnné, styly, komponenty

Manuál je zároveň knihovna, proto každý prvek na slidech musí být instance nebo musí být navázaný na proměnnou.

### 4.1 Proměnné (Variables)

Proměnné se generují skriptem z `tools/brand/tokens.json`. Stejný soubor generuje i `tokens.css`, takže Figma a kód nemůžou utéct od sebe.

**Kolekce `primitives`** (barvy, bez módů, skryté z publikování):

| Skupina | Proměnné |
|---|---|
| `ink/` | `900 #1F222C`, `800 #272A33` (= ink), `600 #5A5F6E` (ink-soft), `line #E8E6E1` |
| `neutral/` | `mist #F5F4FB`, `paper #FFFFFF` |
| `mint/` `sky/` `lilac/` `blush/` | `100`, `300`, `500`, `700` podle 05.02 |
| `canvas/` | `dark-top #2D313D`, `dark-mid #272A33`, `dark-bottom #1C1E26`, `dark-radial #363B53` |
| `mascot/` | `mouth #F09BA5`, `cheek #C6F7D7` + 9 stopů těla (jen pro dokumentaci, maskot se nepřebarvuje) |

**Kolekce `color`** (sémantická, módy **Light / Dark**):

| Token | Light | Dark |
|---|---|---|
| `bg/canvas` | mist | ink 800 |
| `bg/surface` | paper | ink 900 |
| `bg/accent-{mint,sky,lilac,blush}` | 300 | 300 |
| `bg/accent-soft-*` | 100 | ink 900 + záře |
| `text/primary` | ink 800 | mist |
| `text/secondary` | ink 600 | mist 80 % |
| `text/on-accent` | ink 800 | ink 800 |
| `text/accent-*` | 700 | 300 |
| `border/strong` | ink 800 | ink 800 (K07) |
| `border/subtle` | ink line | ink 600 |
| `shadow/pop` | ink 800 | akcent 300 (K07) |
| `glow/1..3` | 100 | mint / sky / lilac 300 |
| `holo/stop-1..4` | mint / sky / lilac / blush 300 | stejné |
| `holo-ink/stop-1..4` | 700 | · |
| `status/success, error, warning` | [N][K33] | [N] |

**Kolekce `space`:** 4, 8, 12, 16, 24, 32, 48, 64, 80, 120.

**Kolekce `radius`:** `sm 12`, `md 20`, `lg 28`, `xl 40`, `pill 999`.

**Kolekce `stroke`:** `line 2`, `line-og 2.5`, `icon 2.2`.

**Kolekce `elevation`:** `pop 4`, `pop-lg 6`, `og 6`.

**Kolekce `layout`:** `wrap 1320`, `nav 80`, `nav-sm 66`, `logo-nav 52`, `slide-margin 80`, `social-pad 72`, `social-safe 60`.

**Kolekce `type`** (módy **Web / Social / Slides**):
- `family/display = Baloo 2`, `family/body = Nunito`;
- `size/display, h1, h2, h3, h4, body-l, body, body-s, caption, button` (čísla z 06.03);
- `line/*`, `tracking/*`.

**Kolekce `motion`:**
- délky jako čísla: `instant 100`, `fast 150`, `base 250`, `slow 400`, `reveal 800`;
- easingy jako řetězce: `ease`, `spring`.

**Kolekce `format`:**
- `ig-feed 1080×1350`, `ig-34 1080×1440`, `story 1080×1920`, `og 1200×630`;
- safe zóny (top 270, bottom 672, side 65; text Reelu 72/952/240/1480).

### 4.2 Textové styly

Velikosti navázané na `type/*`. Mód rámu určuje, jestli jde o web, sítě nebo slidy.

- `Display`, `H1`, `H2`, `H3`, `H4`
- `Body/L`, `Body/M`, `Body/S`, `Body/Medium` (Nunito 500)
- `Eyebrow` (Nunito 700, +14 %, verzálky), `Caption`
- `Button/L`, `Button/S`, `Pill`
- `Social/Headline`, `Social/Text`, `Social/Pill`, `Social/Bingo`
- `Doc/Slide title` (Baloo 2 800 56), `Doc/Section` (Baloo 2 700 36), `Doc/Card title` (Baloo 2 600 26), `Doc/Spec label` (Nunito 700 13, 45 %), `Doc/Body` (Nunito 500 20), `Doc/Code` (monospace 14 pro hodnoty tokenů)

### 4.3 Barevné (paint) styly

Přechody zatím nejdou uložit jako proměnnou, proto:
- `Holo/Linear 115`, `Holo/Linear 90`, `Holo/Linear 180`
- `Holo/Soft`
- `Holo/Ink` (text)
- `Canvas/Dark` (lineární + radiální vrstva)
- `Glow/Mint`, `Glow/Sky`, `Glow/Lilac`, `Glow/Blush` (radiální)

Stopy přechodů navázat na proměnné `holo/*`, pokud to Figma v době stavby umožní.

### 4.4 Efektové styly a gridy

- **Efekty:**
  - `Pop/S` (4 4 0 ink), `Pop/L` (6 6 0 ink), `Pop/Accent` (6 6 0 akcent, OG);
  - `Shadow/Soft` (0 20 50 −20, ink 25 %);
  - `Glow/Blob` (layer blur 120);
  - `Glow/Mascot` (drop shadow 0 0 34, akcent 55 %);
  - `Glow/Text dark` (volitelně).
- **Gridy:**
  - `Slide 1920` (12 × 132 / 16 / 80);
  - `Web 1440` (12 sloupců, wrap 1320);
  - `IG 4:5` (okraje 60, padding 72);
  - `Story/Reel safe`;
  - `A4 print` [N].

### 4.5 Komponenty

**Dokumentační (stavba manuálu):**
- `Slide/Header`, `Slide/Footer`, `Slide/Chapter` (tmavý úvod kapitoly), `Slide/Blank`
- `Doc/Index tile` (odkaz)
- `Doc/Do-Dont card` (varianta ✓ / ✕)
- `Doc/Swatch` (jméno, HEX, RGB, CMYK, Pantone, token, kontrast)
- `Doc/Contrast pair`
- `Doc/Type specimen`
- `Doc/Spec annotation` (kóta, redline)
- `Doc/Clear space`
- `Doc/Callout` (Pravidlo / Tip / Pozor)
- `Doc/Status badge` (Schváleno / Návrh / Čeká na klienta / Vyřazeno)
- `Doc/Token chip`
- `Doc/Easing curve`
- `Doc/Proportion bar`
- `Doc/Download tile`

**Značka:**
- `Logo`: varianta Primární / Světlá / Mono ink / Mono holo / Mono bílá / Horizontální / Wordmark / Symbol. Vlastnost pozadí jen pro náhled.
- `Jiskra`: velikost XS až XL; barva holo / ink / mist.
- `Glow/Blob`, `Glow/Set`: 2 nebo 3 bloby, akcent.
- `Maskot`: sada variant sloučená z 190:747 až 190:777. Vlastnost `Póza` (17 hodnot po doplnění 6 póz z riggu), vlastnost `Stín na podlaze` ano / ne. Výrazy jen u póz, kde existují.
- `Maskot/Bublina`: ocásek vlevo / vpravo; tmavá / světlá.
- `Co-brand lockup`.

**UI (web):**
- `Button`: Primary / Secondary / Text × L / M / S × default / hover / pressed / disabled / focus
- `Pill`, `Sticker` (natočení), `Eyebrow`, `Tag`
- `Card/Service`, `Card/Price` (Spark / Glow / Blaze, hot), `Card/Blog`
- `Input`, `Checkbox`, `Nav`, `Footer`
- `Icon/<name>` (cca 30)
- `Avatar`, `Highlight cover`

### 4.6 Šablony (stránka `📐 Šablony`)

Šablony jsou komponenty s variantami, jejich texty se mění přes vlastnosti:
- `IG/Post 4:5`: Tmavý / Světlý × mint / sky / lilac / blush
- `IG/Carousel`: Hook / Obsah / CTA
- `IG/Reel cover`
- `IG/Story`: Ahoj / Sdílení / Anketa / Kvíz / Odkaz / CTA
- `IG/Highlight cover`: 5 variant
- `Overlay/Safe zone`: feed, story, reel; zamčená vrstva, nevyváží se do exportu
- `OG/Card`: home / page / article
- `Vizitka`: líc / rub
- `E-mail podpis`
- `Prezentace`: 10 layoutů
- `Report`: obálka, KPI, graf, top posty, plán
- `Nabídka A4`

---

## 5. Postup stavby (až po IG kitu)

| Fáze | Co | Výstup | Závisí na |
|---|---|---|---|
| 0 | Klient rozhodne K01 až K11. Zapsat `DECISIONS.md`. | rozhodnutí | tato osnova |
| 1 | `tokens.json` → skript vytvoří proměnné a styly ve Figmě + `tokens.css`. | knihovna | fáze 0 |
| 2 | Dokumentační komponenty, `Slide/*`, stránka `📘 Brand Manual`, sekce a prototyp. | kostra manuálu | fáze 1 |
| 3 | Kapitoly 00, 03, 05, 06, 07 (jádro identity). | P1 jádro | fáze 2, migrace inku |
| 4 | Kapitoly 04 a 11 (maskot a motion), 6 nových póz, ukázky správně / špatně skriptem. | P1 maskot | fáze 3 |
| 5 | Kapitoly 01, 02 (texty ke schválení klientem, K12 až K18). | P1 texty | odpovědi klienta |
| 6 | Kapitoly 12 a 13 (IG šablony z hotového kitu, vizitka, podpis, prezentace, report). | P1 aplikace | dokončený IG kit |
| 7 | Kapitoly 08, 09, 14, 15, balík ke stažení, export PDF. | v1.0 | vše výše |
| 8 | Kontrola kvality (5.1), prezentace klientovi v prezentačním režimu, zapracování připomínek, v1.0. | předání | |
| 9 | P2 slidy → v1.1. | v1.1 | |

### 5.1 Kontrola kvality před předáním

- Každý text používá textový styl, každá barva je proměnná (plugin nebo skript bez nálezů „detached“).
- Žádné pomlčky v textech manuálu ani v názvech rámů. Nezlomitelné mezery po předložkách.
- Každé pravidlo má obrázek. Každá kapitola má „V kostce“ a ukázky správně / špatně.
- Kontrast všech textů na slidech je aspoň AA.
- Odkazy z obsahu i odkaz „Obsah“ fungují, prototyp projde od Coveru do konce.
- Stav na každém slidu. Nic „Čeká na klienta“ ve verzi 1.0, jinak jde o návrh.
- Export PDF: čitelný, velikost rozumná pro e-mail (cíl do 30 MB). One-pager A4.
- ZIP odpovídá 15.02, soubory se otevřou, SVG jsou čistá (bez rastrů, bez skrytých vrstev „Group 7“ z image trace).
- Maskot na všech slidech nedeformovaný (jen rovnoměrné měřítko).

---

## 6. Související práce mimo manuál

### 6.1 Soubory v `tools/brand/`

| Soubor | Účel |
|---|---|
| `OUTLINE.md` | tato osnova |
| `DECISIONS.md` | rozhodnutí klienta (fáze 0) |
| `tokens.json` | zdroj pravdy tokenů |
| `build_tokens.mjs` | `tokens.json` → `tokens.css` + skript pro Figma variables |
| `misuse.py` | generuje ukázky zakázaného použití loga a maskota ze SVG (roztažení, zrcadlení, přebarvení, ořez, rotace) |
| `export_assets.mjs` | sestaví ZIP podle 15.02 |

### 6.2 Proč ukázky „špatně“ skriptem

Ukázky mají ukazovat přesně ty chyby, které zakazujeme, na pravém maskotovi a logu. Ruční kreslení by samo porušilo pravidlo „nic neimprovizovat“. Proto se generují transformací zdrojových SVG.

### 6.3 Migrace po rozhodnutí (samostatné úkoly, ne součást manuálu)

- Přebarvit `#2C303C` → `#272A33`: `logo.svg`, pózy, `figma-export`, `rig.py`, `compose_mascot.py`, `mascot.js`, `og_build.mjs`, `rgba(44,48,60,…)` v `site.css` a `pages.css`. Pak přegenerovat OG a `logo-light.svg`.
- Web: pastely a jména (`lav` → `lilac`, `pink` → `blush`), `--paper` → mist (K04), off-palette barvy → tokeny.
- IG kit: sloučit `mint2`, `lilac2`, holo varianty.
- Remotion: `theme.ts` (starý ink, Plus Jakarta Sans), nebo sandbox archivovat.
- README: fonty, ink, salto a spin, „3× klik“, seznam assetů. PLAN §10: názvy souborů.
- Figma copy: pomlčky v 53:14, 53:17, 53:21, 54:49, název stránky 186:2, „Logo - Sparkee“. ✨ ve story 54:25.

---

## 7. Otevřené otázky pro klienta

U každé otázky je naše doporučení, aby klient mohl jen potvrdit.

**A. Blokující (bez nich nezačneme)**

| ID | Otázka | Doporučení |
|---|---|---|
| K01 | Který ink je oficiální? | `#272A33`, vektory přebarvíme |
| K02 | Která sada pastelů? Figma (`#8BEFD6`…) nebo web (`#A5EDC5`…)? | Figma, jména mint / sky / lilac / blush |
| K03 | Potvrzujete jeden holo přechod (115°, 4 stopy po třetinách)? | ano |
| K04 | Světlé pozadí studená mist `#F5F4FB`, nebo teplá `#F6F4EF`? | mist |
| K05 | Je oficiální jen trasovaný wordmark z loga? Smí se logo použít bez maskota (samotný wordmark)? | ano / ano, jen kde maskot nevyjde (úzké formáty) |
| K06 | Ty, nebo vy? | maskot tyká, agentura vyká |
| K07 | Je neo-brutal (linka + tvrdý stín) podpis značky i pro CTA? Barva stínu na tmavé? | ano, na tmavé akcent |
| K08 | Sjednotit jiskru ✦ na jeden tvar (zakřivený, webový)? | ano |
| K09 | Sociální sítě tmavé, web a dokumenty světlé. Souhlasíte? | ano |
| K10 | ✨ v grafice zakázat, platí jen ✦? | ano |
| K11 | Jedno hlavní CTA „Chci jiskru“? | ano |

**B. Obsah značky**

| ID | Otázka |
|---|---|
| K12 | Příběh vzniku: kdo za Sparkee stojí, kdy a proč vznikl (podklad pro 01.01). |
| K13 | Mise a vize: schválit nebo upravit návrh. |
| K14 | Hodnoty: schválit nebo upravit návrh (Jiskra, Systém, Tempo, Upřímnost). |
| K15 | Kdo jsou typičtí klienti (obory, velikost firmy, kdo rozhoduje)? Máte data nebo první zákazníky? |
| K16 | Skloňujeme „Sparkee“ („se Sparkee“, „od Sparkee“ nesklonně), nebo ne? |
| K17 | Značkový hashtag ano / ne a jaký? |
| K18 | Smí maskot mluvit o cenách (IG post „Kolik stojí“)? Kde maskot nikdy nevystupuje? |

**C. Logo a maskot**

| ID | Otázka |
|---|---|
| K19 | Schválit světlé logo `logo-light.svg` (bílá písmena, maskot s ink obrysem a lila tělem). |
| K20 | Chcete horizontální lockup (koncepty 38:2 a 39:96)? Pokud ano, který? |
| K21 | Smí být logo a samostatný maskot v jedné kompozici (obálky, outro)? |
| K23 | Jak se maskot jmenuje? Je to „Sparkee“, nebo má vlastní jméno? Jak souvisí se soutěží „Pojmenuj můj plamínek“? |
| K24 | Jak často má být maskot na IG (každý post, nebo jen tam, kde mluví)? |
| K25 | Chcete pohledy 3/4 a z boku? Kdo je nakreslí (váš ilustrátor, podle vaší kresby)? |
| K26 | Nové výrazy (mrknutí, zamyšlený, ospalý): ano / ne? |
| K27 | Smí maskot nosit doplňky (čepice k Vánocům, brýle), nebo nikdy? |
| K28 | Sada samolepek maskota (stories, GIPHY, tisk): ano / ne? |

**D. Produkce a tisk**

| ID | Otázka |
|---|---|
| K29 | Pantone: máte tiskárnu nebo vzorník? Uděláme nátisk pastelů? |
| K30 | Holografická fólie na vizitce a samolepkách: ano / ne (rozpočet)? |
| K31 | Řez textu: Nunito 400 na webu a 500 jinde, nebo všude 500? Zrušit řez 900? |
| K32 | V čem budete dělat prezentace a dokumenty mimo Figmu (Google Slides, PowerPoint, Keynote, Canva)? |
| K33 | Stavové barvy formulářů (chyba, úspěch): smí chyba být tmavá blush, nebo chcete klasickou červenou? |
| K34 | Budete fotit (tým, natáčecí dny, reference)? Pokud ano, kapitola 10 bude v1.0. |
| K35 | Logo sting pro videa: ano / ne? Se zvukem (znělka)? |
| K36 | Handle @sparkee.cz na všech sítích, dostupnost ověřena? |
| K37 | Na kterých sítích kromě IG budete (TikTok, Facebook, LinkedIn, YouTube)? |
| K38 | Formát vizitky 90×50, nebo 85×55 mm? Kolik jmen a jaké role? |
| K39 | Šablony prezentace, nabídky a reportu: v jakém nástroji je chcete? |

**E. Správa a právo**

| ID | Otázka |
|---|---|
| K22 | Je „Sparkee“ a logo přihlášené jako ochranná známka (ÚPV / EUIPO)? Máme psát ® nebo ™? |
| K40 | Figma tým a tarif: chcete knihovnu publikovat pro další soubory? Kdo z vaší strany dostane přístup (view / edit)? |
| K41 | Kdo je vlastník značky a kontakt pro dotazy (jméno, e-mail, např. ahoj@sparkee.cz)? |
| K42 | Kde má ležet balík ke stažení (Google Drive, web `/brand` pro média, GitHub)? |
| K43 | Původní koncept maskota vznikl v AI nástroji (ChatGPT obrázek z 25. 1. 2026) a tělo je z něj trasované. Chcete to ověřit s právníkem kvůli ochraně autorských práv? Smí originál být na slidu „Příběh“? |
| K44 | Kdo schvaluje nové šablony a assety po předání manuálu? |
| K45 | Doména, IČO, e-mail a telefon pro kontaktní slide, podpis a vizitku (dnes [DOPLNIT]). |

---

## 8. Co z benchmarku přebíráme a proč

| Od koho | Co | Kde v manuálu |
|---|---|---|
| GitHub | „Graphic elements“, pravidla maskota (méně je víc, nikdy výplň, ne k vážným tématům), vyřazená loga, „Brand in action“ | 04.02, 03.12, 13 |
| Duolingo | Tvarový jazyk z málo tvarů, zaoblené bez ostrých hran, pravidla deformace kloubů, stavy pro animaci | 04.04, 04.05, 11.05 |
| Mailchimp | Hlas stálý, tón podle situace. Maskot jako doplněk, ne logo. | 02.01, 02.03 |
| Monzo | Tón je i struktura a kontext, ne jen slova | 02.04 |
| Slack | Samostatná stránka přístupných kombinací barev, správa značky, PDF forma | 05.07, 15.04 |
| Spotify | Minimální velikost v px i mm, co-branding | 03.05, 03.10 |
| Atlassian, IBM Carbon | Motion principy a pojmenované délky a easingy | 11.01 až 11.03 |
| Uber | Motion jako samostatná kapitola, směr pohybu | 11 |
| Discord | Kompletní balík ke stažení a právní pravidla | 15 |
| Headspace | Značka jako systém s ilustrací v jádru | 04, 07.08 |
| Figma best practices | Proměnné s módy, publikovaná knihovna, obálka jako komponenta, číslované stránky | 1, 4 |

---

## 9. Zdroje benchmarku

brand.github.com (foundations/logo, graphic-elements/mascots, brand-in-action/social) · design.duolingo.com (dnes přesměrováno na blog.duolingo.com/hub/design; shape-language, characters, duo) · blog.duolingo.com/world-character-visemes · mailchimp.com/about/brand-assets · styleguide.mailchimp.com (voice-and-tone) · monzo.com/tone-of-voice · slack.com/media-kit + Slack Brand Guidelines PDF · assets.uber.com · behance.net Uber Motion Guidelines · discord.com/branding · developer.spotify.com/documentation/design · standards.site/case-studies/headspace · atlassian.design/foundations/motion · carbondesignsystem.com/elements/motion · everything.design (motion brand guidelines) · constantcreates.com (mascot turnaround) · lefthd.com (AI mascot consistency) · dreamfarmagency.com (brand mascot book) · houseofmarketers.com (safe zones) · kapwing.com a oktopost.com (IG grid 2025) · figma.com/best-practices (components, styles, shared libraries) · frontify.com a brandyhq.com (brand guidelines).
