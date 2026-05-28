/**
 * Stable per-test respondent token, persisted in localStorage. The same
 * token MUST be used when opening a session (POST /session) and when
 * submitting (POST /responses) — the server matches the session row by
 * (id, test_id, respondent_token), so a mismatch yields
 * `session_not_found`. Keep this the single source of truth for the
 * token across the player and the page.
 */
const TOKEN_KEY_PREFIX = 'blim-test-token:';

export function ensureRespondentToken(slug: string): string {
  if (typeof window === 'undefined') {
    return `${Math.random().toString(36).slice(2)}-${Date.now()}`;
  }
  const key = TOKEN_KEY_PREFIX + slug;
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const fresh = `${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}-${Date.now()}`;
    localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    /* private mode / storage disabled — ephemeral token for this load */
    return `${Math.random().toString(36).slice(2)}-${Date.now()}`;
  }
}
