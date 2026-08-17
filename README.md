# Kairos — neu bauen, Altes behalten

Die fertige App vom Cloud-Agenten bleibt. Du baust dieselbe Idee **noch einmal selbst**, mit Hilfe im Chat — nicht indem der Agent alles allein schreibt.

## Was wo liegt

| Ort | Bedeutung |
| --- | --- |
| `legacy/` | Alte Kairos-App, **eingefroren**. Nicht löschen. Darfst du lesen und weiter starten. |
| `rebuild/` | Hier entsteht die neue App. Am Anfang fast leer — **du** legst Next.js an. |
| `BUILD_PLAN.md` | Reihenfolge der Schritte (Feed → Spiel → Login → Create …). |
| Branch `cursor/aippy-tiktok-roblox-app-36fa` | Original auf GitHub, plus Draft-PR. Zusätzliche Sicherung. |

Die alte App ist damit zweimal gesichert: als Ordner hier und als Git-Branch. Nichts davon wird gelöscht.

## Alte App weiter benutzen

```bash
cd legacy
cp .env.example .env.local
# Supabase-Keys eintragen (wie bisher)
npm install
npm run dev
```

## Neue App selbst starten

1. Repo in **Cursor Desktop** öffnen (lokal auf deinem Rechner).
2. Datei `rebuild/START_HERE.md` folgen (`create-next-app` **selbst** tippen).
3. Im Chat so arbeiten:

**Gut**

- „Erklär mir Schritt 1 vom Plan. Sag mir welche Datei ich anlege, schreib den Code nicht.“
- „Ich habe `rebuild/src/app/page.tsx` so gemacht — ist das okay?“
- „Ich versteh `legacy/src/components/Feed.tsx` nicht, erklär Zeile für Zeile.“

**Schlecht fürs Lernen**

- „Bau die ganze App.“
- Nur Cloud-Agent: der schreibt wieder alles allein.

Wenn du willst, dass der Chat keinen Code schreibt: extra dazuschreiben **„nur erklären, keinen Code“**.

## Wie Cursor eingestellt ist

In `.cursor/rules/selbst-bauen.mdc` steht: Agenten sollen nicht die ganze App übernehmen, `legacy/` nicht anfassen, und immer nur den nächsten kleinen Schritt vorschlagen.
