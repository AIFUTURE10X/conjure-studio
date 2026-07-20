-- Cross-device preset storage (was localStorage-only).
-- id is the client-generated preset id so local and server copies stay
-- aligned without id-swapping; (user_id, id) is the identity.
--
-- Apply with: node scripts/run-sql.cjs scripts/012_user_presets.sql

CREATE TABLE IF NOT EXISTS public.user_presets (
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'generate',
  params JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_user_presets_user
  ON public.user_presets (user_id, created_at DESC);
