export type GeneratedGameDraft = {
  title: string;
  description: string;
  theme: "neon" | "purple-pipes" | "city" | "candy" | "monster";
  duration_seconds: number;
};

/** Local prompt → game draft (works without external AI keys). */
export function generateGameFromPrompt(prompt: string): GeneratedGameDraft {
  const idea = prompt.trim().replace(/\s+/g, " ");
  const lower = idea.toLowerCase();

  let theme: GeneratedGameDraft["theme"] = "neon";
  if (/candy|sugar|sweet|pink|lolli/.test(lower)) theme = "candy";
  else if (/city|gta|street|car|crime|urban/.test(lower)) theme = "city";
  else if (/flappy|pipe|bird|fly|neon|space/.test(lower)) theme = "purple-pipes";
  else if (/monster|pet|creature|boss|battle/.test(lower)) theme = "monster";

  let duration_seconds = 30;
  if (/60|minute|long/.test(lower)) duration_seconds = 60;
  else if (/10|quick|short|blitz/.test(lower)) duration_seconds = 15;
  else if (/45|medium/.test(lower)) duration_seconds = 45;
  else if (/20/.test(lower)) duration_seconds = 20;

  const firstSentence =
    idea
      .split(/[.!?\n]/)
      .map((s) => s.trim())
      .find(Boolean) || "Untitled Moment";

  let title = firstSentence.slice(0, 48);
  if (/flappy/.test(lower) && !/flappy/i.test(title)) title = `Flappy ${title}`.slice(0, 48);
  if (/3d/.test(lower) && !/^3d/i.test(title)) title = `3D ${title}`.slice(0, 48);

  const description =
    idea.length > 12
      ? idea.slice(0, 180)
      : `A ${duration_seconds}s playable moment: ${idea || "your idea"}.`;

  return { title, description, theme, duration_seconds };
}
