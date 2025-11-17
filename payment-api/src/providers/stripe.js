import Stripe from 'stripe';

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

export async function createCheckoutSubscription({ email, name, amount_cents, currency, success_url, cancel_url }) {
  const stripe = getStripe();

  const customer = await stripe.customers.create({ email, name });

  // Create or reuse a Price for this amount/currency
  const unit_amount = amount_cents;
  const product = await stripe.products.create({ name: 'Association Monthly Dues' });
  const price = await stripe.prices.create({
    unit_amount,
    currency: currency.toLowerCase(),
    recurring: { interval: 'month' },
    product: product.id
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [{ price: price.id, quantity: 1 }],
    success_url,
    cancel_url
  });
  return { url: session.url, customer_id: customer.id, price_id: price.id, session_id: session.id };
}

export async function verifyWebhook(rawBody, signature) {
  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // optional in dev
  if (!endpointSecret) return { type: 'unverified', data: null };
  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    return event;
  } catch (err) {
    throw new Error('Invalid Stripe signature');
  }
}
