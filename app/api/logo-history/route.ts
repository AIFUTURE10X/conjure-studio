import { neon } from '@neondatabase/serverless'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

// GET /api/logo-history?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

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
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
  }
}

// POST /api/logo-history
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, imageUrl, prompt, negativePrompt, presetId, seed, style, config, isFavorited, rating } = body

    console.log('[Logo History] POST request received')
    console.log('[Logo History] userId:', userId)
    console.log('[Logo History] prompt:', prompt?.substring(0, 50))

    if (!userId || !imageUrl || !prompt) {
      return NextResponse.json({ error: 'User ID, image URL, and prompt required' }, { status: 400 })
    }

    // Upload image to Vercel Blob for persistence
    let blobUrl = imageUrl
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
      console.error('[Logo History] Blob upload failed:', error)
      // If it's a data URL and upload failed, we can't save it (too large for database)
      if (imageUrl.startsWith('data:')) {
        return NextResponse.json({
          error: 'Failed to upload image to storage',
          details: error instanceof Error ? error.message : 'Image could not be persisted'
        }, { status: 500 })
      }
      // For regular URLs, continue with original URL as fallback
    }

    const sql = getSQL()
    console.log('[Logo History] Inserting into Neon database...')

    // Truncate original imageUrl for database (data URLs are huge, just store a reference)
    const truncatedImageUrl = imageUrl.startsWith('data:')
      ? imageUrl.substring(0, 50) + '...[base64]'
      : imageUrl

    // Store config as JSON string
    const configJson = config ? JSON.stringify(config) : null

    const result = await sql`
      INSERT INTO public.logo_history (
        user_id, image_url, blob_url, prompt, negative_prompt, preset_id, seed, style, config, is_favorited, rating
      )
      VALUES (
        ${userId}, ${truncatedImageUrl}, ${blobUrl}, ${prompt}, ${negativePrompt || null},
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
    return NextResponse.json({
      error: 'Failed to save history',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// PATCH /api/logo-history - Update favorite/rating
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, isFavorited, rating } = body

    if (!id || !userId) {
      return NextResponse.json({ error: 'ID and user ID required' }, { status: 400 })
    }

    const numId = Number.parseInt(id, 10)
    if (!Number.isInteger(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const sql = getSQL()
    console.log('[Logo History] Updating item:', numId, { isFavorited, rating })

    if (isFavorited !== undefined) {
      await sql`
        UPDATE public.logo_history
        SET is_favorited = ${isFavorited}
        WHERE id = ${numId} AND user_id = ${userId}
      `
    }

    if (rating !== undefined) {
      await sql`
        UPDATE public.logo_history
        SET rating = ${rating}
        WHERE id = ${numId} AND user_id = ${userId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Logo History] Update failed:', error)
    return NextResponse.json({ error: 'Failed to update history item' }, { status: 500 })
  }
}

// DELETE /api/logo-history?id=xxx&userId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    const userId = request.nextUrl.searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: 'ID and user ID required' }, { status: 400 })
    }

    const numId = Number.parseInt(id, 10)
    if (!Number.isInteger(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const sql = getSQL()
    console.log('[Logo History] Deleting item:', numId)

    await sql`
      DELETE FROM public.logo_history WHERE id = ${numId} AND user_id = ${userId}
    `

    console.log('[Logo History] Removed from Neon')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Logo History] Delete failed:', error)
    return NextResponse.json({ error: 'Failed to delete history item' }, { status: 500 })
  }
}
