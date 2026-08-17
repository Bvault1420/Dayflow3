#!/usr/bin/env node
/**
 * Backfill play_url JSON configs so every published game is playable.
 */
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

const THEME_PALETTES = {
  neon: {
    player: "#7CFFB2",
    obstacle: "#2457ff",
    accent: "#ffffff",
    bgTop: "#0a1224",
    bgBottom: "#1a2a55",
  },
  "purple-pipes": {
    player: "#ffd166",
    obstacle: "#b388ff",
    accent: "#f8f7ff",
    bgTop: "#16082b",
    bgBottom: "#3b1d6e",
  },
  city: {
    player: "#4aa3ff",
    obstacle: "#ff6a3d",
    accent: "#e8eef8",
    bgTop: "#0d1b2a",
    bgBottom: "#1b3a4b",
  },
  candy: {
    player: "#ff7ab6",
    obstacle: "#7cf5ff",
    accent: "#fff0f7",
    bgTop: "#3a0a28",
    bgBottom: "#7a1048",
  },
  monster: {
    player: "#b6ff4a",
    obstacle: "#ff5c7a",
    accent: "#f4ffe8",
    bgTop: "#102008",
    bgBottom: "#2f4a12",
  },
};

function pickTheme(lower, fallback) {
  if (/candy|sugar|sweet|pink|lolli/.test(lower)) return "candy";
  if (/city|gta|street|car|crime|urban/.test(lower)) return "city";
  if (/flappy|pipe|bird|fly|neon|space/.test(lower)) return "purple-pipes";
  if (/monster|pet|creature|boss|battle|zombie/.test(lower)) return "monster";
  if (THEME_PALETTES[fallback]) return fallback;
  return "neon";
}

function pickGenre(lower) {
  if (/flappy|bird|pipe|fly|flight|wing/.test(lower)) return "flappy";
  if (/catch|collect|fruit|coin|grab|candy|sugar|sweet/.test(lower)) return "catch";
  if (/tap|whack|smash|click|target|pop/.test(lower)) return "tap";
  if (/dodge|avoid|fall|rain|meteor|asteroid|tunnel/.test(lower)) return "dodge";
  if (/monster|battle|boss/.test(lower)) return "tap";
  if (/run|runner|sprint|dash|jump|parkour|hurdle|city|car|gta|crime/.test(lower))
    return "runner";
  return "flappy";
}

function instructionFor(genre) {
  switch (genre) {
    case "flappy":
      return "Tap to flap — dodge the pipes";
    case "runner":
      return "Tap to jump — clear the obstacles";
    case "dodge":
      return "Tap left / right to dodge";
    case "catch":
      return "Move & catch the good stuff";
    case "tap":
      return "Tap the targets before they vanish";
    default:
      return "Tap to play";
  }
}

function buildPlayConfig(game) {
  const idea = `${game.prompt || ""} ${game.title || ""}`.trim();
  const lower = idea.toLowerCase();
  const theme = pickTheme(lower, game.theme || "neon");
  const genre = pickGenre(lower);
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.neon;
  return {
    v: 1,
    genre,
    theme,
    title: (game.title || "Untitled").slice(0, 48),
    duration_seconds: game.duration_seconds || 30,
    speed: 1,
    jump: 1,
    gravity: genre === "flappy" ? 0.45 : 0.7,
    player_color: palette.player,
    obstacle_color: palette.obstacle,
    accent_color: palette.accent,
    bg_top: palette.bgTop,
    bg_bottom: palette.bgBottom,
    instruction: instructionFor(genre),
  };
}

function alreadyConfig(raw) {
  if (!raw) return false;
  try {
    const p = JSON.parse(raw);
    return p && p.v === 1 && p.genre;
  } catch {
    return false;
  }
}

async function main() {
  const { data: games, error } = await admin.from("games").select("*");
  if (error) throw error;
  let updated = 0;
  for (const g of games || []) {
    if (alreadyConfig(g.play_url)) {
      console.log("skip", g.title);
      continue;
    }
    const play = buildPlayConfig(g);
    const { error: upErr } = await admin
      .from("games")
      .update({ play_url: JSON.stringify(play), theme: play.theme })
      .eq("id", g.id);
    if (upErr) console.log("fail", g.title, upErr.message);
    else {
      updated += 1;
      console.log("updated", g.title, "→", play.genre);
    }
  }
  console.log("done, updated", updated);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
