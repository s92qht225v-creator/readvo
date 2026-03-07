import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_REASONS = ['pinyin', 'translation', 'audio', 'grammar', 'image', 'other'];

function getSupabaseWithAuth(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { reason?: string; message?: string; pageUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { reason, message, pageUrl } = body;

  if (!reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
  }
  if (!pageUrl || typeof pageUrl !== 'string') {
    return NextResponse.json({ error: 'Missing pageUrl' }, { status: 400 });
  }
  if (message && (typeof message !== 'string' || message.length > 500)) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  const userName = user.user_metadata?.name || 'Unknown';
  const userEmail = user.email || 'no-email';

  const reasonLabels: Record<string, string> = {
    pinyin: 'Pinyin xatosi',
    translation: 'Tarjima xatosi',
    audio: 'Audio xatosi',
    grammar: 'Grammatika xatosi',
    image: 'Rasm xatosi',
    other: 'Boshqa',
  };

  const text = [
    `📝 Xato topildi!`,
    ``,
    `👤 ${userName} (${userEmail})`,
    `📄 ${pageUrl}`,
    `📌 Sabab: ${reasonLabels[reason] || reason}`,
    `💬 ${message?.trim() || '—'}`,
  ].join('\n');

  const botToken = process.env.TELEGRAM_PAYMENT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_PAYMENT_CHAT_ID;

  if (botToken && chatId) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      if (!res.ok) {
        console.error('Telegram API error:', res.status, await res.text());
      }
    } catch (err) {
      console.error('Telegram send failed:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
