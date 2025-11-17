import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

function getClient() {
  const accessToken = process.env.GOCARDLESS_ACCESS_TOKEN;
  if (!accessToken) throw new Error('GOCARDLESS_ACCESS_TOKEN is not set');
  const env = (process.env.GOCARDLESS_ENV || 'sandbox').toLowerCase();
  const baseURL = env === 'live' ? 'https://api.gocardless.com' : 'https://api-sandbox.gocardless.com';
  const instance = axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'GoCardless-Version': '2015-07-06',
      'Content-Type': 'application/json'
    },
    timeout: 15000
  });
  instance.interceptors.request.use((config) => {
    config.headers['Idempotency-Key'] = uuidv4();
    return config;
  });
  return instance;
}

export async function createRedirectFlowSubscription({ description, session_token, success_url }) {
  const client = getClient();
  const payload = {
    redirect_flows: {
      description: description || 'Association monthly dues',
      session_token,
      success_redirect_url: success_url
    }
  };
  const res = await client.post('/redirect_flows', payload);
  const rf = res.data?.redirect_flows;
  if (!rf) throw new Error('GoCardless: failed to create redirect flow');
  return { redirect_url: rf.redirect_url, redirect_flow_id: rf.id };
}

export async function completeRedirectFlowAndCreateSubscription({ redirect_flow_id, session_token, amount_cents, currency }) {
  const client = getClient();
  const res = await client.post(`/redirect_flows/${redirect_flow_id}/actions/complete`, {
    data: { session_token }
  });
  const rf = res.data?.redirect_flows;
  if (!rf?.links?.mandate) throw new Error('GoCardless: missing mandate after completion');
  const mandateId = rf.links.mandate;
  const today = new Date();
  const start_date = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const subRes = await client.post('/subscriptions', {
    subscriptions: {
      amount: amount_cents,
      currency,
      interval_unit: 'monthly',
      interval: 1,
      start_date,
      links: { mandate: mandateId },
      metadata: { source: 'association-platform' }
    }
  });
  const sub = subRes.data?.subscriptions;
  if (!sub?.id) throw new Error('GoCardless: failed to create subscription');
  return { provider_subscription_id: sub.id };
}

export function verifyWebhook(headers, rawBody) {
  const secret = process.env.GOCARDLESS_WEBHOOK_SECRET;
  if (!secret) return { verified: false };
  const sigHeader = headers['webhook-signature'] || headers['Webhook-Signature'] || '';
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return { verified: crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigHeader)) };
}
