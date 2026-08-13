export type GameGenre = "flappy" | "runner" | "dodge" | "catch" | "tap";

export type GameThemeId = "neon" | "purple-pipes" | "city" | "candy" | "monster";

export type PlayConfig = {
  v: 1;
  genre: GameGenre;
  theme: GameThemeId;
  title: string;
  duration_seconds: number;
  /** scroll / fall / spawn speed multiplier */
  speed: number;
  /** flap / jump strength */
  jump: number;
  /** gravity for flappy/runner */
  gravity: number;
  player_color: string;
  obstacle_color: string;
  accent_color: string;
  bg_top: string;
  bg_bottom: string;
  instruction: string;
};

export type GeneratedGameDraft = {
  title: string;
  description: string;
  theme: GameThemeId;
  duration_seconds: number;
  play: PlayConfig;
};

export const THEME_PALETTES: Record<
  GameThemeId,
  { player: string; obstacle: string; accent: string; bgTop: string; bgBottom: string }
> = {
  neon: {
    player: "#7CFFB2",
    obstacle: "#2457ff",
    accent: "#ffffff",
    bgTop: "#0a1224",
    bgBottom: "#1a2a55",
  },
  "purple-pipes": {
    player: "#ffd166",
    obstacle: "#b388ff",
    accent: "#f8f7ff",
    bgTop: "#16082b",
    bgBottom: "#3b1d6e",
  },
  city: {
    player: "#4aa3ff",
    obstacle: "#ff6a3d",
    accent: "#e8eef8",
    bgTop: "#0d1b2a",
    bgBottom: "#1b3a4b",
  },
  candy: {
    player: "#ff7ab6",
    obstacle: "#7cf5ff",
    accent: "#fff0f7",
    bgTop: "#3a0a28",
    bgBottom: "#7a1048",
  },
  monster: {
    player: "#b6ff4a",
    obstacle: "#ff5c7a",
    accent: "#f4ffe8",
    bgTop: "#102008",
    bgBottom: "#2f4a12",
  },
};
