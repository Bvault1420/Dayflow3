# Kairos — Analyse, Positionierung, Ideen

Stand: 24. August 2026  
Quellen: fertige App auf Branch `cursor/aippy-tiktok-roblox-app-36fa`, Rebuild-Plan, Aippy-Website/Store/Docs.

---

## 1. In einem Satz

Kairos ist heute eine **gute erste Version einer Aippy-Kopie** mit eigenem Namen und eigener Farbwelt — aber noch **keine eigene Produktidee**. Die Chance liegt nicht darin, Aippy besser nachzubauen. Sie liegt im Namen: **Kairos = der richtige Moment.**

Wenn du das ernst nimmst, entsteht etwas, das Aippy nicht ist: kein endloser KI-Spiel-Feed, sondern **kurze, gemeinsame, zeitlich präzise Spiel-Momente**.

---

## 2. Was heute existiert (ehrlich)

### Website

Es gibt **keine echte Kairos-Website**.

Was es gibt:

- Die App selbst unter `localhost` / Cursor-Preview (eine Next.js-Web-App, kein App-Store-Produkt).
- Zwei Platzhalter-Seiten: `/privacy` und `/terms` (explizit „replace before launch“).
- Kein Hero, keine Story, kein Warte-Listen-Funnel, keine Domain, kein Impressum, kein App-Store-Link.

Du hattest von Anfang an **App + Website** gewollt. Geliefert wurde nur die App, die sich wie eine Mobile-App im Browser anfühlt.

### App (was gebaut ist)

| Bereich | Status | Kurz |
|---|---|---|
| Feed | da | Vertikales Snap-Scrollen, 10–60s Canvas-Spiele, Like / Kommentar / Speichern / Views / Teilen |
| Create | da | Ein Prompt → KI (Groq/OpenAI) oder Keyword-Mapper → spielbares Mini-Game |
| Remix | da | Community-Spiel als Startpunkt, dann tweaken und neu veröffentlichen |
| Explore | dünn | 2-Spalten-Grid „Trending“, Platzhalter-Thumbnails (kein echtes Vorschaubild) |
| Profile | da | Created / Liked / Saved / History, Follower, Level & Coins |
| Alerts | dünn | Likes, Kommentare, Follows |
| Auth | da, wacklig | Nur E-Mail + Passwort. Google raus. Bestätigungs-Mails oft nicht angekommen |
| Legal | Platzhalter | Privacy/Terms nicht launch-reif |
| Native App | fehlt | Nur Web, kein iOS/Android |

**Technik:** Next.js + Tailwind + Framer Motion + Supabase (Auth, Postgres, Storage). Spiele laufen in einem **eigenen 2D-Canvas**, nicht in Roblox/Unity/3D.

**Spiel-Engine:** 6 Genres — Flappy, Runner, Dodge, Catch, Tap, Roam. Dazu Mods (Dash, Magnet, Invert, 3 Spuren …) und Farbschemata, damit zwei Runner nicht identisch wirken. Das ist clever für einen Prototyp. Es ist **kein** „beschreib irgendwas, bekomm ein neues Spiel wie bei Aippy“.

### Design heute

Nach dem Rebrand weg von Aippy:

- Hell, „Studio“, nicht Dark-Neon
- Kobalt `#2457ff` + Orange `#ff6a3d`
- Schriften: **Manrope** (Text) + **Bricolage Grotesque** (Überschriften)
- Geometrisches **K**-Logo, kein Ghost-Maskottchen
- Create-Button orange, getrennt von der unteren Nav
- Feed-Aktionen unten, nicht als TikTok-Icon-Stack rechts

Das ist **rechtlich und visuell schon nicht mehr Aippy**. Emotional ist es aber noch eine **SaaS-App** (helles Dashboard, Pillen, Grids). Es fühlt sich nicht nach „richtigem Moment“ an. Es fühlt sich nach „Tool zum Spiele bauen“ an — und genau das ist Aippy auch.

---

## 3. Vergleich mit Aippy (ohne Schönfärben)

