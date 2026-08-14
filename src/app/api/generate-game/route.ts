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

const GENRES: GameGenre[] = ["flappy", "runner", "dodge", "catch", "tap"];
const THEMES: GameThemeId[] = ["neon", "purple-pipes", "city", "candy", "monster"];
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard", "insane"];
const OBSTACLES: ObstacleStyle[] = ["pipes", "blocks", "orbs", "spikes"];
const FX: FxStyle[] = ["none", "trail", "glow", "shake"];

const SYSTEM = `You are the Kairos game designer. The user describes a short mobile game (10-60s). You return ONE complete playable config as JSON.

Engine genres ONLY: flappy | runner | dodge | catch | tap
- flappy = tap to flap through gaps (side view)
- runner = endless run; set lanes=3 for subway/temple-style lane switching + jump; lanes=1 for simple jump runner
- dodge = move left/right to avoid falling threats
- catch = catch good items, avoid bad
- tap = tap targets before they vanish

If the user says "like Subway Surfers / Temple Run / endless runner":
→ genre=runner, lanes=3, theme=city (or neon), obstacle_style=blocks, control=tap
Invent an ORIGINAL title (e.g. "City Lane Rush"). NEVER use trademark names (Subway Surfers, Temple Run, Mario, Flappy Bird, etc.) as the title.

Keys (JSON only):
- title (max 42 chars, original, not the raw prompt)
- description (max 180, explain the fantasy/controls)
- theme: neon|purple-pipes|city|candy|monster
- genre: flappy|runner|dodge|catch|tap
- lanes: 1 or 3
- difficulty: easy|normal|hard|insane
- obstacle_style: pipes|blocks|orbs|spikes
- fx: none|trail|glow|shake
- speed: 0.7-1.45
- jump: 0.8-1.3
- lives: 1-5
Do NOT set duration_seconds — the user chooses duration in the UI.
Match German and English. Build the WHOLE game from the idea.`;

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
  lives?: number;
};

const BANNED_TITLE =
  /\b(subway\s*surfers?|temple\s*run|flappy\s*bird|mario|sonic|pokemon|fortnite|minecraft|disney|nintendo)\b/i;

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
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Build the full game config for this idea:\n${opts.prompt}`,
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

function normalize(
  parsed: AiResult,
  prompt: string,
  userDuration: number | null
) {
  const local = generateGameFromPrompt(prompt);
  const theme = THEMES.includes(parsed.theme) ? parsed.theme : local.theme;
  const genre = GENRES.includes(parsed.genre) ? parsed.genre : local.play.genre;
  const duration_seconds = userDuration
    ? Math.min(60, Math.max(10, userDuration))
    : local.duration_seconds;
  const difficulty = DIFFICULTIES.includes(parsed.difficulty as Difficulty)
    ? (parsed.difficulty as Difficulty)
    : local.play.difficulty;
  const obstacle_style = OBSTACLES.includes(parsed.obstacle_style as ObstacleStyle)
    ? (parsed.obstacle_style as ObstacleStyle)
    : local.play.obstacle_style;
  const fx = FX.includes(parsed.fx as FxStyle) ? (parsed.fx as FxStyle) : local.play.fx;
  const lanes: 1 | 3 = parsed.lanes === 3 || local.play.lanes === 3 ? 3 : 1;

  let title = String(parsed.title || local.title).trim().slice(0, 48);
  if (!title || BANNED_TITLE.test(title) || title.toLowerCase() === prompt.toLowerCase().slice(0, title.length)) {
    title = local.title;
  }
  if (BANNED_TITLE.test(title)) title = lanes === 3 ? "City Lane Rush" : local.title;

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
  });
  play.speed = Math.min(1.45, Math.max(0.7, Number(parsed.speed) || play.speed));
  play.jump = Math.min(1.3, Math.max(0.8, Number(parsed.jump) || play.jump));
  play.lanes = lanes;
  play.instruction =
    genre === "runner" && lanes === 3
      ? "Tap left/right to change lanes · center to jump"
      : play.instruction;

  return {
    title: play.title,
    description: String(parsed.description || local.description)
      .replace(BANNED_TITLE, "arcade runner")
      .slice(0, 180),
    theme: play.theme,
    duration_seconds: play.duration_seconds,
    play,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    prompt?: string;
    duration_seconds?: number;
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
