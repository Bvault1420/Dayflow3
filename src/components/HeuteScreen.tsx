"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { dailyMoment, formatTodayLabel } from "@/lib/daily";
import {
  consumeMoment,
  DAILY_LIMIT,
  hasPlayedDaily,
  markDailyPlayed,
  readBudget,
  type MomentBudget,
} from "@/lib/moment-budget";
import { kairosSfx } from "@/lib/kairos-sfx";
import { BrandWordmark } from "./Brand";
import { DuoPlay } from "./DuoPlay";
import { PlayableGame } from "./PlayableGame";
import type { Game } from "@/lib/types";
import { GameCover } from "./GameCover";

export function HeuteScreen({
  community,
  onOpenCreate,
  onOpenGame,
  onOpenMoments,
}: {
  community: Game[];
  onOpenCreate: (prompt: string) => void;
  onOpenGame: (gameId: string) => void;
  onOpenMoments: () => void;
}) {
  const daily = useMemo(() => dailyMoment(), []);
  const [budget, setBudget] = useState<MomentBudget>(() => readBudget());
  const [duo, setDuo] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const [finished, setFinished] = useState(false);
  const [dailyDone, setDailyDone] = useState(() => hasPlayedDaily(daily.dateKey));

  const closed = budget.left <= 0 && dailyDone;

  function startDaily() {
    if (closed) return;
    if (!dailyDone) {
      setBudget(consumeMoment());
      markDailyPlayed(daily.dateKey);
      setDailyDone(true);
    }
    kairosSfx.jingle();
    setFinished(false);
    setPlaying(true);
    setPlayKey((k) => k + 1);
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-canvas px-4 pb-28 pt-12 scrollbar-hide">
      <div className="mb-1 flex items-center justify-between">
        <BrandWordmark className="text-sm text-muted" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          {budget.left} / {DAILY_LIMIT}
        </p>
      </div>
      <p className="text-xs capitalize text-muted">{formatTodayLabel()}</p>
      <h1 className="mt-1 font-display text-[2.15rem] font-semibold leading-[1.05] text-ink">
        Heute
      </h1>
      <p className="mt-2 text-sm text-muted">
        Ein Moment. {daily.duration} Sekunden. Gefühl: {daily.emotion.label}.
      </p>

      {closed ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-[1.6rem] border border-[var(--line)] bg-surface px-5 py-8 text-center"
        >
          <p className="font-display text-3xl text-ink">Bis morgen.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Du hast deine {DAILY_LIMIT} Momente für heute gespielt. Der nächste Kairos wartet.
          </p>
        </motion.div>
      ) : (
        <>
          <div className="film-frame relative mt-6 aspect-[3/4] overflow-hidden rounded-[1.4rem]">
            {duo ? (
              <DuoPlay
                key={playKey}
                config={daily.play}
                playing={playing}
                onStart={() => setFinished(false)}
                onOver={() => setFinished(true)}
              />
            ) : (
              <PlayableGame
                key={playKey}
                config={daily.play}
                playing={playing}
                onOver={() => setFinished(true)}
              />
            )}
            {!playing && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="font-display text-2xl text-ink">{daily.title}</p>
                <p className="text-xs text-muted">
                  {daily.duration}s · {daily.emotion.label}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setDuo((v) => !v)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold ${
                duo
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-[var(--line)] bg-surface text-ink"
              }`}
            >
              <Users className="h-4 w-4" />
              Zu zweit
            </button>
            <button
              type="button"
              onClick={startDaily}
              className="flex-[1.4] rounded-2xl bg-accent py-3 text-sm font-bold text-[#140e0a]"
            >
              {playing ? "Nochmal" : "Moment spielen"}
            </button>
          </div>

          {finished || dailyDone ? (
            <button
              type="button"
              onClick={() => onOpenCreate(`Fortsetzung von „${daily.title}“: `)}
              className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-surface py-3 text-sm font-semibold text-ink"
            >
              Nächste Szene machen
            </button>
          ) : null}
        </>
      )}

      {community.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl text-ink">Von anderen</h2>
            <button
              type="button"
              onClick={onOpenMoments}
              className="text-xs font-semibold text-accent"
            >
              Alle
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {community.slice(0, 8).map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => {
                  if (budget.left <= 0) return;
                  onOpenGame(game.id);
                }}
                className="w-36 shrink-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-surface text-left disabled:opacity-40"
                disabled={budget.left <= 0}
              >
                <GameCover game={game} className="aspect-[4/5]" />
                <div className="p-2.5">
                  <p className="truncate text-xs font-semibold text-ink">{game.title}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Weitere Momente zählen zu deinen {DAILY_LIMIT} heute.
          </p>
        </section>
      )}
    </div>
  );
}
