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
    prompt: "First person neon flappy pipe dash",
    duration_seconds: 40,
    theme: "purple-pipes",
    view_count: 1200,
    like_count: 84,
  },
  {
    title: "City Sprint Micro",
    description: "A tiny open block city for sixty seconds.",
    prompt: "Low poly city runner sprint jump obstacles",
    duration_seconds: 60,
    theme: "city",
    view_count: 860,
    like_count: 51,
  },
  {
    title: "Candy Tunnel Rush",
    description: "Race through sugar tunnels before they melt.",
    prompt: "Pink candy catch collect sweets avoid bombs",
    duration_seconds: 30,
    theme: "candy",
    view_count: 540,
    like_count: 33,
  },
];

function buildPlay(g) {
  const lower = `${g.prompt} ${g.title}`.toLowerCase();
  let genre = "flappy";
  if (/run|sprint|jump/.test(lower)) genre = "runner";
  else if (/catch|candy|collect/.test(lower)) genre = "catch";
  else if (/dodge|tunnel/.test(lower)) genre = "dodge";
  else if (/tap|boss/.test(lower)) genre = "tap";
  const palettes = {
    neon: ["#7CFFB2", "#2457ff", "#ffffff", "#0a1224", "#1a2a55"],
    "purple-pipes": ["#ffd166", "#b388ff", "#f8f7ff", "#16082b", "#3b1d6e"],
    city: ["#4aa3ff", "#ff6a3d", "#e8eef8", "#0d1b2a", "#1b3a4b"],
    candy: ["#ff7ab6", "#7cf5ff", "#fff0f7", "#3a0a28", "#7a1048"],
    monster: ["#b6ff4a", "#ff5c7a", "#f4ffe8", "#102008", "#2f4a12"],
  };
  const p = palettes[g.theme] || palettes.neon;
  return JSON.stringify({
    v: 1,
    genre,
    theme: g.theme,
    title: g.title,
    duration_seconds: g.duration_seconds,
    speed: 1,
    jump: 1,
    gravity: genre === "flappy" ? 0.45 : 0.7,
    player_color: p[0],
    obstacle_color: p[1],
    accent_color: p[2],
    bg_top: p[3],
    bg_bottom: p[4],
    instruction:
      genre === "flappy"
        ? "Tap to flap — dodge the pipes"
        : genre === "runner"
          ? "Tap to jump — clear the obstacles"
          : genre === "catch"
            ? "Move & catch the good stuff"
            : "Tap to play",
  });
}

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
      play_url: buildPlay(g),
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
