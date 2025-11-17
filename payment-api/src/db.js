import pg from 'pg';
const { Pool } = pg;

const required = (name, fallback) => process.env[name] ?? fallback;

const pool = new Pool({
  host: required('PAYMENT_DB_HOST', 'localhost'),
  port: parseInt(required('PAYMENT_DB_PORT', '5432'), 10),
  user: required('PAYMENT_DB_USER', 'payments'),
  password: required('PAYMENT_DB_PASSWORD', ''),
  database: required('PAYMENT_DB_NAME', 'payments_db')
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 200) {
    console.warn('slow query', { duration, text });
  }
  return res;
}

export async function initDb() {
  await query(`CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    provider_ids JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`);

  await query(`CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    interval TEXT NOT NULL DEFAULT 'monthly',
    provider TEXT NOT NULL,
    provider_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    next_charge_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`);

  await query(`CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_ref TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ
  );`);

  await query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);`);
}
