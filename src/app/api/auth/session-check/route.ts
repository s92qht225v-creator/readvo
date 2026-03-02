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

    // First get user ID from the JWT
    const { data: { user: jwtUser }, error } = await admin.auth.getUser(token);
    if (error || !jwtUser) {
      return NextResponse.json({ valid: false });
    }

    // Then fetch fresh user_metadata from database (not from JWT claims)
    const { data: { user: dbUser }, error: dbError } = await admin.auth.admin.getUserById(jwtUser.id);
    if (dbError || !dbUser) {
      return NextResponse.json({ valid: false });
    }

    // Compare nonce with the one stored in database
    const serverNonce = dbUser.user_metadata?.session_nonce;
    return NextResponse.json({ valid: serverNonce === nonce });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
