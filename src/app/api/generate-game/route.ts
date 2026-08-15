import { NextResponse } from "next/server";
import {
  buildPlayConfig,
  generateGameFromPrompt,
  type Difficulty,
  type FxStyle,
  type GameGenre,
  type GameThemeId,
  type ObstacleStyle,
} from "@/lib/generate-game";
import type { FeelMods, GameGoal, PlayerShape, WorldStyle } from "@/lib/games/types";
import { pickFeel } from "@/lib/games/generate-config";

const GENRES: GameGenre[] = ["flappy", "runner", "dodge", "catch", "tap", "roam"];
const THEMES: GameThemeId[] = ["neon", "purple-pipes", "city", "candy", "monster"];
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard", "insane"];
const OBSTACLES: ObstacleStyle[] = ["pipes", "blocks", "orbs", "spikes"];
const FX: FxStyle[] = ["none", "trail", "glow", "shake"];
const WORLDS: WorldStyle[] = ["city", "space", "candy", "neon", "forest", "temple", "ocean"];
const SHAPES: PlayerShape[] = ["orb", "hero", "car"];
const GOALS: GameGoal[] = ["survive", "collect", "score"];

const SYSTEM = `You are Kairos, an Aippy-style game builder. The user types ONE idea. You invent and return ONE complete UNIQUE short mobile game as JSON. Do not ask follow-up questions. Do not leave fields generic.

Map the FANTASY of the prompt onto the closest playable engine, then customize EVERYTHING so this game could not be confused with another:

Engines — pick the one that MATCHES the fantasy. Do NOT default to the same engine every time:
- roam = walk around (3D city / crime / open world). Drag + jump, loot vs cars
- runner = you RUN forward. lanes=3 ONLY if the user asked for lanes / subway / Spuren. Otherwise lanes=1. NEVER set lanes=3 on flappy/dodge/catch/tap/roam.
- flappy = fly / flap / jetpack through gaps
- dodge = threats fall or rush at you — you only MOVE
- catch = CATCH good stuff, avoid bad
- tap = TAP targets (smash, whack, piano)

CRITICAL: games must PLAY differently. Attach 1–3 feel mods that fit THIS idea (not a random pile):
hold_flap (hold to fly/jetpack), double_jump, dash, homing (threats chase), magnet (loot pulls in),
moving_gaps, bounce, sides (threats from the sides), tiny, huge, shield, invert (tap flips gravity).
A jetpack prompt → flappy + hold_flap. Homing meteors → dodge + homing. Magnet coins → catch/roam + magnet.

Invent an ORIGINAL title that sounds like a real game, not a keyword mash.
NEVER use trademarks (Subway Surfers, Temple Run, GTA, Mario, Flappy Bird, Fortnite, Minecraft).
Avoid generic stacks like "Turbo Rush", "Viral Blitz", "Neon Dash" unless the fantasy is actually that. Prefer a specific scene name (Midnight Toll, Pearl Sink, Ember Alley).

JSON keys (all required except duration_seconds):
- title (max 42, punchy, original)
- description (max 180, what you DO in THIS game)
- theme: neon|purple-pipes|city|candy|monster
- genre: roam|flappy|runner|dodge|catch|tap
- world: city|space|candy|neon|forest|temple|ocean
- lanes: 1 or 3
- difficulty: easy|normal|hard|insane
- obstacle_style: pipes|blocks|orbs|spikes
- fx: none|trail|glow|shake
- speed: 0.75-1.45
- jump: 0.8-1.3
- gravity: 0.35-1.0
- lives: 1-5
- player_shape: orb|hero|car
- goal: survive|collect|score
- collectible: short noun (cash, stars, pearls…)
- threat: short noun (cars, meteors, bombs…)
- feel: object of booleans (only true keys needed) — 1 to 3 mods that change how it PLAYS
- instruction: one line, max 72 chars, exact controls including the feel mods
- player_color, obstacle_color, accent_color, bg_top, bg_bottom, ground_color, decor_color: a cohesive UNIQUE #RRGGBB art direction
  If the user names a color (red, gold, dunkel, sunset…), that color leads the player or mood.
  If they do NOT name a color, invent a strong cinematic palette for THIS fantasy (sunset amber, arctic ice, rain noir, toxic lime, deep sea, sakura, volcanic…).
  NEVER reuse the default Kairos greens/blues (#7CFFB2, #4aa3ff, #2457ff, #0a1224, #0d1b2a) unless the prompt asks for neon-green or city-blue.
  Player must pop against the background (high contrast). Obstacles complementary or darker.
- duration_seconds: 10-60 only if the prompt states a length; else omit

German and English. Build the WHOLE unique game from the idea. Two different prompts must never share the same title+colors+instruction.`;

