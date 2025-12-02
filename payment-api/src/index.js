import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import axios from 'axios';
import { initDb, query } from './db.js';
import { createCheckoutSubscription as stripeCreateCheckout, verifyWebhook as stripeVerify } from './providers/stripe.js';
import { createCheckoutSubscription as flwCreateCheckout, verifyWebhook as flwVerify } from './providers/flutterwave.js';
import { createRedirectFlowSubscription as gcCreateRedirect, completeRedirectFlowAndCreateSubscription as gcComplete, verifyWebhook as gcVerify } from './providers/gocardless.js';
import { startScheduler } from './scheduler.js';

dotenv.config();
const logger = pino();

const app = express();
const port = process.env.PORT || 3000;

// Stripe sends raw body for webhook signature
app.use('/v1/webhooks/stripe', bodyParser.raw({ type: '*/*' }));
app.use('/v1/webhooks/gocardless', bodyParser.raw({ type: '*/*' }));
app.use(bodyParser.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function notifyOdoo(email, status) {
  try {
    const url = process.env.ODOO_WEBHOOK_URL; // e.g., https://www.example.org/webhook/subscription
    const token = process.env.ODOO_WEBHOOK_TOKEN;
    if (!url) return;
    await axios.post(url, { email, status }, { headers: token ? { 'X-Association-Token': token } : {}, timeout: 5000 });
  } catch (e) {
    logger.warn({ err: e?.message }, 'Failed to notify Odoo');
  }
}

const SubscriptionReq = z.object({
  provider: z.enum(['stripe', 'flutterwave', 'gocardless']).default('stripe'),
  email: z.string().email(),
  name: z.string().optional(),
  amount_cents: z.number().int().positive(),
  currency: z.string().min(3).max(3).transform((s) => s.toUpperCase()),
  success_url: z.string().url(),
  cancel_url: z.string().url()
});

app.post('/v1/checkout/subscription', async (req, res) => {
  try {
    const data = SubscriptionReq.parse(req.body);
    const { provider, email, name, amount_cents, currency, success_url, cancel_url } = data;

    let checkout;
    if (provider === 'stripe') {
      checkout = await stripeCreateCheckout({ email, name, amount_cents, currency, success_url, cancel_url });
    } else if (provider === 'flutterwave') {
      checkout = await flwCreateCheckout({ email, name, amount_cents, currency, success_url, cancel_url });
    } else if (provider === 'gocardless') {
      const session_token = uuidv4();
      checkout = await gcCreateRedirect({ description: 'Association monthly dues', session_token, success_url });
      // attach for client to complete later
      checkout.session_token = session_token;
    }

    // Ensure customer exists in local DB
    const existing = await query('SELECT id FROM customers WHERE email=$1', [email]);
    let customerId;
    if (existing.rows.length) {
      customerId = existing.rows[0].id;
    } else {
      customerId = uuidv4();
      await query('INSERT INTO customers (id, email, name) VALUES ($1,$2,$3)', [customerId, email, name || null]);
    }

    const subId = uuidv4();
    await query(
      'INSERT INTO subscriptions (id, customer_id, amount_cents, currency, interval, provider, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [subId, customerId, amount_cents, currency, 'monthly', provider, 'pending']
    );

    // response payload depends on provider
    if (provider === 'gocardless') {
      return res.json({ url: checkout.redirect_url, subscription_id: subId, redirect_flow_id: checkout.redirect_flow_id, session_token: checkout.session_token });
    }
    return res.json({ url: checkout.url, subscription_id: subId });
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ error: e.message });
  }
});

app.post('/v1/webhooks/stripe', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = await stripeVerify(req.body, sig);
    } catch (err) {
      // If no webhook secret provided, accept raw JSON for dev
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // Mark subscription as active for matching email if exists
        const email = session.customer_details?.email;
        if (email) {
          const result = await query('SELECT id FROM customers WHERE email=$1', [email]);
          if (result.rows.length) {
            const customerId = result.rows[0].id;
            await query('UPDATE subscriptions SET status=$1, updated_at=now() WHERE customer_id=$2 AND status=$3', [
              'active',
              customerId,
              'pending'
            ]);
            await notifyOdoo(email, 'active');
          }
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const amount_cents = invoice.amount_paid;
        const currency = (invoice.currency || 'usd').toUpperCase();
        const provider_ref = invoice.id;
        const email = invoice.customer_email || invoice.customer_details?.email;
        if (email) {
          const c = await query('SELECT id FROM customers WHERE email=$1', [email]);
          if (c.rows.length) {
            const customerId = c.rows[0].id;
            const paymentId = uuidv4();
            await query(
              'INSERT INTO payments (id, customer_id, amount_cents, currency, provider, provider_ref, status, paid_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now())',
              [paymentId, customerId, amount_cents, currency, 'stripe', provider_ref, 'succeeded']
            );
            await notifyOdoo(email, 'active');
          }
        }
        break;
      }
      default:
        break;
    }

    res.json({ received: true });
  } catch (e) {
    logger.error(e);
    res.status(400).json({ error: 'webhook_error' });
  }
});

