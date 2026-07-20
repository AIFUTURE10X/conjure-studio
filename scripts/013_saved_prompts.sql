-- Prompt library: every submitted prompt auto-logs here (upsert bumps
-- use_count), users can star/search/reuse. Uniqueness uses md5(prompt)
-- because raw prompts can exceed btree index size limits.
--
-- Apply with: node scripts/run-sql.cjs scripts/013_saved_prompts.sql

CREATE TABLE IF NOT EXISTS public.saved_prompts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'image',
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  use_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_prompts_user_kind_md5
  ON public.saved_prompts (user_id, kind, md5(prompt));

CREATE INDEX IF NOT EXISTS idx_saved_prompts_user
  ON public.saved_prompts (user_id, last_used_at DESC);
