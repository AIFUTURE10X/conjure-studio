-- Create logo_history table for storing logo generation history
-- Run this in Neon SQL Editor

CREATE TABLE IF NOT EXISTS public.logo_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  blob_url TEXT,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  preset_id TEXT,
  seed INTEGER,
  style TEXT,
  is_favorited BOOLEAN DEFAULT FALSE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_logo_history_user_id ON public.logo_history(user_id);

-- Create index for faster queries by created_at
CREATE INDEX IF NOT EXISTS idx_logo_history_created_at ON public.logo_history(created_at DESC);

-- Grant permissions (adjust as needed for your Neon setup)
GRANT ALL ON public.logo_history TO PUBLIC;
GRANT USAGE, SELECT ON SEQUENCE logo_history_id_seq TO PUBLIC;
