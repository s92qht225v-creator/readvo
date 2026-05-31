import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { signAudioToken, AUDIO_TOKEN_TTL_SEC } from '@/lib/audio/token';

/**
 * GET /api/audio/token — issue a short-lived token for the learning-audio
 * proxy. Login-gated (valid Supabase JWT). The token is scoped to the
 * private `audio` bucket only, so it can't be used to fetch test audio.
 *
 * Test-app audio uses a separate `test-audio`-scoped token minted
 * server-side in the public test payload (no login needed there).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const userId = jwt ? getUserIdFromJWT(jwt) : null;
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const token = signAudioToken('audio');
  return NextResponse.json({ token, expiresIn: AUDIO_TOKEN_TTL_SEC });
}
