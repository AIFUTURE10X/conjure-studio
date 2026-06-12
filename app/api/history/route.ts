import { neon } from '@neondatabase/serverless'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

// GET /api/history?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

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
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
  }
}

// POST /api/history
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, prompt, aspectRatio, imageUrls } = body

    console.log('[v0] API: POST history request received')
    console.log('[v0] API: userId:', userId)
    console.log('[v0] API: prompt:', prompt)
    console.log('[v0] API: imageUrls count:', imageUrls?.length)

    if (!userId || !prompt || !imageUrls || imageUrls.length === 0) {
      return NextResponse.json({ error: 'User ID, prompt, and image URLs required' }, { status: 400 })
    }

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
        console.log(`[v0] API: Uploading image ${i + 1} to Blob as:`, fileName)
        const uploadResult = await put(fileName, blob, {
          access: 'public',
          contentType: 'image/png'
        })
        
        blobUrls.push(uploadResult.url)
        console.log(`[v0] API: Image ${i + 1} uploaded to Blob:`, uploadResult.url)
      } catch (error) {
        console.error(`[v0] API: Blob upload failed for image ${i + 1}:`, error)
        return NextResponse.json({ error: `Failed to upload image ${i + 1}` }, { status: 500 })
      }
    }

    console.log('[v0] API: All images processed, inserting into Neon database...')
    console.log('[v0] API: BlobUrls to save:', blobUrls)
    
    const imageUrlsArray = `{${blobUrls.map(url => `"${url.replace(/"/g, '\\"')}"`).join(',')}}`
    const blobUrlsArray = `{${blobUrls.map(url => `"${url.replace(/"/g, '\\"')}"`).join(',')}}`
    
    console.log('[v0] API: Array string format:', imageUrlsArray)
    
    const result = await sql`
      INSERT INTO public.generation_history (
        user_id, prompt, aspect_ratio, image_urls, blob_urls
      )
      VALUES (
        ${userId}, ${prompt}, ${aspectRatio || null}, 
        ${imageUrlsArray}::text[], ${blobUrlsArray}::text[]
      )
      RETURNING *
    `

    console.log('[v0] API: Insert result rows:', result.length)
    console.log('[v0] API: Saved to Neon with ID:', result[0].id)
    
    const historyItem = {
      id: result[0].id.toString(),
      prompt: result[0].prompt,
      aspectRatio: result[0].aspect_ratio,
      imageUrls: result[0].blob_urls || result[0].image_urls,
      timestamp: new Date(result[0].created_at).getTime()
    }

    console.log('[v0] API: Returning history item:', historyItem.id)
    return NextResponse.json({ historyItem })
  } catch (error) {
    console.error('[v0] API: History save failed with error:', error)
    console.error('[v0] API: Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ 
      error: 'Failed to save history', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// DELETE /api/history?id=xxx&userId=xxx
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
    console.log('[v0] API: Removing history item:', numId)

    await sql`
      DELETE FROM public.generation_history WHERE id = ${numId} AND user_id = ${userId}
    `

    console.log('[v0] API: Removed from Neon')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] API: Delete failed:', error)
    return NextResponse.json({ error: 'Failed to delete history item' }, { status: 500 })
  }
}
