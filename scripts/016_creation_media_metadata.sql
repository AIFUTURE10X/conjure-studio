-- User-owned titles, categories, and tags shared by the Creation Library.
-- A URL-level row means the same image keeps one label in History + Favorites.

CREATE TABLE IF NOT EXISTS public.creation_media_metadata (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'logo', 'video')),
  media_url TEXT NOT NULL,
  title TEXT,
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, media_type, media_url)
);

CREATE INDEX IF NOT EXISTS idx_creation_media_metadata_user_type
  ON public.creation_media_metadata (user_id, media_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_creation_media_metadata_tags
  ON public.creation_media_metadata USING GIN (tags);
