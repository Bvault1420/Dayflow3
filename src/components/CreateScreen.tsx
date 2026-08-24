"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";
import { BrandWordmark } from "./Brand";
import {
  encodePlayConfig,
  generateGameFromPrompt,
  type PlayConfig,
} from "@/lib/generate-game";
import { PlayableGame } from "./PlayableGame";
import { EMOTIONS, emotionById, type EmotionId } from "@/lib/emotions";
import { copyrightRiskHint } from "@/lib/assets";

export function CreateScreen({
  onClose,
  onPublished,
  initialPrompt = "",
}: {
  onClose: () => void;
  onPublished: () => void;
  initialPrompt?: string;
}) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [emotion, setEmotion] = useState<EmotionId>("euphorisch");
  const [duration, setDuration] = useState(22);
  const [note, setNote] = useState(initialPrompt);
  const [play, setPlay] = useState<PlayConfig | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [fine, setFine] = useState(false);

  const idea = useMemo(() => {
    const mood = emotionById(emotion);
    const extra = note.trim();
    return extra ? `${mood.prompt}. ${extra}` : mood.prompt;
  }, [emotion, note]);

  async function generate() {
    setBusy(true);
    setError(null);
    setStatus("Der Moment entsteht…");
    try {
      const res = await fetch("/api/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: idea, duration_seconds: duration }),
      });
      const draft = res.ok ? await res.json() : generateGameFromPrompt(idea);
      if (draft.play) {
        draft.play.duration_seconds = duration;
        setPlay(draft.play);
      } else {
        const local = generateGameFromPrompt(idea);
        local.play.duration_seconds = duration;
        setPlay(local.play);
      }
      setTitle(draft.title || generateGameFromPrompt(idea).title);
      setStatus("Spielbereit. Einmal spielen, dann veröffentlichen.");
    } catch {
      const draft = generateGameFromPrompt(idea);
      draft.play.duration_seconds = duration;
      setPlay(draft.play);
      setTitle(draft.title);
      setStatus("Spielbereit.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!user) {
      setError("Zum Veröffentlichen bitte einloggen.");
      return;
    }
    if (!play) {
      setError("Erst einen Moment erzeugen.");
      return;
    }
    const risk = copyrightRiskHint(idea, title);
    if (risk && /mario|disney|pokemon|nintendo/i.test(idea)) {
      setError(risk);
      return;
    }
    setBusy(true);
    setError(null);
    const finalPlay = { ...play, title: title.trim() || play.title, duration_seconds: duration };
    const { error: insertError } = await supabase.from("games").insert({
      creator_id: user.id,
      title: finalPlay.title,
      description: note.trim() || emotionById(emotion).label,
      prompt: idea,
      duration_seconds: duration,
      status: "published",
      theme: finalPlay.theme,
      thumbnail_url: null,
      play_url: encodePlayConfig(finalPlay),
    });
    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onPublished();
  }

  return (
    <div className="relative flex h-full flex-col bg-canvas">
      <div className="flex items-center justify-between px-4 pb-2 pt-12">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-surface text-ink"
        >
          <X className="h-5 w-5" />
        </button>
        <BrandWordmark className="text-xl text-ink" />
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-[1.9rem] font-semibold leading-[1.08] text-ink"
        >
          Wie soll sich das anfühlen?
        </motion.h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {EMOTIONS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEmotion(e.id)}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold ${
                emotion === e.id
                  ? "bg-accent text-[#140e0a]"
                  : "border border-[var(--line)] bg-surface text-ink"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        <label className="mt-6 block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Dauer · {duration}s
          </span>
          <input
            type="range"
            min={10}
            max={60}
            step={2}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--accent)]"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Optional: ein Satz
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="z. B. Herzen fangen im Regen…"
            className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-surface px-4 py-3 text-sm text-ink outline-none ring-accent focus:ring-2"
          />
        </label>

        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-sm font-bold text-[#140e0a] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Moment erzeugen
        </button>

        {status && <p className="mt-3 text-sm text-accent">{status}</p>}
        {error && <p className="mt-3 rounded-xl bg-hot/20 px-3 py-2 text-sm text-hot">{error}</p>}

        {play && (
          <>
            <div className="film-frame relative mt-5 aspect-[3/4] overflow-hidden rounded-[1.3rem]">
              <PlayableGame config={{ ...play, duration_seconds: duration }} playing />
            </div>
            {fine && (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-3 w-full rounded-xl border border-[var(--line)] bg-surface px-4 py-3 text-sm text-ink outline-none"
                placeholder="Titel"
              />
            )}
            <button
              type="button"
              onClick={() => setFine((v) => !v)}
              className="mt-2 text-xs font-semibold text-muted"
            >
              {fine ? "Feinmachen zu" : "Titel ändern"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void publish()}
              className="mt-4 w-full rounded-2xl border border-accent bg-accent-soft py-3.5 text-sm font-bold text-accent disabled:opacity-60"
            >
              Veröffentlichen
            </button>
          </>
        )}
      </div>
    </div>
  );
}
