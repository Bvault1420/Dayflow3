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

type Scored<T> = { value: T; score: number };

function scoreMatches(lower: string, groups: Array<{ value: GameGenre; words: RegExp }>): GameGenre | null {
  const scored: Scored<GameGenre>[] = [];
  for (const g of groups) {
    const m = lower.match(g.words);
    if (m) scored.push({ value: g.value, score: m.length + (m[0]?.length || 0) / 10 });
  }
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  return scored[0].value;
}

function pickTheme(lower: string): GameThemeId {
  if (/candy|zucker|süß|suess|pink|lolli|bonbon|sweet|sugar/.test(lower)) return "candy";
  if (
    /city|stadt|gta|street|auto|car|crime|urban|straße|strasse|subway|surfer|temple\s*run|lane\s*runner/.test(
      lower
    )
  )
    return "city";
  if (/neon|pipe|röhre|roehre|space|weltall|galaxy|purple/.test(lower)) return "purple-pipes";
  if (/monster|pet|tier|creature|boss|battle|zombie|drache|dragon/.test(lower)) return "monster";
  return "neon";
}

function pickGenre(lower: string): GameGenre {
  // Famous-game → mechanics (never copy IP names into titles later)
  if (/subway\s*surf|temple\s*run|endless\s*runner|lane\s*runner|3[\s-]*spur|drei\s*spur|spur(en)?\s*wechseln/.test(lower))
    return "runner";
  if (/flappy\s*bird|jetpack\s*joyride/.test(lower)) return "flappy";
  if (/fruit\s*ninja|whack|piano\s*tiles/.test(lower)) return "tap";
  if (/asteroid|space\s*invader|fall\s*down/.test(lower)) return "dodge";

  // Explicit flappy only when clearly asked — "bird" alone is not enough in DE/EN
  const explicit = scoreMatches(lower, [
    {
      value: "flappy",
      words:
        /\bflappy\b|flappy\s*bird|\bfliegen\b|\bflug\b|flügel|fluegel|hoch\s*und\s*runter|up\s*and\s*down|durch\s*(die\s*)?(röhren|roehren|pipes)/gi,
    },
    {
      value: "catch",
      words:
        /fangen|fängt|faengt|auffangen|sammeln|collect|catch|grab|coin|münze|muenze|fruit|obst|\bsterne?\b|\bstars?\b|items?\s*auffangen|bonbon/gi,
    },
    {
      value: "tap",
      words:
        /\btipp(e|en|t)?\b|antippen|klicken|\btap\b|whack|smash|ziel|target|\bpop\b|treffen|zerstampfen|hämmern|haemmern|orbs?\s*(tippen|antippen)?/gi,
    },
    {
      value: "dodge",
      words:
        /ausweichen|dodge|avoid|meteor|asteroid|tunnel|regen|rain|hindernisse\s*ausweichen|nicht\s*treffen|meiden|aus\s*dem\s*weg/gi,
    },
    {
      value: "runner",
      words:
        /rennen|laufen|sprint|runner|\brun\b|dash|jump|springen|parkour|hürde|huerde|hindernis\s*überspringen|ueberspringen|endless|surfer|subway/gi,
    },
  ]);
  if (explicit) return explicit;

  // Soft theme cues
  if (/kampf|fight|boss|battle/.test(lower)) return "tap";
  if (/auto|car|city|stadt/.test(lower)) return "runner";
  if (/süß|suess|candy|bonbon/.test(lower)) return "catch";

  // Stable variety from prompt hash — never always flappy
  const genres: GameGenre[] = ["runner", "dodge", "catch", "tap", "flappy"];
  let hash = 0;
  for (let i = 0; i < lower.length; i++) hash = (hash * 31 + lower.charCodeAt(i)) >>> 0;
  return genres[hash % genres.length];
}

function pickLanes(lower: string, genre: GameGenre): 1 | 3 {
  if (/subway|temple\s*run|3[\s-]*lane|3[\s-]*spur|drei\s*spur|lane\s*switch|spur(en)?\s*wechseln|endless\s*runner/.test(lower))
    return 3;
  if (genre === "runner" && /surfer|lane|spur/.test(lower)) return 3;
  return 1;
}

