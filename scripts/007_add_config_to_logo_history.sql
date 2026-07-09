-- Add config column to logo_history table
-- Run this in Neon SQL Editor

ALTER TABLE public.logo_history
ADD COLUMN IF NOT EXISTS config JSONB;

-- Add comment explaining the column
COMMENT ON COLUMN public.logo_history.config IS 'JSON config storing reference mode, resolution, bg removal method, and other generation settings';
