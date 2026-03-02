import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('tg_access_token')?.value;
  const refreshToken = request.cookies.get('tg_refresh_token')?.value;

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  // Clear cookies immediately (one-time read)
  const response = NextResponse.json({ access_token: accessToken, refresh_token: refreshToken });
  response.cookies.delete('tg_access_token');
  response.cookies.delete('tg_refresh_token');

  return response;
}
