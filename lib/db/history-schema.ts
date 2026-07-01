import type { NeonQueryFunction } from '@neondatabase/serverless'

/**
 * Self-healing schema helpers for the history tables.
 *
 * The history routes used to assume the tables (and newer columns) already
 * existed in Neon, so a fresh database — or one that never had the metadata /
 * config columns applied — would make every save fail with a 500. These
 * helpers run idempotent `CREATE TABLE IF NOT EXISTS` + `ADD COLUMN IF NOT
 * EXISTS` DDL once per process so saving "just works" without a manual
 * migration step. The promise is memoized; a transient failure resets it so a
 * later request can retry.
 */

type Sql = NeonQueryFunction<false, false>

let generationSchemaReady: Promise<void> | null = null
let logoSchemaReady: Promise<void> | null = null

export function ensureGenerationHistorySchema(sql: Sql): Promise<void> {
  if (!generationSchemaReady) {
    generationSchemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS public.generation_history (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          prompt TEXT NOT NULL,
          aspect_ratio TEXT,
          image_urls TEXT[] NOT NULL,
          blob_urls TEXT[],
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `
      await sql`ALTER TABLE public.generation_history ADD COLUMN IF NOT EXISTS metadata JSONB`
      await sql`CREATE INDEX IF NOT EXISTS idx_history_user_id ON public.generation_history(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_history_created_at ON public.generation_history(created_at DESC)`
    })().catch((err) => {
      generationSchemaReady = null
      throw err
    })
  }
  return generationSchemaReady
}

export function ensureLogoHistorySchema(sql: Sql): Promise<void> {
  if (!logoSchemaReady) {
    logoSchemaReady = (async () => {
      await sql`
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
          config JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      await sql`ALTER TABLE public.logo_history ADD COLUMN IF NOT EXISTS config JSONB`
      await sql`CREATE INDEX IF NOT EXISTS idx_logo_history_user_id ON public.logo_history(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_logo_history_created_at ON public.logo_history(created_at DESC)`
    })().catch((err) => {
      logoSchemaReady = null
      throw err
    })
  }
  return logoSchemaReady
}
