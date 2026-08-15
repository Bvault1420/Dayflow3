"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ImagePlus,
  Mic,
  Music2,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";
import { formatCount } from "@/lib/demo-data";
import type { Game } from "@/lib/types";
import { BrandWordmark } from "./Brand";
import { GAME_WITH_CREATOR } from "@/lib/supabase/queries";
import {
  IDEA_STARTERS,
  REFINE_CHIPS,
  buildPlayConfig,
  encodePlayConfig,
  generateGameFromPrompt,
  type ControlStyle,
  type Difficulty,
  type FxStyle,
  type GameGenre,
  type HudStyle,
  type ObstacleStyle,
  type PlayConfig,
} from "@/lib/generate-game";
import { PlayableGame } from "./PlayableGame";
import {
  RIGHTS_COPY,
  copyrightRiskHint,
  validateAudioFile,
  validateImageFile,
} from "@/lib/assets";
import { FREE_PACKS, makeKairosPulseWav } from "@/lib/free-packs";

const THEMES = ["neon", "purple-pipes", "city", "candy", "monster"] as const;
const GENRES: { id: GameGenre; label: string }[] = [
  { id: "roam", label: "Roam" },
  { id: "flappy", label: "Flappy" },
  { id: "runner", label: "Runner" },
  { id: "dodge", label: "Dodge" },
  { id: "catch", label: "Catch" },
  { id: "tap", label: "Tap" },
];
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard", "insane"];
const OBSTACLE_STYLES: { id: ObstacleStyle; label: string }[] = [
  { id: "pipes", label: "Pipes" },
  { id: "blocks", label: "Blocks" },
  { id: "orbs", label: "Orbs" },
  { id: "spikes", label: "Spikes" },
];
const FX_STYLES: { id: FxStyle; label: string }[] = [
  { id: "none", label: "Clean" },
  { id: "glow", label: "Glow" },
  { id: "trail", label: "Trail" },
  { id: "shake", label: "Shake" },
];

