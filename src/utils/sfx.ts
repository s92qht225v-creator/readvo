/**
 * Tiny sound-effects helper for the flashcard ladder. Synthesizes short tones
 * with the Web Audio API — no audio files to host. There is no in-app mute:
 * the device's own volume/silent switch is the control (a stored mute flag with
 * no UI to clear it would have silenced users permanently). Call `unlockSfx()`
 * on the first user gesture so iOS lets it play.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function unlockSfx() { getCtx(); }

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.15) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

export function playCorrect() {
  // Soft harp strum (C–E–G chord, slightly staggered).
  tone(523, 0, 0.5, 'sine', 0.1);
  tone(659, 0.03, 0.5, 'sine', 0.1);
  tone(784, 0.06, 0.5, 'sine', 0.1);
}

export function playWrong() {
  // Triple soft thud — three quick low thumps.
  tone(150, 0, 0.1, 'sine', 0.18);
  tone(150, 0.12, 0.1, 'sine', 0.16);
  tone(150, 0.24, 0.13, 'sine', 0.14);
}

export function playComplete() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.24, 'triangle', 0.15));
}

export const playResult = (ok: boolean) => (ok ? playCorrect() : playWrong());
