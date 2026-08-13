import { NextResponse } from "next/server";
import {
  buildPlayConfig,
  generateGameFromPrompt,
  type GameGenre,
  type GameThemeId,
} from "@/lib/generate-game";

const GENRES: GameGenre[] = ["flappy", "runner", "dodge", "catch", "tap"];
const THEMES: GameThemeId[] = ["neon", "purple-pipes", "city", "candy", "monster"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim() || "";
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const local = generateGameFromPrompt(prompt);
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                'You design short mobile arcade games (10-60s). Return JSON with keys: title, description (max 180), theme (neon|purple-pipes|city|candy|monster), duration_seconds (10-60), genre (flappy|runner|dodge|catch|tap), speed (0.7-1.4), jump (0.8-1.3). Pick genre that matches the prompt.',
            },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content;
        const parsed = JSON.parse(raw);
        const theme = THEMES.includes(parsed.theme) ? parsed.theme : local.theme;
        const genre = GENRES.includes(parsed.genre) ? parsed.genre : local.play.genre;
        const duration_seconds = Math.min(
          60,
          Math.max(10, Number(parsed.duration_seconds) || local.duration_seconds)
        );
        const play = buildPlayConfig({
          prompt,
          title: String(parsed.title || local.title).slice(0, 48),
          theme,
          duration_seconds,
          genre,
        });
        play.speed = Math.min(1.4, Math.max(0.7, Number(parsed.speed) || play.speed));
        play.jump = Math.min(1.3, Math.max(0.8, Number(parsed.jump) || play.jump));
        return NextResponse.json({
          title: play.title,
          description: String(parsed.description || prompt).slice(0, 180),
          theme: play.theme,
          duration_seconds: play.duration_seconds,
          play,
          source: "openai",
        });
      }
    } catch {
      // fall through
    }
  }

  return NextResponse.json({ ...local, source: "local" });
}
