# Kairos

Short playable moments — scroll bite-size games, remix with AI, publish in seconds.

## Features

- **Feed** — vertical snap scroll of 10–60s experiences with likes, comments, saves, views
- **Create** — prompt-first builder, remix grid, draft/publish
- **Profile** — created / liked / saved / history, followers, level & coins
- **Auth** — email + password and Google (via Supabase)

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

6. Google login (optional): Authentication → Providers → Google → Enable, paste Google Client ID + Secret.  
   In Google Cloud Console, set authorized redirect URI to:  
   `https://<project-ref>.supabase.co/auth/v1/callback`

7. Install & run:

```bash
npm install
npm run dev
```

Open:

- Chrome / Edge: [http://localhost:3000](http://localhost:3000)
- **Firefox:** [http://127.0.0.1:3000](http://127.0.0.1:3000) (or `http://localhost:3000` — the dev server also listens on IPv6 `::1`, which Firefox prefers)

Firefox “Verbindung fehlgeschlagen” usually means it tried IPv6 `localhost` (`::1`) and did not fall back. Use `127.0.0.1` or restart with `npm run dev`.

This Cloud Agent VM’s localhost is **not** the same as localhost on your PC. On your computer, clone the repo and run `npm run dev`, or open the Cursor **preview/demo** URL in Firefox (not `localhost`).

## Security note

If a `service_role` key was shared in chat, **rotate it** in the Supabase dashboard (Settings → API) and update `.env.local`. Never commit service keys.

## Stack

Next.js · Tailwind · Framer Motion · Supabase Auth + Postgres
