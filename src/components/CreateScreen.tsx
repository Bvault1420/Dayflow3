"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUp, ImagePlus, Music2, Sparkles, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";
import { formatCount } from "@/lib/demo-data";
import type { Game } from "@/lib/types";
import { BrandWordmark } from "./Brand";
import { GAME_WITH_CREATOR } from "@/lib/supabase/queries";
import {
  buildPlayConfig,
  encodePlayConfig,
  generateGameFromPrompt,
  type GameGenre,
  type PlayConfig,
} from "@/lib/generate-game";
import { PlayableGame } from "./PlayableGame";
import {
  RIGHTS_COPY,
  copyrightRiskHint,
  validateAudioFile,
  validateImageFile,
} from "@/lib/assets";

const THEMES = ["neon", "purple-pipes", "city", "candy", "monster"] as const;
const GENRES: { id: GameGenre; label: string }[] = [
  { id: "flappy", label: "Flappy" },
  { id: "runner", label: "Runner" },
  { id: "dodge", label: "Dodge" },
  { id: "catch", label: "Catch" },
  { id: "tap", label: "Tap" },
];

export function CreateScreen({
  onClose,
  onPublished,
}: {
  onClose: () => void;
  onPublished: () => void;
}) {
  const { user, profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("neon");
  const [genre, setGenre] = useState<GameGenre>("flappy");
  const [play, setPlay] = useState<PlayConfig | null>(null);
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRemixes, setShowRemixes] = useState(true);
  const [remixes, setRemixes] = useState<Game[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!prompt.trim() && !play) return null;
    const base = buildPlayConfig({
      prompt: prompt.trim() || play?.title || "arcade moment",
      title: title || play?.title,
      theme,
      duration_seconds: duration,
      genre,
    });
    return {
      ...base,
      player_image: playerImage,
      bg_image: bgImage,
      music_url: musicUrl,
      rights_confirmed: rightsConfirmed,
    };
  }, [play, prompt, title, theme, duration, genre, playerImage, bgImage, musicUrl, rightsConfirmed]);

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

  function applyDraft(draft: {
    title: string;
    theme: (typeof THEMES)[number];
    duration_seconds: number;
    play?: PlayConfig;
  }) {
    setTitle(draft.title);
    setTheme(draft.theme);
    setDuration(draft.duration_seconds);
    const next =
      draft.play ??
      buildPlayConfig({
        prompt: prompt.trim() || draft.title,
        title: draft.title,
        theme: draft.theme,
        duration_seconds: draft.duration_seconds,
      });
    setGenre(next.genre);
    setPlay(next);
  }

  async function uploadAsset(kind: "image" | "audio", file: File, slot: "player" | "bg" | "music") {
    if (!user) {
      setError("Sign in to upload images or music");
      return;
    }
    if (!rightsConfirmed) {
      setError("Confirm the rights checkbox before uploading media.");
      return;
    }
    const validation =
      kind === "image" ? validateImageFile(file) : validateAudioFile(file);
    if (validation) {
      setError(validation);
      return;
    }
    const risk = copyrightRiskHint(file.name, prompt, title);
    if (risk) {
      setError(risk);
      return;
    }

    setUploading(slot);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("kind", kind);
      body.set("rightsConfirmed", "true");
      body.set("label", `${title} ${prompt} ${file.name}`);
      const res = await fetch("/api/upload-asset", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      if (slot === "player") setPlayerImage(data.url);
      if (slot === "bg") setBgImage(data.url);
      if (slot === "music") setMusicUrl(data.url);
      setStatus(
        slot === "music" ? "Music added to your game." : "Image added to your game."
      );
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(null);
    }
  }

  async function shapeFromPrompt() {
    const idea = prompt.trim();
    if (!idea) {
      setError("Describe your game idea first");
      return;
    }
    const risk = copyrightRiskHint(idea, title);
    if (risk) setError(risk);
    setBusy(true);
    if (!risk) setError(null);
    setStatus("Building a real playable game…");
    try {
      const res = await fetch("/api/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: idea }),
      });
      const draft = res.ok ? await res.json() : generateGameFromPrompt(idea);
      applyDraft(draft);
      setStatus(`Ready — ${draft.play?.genre || "arcade"} game. Add images/music if you want.`);
    } catch {
      applyDraft(generateGameFromPrompt(idea));
      setStatus("Ready — try the game below, then publish.");
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
    if ((playerImage || bgImage || musicUrl) && !rightsConfirmed) {
      setError("Confirm you have the rights to your images/music before publishing.");
      return;
    }
    const risk = copyrightRiskHint(idea, title, playerImage, musicUrl);
    if (risk && (playerImage || bgImage || musicUrl)) {
      setError(risk);
      return;
    }

    setBusy(true);
    setError(null);
    setStatus(asDraft ? "Saving draft…" : "Publishing playable game…");

    const shaped = generateGameFromPrompt(idea);
    const finalPlay =
      play ??
      buildPlayConfig({
        prompt: idea,
        title: title.trim() || shaped.title,
        theme,
        duration_seconds: duration,
        genre,
      });
    finalPlay.theme = theme;
    finalPlay.genre = genre;
    finalPlay.duration_seconds = duration;
    finalPlay.title = title.trim() || shaped.title;
    finalPlay.player_image = playerImage;
    finalPlay.bg_image = bgImage;
    finalPlay.music_url = musicUrl;
    finalPlay.rights_confirmed = rightsConfirmed && !!(playerImage || bgImage || musicUrl);

    const payload = {
      creator_id: user.id,
      title: finalPlay.title,
      description: (shaped.description || idea).slice(0, 180),
      prompt: idea,
      duration_seconds: duration,
      status: asDraft ? "draft" : "published",
      theme,
      thumbnail_url: playerImage || bgImage || null,
      play_url: encodePlayConfig(finalPlay),
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
    setPlay(null);
    setPlayerImage(null);
    setBgImage(null);
    setMusicUrl(null);
    setRightsConfirmed(false);
    onPublished();
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
          <span className="text-accent">Add your art & music.</span>
        </motion.p>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_12px_40px_rgba(14,22,33,0.06)]">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A flappy bird with neon pipes…"
            rows={4}
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
              Build game
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

        {/* Assets */}
        <section className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
          <h3 className="text-sm font-bold text-ink">Images & music</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">{RIGHTS_COPY.body}</p>

          <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl bg-canvas px-3 py-3">
            <input
              type="checkbox"
              checked={rightsConfirmed}
              onChange={(e) => setRightsConfirmed(e.target.checked)}
              className="mt-0.5 accent-[var(--accent)]"
            />
            <span className="text-xs font-medium leading-relaxed text-ink">
              {RIGHTS_COPY.checkbox}{" "}
              <a href="/terms" className="font-semibold text-accent underline-offset-2 hover:underline">
                Terms
              </a>
            </span>
          </label>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <AssetButton
              label="Player"
              icon={<ImagePlus className="h-4 w-4" />}
              preview={playerImage}
              busy={uploading === "player"}
              disabled={!rightsConfirmed || !!uploading}
              onPick={() => imageInputRef.current?.click()}
              onClear={() => setPlayerImage(null)}
            />
            <AssetButton
              label="Background"
              icon={<ImagePlus className="h-4 w-4" />}
              preview={bgImage}
              busy={uploading === "bg"}
              disabled={!rightsConfirmed || !!uploading}
              onPick={() => bgInputRef.current?.click()}
              onClear={() => setBgImage(null)}
            />
            <AssetButton
              label="Music"
              icon={<Music2 className="h-4 w-4" />}
              preview={musicUrl ? "music" : null}
              busy={uploading === "music"}
              disabled={!rightsConfirmed || !!uploading}
              onPick={() => audioInputRef.current?.click()}
              onClear={() => setMusicUrl(null)}
            />
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void uploadAsset("image", f, "player");
            }}
          />
          <input
            ref={bgInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void uploadAsset("image", f, "bg");
            }}
          />
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm,.mp3,.wav,.ogg,.m4a"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void uploadAsset("audio", f, "music");
            }}
          />

          <p className="mt-2 text-[11px] text-muted">
            Allowed: your own photos/art, CC0 / public-domain, or licensed packs. Not allowed:
            commercial songs, movie/game characters, brand logos, or other people’s photos without
            permission.
          </p>
        </section>

        {preview && (
          <div className="relative mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-ink">
            <div className="relative h-64 w-full">
              <PlayableGame
                key={`${preview.genre}-${preview.theme}-${preview.player_image}-${preview.bg_image}-${preview.music_url}`}
                config={preview}
                playing
              />
            </div>
            <p className="border-t border-white/10 px-3 py-2 text-[11px] font-semibold text-white/70">
              Live preview · {preview.genre}
              {preview.music_url ? " · music on" : ""}
              {preview.player_image || preview.bg_image ? " · custom art" : ""}
            </p>
          </div>
        )}

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
          {GENRES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGenre(g.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                genre === g.id
                  ? "bg-accent text-white"
                  : "border border-[var(--line)] bg-white text-muted"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
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
                    const idea = `Remix of "${g.title}": ${g.prompt || g.description}`;
                    setPrompt(idea);
                    const draft = generateGameFromPrompt(idea);
                    applyDraft({
                      ...draft,
                      title: `Remix: ${g.title}`.slice(0, 48),
                    });
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

function AssetButton({
  label,
  icon,
  preview,
  busy,
  disabled,
  onPick,
  onClear,
}: {
  label: string;
  icon: ReactNode;
  preview: string | null;
  busy: boolean;
  disabled: boolean;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-canvas">
      <button
        type="button"
        disabled={disabled}
        onClick={onPick}
        className="flex h-24 w-full flex-col items-center justify-center gap-1 text-xs font-semibold text-ink disabled:opacity-40"
      >
        {preview && preview !== "music" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : preview === "music" ? (
          <Music2 className="h-6 w-6 text-accent" />
        ) : (
          icon
        )}
        <span className={`relative z-10 ${preview && preview !== "music" ? "rounded bg-black/50 px-1.5 py-0.5 text-white" : ""}`}>
          {busy ? "Uploading…" : label}
        </span>
      </button>
      {preview && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-1 top-1 z-10 rounded-lg bg-white/90 p-1 text-ink"
          aria-label={`Remove ${label}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
