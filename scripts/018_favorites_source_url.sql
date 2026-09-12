-- Favorites: make the star reflect the saved state, and stop repeat clicks
-- inserting duplicate rows.
--
-- The old flow uploaded every click to a fresh `favorites/temp-<now>.png` blob
-- and stored THAT url as image_url. The client compared its grid url against
-- the returned url, never matched, and left the star unfilled; the
-- UNIQUE(user_id, image_url) guard never fired either, because image_url was
-- unique by construction on every click.
--
-- Two columns, two jobs:
--
--   source_url    the url the client was displaying when it favorited, so the
--                 star can be drawn from saved state. Only ordinary http(s)
--                 urls land here — generated images are multi-MB `data:` URIs
--                 and one copy per row would bloat both the table and the
--                 favorites GET response.
--
--   content_hash  sha256 of the image bytes. This is the real dedupe key: it is
--                 stable across the `data:` URI -> blob url transition, so one
--                 image can occupy only one row per user no matter which url
--                 form the client happened to hold at click time.
--
-- The unique index is PARTIAL so pre-existing rows (content_hash IS NULL,
-- including the known duplicate sets) cannot block this migration. They are
-- left alone; cleaning them up is a separate, explicitly approved step.

ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS content_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_content_hash_key
  ON public.favorites (user_id, content_hash)
  WHERE content_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_favorites_user_source_url
  ON public.favorites (user_id, source_url)
  WHERE source_url IS NOT NULL;
