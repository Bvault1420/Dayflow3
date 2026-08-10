"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  Plus,
  Share2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_GAMES, THEME_STYLES, formatCount } from "@/lib/demo-data";
import type { Comment, Game } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

function GameCanvas({ game, playing }: { game: Game; playing: boolean }) {
  const theme = THEME_STYLES[game.theme] ?? THEME_STYLES.neon;
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!playing) return;
    setScore(0);
    const id = window.setInterval(() => {
      setScore((s) => s + 1);
    }, 900);
    return () => window.clearInterval(id);
  }, [playing, game.id]);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: theme.bg }}>
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-[12%] top-[22%] h-36 w-14 rotate-6 rounded-lg bg-sky-300/70" />
        <div className="absolute right-[16%] top-[30%] h-48 w-14 -rotate-3 rounded-lg bg-orange-300/65" />
        <div className="absolute left-[40%] top-[58%] h-40 w-12 rounded-lg bg-white/25" />
      </div>
      {game.theme === "city" && (
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent">
          <div className="absolute bottom-28 left-1/2 h-24 w-10 -translate-x-1/2 rounded-t-lg bg-[#1a1a22]" />
        </div>
      )}
      <div className="absolute left-1/2 top-[16%] -translate-x-1/2 font-display text-7xl font-extrabold text-white/95">
        {score}
      </div>
      <div className="absolute inset-x-0 top-[40%] text-center">
        <span className="rounded-md bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
          {theme.label}
        </span>
      </div>
      <div className="absolute bottom-40 left-5 h-16 w-16 rounded-2xl border border-white/25 bg-white/10" />
      <div className="absolute bottom-40 right-5 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-11 w-11 rounded-2xl border border-white/20 bg-white/10" />
        ))}
      </div>
    </div>
  );
}

