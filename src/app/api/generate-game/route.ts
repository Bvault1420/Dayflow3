import { NextResponse } from "next/server";
import { generateGameFromPrompt } from "@/lib/generate-game";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim() || "";
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

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
                'You design short mobile games (10-60 seconds). Return JSON with keys: title (string), description (string max 180 chars), theme (one of neon|purple-pipes|city|candy|monster), duration_seconds (10-60 int).',
            },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content;
        const parsed = JSON.parse(raw);
        return NextResponse.json({
          title: String(parsed.title || "Untitled").slice(0, 48),
          description: String(parsed.description || prompt).slice(0, 180),
          theme: ["neon", "purple-pipes", "city", "candy", "monster"].includes(parsed.theme)
            ? parsed.theme
            : "neon",
          duration_seconds: Math.min(60, Math.max(10, Number(parsed.duration_seconds) || 30)),
          source: "openai",
        });
      }
    } catch {
      // fall through to local generator
    }
  }

  return NextResponse.json({ ...generateGameFromPrompt(prompt), source: "local" });
}
