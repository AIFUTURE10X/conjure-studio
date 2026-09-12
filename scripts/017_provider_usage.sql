-- Provider usage ledger: one row per provider API call (issue #50).
--
-- Every call to OpenAI / Gemini / fal / PhotoRoom / Replicate made through the
-- shared clients in lib/ records what it consumed (units), the prices applied
-- at write time (unit_prices) and the resulting cost_usd. Prices are frozen on
-- the row so a later rate-card change never rewrites history. cost_usd is NULL
-- for endpoints with no rate (confidence = 'unpriced'), never 0.
--
-- Apply with: node scripts/run-sql.cjs scripts/017_provider_usage.sql

CREATE TABLE IF NOT EXISTS public.provider_usage (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'fal', 'photoroom', 'replicate')),
  model TEXT NOT NULL,
  operation TEXT NOT NULL,
  feature TEXT NOT NULL DEFAULT 'unknown',
  user_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'timeout', 'pending')),
  units JSONB NOT NULL DEFAULT '{}'::jsonb,
  unit_prices JSONB NOT NULL DEFAULT '{}'::jsonb,
  cost_usd NUMERIC(12, 6),
  confidence TEXT NOT NULL CHECK (confidence IN ('exact', 'rate', 'estimated', 'unknown', 'unpriced')),
  rate_effective_from DATE,
  request_id TEXT,
  source TEXT NOT NULL DEFAULT 'live' CHECK (source IN ('live', 'backfill')),
  source_ref TEXT,
  error TEXT,
  latency_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_provider_usage_occurred
  ON public.provider_usage (occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_usage_user
  ON public.provider_usage (user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_usage_provider
  ON public.provider_usage (provider, occurred_at DESC);

-- Async fal jobs insert a pending row at submit and finalize it by request id.
CREATE INDEX IF NOT EXISTS idx_provider_usage_request
  ON public.provider_usage (request_id)
  WHERE request_id IS NOT NULL;

-- The backfill script is idempotent: one row per source history row.
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_usage_source_ref
  ON public.provider_usage (source, source_ref)
  WHERE source_ref IS NOT NULL;
