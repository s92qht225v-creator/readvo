import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_PAYMENT_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_PAYMENT_CHAT_ID!;

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

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

async function sendTelegramNotification(
  email: string,
  plan: string,
  amount: number,
  screenshotUrl: string
) {
  const planLabels: Record<string, string> = {
    '1_month': '1 oy',
    '3_months': '3 oy',
    '6_months': '6 oy',
    '12_months': '12 oy',
  };

  const formattedAmount = amount.toLocaleString('uz-UZ').replace(/,/g, ' ');
  const message = `💳 Yangi to'lov!\n\n👤 ${email}\n📦 ${planLabels[plan] || plan}\n💰 ${formattedAmount} so'm\n📸 ${screenshotUrl}`;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    }),
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);
  if (!supabase) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const formData = await request.formData();
  const plan = formData.get('plan') as string;
  const amount = parseInt(formData.get('amount') as string, 10);
  const screenshot = formData.get('screenshot') as File;

  if (!plan || !amount || !screenshot) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Upload screenshot using admin client (bypasses RLS)
  const admin = getSupabaseAdmin();
  const timestamp = Date.now();
  const ext = screenshot.name.split('.').pop() || 'jpg';
  const path = `${user.id}/${timestamp}.${ext}`;

  const { data: uploadData, error: uploadError } = await admin.storage
    .from('payments')
    .upload(path, screenshot, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from('payments').getPublicUrl(uploadData.path);
  const screenshotUrl = urlData.publicUrl;

  // Insert payment request
  const { error: dbError } = await admin
    .from('payment_requests')
    .insert({
      user_id: user.id,
      user_email: user.email,
      plan,
      amount,
      screenshot_url: screenshotUrl,
    });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Send Telegram notification (non-blocking)
  sendTelegramNotification(user.email!, plan, amount, screenshotUrl).catch(() => {});

  return NextResponse.json({ ok: true });
}
