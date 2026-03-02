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
    const { data: { user }, error } = await admin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ valid: false });
    }

    // Compare nonce with the one stored in user_metadata
    const serverNonce = user.user_metadata?.session_nonce;
    return NextResponse.json({ valid: serverNonce === nonce });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
