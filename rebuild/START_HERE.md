# Hier entsteht die neue App

Dieser Ordner ist absichtlich fast leer. Die alte App liegt unangetastet in `../legacy/`.

## Schritt 1 — Next.js-Projekt anlegen (du tippst das)

Im Terminal, **in diesem Ordner** `rebuild/`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Wenn nach Optionen gefragt wird:

- TypeScript: ja
- Tailwind: ja
- `src/`: ja
- App Router: ja

Danach:

```bash
npm run dev
```

Browser: [http://localhost:3000](http://localhost:3000)

## Schritt 2 — mit Cursor weiterbauen

Öffne das Repo in **Cursor Desktop** (nicht nur Cloud-Agent).

Gute erste Nachricht an den Chat:

> Ich bin in rebuild/. Next.js läuft. Erklär mir als Nächstes nur das Layout (eine Seite, noch kein Login). Schreib den Code nicht für mich, sag mir was ich anlegen soll.

Danach folgt der Plan in `../BUILD_PLAN.md`.
