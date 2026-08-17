"use client";

import { useEffect, useState } from "react";
import { Compass, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { fetchTrendingGames } from "@/lib/supabase/queries";
import type { Game } from "@/lib/types";
import { formatCount } from "@/lib/demo-data";
import { BrandWordmark } from "./Brand";

export function ExploreScreen({ onOpenGame }: { onOpenGame: (gameId: string) => void }) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchTrendingGames(24).then((rows) => {
      if (cancelled) return;
      setGames(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-canvas px-4 pb-28 pt-12 scrollbar-hide">
      <div className="mb-1 flex items-center gap-2">
        <Compass className="h-5 w-5 text-accent" />
        <BrandWordmark className="text-sm text-muted" />
      </div>
      <h1 className="font-display text-3xl font-extrabold text-ink">Discover</h1>
      <p className="mt-1 text-sm text-muted">Trending short games from the community</p>

      {loading ? (
        <p className="mt-16 text-center text-sm text-muted">Loading…</p>
      ) : games.length === 0 ? (
        <div className="mt-16 text-center">
          <Flame className="mx-auto h-8 w-8 text-hot" />
          <p className="mt-3 text-sm text-muted">No published games yet. Be the first to create one.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {games.map((game, i) => (
            <motion.button
              type="button"
              key={game.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onOpenGame(game.id)}
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white text-left"
            >
              <div
                className="aspect-[4/5] w-full"
                style={{
                  background: `linear-gradient(155deg, #2457ff, #ff6a3d)`,
                }}
              />
              <div className="p-3">
                <h3 className="truncate text-sm font-semibold text-ink">{game.title}</h3>
                <p className="mt-1 truncate text-[11px] text-muted">
                  {game.creator?.display_name || game.creator?.username || "Creator"} ·{" "}
                  {formatCount(game.like_count)} likes
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
