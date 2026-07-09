-- Create generation_history table in Neon database
CREATE TABLE IF NOT EXISTS generation_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  aspect_ratio TEXT,
  image_urls TEXT[] NOT NULL,
  blob_urls TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_history_user_id ON generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON generation_history(created_at DESC);
