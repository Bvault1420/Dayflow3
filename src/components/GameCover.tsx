"use client";

import { resolvePlayConfig } from "@/lib/generate-game";
import type { Game } from "@/lib/types";

export function GameCover({
  game,
  className = "aspect-[4/5]",
}: {
  game: Pick<Game, "prompt" | "title" | "theme" | "duration_seconds" | "play_url">;
  className?: string;
}) {
  const play = resolvePlayConfig(game);
  return (
    <div
      className={`w-full ${className}`}
      style={{
        background: `linear-gradient(165deg, ${play.bg_top}, ${play.bg_bottom} 55%, ${play.ground_color || play.player_color})`,
      }}
    />
  );
}
