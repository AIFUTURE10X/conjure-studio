-- Video favorites: star finished clips from the video panel.
--
-- Apply with: node scripts/run-sql.cjs scripts/014_video_favorites.sql

ALTER TABLE public.video_history
  ADD COLUMN IF NOT EXISTS is_favorited BOOLEAN NOT NULL DEFAULT FALSE;
