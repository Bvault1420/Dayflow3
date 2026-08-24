/** First-party Kairos art packs — safe to use, no third-party copyright. */

export type FreePack = {
  id: string;
  label: string;
  player_image: string;
  bg_image: string;
};

function svgData(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function playerOrb(fill: string, accent: string): string {
  return svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <radialGradient id="g" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${fill}"/>
    </radialGradient>
  </defs>
  <circle cx="64" cy="64" r="54" fill="url(#g)"/>
  <circle cx="78" cy="52" r="10" fill="#0e1621" opacity="0.85"/>
  <path d="M40 78 Q64 96 88 78" stroke="#0e1621" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.7"/>
</svg>`);
}

function bgBlocks(c1: string, c2: string, c3: string): string {
  return svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="360" height="640" fill="url(#bg)"/>
  <g opacity="0.35" fill="${c3}">
    <rect x="24" y="80" width="48" height="140" rx="10"/>
    <rect x="260" y="140" width="56" height="180" rx="10"/>
    <rect x="120" y="320" width="40" height="120" rx="8"/>
    <rect x="200" y="420" width="70" height="90" rx="10"/>
  </g>
</svg>`);
}

/** Tiny procedural loop (beeps) — original Kairos audio, not a commercial track. */
export function makeKairosPulseWav(): string {
  const sampleRate = 22050;
  const seconds = 2;
  const n = sampleRate * seconds;
  const data = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const env = Math.max(0, 1 - ((t % 0.5) / 0.5));
    const tone = Math.sin(2 * Math.PI * 220 * t) * 0.25 + Math.sin(2 * Math.PI * 330 * t) * 0.12;
    data[i] = tone * env * 0.5;
  }
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, n * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export const FREE_PACKS: FreePack[] = [
  {
    id: "neon-orb",
    label: "Neon Orb",
    player_image: playerOrb("#2457ff", "#7CFFB2"),
    bg_image: bgBlocks("#0a1224", "#1a2a55", "#4aa3ff"),
  },
  {
    id: "candy-blob",
    label: "Candy Blob",
    player_image: playerOrb("#ff7ab6", "#ffe0f0"),
    bg_image: bgBlocks("#3a0a28", "#7a1048", "#ff9ad5"),
  },
  {
    id: "city-bot",
    label: "City Bot",
    player_image: playerOrb("#4aa3ff", "#ff6a3d"),
    bg_image: bgBlocks("#0d1b2a", "#1b3a4b", "#7aa0b8"),
  },
  {
    id: "monster-dot",
    label: "Monster Dot",
    player_image: playerOrb("#b6ff4a", "#f4ffe8"),
    bg_image: bgBlocks("#102008", "#2f4a12", "#7bb52e"),
  },
];
