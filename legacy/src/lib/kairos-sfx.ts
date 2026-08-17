/** Tiny original Kairos SFX (procedural) — safe, no third-party samples. */

function beep(freq: number, duration = 0.08, type: OscillatorType = "square", vol = 0.08) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
    window.setTimeout(() => void ctx.close(), (duration + 0.05) * 1000);
  } catch {
    /* ignore */
  }
}

export const kairosSfx = {
  flap: () => beep(520, 0.05, "square", 0.06),
  score: () => {
    beep(660, 0.05, "triangle", 0.07);
    window.setTimeout(() => beep(880, 0.07, "triangle", 0.06), 50);
  },
  fail: () => beep(140, 0.18, "sawtooth", 0.07),
  tap: () => beep(740, 0.04, "sine", 0.05),
};
