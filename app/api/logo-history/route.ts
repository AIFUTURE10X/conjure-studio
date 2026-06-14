import { neon } from '@neondatabase/serverless'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { numericIdSchema, promptSchema, urlOrDataUriSchema, userIdSchema } from '@/lib/validation/common'

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

const getQuerySchema = z.object({ userId: userIdSchema })

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

const deleteQuerySchema = z.object({ id: numericIdSchema, userId: userIdSchema })

// GET /api/logo-history?userId=xxx
export async function GET(request: NextRequest) {
  const parsedQuery = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsedQuery.response) return parsedQuery.response
  const userId = await resolveUserId(request, parsedQuery.data.userId)

  try {
    const sql = getSQL()
    console.log('[Logo History] Loading history for user:', userId)

    const result = await sql`
      SELECT * FROM public.logo_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `

    console.log('[Logo History] Loaded from Neon:', result.length)

    const history = result.map(item => ({
      id: item.id.toString(),
      imageUrl: item.blob_url || item.image_url,
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

    const sql = getSQL()
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
  const { id, isFavorited, rating } = parsedBody.data
  const userId = await resolveUserId(request, parsedBody.data.userId)

  try {
    const sql = getSQL()
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

// DELETE /api/logo-history?id=xxx&userId=xxx
export async function DELETE(request: NextRequest) {
  const parsedQuery = parseParams(Object.fromEntries(request.nextUrl.searchParams), deleteQuerySchema)
  if (parsedQuery.response) return parsedQuery.response
  const { id } = parsedQuery.data
  const userId = await resolveUserId(request, parsedQuery.data.userId)

  try {
    const sql = getSQL()
    console.log('[Logo History] Deleting item:', id)

    await sql`
      DELETE FROM public.logo_history WHERE id = ${id} AND user_id = ${userId}
    `

    console.log('[Logo History] Removed from Neon')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Logo History] Delete failed:', error)
    return apiError(500, 'internal_error', 'Failed to delete history item')
  }
}
