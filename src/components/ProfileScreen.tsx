"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  Clock3,
  Copy,
  Eye,
  Gem,
  Grid2x2,
  Heart,
  LogOut,
  MessageCircle,
  Settings,
  Share2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";
import { formatCount } from "@/lib/demo-data";
import type { Game } from "@/lib/types";
import { BrandMark } from "./Brand";

type ProfileTab = "created" | "liked" | "saved" | "history";

export function ProfileScreen({ onOpenAuth }: { onOpenAuth: () => void }) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<ProfileTab>("created");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    void refreshProfile();
  }, [user, refreshProfile]);

  useEffect(() => {
    if (!user) {
      setGames([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (tab === "created") {
          const { data } = await supabase
            .from("games")
            .select("*")
            .eq("creator_id", user.id)
            .order("updated_at", { ascending: false });
          if (!cancelled) setGames((data as Game[]) ?? []);
        } else if (tab === "liked") {
          const { data } = await supabase
            .from("likes")
            .select("game:games(*, creator:profiles(*))")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          if (!cancelled) {
            const rows = (data ?? []) as unknown as { game: Game | null }[];
            setGames(rows.map((row) => row.game).filter((g): g is Game => Boolean(g)));
          }
        } else if (tab === "saved") {
          const { data } = await supabase
            .from("saves")
            .select("game:games(*, creator:profiles(*))")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          if (!cancelled) {
            const rows = (data ?? []) as unknown as { game: Game | null }[];
            setGames(rows.map((row) => row.game).filter((g): g is Game => Boolean(g)));
          }
        } else {
          const { data } = await supabase
            .from("views")
            .select("game:games(*, creator:profiles(*))")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(40);
          if (!cancelled) {
            const rows = (data ?? []) as unknown as { game: Game | null }[];
            const unique = new Map<string, Game>();
            for (const row of rows) {
              const g = row.game;
              if (g && !unique.has(g.id)) unique.set(g.id, g);
            }
            setGames([...unique.values()]);
          }
        }
      } catch {
        if (!cancelled) setGames([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, user, supabase]);

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-canvas px-6 text-center">
        <BrandMark className="mb-4 h-14 w-14" />
        <p className="font-display text-2xl font-bold text-ink">Your studio awaits</p>
        <p className="mt-2 text-sm text-muted">Sign in to see creations, likes, and saves.</p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="mt-6 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white"
        >
          Log in
        </button>
      </div>
    );
  }

  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "Player";
  const handle = profile?.username ?? `player_${user.id.slice(0, 6)}`;
  const drafts = games.filter((g) => g.status === "draft");
  const published = games.filter((g) => g.status === "published");

  return (
    <div className="h-full overflow-y-auto bg-canvas pb-28 scrollbar-hide">
      <div className="flex items-center justify-between px-4 pb-2 pt-12">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-1.5">
          <span className="rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">
            Lv. {profile?.level ?? 1}
          </span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-canvas">
            <div className="h-full w-2/5 rounded-full bg-accent" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm font-semibold text-hot">
            <Gem className="h-3.5 w-3.5" />
            {profile?.coins ?? 100}
          </div>
          <button type="button" className="rounded-xl border border-[var(--line)] bg-white p-2 text-muted" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-xl border border-[var(--line)] bg-white p-2 text-muted"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center px-4 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-accent to-[#6d8cff] text-3xl font-bold text-white">
          {name.slice(0, 1).toUpperCase()}
        </div>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">{name}</h1>
        <button
          type="button"
          className="mt-1 flex items-center gap-1.5 text-sm text-muted"
          onClick={() => navigator.clipboard?.writeText(`@${handle}`)}
        >
          @{handle}
          <Copy className="h-3.5 w-3.5" />
        </button>
        <p className="mt-3 text-sm text-muted">
          <span className="font-semibold text-ink">
            {formatCount(profile?.follower_count ?? 0)}
          </span>{" "}
          Followers
          <span className="mx-2 text-[var(--line)]">·</span>
          <span className="font-semibold text-ink">
            {formatCount(profile?.following_count ?? 0)}
          </span>{" "}
          Following
        </p>
        <p className="mt-2 text-sm text-muted">{profile?.bio || "No bio yet..."}</p>

        <div className="mt-4 flex w-full max-w-sm gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl border border-[var(--line)] bg-white py-2.5 text-sm font-semibold text-ink"
          >
            Edit Profile
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-white text-ink"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-around border-b border-[var(--line)] px-6">
        {(
          [
            ["created", Grid2x2],
            ["liked", Heart],
            ["saved", Bookmark],
            ["history", Clock3],
          ] as const
        ).map(([id, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative flex flex-1 items-center justify-center py-3 ${
              tab === id ? "text-accent" : "text-muted"
            }`}
          >
            <Icon className="h-5 w-5" />
            {tab === id && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 p-3">
        {tab === "created" && (
          <div className="flex aspect-[3/4] flex-col justify-between rounded-2xl bg-ink p-3 text-white">
            <span className="w-fit rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold">
              Draft: {drafts.length}
            </span>
            <div>
              <p className="font-display text-lg font-bold">Your Draft</p>
              <p className="text-xs text-white/65">Build the next moment.</p>
              <p className="mt-2 text-[10px] text-white/40">Edited just now</p>
            </div>
          </div>
        )}

        {loading && (
          <p className="col-span-2 py-10 text-center text-sm text-muted">Loading...</p>
        )}

        {!loading &&
          (tab === "created" ? published : games).map((game) => (
            <article
              key={game.id}
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white"
            >
              <div
                className="relative aspect-[3/4]"
                style={{
                  background:
                    game.theme === "monster"
                      ? "linear-gradient(160deg,#a78bfa,#1e1b4b)"
                      : game.theme === "candy"
                        ? "linear-gradient(160deg,#ff9ad5,#7a1048)"
                        : "linear-gradient(160deg,#2457ff,#0e1621)",
                }}
              >
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5">
                  <p className="truncate text-sm font-semibold text-white">{game.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-white/70">
                    <span className="inline-flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {formatCount(game.view_count)}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Heart className="h-3 w-3" />
                      {formatCount(game.like_count)}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <MessageCircle className="h-3 w-3" />
                      {formatCount(game.comment_count)}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}

        {!loading && (tab === "created" ? published : games).length === 0 && tab !== "created" && (
          <p className="col-span-2 py-12 text-center text-sm text-muted">Nothing here yet</p>
        )}
      </div>
    </div>
  );
}
