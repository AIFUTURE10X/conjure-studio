-- Add columns to store image metadata in AI helper history
ALTER TABLE ai_helper_history ADD COLUMN IF NOT EXISTS images jsonb;
ALTER TABLE ai_helper_history ADD COLUMN IF NOT EXISTS image_analysis jsonb;

-- Add index for faster session queries
CREATE INDEX IF NOT EXISTS idx_ai_helper_session ON ai_helper_history(session_id, created_at DESC);
