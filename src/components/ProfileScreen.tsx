"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Heart,
  History,
  LayoutGrid,
  LogIn,
  Settings,
  Bookmark,
} from "lucide-react";
import { BrandMark, BrandWordmark } from "@/components/Brand";
import { useAuth } from "@/components/AuthProvider";
import {
  fetchCreatedGames,
  fetchLikedGames,
  fetchSavedGames,
  fetchViewHistory,
} from "@/lib/supabase/queries";
import type { Game } from "@/lib/types";
import { formatCount } from "@/lib/demo-data";

type Tab = "created" | "liked" | "saved" | "history";

export function ProfileScreen({
  onRequireAuth,
  onOpenSettings,
  onOpenGame,
}: {
  onRequireAuth: () => void;
  onOpenSettings: () => void;
  onOpenGame: (gameId: string) => void;
}) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("created");
  const [items, setItems] = useState<Game[]>([]);
  const [createdCount, setCreatedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setCreatedCount(0);
      return;
    }
    let cancelled = false;
    void fetchCreatedGames(user.id).then((rows) => {
      if (!cancelled) setCreatedCount(rows.length);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        if (tab === "created") return fetchCreatedGames(user.id);
        if (tab === "liked") return fetchLikedGames(user.id);
        if (tab === "saved") return fetchSavedGames(user.id);
        return fetchViewHistory(user.id);
      } catch {
        return [] as Game[];
      }
    };

    void load().then((rows) => {
      if (cancelled) return;
      setItems(rows);
      if (tab === "created") setCreatedCount(rows.length);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, tab]);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Creator";
  const handle = profile?.username ? `@${profile.username}` : user?.email || "";
  const bio = profile?.bio || "Build short games. Publish. Play.";

  const tabs = useMemo(
    () =>
      [
        { id: "created" as const, label: "Created", icon: LayoutGrid },
        { id: "liked" as const, label: "Liked", icon: Heart },
        { id: "saved" as const, label: "Saved", icon: Bookmark },
        { id: "history" as const, label: "History", icon: History },
      ] as const,
    []
  );

  if (!user) {
    return (
      <div className="mx-auto flex h-full w-full max-w-lg flex-col items-center justify-center px-6 text-center">
        <BrandMark className="h-16 w-16" />
        <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-ink">
          Your creator space
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Sign in to see created games, likes, saves, and play history.
        </p>
        <button
          type="button"
          onClick={onRequireAuth}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-white"
        >
          <LogIn className="h-4 w-4" />
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto h-full w-full max-w-lg overflow-y-auto px-4 pb-28 pt-6 scrollbar-hide">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-accent text-2xl font-black text-white shadow-[0_10px_30px_rgba(36,87,255,0.28)]">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div>
            <BrandWordmark className="text-xs text-muted" />
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">
              {displayName}
            </h2>
            <p className="text-sm text-muted">{handle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-full border border-[var(--line)] bg-white p-2.5 text-ink"
          aria-label="Open settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">{bio}</p>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          ["Followers", profile?.follower_count ?? 0],
          ["Following", profile?.following_count ?? 0],
          ["Games", createdCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-[var(--line)] bg-white px-2 py-3">
            <p className="font-display text-lg font-extrabold text-ink">{value}</p>
            <p className="text-[11px] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenSettings}
        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-ink">Edit profile & settings</p>
          <p className="text-xs text-muted">Name, bio, notifications, account</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted" />
      </button>

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition ${
              tab === id ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {loading ? (
          <p className="col-span-2 py-10 text-center text-sm text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="col-span-2 py-10 text-center text-sm text-muted">
            Nothing here yet. Create or play a game to fill this tab.
          </p>
        ) : (
          items.map((game, index) => (
            <motion.button
              type="button"
              key={`${tab}-${game.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => onOpenGame(game.id)}
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white text-left"
            >
              <div
                className="aspect-[4/5] w-full"
                style={{
                  background: `linear-gradient(160deg, var(--accent), var(--hot, #ff6a3d))`,
                }}
              />
              <div className="p-3">
                <h3 className="truncate text-sm font-semibold text-ink">{game.title}</h3>
                <p className="mt-1 text-[11px] text-muted">
                  {formatCount(game.view_count)} plays · {formatCount(game.like_count)} likes
                </p>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
