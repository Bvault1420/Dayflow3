#!/usr/bin/env node
const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OFFICIAL_EMAIL = "official@kairos.local";
const OFFICIAL_PASSWORD = "KairosOfficial!ChangeMe1";

const SEED_GAMES = [
  {
    title: "Neon Pipe Dash",
    description: "Dodge glowing pipes in a 40s freefall.",
    prompt: "First person neon pipe dash",
    duration_seconds: 40,
    theme: "purple-pipes",
    view_count: 1200,
    like_count: 84,
  },
  {
    title: "City Sprint Micro",
    description: "A tiny open block city for sixty seconds.",
    prompt: "Low poly city sprint",
    duration_seconds: 60,
    theme: "city",
    view_count: 860,
    like_count: 51,
  },
  {
    title: "Candy Tunnel Rush",
    description: "Race through sugar tunnels before they melt.",
    prompt: "Pink candy endless runner",
    duration_seconds: 30,
    theme: "candy",
    view_count: 540,
    like_count: 33,
  },
];

async function main() {
  let userId;
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
  const existing = listed.users.find((u) => u.email === OFFICIAL_EMAIL);
  if (existing) {
    userId = existing.id;
    console.log("Official user exists", userId);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: OFFICIAL_EMAIL,
      password: OFFICIAL_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: "Kairos Official" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log("Created official user", userId);
  }

  await admin.from("profiles").upsert({
    id: userId,
    username: "kairos_official",
    display_name: "Kairos Official",
    bio: "Launch moments from the Kairos team.",
    level: 10,
    coins: 5000,
  });

  const { data: existingGames } = await admin
    .from("games")
    .select("id,title")
    .eq("creator_id", userId);

  const titles = new Set((existingGames ?? []).map((g) => g.title));
  for (const g of SEED_GAMES) {
    if (titles.has(g.title)) {
      console.log("skip", g.title);
      continue;
    }
    const { error } = await admin.from("games").insert({
      creator_id: userId,
      ...g,
      status: "published",
    });
    console.log(error ? `fail ${g.title}: ${error.message}` : `seeded ${g.title}`);
  }

  const { data: feed, error: fe } = await admin
    .from("games")
    .select("*, creator:profiles!creator_id(*)")
    .eq("status", "published")
    .limit(5);
  console.log(fe ? `feed check fail: ${fe.message}` : `feed check ok rows=${feed.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
