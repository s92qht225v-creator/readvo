/**
 * Tiny sound-effects helper for the flashcard ladder. Synthesizes short tones
 * with the Web Audio API — no audio files to host. Respects a persisted mute
 * flag. Call `unlockSfx()` on the first user gesture so iOS lets it play.
 */

let ctx: AudioContext | null = null;
let muted = false;
try { muted = typeof localStorage !== 'undefined' && localStorage.getItem('blim-fc-muted') === '1'; } catch { /* ignore */ }

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

export function isMuted() { return muted; }
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem('blim-fc-muted', m ? '1' : '0'); } catch { /* ignore */ }
}

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
  if (muted) return;
  tone(660, 0, 0.12, 'sine', 0.16);
  tone(990, 0.085, 0.16, 'sine', 0.16);
}

export function playWrong() {
  if (muted) return;
  tone(196, 0, 0.2, 'sine', 0.18);
  tone(146, 0.06, 0.24, 'sine', 0.14);
}

export function playComplete() {
  if (muted) return;
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.24, 'triangle', 0.15));
}

export const playResult = (ok: boolean) => (ok ? playCorrect() : playWrong());
