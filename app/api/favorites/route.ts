import { neon } from '@neondatabase/serverless'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson, parseParams } from '@/lib/api/http'
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
})

const deleteQuerySchema = z.object({ id: numericIdSchema, userId: userIdSchema })

// GET /api/favorites?userId=xxx
export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsed.response) return parsed.response
  const { userId } = parsed.data

  try {
    const sql = getSQL()
    console.log('[v0] API: Loading favorites for user:', userId)

    const result = await sql`
      SELECT * FROM public.favorites
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    console.log('[v0] API: Loaded from Neon:', result.length)

    const favorites = result.map(fav => ({
      id: fav.id.toString(),
      url: fav.blob_url || fav.image_url,
      blobUrl: fav.blob_url,
      timestamp: new Date(fav.created_at).getTime(),
      metadata: {
        ratio: fav.aspect_ratio,
        style: fav.style_preset,
        dimensions: fav.dimensions,
        fileSize: fav.file_size,
        params: fav.parameters
      }
    }))

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('[v0] API: Load failed:', error)
    return apiError(500, 'internal_error', 'Failed to load favorites')
  }
}

// POST /api/favorites
export async function POST(request: NextRequest) {
  const parsed = await parseJson(request, postBodySchema)
  if (parsed.response) return parsed.response
  const { userId, imageUrl, metadata } = parsed.data

  try {
    const sql = getSQL()
    console.log('[v0] API: Adding favorite for user:', userId)

    // Upload to Blob Storage first
    const tempId = `temp-${Date.now()}`
    let blobUrl: string

    try {
      let imageBuffer: Buffer

      // Handle data URIs directly (from batch generation)
      if (imageUrl.startsWith('data:')) {
        const base64Match = imageUrl.match(/^data:image\/\w+;base64,(.+)$/)
        if (!base64Match) {
          throw new Error('Invalid data URI format')
        }
        imageBuffer = Buffer.from(base64Match[1], 'base64')
      } else {
        const response = await fetch(imageUrl)
        const arrayBuffer = await response.arrayBuffer()
        imageBuffer = Buffer.from(arrayBuffer)
      }

      const fileName = `favorites/${tempId}.png`
      const uploadResult = await put(fileName, imageBuffer, {
        access: 'public',
        contentType: 'image/png'
      })

      blobUrl = uploadResult.url
      console.log('[v0] API: Image uploaded to Blob:', blobUrl)
    } catch (error) {
      console.error('[v0] API: Blob upload failed:', error)
      return apiError(500, 'blob_upload_failed', 'Failed to upload image')
    }

    const result = await sql`
      INSERT INTO public.favorites (
        user_id, image_url, blob_url, prompt, aspect_ratio,
        style_preset, dimensions, file_size, parameters
      )
      VALUES (
        ${userId}, ${blobUrl}, ${blobUrl}, ${metadata?.params && typeof metadata.params === 'object' ? (metadata.params as { mainPrompt?: string }).mainPrompt || null : null},
        ${metadata?.ratio || null}, ${metadata?.style || null}, ${metadata?.dimensions || null},
        ${metadata?.fileSize || null}, ${JSON.stringify(metadata?.params || null)}
      )
      ON CONFLICT (user_id, image_url) DO NOTHING
      RETURNING *
    `

    if (result.length === 0) {
      console.log('[v0] API: Favorite already exists, fetching existing')
      const existing = await sql`
        SELECT * FROM public.favorites
        WHERE user_id = ${userId} AND image_url = ${blobUrl}
      `

      if (existing[0]) {
        const favorite = {
          id: existing[0].id.toString(),
          url: existing[0].blob_url || existing[0].image_url,
          blobUrl: existing[0].blob_url,
          timestamp: new Date(existing[0].created_at).getTime(),
          metadata
        }
        return NextResponse.json({ favorite })
      }
    }

    console.log('[v0] API: Saved to Neon with ID:', result[0].id)

    const favorite = {
      id: result[0].id.toString(),
      url: blobUrl,
      blobUrl: blobUrl,
      timestamp: new Date(result[0].created_at).getTime(),
      metadata
    }

    return NextResponse.json({ favorite })
  } catch (error) {
    console.error('[v0] API: Save failed with error:', error)
    return apiError(500, 'internal_error', 'Failed to save favorite')
  }
}

// DELETE /api/favorites?id=xxx&userId=xxx
export async function DELETE(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), deleteQuerySchema)
  if (parsed.response) return parsed.response
  const { id, userId } = parsed.data

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
