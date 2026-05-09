import type { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/** Fixed UUID used as the test creator's owner_id when running locally
 *  without a real Supabase session. All tests created in dev mode belong
 *  to this user. */
export const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

/** Return the JWT-derived user id, or in dev mode fall back to the fixed
 *  dev user. Returns null in production when the token is missing or
 *  invalid. */
export async function getRequestUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (!error && data.user?.id) return data.user.id;
  }
  if (process.env.NODE_ENV === 'development') return DEV_USER_ID;
  return null;
}
