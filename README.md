# Kairos

Nicht scrollen. Einen Moment spielen.

Jeden Tag ein gemeinsames Mini-Spiel (10–60 Sekunden). Sieben Momente am Tag, dann Feierabend. Kein TikTok-Feed als Start.

## Oberflächen

- **Website** `/` — Golden-Hour-Landing mit dem heutigen Moment
- **App** `/play`
  - **Heute** — täglicher Kairos, Zu-zweit-Modus, 7-Momente-Limit
  - **Machen** — Gefühl + Dauer, dann erzeugen und veröffentlichen
  - **Ich** — eigene Momente, Likes, Einstellungen

## Setup

1. Copy env:

```bash
cp .env.example .env.local
```

2. Set your Supabase URL + **anon** key in `.env.local`.  
   Keep the **service_role** key server-only (never ship it to the browser).

3. Apply the database schema in the Supabase SQL Editor:

   Run the contents of `supabase/migrations/001_initial_schema.sql`.

4. Auth URLs (Authentication → URL Configuration):
   - **Site URL**: your app origin (e.g. `http://localhost:3000` or the Cursor preview URL)
   - **Redirect URLs** (add all you use):
     - `http://localhost:3000/auth/callback`
     - `http://127.0.0.1:3000/auth/callback`
     - your exact preview URL + `/auth/callback`

5. For easier local testing: Authentication → Providers → Email → turn **Confirm email** OFF (optional).

6. Optional AI: set `GROQ_API_KEY` (or `OPENAI_API_KEY`) for Create → full unique game generation.

7. Install & run:

```bash
npm install
npm run dev
```

Open:

- Chrome / Edge: [http://localhost:3000](http://localhost:3000) (Website), [http://localhost:3000/play](http://localhost:3000/play) (App)
- **Firefox:** [http://127.0.0.1:3000](http://127.0.0.1:3000)

Hintergrund und Ideen: [`research/KAIROS_ANALYSE_UND_IDEEN.md`](research/KAIROS_ANALYSE_UND_IDEEN.md)

## Stack

Next.js · Tailwind · Framer Motion · Supabase Auth + Postgres
