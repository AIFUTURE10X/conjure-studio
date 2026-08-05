import type { NeonQueryFunction } from '@neondatabase/serverless'
import type { PoolClient } from 'pg'

type Sql = NeonQueryFunction<false, false>

let creationMetadataSchemaReady: Promise<void> | null = null

export function ensureCreationMetadataSchema(sql: Sql): Promise<void> {
  if (!creationMetadataSchemaReady) {
    creationMetadataSchemaReady = (async () => {
      await sql`
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
        )
      `
      await sql`
        CREATE INDEX IF NOT EXISTS idx_creation_media_metadata_user_type
        ON public.creation_media_metadata (user_id, media_type, updated_at DESC)
      `
      await sql`
        CREATE INDEX IF NOT EXISTS idx_creation_media_metadata_tags
        ON public.creation_media_metadata USING GIN (tags)
      `
    })().catch((error) => {
      creationMetadataSchemaReady = null
      throw error
    })
  }

  return creationMetadataSchemaReady
}

export async function ensureCreationMetadataPoolSchema(client: PoolClient): Promise<void> {
  await client.query(`
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
    )
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_creation_media_metadata_user_type
    ON public.creation_media_metadata (user_id, media_type, updated_at DESC)
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_creation_media_metadata_tags
    ON public.creation_media_metadata USING GIN (tags)
  `)
}
