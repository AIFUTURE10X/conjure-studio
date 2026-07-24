import { neon } from '@neondatabase/serverless'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { ensureLogoHistorySchema } from '@/lib/db/history-schema'
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
  return NextResponse.json({
    code: 'database_unconfigured',
    localOnly: true,
    ...body,
  }, init)
}

const getQuerySchema = z.object({ userId: userIdSchema })

/** Rows the app keeps per user (favorited rows are never pruned) — matches GET's LIMIT. */
const RETENTION_LIMIT = 100

const postBodySchema = z.object({
  userId: userIdSchema,
  imageUrl: urlOrDataUriSchema,
  prompt: promptSchema,
  negativePrompt: z.string().max(10_000).optional().nullable(),
  presetId: z.string().max(200).optional().nullable(),
  seed: z.number().int().optional().nullable(),
  style: z.string().max(500).optional().nullable(),
  config: z.record(z.unknown()).optional().nullable(),
  isFavorited: z.boolean().optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
})

const patchBodySchema = z.object({
  id: numericIdSchema,
  userId: userIdSchema,
  isFavorited: z.boolean().optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
})

const deleteQuerySchema = z.object({
  id: numericIdSchema.optional(),
  userId: userIdSchema,
  all: z.literal('true').optional(),
})

// GET /api/logo-history?userId=xxx
export async function GET(request: NextRequest) {
  const parsedQuery = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsedQuery.response) return parsedQuery.response
  if (!hasDatabaseConnection()) {
    console.warn('[Logo History] Database not configured; returning local-only history')
    return localOnlyResponse({ history: [] })
  }

  const userId = await resolveUserId(request, parsedQuery.data.userId)

  try {
    const sql = getSQL()
    await ensureLogoHistorySchema(sql)
    console.log('[Logo History] Loading history for user:', userId)

    // No SELECT *: legacy rows can inline a multi-MB base64 data URI, and the
    // Neon HTTP driver rejects responses over 64MB — enough of those rows in
    // one page 500s the whole history. Resolve the display URL in SQL and drop
    // data: URIs there so the response stays bounded.
    const result = await sql`
      SELECT id, prompt, negative_prompt, preset_id, seed, style, config,
             is_favorited, rating, created_at,
             CASE WHEN COALESCE(blob_url, image_url) LIKE 'data:%' THEN NULL
                  ELSE COALESCE(blob_url, image_url) END AS url
      FROM public.logo_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `

    console.log('[Logo History] Loaded from Neon:', result.length)

    const history = result
      .filter(item => typeof item.url === 'string' && item.url.length > 0)
      .map(item => ({
      id: item.id.toString(),
      imageUrl: item.url,
      prompt: item.prompt,
      negativePrompt: item.negative_prompt,
      presetId: item.preset_id,
      seed: item.seed,
      style: item.style,
      config: item.config ? (typeof item.config === 'string' ? JSON.parse(item.config) : item.config) : undefined,
      isFavorited: item.is_favorited || false,
      rating: item.rating,
      timestamp: new Date(item.created_at).getTime()
    }))

    return NextResponse.json({ history })
  } catch (error) {
    console.error('[Logo History] Load failed:', error)
    return apiError(500, 'internal_error', 'Failed to load history')
  }
}

