export type GameGenre = "flappy" | "runner" | "dodge" | "catch" | "tap" | "roam";

export type GameThemeId = "neon" | "purple-pipes" | "city" | "candy" | "monster";

export type Difficulty = "easy" | "normal" | "hard" | "insane";
export type ObstacleStyle = "pipes" | "blocks" | "orbs" | "spikes";
export type FxStyle = "none" | "trail" | "glow" | "shake";
export type ControlStyle = "tap" | "drag";
export type HudStyle = "bold" | "minimal";
export type PlayerShape = "orb" | "hero" | "car";
export type WorldStyle = "city" | "space" | "candy" | "neon" | "forest" | "temple" | "ocean";
export type GameGoal = "survive" | "collect" | "score";

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
  /** Optional creator-uploaded assets (must be rights-cleared). */
  player_image?: string | null;
  bg_image?: string | null;
  music_url?: string | null;
  obstacle_image?: string | null;
  rights_confirmed?: boolean;
  /** Creator tooling */
  difficulty?: Difficulty;
  obstacle_style?: ObstacleStyle;
  fx?: FxStyle;
  sfx?: boolean;
  control?: ControlStyle;
  hud_style?: HudStyle;
  lives?: number;
  /** 3 = subway-style lane runner (swipe/tap between lanes) */
  lanes?: 1 | 3;
  /** Prompt-unique extras so two runners don't look identical */
  world?: WorldStyle;
  collectible?: string;
  threat?: string;
  goal?: GameGoal;
  player_shape?: PlayerShape;
  seed?: number;
  ground_color?: string;
  decor_color?: string;
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

export const DIFFICULTY_SPEED: Record<Difficulty, number> = {
  easy: 0.75,
  normal: 1,
  hard: 1.25,
  insane: 1.45,
};

/** Safe prompt starters — original Kairos ideas, no third-party IP. */
export const IDEA_STARTERS = [
  "3D city crime night — walk the streets, grab cash, dodge cars",
  "Baue ein 3-Spur Stadt-Runner — Spuren wechseln und springen",
  "Neon bird through glowing pipes",
  "Catch falling candy, dodge bombs",
  "Tap blinking orbs before they vanish",
  "Dodge meteors in a tunnel for 20s",
  "Monster smash — hit green targets",
  "Ocean dive: collect pearls, avoid jellyfish",
];

export const REFINE_CHIPS = [
  { label: "Harder", append: " Make it harder and faster." },
  { label: "Chill", append: " Make it easy and chill." },
  { label: "3 lanes", append: " Use a 3-lane endless runner with lane switching." },
  { label: "More glow", append: " Add neon glow effects." },
  { label: "Shorter", append: " Keep it to 15 seconds." },
  { label: "Longer", append: " Make it 45 seconds." },
];
