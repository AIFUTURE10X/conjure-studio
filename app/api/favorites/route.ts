import { createHash } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { persistableSourceUrl } from '@/lib/favorites/identity'
import { numericIdSchema, urlOrDataUriSchema, userIdSchema } from '@/lib/validation/common'

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

const getQuerySchema = z.object({ userId: userIdSchema })

const postBodySchema = z.object({
  userId: userIdSchema,
  imageUrl: urlOrDataUriSchema,
  metadata: z.object({
    ratio: z.string().max(20).optional().nullable(),
    style: z.string().max(200).optional().nullable(),
    dimensions: z.string().max(50).optional().nullable(),
    fileSize: z.string().max(50).optional().nullable(),
    params: z.unknown().optional(),
  }).passthrough().optional().nullable(),
  restoreOnlyIfMissing: z.boolean().optional(),
})

const deleteQuerySchema = z.object({ id: numericIdSchema, userId: userIdSchema })

type FavoriteRow = Record<string, unknown>

/**
 * Shape returned to the client for a single favorite.
 *
 * @param clientSourceUrl the url the client sent on this request. Used only when
 *   the row has no stored source_url: `data:` URIs are never persisted (see
 *   persistableSourceUrl) yet the client still needs the match to fill the star
 *   the moment its click lands. GET passes nothing, so it never invents one.
 */
function toFavorite(row: FavoriteRow, clientSourceUrl?: string) {
  const storedSourceUrl = (row.source_url as string | null) ?? undefined
  return {
    id: String(row.id),
    url: (row.blob_url as string | null) || (row.image_url as string),
    blobUrl: (row.blob_url as string | null) ?? undefined,
    sourceUrl: storedSourceUrl ?? clientSourceUrl,
    contentHash: (row.content_hash as string | null) ?? undefined,
    prompt: (row.prompt as string | null) || undefined,
    timestamp: new Date(row.created_at as string).getTime(),
    metadata: {
      ratio: row.aspect_ratio as string | null,
      style: row.style_preset as string | null,
      dimensions: row.dimensions as string | null,
      fileSize: row.file_size as string | null,
      params: row.parameters,
    },
  }
}

/** Decoded bytes for the image being favorited; throws if they can't be read. */
async function readImageBytes(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith('data:')) {
    const base64Match = imageUrl.match(/^data:image\/\w+;base64,(.+)$/)
    if (!base64Match) throw new Error('Invalid data URI format')
    return Buffer.from(base64Match[1], 'base64')
  }
  const response = await fetch(imageUrl)
  // Unchecked, a 404 would hash the error body and mint a bogus dedupe key.
  if (!response.ok) throw new Error(`Source fetch returned ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

// GET /api/favorites?userId=xxx
export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    console.log('[v0] API: Loading favorites for user:', userId)

    // Explicit columns, never SELECT * — an unbounded select is how a future
    // wide column would silently start shipping megabytes per favorite.
    const result = await sql`
      SELECT id, image_url, blob_url, source_url, content_hash, prompt, created_at,
             aspect_ratio, style_preset, dimensions, file_size, parameters
      FROM public.favorites
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    console.log('[v0] API: Loaded from Neon:', result.length)

    return NextResponse.json({ favorites: result.map((row) => toFavorite(row)) })
  } catch (error) {
    console.error('[v0] API: Load failed:', error)
    return apiError(500, 'internal_error', 'Failed to load favorites')
  }
}

