import {
  DIFFICULTY_SPEED,
  THEME_PALETTES,
  type Difficulty,
  type FxStyle,
  type GeneratedGameDraft,
  type GameGenre,
  type GameThemeId,
  type HudStyle,
  type ObstacleStyle,
  type PlayConfig,
  type ControlStyle,
} from "./types";

export {
  IDEA_STARTERS,
  REFINE_CHIPS,
  DIFFICULTY_SPEED,
  THEME_PALETTES,
} from "./types";
export type {
  Difficulty,
  ObstacleStyle,
  FxStyle,
  ControlStyle,
  HudStyle,
} from "./types";

function pickTheme(lower: string): GameThemeId {
  if (/candy|sugar|sweet|pink|lolli/.test(lower)) return "candy";
  if (/city|gta|street|car|crime|urban/.test(lower)) return "city";
  if (/flappy|pipe|bird|fly|neon|space/.test(lower)) return "purple-pipes";
  if (/monster|pet|creature|boss|battle|zombie/.test(lower)) return "monster";
  return "neon";
}

function pickGenre(lower: string): GameGenre {
  if (/flappy|bird|pipe|fly|flight|wing/.test(lower)) return "flappy";
  if (/catch|collect|fruit|coin|grab|candy|sugar|sweet/.test(lower)) return "catch";
  if (/tap|whack|smash|click|target|pop/.test(lower)) return "tap";
  if (/dodge|avoid|fall|rain|meteor|asteroid|tunnel/.test(lower)) return "dodge";
  if (/monster|battle|boss/.test(lower)) return "tap";
  if (/run|runner|sprint|dash|jump|parkour|hurdle|city|car|gta|crime/.test(lower))
    return "runner";
  return "flappy";
}

function pickDuration(lower: string): number {
  if (/60|minute|long/.test(lower)) return 60;
  if (/10|quick|short|blitz/.test(lower)) return 15;
  if (/45|medium/.test(lower)) return 45;
  if (/20/.test(lower)) return 20;
  if (/40/.test(lower)) return 40;
  return 30;
}

function pickDifficulty(lower: string): Difficulty {
  if (/insane|crazy|extreme/.test(lower)) return "insane";
  if (/hard|hardcore/.test(lower)) return "hard";
  if (/easy|chill|slow|casual/.test(lower)) return "easy";
  return "normal";
}

function pickObstacleStyle(lower: string, genre: GameGenre): ObstacleStyle {
  if (/spike|thorn/.test(lower)) return "spikes";
  if (/orb|bubble|ball|circle/.test(lower)) return "orbs";
  if (/block|crate|box|brick/.test(lower)) return "blocks";
  if (/pipe/.test(lower) || genre === "flappy") return "pipes";
  return genre === "runner" ? "blocks" : "orbs";
}

function pickFx(lower: string): FxStyle {
  if (/shake|juice/.test(lower)) return "shake";
  if (/glow|neon/.test(lower)) return "glow";
  if (/trail|motion/.test(lower)) return "trail";
  return "glow";
}

function instructionFor(genre: GameGenre): string {
  switch (genre) {
    case "flappy":
      return "Tap to flap — dodge the pipes";
    case "runner":
      return "Tap to jump — clear the obstacles";
    case "dodge":
      return "Tap left / right to dodge";
    case "catch":
      return "Move & catch the good stuff";
    case "tap":
      return "Tap the targets before they vanish";
  }
}

