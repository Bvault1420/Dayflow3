# Aippy

TikTok × Roblox hybrid: scroll short games (10–60s), remix with AI, publish, and build your profile — with Supabase auth.

## Features

- **Feed** — vertical snap scroll of short playable experiences with likes, comments, saves, views
- **Create** — prompt-first AI create flow, remix grid, draft/publish (10–60s)
- **Profile** — created / liked / saved / history tabs, followers, level & coins
- **Auth** — email + password via Supabase

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
     - `https://*.agent.cvm.dev/auth/callback` (if wildcards allowed; otherwise paste the exact preview URL + `/auth/callback`)

5. For easier local testing: Authentication → Providers → Email → turn **Confirm email** OFF (optional).

6. Google login (optional): Authentication → Providers → Google → Enable, paste Google Client ID + Secret.  
   In Google Cloud Console, set authorized redirect URI to:  
   `https://<project-ref>.supabase.co/auth/v1/callback`

7. Install & run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Security note

If a `service_role` key was shared in chat, **rotate it** in the Supabase dashboard (Settings → API) and update `.env.local`. Never commit service keys.

## Stack

Next.js · Tailwind · Framer Motion · Supabase Auth + Postgres
