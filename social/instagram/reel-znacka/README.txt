Reel „Jak vzniklo moje logo?“ (Sparkee)

Soubor: sparkee-reel-znacka.mp4, 1080×1920, 30 fps, 20 s, H.264 + AAC.
Cover: cover.png (1080×1920) a cover-4x5.png (1080×1350, výřez do mřížky profilu).
Popisek: caption.txt.

Příběh: hook „Jak vzniklo moje logo?“ → přetočení časové osy → Na počátku byla jiskra → Pak skica → Pak řád
(konstrukční kružnice, 24°) → Pak křivky → Pak barva → Pak jméno → A pak já → A teď naostro (logo open ZÁŽEH
na tmavé) → claim „Dodáme jiskru tvým sociálním sítím“ → smyčka zpět na začátek.
Všechno je postavené z geometrie oficiálního loga 124:3, žádné staré koncepty.

Zvuk: vlastní syntetizovaný sound design (bez cizích samplů a hudby), 120 BPM, střihy na doby.
Chcete-li trending zvuk z Instagramu, ztlumte originální stopu a vyberte skladbu kolem 120 BPM
(čistý elektronický / lo-fi pop s výrazným dropem): drop položte na 16 s (přechod do tmy „A teď naostro“).

Logo open (samostatně): ../../../assets/video/logo-open/sparkee_zazeh_full_{16x9|9x16|1x1}_{light|dark}.mp4 (3,5 s)
+ PNG poster posledního snímku. Sonic logo: remotion/src/comps/story/audio/sparkee-sonic-logo.wav.

Přerenderování (ve složce sparkee-web/remotion):
  npx remotion render BrandStoryReel ../social/instagram/reel-znacka/sparkee-reel-znacka.mp4 --codec=h264 --pixel-format=yuv420p
  npx remotion still BrandStoryReelCover ../social/instagram/reel-znacka/cover.png
  node scripts/render-logo-open.mjs
