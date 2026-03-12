import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ subscription: null });
  }

  const admin = getSupabaseAdmin();

  // Use admin client to verify JWT — avoids creating a per-request anon client
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ subscription: null });
  }

  const now = new Date().toISOString();
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('id, plan, starts_at, ends_at')
    .eq('user_id', user.id)
    .gt('ends_at', now)
    .order('ends_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ subscription: subscription || null });
}
