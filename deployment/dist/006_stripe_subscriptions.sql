CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  plan TEXT,
  status TEXT NOT NULL DEFAULT 'none',
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS stripe_subscriptions_account_id_unique ON stripe_subscriptions (account_id);
CREATE UNIQUE INDEX IF NOT EXISTS stripe_subscriptions_stripe_subscription_id_unique ON stripe_subscriptions (stripe_subscription_id);
