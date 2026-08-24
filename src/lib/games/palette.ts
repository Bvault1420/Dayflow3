import type { WorldStyle } from "./types";

export type GameLook = {
  player: string;
  obstacle: string;
  accent: string;
  bgTop: string;
  bgBottom: string;
  ground: string;
  decor: string;
};

type Hsl = { h: number; s: number; l: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function hexToHsl(hex: string): Hsl {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex({ h, s, l }: Hsl): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = clamp(s, 0, 100) / 100;
  const ll = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ll - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 60) [r, g, b] = [c, x, 0];
  else if (hh < 120) [r, g, b] = [x, c, 0];
  else if (hh < 180) [r, g, b] = [0, c, x];
  else if (hh < 240) [r, g, b] = [0, x, c];
  else if (hh < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function shift(hex: string, dh = 0, ds = 0, dl = 0): string {
  const c = hexToHsl(hex);
  return hslToHex({ h: c.h + dh, s: c.s + ds, l: c.l + dl });
}

function luminance(hex: string): number {
  return hexToHsl(hex).l;
}

/** Curated art directions — each game picks one (or a prompt-tinted variant). */
export const ART_LOOKS: GameLook[] = [
  {
    player: "#ffd36a",
    obstacle: "#2a0f18",
    accent: "#ffb38a",
    bgTop: "#2b1024",
    bgBottom: "#e07a3d",
    ground: "#4a221c",
    decor: "#8a3a2e",
  },
  {
    player: "#7ef0e6",
    obstacle: "#ff5d7a",
    accent: "#d7fff8",
    bgTop: "#04151c",
    bgBottom: "#0b3a44",
    ground: "#0a2a30",
    decor: "#14545c",
  },
  {
    player: "#f4fbff",
    obstacle: "#3d6bff",
    accent: "#b8e4ff",
    bgTop: "#8ec5ff",
    bgBottom: "#e8f4ff",
    ground: "#c5daf0",
    decor: "#7aa8d4",
  },
  {
    player: "#ffb347",
    obstacle: "#1a0a08",
    accent: "#ffd7a1",
    bgTop: "#1a0808",
    bgBottom: "#7a1d12",
    ground: "#2c0c0a",
    decor: "#5a1810",
  },
  {
    player: "#ffe7a3",
    obstacle: "#5b2d12",
    accent: "#ffd27a",
    bgTop: "#2a1a0c",
    bgBottom: "#8a5a22",
    ground: "#3d2810",
    decor: "#6e4520",
  },
  {
    player: "#ffd0e6",
    obstacle: "#5a2048",
    accent: "#ffe8f4",
    bgTop: "#2a1028",
    bgBottom: "#8a3068",
    ground: "#3a1834",
    decor: "#6a2854",
  },
  {
    player: "#d4ff4a",
    obstacle: "#2a0a28",
    accent: "#f4ffb0",
    bgTop: "#12081a",
    bgBottom: "#2a1840",
    ground: "#1a1028",
    decor: "#3a2460",
  },
  {
    player: "#c9a6ff",
    obstacle: "#24104a",
    accent: "#efe4ff",
    bgTop: "#14082c",
    bgBottom: "#3a1a6e",
    ground: "#1c1038",
    decor: "#4a2880",
  },
  {
    player: "#ffe0a8",
    obstacle: "#5a3010",
    accent: "#fff1d0",
    bgTop: "#c48a48",
    bgBottom: "#f0d2a0",
    ground: "#a06a38",
    decor: "#8a5828",
  },
  {
    player: "#9ad0ff",
    obstacle: "#0a1018",
    accent: "#d8e8f8",
    bgTop: "#0a1018",
    bgBottom: "#1a2838",
    ground: "#121820",
    decor: "#243040",
  },
  {
    player: "#ffb7c8",
    obstacle: "#5a3048",
    accent: "#ffe6ee",
    bgTop: "#3a2038",
    bgBottom: "#f2c4d4",
    ground: "#4a2838",
    decor: "#8a5068",
  },
  {
    player: "#ff8a4a",
    obstacle: "#2a1010",
    accent: "#ffd0a8",
    bgTop: "#1a0c10",
    bgBottom: "#5a2018",
    ground: "#241014",
    decor: "#4a1c18",
  },
  {
    player: "#7cffd4",
    obstacle: "#ff6a8a",
    accent: "#e8fff6",
    bgTop: "#021820",
    bgBottom: "#0a3a50",
    ground: "#062430",
    decor: "#0e4860",
  },
  {
    player: "#b8fff0",
    obstacle: "#206060",
    accent: "#e8fff8",
    bgTop: "#d8fff4",
    bgBottom: "#8ad4c8",
    ground: "#6ab8ac",
    decor: "#4a9088",
  },
  {
    player: "#ffc48a",
    obstacle: "#3a2018",
    accent: "#ffe8c8",
    bgTop: "#2a1814",
    bgBottom: "#6a3a28",
    ground: "#3a2018",
    decor: "#5a3024",
  },
  {
    player: "#a8ffc8",
    obstacle: "#ff5a7a",
    accent: "#e8ffe8",
    bgTop: "#081820",
    bgBottom: "#143a48",
    ground: "#0c2430",
    decor: "#1a5060",
  },
];

const COLOR_WORDS: Array<{ re: RegExp; hex: string }> = [
  { re: /\b(gold|golden|gelb|yellow)\b/, hex: "#f5c542" },
  { re: /\b(rot|red|crimson|scarlet|kirsch)\b/, hex: "#ff3b4a" },
  { re: /\b(blau|blue|navy|azur)\b/, hex: "#3d8bff" },
  { re: /\b(grün|gruen|green|lime|mint)\b/, hex: "#3dff8a" },
  { re: /\b(pink|rosa|magenta|hot\s*pink)\b/, hex: "#ff5ab4" },
  { re: /\b(lila|purple|violett|violet)\b/, hex: "#9b5cff" },
  { re: /\b(orange|amber|kupfer|copper)\b/, hex: "#ff8a2a" },
  { re: /\b(türkis|tuerkis|teal|cyan|aqua)\b/, hex: "#2ee6d6" },
  { re: /\b(weiß|weiss|white|ivory)\b/, hex: "#f4f1ea" },
  { re: /\b(schwarz|black|noir)\b/, hex: "#1a1a1a" },
  { re: /\b(braun|brown|bronze)\b/, hex: "#8a5a32" },
  { re: /\b(silber|silver|chrome)\b/, hex: "#c8d0d8" },
];

const MOOD_WORDS: Array<{ re: RegExp; look: number }> = [
  { re: /sunset|sonnenuntergang|dusk|abendrot|golden\s*hour/, look: 0 },
  { re: /ice|eis|arctic|frost|winter|schnee|snow/, look: 2 },
  { re: /lava|volcan|feuer|fire|magma|inferno/, look: 3 },
  { re: /temple|gold|wüste|wueste|desert|sand/, look: 4 },
  { re: /sakura|cherry|blossom|kirschblüte|kirschbluete/, look: 10 },
  { re: /rain|regen|noir|nacht|night|dunkel|dark/, look: 9 },
  { re: /toxic|gift|radio|slime|slime/, look: 6 },
  { re: /aurora|nordlicht/, look: 15 },
  { re: /ocean|meer|underwater|tiefsee/, look: 12 },
  { re: /candy|süß|suess|zucker/, look: 5 },
  { re: /mint|hospital|clean|klinik/, look: 13 },
];

function lookForWorld(world: WorldStyle | undefined, seed: number): GameLook {
  const byWorld: Record<string, number[]> = {
    city: [9, 0, 14, 1],
    space: [15, 7, 6, 1],
    candy: [5, 10, 13],
    neon: [15, 1, 7, 6],
    forest: [6, 15, 4],
    temple: [4, 8, 0],
    ocean: [12, 1, 13, 2],
  };
  const pool = (world && byWorld[world]) || [1, 7, 9, 0, 15];
  return ART_LOOKS[pool[seed % pool.length] % ART_LOOKS.length];
}

function ensurePop(player: string, bg: string): string {
  const pl = luminance(player);
  const bl = luminance(bg);
  if (Math.abs(pl - bl) >= 28) return player;
  return shift(player, 0, 8, pl >= bl ? 22 : -22);
}

export function parsePromptColor(lower: string): string | null {
  for (const { re, hex } of COLOR_WORDS) {
    if (re.test(lower)) return hex;
  }
  const raw = lower.match(/#([0-9a-f]{6})\b/);
  if (raw) return `#${raw[1]}`;
  return null;
}

export function composeLook(opts: {
  prompt: string;
  world?: WorldStyle;
  seed: number;
  player?: string;
  obstacle?: string;
  accent?: string;
  bgTop?: string;
  bgBottom?: string;
  ground?: string;
  decor?: string;
}): GameLook {
  const lower = opts.prompt.toLowerCase();
  let base = lookForWorld(opts.world, opts.seed);

  for (const mood of MOOD_WORDS) {
    if (mood.re.test(lower)) {
      base = ART_LOOKS[mood.look];
      break;
    }
  }

  // Prompt-unique hue twist so two "city" games still differ
  const twist = ((opts.seed % 48) - 24) * 1.6;
  base = {
    player: shift(base.player, twist, (opts.seed % 7) - 3, 0),
    obstacle: shift(base.obstacle, twist * 0.4, 0, 0),
    accent: shift(base.accent, twist * 0.5, 0, 2),
    bgTop: shift(base.bgTop, twist * 0.35, 0, 0),
    bgBottom: shift(base.bgBottom, twist * 0.45, 0, 0),
    ground: shift(base.ground, twist * 0.3, 0, 0),
    decor: shift(base.decor, twist * 0.4, 0, 0),
  };

  const named = parsePromptColor(lower);
  if (named) {
    const darkPrompt = /dunkel|dark|nacht|night|schwarz|black/.test(lower);
    const lightPrompt = /hell|bright|tag|day|weiß|weiss|white/.test(lower);
    base.player = named;
    base.accent = shift(named, 12, -10, 18);
    base.obstacle = shift(named, 180, 10, darkPrompt ? 18 : -22);
    if (darkPrompt) {
      base.bgTop = shift(named, 20, -25, -38);
      base.bgBottom = shift(named, 8, -20, -28);
    } else if (lightPrompt) {
      base.bgTop = shift(named, -8, -30, 32);
      base.bgBottom = shift(named, 6, -25, 22);
    } else {
      base.bgTop = shift(named, 16, -15, -34);
      base.bgBottom = shift(named, 4, -8, -18);
    }
    base.ground = shift(base.bgBottom, 0, 5, -8);
    base.decor = shift(named, 8, -20, -12);
  }

  const hex = (v?: string) => (v && /^#[0-9a-fA-F]{6}$/.test(v) ? v : undefined);
  if (hex(opts.player)) base.player = opts.player!;
  if (hex(opts.obstacle)) base.obstacle = opts.obstacle!;
  if (hex(opts.accent)) base.accent = opts.accent!;
  if (hex(opts.bgTop)) base.bgTop = opts.bgTop!;
  if (hex(opts.bgBottom)) base.bgBottom = opts.bgBottom!;
  if (hex(opts.ground)) base.ground = opts.ground!;
  if (hex(opts.decor)) base.decor = opts.decor!;

  base.player = ensurePop(base.player, base.bgBottom);
  return base;
}
