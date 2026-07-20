import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { numericIdSchema, urlOrDataUriSchema, userIdSchema } from '@/lib/validation/common'

/** Collection items: GET lists a collection's items, POST adds a batch, DELETE removes one. */

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error('No database connection string configured')
  return neon(url)
}

const getQuerySchema = z.object({ userId: userIdSchema, collectionId: numericIdSchema })
const postBodySchema = z.object({
  userId: userIdSchema,
  collectionId: z.number().int().positive(),
  items: z.array(z.object({
    itemType: z.enum(['image', 'video']).default('image'),
    itemUrl: urlOrDataUriSchema,
    prompt: z.string().max(8000).optional(),
  })).min(1).max(20),
})
const deleteQuerySchema = z.object({ userId: userIdSchema, id: numericIdSchema })

export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    const rows = await sql`
      SELECT id, item_type, item_url, prompt, created_at
      FROM public.collection_items
      WHERE user_id = ${userId} AND collection_id = ${parsed.data.collectionId}
      ORDER BY created_at DESC
      LIMIT 200
    `
    return NextResponse.json({
      items: rows.map((row) => ({
        id: row.id as number,
        itemType: row.item_type as string,
        itemUrl: row.item_url as string,
        prompt: (row.prompt as string | null) ?? null,
        createdAt: new Date(row.created_at as string).getTime(),
      })),
    })
  } catch (error) {
    console.error('[collection-items] GET failed:', error)
    return apiError(500, 'db_error', 'Could not load collection items')
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseJson(request, postBodySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    // Ownership check: the collection must belong to this user.
    const owner = await sql`
      SELECT id FROM public.collections WHERE id = ${parsed.data.collectionId} AND user_id = ${userId}
    `
    if (owner.length === 0) return apiError(404, 'not_found', 'Collection not found')

    for (const item of parsed.data.items) {
      await sql`
        INSERT INTO public.collection_items (collection_id, user_id, item_type, item_url, prompt)
        VALUES (${parsed.data.collectionId}, ${userId}, ${item.itemType}, ${item.itemUrl}, ${item.prompt ?? null})
        ON CONFLICT (collection_id, item_url) DO NOTHING
      `
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[collection-items] POST failed:', error)
    return apiError(500, 'db_error', 'Could not add to collection')
  }
}

export async function DELETE(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), deleteQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    await sql`DELETE FROM public.collection_items WHERE user_id = ${userId} AND id = ${parsed.data.id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[collection-items] DELETE failed:', error)
    return apiError(500, 'db_error', 'Could not remove item')
  }
}