export function buildPlayConfig(input: {
  prompt: string;
  title?: string;
  theme?: GameThemeId;
  duration_seconds?: number;
  genre?: GameGenre;
  difficulty?: Difficulty;
  obstacle_style?: ObstacleStyle;
  fx?: FxStyle;
  sfx?: boolean;
  control?: ControlStyle;
  hud_style?: HudStyle;
  lives?: number;
}): PlayConfig {
  const idea = input.prompt.trim().replace(/\s+/g, " ");
  const lower = idea.toLowerCase();
  const theme = input.theme ?? pickTheme(lower);
  const genre = input.genre ?? pickGenre(lower);
  const duration_seconds = input.duration_seconds ?? pickDuration(lower);
  const difficulty = input.difficulty ?? pickDifficulty(lower);
  const palette = THEME_PALETTES[theme];

  let speed = DIFFICULTY_SPEED[difficulty];
  if (/fast/.test(lower) && difficulty === "normal") speed = 1.2;

  let jump = 1;
  if (/high|floaty/.test(lower)) jump = 1.25;
  else if (/heavy|low/.test(lower)) jump = 0.85;

  const firstSentence =
    idea
      .split(/[.!?\n]/)
      .map((s) => s.trim())
      .find(Boolean) || "Untitled Moment";

  let title = (input.title || firstSentence).slice(0, 48);
  if (/flappy/.test(lower) && !/flappy/i.test(title)) title = `Flappy ${title}`.slice(0, 48);

  return {
    v: 1,
    genre,
    theme,
    title,
    duration_seconds,
    speed,
    jump,
    gravity: genre === "flappy" ? 0.45 : 0.7,
    player_color: palette.player,
    obstacle_color: palette.obstacle,
    accent_color: palette.accent,
    bg_top: palette.bgTop,
    bg_bottom: palette.bgBottom,
    instruction: instructionFor(genre),
    difficulty,
    obstacle_style: input.obstacle_style ?? pickObstacleStyle(lower, genre),
    fx: input.fx ?? pickFx(lower),
    sfx: input.sfx ?? true,
    control: input.control ?? (genre === "dodge" || genre === "catch" ? "drag" : "tap"),
    hud_style: input.hud_style ?? "bold",
    lives: input.lives ?? (difficulty === "easy" ? 3 : difficulty === "insane" ? 1 : 2),
  };
}

/** Local prompt → full playable game draft (no API key required). */
export function generateGameFromPrompt(prompt: string): GeneratedGameDraft {
  const idea = prompt.trim().replace(/\s+/g, " ");
  const play = buildPlayConfig({ prompt: idea });
  const description =
    idea.length > 12
      ? idea.slice(0, 180)
      : `A ${play.duration_seconds}s ${play.genre} moment: ${idea || "your idea"}.`;

  return {
    title: play.title,
    description,
    theme: play.theme,
    duration_seconds: play.duration_seconds,
    play,
  };
}

export function encodePlayConfig(play: PlayConfig): string {
  return JSON.stringify(play);
}

export function parsePlayConfig(raw: string | null | undefined): PlayConfig | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PlayConfig;
    if (parsed?.v === 1 && parsed.genre) return parsed;
  } catch {
    /* not json */
  }
  return null;
}

/** Resolve playable config from stored row (or rebuild from prompt). */
export function resolvePlayConfig(game: {
  prompt?: string | null;
  title?: string | null;
  theme?: string | null;
  duration_seconds?: number | null;
  play_url?: string | null;
}): PlayConfig {
  const stored = parsePlayConfig(game.play_url);
  if (stored) {
    const defaults = buildPlayConfig({
      prompt: game.prompt || stored.title,
      title: stored.title,
      theme: stored.theme,
      duration_seconds: stored.duration_seconds,
      genre: stored.genre,
      difficulty: stored.difficulty,
      obstacle_style: stored.obstacle_style,
      fx: stored.fx,
      sfx: stored.sfx,
      control: stored.control,
      hud_style: stored.hud_style,
      lives: stored.lives,
    });
    return {
      ...defaults,
      ...stored,
      duration_seconds: game.duration_seconds || stored.duration_seconds,
      title: game.title || stored.title,
    };
  }
  return buildPlayConfig({
    prompt: game.prompt || game.title || "neon flappy",
    title: game.title || undefined,
    theme: (game.theme as GameThemeId) || undefined,
    duration_seconds: game.duration_seconds || undefined,
  });
}