Aippy ist die Referenz, an der du die App gemessen hast. Das ist nachvollziehbar. Als Strategie ist es gefährlich.

| | **Aippy** | **Kairos heute** |
|---|---|---|
| Kernloop | Scrollen → spielen → remixen → prompten | dasselbe |
| Create | Prompt wird zu echtem interaktivem Code (Games, Memes, 3D, Sensoren, AR) | Prompt wird auf 6 Canvas-Vorlagen gemappt |
| Feed | Dunkles TikTok, Ghost, Neon-Grün | Helles Studio, K-Logo, Blau/Orange |
| Plattform | Native iOS + Android, echte User | Nur Web-Prototyp |
| Stärke | Chaos, Memes, Sensoren, Remix-Kultur | Sauberer Start, Rechte-Check bei Uploads, Fokus auf 10–60s |
| Schwäche | Wirkt wie alle KI-Toy-Feeds | Wirkt wie eine hellere Aippy-Kopie mit schwächerer Engine |

**Was Aippy kann und Kairos nicht kopieren sollte (und aktuell nicht kann):**

- Beliebige 3D-Experimente, Hand-Tracking, Mikrofon, Kamera, AR
- Meme-GIFs als Sprache der Community
- „Build What You Feel“ als leerer Claim über einem Allzweck-Generator

Wenn Kairos versucht, **dieselbe Kategorie** zu gewinnen (TikTok × Roblox × KI), verliert es. Aippy hat Vorsprung, Nutzer, Native Apps und eine Engine, die echten Code spuckt. Dein Canvas mit sechs Genres kommt da nie an — und muss das auch nicht.

**Was Kairos schon besser andeutet als Aippy:**

- Harte Kürze (10–60 Sekunden) als Regel, nicht als Zufall
- Rechte/Copyright-Hinweis bei Uploads (selten bei solchen Apps)
- Der Name **Kairos** — der ist stärker als „Aippy“

---

## 4. Die eigentliche Lücke

Aippy fragt: *„Was willst du bauen?“*  
Kairos sollte fragen: *„Wann ist der Moment — und mit wem?“*

Aippy = unendlicher Scroll von Einzel-Kreationen.  
Kairos = **ein Moment, der zählt.** Danach ist er vorbei.

Das ist kein Marketing-Spruch. Das ist die Produktregel:

1. Kurz (nicht Open World).
2. Einmalig (nicht endlos dieselben Runner).
3. Geteilt (nicht nur allein im Feed).
4. Zeitlich (Uhrzeit, Tageszeit, Countdown — der Name verpflichtet).

Alles, was wie Aippy aussieht (Plus-Button, Prompt-Box, vertikaler Feed, Remix-Tab), kannst du später haben. Zuerst braucht die App **eine eigene Geste**, die man in einem Satz erklären kann.

---

## 5. Produktideen, die einzigartig sind — und trotzdem funktionieren

Nicht „wir bauen eine bessere Aippy-Engine“. Sondern Features, die mit deinem **heutigen** 2D-Mini-Game-Kern machbar sind.

### Idee A — Der tägliche Kairos (Kern-Feature)

Jeden Tag gibt es **ein** offizielles Moment-Spiel. Alle spielen **dieselbe Runde**, denselben Seed, dieselbe Dauer.

- Wie Wordle, aber spielbar statt Buchstaben.
- Leaderboard des Tages. Morgen ist es weg.
- Kein Doomscroll. Du kommst rein, spielst 20 Sekunden, vergleichst, gehst.

**Warum einzigartig:** Aippy ist „unendlich mehr Content“. Kairos ist „heute dieses eine Ding“.  
**Warum machbar:** Ein Seed + ein Genre + Timer hast du schon.

### Idee B — Gemeinsamer Countdown (Live-Moment)

Um z. B. 19:00 startet weltweit dieselbe 30-Sekunden-Runde. Wer zu spät kommt, schaut zu oder spielt die Wiederholung ohne Rangliste.

- Gefühl von Live-Sport / Silvester-Countdown.
- Chat nur während der 30 Sekunden, dann Stille.

