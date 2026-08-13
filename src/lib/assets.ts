/** Client-side asset validation + copyright safety helpers. */

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

export const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "audio/webm",
  "audio/x-wav",
]);

/** Soft heuristics — not legal advice; nudges creators away from obvious third-party IP. */
const RISKY_PATTERNS: RegExp[] = [
  /\b(disney|marvel|pokemon|nintendo|mario|sonic|fortnite|minecraft|roblox|tiktok|instagram|nike|adidas|gucci|lv|louis\s*vuitton)\b/i,
  /\b(taylor\s*swift|drake|beyonc[eé]|billie\s*eilish|bad\s*bunny|spotify\s*hit)\b/i,
  /\b(star\s*wars|harry\s*potter|spiderman|spider-man|batman|avengers|frozen)\b/i,
  /\b(official\s*soundtrack|copyrighted|leaked\s*album)\b/i,
];

export function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.has(file.type)) return "Use JPG, PNG, WebP, or GIF images only.";
  if (file.size > MAX_IMAGE_BYTES) return "Images must be under 3 MB.";
  return null;
}

export function validateAudioFile(file: File): string | null {
  if (!AUDIO_TYPES.has(file.type) && !/\.(mp3|wav|ogg|m4a|webm)$/i.test(file.name)) {
    return "Use MP3, WAV, OGG, or M4A audio only.";
  }
  if (file.size > MAX_AUDIO_BYTES) return "Audio must be under 5 MB.";
  return null;
}

export function copyrightRiskHint(...texts: Array<string | null | undefined>): string | null {
  const blob = texts.filter(Boolean).join(" ");
  for (const re of RISKY_PATTERNS) {
    if (re.test(blob)) {
      return "This looks like it may reference protected brands, characters, or music. Only upload media you own or have a license to use.";
    }
  }
  return null;
}

export const RIGHTS_COPY = {
  title: "Rights & copyright",
  body: "Only upload images and music you created yourself, that you have a license for, or that are clearly free to use (e.g. CC0 / public domain). Do not upload commercial songs, movie/game characters, brand logos, or other people’s photos without permission.",
  checkbox:
    "I confirm I have the rights to publish these assets and that they do not infringe copyright or trademarks.",
};
