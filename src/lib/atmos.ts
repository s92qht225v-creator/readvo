/**
 * Atmos Payment API client.
 * All requests route through a DigitalOcean nginx proxy (static IP)
 * because Atmos requires whitelisted IPs and Vercel has dynamic IPs.
 */

const PROXY_URL = process.env.ATMOS_PROXY_URL || 'http://209.38.182.56';
const CONSUMER_KEY = process.env.ATMOS_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.ATMOS_CONSUMER_SECRET || '';
const STORE_ID = process.env.ATMOS_STORE_ID || '';
const TERMINAL_ID = process.env.ATMOS_TERMINAL_ID || '';

// Module-level token cache
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/** Get OAuth2 access token (client_credentials grant). Cached until expiry. */
export async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 30_000) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

  const res = await fetch(`${PROXY_URL}/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Atmos token error: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // expires_in is in seconds
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedToken!;
}

/** Create a payment transaction. Amount is in tiyin (UZS * 100). */
export async function createTransaction(amount: number, account: string): Promise<{ transaction_id: number }> {
  const token = await getToken();

  const res = await fetch(`${PROXY_URL}/merchant/pay/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      account,
      store_id: Number(STORE_ID),
      terminal_id: Number(TERMINAL_ID),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Atmos create error: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (data.result?.code !== 'OK') {
    throw new Error(`Atmos create failed: ${JSON.stringify(data.result)}`);
  }
  return { transaction_id: data.transaction_id };
}

/** Pre-apply: send card details, triggers OTP SMS to cardholder. */
export async function preApply(transactionId: number, cardNumber: string, expiry: string): Promise<void> {
  const token = await getToken();

  const res = await fetch(`${PROXY_URL}/merchant/pay/pre-apply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction_id: transactionId,
      card_number: cardNumber,
      expiry,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Atmos pre-apply error: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (data.result?.code !== 'OK') {
    throw new Error(`Atmos pre-apply failed: ${JSON.stringify(data.result)}`);
  }
}

/** Apply: confirm payment with OTP code. */
export async function apply(transactionId: number, otp: string): Promise<void> {
  const token = await getToken();

  const res = await fetch(`${PROXY_URL}/merchant/pay/apply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction_id: transactionId,
      otp,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Atmos apply error: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (data.result?.code !== 'OK') {
    throw new Error(`Atmos apply failed: ${JSON.stringify(data.result)}`);
  }
}