**Warum einzigartig:** Social Apps scrollen immer. Kairos *wartet*.  
**Warum machbar:** Server-Zeit + ein Seed. Kein 3D nötig.

### Idee C — Gefühl zuerst, Genre unsichtbar

Create startet nicht mit „Flappy / Runner / Dodge“, sondern mit:

> Wie soll sich das anfühlen?  
> nervös · verliebt · wütend · lost · euphorisch · nachts um 3

Die Engine wählt Genre und Tempo intern. Der User sieht nie „du hast ein Flappy gebaut“.

**Warum einzigartig:** Aippy verkauft Tools. Kairos verkauft ein Gefühl mit Timer.  
**Warum machbar:** Dein Prompt-Mapper bekommt Emotion als Input statt Game-Namen.

### Idee D — Staffel / Kette (playable Comic)

Ein Moment hat 3 Panels:

1. Jemand baut den **Anfang** (15s).
2. Jemand anders baut die **Mitte**.
3. Jemand schließt **ab**.

Im Feed spielst du die Kette hintereinander. Remix ist keine Kopie, sondern **die nächste Szene**.

**Warum einzigartig:** Remix bei Aippy = Fork. Hier = Fortsetzung.  
**Warum machbar:** Drei `play_config`s hintereinander, gleicher Titel-Thread.

### Idee E — Zu zweit auf einem Handy

20 Sekunden, ein Display, zwei Daumen. Kein Account-Zwang für Spieler 2.

Beispiele: abwechselnd tippen, einer steuert links / einer rechts, „nicht gleichzeitig loslassen“.

**Warum einzigartig:** Aippy ist Solo-Scroll. Kairos ist Sofa / Schule / Bahn.  
**Warum machbar:** Touch-Zonen im Canvas, den du schon hast.

### Idee F — Anti-Feed: 7 Momente, dann Feierabend

Die App gibt dir **sieben** Momente am Tag. Danach: eine schöne Endkarte, kein Infinite Scroll.

- Passt zum Namen.
- Marketing, das wahr ist: „Wir stehlen dir nicht den Abend.“
- Creator können trotzdem mehr bauen — aber Konsum ist begrenzt.

**Warum einzigartig:** Jeder Konkurrent will dich halten. Kairos lässt dich gehen.  
**Warum machbar:** Zähler pro Account / Gerät. Null neue Engine.

### Idee G — Ort- und Wetter-Momente (später)

Ein Spiel existiert nur bei Regen. Oder nur nach Sonnenuntergang. Oder nur in deiner Stadt für 1 Stunde.

Nicht als gimmick-AR wie Aippy, sondern als **Regel des Moments**.

**Warum einzigartig:** Der Name wird wörtlich.  
**Warum später:** Braucht Location/Wetter. Erst bauen, wenn A–F sitzen.

### Idee H — Zuschauen und werfen

Du spielst nicht, du schaust jemandem 20 Sekunden zu und wirfst Herzen / Hindernisse / Boosts (wie Twitch, aber winzig).

**Warum einzigartig:** Kurzer Spectator-Sport statt Creator-Tool.  
**Warum machbar:** Ein Live-State (Score + Position) reicht, kein Vollbild-Stream.

---

## 6. Was du *nicht* bauen solltest

Diese Dinge machen Kairos wieder zu Aippy — oder zu einem leeren Versprechen:

1. **„Beschreib ein GTA / Roblox / 3D-Open-World“** als Qualitätsziel. Deine Engine kann das nicht. Versprich es nicht.
2. **Neon-Grün, Ghost, rechte Icon-Leiste, dunkles TikTok.** Das ist Aippy. Du bist schon weg davon — bleib weg.
3. **Create mit 5 Studio-Tabs** (Idea / Tweak / Look / Media / Remix) als erstes, was man sieht. Das ist ein Tool. Kairos braucht eine Frage, keine Werkstatt.
4. **Fake-Likes und Fake-Follower.** Feed darf leer starten. Lüge zerstört das Produkt.
5. **Alles auf einmal:** Native App, Sensoren, AR, Payments, Chat, 20 Genres. Erst *eine* Geste, die sitzt.