function pickDuration(lower: string): number {
  const num = lower.match(/\b(\d{1,2})\s*(s|sec|sek|seconds?|sekunden)?\b/);
  if (num) {
    const n = Number(num[1]);
    if (n >= 10 && n <= 60) return n;
  }
  if (/60|minute|lang|long/.test(lower)) return 60;
  if (/10|quick|kurz|blitz|short/.test(lower)) return 15;
  if (/45|medium/.test(lower)) return 45;
  if (/20/.test(lower)) return 20;
  if (/40/.test(lower)) return 40;
  return 30;
}

function pickDifficulty(lower: string): Difficulty {
  if (/insane|crazy|extreme|wahnsinn|unmöglich|unmoeglich/.test(lower)) return "insane";
  if (/hard|schwer|hardcore|schwierig/.test(lower)) return "hard";
  if (/easy|chill|slow|casual|einfach|leicht/.test(lower)) return "easy";
  return "normal";
}

function pickObstacleStyle(lower: string, genre: GameGenre): ObstacleStyle {
  if (/spike|dorn|stachel|thorn/.test(lower)) return "spikes";
  if (/orb|bubble|ball|kreis|kugel|circle/.test(lower)) return "orbs";
  if (/block|crate|kiste|box|brick|stein/.test(lower)) return "blocks";
  if (/pipe|röhre|roehre/.test(lower)) return "pipes";
  if (genre === "flappy") return "pipes";
  if (genre === "runner") return "blocks";
  if (genre === "tap") return "orbs";
  return "orbs";
}

function pickFx(lower: string): FxStyle {
  if (/shake|wackel|juice/.test(lower)) return "shake";
  if (/trail|spur|motion/.test(lower)) return "trail";
  if (/glow|neon|leuchten/.test(lower)) return "glow";
  return "glow";
}

function instructionFor(genre: GameGenre, lanes: 1 | 3 = 1): string {
  if (genre === "runner" && lanes === 3) {
    return "Tap left/right to change lanes · center to jump";
  }
  switch (genre) {
    case "flappy":
      return "Tap to flap — dodge the gaps";
    case "runner":
      return "Tap to jump — clear the obstacles";
    case "dodge":
      return "Move left / right to dodge";
    case "catch":
      return "Move & catch the good stuff";
    case "tap":
      return "Tap the targets before they vanish";
  }
}

const STOP = new Set(
  [
    "a",
    "an",
    "the",
    "and",
    "or",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "my",
    "your",
    "ein",
    "eine",
    "einer",
    "eines",
    "der",
    "die",
    "das",
    "und",
    "oder",
    "mit",
    "von",
    "zu",
    "im",
    "am",
    "wo",
    "man",
    "ich",
    "will",
    "möchte",
    "moechte",
    "mach",
    "mache",
    "machen",
    "spiel",
    "spiele",
    "game",
    "bitte",
    "dass",
    "daß",
    "wie",
    "so",
    "auch",
    "noch",
    "dann",
    "build",
    "make",
    "create",
    "erstelle",
    "erstellen",
  ].map((w) => w.toLowerCase())
);

