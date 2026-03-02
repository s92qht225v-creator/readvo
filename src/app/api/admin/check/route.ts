import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiter: max 5 failed attempts per IP, 15-minute window
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  const ip = getRateLimitKey(request);
  const now = Date.now();

  // Check rate limit
  const entry = failedAttempts.get(ip);
  if (entry && now < entry.resetAt && entry.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const { password } = await request.json();

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || password !== adminPassword) {
    // Track failed attempt
    if (entry && now < entry.resetAt) {
      entry.count++;
    } else {
      failedAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }
    return NextResponse.json({ isAdmin: false });
  }

  // Success — clear failed attempts
  failedAttempts.delete(ip);
  return NextResponse.json({ isAdmin: true });
}