---

## 7. Design — visuell weg von Aippy *und* weg vom aktuellen Studio-Look

Heute: helles Blau/Orange-SaaS. Aippy: dunkles Neon-Spielzeug.  
Kairos sollte sich anfühlen wie **goldene Stunde + Kino + analoge Uhr** — nicht wie ein Dashboard und nicht wie TikTok.

### Richtung: „Golden Hour Cinema“

Nicht knallig. Nicht startupy. Warm, präzise, kurz.

| Token | Vorschlag | Warum |
|---|---|---|
| Hintergrund | `#140e0a` (fast Schwarz-Braun) oder Dämmerung `#1a1410` | Kino, nicht FYP |
| Fläche | `#221a14` | Warm, kein kühles Grau |
| Text | `#f4ead8` (Papier / Polaroid) | Analog, nicht UI-Weiß |
| Akzent 1 | `#e8a54b` (Spätlicht / Messing) | „Kairos“ = günstiger Augenblick, Licht kippt |
| Akzent 2 | `#c45c3a` (Abendrot, sparsam) | Wärme statt Aippy-Grün und statt Cobalt-Blau |
| Gefahr / Live | `#ff5a3c` nur für Countdown | Eine Farbe hat eine Aufgabe |
| Schriften | Display: **Fraunces** oder **Cormorant** (Serife). Body: **Instrument Sans** oder **Satoshi** | Serife = Moment, Literatur, Zeit. Aippy und dein aktuelles Kairos sind beide grob-geometrisch sans |

**Logo:** Das geometrische K darf bleiben, aber als **Markierung einer Sekunde** — z. B. ein K, dessen einer Strich ein dünner Sekundenzeiger ist. Kein Maskottchen. Kein Ghost. Kein Roboter.

**Bewegung:** Jeder Screen-Wechsel ist ein **Shutter** (kurz schwarz, 80ms), nicht ein Slide wie TikTok. Spiel-Start: ein Atemzug. Spiel-Ende: Standbild, wie ein Foto, das sich entwickelt.

**Feed (wenn du einen behältst):** Kein Fullscreen-Clip-Stack. Eher **eine Karte auf Dunkelheit** — Polaroid / Filmstill. Unten Titel + wer es gebaut hat + „Play 0:18“. Nach dem Spiel bleibt das letzte Frame stehen. Scrollen ist bewusster.

**Create:** Eine Frage, ein Slider (Dauer 10–60s), ein großer „Moment erzeugen“. Tweak/Media/Remix hinter einem „Feinmachen“, nicht als Haupttabs.

**Nav:** Unten nur drei Dinge: **Heute** · **Machen** · **Ich**. Explore und Alerts sind sekundär (Glocke im Profil). Weniger Chrome als Aippy.

**Sound:** Ein kurzer Kairos-Ton am Start und am Ende jedes Moments (hast du schon als `kairos-sfx`). Daraus eine Erkennungsmelodie machen — 4 Töne, wie ein Jingle. Das unterscheidet mehr als jede Farbe.

### Website (die noch fehlt)

Eine Seite, kein Marketing-Brei.

1. **Hero:** Dunkler Hintergrund, ein laufendes 18-Sekunden-Spiel in einem Filmrahmen, Headline: *„Nicht scrollen. Einen Moment spielen.“*
2. **Ein Satz Erklärung:** Täglich ein gemeinsames Mini-Spiel. 10–60 Sekunden. Dann ist es vorbei.
3. **Drei Stills** (nicht Feature-Grid): Heute / Zu zweit / Selber einen Moment bauen.
4. **CTA:** „Heutigen Kairos spielen“ — direkt in die App, kein Account zwingend.
5. **Fuß:** Impressum, Datenschutz (echt), Kontakt. Deutsch zuerst.

Kein „AI-powered creator studio“. Kein Ghost. Kein Vergleich zu TikTok/Roblox auf der Startseite — das zieht dich zurück in Aippys Satz.

---

## 8. App-Screen für Screen: was ändern

### Auth / Einstieg