// POST /api/favorites
export async function POST(request: NextRequest) {
  const parsed = await parseJson(request, postBodySchema)
  if (parsed.response) return parsed.response
  const { imageUrl, metadata, restoreOnlyIfMissing } = parsed.data
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    console.log('[v0] API: Adding favorite for user:', userId)

    // Database-browser restores address an image by a url that already points at
    // durable public storage, so they resolve by url before anything is fetched
    // or copied. source_url joins the match now that rows carry one.
    if (restoreOnlyIfMissing) {
      const restored = await sql`
        SELECT id, image_url, blob_url, source_url, content_hash, prompt, created_at,
               aspect_ratio, style_preset, dimensions, file_size, parameters
        FROM public.favorites
        WHERE user_id = ${userId}
          AND (image_url = ${imageUrl} OR blob_url = ${imageUrl} OR source_url = ${imageUrl})
        ORDER BY created_at DESC
        LIMIT 1
      `
      if (restored[0]) {
        return NextResponse.json({ alreadyExists: true, favorite: toFavorite(restored[0], imageUrl) })
      }
    }

    // Read the image before touching Blob or the DB. The bytes are what identify
    // a favorite, so hashing them first is what lets a repeat click resolve to
    // the row that already exists instead of uploading a second copy of it.
    //
    // A restore is the one case where unreadable bytes are not fatal: its url is
    // already durable and gets registered without being copied, so it proceeds
    // with a null hash rather than failing the way a normal save does.
    let imageBuffer: Buffer | null = null
    try {
      imageBuffer = await readImageBytes(imageUrl)
    } catch (error) {
      console.error('[v0] API: Source image read failed:', error)
      if (!restoreOnlyIfMissing) return apiError(400, 'invalid_image', 'Could not read that image')
    }

    const contentHash = imageBuffer ? createHash('sha256').update(imageBuffer).digest('hex') : null
    const sourceUrl = persistableSourceUrl(imageUrl)

    if (contentHash) {
      const existing = await sql`
        SELECT id, image_url, blob_url, source_url, content_hash, prompt, created_at,
               aspect_ratio, style_preset, dimensions, file_size, parameters
        FROM public.favorites
        WHERE user_id = ${userId} AND content_hash = ${contentHash}
        LIMIT 1
      `

      if (existing[0]) {
        console.log('[v0] API: Favorite already saved, returning existing row:', existing[0].id)
        // Backfill once the client finally holds a stable http url for an image
        // it first favorited as a data: URI, so the star survives the reload.
        if (sourceUrl && !existing[0].source_url) {
          await sql`UPDATE public.favorites SET source_url = ${sourceUrl} WHERE id = ${existing[0].id}`
          existing[0].source_url = sourceUrl
        }
        return NextResponse.json({ alreadyExists: true, favorite: toFavorite(existing[0], imageUrl) })
      }
    }

    let blobUrl: string
    if (restoreOnlyIfMissing) {
      // Database-browser records already point at durable public storage.
      // Keep that exact URL so restoring does not copy the same image again.
      blobUrl = imageUrl
    } else {
      if (!imageBuffer || !contentHash) return apiError(400, 'invalid_image', 'Could not read that image')
      try {
        // Content-addressed path: the same image always lands on the same blob,
        // so a delete-then-refavorite cycle can never strand an orphan copy.
        const uploadResult = await put(`favorites/${contentHash}.png`, imageBuffer, {
          access: 'public',
          contentType: 'image/png',
          allowOverwrite: true,
        })
        blobUrl = uploadResult.url
        console.log('[v0] API: Image uploaded to Blob:', blobUrl)
      } catch (error) {
        console.error('[v0] API: Blob upload failed:', error)
        return apiError(500, 'blob_upload_failed', 'Failed to upload image')
      }
    }

    const prompt = metadata?.params && typeof metadata.params === 'object'
      ? (metadata.params as { mainPrompt?: string }).mainPrompt || null
      : null

    const inserted = await sql`
      INSERT INTO public.favorites (
        user_id, image_url, blob_url, source_url, content_hash, prompt,
        aspect_ratio, style_preset, dimensions, file_size, parameters
      )
      VALUES (
        ${userId}, ${blobUrl}, ${blobUrl}, ${sourceUrl}, ${contentHash}, ${prompt},
        ${metadata?.ratio || null}, ${metadata?.style || null}, ${metadata?.dimensions || null},
        ${metadata?.fileSize || null}, ${JSON.stringify(metadata?.params || null)}
      )
      ON CONFLICT (user_id, content_hash) WHERE content_hash IS NOT NULL DO NOTHING
      RETURNING id, image_url, blob_url, source_url, content_hash, prompt, created_at,
                aspect_ratio, style_preset, dimensions, file_size, parameters
    `

    if (inserted[0]) {
      console.log('[v0] API: Saved to Neon with ID:', inserted[0].id)
      return NextResponse.json({ alreadyExists: false, favorite: toFavorite(inserted[0], imageUrl) })
    }

    // Lost a race with a concurrent click on the same image — the row the other
    // request inserted is the answer.
    const raced = await sql`
      SELECT id, image_url, blob_url, source_url, content_hash, prompt, created_at,
             aspect_ratio, style_preset, dimensions, file_size, parameters
      FROM public.favorites
      WHERE user_id = ${userId} AND content_hash = ${contentHash}
      LIMIT 1
    `
    if (raced[0]) return NextResponse.json({ alreadyExists: true, favorite: toFavorite(raced[0], imageUrl) })

    return apiError(500, 'internal_error', 'Failed to save favorite')
  } catch (error) {
    console.error('[v0] API: Save failed with error:', error)
    return apiError(500, 'internal_error', 'Failed to save favorite')
  }
}

// DELETE /api/favorites?id=xxx&userId=xxx
export async function DELETE(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), deleteQuerySchema)
  if (parsed.response) return parsed.response
  const { id } = parsed.data
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    console.log('[v0] API: Removing favorite:', id)

    await sql`
      DELETE FROM public.favorites WHERE id = ${id} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] API: Delete failed:', error)
    return apiError(500, 'internal_error', 'Failed to delete favorite')
  }
}
