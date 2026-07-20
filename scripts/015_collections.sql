-- Collections: user-named boards for generated media, with a
-- "pre-assignment" flow — new generations can auto-file into the active
-- collection chosen in the prompt dock.
--
-- Apply with: node scripts/run-sql.cjs scripts/015_collections.sql

CREATE TABLE IF NOT EXISTS public.collections (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS public.collection_items (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'image',
  item_url TEXT NOT NULL,
  prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection_id, item_url)
);

CREATE INDEX IF NOT EXISTS idx_collections_user
  ON public.collections (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection
  ON public.collection_items (collection_id, created_at DESC);
