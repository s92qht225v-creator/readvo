import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

async function sendTelegramNotification(
  email: string,
  plan: string,
  amount: number,
  screenshotUrl: string
) {
  const botToken = process.env.TELEGRAM_PAYMENT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_PAYMENT_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram env vars missing:', { botToken: !!botToken, chatId: !!chatId });
    return;
  }

  const planLabels: Record<string, string> = {
    '1_month': '1 oy',
    '3_months': '3 oy',
    '6_months': '6 oy',
    '12_months': '12 oy',
  };

  const formattedAmount = amount.toLocaleString('uz-UZ').replace(/,/g, ' ');
  const message = `💳 Yangi to'lov!\n\n👤 ${email}\n📦 ${planLabels[plan] || plan}\n💰 ${formattedAmount} so'm\n📸 ${screenshotUrl}`;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error: ${res.status} ${body}`);
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Verify the JWT signature with Supabase (not a local decode) — this creates
  // financial records + Telegram notifications, so the identity must be real
  // and not a forgeable client-supplied token. getUser() only validates the
  // token; it does not mutate the shared admin client's session.
  const { data: authData, error: authErr } = await getSupabaseAdmin().auth.getUser(token);
  const user = authData?.user;
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const formData = await request.formData();
  const planVal = formData.get('plan');
  const amountVal = formData.get('amount');
  const screenshotVal = formData.get('screenshot');
  /* Optional fields for the marketplace flow. When `kind` is
     'marketplace_test' the row is recorded with the source test id,
     and admin approval (in /api/admin) duplicates that test into the
     buyer's workspace instead of granting a subscription. */
  const kindVal = formData.get('kind');
  const marketplaceTestIdVal = formData.get('marketplaceTestId');
  /* Buyer-chosen workspace for the copy (optional). Stored on the
     payment request and used at admin-approval time. */
  const marketplaceWorkspaceIdVal = formData.get('marketplaceWorkspaceId');

  if (typeof planVal !== 'string' || typeof amountVal !== 'string' || !(screenshotVal instanceof File)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  const plan = planVal;
  const amount = parseInt(amountVal, 10);
  const screenshot = screenshotVal;
  const kind = typeof kindVal === 'string' && kindVal === 'marketplace_test'
    ? 'marketplace_test'
    : 'subscription';
  const marketplaceTestId = typeof marketplaceTestIdVal === 'string' && marketplaceTestIdVal
    ? marketplaceTestIdVal
    : null;
  const marketplaceWorkspaceId = typeof marketplaceWorkspaceIdVal === 'string' && marketplaceWorkspaceIdVal
    ? marketplaceWorkspaceIdVal
    : null;

  if (!plan || isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid plan or amount' }, { status: 400 });
  }

  if (kind === 'marketplace_test' && !marketplaceTestId) {
    return NextResponse.json({ error: 'marketplaceTestId required for marketplace purchase' }, { status: 400 });
  }

  // Validate file type
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const ext = (screenshot.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.includes(screenshot.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }
  if (screenshot.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  // Upload screenshot using admin client (bypasses RLS)
  const admin = getSupabaseAdmin();

  const timestamp = Date.now();
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
      kind,
      marketplace_source_test_id: marketplaceTestId,
      marketplace_workspace_id: marketplaceWorkspaceId,
    });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Send Telegram notification — retry once on failure
  try {
    await sendTelegramNotification(user.email!, plan, amount, screenshotUrl);
  } catch {
    try {
      await sendTelegramNotification(user.email!, plan, amount, screenshotUrl);
    } catch (err) {
      console.error('Telegram notification failed after retry:', err);
      return NextResponse.json({ ok: true, warning: 'notification_failed' });
    }
  }

  return NextResponse.json({ ok: true });
}
