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
  prompt: promptSchema,
  aspectRatio: z.string().max(20).optional().nullable(),
  imageUrls: z.array(urlOrDataUriSchema).min(1).max(10),
})

const deleteQuerySchema = z.object({ id: numericIdSchema, userId: userIdSchema })

// GET /api/history?userId=xxx
export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
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
  const { prompt, aspectRatio, imageUrls } = parsed.data
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    console.log('[v0] API: POST history request received')
    console.log('[v0] API: userId:', userId)
    console.log('[v0] API: imageUrls count:', imageUrls.length)

    const sql = getSQL()
    const blobUrls: string[] = []

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i]
      try {
        console.log(`[v0] API: Fetching image ${i + 1}/${imageUrls.length}...`)
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        console.log(`[v0] API: Image ${i + 1} fetched, size:`, blob.size, 'bytes')

        const fileName = `history/${userId}-${Date.now()}-${i}.png`
        const uploadResult = await put(fileName, blob, {
          access: 'public',
          contentType: 'image/png'
        })

        blobUrls.push(uploadResult.url)
        console.log(`[v0] API: Image ${i + 1} uploaded to Blob:`, uploadResult.url)
      } catch (error) {
        console.error(`[v0] API: Blob upload failed for image ${i + 1}:`, error)
        return apiError(500, 'blob_upload_failed', `Failed to upload image ${i + 1}`)
      }
    }

    console.log('[v0] API: All images processed, inserting into Neon database...')

    // The neon driver serializes JS arrays to Postgres arrays — no
    // hand-built '{...}' literals.
    const result = await sql`
      INSERT INTO public.generation_history (
        user_id, prompt, aspect_ratio, image_urls, blob_urls
      )
      VALUES (
        ${userId}, ${prompt}, ${aspectRatio || null},
        ${blobUrls}, ${blobUrls}
      )
      RETURNING *
    `

    console.log('[v0] API: Saved to Neon with ID:', result[0].id)

    const historyItem = {
      id: result[0].id.toString(),
      prompt: result[0].prompt,
      aspectRatio: result[0].aspect_ratio,
      imageUrls: result[0].blob_urls || result[0].image_urls,
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
  const { id } = parsed.data
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
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
