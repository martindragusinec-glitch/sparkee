// Sparkee ✦ Instagram launch kit: veškerý text na jednom místě (grafika, popisky, hashtagy, alt texty).
// Značky v textech grafiky: <em>…</em> = akcent (jen jedno krátké slovo nebo sousloví na jednom řádku): na světlé ink + holo
// zvýrazňovač pod slovem, na tmavé pastelový holo přechod 135deg na slově (pravidlo klienta 27. 9., kit.css),
// ✦ = jiskra (vykreslí se jako SVG), \n = nový řádek, <b>…</b> = tučně.
// Pravidla (brand, Figma tone of voice): maskot a IG tykají („ty“), agentura na webu a v nabídkách vyká („vy“). Krátké věty,
// žádné pomlčky, emoji max 1 na popisek, podpis ✦. Slovník klienta: „zastaví scroll“ (ne jiné obraty).
// V popiscích a alt textech nesmí zůstat [DOPLNIT]: build.mjs by skončil chybou (otevřené body patří do PLAN.md, kap. 11).
// Pózy: jméno souboru z assets/img/poses/ (wave, stand, …) nebo 'rig:<akce>-<t>' = zmrazený snímek živého rigu (_src/rig/).
// Rig drží v pravé tlapce vždy telefon, proto ho používáme střídmě: telefon max na 1 dlaždici gridu (P5) a max 2× v carouselu.
// m: {x | right | left, foot, h, rot, rest} = ruční doladění pozice maskota (right/left = hrana viditelného obrysu).

/** zmrazené snímky rigu, které layouty používají (build.mjs je vygeneruje přes rig.html) */
export const RIG_FRAMES = ['hey@0.5', 'tap@2.0', 'present@0.5', 'point@0.3', 'glance@1.0'];

export const PROFILE = {
  handle: 'sparkee.cz',
  name: 'Sparkee: social media agentura',
  category: 'Marketingová agentura',
  // 150/150 znaků včetně zalomení (IG počítá i konce řádků)
  bio: ['Dodáme jiskru tvým sociálním sítím ✦', 'Správa sítí, obsah, influenceři, reklama.', 'Systém agentury, tempo freelancera.', 'Napiš JISKRA do zpráv nebo klikni ↓'],
  link: 'sparkee.cz/#kontakt',
  linkTitle: 'Nezávazná konzultace 20 min',
  highlights: [
    { id: 'hl-1-ahoj', label: 'Ahoj ✦', icon: 'head', accent: 'mint' },
    { id: 'hl-2-sluzby', label: 'Služby', icon: 'pillars', accent: 'sky' },
    { id: 'hl-3-cenik', label: 'Ceník', icon: 'kc', accent: 'lilac' },
    { id: 'hl-4-kontakt', label: 'Kontakt', icon: 'bubble', accent: 'blush' },
    { id: 'hl-5-tipy', label: 'Tipy', icon: 'spark', accent: 'mint2' },
  ],
};

