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

3. Apply the database schema in the [Supabase SQL Editor](https://supabase.com/dashboard/project/rjoajrgsmfiedeokjhoy/sql):

   Run the contents of `supabase/migrations/001_initial_schema.sql`.

4. In Supabase Auth settings, add redirect URL:

   `http://localhost:3000/auth/callback`

5. Install & run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Security note

If a `service_role` key was shared in chat, **rotate it** in the Supabase dashboard (Settings → API) and update `.env.local`. Never commit service keys.

## Stack

Next.js · Tailwind · Framer Motion · Supabase Auth + Postgres
