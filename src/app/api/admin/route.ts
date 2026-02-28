import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

function verifyPassword(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || password !== adminPassword) return false;
  return true;
}

const PLAN_DAYS: Record<string, number> = {
  '1_month': 30,
  '3_months': 90,
  '6_months': 180,
  '12_months': 365,
};

export async function GET(request: NextRequest) {
  if (!verifyPassword(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();

  const [paymentsRes, subsRes, usersRes] = await Promise.all([
    admin.from('payment_requests').select('*').order('created_at', { ascending: false }),
    admin.from('subscriptions').select('*').order('created_at', { ascending: false }),
    admin.auth.admin.listUsers(),
  ]);

  const payments = paymentsRes.data || [];
  const subscriptions = subsRes.data || [];
  const users = usersRes.data?.users || [];

  const now = new Date();
  const activeSubscriptions = subscriptions.filter(
    (s) => new Date(s.ends_at) > now
  );
  const approvedPayments = payments.filter((p) => p.status === 'approved');
  const totalRevenue = approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return NextResponse.json({
    payments,
    subscriptions,
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.full_name || u.user_metadata?.name || u.email,
      created_at: u.created_at,
    })),
    stats: {
      totalUsers: users.length,
      activeSubscriptions: activeSubscriptions.length,
      totalRevenue,
      pendingPayments: payments.filter((p) => p.status === 'pending').length,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!verifyPassword(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { action } = body;
  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Subscription management actions
  if (action === 'cancel_subscription') {
    const { subscriptionId } = body;
    if (!subscriptionId) return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });

    // Get subscription to find the user
    const { data: sub, error: fetchErr } = await admin
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscriptionId)
      .single();

    if (fetchErr || !sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    // End subscription immediately
    const { error } = await admin
      .from('subscriptions')
      .update({ ends_at: new Date().toISOString() })
      .eq('id', subscriptionId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Set the user's approved payment back to 'cancelled' so it doesn't count in revenue
    await admin
      .from('payment_requests')
      .update({ status: 'cancelled' })
      .eq('user_id', sub.user_id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json({ ok: true });
  }

  if (action === 'add_days' || action === 'remove_days') {
    const { subscriptionId, days } = body;
    if (!subscriptionId || !days) return NextResponse.json({ error: 'Missing subscriptionId or days' }, { status: 400 });

    const { data: sub, error: fetchErr } = await admin
      .from('subscriptions')
      .select('ends_at')
      .eq('id', subscriptionId)
      .single();

    if (fetchErr || !sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    const endsAt = new Date(sub.ends_at);
    endsAt.setDate(endsAt.getDate() + (action === 'add_days' ? days : -days));

    const { error } = await admin
      .from('subscriptions')
      .update({ ends_at: endsAt.toISOString() })
      .eq('id', subscriptionId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'grant_subscription') {
    const { userId, userEmail, plan, days } = body;
    if (!userId || !days) return NextResponse.json({ error: 'Missing userId or days' }, { status: 400 });

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + days);

    const { error } = await admin.from('subscriptions').insert({
      user_id: userId,
      user_email: userEmail || '',
      plan: plan || 'granted',
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'approve') {
    const { paymentId } = body;
    const { data: payment, error: fetchErr } = await admin
      .from('payment_requests')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchErr || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'approved') {
      return NextResponse.json({ error: 'Already approved' }, { status: 400 });
    }

    const days = PLAN_DAYS[payment.plan] || 30;
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + days);

    const { error: subErr } = await admin.from('subscriptions').insert({
      user_id: payment.user_id,
      user_email: payment.user_email,
      plan: payment.plan,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    });

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const { error: updateErr } = await admin
      .from('payment_requests')
      .update({ status: 'approved' })
      .eq('id', paymentId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === 'reject') {
    const { paymentId } = body;
    const { error: updateErr } = await admin
      .from('payment_requests')
      .update({ status: 'rejected' })
      .eq('id', paymentId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
}