export const POSTS = [
  /* ---------------------------------------------------------------- P1 */
  {
    n: 1, id: 'p01', dir: '01_reel-ahoj', kind: 'reel', tone: 'dark', accent: 'holo',
    readme: `P1 Reel „Jiné agentury mají logo. Tahle má mě ✦“
Finální soubory k publikaci:
  video:   ../../reel/sparkee-reel.mp4 (renderuje _src/record_reel.mjs)
  cover:   cover.png v této složce (sedí na společný horizont gridu a na náhled profilu)
  popisek: caption.txt v této složce
reel/cover.png a reel/caption.txt jsou pracovní verze Reel agenta, nepoužívat.
alt.txt: IG u Reels pole pro alt text nemá, text je pro FB a TikTok.`,
    slides: [{
      layout: 'reelCover', file: 'cover.png', pose: 'wave',
      title: 'Ahoj, jsem\n<em>Sparkee</em> ✦', sub: 'tvář social media agentury',
      alt: 'Animovaný maskot Sparkee seskočí z loga, zamává a ukáže, jak z chaosu na sítích dělá plán, obsah a měsíční report.',
    }],
    caption: `Jiné agentury mají logo. Tahle má mě ✦

Ahoj, jsem Sparkee. Tvář social media agentury, která dělá z chaosu na sítích systém.

Co s týmem děláme pro firmy:
✦ plán obsahu na měsíc dopředu
✦ Reels, carousely a Stories, které zastaví scroll
✦ každý měsíc čísla, ne pocity

Tady budu jiskřit každý týden. Tipy k uložení, zákulisí a trochu legrace ze života na sítích. Sleduj mě, ať ti nic neuteče.

Chceš systém i pro svoje sítě? Napiš JISKRA do zpráv a domluvíme 20 minut nezávazné konzultace.`,
    hashtags: '#sparkee #socialnisite #spravasocialnichsiti #socialmediaagentura #marketingcz',
  },

  /* ---------------------------------------------------------------- P2 */
  {
    n: 2, id: 'p02', dir: '02_karta-postavy', kind: 'carousel', tone: 'light', accent: 'mint',
    slides: [
      { layout: 'charCover', pill: 'Karta postavy', title: 'Seznam se:\n<em>Sparkee</em> ✦', pose: 'stand',
        card: { name: 'Sparkee', type: 'jiskra s nohama', lvl: 'LVL 1' },
        alt: 'Herní karta maskota Sparkee s nápisem Seznam se: Sparkee.' },
      { layout: 'facts', pill: 'Karta postavy', title: 'Profil postavy', pose: 'wave',
        rows: [['Jméno', 'Sparkee'], ['Druh', 'jiskra s nohama'], ['Věk', 'čerstvě spuštěný'], ['Bydliště', 'tvůj feed']],
        alt: 'Profil postavy: jméno Sparkee, druh jiskra s nohama, věk čerstvě spuštěný, bydliště tvůj feed. Maskot mává.' },
      { layout: 'power', pill: 'Karta postavy', kicker: 'Superschopnost', title: 'Zastavím\n<em>scroll.</em>', text: 'Dělám obsah, u kterého lidi zůstanou až do konce.', pose: 'rig:tap-2.0',
        alt: 'Superschopnost: zastavím scroll. Maskot ťukl do telefonu, vyletělo srdíčko a on mrká.' },
      { layout: 'stats', pill: 'Karta postavy', title: 'Statistiky', pose: 'peek',
        stats: [['Energie', 100], ['Nápady', 99], ['Pravidelnost', 100], ['Trpělivost s posty\n„ať tam něco je“', 2]],
        alt: 'Statistiky jako ve hře: energie 100, nápady 99, pravidelnost 100, trpělivost s posty ať tam něco je 2. Maskot vykukuje přes horní hranu karty.' },
      { layout: 'list', pill: 'Karta postavy', title: 'Co mě naštve', mark: 'x', pose: 'surprised',
        items: ['Posty na poslední chvíli.', 'Zprávy bez odpovědi.', 'Report, kterému nerozumí ani autor.'],
        alt: 'Co maskota naštve: posty na poslední chvíli, zprávy bez odpovědi, report, kterému nerozumí ani autor.' },
      { layout: 'skills', pill: 'Karta postavy', title: 'Co umím <small>(s týmem)</small>', pose: 'rig:present-0.5',
        items: [['cal', 'Správa sítí'], ['cam', 'Tvorba obsahu'], ['star', 'Influenceři'], ['up', 'Paid social\npro dosah']],
        alt: 'Co Sparkee umí s týmem: správa sítí, tvorba obsahu, influenceři, paid social pro dosah. Maskot poskočí s rukama od těla.' },
      { layout: 'list', pill: 'Karta postavy', title: 'Moje pravidla', mark: 'num', pose: 'lie', poseBottom: true,
        items: ['Nic nevyjde bez tvého souhlasu.', 'Jeden kontakt, rychlé odpovědi.', 'Paušál bez hodin navíc.'],
        alt: 'Pravidla: nic nevyjde bez tvého souhlasu, jeden kontakt a rychlé odpovědi, paušál bez hodin navíc. Maskot pod nimi v klidu leží.' },
      { layout: 'ctaFollow', pill: 'Karta postavy', title: 'Sleduj mě.\nKaždý týden\nnová <em>jiskra</em> ✦', text: 'Ulož si kartu, ať mě neztratíš.', pose: 'happy',
        alt: 'Jásající maskot vedle náhledu profilu sparkee.cz se záložkou. Text: Sleduj mě. Každý týden nová jiskra. Ulož si kartu, ať mě neztratíš.' },
    ],
    caption: `Energie 100. Nápady 99. Trpělivost s posty „ať tam něco je“? Dva body ✦

Seznam se se Sparkee, tváří social media agentury.

S týmem za zády se starám o to, aby sítě firem žily každý den. Plánujeme, tvoříme obsah, hledáme influencery a reklamou pomáháme k většímu dosahu.

Která statistika je nejvíc tvoje? Energie, nápady, nebo pravidelnost? 👇`,
    hashtags: '#sparkee #socialmediaagentura #socialnisite #maskot #marketingcz',
  },

  /* ---------------------------------------------------------------- P3 */
  {
    n: 3, id: 'p03', dir: '03_posuvnik', kind: 'single', tone: 'dark', accent: 'sky',
    slides: [{
      layout: 'slider', title: 'Někde mezi.\nPřesně <em>tady</em> ✦', sub: 'Systém agentury. Tempo freelancera.', pose: 'sticker',
      left: ['Freelancer', 'levnější,\nale bez systému'], right: ['Velká agentura', 'velký tým,\nale pomalý'],
      alt: 'Maskot Sparkee stojí uprostřed posuvníku mezi freelancerem a velkou agenturou. Text: Někde mezi. Přesně tady. Systém agentury, tempo freelancera.',
    }],
    caption: `Freelancer, nebo velká agentura? My jsme přesně mezi ✦

Freelancer je rychlý, dokud stíhá. Když onemocní, tvoje sítě mlčí.
Velká agentura má tým, ale na schválení čekáš týdny.

U nás máš sehraný tým, jasný měsíční paušál bez hodin navíc a jeden kontakt, který odpovídá rychle.

A kde jsi teď ty? Freelancer, agentura, nebo sítě po večerech?`,
    hashtags: '#sparkee #socialmediaagentura #spravasocialnichsiti #podnikani #malefirmy',
  },

  /* ---------------------------------------------------------------- P4 */
  {
    n: 4, id: 'p04', dir: '04_5-chyb', kind: 'carousel', tone: 'light', accent: 'sky',
    slides: [
      { layout: 'lazyCover', pill: 'Tip', title: 'Tvůj Instagram\nse jen <em>válí?</em>', sub: '5 chyb, které ho brzdí', pose: 'lie',
        chips: [['post', 'Poslední post: před 47 dny'], ['story', 'Stories tento týden: 0']],
        alt: 'Maskot Sparkee se válí přes celý obrázek. Text: Tvůj Instagram se jen válí? 5 chyb, které ho brzdí. Vedle štítky: poslední post před 47 dny, Stories tento týden 0.' },
      { layout: 'mistake', pill: 'Tip', num: 1, title: 'Start na plný plyn.', text: 'První měsíc denně, pak ticho.', fix: 'Tempo na 6 měsíců, ne na 2 týdny.', pose: 'happy',
        alt: 'Chyba 1: start na plný plyn, první měsíc denně, pak ticho. Oprava: tempo na 6 měsíců, ne na 2 týdny.' },
      { layout: 'mistake', pill: 'Tip', num: 2, title: 'Postování, ať tam něco je.', text: 'Slabý post učí lidi, že tě nemusí sledovat.', fix: 'Radši 3 dobré týdně než 7 průměrných.', pose: 'surprised',
        alt: 'Chyba 2: postování, ať tam něco je. Oprava: radši 3 dobré posty týdně než 7 průměrných.' },
      { layout: 'mistake', pill: 'Tip', num: 3, title: 'Všude stejný obsah.', text: 'Reel z IG na TikToku jde, ale popisek, hudba a tón musí sedět síti.', fix: 'Jedno video, tři verze textu.', pose: 'peek',
        alt: 'Chyba 3: všude stejný obsah. Oprava: jedno video, tři verze textu.' },
      { layout: 'mistake', pill: 'Tip', num: 4, title: 'Komentáře bez odpovědi.', text: 'Konverzace je taky obsah.', fix: 'Odpovídej hlavně první hodinu po publikaci.', pose: 'phone-wave',
        alt: 'Chyba 4: komentáře bez odpovědi. Oprava: odpovídej hlavně první hodinu po publikaci.' },
      { layout: 'mistake', pill: 'Tip', num: 5, title: 'Nikdo nečte statistiky.', text: 'Bez čísel nevíš, co přidat a co škrtnout.', fix: 'Jednou měsíčně: dosah, uložení, sdílení a noví sledující.', pose: 'rig:glance-1.0',
        alt: 'Chyba 5: nikdo nečte statistiky. Oprava: jednou měsíčně dosah, uložení, sdílení a noví sledující. Maskot si čte čísla v telefonu.' },
      { layout: 'week', pill: 'Tip', kicker: 'Budíček ✦', title: 'Začni na\n<em>3 postech</em> týdně', text: 'Aspoň 1 Reel a Stories většinu dní.', pose: 'stand',
        week: [['Po', 'post', 1], ['Út', '', 1], ['St', 'reel', 1], ['Čt', '', 1], ['Pá', 'post', 1], ['So', '', 1], ['Ne', '', 0]],
        alt: 'Budíček: začni na 3 postech týdně, aspoň 1 Reel a Stories většinu dní. Týdenní plán: pondělí post, středa Reel, pátek post, Stories od pondělí do soboty, neděle volno.' },
      { layout: 'ctaDM', pill: 'Tip', title: 'Ulož si to\nna chvíli, kdy\nbudeš <em>plánovat.</em>', text: 'Nebo to nech na nás:', pose: 'wave',
        alt: 'Mávající maskot vedle okna zpráv, ve kterém je odeslané slovo JISKRA. Text: Ulož si to na chvíli, kdy budeš plánovat. Nebo to nech na nás. sparkee.cz' },
    ],
    caption: `Tvůj Instagram se jen válí? Tady je 5 nejčastějších důvodů ✦

Dobrá zpráva: žádný z nich nepotřebuje větší rozpočet. Jen systém.

Ke každé chybě máš v carouselu i opravu. Ulož si ho na chvíli, kdy budeš plánovat další měsíc.

Která chyba je tvoje? Napiš číslo do komentářů, nesoudíme.

Celý článek o tom, jak často postovat, najdeš na blogu. Odkaz v biu.`,
    hashtags: '#instagramtipy #instagramprofirmy #socialnisite #obsahovymarketing #malefirmy',
  },

  /* ---------------------------------------------------------------- P5 */
  {
    n: 5, id: 'p05', dir: '05_reel-viral', kind: 'reel', tone: 'dark', accent: 'lilac',
    readme: `P5 Reel „Když klient chce virál ✦“
V této složce je cover.png, caption.txt a alt.txt. Video (8 s smyčka, reel.mp4) zatím chybí: patří do práce na Reelech,
bez něj P5 publikovat nejde. Až bude hotové, uložit ho sem jako reel.mp4.
alt.txt: IG u Reels pole pro alt text nemá, text je pro FB a TikTok.`,
    slides: [{
      layout: 'reelViral', file: 'cover.png', pose: 'rig:hey-0.5',
      title: 'Když klient\nchce <em>virál</em> ✦', bubble: 'Můžete to udělat víc virální?', meta: 'klient, pátek 16:58',
      alt: 'Maskot Sparkee čte zprávu Můžete to udělat víc virální?, zavrtí hlavou a odpoví: Virál neslíbíme. Systém, co roste? To jo.',
    }],
    caption: `Zpráva, kterou zná každý, kdo dělá sítě ✦
„Můžete to udělat víc virální?“

Upřímně: virál neslíbí nikdo, kdo to myslí vážně. My slibujeme něco lepšího. Pravidelný obsah, jasný plán a každý měsíc čísla, ze kterých je vidět posun.

Označ kolegu, který chce virál do pátku.`,
    hashtags: '#sparkee #marketinghumor #socialnisite #instagramtipy #marketingcz',
  },

  /* ---------------------------------------------------------------- P6 */
  {
    n: 6, id: 'p06', dir: '06_kolik-stoji', kind: 'carousel', tone: 'light', accent: 'lilac',
    slides: [
      { layout: 'priceCover', pill: 'Čísla', title: 'Kolik stojí\nspráva sociálních\n<em>sítí?</em>', sub: 'Čísla bez mlžení, 2026', pose: 'surprised',
        alt: 'Překvapený maskot Sparkee u nadpisu Kolik stojí správa sociálních sítí? Čísla bez mlžení.' },
      { layout: 'chips', pill: 'Čísla', title: 'Nejdřív rozsah,\npak <em>cena.</em>', lead: 'Kompletní správa obsahuje:', pose: 'wave',
        chips: ['strategii', 'kalendář', 'tvorbu obsahu', 'publikaci', 'komunitu', 'report'],
        alt: 'Nejdřív rozsah, pak cena. Kompletní správa obsahuje strategii, kalendář, tvorbu obsahu, publikaci, komunitu a report.' },
      { layout: 'ranges', pill: 'Čísla', title: 'Orientačně za měsíc', lead: 'bez DPH a bez rozpočtu na reklamu',
        rows: [
          { name: 'Freelancer', a: 5, b: 20, txt: '5 000 až 20 000 Kč' },
          { name: 'Praktická agentura', a: 15, b: 40, txt: '15 000 až 40 000 Kč', us: true },
          { name: 'Velká agentura', a: 60, b: 80, txt: '60 000 Kč a víc', open: true },
          { name: 'Interní člověk', a: 45, b: 70, txt: '45 000 až 70 000 Kč', note: 'celkové náklady firmy' },
        ],
        note: 'Orientační rozpětí, český trh.',
        alt: 'Orientační ceny za měsíc bez DPH: freelancer 5 000 až 20 000 Kč, praktická agentura (to jsme my) 15 000 až 40 000 Kč, velká agentura 60 000 Kč a víc, interní člověk 45 000 až 70 000 Kč celkových nákladů firmy.' },
      { layout: 'chips', pill: 'Čísla', title: 'Co cenu\nposouvá <em>nejvíc</em>', pose: 'peek', big: true, peekTop: true,
        chips: ['počet sítí', 'frekvence', 'video, nebo grafika', 'natáčecí dny', 'komunita i o víkendu', 'reklama', 'kolik lidí schvaluje'],
        alt: 'Co cenu posouvá nejvíc: počet sítí, frekvence, video nebo grafika, natáčecí dny, komunita i o víkendu, reklama, kolik lidí schvaluje.' },
      { layout: 'list', pill: 'Čísla', title: 'Co paušál obvykle\n<em>nezahrnuje</em>', mark: 'minus', pose: 'rig:point-0.3', compact: true,
        items: ['rozpočet na reklamu', 'honoráře influencerů', 'velké produkce', 'licence na hudbu, fotobanky a fonty', 'krizovou komunikaci'],
        foot: 'Nech si to potvrdit před podpisem.',
        alt: 'Co paušál obvykle nezahrnuje: rozpočet na reklamu, honoráře influencerů, velké produkce, licence na hudbu, fotobanky a fonty, krizovou komunikaci. Nech si to potvrdit před podpisem. Maskot ukazuje na seznam.' },
      { layout: 'list', pill: 'Čísla', title: '6 otázek do každé\n<em>nabídky</em>', mark: 'q', pose: 'rig:glance-1.0', compact: true,
        items: ['Kolik přesně postů, videí a Stories?', 'Kdo tvoří a kdo natáčí?', 'Kolik kol úprav?', 'Jak rychle odpovídáte?', 'Jaký report?', 'Výpověď a komu patří obsah?'],
        alt: '6 otázek do každé nabídky: kolik postů, videí a Stories, kdo tvoří a natáčí, kolik kol úprav, jak rychle odpovídáte, jaký report, výpověď a komu patří obsah.' },
      { layout: 'ctaPrice', kicker: 'U nás', price: '14 900 Kč', pre: 'paušál od', post: 'měsíčně bez DPH', pose: 'happy',
        checks: ['Přesný počet výstupů.', 'Žádné hodiny navíc.', 'Reklamu platíš přímo platformám.'], text: 'Celý ceník najdeš v biu ✦',
        alt: 'Jásající maskot. U nás paušál od 14 900 Kč měsíčně bez DPH: přesný počet výstupů, žádné hodiny navíc, reklamu platíš přímo platformám. Celý ceník najdeš v biu. sparkee.cz' },
    ],
    caption: `Kolik stojí správa sociálních sítí v roce 2026? Čísla bez mlžení ✦

Orientačně, bez DPH a bez rozpočtu na reklamu:
✦ freelancer: 5 000 až 20 000 Kč měsíčně
✦ menší praktická agentura: 15 000 až 40 000 Kč
✦ velká agentura: 60 000 Kč a víc
✦ interní člověk: 45 000 až 70 000 Kč celkových nákladů firmy

Než začneš porovnávat ceny, porovnej rozsah. Kolik postů a videí? Kdo natáčí? Kolik kol úprav? Komu patří obsah?

V carouselu máš i seznam věcí, které paušál obvykle nezahrnuje. Právě tam vznikají nepříjemná překvapení.

Ulož si to na chvíli, kdy ti přijdou dvě nabídky lišící se o polovinu.`,
    hashtags: '#spravasocialnichsiti #socialmediaagentura #marketingprofirmy #podnikani #sparkee',
  },

  /* ---------------------------------------------------------------- P7 */
  {
    n: 7, id: 'p07', dir: '07_bingo', kind: 'single', tone: 'dark', accent: 'mint',
    slides: [{
      layout: 'bingo', title: 'Firemní Instagram <em>bingo</em> ✦', foot: 'Kolik máš? Napiš do komentářů ✦',
      cells: ['„Dáme tam něco, ať to žije.“', 'Poslední post: před 3 měsíci', 'Instagram dělá synovec', '„Proč to nemá víc lajků?“', 'FREE', 'Stories? Ty jsou taky?', 'Na zprávy odpovídáš za týden', '„Dej tam leták.“', 'Post v neděli ve 23:47'],
      alt: 'Bingo 3x3 s typickými chybami firemního Instagramu, uprostřed hlava maskota Sparkee jako volné pole.',
    }],
    caption: `Firemní Instagram bingo ✦
Zakroužkuj, co znáš. Buď upřímný, nikdo to neuvidí. Teda kromě nás.

0 až 2: jiskra tam je
3 až 5: chce to systém
6 a víc: napiš JISKRA do zpráv, dáme to dohromady

Kolik máš? A pošli to kolegovi, který má sítě „na starosti“ 😅`,
    hashtags: '#sparkee #instagramprofirmy #socialnisite #podnikani #marketinghumor',
  },

  /* ---------------------------------------------------------------- P8 */
  {
    n: 8, id: 'p08', dir: '08_od-chaosu-k-cislum', kind: 'carousel', tone: 'light', accent: 'blush',
    slides: [
      { layout: 'pathCover', pill: 'Systém', title: 'Od chaosu\nk <em>číslům</em>', sub: 'Jak to u nás běží, krok za krokem', pose: 'peek',
        steps: ['Audit', 'Plán', 'Tvorba', 'Report'],
        alt: 'Čárkovaná cesta vede od klubka chaosu přes kroky audit, plán a tvorba k reportu s rostoucími sloupci. Maskot Sparkee vykukuje přes horní hranu reportu.' },
      { layout: 'step', pill: 'Systém', num: 1, when: 'Týden 1', title: 'Audit\na poznání', text: 'Projdeme tvoje sítě, konkurenci a cíle. Zjistíme, kde je jiskra a kde chybí.', out: 'audit s doporučením', pose: 'surprised',
        alt: 'Krok 1, týden 1: audit a poznání. Projdeme tvoje sítě, konkurenci a cíle. Výstup: audit s doporučením.' },
      { layout: 'step', pill: 'Systém', num: 2, when: 'Týden 2', title: 'Strategie\na plán', text: 'Content pilíře, tón komunikace a obsahový kalendář ke schválení.', out: 'plán na měsíc', pose: 'stand',
        alt: 'Krok 2, týden 2: strategie a plán. Content pilíře, tón komunikace a obsahový kalendář ke schválení. Výstup: plán na měsíc.' },
      { layout: 'step', pill: 'Systém', num: 3, when: 'Každý měsíc', title: 'Tvorba\na publikace', text: 'Natočíme, nafotíme, napíšeme, naplánujeme. Ty jen schválíš.', out: 'obsah ke schválení', pose: 'rig:tap-2.0',
        alt: 'Krok 3, každý měsíc: tvorba a publikace. Natočíme, nafotíme, napíšeme, naplánujeme. Ty jen schválíš. Výstup: obsah ke schválení.' },
      { layout: 'step', pill: 'Systém', num: 4, when: 'Každý měsíc', title: 'Report\na ladění', text: 'Čísla na jedné stránce.\nNa rovinu, co funguje\na co změníme.', out: 'report na 1 stránce', pose: 'rig:present-0.5',
        alt: 'Krok 4, každý měsíc: report a ladění. Čísla na jedné stránce a na rovinu, co funguje a co změníme. Výstup: report na 1 stránce.' },
      { layout: 'list', pill: 'Systém', title: 'Co dostaneš\nkaždý <em>měsíc</em>', mark: 'check', pose: 'happy',
        items: ['Plán a kalendář ke schválení.', 'Posty, Reels a Stories podle balíčku.', 'Odpovědi na komentáře a zprávy.', 'Report na 1 stránce a další krok.'],
        alt: 'Co dostaneš každý měsíc: plán a kalendář ke schválení, posty, Reels a Stories podle balíčku, odpovědi na komentáře a zprávy, report na 1 stránce a další krok.' },
      { layout: 'packages', pill: 'Systém', title: 'Kolik to <em>stojí?</em>', pose: 'wave',
        pkgs: [['Spark', '2 sítě\n12 postů', '14 900'], ['Glow', '3 sítě\n16 postů', '24 900', 'nejoblíbenější'], ['Blaze', '4+ sítě\n24 postů', '39 900']],
        note: 'Měsíčně, bez DPH. Reklamu platíš přímo platformám.',
        bonus: ['Sleva 10 %', 'při závazku na 6 měsíců'],
        alt: 'Balíčky: Spark od 14 900 Kč (2 sítě, 12 postů), Glow od 24 900 Kč (3 sítě, 16 postů, nejoblíbenější), Blaze od 39 900 Kč (4 a víc sítí, 24 postů) měsíčně bez DPH. Reklamu platíš přímo platformám. Sleva 10 % při závazku na 6 měsíců.' },
      { layout: 'ctaCalendar', pill: 'Systém', title: 'První obsah\ndo <em>14 dnů</em>\nod podpisu ✦', text: 'Napiš <b>JISKRA</b> do zpráv.', pose: 'lie',
        alt: 'Maskot se v klidu válí na kalendáři, ve kterém je zakroužkovaný čtrnáctý den. Text: První obsah do 14 dnů od podpisu. Napiš JISKRA do zpráv. sparkee.cz' },
    ],
    caption: `Jak vypadá spolupráce s námi? Žádná magie. Systém ✦

Týden 1: audit. Týden 2: plán. Pak každý měsíc tvoříme, publikujeme a vyhodnocujeme. Ty jen schvaluješ a nic nevyjde bez tvého souhlasu.

První obsah vychází do 14 dnů od podpisu.

Chceš vědět, kde je na tvých sítích největší potenciál? Napiš nám do zpráv slovo JISKRA.`,
    hashtags: '#sparkee #spravasocialnichsiti #socialmediaagentura #marketingprofirmy #podnikani',
  },

  /* ---------------------------------------------------------------- P9 */
  {
    n: 9, id: 'p09', dir: '09_cta', kind: 'single', tone: 'dark', accent: 'holo',
    slides: [{
      layout: 'ctaDark', title: 'Máš nápad?\nPřidáme <em>jiskru.</em>', label: '20 minut nezávazné konzultace', button: 'Pojďme na to', pose: 'happy',
      alt: 'Jásající maskot Sparkee. Text: Máš nápad? Přidáme jiskru. 20 minut nezávazné konzultace. Pojďme na to. sparkee.cz',
    }],
    caption: `20 minut nad tvým Instagramem. Nezávazně a na rovinu ✦

Máš nápad? Přidáme jiskru. Řekneme ti, co funguje, co ne a kde je největší potenciál. Bez prodejní omáčky.

Napiš JISKRA do zpráv nebo klikni na odkaz v biu.`,
    hashtags: '#sparkee #spravasocialnichsiti #socialmediaagentura #marketingcz #podnikani',
  },
];

