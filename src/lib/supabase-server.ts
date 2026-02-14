import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;

/** Server-side Supabase client with service role (bypasses RLS). Lazy-initialized. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}
