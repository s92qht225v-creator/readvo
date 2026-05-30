import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;

function serviceRoleCreds(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return { url, key };
}

/** Server-side Supabase client with service role (bypasses RLS). Lazy-initialized
 *  SINGLETON shared by all API routes for DB access.
 *
 *  CRITICAL: never call session-mutating auth methods on this client —
 *  `verifyOtp`, `setSession`, `signInWith*`. Those store the resulting USER
 *  session in the client's in-memory state, which overwrites the
 *  Authorization header for every subsequent `.from(...)` DB call with that
 *  user's access token. After Supabase's asymmetric-JWT (ES256) migration a
 *  polluted singleton sends an ES256 user token PostgREST cannot validate, so
 *  every later admin DB operation silently degrades to the `anon` role and
 *  RLS-protected writes/reads fail (creates rejected, owner-scoped lists come
 *  back empty). For those operations use `createSupabaseAuthClient()` instead. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const { url, key } = serviceRoleCreds();
    _supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

/** Fresh (NON-singleton) service-role client for auth/session operations
 *  that set a user session on the client — i.e. `verifyOtp`. Each call
 *  returns a throwaway client so the user session it ends up holding is
 *  discarded with the request and never leaks into the shared
 *  `getSupabaseAdmin()` singleton used for DB access. See the warning on
 *  getSupabaseAdmin for why this separation is mandatory. */
export function createSupabaseAuthClient(): SupabaseClient {
  const { url, key } = serviceRoleCreds();
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