type Tab = "idea" | "play" | "look" | "media" | "remix";

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
  const obstacleInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("idea");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [durationTouched, setDurationTouched] = useState(false);
  const [blurb, setBlurb] = useState("");
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("neon");
  const [genre, setGenre] = useState<GameGenre>("flappy");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [obstacleStyle, setObstacleStyle] = useState<ObstacleStyle>("pipes");
  const [fx, setFx] = useState<FxStyle>("glow");
  const [sfx, setSfx] = useState(true);
  const [control, setControl] = useState<ControlStyle>("tap");
  const [hudStyle, setHudStyle] = useState<HudStyle>("bold");
  const [lives, setLives] = useState(2);
  const [lanes, setLanes] = useState<1 | 3>(1);
  const [play, setPlay] = useState<PlayConfig | null>(null);
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [obstacleImage, setObstacleImage] = useState<string | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remixes, setRemixes] = useState<Game[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!play) return null;
    return {
      ...play,
      title: title.trim() || play.title,
      duration_seconds: duration,
      theme,
      genre,
      difficulty,
      obstacle_style: obstacleStyle,
      fx,
      sfx,
      control,
      hud_style: hudStyle,
      lives,
      lanes: genre === "roam" ? 1 : lanes,
      player_image: playerImage,
      bg_image: bgImage,
      music_url: musicUrl,
      obstacle_image: obstacleImage,
      rights_confirmed: rightsConfirmed,
    };
  }, [
    play,
    title,
    theme,
    duration,
    genre,
    difficulty,
    obstacleStyle,
    fx,
    sfx,
    control,
    hudStyle,
    lives,
    lanes,
    playerImage,
    bgImage,
    musicUrl,
    obstacleImage,
    rightsConfirmed,
  ]);

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
    description?: string;
    play?: PlayConfig;
  }) {
    setTitle(draft.title);
    setTheme(draft.theme);
    setDuration(draft.duration_seconds);
    setBlurb(draft.description || "");
    const next =
      draft.play ??
      buildPlayConfig({
        prompt: prompt.trim() || draft.title,
        title: draft.title,
        theme: draft.theme,
        duration_seconds: draft.duration_seconds,
      });
    setGenre(next.genre);
    setDifficulty(next.difficulty || "normal");
    setObstacleStyle(next.obstacle_style || "pipes");
    setFx(next.fx || "glow");
    setSfx(next.sfx !== false);
    setControl(next.control || "tap");
    setHudStyle(next.hud_style || "bold");
    setLives(next.lives || 2);
    setLanes(next.lanes === 3 ? 3 : 1);
    setPlay(next);
  }

  function startVoice() {
    const SR =
      typeof window !== "undefined"
        ? (
            window as unknown as {
              SpeechRecognition?: new () => SpeechRecognition;
              webkitSpeechRecognition?: new () => SpeechRecognition;
            }
          ).SpeechRecognition ||
          (
            window as unknown as {
              webkitSpeechRecognition?: new () => SpeechRecognition;
            }
          ).webkitSpeechRecognition
        : undefined;
    if (!SR) {
      setError("Voice input isn’t supported in this browser. Type your idea instead.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      setError("Couldn’t hear that — try again or type.");
    };
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      const text = ev.results[0]?.[0]?.transcript?.trim();
      if (text) {
        setPrompt((p) => (p ? `${p} ${text}` : text));
        setStatus("Voice added to your prompt");
      }
    };
    rec.start();
  }

  async function uploadAsset(
    kind: "image" | "audio",
    file: File,
    slot: "player" | "bg" | "music" | "obstacle"
  ) {
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
      if (slot === "obstacle") setObstacleImage(data.url);
      if (slot === "music") setMusicUrl(data.url);
      setStatus(slot === "music" ? "Music added." : "Image added.");
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
    setBusy(true);
    setError(risk && /mario|disney|pokemon|nintendo/i.test(idea) ? risk : null);
    setStatus("KI baut dein Spiel komplett selbst…");
    try {
      const res = await fetch("/api/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: idea,
          duration_seconds: durationTouched ? duration : null,
        }),
      });
      const draft = res.ok ? await res.json() : generateGameFromPrompt(idea);
      if (!res.ok) {
        draft.duration_seconds = duration;
        if (draft.play) draft.play.duration_seconds = duration;
      }
      applyDraft(draft);
      const src = draft.source === "groq" || draft.source === "openai" ? draft.source : "local";
      setTab("idea");
      setStatus(
        src === "local"
          ? `Fertig — “${draft.title}” · ${draft.play?.genre}`
          : `Fertig (${src}) — “${draft.title}” · ${draft.play?.genre}${
              draft.play?.world ? ` · ${draft.play.world}` : ""
            } · ${draft.duration_seconds || duration}s`
      );
    } catch {
      const draft = generateGameFromPrompt(idea);
      if (durationTouched) {
        draft.duration_seconds = duration;
        draft.play.duration_seconds = duration;
      }
      applyDraft(draft);
      setTab("idea");
      setStatus("Fertig — Spiel gebaut. Optional unter Tweak / Look nachjustieren.");
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
    const hasUploadedMedia = [playerImage, bgImage, musicUrl, obstacleImage].some(
      (u) => !!u && /^https?:\/\//i.test(u)
    );
    if (hasUploadedMedia && !rightsConfirmed) {
      setError("Confirm you have the rights to your images/music before publishing.");
      return;
    }
    const risk = copyrightRiskHint(idea, title, playerImage, musicUrl);
    if (risk && hasUploadedMedia) {
      setError(risk);
      return;
    }

    if (!preview) {
      setError("Tippe eine Idee und tippe auf Generieren — die KI baut das Spiel.");
      return;
    }

    setBusy(true);
    setError(null);
    setStatus(asDraft ? "Saving draft…" : "Publishing playable game…");

    const finalPlay = {
      ...preview,
      title: title.trim() || preview.title,
      duration_seconds: duration,
    };

    const payload = {
      creator_id: user.id,
      title: finalPlay.title,
      description: (blurb || idea).slice(0, 180),
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
    setObstacleImage(null);
    setMusicUrl(null);
    setRightsConfirmed(false);
    onPublished();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "idea", label: "Idea" },
    { id: "play", label: "Tweak" },
    { id: "look", label: "Look" },
    { id: "media", label: "Media" },
    { id: "remix", label: "Remix" },
  ];

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

      <div className="mx-4 mb-2 flex gap-1 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-xl px-2 py-2 text-xs font-bold ${
              tab === t.id ? "bg-ink text-white" : "text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {tab === "idea" && (
          <section>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 font-display text-[1.85rem] font-extrabold leading-[1.05] text-ink"
            >
              Type your idea.
              <br />
              <span className="text-accent">Die KI baut das ganze Spiel.</span>
            </motion.p>

            <div className="rounded-2xl bg-[#1a1d24] p-4 text-white">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your idea and start building…"
                rows={5}
                className="w-full resize-none bg-transparent text-base text-white outline-none placeholder:text-white/35"
              />

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={startVoice}
                  className={`inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${
                    listening ? "bg-hot text-hot-ink" : "bg-white/10 text-white"
                  }`}
                >
                  <Mic className="h-4 w-4" />
                  {listening ? "…" : "Voice"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={shapeFromPrompt}
                  className="ml-auto flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {busy ? "Baut…" : "Build"}
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {[
                { id: "media" as const, label: "Images", icon: <ImagePlus className="h-4 w-4" /> },
                { id: "media" as const, label: "Sounds", icon: <Music2 className="h-4 w-4" /> },
                { id: "look" as const, label: "Look", icon: <Sparkles className="h-4 w-4" /> },
                { id: "remix" as const, label: "Remix", icon: <Sparkles className="h-4 w-4" /> },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setTab(b.id)}
                  className="flex flex-col items-center gap-1 rounded-xl border border-[var(--line)] bg-white py-2.5 text-[11px] font-semibold text-ink"
                >
                  {b.icon}
                  {b.label}
                </button>
              ))}
            </div>

            <label className="mt-3 block rounded-xl border border-[var(--line)] bg-white px-3 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Duration optional — {durationTouched ? `${duration}s` : "KI entscheidet"}
              </span>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={duration}
                onChange={(e) => {
                  setDurationTouched(true);
                  setDuration(Number(e.target.value));
                }}
                className="mt-3 w-full accent-accent"
              />
            </label>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Ein Prompt reicht. Genre, Welt, Farben, Steuerung, Titel — alles macht die KI. Tweak /
              Look nur wenn du nachjustieren willst.
            </p>

            <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted">
              Starter (rechtlich safe Ideen)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {IDEA_STARTERS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setPrompt(idea)}
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-[11px] font-semibold text-ink"
                >
                  {idea}
                </button>
              ))}
            </div>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-muted">
              Refine
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {REFINE_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setPrompt((p) => `${p.trim()}${chip.append}`)}
                  className="rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-bold text-accent"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {tab === "play" && (
          <section className="space-y-4">
            <h3 className="font-display text-2xl font-bold text-ink">Tweak (optional)</h3>
            <p className="text-xs text-muted">
              Nur wenn du die KI-Wahl ändern willst. Standard: die KI hat das schon gebaut.
            </p>
            <ChipRow label="Genre">
              {GENRES.map((g) => (
                <Chip key={g.id} active={genre === g.id} onClick={() => setGenre(g.id)}>
                  {g.label}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow label="Lanes">
              <Chip active={lanes === 1} onClick={() => setLanes(1)}>
                1 (classic)
              </Chip>
              <Chip active={lanes === 3} onClick={() => setLanes(3)}>
                3 (subway-style)
              </Chip>
            </ChipRow>
            <ChipRow label="Difficulty">
              {DIFFICULTIES.map((d) => (
                <Chip
                  key={d}
                  active={difficulty === d}
                  onClick={() => setDifficulty(d)}
                  className="capitalize"
                >
                  {d}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow label="Controls">
              <Chip active={control === "tap"} onClick={() => setControl("tap")}>
                Tap
              </Chip>
              <Chip active={control === "drag"} onClick={() => setControl("drag")}>
                Drag
              </Chip>
            </ChipRow>
            <label className="block rounded-2xl border border-[var(--line)] bg-white p-3">
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
            <label className="block rounded-2xl border border-[var(--line)] bg-white p-3">
              <span className="text-[11px] font-medium text-muted">Lives {lives}</span>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={lives}
                onChange={(e) => setLives(Number(e.target.value))}
                className="mt-3 w-full accent-accent"
              />
            </label>
            <label className="block rounded-2xl border border-[var(--line)] bg-white p-3">
              <span className="text-[11px] font-medium text-muted">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm text-ink outline-none"
                placeholder="Auto from prompt"
              />
            </label>
          </section>
        )}

        {tab === "look" && (
          <section className="space-y-4">
            <h3 className="font-display text-2xl font-bold text-ink">Look & feel</h3>
            <ChipRow label="Vibe">
              {THEMES.map((t) => (
                <Chip
                  key={t}
                  active={theme === t}
                  onClick={() => setTheme(t)}
                  className="capitalize"
                >
                  {t.replace("-", " ")}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow label="Obstacles">
              {OBSTACLE_STYLES.map((o) => (
                <Chip
                  key={o.id}
                  active={obstacleStyle === o.id}
                  onClick={() => setObstacleStyle(o.id)}
                >
                  {o.label}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow label="FX">
              {FX_STYLES.map((f) => (
                <Chip key={f.id} active={fx === f.id} onClick={() => setFx(f.id)}>
                  {f.label}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow label="HUD">
              <Chip active={hudStyle === "bold"} onClick={() => setHudStyle("bold")}>
                Bold
              </Chip>
              <Chip active={hudStyle === "minimal"} onClick={() => setHudStyle("minimal")}>
                Minimal
              </Chip>
            </ChipRow>
            <button
              type="button"
              onClick={() => setSfx((v) => !v)}
              className={`flex w-full items-center justify-between rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold ${
                sfx ? "bg-accent-soft text-accent" : "bg-white text-muted"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Kairos SFX (safe beeps)
              </span>
              <span>{sfx ? "On" : "Off"}</span>
            </button>
          </section>
        )}

        {tab === "media" && (
          <section className="space-y-3">
            <h3 className="font-display text-2xl font-bold text-ink">Images & music</h3>
            <p className="text-xs leading-relaxed text-muted">{RIGHTS_COPY.body}</p>
            <ul className="space-y-1 text-[11px] text-muted">
              {RIGHTS_COPY.tips.map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Free Kairos packs (safe)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {FREE_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      setPlayerImage(pack.player_image);
                      setBgImage(pack.bg_image);
                      setStatus(`Applied free pack: ${pack.label}`);
                    }}
                    className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-ink"
                  >
                    {pack.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMusicUrl(makeKairosPulseWav());
                    setStatus("Added free Kairos Pulse music");
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-ink"
                >
                  <Music2 className="h-3.5 w-3.5 text-accent" />
                  Free pulse music
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-white px-3 py-3 border border-[var(--line)]">
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

            {!rightsConfirmed && (
              <p className="text-[11px] font-semibold text-hot">
                Check the box to upload your own Player / Background / Obstacle / Music files.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
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
                label="Obstacle"
                icon={<ImagePlus className="h-4 w-4" />}
                preview={obstacleImage}
                busy={uploading === "obstacle"}
                disabled={!rightsConfirmed || !!uploading}
                onPick={() => obstacleInputRef.current?.click()}
                onClear={() => setObstacleImage(null)}
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
              ref={obstacleInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadAsset("image", f, "obstacle");
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
            <p className="text-[11px] text-muted">
              Max 3 MB images · max 5 MB audio. No Spotify/YouTube rips, brand logos, or character
              art you don’t own.
            </p>
          </section>
        )}

        {tab === "remix" && (
          <section>
            <h3 className="font-display text-2xl font-bold text-ink">Remix a spark</h3>
            <p className="mt-1 text-sm text-muted">Start from a published community game</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
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
                    setTab("idea");
                    setStatus("Remix loaded — tweak and publish your version.");
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
            </div>
          </section>
        )}

        {preview && (
          <div className="relative mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-ink">
            <div className="relative h-64 w-full">
              <PlayableGame
                key={`${preview.genre}-${preview.theme}-${preview.seed}-${preview.player_color}-${preview.world}-${JSON.stringify(preview.feel)}-${preview.lanes}-${preview.player_image}-${preview.bg_image}`}
                config={preview}
                playing
              />
            </div>
            <p className="border-t border-white/10 px-3 py-2 text-[11px] font-semibold text-white/70">
              Live · {preview.title} · {preview.genre}
              {preview.world ? ` · ${preview.world}` : ""}
              {preview.lanes === 3 ? " · 3 lanes" : ""}
              {preview.collectible ? ` · ${preview.collectible}` : ""}
              {preview.feel
                ? ` · ${Object.keys(preview.feel)
                    .filter((k) => preview.feel?.[k as keyof typeof preview.feel])
                    .slice(0, 3)
                    .join(" · ")}`
                : ""}
            </p>
          </div>
        )}

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
      </div>
    </div>
  );
}

function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${className} ${
        active ? "bg-accent text-white" : "border border-[var(--line)] bg-white text-muted"
      }`}
    >
      {children}
    </button>
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
    <div className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-white">
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
        <span
          className={`relative z-10 ${
            preview && preview !== "music" ? "rounded bg-black/50 px-1.5 py-0.5 text-white" : ""
          }`}
        >
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

/** Minimal SpeechRecognition typings for browsers that support it. */
type SpeechRecognition = {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  start: () => void;
};
type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};