/** Craft a short game title from the idea — not the raw prompt dump. */
export function craftTitle(prompt: string, genre: GameGenre): string {
  const idea = prompt.trim().replace(/\s+/g, " ");
  const lower = idea.toLowerCase();

  const quoted = idea.match(/[„""](.+?)[„""]/);
  if (quoted?.[1]) return quoted[1].slice(0, 40);

  // Keyword → polished title (DE/EN)
  const specials: Array<[RegExp, GameGenre | "any", string]> = [
    [/subway|temple\s*run|lane\s*runner|3[\s-]*spur/, "runner", "City Lane Rush"],
    [/stern|star/, "catch", "Star Catcher"],
    [/meteor|asteroid/, "dodge", "Meteor Dodge"],
    [/candy|bonbon|süß|suess|zucker/, "catch", "Candy Grab"],
    [/stadt|city|street/, "runner", "City Sprint"],
    [/neon.*pipe|pipe.*neon|röhre|roehre/, "flappy", "Neon Pipe Dash"],
    [/\bflappy\b/, "flappy", "Flappy Pulse"],
    [/monster/, "tap", "Monster Smash"],
    [/tunnel/, "dodge", "Tunnel Evade"],
    [/\borbs?\b/, "tap", "Orb Pop"],
    [/coin|münze|muenze/, "catch", "Coin Rush"],
  ];
  for (const [re, wantGenre, title] of specials) {
    if (re.test(lower) && (wantGenre === "any" || wantGenre === genre)) {
      return title;
    }
  }
  // Genre-agnostic keyword fallbacks
  for (const [re, , title] of specials) {
    if (re.test(lower)) return title;
  }

  const verbish =
    /^(fang|fängt|sammel|renn|lauf|spring|tipp|klick|dodge|catch|run|jump|make|build|mach)/i;
  const words = idea
    .replace(/[^a-zA-ZäöüÄÖÜß0-9\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP.has(w.toLowerCase()) && !verbish.test(w));

  const noun = words.sort((a, b) => b.length - a.length)[0];
  const tag: Record<GameGenre, string> = {
    flappy: "Flight",
    runner: "Sprint",
    dodge: "Dodge",
    catch: "Catch",
    tap: "Tap",
  };

  if (noun) {
    const nice = noun[0].toUpperCase() + noun.slice(1);
    return `${nice} ${tag[genre]}`.slice(0, 42);
  }

  const vibe = /neon/.test(lower)
    ? "Neon"
    : /candy|süß|suess/.test(lower)
      ? "Candy"
      : /city|stadt/.test(lower)
        ? "City"
        : /monster/.test(lower)
          ? "Monster"
          : "Kairos";
  return `${vibe} ${tag[genre]}`.slice(0, 42);
}

function craftDescription(prompt: string, genre: GameGenre, duration: number): string {
  const idea = prompt.trim().replace(/\s+/g, " ");
  if (idea.length >= 24 && idea.length <= 160 && !/^ein spiel/i.test(idea)) {
    return idea.slice(0, 180);
  }
  const hooks: Record<GameGenre, string> = {
    flappy: "Flap through gaps and survive the clock.",
    runner: "Sprint, jump obstacles, and push your score.",
    dodge: "Stay alive by sliding clear of danger.",
    catch: "Snag the good drops — skip the bad ones.",
    tap: "Hit targets before they vanish.",
  };
  return `${hooks[genre]} ${duration}s run. Inspired by: ${idea.slice(0, 80)}`.slice(0, 180);
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
  lanes?: 1 | 3;
  description?: string;
}): PlayConfig {
  const idea = input.prompt.trim().replace(/\s+/g, " ");
  const lower = idea.toLowerCase();
  const theme = input.theme ?? pickTheme(lower);
  const genre = input.genre ?? pickGenre(lower);
  const duration_seconds = input.duration_seconds ?? pickDuration(lower);
  const difficulty = input.difficulty ?? pickDifficulty(lower);
  const lanes = input.lanes ?? pickLanes(lower, genre);
  const palette = THEME_PALETTES[theme];

  let speed = DIFFICULTY_SPEED[difficulty];
  if (/fast|schnell/.test(lower) && difficulty === "normal") speed = 1.2;

  let jump = 1;
  if (/high|floaty|hoch/.test(lower)) jump = 1.25;
  else if (/heavy|low|schwer/.test(lower)) jump = 0.85;

  const title = (input.title || craftTitle(idea, genre)).slice(0, 48);

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
    instruction: instructionFor(genre, lanes),
    difficulty,
    obstacle_style: input.obstacle_style ?? pickObstacleStyle(lower, genre),
    fx: input.fx ?? pickFx(lower),
    sfx: input.sfx ?? true,
    control:
      input.control ??
      (lanes === 3 ? "tap" : genre === "dodge" || genre === "catch" ? "drag" : "tap"),
    hud_style: input.hud_style ?? "bold",
    lives: input.lives ?? (difficulty === "easy" ? 3 : difficulty === "insane" ? 1 : 2),
    lanes,
  };
}

/** Local prompt → full playable game draft (no API key required). */
export function generateGameFromPrompt(prompt: string): GeneratedGameDraft {
  const idea = prompt.trim().replace(/\s+/g, " ");
  const play = buildPlayConfig({ prompt: idea });
  const description = craftDescription(idea, play.genre, play.duration_seconds);

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
      lanes: stored.lanes,
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
