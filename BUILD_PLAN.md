# Kairos neu bauen — Plan in kleinen Schritten

Ziel: dieselbe Idee wie die alte App (kurze spielbare Clips, Feed, Create, Profil), aber **du** schreibst den Code. Die fertige Referenz liegt in `legacy/`.

Nicht alles auf einmal. Nach jedem Schritt die App im Browser prüfen, dann weiter.

## 0. Projekt anlegen

Siehe `rebuild/START_HERE.md`.

Fertig wenn: `npm run dev` eine Next.js-Startseite zeigt.

## 1. Gerüst der App (ohne Login)

Was: eine Seite mit unterer Navigation: Feed · Entdecken · Erstellen · Profil.

Anschauen in der alten App: `legacy/src/components/App.tsx`, `BottomNav.tsx`.

Fertig wenn: du zwischen leeren Screens wechseln kannst.

## 2. Optik

Was: dunkles Studio-Look, eigene Farben, Schrift, Abstände. Noch keine echten Daten.

Anschauen: `legacy/src/app/globals.css`, `legacy/src/components/Brand.tsx`.

Fertig wenn: es nicht mehr nach Standard-Next.js aussieht.

## 3. Fake-Feed

Was: ein vertikaler Feed mit ein paar **festen** Demo-Karten (Titel, Farbe, „Play“-Button). Noch keine Datenbank.

Anschauen: `legacy/src/lib/demo-data.ts`, `legacy/src/components/Feed.tsx`.

Fertig wenn: du scrollen kannst und eine Karte „spielt“ (auch nur ein farbiges Rechteck).

## 4. Erstes Mini-Spiel

Was: ein Canvas-Spiel, das 10–30 Sekunden geht (z. B. tippen zum Springen). Erst **ein** Genre, hart kodiert.

Anschauen: `legacy/src/components/PlayableGame.tsx` (groß — nur die Idee klauen, nicht alles kopieren).

Fertig wenn: du ein Mini-Spiel spielen und neu starten kannst.

## 5. Supabase vorbereiten

Was: Projekt bei [supabase.com](https://supabase.com) anlegen, URL + anon key in `.env.local`, Schema aus `legacy/supabase/migrations/` **verstehen** und dann selbst (oder angepasst) ausführen.

Fertig wenn: in Supabase die Tabellen `profiles` und `games` existieren.

## 6. Login

Was: E-Mail + Passwort. Session merken. Geschützte Aktionen (Erstellen, Liken) nur eingeloggt.

Anschauen: `legacy/src/components/AuthProvider.tsx`, `AuthScreen.tsx`, `legacy/src/lib/supabase/`.

Fertig wenn: du dich registrieren, einloggen und ausloggen kannst.

## 7. Echte Games in der Datenbank

Was: ein Spiel speichern (erst manuell / hart kodiert), im Feed aus Supabase laden.

Fertig wenn: nach Reload sind die Spiele noch da.

## 8. Create — Prompt wird ein Spiel

Was: Textfeld „Beschreib dein Spiel“ → einfache Regeln (Genre, Farben, Tempo) → speichern.

Später optional: Groq/OpenAI wie in `legacy/src/app/api/generate-game/`.

Fertig wenn: ein Prompt ein spielbares Draft erzeugt, das du veröffentlichen kannst.

## 9. Soziales

Was: Likes, Kommentare, Speichern, Profil (meine Spiele).

Anschauen: `legacy/src/lib/supabase/queries.ts`, `ProfileScreen.tsx`.

## 10. Feinschliff

Was: Entdecken, Benachrichtigungen, Uploads, mehrere Spiel-Genres — nur wenn 1–9 sitzen.

---

Wenn du feststeckst: in Cursor den **einen** Schritt nennen, an dem du bist, plus was schon in welcher Datei steht. Nicht „bau die App“.
