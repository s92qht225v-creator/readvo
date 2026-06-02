/**
 * Tiny singleton so only ONE audio element plays at a time across the test
 * player — the section / listening-track bar and any per-question audio clip
 * are otherwise independent and would overlap. Whichever audio starts last
 * becomes "active" and pauses the previously-active one.
 *
 * `isActiveAudio` lets the play-once "no pause" guards tell an intentional
 * OS/media-key pause (resume it) from a coordinator pause (leave it paused —
 * something else is playing now), so the two don't fight over playback.
 */
let activeEl: HTMLAudioElement | null = null;

/** Mark `el` as the audio that's now playing; pause any other active one. */
export function claimAudioPlayback(el: HTMLAudioElement): void {
  if (activeEl && activeEl !== el && !activeEl.paused) {
    activeEl.pause();
  }
  activeEl = el;
}

/** True if `el` is the most-recently-started audio (still the active one). */
export function isActiveAudio(el: HTMLAudioElement): boolean {
  return activeEl === el;
}

/** Drop `el` from the active slot (on unmount) so a stale ref isn't held. */
export function releaseAudio(el: HTMLAudioElement): void {
  if (activeEl === el) activeEl = null;
}