app.post('/v1/webhooks/flutterwave', async (req, res) => {
  try {
    const v = flwVerify(req.headers);
    if (!v.verified) {
      logger.warn('Flutterwave webhook received without verification (set FLW_WEBHOOK_SECRET to verify)');
    }
    const event = req.body;
    if (event?.event === 'charge.completed' || event?.data?.status === 'successful') {
      const email = event.data?.customer?.email;
      const amount_cents = Math.round(parseFloat(event.data?.amount || '0') * 100);
      const currency = (event.data?.currency || 'NGN').toUpperCase();
      const provider_ref = event.data?.id || event.data?.tx_ref;
      if (email && amount_cents > 0) {
        const c = await query('SELECT id FROM customers WHERE email=$1', [email]);
        if (c.rows.length) {
          const customerId = c.rows[0].id;
          const paymentId = uuidv4();
          await query(
            'INSERT INTO payments (id, customer_id, amount_cents, currency, provider, provider_ref, status, paid_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now())',
            [paymentId, customerId, amount_cents, currency, 'flutterwave', provider_ref, 'succeeded']
          );
          await query('UPDATE subscriptions SET status=$1, updated_at=now() WHERE customer_id=$2 AND status=$3', ['active', customerId, 'pending']);
          await notifyOdoo(email, 'active');
        }
      }
    }
    res.json({ received: true });
  } catch (e) {
    logger.error(e);
    res.status(400).json({ error: 'webhook_error' });
  }
});

app.post('/v1/gocardless/complete', async (req, res) => {
  try {
    const schema = z.object({
      redirect_flow_id: z.string(),
      session_token: z.string(),
      subscription_id: z.string().uuid(),
      amount_cents: z.number().int().positive(),
      currency: z.string().length(3).transform((s) => s.toUpperCase())
    });
    const data = schema.parse(req.body);
    const { redirect_flow_id, session_token, subscription_id, amount_cents, currency } = data;
    const completed = await gcComplete({ redirect_flow_id, session_token, amount_cents, currency });
    const subRes = await query('UPDATE subscriptions SET status=$1, provider_subscription_id=$2, updated_at=now() WHERE id=$3 RETURNING customer_id', [
      'active',
      completed.provider_subscription_id,
      subscription_id
    ]);
    if (subRes.rows.length) {
      const c = await query('SELECT email FROM customers WHERE id=$1', [subRes.rows[0].customer_id]);
      const email = c.rows[0]?.email;
      if (email) await notifyOdoo(email, 'active');
    }
    res.json({ ok: true });
  } catch (e) {
    logger.error(e);
    res.status(400).json({ error: e.message });
  }
});

app.post('/v1/webhooks/gocardless', async (req, res) => {
  try {
    const v = gcVerify(req.headers, req.body);
    if (!v.verified) {
      logger.warn('GoCardless webhook received without verification (set GOCARDLESS_WEBHOOK_SECRET to verify)');
    }
    // Minimal handler; for production map events to payments and subscriptions
    res.json({ received: true });
  } catch (e) {
    logger.error(e);
    res.status(400).json({ error: 'webhook_error' });
  }
});

app.get('/v1/subscriptions', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'email required' });
  const result = await query(
    `SELECT s.* FROM subscriptions s
     JOIN customers c ON c.id = s.customer_id
     WHERE c.email = $1
     ORDER BY s.created_at DESC`,
    [email]
  );
  res.json(result.rows);
});

async function start() {
  await initDb();
  startScheduler(logger);
  app.listen(port, () => {
    logger.info(`payment-api listening on :${port}`);
  });
}

start().catch((e) => {
  logger.error(e);
  process.exit(1);
});
