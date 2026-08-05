import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { ensureGenerationHistorySchema } from '@/lib/db/history-schema'
import { storeGenerationHistory } from '@/lib/db/generation-history-store'
import { IMAGE_HISTORY_RETENTION_LIMIT } from '@/lib/image-history-retention'
import { MAX_INLINE_HISTORY_DATA_URI_LENGTH } from '@/lib/history-limits'
import { numericIdSchema, promptSchema, urlOrDataUriSchema, userIdSchema } from '@/lib/validation/common'

function getDatabaseUrl() {
  return process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
}

function hasDatabaseConnection() {
  return !!getDatabaseUrl()
}

function getSQL() {
  const url = getDatabaseUrl()
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

function localOnlyResponse(body: Record<string, unknown> = {}, init?: ResponseInit) {
  return NextResponse.json({ code: 'database_unconfigured', localOnly: true, ...body }, init)
}

/** Neon returns JSONB as a parsed object, but tolerate a string too. */
function parseMetadata(value: unknown) {
  if (!value) return undefined
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }
  return value
}

const metadataSchema = z
  .object({
    style: z.string().optional().nullable(),
    dimensions: z.string().optional().nullable(),
    fileSize: z.string().optional().nullable(),
    creativeDirection: z.record(z.unknown()).optional().nullable(),
  })
  .passthrough()

const getQuerySchema = z.object({ userId: userIdSchema })

const postBodySchema = z.object({
  userId: userIdSchema,
  prompt: promptSchema,
  aspectRatio: z.string().max(20).optional().nullable(),
  imageUrls: z.array(urlOrDataUriSchema).min(1).max(10).superRefine((urls, ctx) => {
    urls.forEach((url, index) => {
      if (url.startsWith('data:') && url.length > MAX_INLINE_HISTORY_DATA_URI_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: MAX_INLINE_HISTORY_DATA_URI_LENGTH,
          type: 'string',
          inclusive: true,
          path: [index],
          message: 'Inline history image is too large; upload it to Blob first',
        })
      }
    })
  }),
  metadata: metadataSchema.optional().nullable(),
  restoreOnlyIfMissing: z.boolean().optional(),
})

const deleteQuerySchema = z.object({
  id: numericIdSchema.optional(),
  userId: userIdSchema,
  all: z.literal('true').optional(),
})

/**
 * Extra delete keys: the image URLs of the card being removed. Covers legacy
 * rows whose Neon serial id never matched the client-cached UUID id — without
 * this the row survives the DELETE and the next sync resurrects the card.
 */
function parseDeleteUrls(request: NextRequest): string[] {
  return request.nextUrl.searchParams
    .getAll('url')
    .filter((url) => /^https?:\/\//.test(url) && url.length <= 2000)
    .slice(0, 20)
}

// GET /api/history?userId=xxx
export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsed.response) return parsed.response
  if (!hasDatabaseConnection()) {
    console.warn('[v0] API: Database not configured; returning local-only history')
    return localOnlyResponse({ history: [] })
  }

  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    await ensureGenerationHistorySchema(sql)
    console.log('[v0] API: Loading history for user:', userId)

    // Never SELECT * here: legacy rows can inline multi-MB base64 data URIs in
    // image_urls AND blob_urls, and the Neon HTTP driver rejects responses over
    // 64MB (HTTP 507) — which 500'd every sync for heavy users. Select only the
    // fields the client uses and strip data: entries inside Postgres so the
    // response stays bounded even if a future Blob outage inlines images again.
    const result = await sql`
      SELECT id, prompt, aspect_ratio, metadata, created_at,
        ARRAY(
          SELECT u.url
          FROM unnest(COALESCE(blob_urls, image_urls)) WITH ORDINALITY AS u(url, ord)
          WHERE u.url NOT LIKE 'data:%'
          ORDER BY u.ord
        ) AS urls
      FROM public.generation_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${IMAGE_HISTORY_RETENTION_LIMIT}
    `

    console.log('[v0] API: Loaded from Neon:', result.length)

    const history = result
      .filter(item => Array.isArray(item.urls) && item.urls.length > 0)
      .map(item => ({
        id: item.id.toString(),
        prompt: item.prompt,
        aspectRatio: item.aspect_ratio,
        imageUrls: item.urls,
        metadata: parseMetadata(item.metadata),
        timestamp: new Date(item.created_at).getTime()
      }))

    return NextResponse.json({ history })
  } catch (error) {
    console.error('[v0] API: History load failed:', error)
    return apiError(500, 'internal_error', 'Failed to load history')
  }
}

