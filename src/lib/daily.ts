import { EMOTIONS, type EmotionId } from "./emotions";
import { buildPlayConfig, hash32 } from "./games/generate-config";
import type { PlayConfig } from "./games/types";

const TITLES: Record<EmotionId, string[]> = {
  nervoes: ["Enge Luft", "Kurz vor knapp", "Der Sprung"],
  verliebt: ["Zwei Sekunden", "Weiches Licht", "Noch einmal"],
  wuetend: ["Kein Zurück", "Hitze", "Jetzt"],
  lost: ["Leere Straße", "Kein Signal", "Nach Hause"],
  euphorisch: ["Goldene Spur", "Fast fliegen", "Laut"],
  nachts: ["Drei Uhr", "Mondlücke", "Stille"],
};

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatTodayLabel(d = new Date()): string {
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export type DailyMoment = {
  dateKey: string;
  emotion: (typeof EMOTIONS)[number];
  title: string;
  duration: number;
  play: PlayConfig;
};

export function dailyMoment(dateKey = todayKey()): DailyMoment {
  const seed = hash32(`kairos-daily-${dateKey}`);
  const emotion = EMOTIONS[seed % EMOTIONS.length];
  const duration = [18, 20, 22, 24, 30][seed % 5];
  const titles = TITLES[emotion.id];
  const title = titles[Math.floor(seed / 11) % titles.length];
  const play = buildPlayConfig({
    prompt: emotion.prompt,
    title,
    duration_seconds: duration,
    seed,
  });
  return { dateKey, emotion, title, duration, play };
}
