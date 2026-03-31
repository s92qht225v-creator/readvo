import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUserFromJWT } from '@/lib/jwt';
import { createTransaction, preApply, apply } from '@/lib/atmos';

const PLAN_AMOUNTS: Record<string, number> = {
  '1_month': 5_000_000,    // 50,000 UZS in tiyin
  '3_months': 12_900_000,  // 129,000 UZS
  '6_months': 22_900_000,  // 229,000 UZS
  '12_months': 39_900_000, // 399,000 UZS
};

const PLAN_DAYS: Record<string, number> = {
  '1_month': 30,
  '3_months': 90,
  '6_months': 180,
  '12_months': 365,
};

async function sendTelegramNotification(email: string, plan: string, amount: number) {
  const botToken = process.env.TELEGRAM_PAYMENT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_PAYMENT_CHAT_ID;
  if (!botToken || !chatId) return;

  const planLabels: Record<string, string> = {
    '1_month': '1 oy', '3_months': '3 oy', '6_months': '6 oy', '12_months': '12 oy',
  };

  const formattedAmount = amount.toLocaleString('uz-UZ').replace(/,/g, ' ');
  const message = `✅ Atmos to'lov!\n\n👤 ${email}\n📦 ${planLabels[plan] || plan}\n💰 ${formattedAmount} so'm\n🔄 Avtomatik faollashtirildi`;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
  } catch {
    // Non-blocking — payment already succeeded
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const user = getUserFromJWT(token);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  // ─── Action: create ───
  // Creates Atmos transaction + pre-apply (sends OTP to cardholder)
  if (action === 'create') {
    const { plan, cardNumber, expiry } = body;

    if (!plan || !PLAN_AMOUNTS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Validate card number: 16 digits
    const cleanCard = (cardNumber || '').replace(/\s/g, '');
    if (!/^\d{16}$/.test(cleanCard)) {
      return NextResponse.json({ error: 'Invalid card number' }, { status: 400 });
    }

    // Validate expiry: MM/YY
    if (!/^\d{2}\/\d{2}$/.test(expiry || '')) {
      return NextResponse.json({ error: 'Invalid expiry' }, { status: 400 });
    }

    const amount = PLAN_AMOUNTS[plan];

    try {
      // Step 1: Create transaction
      const { transaction_id } = await createTransaction(amount, user.id);

      // Step 2: Pre-apply (sends OTP SMS)
      await preApply(transaction_id, cleanCard, expiry);

      // Save to DB
      const admin = getSupabaseAdmin();
      await admin.from('payment_requests').insert({
        user_id: user.id,
        user_email: user.email,
        plan,
        amount: amount / 100, // Store in UZS, not tiyin
        status: 'otp_pending',
        atmos_transaction_id: transaction_id,
      });

      return NextResponse.json({ transaction_id });
    } catch (err) {
      console.error('Atmos create/pre-apply error:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Payment initialization failed' },
        { status: 502 }
      );
    }
  }

  // ─── Action: confirm ───
  // Confirms payment with OTP code
  if (action === 'confirm') {
    const { transaction_id, otp } = body;

    if (!transaction_id || !otp) {
      return NextResponse.json({ error: 'Missing transaction_id or otp' }, { status: 400 });
    }

    // Validate OTP: 6 digits
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Verify this transaction belongs to the user
    const { data: payment } = await admin
      .from('payment_requests')
      .select('*')
      .eq('atmos_transaction_id', transaction_id)
      .eq('user_id', user.id)
      .eq('status', 'otp_pending')
      .maybeSingle();

    if (!payment) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    try {
      // Step 3: Apply (confirm with OTP)
      await apply(transaction_id, otp);

      // Create subscription
      const days = PLAN_DAYS[payment.plan] || 30;
      const startsAt = new Date();
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + days);

      const { error: subErr } = await admin.from('subscriptions').insert({
        user_id: user.id,
        user_email: user.email,
        plan: payment.plan,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      });

      if (subErr) {
        console.error('Subscription insert error:', subErr);
        return NextResponse.json({ error: 'Payment succeeded but subscription creation failed. Contact support.' }, { status: 500 });
      }

      // Update payment request status
      await admin
        .from('payment_requests')
        .update({ status: 'approved' })
        .eq('id', payment.id);

      // Send Telegram notification (non-blocking)
      sendTelegramNotification(user.email || '', payment.plan, payment.amount);

      return NextResponse.json({
        ok: true,
        plan: payment.plan,
        ends_at: endsAt.toISOString(),
      });
    } catch (err) {
      console.error('Atmos apply error:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Payment confirmation failed' },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
