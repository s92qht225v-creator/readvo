import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

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

async function verifyAdmin(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) return null;
  return user;
}

const PLAN_MONTHS: Record<string, number> = {
  '1_month': 1,
  '3_months': 3,
  '6_months': 6,
  '12_months': 12,
};

export async function GET(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) {
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
  const user = await verifyAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { action, paymentId } = await request.json();
  if (!action || !paymentId) {
    return NextResponse.json({ error: 'Missing action or paymentId' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  if (action === 'approve') {
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

    const months = PLAN_MONTHS[payment.plan] || 1;
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + months);

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
    const { error: updateErr } = await admin
      .from('payment_requests')
      .update({ status: 'rejected' })
      .eq('id', paymentId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