type AiResult = {
  title: string;
  description: string;
  theme: GameThemeId;
  genre: GameGenre;
  lanes?: 1 | 3;
  difficulty?: Difficulty;
  obstacle_style?: ObstacleStyle;
  fx?: FxStyle;
  speed?: number;
  jump?: number;
  gravity?: number;
  lives?: number;
  world?: WorldStyle;
  collectible?: string;
  threat?: string;
  goal?: GameGoal;
  player_shape?: PlayerShape;
  instruction?: string;
  player_color?: string;
  obstacle_color?: string;
  accent_color?: string;
  bg_top?: string;
  bg_bottom?: string;
  ground_color?: string;
  decor_color?: string;
  duration_seconds?: number;
  feel?: FeelMods;
};

const BANNED_TITLE =
  /\b(subway\s*surfers?|temple\s*run|flappy\s*bird|gta|grand theft|mario|sonic|pokemon|fortnite|minecraft|disney|nintendo)\b/i;

const FEEL_FLAGS: (keyof FeelMods)[] = [
  "hold_flap",
  "double_jump",
  "dash",
  "homing",
  "magnet",
  "moving_gaps",
  "bounce",
  "sides",
  "tiny",
  "huge",
  "shield",
  "invert",
];

function sanitizeFeel(raw: FeelMods | undefined): FeelMods | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: FeelMods = {};
  let n = 0;
  for (const k of FEEL_FLAGS) {
    if (raw[k]) {
      out[k] = true;
      n += 1;
    }
  }
  return n ? out : undefined;
}

