import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUserIdFromJWT } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { nonce } = await request.json();
    if (!nonce) {
      return NextResponse.json({ valid: false });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ valid: false });
    }

    // Decode JWT locally — skip expiration check because the nonce comparison
    // is the actual auth mechanism. Expired tokens on backgrounded/mobile tabs
    // would otherwise cause false kicks.
    const userId = getUserIdFromJWT(authHeader.slice(7), { skipExpiration: true });
    if (!userId) {
      return NextResponse.json({ valid: false });
    }

    const admin = getSupabaseAdmin();
    const { data: row } = await admin.from('active_sessions')
      .select('session_nonce')
      .eq('user_id', userId)
      .maybeSingle();

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

    const userId = getUserIdFromJWT(authHeader.slice(7), { skipExpiration: true });
    if (!userId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    await admin.from('active_sessions').delete().eq('user_id', userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