// POST /api/logo-history
export async function POST(request: NextRequest) {
  const parsedBody = await parseJson(request, postBodySchema)
  if (parsedBody.response) return parsedBody.response
  if (!hasDatabaseConnection()) {
    console.warn('[Logo History] Database not configured; keeping history local only')
    return localOnlyResponse({ historyItem: null }, { status: 202 })
  }

  const { imageUrl, prompt, negativePrompt, presetId, seed, style, config, isFavorited, rating } = parsedBody.data
  const userId = await resolveUserId(request, parsedBody.data.userId)

  try {
    console.log('[Logo History] POST request received')
    console.log('[Logo History] userId:', userId)
    console.log('[Logo History] prompt:', prompt.substring(0, 50))

    // Upload image to Vercel Blob for persistence. When Blob isn't configured
    // (e.g. local dev without BLOB_READ_WRITE_TOKEN) we fall back to storing the
    // image/data URL directly in the DB so history still works.
    let blobUrl: string | null = null
    if (/^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(imageUrl)) {
      // Already persisted on Blob (generate-logo uploads before responding) —
      // reuse it instead of downloading and re-uploading a duplicate copy.
      blobUrl = imageUrl
      console.log('[Logo History] Reusing existing Blob URL:', imageUrl)
    } else {
      try {
        let imageBuffer: Buffer

        // Check if it's a base64 data URL (can't be fetched from Node.js)
        if (imageUrl.startsWith('data:')) {
          console.log('[Logo History] Converting base64 data URL to buffer...')
          const base64Data = imageUrl.split(',')[1]
          if (!base64Data) {
            throw new Error('Invalid data URL format')
          }
          imageBuffer = Buffer.from(base64Data, 'base64')
          console.log('[Logo History] Converted base64 to buffer, size:', imageBuffer.length, 'bytes')
        } else {
          // Regular URL - fetch it
          console.log('[Logo History] Fetching image from URL...')
          const response = await fetch(imageUrl)
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`)
          }
          const arrayBuffer = await response.arrayBuffer()
          imageBuffer = Buffer.from(arrayBuffer)
          console.log('[Logo History] Fetched image, size:', imageBuffer.length, 'bytes')
        }

        const fileName = `logo-history/${userId}-${Date.now()}.png`
        const uploadResult = await put(fileName, imageBuffer, {
          access: 'public',
          contentType: 'image/png'
        })

        blobUrl = uploadResult.url
        console.log('[Logo History] Uploaded to Blob:', blobUrl)
      } catch (error) {
        console.error('[Logo History] Blob upload failed, storing image directly:', error)
        // Fall through — we store the full image/data URL in the DB below.
      }
    }

    const sql = getSQL()
    await ensureLogoHistorySchema(sql)
    console.log('[Logo History] Inserting into Neon database...')

    // When Blob succeeded, store a tiny placeholder for the (huge) data URL and
    // rely on blob_url. When it failed, keep the full value so the image survives.
    const storedImageUrl = blobUrl && imageUrl.startsWith('data:')
      ? imageUrl.substring(0, 50) + '...[base64]'
      : imageUrl

    // Store config as JSON string
    const configJson = config ? JSON.stringify(config) : null

    const result = await sql`
      INSERT INTO public.logo_history (
        user_id, image_url, blob_url, prompt, negative_prompt, preset_id, seed, style, config, is_favorited, rating
      )
      VALUES (
        ${userId}, ${storedImageUrl}, ${blobUrl}, ${prompt}, ${negativePrompt || null},
        ${presetId || null}, ${seed || null}, ${style || null}, ${configJson}, ${isFavorited || false}, ${rating || null}
      )
      RETURNING *
    `

    console.log('[Logo History] Saved to Neon with ID:', result[0].id)

    // Enforce retention on write: everything past the newest RETENTION_LIMIT
    // rows is invisible to the UI (GET LIMIT + client caches cap at 100) and
    // only exists to resurrect "deleted" items on later syncs. Favorited rows
    // are always kept. A prune failure must never fail the save.
    try {
      await sql`
        DELETE FROM public.logo_history
        WHERE user_id = ${userId}
          AND is_favorited IS NOT TRUE
          AND id NOT IN (
            SELECT id FROM public.logo_history
            WHERE user_id = ${userId}
            ORDER BY created_at DESC, id DESC
            LIMIT ${RETENTION_LIMIT}
          )
      `
    } catch (pruneError) {
      console.error('[Logo History] Retention prune failed:', pruneError)
    }

    const historyItem = {
      id: result[0].id.toString(),
      imageUrl: result[0].blob_url || result[0].image_url,
      prompt: result[0].prompt,
      negativePrompt: result[0].negative_prompt,
      presetId: result[0].preset_id,
      seed: result[0].seed,
      style: result[0].style,
      config: result[0].config ? (typeof result[0].config === 'string' ? JSON.parse(result[0].config) : result[0].config) : undefined,
      isFavorited: result[0].is_favorited || false,
      rating: result[0].rating,
      timestamp: new Date(result[0].created_at).getTime()
    }

    return NextResponse.json({ historyItem })
  } catch (error) {
    console.error('[Logo History] Save failed:', error)
    return apiError(500, 'internal_error', 'Failed to save history')
  }
}

// PATCH /api/logo-history - Update favorite/rating
export async function PATCH(request: NextRequest) {
  const parsedBody = await parseJson(request, patchBodySchema)
  if (parsedBody.response) return parsedBody.response
  if (!hasDatabaseConnection()) {
    console.warn('[Logo History] Database not configured; favorite/rating update remains local only')
    return localOnlyResponse({ success: true })
  }

  const { id, isFavorited, rating } = parsedBody.data
  const userId = await resolveUserId(request, parsedBody.data.userId)

  try {
    const sql = getSQL()
    await ensureLogoHistorySchema(sql)
    console.log('[Logo History] Updating item:', id, { isFavorited, rating })

    if (isFavorited !== undefined) {
      await sql`
        UPDATE public.logo_history
        SET is_favorited = ${isFavorited}
        WHERE id = ${id} AND user_id = ${userId}
      `
    }

    if (rating !== undefined) {
      await sql`
        UPDATE public.logo_history
        SET rating = ${rating}
        WHERE id = ${id} AND user_id = ${userId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Logo History] Update failed:', error)
    return apiError(500, 'internal_error', 'Failed to update history item')
  }
}

// DELETE /api/logo-history?userId=xxx&(id=xxx | all=true)
export async function DELETE(request: NextRequest) {
  const parsedQuery = parseParams(Object.fromEntries(request.nextUrl.searchParams), deleteQuerySchema)
  if (parsedQuery.response) return parsedQuery.response
  if (!hasDatabaseConnection()) {
    console.warn('[Logo History] Database not configured; delete remains local only')
    return localOnlyResponse({ success: true })
  }

  const { id, all } = parsedQuery.data
  if (!all && id === undefined) {
    return apiError(400, 'invalid_request', 'Provide id or all=true')
  }

  const userId = await resolveUserId(request, parsedQuery.data.userId)

  try {
    const sql = getSQL()
    await ensureLogoHistorySchema(sql)

    if (all) {
      // True server-side wipe. The old client-side Clear All deleted only the
      // ~100 visible items, so rows beyond the GET window survived and came
      // back on the next sync.
      const deleted = await sql`
        DELETE FROM public.logo_history WHERE user_id = ${userId} RETURNING id
      `
      console.log('[Logo History] Cleared all for user:', userId, '—', deleted.length, 'rows')
      return NextResponse.json({ success: true, deletedCount: deleted.length })
    }

    console.log('[Logo History] Deleting item:', id)

    const deleted = await sql`
      DELETE FROM public.logo_history WHERE id = ${id} AND user_id = ${userId} RETURNING id
    `

    console.log('[Logo History] Removed from Neon:', deleted.length, 'row(s)')

    return NextResponse.json({ success: true, deletedCount: deleted.length })
  } catch (error) {
    console.error('[Logo History] Delete failed:', error)
    return apiError(500, 'internal_error', 'Failed to delete history item')
  }
}
