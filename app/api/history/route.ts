import { neon } from '@neondatabase/serverless'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { ensureGenerationHistorySchema } from '@/lib/db/history-schema'
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

/**
 * True for URLs already stored in our own Vercel Blob store (durable + public,
 * e.g. an edit result from uploadEditImage). Re-uploading these would mint a
 * new history/ URL that no longer matches the copy the client already holds,
 * which resurfaces the item as a duplicate card on the next sync.
 */
function isDurableBlobUrl(url: string) {
  try {
    return new URL(url).hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
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
  imageUrls: z.array(urlOrDataUriSchema).min(1).max(10),
  metadata: metadataSchema.optional().nullable(),
})

const deleteQuerySchema = z.object({ id: numericIdSchema, userId: userIdSchema })

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

    const result = await sql`
      SELECT * FROM public.generation_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `

    console.log('[v0] API: Loaded from Neon:', result.length)

    const history = result.map(item => ({
      id: item.id.toString(),
      prompt: item.prompt,
      aspectRatio: item.aspect_ratio,
      imageUrls: item.blob_urls || item.image_urls,
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
  const { prompt, aspectRatio, imageUrls, metadata } = parsed.data
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

    const sql = getSQL()
    await ensureGenerationHistorySchema(sql)

    // Upload each image to Vercel Blob for durable storage. When Blob isn't
    // configured or a single upload fails, we fall back to storing the original
    // URL / data URI directly so the save still succeeds (mirrors logo-history).
    const storedImageUrls: string[] = []
    const blobUrls: string[] = []

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i]

      // Already in our durable Blob store: keep the URL as-is so it stays
      // identical to the copy the client saved locally (avoids sync duplicates)
      // and so we don't store a second copy of the same asset.
      if (isDurableBlobUrl(imageUrl)) {
        storedImageUrls.push(imageUrl)
        blobUrls.push(imageUrl)
        continue
      }

      let blobUrl: string | null = null
      try {
        let imageBuffer: Buffer
        if (imageUrl.startsWith('data:')) {
          const base64Data = imageUrl.split(',')[1]
          if (!base64Data) throw new Error('Invalid data URL format')
          imageBuffer = Buffer.from(base64Data, 'base64')
        } else {
          const response = await fetch(imageUrl)
          if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)
          imageBuffer = Buffer.from(await response.arrayBuffer())
        }

        const fileName = `history/${userId}-${Date.now()}-${i}.png`
        const uploadResult = await put(fileName, imageBuffer, {
          access: 'public',
          contentType: 'image/png',
        })
        blobUrl = uploadResult.url
        console.log(`[v0] API: Image ${i + 1} uploaded to Blob:`, blobUrl)
      } catch (error) {
        console.error(`[v0] API: Blob upload failed for image ${i + 1}, storing URL directly:`, error)
      }

      // When Blob succeeded, avoid storing the (huge) data URI twice.
      storedImageUrls.push(
        blobUrl && imageUrl.startsWith('data:') ? imageUrl.substring(0, 50) + '...[base64]' : imageUrl,
      )
      blobUrls.push(blobUrl ?? imageUrl)
    }

    console.log('[v0] API: All images processed, inserting into Neon database...')

    const metadataJson = metadata ? JSON.stringify(metadata) : null

    // The neon driver serializes JS arrays to Postgres arrays — no
    // hand-built '{...}' literals.
    const result = await sql`
      INSERT INTO public.generation_history (
        user_id, prompt, aspect_ratio, image_urls, blob_urls, metadata
      )
      VALUES (
        ${userId}, ${prompt}, ${aspectRatio || null},
        ${storedImageUrls}, ${blobUrls}, ${metadataJson}
      )
      RETURNING *
    `

    console.log('[v0] API: Saved to Neon with ID:', result[0].id)

    const historyItem = {
      id: result[0].id.toString(),
      prompt: result[0].prompt,
      aspectRatio: result[0].aspect_ratio,
      imageUrls: result[0].blob_urls || result[0].image_urls,
      metadata: parseMetadata(result[0].metadata),
      timestamp: new Date(result[0].created_at).getTime()
    }

    return NextResponse.json({ historyItem })
  } catch (error) {
    console.error('[v0] API: History save failed with error:', error)
    return apiError(500, 'internal_error', 'Failed to save history')
  }
}

// DELETE /api/history?id=xxx&userId=xxx
export async function DELETE(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), deleteQuerySchema)
  if (parsed.response) return parsed.response
  if (!hasDatabaseConnection()) {
    console.warn('[v0] API: Database not configured; delete remains local only')
    return localOnlyResponse({ success: true })
  }

  const { id } = parsed.data
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    await ensureGenerationHistorySchema(sql)
    console.log('[v0] API: Removing history item:', id)

    await sql`
      DELETE FROM public.generation_history WHERE id = ${id} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] API: Delete failed:', error)
    return apiError(500, 'internal_error', 'Failed to delete history item')
  }
}