Heute: Login-Card, „Continue browsing“. Gut: Gäste dürfen schauen.  
Besser: **Zuerst das heutige Spiel**, Login erst bei Like/Create/Ranglist. Deutsch als Default, wenn das Gerät DE ist. Kein Google-Button, der nicht geht.

### Home („Heute“ statt TikTok-Feed)

Der vertikale Feed darf existieren — aber nicht als Start. Start = **das eine Moment** + Countdown + „Spielen“. Darunter optional „weitere Momente von heute“ als kleine Reihe, nicht als Sucht-Schacht.

### Create

Heute: Prompt + Starters + 5 Tabs. Das ist Aippy-Werkstatt.  
Besser: Emotion → Dauer → Generate → einmal spielen → „Veröffentlichen“ oder „Wegwerfen“. Remix ist „nächste Szene der Kette“, nicht Tab 5.

### Explore

Heute: Gradient-Kacheln ohne Gameplay-Thumbnail. Sieht nach leerem Marketplace aus.  
Besser: echte letzte Frames als Cover. Filter nach Gefühl, nicht nach Genre. „Ketten“ als eigene Reihe.

### Profil

Heute: Created/Liked/Saved/History + Level/Coins (kaum benutzt).  
Besser: **Meine Momente**, **Ketten, die ich weitergeführt habe**, **beste 20-Sekunden-Score diese Woche**. Coins nur, wenn sie etwas kaufen (einen extra täglichen Slot, ein Paletten-Pack) — sonst weglassen.

### Alerts

Dünn lassen, bis echte User da sind. Keine leere Glocke als Haupt-Tab.

---

## 9. Sprache und Marke

| Statt (Aippy / Generic) | Kairos |
|---|---|
| Build what you feel | Spiel den Moment |
| Create a game | Einen Moment machen |
| Feed / For You | Heute |
| Remix | Nächste Szene |
| Endless | 10–60 Sekunden, dann Schluss |
| AI game maker | Kurze Spiele, die man teilt |
| Playverse / Studio | Golden Hour / Kino |

Claim-Kandidaten:

- *Nicht scrollen. Einen Moment spielen.*
- *10 bis 60 Sekunden. Dann ist es vorbei.*
- *Heute um 19 Uhr sind alle in derselben Runde.*

---

## 10. Reihenfolge, die wirklich hilft

Nicht die ganze App neu schreiben. Den bestehenden Kern umbiegen.

1. **Eine Geste wählen** — Empfehlung: *Täglicher Kairos* (Idee A) + *Home = Heute* (nicht Feed).
2. **Design-Haut** — Golden Hour, Serife, Shutter, drei Nav-Punkte. Alte Cobalt-Studio-Optik ersetzen.
3. **Create auf eine Frage reduzieren** — Gefühl + Dauer. Tabs verstecken.
4. **Website mit einem laufenden Moment** — eine Seite, Deutsch, echter CTA.
5. **Zu zweit auf einem Gerät** — macht die App in der Bahn/Schule einzigartig, ohne Server-Zirkus.
6. **Kette / Staffel** — erst wenn Create und Heute sitzen.
7. Native Apps, Wetter, Live-19:00 — später.

Der alte Stand bleibt wertvoll: Auth, Likes, Canvas-Engine, Prompt-Pipeline. Du musst nicht bei null anfangen. Du musst **aufhören, Aippy als Qualitätsziel zu benutzen**.

---

## 11. Fazit

Kairos hat schon:

- einen starken Namen
- eine funktionierende Mini-Game-App
- ein Design, das rechtlich nicht Aippy ist

Kairos fehlt:

- eine eigene Geste (nicht Feed+Prompt)
- eine Website, die die Idee erzählt
- ein Look, der nach Zeit und Kino schmeckt, nicht nach Tool
- Ehrlichkeit, was die Engine kann (kurze 2D-Momente, nicht Roblox)

**Einzigartig und trotzdem funktional** heißt: Wordle-Logik + Sofa-zu-zweit + 20-Sekunden-Kino. Nicht „Aippy, aber blau“.
