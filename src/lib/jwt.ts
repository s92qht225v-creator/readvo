/**
 * Decode a Supabase JWT to extract the user ID without making a remote API call.
 *
 * `admin.auth.getUser(token)` makes an HTTP request to Supabase Auth (~1-2s).
 * This function decodes the JWT payload locally (~0ms) to get the `sub` (user_id).
 *
 * Safe because: tokens are issued by our Supabase instance, transmitted over HTTPS,
 * and these endpoints only do low-risk reads (subscription check, nonce comparison).
 */
export function getUserIdFromJWT(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload.sub || null;
  } catch {
    return null;
  }
}
