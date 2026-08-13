"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";
import { formatCount } from "@/lib/demo-data";
import type { Game } from "@/lib/types";
import { BrandWordmark } from "./Brand";
import { GAME_WITH_CREATOR } from "@/lib/supabase/queries";
import { generateGameFromPrompt } from "@/lib/generate-game";

const THEMES = ["neon", "purple-pipes", "city", "candy", "monster"] as const;

export function CreateScreen({
  onClose,
  onPublished,
}: {
  onClose: () => void;
  onPublished: () => void;
}) {
  const { user, profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("neon");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemixes, setShowRemixes] = useState(true);
  const [remixes, setRemixes] = useState<Game[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("games")
        .select(GAME_WITH_CREATOR)
        .eq("status", "published")
        .order("like_count", { ascending: false })
        .limit(8);
      if (!cancelled) setRemixes((data as Game[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function shapeFromPrompt() {
    const idea = prompt.trim();
    if (!idea) {
      setError("Describe your game idea first");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Shaping your moment…");
    try {
      const res = await fetch("/api/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: idea }),
      });
      const draft = res.ok ? await res.json() : generateGameFromPrompt(idea);
      setTitle(draft.title);
      setTheme(draft.theme);
      setDuration(draft.duration_seconds);
      setStatus("Ready — adjust and publish.");
    } catch {
      const draft = generateGameFromPrompt(idea);
      setTitle(draft.title);
      setTheme(draft.theme);
      setDuration(draft.duration_seconds);
      setStatus("Ready — adjust and publish.");
    } finally {
      setBusy(false);
    }
  }

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
    setStatus(asDraft ? "Saving draft…" : "Publishing…");

    const shaped = title.trim()
      ? null
      : generateGameFromPrompt(idea);

    const payload = {
      creator_id: user.id,
      title: title.trim() || shaped!.title,
      description: (shaped?.description || idea).slice(0, 180),
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
      setError(insertError.message);
      return;
    }

    setPrompt("");
    setTitle("");
    onPublished();
    if (!asDraft) onClose();
  }

  return (
    <div className="relative flex h-full flex-col bg-canvas">
      <div className="flex items-center justify-between px-4 pb-2 pt-12">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-white text-ink"
        >
          <X className="h-5 w-5" />
        </button>
        <BrandWordmark className="text-xl text-ink" />
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 font-display text-[2rem] font-extrabold leading-[1.05] text-ink"
        >
          Describe a moment.
          <br />
          <span className="text-accent">Ship it in seconds.</span>
        </motion.p>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_12px_40px_rgba(14,22,33,0.06)]">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A 3D flappy bird with neon pipes…"
            rows={5}
            className="w-full resize-none bg-transparent text-base text-ink outline-none placeholder:text-muted/60"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={shapeFromPrompt}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent-soft px-3 py-2 text-xs font-bold text-accent disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Shape with AI
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => publish(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white disabled:opacity-50"
            >
              <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="rounded-2xl border border-[var(--line)] bg-white p-3">
            <span className="text-[11px] font-medium text-muted">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm text-ink outline-none"
              placeholder="Auto from prompt"
            />
          </label>
          <label className="rounded-2xl border border-[var(--line)] bg-white p-3">
            <span className="text-[11px] font-medium text-muted">Duration {duration}s</span>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-3 w-full accent-accent"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize ${
                theme === t
                  ? "bg-ink text-white"
                  : "border border-[var(--line)] bg-white text-muted"
              }`}
            >
              {t.replace("-", " ")}
            </button>
          ))}
        </div>

        {(error || status) && (
          <p
            className={`mt-4 rounded-2xl px-3 py-2 text-sm ${
              error ? "bg-red-50 text-red-600" : "bg-accent-soft text-accent"
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
            className="flex-1 rounded-xl border border-[var(--line)] bg-white py-3 text-sm font-semibold text-ink disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => publish(false)}
            className="flex-1 rounded-xl bg-hot py-3 text-sm font-bold text-hot-ink disabled:opacity-50"
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
            <p className="font-display text-2xl font-bold text-ink">Remix a spark</p>
            <p className="text-sm text-muted">Start from something already loved</p>
          </div>
          <span className="text-muted">{showRemixes ? "▾" : "▸"}</span>
        </button>

        <AnimatePresence>
          {showRemixes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 grid grid-cols-2 gap-3 overflow-hidden"
            >
              {remixes.length === 0 && (
                <p className="col-span-2 py-6 text-center text-sm text-muted">
                  No published games to remix yet.
                </p>
              )}
              {remixes.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setPrompt(`Remix of "${g.title}": ${g.prompt || g.description}`);
                    setTitle(`Remix: ${g.title}`);
                    setTheme((g.theme as (typeof THEMES)[number]) || "neon");
                  }}
                  className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white text-left"
                >
                  <div
                    className="aspect-square"
                    style={{
                      background:
                        g.theme === "candy"
                          ? "linear-gradient(145deg,#ff9ad5,#7a1048)"
                          : g.theme === "city"
                            ? "linear-gradient(145deg,#4aa3ff,#0d1b2a)"
                            : "linear-gradient(145deg,#2457ff,#0e1621)",
                    }}
                  />
                  <div className="p-2.5">
                    <p className="truncate text-sm font-semibold text-ink">{g.title}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
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
