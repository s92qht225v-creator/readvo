import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUserIdFromJWT } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ subscription: null });
  }

  // Decode JWT locally (~0ms) instead of admin.auth.getUser() (~1-2s remote call)
  const userId = getUserIdFromJWT(token);
  if (!userId) {
    return NextResponse.json({ subscription: null });
  }

  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('id, plan, starts_at, ends_at')
    .eq('user_id', userId)
    .gt('ends_at', now)
    .order('ends_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ subscription: subscription || null });
}