function CommentsSheet({
  game,
  open,
  onClose,
  onCommented,
}: {
  game: Game;
  open: boolean;
  onClose: () => void;
  onCommented: () => void;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("comments")
        .select("*, profile:profiles(*)")
        .eq("game_id", game.id)
        .order("created_at", { ascending: false })
        .limit(40);
      if (!cancelled) setComments((data as Comment[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, game.id, supabase]);

  async function submit() {
    if (!user || !body.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ game_id: game.id, user_id: user.id, body: body.trim() })
      .select("*, profile:profiles(*)")
      .single();
    setLoading(false);
    if (!error && data) {
      setComments((c) => [data as Comment, ...c]);
      setBody("");
      onCommented();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close comments"
            className="absolute inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="absolute inset-x-0 bottom-0 z-50 max-h-[70%] overflow-hidden rounded-t-[1.5rem] border border-[var(--line)] bg-white"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <h3 className="font-display text-lg font-bold text-ink">Comments</h3>
              <button type="button" onClick={onClose} className="text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-64 space-y-3 overflow-y-auto px-4 py-3">
              {comments.length === 0 && (
                <p className="py-8 text-center text-sm text-muted">No comments yet</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-xs font-bold text-accent">
                    {(c.profile?.display_name ?? "U").slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      {c.profile?.display_name ?? c.profile?.username ?? "Player"}
                    </p>
                    <p className="text-sm text-muted">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-[var(--line)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-xl border border-[var(--line)] bg-canvas px-4 py-2.5 text-sm text-ink outline-none"
                maxLength={500}
              />
              <button
                type="button"
                disabled={loading || !body.trim()}
                onClick={submit}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FeedItem({
  game,
  active,
  onNeedAuth,
}: {
  game: Game;
  active: boolean;
  onNeedAuth: () => void;
}) {
  const { user } = useAuth();
  const supabase = createClient();
  const [liked, setLiked] = useState(!!game.liked_by_me);
  const [saved, setSaved] = useState(!!game.saved_by_me);
  const [likeCount, setLikeCount] = useState(game.like_count);
  const [saveCount, setSaveCount] = useState(game.save_count);
  const [commentCount, setCommentCount] = useState(game.comment_count);
  const [viewCount, setViewCount] = useState(game.view_count);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const viewed = useRef(false);

  useEffect(() => {
    if (!active || viewed.current) return;
    viewed.current = true;
    setViewCount((v) => v + 1);
    if (game.id.startsWith("demo-")) return;
    void supabase.rpc("record_view", {
      p_game_id: game.id,
      p_user_id: user?.id ?? null,
    });
  }, [active, game.id, supabase, user?.id]);

  async function toggleLike() {
    if (!user) return onNeedAuth();
    if (game.id.startsWith("demo-")) {
      setLiked((v) => !v);
      setLikeCount((c) => (liked ? c - 1 : c + 1));
      return;
    }
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("game_id", game.id);
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("likes").insert({ user_id: user.id, game_id: game.id });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  }

  async function toggleSave() {
    if (!user) return onNeedAuth();
    if (game.id.startsWith("demo-")) {
      setSaved((v) => !v);
      setSaveCount((c) => (saved ? c - 1 : c + 1));
      return;
    }
    if (saved) {
      await supabase.from("saves").delete().eq("user_id", user.id).eq("game_id", game.id);
      setSaved(false);
      setSaveCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("saves").insert({ user_id: user.id, game_id: game.id });
      setSaved(true);
      setSaveCount((c) => c + 1);
    }
  }

  const creatorName = game.creator?.display_name ?? game.creator?.username ?? "Creator";

  return (
    <section className="relative h-full w-full snap-start snap-always">
      <GameCanvas game={game} playing={active} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0e1621]/45 via-transparent to-[#0e1621]/80" />

      <div className="absolute left-4 right-4 top-12 z-10 flex items-end justify-between">
        <div>
          <p className="font-display text-2xl font-extrabold text-white">Kairos</p>
          <p className="text-xs font-medium text-white/70">Swipe the next moment</p>
        </div>
        <div className="rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          {game.duration_seconds}s
        </div>
      </div>

      <div className="absolute inset-x-3 bottom-24 z-10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700 text-sm font-bold text-white">
            {creatorName.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-bold leading-tight text-white">
              {game.title}
            </h2>
            <p className="text-sm text-white/70">{creatorName}</p>
          </div>
          <button
            type="button"
            className="pointer-events-auto inline-flex items-center gap-1 rounded-xl bg-hot px-3 py-2 text-xs font-bold text-hot-ink"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            Follow
          </button>
        </div>

        <div className="pointer-events-auto flex items-center justify-between rounded-2xl border border-white/15 bg-[#0e1621]/55 px-2 py-2 backdrop-blur-md">
          <ActionBtn
            icon={<Eye className="h-5 w-5" />}
            label={formatCount(viewCount)}
          />
          <ActionBtn
            icon={<Heart className={`h-5 w-5 ${liked ? "fill-hot text-hot" : ""}`} />}
            label={formatCount(likeCount)}
            onClick={toggleLike}
          />
          <ActionBtn
            icon={<Bookmark className={`h-5 w-5 ${saved ? "fill-white" : ""}`} />}
            label={formatCount(saveCount)}
            onClick={toggleSave}
          />
          <ActionBtn
            icon={<MessageCircle className="h-5 w-5" />}
            label={formatCount(commentCount)}
            onClick={() => {
              if (!user) return onNeedAuth();
              setCommentsOpen(true);
            }}
          />
          <ActionBtn icon={<Share2 className="h-5 w-5" />} label={formatCount(game.share_count)} />
        </div>
      </div>

      <CommentsSheet
        game={game}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCommented={() => setCommentCount((c) => c + 1)}
      />
    </section>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-white transition hover:bg-white/10"
    >
      {icon}
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </button>
  );
}

export function Feed({ onNeedAuth }: { onNeedAuth: () => void }) {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>(DEMO_GAMES);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("games")
        .select("*, creator:profiles(*)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(30);

      if (cancelled || error || !data?.length) return;

      let enriched = data as Game[];
      if (user) {
        const ids = enriched.map((g) => g.id);
        const [{ data: likes }, { data: saves }] = await Promise.all([
          supabase.from("likes").select("game_id").eq("user_id", user.id).in("game_id", ids),
          supabase.from("saves").select("game_id").eq("user_id", user.id).in("game_id", ids),
        ]);
        const liked = new Set((likes ?? []).map((l) => l.game_id));
        const saved = new Set((saves ?? []).map((s) => s.game_id));
        enriched = enriched.map((g) => ({
          ...g,
          liked_by_me: liked.has(g.id),
          saved_by_me: saved.has(g.id),
        }));
      }
      setGames(enriched);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIndex(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide"
    >
      {games.map((game, i) => (
        <FeedItem
          key={game.id}
          game={game}
          active={i === activeIndex}
          onNeedAuth={onNeedAuth}
        />
      ))}
    </div>
  );
}
