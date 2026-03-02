import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { nonce } = await request.json();
    if (!nonce) {
      return NextResponse.json({ valid: false });
    }

    // Get user from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ valid: false });
    }

    const token = authHeader.slice(7);
    const admin = getSupabaseAdmin();

    // Get user ID from the JWT
    const { data: { user: jwtUser }, error } = await admin.auth.getUser(token);
    if (error || !jwtUser) {
      return NextResponse.json({ valid: false });
    }

    // Compare nonce with the one stored in active_sessions table
    const { data: row } = await admin.from('active_sessions')
      .select('session_nonce')
      .eq('user_id', jwtUser.id)
      .single();

    return NextResponse.json({ valid: row?.session_nonce === nonce });
  } catch {
    return NextResponse.json({ valid: false });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const admin = getSupabaseAdmin();

    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    await admin.from('active_sessions').delete().eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
