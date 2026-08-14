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

const SYSTEM = `You design short mobile arcade games (10-60 seconds) for Kairos.
The playable engine ONLY supports these genres: flappy, runner, dodge, catch, tap.
You MUST match the user's idea — do NOT default to flappy unless they clearly want flying/flapping through gaps.
Return JSON only with keys:
- title: catchy short game name (max 42 chars). NEVER paste the full user prompt as the title.
- description: 1-2 sentences max 180 chars explaining the fantasy/rules (not a copy of the prompt).
- theme: neon | purple-pipes | city | candy | monster
- duration_seconds: integer 10-60
- genre: flappy | runner | dodge | catch | tap
- difficulty: easy | normal | hard | insane
- obstacle_style: pipes | blocks | orbs | spikes
- fx: none | trail | glow | shake
- speed: number 0.7-1.45
- jump: number 0.8-1.3
- lives: integer 1-5
Understand German and English prompts.`;

type AiResult = {
  title: string;
  description: string;
  theme: GameThemeId;
  duration_seconds: number;
  genre: GameGenre;
  difficulty?: Difficulty;
  obstacle_style?: ObstacleStyle;
  fx?: FxStyle;
  speed?: number;
  jump?: number;
  lives?: number;
};

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
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: opts.prompt },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;
  return JSON.parse(raw) as AiResult;
}

function normalize(parsed: AiResult, prompt: string) {
  const local = generateGameFromPrompt(prompt);
  const theme = THEMES.includes(parsed.theme) ? parsed.theme : local.theme;
  const genre = GENRES.includes(parsed.genre) ? parsed.genre : local.play.genre;
  const duration_seconds = Math.min(
    60,
    Math.max(10, Number(parsed.duration_seconds) || local.duration_seconds)
  );
  const difficulty = DIFFICULTIES.includes(parsed.difficulty as Difficulty)
    ? (parsed.difficulty as Difficulty)
    : local.play.difficulty;
  const obstacle_style = OBSTACLES.includes(parsed.obstacle_style as ObstacleStyle)
    ? (parsed.obstacle_style as ObstacleStyle)
    : local.play.obstacle_style;
  const fx = FX.includes(parsed.fx as FxStyle) ? (parsed.fx as FxStyle) : local.play.fx;

  let title = String(parsed.title || local.title).trim().slice(0, 48);
  // Guard: if model pasted the prompt, re-craft
  if (!title || title.length > 42 || title.toLowerCase() === prompt.toLowerCase().slice(0, title.length)) {
    title = local.title;
  }

  const play = buildPlayConfig({
    prompt,
    title,
    theme,
    duration_seconds,
    genre,
    difficulty,
    obstacle_style,
    fx,
    lives: Math.min(5, Math.max(1, Number(parsed.lives) || local.play.lives || 2)),
  });
  play.speed = Math.min(1.45, Math.max(0.7, Number(parsed.speed) || play.speed));
  play.jump = Math.min(1.3, Math.max(0.8, Number(parsed.jump) || play.jump));

  return {
    title: play.title,
    description: String(parsed.description || local.description).slice(0, 180),
    theme: play.theme,
    duration_seconds: play.duration_seconds,
    play,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim() || "";
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

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
        return NextResponse.json({ ...normalize(parsed, prompt), source: "groq" });
      }
    } catch {
      /* fall through */
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
        return NextResponse.json({ ...normalize(parsed, prompt), source: "openai" });
      }
    } catch {
      /* fall through */
    }
  }

  return NextResponse.json({
    ...generateGameFromPrompt(prompt),
    source: "local",
    hint: "Add GROQ_API_KEY (free) or OPENAI_API_KEY for smarter titles & genre matching.",
  });
}
