import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

function getClient() {
  const key = process.env.FLW_SECRET_KEY;
  if (!key) throw new Error('FLW_SECRET_KEY is not set');
  const client = axios.create({
    baseURL: 'https://api.flutterwave.com',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    timeout: 15000
  });
  return client;
}

async function createPaymentPlan({ amount_cents, currency }) {
  const client = getClient();
  const amount = (amount_cents / 100).toFixed(2);
  const payload = {
    amount: parseFloat(amount),
    name: `Association Monthly Dues ${amount}-${currency}`,
    interval: 'monthly',
    currency,
    duration: 0
  };
  const res = await client.post('/v3/payment-plans', payload);
  if (!res.data || res.data.status !== 'success') {
    throw new Error('Flutterwave: failed to create payment plan');
  }
  return res.data.data.id;
}

export async function createCheckoutSubscription({ email, name, amount_cents, currency, success_url, cancel_url }) {
  const client = getClient();
  const tx_ref = `dues_${uuidv4()}`;
  const payment_plan = await createPaymentPlan({ amount_cents, currency });
  const payload = {
    tx_ref,
    amount: (amount_cents / 100).toFixed(2),
    currency,
    redirect_url: success_url,
    payment_plan,
    customer: { email, name }
  };
  const res = await client.post('/v3/payments', payload);
  if (!res.data || res.data.status !== 'success') {
    throw new Error('Flutterwave: failed to create hosted payment');
  }
  return { url: res.data.data.link, tx_ref, payment_plan };
}

export function verifyWebhook(headers) {
  const incomingHash = headers['verif-hash'] || headers['Verif-Hash'] || headers['VERIF-HASH'];
  const secret = process.env.FLW_WEBHOOK_SECRET;
  if (!secret) return { verified: false };
  return { verified: incomingHash === secret };
}
