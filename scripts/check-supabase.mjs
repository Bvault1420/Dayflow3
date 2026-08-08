#!/usr/bin/env node
/**
 * Attempts to verify Supabase connectivity and whether schema tables exist.
 * Schema DDL must be applied via the Supabase SQL Editor (see supabase/migrations).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

async function main() {
  const health = await fetch(`${url}/auth/v1/health`, { headers: { apikey: anon } });
  console.log("Auth health:", health.status, await health.text());

  const key = service || anon;
  for (const table of ["profiles", "games", "likes", "saves", "comments", "follows", "views"]) {
    const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    const body = await res.text();
    console.log(`${table}: ${res.status}`, body.slice(0, 120));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