function hex(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const m = v.trim().match(/^#?[0-9a-fA-F]{6}$/);
  if (!m) return undefined;
  return v.startsWith("#") ? v : `#${v}`;
}

async function callChat(opts: {
  url: string;
  key: string;
  model: string;
  prompt: string;
}): Promise<AiResult | null> {
  const res = await fetch(opts.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0.85,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Build a complete UNIQUE playable game from this idea. Fill every JSON key. Idea:\n${opts.prompt}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    console.warn("AI generate failed", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;
  return JSON.parse(raw) as AiResult;
}

function normalize(parsed: AiResult, prompt: string, userDuration: number | null) {
  const local = generateGameFromPrompt(prompt);
  const theme = THEMES.includes(parsed.theme) ? parsed.theme : local.theme;
  const genre = GENRES.includes(parsed.genre) ? parsed.genre : local.play.genre;
  const aiDur =
    typeof parsed.duration_seconds === "number" && Number.isFinite(parsed.duration_seconds)
      ? Math.min(60, Math.max(10, Math.round(parsed.duration_seconds)))
      : null;
  const duration_seconds = userDuration ?? aiDur ?? local.duration_seconds;
  const difficulty = DIFFICULTIES.includes(parsed.difficulty as Difficulty)
    ? (parsed.difficulty as Difficulty)
    : local.play.difficulty;
  const obstacle_style = OBSTACLES.includes(parsed.obstacle_style as ObstacleStyle)
    ? (parsed.obstacle_style as ObstacleStyle)
    : local.play.obstacle_style;
  const fx = FX.includes(parsed.fx as FxStyle) ? (parsed.fx as FxStyle) : local.play.fx;
  const rawLanes = Number(parsed.lanes);
  const aiLanes: 1 | 3 | null = rawLanes === 3 ? 3 : rawLanes === 1 ? 1 : null;
  const lanes: 1 | 3 =
    genre !== "runner" ? 1 : aiLanes === 3 ? 3 : aiLanes === 1 ? 1 : local.play.lanes === 3 ? 3 : 1;
  const world = WORLDS.includes(parsed.world as WorldStyle)
    ? (parsed.world as WorldStyle)
    : local.play.world;
  const player_shape = SHAPES.includes(parsed.player_shape as PlayerShape)
    ? (parsed.player_shape as PlayerShape)
    : local.play.player_shape;
  const goal = GOALS.includes(parsed.goal as GameGoal)
    ? (parsed.goal as GameGoal)
    : local.play.goal;

  let title = String(parsed.title || local.title).trim().slice(0, 48);
  if (!title || BANNED_TITLE.test(title) || title.toLowerCase() === prompt.toLowerCase().slice(0, title.length)) {
    title = local.title;
  }
  if (BANNED_TITLE.test(title)) title = genre === "roam" ? "Night Block City" : local.title;

  const play = buildPlayConfig({
    prompt,
    title,
    theme,
    duration_seconds,
    genre,
    difficulty,
    obstacle_style,
    fx,
    lanes,
    lives: Math.min(5, Math.max(1, Number(parsed.lives) || local.play.lives || 2)),
    world,
    collectible: String(parsed.collectible || local.play.collectible || "loot").slice(0, 18),
    threat: String(parsed.threat || local.play.threat || "hazard").slice(0, 18),
    goal,
    player_shape,
    player_color: hex(parsed.player_color),
    obstacle_color: hex(parsed.obstacle_color),
    accent_color: hex(parsed.accent_color),
    bg_top: hex(parsed.bg_top),
    bg_bottom: hex(parsed.bg_bottom),
    ground_color: hex(parsed.ground_color),
    decor_color: hex(parsed.decor_color),
    instruction: parsed.instruction,
    speed: Number(parsed.speed) || undefined,
    jump: Number(parsed.jump) || undefined,
    gravity: Number(parsed.gravity) || undefined,
    feel: sanitizeFeel(parsed.feel) ?? pickFeel(prompt.toLowerCase(), genre, local.play.seed || 1),
  });

  if (genre === "runner" && lanes === 3 && !parsed.instruction) {
    play.instruction = "Tap left/right to change lanes · center to jump";
  }

  return {
    title: play.title,
    description: String(parsed.description || local.description)
      .replace(BANNED_TITLE, "arcade game")
      .slice(0, 180),
    theme: play.theme,
    duration_seconds: play.duration_seconds,
    play,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    prompt?: string;
    duration_seconds?: number | null;
  } | null;
  const prompt = body?.prompt?.trim() || "";
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }
  const userDuration =
    typeof body?.duration_seconds === "number" && Number.isFinite(body.duration_seconds)
      ? Math.min(60, Math.max(10, Math.round(body.duration_seconds)))
      : null;

  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (groqKey) {
    try {
      const parsed = await callChat({
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: groqKey,
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        prompt,
      });
      if (parsed) {
        return NextResponse.json({
          ...normalize(parsed, prompt, userDuration),
          source: "groq",
        });
      }
    } catch (e) {
      console.warn("groq error", e);
    }
  }

  if (openaiKey) {
    try {
      const parsed = await callChat({
        url: "https://api.openai.com/v1/chat/completions",
        key: openaiKey,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        prompt,
      });
      if (parsed) {
        return NextResponse.json({
          ...normalize(parsed, prompt, userDuration),
          source: "openai",
        });
      }
    } catch {
      /* fall through */
    }
  }

  const local = generateGameFromPrompt(prompt);
  if (userDuration) {
    local.duration_seconds = userDuration;
    local.play.duration_seconds = userDuration;
  }
  return NextResponse.json({
    ...local,
    source: "local",
    hint: "Add GROQ_API_KEY for smarter full-game generation.",
  });
}
