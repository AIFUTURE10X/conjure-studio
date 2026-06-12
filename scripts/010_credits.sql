-- Credits: per-user balance snapshot + append-only ledger.
-- Every balance change writes a ledger row; idempotency_key (unique) makes
-- grants/debits safe to replay (Stripe webhook retries, double-clicks).

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES "user"("id") ON DELETE CASCADE,
  credit_balance INTEGER NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  idempotency_key TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger(user_id, created_at DESC);
