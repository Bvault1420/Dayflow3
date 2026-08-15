import { composeLook } from "./palette";
import {
  DIFFICULTY_SPEED,
  type Difficulty,
  type FxStyle,
  type GeneratedGameDraft,
  type GameGenre,
  type GameThemeId,
  type HudStyle,
  type ObstacleStyle,
  type PlayConfig,
  type ControlStyle,
  type PlayerShape,
  type WorldStyle,
  type GameGoal,
  type FeelMods,
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
  PlayerShape,
  WorldStyle,
  GameGoal,
  FeelMods,
} from "./types";

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickWorld(lower: string, theme: GameThemeId): WorldStyle {
  if (/ocean|meer|underwater|pearl|jellyfish|wasser/.test(lower)) return "ocean";
  if (/forest|jungle|wald|\btrees?\b|dschungel/.test(lower)) return "forest";
  if (/temple|ruine|desert|wüste|wueste/.test(lower)) return "temple";
  if (/space|weltall|galaxy|starfield|orbit/.test(lower)) return "space";
  if (/candy|zucker|süß|suess/.test(lower)) return "candy";
  if (/city|stadt|gta|street|crime|urban/.test(lower)) return "city";
  if (theme === "city") return "city";
  if (theme === "candy") return "candy";
  if (theme === "monster") return "forest";
  if (theme === "purple-pipes") return "space";
  return "neon";
}

function pickShape(lower: string, genre: GameGenre): PlayerShape {
  if (genre === "roam" || genre === "runner" || /mensch|person|character|held|hero|gta|crime/.test(lower))
    return "hero";
  if (/\b(drive|fahr|lenk|rennauto|sportwagen)\b/.test(lower)) return "car";
  return "orb";
}

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
  if (/neon|pipe|röhre|roehre|space|weltall|galaxy|purple/.test(lower) && !/city|stadt|crime/.test(lower))
    return "purple-pipes";
  if (/monster|pet|tier|creature|boss|battle|zombie|drache|dragon/.test(lower)) return "monster";
  return "neon";
}

