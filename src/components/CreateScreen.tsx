"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUp,
  Image as ImageIcon,
  Lightbulb,
  Mic,
  Music2,
  Sparkles,
  Smile,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";
import { DEMO_GAMES, formatCount } from "@/lib/demo-data";
import type { Game } from "@/lib/types";

const TOOLS = [
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "sounds", label: "Sounds", icon: Music2 },
  { id: "meme", label: "Meme", icon: Smile },
  { id: "make", label: "Create Image", icon: Sparkles },
];

const THEMES = ["neon", "purple-pipes", "city", "candy", "monster"] as const;

export function CreateScreen({ onClose, onPublished }: { onClose: () => void; onPublished: () => void }) {
  const { user, profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("neon");
  const [aiAssist, setAiAssist] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemixes, setShowRemixes] = useState(true);
  const [remixes, setRemixes] = useState<Game[]>(DEMO_GAMES.slice(0, 4));
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("games")
        .select("*, creator:profiles(*)")
        .eq("status", "published")
        .order("like_count", { ascending: false })
        .limit(8);
      if (!cancelled && data?.length) setRemixes(data as Game[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function publish(asDraft = false) {
    if (!user) {
      setError("Please sign in to publish");
      return;
    }
    const idea = prompt.trim();
    if (!idea) {
      setError("Describe your game idea first");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(aiAssist ? "AI is shaping your experience..." : "Building your game...");

    // Simulated AI generation delay for MVP feel
    await new Promise((r) => setTimeout(r, 900));

    const gameTitle =
      title.trim() ||
      idea
        .split(/[.!?]/)[0]
        .slice(0, 48)
        .trim() ||
      "Untitled Experience";

    const payload = {
      creator_id: user.id,
      title: gameTitle,
      description: idea.slice(0, 180),
      prompt: idea,
      duration_seconds: duration,
      status: asDraft ? "draft" : "published",
      theme,
      thumbnail_url: null,
    };

    const { error: insertError } = await supabase.from("games").insert(payload);
    setBusy(false);
    setStatus(null);

    if (insertError) {
      setError(
        insertError.message.includes("relation") || insertError.code === "42P01"
          ? "Database tables missing. Run supabase/migrations/001_initial_schema.sql in your Supabase SQL editor."
          : insertError.message
      );
      return;
    }

    setPrompt("");
    setTitle("");
    onPublished();
    if (!asDraft) onClose();
  }

  return (
    <div className="relative flex h-full flex-col bg-[#0b0b0d]">
      <div className="flex items-center justify-between px-4 pb-2 pt-12">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-bold text-white">Create</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-36">
        <p className="mb-4 font-display text-3xl font-bold leading-tight text-white">
          Turn Words into
          <br />
          Stuff in Seconds.
        </p>

        <div className="rounded-3xl border border-white/10 bg-[#17171a] p-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your idea and start building..."
            rows={5}
            className="w-full resize-none bg-transparent text-base text-white outline-none placeholder:text-white/35"
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setAiAssist((v) => !v)}
              className="flex items-center gap-2 text-white/60"
            >
              <Lightbulb className={`h-4 w-4 ${aiAssist ? "text-aippy-green" : ""}`} />
              <span
                className={`relative h-5 w-9 rounded-full transition ${
                  aiAssist ? "bg-aippy-green" : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-black transition ${
                    aiAssist ? "left-4" : "left-0.5"
                  }`}
                />
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-full p-2 text-white/50">
                <Mic className="h-5 w-5" />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => publish(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black disabled:opacity-50"
              >
                <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TOOLS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-[#17171a] px-4 py-3 text-white/80"
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="rounded-2xl border border-white/10 bg-[#17171a] p-3">
            <span className="text-[11px] text-white/40">Title (optional)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm text-white outline-none"
              placeholder="My wild game"
            />
          </label>
          <label className="rounded-2xl border border-white/10 bg-[#17171a] p-3">
            <span className="text-[11px] text-white/40">Duration {duration}s</span>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-3 w-full accent-aippy-green"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                theme === t ? "bg-aippy-green text-black" : "bg-white/10 text-white/70"
              }`}
            >
              {t.replace("-", " ")}
            </button>
          ))}
        </div>

        {(error || status) && (
          <p
            className={`mt-4 rounded-2xl px-3 py-2 text-sm ${
              error ? "bg-red-500/15 text-red-300" : "bg-aippy-green/10 text-aippy-green"
            }`}
          >
            {error ?? status}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => publish(true)}
            className="flex-1 rounded-2xl border border-white/15 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => publish(false)}
            className="flex-1 rounded-2xl bg-aippy-green py-3 text-sm font-bold text-black disabled:opacity-50"
          >
            Publish
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowRemixes((v) => !v)}
          className="mt-8 flex w-full items-center justify-between text-left"
        >
          <div>
            <p className="font-display text-2xl font-bold text-white">Remix It Yours</p>
            <p className="text-sm text-white/45">Start from a viral experience</p>
          </div>
          <span className="text-white/50">{showRemixes ? "▾" : "▸"}</span>
        </button>

        <AnimatePresence>
          {showRemixes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 grid grid-cols-2 gap-3 overflow-hidden"
            >
              {remixes.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setPrompt(`Remix of "${g.title}": ${g.prompt || g.description}`);
                    setTitle(`Remix: ${g.title}`);
                    setTheme((g.theme as (typeof THEMES)[number]) || "neon");
                  }}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#17171a] text-left"
                >
                  <div
                    className="aspect-square bg-cover"
                    style={{
                      background:
                        g.theme === "candy"
                          ? "linear-gradient(145deg,#ff9ad5,#7a1048)"
                          : g.theme === "city"
                            ? "linear-gradient(145deg,#4aa3ff,#0d1b2a)"
                            : "linear-gradient(145deg,#5b2d91,#050508)",
                    }}
                  />
                  <div className="p-2.5">
                    <p className="truncate text-sm font-semibold text-white">{g.title}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-white/45">
                      <span>@{g.creator?.username ?? profile?.username ?? "creator"}</span>
                      <span>♥ {formatCount(g.like_count)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
