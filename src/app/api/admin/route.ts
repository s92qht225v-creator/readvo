import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { copyMarketplaceTestToBuyer } from '@/lib/test/marketplaceCopy';

// In-memory IP brute-force guard for the admin password — mirrors the limiter
// on /api/admin/check so the main route can't be used to sidestep the lockout.
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function clientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function isRateLimited(request: NextRequest): boolean {
  const entry = failedAttempts.get(clientIp(request));
  return !!(entry && Date.now() < entry.resetAt && entry.count >= MAX_ATTEMPTS);
}

function verifyPassword(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  const adminPassword = process.env.ADMIN_PASSWORD;
  const ok = !!adminPassword && password === adminPassword;
  const ip = clientIp(request);
  if (!ok) {
    const now = Date.now();
    const entry = failedAttempts.get(ip);
    if (entry && now < entry.resetAt) entry.count++;
    else failedAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    failedAttempts.delete(ip);
  }
  return ok;
}

const PLAN_DAYS: Record<string, number> = {
  '1_month': 30,
  '3_months': 90,
  '6_months': 180,
  '12_months': 365,
};

export async function GET(request: NextRequest) {
  if (isRateLimited(request)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }
  if (!verifyPassword(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();

  const [paymentsRes, subsRes, progressRes] = await Promise.all([
    admin.from('payment_requests').select('*').order('created_at', { ascending: false }),
    admin.from('subscriptions').select('*').order('created_at', { ascending: false }),
    admin.from('active_sessions').select('user_id, updated_at'),
  ]);

  // Paginate through all users (capped at 10,000 to prevent unbounded fetching)
  const allUsers = [];
  let page = 1;
  const MAX_USERS = 10_000;
  while (allUsers.length < MAX_USERS) {
    const { data: { users: batch } } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    allUsers.push(...batch);
    if (batch.length < 1000) break;
    page++;
  }

  const payments = paymentsRes.data || [];
  const subscriptions = subsRes.data || [];
  const users = allUsers;

  // Build last_active map: user_id → updated_at from active_sessions
  const lastActiveMap = new Map<string, string>();
  for (const row of progressRes.data || []) {
    lastActiveMap.set(row.user_id, row.updated_at);
  }

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
      username: u.user_metadata?.preferred_username || '',
      created_at: u.created_at,
      last_active: lastActiveMap.get(u.id) || null,
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
  if (isRateLimited(request)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }
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
    if (typeof days !== 'number' || !Number.isInteger(days) || days < 1 || days > 3650) {
      return NextResponse.json({ error: 'days must be an integer between 1 and 3650' }, { status: 400 });
    }

    const { data: sub, error: fetchErr } = await admin
      .from('subscriptions')
      .select('ends_at')
      .eq('id', subscriptionId)
      .single();

    if (fetchErr || !sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    const endsAt = new Date(sub.ends_at);
    endsAt.setDate(endsAt.getDate() + (action === 'add_days' ? days : -days));

    // Prevent setting end date to more than 10 years in the future
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 10);
    if (endsAt > maxDate) {
      return NextResponse.json({ error: 'Resulting end date too far in the future' }, { status: 400 });
    }

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
    if (typeof days !== 'number' || !Number.isInteger(days) || days < 1 || days > 3650) {
      return NextResponse.json({ error: 'days must be an integer between 1 and 3650' }, { status: 400 });
    }

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

    /* Marketplace purchase: duplicate the source test into the
       buyer's workspace + link the copy back to the payment row.
       No subscription is created (the buyer owns the test outright). */
    if (payment.kind === 'marketplace_test') {
      if (!payment.marketplace_source_test_id) {
        return NextResponse.json({ error: 'Payment is marketplace but missing source test id' }, { status: 400 });
      }
      const copy = await copyMarketplaceTestToBuyer(
        admin,
        payment.marketplace_source_test_id,
        payment.user_id,
        payment.marketplace_workspace_id ?? null,
      );
      if (!copy) {
        return NextResponse.json({ error: 'Failed to duplicate marketplace test' }, { status: 500 });
      }
      const { error: updateErr } = await admin
        .from('payment_requests')
        .update({ status: 'approved', marketplace_copy_test_id: copy.id })
        .eq('id', paymentId);
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, copyTestId: copy.id, copySlug: copy.slug });
    }

    /* Default flow: subscription payment. Grants PLAN_DAYS days from now. */
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

  if (action === 'delete_payment') {
    const { paymentId } = body;
    if (!paymentId) return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });

    // Best-effort: remove the screenshot from the `payments` storage bucket too.
    const { data: p } = await admin
      .from('payment_requests')
      .select('screenshot_url')
      .eq('id', paymentId)
      .single();
    const m = p?.screenshot_url?.match(/\/payments\/(.+)$/);
    if (m) {
      await admin.storage.from('payments').remove([decodeURIComponent(m[1])]).catch(() => {});
    }

    const { error } = await admin.from('payment_requests').delete().eq('id', paymentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