function pickGenre(lower: string): GameGenre {
  // Famous-game → mechanics (never copy IP names into titles later)
  if (/gta|open\s*world|3d\s*city|crime\s*sim|frei\s*lauf|herumlaufen|stadt\s*(erkunden|laufen)|third[\s-]*person/.test(lower))
    return "roam";
  if (/subway\s*surf|temple\s*run|endless\s*runner|lane\s*runner|3[\s-]*spur|drei\s*spur|spur(en)?\s*wechseln/.test(lower))
    return "runner";
  if (/flappy\s*bird|jetpack\s*joyride/.test(lower)) return "flappy";
  if (/fruit\s*ninja|whack|piano\s*tiles/.test(lower)) return "tap";
  if (/asteroid|space\s*invader|fall\s*down/.test(lower)) return "dodge";

  // Explicit flappy only when clearly asked — "bird" alone is not enough in DE/EN
  const explicit = scoreMatches(lower, [
    {
      value: "roam",
      words:
        /\broam\b|erkunden|laufen\s*durch|open\s*world|3d\s*city|crime|stadt\s*sim|walking|joystick/gi,
    },
    {
      value: "flappy",
      words:
        /\bflappy\b|flappy\s*bird|\bfliegen\b|\bflug\b|flügel|fluegel|jetpack|hoch\s*und\s*runter|up\s*and\s*down|through\s+.*\bpipes\b|glowing\s+pipes|durch\s*.*(röhren|roehren|pipes)/gi,
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
  if (/auto|car|city|stadt|crime|gta/.test(lower)) return /gta|crime|3d|open/.test(lower) ? "roam" : "runner";
  if (/süß|suess|candy|bonbon/.test(lower)) return "catch";

  // Stable variety from prompt hash — never always flappy
  const genres: GameGenre[] = ["runner", "dodge", "catch", "tap", "flappy", "roam"];
  let hash = 0;
  for (let i = 0; i < lower.length; i++) hash = (hash * 31 + lower.charCodeAt(i)) >>> 0;
  return genres[hash % genres.length];
}

function pickLanes(lower: string, genre: GameGenre): 1 | 3 {
  if (genre !== "runner") return 1;
  if (/subway|temple\s*run|3[\s-]*lane|3[\s-]*spur|drei\s*spur|lane\s*switch|spur(en)?\s*wechseln/.test(lower))
    return 3;
  if (/surfer|lane|spur/.test(lower)) return 3;
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

export function pickFeel(lower: string, genre: GameGenre, seed: number): FeelMods {
  const feel: FeelMods = {};
  if (/halten|hold|jetpack|schweben|drücken|druecken/.test(lower)) feel.hold_flap = true;
  if (/doppelt|double[\s-]*jump|doppelsprung|zwei\s*sprünge|zwei\s*spruenge/.test(lower))
    feel.double_jump = true;
  if (/\bdash\b|sprintstoß|sprintstoss|ausweichen\s*dash/.test(lower)) feel.dash = true;
  if (/homing|verfolgen|folgt|lenkrakete|sucht/.test(lower)) feel.homing = true;
  if (/magnet|anziehen|zieht\s*an/.test(lower)) feel.magnet = true;
  if (/wackel|moving\s*gap|lücke\s*beweg|luecke\s*beweg/.test(lower)) feel.moving_gaps = true;
  if (/bounce|hüpfen|huepfen|feder|trampoline/.test(lower)) feel.bounce = true;
  if (/von\s*der\s*seite|from\s*the\s*side|seitlich/.test(lower)) feel.sides = true;
  if (/\btiny\b|mini|winzig|klein(er)?\s*spieler/.test(lower)) feel.tiny = true;
  if (/\bhuge\b|riesig|groß(er)?\s*spieler|grosser\s*spieler/.test(lower)) feel.huge = true;
  if (/schild|shield|rüstung|ruestung/.test(lower)) feel.shield = true;
  if (/invert|umgekehrt|gravity\s*flip|schwerkraft/.test(lower)) feel.invert = true;

  if (Object.keys(feel).length > 0) return feel;

  const byGenre: Record<GameGenre, (keyof FeelMods)[]> = {
    flappy: ["hold_flap", "moving_gaps", "bounce", "invert"],
    runner: ["double_jump", "dash", "bounce", "tiny"],
    dodge: ["homing", "sides", "tiny", "shield"],
    catch: ["magnet", "sides", "huge", "shield"],
    tap: ["tiny", "huge", "shield"],
    roam: ["dash", "magnet", "double_jump", "shield"],
  };
  const pool = byGenre[genre];
  const a = seed % pool.length;
  const b = Math.floor(seed / 7) % pool.length;
  const k1 = pool[a];
  const k2 = pool[b];
  if (k1) feel[k1] = true;
  if (k2) feel[k2] = true;
  return feel;
}

function feelHint(feel: FeelMods): string {
  const bits: string[] = [];
  if (feel.hold_flap) bits.push("hold to fly");
  if (feel.double_jump) bits.push("double jump");
  if (feel.dash) bits.push("dash");
  if (feel.homing) bits.push("threats chase");
  if (feel.magnet) bits.push("magnet loot");
  if (feel.moving_gaps) bits.push("moving gaps");
  if (feel.bounce) bits.push("bounce");
  if (feel.sides) bits.push("from the sides");
  if (feel.invert) bits.push("tap flips gravity");
  if (feel.shield) bits.push("1 shield");
  return bits.length ? ` · ${bits.slice(0, 2).join(" · ")}` : "";
}

function instructionFor(genre: GameGenre, lanes: 1 | 3 = 1, collectible = "loot"): string {
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
      return `Move & catch the ${collectible}`;
    case "tap":
      return "Tap the targets before they vanish";
    case "roam":
      return `Drag to walk · tap to jump · grab ${collectible}`;
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
    [/gta|crime|3d\s*city|stadt\s*sim/, "roam", "Night Block City"],
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
    roam: "Streets",
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
    roam: "Walk the streets, grab loot, dodge traffic.",
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
  world?: WorldStyle;
  collectible?: string;
  threat?: string;
  goal?: GameGoal;
  player_shape?: PlayerShape;
  player_color?: string;
  obstacle_color?: string;
  accent_color?: string;
  bg_top?: string;
  bg_bottom?: string;
  ground_color?: string;
  decor_color?: string;
  instruction?: string;
  speed?: number;
  jump?: number;
  gravity?: number;
  seed?: number;
  feel?: FeelMods;
}): PlayConfig {
  const idea = input.prompt.trim().replace(/\s+/g, " ");
  const lower = idea.toLowerCase();
  const seed = input.seed ?? hash32(idea.toLowerCase());
  const theme = input.theme ?? pickTheme(lower);
  const genre = input.genre ?? pickGenre(lower);
  const duration_seconds = input.duration_seconds ?? pickDuration(lower);
  const difficulty = input.difficulty ?? pickDifficulty(lower);
  const lanes = input.lanes ?? pickLanes(lower, genre);
  const world = input.world ?? pickWorld(lower, theme);
  const look = composeLook({
    prompt: idea,
    world,
    seed,
    player: input.player_color,
    obstacle: input.obstacle_color,
    accent: input.accent_color,
    bgTop: input.bg_top,
    bgBottom: input.bg_bottom,
    ground: input.ground_color,
    decor: input.decor_color,
  });
  const collectible = (input.collectible || guessNoun(lower, "loot")).slice(0, 18);
  const threat = (input.threat || guessNoun(lower, "hazard")).slice(0, 18);

  let speed = input.speed ?? DIFFICULTY_SPEED[difficulty];
  if (input.speed == null && /fast|schnell/.test(lower) && difficulty === "normal") speed = 1.2;

  let jump = input.jump ?? 1;
  if (input.jump == null) {
    if (/high|floaty|hoch/.test(lower)) jump = 1.25;
    else if (/heavy|low|schwer/.test(lower)) jump = 0.85;
  }

  const title = (input.title || craftTitle(idea, genre)).slice(0, 48);
  const feel = input.feel ?? pickFeel(lower, genre, seed);
  const baseInstruction = input.instruction?.slice(0, 72) || instructionFor(genre, lanes, collectible);

  return {
    v: 1,
    genre,
    theme,
    title,
    duration_seconds,
    speed,
    jump,
    gravity: input.gravity ?? (genre === "flappy" ? 0.45 : 0.7),
    player_color: look.player,
    obstacle_color: look.obstacle,
    accent_color: look.accent,
    bg_top: look.bgTop,
    bg_bottom: look.bgBottom,
    ground_color: look.ground,
    decor_color: look.decor,
    instruction: `${baseInstruction}${input.instruction ? "" : feelHint(feel)}`.slice(0, 80),
    difficulty,
    obstacle_style: input.obstacle_style ?? pickObstacleStyle(lower, genre),
    fx: input.fx ?? pickFx(lower),
    sfx: input.sfx ?? true,
    control:
      input.control ??
      (feel.hold_flap
        ? "hold"
        : genre === "roam" || genre === "dodge" || genre === "catch"
          ? "drag"
          : "tap"),
    hud_style: input.hud_style ?? "bold",
    lives: input.lives ?? (difficulty === "easy" ? 3 : difficulty === "insane" ? 1 : 2),
    lanes: genre === "roam" ? 1 : lanes,
    world,
    collectible,
    threat,
    goal: input.goal ?? (genre === "catch" || genre === "roam" ? "collect" : "survive"),
    player_shape: input.player_shape ?? pickShape(lower, genre),
    seed,
    feel,
  };
}

function guessNoun(lower: string, fallback: string): string {
  if (/cash|geld|money|coin|münze/.test(lower)) return "cash";
  if (/stern|star/.test(lower)) return "stars";
  if (/candy|bonbon/.test(lower)) return "candy";
  if (/pearl|perle/.test(lower)) return "pearls";
  if (/gem|kristall/.test(lower)) return "gems";
  return fallback;
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
