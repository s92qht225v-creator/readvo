/**
 * Build auth headers for API calls. In dev, the server falls back to a
 * fixed dev user when no Authorization header is present, so we omit it
 * cleanly instead of sending `Bearer null`.
 */
export function authHeaders(tok: string | null, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra ?? {}) };
  if (tok) headers.Authorization = `Bearer ${tok}`;
  return headers;
}
