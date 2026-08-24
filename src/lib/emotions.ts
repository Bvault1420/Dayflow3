export const EMOTIONS = [
  {
    id: "nervoes",
    label: "nervös",
    prompt:
      "Ausweichen vor plötzlichen roten Funken im engen Tunnel, schnell und unruhig, dunkles Abendrot",
  },
  {
    id: "verliebt",
    label: "verliebt",
    prompt:
      "Fange fallende Herzen, lass die dunklen Steine fallen, weiches rosa goldenes Abendlicht",
  },
  {
    id: "wuetend",
    label: "wütend",
    prompt: "Tippe wütende Ziele bevor sie platzen, smash, lava rot, schnell",
  },
  {
    id: "lost",
    label: "lost",
    prompt:
      "Durch leere nächtliche Straßen laufen, Cash sammeln, Autos ausweichen, langsam und verloren",
  },
  {
    id: "euphorisch",
    label: "euphorisch",
    prompt:
      "3-Spur Stadt-Runner, Spuren wechseln und springen, neon gold, schnell und glücklich",
  },
  {
    id: "nachts",
    label: "nachts um 3",
    prompt:
      "Nachts durch violette Röhren fliegen, langsam, Schwerkraft umkehren, Mondlicht",
  },
] as const;

export type EmotionId = (typeof EMOTIONS)[number]["id"];

export function emotionById(id: string | null | undefined) {
  return EMOTIONS.find((e) => e.id === id) ?? EMOTIONS[0];
}
