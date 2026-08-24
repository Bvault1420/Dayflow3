"use client";

import { PlayableGame } from "./PlayableGame";
import type { PlayConfig } from "@/lib/games/types";

export function DuoPlay({
  config,
  playing,
  onStart,
  onOver,
}: {
  config: PlayConfig;
  playing: boolean;
  onStart?: () => void;
  onOver?: (score: number) => void;
}) {
  const right: PlayConfig = {
    ...config,
    player_color: config.accent_color,
    title: config.title,
  };

  return (
    <div className="absolute inset-0 flex">
      <div className="relative h-full w-1/2 overflow-hidden border-r border-[var(--line)]">
        <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink">
          Links
        </span>
        <PlayableGame config={config} playing={playing} onStart={onStart} onOver={onOver} />
      </div>
      <div className="relative h-full w-1/2 overflow-hidden">
        <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink">
          Rechts
        </span>
        <PlayableGame config={right} playing={playing} />
      </div>
    </div>
  );
}
