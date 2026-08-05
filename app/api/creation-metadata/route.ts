import { neon } from '@neondatabase/serverless'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import {
  CREATION_MEDIA_TYPES,
  normalizeCreationMetadata,
} from '@/lib/creation-metadata'
import { ensureCreationMetadataSchema } from '@/lib/db/creation-metadata-schema'
import { userIdSchema } from '@/lib/validation/common'

export const runtime = 'nodejs'

const mediaTypeSchema = z.enum(CREATION_MEDIA_TYPES)
const mediaUrlSchema = z.string().url().max(2048).refine(
  (value) => value.startsWith('https://') || value.startsWith('http://'),
  'Media URL must use HTTP or HTTPS',
)

const getQuerySchema = z.object({
  userId: userIdSchema,
  mediaType: mediaTypeSchema.optional(),
})

const patchBodySchema = z.object({
  userId: userIdSchema,
  mediaType: mediaTypeSchema,
  mediaUrl: mediaUrlSchema,
  title: z.string().max(120).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  tags: z.array(z.string().max(40)).max(20).optional().nullable(),
})

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error('No database connection string configured')
  return neon(url)
}

export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)
  const mediaType = parsed.data.mediaType ?? null

  try {
    const sql = getSQL()
    await ensureCreationMetadataSchema(sql)
    const rows = await sql`
      SELECT media_type, media_url, title, category, tags, updated_at
      FROM public.creation_media_metadata
      WHERE user_id = ${userId}
        AND (${mediaType}::text IS NULL OR media_type = ${mediaType})
      ORDER BY updated_at DESC
    `

    return NextResponse.json({
      metadata: rows.map((row) => ({
        mediaType: row.media_type as string,
        mediaUrl: row.media_url as string,
        title: (row.title as string | null) ?? null,
        category: (row.category as string | null) ?? null,
        tags: Array.isArray(row.tags) ? row.tags as string[] : [],
        updatedAt: new Date(row.updated_at as string).getTime(),
      })),
    })
  } catch (error) {
    console.error('[creation-metadata] Load failed:', error)
    return apiError(500, 'internal_error', 'Failed to load creation details')
  }
}

export async function PATCH(request: NextRequest) {
  const parsed = await parseJson(request, patchBodySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)
  const normalized = normalizeCreationMetadata(parsed.data)

  try {
    const sql = getSQL()
    await ensureCreationMetadataSchema(sql)
    const rows = await sql`
      INSERT INTO public.creation_media_metadata (
        user_id, media_type, media_url, title, category, tags, updated_at
      )
      VALUES (
        ${userId}, ${parsed.data.mediaType}, ${parsed.data.mediaUrl},
        ${normalized.title}, ${normalized.category}, ${normalized.tags}, NOW()
      )
      ON CONFLICT (user_id, media_type, media_url)
      DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        updated_at = NOW()
      RETURNING media_type, media_url, title, category, tags, updated_at
    `
    const row = rows[0]

    return NextResponse.json({
      metadata: {
        mediaType: row.media_type as string,
        mediaUrl: row.media_url as string,
        title: (row.title as string | null) ?? null,
        category: (row.category as string | null) ?? null,
        tags: Array.isArray(row.tags) ? row.tags as string[] : [],
        updatedAt: new Date(row.updated_at as string).getTime(),
      },
    })
  } catch (error) {
    console.error('[creation-metadata] Save failed:', error)
    return apiError(500, 'internal_error', 'Failed to save creation details')
  }
}
