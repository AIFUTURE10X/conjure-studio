-- Create favorites table in Neon database
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  blob_url TEXT,
  prompt TEXT,
  aspect_ratio TEXT,
  style_preset TEXT,
  dimensions TEXT,
  file_size TEXT,
  parameters JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, image_url)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- Removed RLS commands - Neon doesn't require them for basic table access