// POST /api/history
export async function POST(request: NextRequest) {
  const parsed = await parseJson(request, postBodySchema)
  if (parsed.response) return parsed.response
  const { prompt, aspectRatio, imageUrls, metadata, restoreOnlyIfMissing } = parsed.data
  const userId = await resolveUserId(request, parsed.data.userId)

  if (!hasDatabaseConnection()) {
    // No DB configured (e.g. local dev): report success so the client keeps a
    // usable session-local copy instead of surfacing a save error.
    console.warn('[v0] API: Database not configured; keeping history local only')
    return localOnlyResponse({
      historyItem: {
        id: `local-${Date.now()}`,
        prompt,
        aspectRatio: aspectRatio ?? null,
        imageUrls,
        metadata: metadata ?? undefined,
        timestamp: Date.now(),
      },
    }, { status: 202 })
  }

  try {
    console.log('[v0] API: POST history request received')
    console.log('[v0] API: userId:', userId)
    console.log('[v0] API: imageUrls count:', imageUrls.length)

    if (restoreOnlyIfMissing) {
      const sql = getSQL()
      await ensureGenerationHistorySchema(sql)
      const existing = await sql`
        SELECT id, prompt, aspect_ratio, metadata, created_at
        FROM public.generation_history
        WHERE user_id = ${userId}
          AND (
            COALESCE(blob_urls, ARRAY[]::text[]) && ${imageUrls}::text[]
            OR image_urls && ${imageUrls}::text[]
          )
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `
      if (existing[0]) {
        return NextResponse.json({
          alreadyExists: true,
          historyItem: {
            id: existing[0].id.toString(),
            prompt: existing[0].prompt,
            aspectRatio: existing[0].aspect_ratio,
            imageUrls,
            metadata: parseMetadata(existing[0].metadata),
            timestamp: new Date(existing[0].created_at).getTime(),
          },
        })
      }
    }

    // Blob upload, insert, and retention prune live in the shared store so
    // /api/generate-image saves land through the exact same path.
    const historyItem = await storeGenerationHistory({ userId, prompt, aspectRatio, imageUrls, metadata })
    console.log('[v0] API: Saved to Neon with ID:', historyItem.id)

    return NextResponse.json({ historyItem, alreadyExists: false })
  } catch (error) {
    console.error('[v0] API: History save failed with error:', error)
    return apiError(500, 'internal_error', 'Failed to save history')
  }
}

// DELETE /api/history?userId=xxx&(id=xxx | all=true), plus optional repeated
// url= params naming the item's images (deletes rows the id alone would miss).
export async function DELETE(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams)
  delete params.url // repeated param — collected separately below
  const parsed = parseParams(params, deleteQuerySchema)
  if (parsed.response) return parsed.response
  if (!hasDatabaseConnection()) {
    console.warn('[v0] API: Database not configured; delete remains local only')
    return localOnlyResponse({ success: true })
  }

  const { id, all } = parsed.data
  const urls = parseDeleteUrls(request)
  if (!all && id === undefined && urls.length === 0) {
    return apiError(400, 'invalid_request', 'Provide id, url, or all=true')
  }

  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    await ensureGenerationHistorySchema(sql)

    if (all) {
      const deleted = await sql`
        DELETE FROM public.generation_history WHERE user_id = ${userId} RETURNING id
      `
      console.log('[v0] API: Cleared all history for user:', userId, '—', deleted.length, 'rows')
      return NextResponse.json({ success: true, deletedCount: deleted.length })
    }

    console.log('[v0] API: Removing history item:', id ?? '(by url)')
    let deletedCount = 0
    if (id !== undefined) {
      const deleted = await sql`
        DELETE FROM public.generation_history WHERE id = ${id} AND user_id = ${userId} RETURNING id
      `
      deletedCount += deleted.length
    }
    if (urls.length > 0) {
      const deleted = await sql`
        DELETE FROM public.generation_history
        WHERE user_id = ${userId}
          AND (blob_urls && ${urls}::text[] OR image_urls && ${urls}::text[])
        RETURNING id
      `
      deletedCount += deleted.length
    }

    return NextResponse.json({ success: true, deletedCount })
  } catch (error) {
    console.error('[v0] API: Delete failed:', error)
    return apiError(500, 'internal_error', 'Failed to delete history item')
  }
}
