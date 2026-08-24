"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { formatCount } from "@/lib/demo-data";
import type { Comment, Game } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { COMMENT_WITH_PROFILE, GAME_WITH_CREATOR } from "@/lib/supabase/queries";
import { resolvePlayConfig } from "@/lib/generate-game";
import { useAuth } from "./AuthProvider";
import { PlayableGame } from "./PlayableGame";

function GameCanvas({ game, playing }: { game: Game; playing: boolean }) {
  const config = useMemo(
    () =>
      resolvePlayConfig({
        prompt: game.prompt,
        title: game.title,
        theme: game.theme,
        duration_seconds: game.duration_seconds,
        play_url: game.play_url,
      }),
    [game]
  );

  return <PlayableGame key={`${game.id}-${config.genre}`} config={config} playing={playing} />;
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
  const supabase = useMemo(() => createClient(), []);
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    (async () => {
      const { data, error: err } = await supabase
        .from("comments")
        .select(COMMENT_WITH_PROFILE)
        .eq("game_id", game.id)
        .order("created_at", { ascending: false })
        .limit(40);
      if (cancelled) return;
      if (err) setError(err.message);
      setComments((data as Comment[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, game.id, supabase]);

  async function submit() {
    if (!user || !body.trim()) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("comments")
      .insert({ game_id: game.id, user_id: user.id, body: body.trim() })
      .select(COMMENT_WITH_PROFILE)
      .single();
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data) {
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
            className="absolute inset-x-0 bottom-0 z-50 max-h-[70%] overflow-hidden rounded-t-[1.5rem] border border-[var(--line)] bg-surface"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <h3 className="font-display text-lg font-bold text-ink">Kommentare</h3>
              <button type="button" onClick={onClose} className="text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-64 space-y-3 overflow-y-auto px-4 py-3">
              {comments.length === 0 && !error && (
                <p className="py-8 text-center text-sm text-muted">Noch keine Kommentare</p>
              )}
              {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
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
                placeholder="Kommentar…"
                className="flex-1 rounded-xl border border-[var(--line)] bg-canvas px-4 py-2.5 text-sm text-ink outline-none"
                maxLength={500}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submit();
                }}
              />
              <button
                type="button"
                disabled={loading || !body.trim()}
                onClick={submit}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Senden
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
  const supabase = useMemo(() => createClient(), []);
  const [liked, setLiked] = useState(!!game.liked_by_me);
  const [saved, setSaved] = useState(!!game.saved_by_me);
  const [likeCount, setLikeCount] = useState(game.like_count);
  const [saveCount, setSaveCount] = useState(game.save_count);
  const [commentCount, setCommentCount] = useState(game.comment_count);
  const [viewCount, setViewCount] = useState(game.view_count);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const viewed = useRef(false);
  const isOwn = !!user && game.creator_id === user.id;

  useEffect(() => {
    setLiked(!!game.liked_by_me);
    setSaved(!!game.saved_by_me);
    setLikeCount(game.like_count);
    setSaveCount(game.save_count);
    setCommentCount(game.comment_count);
    setViewCount(game.view_count);
  }, [game]);

  useEffect(() => {
    if (!active || viewed.current) return;
    viewed.current = true;
    setViewCount((v) => v + 1);
    void supabase.rpc("record_view", {
      p_game_id: game.id,
      p_user_id: user?.id ?? null,
    });
  }, [active, game.id, supabase, user?.id]);

  useEffect(() => {
    if (!user || !game.creator_id || isOwn) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", game.creator_id)
        .maybeSingle();
      if (!cancelled) setFollowing(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, game.creator_id, isOwn, supabase]);

  async function toggleLike() {
    if (!user) return onNeedAuth();
    if (busy) return;
    setBusy(true);
    setActionError(null);
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    if (next) {
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: user.id, game_id: game.id });
      if (error) {
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
        setActionError(error.message);
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("game_id", game.id);
      if (error) {
        setLiked(true);
        setLikeCount((c) => c + 1);
        setActionError(error.message);
      }
    }
    setBusy(false);
  }

  async function toggleSave() {
    if (!user) return onNeedAuth();
    if (busy) return;
    setBusy(true);
    setActionError(null);
    const next = !saved;
    setSaved(next);
    setSaveCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    if (next) {
      const { error } = await supabase
        .from("saves")
        .insert({ user_id: user.id, game_id: game.id });
      if (error) {
        setSaved(false);
        setSaveCount((c) => Math.max(0, c - 1));
        setActionError(error.message);
      }
    } else {
      const { error } = await supabase
        .from("saves")
        .delete()
        .eq("user_id", user.id)
        .eq("game_id", game.id);
      if (error) {
        setSaved(true);
        setSaveCount((c) => c + 1);
        setActionError(error.message);
      }
    }
    setBusy(false);
  }

  async function toggleFollow() {
    if (!user) return onNeedAuth();
    if (!game.creator_id || isOwn || busy) return;
    setBusy(true);
    setActionError(null);
    if (following) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", game.creator_id);
      if (error) setActionError(error.message);
      else setFollowing(false);
    } else {
      const { error } = await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: game.creator_id,
      });
      if (error) setActionError(error.message);
      else setFollowing(true);
    }
    setBusy(false);
  }

  async function shareGame() {
    const shareData = {
      title: game.title,
      text: `Spiel „${game.title}“ auf Kairos`,
      url: typeof window !== "undefined" ? window.location.href : "https://kairos.app",
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        setActionError(null);
      }
    } catch {
      /* user cancelled */
    }
  }

  const creatorName = game.creator?.display_name ?? game.creator?.username ?? "Creator";

  return (
    <section className="relative h-full w-full snap-start snap-always">
      <GameCanvas game={game} playing={active} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0e1621]/45 via-transparent to-[#0e1621]/80" />

      <div className="pointer-events-none absolute left-4 right-4 top-12 z-10 flex items-end justify-between">
        <div>
          <p className="font-display text-2xl font-extrabold text-ink">Kairos</p>
          <p className="text-xs font-medium text-white/70">Der nächste Moment</p>
        </div>
        <div className="rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          {game.duration_seconds}s
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-24 z-10 space-y-3">
        {actionError && (
          <p className="pointer-events-auto rounded-xl bg-red-500/90 px-3 py-2 text-xs font-medium text-white">
            {actionError}
          </p>
        )}
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
          {!isOwn && (
            <button
              type="button"
              onClick={toggleFollow}
              className={`pointer-events-auto inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold ${
                following ? "bg-white/20 text-white" : "bg-hot text-hot-ink"
              }`}
            >
              {!following && <Plus className="h-3.5 w-3.5" strokeWidth={3} />}
              {following ? "Folgst du" : "Folgen"}
            </button>
          )}
        </div>

        <div className="pointer-events-auto flex items-center justify-between rounded-2xl border border-white/15 bg-[#0e1621]/55 px-2 py-2 backdrop-blur-md">
          <ActionBtn icon={<Eye className="h-5 w-5" />} label={formatCount(viewCount)} />
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
          <ActionBtn
            icon={<Share2 className="h-5 w-5" />}
            label={formatCount(game.share_count)}
            onClick={shareGame}
          />
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

export function Feed({
  onNeedAuth,
  refreshKey = 0,
  focusGameId = null,
}: {
  onNeedAuth: () => void;
  refreshKey?: number;
  focusGameId?: string | null;
}) {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("games")
        .select(GAME_WITH_CREATOR)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(40);

      if (cancelled) return;

      if (error) {
        console.warn("Feed load:", error.message);
        setLoadError(error.message);
        setGames([]);
        setLoading(false);
        return;
      }

      let enriched = (data as Game[]) ?? [];
      if (user && enriched.length) {
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

      if (focusGameId) {
        const idx = enriched.findIndex((g) => g.id === focusGameId);
        if (idx > 0) {
          const [picked] = enriched.splice(idx, 1);
          enriched = [picked, ...enriched];
        }
      }

      setLoadError(null);
      setGames(enriched);
      setLoading(false);
      setActiveIndex(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey, focusGameId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || loading) return;
    el.scrollTop = 0;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / Math.max(el.clientHeight, 1));
      setActiveIndex(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [loading, games.length]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-canvas">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-accent/80" />
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-canvas px-8 text-center">
        <p className="font-display text-2xl font-bold text-ink">Noch keine Spiele</p>
        <p className="mt-2 max-w-xs text-sm text-muted">
          {loadError
            ? "Feed ließ sich nicht laden. Verbindung prüfen und nochmal versuchen."
            : "Mach den ersten Moment — dann liegt er hier."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-ink">
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
    </div>
  );
}