/* Stories 1080×1920: text v y 250 až 1580, x 64 až 1016. Interaktivní stickery (otázka, anketa, kvíz, odkaz, sdílený Reel)
   se přidávají v aplikaci do plochy `sticker` (x, y, w, h v px). Ve finálním PNG je tam jen měkká záře bez rámečku,
   obrys plochy a nákres stickeru ukazuje jen _preview/stories-guide.png.
   set 'launch' = launch stories (stories/, návod stories/stories.txt), set 'highlight' = stálý obsah highlightů
   (highlights/stories/, návod highlights/highlights.txt, nahrát Den −2). */
const UTM = (camp, c) => `utm_source=instagram&utm_medium=social&utm_campaign=${camp}&utm_content=${c}`;
const SITE = 'https://sparkee.cz';
export const STORIES = [
  /* ---------- launch ---------- */
  { set: 'launch', id: 's1-ahoj', file: 's1-ahoj.png', tone: 'dark', accent: 'mint', layout: 'storyHello', pose: 'wave',
    title: 'Ahoj, jsem\n<em>Sparkee</em> ✦', text: 'Ode dneška i na Instagramu.', note: 'Tohle je můj plamínek.\nJak by se měl jmenovat?',
    sticker: { kind: 'question', hint: 'napiš mi jméno', text: 'Pojmenuj můj plamínek', x: 96, y: 1250, w: 888, h: 320 }, when: 'Den 0 (út 6. 10.) 10:15, po oznámení mimo IG', hl: 'Ahoj ✦' },
  { set: 'launch', id: 's2-reel', file: 's2-sdileni-reelu.png', tone: 'dark', accent: 'mint', layout: 'storyShare', pose: 'sticker',
    title: 'Můj první\n<em>Reel</em> ✦', share: 'feed/01_reel-ahoj/cover.png',
    sticker: { kind: 'share', x: 360, y: 560, w: 360, h: 640 }, when: 'Den 0 (út 6. 10.) 10:30', hl: 'Ahoj ✦',
    how: ['Otevři P1 a klepni na Sdílet → Přidat do příběhu.', 'Přes ikonu nálepky přidej s2-sdileni-reelu.png jako fotku a roztáhni ji přes celou plochu.', 'Náhled Reelu dej dopředu (klepnutím) a zmenši ho do plochy x 360 až 720, y 560 až 1200.', 'Předem vyzkoušej na soukromém testovacím účtu. Záloha: sdílet s automatickým pozadím a dopsat „Můj první Reel ✦“ nativním textem.'] },
  { set: 'launch', id: 's3-anketa', file: 's3-anketa.png', tone: 'dark', accent: 'blush', layout: 'storyPoll', pose: 'surprised',
    kicker: 'Anketa', title: 'Co tě na firemních sítích <em>štve</em> nejvíc?',
    sticker: { kind: 'poll', hint: 'hlasuj', text: 'Co tě štve nejvíc?', options: ['Nemám čas', 'Nevím, co postovat', 'Nevidím výsledky', 'Nikdo nereaguje'], x: 96, y: 860, w: 888, h: 400 }, when: 'Den 0 (út 6. 10.) 14:00' },
  { set: 'launch', id: 's4-kviz', file: 's4a-kviz.png', tone: 'light', accent: 'sky', layout: 'storyQuiz', pose: 'phone',
    kicker: 'Kvíz', title: 'Kolik Reels týdně dává firmám <em>smysl?</em>',
    sticker: { kind: 'quiz', hint: 'tipni si', text: 'Kolik Reels týdně?', options: ['0', '2 až 4', '20'], right: 1, x: 96, y: 850, w: 888, h: 360 }, when: 'Den 2 (čt 8. 10.) s P4', hl: 'Tipy' },
  { set: 'launch', id: 's4-odkaz', file: 's4b-odkaz-clanek.png', tone: 'light', accent: 'sky', layout: 'storyLink', pose: 'happy',
    kicker: 'Ideál 2 až 4, na start stačí 1 ✦', title: 'Víc v článku\nna <em>blogu</em>', text: 'Jak často postovat na Instagram v roce 2026', tail: 'Plus ukázkový týdenní plán ✦',
    sticker: { kind: 'link', hint: 'klikni', text: 'Celý článek', x: 290, y: 1150, w: 500, h: 170, url: `${SITE}/blog/jak-casto-postovat-na-instagram.html?${UTM('ig_launch', 'story_s4')}` }, when: 'Den 2 (čt 8. 10.) po kvízu', hl: 'Tipy' },
  { set: 'launch', id: 's5-cta', file: 's5-cta.png', tone: 'dark', accent: 'holo', layout: 'storyCta', pose: 'happy',
    title: 'Máš nápad?\nPřidáme <em>jiskru.</em>', text: 'nebo napiš <b>JISKRA</b> do zpráv',
    sticker: { kind: 'link', text: 'zjistit víc', x: 290, y: 1200, w: 500, h: 170, url: `${SITE}/?${UTM('ig_launch', 'story_s5')}#kontakt` }, when: 'Den 16 (čt 22. 10.) s P9', hl: 'Kontakt' },

  /* ---------- highlighty (nahrát Den −2, ne 4. 10.) ---------- */
  { set: 'highlight', hl: 'Ahoj ✦', id: 'hs-ahoj-1', file: 'ahoj-1-pro-koho.png', tone: 'dark', accent: 'mint', layout: 'storyInfo', pose: 'happy',
    kicker: 'Pro koho jsme', title: 'Pro firmy, které\nchtějí <em>systém</em> ✦',
    rows: ['Chceš pravidelný obsah, ale nemáš na něj čas.', 'Freelancer nestíhá, velká agentura je pomalá.', 'Chceš vidět čísla, ne pocity.'], mark: 'check' },
  { set: 'highlight', hl: 'Ahoj ✦', id: 'hs-ahoj-2', file: 'ahoj-2-4-kroky.png', tone: 'dark', accent: 'mint', layout: 'storyInfo', pose: 'stand',
    kicker: 'Jak to u nás běží', title: 'Od chaosu\nk <em>číslům</em>',
    steps: [['Audit a poznání', 'Týden 1'], ['Strategie a plán', 'Týden 2'], ['Tvorba a publikace', 'Každý měsíc'], ['Report a ladění', 'Každý měsíc']] },
  { set: 'highlight', hl: 'Služby', id: 'hs-sluzby-1', file: 'sluzby-1-sprava.png', tone: 'light', accent: 'sky', layout: 'storyInfo', pose: 'phone-wave',
    kicker: 'Služby ✦', title: 'Správa\nsociálních <em>sítí</em>', text: 'Tvoje profily žijí každý den, ne jen když si vzpomeneš.',
    chips: ['obsahový kalendář', 'publikace', 'komentáře a zprávy', 'měsíční report'],
    sticker: { kind: 'link', hint: 'detail služby', text: 'Správa sítí', x: 96, y: 1260, w: 500, h: 170, url: `${SITE}/sluzby/sprava-socialnich-siti.html?${UTM('ig_profil', 'ig_highlight_sprava')}` } },
  { set: 'highlight', hl: 'Služby', id: 'hs-sluzby-2', file: 'sluzby-2-obsah.png', tone: 'light', accent: 'sky', layout: 'storyInfo', pose: 'rig:tap-2.0',
    kicker: 'Služby ✦', title: 'Tvorba\n<em>obsahu</em>', text: 'Reels, foto, grafika a texty. Natočíme, nafotíme a napíšeme.',
    chips: ['Reels a TikToky', 'foto', 'grafika', 'copy', 'natáčecí den'],
    sticker: { kind: 'link', hint: 'detail služby', text: 'Tvorba obsahu', x: 96, y: 1260, w: 500, h: 170, url: `${SITE}/sluzby/tvorba-obsahu.html?${UTM('ig_profil', 'ig_highlight_obsah')}` } },
  { set: 'highlight', hl: 'Služby', id: 'hs-sluzby-3', file: 'sluzby-3-influenceri.png', tone: 'light', accent: 'sky', layout: 'storyInfo', pose: 'wave',
    kicker: 'Služby ✦', title: 'Influencer\n<em>marketing</em>', text: 'Tváře, kterým tvoje cílovka věří. Od briefu po výsledky v číslech.',
    chips: ['výběr tvůrců', 'brief', 'smlouvy', 'měření'],
    sticker: { kind: 'link', hint: 'detail služby', text: 'Influenceři', x: 96, y: 1260, w: 500, h: 170, url: `${SITE}/sluzby/influencer-marketing.html?${UTM('ig_profil', 'ig_highlight_influenceri')}` } },
  { set: 'highlight', hl: 'Služby', id: 'hs-sluzby-4', file: 'sluzby-4-paid.png', tone: 'light', accent: 'sky', layout: 'storyInfo', pose: 'happy',
    kicker: 'Služby ✦', title: 'Paid social\npro <em>dosah</em>', text: 'Dobrý obsah ukážeme správným lidem. Žádné agresivní prodejní kampaně.',
    chips: ['Meta', 'TikTok', 'nejlepší posty', 'rozpočet platíš platformám'],
    sticker: { kind: 'link', hint: 'detail služby', text: 'Paid social', x: 96, y: 1260, w: 500, h: 170, url: `${SITE}/sluzby/paid-social.html?${UTM('ig_profil', 'ig_highlight_paid')}` } },
  { set: 'highlight', hl: 'Ceník', id: 'hs-cenik-1', file: 'cenik-1-balicky.png', tone: 'light', accent: 'lilac', layout: 'storyInfo', pose: 'peek',
    kicker: 'Ceník', title: 'Jasná cena.\n<em>Každý</em> měsíc.',
    tiers: [['Spark', '2 sítě · 12 postů · 2 Reels', '14 900'], ['Glow', '3 sítě · 16 postů · 6 Reels', '24 900', 'nejoblíbenější'], ['Blaze', '4+ sítě · 24 postů · 10 Reels', '39 900']],
    foot: 'Od, měsíčně, bez DPH. Reklamu platíš přímo platformám.',
    sticker: { kind: 'link', hint: 'celý ceník', text: 'Ceník', x: 96, y: 1420, w: 500, h: 150, url: `${SITE}/?${UTM('ig_profil', 'ig_highlight_cenik')}#cenik` } },
  { set: 'highlight', hl: 'Ceník', id: 'hs-cenik-2', file: 'cenik-2-zavazek.png', tone: 'light', accent: 'lilac', layout: 'storyInfo', pose: 'stand',
    kicker: 'Časté otázky', title: 'Musím se\n<em>zavázat?</em>',
    faq: [['Musím se zavázat na dlouho?', 'Nemusíš. Spolupráce je měsíční. Při závazku na 6 měsíců máš slevu 10 %.'], ['Je v ceně i reklama?', 'Ne. Rozpočet na reklamu platíš přímo platformám, takže máš plnou kontrolu.']] },
  { set: 'highlight', hl: 'Kontakt', id: 'hs-kontakt-1', file: 'kontakt-1-jak-zacit.png', tone: 'dark', accent: 'blush', layout: 'storyInfo', pose: 'wave',
    kicker: 'Jak začít', title: 'Napiš <em>JISKRA</em>\ndo zpráv ✦',
    steps: [['Napiš JISKRA nebo klikni', 'Dnes'], ['20 minut nezávazně', 'Konzultace'], ['První obsah', 'Do 14 dnů']],
    sticker: { kind: 'link', hint: 'domluvit konzultaci', text: 'Konzultace', x: 96, y: 1340, w: 500, h: 170, url: `${SITE}/?${UTM('ig_profil', 'ig_highlight_kontakt')}#kontakt` } },
  { set: 'highlight', hl: 'Kontakt', id: 'hs-kontakt-2', file: 'kontakt-2-faq.png', tone: 'dark', accent: 'blush', layout: 'storyInfo', pose: 'happy',
    kicker: 'Časté otázky', title: 'Kdo schvaluje\n<em>obsah?</em>',
    faq: [['Kdo schvaluje obsah?', 'Ty. Každý měsíc dostaneš kalendář ke schválení a nic nevyjde bez tvého souhlasu.'], ['Jak rychle začneme?', 'Úvodní call, přístupy, audit a strategie. První obsah do 14 dnů od podpisu.']] },
  { set: 'highlight', hl: 'Tipy', id: 'hs-tipy-1', file: 'tipy-1-kolik-stoji.png', tone: 'light', accent: 'mint2', layout: 'storyLink', pose: 'surprised',
    kicker: 'Na blogu ✦', title: 'Kolik stojí\nsocial <em>media?</em>', text: 'Kolik stojí správa sociálních sítí v roce 2026', tail: 'Reálné rozpětí a na co si dát pozor ✦',
    sticker: { kind: 'link', hint: 'klikni', text: 'Celý článek', x: 290, y: 1150, w: 500, h: 170, url: `${SITE}/blog/kolik-stoji-sprava-socialnich-siti.html?${UTM('ig_profil', 'ig_highlight_tipy_cena')}` } },
  { set: 'highlight', hl: 'Tipy', id: 'hs-tipy-2', file: 'tipy-2-influenceri.png', tone: 'light', accent: 'mint2', layout: 'storyLink', pose: 'wave',
    kicker: 'Na blogu ✦', title: 'Influenceři\nbez <em>milionů</em>', text: 'Influencer marketing pro malé firmy bez velkého rozpočtu', tail: 'Nano a mikro tváře, brief a měření ✦',
    sticker: { kind: 'link', hint: 'klikni', text: 'Celý článek', x: 290, y: 1150, w: 500, h: 170, url: `${SITE}/blog/influencer-marketing-pro-male-firmy.html?${UTM('ig_profil', 'ig_highlight_tipy_influenceri')}` } },
];
