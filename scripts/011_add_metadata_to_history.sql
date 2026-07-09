-- Add metadata column to generation_history so image generations persist
-- their full context (style, dimensions, file size, creative direction).
-- Run this in the Neon SQL Editor, or via: node scripts/run-sql.cjs scripts/011_add_metadata_to_history.sql
-- The API also self-heals this column at runtime, so applying it is optional
-- but recommended.

ALTER TABLE public.generation_history
ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMENT ON COLUMN public.generation_history.metadata IS 'JSON metadata for the generation: style, dimensions, fileSize, creativeDirection.';

-- Composite index for the common "this user's history, newest first" query.
CREATE INDEX IF NOT EXISTS idx_history_user_created
ON public.generation_history(user_id, created_at DESC);
