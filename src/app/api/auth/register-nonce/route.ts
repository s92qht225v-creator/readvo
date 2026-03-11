import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const admin = getSupabaseAdmin();

    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    const sessionNonce = crypto.randomBytes(16).toString('hex');

    await admin.from('active_sessions').upsert({
      user_id: user.id,
      session_nonce: sessionNonce,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ session_nonce: sessionNonce });
  } catch (err) {
    console.error('Register nonce error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
