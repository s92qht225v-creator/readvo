import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ subscription: null });
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ subscription: null });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, serviceKey);

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
